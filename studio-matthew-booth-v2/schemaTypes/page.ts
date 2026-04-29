export default {
  name: 'page',
  type: 'document',
  title: 'Page',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      validation: (Rule: any) => Rule.required(),
      options: {source: 'title'},
    },
    {
      name: 'blocks',
      type: 'array',
      title: 'Blocks',
      of: [{type: 'textBlock'}, {type: 'cvSectionBlock'}, {type: 'vimeoEmbedBlock'}],
    },
  ],
}
