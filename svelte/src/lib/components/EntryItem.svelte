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

  // resolve thumbnail: custom override or auto-derived from first block
  const thumbnail = $derived((() => {
    if (entry.useCustomThumbnail && entry.customThumbnail) return entry.customThumbnail;
    const b = entry.firstBlock;
    if (!b) return null;
    if (b._type === 'singleMediaBlock') return { mediaType: b.mediaType, image: b.image, video: { asset: { url: b.video?.asset?.url ?? null } } };
    if (b._type === 'carouselBlock' && b.firstMedia) return { mediaType: b.firstMedia.mediaType, image: b.firstMedia.image, video: { asset: { url: b.firstMedia.videoUrl ?? null } } };
    return null;
  })());

  const hasImage = $derived(thumbnail?.mediaType === 'image' && !!thumbnail?.image?.asset?.url);
  const hasVideo = $derived(thumbnail?.mediaType === 'video' && !!thumbnail?.video?.asset?.url);
</script>

<div class="entry-item {isActive ? 'active' : ''}" categories={categorySlugs.join(',')}>
  <a href={entryUrl} data-sveltekit-preload-data="hover">
    <div class="image">
      {#if hasImage}
        <figure class="img-thumbnail aspect-square">
          <Image item={thumbnail.image} fetchWidth={500} />
        </figure>
      {:else if hasVideo}
        <figure class="img-thumbnail aspect-square">
          <video muted preload="metadata">
            <source src="{thumbnail.video.asset.url}#t=0.1" type="video/mp4" />
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

    <div class="title" class:opacity-35={entry.externalAuthor}>
      <div class={entry.italicizeTitle ? 'italic' : ''}>{entry.title}</div>
    </div>

    <div class="categories hidden lg:block">
      <p class="opacity-[.35]">{categoryLabels}</p>
    </div>

    <div class="description hidden lg:block" class:opacity-35={entry.externalAuthor}>
      <div>{descriptionText || '-'}</div>
    </div>

    <div class="date flex justify-end" class:opacity-35={entry.externalAuthor}>
      <p>{entry.year || '-'}</p>
    </div>
  </a>
</div>
