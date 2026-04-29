<script>
  import { page } from '$app/state';
  import Portable from './Portable.svelte';

  // get site settings
  const siteSettings = $derived(page?.data?.siteSettings);
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
</header>