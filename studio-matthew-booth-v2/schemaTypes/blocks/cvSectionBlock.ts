export default {
  name: 'cvSectionBlock',
  type: 'object',
  title: 'CV Section',
  fields: [
    {name: 'title', type: 'string', title: 'Title'},
    {
      name: 'years',
      type: 'array',
      title: 'Years',
      of: [
        {
          type: 'object',
          name: 'cvYear',
          title: 'Year',
          fields: [
            {name: 'year', type: 'string', title: 'Year'},
            {name: 'text', type: 'text', title: 'Text', rows: 3},
          ],
          preview: {
            select: {title: 'year', subtitle: 'text'},
          },
        },
      ],
    },
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}: any) {
      return {title: title || 'CV Section'}
    },
  },
}
