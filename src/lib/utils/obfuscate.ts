/**
 * Obfuscate sensitive data for API responses.
 * Only the data owner or admins should see full details.
 */

/**
 * Obfuscate email: "john.doe@gmail.com" → "j****e@g***l.com"
 */
export function obfuscateEmail(email: string | null | undefined): string {
	if (!email) return '';
	const [local, domain] = email.split('@');
	if (!local || !domain) return '***@***.***';
	const maskedLocal = local.length <= 2
		? local[0] + '***'
		: local[0] + '***' + local[local.length - 1];
	const domainParts = domain.split('.');
	const maskedDomain = domainParts.map((part, i) => {
		if (i === domainParts.length - 1) return part; // keep TLD
		return part.length <= 2 ? part[0] + '***' : part[0] + '***' + part[part.length - 1];
	}).join('.');
	return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Obfuscate name: "John Doe" → "J*** D***"
 */
export function obfuscateName(name: string | null | undefined): string {
	if (!name) return '';
	return name.split(' ').map(part => {
		if (part.length <= 1) return part + '***';
		return part[0] + '***';
	}).join(' ');
}

/**
 * Obfuscate UUID: "1ffc90cb-7219-42f9-..." → "1ffc****"
 */
export function obfuscateId(id: string | null | undefined): string {
	if (!id) return '';
	return id.slice(0, 4) + '****';
}
