// One-off migration: give every entry (published and draft) that has no
// `sites` value the default of ['main'], so existing entries keep showing
// on matthewbooth.com once the frontend starts filtering by site.
//
// Run from the studio directory:
//   npx sanity exec scripts/add-sites-to-entries.ts --with-user-token
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-01-12'})

async function run() {
  const ids: string[] = await client.fetch(`*[_type == "entry" && !defined(sites)]._id`)

  if (!ids.length) {
    console.log('Nothing to migrate — every entry already has a sites value.')
    return
  }

  const transaction = client.transaction()
  ids.forEach((id) => transaction.patch(id, {set: {sites: ['main']}}))
  await transaction.commit()
  console.log(`Set sites: ['main'] on ${ids.length} entries.`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
