<template>
    <UniversalTable
      db-key="vocabulary"
      table-name="vocabulary_entries"
      :columns="tableColumns"
      primary-key="id"
      api-adapter="vocabulary"
      :can-edit="hasVocabularyPermission"
      :default-filter="defaultFilter"
    />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getVocabularyLocations } from '@/api'
import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue'

const { t } = useI18n()

const props = defineProps({
  hasVocabularyPermission: { type: Boolean, default: false },
  canViewVocabularyLogs: { type: Boolean, default: false },
  manageUserId: { type: [Number, String], default: null },
  managePermissionLevel: { type: String, default: null },
})

const defaultFilter = ref(null)

async function loadDefaultFilter() {
  if (props.managePermissionLevel !== 'edit') return
  try {
    const response = await getVocabularyLocations({ page_size: 200 })
    const locations = Array.isArray(response.locations) ? response.locations : []
    const names = locations.map((l) => l.location_name).filter(Boolean)
    if (names.length) {
      defaultFilter.value = { location_name: names }
    }
  } catch {
    // no-op
  }
}

onMounted(() => {
  loadDefaultFilter()
})

const tableColumns = computed(() => [
  { key: 'standard_word', label: t('words.wordList.columns.definition'), filterable: false, width: 1.2 },
  { key: 'local_expression', label: t('words.wordList.columns.headword'), filterable: false, width: 1 },
  { key: 'ipa', label: t('words.wordList.columns.pronunciation'), filterable: false, width: 1.2 },
  { key: 'notes', label: t('words.wordList.columns.detail'), filterable: false, width: 1.6 },
  { key: 'location_name', label: t('words.wordList.columns.location'), filterable: true, width: 1 },
  { key: 'informations', label: t('words.wordList.columns.informations'), filterable: false, width: 1.2 },
  { key: 'source_filename', label: t('words.wordList.columns.sourceFilename'), filterable: true, width: 1.2 },
])
</script>

<script>
export default {
  name: 'ManageEntriesSection'
}
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
