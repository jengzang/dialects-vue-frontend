<template>
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

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getVocabularyLogs } from '@/api'

const { t } = useI18n()
const pageSizeOptions = [20, 50, 100, 200]

const props = defineProps({
  canViewVocabularyLogs: { type: Boolean, default: false },
})

const isLoadingLogs = ref(false)
const logsLoadError = ref('')
const logRows = ref([])
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

const canGoPreviousLogPage = computed(() => logPagination.page > 1)
const canGoNextLogPage = computed(() => logPagination.page * logPagination.pageSize < logPagination.total)

const logFilterFields = computed(() => [
  { key: 'user_id', label: t('words.wordList.logs.filters.userId') },
  { key: 'permission_level', label: t('words.wordList.logs.filters.permission') },
  { key: 'source', label: t('words.wordList.logs.filters.source') },
  { key: 'action', label: t('words.wordList.logs.filters.action') },
  { key: 'table_name', label: t('words.wordList.logs.filters.table') },
  { key: 'status', label: t('words.wordList.logs.filters.status') },
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

function buildLogQueryParams(overrides = {}) {
  return appendFilledFilters({
    page: logPagination.page,
    page_size: logPagination.pageSize,
    ...overrides,
  }, logFilters)
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

watch(() => props.canViewVocabularyLogs, (can) => {
  if (can) loadVocabularyLogs()
}, { immediate: true })
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
