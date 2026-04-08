<script lang="ts">
	import type { PageData } from './$types';
	import { Users, Copy, Check, Clock, CircleCheckBig, Coins, Gift, Share2, ArrowRight, Sparkles } from '@lucide/svelte';
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

<div class="space-y-5 animate-fade-in">
	<InfoBanner id="referral-how" message="Share your referral link with friends. When they sign up and complete their first survey, you both earn bonus points!" color="emerald" />

	<!-- Share Card -->
	{#if referralCode}
		<div class="relative overflow-hidden bg-gradient-to-br from-violet-600/15 via-fuchsia-600/10 to-surface-100 border border-violet-500/15 rounded-2xl p-5 md:p-6">
			<div class="absolute -top-12 -right-12 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl"></div>
			<div class="absolute bottom-0 left-0 w-24 h-24 bg-fuchsia-500/8 rounded-full blur-2xl"></div>

			<div class="relative">
				<div class="flex items-center gap-3 mb-4">
					<div class="p-2.5 bg-violet-500/15 rounded-xl">
						<Share2 class="w-5 h-5 text-violet-400" />
					</div>
					<div>
						<h2 class="text-base font-bold text-white">Invite Friends</h2>
						<p class="text-xs text-neutral-500">Share your link and earn bonus points</p>
					</div>
				</div>

				<!-- Referral Link -->
				<div class="flex items-center gap-2 mb-4">
					<div class="flex-1 bg-surface-200 border border-white/[0.04] rounded-lg px-3.5 py-2.5 text-xs text-neutral-300 font-mono truncate">
						{referralLink || 'Loading...'}
					</div>
					<button onclick={copyLink} class="btn-primary !px-4 !py-2.5 flex-shrink-0">
						{#if copied}
							<Check class="w-4 h-4" /> Copied
						{:else}
							<Copy class="w-4 h-4" /> Copy
						{/if}
					</button>
				</div>

				<!-- Referral Code -->
				<div class="flex items-center gap-4 text-xs text-neutral-500">
					<span>Your code: <span class="font-mono font-bold text-white">{referralCode}</span></span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Stats -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-2.5">
		<div class="relative overflow-hidden bg-gradient-to-br from-sky-500/[0.08] to-surface-100 rounded-xl p-4 border border-sky-500/10">
			<div class="absolute -top-6 -right-6 w-16 h-16 bg-sky-500/10 rounded-full blur-xl"></div>
			<div class="relative">
				<div class="flex items-center gap-2 mb-2">
					<Users class="w-3.5 h-3.5 text-sky-400" />
					<span class="text-[10px] font-bold text-sky-300/40 uppercase tracking-widest">Total</span>
				</div>
				<div class="text-xl font-black text-white">{stats.total}</div>
			</div>
		</div>

		<div class="relative overflow-hidden bg-gradient-to-br from-amber-500/[0.08] to-surface-100 rounded-xl p-4 border border-amber-500/10">
			<div class="absolute -top-6 -right-6 w-16 h-16 bg-amber-500/10 rounded-full blur-xl"></div>
			<div class="relative">
				<div class="flex items-center gap-2 mb-2">
					<Clock class="w-3.5 h-3.5 text-amber-400" />
					<span class="text-[10px] font-bold text-amber-300/40 uppercase tracking-widest">Pending</span>
				</div>
				<div class="text-xl font-black text-white">{stats.pending}</div>
			</div>
		</div>

		<div class="relative overflow-hidden bg-gradient-to-br from-emerald-500/[0.08] to-surface-100 rounded-xl p-4 border border-emerald-500/10">
			<div class="absolute -top-6 -right-6 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
			<div class="relative">
				<div class="flex items-center gap-2 mb-2">
					<CircleCheckBig class="w-3.5 h-3.5 text-emerald-400" />
					<span class="text-[10px] font-bold text-emerald-300/40 uppercase tracking-widest">Paid</span>
				</div>
				<div class="text-xl font-black text-white">{stats.paid}</div>
			</div>
		</div>

		<div class="relative overflow-hidden bg-gradient-to-br from-violet-500/[0.08] to-surface-100 rounded-xl p-4 border border-violet-500/10">
			<div class="absolute -top-6 -right-6 w-16 h-16 bg-violet-500/10 rounded-full blur-xl"></div>
			<div class="relative">
				<div class="flex items-center gap-2 mb-2">
					<Coins class="w-3.5 h-3.5 text-violet-400" />
					<span class="text-[10px] font-bold text-violet-300/40 uppercase tracking-widest">Earned</span>
				</div>
				<div class="text-xl font-black text-white">{stats.totalEarned.toLocaleString()}</div>
				<div class="text-[10px] text-violet-400/50 font-medium mt-0.5">pts</div>
			</div>
		</div>
	</div>

	<!-- How it works -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
		<div class="bg-surface-100 border border-white/[0.06] rounded-xl p-4 flex items-start gap-3">
			<div class="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-sm font-black text-violet-400 flex-shrink-0">1</div>
			<div>
				<div class="text-sm font-bold text-white">Share your link</div>
				<div class="text-xs text-neutral-500 mt-0.5">Send your referral link to friends</div>
			</div>
		</div>
		<div class="bg-surface-100 border border-white/[0.06] rounded-xl p-4 flex items-start gap-3">
			<div class="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sm font-black text-sky-400 flex-shrink-0">2</div>
			<div>
				<div class="text-sm font-bold text-white">Friend signs up</div>
				<div class="text-xs text-neutral-500 mt-0.5">They create an account and complete a survey</div>
			</div>
		</div>
		<div class="bg-surface-100 border border-white/[0.06] rounded-xl p-4 flex items-start gap-3">
			<div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-sm font-black text-emerald-400 flex-shrink-0">3</div>
			<div>
				<div class="text-sm font-bold text-white">Both earn bonus</div>
				<div class="text-xs text-neutral-500 mt-0.5">You both receive bonus points automatically</div>
			</div>
		</div>
	</div>

	<!-- Referrals List -->
	<div>
		<h2 class="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Your Referrals</h2>

		{#if referrals.length === 0}
			<div class="bg-surface-100 border border-white/[0.06] rounded-2xl text-center py-12 px-6">
				<div class="w-12 h-12 bg-white/[0.03] rounded-xl flex items-center justify-center mx-auto mb-3">
					<Users class="w-6 h-6 text-neutral-700" />
				</div>
				<p class="text-sm font-semibold text-white/30 mb-1">No referrals yet</p>
				<p class="text-xs text-neutral-600 mb-4">Share your link to start earning bonus points</p>
				{#if referralLink}
					<button onclick={copyLink} class="btn-primary !text-xs">
						<Copy class="w-3.5 h-3.5" /> Copy Referral Link
					</button>
				{/if}
			</div>
		{:else}
			<div class="space-y-2">
				{#each referrals as ref}
					{@const ss = getStatusStyle(ref.status)}
					<div class="bg-surface-100 border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
						<!-- Avatar -->
						<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
							{ref.referredName.charAt(0).toUpperCase()}
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium text-white truncate">{ref.referredName}</span>
								<span class="badge {ss.class} text-[9px]">
									<ss.icon class="w-2.5 h-2.5" />
									{ss.label}
								</span>
							</div>
							<div class="text-[10px] text-neutral-600 mt-0.5">
								{ref.referredEmail} &middot; Joined {relDate(ref.createdAt)}
								{#if ref.qualifiedAt}
									&middot; Qualified {relDate(ref.qualifiedAt)}
								{/if}
							</div>
						</div>

						<!-- Bonus -->
						<div class="text-right flex-shrink-0">
							{#if ref.status === 'completed' || ref.status === 'paid'}
								<div class="text-sm font-black text-emerald-400">+{ref.bonus}</div>
								<div class="text-[10px] text-emerald-400/50">pts earned</div>
							{:else if ref.status === 'qualified'}
								<div class="text-sm font-black text-sky-400">+{ref.bonus}</div>
								<div class="text-[10px] text-sky-400/50">processing</div>
							{:else}
								<div class="text-sm font-bold text-neutral-600">--</div>
								<div class="text-[10px] text-neutral-700">awaiting</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
