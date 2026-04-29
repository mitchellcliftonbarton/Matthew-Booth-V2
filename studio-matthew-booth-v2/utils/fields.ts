export const ImageField = {
  type: 'image' as const,
  options: {hotspot: true},
  fields: [
    {name: 'alt', type: 'string', title: 'Alt Text'},
  ],
}

export const NavLink = {
  name: 'navLink',
  type: 'object',
  title: 'Nav Link',
  fields: [
    {name: 'label', type: 'string', title: 'Label'},
    {name: 'url', type: 'string', title: 'URL'},
    {name: 'openInNewTab', type: 'boolean', title: 'Open in New Tab', initialValue: false},
  ],
  preview: {
    select: {title: 'label', subtitle: 'url'},
  },
}
