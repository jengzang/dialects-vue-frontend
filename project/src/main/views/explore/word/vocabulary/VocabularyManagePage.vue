<template>
  <div class="vocabulary-manage-page">
    <section v-if="hasVocabularyPermission" class="content-area">
      <UniversalTable
        db-key="vocabulary"
        table-name="vocabulary_entries"
        :columns="tableColumns"
        primary-key="id"
        api-adapter="vocabulary"
        :can-edit="hasVocabularyPermission"
      />

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
              <button class="main-glass-button" data-variant="primary" type="button" @click="openLocationEditor(location)">
                {{ t('common.button.edit') }}
              </button>
            </div>
          </article>
        </div>
        <p v-if="locationsStatusText" class="upload-status">{{ locationsStatusText }}</p>
      </div>
    </section>

    <section v-if="canViewVocabularyLogs" class="content-area">
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
            <div class="log-recovery-line">
              <span :data-supported="log.rollbackSupported ? 'true' : 'false'">{{ log.rollbackLabel }}</span>
            </div>
            <ul v-if="log.payloadSummary.length" class="log-payload-list">
              <li v-for="item in log.payloadSummary" :key="item">{{ item }}</li>
            </ul>
            <p v-if="log.target_scope">{{ log.target_scope }}</p>
          </article>
        </div>

        <div v-else class="empty-state empty-state-base">
          <p>{{ t('words.wordList.logs.empty') }}</p>
        </div>
      </div>
    </section>

    <AppModal
      v-model="isLocationEditorOpen"
      size="lg"
      width="720px"
      max-height="80dvh"
      :title="editingLocationDraft?.location_name || t('words.wordList.locations.title')"
      :close-label="t('common.button.close')"
      @close="closeLocationEditor"
    >
      <div v-if="editingLocationDraft" class="location-edit-modal">
        <p class="location-edit-modal-desc">
          {{ editingLocationDraft.location_label || editingLocationDraft.location_name }}
        </p>
        <div class="locations-edit-grid">
          <label v-for="field in locationEditFields" :key="field.key" class="upload-field">
            <span>{{ field.label }}</span>
            <input v-model="editingLocationDraft[field.key]" type="text" />
          </label>
        </div>
      </div>

      <template #footer>
        <div class="location-edit-modal-actions">
          <button class="main-glass-button" data-variant="secondary" type="button" @click="closeLocationEditor">
            {{ t('common.button.cancel') }}
          </button>
          <button class="main-glass-button" data-variant="primary" type="button" @click="handleSaveEditingLocation">
            {{ t('words.wordList.locations.save') }}
          </button>
        </div>
      </template>
    </AppModal>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getVocabularyLocations, getVocabularyLogs, getVocabularyMe, updateVocabularyLocation } from '@/api'
import AppModal from '@/components/common/AppModal.vue'
import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue'

const { t } = useI18n()

const props = defineProps({
  vocabularyMe: { type: Object, default: null },
  isLoadingVocabularyMe: { type: Boolean, default: false },
  vocabularyMeError: { type: String, default: '' },
})

const localVocabularyMe = ref(null)
const isLoadingLocations = ref(false)
const locationsLoadError = ref('')
const locationsStatusText = ref('')
const isLoadingLogs = ref(false)
const logsLoadError = ref('')

const locationRows = ref([])
const logRows = ref([])
const isLocationEditorOpen = ref(false)
const editingLocationSource = ref(null)
const editingLocationDraft = ref(null)

const effectiveVocabularyMe = computed(() => props.vocabularyMe || localVocabularyMe.value)
const hasVocabularyPermission = computed(() => Boolean(effectiveVocabularyMe.value?.permission_level))
const canViewVocabularyLogs = computed(() => effectiveVocabularyMe.value?.can_view_logs === true)

const tableColumns = computed(() => [
  { key: 'standard_word', label: t('words.wordList.columns.definition'), filterable: false, width: 1.2 },
  { key: 'local_expression', label: t('words.wordList.columns.headword'), filterable: false, width: 1 },
  { key: 'ipa', label: t('words.wordList.columns.pronunciation'), filterable: false, width: 1.2 },
  { key: 'notes', label: t('words.wordList.columns.detail'), filterable: false, width: 1.6 },
  { key: 'location_name', label: t('words.wordList.columns.location'), filterable: true, width: 1 },
  { key: 'informations', label: t('words.wordList.columns.informations'), filterable: false, width: 1.2 },
  { key: 'source_filename', label: t('words.wordList.columns.sourceFilename'), filterable: true, width: 1.2 }
])

async function ensureVocabularyMe() {
  if (props.vocabularyMe) {
    return props.vocabularyMe
  }

  localVocabularyMe.value = await getVocabularyMe()
  return localVocabularyMe.value
}

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

function openLocationEditor(location) {
  editingLocationSource.value = location
  editingLocationDraft.value = location ? { ...location } : null
  locationsStatusText.value = ''
  isLocationEditorOpen.value = Boolean(location)
}

