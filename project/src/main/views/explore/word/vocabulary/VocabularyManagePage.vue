<template>
  <div class="vocabulary-manage-page">
    <RadioGroup
      v-if="!shouldShowAccessGate"
      v-model="manageSection"
      :options="manageSectionOptions"
      name="manage-section"
      class="contribute-mode-switch"
    />
    <section v-if="shouldShowAccessGate" class="content-area">
      <div class="access-gate main-glass-panel">
        <h3>{{ accessGateTitle }}</h3>
        <p>{{ accessGateDescription }}</p>
        <div class="access-gate-actions">
          <button
            v-if="requiresLogin"
            class="main-glass-button"
            data-variant="primary"
            type="button"
            @click="navigateToAuth()"
          >
            {{ t('words.wordList.access.loginAction') }}
          </button>
          <button class="main-glass-button" data-variant="secondary" type="button" @click="navigateToList">
            {{ t('words.wordList.access.backToList') }}
          </button>
        </div>
      </div>
    </section>

    <template v-else>
      <section v-if="manageSection === 'entries' && hasVocabularyPermission" class="content-area">
        <UniversalTable
          db-key="vocabulary"
          table-name="vocabulary_entries"
          :columns="tableColumns"
          primary-key="id"
          api-adapter="vocabulary"
          :can-edit="hasVocabularyPermission"
        />
      </section>

      <section v-if="manageSection === 'locations' && hasVocabularyPermission" class="content-area">
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

          <form class="manage-filter-grid locations-filter-grid" @submit.prevent="applyLocationFilters">
            <label class="upload-field">
              <span>{{ t('words.wordList.locations.filters.userId') }}</span>
              <input v-model="locationFilters.user_id" type="text" :placeholder="t('words.wordList.locations.filters.userId')" />
            </label>
            <label class="upload-field">
              <span>{{ t('words.wordList.locations.filters.locationName') }}</span>
              <input v-model="locationFilters.location_name" type="text" :placeholder="t('words.wordList.locations.filters.locationName')" />
            </label>
            <div class="filter-actions">
              <button class="main-glass-button" data-variant="primary" type="submit">
                {{ t('common.button.search') }}
              </button>
              <button class="main-glass-button" data-variant="secondary" type="button" @click="resetLocationFilters">
                {{ t('common.button.reset') }}
              </button>
            </div>
          </form>

          <div v-if="locationsLoadError" class="empty-state empty-state-base">
            <p>{{ locationsLoadError }}</p>
          </div>

          <div v-else-if="isLoadingLocations" class="loading-state loading-state-base">
            <div class="ui-loading--page" aria-hidden="true"></div>
            <span>{{ t('words.wordList.states.loadingData') }}</span>
          </div>

          <div v-else-if="locationRows.length" class="locations-list">
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
          <div v-else class="empty-state empty-state-base">
            <p>{{ t('words.wordList.locations.empty') }}</p>
          </div>
          <div class="pagination-row">
            <span>{{ t('words.wordList.pagination.total', { count: locationPagination.total }) }}</span>
            <span>{{ t('words.wordList.pagination.page', { page: locationPagination.page }) }}</span>
            <label class="page-size-select">
              <span>{{ t('words.wordList.pagination.pageSize') }}</span>
              <select v-model.number="locationPagination.pageSize" @change="applyLocationFilters">
                <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
              </select>
            </label>
            <button class="main-glass-button" data-variant="secondary" type="button" :disabled="!canGoPreviousLocationPage" @click="goToLocationPage(-1)">
              {{ t('words.wordList.pagination.previous') }}
            </button>
            <button class="main-glass-button" data-variant="secondary" type="button" :disabled="!canGoNextLocationPage" @click="goToLocationPage(1)">
              {{ t('words.wordList.pagination.next') }}
            </button>
          </div>
          <p v-if="locationsStatusText" class="upload-status">{{ locationsStatusText }}</p>
        </div>
      </section>

      <section v-if="manageSection === 'logs' && canViewVocabularyLogs" class="content-area">
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

          <form class="manage-filter-grid logs-filter-grid" @submit.prevent="applyLogFilters">
            <label v-for="field in logFilterFields" :key="field.key" class="upload-field">
              <span>{{ field.label }}</span>
              <input v-model="logFilters[field.key]" type="text" :placeholder="field.label" />
            </label>
            <div class="filter-actions">
              <button class="main-glass-button" data-variant="primary" type="submit">
                {{ t('common.button.search') }}
              </button>
              <button class="main-glass-button" data-variant="secondary" type="button" @click="resetLogFilters">
                {{ t('common.button.reset') }}
              </button>
            </div>
          </form>

          <div v-if="logsLoadError" class="empty-state empty-state-base">
            <p>{{ logsLoadError }}</p>
          </div>

          <div v-else-if="isLoadingLogs" class="loading-state loading-state-base">
            <div class="ui-loading--page" aria-hidden="true"></div>
            <span>{{ t('words.wordList.states.loadingData') }}</span>
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

          <div class="pagination-row">
            <span>{{ t('words.wordList.pagination.total', { count: logPagination.total }) }}</span>
            <span>{{ t('words.wordList.pagination.page', { page: logPagination.page }) }}</span>
            <label class="page-size-select">
              <span>{{ t('words.wordList.pagination.pageSize') }}</span>
              <select v-model.number="logPagination.pageSize" @change="applyLogFilters">
                <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
              </select>
            </label>
            <button class="main-glass-button" data-variant="secondary" type="button" :disabled="!canGoPreviousLogPage" @click="goToLogPage(-1)">
              {{ t('words.wordList.pagination.previous') }}
            </button>
            <button class="main-glass-button" data-variant="secondary" type="button" :disabled="!canGoNextLogPage" @click="goToLogPage(1)">
              {{ t('words.wordList.pagination.next') }}
            </button>
          </div>
        </div>
      </section>
    </template>

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
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getVocabularyLocations, getVocabularyLogs, getVocabularyMe, updateVocabularyLocation } from '@/api'
import AppModal from '@/components/common/AppModal.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const pageSizeOptions = [20, 50, 100, 200]

