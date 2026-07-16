<script>
  import { page } from '$app/state';
  import { goto, beforeNavigate, afterNavigate, preloadData } from '$app/navigation';
  import { setContext } from 'svelte';
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
  // and arrow-key navigation swap in instantly (no load gap = no visible flash
  // of the outgoing entry). Done sequentially: preloadData shares a single
  // in-flight slot, so firing both at once aborts the first — which left the
  // "previous" entry uncached and flashing on prev navigation.
  $effect(() => {
    if (!isDetailOpen || filteredEntries.length <= 1) return;
    let cancelled = false;
    (async () => {
      for (const url of [prevUrl, nextUrl]) {
        if (cancelled) return;
        try {
          await preloadData(url);
        } catch {
          // ignore preload failures — navigation will still work, just not warmed
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  });

  // info panel state — shared with detail page via context
  let infoOpen = $state(false);
  // whether the next panel move may animate: true only for deliberate
  // toggles (Information button, up/down arrows); cleared on navigation so
  // prev/next swaps snap instantly
  let panelAnimate = $state(false);

  function toggleInfo(open) {
    panelAnimate = true;
    infoOpen = open;
  }

  setContext('entryDetail', {
    get infoOpen() { return infoOpen; },
    setInfoOpen: (v) => toggleInfo(v),
  });

  $effect(() => {
    if (!isDetailOpen) {
      infoOpen = false;
    }
  });

  let savedScrollY = 0;

  beforeNavigate(({ from, to }) => {
    const fromDetail = from?.route?.id === '/(index)/index/[slug]';
    const toDetail = to?.route?.id === '/(index)/index/[slug]';

    if (toDetail && !fromDetail) {
      savedScrollY = window.scrollY;
    }
    // Deliberately NOT closing the info panel here: the swap can be a frame
    // or two away (SvelteKit's preload cache only retains one neighbour, so
    // the other direction re-runs its load), and closing now would reveal the
    // outgoing entry's main slide in that gap — the "flash". Keep the panel
    // covering it until the new entry is mounted.
    panelAnimate = false;
  });

  afterNavigate(({ from }) => {
    if (from?.route?.id === '/(index)/index/[slug]') {
      window.scrollTo({ top: savedScrollY, behavior: 'instant' });
    }
    // New entry is mounted; close the panel in the same task so the closed
    // state is what gets painted first.
    infoOpen = false;
  });

  function handleKeydown(e) {
    if (!isDetailOpen) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    if (e.key === 'ArrowLeft') goto(prevUrl, { noScroll: true });
    else if (e.key === 'ArrowRight') goto(nextUrl, { noScroll: true });
    else if (e.key === 'Escape') goto(closeUrl, { noScroll: true });
    else if (e.key === 'ArrowDown' && !infoOpen) toggleInfo(true);
    else if (e.key === 'ArrowUp' && infoOpen) toggleInfo(false);
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

      <div class="carousel-controls flex items-start gap-8 lg:gap-16 select-none">
        <p class="entry-tracker pointer-events-auto">
          <span>{trackerLabel}</span>
          <span> {currentIndex + 1}</span>/<span>{filteredEntries.length}</span>
        </p>

        <div class="flex lg:hidden items-start gap-sm">
          <a href={closeUrl} class="pointer-events-auto" data-sveltekit-noscroll>Close</a>
        </div>

        {#if filteredEntries.length > 1}
          <div class="hidden lg:flex items-center gap-8">
            <a href={prevUrl} class="pointer-events-auto" data-sveltekit-noscroll data-sveltekit-preload-data="hover">Previous</a>
            <a href={nextUrl} class="pointer-events-auto" data-sveltekit-noscroll data-sveltekit-preload-data="hover">Next</a>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- slide panels wrapper — keyed on slug so child components fully remount on entry change -->
  {#key entry?.slug?.current}
  <div class="slide-panels" class:animate={panelAnimate}>
    {@render children()}

    {#if entry}
      <AdditionalInfoPanel
        {entry}
        isOpen={infoOpen}
        onClose={() => toggleInfo(false)}
      />
    {/if}
  </div>
  {/key}

  <!-- footer -->
  {#if entry && filteredEntries.length > 1}
    <div class="slide-footer sticky bottom-0 flex items-end justify-between pointer-events-none w-full px-base py-line">

      <div>
        <button
          class="info-button lg:hidden pointer-events-auto"
          onclick={() => toggleInfo(!infoOpen)}
        >{infoOpen ? 'Return' : 'Information'}</button>

        <p class="pointer-events-auto hidden lg:block" class:italic={entry.italicizeTitle}>{entry.title}</p>
      </div>

      <div class="flex items-end gap-sm">
        {#if filteredEntries.length > 1}
          <div class="flex lg:hidden items-center gap-[2rem]">
            <a href={prevUrl} class="pointer-events-auto" data-sveltekit-noscroll data-sveltekit-preload-data="hover">Previous</a>
            <a href={nextUrl} class="pointer-events-auto" data-sveltekit-noscroll data-sveltekit-preload-data="hover">Next</a>
          </div>
        {/if}

        <button
          class="info-button hidden lg:block pointer-events-auto"
          onclick={() => toggleInfo(!infoOpen)}
        >{infoOpen ? 'Return' : 'Information'}</button>
      </div>

    </div>
  {/if}

</div>
