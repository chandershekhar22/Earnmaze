<script lang="ts">
	import { onMount } from 'svelte';
	
	let mode = $state<'allowlist' | 'blocklist'>('allowlist');
	let allowedCountries = $state<string[]>([]);
	let blockedCountries = $state<string[]>([]);
	let blockVPN = $state(true);
	let blockTOR = $state(true);
	let exemptPaths = $state<string[]>([]);
	
	let newCountry = $state('');
	let newExemptPath = $state('');
	
	let loading = $state(false);
	let message = $state('');
	
	// Popular countries list
	const popularCountries = [
		{ code: 'US', name: 'United States' },
		{ code: 'CA', name: 'Canada' },
		{ code: 'GB', name: 'United Kingdom' },
		{ code: 'AU', name: 'Australia' },
		{ code: 'IN', name: 'India' },
		{ code: 'PH', name: 'Philippines' },
		{ code: 'SG', name: 'Singapore' },
		{ code: 'MY', name: 'Malaysia' },
		{ code: 'NZ', name: 'New Zealand' },
		{ code: 'ZA', name: 'South Africa' },
		{ code: 'NG', name: 'Nigeria' },
		{ code: 'KE', name: 'Kenya' },
		{ code: 'GH', name: 'Ghana' },
		{ code: 'PK', name: 'Pakistan' },
		{ code: 'BD', name: 'Bangladesh' },
		{ code: 'LK', name: 'Sri Lanka' },
	];
	
	onMount(() => {
		loadCurrentSettings();
	});
	
	async function loadCurrentSettings() {
		// In a real implementation, this would load from API/database
		// For now, load from the geo-restriction config
		allowedCountries = ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'SG', 'IN', 'PH', 'MY', 'ZA', 'NG', 'KE', 'GH', 'PK', 'BD', 'LK', 'NP'];
		blockedCountries = ['KP', 'IR', 'SY', 'CU', 'VE'];
		exemptPaths = ['/api/analytics/conversions', '/api/track-visit', '/api/track-cta', '/', '/about', '/earn-money'];
	}
	
	function addCountry(list: 'allowed' | 'blocked') {
		const code = newCountry.toUpperCase().trim();
		if (!code || code.length !== 2) {
			message = 'Please enter a valid 2-letter country code';
			return;
		}
		
		if (list === 'allowed') {
			if (!allowedCountries.includes(code)) {
				allowedCountries = [...allowedCountries, code];
				message = `Added ${code} to allowed list`;
			}
		} else {
			if (!blockedCountries.includes(code)) {
				blockedCountries = [...blockedCountries, code];
				message = `Added ${code} to blocked list`;
			}
		}
		
		newCountry = '';
	}
	
	function removeCountry(code: string, list: 'allowed' | 'blocked') {
		if (list === 'allowed') {
			allowedCountries = allowedCountries.filter(c => c !== code);
		} else {
			blockedCountries = blockedCountries.filter(c => c !== code);
		}
		message = `Removed ${code} from ${list} list`;
	}
	
	function addExemptPath() {
		const path = newExemptPath.trim();
		if (!path || !path.startsWith('/')) {
			message = 'Path must start with /';
			return;
		}
		
		if (!exemptPaths.includes(path)) {
			exemptPaths = [...exemptPaths, path];
			message = `Added ${path} to exempt paths`;
		}
		
		newExemptPath = '';
	}
	
	function removeExemptPath(path: string) {
		exemptPaths = exemptPaths.filter(p => p !== path);
		message = `Removed ${path} from exempt paths`;
	}
	
	async function saveSettings() {
		loading = true;
		message = '';
		
		try {
			// In a real implementation, save to API/database
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			message = 'Settings saved successfully! Restart the server for changes to take effect.';
		} catch (error) {
			message = 'Error saving settings';
		} finally {
			loading = false;
		}
	}
	
	function quickAddCountry(code: string, list: 'allowed' | 'blocked') {
		if (list === 'allowed' && !allowedCountries.includes(code)) {
			allowedCountries = [...allowedCountries, code];
		} else if (list === 'blocked' && !blockedCountries.includes(code)) {
			blockedCountries = [...blockedCountries, code];
		}
	}
</script>

