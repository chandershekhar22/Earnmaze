<script lang="ts">
	import type { PageData } from './$types';
	import {
		HelpCircle, Send, Clock, ChevronDown, ChevronUp, MessageSquare,
		Loader, BookOpen, Plus, ArrowLeft, CircleCheckBig, X
	} from '@lucide/svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';

	let { data }: { data: PageData } = $props();

	let faqs = $derived(data.faqs ?? []);
	let transactions = $derived(data.transactions ?? []);
	let surveyAttempts = $derived(data.surveyAttempts ?? []);
	let openFaq = $state<string | null>(null);
	let selectedTxId = $state('');
	let selectedSurveyId = $state('');

	// View: 'home' (tabs) or 'create' (form)
	let view = $state<'home' | 'create'>('home');
	// Tab within home view
	let homeTab = $state<'faq' | 'tickets'>('faq');

	// Form
	let subject = $state('');
	let message = $state('');
	let submitting = $state(false);
	let formMessage = $state('');
	let formError = $state(false);

	// Tickets
	let tickets = $state(data.tickets);
	let expandedTicket = $state<string | null>(null);

	// Replies
	let ticketReplies = $state<Record<string, any[]>>({});
	let replyText = $state('');
	let replySubmitting = $state(false);

	async function loadReplies(ticketId: string) {
		if (ticketReplies[ticketId]) return;
		try {
			const res = await fetch(`/api/panelist/support?ticketId=${ticketId}`);
			const result = await res.json();
			if (result.success) {
				ticketReplies = { ...ticketReplies, [ticketId]: result.data };
			}
		} catch { ticketReplies = { ...ticketReplies, [ticketId]: [] }; }
	}

	async function sendReply(ticketId: string) {
		if (!stripHtml(replyText)) return;
		replySubmitting = true;
		try {
			const res = await fetch('/api/panelist/support', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ticketId, message: replyText }),
			});
			const result = await res.json();
			if (res.ok && result.success) {
				ticketReplies = {
					...ticketReplies,
					[ticketId]: [...(ticketReplies[ticketId] ?? []), result.data],
				};
				replyText = '';
				// Reopen in local state if it was resolved
				tickets = tickets.map(t => t.id === ticketId && t.status === 'resolved' ? { ...t, status: 'open' } : t);
			}
		} catch { /* ignore */ }
		replySubmitting = false;
	}

	function toggleFaq(id: string) { openFaq = openFaq === id ? null : id; }
	function toggleTicket(id: string) {
		if (expandedTicket === id) {
			expandedTicket = null;
		} else {
			expandedTicket = id;
			replyText = '';
			loadReplies(id);
		}
	}

	function openCreateForm() {
		subject = '';
		message = '';
		selectedTxId = '';
		selectedSurveyId = '';
		formMessage = '';
		formError = false;
		view = 'create';
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'open': return 'badge-primary';
			case 'in_progress': return 'badge-warning';
			case 'resolved': return 'badge-success';
			case 'closed': return 'badge-neutral';
			default: return 'badge-neutral';
		}
	}

	function formatStatus(status: string) {
		return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function relDate(dateString: string) {
		const ms = Date.now() - new Date(dateString).getTime();
		const m = Math.floor(ms / 60000);
		if (m < 1) return 'just now';
		if (m < 60) return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ago`;
		const d = Math.floor(h / 24);
		if (d < 7) return `${d}d ago`;
		return formatDate(dateString);
	}

	// Strip HTML tags for plain text length check
	function stripHtml(html: string) { return html.replace(/<[^>]*>/g, '').trim(); }

	async function handleSubmit() {
		if (!subject.trim() || !stripHtml(message)) {
			formMessage = 'Please fill in both subject and message.';
			formError = true;
			return;
		}
		submitting = true;
		formMessage = '';
		formError = false;

		try {
			let fullMessage = message;
			if (selectedSurveyId) {
				const sv = surveyAttempts.find(s => String(s.id) === selectedSurveyId);
				fullMessage += `<br><br><em>[Survey: ${sv?.surveyTitle || selectedSurveyId} | Status: ${sv?.status || 'unknown'}]</em>`;
			}
			if (selectedTxId) {
				fullMessage += `<br><br><em>[Transaction: ${selectedTxId}]</em>`;
			}

			const response = await fetch('/api/panelist/support', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ subject: subject.trim(), message: fullMessage }),
			});
			const result = await response.json();
			if (response.ok && result.success) {
				tickets = [result.data, ...tickets];
				subject = '';
				message = '';
				selectedTxId = '';
				selectedSurveyId = '';
				view = 'home';
				homeTab = 'tickets';
				expandedTicket = result.data?.id ?? null;
			} else {
				formMessage = result.message || 'Failed to submit ticket.';
				formError = true;
			}
		} catch {
			formMessage = 'Failed to submit ticket. Please try again.';
			formError = true;
		} finally {
			submitting = false;
		}
	}

	let openTickets = $derived(tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length);
</script>

<svelte:head>
	<title>Support - EarnMaze</title>
</svelte:head>

<div class="space-y-[22px] animate-fade-in">

	{#if view === 'create'}
		<!-- ═══ CREATE TICKET VIEW ═══ -->
		<div>
			<button onclick={() => view = 'home'} class="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white mb-4 transition-colors">
				<ArrowLeft class="w-3.5 h-3.5" /> Back to Support
			</button>

			<div class="rounded-2xl bg-surface-50 border border-white/[0.07] p-6">
				<div class="flex items-center gap-3.5 mb-5">
					<span class="w-10 h-10 rounded-[11px] bg-primary-400/12 text-primary-500 grid place-items-center">
						<Send class="w-5 h-5" />
					</span>
					<div>
						<h2 class="text-[15px] font-semibold text-white tracking-tight">New Support Ticket</h2>
						<p class="text-[12.5px] text-neutral-400">We'll get back to you as soon as possible</p>
					</div>
				</div>

				<div class="space-y-4">
					<div>
						<label for="subject" class="label">Subject</label>
						<input id="subject" type="text" bind:value={subject} placeholder="Brief description of your issue" class="input w-full" maxlength="255" />
					</div>

					<div>
						<label class="label">Message</label>
						<RichTextEditor bind:value={message} placeholder="Describe your issue in detail..." />
					</div>

					<!-- Related survey -->
					{#if surveyAttempts.length > 0}
						<div>
							<label for="survey-ref" class="label">
								Related survey <span class="text-neutral-600 font-normal">(optional)</span>
							</label>
							<select id="survey-ref" bind:value={selectedSurveyId} class="select w-full">
								<option value="">None</option>
								{#each surveyAttempts as s}
									<option value={String(s.id)}>
										{s.surveyTitle} — {s.status}{s.awardedPoints > 0 ? ` (+${s.awardedPoints} pts)` : ''} — {new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
									</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Related transaction -->
					{#if transactions.length > 0}
						<div>
							<label for="transaction" class="label">
								Related transaction <span class="text-neutral-600 font-normal">(optional)</span>
							</label>
							<select id="transaction" bind:value={selectedTxId} class="select w-full">
								<option value="">None</option>
								{#each transactions as tx}
									<option value={tx.id}>
										{tx.description} ({tx.points > 0 ? '+' : ''}{tx.points} pts) — {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
									</option>
								{/each}
							</select>
						</div>
					{/if}

					{#if formMessage}
						<div class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm {formError ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}">
							{#if formError}<X class="w-4 h-4 flex-shrink-0" />{:else}<CircleCheckBig class="w-4 h-4 flex-shrink-0" />{/if}
							{formMessage}
						</div>
					{/if}

					<div class="flex items-center gap-3 pt-2">
						<button onclick={() => view = 'home'} class="btn-secondary">Cancel</button>
						<button onclick={handleSubmit} disabled={submitting || !subject.trim() || !stripHtml(message)} class="btn-primary flex-1 sm:flex-none">
							{#if submitting}
								<Loader class="w-4 h-4 animate-spin" /> Submitting...
							{:else}
								<Send class="w-4 h-4" /> Submit Ticket
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>

	{:else}
		<!-- ═══ SUPPORT HOME VIEW ═══ -->

		<!-- Header strip -->
		<div class="flex items-center justify-between gap-5 px-6 py-5 rounded-2xl bg-surface-50 border border-white/[0.07] flex-wrap">
			<div class="flex items-center gap-3.5">
				<span class="w-[42px] h-[42px] rounded-[11px] bg-fuchsia-500/12 border border-fuchsia-400/20 text-fuchsia-400 grid place-items-center">
					<HelpCircle class="w-5 h-5" />
				</span>
				<div>
					<h1 class="text-[18px] font-semibold text-white tracking-tight">Help & Support</h1>
					<p class="text-[12.5px] text-neutral-400">Find answers or create a ticket</p>
				</div>
			</div>
			<button onclick={openCreateForm} class="btn-primary">
				<Plus class="w-4 h-4" /> New ticket
			</button>
		</div>

		<!-- Segmented tabs -->
		<div class="tab-group">
			<button onclick={() => homeTab = 'faq'} class={homeTab === 'faq' ? 'tab-active' : 'tab'}>
				<BookOpen class="w-[15px] h-[15px]" /> FAQ
				{#if faqs.length > 0}
					<span class="font-mono text-[11px] opacity-80">{faqs.length}</span>
				{/if}
			</button>
			<button onclick={() => homeTab = 'tickets'} class={homeTab === 'tickets' ? 'tab-active' : 'tab'}>
				<MessageSquare class="w-[15px] h-[15px]" /> My Tickets
				{#if openTickets > 0}
					<span class="ml-1 px-1.5 py-0.5 bg-primary-400/15 text-primary-400 rounded text-[9px] font-bold">{openTickets}</span>
				{/if}
			</button>
		</div>

		<!-- FAQ Tab -->
		{#if homeTab === 'faq'}
			{#if faqs.length === 0}
				<div class="em-panel">
					<div class="em-empty">
						<span class="em-empty-icon"><BookOpen class="w-[30px] h-[30px]" /></span>
						<h4 class="text-[17px] font-semibold text-white tracking-tight">No FAQs available yet</h4>
						<p class="text-[13.5px] text-neutral-400">Check back later or create a support ticket.</p>
					</div>
				</div>
			{:else}
				<div class="rounded-2xl overflow-hidden border border-white/[0.07] divide-y divide-white/[0.07]">
					{#each faqs as faq (faq.id)}
						<div class="bg-surface-50">
							<button
								type="button"
								onclick={() => toggleFaq(faq.id)}
								class="w-full px-5 py-4 flex items-center justify-between text-left hover:text-primary-400 transition-colors"
							>
								<span class="text-[14.5px] font-medium text-white pr-4">{faq.question}</span>
								<span class="w-6 h-6 rounded-md border border-white/[0.13] grid place-items-center text-neutral-400 flex-shrink-0 transition-all
									{openFaq === faq.id ? 'bg-primary-400 text-surface border-primary-400 rotate-45' : ''}">
									{#if openFaq === faq.id}<ChevronUp class="w-3.5 h-3.5" />{:else}<ChevronDown class="w-3.5 h-3.5" />{/if}
								</span>
							</button>
							{#if openFaq === faq.id}
								<div class="px-5 pb-5 text-[13.5px] text-neutral-400 leading-relaxed max-w-[70ch] faq-content">{@html faq.answer}</div>
							{/if}
						</div>
					{/each}
				</div>

				<div class="text-center pt-2">
					<p class="text-xs text-neutral-500">Can't find what you need?
						<button onclick={openCreateForm} class="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Create a ticket</button>
					</p>
				</div>
			{/if}
		{/if}

		<!-- Tickets Tab -->
		{#if homeTab === 'tickets'}
			{#if tickets.length === 0}
				<div class="em-panel">
					<div class="em-empty">
						<span class="em-empty-icon"><MessageSquare class="w-[30px] h-[30px]" /></span>
						<h4 class="text-[17px] font-semibold text-white tracking-tight">No tickets yet</h4>
						<p class="text-[13.5px] text-neutral-400 mb-4">Didn't find your answer in the FAQ?</p>
						<button onclick={openCreateForm} class="btn-primary">
							<Plus class="w-4 h-4" /> Create a ticket
						</button>
					</div>
				</div>
			{:else}
				<div class="space-y-2">
					{#each tickets as ticket (ticket.id)}
						<div class="bg-surface-100 border border-white/[0.06] rounded-xl overflow-hidden">
							<button
								type="button"
								onclick={() => toggleTicket(ticket.id)}
								class="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
							>
								<div class="w-2 h-2 rounded-full flex-shrink-0 {ticket.status === 'open' ? 'bg-primary-400' : ticket.status === 'in_progress' ? 'bg-amber-400' : ticket.status === 'resolved' ? 'bg-emerald-400' : 'bg-neutral-600'}"></div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="text-[10px] font-mono text-neutral-600">#{ticket.id.slice(0, 6).toUpperCase()}</span>
										<span class="text-sm font-medium text-white truncate">{ticket.subject}</span>
									</div>
									<div class="flex items-center gap-3 mt-0.5 text-[10px] text-neutral-600">
										<span>{relDate(ticket.createdAt)}</span>
										{#if ticket.adminReply}
											<span class="text-emerald-400/70 font-semibold">Replied</span>
										{/if}
									</div>
								</div>
								<span class="badge {getStatusBadge(ticket.status)} text-[9px] flex-shrink-0">{formatStatus(ticket.status)}</span>
								<div class="text-neutral-700 flex-shrink-0">
									{#if expandedTicket === ticket.id}<ChevronUp class="w-3.5 h-3.5" />{:else}<ChevronDown class="w-3.5 h-3.5" />{/if}
								</div>
							</button>

							{#if expandedTicket === ticket.id}
								<div class="px-4 pb-4 border-t border-white/[0.04] animate-fade-in">
									<!-- Original message -->
									<div class="mt-3">
										<span class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Your message</span>
										<div class="mt-1.5 bg-surface-200 rounded-lg p-3">
											<div class="text-sm text-neutral-300 leading-relaxed ticket-content">{@html ticket.message}</div>
										</div>
										<div class="text-[10px] text-neutral-700 mt-1.5">{formatDate(ticket.createdAt)}</div>
									</div>

									<!-- Admin reply (legacy single reply) -->
									{#if ticket.adminReply}
										<div class="mt-4">
											<span class="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest">Support Reply</span>
											<div class="mt-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
												<div class="text-sm text-neutral-300 leading-relaxed ticket-content">{@html ticket.adminReply}</div>
											</div>
											{#if ticket.repliedAt}
												<div class="text-[10px] text-neutral-700 mt-1.5">{formatDate(ticket.repliedAt)}</div>
											{/if}
										</div>
									{/if}

									<!-- Reply thread -->
									{#if ticketReplies[ticket.id]?.length}
										<div class="mt-4 space-y-3">
											{#each ticketReplies[ticket.id] as reply (reply.id)}
												<div>
													<span class="text-[10px] font-bold uppercase tracking-widest {reply.isAdmin ? 'text-emerald-400/60' : 'text-primary-400/60'}">
														{reply.isAdmin ? 'Support' : 'You'}
													</span>
													<div class="mt-1.5 rounded-lg p-3 {reply.isAdmin ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-surface-200'}">
														<div class="text-sm text-neutral-300 leading-relaxed ticket-content">{@html reply.message}</div>
													</div>
													<div class="text-[10px] text-neutral-700 mt-1.5">{formatDate(reply.createdAt)}</div>
												</div>
											{/each}
										</div>
									{/if}

									<!-- Waiting indicator -->
									{#if !ticket.adminReply && !ticketReplies[ticket.id]?.length && ticket.status === 'open'}
										<div class="mt-4 flex items-center gap-2 text-xs text-neutral-600">
											<Clock class="w-3.5 h-3.5" />
											Waiting for support response...
										</div>
									{/if}

									<!-- Reply input (only for non-closed tickets) -->
									{#if ticket.status !== 'closed'}
										<div class="mt-4 pt-3 border-t border-white/[0.04]">
											<div class="flex gap-2">
												<input
													type="text"
													bind:value={replyText}
													placeholder="Type your reply..."
													class="input flex-1 !py-2 !text-sm"
													maxlength="5000"
													onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(ticket.id); } }}
												/>
												<button
													onclick={() => sendReply(ticket.id)}
													disabled={replySubmitting || !stripHtml(replyText)}
													class="btn-primary !py-2 !px-3"
												>
													{#if replySubmitting}
														<Loader class="w-4 h-4 animate-spin" />
													{:else}
														<Send class="w-4 h-4" />
													{/if}
												</button>
											</div>
										</div>
									{:else}
										<div class="mt-4 text-center text-xs text-neutral-600">This ticket is closed.</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<div class="text-center pt-2">
					<button onclick={openCreateForm} class="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors">
						Still need help? Create a new ticket →
					</button>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<style>
	:global(.faq-content h3) { font-size: 0.875rem; font-weight: 700; color: white; margin: 0.5rem 0; }
	:global(.faq-content ul), :global(.faq-content ol) { padding-left: 1.5rem; margin: 0.25rem 0; }
	:global(.faq-content li) { margin: 0.15rem 0; }
	:global(.faq-content a) { color: rgb(167 139 250); text-decoration: underline; }
	:global(.faq-content strong) { color: white; }
	:global(.ticket-content h3) { font-size: 0.875rem; font-weight: 700; color: white; margin: 0.5rem 0; }
	:global(.ticket-content ul), :global(.ticket-content ol) { padding-left: 1.5rem; margin: 0.25rem 0; }
	:global(.ticket-content li) { margin: 0.15rem 0; }
	:global(.ticket-content a) { color: rgb(167 139 250); text-decoration: underline; }
	:global(.ticket-content strong) { color: white; }
</style>
