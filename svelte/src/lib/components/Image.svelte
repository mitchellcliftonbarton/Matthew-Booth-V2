<script>
  import { urlFor } from '$lib/sanity/client.js';

  let { item, fetchWidth = 1800, classes, loading = 'lazy' } = $props();

  const dimensions = $derived(item?.asset?.metadata?.dimensions);
  const src = $derived(urlFor(item.asset).width(fetchWidth).url());

  let loaded = $state(false);
  const classList = $derived([classes, loaded ? 'loaded' : ''].filter(Boolean).join(' '));
</script>

<img
  {src}
  alt={item.alt || item.caption || ''}
  width={dimensions?.width}
  height={dimensions?.height}
  class={classList}
  {loading}
  onload={() => { loaded = true; }}
  onerror={() => { loaded = true; }}
/>
