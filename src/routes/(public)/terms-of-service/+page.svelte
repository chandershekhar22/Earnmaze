<script lang="ts">
	import { onMount } from 'svelte';
	import { localizeHref } from '$lib/paraglide/runtime';

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>Terms of Service - EarnMaze Panel</title>
	<meta name="description" content="EarnMaze Terms of Service - Our legal terms and conditions" />
</svelte:head>

<div class="bg-surface">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
		<!-- Header -->
		<div class="mb-12">
			<h1 class="text-4xl font-bold text-white mb-4">Terms of Service</h1>
			<p class="text-neutral-500">Last updated: March 23, 2026</p>
		</div>

		<!-- Content -->
		<div class="prose prose-dark max-w-none">
			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
				<p class="text-neutral-400 mb-4">
					These Terms of Service ("Terms") constitute a legal agreement between you and EarnMaze ("Company," "we," "us," or "our"). By accessing and using our website, mobile applications, and services (collectively, the "Services"), you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use our Services.
				</p>
				<p class="text-neutral-400">
					We reserve the right to modify these Terms at any time. Your continued use of the Services after any modifications indicates your acceptance of the updated Terms. It is your responsibility to review these Terms periodically for changes.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">2. Eligibility</h2>
				<p class="text-neutral-400 mb-4">
					To use our Services, you must:
				</p>
				<ul class="list-disc list-inside space-y-2 text-neutral-400 mb-4">
					<li>Be at least 18 years old</li>
					<li>Have the legal capacity to enter into a binding agreement</li>
					<li>Reside in a country where our Services are available</li>
					<li>Not be prohibited from using our Services under applicable law</li>
					<li>Not be on any government or sanctions list</li>
				</ul>
				<p class="text-neutral-400">
					If you do not meet these eligibility requirements, you may not create an account or use our Services.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">3. Account Registration and Responsibilities</h2>
				<h3 class="text-xl font-semibold text-neutral-300 mb-3">3.1 Account Creation</h3>
				<p class="text-neutral-400 mb-4">
					To access certain features of our Services, you must create an account. You agree to provide accurate, complete, and current information and to maintain the accuracy of your information.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">3.2 Account Security</h3>
				<p class="text-neutral-400 mb-4">
					You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. We are not liable for any loss or damage resulting from your failure to keep your password secure.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">3.3 Account Termination</h3>
				<p class="text-neutral-400">
					We reserve the right to suspend or terminate your account at any time for violation of these Terms or any other reason. Upon termination, your right to use the Services immediately ceases.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">4. Services Description</h2>
				<p class="text-neutral-400 mb-4">
					EarnMaze provides an online platform that connects users ("Panelists") with research studies, surveys, and tasks. In exchange for participation, panelists earn points that can be redeemed for rewards.
				</p>
				<p class="text-neutral-400">
					We do not guarantee the availability, frequency, or quantity of surveys and tasks. The number and nature of surveys available may vary based on demographics, location, and other factors.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">5. User Conduct</h2>
				<p class="text-neutral-400 mb-4">
					You agree not to engage in any of the following conduct:
				</p>
				<ul class="list-disc list-inside space-y-2 text-neutral-400">
					<li>Providing false, misleading, or incomplete information</li>
					<li>Violating any applicable laws or regulations</li>
					<li>Harassing, threatening, or intimidating other users or staff</li>
					<li>Attempting to gain unauthorized access to our systems</li>
					<li>Reverse engineering, decompiling, or disassembling our Services</li>
					<li>Using automated tools (bots, scrapers) without permission</li>
					<li>Selling, trading, or transferring your account</li>
					<li>Engaging in fraud or dishonest conduct</li>
					<li>Manipulating surveys or cheating to earn points</li>
					<li>Using VPN or proxy services to circumvent restrictions</li>
					<li>Violating others' intellectual property rights</li>
					<li>Creating multiple accounts to circumvent limitations</li>
				</ul>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">6. Survey Participation</h2>
				<h3 class="text-xl font-semibold text-neutral-300 mb-3">6.1 Participation Expectations</h3>
				<p class="text-neutral-400 mb-4">
					When you participate in surveys, you agree to:
				</p>
				<ul class="list-disc list-inside space-y-2 text-neutral-400 mb-4">
					<li>Provide honest, accurate responses</li>
					<li>Complete surveys in good faith</li>
					<li>Follow all survey instructions</li>
					<li>Not share survey content with others</li>
					<li>Respect intellectual property rights of survey creators</li>
				</ul>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">6.2 Survey Disqualification</h3>
				<p class="text-neutral-400 mb-4">
					You may be disqualified from a survey based on your responses. Disqualification does not result in penalty and you will not earn points for that survey. You will not be charged for disqualification.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">6.3 Survey Quality Control</h3>
				<p class="text-neutral-400">
					We reserve the right to reject survey responses that appear to be fraudulent, dishonest, or fail quality checks. Points earned from fraudulent responses may be revoked.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">7. Rewards and Points</h2>
				<h3 class="text-xl font-semibold text-neutral-300 mb-3">7.1 Point Earning</h3>
				<p class="text-neutral-400 mb-4">
					Points are earned for completing surveys and tasks as specified. The number of points varies based on the survey length and complexity.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">7.2 Point Value</h3>
				<p class="text-neutral-400 mb-4">
					Points have no monetary value outside of redemption through our platform. Points cannot be transferred or sold. EarnMaze determines the redemption value and conversion rates for rewards.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">7.3 Point Expiration</h3>
				<p class="text-neutral-400 mb-4">
					Points are valid for one year from the date earned. Points not redeemed within this period will expire and be forfeited. We may extend the expiration period at our discretion.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">7.4 Rewards Redemption</h3>
				<p class="text-neutral-400 mb-4">
					Points may be redeemed for gift cards from participating brands. Redemption requests are submitted through our platform and reviewed by our team. Requests are typically processed within 24-48 hours but may take up to 5 business days. We reserve the right to add, remove, or modify available rewards at any time.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">7.5 Redemption Request Process</h3>
				<p class="text-neutral-400 mb-4">
					When you submit a redemption request, your points are deducted immediately. If a request is cancelled or fails, the deducted points will be refunded to your account. You can track the status of your redemption requests through the Rewards page.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">7.6 Point Adjustment</h3>
				<p class="text-neutral-400">
					We reserve the right to adjust, reduce, or revoke points if we determine that they were earned through fraudulent means, cheating, or violation of these Terms. We will notify you of any point adjustments.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">8. Intellectual Property Rights</h2>
				<p class="text-neutral-400 mb-4">
					All content, features, and functionality of our Services, including but not limited to text, graphics, logos, and software, are owned by EarnMaze or its licensors and are protected by copyright and other intellectual property laws.
				</p>
				<p class="text-neutral-400 mb-4">
					You are granted a limited, non-exclusive, non-transferable license to access and use our Services for personal, non-commercial purposes. You may not reproduce, modify, distribute, or transmit any content without our prior written consent.
				</p>
				<p class="text-neutral-400">
					Your survey responses, feedback, and other user-generated content may be used by EarnMaze and its clients for research, analysis, and reporting purposes. You retain ownership of your data but grant us a license to use it as described in our Privacy Policy.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">9. Support and Dispute Resolution via Tickets</h2>
				<p class="text-neutral-400 mb-4">
					If you encounter any issues with surveys, points, or redemptions, you may submit a support ticket through the Support page. When creating a ticket, you can reference specific surveys or transactions for faster resolution.
				</p>
				<p class="text-neutral-400 mb-4">
					Our support team reviews tickets and may credit bonus or adjustment points as a resolution. All point adjustments made via support tickets are tracked and visible in your transaction history.
				</p>
				<p class="text-neutral-400">
					We aim to respond to all support tickets within 24 hours. Complex issues may take longer to resolve.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">10. Referral Program</h2>
				<p class="text-neutral-400 mb-4">
					EarnMaze may offer a referral program that allows you to invite others to join. Referral bonuses are credited when the referred user meets the qualifying criteria. The referral program terms, bonus amounts, and qualifying criteria are subject to change at our discretion.
				</p>
				<p class="text-neutral-400">
					Abuse of the referral program (including self-referrals, fake accounts, or incentivized signups) may result in forfeiture of referral bonuses and account suspension.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">11. Disclaimers</h2>
				<h3 class="text-xl font-semibold text-neutral-300 mb-3">9.1 "As-Is" Provision</h3>
				<p class="text-neutral-400 mb-4">
					Our Services are provided on an "as-is" and "as-available" basis. We make no warranties, express or implied, regarding the Services. We do not warrant that the Services will be uninterrupted, timely, or error-free.
				</p>

				<h3 class="text-xl font-semibold text-neutral-300 mb-3">9.2 Disclaimer of Warranties</h3>
				<p class="text-neutral-400">
					To the fullest extent permitted by law, EarnMaze disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant the accuracy, completeness, or usefulness of any information on our Services.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">12. Limitation of Liability</h2>
				<p class="text-neutral-400 mb-4">
					To the fullest extent permitted by law, EarnMaze shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising out of or related to your use of or inability to use the Services, even if we have been advised of the possibility of such damages.
				</p>
				<p class="text-neutral-400">
					In no event shall our total liability exceed the amount you have paid to EarnMaze in the 12 months preceding the claim or $100, whichever is less.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">13. Indemnification</h2>
				<p class="text-neutral-400">
					You agree to indemnify, defend, and hold harmless EarnMaze and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising out of or related to your use of the Services, your violation of these Terms, or your violation of any applicable law.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">14. Termination</h2>
				<p class="text-neutral-400 mb-4">
					EarnMaze may terminate your access to the Services at any time, with or without cause, and with or without notice. Upon termination, all rights granted to you are immediately revoked.
				</p>
				<p class="text-neutral-400">
					You may request account deletion by contacting us at support@earnmaze.com. We will delete your account within 30 days, subject to any legal retention requirements.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">15. Governing Law</h2>
				<p class="text-neutral-400">
					These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which EarnMaze is incorporated, without regard to its conflict of law provisions. You agree to submit to the exclusive jurisdiction of the courts located in that jurisdiction.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">16. Dispute Resolution</h2>
				<p class="text-neutral-400 mb-4">
					Before pursuing legal action, we encourage you to contact us to resolve any disputes. Any dispute arising out of or relating to these Terms shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
				</p>
				<p class="text-neutral-400">
					You agree to waive your right to a jury trial and your right to participate in a class action lawsuit. Arbitration shall be conducted by a single neutral arbitrator.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">17. Severability</h2>
				<p class="text-neutral-400">
					If any provision of these Terms is found to be invalid or unenforceable, that provision shall be modified to the minimum extent necessary to make it valid and enforceable, or if such modification is not possible, that provision shall be severed. The remaining provisions shall continue in full force and effect.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">18. Entire Agreement</h2>
				<p class="text-neutral-400">
					These Terms, along with our Privacy Policy and any other policies or guidelines referenced herein, constitute the entire agreement between you and EarnMaze regarding your use of the Services and supersede all prior negotiations, representations, and agreements.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="text-2xl font-bold text-white mb-4">19. Contact Us</h2>
				<p class="text-neutral-400 mb-4">
					If you have questions, concerns, or requests regarding these Terms of Service, please contact us at:
				</p>
				<div class="bg-surface-200 p-6 rounded-xl border border-white/[0.06]">
					<p class="text-neutral-300 font-semibold mb-2">EarnMaze Legal Team</p>
					<p class="text-neutral-400">Email: legal@earnmaze.com</p>
					<p class="text-neutral-400">Website: https://earnmaze.com</p>
					<p class="text-neutral-400">Response time: We aim to respond to all inquiries within 10 business days</p>
				</div>
			</section>
		</div>

		<!-- Footer Navigation -->
		<div class="mt-16 pt-8 border-t border-white/[0.06] flex justify-between items-center">
			<a href="/" class="link">← Back to Home</a>
			<a href={localizeHref('/privacy-policy')} class="link">Privacy Policy →</a>
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
