<script lang="ts">
	import { onMount } from 'svelte';
	import { CircleCheck, CircleX, Loader, Check, Code2, Home, CircleDollarSign, ClipboardList, Mail, ShieldCheck, Palette, Settings } from '@lucide/svelte';

	// Define all available settings with their metadata
	interface SettingConfig {
		key: string;
		label: string;
		description: string;
		type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
		category: string;
		placeholder?: string;
		options?: { value: string; label: string }[];
		default: string;
	}

	const settingsConfig: SettingConfig[] = [
		// Landing Page Settings
		{
			key: 'earn_money_redirect_url',
			label: 'Email Submission Redirect URL',
			description: 'Where users are redirected after submitting their email. Use {email} as placeholder.',
			type: 'text',
			category: 'Landing Page',
			placeholder: '/register?email={email}',
			default: '/register'
		},
		{
			key: 'landing_page_title',
			label: 'Landing Page Title',
			description: 'Main headline displayed on the earn-money page.',
			type: 'text',
			category: 'Landing Page',
			placeholder: 'Earn Money Taking Surveys',
			default: 'Earn Money Taking Surveys'
		},
		// Points & Rewards Settings
		{
			key: 'points_per_dollar',
			label: 'Points Per Dollar',
			description: 'How many points equal one dollar for redemptions.',
			type: 'number',
			category: 'Points & Rewards',
			placeholder: '100',
			default: '100'
		},
		{
			key: 'minimum_redemption_points',
			label: 'Minimum Redemption Points',
			description: 'Minimum points required to redeem rewards.',
			type: 'number',
			category: 'Points & Rewards',
			placeholder: '1000',
			default: '1000'
		},
		{
			key: 'signup_bonus_points',
			label: 'Signup Bonus Points',
			description: 'Points awarded to new users upon registration.',
			type: 'number',
			category: 'Points & Rewards',
			placeholder: '100',
			default: '100'
		},
		{
			key: 'referral_bonus_points',
			label: 'Referral Bonus Points',
			description: 'Points awarded for successful referrals.',
			type: 'number',
			category: 'Points & Rewards',
			placeholder: '500',
			default: '500'
		},
		// Survey Settings
		{
			key: 'max_surveys_per_day',
			label: 'Max Surveys Per Day',
			description: 'Maximum number of surveys a panelist can take per day.',
			type: 'number',
			category: 'Surveys',
			placeholder: '10',
			default: '10'
		},
		{
			key: 'survey_cooldown_minutes',
			label: 'Survey Cooldown (minutes)',
			description: 'Wait time between survey completions.',
			type: 'number',
			category: 'Surveys',
			placeholder: '5',
			default: '5'
		},
		{
			key: 'auto_approve_surveys',
			label: 'Auto-Approve Survey Completions',
			description: 'Automatically approve survey completions without admin review.',
			type: 'boolean',
			category: 'Surveys',
			default: 'false'
		},
		// Email Settings
		{
			key: 'email_notifications_enabled',
			label: 'Email Notifications',
			description: 'Enable or disable email notifications for users.',
			type: 'boolean',
			category: 'Email',
			default: 'true'
		},
		{
			key: 'admin_email',
			label: 'Admin Email',
			description: 'Email address for admin notifications.',
			type: 'text',
			category: 'Email',
			placeholder: 'admin@example.com',
			default: ''
		},
		{
			key: 'support_email',
			label: 'Support Email',
			description: 'Email address displayed for user support.',
			type: 'text',
			category: 'Email',
			placeholder: 'support@example.com',
			default: ''
		},
		// Security Settings
		{
			key: 'require_email_verification',
			label: 'Require Email Verification',
			description: 'Require users to verify their email before accessing features.',
			type: 'boolean',
			category: 'Security',
			default: 'true'
		},
		{
			key: 'max_login_attempts',
			label: 'Max Login Attempts',
			description: 'Maximum failed login attempts before account lockout.',
			type: 'number',
			category: 'Security',
			placeholder: '5',
			default: '5'
		},
		{
			key: 'session_timeout_hours',
			label: 'Session Timeout (hours)',
			description: 'How long before inactive sessions expire.',
			type: 'number',
			category: 'Security',
			placeholder: '24',
			default: '24'
		},
		// Branding Settings
		{
			key: 'site_name',
			label: 'Site Name',
			description: 'Name displayed in browser tab and emails.',
			type: 'text',
			category: 'Branding',
			placeholder: 'EarnMaze',
			default: 'EarnMaze'
		},
		{
			key: 'tagline',
			label: 'Tagline',
			description: 'Short tagline or slogan for the site.',
			type: 'text',
			category: 'Branding',
			placeholder: 'Earn rewards for your opinions',
			default: 'Earn rewards for your opinions'
		},
		{
			key: 'maintenance_mode',
			label: 'Maintenance Mode',
			description: 'Enable to show maintenance page to non-admin users.',
			type: 'boolean',
			category: 'System',
			default: 'false'
		},
		{
			key: 'maintenance_message',
			label: 'Maintenance Message',
			description: 'Message shown during maintenance mode.',
			type: 'textarea',
			category: 'System',
			placeholder: 'We are currently performing scheduled maintenance...',
			default: 'We are currently performing scheduled maintenance. Please check back soon.'
		}
	];

	// Group settings by category
	let categories = $derived([...new Set(settingsConfig.map(s => s.category))]);

	let settings = $state<Record<string, string>>({});
	let isLoading = $state(true);
	let savingKeys = $state<Set<string>>(new Set());
	let message = $state('');
	let messageType = $state<'success' | 'error'>('success');
	let activeCategory = $state('Landing Page');
	let hasUnsavedChanges = $state(false);

	onMount(async () => {
		await loadSettings();
	});

	async function loadSettings() {
		try {
			const response = await fetch('/api/admin/settings');
			const data = await response.json();

			if (data.success) {
				// Initialize with defaults, then override with saved values
				const loaded: Record<string, string> = {};
				for (const config of settingsConfig) {
					loaded[config.key] = data.settings[config.key] ?? config.default;
				}
				settings = loaded;
			}
		} catch (error) {
			console.error('Failed to load settings:', error);
		} finally {
			isLoading = false;
		}
	}

	async function saveSetting(key: string) {
		const config = settingsConfig.find(s => s.key === key);
		if (!config) return;

		savingKeys = new Set([...savingKeys, key]);
		message = '';

		try {
			const response = await fetch('/api/admin/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					key,
					value: settings[key],
					description: config.description
				})
			});

			const data = await response.json();

			if (data.success) {
				message = `${config.label} saved successfully!`;
				messageType = 'success';
			} else {
				message = data.error || 'Failed to save setting';
				messageType = 'error';
			}
		} catch (error) {
			message = 'Network error. Please try again.';
			messageType = 'error';
		} finally {
			savingKeys = new Set([...savingKeys].filter(k => k !== key));
			setTimeout(() => { message = ''; }, 3000);
		}
	}

	async function saveAllSettings() {
		const categorySettings = settingsConfig.filter(s => s.category === activeCategory);

		for (const config of categorySettings) {
			await saveSetting(config.key);
		}
	}

	function handleChange(key: string, value: string) {
		settings[key] = value;
		hasUnsavedChanges = true;
	}

	function getCategoryIcon(category: string): string {
		const icons: Record<string, string> = {
			'Landing Page': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
			'Points & Rewards': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
			'Surveys': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
			'Email': 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
			'Security': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
			'Branding': 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
			'System': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
		};
		return icons[category] || icons['System'];
	}

	function getCategoryIconComp(category: string) {
		const map: Record<string, typeof Settings> = {
			'Landing Page': Home,
			'Points & Rewards': CircleDollarSign,
			'Surveys': ClipboardList,
			'Email': Mail,
			'Security': ShieldCheck,
			'Branding': Palette,
			'System': Settings
		};
		return map[category] ?? Settings;
	}
