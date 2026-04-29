<script>
  // imports
	import { urlFor } from '$lib/sanity/client';
	import { onMount } from 'svelte';

	// define props
	let { imageUrl, alt, classes, width = 2600, preload = false } = $props();

	// get src
	const src = $derived(urlFor(imageUrl).width(width).url());

	console.log(src)
	let preloadSrc = $state(null);

	onMount(() => {
		if (preload) {
			// Use Promise.resolve().then() to defer preloading until after the current execution stack
			Promise.resolve().then(() => {
				const img = new Image();
				img.src = src;
				img.onload = () => {
					preloadSrc = src;
				};
			});
		}
	});
</script>

<img src={preloadSrc} {alt} class={classes} loading={preload ? 'eager' : 'lazy'} />
