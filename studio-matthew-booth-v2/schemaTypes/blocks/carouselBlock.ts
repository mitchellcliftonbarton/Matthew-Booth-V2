export default {
  name: 'carouselBlock',
  type: 'object',
  title: 'Carousel',
  fields: [
    {
      name: 'width',
      type: 'number',
      title: 'Width',
      description: 'Used to determine the aspect ratio. Defaults to 1600.',
      initialValue: 1600,
    },
    {
      name: 'height',
      type: 'number',
      title: 'Height',
      description: 'Used to determine the aspect ratio. Defaults to 900.',
      initialValue: 900,
    },
    {
      name: 'media',
      type: 'array',
      title: 'Media',
      of: [{type: 'carouselMediaItem'}],
    },
  ],
  preview: {
    select: {media: 'media'},
    prepare({media}: any) {
      return {title: `Carousel (${media?.length ?? 0} items)`}
    },
  },
}
