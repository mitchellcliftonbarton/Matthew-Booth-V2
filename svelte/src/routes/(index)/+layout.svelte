<script>
  import { page } from '$app/state';
  import { goto, beforeNavigate, afterNavigate, preloadData } from '$app/navigation';
  import { setContext, tick } from 'svelte';
  import { slugify } from '$lib/utils.js';
  import EntryItem from '$lib/components/EntryItem.svelte';
  import AdditionalInfoPanel from '$lib/components/AdditionalInfoPanel.svelte';

  let { children, data } = $props();

  const isDetailOpen = $derived(page.route.id === '/(index)/index/[slug]');

  const siteTitle = $derived(data.siteSettings?.siteTitle ?? 'Matthew Booth');
  const entries = $derived(data.entries ?? []);
  const entriesIndex = $derived(data.entriesIndex ?? []);
  const categories = $derived(data.categories ?? []);

  const categoryParam = $derived(page.url.searchParams.get('category'));
  const viewParam = $derived(page.url.searchParams.get('view'));

  const filteredEntries = $derived(
    categoryParam
      ? entriesIndex.filter((e) =>
          (e.categories ?? []).some((c) => slugify(c.title) === categoryParam)
        )
      : entriesIndex
  );

  const entry = $derived(page.data.entry ?? null);

  const currentIndex = $derived(
    entry ? filteredEntries.findIndex((e) => e.slug.current === entry.slug.current) : -1
  );

  const prevEntry = $derived(
    entry ? filteredEntries[(currentIndex - 1 + filteredEntries.length) % filteredEntries.length] : null
  );
  const nextEntry = $derived(
    entry ? filteredEntries[(currentIndex + 1) % filteredEntries.length] : null
  );

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
  const prevUrl = $derived(prevEntry ? buildUrl(`/index/${prevEntry.slug.current}`) : closeUrl);
  const nextUrl = $derived(nextEntry ? buildUrl(`/index/${nextEntry.slug.current}`) : closeUrl);

  // Preload the adjacent entries' data on every detail page load so Prev/Next
  // and arrow-key navigation swap in instantly (no load gap = no visible jump).
  $effect(() => {
    if (!isDetailOpen || filteredEntries.length <= 1) return;
    preloadData(prevUrl);
    preloadData(nextUrl);
  });

  // info panel state — shared with detail page via context
  let infoOpen = $state(false);
  let panelTransition = $state(true);

  setContext('entryDetail', {
    get infoOpen() { return infoOpen; },
    setInfoOpen: (v) => { infoOpen = v; },
  });

  $effect(() => {
    if (!isDetailOpen) {
      infoOpen = false;
      panelTransition = true;
    }
  });

  let savedScrollY = 0;

  beforeNavigate(({ from, to }) => {
    const fromDetail = from?.route?.id === '/(index)/index/[slug]';
    const toDetail = to?.route?.id === '/(index)/index/[slug]';

    if (toDetail && !fromDetail) {
      savedScrollY = window.scrollY;
    }

    // Collapse the info panel and kill the slide animation *before* the next
    // entry mounts, so the incoming (freshly-keyed) panel renders at the top
    // with no transition to animate. Because the neighbours are preloaded, the
    // navigation resolves in the same paint — the outgoing entry isn't seen
    // snapping, and the new one simply appears at the top.
    panelTransition = false;
    infoOpen = false;
  });

  afterNavigate(async ({ from }) => {
    if (from?.route?.id === '/(index)/index/[slug]') {
      window.scrollTo({ top: savedScrollY, behavior: 'instant' });
    }
    // New entry is mounted at the top; re-enable the animation a tick later so
    // subsequent user toggles of the info panel slide as expected.
    await tick();
    panelTransition = true;
  });

  function handleKeydown(e) {
    if (!isDetailOpen) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    if (e.key === 'ArrowLeft') goto(prevUrl, { noScroll: true });
    else if (e.key === 'ArrowRight') goto(nextUrl, { noScroll: true });
    else if (e.key === 'Escape') goto(closeUrl, { noScroll: true });
    else if (e.key === 'ArrowDown' && !infoOpen && entry?.showInformationSection) infoOpen = true;
    else if (e.key === 'ArrowUp' && infoOpen) infoOpen = false;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- index always stays mounted -->
<div id="entries-container" class={viewParam === 'grid' ? 'is-grid-view' : ''}>
  <div class="inner">
    {#each entries as entry (entry._id)}
      <EntryItem {entry} />
    {/each}
  </div>
</div>

<!-- detail overlay shell — always present when detail is open, children always rendered -->
<div id="entry-detail" class="fixed inset-0 z-[1000] bg-white" class:info-open={infoOpen} class:hidden={!isDetailOpen}>

  <!-- header -->
  {#if entry}
    <div class="carousel-header absolute top-0 left-0 px-base py-line flex justify-between items-start w-full pointer-events-none z-[1000]">
      <a href={closeUrl} class="pointer-events-auto" data-sveltekit-noscroll>{siteTitle}</a>

      <div class="carousel-controls flex items-start gap-16 select-none">
        <p class="entry-tracker pointer-events-auto">
          <span>{trackerLabel}</span>
          <span> {currentIndex + 1}</span>/<span>{filteredEntries.length}</span>
        </p>

        <div class="flex items-start gap-sm">
          <a href={closeUrl} class="pointer-events-auto" data-sveltekit-noscroll>Close</a>
        </div>
      </div>
    </div>
  {/if}

  <!-- slide panels wrapper — keyed on slug so child components fully remount on entry change -->
  {#key entry?.slug?.current}
  <div class="slide-panels" style={panelTransition ? '' : 'transition: none;'}>
    {@render children()}

    {#if entry?.showInformationSection}
      <AdditionalInfoPanel
        {entry}
        isOpen={infoOpen}
        onClose={() => { infoOpen = false; }}
      />
    {/if}
  </div>
  {/key}

  <!-- footer -->
  {#if entry && (entry.showTitleInFooter || entry.showInformationSection || filteredEntries.length > 1)}
    <div class="slide-footer sticky bottom-0 flex items-end justify-between pointer-events-none w-full px-base py-line">

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

      <div class="flex items-end gap-sm">
        {#if filteredEntries.length > 1}
          <div class="flex items-center gap-[2rem]">
            <a href={prevUrl} class="pointer-events-auto" data-sveltekit-noscroll data-sveltekit-preload-data="hover">Previous</a>
            <a href={nextUrl} class="pointer-events-auto" data-sveltekit-noscroll data-sveltekit-preload-data="hover">Next</a>
          </div>
        {/if}
      </div>

    </div>
  {/if}

</div>
