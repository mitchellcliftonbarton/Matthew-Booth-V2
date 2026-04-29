<script>
  // imports
  import { page } from '$app/state';
  import Portable from './Portable.svelte';
  import { slugify } from '$lib/utils.js';

  // derived
  const siteSettings = $derived(page?.data?.siteSettings);
  const categories = $derived(page?.data?.categories ?? []);

  // params
  const categoryParam = $derived(page.url.searchParams.get('category'));
  const viewParam = $derived(page.url.searchParams.get('view'));
  const showFilters = $derived(page.route.id === '/');

  // function to build link urls
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

</script>

<header id="main-nav" class="px-base py-line">
  {#if siteSettings?.globalIntro}
    <div class="rich-text">
      <Portable value={siteSettings.globalIntro} />
    </div>
  {/if}

  {#if siteSettings?.navLinks && siteSettings.navLinks.length > 0}
    <nav class="main-links">
      <ul class="flex gap-[.3em]">
        <li>
          <a href="/">Home</a>{#if siteSettings.navLinks.length > 0},{/if}
        </li>

        {#each siteSettings.navLinks as link, i}
          <li>
            <a href={link.url} target={link.openInNewTab ? '_blank' : null} rel={link.openInNewTab ? 'noopener noreferrer' : null}>{link.label}</a>{#if i < siteSettings.navLinks.length - 1},{/if}
          </li>
        {/each}
      </ul>
    </nav>
  {/if}

  <div id="entries-filters" class={showFilters ? 'active' : ''}>
    <nav class="order-2 lg:order-1 category-links">
      <ul class="flex items-center flex-wrap gap-xs">
        <li>
          <a
            href={buildUrl({ category: null, view: viewParam })}
            class={categoryParam === null ? 'link-active' : ''}
          >Everything</a>
        </li>

        {#each categories as category}
          {@const slug = slugify(category.title)}
          <li>
            <a
              href={buildUrl({ category: slug, view: viewParam })}
              class={categoryParam === slug ? 'link-active' : ''}
            >{category.title}</a>
          </li>
        {/each}
      </ul>
    </nav>

    <nav class="order-1 lg:order-2 list-grid-toggle">
      <ul class="flex items-center flex-wrap">
        <li>
          <a
            href={buildUrl({ category: categoryParam, view: null })}
            class={viewParam === null ? 'link-active' : ''}
          >List</a>
        </li>
        <li>
          <a
            href={buildUrl({ category: categoryParam, view: 'grid' })}
            class={viewParam === 'grid' ? 'link-active' : ''}
          >Grid</a>
        </li>
      </ul>
    </nav>
  </div>
</header>
