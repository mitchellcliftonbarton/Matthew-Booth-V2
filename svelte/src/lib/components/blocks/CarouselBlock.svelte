<script>
  import { onMount } from 'svelte';
  import Swiper from 'swiper';
  import 'swiper/css';
  import Image from '$lib/components/Image.svelte';

  let { block } = $props();

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

  let swiperEl = $state(null);
  let swiperApi = $state(null);
  let currentSlide = $state(0);

  const slideCount = $derived(media.length);
  const currentCaption = $derived(media[currentSlide]?.caption ?? '');

  onMount(() => {
    if (!swiperEl) return;

    swiperApi = new Swiper(swiperEl, {
      speed: 0,
      loop: slideCount >= 4,
      spaceBetween: 0,
      slidesPerView: 1,
      allowTouchMove: false,
    });

    swiperApi.on('slideChange', () => {
      currentSlide = swiperApi.realIndex;

      const prevSlide = swiperApi.slides[swiperApi.activeIndex - 1];
      if (prevSlide) {
        const vid = prevSlide.querySelector('video');
        if (vid) vid.currentTime = 0;
      }

      [swiperApi.activeIndex - 1, swiperApi.activeIndex + 1].forEach((i) => {
        const slide = swiperApi.slides[i];
        if (slide) slide.querySelectorAll('img').forEach((img) => img.decode().catch(() => {}));
      });
    });

    swiperEl.addEventListener('click', () => {
      if (swiperApi.isEnd && !swiperApi.params.loop) {
        swiperApi.slideTo(0);
      } else {
        swiperApi.slideNext();
      }
    });

    swiperEl.querySelectorAll('img').forEach((img) => img.decode().catch(() => {}));

    return () => {
      swiperApi?.destroy();
      swiperApi = null;
    };
  });
</script>

<section class="carousel-block">
  <div class="swiper" bind:this={swiperEl} style="aspect-ratio: {aspectRatio};">
    <div class="swiper-wrapper">
      {#each media as item, i}
        <div class="swiper-slide">
          {#if item.mediaType === 'image' && item.image}
            <Image
              item={item.image}
              classes="media-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          {:else if item.mediaType === 'video' && item.videoUrl}
            <video
              src={item.videoUrl}
              autoplay
              muted
              loop
              playsinline
              preload="metadata"
              class="media-cover"
            ></video>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  {#if currentCaption || slideCount > 1}
    <div class="carousel-caption">
      <span>{currentCaption}</span>
      {#if slideCount > 1}
        <span class="slide-count">{currentSlide + 1}/{slideCount}</span>
      {/if}
    </div>
  {/if}
</section>
