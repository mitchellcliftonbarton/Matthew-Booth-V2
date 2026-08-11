import siteSettings from './siteSettings'
import category from './category'
import page from './page'
import entry from './entry'
import siteUser from './siteUser'
import textBlock from './blocks/textBlock'
import cvSectionBlock from './blocks/cvSectionBlock'
import vimeoEmbedBlock from './blocks/vimeoEmbedBlock'
import carouselMediaItem from './blocks/carouselMediaItem'
import carouselBlock from './blocks/carouselBlock'
import singleMediaBlock from './blocks/singleMediaBlock'

export const schemaTypes = [
  // Documents
  siteSettings,
  category,
  page,
  entry,
  siteUser,
  // Block object types
  textBlock,
  cvSectionBlock,
  vimeoEmbedBlock,
  carouselMediaItem,
  carouselBlock,
  singleMediaBlock,
]
