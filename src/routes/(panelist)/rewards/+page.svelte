<script lang="ts">
	import { Logger } from '$lib/utils/app-logger';
	import { Gift, ClipboardList, AlertTriangle, Loader2, Lightbulb, Check, Coins, Lock, Rocket, X, Clock, CircleCheckBig, CircleX, ChevronDown, ChevronUp, Shield } from '@lucide/svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import { untrack } from 'svelte';

	interface Reward {
		id: string; title: string; description: string | null; type: string; provider: string | null;
		category: string | null; pointsCost: number; originalPrice?: number; currency?: string;
		imageUrl?: string; stock?: number; isFeatured?: boolean; terms?: string | null; expiresAt?: string | null;
	}

	interface Redemption {
		id: string; type: string; provider: string | null; amount: number; value: number;
		status: string; rewardName: string; createdAt: string; completedAt: string | null;
	}

	let { data }: { data: { rewards: Reward[]; userPoints: number; redemptions: Redemption[] } } = $props();

	let rewards = $state<Reward[]>(untrack(() => data.rewards));
	let userPoints = $state(untrack(() => data.userPoints));
	let redemptions = $state<Redemption[]>(untrack(() => data.redemptions));
	let redeeming = $state<string | null>(null);

	// Modal state
	let confirmModal = $state<{ reward: Reward } | null>(null);
	let otpModal = $state<{ reward: Reward } | null>(null);
	let otpCode = $state('');
	let otpError = $state('');
	let otpSending = $state(false);
	let successModal = $state<{ rewardName: string; points: number; redemptionId: string } | null>(null);
	let errorModal = $state<string | null>(null);

	// Redemptions section
	let showRedemptions = $state(false);

	function openConfirm(reward: Reward) {
		if (userPoints < reward.pointsCost) return;
		confirmModal = { reward };
	}

	// Step 1: Send OTP
	async function confirmRedeem() {
		if (!confirmModal) return;
		const reward = confirmModal.reward;
		confirmModal = null;
		redeeming = reward.id;

		try {
			const response = await fetch('/api/rewards/redeem', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ rewardId: reward.id })
			});
			const result = await response.json();
			if (response.ok && result.success) {
				otpCode = '';
				otpError = '';
				otpModal = { reward };
			} else {
				errorModal = result.message || 'Failed to send verification code.';
			}
		} catch (error) {
			Logger.root.error({ context: 'errors', error }, 'Failed to send redemption OTP');
			errorModal = 'Network error. Please try again.';
		} finally {
			redeeming = null;
		}
	}

	// Step 2: Verify OTP and process redemption
	async function confirmOtp() {
		if (!otpModal || otpCode.length !== 6) return;
		const reward = otpModal.reward;
		otpSending = true;
		otpError = '';

		try {
			const response = await fetch('/api/rewards/redeem', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ otp: otpCode })
			});
			const result = await response.json();
			if (response.ok && result.success) {
				otpModal = null;
				userPoints -= reward.pointsCost;
				rewards = rewards.map(r => r.id === reward.id && r.stock !== undefined ? { ...r, stock: r.stock - 1 } : r);
				redemptions = [{ id: result.data.redemptionId, type: 'gift_card', provider: reward.provider, amount: reward.pointsCost, value: reward.originalPrice ?? 0, status: 'pending', rewardName: reward.title, createdAt: new Date().toISOString(), completedAt: null }, ...redemptions];
				successModal = { rewardName: reward.title, points: reward.pointsCost, redemptionId: result.data.redemptionId };
			} else {
				otpError = result.message || 'Invalid code. Please try again.';
			}
		} catch {
			otpError = 'Network error. Please try again.';
		} finally {
			otpSending = false;
		}
	}

	let cancellingId = $state<string | null>(null);

	async function cancelRedemption(id: string, amount: number) {
		if (!confirm('Cancel this redemption? Your points will be refunded.')) return;
		cancellingId = id;
		try {
			const res = await fetch(`/api/rewards/redeem/${id}`, { method: 'DELETE' });
			const result = await res.json();
			if (res.ok && result.success) {
				redemptions = redemptions.map(r => r.id === id ? { ...r, status: 'cancelled' } : r);
				userPoints += amount;
			} else {
				errorModal = result.message || 'Failed to cancel redemption.';
			}
		} catch {
			errorModal = 'Network error. Please try again.';
		} finally {
			cancellingId = null;
		}
	}

	function canAfford(pointsCost: number) { return userPoints >= pointsCost; }

	function getStatusStyle(status: string) {
		switch (status) {
			case 'pending': return { class: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20', icon: Clock };
			case 'processing': return { class: 'bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/20', icon: Loader2 };
			case 'completed': return { class: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20', icon: CircleCheckBig };
			case 'failed': case 'cancelled': return { class: 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20', icon: CircleX };
			default: return { class: 'bg-white/5 text-neutral-400 ring-1 ring-white/10', icon: Clock };
		}
	}

	function formatDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
</script>

<svelte:head>
	<title>Rewards - EarnMaze</title>
</svelte:head>

<div class="space-y-6 animate-fade-in">
	<InfoBanner id="rewards-how" message="Click 'Redeem' on any reward to submit a redemption request. Our team reviews requests and processes them within 24-48 hours. Track your request status in 'My Redemptions'." color="emerald" />

	<!-- Balance Bar -->
	<div class="flex items-center justify-between bg-surface-100 border border-white/[0.06] rounded-2xl px-5 py-4">
		<div class="flex items-center gap-3">
			<div class="p-2 bg-emerald-500/10 rounded-xl">
				<Coins class="w-5 h-5 text-emerald-400" />
			</div>
			<div>
				<div class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Your Balance</div>
				<div class="text-xl font-black text-white">{userPoints.toLocaleString()} <span class="text-sm font-medium text-neutral-600">pts</span></div>
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if redemptions.length > 0}
				<button onclick={() => showRedemptions = !showRedemptions} class="btn-secondary !text-xs !py-2">
					{showRedemptions ? 'Hide' : 'My Redemptions'} ({redemptions.length})
				</button>
			{/if}
			<a href="/surveys" class="btn-primary !text-xs !py-2">
				<Rocket class="w-3.5 h-3.5" /> Earn More
			</a>
		</div>
	</div>

	<!-- Redemptions Tracker -->
	{#if showRedemptions && redemptions.length > 0}
		<div class="card !p-0 overflow-hidden animate-scale-in">
			<div class="px-5 py-3 border-b border-white/[0.06]">
				<h2 class="text-sm font-bold text-white">My Redemptions</h2>
			</div>
			<div class="divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
				{#each redemptions as r}
					{@const ss = getStatusStyle(r.status)}
					<div class="flex items-center gap-3 px-5 py-3">
						<div class="p-1.5 {ss.class} rounded-lg flex-shrink-0">
							<ss.icon class="w-3.5 h-3.5" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-white truncate">{r.rewardName}</div>
							<div class="text-[10px] text-neutral-600">{formatDate(r.createdAt)}</div>
						</div>
						<div class="text-right flex-shrink-0 flex items-center gap-2">
							<div>
								<div class="text-xs font-bold text-white">{r.amount.toLocaleString()} pts</div>
								<span class="badge {ss.class} text-[9px]">{r.status}</span>
							</div>
							{#if r.status === 'pending'}
								<button
									onclick={() => cancelRedemption(r.id, r.amount)}
									disabled={cancellingId === r.id}
									class="p-1.5 rounded-lg text-neutral-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
									title="Cancel redemption"
								>
									{#if cancellingId === r.id}
										<Loader2 class="w-3.5 h-3.5 animate-spin" />
									{:else}
										<X class="w-3.5 h-3.5" />
									{/if}
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Rewards Grid -->
	{#if rewards.length === 0}
		<div class="card text-center py-20">
			<div class="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4">
				<Gift class="w-8 h-8 text-neutral-600" />
			</div>
			<h3 class="text-lg font-bold text-white mb-2">No rewards available</h3>
			<p class="text-neutral-500 mb-6 max-w-xs mx-auto text-sm">Check back later for new reward opportunities.</p>
			<a href="/surveys" class="btn-primary"><ClipboardList class="w-4 h-4" /> Earn Points</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each rewards as reward, index}
				<div class="group bg-surface-100 border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/10 hover:shadow-xl transition-all duration-300 animate-slide-up" style="animation-delay: {index * 50}ms">
					{#if reward.imageUrl}
						<img src={reward.imageUrl} alt={reward.title} class="w-full h-44 object-cover" loading="lazy" decoding="async" />
					{:else}
						<div class="w-full h-44 bg-gradient-to-br from-primary-500/10 via-fuchsia-500/5 to-surface-200 flex items-center justify-center">
							<div class="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur flex items-center justify-center">
								<Gift class="w-8 h-8 text-primary-400/60" />
							</div>
						</div>
					{/if}

					<div class="p-5">
						<div class="flex items-start justify-between gap-2 mb-2">
							<h3 class="text-base font-bold text-white">{reward.title}</h3>
							{#if !canAfford(reward.pointsCost)}
								<div class="p-1 bg-rose-500/10 rounded-lg flex-shrink-0"><Lock class="w-3.5 h-3.5 text-rose-400" /></div>
							{/if}
						</div>
						<p class="text-neutral-500 text-sm mb-4 line-clamp-2">{reward.description}</p>
						<div class="flex items-center justify-between mb-4">
							<div class="flex items-baseline gap-1.5">
								<span class="text-xl font-black text-primary-400">{reward.pointsCost.toLocaleString()}</span>
								<span class="text-xs text-neutral-600 font-medium">pts</span>
							</div>
							{#if reward.originalPrice}
								<span class="badge-neutral text-[10px]">Value: ${reward.originalPrice}</span>
							{/if}
						</div>
						{#if reward.stock !== undefined && reward.stock <= 10 && reward.stock > 0}
							<div class="flex items-center gap-1.5 text-xs text-amber-400 mb-3 bg-amber-500/10 px-3 py-1.5 rounded-lg ring-1 ring-amber-500/20">
								<AlertTriangle class="w-3.5 h-3.5" /> Only {reward.stock} left
							</div>
						{/if}
						<button
							onclick={() => openConfirm(reward)}
							disabled={!canAfford(reward.pointsCost) || redeeming === reward.id || (reward.stock !== undefined && reward.stock <= 0)}
							class="w-full {canAfford(reward.pointsCost) && reward.stock !== 0 ? 'btn-primary' : 'btn bg-white/[0.04] text-neutral-600 border-white/[0.04] cursor-not-allowed'}"
						>
							{#if redeeming === reward.id}
								<Loader2 class="w-4 h-4 animate-spin" /> Processing...
							{:else if reward.stock !== undefined && reward.stock <= 0}
								Out of Stock
							{:else if !canAfford(reward.pointsCost)}
								Need {(reward.pointsCost - userPoints).toLocaleString()} more
							{:else}
								<Gift class="w-4 h-4" /> Redeem
							{/if}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Tips -->
	<div class="relative overflow-hidden bg-surface-100 border border-primary-500/10 rounded-2xl p-5 md:p-6">
		<div class="absolute -top-16 -right-16 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl"></div>
		<div class="relative flex items-start gap-4">
			<div class="p-2.5 bg-primary-500/10 rounded-xl flex-shrink-0"><Lightbulb class="w-5 h-5 text-primary-400" /></div>
			<div>
				<h2 class="text-sm font-bold text-white mb-3">Tips to Earn More</h2>
				<ul class="text-sm text-neutral-500 space-y-2">
					<li class="flex items-start gap-2"><Check class="w-4 h-4 text-primary-500/60 mt-0.5 flex-shrink-0" /> Complete surveys regularly to maximize earnings</li>
					<li class="flex items-start gap-2"><Check class="w-4 h-4 text-primary-500/60 mt-0.5 flex-shrink-0" /> Look for high-value surveys with bonus points</li>
					<li class="flex items-start gap-2"><Check class="w-4 h-4 text-primary-500/60 mt-0.5 flex-shrink-0" /> Provide quality responses to unlock more opportunities</li>
				</ul>
			</div>
		</div>
	</div>
</div>

<!-- ═══ CONFIRM MODAL ═══ -->
{#if confirmModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onclick={() => { if (!redeeming) confirmModal = null; }} onkeydown={(e) => { if (e.key === 'Escape' && !redeeming) confirmModal = null; }}>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="bg-surface-100 rounded-2xl border border-white/[0.06] shadow-2xl max-w-sm w-full p-6 animate-scale-in" onclick={(e) => e.stopPropagation()}>
			<div class="text-center mb-5">
				<div class="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
					<Gift class="w-7 h-7 text-primary-400" />
				</div>
				<h3 class="text-lg font-bold text-white">Confirm Redemption</h3>
			</div>
			<div class="bg-surface-200 rounded-xl p-4 mb-5">
				<div class="text-sm font-semibold text-white mb-1">{confirmModal.reward.title}</div>
				<div class="flex items-center justify-between text-xs text-neutral-400 mt-2">
					<span>Points to spend</span>
					<span class="font-bold text-white">{confirmModal.reward.pointsCost.toLocaleString()}</span>
				</div>
				<div class="flex items-center justify-between text-xs text-neutral-400 mt-1">
					<span>Balance after</span>
					<span class="font-bold text-emerald-400">{(userPoints - confirmModal.reward.pointsCost).toLocaleString()}</span>
				</div>
			</div>
			<p class="text-xs text-neutral-500 mb-3 text-center">A verification code will be sent to your registered email. Your gift card will also be delivered to the same email.</p>
			<div class="flex gap-3">
				<button onclick={() => confirmModal = null} class="btn-secondary flex-1">Cancel</button>
				<button onclick={confirmRedeem} class="btn-primary flex-1"><Gift class="w-4 h-4" /> Confirm</button>
			</div>
		</div>
	</div>
{/if}

<!-- ═══ OTP VERIFICATION MODAL ═══ -->
{#if otpModal}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onclick={() => { if (!otpSending) otpModal = null; }} onkeydown={(e) => { if (e.key === 'Escape' && !otpSending) otpModal = null; }}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="bg-surface-100 border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onclick={(e) => e.stopPropagation()}>
			<div class="text-center mb-5">
				<div class="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
					<Shield class="w-6 h-6 text-primary-400" />
				</div>
				<h3 class="text-lg font-bold text-white">Verify Redemption</h3>
				<p class="text-sm text-neutral-500 mt-1">Enter the 6-digit code sent to your email</p>
			</div>

			<div class="space-y-4">
				<div class="text-center">
					<p class="text-xs text-neutral-400 mb-2">Redeeming: <strong class="text-white">{otpModal.reward.title}</strong></p>
					<p class="text-xs text-neutral-500">{otpModal.reward.pointsCost.toLocaleString()} points</p>
				</div>

				<input
					type="text"
					bind:value={otpCode}
					placeholder="000000"
					maxlength="6"
					class="input text-center text-2xl font-mono tracking-[0.5em] !py-3"
					oninput={(e) => { otpCode = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6); otpError = ''; }}
					onkeydown={(e) => { if (e.key === 'Enter' && otpCode.length === 6) confirmOtp(); }}
					autofocus
				/>

				{#if otpError}
					<p class="text-xs text-rose-400 text-center">{otpError}</p>
				{/if}

				<div class="flex gap-3">
					<button onclick={() => otpModal = null} disabled={otpSending} class="btn-secondary flex-1">Cancel</button>
					<button onclick={confirmOtp} disabled={otpSending || otpCode.length !== 6} class="btn-primary flex-1">
						{#if otpSending}
							<Loader2 class="w-4 h-4 animate-spin" /> Verifying...
						{:else}
							Confirm
						{/if}
					</button>
				</div>

				<p class="text-[10px] text-neutral-600 text-center">Code expires in 5 minutes. Your gift card will be sent to the same email.</p>
			</div>
		</div>
	</div>
{/if}

<!-- ═══ SUCCESS MODAL ═══ -->
{#if successModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onclick={() => successModal = null} onkeydown={(e) => e.key === 'Escape' && (successModal = null)}>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="bg-surface-100 rounded-2xl border border-white/[0.06] shadow-2xl max-w-sm w-full p-6 animate-scale-in" onclick={(e) => e.stopPropagation()}>
			<div class="text-center">
				<div class="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
					<CircleCheckBig class="w-7 h-7 text-emerald-400" />
				</div>
				<h3 class="text-lg font-bold text-white mb-1">Request Submitted!</h3>
				<p class="text-sm text-neutral-400 mb-4">{successModal.rewardName}</p>
				<div class="bg-surface-200 rounded-xl p-3 mb-5">
					<div class="flex items-center justify-between text-xs">
						<span class="text-neutral-500">Points spent</span>
						<span class="font-bold text-white">{successModal.points.toLocaleString()}</span>
					</div>
					<div class="flex items-center justify-between text-xs mt-1.5">
						<span class="text-neutral-500">Status</span>
						<span class="badge bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20 text-[10px]">Pending Review</span>
					</div>
				</div>
				<p class="text-[10px] text-neutral-600 mb-5">You can track your redemption status above. We'll process it shortly.</p>
				<button onclick={() => { successModal = null; showRedemptions = true; }} class="btn-primary w-full">
					<Check class="w-4 h-4" /> Done
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ═══ ERROR MODAL ═══ -->
{#if errorModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onclick={() => errorModal = null} onkeydown={(e) => e.key === 'Escape' && (errorModal = null)}>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="bg-surface-100 rounded-2xl border border-white/[0.06] shadow-2xl max-w-sm w-full p-6 animate-scale-in" onclick={(e) => e.stopPropagation()}>
			<div class="text-center">
				<div class="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
					<CircleX class="w-7 h-7 text-rose-400" />
				</div>
				<h3 class="text-lg font-bold text-white mb-2">Redemption Failed</h3>
				<p class="text-sm text-neutral-400 mb-5">{errorModal}</p>
				<button onclick={() => errorModal = null} class="btn-secondary w-full">Close</button>
			</div>
		</div>
	</div>
{/if}
