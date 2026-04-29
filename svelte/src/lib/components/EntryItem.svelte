<script>
  // imports
  import { page } from '$app/state';
  import Image from './Image.svelte';
  import IconDocument from './IconDocument.svelte';
  import Portable from './Portable.svelte';
  import { slugify } from '$lib/utils.js';
  import { toPlainText } from '@portabletext/svelte';

  // props
  const { entry } = $props();

  // url params
  const categoryParam = $derived(page.url.searchParams.get('category'));
  const viewParam = $derived(page.url.searchParams.get('view'));

  // derive slugified category values to match against ?category param
  const categorySlugs = $derived((entry.categories ?? []).map((c) => slugify(c.title)));

  // active when no category filter is set, or the entry belongs to the active category
  const isActive = $derived(
    categoryParam === null || categorySlugs.includes(categoryParam)
  );

  // used to show the document icon + text preview fallback when there's no featured image
  const isTextsCategory = $derived(
    (entry.categories ?? []).some((c) => c.title === 'Texts')
  );

  // comma-separated singular category titles for display
  const categoryLabels = $derived(
    (entry.categories ?? []).map((c) => c.singularTitle).join(', ')
  );

  // plain text version of description for list display
  const descriptionText = $derived(toPlainText(entry.description ?? []));

  // builds a url preserving existing params, merging in any overrides
  function buildUrl(newParams) {
    const url = new URL(page.url);
    for (const [key, value] of Object.entries(newParams)) {
      if (value === null || value === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    }
    return url.pathname + (url.search || '');
  }

  // entry url preserves the active category and view params
  const entryUrl = $derived(
    buildUrl({ category: categoryParam, view: viewParam }).replace('/', `/index/${entry.slug.current}`)
  );

  // featured media type flags
  const hasImage = $derived(entry.featuredImage?.mediaType === 'image' && !!entry.featuredImage?.image?.asset?.url);
  const hasVideo = $derived(entry.featuredImage?.mediaType === 'video' && entry.featuredImage?.video?.asset?.url);
</script>

<div class="entry-item {isActive ? 'active' : ''}" categories={categorySlugs.join(',')}>
  <a href={entryUrl}>
    <div class="image">
      {#if hasImage}
        <figure class="img-thumbnail aspect-square">
          <Image imageUrl={entry.featuredImage?.image?.asset?.url} alt={entry.title} width={500} />
        </figure>
      {:else if hasVideo}
        <figure class="img-thumbnail aspect-square">
          <video muted preload="metadata">
            <source src={entry.featuredImage.video.asset.url} type="video/mp4" />
          </video>
        </figure>
      {:else if isTextsCategory}
        <!-- no featured image: show document icon and text preview for Texts entries -->
        <figure class="text-icon aspect-square">
          <IconDocument />
        </figure>

        <div class="text-preview text-sm">
          {#if entry.firstTextBlock?.length}
            <div class="rich-text-breaks-only">
              <Portable value={entry.firstTextBlock} />
            </div>
          {:else}
            <p>{entry.title}</p>
          {/if}
        </div>
      {/if}
    </div>

    <div class="title">
      <div class={entry.italicizeTitle ? 'italic' : ''}>{entry.title}</div>
    </div>

    <div class="categories hidden lg:block">
      <p class="opacity-[.35]">{categoryLabels}</p>
    </div>

    <div class="description hidden lg:block">
      <div>{descriptionText || '-'}</div>
    </div>

    <div class="date flex justify-end">
      <p>{entry.year || '-'}</p>
    </div>
  </a>
</div>
