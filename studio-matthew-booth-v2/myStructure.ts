import {CogIcon, DocumentsIcon, TagIcon, DocumentIcon} from '@sanity/icons'

export const myStructure = (S: any) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.documentTypeListItem('entry').title('Entries').icon(DocumentsIcon),
      S.documentTypeListItem('page').title('Pages').icon(DocumentIcon),
      S.documentTypeListItem('category').title('Categories').icon(TagIcon),
    ])
