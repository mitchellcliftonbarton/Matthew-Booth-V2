import {AddIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Flex} from '@sanity/ui'
import {useEffect, useState} from 'react'
import type {ArrayOfObjectsInputProps} from 'sanity'
import {set, unset, useClient, useFormValue} from 'sanity'

const CATEGORY_PRESETS: Record<string, {title: string; text?: string}[]> = {
  Works: [
    {title: 'Medium'},
    {title: 'Dimensions'},
    {title: 'Edition'},
    {title: 'Exhibitions'},
    {title: 'Notes'},
  ],
  Notes: [{title: 'Medium'}, {title: 'Dimensions'}, {title: 'Notes'}],
  Exhibitions: [
    {title: 'Dates'},
    {title: 'Type', text: 'Solo / Group'},
    {title: 'Location'},
    {title: 'Text'},
    {title: 'Artworks'},
    {title: 'Notes'},
  ],
  Commissions: [{title: 'Client'}, {title: 'Collaborators'}, {title: 'Notes'}],
  Texts: [{title: 'Related'}, {title: 'Notes'}],
  Publications: [{title: 'Publisher'}, {title: 'Details'}, {title: 'Notes'}],
}

function randomKey() {
  return Math.random().toString(36).slice(2, 11)
}

export function AdditionalInfoInput(props: ArrayOfObjectsInputProps) {
  const categoryRefs = useFormValue(['categories']) as {_ref: string}[] | undefined
  const hideDefaults = useFormValue(['hideDefaultAdditionalInfo']) as boolean | undefined
  const entryTitle = useFormValue(['title']) as string | undefined
  const italicizeTitle = useFormValue(['italicizeTitle']) as boolean | undefined
  const year = useFormValue(['year']) as string | undefined
  const client = useClient({apiVersion: '2024-01-01'})
  const [categories, setCategories] = useState<{title: string; singularTitle?: string}[]>([])

  useEffect(() => {
    if (!categoryRefs?.length) {
      setCategories([])
      return
    }
    const refs = categoryRefs.map((c) => c._ref)
    client
      .fetch<{title: string; singularTitle?: string}[]>(`*[_id in $refs]{title, singularTitle}`, {
        refs,
      })
      .then((docs) => setCategories(docs))
  }, [categoryRefs, client])

  const visiblePresets = Object.entries(CATEGORY_PRESETS).filter(([name]) =>
    categories.some((c) => c.title.toLowerCase() === name.toLowerCase()),
  )

  const handlePreset = (items: {title: string; text?: string; marks?: string[]}[]) => {
    const current = props.value ?? []
    // When the default title/date/category rows are hidden on the frontend,
    // seed editable equivalents prefilled from the entry's own fields.
    const defaultItems = hideDefaults
      ? [
          {title: 'Title', text: entryTitle, marks: italicizeTitle ? ['em'] : []},
          {title: 'Date', text: year},
          {
            title: 'Category',
            text: categories.map((c) => c.singularTitle || c.title).join(', '),
          },
        ].filter((item): item is {title: string; text: string; marks?: string[]} => !!item.text)
      : []
    const newItems = [...defaultItems, ...items].map((item) => ({
      _type: 'additionalInfoItem',
      _key: randomKey(),
      title: item.title,
      text: item.text
        ? [
            {
              _type: 'block',
              _key: randomKey(),
              style: 'normal',
              markDefs: [],
              children: [
                {_type: 'span', _key: randomKey(), text: item.text, marks: item.marks ?? []},
              ],
            },
          ]
        : [],
    }))
    props.onChange(set([...current, ...newItems]))
  }

  return (
    <Box>
      <Flex gap={2} marginBottom={3} wrap="wrap">
        {visiblePresets.map(([name, items]) => (
          <Button
            key={name}
            text={`Add ${name.replace(/s$/, '')} defaults`}
            tone="primary"
            mode="ghost"
            icon={AddIcon}
            onClick={() => handlePreset(items)}
          />
        ))}
        {(props.value ?? []).length > 0 && (
          <Button
            text="Remove all"
            tone="critical"
            mode="ghost"
            icon={TrashIcon}
            onClick={() => props.onChange(unset())}
          />
        )}
      </Flex>
      {props.renderDefault(props)}
    </Box>
  )
}
