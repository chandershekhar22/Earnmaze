
import { createClient } from 'celery-plus';
import { Logger } from '$lib/utils/app-logger';

// Use .env - no localhost fallback to avoid connection errors in containerized environments
const CELERY_BROKER_URL = process.env.RABBITMQ_URL || '';
const CELERY_BACKEND_URL = process.env.CELERY_BACKEND_URL || CELERY_BROKER_URL;

if (!CELERY_BROKER_URL) {
  Logger.root.warn({ context: 'celery' }, 'RABBITMQ_URL not set. Celery tasks will be disabled');
}

if (CELERY_BROKER_URL && !CELERY_BROKER_URL.match(/\/[^/]+$/)) {
  Logger.root.warn({ context: 'celery' }, 'RABBITMQ_URL does not specify a vhost');
}

// ---------------------------------------------------------------------------
// Resilient client wrapper
// ---------------------------------------------------------------------------
// celery-plus eagerly connects in the constructor and has no reconnect logic.
// If the AMQP connection drops the stored channel promise rejects permanently
// and ALL subsequent publishes silently fail.
//
// This wrapper recreates the client when a publish fails with a connection /
// channel error, so the SvelteKit server self-heals after RabbitMQ restarts.
// ---------------------------------------------------------------------------

let celery = CELERY_BROKER_URL ? createClient(CELERY_BROKER_URL, CELERY_BACKEND_URL) : null;
let clientCreatedAt = Date.now();

const MIN_RECONNECT_INTERVAL_MS = 5_000; // Don't recreate more often than every 5s

function recreateClient(): void {
  const now = Date.now();
  if (now - clientCreatedAt < MIN_RECONNECT_INTERVAL_MS) {
    return; // Avoid reconnect storm
  }
  try {
    // Best-effort disconnect of the broken client
    celery?.disconnect().catch(() => {});
  } catch {
    // ignore
  }
  try {
    celery = createClient(CELERY_BROKER_URL, CELERY_BACKEND_URL);
    clientCreatedAt = now;
    Logger.root.info({ context: 'celery' }, 'Celery client reconnected');
  } catch (err) {
    Logger.root.error({ context: 'celery', error: err }, 'Failed to recreate Celery client');
    celery = null;
  }
}

function isConnectionError(err: unknown): boolean {
  if (!err) return false;
  const msg = String(err).toLowerCase();
  return (
    msg.includes('channel') ||
    msg.includes('connection') ||
    msg.includes('closed') ||
    msg.includes('socket') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('heartbeat')
  );
}

/**
 * Fire-and-forget: publish a Celery task without waiting for the result.
 * Automatically recreates the AMQP client on connection errors.
 *
 * Usage: await sendTask('tasks.send_mail', [arg1, arg2, ...])
 */
export async function sendTask(taskName: string, args: any[] = [], kwargs: object = {}) {
  if (!celery) {
    // If client was previously nulled out by a failed reconnect, try again
    if (CELERY_BROKER_URL) {
      recreateClient();
    }
    if (!celery) {
      Logger.root.warn({ context: 'celery', taskName }, 'Celery not configured, skipping task');
      return;
    }
  }

  try {
    const task = celery.createTask(taskName);
    // Await the publish so we can detect connection errors
    await task.applyAsync(args, kwargs);
  } catch (err) {
    Logger.root.error({ context: 'celery', taskName, error: err }, 'Failed to send task');

    if (isConnectionError(err)) {
      Logger.root.warn({ context: 'celery' }, 'Connection error detected, scheduling reconnect');
      recreateClient();

      // One retry on the fresh client
      if (celery) {
        try {
          const task = celery.createTask(taskName);
          await task.applyAsync(args, kwargs);
          Logger.root.info({ context: 'celery', taskName }, 'Task sent after reconnect');
        } catch (retryErr) {
          Logger.root.error(
            { context: 'celery', taskName, error: retryErr },
            'Retry after reconnect also failed'
          );
        }
      }
    }
  }
}

export { celery };
