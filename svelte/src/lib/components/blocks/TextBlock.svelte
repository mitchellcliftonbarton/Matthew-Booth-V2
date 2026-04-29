<script>
  import Portable from '$lib/components/Portable.svelte';
  const { block } = $props();
</script>

<div class="text-block rich-text">
  <Portable value={block.text} />
</div>
