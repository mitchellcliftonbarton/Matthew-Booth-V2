<script>
  import TextBlock from '$lib/components/blocks/TextBlock.svelte';
  import CvSectionBlock from '$lib/components/blocks/CvSectionBlock.svelte';
  import VimeoEmbedBlock from '$lib/components/blocks/VimeoEmbedBlock.svelte';

  const { data } = $props();
  const page = $derived(data.page);
  const siteTitle = $derived(data.siteSettings?.siteTitle ?? 'Matthew Booth');
</script>

<svelte:head>
  <title>{page.title} — {siteTitle}</title>
</svelte:head>

<div class="default-page pt-base pb-60 px-base space-y-base w-full lg:w-1/2">
  {#if page.blocks?.length}
    {#each page.blocks as block (block._key)}
      {#if block._type === 'textBlock'}
        <TextBlock {block} />
      {:else if block._type === 'cvSectionBlock'}
        <CvSectionBlock {block} />
      {:else if block._type === 'vimeoEmbedBlock'}
        <VimeoEmbedBlock {block} />
      {/if}
    {/each}
  {/if}
</div>
