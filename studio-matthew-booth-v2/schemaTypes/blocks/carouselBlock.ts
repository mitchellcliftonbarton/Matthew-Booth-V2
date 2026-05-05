export default {
  name: 'carouselBlock',
  type: 'object',
  title: 'Carousel',
  fields: [
    {
      name: 'media',
      type: 'array',
      title: 'Media',
      description:
        'If there are multiple blocks, the aspect ratio of the first image will determine the aspect ratio of the carousel.',
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
