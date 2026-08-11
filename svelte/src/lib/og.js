import { urlFor } from '$lib/sanity/client.js';
import { muxPosterUrl } from '$lib/mux.js';

// Share-image (og:image) URL for an entry, resolved from the same source as
// its list thumbnail: the custom thumbnail override when set, else the first
// media block (a carousel falls through to its first slide). File-upload
// videos resolve to null — there's no frame URL to build for those.
export function entryOgImageUrl(entry) {
	if (!entry) return null;

	if (entry.useCustomThumbnail && entry.customThumbnail) {
		return mediaImageUrl(entry.customThumbnail);
	}

	const block =
		entry.firstBlock ??
		(entry.blocks ?? []).find((b) => b._type === 'singleMediaBlock' || b._type === 'carouselBlock');
	if (!block) return null;

	if (block._type === 'carouselBlock') {
		const slide = block.firstMedia ?? block.media?.[0];
		return slide ? mediaImageUrl(slide) : null;
	}
	return mediaImageUrl(block);
}

// media objects arrive in two query shapes: nested (muxVideo { asset }) on the
// detail page, aliased (muxPlaybackId / muxThumbTime) on the index
function mediaImageUrl(media) {
	if (media.mediaType === 'image' && media.image?.asset) {
		try {
			return urlFor(media.image.asset).width(1200).url();
		} catch {
			return null;
		}
	}

	if (media.mediaType === 'muxVideo') {
		const playbackId = media.muxPlaybackId ?? media.muxVideo?.asset?.playbackId;
		if (playbackId) {
			return muxPosterUrl(playbackId, 1200, media.muxThumbTime ?? media.muxVideo?.asset?.thumbTime ?? 0);
		}
	}

	return null;
}
