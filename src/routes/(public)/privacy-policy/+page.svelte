<script lang="ts">
	import { onMount } from 'svelte';

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>Privacy Policy - EarnMaze Panel</title>
	<meta name="description" content="EarnMaze Privacy Policy - How we protect your data and privacy" />
</svelte:head>

<div class="bg-surface">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
		<!-- Header -->
		<div class="mb-12">
			<h1 class="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
			<p class="text-neutral-500">Last updated: March 23, 2026</p>
		</div>

		<!-- Content -->
		<div class="prose prose-dark max-w-none">
			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">1. Introduction</h2>
				<p class="text-neutral-400 mb-4">
					EarnMaze ("Company," "we," "us," "our," or "our Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services, including our survey platform and rewards program.
				</p>
				<p class="text-neutral-400">
					Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Services. By accessing and using EarnMaze, you acknowledge that you have read, understood, and agree to be bound by all the provisions of this Privacy Policy.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
				<h3 class="text-xl font-semibold text-neutral-300 mb-3">2.1 Information You Provide Directly</h3>
				<ul class="list-disc list-inside space-y-2 text-neutral-400 mb-4">
					<li>Account registration information (name, email address, password)</li>
					<li>Profile information (age, gender, location, interests)</li>
					<li>Reward redemption preferences (gift card selections)</li>
					<li>Survey responses and feedback</li>
					<li>Communications with our support team</li>
					<li>Contact information and preferences</li>
				</ul>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">2.2 Information Collected Automatically</h3>
				<ul class="list-disc list-inside space-y-2 text-neutral-400">
					<li>Device information (device type, operating system, browser type)</li>
					<li>Log data (IP address, access times, pages viewed)</li>
					<li>Cookies and similar tracking technologies</li>
					<li>Geolocation data (with your consent)</li>
					<li>Usage analytics and interaction patterns</li>
				</ul>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
				<p class="text-neutral-400 mb-4">We use the information we collect for various purposes:</p>
				<ul class="list-disc list-inside space-y-2 text-neutral-400">
					<li>Providing, maintaining, and improving our Services</li>
					<li>Processing your participation in surveys and studies</li>
					<li>Managing your account and rewards</li>
					<li>Sending you service-related announcements and updates</li>
					<li>Responding to your inquiries and providing customer support</li>
					<li>Conducting research and analytics to improve user experience</li>
					<li>Detecting, preventing, and addressing fraud and security issues</li>
					<li>Complying with legal and regulatory requirements</li>
					<li>Personalizing content and recommendations</li>
				</ul>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">4. Data Sharing and Disclosure</h2>
				<p class="text-neutral-400 mb-4">We may share your information in the following circumstances:</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">4.1 Service Providers</h3>
				<p class="text-neutral-400 mb-4">
					We share information with third-party service providers who assist us in operating our website, conducting surveys, processing payments, and providing customer support. These service providers are contractually obligated to use your information only as necessary to provide services to us.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">4.2 Research Partners</h3>
				<p class="text-neutral-400 mb-4">
					We may share aggregated, anonymized survey data with research partners and clients for research and analysis purposes. This data cannot identify you individually.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">4.3 Legal Requirements</h3>
				<p class="text-neutral-400 mb-4">
					We may disclose your information when required by law or when we have a good faith belief that disclosure is necessary to protect our rights, your safety, or the safety of others.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">4.4 Business Transfers</h3>
				<p class="text-neutral-400">
					If EarnMaze is involved in a merger, acquisition, bankruptcy, or asset sale, your information may be transferred as part of that transaction. We will provide notice before your information becomes subject to a different privacy policy.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">5. Data Security</h2>
				<p class="text-neutral-400 mb-4">
					We implement appropriate technical, administrative, and physical security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is completely secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
				</p>
				<p class="text-neutral-400">
					We use industry-standard encryption (SSL/TLS) for data in transit and maintain secure databases for data at rest. Our team is trained on data protection and privacy practices.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">6. Your Rights and Choices</h2>
				<h3 class="text-xl font-semibold text-neutral-300 mb-3">6.1 Access and Correction</h3>
				<p class="text-neutral-400 mb-4">
					You have the right to access, review, and update your personal information. You can do this through your account settings or by contacting us at privacy@earnmaze.com.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">6.2 Data Deletion</h3>
				<p class="text-neutral-400 mb-4">
					You have the right to request deletion of your personal information, subject to certain exceptions (such as legal retention requirements). Please contact us to submit a deletion request.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">6.3 Opt-Out</h3>
				<p class="text-neutral-400 mb-4">
					You can opt-out of marketing communications by clicking the "unsubscribe" link in our emails or adjusting your preferences in your account settings. You cannot opt-out of service-related communications.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">6.4 Do Not Track</h3>
				<p class="text-neutral-400">
					Some browsers include a Do Not Track feature. Our current systems do not respond to Do Not Track browser signals, but you can adjust your privacy settings within your browser.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">7. Cookies and Tracking Technologies</h2>
				<p class="text-neutral-400 mb-4">
					We use cookies, web beacons, and similar tracking technologies to enhance your experience, remember your preferences, understand usage patterns, and deliver targeted content. You can control cookie settings through your browser preferences, though disabling cookies may limit your use of certain features.
				</p>
				<p class="text-neutral-400">
					We use both session-based and persistent cookies. Session cookies are deleted when you close your browser, while persistent cookies remain until they expire or are deleted.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">8. Third-Party Links</h2>
				<p class="text-neutral-400">
					Our Services may contain links to third-party websites and services that are not operated by EarnMaze. This Privacy Policy does not apply to third-party services, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party services before providing your information.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">9. International Data Transfers</h2>
				<p class="text-neutral-400">
					Your information may be transferred to, stored in, and processed in countries other than your country of residence. These countries may have data protection laws that differ from your home country. By using our Services, you consent to the transfer of your information to countries outside your country of residence, which may have different data protection rules.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">10. Data Retention</h2>
				<p class="text-neutral-400 mb-4">
					We retain your personal information for as long as your account is active or as needed to provide you our Services. Specifically:
				</p>
				<ul class="list-disc list-inside space-y-2 text-neutral-400 mb-4">
					<li><strong class="text-neutral-300">Account data:</strong> retained until you request deletion or your account is terminated</li>
					<li><strong class="text-neutral-300">Survey responses:</strong> retained in anonymized form for research purposes after account deletion</li>
					<li><strong class="text-neutral-300">Transaction records:</strong> retained for 7 years for tax and legal compliance</li>
					<li><strong class="text-neutral-300">Support tickets:</strong> retained for 2 years after resolution</li>
					<li><strong class="text-neutral-300">Session and log data:</strong> automatically deleted after 90 days</li>
				</ul>
				<p class="text-neutral-400">
					After account deletion, we will remove your personally identifiable information within 30 days, except where retention is required by law.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">11. Children's Privacy</h2>
				<p class="text-neutral-400">
					Our Services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that a child has provided us with personal information, we will delete such information and terminate the child's account. If you believe we have collected information from a child, please contact us immediately.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">12. Policy Changes</h2>
				<p class="text-neutral-400">
					We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, and other factors. We will notify you of material changes by updating the "Last updated" date and sending you an email notification. Your continued use of our Services after such modifications constitutes your acceptance of the updated Privacy Policy.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
				<p class="text-neutral-400 mb-4">
					If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
				</p>
				<div class="bg-surface-200 p-6 rounded-xl border border-white/[0.06]">
					<p class="text-neutral-300 font-semibold mb-2">EarnMaze Privacy Team</p>
					<p class="text-neutral-400">Email: privacy@earnmaze.com</p>
					<p class="text-neutral-400">Website: https://earnmaze.com</p>
					<p class="text-neutral-400">Response time: We aim to respond to all inquiries within 30 days</p>
				</div>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">14. Compliance</h2>
				<p class="text-neutral-400">
				EarnMaze complies with applicable privacy laws and data protection regulations. Users have the right to access, correct, or delete their personal information. For privacy-related requests or concerns, please contact our support team.
			</p>
		</section>
	</div>
	</div>
</div>

<style>
	.prose-dark {
		line-height: 1.8;
	}

	.prose-dark h2 {
		margin-top: 2rem;
		margin-bottom: 1rem;
	}

	.prose-dark h3 {
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
	}

	.prose-dark ul {
		margin: 1rem 0;
	}

	.prose-dark li {
		margin: 0.5rem 0;
	}

	.prose-dark p {
		margin-bottom: 1rem;
		line-height: 1.75;
	}
</style>
