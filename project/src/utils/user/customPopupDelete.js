import { ref } from 'vue'

export function popupDeleteItems(item) {
  const records = item.customRecords ?? [{ id: item.id, version: item.version }]
  if (!Array.isArray(records) || records.length < 1 || records.length > 50) {
    throw Object.assign(new Error('Invalid record group'), { detail: { code: 'validation_error' } })
  }
  const seen = new Set()
  return records.map(({ id, version }) => {
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(version) || version < 1 || seen.has(id)) {
      throw Object.assign(new Error('Record identity is unavailable'), { detail: { code: 'record_unavailable' } })
    }
    seen.add(id)
    return { id, version }
  })
}

export function createCustomPopupDelete({ confirm, remove }) {
  const isSaving = ref(false)
  async function deleteItem(item) {
    if (isSaving.value) return null
    isSaving.value = true
    try {
      const items = popupDeleteItems(item)
      if (!await confirm(item, items.length)) return null
      return await remove(items)
    } finally {
      isSaving.value = false
    }
  }
  return { isSaving, deleteItem }
}
