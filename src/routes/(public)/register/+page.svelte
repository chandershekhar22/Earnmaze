<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getDashboardUrl } from '$lib/utils/dashboard-routing';
	import { onMount } from 'svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let name = $state('');
	let isLoading = $state(false);
	let turnstileToken = $state<string | null>(null);
	let turnstileRef: any;
	
	let passwordMismatch = $derived(password !== confirmPassword && confirmPassword.length > 0);

	onMount(() => {
		authStore.clearError();

		if (authStore.state.user) {
			const targetUrl = getDashboardUrl(authStore.state.user.userType);
			goto(targetUrl);
		}
	});

	function handleFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		handleSubmit();
	}

	async function handleSubmit() {
		if (!email || !password || !confirmPassword || passwordMismatch) return;
		
		// Validate Turnstile token
		if (!turnstileToken) {
			authStore.state.error = 'Please complete the CAPTCHA verification';
			return;
		}

		isLoading = true;
		const result = await authStore.register({
			email,
			password,
			name: name || undefined,
			turnstileToken
		});
		isLoading = false;

		if (result.success && authStore.state.user) {
			const targetUrl = getDashboardUrl(authStore.state.user.userType);
			goto(targetUrl);
		} else {
			// Reset Turnstile on error
			turnstileRef?.reset();
			turnstileToken = null;
		}
	}
	
	function handleTurnstileVerify(token: string) {
		turnstileToken = token;
	}
	
	function handleTurnstileError() {
		turnstileToken = null;
	}
	
	function handleTurnstileExpire() {
		turnstileToken = null;
	}
</script>

<svelte:head>
	<title>Sign Up - EarnMaze Panel</title>
	<meta
		name="description"
		content="Create your EarnMaze account and start earning rewards by participating in surveys."
	/>
</svelte:head>

