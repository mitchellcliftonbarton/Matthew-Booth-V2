import {ImageField} from '../../utils/fields'

export default {
  name: 'singleMediaBlock',
  type: 'object',
  title: 'Single Media',
  fields: [
    {
      name: 'mediaType',
      type: 'string',
      title: 'Media Type',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
          {title: 'Vimeo', value: 'vimeo'},
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
    {
      name: 'vimeoUrl',
      type: 'url',
      title: 'Vimeo URL',
      hidden: ({parent}: any) => parent?.mediaType !== 'vimeo',
    },
    {
      name: 'width',
      type: 'number',
      title: 'Width',
      description: 'Aspect ratio width. Defaults to 1600.',
      initialValue: 1600,
      hidden: ({parent}: any) => parent?.mediaType === 'image',
    },
    {
      name: 'height',
      type: 'number',
      title: 'Height',
      description: 'Aspect ratio height. Defaults to 900.',
      initialValue: 900,
      hidden: ({parent}: any) => parent?.mediaType === 'image',
    },
    {
      name: 'autoplay',
      type: 'boolean',
      title: 'Autoplay',
      initialValue: false,
      hidden: ({parent}: any) => parent?.mediaType === 'image',
    },
    {name: 'caption', type: 'text', title: 'Caption', rows: 2},
  ],
  preview: {
    select: {mediaType: 'mediaType', image: 'image'},
    prepare({mediaType, image}: any) {
      const title = mediaType === 'video' ? 'Video' : mediaType === 'vimeo' ? 'Vimeo' : 'Image'
      return {title, media: image?.asset}
    },
  },
}
