<script lang="ts">
	import type { PageData } from './$types';
	import { Users, Copy, Check, Clock, CircleCheckBig, Coins, Share2 } from '@lucide/svelte';
	import { browser } from '$app/environment';
	import InfoBanner from '$lib/components/InfoBanner.svelte';

	let { data }: { data: PageData } = $props();

	let referralCode = $derived(data.referralCode);
	let referralLink = $derived(referralCode && browser ? `${window.location.origin}/register?ref=${referralCode}` : '');
	let referrals = $derived(data.referrals);
	let stats = $derived(data.stats);

	let copied = $state(false);

	function copyLink() {
		if (!referralLink) return;
		navigator.clipboard.writeText(referralLink);
		copied = true;
		setTimeout(() => copied = false, 2000);
	}

	function getStatusStyle(status: string) {
		switch (status) {
			case 'pending': return { class: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20', icon: Clock, label: 'Pending' };
			case 'qualified': return { class: 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/20', icon: CircleCheckBig, label: 'Qualified' };
			case 'completed': case 'paid': return { class: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20', icon: Coins, label: 'Paid' };
			case 'expired': return { class: 'bg-neutral-500/15 text-neutral-400 ring-1 ring-neutral-500/20', icon: Clock, label: 'Expired' };
			default: return { class: 'bg-white/5 text-neutral-400 ring-1 ring-white/10', icon: Clock, label: status };
		}
	}

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function relDate(d: string) {
		const ms = Date.now() - new Date(d).getTime();
		const days = Math.floor(ms / 86400000);
		if (days < 1) return 'today';
		if (days === 1) return 'yesterday';
		if (days < 7) return `${days}d ago`;
		return formatDate(d);
	}
</script>

<svelte:head>
	<title>Referrals - EarnMaze</title>
</svelte:head>

<div class="space-y-[22px] animate-fade-in">
	<InfoBanner id="referral-how" message="Share your referral link with friends. When they sign up and complete their first survey, you both earn bonus points!" color="emerald" />

	<!-- Invite Card -->
	{#if referralCode}
		<div class="relative overflow-hidden rounded-[20px] border border-white/[0.13] bg-gradient-to-br from-fuchsia-500/[0.12] via-surface-100/60 to-surface-50/60 p-6 md:p-7">
			<div class="absolute -left-16 -bottom-16 w-60 h-60 rounded-full bg-fuchsia-500/[0.18] blur-[34px] pointer-events-none"></div>
			<div class="relative">
				<div class="flex items-center gap-3.5 mb-4">
					<span class="w-12 h-12 rounded-[13px] bg-fuchsia-500/15 border border-fuchsia-400/25 text-fuchsia-400 grid place-items-center">
						<Share2 class="w-6 h-6" />
					</span>
					<div>
						<h2 class="text-[19px] font-bold text-white tracking-tight">Invite friends</h2>
						<p class="text-[13px] text-neutral-400">Share your link and earn bonus points</p>
					</div>
				</div>

				<div class="flex gap-2 mb-4">
					<div class="flex-1 px-4 py-3 rounded-xl bg-surface/50 border border-white/[0.07] font-mono text-[13px] text-primary-500 truncate">
						{referralLink || 'Loading...'}
					</div>
					<button onclick={copyLink} class="btn-primary flex-shrink-0">
						{#if copied}
							<Check class="w-4 h-4" /> Copied
						{:else}
							<Copy class="w-4 h-4" /> Copy
						{/if}
					</button>
				</div>

				<div class="font-mono text-[12.5px] text-neutral-500">
					Your code: <span class="text-white font-semibold tracking-[0.04em]">{referralCode}</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Stats -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3.5">
		<div class="em-stat">
			<span class="absolute top-0 left-0 right-0 h-[2px] bg-sky-400 opacity-85"></span>
			<div class="flex items-center gap-2.5 mb-4">
				<span class="w-[30px] h-[30px] rounded-[9px] bg-sky-400/12 text-sky-400 grid place-items-center">
					<Users class="w-4 h-4" />
				</span>
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">Total</span>
			</div>
			<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{stats.total}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-2">invited</div>
		</div>

		<div class="em-stat">
			<span class="absolute top-0 left-0 right-0 h-[2px] bg-amber-400 opacity-85"></span>
			<div class="flex items-center gap-2.5 mb-4">
				<span class="w-[30px] h-[30px] rounded-[9px] bg-amber-400/12 text-amber-400 grid place-items-center">
					<Clock class="w-4 h-4" />
				</span>
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">Pending</span>
			</div>
			<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{stats.pending}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-2">awaiting</div>
		</div>

		<div class="em-stat">
			<span class="absolute top-0 left-0 right-0 h-[2px] bg-emerald-400 opacity-85"></span>
			<div class="flex items-center gap-2.5 mb-4">
				<span class="w-[30px] h-[30px] rounded-[9px] bg-emerald-400/12 text-emerald-400 grid place-items-center">
					<CircleCheckBig class="w-4 h-4" />
				</span>
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">Paid</span>
			</div>
			<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{stats.paid}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-2">confirmed</div>
		</div>

		<div class="em-stat">
			<span class="absolute top-0 left-0 right-0 h-[2px] bg-primary-400 opacity-85"></span>
			<div class="flex items-center gap-2.5 mb-4">
				<span class="w-[30px] h-[30px] rounded-[9px] bg-primary-400/12 text-primary-400 grid place-items-center">
					<Coins class="w-4 h-4" />
				</span>
				<span class="font-mono text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.12em]">Earned</span>
			</div>
			<div class="text-[32px] font-bold text-white tracking-tight leading-none tabular-nums">{stats.totalEarned.toLocaleString()}</div>
			<div class="font-mono text-[11px] text-neutral-500 mt-2">pts</div>
		</div>
	</div>

	<!-- How it works -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
		<div class="flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-surface-50 border border-white/[0.07]">
			<span class="w-[34px] h-[34px] rounded-[10px] bg-primary-400/12 text-primary-500 grid place-items-center font-mono font-bold text-sm flex-shrink-0">1</span>
			<div>
				<h4 class="text-sm font-semibold text-white tracking-tight">Share your link</h4>
				<p class="text-[12px] text-neutral-400 mt-0.5">Send your referral link to friends</p>
			</div>
		</div>
		<div class="flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-surface-50 border border-white/[0.07]">
			<span class="w-[34px] h-[34px] rounded-[10px] bg-sky-400/12 text-sky-400 grid place-items-center font-mono font-bold text-sm flex-shrink-0">2</span>
			<div>
				<h4 class="text-sm font-semibold text-white tracking-tight">Friend signs up</h4>
				<p class="text-[12px] text-neutral-400 mt-0.5">They create an account and complete a survey</p>
			</div>
		</div>
		<div class="flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-surface-50 border border-white/[0.07]">
			<span class="w-[34px] h-[34px] rounded-[10px] bg-emerald-400/12 text-emerald-400 grid place-items-center font-mono font-bold text-sm flex-shrink-0">3</span>
			<div>
				<h4 class="text-sm font-semibold text-white tracking-tight">Both earn bonus</h4>
				<p class="text-[12px] text-neutral-400 mt-0.5">You both receive bonus points automatically</p>
			</div>
		</div>
	</div>

	<!-- Referrals List -->
	<div class="em-panel">
		<div class="em-panel-h">
			<span class="em-panel-title"><Users class="w-4 h-4 text-primary-400" /> Your Referrals</span>
		</div>

		{#if referrals.length === 0}
			<div class="em-empty">
				<span class="em-empty-icon"><Users class="w-[30px] h-[30px]" /></span>
				<h4 class="text-[17px] font-semibold text-white tracking-tight">No referrals yet</h4>
				<p class="text-[13.5px] text-neutral-400 mb-4">Share your link to start earning bonus points.</p>
				{#if referralLink}
					<button onclick={copyLink} class="btn-primary">
						<Copy class="w-4 h-4" /> Copy referral link
					</button>
				{/if}
			</div>
		{:else}
			<div class="divide-y divide-white/[0.04]">
				{#each referrals as ref}
					{@const ss = getStatusStyle(ref.status)}
					<div class="flex items-center gap-3.5 px-5 py-3.5">
						<div class="w-9 h-9 rounded-[10px] bg-gradient-to-br from-fuchsia-500/30 to-primary-400/20 grid place-items-center text-sm font-bold text-white flex-shrink-0">
							{ref.referredName.charAt(0).toUpperCase()}
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-sm font-semibold text-white truncate">{ref.referredName}</span>
								<span class="badge {ss.class} text-[9px]">
									<ss.icon class="w-2.5 h-2.5" />
									{ss.label}
								</span>
							</div>
							<div class="font-mono text-[10px] text-neutral-500 mt-0.5">
								{ref.referredEmail} · Joined {relDate(ref.createdAt)}
								{#if ref.qualifiedAt}
									· Qualified {relDate(ref.qualifiedAt)}
								{/if}
							</div>
						</div>
						<div class="text-right flex-shrink-0">
							{#if ref.status === 'completed' || ref.status === 'paid'}
								<div class="font-mono text-sm font-bold text-primary-400">+{ref.bonus}</div>
								<div class="font-mono text-[10px] text-primary-400/60">pts earned</div>
							{:else if ref.status === 'qualified'}
								<div class="font-mono text-sm font-bold text-sky-400">+{ref.bonus}</div>
								<div class="font-mono text-[10px] text-sky-400/60">processing</div>
							{:else}
								<div class="font-mono text-sm font-bold text-neutral-500">--</div>
								<div class="font-mono text-[10px] text-neutral-600">awaiting</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
