<script lang="ts">
	import { Logger } from '$lib/utils/app-logger';
	import { Gift, ClipboardList, AlertTriangle, Loader2, Lightbulb, Check, Coins, Lock, Rocket, X, Clock, CircleCheckBig, CircleX, Shield } from '@lucide/svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';
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
				errorModal = result.message || m.rwd_error_send_otp();
			}
		} catch (error) {
			Logger.root.error({ context: 'errors', error }, 'Failed to send redemption OTP');
			errorModal = m.rwd_error_network();
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
				otpError = result.message || m.rwd_error_invalid_otp();
			}
		} catch {
			otpError = m.rwd_error_network();
		} finally {
			otpSending = false;
		}
	}

	let cancellingId = $state<string | null>(null);

	async function cancelRedemption(id: string, amount: number) {
		if (!confirm(m.rwd_confirm_cancel_msg())) return;
		cancellingId = id;
		try {
			const res = await fetch(`/api/rewards/redeem/${id}`, { method: 'DELETE' });
			const result = await res.json();
			if (res.ok && result.success) {
				redemptions = redemptions.map(r => r.id === id ? { ...r, status: 'cancelled' } : r);
				userPoints += amount;
			} else {
				errorModal = result.message || m.rwd_error_cancel_failed();
			}
		} catch {
			errorModal = m.rwd_error_network();
		} finally {
			cancellingId = null;
		}
	}

	function statusLabel(status: string) {
		const labels: Record<string, string> = {
			pending: m.rwd_status_pending(),
			processing: m.rwd_status_processing(),
			completed: m.rwd_status_completed(),
			failed: m.rwd_status_failed(),
			cancelled: m.rwd_status_cancelled(),
		};
		return labels[status] || status;
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

	function formatDate(d: string) { return new Date(d).toLocaleDateString(getLocale(), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
</script>

<svelte:head>
	<title>{m.rwd_meta_title()}</title>
</svelte:head>

<div class="space-y-[22px] animate-fade-in">
	<InfoBanner id="rewards-how" message={m.rwd_info()} color="emerald" />

	<!-- Balance Strip -->
	<div class="flex items-center justify-between gap-5 px-6 py-5 rounded-2xl bg-surface-50 border border-white/[0.07] flex-wrap">
		<div class="flex items-center gap-3.5">
			<span class="w-[42px] h-[42px] rounded-[11px] bg-primary-400/12 border border-primary-400/20 text-primary-500 grid place-items-center">
				<Coins class="w-5 h-5" />
			</span>
			<div>
				<div class="font-mono text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.14em]">{m.rwd_your_balance()}</div>
				<div class="text-[30px] font-bold text-white tracking-tight leading-none mt-1">
					{userPoints.toLocaleString()} <span class="text-sm font-medium text-neutral-500">{m.rwd_pts()}</span>
				</div>
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if redemptions.length > 0}
				<button onclick={() => showRedemptions = !showRedemptions} class="btn-secondary !text-xs !py-2">
					{showRedemptions ? m.rwd_hide_redemptions() : m.rwd_show_redemptions()} ({redemptions.length})
				</button>
			{/if}
			<a href={localizeHref('/surveys')} class="btn-primary">
				<Rocket class="w-4 h-4" /> {m.rwd_earn_more()}
			</a>
		</div>
	</div>

	<!-- Redemptions Tracker -->
	{#if showRedemptions && redemptions.length > 0}
		<div class="em-panel animate-scale-in">
			<div class="em-panel-h">
				<span class="em-panel-title">{m.rwd_my_redemptions_title()}</span>
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
							<div class="font-mono text-[10px] text-neutral-500">{formatDate(r.createdAt)}</div>
						</div>
						<div class="text-end flex-shrink-0 flex items-center gap-2">
							<div>
								<div class="font-mono text-xs font-bold text-white">{r.amount.toLocaleString()} {m.rwd_pts()}</div>
								<span class="badge {ss.class} text-[9px]">{statusLabel(r.status)}</span>
							</div>
							{#if r.status === 'pending'}
								<button
									onclick={() => cancelRedemption(r.id, r.amount)}
									disabled={cancellingId === r.id}
									class="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
									title={m.rwd_cancel_title()}
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
		<div class="em-panel">
			<div class="em-empty">
				<span class="em-empty-icon"><Gift class="w-[30px] h-[30px]" /></span>
				<h4 class="text-[17px] font-semibold text-white tracking-tight">{m.rwd_no_rewards_title()}</h4>
				<p class="text-[13.5px] text-neutral-400 mb-4">{m.rwd_no_rewards_desc()}</p>
				<a href={localizeHref('/surveys')} class="btn-primary"><ClipboardList class="w-4 h-4" /> {m.rwd_earn_points_btn()}</a>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each rewards as reward, index}
				<div class="group bg-surface-50 border border-white/[0.07] rounded-2xl overflow-hidden hover:border-white/[0.13] hover:-translate-y-0.5 transition-all duration-300 animate-slide-up" style="animation-delay: {index * 50}ms">
					{#if reward.imageUrl}
						<img src={reward.imageUrl} alt={reward.title} class="w-full h-44 object-cover" loading="lazy" decoding="async" />
					{:else}
						<div class="w-full h-44 bg-gradient-to-br from-primary-400/15 via-fuchsia-500/8 to-surface-100 flex items-center justify-center">
							<div class="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur flex items-center justify-center">
								<Gift class="w-8 h-8 text-primary-400/70" />
							</div>
						</div>
					{/if}

					<div class="p-5">
						<div class="flex items-start justify-between gap-2 mb-2">
							<h3 class="text-base font-semibold text-white tracking-tight">{reward.title}</h3>
							{#if !canAfford(reward.pointsCost)}
								<div class="p-1 bg-rose-500/10 rounded-lg flex-shrink-0"><Lock class="w-3.5 h-3.5 text-rose-400" /></div>
							{/if}
						</div>
						<p class="text-neutral-400 text-sm mb-4 line-clamp-2">{reward.description}</p>
						<div class="flex items-center justify-between mb-4">
							<div class="flex items-baseline gap-1.5">
								<span class="font-mono text-xl font-bold text-primary-400">{reward.pointsCost.toLocaleString()}</span>
								<span class="text-xs text-neutral-500 font-medium">{m.rwd_pts()}</span>
							</div>
							{#if reward.originalPrice}
								<span class="badge-neutral text-[10px]">{m.rwd_value_label({ price: reward.originalPrice })}</span>
							{/if}
						</div>
						{#if reward.stock !== undefined && reward.stock <= 10 && reward.stock > 0}
							<div class="flex items-center gap-1.5 text-xs text-amber-400 mb-3 bg-amber-500/10 px-3 py-1.5 rounded-lg ring-1 ring-amber-500/20">
								<AlertTriangle class="w-3.5 h-3.5" /> {m.rwd_only_left({ count: reward.stock })}
							</div>
						{/if}
						<button
							onclick={() => openConfirm(reward)}
							disabled={!canAfford(reward.pointsCost) || redeeming === reward.id || (reward.stock !== undefined && reward.stock <= 0)}
							class="w-full {canAfford(reward.pointsCost) && reward.stock !== 0 ? 'btn-primary' : 'btn bg-white/[0.04] text-neutral-500 border-white/[0.04] cursor-not-allowed'}"
						>
							{#if redeeming === reward.id}
								<Loader2 class="w-4 h-4 animate-spin" /> {m.rwd_processing_btn()}
							{:else if reward.stock !== undefined && reward.stock <= 0}
								{m.rwd_out_of_stock()}
							{:else if !canAfford(reward.pointsCost)}
								{m.rwd_need_more({ count: (reward.pointsCost - userPoints).toLocaleString() })}
							{:else}
								<Gift class="w-4 h-4" /> {m.rwd_redeem()}
							{/if}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Tips -->
	<div class="rounded-2xl bg-surface-50 border border-white/[0.07] p-6">
		<div class="flex items-center gap-3.5 mb-5">
			<span class="w-10 h-10 rounded-[11px] bg-amber-400/12 text-amber-400 grid place-items-center">
				<Lightbulb class="w-5 h-5" />
			</span>
			<div>
				<h3 class="text-[15px] font-semibold text-white tracking-tight">{m.rwd_tips_title()}</h3>
				<p class="text-[12.5px] text-neutral-400">Maximize your points</p>
			</div>
		</div>
		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-3 text-[13.5px] text-neutral-400"><Check class="w-4 h-4 text-primary-500 flex-shrink-0" /> {m.rwd_tip_1()}</div>
			<div class="flex items-center gap-3 text-[13.5px] text-neutral-400"><Check class="w-4 h-4 text-primary-500 flex-shrink-0" /> {m.rwd_tip_2()}</div>
			<div class="flex items-center gap-3 text-[13.5px] text-neutral-400"><Check class="w-4 h-4 text-primary-500 flex-shrink-0" /> {m.rwd_tip_3()}</div>
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
				<h3 class="text-lg font-bold text-white">{m.rwd_confirm_title()}</h3>
			</div>
			<div class="bg-surface-200 rounded-xl p-4 mb-5">
				<div class="text-sm font-semibold text-white mb-1">{confirmModal.reward.title}</div>
				<div class="flex items-center justify-between text-xs text-neutral-400 mt-2">
					<span>{m.rwd_confirm_pts_spend()}</span>
					<span class="font-bold text-white">{confirmModal.reward.pointsCost.toLocaleString()}</span>
				</div>
				<div class="flex items-center justify-between text-xs text-neutral-400 mt-1">
					<span>{m.rwd_confirm_balance_after()}</span>
					<span class="font-bold text-emerald-400">{(userPoints - confirmModal.reward.pointsCost).toLocaleString()}</span>
				</div>
			</div>
			<p class="text-xs text-neutral-500 mb-3 text-center">{m.rwd_confirm_otp_note()}</p>
			<div class="flex gap-3">
				<button onclick={() => confirmModal = null} class="btn-secondary flex-1">{m.common_cancel()}</button>
				<button onclick={confirmRedeem} class="btn-primary flex-1"><Gift class="w-4 h-4" /> {m.rwd_confirm_btn()}</button>
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
				<h3 class="text-lg font-bold text-white">{m.rwd_otp_title()}</h3>
				<p class="text-sm text-neutral-500 mt-1">{m.rwd_otp_subtitle()}</p>
			</div>

			<div class="space-y-4">
				<div class="text-center">
					<p class="text-xs text-neutral-400 mb-2">{m.rwd_otp_redeeming()} <strong class="text-white">{otpModal.reward.title}</strong></p>
					<p class="text-xs text-neutral-500">{m.rwd_otp_pts({ count: otpModal.reward.pointsCost.toLocaleString() })}</p>
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
					<button onclick={() => otpModal = null} disabled={otpSending} class="btn-secondary flex-1">{m.common_cancel()}</button>
					<button onclick={confirmOtp} disabled={otpSending || otpCode.length !== 6} class="btn-primary flex-1">
						{#if otpSending}
							<Loader2 class="w-4 h-4 animate-spin" /> {m.rwd_otp_verifying()}
						{:else}
							{m.rwd_confirm_btn()}
						{/if}
					</button>
				</div>

				<p class="text-[10px] text-neutral-600 text-center">{m.rwd_otp_expires()}</p>
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
				<h3 class="text-lg font-bold text-white mb-1">{m.rwd_success_title()}</h3>
				<p class="text-sm text-neutral-400 mb-4">{successModal.rewardName}</p>
				<div class="bg-surface-200 rounded-xl p-3 mb-5">
					<div class="flex items-center justify-between text-xs">
						<span class="text-neutral-500">{m.rwd_success_pts_spent()}</span>
						<span class="font-bold text-white">{successModal.points.toLocaleString()}</span>
					</div>
					<div class="flex items-center justify-between text-xs mt-1.5">
						<span class="text-neutral-500">{m.rwd_success_status()}</span>
						<span class="badge bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20 text-[10px]">{m.rwd_success_pending_review()}</span>
					</div>
				</div>
				<p class="text-[10px] text-neutral-600 mb-5">{m.rwd_success_track_note()}</p>
				<button onclick={() => { successModal = null; showRedemptions = true; }} class="btn-primary w-full">
					<Check class="w-4 h-4" /> {m.rwd_success_done()}
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
				<h3 class="text-lg font-bold text-white mb-2">{m.rwd_error_title()}</h3>
				<p class="text-sm text-neutral-400 mb-5">{errorModal}</p>
				<button onclick={() => errorModal = null} class="btn-secondary w-full">{m.rwd_error_close()}</button>
			</div>
		</div>
	</div>
{/if}