</script>

<svelte:head>
	<title>Settings - EarnMaze Admin</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
	{#if isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="text-center">
				<div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
				<p class="mt-4 text-neutral-400">Loading settings...</p>
			</div>
		</div>
	{:else}
		<div class="flex flex-col lg:flex-row gap-6">
			<!-- Sidebar Categories -->
			<div class="lg:w-56 flex-shrink-0">
				<nav class="card !p-2 space-y-1 sticky top-6">
					{#each categories as category}
						{@const CategoryIcon = getCategoryIconComp(category)}
						<button
							onclick={() => activeCategory = category}
							class="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all {activeCategory === category
								? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
								: 'text-neutral-400 hover:bg-white/[0.03] hover:text-white'}"
						>
							<span class="w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 {activeCategory === category ? 'bg-primary-500/10 text-primary-400' : 'bg-white/5 text-neutral-500'}">
								<CategoryIcon class="w-5 h-5" />
							</span>
							<span class="truncate">{category}</span>
						</button>
					{/each}
				</nav>
			</div>

			<!-- Settings Panel -->
			<div class="flex-1 min-w-0">
				<!-- Success/Error Message -->
				{#if message}
					<div class="mb-4 p-4 rounded-xl {messageType === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'} flex items-center gap-3">
						{#if messageType === 'success'}
						<CircleCheck class="w-6 h-6 flex-shrink-0" />
					{:else}
						<CircleX class="w-6 h-6 flex-shrink-0" />
						{/if}
						<span>{message}</span>
					</div>
				{/if}

				<div class="card !p-0">
					<!-- Category Header -->
					{#each [getCategoryIconComp(activeCategory)] as ActiveCategoryIcon}
					<div class="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
						<div class="flex items-center gap-3">
								<div class="p-3 bg-primary-500/10 rounded-xl">
									<ActiveCategoryIcon class="w-7 h-7 text-primary-400" />
							</div>
							<div>
								<h2 class="text-lg font-bold text-white">{activeCategory}</h2>
								<p class="text-sm text-neutral-500">Configure {activeCategory.toLowerCase()} settings</p>
							</div>
						</div>
						<button
							onclick={saveAllSettings}
							class="btn-primary text-sm"
						>
							<Check class="w-4 h-4" />
							Save All
						</button>
					</div>
					{/each}

					<!-- Settings List -->
					<div class="divide-y divide-white/[0.04]">
						{#each settingsConfig.filter(s => s.category === activeCategory) as config}
							<div class="p-5 hover:bg-white/[0.02] transition-colors">
								<div class="flex flex-col lg:flex-row lg:items-start gap-4">
									<div class="lg:w-1/3">
										<label for={config.key} class="block text-sm font-semibold text-white">
											{config.label}
										</label>
										<p class="mt-1 text-xs text-neutral-500">{config.description}</p>
									</div>

									<div class="lg:flex-1 flex items-start gap-3">
										{#if config.type === 'boolean'}
											<label class="relative inline-flex items-center cursor-pointer">
												<input
													type="checkbox"
													id={config.key}
													checked={settings[config.key] === 'true'}
													onchange={(e) => handleChange(config.key, e.currentTarget.checked ? 'true' : 'false')}
													class="sr-only peer"
												/>
												<div class="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-neutral-400 after:border-neutral-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-checked:after:bg-white"></div>
												<span class="ms-3 text-sm text-neutral-400">
													{settings[config.key] === 'true' ? 'Enabled' : 'Disabled'}
												</span>
											</label>
										{:else if config.type === 'textarea'}
											<textarea
												id={config.key}
												bind:value={settings[config.key]}
												oninput={(e) => handleChange(config.key, e.currentTarget.value)}
												placeholder={config.placeholder}
												rows="3"
												class="input flex-1 resize-none"
											></textarea>
										{:else if config.type === 'select' && config.options}
											<select
												id={config.key}
												bind:value={settings[config.key]}
												onchange={(e) => handleChange(config.key, e.currentTarget.value)}
												class="select flex-1"
											>
												{#each config.options as option}
													<option value={option.value}>{option.label}</option>
												{/each}
											</select>
										{:else}
											<input
												type={config.type === 'number' ? 'number' : 'text'}
												id={config.key}
												bind:value={settings[config.key]}
												oninput={(e) => handleChange(config.key, e.currentTarget.value)}
												placeholder={config.placeholder}
												class="input flex-1"
											/>
										{/if}

										<button
											onclick={() => saveSetting(config.key)}
											disabled={savingKeys.has(config.key)}
											class="btn-ghost text-primary-400 hover:text-primary-300 flex items-center gap-1.5"
										>
											{#if savingKeys.has(config.key)}
												<Loader class="animate-spin h-4 w-4" />
											{:else}
												<Check class="w-4 h-4" />
											{/if}
											Save
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Current Settings Preview -->
				<div class="mt-6 card">
					<h3 class="text-sm font-bold text-white mb-4 flex items-center gap-2">
						<Code2 class="w-4 h-4 text-neutral-500" />
						Current {activeCategory} Values
					</h3>
					<div class="bg-surface-50 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-white/[0.06]">
						<pre class="text-neutral-400">{JSON.stringify(
							Object.fromEntries(
								settingsConfig
									.filter(s => s.category === activeCategory)
									.map(s => [s.key, settings[s.key]])
							),
							null,
							2
						)}</pre>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
