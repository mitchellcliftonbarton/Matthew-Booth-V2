<script>
  import Portable from '$lib/components/Portable.svelte';
  const { block } = $props();
</script>

<div class="cv-section-block space-y-base">
  {#if block.title}
    <h2>{block.title}</h2>
  {/if}

  {#if block.years?.length}
    <div>
      {#each block.years as item}
        <div class="grid grid-cols-6 gap-sm">
          {#if item.year}
            <span class="col-span-1">{item.year}</span>
          {/if}
          
          <div class="col-span-5 rich-text"><Portable value={item.text} /></div>
        </div>
      {/each}
    </div>
  {/if}
</div>
