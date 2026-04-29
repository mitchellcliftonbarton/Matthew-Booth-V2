<script>
  // imports
  import { urlFor } from '$lib/sanity/client';

  // props
  let { imageUrl, alt, classes, width = 2600 } = $props();

  // build src from sanity image url builder
  const src = $derived(urlFor(imageUrl).width(width).url());

  // track load state to add 'loaded' class when image is ready
  let loaded = $state(false);
  const classList = $derived([classes, loaded ? 'loaded' : ''].filter(Boolean).join(' '));
</script>

<img
  {src}
  {alt}
  class={classList}
  loading="lazy"
  onload={() => { loaded = true; }}
  onerror={() => { loaded = true; }}
/>
