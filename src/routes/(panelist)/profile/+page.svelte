<script lang="ts">
	import { onMount } from 'svelte';
	import { Logger } from '$lib/utils/app-logger';

	let profile = $state({
		name: '',
		email: '',
		demographics: {
			age: '',
			gender: '',
			country: '',
			education: '',
			employment: '',
			income: ''
		},
		preferences: {
			emailNotifications: true,
			smsNotifications: false,
			surveyCategories: []
		} as {
			emailNotifications: boolean;
			smsNotifications: boolean;
			surveyCategories: string[];
		}
	});
	let loading = $state(true);
	let saving = $state(false);
	let message = $state('');

	const surveyCategories = [
		'Consumer Products',
		'Technology',
		'Healthcare',
		'Finance',
		'Education',
		'Travel',
		'Food & Dining',
		'Entertainment',
		'Politics',
		'Sports'
	];

	onMount(async () => {
		try {
			const response = await fetch('/api/panelist/profile');
			if (response.ok) {
				const data = await response.json();
				profile = { ...profile, ...data };
			}
		} catch (error) {
			Logger.root.error({ context: 'errors', error }, 'Failed to fetch profile');
		} finally {
			loading = false;
		}
	});

	async function saveProfile() {
		saving = true;
		message = '';

		try {
			const response = await fetch('/api/respondent/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(profile)
			});

			if (response.ok) {
				message = 'Profile updated successfully!';
				setTimeout(() => message = '', 3000);
			} else {
				message = 'Failed to update profile. Please try again.';
			}
		} catch (error) {
			Logger.root.error({ context: 'errors', error }, 'Failed to save profile');
			message = 'Failed to update profile. Please try again.';
		} finally {
			saving = false;
		}
	}

	function toggleCategory(category: string) {
		if (profile.preferences.surveyCategories.includes(category)) {
			profile.preferences.surveyCategories = profile.preferences.surveyCategories.filter(c => c !== category);
		} else {
			profile.preferences.surveyCategories = [...profile.preferences.surveyCategories, category];
		}
	}
</script>

<svelte:head>
	<title>My Profile - EarnMaze Panel</title>
	<meta name="description" content="Manage your profile and preferences on EarnMaze." />
</svelte:head>