<svelte:head>
	<title>Geo-Restriction Settings - Admin</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-6xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">Geo-Restriction Settings</h1>
		<p class="text-gray-600">Control which countries can access your platform</p>
	</div>
	
	{#if message}
		<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
			{message}
		</div>
	{/if}
	
	<!-- Restriction Mode -->
	<div class="bg-white rounded-lg shadow-md p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Restriction Mode</h2>
		<div class="space-y-3">
			<label class="flex items-center gap-3 cursor-pointer">
				<input
					type="radio"
					name="mode"
					value="allowlist"
					checked={mode === 'allowlist'}
					onchange={() => mode = 'allowlist'}
					class="w-4 h-4"
				/>
				<div>
					<div class="font-medium">Allowlist Mode (Recommended)</div>
					<div class="text-sm text-gray-600">Only allow specific countries (deny all others)</div>
				</div>
			</label>
			
			<label class="flex items-center gap-3 cursor-pointer">
				<input
					type="radio"
					name="mode"
					value="blocklist"
					checked={mode === 'blocklist'}
					onchange={() => mode = 'blocklist'}
					class="w-4 h-4"
				/>
				<div>
					<div class="font-medium">Blocklist Mode</div>
					<div class="text-sm text-gray-600">Block specific countries (allow all others)</div>
				</div>
			</label>
		</div>
	</div>
	
	<!-- Security Options -->
	<div class="bg-white rounded-lg shadow-md p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Security Options</h2>
		<div class="space-y-3">
			<label class="flex items-center gap-3 cursor-pointer">
				<input
					type="checkbox"
					bind:checked={blockVPN}
					class="w-4 h-4"
				/>
				<div>
					<div class="font-medium">Block VPN/Proxy Connections</div>
					<div class="text-sm text-gray-600">Prevent access from VPN or proxy servers</div>
				</div>
			</label>
			
			<label class="flex items-center gap-3 cursor-pointer">
				<input
					type="checkbox"
					bind:checked={blockTOR}
					class="w-4 h-4"
				/>
				<div>
					<div class="font-medium">Block TOR Network</div>
					<div class="text-sm text-gray-600">Prevent access from TOR exit nodes</div>
				</div>
			</label>
		</div>
	</div>
	
	<!-- Country Management -->
	<div class="grid md:grid-cols-2 gap-6 mb-6">
		<!-- Allowed Countries -->
		<div class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-xl font-semibold mb-4">Allowed Countries ({allowedCountries.length})</h2>
			
			<div class="mb-4">
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={newCountry}
						placeholder="Country code (e.g., US)"
						class="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
						maxlength="2"
					/>
					<button
						onclick={() => addCountry('allowed')}
						class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
					>
						Add
					</button>
				</div>
			</div>
			
			<div class="mb-4">
				<p class="text-sm text-gray-600 mb-2">Quick add popular countries:</p>
				<div class="flex flex-wrap gap-2">
					{#each popularCountries.slice(0, 8) as country}
						<button
							onclick={() => quickAddCountry(country.code, 'allowed')}
							class="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
							disabled={allowedCountries.includes(country.code)}
						>
							{country.code} - {country.name}
						</button>
					{/each}
				</div>
			</div>
			
			<div class="max-h-64 overflow-y-auto space-y-2">
				{#each allowedCountries as country}
					<div class="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
						<span class="font-mono font-semibold text-green-700">{country}</span>
						<button
							onclick={() => removeCountry(country, 'allowed')}
							class="text-red-600 hover:text-red-700"
						>
							Remove
						</button>
					</div>
				{/each}
			</div>
		</div>
		
		<!-- Blocked Countries -->
		<div class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-xl font-semibold mb-4">Blocked Countries ({blockedCountries.length})</h2>
			
			<div class="mb-4">
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={newCountry}
						placeholder="Country code (e.g., KP)"
						class="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
						maxlength="2"
					/>
					<button
						onclick={() => addCountry('blocked')}
						class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
					>
						Add
					</button>
				</div>
			</div>
			
			<div class="max-h-64 overflow-y-auto space-y-2">
				{#each blockedCountries as country}
					<div class="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
						<span class="font-mono font-semibold text-red-700">{country}</span>
						<button
							onclick={() => removeCountry(country, 'blocked')}
							class="text-red-600 hover:text-red-700"
						>
							Remove
						</button>
					</div>
				{/each}
			</div>
		</div>
	</div>
	
	<!-- Exempt Paths -->
	<div class="bg-white rounded-lg shadow-md p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Exempt Paths</h2>
		<p class="text-sm text-gray-600 mb-4">These paths will bypass geo-restriction checks</p>
		
		<div class="mb-4">
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={newExemptPath}
					placeholder="/path/to/exempt"
					class="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
				/>
				<button
					onclick={addExemptPath}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
				>
					Add
				</button>
			</div>
		</div>
		
		<div class="space-y-2">
			{#each exemptPaths as path}
				<div class="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
					<code class="text-sm">{path}</code>
					<button
						onclick={() => removeExemptPath(path)}
						class="text-red-600 hover:text-red-700"
					>
						Remove
					</button>
				</div>
			{/each}
		</div>
	</div>
	
	<!-- Save Button -->
	<div class="flex justify-end">
		<button
			onclick={saveSettings}
			disabled={loading}
			class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
		>
			{loading ? 'Saving...' : 'Save Settings'}
		</button>
	</div>
</div>
