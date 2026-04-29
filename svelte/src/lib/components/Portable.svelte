<script>
	import { PortableText } from '@portabletext/svelte';

	const { value } = $props();
</script>

<PortableText {value} />
