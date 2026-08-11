import { client } from '$lib/sanity/client.js';
import { siteFromHost } from '$lib/sites.js';

export async function load({ url, untrack }) {
	// untrack: the host never changes within a session, and tracking url
	// would rerun this load (and refetch everything) on every navigation
	const site = untrack(() => siteFromHost(url.host));

	const { siteSettings, categories, entriesIndex } = await client.fetch(`{
		"siteSettings": *[_type == "siteSettings"][0]{
			...,
			ogImage{ asset->{ url } }
		},
		"categories": *[_type == "category" && count(*[_type == "entry" && $site in sites && references(^._id)]) > 0] | order(orderRank asc) { _id, title, singularTitle },
		"entriesIndex": *[_type == "entry" && $site in sites] | order(orderRank asc) { slug, categories[]->{ title } }
	}`, { site }).catch(() => ({ siteSettings: null, categories: [], entriesIndex: [] }));

	return {
		site,
		siteSettings,
		categories,
		entriesIndex
	};
}
