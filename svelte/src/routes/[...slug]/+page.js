import { client } from '$lib/sanity/client.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  const slug = params.slug;

  const page = await client.fetch(
    `*[_type == "page" && slug.current == $slug][0]{
      title,
      slug,
      blocks[]{
        _type,
        _key,
        text,
        title,
        years[]{ year, text[] },
        vimeoEmbedCode
      }
    }`,
    { slug }
  ).catch(() => null);

  if (!page) {
    throw error(404, 'Page not found');
  }

  return { page };
}