function closeLocationEditor() {
  isLocationEditorOpen.value = false
  editingLocationSource.value = null
  editingLocationDraft.value = null
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
    closeLocationEditor()
  } catch (error) {
    locationsStatusText.value = error.message || t('words.wordList.locations.saveFailed')
  }
}

function handleSaveEditingLocation() {
  return handleSaveLocation(editingLocationDraft.value || editingLocationSource.value)
}

function parseLogPayload(payloadJson) {
  if (!payloadJson || typeof payloadJson !== 'string') {
    return null
  }

  try {
    return JSON.parse(payloadJson)
  } catch {
    return null
  }
}

function formatLogValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (Array.isArray(value)) {
    return value.join('、')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

function buildChangeSummary(changes = {}) {
  return Object.entries(changes).map(([field, change]) => {
    return `${field}: ${formatLogValue(change?.old)} -> ${formatLogValue(change?.new)}`
  })
}

function buildLogPayloadSummary(log, payload) {
  if (!payload) {
    return []
  }

  const summary = []

  if (log.source === 'upload') {
    summary.push(t('words.wordList.logs.payload.importedEntries', { count: payload.imported_count || 0 }))
    summary.push(t('words.wordList.logs.payload.deletedEntries', { count: payload.deleted_existing_count || 0 }))
    if (payload.location_name) summary.push(t('words.wordList.logs.payload.location', { value: payload.location_name }))
    if (payload.filename) summary.push(t('words.wordList.logs.payload.file', { value: payload.filename }))
  } else if (log.source === 'location_editor') {
    summary.push(t('words.wordList.logs.payload.location', { value: payload.location_name || payload.target_user_id || '-' }))
    summary.push(t('words.wordList.logs.payload.changedFields', { fields: formatLogValue(payload.updated_fields) }))
    summary.push(...buildChangeSummary(payload.changes))
  } else if (log.source === 'admin') {
    summary.push(t('words.wordList.logs.payload.targetUser', { value: payload.target_user_id || '-' }))
    summary.push(t('words.wordList.logs.payload.permissionChange', {
      old: formatLogValue(payload.before?.permission_level),
      next: formatLogValue(payload.after?.permission_level || payload.permission_level),
    }))
  } else if (log.source === 'sql_editor' || log.source === 'batch_mutate') {
    summary.push(t('words.wordList.logs.payload.sqlAction', { value: payload.action || log.action || '-' }))
    if (payload.pk_value !== undefined && payload.pk_value !== null) {
      summary.push(t('words.wordList.logs.payload.primaryKey', { value: payload.pk_value }))
    }
    if (Array.isArray(payload.before)) {
      summary.push(t('words.wordList.logs.payload.beforeRows', { count: payload.before.length }))
    } else if (payload.before) {
      summary.push(t('words.wordList.logs.payload.beforeFields', { fields: Object.keys(payload.before).join('、') }))
    }
    if (Array.isArray(payload.after)) {
      summary.push(t('words.wordList.logs.payload.afterRows', { count: payload.after.length }))
    } else if (payload.after?.id) {
      summary.push(t('words.wordList.logs.payload.createdId', { value: payload.after.id }))
    }
  } else if (log.source === 'batch_replace') {
    summary.push(t('words.wordList.logs.payload.replaceRule', {
      find: formatLogValue(payload.find_text),
      replace: formatLogValue(payload.replace_text),
    }))
    summary.push(t('words.wordList.logs.payload.changedFields', { fields: formatLogValue(payload.columns) }))
  }

  return summary.filter(Boolean)
}

function normalizeVocabularyLog(log) {
  const payload = parseLogPayload(log.payload_json)
  const rollbackSupported = payload?.rollback_supported === true

  return {
    ...log,
    parsedPayload: payload,
    rollbackSupported,
    rollbackLabel: rollbackSupported
      ? t('words.wordList.logs.rollbackSupported')
      : t('words.wordList.logs.rollbackUnsupported'),
    payloadSummary: buildLogPayloadSummary(log, payload),
  }
}

async function loadVocabularyLogs() {
  isLoadingLogs.value = true
  logsLoadError.value = ''

  try {
    const response = await getVocabularyLogs({ page: 1, page_size: 50 })
    logRows.value = Array.isArray(response.logs) ? response.logs.map(normalizeVocabularyLog) : []
  } catch (error) {
    logsLoadError.value = error.message || t('words.wordList.logs.loadFailed')
    logRows.value = []
  } finally {
    isLoadingLogs.value = false
  }
}

onMounted(() => {
  ensureVocabularyMe().catch(() => null).finally(() => {
    if (hasVocabularyPermission.value) {
      loadVocabularyLocations()
    }
    if (canViewVocabularyLogs.value) {
      loadVocabularyLogs()
    }
  })
})
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
