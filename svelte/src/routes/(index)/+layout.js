import { client } from '$lib/sanity/client.js';

export async function load({ parent }) {
  const { site } = await parent();

  const entries = await client.fetch(`
    *[_type == "entry" && $site in sites] | order(orderRank asc) {
      _id,
      title,
      slug,
      italicizeTitle,
      externalAuthor,
      year,
      description,
      useCustomThumbnail,
      customThumbnail {
        mediaType,
        image { asset->{ ..., metadata } },
        video { asset->{ url } },
        "muxPlaybackId": muxVideo.asset->playbackId,
        "muxThumbTime": muxVideo.asset->thumbTime
      },
      "firstBlock": blocks[_type in ["singleMediaBlock", "carouselBlock"]][0] {
        _type,
        mediaType,
        image { asset->{ ..., metadata } },
        video { asset->{ url } },
        "muxPlaybackId": muxVideo.asset->playbackId,
        "muxThumbTime": muxVideo.asset->thumbTime,
        "firstMedia": media[0] {
          mediaType,
          image { asset->{ ..., metadata } },
          "videoUrl": video.asset->url,
          "muxPlaybackId": muxVideo.asset->playbackId,
          "muxThumbTime": muxVideo.asset->thumbTime
        }
      },
      categories[]->{ _id, title, singularTitle },
      "firstTextBlock": blocks[_type == "textBlock"][0].text
    }
  `, { site }).catch(() => []);

  return { entries };
}
