<script lang="ts">
	import type { PageData } from './$types';
	import { HelpCircle, MessageSquare, Clock, ChevronDown, ChevronUp, Send, Loader, Inbox, Plus, Trash2, BookOpen, Eye, EyeOff, Coins, CircleCheckBig, XCircle, UserCheck, StickyNote, ClipboardList, ArrowLeftRight, Zap, Pencil, X } from '@lucide/svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';

	let { data }: { data: PageData } = $props();

	let tickets = $state(data.tickets);
	let expandedTicket = $state<string | null>(null);
	let replyText = $state('');
	let replyStatus = $state<'open' | 'in_progress' | 'resolved' | 'closed'>('resolved');

	// Admin users for assignment
	let adminUsers = $derived(data.adminUsers ?? []);

	// Notes
	let ticketNotes = $state<Record<string, any[]>>({});
	let noteText = $state('');
	let noteSubmitting = $state(false);

	// Panelist context (surveys, transactions, ticket-linked points)
	let ticketContext = $state<Record<string, { surveys: any[]; transactions: any[]; ticketPoints: any[]; loaded: boolean }>>({});
	let contextTab = $state<'surveys' | 'transactions' | 'ticketPoints'>('ticketPoints');

	async function loadTicketContext(ticketId: string) {
		if (ticketContext[ticketId]?.loaded) return;
		ticketContext = { ...ticketContext, [ticketId]: { surveys: [], transactions: [], ticketPoints: [], loaded: false } };
		try {
			const res = await fetch(`/api/admin/support/${ticketId}/context`);
			const result = await res.json();
			ticketContext = { ...ticketContext, [ticketId]: { ...result, loaded: true } };
		} catch {
			ticketContext = { ...ticketContext, [ticketId]: { surveys: [], transactions: [], ticketPoints: [], loaded: true } };
		}
	}

	async function loadNotes(ticketId: string) {
		try {
			const res = await fetch(`/api/admin/support/${ticketId}`);
			const result = await res.json();
			ticketNotes = { ...ticketNotes, [ticketId]: result.notes ?? [] };
		} catch { ticketNotes = { ...ticketNotes, [ticketId]: [] }; }
	}

	async function addNote(ticketId: string) {
		if (!noteText.trim()) return;
		noteSubmitting = true;
		try {
			const res = await fetch(`/api/admin/support/${ticketId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ note: noteText.trim(), isInternal: true }),
			});
			const result = await res.json();
			if (res.ok && result.note) {
				ticketNotes = { ...ticketNotes, [ticketId]: [...(ticketNotes[ticketId] ?? []), result.note] };
				noteText = '';
			}
		} catch { /* ignore */ }
		noteSubmitting = false;
	}

	async function handleAssign(ticketId: string, assignedTo: string) {
		try {
			await fetch(`/api/admin/support/${ticketId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ assignedTo: assignedTo || null }),
			});
			tickets = tickets.map(t => t.id === ticketId ? { ...t, assignedTo: assignedTo || null } : t);
		} catch { /* ignore */ }
	}

	// FAQ management. The base locale ("en") edits the row's question/answer
	// columns directly; non-base locales edit the JSONB translations map.
	// Empty fields on a non-base locale are pruned before save so missing
	// translations fall back to the base copy at read time.
	type FaqLocale = 'en' | 'es' | 'fr' | 'pt' | 'ar';
	const FAQ_LOCALES: { code: FaqLocale; label: string }[] = [
		{ code: 'en', label: 'English' },
		{ code: 'es', label: 'Español' },
		{ code: 'fr', label: 'Français' },
		{ code: 'pt', label: 'Português' },
		{ code: 'ar', label: 'العربية' },
	];

	let faqs = $state(data.faqs ?? []);
	let faqMode = $state<'list' | 'create' | 'edit'>('list');
	let editingFaqId = $state<string | null>(null);
	let faqQuestion = $state('');
	let faqAnswer = $state('');
	let faqTranslations = $state<Record<string, { question: string; answer: string }>>({});
	let faqLocaleTab = $state<FaqLocale>('en');
	let faqSubmitting = $state(false);
	let activeTab = $state<'tickets' | 'faqs'>('tickets');

	function emptyTranslations() {
		return FAQ_LOCALES.filter((l) => l.code !== 'en').reduce(
			(acc, l) => ({ ...acc, [l.code]: { question: '', answer: '' } }),
			{} as Record<string, { question: string; answer: string }>,
		);
	}

	function openCreateFaq() {
		faqQuestion = '';
		faqAnswer = '';
		faqTranslations = emptyTranslations();
		faqLocaleTab = 'en';
		editingFaqId = null;
		faqMode = 'create';
	}

	function openEditFaq(f: typeof faqs[0]) {
		faqQuestion = f.question;
		faqAnswer = f.answer;
		const seed = emptyTranslations();
		const existing = (f as any).translations ?? {};
		for (const code of Object.keys(seed)) {
			seed[code] = {
				question: existing[code]?.question ?? '',
				answer: existing[code]?.answer ?? '',
			};
		}
		faqTranslations = seed;
		faqLocaleTab = 'en';
		editingFaqId = f.id;
		faqMode = 'edit';
	}

	function closeFaqForm() {
		faqMode = 'list';
		faqQuestion = '';
		faqAnswer = '';
		faqTranslations = {};
		faqLocaleTab = 'en';
		editingFaqId = null;
	}

	// Drop empty fields per locale; drop the locale entirely if both fields blank.
	function compactTranslations() {
		const out: Record<string, { question?: string; answer?: string }> = {};
		for (const [code, val] of Object.entries(faqTranslations)) {
			const q = val.question.trim();
			const a = val.answer.trim();
			if (!q && !a) continue;
			out[code] = {};
			if (q) out[code].question = q;
			if (a) out[code].answer = a;
		}
		return out;
	}

	async function saveFaq() {
		if (!faqQuestion.trim() || !faqAnswer.trim()) return;
		faqSubmitting = true;
		try {
			const translations = compactTranslations();
			if (faqMode === 'edit' && editingFaqId) {
				const res = await fetch('/api/admin/faqs', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						id: editingFaqId,
						question: faqQuestion.trim(),
						answer: faqAnswer.trim(),
						translations,
					}),
				});
				const result = await res.json();
				if (res.ok && result.success) {
					faqs = faqs.map(f =>
						f.id === editingFaqId
							? { ...f, question: faqQuestion.trim(), answer: faqAnswer.trim(), translations }
							: f,
					);
					closeFaqForm();
				}
			} else {
				const res = await fetch('/api/admin/faqs', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						question: faqQuestion.trim(),
						answer: faqAnswer.trim(),
						translations,
					}),
				});
				const result = await res.json();
				if (res.ok && result.success) {
					faqs = [...faqs, result.faq];
					closeFaqForm();
				}
			}
		} catch { /* ignore */ }
		faqSubmitting = false;
	}

	async function toggleFaqActive(id: string, isActive: boolean) {
		try {
			const res = await fetch('/api/admin/faqs', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, isActive: !isActive }),
			});
			if (res.ok) {
				faqs = faqs.map(f => f.id === id ? { ...f, isActive: !isActive } : f);
			}
		} catch { /* ignore */ }
	}

	// Points assignment from ticket
	let showPointsForm = $state(false);
	let pointsAmount = $state(0);
	let pointsType = $state<'bonus' | 'adjustment' | 'penalty'>('bonus');
	let pointsDesc = $state('');
	let pointsSubmitting = $state(false);
	let pointsMsg = $state('');

	async function assignPoints(panelistId: string, ticketId: string) {
		if (pointsAmount <= 0 || !pointsDesc.trim()) return;
		pointsSubmitting = true;
		pointsMsg = '';
		try {
			const res = await fetch('/api/admin/points', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					panelistId,
					points: pointsAmount,
					type: pointsType,
					description: pointsDesc.trim() + ` (Ticket: ${ticketId.slice(0, 8)})`,
				}),
			});
			const result = await res.json();
			if (res.ok && result.success) {
				pointsMsg = `${pointsType === 'penalty' ? '-' : '+'}${pointsAmount} points assigned`;
				pointsAmount = 0;
				pointsDesc = '';
				setTimeout(() => pointsMsg = '', 3000);
			} else {
				pointsMsg = result.error || 'Failed to assign points';
			}
		} catch {
			pointsMsg = 'Failed to assign points';
		}
		pointsSubmitting = false;
	}

	async function quickStatus(ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') {
		try {
			const res = await fetch(`/api/admin/support/${ticketId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus }),
			});
			if (res.ok) {
				tickets = tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t);
			}
		} catch { /* ignore */ }
	}

	async function deleteTicket(ticketId: string) {
		if (!confirm('Delete this ticket permanently?')) return;
		try {
			const res = await fetch(`/api/admin/support/${ticketId}`, { method: 'DELETE' });
			if (res.ok) {
				tickets = tickets.filter(t => t.id !== ticketId);
				expandedTicket = null;
			}
		} catch { /* ignore */ }
	}

	async function removeFaq(id: string) {
		if (!confirm('Delete this FAQ?')) return;
		try {
			const res = await fetch('/api/admin/faqs', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id }),
			});
			if (res.ok) {
				faqs = faqs.filter(f => f.id !== id);
			}
		} catch { /* ignore */ }
	}
	let submitting = $state(false);
	let statusFilter = $state<string>('all');

	let filteredTickets = $derived(
		(statusFilter === 'all' ? tickets : tickets.filter((t) => t.status === statusFilter))
			.toSorted((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
	);

	let ticketCounts = $derived({
		all: tickets.length,
		open: tickets.filter((t) => t.status === 'open').length,
		in_progress: tickets.filter((t) => t.status === 'in_progress').length,
		resolved: tickets.filter((t) => t.status === 'resolved').length,
		closed: tickets.filter((t) => t.status === 'closed').length,
	});

	function selectTicket(id: string) {
		expandedTicket = id;
		noteText = '';
		contextTab = 'ticketPoints';
		replyText = '';
		replyStatus = 'resolved';
		loadNotes(id);
		loadTicketContext(id);
	}

	let selectedTicket = $derived(tickets.find(t => t.id === expandedTicket) ?? null);

	function getStatusBadge(status: string) {
		switch (status) {
			case 'open': return 'badge-primary';
			case 'in_progress': return 'badge-warning';
			case 'resolved': return 'badge-success';
			case 'closed': return 'badge-neutral';
			default: return 'badge-neutral';
		}
	}

	function getPriorityBadge(priority: string) {
		switch (priority) {
			case 'high': return 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20';
			case 'medium': return 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20';
			case 'low': return 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20';
			default: return 'badge-neutral';
		}
	}

	function formatStatus(status: string) {
		return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	async function handleReply(ticketId: string) {
		if (!replyText.trim()) return;

		submitting = true;
		try {
			const response = await fetch(`/api/admin/support/${ticketId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					adminReply: replyText.trim(),
					status: replyStatus,
				}),
			});

			const result = await response.json();

			if (response.ok && result.success) {
				tickets = tickets.map((t) =>
					t.id === ticketId
						? {
								...t,
								adminReply: replyText.trim(),
								status: replyStatus,
								repliedAt: new Date().toISOString(),
							}
						: t
				);
				// Add to conversation thread
				if (result.data?.note) {
					ticketNotes = {
						...ticketNotes,
						[ticketId]: [...(ticketNotes[ticketId] ?? []), result.data.note],
					};
				}
				replyText = '';
			}
		} catch {
			// silently fail
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Support Tickets - Admin Panel</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-white">Support</h1>
			<p class="text-neutral-500 text-sm mt-1">Manage tickets and FAQs</p>
		</div>
		<div class="tab-group">
			<button onclick={() => activeTab = 'tickets'} class={activeTab === 'tickets' ? 'tab-active' : 'tab'}>
				<MessageSquare class="w-3.5 h-3.5 me-1 inline" /> Tickets <span class="ms-1 text-[10px] opacity-60">({ticketCounts.all})</span>
			</button>
			<button onclick={() => activeTab = 'faqs'} class={activeTab === 'faqs' ? 'tab-active' : 'tab'}>
				<BookOpen class="w-3.5 h-3.5 me-1 inline" /> FAQs <span class="ms-1 text-[10px] opacity-60">({faqs.length})</span>
			</button>
		</div>
	</div>

	{#if activeTab === 'faqs'}
		<!-- FAQ Management -->
		<div class="space-y-4">

			{#if faqMode === 'create' || faqMode === 'edit'}
				<!-- Create / Edit Form -->
				<div class="card animate-scale-in">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-sm font-bold text-white">{faqMode === 'edit' ? 'Edit FAQ' : 'New FAQ'}</h2>
						<button onclick={closeFaqForm} class="p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
							<X class="w-4 h-4" />
						</button>
					</div>
					<div class="space-y-4">
						<!-- Locale tabs. English is the source of truth; other locales
						     are optional overrides that fall back to English per-field. -->
						<div class="flex items-center gap-1 border-b border-white/[0.06]">
							{#each FAQ_LOCALES as loc}
								{@const filled = loc.code === 'en'
									? !!faqQuestion.trim() && !!faqAnswer.trim()
									: !!(faqTranslations[loc.code]?.question.trim() || faqTranslations[loc.code]?.answer.trim())}
								<button
									type="button"
									onclick={() => faqLocaleTab = loc.code}
									class="relative px-3 py-2 text-xs font-medium transition-colors {faqLocaleTab === loc.code ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}"
								>
									{loc.label}
									{#if loc.code !== 'en' && filled}
										<span class="ms-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" title="Has translation"></span>
									{/if}
									{#if faqLocaleTab === loc.code}
										<span class="absolute bottom-0 inset-x-0 h-0.5 bg-primary-400"></span>
									{/if}
								</button>
							{/each}
						</div>

						{#if faqLocaleTab === 'en'}
							<div>
								<label for="faq-q" class="label">Question</label>
								<input id="faq-q" type="text" bind:value={faqQuestion} class="input" placeholder="e.g. How do I redeem points?" maxlength="500" />
							</div>
							<div>
								<label class="label">Answer</label>
								<RichTextEditor bind:value={faqAnswer} placeholder="Write a clear, helpful answer..." />
							</div>
						{:else}
							<p class="text-[11px] text-neutral-500">Leave a field blank to fall back to the English version for that field.</p>
							<div>
								<label for="faq-q-{faqLocaleTab}" class="label">Question ({faqLocaleTab})</label>
								<input
									id="faq-q-{faqLocaleTab}"
									type="text"
									bind:value={faqTranslations[faqLocaleTab].question}
									class="input"
									placeholder={faqQuestion || 'Translated question'}
									maxlength="500"
									dir={faqLocaleTab === 'ar' ? 'rtl' : 'ltr'}
								/>
							</div>
							<div>
								<label class="label">Answer ({faqLocaleTab})</label>
								<RichTextEditor
									bind:value={faqTranslations[faqLocaleTab].answer}
									placeholder={faqAnswer ? 'Translate the English answer above…' : 'Translated answer'}
								/>
							</div>
						{/if}

						<div class="flex justify-end gap-2 pt-2">
							<button onclick={closeFaqForm} class="btn-secondary !text-xs">Cancel</button>
							<button onclick={saveFaq} disabled={faqSubmitting || !faqQuestion.trim() || !faqAnswer.trim()} class="btn-primary !text-xs">
								{#if faqSubmitting}
									<Loader class="w-3.5 h-3.5 animate-spin" /> Saving...
								{:else if faqMode === 'edit'}
									<Pencil class="w-3.5 h-3.5" /> Update FAQ
								{:else}
									<Plus class="w-3.5 h-3.5" /> Save FAQ
								{/if}
							</button>
						</div>
					</div>
				</div>
			{:else}
				<!-- FAQ List -->
				<div class="flex items-center justify-between">
					<h2 class="text-sm font-bold text-white">Manage FAQs ({faqs.length})</h2>
					<button onclick={openCreateFaq} class="btn-primary !text-xs !px-3 !py-2">
						<Plus class="w-3.5 h-3.5" /> Add FAQ
					</button>
				</div>

				{#if faqs.length === 0}
					<div class="card text-center py-12">
						<BookOpen class="w-10 h-10 text-neutral-600 mx-auto mb-3" />
						<p class="text-sm text-neutral-400">No FAQs yet. Add one to help panelists.</p>
					</div>
				{:else}
					<div class="space-y-2">
						{#each faqs as f (f.id)}
							<div class="card !p-0 overflow-hidden {!f.isActive ? 'opacity-60' : ''}">
								<div class="px-4 py-3 flex items-start gap-3">
									<div class="flex-1 min-w-0">
										<h3 class="text-sm font-semibold text-white">{f.question}</h3>
										<div class="text-xs text-neutral-500 mt-1 line-clamp-2 prose-preview">{@html f.answer}</div>
									</div>
									<div class="flex items-center gap-1 flex-shrink-0">
										<button onclick={() => openEditFaq(f)} class="p-1.5 rounded-lg text-neutral-600 hover:text-primary-400 hover:bg-primary-500/10 transition-colors" title="Edit">
											<Pencil class="w-3.5 h-3.5" />
										</button>
										<button onclick={() => toggleFaqActive(f.id, f.isActive)} class="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title={f.isActive ? 'Hide' : 'Show'}>
											{#if f.isActive}
												<Eye class="w-3.5 h-3.5 text-emerald-400" />
											{:else}
												<EyeOff class="w-3.5 h-3.5 text-neutral-600" />
											{/if}
										</button>
										<button onclick={() => removeFaq(f.id)} class="p-1.5 rounded-lg text-neutral-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete">
											<Trash2 class="w-3.5 h-3.5" />
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	{:else}

	<!-- ═══ TICKETS — TWO-COLUMN EMAIL LAYOUT ═══ -->

	<!-- Status filter pills -->
	<div class="flex items-center gap-1.5 mb-4">
		{#each [['all','All',ticketCounts.all,'text-white'],['open','Open',ticketCounts.open,'text-primary-400'],['in_progress','In Progress',ticketCounts.in_progress,'text-amber-400'],['resolved','Resolved',ticketCounts.resolved,'text-emerald-400'],['closed','Closed',ticketCounts.closed,'text-neutral-400']] as [val,label,count,color]}
			<button onclick={() => statusFilter = String(val)} class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors {statusFilter === String(val) ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white hover:bg-white/5'}">
				{label} <span class="ms-0.5 {color}">{count}</span>
			</button>
		{/each}
	</div>

	{#if filteredTickets.length === 0}
		<div class="card text-center py-16">
			<Inbox class="w-10 h-10 text-neutral-700 mx-auto mb-3" />
			<p class="text-sm font-semibold text-white/30">No {statusFilter === 'all' ? '' : formatStatus(statusFilter).toLowerCase() + ' '}tickets</p>
		</div>
	{:else}
		<div class="flex gap-0 border border-white/[0.06] rounded-2xl overflow-hidden bg-surface-100" style="height: calc(100vh - 220px)">

			<!-- LEFT: Ticket List -->
			<div class="w-[340px] flex-shrink-0 border-e border-white/[0.06] overflow-y-auto">
				{#each filteredTickets as ticket (ticket.id)}
					<button
						type="button"
						onclick={() => selectTicket(ticket.id)}
						class="w-full px-4 py-3 text-start border-b border-white/[0.04] transition-colors {expandedTicket === ticket.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}"
					>
						<div class="flex items-center gap-2 mb-1">
							<div class="w-2 h-2 rounded-full flex-shrink-0 {ticket.status === 'open' ? 'bg-primary-400' : ticket.status === 'in_progress' ? 'bg-amber-400' : ticket.status === 'resolved' ? 'bg-emerald-400' : 'bg-neutral-600'}"></div>
							<span class="text-sm font-semibold text-white truncate flex-1">{ticket.subject}</span>
						</div>
						<div class="flex items-center gap-2 text-[10px] text-neutral-600 ps-4">
							<span class="truncate">{ticket.panelistName || ticket.panelistEmail}</span>
							<span class="flex-shrink-0">{new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
							{#if ticket.adminReply || (ticketNotes[ticket.id]?.filter(n => !n.isInternal).length ?? 0) > 0}
								<MessageSquare class="w-3 h-3 text-emerald-400/60 flex-shrink-0" />
							{/if}
						</div>
					</button>
				{/each}
			</div>

			<!-- RIGHT: Ticket Detail -->
			<div class="flex-1 flex flex-col overflow-hidden">
				{#if selectedTicket}
					{@const ticket = selectedTicket}

					<!-- Detail Header -->
					<div class="px-5 py-3 border-b border-white/[0.06] flex-shrink-0">
						<div class="flex items-center justify-between">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<h2 class="text-sm font-bold text-white">{ticket.subject}</h2>
									<span class="badge {getStatusBadge(ticket.status)} text-[9px]">{formatStatus(ticket.status)}</span>
									<span class="px-1.5 py-0.5 text-[9px] font-bold rounded-full {getPriorityBadge(ticket.priority)}">{ticket.priority}</span>
								</div>
								<div class="flex items-center gap-3 mt-1 text-[10px] text-neutral-600">
									<a href="/admin/users/{ticket.panelistId}" target="_blank" class="hover:text-primary-400 transition-colors">{ticket.panelistName || ticket.panelistEmail}</a>
									<span>{formatDate(ticket.createdAt)}</span>
									{#if ticket.assignedTo}
										<span class="text-primary-400">{adminUsers.find(a => a.id === ticket.assignedTo)?.name || 'Assigned'}</span>
									{/if}
								</div>
							</div>
							<div class="flex items-center gap-1.5 flex-shrink-0">
								<select
									value={ticket.status}
									onchange={(e) => quickStatus(ticket.id, (e.target as HTMLSelectElement).value as 'open' | 'in_progress' | 'resolved' | 'closed')}
									class="select !py-1 !text-[10px] !w-auto"
								>
									<option value="open">Open</option>
									<option value="in_progress">In Progress</option>
									<option value="resolved">Resolved</option>
									<option value="closed">Closed</option>
								</select>
								<select
									value={ticket.assignedTo ?? ''}
									onchange={(e) => handleAssign(ticket.id, (e.target as HTMLSelectElement).value)}
									class="select !py-1 !text-[10px] !w-auto"
								>
									<option value="">Unassigned</option>
									{#each adminUsers as admin}
										<option value={admin.id}>{admin.name || admin.email}</option>
									{/each}
								</select>
								<button onclick={() => deleteTicket(ticket.id)} class="p-1.5 rounded-lg text-neutral-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete">
									<Trash2 class="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					</div>

					<!-- Conversation (scrollable middle) -->
					<div class="flex-1 overflow-y-auto px-5 py-4 space-y-3">
						<!-- Original message -->
						<div>
							<span class="text-[10px] font-bold text-primary-400/60 uppercase tracking-widest">{ticket.panelistName || 'Panelist'}</span>
							<div class="mt-1 bg-surface-200 rounded-lg p-3">
								<div class="text-sm text-neutral-300 leading-relaxed ticket-content">{@html ticket.message}</div>
							</div>
							<div class="text-[10px] text-neutral-700 mt-1">{formatDate(ticket.createdAt)}</div>
						</div>

						<!-- Legacy admin reply -->
						{#if ticket.adminReply}
							<div>
								<span class="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest">Admin</span>
								<div class="mt-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
									<div class="text-sm text-neutral-300 leading-relaxed ticket-content">{@html ticket.adminReply}</div>
								</div>
								{#if ticket.repliedAt}
									<div class="text-[10px] text-neutral-700 mt-1">{formatDate(ticket.repliedAt)}</div>
								{/if}
							</div>
						{/if}

						<!-- Thread replies -->
						{#each (ticketNotes[ticket.id] ?? []).filter(n => !n.isInternal) as note (note.id)}
							{@const isAdmin = note.authorId !== ticket.panelistId}
							<div>
								<span class="text-[10px] font-bold uppercase tracking-widest {isAdmin ? 'text-emerald-400/60' : 'text-primary-400/60'}">
									{isAdmin ? (note.authorName || 'Admin') : (ticket.panelistName || 'Panelist')}
								</span>
								<div class="mt-1 rounded-lg p-3 {isAdmin ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-surface-200'}">
									<div class="text-sm text-neutral-300 leading-relaxed ticket-content">{@html note.message}</div>
								</div>
								<div class="text-[10px] text-neutral-700 mt-1">{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
							</div>
						{/each}

						<!-- Internal notes (collapsed) -->
						{#if (ticketNotes[ticket.id] ?? []).filter(n => n.isInternal).length > 0}
							<div class="mt-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
								<div class="flex items-center gap-1.5 mb-2">
									<StickyNote class="w-3 h-3 text-amber-400/60" />
									<span class="text-[10px] font-bold text-amber-400/60 uppercase tracking-widest">Internal Notes</span>
								</div>
								{#each (ticketNotes[ticket.id] ?? []).filter(n => n.isInternal) as note}
									<div class="text-xs text-neutral-400 mb-1">
										<span class="font-medium text-neutral-300">{note.authorName}:</span> {note.message}
										<span class="text-neutral-600 ms-1">{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Ticket Points History -->
						{#if ticketContext[ticket.id]?.ticketPoints?.length}
							<div class="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
								<div class="flex items-center gap-1.5 mb-2">
									<Coins class="w-3 h-3 text-amber-400/60" />
									<span class="text-[10px] font-bold text-amber-400/60 uppercase tracking-widest">Points Assigned from Ticket</span>
								</div>
								{#each ticketContext[ticket.id].ticketPoints as pt}
									<div class="flex items-center justify-between text-xs mb-1">
										<span class="text-neutral-400">{pt.description}</span>
										<div class="flex items-center gap-2">
											<span class="text-neutral-600">{new Date(pt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
											<span class="font-bold {pt.points > 0 ? 'text-emerald-400' : 'text-rose-400'}">{pt.points > 0 ? '+' : ''}{pt.points}</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Points section (toggle) -->
						{#if ticket.status === 'open' || ticket.status === 'in_progress'}
							{#if !showPointsForm}
								<button onclick={() => showPointsForm = true} class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-200 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors">
									<Coins class="w-3.5 h-3.5" /> Assign Points
								</button>
							{:else}
								<div class="p-3 bg-surface-200 rounded-lg">
									<div class="flex items-center justify-between mb-2">
										<div class="flex items-center gap-2">
											<Coins class="w-3.5 h-3.5 text-amber-400" />
											<span class="text-xs font-bold text-white">Assign Points</span>
										</div>
										<button onclick={() => showPointsForm = false} class="p-1 rounded text-neutral-600 hover:text-white hover:bg-white/5 transition-colors">
											<X class="w-3 h-3" />
										</button>
									</div>
									<div class="flex items-center gap-2">
										<input type="number" bind:value={pointsAmount} min="1" placeholder="Pts" class="input !py-1.5 !text-xs w-20" />
										<select bind:value={pointsType} class="select !py-1.5 !text-xs !w-auto">
											<option value="bonus">Bonus</option>
											<option value="adjustment">Adjust</option>
											<option value="penalty">Penalty</option>
										</select>
										<input type="text" bind:value={pointsDesc} placeholder="Reason" class="input !py-1.5 !text-xs flex-1" />
										<button onclick={() => assignPoints(ticket.panelistId, ticket.id)} disabled={pointsSubmitting || pointsAmount <= 0 || !pointsDesc.trim()} class="btn-primary !py-1.5 !px-2.5 !text-xs">
											{#if pointsSubmitting}<Loader class="w-3 h-3 animate-spin" />{:else}Assign{/if}
										</button>
									</div>
									{#if pointsMsg}
										<p class="text-xs mt-1.5 {pointsMsg.includes('Failed') ? 'text-rose-400' : 'text-emerald-400'}">{pointsMsg}</p>
									{/if}
								</div>
							{/if}
						{/if}
					</div>

					<!-- Bottom: Reply + Note inputs -->
					<div class="px-5 py-3 border-t border-white/[0.06] flex-shrink-0 space-y-2">
						{#if ticket.status !== 'closed'}
							<div class="flex gap-2">
								<input type="text" bind:value={replyText} placeholder="Reply to panelist..." class="input !py-2 !text-sm flex-1" maxlength="5000" onkeydown={(e) => { if (e.key === 'Enter' && replyText.trim()) handleReply(ticket.id); }} />
								<select bind:value={replyStatus} class="select !py-2 !text-xs !w-auto">
									<option value="resolved">Resolve</option>
									<option value="in_progress">In Progress</option>
									<option value="open">Keep Open</option>
									<option value="closed">Close</option>
								</select>
								<button onclick={() => handleReply(ticket.id)} disabled={submitting || !replyText.trim()} class="btn-primary !py-2 !px-3">
									{#if submitting}<Loader class="w-4 h-4 animate-spin" />{:else}<Send class="w-4 h-4" />{/if}
								</button>
							</div>
						{/if}
						<div class="flex gap-2">
							<input type="text" bind:value={noteText} placeholder="Internal note (not visible to panelist)..." class="input !py-1.5 !text-xs flex-1 !border-amber-500/15" onkeydown={(e) => { if (e.key === 'Enter' && noteText.trim()) addNote(ticket.id); }} />
							<button onclick={() => addNote(ticket.id)} disabled={noteSubmitting || !noteText.trim()} class="btn-secondary !py-1.5 !px-2.5 !text-[10px]">
								{#if noteSubmitting}<Loader class="w-3 h-3 animate-spin" />{:else}<StickyNote class="w-3 h-3" /> Note{/if}
							</button>
						</div>
					</div>

				{:else}
					<!-- No ticket selected -->
					<div class="flex-1 flex items-center justify-center">
						<div class="text-center">
							<Inbox class="w-10 h-10 text-neutral-700 mx-auto mb-3" />
							<p class="text-sm text-neutral-500">Select a ticket to view details</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
	{/if}
</div>
