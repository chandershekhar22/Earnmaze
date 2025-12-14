
import { createClient } from 'celery-plus';

// Use .env or fallback to correct dev vhost for host-based app
const CELERY_BROKER_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672/dev';
// IMPORTANT: celery-plus defaults backend to "amqp://" if omitted, which maps to vhost "/".
// In our RabbitMQ container we set the default vhost to "dev", so "/" does not exist.
const CELERY_BACKEND_URL = process.env.CELERY_BACKEND_URL || CELERY_BROKER_URL;

if (!CELERY_BROKER_URL.match(/\/[^/]+$/)) {
  // Warn if vhost is missing or double slash
  console.warn('[celery.ts] WARNING: RABBITMQ_URL does not specify a vhost. Example: amqp://guest:guest@localhost:5672/dev');
}

export const celery = createClient(CELERY_BROKER_URL, CELERY_BACKEND_URL);

/**
 * Fire-and-forget: publish a Celery task without waiting for the result.
 * Usage: await sendTask('tasks.send_mail', [arg1, arg2, ...])
 */
export async function sendTask(taskName: string, args: any[] = [], kwargs: object = {}) {
  const task = celery.createTask(taskName);
  // Do not call .get() on the result; just publish and return
  task.applyAsync(args, kwargs);
}