const manageSection = ref('entries')
const manageSectionOptions = computed(() => {
  const options = []
  if (hasVocabularyPermission.value) {
    options.push({ value: 'entries', label: t('words.wordList.tabs.list') })
    options.push({ value: 'locations', label: t('words.wordList.locations.title') })
  }
  if (canViewVocabularyLogs.value) {
    options.push({ value: 'logs', label: t('words.wordList.logs.title') })
  }
  return options
})

watch(manageSectionOptions, (options) => {
  if (options.length && !options.some(o => o.value === manageSection.value)) {
    manageSection.value = options[0].value
  }
})

const props = defineProps({
  vocabularyMe: { type: Object, default: null },
  isLoadingVocabularyMe: { type: Boolean, default: false },
  vocabularyMeError: { type: String, default: '' },
  isAuthenticated: { type: Boolean, default: false },
  isAuthReady: { type: Boolean, default: false },
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
const locationFilters = reactive({
  user_id: '',
  location_name: '',
})
const locationPagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0,
})
const logFilters = reactive({
  user_id: '',
  permission_level: '',
  source: '',
  action: '',
  table_name: '',
  status: '',
})
const logPagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0,
})

const effectiveVocabularyMe = computed(() => props.vocabularyMe || localVocabularyMe.value)
const hasVocabularyPermission = computed(() => Boolean(effectiveVocabularyMe.value?.permission_level))
const canViewVocabularyLogs = computed(() => effectiveVocabularyMe.value?.can_view_logs === true)
const isWaitingForAuth = computed(() => !props.isAuthReady || props.isLoadingVocabularyMe)
const requiresLogin = computed(() => props.isAuthReady && !props.isAuthenticated)
const requiresVocabularyPermission = computed(() => (
  props.isAuthReady
  && props.isAuthenticated
  && !props.isLoadingVocabularyMe
  && !hasVocabularyPermission.value
  && !props.vocabularyMeError
))
const shouldShowAccessGate = computed(() => (
  isWaitingForAuth.value
  || requiresLogin.value
  || requiresVocabularyPermission.value
  || Boolean(props.vocabularyMeError)
))
const accessGateTitle = computed(() => {
  if (isWaitingForAuth.value) return t('words.wordList.access.loadingTitle')
  if (requiresLogin.value) return t('words.wordList.access.loginManageTitle')
  if (props.vocabularyMeError) return t('words.wordList.access.permissionLoadFailedTitle')
  return t('words.wordList.access.noManagePermissionTitle')
})
const accessGateDescription = computed(() => {
  if (isWaitingForAuth.value) return t('words.wordList.access.loadingDesc')
  if (requiresLogin.value) return t('words.wordList.access.loginManageDesc')
  if (props.vocabularyMeError) return props.vocabularyMeError
  return t('words.wordList.access.noManagePermissionDesc')
})
const canGoPreviousLocationPage = computed(() => locationPagination.page > 1)
const canGoNextLocationPage = computed(() => locationPagination.page * locationPagination.pageSize < locationPagination.total)
const canGoPreviousLogPage = computed(() => logPagination.page > 1)
const canGoNextLogPage = computed(() => logPagination.page * logPagination.pageSize < logPagination.total)

