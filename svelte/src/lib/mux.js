// Helpers for playing Mux assets through the site's own <video> elements.
// Safari (incl. all of iOS) plays HLS natively; everywhere else we lazily
// load hls.js. Callers keep full control of the element (autoplay, mute,
// custom Pause/Mute buttons) — this only wires up the stream.

export function muxStreamUrl(playbackId) {
	return `https://stream.mux.com/${playbackId}.m3u8`;
}

// time defaults to the first frame (Mux's own default is the video midpoint);
// pass the asset's thumbTime to honor a poster chosen in the studio
export function muxPosterUrl(playbackId, width = 1800, time = 0) {
	return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&time=${time ?? 0}`;
}

// "16:9" (Mux asset data format) -> 16/9 as a number, or null
export function muxAspectRatio(asset) {
	const raw = asset?.data?.aspect_ratio;
	if (!raw) return null;
	const [w, h] = String(raw).split(':').map(Number);
	return w > 0 && h > 0 ? w / h : null;
}

// Attaches the HLS stream to a <video>. Returns a cleanup function.
export function attachMuxStream(videoEl, playbackId) {
	const src = muxStreamUrl(playbackId);

	if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
		videoEl.src = src;
		return () => {};
	}

	let hls = null;
	let cancelled = false;
	import('hls.js').then(({ default: Hls }) => {
		if (cancelled) return;
		if (Hls.isSupported()) {
			hls = new Hls();
			hls.loadSource(src);
			hls.attachMedia(videoEl);
		} else {
			// last resort — some browsers may manage progressive playback
			videoEl.src = src;
		}
	});

	return () => {
		cancelled = true;
		if (hls) {
			hls.destroy();
			hls = null;
		}
	};
}
