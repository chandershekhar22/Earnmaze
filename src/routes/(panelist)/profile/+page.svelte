<script lang="ts">
	import { Logger } from '$lib/utils/app-logger';
	import { untrack } from 'svelte';
	import { Check, X, User, Users, ClipboardList, Bell, Mail, Smartphone, Loader, ShieldCheck, AlertCircle } from '@lucide/svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	let { data }: { data: { profile: { name: string; email: string; emailVerified: boolean; demographics: { age: string; gender: string; country: string; education: string; employment: string; income: string }; preferences: { emailNotifications: boolean; smsNotifications: boolean; surveyCategories: string[] } } } } = $props();

	let emailVerified = $derived(data.profile.emailVerified);

	let profile = $state(untrack(() => ({
		name: data.profile.name,
		email: data.profile.email,
		demographics: {
			age: data.profile.demographics.age,
			gender: data.profile.demographics.gender,
			country: data.profile.demographics.country,
			education: data.profile.demographics.education,
			employment: data.profile.demographics.employment,
			income: data.profile.demographics.income,
		},
		preferences: {
			emailNotifications: data.profile.preferences.emailNotifications,
			smsNotifications: data.profile.preferences.smsNotifications,
			surveyCategories: data.profile.preferences.surveyCategories as string[],
		},
	})));
	let saving = $state(false);
	let message = $state('');

	const surveyCategories = [
		'Consumer Products', 'Technology', 'Healthcare', 'Finance', 'Education',
		'Travel', 'Food & Dining', 'Entertainment', 'Politics', 'Sports'
	];

	async function saveProfile() {
		saving = true;
		message = '';
		try {
			const response = await fetch('/api/panelist/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(profile)
			});
			if (response.ok) {
				toastStore.success('Saved', 'Profile updated successfully!');
				message = '';
			} else {
				toastStore.error('Error', 'Failed to update profile.');
				message = '';
			}
		} catch (error) {
			Logger.root.error({ context: 'errors', error }, 'Failed to save profile');
			toastStore.error('Error', 'Failed to update profile.');
			message = '';
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
	<title>Profile - EarnMaze</title>
	<meta name="description" content="Manage your profile and preferences." />
</svelte:head>

<div class="space-y-5 animate-fade-in">
	<InfoBanner id="profile-how" message="Complete your profile to get matched with more relevant surveys. The more we know about you, the better surveys we can offer — and more points you'll earn." color="amber" />

	<!-- Profile Header -->
	<div class="flex items-center gap-4">
		<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-fuchsia-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-primary-500/20">
			{profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
		</div>
		<div>
			<h1 class="text-xl font-bold text-white">{profile.name || 'Your Profile'}</h1>
			<p class="text-sm text-neutral-600">{profile.email}</p>
		</div>
	</div>

	<!-- Toast -->
	{#if message}
		<div class="flex items-center gap-3 px-4 py-3 rounded-xl animate-scale-in {message.includes('successfully') ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}">
			{#if message.includes('successfully')}
				<div class="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
					<Check class="w-4 h-4 text-emerald-400" />
				</div>
				<p class="text-sm font-medium text-emerald-400">{message}</p>
			{:else}
				<div class="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center">
					<X class="w-4 h-4 text-rose-400" />
				</div>
				<p class="text-sm font-medium text-rose-400">{message}</p>
			{/if}
		</div>
	{/if}

	<form onsubmit={(e) => { e.preventDefault(); saveProfile(); }} class="space-y-5">
		<!-- Basic Information -->
		<div class="card animate-slide-up" style="animation-delay: 0ms">
			<div class="flex items-center gap-3 mb-6">
				<div class="p-2.5 bg-primary-500/10 rounded-xl">
					<User class="w-5 h-5 text-primary-400" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white">Basic Information</h2>
					<p class="text-xs text-neutral-600">Your personal details</p>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="name" class="label">Full Name</label>
					<input type="text" id="name" bind:value={profile.name} class="input" required />
				</div>
				<div>
					<label for="email" class="label flex items-center gap-2">
						Email Address
						{#if emailVerified}
							<span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">
								<ShieldCheck class="w-3 h-3" /> Verified
							</span>
						{:else}
							<span class="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full ring-1 ring-amber-500/20">
								<AlertCircle class="w-3 h-3" /> Unverified
							</span>
						{/if}
					</label>
					<input type="email" id="email" bind:value={profile.email} class="input opacity-50 cursor-not-allowed" required disabled />
				</div>
			</div>
		</div>

		<!-- Demographics -->
		<div class="card animate-slide-up" style="animation-delay: 50ms">
			<div class="flex items-center gap-3 mb-6">
				<div class="p-2.5 bg-emerald-500/10 rounded-xl">
					<Users class="w-5 h-5 text-emerald-400" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white">Demographics</h2>
					<p class="text-xs text-neutral-600">Helps match you with relevant surveys</p>
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
				<div class="p-2.5 bg-amber-500/10 rounded-xl">
					<ClipboardList class="w-5 h-5 text-amber-400" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white">Survey Preferences</h2>
					<p class="text-xs text-neutral-600">Select categories you're interested in</p>
				</div>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each surveyCategories as category}
					<button
						type="button"
						onclick={() => toggleCategory(category)}
						class="px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200 {
							profile.preferences.surveyCategories.includes(category)
								? 'bg-primary-500/15 border-primary-500/30 text-primary-300'
								: 'bg-surface-200 border-white/[0.06] text-neutral-500 hover:border-white/10 hover:text-neutral-300'
						}"
					>
						{category}
					</button>
				{/each}
			</div>
		</div>

		<!-- Notifications -->
		<div class="card animate-slide-up" style="animation-delay: 150ms">
			<div class="flex items-center gap-3 mb-6">
				<div class="p-2.5 bg-rose-500/10 rounded-xl">
					<Bell class="w-5 h-5 text-rose-400" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white">Notifications</h2>
					<p class="text-xs text-neutral-600">How you'd like to be notified</p>
				</div>
			</div>
			<div class="space-y-3">
				<label class="flex items-center justify-between p-4 bg-surface-200 rounded-xl cursor-pointer hover:bg-surface-300 transition-colors">
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-lg bg-surface-100 border border-white/[0.06] flex items-center justify-center">
							<Mail class="w-4 h-4 text-neutral-500" />
						</div>
						<div>
							<span class="text-sm font-medium text-white">Email Notifications</span>
							<p class="text-[10px] text-neutral-600">Survey invitations and updates</p>
						</div>
					</div>
					<div class="relative">
						<input type="checkbox" bind:checked={profile.preferences.emailNotifications} class="sr-only peer" />
						<div class="w-10 h-6 bg-surface-300 peer-focus:ring-2 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:bg-primary-600 transition-colors"></div>
						<div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
					</div>
				</label>

				<label class="flex items-center justify-between p-4 bg-surface-200 rounded-xl cursor-pointer hover:bg-surface-300 transition-colors">
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-lg bg-surface-100 border border-white/[0.06] flex items-center justify-center">
							<Smartphone class="w-4 h-4 text-neutral-500" />
						</div>
						<div>
							<span class="text-sm font-medium text-white">SMS Notifications</span>
							<p class="text-[10px] text-neutral-600">Important updates via text</p>
						</div>
					</div>
					<div class="relative">
						<input type="checkbox" bind:checked={profile.preferences.smsNotifications} class="sr-only peer" />
						<div class="w-10 h-6 bg-surface-300 peer-focus:ring-2 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:bg-primary-600 transition-colors"></div>
						<div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
					</div>
				</label>
			</div>
		</div>

		<!-- Save -->
		<div class="flex justify-end">
			<button type="submit" disabled={saving} class="btn-primary">
				{#if saving}
					<Loader class="w-4 h-4 animate-spin" />
					Saving...
				{:else}
					<Check class="w-4 h-4" />
					Save Changes
				{/if}
			</button>
		</div>
	</form>
</div>
