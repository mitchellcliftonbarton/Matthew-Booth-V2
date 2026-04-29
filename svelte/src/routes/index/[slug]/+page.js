import { client } from '$lib/sanity/client.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  // fetch the single entry — blocks and info panel will be added later
  const entry = await client.fetch(
    `*[_type == "entry" && slug.current == $slug][0]{
      title,
      slug,
      italicizeTitle,
      showTitleInFooter,
      showInformationSection,
      categories[]->{ title, singularTitle }
    }`,
    { slug: params.slug }
  ).catch(() => null);

  if (!entry) throw error(404, 'Entry not found');

  return { entry };
}
