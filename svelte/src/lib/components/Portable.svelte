<script>
	import { PortableText } from '@portabletext/svelte';
	import PlainLink from './PlainLink.svelte';

	// plainLinks: render link marks as <span> instead of <a> — required when
	// this rich text is rendered inside an anchor (nested <a> is invalid HTML
	// and breaks hydration).
	const { value, plainLinks = false } = $props();

	// Disable the dynamic hardBreak component so \n stays as a stable text node.
	// white-space: pre-line on the container then renders it as a visible line break,
	// avoiding the SSR/hydration DOM swap that causes the visual flash.
	const components = $derived(
		plainLinks ? { hardBreak: null, marks: { link: PlainLink } } : { hardBreak: null }
	);
</script>

<PortableText {value} {components} />
