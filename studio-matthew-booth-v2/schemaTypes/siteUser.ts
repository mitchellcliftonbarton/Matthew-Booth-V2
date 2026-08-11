import {GATED_SITES} from '../utils/sites'
import {PasswordInput} from '../components/PasswordInput'

export default {
  name: 'siteUser',
  type: 'document',
  title: 'Site User',
  fields: [
    {
      name: 'name',
      type: 'string',
      title: 'Name',
      description: 'Who this password belongs to, e.g. "Jane — Gallery X".',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'active',
      type: 'boolean',
      title: 'Active',
      description: 'Uncheck to revoke this person’s access without deleting them.',
      initialValue: true,
    },
    {
      name: 'sites',
      type: 'array',
      title: 'Can Access Sites',
      description: 'Which password-protected sites this person can log into.',
      of: [{type: 'string'}],
      options: {list: GATED_SITES, layout: 'grid'},
      validation: (Rule: any) => Rule.required().min(1),
    },
    {
      name: 'auth',
      type: 'object',
      title: 'Password',
      components: {input: PasswordInput},
      fields: [
        {name: 'hash', type: 'string', title: 'Hash'},
        {name: 'salt', type: 'string', title: 'Salt'},
      ],
      validation: (Rule: any) =>
        Rule.custom((value: any) => (value?.hash ? true : 'A password must be set.')),
    },
  ],
  preview: {
    select: {title: 'name', active: 'active', sites: 'sites'},
    prepare({title, active, sites}: any) {
      const siteList = sites?.length ? sites.join(', ') : 'no sites'
      return {title, subtitle: active ? siteList : `inactive — ${siteList}`}
    },
  },
}
