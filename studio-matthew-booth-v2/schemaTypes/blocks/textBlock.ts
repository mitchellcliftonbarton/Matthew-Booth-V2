import {RichText} from '../../utils/fields'

export default {
  name: 'textBlock',
  type: 'object',
  title: 'Text',
  fields: [
    {name: 'text', type: 'array', title: 'Text', of: [RichText]},
  ],
  preview: {
    select: {text: 'text'},
    prepare({text}: any) {
      const plain = text?.[0]?.children?.map((c: any) => c.text).join('') ?? ''
      return {title: plain?.slice(0, 60) || 'Text Block'}
    },
  },
}
