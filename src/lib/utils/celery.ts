
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

// Only create client if URL is configured
const celery = CELERY_BROKER_URL ? createClient(CELERY_BROKER_URL, CELERY_BACKEND_URL) : null;

/**
 * Fire-and-forget: publish a Celery task without waiting for the result.
 * Usage: await sendTask('tasks.send_mail', [arg1, arg2, ...])
 */
export async function sendTask(taskName: string, args: any[] = [], kwargs: object = {}) {
  if (!celery) {
    Logger.root.warn({ context: 'celery', taskName }, 'Celery not configured, skipping task');
    return;
  }
  
  try {
    const task = celery.createTask(taskName);
    // Do not call .get() on the result; just publish and return
    task.applyAsync(args, kwargs);
  } catch (err) {
    Logger.root.error({ context: 'celery', taskName, error: err }, 'Failed to send task');
  }
}

export { celery };
