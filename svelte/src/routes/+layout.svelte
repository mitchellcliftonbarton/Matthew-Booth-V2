<script>
	import '../styles/index.css';
	import NProgress from 'nprogress';
	import 'nprogress/nprogress.css';
	import { beforeNavigate, afterNavigate } from '$app/navigation';

	import MainNav from '$lib/components/MainNav.svelte';

	// props
	let { children, data } = $props();

	// Vars
	let loadingTimeout;

	// configure nprogress
	NProgress.configure({ showSpinner: false });

	// handle navigation
	beforeNavigate(() => {
		// start nprogress
		NProgress.start();
	});

	afterNavigate(() => {
		// stop nprogress
		NProgress.done();

		// clear loading timeout
		clearTimeout(loadingTimeout);
	});
</script>

<svelte:head>
	<title>{data.siteSettings?.siteTitle ?? 'Matthew Booth'}</title>
	<meta property="og:site_name" content={data.siteSettings?.siteTitle ?? 'Matthew Booth'} />
	<meta property="og:locale" content="en_US" />
</svelte:head>

<MainNav />

<main>
	{@render children()}
</main>
