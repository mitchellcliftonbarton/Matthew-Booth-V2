import { client } from '$lib/sanity/client.js';

export async function load() {
	const { siteSettings, categories } = await client.fetch(`{
		"siteSettings": *[_type == "siteSettings"][0]{
			...,
			ogImage{ asset->{ url } }
		},
		"categories": *[_type == "category" && count(*[_type == "entry" && references(^._id)]) > 0] | order(title asc) { _id, title, singularTitle }
	}`).catch(() => ({ siteSettings: null, categories: [] }));

	return {
		siteSettings,
		categories
	};
}
