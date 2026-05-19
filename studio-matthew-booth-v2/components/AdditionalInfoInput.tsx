import {AddIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Flex} from '@sanity/ui'
import {useEffect, useState} from 'react'
import type {ArrayOfObjectsInputProps} from 'sanity'
import {set, unset, useClient, useFormValue} from 'sanity'

const CATEGORY_PRESETS: Record<string, {title: string}[]> = {
  Work: [
    {title: 'Medium'},
    {title: 'Dimensions'},
    {title: 'Edition'},
    {title: 'Exhibitions'},
    {title: 'Notes'},
  ],
  Note: [
    {title: 'Medium'},
    {title: 'Dimensions'},
    {title: 'Notes'},
  ],
  Exhibition: [
    {title: 'Dates'},
    {title: 'Type'},
    {title: 'Location'},
    {title: 'Notes'},
  ],
  Commission: [
    {title: 'Client'},
    {title: 'Collaborators'},
    {title: 'Notes'},
  ],
  Text: [
    {title: 'Notes'},
  ],
  Publication: [
    {title: 'Publisher'},
    {title: 'Details'},
    {title: 'Notes'},
  ],
}

function randomKey() {
  return Math.random().toString(36).slice(2, 11)
}

export function AdditionalInfoInput(props: ArrayOfObjectsInputProps) {
  const categoryRefs = useFormValue(['categories']) as {_ref: string}[] | undefined
  const client = useClient({apiVersion: '2024-01-01'})
  const [categoryTitles, setCategoryTitles] = useState<string[]>([])

  useEffect(() => {
    if (!categoryRefs?.length) {
      setCategoryTitles([])
      return
    }
    const refs = categoryRefs.map((c) => c._ref)
    client
      .fetch<{title: string}[]>(`*[_id in $refs]{title}`, {refs})
      .then((docs) => setCategoryTitles(docs.map((d) => d.title)))
  }, [categoryRefs, client])

  const visiblePresets = Object.entries(CATEGORY_PRESETS).filter(([name]) =>
    categoryTitles.some((t) => t.toLowerCase() === name.toLowerCase()),
  )

  const handlePreset = (items: {title: string}[]) => {
    const current = props.value ?? []
    const newItems = items.map((item) => ({
      _type: 'additionalInfoItem',
      _key: randomKey(),
      title: item.title,
      text: [],
    }))
    props.onChange(set([...current, ...newItems]))
  }

  return (
    <Box>
      <Flex gap={2} marginBottom={3} wrap="wrap">
        {visiblePresets.map(([name, items]) => (
          <Button
            key={name}
            text={`Add ${name} defaults`}
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
