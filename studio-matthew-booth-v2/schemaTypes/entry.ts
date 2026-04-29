import {ImageField, RichText} from '../utils/fields'

export default {
  name: 'entry',
  type: 'document',
  title: 'Entry',
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
      name: 'italicizeTitle',
      type: 'boolean',
      title: 'Italicize Title',
      description: 'Whether to italicize the title.',
      initialValue: false,
    },
    {
      name: 'featuredImage',
      type: 'object',
      title: 'Featured Image',
      fields: [
        {
          name: 'mediaType',
          type: 'string',
          title: 'Media Type',
          options: {
            list: [
              {title: 'Image', value: 'image'},
              {title: 'Video', value: 'video'},
            ],
            layout: 'radio',
          },
          initialValue: 'image',
        },
        {
          ...ImageField,
          name: 'image',
          title: 'Image',
          hidden: ({parent}: any) => parent?.mediaType !== 'image',
        },
        {
          name: 'video',
          type: 'file',
          title: 'Video',
          options: {accept: 'video/mp4'},
          hidden: ({parent}: any) => parent?.mediaType !== 'video',
        },
      ],
    },
    {
      name: 'description',
      type: 'array',
      title: 'Description',
      of: [RichText],
    },
    {
      name: 'showTitleInFooter',
      type: 'boolean',
      title: 'Show Title in Footer',
      description: 'Whether to show the title in the footer of the slide item.',
      initialValue: true,
    },
    {
      name: 'showInformationSection',
      type: 'boolean',
      title: 'Show Information Section',
      description: 'Whether to show the information section on the slide item.',
      initialValue: false,
    },
    {
      name: 'year',
      type: 'string',
      title: 'Year',
    },
    {
      name: 'additionalInfo',
      type: 'array',
      title: 'Additional Info',
      of: [
        {
          type: 'object',
          name: 'additionalInfoItem',
          title: 'Info Item',
          fields: [
            {name: 'title', type: 'string', title: 'Title'},
            {name: 'text', type: 'text', title: 'Text', rows: 3},
            {
              name: 'relatedEntries',
              type: 'array',
              title: 'Related Entries',
              of: [{type: 'reference', to: [{type: 'entry'}]}],
            },
          ],
          preview: {
            select: {title: 'title'},
            prepare({title}: any) {
              return {title: title || 'Info Item'}
            },
          },
        },
      ],
    },
    {
      name: 'categories',
      type: 'array',
      title: 'Categories',
      of: [{type: 'reference', to: [{type: 'category'}]}],
    },
    {
      name: 'blocks',
      type: 'array',
      title: 'Blocks',
      of: [{type: 'textBlock'}, {type: 'carouselBlock'}, {type: 'singleMediaBlock'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'featuredImage.image',
    },
    prepare({title, media}: any) {
      return {title, media: media?.asset}
    },
  },
}
