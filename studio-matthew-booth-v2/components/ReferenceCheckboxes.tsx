import {Box, Card, Checkbox, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import type {ArrayOfObjectsInputProps} from 'sanity'
import {set, useClient} from 'sanity'

interface ReferenceItem {
  _id: string
  title?: string
}

export function ReferenceCheckboxes(props: ArrayOfObjectsInputProps) {
  const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([])
  const client = useClient({apiVersion: '2025-01-12'})

  const previewProjections = useMemo(() => {
    const titles = props.schemaType.of.flatMap((type) =>
      'to' in type ? type.to?.flatMap((to) => to.preview?.select?.title ?? []) : [],
    )
    return titles.length ? titles.join(',') : 'title'
  }, [props.schemaType])

  const referenceTypes = useMemo(
    () =>
      props.schemaType.of
        .flatMap((type) => ('to' in type ? type.to?.map((to) => to.name) : []))
        .filter(Boolean),
    [props.schemaType],
  )

  useEffect(() => {
    const fetchData = async () => {
      if (!referenceTypes.length) return
      const query = `*[_type in $types] | order(title asc) {
        _id,
        "title": coalesce(${previewProjections}, title)
      }`
      const items: ReferenceItem[] = await client.fetch(query, {types: referenceTypes})
      setReferenceItems(items)
    }
    fetchData()
  }, [client, referenceTypes, previewProjections])

  const handleToggle = useCallback(
    (itemId: string) => {
      const currentValue = props.value ?? []
      const exists = currentValue.some((val) => '_ref' in val && val._ref === itemId)
      const newValue = exists
        ? currentValue.filter((val) => '_ref' in val && val._ref !== itemId)
        : [...currentValue, {_key: itemId.slice(0, 10), _type: 'reference', _ref: itemId}]
      props.onChange(set(newValue))
    },
    [props],
  )

  return (
    <Stack space={2}>
      {referenceItems.map((item) => {
        const isChecked =
          props.value?.some((val) => '_ref' in val && val._ref === item._id) || false
        return (
          <Card key={item._id} padding={2}>
            <Flex align="center">
              <Checkbox id={item._id} checked={isChecked} onChange={() => handleToggle(item._id)} />
              <Box flex={1} paddingLeft={3}>
                <Text>
                  <label htmlFor={item._id}>{item.title}</label>
                </Text>
              </Box>
            </Flex>
          </Card>
        )
      })}
    </Stack>
  )
}
