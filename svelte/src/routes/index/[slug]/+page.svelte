<script>
  // imports
  import { page } from '$app/state';
  import { slugify } from '$lib/utils.js';

  // props
  const { data } = $props();

  // data
  const entry = $derived(data.entry);
  const entriesIndex = $derived(data.entriesIndex ?? []);
  const categories = $derived(data.categories ?? []);
  const siteTitle = $derived(data.siteSettings?.siteTitle ?? 'Matthew Booth');

  // url params
  const categoryParam = $derived(page.url.searchParams.get('category'));
  const viewParam = $derived(page.url.searchParams.get('view'));

  // filter the entries index by the active category param
  const filteredEntries = $derived(
    categoryParam
      ? entriesIndex.filter((e) =>
          (e.categories ?? []).some((c) => slugify(c.title) === categoryParam)
        )
      : entriesIndex
  );

  // position of the current entry in the filtered list
  const currentIndex = $derived(
    filteredEntries.findIndex((e) => e.slug.current === entry.slug.current)
  );

  const prevEntry = $derived(filteredEntries[(currentIndex - 1 + filteredEntries.length) % filteredEntries.length]);
  const nextEntry = $derived(filteredEntries[(currentIndex + 1) % filteredEntries.length]);

  // tracker label is the active category title, or 'Entry' if no filter
  const trackerLabel = $derived(
    categoryParam
      ? (categories.find((c) => slugify(c.title) === categoryParam)?.title ?? 'Entry')
      : 'Entry'
  );

  // build a url to a given pathname, preserving category and view params
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
</script>

<svelte:head>
  <title>{entry.title} — {siteTitle}</title>
</svelte:head>

<!-- fixed full-screen container sitting above everything -->
<div id="entry-detail" class="fixed inset-0 z-[1000] bg-white">

  <!-- header: absolute so it overlays the scroll container below -->
  <div class="carousel-header absolute top-0 left-0 px-base py-line flex justify-between items-start w-full pointer-events-none z-[1000]">
    <a href={closeUrl} class="closer pointer-events-auto">{siteTitle}</a>

    <div class="carousel-controls flex items-start gap-16 select-none">
      <!-- entry tracker: hidden on mobile -->
      {#if filteredEntries.length > 1}
        <p class="entry-tracker hidden lg:block pointer-events-auto">
          <span class="current-category">{trackerLabel}</span>
          <span class="entry-index"> {currentIndex + 1}</span>/<span class="entry-total">{filteredEntries.length}</span>
        </p>
      {/if}

      <div class="flex items-start gap-sm">
        <div class="prev-next flex items-center gap-sm">
          <a href={prevUrl} class="pointer-events-auto">Previous</a>
          <a href={nextUrl} class="pointer-events-auto">Next</a>
        </div>

        <a href={closeUrl} class="closer pointer-events-auto">Close</a>
      </div>
    </div>
  </div>

  <!-- scroll container: fills the full screen, scrolls internally -->
  <div class="slide-item-inner relative h-[100dvh] flex flex-col overflow-y-scroll overflow-x-hidden">

    <!-- main content placeholder (blocks go here) -->
    <div class="slide-blocks w-full lg:w-2/3 mx-auto px-base lg:px-0 flex-1 flex items-center justify-center">
      <p class={entry.italicizeTitle ? 'italic' : ''}>{entry.title}</p>
    </div>

    <!-- footer: sticky to the bottom of the scroll container -->
    {#if entry.showTitleInFooter || entry.showInformationSection}
      <div class="slide-footer sticky bottom-0 flex items-end pointer-events-none w-full px-base py-line {entry.showTitleInFooter ? 'justify-between' : 'justify-end'}">
        {#if entry.showTitleInFooter}
          <p class="pointer-events-auto {entry.italicizeTitle ? 'italic' : ''}">{entry.title}</p>
        {/if}

        {#if entry.showInformationSection}
          <button class="info-button hidden pointer-events-auto">Information</button>
        {/if}
      </div>
    {/if}

  </div>
</div>
