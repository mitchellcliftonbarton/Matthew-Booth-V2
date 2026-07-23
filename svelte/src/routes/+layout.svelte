<script>
	import '../styles/index.css';
	import NProgress from 'nprogress';
	import 'nprogress/nprogress.css';
	import { page } from '$app/state';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';

	import MainNav from '$lib/components/MainNav.svelte';

	// props
	let { children, data } = $props();

	// Single source of truth for the document title. Pages contribute a title
	// via their load data (entry for index details, page for static pages);
	// rendering <title> only here means it always resets when they unmount.
	const siteTitle = $derived(data.siteSettings?.siteTitle ?? 'Matthew Booth');
	const pageTitle = $derived(page.data.entry?.title ?? page.data.page?.title ?? null);
	const documentTitle = $derived(pageTitle ? `${pageTitle} — ${siteTitle}` : siteTitle);

	// Vars
	let loadingTimeout;

	// configure nprogress
	NProgress.configure({ showSpinner: false });

	// handle navigation
	beforeNavigate(() => {
		loadingTimeout = setTimeout(() => NProgress.start(), 500);
	});

	afterNavigate(() => {
		clearTimeout(loadingTimeout);
		NProgress.done();
	});

	onMount(() => {
		console.log('%c \nDevelopment by Cold Rice \n \ncold-rice.info \n \n', 'color: grey')
	});
</script>

<svelte:head>
	<title>{documentTitle}</title>
	<meta property="og:site_name" content={siteTitle} />
	<meta property="og:locale" content="en_US" />
</svelte:head>

<MainNav />

<main>
	{@render children()}
</main>
