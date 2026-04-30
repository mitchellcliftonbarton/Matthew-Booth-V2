import { client } from '$lib/sanity/client.js';

export async function load() {
	const { siteSettings, categories, entriesIndex } = await client.fetch(`{
		"siteSettings": *[_type == "siteSettings"][0]{
			...,
			ogImage{ asset->{ url } }
		},
		"categories": *[_type == "category" && count(*[_type == "entry" && references(^._id)]) > 0] | order(title asc) { _id, title, singularTitle },
		"entriesIndex": *[_type == "entry"] | order(orderRank asc) { slug, categories[]->{ title } }
	}`).catch(() => ({ siteSettings: null, categories: [], entriesIndex: [] }));

	return {
		siteSettings,
		categories,
		entriesIndex
	};
}
