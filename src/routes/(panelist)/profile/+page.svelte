<script lang="ts">
	import { Logger } from '$lib/utils/app-logger';
	import { onMount, untrack } from 'svelte';
	import { Check, X, User, Users, ClipboardList, Bell, Mail, Smartphone, Loader, ShieldCheck, AlertCircle, Megaphone } from '@lucide/svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

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

	// Marketing email consent — fetched + toggled separately from profile
	// preferences because every change writes to the consent audit log.
	let marketingConsent = $state(false);
	let marketingConsentAt = $state<string | null>(null);
	let marketingSaving = $state(false);

	onMount(async () => {
		try {
			const response = await fetch('/api/panelist/email-preferences');
			if (response.ok) {
				const data = await response.json();
				marketingConsent = data.marketingConsent ?? false;
				marketingConsentAt = data.marketingConsentAt ?? null;
			}
		} catch (err) {
			Logger.root.warn({ context: 'errors', error: err }, 'Failed to load email preferences');
		}
	});

	async function toggleMarketingConsent() {
		const next = !marketingConsent;
		marketingSaving = true;
		try {
			const response = await fetch('/api/panelist/email-preferences', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ marketingConsent: next }),
			});
			if (response.ok) {
				marketingConsent = next;
				marketingConsentAt = new Date().toISOString();
				toastStore.success(m.prof_toast_saved(), next ? m.prof_toast_saved_subscribed() : m.prof_toast_saved_unsubscribed());
			} else {
				toastStore.error(m.prof_toast_error(), m.prof_toast_error_prefs());
			}
		} catch (err) {
			Logger.root.error({ context: 'errors', error: err }, 'Failed to toggle marketing consent');
			toastStore.error(m.prof_toast_error(), m.prof_toast_error_prefs());
		} finally {
			marketingSaving = false;
		}
	}

	// Survey category options. We pair the canonical English value (sent
	// to the API + persisted) with the localized label shown to the user.
	let surveyCategories = $derived([
		{ value: 'Consumer Products', label: m.prof_cat_consumer() },
		{ value: 'Technology', label: m.prof_cat_tech() },
		{ value: 'Healthcare', label: m.prof_cat_health() },
		{ value: 'Finance', label: m.prof_cat_finance() },
		{ value: 'Education', label: m.prof_cat_education() },
		{ value: 'Travel', label: m.prof_cat_travel() },
		{ value: 'Food & Dining', label: m.prof_cat_food() },
		{ value: 'Entertainment', label: m.prof_cat_entertainment() },
		{ value: 'Politics', label: m.prof_cat_politics() },
		{ value: 'Sports', label: m.prof_cat_sports() },
	]);

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
				toastStore.success(m.prof_toast_saved(), m.prof_toast_saved_profile());
				message = '';
			} else {
				toastStore.error(m.prof_toast_error(), m.prof_toast_error_save());
				message = '';
			}
		} catch (error) {
			Logger.root.error({ context: 'errors', error }, 'Failed to save profile');
			toastStore.error(m.prof_toast_error(), m.prof_toast_error_save());
			message = '';
		} finally {
			saving = false;
		}
	}

	function toggleCategory(value: string) {
		if (profile.preferences.surveyCategories.includes(value)) {
			profile.preferences.surveyCategories = profile.preferences.surveyCategories.filter(c => c !== value);
		} else {
			profile.preferences.surveyCategories = [...profile.preferences.surveyCategories, value];
		}
	}
</script>

<svelte:head>
	<title>{m.prof_meta_title()}</title>
	<meta name="description" content={m.prof_meta_description()} />
</svelte:head>

