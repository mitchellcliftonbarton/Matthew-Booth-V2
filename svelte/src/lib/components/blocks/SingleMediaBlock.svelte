<script>
  import { onMount } from 'svelte';
  import Player from '@vimeo/player';
  import Image from '$lib/components/Image.svelte';
  import { activeAudioId } from '$lib/stores/activeAudio.js';

  let { block, isSolo = false, eager = false } = $props();

  const aspectRatio = $derived(
    block.width && block.height ? block.width / block.height : 16 / 9
  );

  const isPortrait = $derived(
    block.mediaType === 'image'
      ? (block.image?.asset?.metadata?.dimensions?.height ?? 0) > (block.image?.asset?.metadata?.dimensions?.width ?? 0)
      : (block.height ?? 0) > (block.width ?? 0)
  );

  let videoEl = $state(null);
  let vimeoContainer = $state(null);
  let vimeoPlayer = $state(null);

  // unique id for this block instance
  const blockId = {};

  // play/pause hidden until autoplay attempt resolves
  let showPlayPause = $state(false);
  let isPaused = $state(false);
  const isMuted = $derived($activeAudioId !== blockId);

  // For non-autoplay native videos: claim active audio when the user hits play
  $effect(() => {
    if (block.mediaType !== 'video' || block.autoplay || !videoEl) return;
    function onPlay() { activeAudioId.set(blockId); }
    videoEl.addEventListener('play', onPlay);
    return () => videoEl.removeEventListener('play', onPlay);
  });

  // When this block loses active status, mute autoplay videos and pause non-autoplay ones
  $effect(() => {
    if (block.mediaType === 'video' && videoEl) {
      if (block.autoplay) {
        videoEl.muted = isMuted;
      } else if (isMuted && !videoEl.paused) {
        videoEl.pause();
      }
    }
    if (block.mediaType === 'vimeo' && vimeoPlayer) {
      vimeoPlayer.setVolume(isMuted ? 0 : 1);
    }
  });

  onMount(() => {
    if (block.mediaType === 'vimeo' && vimeoContainer && block.vimeoUrl) {
      vimeoPlayer = new Player(vimeoContainer, {
        url: block.vimeoUrl,
        controls: !block.autoplay,
        portrait: false,
        title: false,
        vimeo_logo: false,
        background: !!block.autoplay,
        muted: !!block.autoplay,
      });

      if (block.autoplay) {
        vimeoPlayer.on('pause', () => { isPaused = true; });
        vimeoPlayer.on('play', () => { isPaused = false; });
      }
    }

    if (block.mediaType === 'video' && videoEl && block.autoplay) {
      videoEl.play().then(() => {
        showPlayPause = true;
        isPaused = false;
      }).catch(() => {
        showPlayPause = true;
        isPaused = true;
      });
    }

    return () => {
      if (vimeoPlayer) {
        vimeoPlayer.destroy().catch(() => {});
        vimeoPlayer = null;
      }
    };
  });

  function togglePlayPause() {
    if (block.mediaType === 'video' && videoEl) {
      if (videoEl.paused) {
        videoEl.play().then(() => { isPaused = false; });
      } else {
        videoEl.pause();
        isPaused = true;
      }
    }
    if (block.mediaType === 'vimeo' && vimeoPlayer) {
      vimeoPlayer.getPaused().then((paused) => {
        if (paused) {
          vimeoPlayer.play().then(() => { isPaused = false; });
        } else {
          vimeoPlayer.pause().then(() => { isPaused = true; });
        }
      });
    }
  }

  function toggleMute() {
    activeAudioId.set(isMuted ? blockId : null);
  }
</script>

{#if block.mediaType === 'image' && block.image}
  <section class="single-media-block type-image" class:is-solo={isSolo} class:is-portrait={isPortrait}>
    <figure>
      <Image item={block.image} loading={eager ? 'eager' : 'lazy'} />
      {#if block.caption}
        <figcaption>{block.caption}</figcaption>
      {/if}
    </figure>
  </section>

{:else if block.mediaType === 'video' && block.video?.asset?.url}
  <section class="single-media-block type-video" class:is-solo={isSolo} class:is-portrait={isPortrait}>
    <div class="media-inner" style="{isPortrait && !isSolo ? `max-width: calc(var(--inner-height) * ${aspectRatio}); margin: 0 auto;` : ''}">
      <div class="video-wrap" style="aspect-ratio: {aspectRatio};">
        {#if block.autoplay}
          <video
            bind:this={videoEl}
            src={block.video.asset.url}
            playsinline
            preload="metadata"
            muted
            loop
            class="media-cover"
          ></video>
        {:else}
          <video
            bind:this={videoEl}
            src="{block.video.asset.url}#t=0.1"
            playsinline
            preload="metadata"
            controls
            class="media-cover"
          ></video>
        {/if}
      </div>

      <div class="video-controls">
        {#if block.caption}
          <figcaption>{block.caption}</figcaption>
        {:else}
          <span></span>
        {/if}

        {#if block.autoplay}
          <div class="video-buttons">
            {#if showPlayPause}
              <button onclick={togglePlayPause}>{isPaused ? 'Play' : 'Pause'}</button>
            {/if}
            {#if block.hasAudio !== false}
              <button onclick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </section>

{:else if block.mediaType === 'vimeo' && block.vimeoUrl}
  <section class="single-media-block type-vimeo" class:is-solo={isSolo} class:is-portrait={isPortrait}>
    <div class="media-inner" style="{isPortrait && !isSolo ? `max-width: calc(var(--inner-height) * ${aspectRatio}); margin: 0 auto;` : ''}">
      <div class="vimeo-wrap" style="aspect-ratio: {aspectRatio};">
        <div bind:this={vimeoContainer} class="vimeo-container fill-parent"></div>
      </div>

      <div class="video-controls">
        {#if block.caption}
          <figcaption>{block.caption}</figcaption>
        {:else}
          <span></span>
        {/if}

        {#if block.autoplay}
          <div class="video-buttons">
            <button onclick={togglePlayPause}>{isPaused ? 'Play' : 'Pause'}</button>
            {#if block.hasAudio !== false}
              <button onclick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </section>
{/if}
