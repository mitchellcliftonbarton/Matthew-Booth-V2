import {ImageField} from '../../utils/fields'

export default {
  name: 'carouselMediaItem',
  type: 'object',
  title: 'Media Item',
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
    {name: 'caption', type: 'text', title: 'Caption', rows: 2},
  ],
  preview: {
    select: {mediaType: 'mediaType', image: 'image'},
    prepare({mediaType, image}: any) {
      return {
        title: mediaType === 'video' ? 'Video' : 'Image',
        media: image?.asset,
      }
    },
  },
}