<div class="space-y-5 animate-fade-in">
	<InfoBanner id="profile-how" message={m.prof_info()} color="amber" />

	<!-- Profile Header -->
	<div class="flex items-center gap-4">
		<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-fuchsia-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-primary-500/20">
			{profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
		</div>
		<div>
			<h1 class="text-xl font-bold text-white">{profile.name || m.prof_default_title()}</h1>
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
					<h2 class="text-sm font-bold text-white">{m.prof_basic_title()}</h2>
					<p class="text-xs text-neutral-600">{m.prof_basic_desc()}</p>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="name" class="label">{m.prof_full_name()}</label>
					<input type="text" id="name" bind:value={profile.name} class="input" required />
				</div>
				<div>
					<label for="email" class="label flex items-center gap-2">
						{m.prof_email_label()}
						{#if emailVerified}
							<span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">
								<ShieldCheck class="w-3 h-3" /> {m.prof_email_verified()}
							</span>
						{:else}
							<span class="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full ring-1 ring-amber-500/20">
								<AlertCircle class="w-3 h-3" /> {m.prof_email_unverified()}
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
					<h2 class="text-sm font-bold text-white">{m.prof_demographics_title()}</h2>
					<p class="text-xs text-neutral-600">{m.prof_demographics_desc()}</p>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="age" class="label">{m.prof_age_label()}</label>
					<select id="age" bind:value={profile.demographics.age} class="select">
						<option value="">{m.prof_age_select()}</option>
						<option value="18-24">18-24</option>
						<option value="25-34">25-34</option>
						<option value="35-44">35-44</option>
						<option value="45-54">45-54</option>
						<option value="55-64">55-64</option>
						<option value="65+">65+</option>
					</select>
				</div>
				<div>
					<label for="gender" class="label">{m.prof_gender_label()}</label>
					<select id="gender" bind:value={profile.demographics.gender} class="select">
						<option value="">{m.prof_gender_select()}</option>
						<option value="male">{m.prof_gender_male()}</option>
						<option value="female">{m.prof_gender_female()}</option>
						<option value="non-binary">{m.prof_gender_nonbinary()}</option>
						<option value="prefer-not-to-say">{m.prof_gender_prefer_not()}</option>
					</select>
				</div>
				<div>
					<label for="education" class="label">{m.prof_education_label()}</label>
					<select id="education" bind:value={profile.demographics.education} class="select">
						<option value="">{m.prof_education_select()}</option>
						<option value="high-school">{m.prof_education_hs()}</option>
						<option value="some-college">{m.prof_education_some_college()}</option>
						<option value="bachelors">{m.prof_education_bachelors()}</option>
						<option value="masters">{m.prof_education_masters()}</option>
						<option value="doctorate">{m.prof_education_doctorate()}</option>
					</select>
				</div>
				<div>
					<label for="employment" class="label">{m.prof_employment_label()}</label>
					<select id="employment" bind:value={profile.demographics.employment} class="select">
						<option value="">{m.prof_employment_select()}</option>
						<option value="employed-full-time">{m.prof_employment_ft()}</option>
						<option value="employed-part-time">{m.prof_employment_pt()}</option>
						<option value="self-employed">{m.prof_employment_self()}</option>
						<option value="student">{m.prof_employment_student()}</option>
						<option value="retired">{m.prof_employment_retired()}</option>
						<option value="unemployed">{m.prof_employment_unemployed()}</option>
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
					<h2 class="text-sm font-bold text-white">{m.prof_categories_title()}</h2>
					<p class="text-xs text-neutral-600">{m.prof_categories_desc()}</p>
				</div>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each surveyCategories as cat}
					<button
						type="button"
						onclick={() => toggleCategory(cat.value)}
						class="px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200 {
							profile.preferences.surveyCategories.includes(cat.value)
								? 'bg-primary-500/15 border-primary-500/30 text-primary-300'
								: 'bg-surface-200 border-white/[0.06] text-neutral-500 hover:border-white/10 hover:text-neutral-300'
						}"
					>
						{cat.label}
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
					<h2 class="text-sm font-bold text-white">{m.prof_notif_title()}</h2>
					<p class="text-xs text-neutral-600">{m.prof_notif_desc()}</p>
				</div>
			</div>
			<div class="space-y-3">
				<label class="flex items-center justify-between p-4 bg-surface-200 rounded-xl cursor-pointer hover:bg-surface-300 transition-colors">
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-lg bg-surface-100 border border-white/[0.06] flex items-center justify-center">
							<Mail class="w-4 h-4 text-neutral-500" />
						</div>
						<div>
							<span class="text-sm font-medium text-white">{m.prof_notif_email_label()}</span>
							<p class="text-[10px] text-neutral-600">{m.prof_notif_email_desc()}</p>
						</div>
					</div>
					<div class="relative">
						<input type="checkbox" bind:checked={profile.preferences.emailNotifications} class="sr-only peer" />
						<div class="w-10 h-6 bg-surface-300 peer-focus:ring-2 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:bg-primary-600 transition-colors"></div>
						<div class="absolute start-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
					</div>
				</label>

				<label class="flex items-center justify-between p-4 bg-surface-200 rounded-xl cursor-pointer hover:bg-surface-300 transition-colors">
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-lg bg-surface-100 border border-white/[0.06] flex items-center justify-center">
							<Smartphone class="w-4 h-4 text-neutral-500" />
						</div>
						<div>
							<span class="text-sm font-medium text-white">{m.prof_notif_sms_label()}</span>
							<p class="text-[10px] text-neutral-600">{m.prof_notif_sms_desc()}</p>
						</div>
					</div>
					<div class="relative">
						<input type="checkbox" bind:checked={profile.preferences.smsNotifications} class="sr-only peer" />
						<div class="w-10 h-6 bg-surface-300 peer-focus:ring-2 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:bg-primary-600 transition-colors"></div>
						<div class="absolute start-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
					</div>
				</label>
			</div>
		</div>

		<!-- Marketing Email Consent -->
		<div class="card animate-slide-up" style="animation-delay: 175ms">
			<div class="flex items-center gap-3 mb-6">
				<div class="p-2.5 bg-violet-500/10 rounded-xl">
					<Megaphone class="w-5 h-5 text-violet-400" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-white">{m.prof_marketing_title()}</h2>
					<p class="text-xs text-neutral-600">{m.prof_marketing_desc()}</p>
				</div>
			</div>
			<button
				type="button"
				onclick={toggleMarketingConsent}
				disabled={marketingSaving}
				class="w-full flex items-center justify-between p-4 bg-surface-200 rounded-xl cursor-pointer hover:bg-surface-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-start"
			>
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 rounded-lg bg-surface-100 border border-white/[0.06] flex items-center justify-center">
						<Mail class="w-4 h-4 text-neutral-500" />
					</div>
					<div>
						<span class="text-sm font-medium text-white">{m.prof_marketing_label()}</span>
						<p class="text-[10px] text-neutral-600">
							{#if marketingConsent && marketingConsentAt}
								{m.prof_marketing_opted_in({ date: new Date(marketingConsentAt).toLocaleDateString(getLocale()) })}
							{:else}
								{m.prof_marketing_off()}
							{/if}
						</p>
					</div>
				</div>
				<div class="relative">
					<input type="checkbox" checked={marketingConsent} class="sr-only peer" tabindex="-1" readonly />
					<div class="w-10 h-6 bg-surface-300 peer-focus:ring-2 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:bg-primary-600 transition-colors"></div>
					<div class="absolute start-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
				</div>
			</button>
			<p class="mt-3 text-[10px] text-neutral-600 leading-relaxed">
				{m.prof_marketing_disclaimer()}
			</p>
		</div>

		<!-- Save -->
		<div class="flex justify-end">
			<button type="submit" disabled={saving} class="btn-primary">
				{#if saving}
					<Loader class="w-4 h-4 animate-spin" />
					{m.prof_save_loading()}
				{:else}
					<Check class="w-4 h-4" />
					{m.prof_save()}
				{/if}
			</button>
		</div>
	</form>
</div>
