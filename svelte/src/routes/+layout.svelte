<script>
	import '../styles/index.css';
	import NProgress from 'nprogress';
	import 'nprogress/nprogress.css';
	import { beforeNavigate, afterNavigate } from '$app/navigation';

	import MainNav from '$lib/components/MainNav.svelte';
	import { page } from '$app/state';

	// props
	let { children, data } = $props();

	// Vars
	let loadingTimeout;

	// configure nprogress
	NProgress.configure({ showSpinner: false });

	// handle navigation
	beforeNavigate(() => {
		loadingTimeout = setTimeout(() => NProgress.start(), 200);
	});

	afterNavigate(() => {
		clearTimeout(loadingTimeout);
		NProgress.done();
	});
</script>

<svelte:head>
	<title>{data.siteSettings?.siteTitle ?? 'Matthew Booth'}</title>
	<meta property="og:site_name" content={data.siteSettings?.siteTitle ?? 'Matthew Booth'} />
	<meta property="og:locale" content="en_US" />
</svelte:head>

{#if page.route.id !== '/index/[slug]'}
	<MainNav />
{/if}

<main>
	{@render children()}
</main>
