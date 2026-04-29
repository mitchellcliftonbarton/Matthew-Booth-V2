export default {
  name: 'vimeoEmbedBlock',
  type: 'object',
  title: 'Vimeo Embed',
  fields: [
    {
      name: 'vimeoEmbedCode',
      type: 'text',
      title: 'Vimeo Embed Code',
      description: 'The Vimeo embed code.',
      rows: 4,
    },
  ],
  preview: {
    prepare() {
      return {title: 'Vimeo Embed'}
    },
  },
}
