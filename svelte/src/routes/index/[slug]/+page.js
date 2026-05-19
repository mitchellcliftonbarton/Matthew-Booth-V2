import { client, urlFor } from '$lib/sanity/client.js';
import { error } from '@sveltejs/kit';

export async function load({ params, parent }) {
  const { entriesIndex } = await parent();

  const entry = await client.fetch(
    `*[_type == "entry" && slug.current == $slug][0]{
      title,
      slug,
      italicizeTitle,
      externalAuthor,
      externalAuthorName,
      showTitleInFooter,
      showInformationSection,
      year,
      categories[]->{ title, singularTitle },
      featuredImage {
        mediaType,
        image { ..., asset->{ _id, url, metadata { dimensions } } },
        video { asset->{ url } }
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
        vimeoUrl,
        media[] {
          mediaType,
          caption,
          image { ..., asset->{ _id, url, metadata { dimensions } } },
          "videoUrl": video.asset->url
        }
      },
      additionalInfo[] {
        title,
        text,
        relatedEntries[]->{ title, slug, italicizeTitle }
      }
    }`,
    { slug: params.slug }
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
          featuredImage {
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
    const firstBlock = e.blocks ?? null;
    let asset = null;

    if (!firstBlock) {
      if (e.featuredImage?.mediaType === 'image') asset = e.featuredImage?.image?.asset;
    } else if (firstBlock._type === 'singleMediaBlock' && firstBlock.mediaType === 'image') {
      asset = firstBlock.image?.asset;
    } else if (firstBlock._type === 'carouselBlock') {
      asset = firstBlock.media?.image?.asset;
    }

    if (!asset?._id) return [];

    // match exactly what Image.svelte requests: urlFor(asset).width(1800).url()
    try {
      return [urlFor(asset).width(1800).url()];
    } catch {
      return [];
    }
  });

  return { entry, preloadUrls };
}
