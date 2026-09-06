<script>
  import { onMount } from 'svelte';
  import Player from '@vimeo/player';
  import Image from '$lib/components/Image.svelte';
  import { activeAudioId } from '$lib/stores/activeAudio.js';
  import { attachMuxStream, muxAspectRatio, muxPosterUrl } from '$lib/mux.js';

  let { block, isSolo = false, eager = false } = $props();

  // Mux and file uploads share the same <video> element + custom controls
  const isNativeVideo = $derived(block.mediaType === 'video' || block.mediaType === 'muxVideo');
  const muxPlaybackId = $derived(
    block.mediaType === 'muxVideo' ? (block.muxVideo?.asset?.playbackId ?? null) : null
  );
  // poster frame chosen in the studio (thumbTime), else the first frame
  const muxPoster = $derived(
    muxPlaybackId ? muxPosterUrl(muxPlaybackId, 1800, block.muxVideo?.asset?.thumbTime ?? 0) : null
  );

  // Ratio the <video> reported once its metadata arrived, kept only when it
  // disagrees with the stored one — the box is sized from stored data so
  // layout is settled before the file loads, but stored data has been wrong
  // (see muxAspectRatio) and a wrong box crops the video for good.
  let measuredRatio = $state(null);

  const aspectRatio = $derived.by(() => {
    if (measuredRatio) return measuredRatio;
    if (block.mediaType === 'muxVideo') {
      const r = muxAspectRatio(block.muxVideo?.asset);
      if (r) return r;
    }
    return block.width && block.height ? block.width / block.height : 16 / 9;
  });

  function onLoadedMetadata() {
    if (!videoEl?.videoWidth || !videoEl?.videoHeight) return;
    const actual = videoEl.videoWidth / videoEl.videoHeight;
    if (Math.abs(actual / aspectRatio - 1) > 0.02) measuredRatio = actual;
  }

  // Known image ratio, passed to CSS as --media-ratio so the figure can be
  // sized without consulting the img's natural size: WebKit resolves the
  // figure's fit-content width before a lazy image has loaded (shrink-wrapping
  // to the caption text) and never re-resolves it once the image arrives.
  const imageRatio = $derived.by(() => {
    if (block.mediaType !== 'image') return null;
    const dims = block.image?.asset?.metadata?.dimensions;
    return dims?.width && dims?.height ? dims.width / dims.height : null;
  });

  const isPortrait = $derived(
    block.mediaType === 'image'
      ? (block.image?.asset?.metadata?.dimensions?.height ?? 0) > (block.image?.asset?.metadata?.dimensions?.width ?? 0)
      : block.mediaType === 'muxVideo'
        ? aspectRatio < 1
        : (block.height ?? 0) > (block.width ?? 0)
  );

  let videoEl = $state(null);
  let vimeoContainer = $state(null);
  let vimeoPlayer = $state(null);

  // unique id for this block instance
  const blockId = {};

  // Optimistic: for autoplay videos the button shows "Pause" from first paint
  // (muted autoplay almost always succeeds); if the attempt fails it flips to
  // "Play". Set when the user pauses manually so a late-arriving stream
  // (Mux waits for canplay) doesn't restart against their intent.
  let showPlayPause = $state(false);
  let isPaused = $state(false);
  let userPaused = false;
  const isMuted = $derived($activeAudioId !== blockId);

  // For non-autoplay native videos: claim active audio when the user hits play
  $effect(() => {
    if (!isNativeVideo || block.autoplay || !videoEl) return;
    function onPlay() { activeAudioId.set(blockId); }
    videoEl.addEventListener('play', onPlay);
    return () => videoEl.removeEventListener('play', onPlay);
  });

  // When this block loses active status, mute autoplay videos and pause non-autoplay ones
  $effect(() => {
    if (isNativeVideo && videoEl) {
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
    let detachMux = () => {};
    if (muxPlaybackId && videoEl) {
      detachMux = attachMuxStream(videoEl, muxPlaybackId);
    }
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

    if (isNativeVideo && videoEl && block.autoplay) {
      // button is visible immediately, optimistically labelled "Pause"
      showPlayPause = true;
      isPaused = false;

      const tryPlay = () => {
        if (userPaused) return;
        videoEl.play().then(() => {
          isPaused = false;
        }).catch(() => {
          isPaused = true;
        });
      };
      if (muxPlaybackId) {
        // HLS source is attached asynchronously — wait until it can play
        videoEl.addEventListener('canplay', tryPlay, { once: true });
      } else {
        tryPlay();
      }
    }

    return () => {
      detachMux();
      if (vimeoPlayer) {
        vimeoPlayer.destroy().catch(() => {});
        vimeoPlayer = null;
      }
    };
  });

  function togglePlayPause() {
    if (isNativeVideo && videoEl) {
      if (isPaused) {
        userPaused = false;
        videoEl.play().then(() => { isPaused = false; }).catch(() => {});
      } else {
        userPaused = true;
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
    <figure class:has-ratio={imageRatio} style={imageRatio ? `--media-ratio: ${imageRatio}` : undefined}>
      <Image item={block.image} loading={eager ? 'eager' : 'lazy'} />
      {#if block.caption}
        <figcaption>{block.caption}</figcaption>
      {/if}
    </figure>
  </section>

{:else if (block.mediaType === 'video' && block.video?.asset?.url) || (block.mediaType === 'muxVideo' && muxPlaybackId)}
  <section class="single-media-block type-video" class:is-solo={isSolo} class:is-portrait={isPortrait}>
    <div class="media-inner" style="--media-ratio: {aspectRatio};{isPortrait && !isSolo ? ` max-width: calc(var(--inner-height) * ${aspectRatio}); margin: 0 auto;` : ''}">
      <div class="video-wrap" style="aspect-ratio: {aspectRatio};">
        {#if block.autoplay}
          <video
            bind:this={videoEl}
            src={muxPlaybackId ? undefined : block.video?.asset?.url}
            poster={muxPoster ?? undefined}
            playsinline
            preload="metadata"
            muted
            loop
            class="media-cover"
            onloadedmetadata={onLoadedMetadata}
          ></video>
        {:else}
          <video
            bind:this={videoEl}
            src={muxPlaybackId ? undefined : block.video?.asset?.url}
            poster={muxPoster ?? undefined}
            playsinline
            preload="metadata"
            controls
            class="media-cover"
            onloadedmetadata={onLoadedMetadata}
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
            <!-- always in the layout so its late arrival can't shift neighbours -->
            <button style:visibility={showPlayPause ? 'visible' : 'hidden'} onclick={togglePlayPause}>{isPaused ? 'Play' : 'Pause'}</button>
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
