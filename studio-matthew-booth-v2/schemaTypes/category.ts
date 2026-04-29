export default {
  name: 'category',
  type: 'document',
  title: 'Category',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'singularTitle',
      type: 'string',
      title: 'Singular Title',
      validation: (Rule: any) => Rule.required(),
    },
  ],
}
