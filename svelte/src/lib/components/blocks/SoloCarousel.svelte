<script>
  import { onMount } from 'svelte';
  import Image from '$lib/components/Image.svelte';
  import { attachMuxStream, muxPosterUrl } from '$lib/mux.js';

  let { block } = $props();

  const media = $derived(
    (block.media ?? []).filter((item) =>
      item.mediaType === 'image'
        ? !!item.image
        : item.mediaType === 'muxVideo'
          ? !!item.muxPlaybackId
          : item.mediaType === 'video'
            ? !!item.videoUrl
            : false
    )
  );
  const slideCount = $derived(media.length);

  // Known intrinsic ratio (images and Mux videos — file videos don't carry
  // dimensions). Lets CSS reserve the slide's box before the file loads;
  // without it the slide shrink-wraps to the caption and centers it in the
  // viewport.
  function itemRatio(item) {
    if (item.mediaType === 'image') {
      const d = item.image?.asset?.metadata?.dimensions;
      if (d?.width && d?.height) return d.width / d.height;
    }
    if (item.mediaType === 'muxVideo' && item.muxAspectRatio) {
      const [w, h] = String(item.muxAspectRatio).split(':').map(Number);
      if (w > 0 && h > 0) return w / h;
    }
    return null;
  }

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

    // wire Mux HLS streams to their video elements
    const detachers = media
      .map((item, i) =>
        item.mediaType === 'muxVideo' && videoEls[i]
          ? attachMuxStream(videoEls[i], item.muxPlaybackId)
          : null
      )
      .filter(Boolean);

    // play video if first slide is a video
    const firstVideo = videoEls[0];
    if (firstVideo) firstVideo.play().catch(() => {});

    return () => detachers.forEach((detach) => detach());
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<section class="solo-carousel" bind:this={containerEl}>
  {#each media as item, i}
    {@const ratio = itemRatio(item)}
    <div class="solo-slide" class:active={i === currentIndex} aria-hidden={i !== currentIndex}>
      <figure class:has-ratio={ratio} style={ratio ? `--media-ratio: ${ratio}` : ''}>
        <div class="slide-media" onclick={advance}>
          {#if item.mediaType === 'image' && item.image}
            <Image
              item={item.image}
              loading="eager"
            />
          {:else if item.mediaType === 'muxVideo' && item.muxPlaybackId}
            <video
              poster={muxPosterUrl(item.muxPlaybackId, 1800, item.muxThumbTime ?? 0)}
              muted
              loop
              playsinline
              preload="auto"
              bind:this={videoEls[i]}
            ></video>
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
