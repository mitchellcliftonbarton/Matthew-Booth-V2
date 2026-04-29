<script>
  // imports
  import { page } from '$app/state';
  import EntryItem from '$lib/components/EntryItem.svelte';

  // props
  const { data } = $props();

  // derived
  const siteTitle = $derived(data.siteSettings?.siteTitle ?? 'Matthew Booth');
  const entries = $derived(data.entries ?? []);
  const viewParam = $derived(page.url.searchParams.get('view'));
</script>

<svelte:head>
  <title>{siteTitle}</title>
</svelte:head>

<!-- entries-container gets is-grid-view when ?view=grid is set -->
<div id="entries-container" class={viewParam === 'grid' ? 'is-grid-view' : ''}>
  <div class="inner">
    {#each entries as entry (entry._id)}
      <EntryItem {entry} />
    {/each}
  </div>
</div>