<div class="w-full max-w-lg space-y-8">
	<!-- Modern Header Section -->
	<div class="text-center space-y-4">
		<div class="relative">
			<div class="absolute inset-0 flex items-center justify-center">
				<div
					class="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-xl animate-pulse"
				></div>
			</div>
			<div
				class="relative w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl"
			>
				<span class="text-2xl text-white font-bold">EM</span>
			</div>
		</div>
		<h1
			class="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent"
		>
			Create your account
		</h1>
		<p class="text-lg text-gray-600 leading-relaxed">
			Join EarnMaze and start earning rewards through surveys
		</p>
	</div>

	<!-- Ultra-Modern Form Card -->
	<div class="relative">
		<!-- Background Effects -->
		<div
			class="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl"
		></div>
		<div
			class="absolute inset-0 bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl"
		></div>

		<div class="relative p-8 space-y-6">
			<form onsubmit={handleFormSubmit} class="space-y-6">
				{#if authStore.state.error}
					<div
						class="relative overflow-hidden bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 px-6 py-4 rounded-2xl shadow-lg"
					>
						<div class="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5"></div>
						<div class="relative flex items-center">
							<div
								class="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
							>
								<span class="text-white text-xs">!</span>
							</div>
							<span class="font-medium">{authStore.state.error}</span>
						</div>
					</div>
				{/if}

				<!-- Email Field -->
				<div class="space-y-2">
					<label for="email" class="block text-sm font-semibold text-gray-700 tracking-wide"
						>Email address</label
					>
					<div class="relative group">
						<div
							class="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"
						></div>
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							class="relative w-full px-4 py-4 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500"
							placeholder="Enter your email address"
						/>
						<div class="absolute inset-y-0 right-0 flex items-center pr-4">
							<div class="w-2 h-2 bg-blue-400 rounded-full opacity-50"></div>
						</div>
					</div>
				</div>

				<!-- Name Field -->
				<div class="space-y-2">
					<label for="name" class="block text-sm font-semibold text-gray-700 tracking-wide"
						>Full name <span class="text-gray-400 font-normal">(optional)</span></label
					>
					<div class="relative group">
						<div
							class="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"
						></div>
						<input
							id="name"
							type="text"
							bind:value={name}
							class="relative w-full px-4 py-4 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500"
							placeholder="Enter your full name"
						/>
						<div class="absolute inset-y-0 right-0 flex items-center pr-4">
							<div class="w-2 h-2 bg-emerald-400 rounded-full opacity-50"></div>
						</div>
					</div>
				</div>

				<!-- Password Field -->
				<div class="space-y-2">
					<label for="password" class="block text-sm font-semibold text-gray-700 tracking-wide"
						>Password</label
					>
					<div class="relative group">
						<div
							class="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"
						></div>
						<input
							id="password"
							type="password"
							bind:value={password}
							required
							class="relative w-full px-4 py-4 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500"
							placeholder="Create a strong password"
						/>
						<div class="absolute inset-y-0 right-0 flex items-center pr-4">
							<div class="w-2 h-2 bg-indigo-400 rounded-full opacity-50"></div>
						</div>
					</div>
				</div>

				<!-- Confirm Password Field -->
				<div class="space-y-2">
					<label
						for="confirmPassword"
						class="block text-sm font-semibold text-gray-700 tracking-wide">Confirm password</label
					>
					<div class="relative group">
						<div
							class="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"
						></div>
						<input
							id="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							required
							class="relative w-full px-4 py-4 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 {passwordMismatch
								? 'border-red-300 focus:ring-red-500/50'
								: ''}"
							placeholder="Confirm your password"
						/>
						<div class="absolute inset-y-0 right-0 flex items-center pr-4">
							<div
								class="w-2 h-2 {passwordMismatch
									? 'bg-red-400'
									: 'bg-rose-400'} rounded-full opacity-50"
							></div>
						</div>
					</div>
					{#if passwordMismatch}
						<div
							class="relative overflow-hidden bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl px-4 py-2 shadow-sm"
						>
							<div class="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5"></div>
							<p class="relative text-xs text-red-600 font-medium">⚠️ Passwords do not match</p>
						</div>
					{/if}
				</div>

				<!-- Terms and Conditions -->
				<div
					class="relative overflow-hidden bg-gray-50/80 backdrop-blur-sm border border-gray-100/50 rounded-2xl p-4 shadow-lg"
				>
					<div class="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-slate-500/5"></div>
					<div class="relative flex items-start">
						<div class="flex items-center h-5">
							<input
								id="terms"
								type="checkbox"
								required
								class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
							/>
						</div>
						<div class="ml-3 text-sm">
							<label for="terms" class="text-gray-700 leading-relaxed">
								I agree to the
								<a
									href="/terms"
									class="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200"
									>Terms of Service</a
								>
								and
								<a
									href="/privacy"
									class="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200"
									>Privacy Policy</a
								>
							</label>
						</div>
					</div>
				</div>

				<!-- Cloudflare Turnstile -->
				<div class="flex justify-center py-4">
					<Turnstile
						bind:this={turnstileRef}
						onVerify={handleTurnstileVerify}
						onError={handleTurnstileError}
						onExpire={handleTurnstileExpire}
						theme="auto"
						size="normal"
					/>
				</div>

				<!-- Submit Button -->
				<div class="pt-2">
					<button
						type="submit"
						disabled={isLoading || !email || !password || !confirmPassword || passwordMismatch || !turnstileToken}
						class="group relative w-full overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 transform hover:scale-[1.02] hover:shadow-3xl"
					>
						<div
							class="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
						></div>
						<div class="relative flex items-center justify-center">
							{#if isLoading}
								<svg
									class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Creating account...
							{:else}
								<span class="flex items-center">
									<span class="mr-2">🚀</span>
									Create account
								</span>
							{/if}
						</div>
					</button>
				</div>
			</form>

			<!-- Sign In Link -->
			<div class="relative text-center pt-6">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-200/50"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="px-4 bg-white/80 text-gray-500">Already have an account?</span>
				</div>
				<div class="mt-4">
					<a
						href="/login"
						class="group inline-flex items-center font-semibold text-blue-600 hover:text-blue-500 transition-all duration-200"
					>
						<span class="group-hover:translate-x-1 transition-transform duration-200"
							>Sign in here</span
						>
						<span class="ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
