<script>
  import { onMount } from 'svelte';
  import Image from '$lib/components/Image.svelte';

  let { block, eager = false } = $props();

  const media = $derived(
    (block.media ?? []).filter((item) =>
      item.mediaType === 'image' ? !!item.image : item.mediaType === 'video' ? !!item.videoUrl : false
    )
  );
  const firstItem = $derived(media[0]);

  const aspectRatio = $derived.by(() => {
    if (!firstItem) return 16 / 9;
    if (firstItem.mediaType === 'image') {
      const dims = firstItem.image?.asset?.metadata?.dimensions;
      if (dims?.width && dims?.height) return dims.width / dims.height;
    }
    return 16 / 9;
  });

  const slideCount = $derived(media.length);
  const currentCaption = $derived(media[currentIndex]?.caption ?? '');

  let currentIndex = $state(0);
  let videoEls = $state([]);

  function advance() {
    const oldVideo = videoEls[currentIndex];
    if (oldVideo) { oldVideo.pause(); oldVideo.currentTime = 0; }

    currentIndex = (currentIndex + 1) % slideCount;

    const newVideo = videoEls[currentIndex];
    if (newVideo) { newVideo.currentTime = 0; newVideo.play().catch(() => {}); }
  }

  onMount(() => {
    const firstVideo = videoEls[0];
    if (firstVideo) firstVideo.play().catch(() => {});
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<section
  class="carousel-block"
  style="max-width: calc(var(--inner-height-blocks) * {aspectRatio});"
  onclick={advance}
>
  <div class="carousel-slides" style="aspect-ratio: {aspectRatio};">
    {#each media as item, i}
      <div class="carousel-slide" class:active={i === currentIndex} aria-hidden={i !== currentIndex}>
        {#if item.mediaType === 'image' && item.image}
          <Image
            item={item.image}
            classes="media-cover"
            loading="eager"
          />
        {:else if item.mediaType === 'video' && item.videoUrl}
          <video
            src={item.videoUrl}
            muted
            loop
            playsinline
            preload="auto"
            class="media-cover"
            bind:this={videoEls[i]}
          ></video>
        {/if}
      </div>
    {/each}
  </div>

  {#if currentCaption || slideCount > 1}
    <div class="carousel-caption">
      <span>{currentCaption}</span>
      {#if slideCount > 1}
        <span class="slide-count">{currentIndex + 1}/{slideCount}</span>
      {/if}
    </div>
  {/if}
</section>
