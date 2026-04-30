import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {schemaTypes} from './schemaTypes'
import {myStructure} from './myStructure'

export default defineConfig({
  name: 'default',
  title: 'Matthew Booth V2',

  projectId: 'blzzqscv',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S, context) => myStructure(S, context),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
