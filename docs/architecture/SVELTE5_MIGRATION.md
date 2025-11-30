# Svelte 5 Migration Guide

## Overview

This document outlines the migration from Svelte 4 to Svelte 5 for the EarnMaze Survey Panel.

## Key Changes

### 1. Stores → Runes

Svelte 5 introduces runes as a replacement for the traditional store pattern.

#### Before (Svelte 4):
```typescript
// Store definition
import { writable } from 'svelte/store';

function createToastStore() {
  const { subscribe, set, update } = writable<Toast[]>([]);
  return {
    subscribe,
    add(toast) { update(toasts => [...toasts, toast]) }
  };
}

export const toastStore = createToastStore();
```

```svelte
<!-- Usage in component -->
<script>
  import { toastStore } from '$lib/stores/toast';
</script>

{#each $toastStore as toast}
  <div>{toast.message}</div>
{/each}
```

#### After (Svelte 5):
```typescript
// Store definition with runes
class ToastStore {
  toasts = $state<Toast[]>([]);
  add(toast: Toast) {
    this.toasts = [...this.toasts, toast];
  }
}

export const toastStore = new ToastStore();
```

```svelte
<!-- Usage in component -->
<script>
  import { toastStore } from '$lib/stores/toast';
</script>

{#each toastStore.toasts as toast}
  <div>{toast.message}</div>
{/each}
```

### 2. Reactive Declarations → $derived and $effect

#### Before (Svelte 4):
```svelte
<script>
  let count = 0;
  let doubled;
  $: doubled = count * 2;
  
  $: if (count > 10) {
    console.log('Count is high!');
  }
</script>
```

#### After (Svelte 5):
```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
  
  $effect(() => {
    if (count > 10) {
      console.log('Count is high!');
    }
  });
</script>
```

### 3. Event Handlers

#### Before (Svelte 4):
```svelte
<button on:click={handleClick}>Click</button>
<form on:submit|preventDefault={handleSubmit}>
```

#### After (Svelte 5):
```svelte
<button onclick={handleClick}>Click</button>
<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
```

### 4. Component State

#### Before (Svelte 4):
```svelte
<script>
  let count = 0;
  let name = 'World';
</script>
```

#### After (Svelte 5):
```svelte
<script>
  let count = $state(0);
  let name = $state('World');
</script>
```

## Migration Checklist

### Stores (✅ Completed)
- [x] `toast.ts` - Migrated to `$state` class
- [x] `theme.ts` - Migrated to `$state` class
- [x] `points.ts` - Migrated to `$state` class
- [x] `auth.ts` - Migrated to `$state` class

### Components (In Progress)
- [ ] Update all `$authStore` → `authStore.state`
- [ ] Update all `$themeStore` → `themeStore.current`
- [ ] Update all `$pointsStore` → `pointsStore.data`
- [ ] Update all `$toastStore` → `toastStore.toasts`
- [ ] Convert `$:` reactive declarations to `$derived` or `$effect`
- [ ] Convert `on:event` to `onevent`
- [ ] Convert `let var = value` to `let var = $state(value)` where needed

### Files Requiring Updates

1. `/src/routes/+layout.svelte` - ✅ Partially updated
2. `/src/routes/(public)/login/+page.svelte`
3. `/src/routes/(public)/register/+page.svelte`
4. `/src/routes/(public)/+layout.svelte`
5. `/src/lib/components/ThemeToggle.svelte`
6. `/src/lib/components/layout/Sidebar.svelte`
7. `/src/lib/components/layout/Header.svelte`
8. `/src/lib/components/ToastContainer.svelte` - ✅ Updated
9. All other `.svelte` files

## Common Patterns

### Accessing Store Values

```svelte
<!-- OLD -->
{#if $authStore.user}
  <p>Welcome {$authStore.user.name}</p>
{/if}

<!-- NEW -->
{#if authStore.state.user}
  <p>Welcome {authStore.state.user.name}</p>
{/if}
```

### Reactive Updates

```svelte
<!-- OLD -->
$: if (user) {
  fetchData(user.id);
}

<!-- NEW -->
$effect(() => {
  if (user) {
    fetchData(user.id);
  }
});
```

## Next Steps

1. Update all component files to use new store syntax
2. Convert reactive declarations
3. Update event handlers
4. Test thoroughly
5. Update tests

## Resources

- [Svelte 5 Runes Documentation](https://svelte-5-preview.vercel.app/docs/runes)
- [Migration Guide](https://svelte-5-preview.vercel.app/docs/migration-guide)
