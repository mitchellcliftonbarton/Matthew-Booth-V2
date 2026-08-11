// The sites an entry can appear on. Values must match the host → site
// mapping in svelte/src/lib/sites.js.
export const SITES = [
  {title: 'matthewbooth.com', value: 'main'},
  {title: 'wip.matthewbooth.com', value: 'wip'},
  {title: 'testing.matthewbooth.com', value: 'testing'},
]

// Sites behind the password gate — the only ones a site user can be granted.
export const GATED_SITES = SITES.filter((site) => site.value !== 'main')
