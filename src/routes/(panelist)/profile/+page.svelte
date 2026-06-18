<script lang="ts">
	import { Logger } from '$lib/utils/app-logger';
	import { untrack } from 'svelte';
	import { Check, User, Users, ClipboardList, Bell, Mail, Smartphone, Loader, ShieldCheck, AlertCircle, Compass } from '@lucide/svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	let { data }: { data: { profile: { name: string; email: string; emailVerified: boolean; demographics: { age: string; gender: string; country: string; education: string; employment: string; income: string }; preferences: { emailNotifications: boolean; smsNotifications: boolean; surveyCategories: string[] }; dashboardView: 'surveys' | 'discover' } } } = $props();

	let emailVerified = $derived(data.profile.emailVerified);

	// Dashboard view preference — saved independently of the main profile form.
	let dashboardView = $state<'surveys' | 'discover'>(untrack(() => data.profile.dashboardView));
	let savingView = $state(false);
	async function selectDashboardView(view: 'surveys' | 'discover') {
		if (savingView || view === dashboardView) return;
		const prev = dashboardView;
		dashboardView = view;
		savingView = true;
		try {
			const res = await fetch('/api/panelist/dashboard-view', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ view, onboarded: true })
			});
			if (!res.ok) throw new Error('failed');
			toastStore.success('Saved', `Default dashboard set to ${view === 'discover' ? 'Discover' : 'Surveys'}.`);
		} catch (error) {
			dashboardView = prev;
			Logger.root.error({ context: 'errors', error }, 'Failed to save dashboard view');
			toastStore.error('Error', 'Failed to update dashboard preference.');
		} finally {
			savingView = false;
		}
	}

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

	const surveyCategories = [
		'Consumer Products', 'Technology', 'Healthcare', 'Finance', 'Education',
		'Travel', 'Food & Dining', 'Entertainment', 'Politics', 'Sports'
	];

	async function saveProfile() {
		saving = true;
		try {
			const response = await fetch('/api/panelist/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(profile)
			});
			if (response.ok) {
				toastStore.success('Saved', 'Profile updated successfully!');
			} else {
				toastStore.error('Error', 'Failed to update profile.');
			}
		} catch (error) {
			Logger.root.error({ context: 'errors', error }, 'Failed to save profile');
			toastStore.error('Error', 'Failed to update profile.');
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

<div class="space-y-[18px] animate-fade-in">
	<InfoBanner id="profile-how" message="Complete your profile to get matched with more relevant surveys. The more we know about you, the better surveys we can offer — and more points you'll earn." color="amber" />

	<!-- Profile Header -->
	<div class="flex items-center gap-[18px]">
		<div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-400 to-primary-400 grid place-items-center text-surface text-[26px] font-bold flex-shrink-0">
			{profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
		</div>
		<div>
			<h1 class="text-[24px] font-bold text-white tracking-tight">{profile.name || 'Your Profile'}</h1>
			<p class="font-mono text-[13px] text-neutral-400">{profile.email}</p>
		</div>
	</div>

	<form onsubmit={(e) => { e.preventDefault(); saveProfile(); }} class="space-y-4">
		<!-- Basic Information -->
		<div class="rounded-2xl bg-surface-50 border border-white/[0.07] p-6">
			<div class="flex items-center gap-3.5 mb-5">
				<span class="w-10 h-10 rounded-[11px] bg-primary-400/12 text-primary-500 grid place-items-center">
					<User class="w-5 h-5" />
				</span>
				<div>
					<h3 class="text-[15px] font-semibold text-white tracking-tight">Basic information</h3>
					<p class="text-[12.5px] text-neutral-400">Your personal details</p>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
				<div>
					<label for="name" class="block text-[12.5px] font-medium text-neutral-400 mb-2">Full Name</label>
					<input type="text" id="name" bind:value={profile.name} class="input" required />
				</div>
				<div>
					<label for="email" class="block text-[12.5px] font-medium text-neutral-400 mb-2">
						Email Address
						{#if emailVerified}
							<span class="ml-2 inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-[0.06em]">
								<ShieldCheck class="w-3 h-3" /> Verified
							</span>
						{:else}
							<span class="ml-2 inline-flex items-center gap-1 text-[9.5px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-[0.06em]">
								<AlertCircle class="w-3 h-3" /> Unverified
							</span>
						{/if}
					</label>
					<input type="email" id="email" bind:value={profile.email} class="input opacity-50 cursor-not-allowed" required disabled />
				</div>
			</div>
		</div>

		<!-- Demographics -->
		<div class="rounded-2xl bg-surface-50 border border-white/[0.07] p-6">
			<div class="flex items-center gap-3.5 mb-5">
				<span class="w-10 h-10 rounded-[11px] bg-emerald-400/12 text-emerald-400 grid place-items-center">
					<Users class="w-5 h-5" />
				</span>
				<div>
					<h3 class="text-[15px] font-semibold text-white tracking-tight">Demographics</h3>
					<p class="text-[12.5px] text-neutral-400">Helps match you with relevant surveys</p>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
				<div>
					<label for="age" class="block text-[12.5px] font-medium text-neutral-400 mb-2">Age Range</label>
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
					<label for="gender" class="block text-[12.5px] font-medium text-neutral-400 mb-2">Gender</label>
					<select id="gender" bind:value={profile.demographics.gender} class="select">
						<option value="">Select gender</option>
						<option value="male">Male</option>
						<option value="female">Female</option>
						<option value="non-binary">Non-binary</option>
						<option value="prefer-not-to-say">Prefer not to say</option>
					</select>
				</div>
				<div>
					<label for="education" class="block text-[12.5px] font-medium text-neutral-400 mb-2">Education Level</label>
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
					<label for="employment" class="block text-[12.5px] font-medium text-neutral-400 mb-2">Employment Status</label>
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

		<!-- Default dashboard -->
		<div class="rounded-2xl bg-surface-50 border border-white/[0.07] p-6">
			<div class="flex items-center gap-3.5 mb-5">
				<span class="w-10 h-10 rounded-[11px] bg-primary-400/12 text-primary-400 grid place-items-center">
					<Compass class="w-5 h-5" />
				</span>
				<div>
					<h3 class="text-[15px] font-semibold text-white tracking-tight">Default dashboard</h3>
					<p class="text-[12.5px] text-neutral-400">Where you land after signing in</p>
				</div>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{#each [{ id: 'surveys', icon: ClipboardList, title: 'Surveys', desc: 'Paid surveys, steady points' }, { id: 'discover', icon: Compass, title: 'Discover', desc: 'Streaks, quizzes, games & deals' }] as opt}
					{@const active = dashboardView === opt.id}
					<button
						type="button"
						onclick={() => selectDashboardView(opt.id as 'surveys' | 'discover')}
						disabled={savingView}
						class="relative text-left rounded-xl p-4 border transition-all duration-200 disabled:opacity-60
							{active
								? 'border-primary-400/50 bg-primary-400/[0.07] ring-1 ring-inset ring-primary-400/25'
								: 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.15]'}"
					>
						{#if active}
							<span class="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-primary-400 text-surface grid place-items-center"><Check class="w-3.5 h-3.5" /></span>
						{/if}
						<span class="w-9 h-9 rounded-[10px] grid place-items-center mb-3 {active ? 'bg-primary-400/15 text-primary-400' : 'bg-white/[0.05] text-neutral-300'}">
							<opt.icon class="w-[18px] h-[18px]" />
						</span>
						<div class="text-[14px] font-semibold text-white">{opt.title}</div>
						<div class="text-[12px] text-neutral-400 mt-0.5">{opt.desc}</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Survey Preferences -->
		<div class="rounded-2xl bg-surface-50 border border-white/[0.07] p-6">
			<div class="flex items-center gap-3.5 mb-5">
				<span class="w-10 h-10 rounded-[11px] bg-amber-400/12 text-amber-400 grid place-items-center">
					<ClipboardList class="w-5 h-5" />
				</span>
				<div>
					<h3 class="text-[15px] font-semibold text-white tracking-tight">Survey preferences</h3>
					<p class="text-[12.5px] text-neutral-400">Select categories you're interested in</p>
				</div>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each surveyCategories as category}
					{@const on = profile.preferences.surveyCategories.includes(category)}
					<button
						type="button"
						onclick={() => toggleCategory(category)}
						class="px-4 py-2 rounded-full text-[13px] transition-all duration-200
							{on
								? 'bg-primary-400/12 border border-primary-400/40 text-primary-500 font-medium'
								: 'bg-white/[0.03] border border-white/[0.07] text-neutral-400 hover:text-white hover:border-white/[0.13]'}"
					>
						{category}
					</button>
				{/each}
			</div>
		</div>

		<!-- Notifications -->
		<div class="rounded-2xl bg-surface-50 border border-white/[0.07] p-6">
			<div class="flex items-center gap-3.5 mb-5">
				<span class="w-10 h-10 rounded-[11px] bg-rose-400/12 text-rose-400 grid place-items-center">
					<Bell class="w-5 h-5" />
				</span>
				<div>
					<h3 class="text-[15px] font-semibold text-white tracking-tight">Notifications</h3>
					<p class="text-[12.5px] text-neutral-400">How you'd like to be notified</p>
				</div>
			</div>
			<button type="button" onclick={() => profile.preferences.emailNotifications = !profile.preferences.emailNotifications} class="w-full flex items-center justify-between py-4 text-left">
				<div class="flex items-center gap-3.5">
					<span class="w-[38px] h-[38px] rounded-[10px] bg-white/[0.04] border border-white/[0.07] grid place-items-center text-neutral-400">
						<Mail class="w-[18px] h-[18px]" />
					</span>
					<div>
						<h4 class="text-sm font-semibold text-white">Email Notifications</h4>
						<p class="text-xs text-neutral-500">Survey invitations and updates</p>
					</div>
				</div>
				<div class="relative w-[46px] h-[26px] rounded-full border transition-colors flex-shrink-0
					{profile.preferences.emailNotifications ? 'bg-primary-400 border-primary-400' : 'bg-white/[0.08] border-white/[0.13]'}">
					<span class="absolute top-0.5 w-5 h-5 rounded-full transition-all
						{profile.preferences.emailNotifications ? 'left-[22px] bg-surface' : 'left-0.5 bg-white'}"></span>
				</div>
			</button>
			<button type="button" onclick={() => profile.preferences.smsNotifications = !profile.preferences.smsNotifications} class="w-full flex items-center justify-between py-4 text-left border-t border-white/[0.07]">
				<div class="flex items-center gap-3.5">
					<span class="w-[38px] h-[38px] rounded-[10px] bg-white/[0.04] border border-white/[0.07] grid place-items-center text-neutral-400">
						<Smartphone class="w-[18px] h-[18px]" />
					</span>
					<div>
						<h4 class="text-sm font-semibold text-white">SMS Notifications</h4>
						<p class="text-xs text-neutral-500">Important updates via text</p>
					</div>
				</div>
				<div class="relative w-[46px] h-[26px] rounded-full border transition-colors flex-shrink-0
					{profile.preferences.smsNotifications ? 'bg-primary-400 border-primary-400' : 'bg-white/[0.08] border-white/[0.13]'}">
					<span class="absolute top-0.5 w-5 h-5 rounded-full transition-all
						{profile.preferences.smsNotifications ? 'left-[22px] bg-surface' : 'left-0.5 bg-white'}"></span>
				</div>
			</button>
		</div>

		<!-- Save -->
		<div class="flex justify-end pt-2">
			<button type="submit" disabled={saving} class="btn-primary">
				{#if saving}
					<Loader class="w-4 h-4 animate-spin" /> Saving...
				{:else}
					<Check class="w-4 h-4" /> Save changes
				{/if}
			</button>
		</div>
	</form>
</div>
