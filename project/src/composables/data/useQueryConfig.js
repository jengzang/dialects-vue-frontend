/**
 * Character-table query config composable.
 *
 * Defaults to the legacy `characters` table, but now accepts an optional
 * table name or ref so future generic table pages can reuse the same API.
 */
import { computed, unref } from 'vue'
import {
  DEFAULT_CHARACTER_TABLE,
  getCharacterTableSchema
} from '@/main/config/index.js'

export function useQueryConfig(tableName = DEFAULT_CHARACTER_TABLE) {
  const schema = computed(() => getCharacterTableSchema(unref(tableName)))

  const keyValueMap = computed(() => schema.value.column_values)
  const availableKeys = computed(() => schema.value.available_keys)
  const exclusiveRules = computed(() => schema.value.key_exclusive_rules)
  const singleSelectKeys = computed(() => schema.value.single_select_keys)
  const keyGroups = computed(() => schema.value.key_groups)

  const getKeyValues = (key) => {
    return keyValueMap.value[key] || []
  }

  const isExclusive = (key1, key2) => {
    return exclusiveRules.value.groups.some(group =>
      group.includes(key1) && group.includes(key2)
    )
  }

  const isSingleSelect = (key) => {
    return singleSelectKeys.value.includes(key)
  }

  const getKeyGroup = (key) => {
    for (const [groupName, keys] of Object.entries(keyGroups.value)) {
      if (keys.includes(key)) {
        return groupName
      }
    }
    return null
  }

  return {
    keyValueMap,
    availableKeys,
    exclusiveRules,
    singleSelectKeys,
    keyGroups,
    getKeyValues,
    isExclusive,
    isSingleSelect,
    getKeyGroup
  }
}