<div class="space-y-6 animate-fade-in">
	<!-- Page Header -->
	<div class="flex items-center gap-4">
		<div class="avatar-lg">
			{profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
		</div>
		<div>
			<h1 class="text-2xl font-bold text-neutral-900">My Profile</h1>
			<p class="text-neutral-500">Manage your account and survey preferences</p>
		</div>
	</div>

	{#if message}
		<div class="card !py-3 !px-4 animate-scale-in {message.includes('successfully') ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}">
			<div class="flex items-center gap-3">
				{#if message.includes('successfully')}
					<div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
						<svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
				{:else}
					<div class="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
						<svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
				{/if}
				<p class="{message.includes('successfully') ? 'text-emerald-700' : 'text-rose-700'} text-sm font-medium">{message}</p>
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="card text-center py-16">
			<div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
				<svg class="w-6 h-6 text-primary-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			</div>
			<p class="text-neutral-500">Loading profile...</p>
		</div>
	{:else}
		<form onsubmit={(e) => { e.preventDefault(); saveProfile(); }} class="space-y-6">
			<!-- Basic Information -->
			<div class="card animate-slide-up" style="animation-delay: 0ms">
				<div class="flex items-center gap-3 mb-6">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					</div>
					<div>
						<h2 class="text-lg font-semibold text-neutral-900">Basic Information</h2>
						<p class="text-sm text-neutral-500">Your personal details</p>
					</div>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="name" class="label">Full Name</label>
						<input 
							type="text" 
							id="name" 
							bind:value={profile.name}
							class="input"
							required
						/>
					</div>
					<div>
						<label for="email" class="label">Email Address</label>
						<input 
							type="email" 
							id="email" 
							bind:value={profile.email}
							class="input bg-neutral-100 cursor-not-allowed"
							required
							disabled
						/>
						<p class="text-xs text-neutral-400 mt-1.5">Email cannot be changed. Contact support if needed.</p>
					</div>
				</div>
			</div>

			<!-- Demographics -->
			<div class="card animate-slide-up" style="animation-delay: 50ms">
				<div class="flex items-center gap-3 mb-6">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-glow-emerald">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
					</div>
					<div>
						<h2 class="text-lg font-semibold text-neutral-900">Demographics</h2>
						<p class="text-sm text-neutral-500">Helps match you with relevant surveys</p>
					</div>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="age" class="label">Age Range</label>
						<select id="age" bind:value={profile.demographics.age} class="select">
							<option value="">Select age range</option>
							<option value="18-24">18-24</option>
							<option value="25-34">25-34</option>
							<option value="35-44">35-44</option>
							<option value="45-54">45-54</option>
							<option value="55-64">55-64</option>
							<option value="65+">65+</option>
						</select>
					</div>

					<div>
						<label for="gender" class="label">Gender</label>
						<select id="gender" bind:value={profile.demographics.gender} class="select">
							<option value="">Select gender</option>
							<option value="male">Male</option>
							<option value="female">Female</option>
							<option value="non-binary">Non-binary</option>
							<option value="prefer-not-to-say">Prefer not to say</option>
						</select>
					</div>

					<div>
						<label for="education" class="label">Education Level</label>
						<select id="education" bind:value={profile.demographics.education} class="select">
							<option value="">Select education level</option>
							<option value="high-school">High School</option>
							<option value="some-college">Some College</option>
							<option value="bachelors">Bachelor's Degree</option>
							<option value="masters">Master's Degree</option>
							<option value="doctorate">Doctorate</option>
						</select>
					</div>

					<div>
						<label for="employment" class="label">Employment Status</label>
						<select id="employment" bind:value={profile.demographics.employment} class="select">
							<option value="">Select employment status</option>
							<option value="employed-full-time">Employed (Full-time)</option>
							<option value="employed-part-time">Employed (Part-time)</option>
							<option value="self-employed">Self-employed</option>
							<option value="student">Student</option>
							<option value="retired">Retired</option>
							<option value="unemployed">Unemployed</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Survey Preferences -->
			<div class="card animate-slide-up" style="animation-delay: 100ms">
				<div class="flex items-center gap-3 mb-6">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
					</div>
					<div>
						<h2 class="text-lg font-semibold text-neutral-900">Survey Preferences</h2>
						<p class="text-sm text-neutral-500">Select categories you're interested in</p>
					</div>
				</div>
				
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
					{#each surveyCategories as category}
						<button 
							type="button"
							onclick={() => toggleCategory(category)}
							class="px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all {
								profile.preferences.surveyCategories.includes(category) 
									? 'bg-primary-50 border-primary-500 text-primary-700' 
									: 'bg-neutral-50 border-transparent text-neutral-600 hover:border-neutral-200'
							}"
						>
							{category}
						</button>
					{/each}
				</div>
			</div>

			<!-- Notification Preferences -->
			<div class="card animate-slide-up" style="animation-delay: 150ms">
				<div class="flex items-center gap-3 mb-6">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
						</svg>
					</div>
					<div>
						<h2 class="text-lg font-semibold text-neutral-900">Notifications</h2>
						<p class="text-sm text-neutral-500">How you'd like to be notified</p>
					</div>
				</div>
				
				<div class="space-y-4">
					<label class="flex items-center justify-between p-4 bg-neutral-50 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center">
								<svg class="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
							</div>
							<div>
								<span class="text-sm font-medium text-neutral-900">Email Notifications</span>
								<p class="text-xs text-neutral-500">Receive survey invitations and updates</p>
							</div>
						</div>
						<input 
							type="checkbox" 
							bind:checked={profile.preferences.emailNotifications}
							class="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
						/>
					</label>

					<label class="flex items-center justify-between p-4 bg-neutral-50 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center">
								<svg class="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
								</svg>
							</div>
							<div>
								<span class="text-sm font-medium text-neutral-900">SMS Notifications</span>
								<p class="text-xs text-neutral-500">Receive important updates via text</p>
							</div>
						</div>
						<input 
							type="checkbox" 
							bind:checked={profile.preferences.smsNotifications}
							class="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
						/>
					</label>
				</div>
			</div>

			<!-- Save Button -->
			<div class="flex justify-end">
				<button type="submit" disabled={saving} class="btn-primary">
					{#if saving}
						<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						Saving...
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Save Changes
					{/if}
				</button>
			</div>
		</form>
	{/if}
</div>
