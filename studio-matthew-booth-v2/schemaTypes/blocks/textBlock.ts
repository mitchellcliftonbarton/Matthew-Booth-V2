export default {
  name: 'textBlock',
  type: 'object',
  title: 'Text',
  fields: [
    {name: 'text', type: 'text', title: 'Text', rows: 5},
  ],
  preview: {
    select: {text: 'text'},
    prepare({text}: any) {
      return {title: text?.slice(0, 60) || 'Text Block'}
    },
  },
}
