<script>
  const { data } = $props();
  const siteTitle = $derived(data.siteSettings?.siteTitle ?? 'Matthew Booth');
</script>

<svelte:head>
  <title>{siteTitle}</title>
</svelte:head>

<p>Matthew Booth</p>
