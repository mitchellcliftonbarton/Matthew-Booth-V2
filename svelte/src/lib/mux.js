// Helpers for playing Mux assets through the site's own <video> elements.
// hls.js is lazily loaded wherever Media Source Extensions exist; iOS (no
// MSE) plays HLS natively. Callers keep full control of the element (autoplay, mute,
// custom Pause/Mute buttons) — this only wires up the stream.

export function muxStreamUrl(playbackId) {
	return `https://stream.mux.com/${playbackId}.m3u8`;
}

// time defaults to the first frame (Mux's own default is the video midpoint);
// pass the asset's thumbTime to honor a poster chosen in the studio
export function muxPosterUrl(playbackId, width = 1800, time = 0) {
	return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&time=${time ?? 0}`;
}

// Intrinsic ratio of a Mux asset as a number, or null. Prefers the encoded
// video track's dimensions: Mux's own aspect_ratio string is derived from the
// source file's metadata and can disagree with what was actually encoded
// (a rotated/anamorphic phone upload reported "677:540" for a 664x1080
// portrait stream), which mis-shaped the box and cropped the video.
export function muxAspectRatio(asset) {
	const data = asset?.data;
	if (!data) return null;

	const track = (data.tracks ?? []).find((t) => t.type === 'video');
	if (track?.max_width > 0 && track?.max_height > 0) {
		return track.max_width / track.max_height;
	}

	const raw = data.aspect_ratio;
	if (!raw) return null;
	const [w, h] = String(raw).split(':').map(Number);
	return w > 0 && h > 0 ? w / h : null;
}

// Attaches the HLS stream to a <video>. Returns a cleanup function.
// hls.js (MSE) is preferred wherever it runs; native HLS is only used where
// MSE is unavailable (iOS). Some Chromium-based shells answer canPlayType
// with "maybe" for HLS yet stall on the first frame, so native support is
// not trusted just because it's advertised.
export function attachMuxStream(videoEl, playbackId) {
	const src = muxStreamUrl(playbackId);

	let hls = null;
	let cancelled = false;
	import('hls.js').then(({ default: Hls }) => {
		if (cancelled) return;
		if (Hls.isSupported()) {
			hls = new Hls();
			hls.loadSource(src);
			hls.attachMedia(videoEl);
		} else {
			// no MSE (iOS Safari): the browser plays HLS itself
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
