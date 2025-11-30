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
			Logger.errors.error('Failed to fetch profile', { error });
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
			Logger.errors.error('Failed to save profile', { error });
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

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">My Profile</h1>
		<p class="text-gray-600">Manage your account information and survey preferences</p>
	</div>

	{#if message}
		<div class="rounded-md {message.includes('successfully') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} p-4">
			<p class="{message.includes('successfully') ? 'text-green-700' : 'text-red-700'} text-sm">{message}</p>
		</div>
	{/if}

	{#if loading}
		<div class="text-center py-12">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
			<p class="mt-2 text-gray-600">Loading profile...</p>
		</div>
	{:else}
		<form onsubmit={(e) => { e.preventDefault(); saveProfile(); }} class="space-y-6">
			<!-- Basic Information -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
						<input 
							type="text" 
							id="name" 
							bind:value={profile.name}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							required
						/>
					</div>
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
						<input 
							type="email" 
							id="email" 
							bind:value={profile.email}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							required
							disabled
						/>
						<p class="text-xs text-gray-500 mt-1">Email cannot be changed. Contact support if needed.</p>
					</div>
				</div>
			</div>

			<!-- Demographics -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Demographics</h2>
				<p class="text-sm text-gray-600 mb-4">This information helps us match you with relevant surveys. All information is kept confidential.</p>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="age" class="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
						<select 
							id="age" 
							bind:value={profile.demographics.age}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						>
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
						<label for="gender" class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
						<select 
							id="gender" 
							bind:value={profile.demographics.gender}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						>
							<option value="">Select gender</option>
							<option value="male">Male</option>
							<option value="female">Female</option>
							<option value="non-binary">Non-binary</option>
							<option value="prefer-not-to-say">Prefer not to say</option>
						</select>
					</div>

					<div>
						<label for="education" class="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
						<select 
							id="education" 
							bind:value={profile.demographics.education}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						>
							<option value="">Select education level</option>
							<option value="high-school">High School</option>
							<option value="some-college">Some College</option>
							<option value="bachelors">Bachelor's Degree</option>
							<option value="masters">Master's Degree</option>
							<option value="doctorate">Doctorate</option>
						</select>
					</div>

					<div>
						<label for="employment" class="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
						<select 
							id="employment" 
							bind:value={profile.demographics.employment}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						>
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
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Survey Preferences</h2>
				<p class="text-sm text-gray-600 mb-4">Select categories you're interested in to receive more relevant survey invitations.</p>
				
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
					{#each surveyCategories as category}
						<label class="flex items-center space-x-2 cursor-pointer">
							<input 
								type="checkbox" 
								checked={profile.preferences.surveyCategories.includes(category)}
								onchange={() => toggleCategory(category)}
								class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
							/>
							<span class="text-sm text-gray-700">{category}</span>
						</label>
					{/each}
				</div>
			</div>

			<!-- Notification Preferences -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
				
				<div class="space-y-3">
					<label class="flex items-center space-x-3">
						<input 
							type="checkbox" 
							bind:checked={profile.preferences.emailNotifications}
							class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
						/>
						<div>
							<span class="text-sm font-medium text-gray-700">Email Notifications</span>
							<p class="text-xs text-gray-500">Receive survey invitations and updates via email</p>
						</div>
					</label>

					<label class="flex items-center space-x-3">
						<input 
							type="checkbox" 
							bind:checked={profile.preferences.smsNotifications}
							class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
						/>
						<div>
							<span class="text-sm font-medium text-gray-700">SMS Notifications</span>
							<p class="text-xs text-gray-500">Receive important updates via text message</p>
						</div>
					</label>
				</div>
			</div>

			<!-- Save Button -->
			<div class="flex justify-end">
				<button 
					type="submit" 
					disabled={saving}
					class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
				>
					{#if saving}
						<div class="flex items-center">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Saving...
						</div>
					{:else}
						Save Changes
					{/if}
				</button>
			</div>
		</form>
	{/if}
</div>