const tableColumns = computed(() => [
  { key: 'standard_word', label: t('words.wordList.columns.definition'), filterable: false, width: 1.2 },
  { key: 'local_expression', label: t('words.wordList.columns.headword'), filterable: false, width: 1 },
  { key: 'ipa', label: t('words.wordList.columns.pronunciation'), filterable: false, width: 1.2 },
  { key: 'notes', label: t('words.wordList.columns.detail'), filterable: false, width: 1.6 },
  { key: 'location_name', label: t('words.wordList.columns.location'), filterable: true, width: 1 },
  { key: 'informations', label: t('words.wordList.columns.informations'), filterable: false, width: 1.2 },
  { key: 'source_filename', label: t('words.wordList.columns.sourceFilename'), filterable: true, width: 1.2 }
])

const logFilterFields = computed(() => [
  { key: 'user_id', label: t('words.wordList.logs.filters.userId') },
  { key: 'permission_level', label: t('words.wordList.logs.filters.permission') },
  { key: 'source', label: t('words.wordList.logs.filters.source') },
  { key: 'action', label: t('words.wordList.logs.filters.action') },
  { key: 'table_name', label: t('words.wordList.logs.filters.table') },
  { key: 'status', label: t('words.wordList.logs.filters.status') },
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

function appendFilledFilters(target, filters) {
  Object.entries(filters).forEach(([key, value]) => {
    const normalized = String(value || '').trim()
    if (normalized) {
      target[key] = normalized
    }
  })
  return target
}

function buildLocationQueryParams(overrides = {}) {
  return appendFilledFilters({
    page: locationPagination.page,
    page_size: locationPagination.pageSize,
    ...overrides,
  }, locationFilters)
}

function buildLogQueryParams(overrides = {}) {
  return appendFilledFilters({
    page: logPagination.page,
    page_size: logPagination.pageSize,
    ...overrides,
  }, logFilters)
}

async function loadVocabularyLocations() {
  isLoadingLocations.value = true
  locationsLoadError.value = ''

  try {
    const params = buildLocationQueryParams()
    const response = await getVocabularyLocations(params)
    locationRows.value = Array.isArray(response.locations)
      ? response.locations.map((location) => ({ ...location }))
      : []
    locationPagination.total = Number(response.total) || locationRows.value.length
    locationPagination.page = Number(response.page) || params.page
    locationPagination.pageSize = Number(response.page_size) || params.page_size
  } catch (error) {
    locationsLoadError.value = error.message || t('words.wordList.locations.loadFailed')
    locationRows.value = []
    locationPagination.total = 0
  } finally {
    isLoadingLocations.value = false
  }
}

function applyLocationFilters() {
  locationPagination.page = 1
  return loadVocabularyLocations()
}

function resetLocationFilters() {
  locationFilters.user_id = ''
  locationFilters.location_name = ''
  return applyLocationFilters()
}

function goToLocationPage(delta) {
  const nextPage = locationPagination.page + delta
  if (nextPage < 1) {
    return
  }
  if (delta > 0 && !canGoNextLocationPage.value) {
    return
  }
  locationPagination.page = nextPage
  loadVocabularyLocations()
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
    const params = buildLogQueryParams()
    const response = await getVocabularyLogs(params)
    logRows.value = Array.isArray(response.logs) ? response.logs.map(normalizeVocabularyLog) : []
    logPagination.total = Number(response.total) || logRows.value.length
    logPagination.page = Number(response.page) || params.page
    logPagination.pageSize = Number(response.page_size) || params.page_size
  } catch (error) {
    logsLoadError.value = error.message || t('words.wordList.logs.loadFailed')
    logRows.value = []
    logPagination.total = 0
  } finally {
    isLoadingLogs.value = false
  }
}

function applyLogFilters() {
  logPagination.page = 1
  return loadVocabularyLogs()
}

function resetLogFilters() {
  Object.keys(logFilters).forEach((key) => {
    logFilters[key] = ''
  })
  return applyLogFilters()
}

function goToLogPage(delta) {
  const nextPage = logPagination.page + delta
  if (nextPage < 1) {
    return
  }
  if (delta > 0 && !canGoNextLogPage.value) {
    return
  }
  logPagination.page = nextPage
  loadVocabularyLogs()
}

function navigateToAuth() {
  router.push({
    path: buildLocalePath(resolveRouteLocale(route), '/auth'),
    query: { view: 'login', redirect: route.fullPath }
  })
}

function navigateToList() {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/vocabulary/view'))
}

watch(() => [
  props.isAuthReady,
  props.isAuthenticated,
  props.vocabularyMe?.permission_level,
  props.vocabularyMe?.can_view_logs,
], () => {
  if (shouldShowAccessGate.value) {
    return
  }

  ensureVocabularyMe().catch(() => null).finally(() => {
    if (hasVocabularyPermission.value) {
      loadVocabularyLocations()
    }
    if (canViewVocabularyLogs.value) {
      loadVocabularyLogs()
    }
  })
}, { immediate: true })
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
