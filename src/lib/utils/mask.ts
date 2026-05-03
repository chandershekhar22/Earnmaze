/**
 * Privacy helpers — partial obfuscation of identifying values for logs,
 * notifications, and any other surface where the full value isn't needed.
 *
 * `maskEmail('alice@example.com')`  → 'a***e@example.com'
 * `maskEmail('al@example.com')`     → 'a*@example.com'
 * `maskEmail('a@example.com')`      → 'a*@example.com'
 */

export function maskEmail(email: string | null | undefined): string {
	if (!email) return '';
	const at = email.lastIndexOf('@');
	if (at <= 0) return email; // not a valid-looking email; return as-is
	const local = email.slice(0, at);
	const domain = email.slice(at + 1);

	if (local.length <= 2) {
		return `${local[0]}*@${domain}`;
	}
	const stars = '*'.repeat(Math.min(local.length - 2, 4));
	return `${local[0]}${stars}${local[local.length - 1]}@${domain}`;
}
