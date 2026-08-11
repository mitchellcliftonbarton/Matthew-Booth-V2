import { client, urlFor } from '$lib/sanity/client.js';
import { error } from '@sveltejs/kit';
import { browser } from '$app/environment';

// Session-lifetime memo of load results per slug. SvelteKit's own preload
// cache holds only the single most recently preloaded route, so of the two
// neighbours the detail layout warms, only the second (next) survives —
// Prev navigations refetched over the network and flashed the outgoing
// slide. Browser only: the server must not share results across requests.
const resultCache = new Map();

export async function load({ params, parent }) {
  const { entriesIndex, site } = await parent();

  if (browser && resultCache.has(params.slug)) {
    return resultCache.get(params.slug);
  }

  const entry = await client.fetch(
    `*[_type == "entry" && $site in sites && slug.current == $slug][0]{
      title,
      slug,
      italicizeTitle,
      externalAuthor,
      externalAuthorName,
      year,
      categories[]->{ title, singularTitle },
      useCustomThumbnail,
      hideDefaultAdditionalInfo,
      customThumbnail {
        mediaType,
        image { asset->{ _id, url, metadata { dimensions } } },
        video { asset->{ url } },
        "muxPlaybackId": muxVideo.asset->playbackId,
        "muxThumbTime": muxVideo.asset->thumbTime
      },
      blocks[] {
        _type,
        mediaType,
        caption,
        width,
        height,
        autoplay,
        hasAudio,
        text,
        image { ..., asset->{ _id, url, metadata { dimensions } } },
        video { asset->{ url } },
        muxVideo { asset->{ playbackId, thumbTime, data { aspect_ratio } } },
        vimeoUrl,
        media[] {
          mediaType,
          caption,
          image { ..., asset->{ _id, url, metadata { dimensions } } },
          "videoUrl": video.asset->url,
          "muxPlaybackId": muxVideo.asset->playbackId,
          "muxAspectRatio": muxVideo.asset->data.aspect_ratio,
          "muxThumbTime": muxVideo.asset->thumbTime
        }
      },
      additionalInfo[] {
        title,
        text,
        relatedEntries[]->{ title, slug, italicizeTitle }
      }
    }`,
    { slug: params.slug, site }
  ).catch(() => null);

  if (!entry) throw error(404, 'Entry not found');

  // compute prev/next 2 from the unfiltered index for preloading
  const currentIndex = entriesIndex.findIndex((e) => e.slug.current === params.slug);
  const len = entriesIndex.length;
  const adjacentSlugs = [...new Set([
    entriesIndex[(currentIndex - 2 + len) % len]?.slug.current,
    entriesIndex[(currentIndex - 1 + len) % len]?.slug.current,
    entriesIndex[(currentIndex + 1) % len]?.slug.current,
    entriesIndex[(currentIndex + 2) % len]?.slug.current,
  ].filter(Boolean))];

  // fetch _id so urlFor can build the exact same transform URL that Image.svelte will request
  const adjacentImages = adjacentSlugs.length
    ? await client.fetch(
        `*[_type == "entry" && slug.current in $slugs]{
          slug,
          useCustomThumbnail,
          customThumbnail {
            mediaType,
            image { asset->{ _id } }
          },
          blocks[0] {
            _type,
            mediaType,
            image { asset->{ _id } },
            media[0] { image { asset->{ _id } } }
          }
        }`,
        { slugs: adjacentSlugs }
      ).catch(() => [])
    : [];

  const preloadUrls = adjacentImages.flatMap((e) => {
    let asset = null;

    if (e.useCustomThumbnail && e.customThumbnail?.mediaType === 'image') {
      asset = e.customThumbnail?.image?.asset;
    } else {
      const firstBlock = e.blocks ?? null;
      if (firstBlock?._type === 'singleMediaBlock' && firstBlock.mediaType === 'image') {
        asset = firstBlock.image?.asset;
      } else if (firstBlock?._type === 'carouselBlock') {
        asset = firstBlock.media?.image?.asset;
      }
    }

    if (!asset?._id) return [];

    // match exactly what Image.svelte requests: urlFor(asset).width(1800).url()
    try {
      return [urlFor(asset).width(1800).url()];
    } catch {
      return [];
    }
  });

  const result = { entry, preloadUrls };
  if (browser) resultCache.set(params.slug, result);
  return result;
}
