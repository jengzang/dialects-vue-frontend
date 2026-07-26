<template>
  <div class="vocabulary-manage-page">
    <section class="content-area">
      <div class="locations-mode main-glass-panel">
        <div class="locations-head">
          <div>
            <h3>{{ t('words.wordList.locations.title') }}</h3>
            <p>{{ t('words.wordList.locations.desc') }}</p>
          </div>
          <button class="main-glass-button" data-variant="secondary" type="button" @click="loadVocabularyLocations">
            {{ t('words.wordList.locations.refresh') }}
          </button>
        </div>

        <div v-if="locationsLoadError" class="empty-state empty-state-base">
          <p>{{ locationsLoadError }}</p>
        </div>

        <div v-else-if="isLoadingLocations" class="loading-state loading-state-base">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <span>{{ t('words.yuBaoPage.states.loadingData') }}</span>
        </div>

        <div v-else class="locations-list">
          <article v-for="location in locationRows" :key="`${location.user_id || ''}-${location.location_name}`" class="location-item">
            <div class="location-item-head">
              <div>
                <strong>{{ location.location_name }}</strong>
                <p>{{ location.location_label || location.location_name }}</p>
              </div>
              <button class="main-glass-button" data-variant="primary" type="button" @click="handleSaveLocation(location)">
                {{ t('words.wordList.locations.save') }}
              </button>
            </div>
            <div class="locations-edit-grid">
              <label v-for="field in locationEditFields" :key="field.key" class="upload-field">
                <span>{{ field.label }}</span>
                <input v-model="location[field.key]" type="text" />
              </label>
            </div>
          </article>
        </div>
        <p v-if="locationsStatusText" class="upload-status">{{ locationsStatusText }}</p>
      </div>
    </section>

    <section class="content-area">
      <div class="logs-mode main-glass-panel">
        <div class="locations-head">
          <div>
            <h3>{{ t('words.wordList.logs.title') }}</h3>
            <p>{{ t('words.wordList.logs.desc') }}</p>
          </div>
          <button class="main-glass-button" data-variant="secondary" type="button" @click="loadVocabularyLogs">
            {{ t('words.wordList.logs.refresh') }}
          </button>
        </div>

        <div class="logs-filter-grid">
          <label v-for="field in logFilterFields" :key="field.key" class="upload-field">
            <span>{{ field.label }}</span>
            <input v-model="logFilters[field.key]" type="text" :placeholder="field.placeholder" />
          </label>
        </div>

        <div v-if="logsLoadError" class="empty-state empty-state-base">
          <p>{{ logsLoadError }}</p>
        </div>

        <div v-else-if="isLoadingLogs" class="loading-state loading-state-base">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <span>{{ t('words.yuBaoPage.states.loadingData') }}</span>
        </div>

        <div v-else-if="logRows.length" class="logs-list">
          <article v-for="log in logRows" :key="log.id || log.operation_id" class="log-item">
            <div class="log-item-head">
              <strong>{{ log.action || '-' }}</strong>
              <span>{{ log.created_at || '-' }}</span>
            </div>
            <div class="log-meta-grid">
              <span>{{ t('words.wordList.logs.columns.userId') }}：{{ log.user_id || '-' }}</span>
              <span>{{ t('words.wordList.logs.columns.permission') }}：{{ log.permission_level || '-' }}</span>
              <span>{{ t('words.wordList.logs.columns.source') }}：{{ log.source || '-' }}</span>
              <span>{{ t('words.wordList.logs.columns.table') }}：{{ log.table_name || '-' }}</span>
              <span>{{ t('words.wordList.logs.columns.status') }}：{{ log.status || '-' }}</span>
              <span>{{ t('words.wordList.logs.columns.affectedRows') }}：{{ log.affected_rows ?? '-' }}</span>
            </div>
            <p v-if="log.target_scope">{{ log.target_scope }}</p>
          </article>
        </div>

        <div v-else class="empty-state empty-state-base">
          <p>{{ t('words.wordList.logs.empty') }}</p>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getVocabularyLocations, getVocabularyLogs, updateVocabularyLocation } from '@/api'

