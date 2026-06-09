import { client } from '$lib/sanity/client.js';

export async function load() {
  const entries = await client.fetch(`
    *[_type == "entry"] | order(orderRank asc) {
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
        video { asset->{ url } }
      },
      "firstBlock": blocks[_type in ["singleMediaBlock", "carouselBlock"]][0] {
        _type,
        mediaType,
        image { asset->{ ..., metadata } },
        video { asset->{ url } },
        "firstMedia": media[0] {
          mediaType,
          image { asset->{ ..., metadata } },
          "videoUrl": video.asset->url
        }
      },
      categories[]->{ _id, title, singularTitle },
      "firstTextBlock": blocks[_type == "textBlock"][0].text
    }
  `).catch(() => []);

  return { entries };
}
