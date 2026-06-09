import {ImageField, RichText} from '../utils/fields'
import {ReferenceCheckboxes} from '../components/ReferenceCheckboxes'
import {AdditionalInfoInput} from '../components/AdditionalInfoInput'
import {orderRankField} from '@sanity/orderable-document-list'

export default {
  name: 'entry',
  type: 'document',
  title: 'Entry',
  fields: [
    orderRankField({type: 'entry'}),
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
      name: 'externalAuthor',
      type: 'boolean',
      title: 'External Author',
      description: 'Whether the author of this entry is not Matthew Booth.',
      initialValue: false,
    },
    {
      name: 'externalAuthorName',
      type: 'string',
      title: 'External Author Name',
      hidden: ({document}: any) => !document?.externalAuthor,
    },
    {
      name: 'categories',
      type: 'array',
      title: 'Categories',
      of: [{type: 'reference', to: [{type: 'category'}]}],
      components: {input: ReferenceCheckboxes},
    },
    {
      name: 'useCustomThumbnail',
      type: 'boolean',
      title: 'Use Custom Thumbnail',
      description: 'Override the auto-derived thumbnail (taken from the first block) with a custom image or video.',
      initialValue: false,
    },
    {
      name: 'customThumbnail',
      type: 'object',
      title: 'Custom Thumbnail',
      hidden: ({document}: any) => !document?.useCustomThumbnail,
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
      description: 'The description of the entry shown in the list view.',
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
      description:
        'Additional information about the entry. Shown in the "Information" section on the slide item.',
      components: {input: AdditionalInfoInput},
      of: [
        {
          type: 'object',
          name: 'additionalInfoItem',
          title: 'Info Item',
          fields: [
            {name: 'title', type: 'string', title: 'Title'},
            {name: 'text', type: 'array', title: 'Text', of: [RichText]},
            {
              name: 'relatedEntries',
              type: 'array',
              title: 'Related Entries',
              of: [{type: 'reference', to: [{type: 'entry'}]}],
            },
          ],
          preview: {
            select: {title: 'title', text: 'text'},
            prepare({title, text}: any) {
              const firstBlock = text?.find((b: any) => b._type === 'block')
              const subtitle = firstBlock?.children?.map((c: any) => c.text).join('') || ''
              return {title: title || 'Info Item', subtitle}
            },
          },
        },
      ],
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
