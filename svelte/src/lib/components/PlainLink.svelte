<script>
	// Renders a portable-text link mark as inert text. Used where rich text
	// sits inside an <a> (e.g. entry list previews) — nested anchors are
	// invalid HTML: the browser repairs them while parsing the SSR payload,
	// and the repaired DOM then breaks Svelte's hydration for the whole page.
	let { children } = $props();
</script>

<span>{@render children?.()}</span>
