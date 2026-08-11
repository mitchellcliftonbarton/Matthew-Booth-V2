import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { client } from '$lib/sanity/client.js';
import { siteFromHost, GATED_SITES } from '$lib/sites.js';

// Password gate for the gated sites (wip., testing.). Visitors log in with a
// per-person password managed as siteUser documents in Sanity; a signed
// cookie keeps them logged in. Hash format matches the studio's
// PasswordInput component: sha-256 of `${salt}:${password}`.

const SESSION_COOKIE = 'mb_session';
const SESSION_DAYS = 30;
const LOGIN_FIELD = '__site_password';

// Non-CDN client so new users/passwords work immediately after saving.
const freshClient = client.withConfig({ useCdn: false });

const encoder = new TextEncoder();

const toHex = (buffer) =>
	Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

const sha256Hex = async (text) => toHex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));

const hmacHex = async (secret, text) => {
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(text)));
};

const createSession = async (userId, secret) => {
	const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
	const payload = `${userId}.${expires}`;
	return `${payload}.${await hmacHex(secret, payload)}`;
};

const verifySession = async (token, secret) => {
	const [userId, expires, signature] = token?.split('.') ?? [];
	if (!userId || !expires || !signature) return null;
	if (Number(expires) < Date.now()) return null;
	if ((await hmacHex(secret, `${userId}.${expires}`)) !== signature) return null;
	return userId;
};

// Per-isolate cache of "is this user still active on this site" so the gate
// doesn't query Sanity on every request. Revocation applies within a minute.
const accessCache = new Map();

const userHasAccess = async (userId, site) => {
	const cacheKey = `${userId}:${site}`;
	const cached = accessCache.get(cacheKey);
	if (cached && cached.expires > Date.now()) return cached.allowed;

	const match = await client
		.fetch(`*[_type == "siteUser" && _id == $userId && active == true && $site in sites][0]._id`, {
			userId,
			site
		})
		.catch(() => null);

	const allowed = Boolean(match);
	accessCache.set(cacheKey, { allowed, expires: Date.now() + 60 * 1000 });
	return allowed;
};

const findUserByPassword = async (password, site) => {
	const users = await freshClient
		.fetch(`*[_type == "siteUser" && active == true && $site in sites]{ _id, auth }`, { site })
		.catch(() => []);

	for (const user of users) {
		if (!user.auth?.hash || !user.auth?.salt) continue;
		if ((await sha256Hex(`${user.auth.salt}:${password}`)) === user.auth.hash) return user;
	}
	return null;
};

const loginPage = (showError) => `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="robots" content="noindex" />
	<title>Matthew Booth</title>
	<style>
		body {
			margin: 0;
			display: grid;
			place-items: center;
			min-height: 100svh;
			font-family: 'Times New Roman', serif;
			font-size: 16px;
			line-height: 1.25;
		}
		form {
			display: flex;
			flex-direction: column;
			gap: 1em;
			width: min(20em, 80vw);
		}
		input,
		button {
			font: inherit;
			padding: 0.25em 0.5em;
			border: 1px solid #000;
			border-radius: 0.25em;
			background: #fff;
			color: #000;
		}
		button {
			cursor: pointer;
		}
		p {
			margin: 0;
			color: rgba(0, 0, 0, 0.35);
		}
	</style>
</head>
<body>
	<form method="post">
		<input type="password" name="${LOGIN_FIELD}" placeholder="Password" autofocus required />
		<button type="submit">Enter</button>
		${showError ? '<p>Incorrect password.</p>' : ''}
	</form>
</body>
</html>`;

const htmlResponse = (body, status) =>
	new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });

export async function handle({ event, resolve }) {
	const site = siteFromHost(event.url.host);
	if (!GATED_SITES.includes(site)) return resolve(event);

	if (event.url.pathname === '/robots.txt') {
		return new Response('User-agent: *\nDisallow: /\n', {
			headers: { 'content-type': 'text/plain' }
		});
	}

	// without a real secret, session cookies would be forgeable — refuse to
	// serve the gated sites rather than run insecurely (dev gets a fallback)
	const secret =
		event.platform?.env?.SESSION_SECRET ?? env.SESSION_SECRET ?? (dev ? 'dev-only-secret' : null);
	if (!secret) {
		return new Response('SESSION_SECRET is not configured for this deployment.', { status: 503 });
	}

	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const userId = await verifySession(token, secret);
		if (userId && (await userHasAccess(userId, site))) return resolve(event);
	}

	if (event.request.method === 'POST') {
		const form = await event.request.formData().catch(() => null);
		const password = form?.get(LOGIN_FIELD);
		if (typeof password === 'string' && password) {
			const user = await findUserByPassword(password, site);
			if (user) {
				// set-cookie goes on the response directly: cookies set via
				// event.cookies are only serialized onto responses that come
				// from resolve(), not ones constructed here
				const session = await createSession(user._id, secret);
				const secure = event.url.protocol === 'https:' ? '; Secure' : '';
				return new Response(null, {
					status: 303,
					headers: {
						location: event.url.pathname + event.url.search,
						'set-cookie': `${SESSION_COOKIE}=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}${secure}`
					}
				});
			}
			return htmlResponse(loginPage(true), 401);
		}
	}

	return htmlResponse(loginPage(false), 401);
}
