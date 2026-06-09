<script>
  import { page } from '$app/state';
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { slugify } from '$lib/utils.js';
  import SingleMediaBlock from '$lib/components/blocks/SingleMediaBlock.svelte';
  import CarouselBlock from '$lib/components/blocks/CarouselBlock.svelte';
  import SoloCarousel from '$lib/components/blocks/SoloCarousel.svelte';
  import TextBlock from '$lib/components/blocks/TextBlock.svelte';
  import AdditionalInfoPanel from '$lib/components/AdditionalInfoPanel.svelte';

  const { data } = $props();

  const entry = $derived(data.entry);
  const entriesIndex = $derived(data.entriesIndex ?? []);
  const categories = $derived(data.categories ?? []);
  const siteTitle = $derived(data.siteSettings?.siteTitle ?? 'Matthew Booth');
  const preloadUrls = $derived(data.preloadUrls ?? []);

  // url params
  const categoryParam = $derived(page.url.searchParams.get('category'));
  const viewParam = $derived(page.url.searchParams.get('view'));

  // filter entries by active category
  const filteredEntries = $derived(
    categoryParam
      ? entriesIndex.filter((e) =>
          (e.categories ?? []).some((c) => slugify(c.title) === categoryParam)
        )
      : entriesIndex
  );

  const currentIndex = $derived(
    filteredEntries.findIndex((e) => e.slug.current === entry.slug.current)
  );

  const prevEntry = $derived(
    filteredEntries[(currentIndex - 1 + filteredEntries.length) % filteredEntries.length]
  );
  const nextEntry = $derived(filteredEntries[(currentIndex + 1) % filteredEntries.length]);

  const trackerLabel = $derived(
    categoryParam
      ? (categories.find((c) => slugify(c.title) === categoryParam)?.singularTitle ?? 'Entry')
      : 'Entry'
  );

  function buildUrl(pathname) {
    const params = new URLSearchParams();
    if (categoryParam) params.set('category', categoryParam);
    if (viewParam) params.set('view', viewParam);
    const search = params.toString();
    return pathname + (search ? `?${search}` : '');
  }

  const closeUrl = $derived(buildUrl('/'));
  const prevUrl = $derived(prevEntry ? buildUrl(`/index/${prevEntry.slug.current}`) : '/');
  const nextUrl = $derived(nextEntry ? buildUrl(`/index/${nextEntry.slug.current}`) : '/');

  // block mode detection
  const blocks = $derived(entry.blocks ?? []);
  const hasBlocks = $derived(blocks.length > 0);
  const isSingleBlock = $derived(blocks.length === 1);
  const singleBlock = $derived(isSingleBlock ? blocks[0] : null);

  // fullscreen = single block that is single-media or carousel
  const isFullscreen = $derived(
    isSingleBlock &&
    (singleBlock?._type === 'singleMediaBlock' || singleBlock?._type === 'carouselBlock')
  );

  // OG image: custom thumbnail if set, otherwise first image block
  const ogImageUrl = $derived((() => {
    if (entry.useCustomThumbnail && entry.customThumbnail?.mediaType === 'image') return entry.customThumbnail?.image?.asset?.url ?? null;
    const b = blocks[0];
    if (b?._type === 'singleMediaBlock' && b.mediaType === 'image') return b.image?.asset?.url ?? null;
    if (b?._type === 'carouselBlock') return b.media?.[0]?.image?.asset?.url ?? null;
    return null;
  })());

  // info panel state
  let infoOpen = $state(false);
  let panelTransition = $state(true);

  beforeNavigate(() => {
    panelTransition = false;
    infoOpen = false;
  });

  afterNavigate(() => {
    infoOpen = false;
    panelTransition = true;
  });

  function handleKeydown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    if (e.key === 'ArrowLeft') goto(prevUrl);
    else if (e.key === 'ArrowRight') goto(nextUrl);
    else if (e.key === 'Escape') goto(closeUrl);
    else if (e.key === 'ArrowDown' && !infoOpen && entry.showInformationSection) infoOpen = true;
    else if (e.key === 'ArrowUp' && infoOpen) infoOpen = false;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
  <title>{entry.title} — {siteTitle}</title>
  {#if ogImageUrl}
    <meta property="og:image" content={ogImageUrl} />
  {/if}
  {#each preloadUrls as url}
    <link rel="prefetch" href={url} />
  {/each}
</svelte:head>

<div id="entry-detail" class="fixed inset-0 z-[1000] bg-white" class:info-open={infoOpen}>

  <!-- header -->
  <div class="carousel-header absolute top-0 left-0 px-base py-line flex justify-between items-start w-full pointer-events-none z-[1000]">
    <a href={closeUrl} class="pointer-events-auto">{siteTitle}</a>

    <div class="carousel-controls flex items-start gap-16 select-none">
      <p class="entry-tracker pointer-events-auto">
        <span>{trackerLabel}</span>
        <span> {currentIndex + 1}</span>/<span>{filteredEntries.length}</span>
      </p>

      <div class="flex items-start gap-sm">
        <a href={closeUrl} class="pointer-events-auto">Close</a>
      </div>
    </div>
  </div>

  <!-- slide panels wrapper — shifts up when info is open -->
  <!-- keyed on slug so all child components (Swiper, Vimeo) fully remount on entry change -->
  {#key entry.slug.current}
  <div class="slide-panels" style={panelTransition ? '' : 'transition: none;'}>

    <!-- main slide -->
    <div class="slide-item-inner relative h-dvh flex flex-col overflow-y-scroll overflow-x-hidden">

      {#if isFullscreen}
        <!-- fullscreen: single block, centered, no scroll -->
        <div class="slide-blocks flex-1 flex items-center justify-center w-full lg:w-2/3 mx-auto px-base lg:px-0">

          {#if singleBlock?._type === 'singleMediaBlock'}
            <SingleMediaBlock block={singleBlock} isSolo={true} eager={true} />

          {:else if singleBlock?._type === 'carouselBlock'}
            <SoloCarousel block={singleBlock} />
          {/if}

        </div>

      {:else}
        <!-- multi-block / text: scrollable, vertically centered when short -->
        <div class="slide-blocks w-full lg:w-2/3 mx-auto px-base lg:px-0 multi-block-content">
          {#each blocks as block, i}
            {#if block._type === 'singleMediaBlock'}
              <section class="block-item">
                <SingleMediaBlock {block} isSolo={false} eager={i < 3} />
              </section>
            {:else if block._type === 'carouselBlock'}
              <section class="block-item">
                <CarouselBlock {block} eager={i < 3} />
              </section>
            {:else if block._type === 'textBlock'}
              <section class="block-item">
                <TextBlock {block} />
              </section>
            {/if}
          {/each}
        </div>
      {/if}
    </div><!-- end slide-item-inner -->

    <!-- additional info panel (stacked below, slides up via CSS) -->
    {#if entry.showInformationSection}
      <AdditionalInfoPanel
        {entry}
        isOpen={infoOpen}
        onClose={() => { infoOpen = false; }}
      />
    {/if}

  </div>
  
  <!-- footer: sticky to bottom of scroll container -->
  {#if entry.showTitleInFooter || entry.showInformationSection || filteredEntries.length > 1}
    <div class="slide-footer sticky bottom-0 flex items-end justify-between pointer-events-none w-full px-base py-line">

      <!-- left: info button / title -->
      <div>
        {#if entry.showInformationSection}
          <button
            class="info-button pointer-events-auto"
            onclick={() => { infoOpen = !infoOpen; }}
          >{infoOpen ? 'Return' : 'Information'}</button>
        {/if}
        {#if entry.showTitleInFooter}
          {#if entry.showInformationSection}
            <p class="pointer-events-auto hidden" class:italic={entry.italicizeTitle}>{entry.title}</p>
          {:else}
            <p class="pointer-events-auto" class:italic={entry.italicizeTitle}>{entry.title}</p>
          {/if}
        {/if}
      </div>

      <!-- right: prev/next -->
      <div class="flex items-end gap-sm">
        {#if filteredEntries.length > 1}
          <div class="flex items-center gap-[2rem]">
            <a href={prevUrl} class="pointer-events-auto" data-sveltekit-preload-data="hover">Previous</a>
            <a href={nextUrl} class="pointer-events-auto" data-sveltekit-preload-data="hover">Next</a>
          </div>
        {/if}
      </div>

    </div>
  {/if}<!-- end slide-panels -->
  {/key}

</div>
