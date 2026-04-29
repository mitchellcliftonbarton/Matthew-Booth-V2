<script>
  const { block } = $props();
</script>

{#if block.vimeoEmbedCode}
  <div class="vimeo-embed-block">
    {@html block.vimeoEmbedCode}
  </div>
{/if}
