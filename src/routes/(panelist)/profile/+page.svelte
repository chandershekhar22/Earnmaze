<script lang="ts">
	import { Logger } from '$lib/utils/app-logger';
	import { onMount, untrack } from 'svelte';
	import { Check, User, Users, ClipboardList, Bell, Mail, Smartphone, Loader, ShieldCheck, AlertCircle, Compass, Megaphone } from '@lucide/svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

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
		try {
			const response = await fetch('/api/panelist/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(profile)
			});
			if (response.ok) {
				toastStore.success(m.prof_toast_saved(), m.prof_toast_saved_profile());
			} else {
				toastStore.error(m.prof_toast_error(), m.prof_toast_error_save());
			}
		} catch (error) {
			Logger.root.error({ context: 'errors', error }, 'Failed to save profile');
			toastStore.error(m.prof_toast_error(), m.prof_toast_error_save());
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

<div class="space-y-[18px] animate-fade-in">
	<InfoBanner id="profile-how" message={m.prof_info()} color="amber" />

	<!-- Profile Header -->
	<div class="flex items-center gap-[18px]">
		<div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-400 to-primary-400 grid place-items-center text-surface text-[26px] font-bold flex-shrink-0">
			{profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
		</div>
		<div>
			<h1 class="text-[24px] font-bold text-white tracking-tight">{profile.name || m.prof_default_title()}</h1>
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
					<h3 class="text-[15px] font-semibold text-white tracking-tight">{m.prof_basic_title()}</h3>
					<p class="text-[12.5px] text-neutral-400">{m.prof_basic_desc()}</p>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
				<div>
					<label for="name" class="block text-[12.5px] font-medium text-neutral-400 mb-2">{m.prof_full_name()}</label>
					<input type="text" id="name" bind:value={profile.name} class="input" required />
				</div>
				<div>
					<label for="email" class="block text-[12.5px] font-medium text-neutral-400 mb-2">
						{m.prof_email_label()}
						{#if emailVerified}
							<span class="ml-2 inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-[0.06em]">
								<ShieldCheck class="w-3 h-3" /> {m.prof_email_verified()}
							</span>
						{:else}
							<span class="ml-2 inline-flex items-center gap-1 text-[9.5px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-[0.06em]">
								<AlertCircle class="w-3 h-3" /> {m.prof_email_unverified()}
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
					<h3 class="text-[15px] font-semibold text-white tracking-tight">{m.prof_demographics_title()}</h3>
					<p class="text-[12.5px] text-neutral-400">{m.prof_demographics_desc()}</p>
				</div>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
				<div>
					<label for="age" class="block text-[12.5px] font-medium text-neutral-400 mb-2">{m.prof_age_label()}</label>
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
					<label for="gender" class="block text-[12.5px] font-medium text-neutral-400 mb-2">{m.prof_gender_label()}</label>
					<select id="gender" bind:value={profile.demographics.gender} class="select">
						<option value="">{m.prof_gender_select()}</option>
						<option value="male">{m.prof_gender_male()}</option>
						<option value="female">{m.prof_gender_female()}</option>
						<option value="non-binary">{m.prof_gender_nonbinary()}</option>
						<option value="prefer-not-to-say">{m.prof_gender_prefer_not()}</option>
					</select>
				</div>
				<div>
					<label for="education" class="block text-[12.5px] font-medium text-neutral-400 mb-2">{m.prof_education_label()}</label>
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
					<label for="employment" class="block text-[12.5px] font-medium text-neutral-400 mb-2">{m.prof_employment_label()}</label>
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
				{#each [{ id: 'surveys', icon: ClipboardList, title: 'Surveys', desc: 'Paid surveys, steady points' }, { id: 'discover', icon: Compass, title: 'Discover', desc: 'Streaks, quizzes, games & deals' }] as opt (opt.id)}
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
					<h3 class="text-[15px] font-semibold text-white tracking-tight">{m.prof_categories_title()}</h3>
					<p class="text-[12.5px] text-neutral-400">{m.prof_categories_desc()}</p>
				</div>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each surveyCategories as cat (cat.value)}
					{@const on = profile.preferences.surveyCategories.includes(cat.value)}
					<button
						type="button"
						onclick={() => toggleCategory(cat.value)}
						class="px-4 py-2 rounded-full text-[13px] transition-all duration-200
							{on
								? 'bg-primary-400/12 border border-primary-400/40 text-primary-500 font-medium'
								: 'bg-white/[0.03] border border-white/[0.07] text-neutral-400 hover:text-white hover:border-white/[0.13]'}"
					>
						{cat.label}
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
					<h3 class="text-[15px] font-semibold text-white tracking-tight">{m.prof_notif_title()}</h3>
					<p class="text-[12.5px] text-neutral-400">{m.prof_notif_desc()}</p>
				</div>
			</div>
			<button type="button" onclick={() => profile.preferences.emailNotifications = !profile.preferences.emailNotifications} class="w-full flex items-center justify-between py-4 text-left">
				<div class="flex items-center gap-3.5">
					<span class="w-[38px] h-[38px] rounded-[10px] bg-white/[0.04] border border-white/[0.07] grid place-items-center text-neutral-400">
						<Mail class="w-[18px] h-[18px]" />
					</span>
					<div>
						<h4 class="text-sm font-semibold text-white">{m.prof_notif_email_label()}</h4>
						<p class="text-xs text-neutral-500">{m.prof_notif_email_desc()}</p>
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
						<h4 class="text-sm font-semibold text-white">{m.prof_notif_sms_label()}</h4>
						<p class="text-xs text-neutral-500">{m.prof_notif_sms_desc()}</p>
					</div>
				</div>
				<div class="relative w-[46px] h-[26px] rounded-full border transition-colors flex-shrink-0
					{profile.preferences.smsNotifications ? 'bg-primary-400 border-primary-400' : 'bg-white/[0.08] border-white/[0.13]'}">
					<span class="absolute top-0.5 w-5 h-5 rounded-full transition-all
						{profile.preferences.smsNotifications ? 'left-[22px] bg-surface' : 'left-0.5 bg-white'}"></span>
				</div>
			</button>
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
		<div class="flex justify-end pt-2">
			<button type="submit" disabled={saving} class="btn-primary">
				{#if saving}
					<Loader class="w-4 h-4 animate-spin" /> {m.prof_save_loading()}
				{:else}
					<Check class="w-4 h-4" /> {m.prof_save()}
				{/if}
			</button>
		</div>
	</form>
</div>
