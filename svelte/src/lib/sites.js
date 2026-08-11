// Maps the request host to a site key. Values must match the `sites`
// checkbox values in the studio (studio-matthew-booth-v2/utils/sites.ts).
// Prefix-based so wip.localhost / testing.localhost work in dev too.
export function siteFromHost(host) {
	if (host.startsWith('wip.')) return 'wip';
	if (host.startsWith('testing.')) return 'testing';
	return 'main';
}

// Sites behind the password gate in hooks.server.js.
export const GATED_SITES = ['wip', 'testing'];
