<script>
  import { onMount } from 'svelte';
  import Image from '$lib/components/Image.svelte';

  let { block } = $props();

  const media = $derived(
    (block.media ?? []).filter((item) =>
      item.mediaType === 'image' ? !!item.image : item.mediaType === 'video' ? !!item.videoUrl : false
    )
  );
  const slideCount = $derived(media.length);

  let currentIndex = $state(0);
  let containerEl = $state(null);
  let videoEls = $state([]);

  function advance() {
    const oldVideo = videoEls[currentIndex];
    if (oldVideo) {
      oldVideo.pause();
      oldVideo.currentTime = 0;
    }

    currentIndex = (currentIndex + 1) % slideCount;

    const newVideo = videoEls[currentIndex];
    if (newVideo) {
      newVideo.currentTime = 0;
      newVideo.play().catch(() => {});
    }
  }

  onMount(() => {
    if (!containerEl) return;

    containerEl.querySelectorAll('img').forEach((img) => img.decode().catch(() => {}));

    // play video if first slide is a video
    const firstVideo = videoEls[0];
    if (firstVideo) firstVideo.play().catch(() => {});
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<section class="solo-carousel" bind:this={containerEl}>
  {#each media as item, i}
    <div class="solo-slide" class:active={i === currentIndex} aria-hidden={i !== currentIndex}>
      <figure>
        <div class="slide-media" onclick={advance}>
          {#if item.mediaType === 'image' && item.image}
            <Image
              item={item.image}
              loading="eager"
            />
          {:else if item.mediaType === 'video' && item.videoUrl}
            <video
              src={item.videoUrl}
              muted
              loop
              playsinline
              preload="auto"
              bind:this={videoEls[i]}
            ></video>
          {/if}
        </div>

        {#if item.caption || slideCount > 1}
          <figcaption class="carousel-caption">
            <span>{item.caption ?? ''}</span>
            {#if slideCount > 1}
              <span class="slide-count">{i + 1}/{slideCount}</span>
            {/if}
          </figcaption>
        {/if}
      </figure>
    </div>
  {/each}
</section>