const { t } = useI18n()

const isLoadingLocations = ref(false)
const locationsLoadError = ref('')
const locationsStatusText = ref('')
const isLoadingLogs = ref(false)
const logsLoadError = ref('')

const locationRows = ref([])
const logRows = ref([])
const logFilters = ref({
  user_id: '',
  permission_level: '',
  source: '',
  action: '',
  table_name: '',
  status: '',
})

const locationEditFields = computed(() => [
  { key: 'coordinates', label: t('words.wordList.upload.coordinates') },
  { key: 'province', label: t('words.wordList.upload.province') },
  { key: 'city', label: t('words.wordList.upload.city') },
  { key: 'county', label: t('words.wordList.upload.county') },
  { key: 'town', label: t('words.wordList.upload.town') },
  { key: 'administrative_village', label: t('words.wordList.upload.administrativeVillage') },
  { key: 'natural_village', label: t('words.wordList.upload.naturalVillage') },
  { key: 'yindian_region', label: t('words.wordList.upload.yindianRegion') },
  { key: 'atlas_region', label: t('words.wordList.upload.atlasRegion') },
])

const logFilterFields = computed(() => [
  { key: 'user_id', label: t('words.wordList.logs.filters.userId'), placeholder: '7' },
  { key: 'permission_level', label: t('words.wordList.logs.filters.permission'), placeholder: 'edit / manage' },
  { key: 'source', label: t('words.wordList.logs.filters.source'), placeholder: 'upload' },
  { key: 'action', label: t('words.wordList.logs.filters.action'), placeholder: 'import' },
  { key: 'table_name', label: t('words.wordList.logs.filters.table'), placeholder: 'vocabulary_entries' },
  { key: 'status', label: t('words.wordList.logs.filters.status'), placeholder: 'success' },
])

async function loadVocabularyLocations() {
  isLoadingLocations.value = true
  locationsLoadError.value = ''

  try {
    const response = await getVocabularyLocations({ page: 1, page_size: 200 })
    locationRows.value = Array.isArray(response.locations)
      ? response.locations.map((location) => ({ ...location }))
      : []
  } catch (error) {
    locationsLoadError.value = error.message || '獲取詞表地點信息失敗'
    locationRows.value = []
  } finally {
    isLoadingLocations.value = false
  }
}

async function handleSaveLocation(location) {
  if (!location?.location_name) {
    return
  }

  const payload = Object.fromEntries(
    locationEditFields.value.map((field) => [field.key, String(location[field.key] || '').trim()])
  )
  const params = location.user_id ? { user_id: location.user_id } : {}
  locationsStatusText.value = ''

  try {
    await updateVocabularyLocation(location.location_name, payload, params)
    locationsStatusText.value = t('words.wordList.locations.saveSuccess')
    await loadVocabularyLocations()
  } catch (error) {
    locationsStatusText.value = error.message || t('words.wordList.locations.saveFailed')
  }
}

function buildLogQueryParams() {
  const params = Object.fromEntries(
    Object.entries({
      source: logFilters.value.source,
      action: logFilters.value.action,
      table_name: logFilters.value.table_name,
      user_id: logFilters.value.user_id,
      permission_level: logFilters.value.permission_level,
      status: logFilters.value.status,
    }).map(([key, value]) => [key, String(value || '').trim()])
  )

  return {
    ...params,
    page: 1,
    page_size: 50,
  }
}

async function loadVocabularyLogs() {
  isLoadingLogs.value = true
  logsLoadError.value = ''

  try {
    const response = await getVocabularyLogs(buildLogQueryParams())
    logRows.value = Array.isArray(response.logs) ? response.logs : []
  } catch (error) {
    logsLoadError.value = error.message || t('words.wordList.logs.loadFailed')
    logRows.value = []
  } finally {
    isLoadingLogs.value = false
  }
}

onMounted(() => {
  loadVocabularyLocations()
  loadVocabularyLogs()
})
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
