<template>
  <div
    v-if="shouldScopeToOwnLocations && userLocationNames.length > 1"
    class="vocabulary-entry-create-location"
  >
    <label
      class="field-label"
      for="vocabulary-entry-create-location"
    >
      {{ t('words.wordList.columns.location') }}
    </label>
    <SimpleSelectDropdown
      v-model="selectedCreateLocationName"
      :options="userLocationOptions"

      match-trigger-width
    />
  </div>
  <UniversalTable
    v-if="canRenderEntriesTable"
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
import { computed, onActivated, onDeactivated, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getVocabularyLocations, setVocabularyEntryCreateLocationName } from '@/api'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue'

const { t } = useI18n()

const props = defineProps({
  hasVocabularyPermission: { type: Boolean, default: false },
  canViewVocabularyLogs: { type: Boolean, default: false },
  manageUserId: { type: [Number, String], default: null },
  managePermissionLevel: { type: String, default: null },
})

const userLocationNames = ref([])
const selectedCreateLocationName = ref('')
const hasLoadedUserLocations = ref(false)
const emptyLocationFilterValue = '__vocabulary_no_edit_locations__'

const shouldScopeToOwnLocations = computed(() => props.managePermissionLevel !== 'manage')
const canRenderEntriesTable = computed(() => (
  !shouldScopeToOwnLocations.value || hasLoadedUserLocations.value
))
const userLocationOptions = computed(() => (
  userLocationNames.value.map((name) => ({ label: name, value: name }))
))

async function loadUserLocations() {
  userLocationNames.value = []
  selectedCreateLocationName.value = ''

  if (!shouldScopeToOwnLocations.value) {
    hasLoadedUserLocations.value = true
    return
  }

  hasLoadedUserLocations.value = false

  if (!props.manageUserId) {
    hasLoadedUserLocations.value = true
    return
  }

  try {
    const response = await getVocabularyLocations({
      user_id: props.manageUserId,
      page_size: 200,
    })
    const locations = Array.isArray(response.locations) ? response.locations : []
    userLocationNames.value = Array.from(new Set(locations.map((l) => l.location_name).filter(Boolean)))
    if (!userLocationNames.value.includes(selectedCreateLocationName.value)) {
      selectedCreateLocationName.value = userLocationNames.value[0] || ''
    }
  } catch {
    userLocationNames.value = []
    selectedCreateLocationName.value = ''
  } finally {
    hasLoadedUserLocations.value = true
  }
}

watch(() => [props.managePermissionLevel, props.manageUserId], () => {
  loadUserLocations()
}, { immediate: true })

const scopedLocationNames = computed(() => {
  if (!shouldScopeToOwnLocations.value) return []
  if (selectedCreateLocationName.value) return [selectedCreateLocationName.value]
  return [emptyLocationFilterValue]
})

const defaultFilter = computed(() => {
  if (!shouldScopeToOwnLocations.value) return null
  return { location_name: scopedLocationNames.value }
})

watch(selectedCreateLocationName, (locationName) => {
  if (shouldScopeToOwnLocations.value) {
    setVocabularyEntryCreateLocationName(locationName)
  }
})

onActivated(() => {
  if (shouldScopeToOwnLocations.value) {
    setVocabularyEntryCreateLocationName(selectedCreateLocationName.value)
  }
})

onDeactivated(() => {
  setVocabularyEntryCreateLocationName('')
})

onUnmounted(() => {
  setVocabularyEntryCreateLocationName('')
})

const tableColumns = computed(() => {
  const columns = [
    { key: 'standard_word', label: t('words.wordList.columns.definition'), filterable: true, width: 1.2 },
    { key: 'local_expression', label: t('words.wordList.columns.headword'), filterable: false, width: 1 },
    { key: 'ipa', label: t('words.wordList.columns.pronunciation'), filterable: false, width: 1.2 },
    { key: 'notes', label: t('words.wordList.columns.detail'), filterable: false, width: 1.6 },
  ]
  if (props.managePermissionLevel === 'manage') {
    columns.push({ key: 'location_name', label: t('words.wordList.columns.location'), filterable: true, width: 1 })
  }
  columns.push(
    { key: 'informations', label: t('words.wordList.columns.informations'), filterable: false, width: 1.2 },
    { key: 'source_filename', label: t('words.wordList.columns.sourceFilename'), filterable: true, width: 1.2 },
  )
  return columns
})
</script>

<script>
export default {
  name: 'ManageEntriesSection'
}
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
