import {AddIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Flex} from '@sanity/ui'
import type {ArrayOfObjectsInputProps} from 'sanity'
import {set, unset} from 'sanity'

// Edit these presets to match your common sets of additional info fields
const PRESETS: Record<string, {title: string}[]> = {
  Design: [{title: 'Client'}, {title: 'Year'}, {title: 'Role'}, {title: 'Tools'}],
  Photography: [{title: 'Location'}, {title: 'Camera'}, {title: 'Film'}, {title: 'Year'}],
  Text: [{title: 'Author'}],
}

function randomKey() {
  return Math.random().toString(36).slice(2, 11)
}

export function AdditionalInfoInput(props: ArrayOfObjectsInputProps) {
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
        {Object.entries(PRESETS).map(([name, items]) => (
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
