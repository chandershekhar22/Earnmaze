/**
 * Thin wrapper for dispatching Telegram messages to the worker via Celery.
 *
 * Two logical channels:
 *   - 'critical'  → errors, outages, task failures
 *   - 'update'    → signups, survey events, digests, info
 *
 * The actual HTTP send happens in em-worker (notifier.py); we just push a
 * Celery task onto RabbitMQ. Alerts are async and best-effort: if RabbitMQ
 * is down they're dropped, but app errors still surface via Loki/Grafana.
 *
 * Usage:
 *   await notifyUpdate(`New signup: ${user.email}`);
 *   await notifyError('payment-webhook', err);
 *   await notifyTelegram('Daily digest...', 'update');
 */
import { sendTask } from './celery';

type Channel = 'critical' | 'update';

export async function notifyTelegram(
	message: string,
	channel: Channel = 'critical'
): Promise<void> {
	await sendTask('notify.telegram', [message, channel]);
}

/** Send an informational update to the updates channel. */
export async function notifyUpdate(message: string): Promise<void> {
	await notifyTelegram(message, 'update');
}

/**
 * Alert about an unhandled error with structured context.
 * Truncates long stack traces to fit Telegram's 4096-byte body.
 */
export async function notifyError(
	context: string,
	error: unknown,
	extra: Record<string, string> = {}
): Promise<void> {
	const message = String(
		error instanceof Error ? `${error.name}: ${error.message}` : error
	).slice(0, 500);
	const stack =
		error instanceof Error && error.stack ? error.stack.slice(0, 2000) : '';
	const extraLines = Object.entries(extra)
		.map(([k, v]) => `${k}: <code>${escapeHtml(String(v).slice(0, 200))}</code>`)
		.join('\n');

	const body =
		`🚨 <b>em-panel</b> error\n` +
		`Context: <code>${escapeHtml(context)}</code>\n` +
		`Error: <code>${escapeHtml(message)}</code>\n` +
		(extraLines ? `${extraLines}\n` : '') +
		(stack ? `\n<pre>${escapeHtml(stack)}</pre>` : '');

	await notifyTelegram(body, 'critical');
}

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
