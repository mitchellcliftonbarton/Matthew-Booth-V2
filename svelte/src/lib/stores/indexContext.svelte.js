import { browser } from '$app/environment';

// Filter context (category + view) for the index, mirrored to sessionStorage so
// a hard reload of a detail page still knows which filtered list it belongs to.
// Entry links themselves stay param-free (/index/[slug]) so the browser's
// :visited matching is consistent across every filtered view of the index.

const KEY = 'index-context';

function initial() {
  if (browser) {
    try {
      const stored = JSON.parse(sessionStorage.getItem(KEY));
      if (stored && typeof stored === 'object') {
        return { category: stored.category ?? null, view: stored.view ?? null };
      }
    } catch {
      // malformed storage — fall through to defaults
    }
  }
  return { category: null, view: null };
}

export const indexContext = $state(initial());

export function setIndexContext(category, view) {
  indexContext.category = category;
  indexContext.view = view;
  if (browser) {
    sessionStorage.setItem(KEY, JSON.stringify({ category, view }));
  }
}
