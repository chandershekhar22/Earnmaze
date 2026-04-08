/**
 * Shared formatting utilities used across the app
 */

export function formatDate(dateString: string | Date | null): string {
	if (!dateString) return '--';
	const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatShortDate(dateString: string | Date | null): string {
	if (!dateString) return '--';
	const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function relativeTime(dateString: string | Date): string {
	const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
	const ms = Date.now() - date.getTime();
	const min = Math.floor(ms / 60000);
	if (min < 1) return 'just now';
	if (min < 60) return `${min}m ago`;
	const h = Math.floor(min / 60);
	if (h < 24) return `${h}h ago`;
	const d = Math.floor(h / 24);
	if (d === 1) return 'yesterday';
	if (d < 7) return `${d}d ago`;
	return formatShortDate(date);
}

export function formatPoints(points: number): string {
	return points.toLocaleString();
}

export function formatDuration(startDate: string, endDate: string | null): string {
	if (!endDate) return '--';
	const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
	const min = Math.floor(ms / 60000);
	if (min < 1) return '<1m';
	return `${min}m`;
}
