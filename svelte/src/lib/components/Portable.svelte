<script>
	import { PortableText } from '@portabletext/svelte';

	const { value } = $props();

	// Disable the dynamic hardBreak component so \n stays as a stable text node.
	// white-space: pre-line on the container then renders it as a visible line break,
	// avoiding the SSR/hydration DOM swap that causes the visual flash.
	const components = { hardBreak: null };
</script>

<PortableText {value} {components} />
