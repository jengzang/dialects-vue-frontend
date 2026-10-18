<template>
  <div class="vocabulary-import-page">
    <section class="content-area">
      <div class="upload-mode glass-panel">
        <div class="upload-head">
          <h3>{{ t('words.wordList.upload.title') }}</h3>
          <div class="upload-head-counts">
            <span>{{ t('words.wordList.upload.totalEntries', { count: vocabTotalCount ?? '…' }) }}</span>
            <span class="count-sep">·</span>
            <span>{{ t('words.wordList.upload.totalLocations', { count: vocabLocationCount ?? '…' }) }}</span>
          </div>

          <div class="upload-head-actions">
            <div
              v-if="shouldShowPermissionRequest"
              class="upload-access-notice"
            >
              <p>{{ uploadAccessNotice }}</p>
              <button
                class="action-btn action-btn--sm"
                type="button"
                @click="navigateToSuggestion"
              >
                {{ t('words.wordList.access.requestEditPermission') }}
              </button>
            </div>

            <p
              v-else-if="uploadAccessNotice"
              class="upload-access-notice"
            >
              {{ uploadAccessNotice }}
            </p>

            <button
              v-if="canShowRefreshVocabularyPermission"
              class="action-btn action-btn--sm"
              type="button"
              :disabled="isLoadingVocabularyMe"
              @click="refreshVocabularyMe"
            >
              <PhArrowsClockwise
                :size="16"
                aria-hidden="true"
              />
              {{ t('words.wordList.access.refreshPermission') }}
            </button>
          </div>
        </div>

        <div class="upload-example">
          <div class="upload-example__title">
            <span>{{ t('words.wordList.upload.dataExample') }}</span>
            <span class="upload-example__actions">
              <a
                class="action-btn action-btn--sm upload-example__template-btn"
                :href="SURVEY_TEMPLATE_URL"
                :download="SURVEY_TEMPLATE_FILE_NAME"
              >
                <PhDownloadSimple
                  :size="16"
                  aria-hidden="true"
                />
                {{ t('words.wordList.upload.surveyTemplate') }}
              </a>
              <HelpIcon
                :content="t('words.wordList.upload.surveyTemplateHelp')"
                size="sm"
                placement="bottom"
                icon-color="var(--color-primary)"
              />
            </span>
          </div>
          <div class="upload-example__row">
            <span class="upload-example__item"><b class="upload-example__label upload-example__label--def">{{ t('words.wordList.columns.definition') }}</b>吃饭</span>
            <span class="upload-example__item"><b class="upload-example__label upload-example__label--head">{{ t('words.wordList.columns.headword') }}</b>食饭</span>
            <span class="upload-example__item"><b class="upload-example__label upload-example__label--ipa">{{ t('words.wordList.columns.pronunciation') }}</b>sek2fan22</span>
            <span class="upload-example__item"><b class="upload-example__label upload-example__label--note">{{ t('words.wordList.columns.detail') }}</b>也可说喫饭</span>
          </div>
          <div class="upload-example__row">
            <span class="upload-example__item"><b class="upload-example__label upload-example__label--def">{{ t('words.wordList.columns.definition') }}</b>睡觉</span>
            <span class="upload-example__item"><b class="upload-example__label upload-example__label--head">{{ t('words.wordList.columns.headword') }}</b>睏觉</span>
            <span class="upload-example__item"><b class="upload-example__label upload-example__label--ipa">{{ t('words.wordList.columns.pronunciation') }}</b>kʰuəŋ34kɔ34</span>
            <span class="upload-example__item"><b class="upload-example__label upload-example__label--note">{{ t('words.wordList.columns.detail') }}</b>多见于吴语淮官等</span>
          </div>
        </div>

        <div class="upload-location-summary">
          <div>
            <strong>{{ uploadLocation.location_name || t('words.wordList.upload.locationName') }}</strong>
            <p>{{ uploadLocationSummaryText }}</p>
          </div>
          <button class="glass-button" data-variant="primary" type="button" @click="openUploadLocationEditor">
            {{ uploadLocation.location_name ? t('common.button.edit') : t('words.wordList.upload.enterLocationInfo') }}
          </button>
        </div>

        <div class="upload-location-summary-grid">
          <span v-for="item in uploadLocationSummaryItems" :key="item.key">
            {{ item.label }}：{{ item.value }}
          </span>
        </div>

        <div class="upload-parser-row">
          <div class="upload-parser-head">
            <h3 class="upload-section-title">{{ t('words.wordList.upload.chooseFile') }}</h3>
            <button class="pill-btn" type="button" @click="showFormatHelp = true">
              ? {{ t('words.wordList.upload.formatHelp') }}
            </button>
          </div>
          <RadioGroup
            v-model="uploadParserMode"
            name="parser-mode"
            :options="parserModeOptions"
          />
          <CheckBox v-model="fillStandardFromLocal" :label="t('words.wordList.upload.fillStandardFromLocal')" />
          <p v-if="fillStandardFromLocal" class="upload-fill-hint">{{ t('words.wordList.upload.fillStandardFromLocalHint') }}</p>
        </div>

        <TabularImportPreview
          v-if="importFlow.pendingFile.value"
          :key="importFlow.confirmKey.value"
          :model-value="Boolean(importFlow.pendingFile.value)"
          :title="t('words.wordList.upload.previewTitle')"
          :description="t('words.wordList.upload.previewDesc')"
          :file="importFlow.pendingFile.value"
          :schema="importSchema"
          :mapping-enabled="isVocabularyPreviewFile(importFlow.pendingFile.value)"
          :loading="importPreview.loading.value"
          :preview-table="importPreview.previewTable.value"
          :diagnostics="importPreview.diagnostics.value"
          :mapping="importPreview.mapping.value"
          :selected-sheet-id="importPreview.selectedSheetId.value"
          :header-row-index="importPreview.headerRowIndex.value"
          :sheets="importPreview.parsedFile.value?.sheets || []"
          @update:mapping="importFlow.updateManualMapping"
          @update:selected-sheet-id="importPreview.selectedSheetId.value = $event"
          @update:header-row-index="importPreview.headerRowIndex.value = $event"
          @reset="importFlow.clearPreview"
          @confirm="handleConfirmUpload"
        />
        <div
          v-if="backendPreview"
          class="backend-preview"
          :class="{ 'backend-preview--empty': !hasImportableRows }"
        >
          <div class="backend-preview-head">
            <div class="backend-preview-title-row">
              <span class="backend-preview-icon">{{ hasImportableRows ? '✓' : '!' }}</span>
              <strong>{{ t('words.wordList.upload.backendPreviewTitle') }}</strong>
            </div>
            <span class="backend-preview-location">{{ backendPreview.location_name || uploadLocation.location_name }}</span>
          </div>
          <div class="backend-preview-grid">
            <div class="backend-preview-stat">
              <span class="backend-preview-stat-value">{{ backendPreview.parsed_count ?? 0 }}</span>
              <span class="backend-preview-stat-label">{{ t('words.wordList.upload.previewParsedCount') }}</span>
            </div>
            <div class="backend-preview-stat">
              <span class="backend-preview-stat-value">{{ previewSkippedCount }}</span>
              <span class="backend-preview-stat-label">{{ t('words.wordList.upload.previewSkippedCount') }}</span>
            </div>
            <div class="backend-preview-stat">
              <span class="backend-preview-stat-value">{{ backendPreview.would_delete_existing_count ?? 0 }}</span>
              <span class="backend-preview-stat-label">{{ t('words.wordList.upload.previewDeleteCount') }}</span>
            </div>
            <div
              v-if="previewErrors.length"
              class="backend-preview-stat backend-preview-stat--error"
            >
              <span class="backend-preview-stat-value">{{ previewErrors.length }}</span>
              <span class="backend-preview-stat-label">{{ t('words.wordList.upload.previewErrorCount') }}</span>
            </div>
          </div>
          <div class="backend-preview-meta">
            <span>{{ t('words.wordList.upload.previewParserMode') }}：{{ backendPreview.parser_mode || uploadParserMode }}</span>
          </div>
          <p v-if="(backendPreview.would_delete_existing_count ?? 0) > 0" class="backend-preview-warning">
            {{ t('words.wordList.upload.replaceWarning', { count: backendPreview.would_delete_existing_count }) }}
          </p>
          <CheckBox
            v-if="shouldConfirmOverwrite"
            v-model="isOverwriteConfirmed"
            :label="t('words.wordList.upload.confirmOverwrite')"
          />
          <div
            v-if="previewErrors.length"
            class="backend-preview-errors-block"
          >
            <ul class="backend-preview-errors">
              <li
                v-for="error in previewErrors"
                :key="error"
              >
                {{ error }}
              </li>
            </ul>
            <p class="backend-preview-errors-hint">
              {{ t('words.wordList.upload.previewErrorsHint') }}
            </p>
          </div>
        </div>
        <div
          v-if="importResult"
          class="backend-preview"
          :class="{ 'backend-preview--empty': importResult.skippedCount > 0 }"
        >
          <div class="backend-preview-head">
            <div class="backend-preview-title-row">
              <span class="backend-preview-icon">{{ importResult.skippedCount > 0 ? '!' : '✓' }}</span>
              <strong>{{ t('words.wordList.upload.importResultTitle') }}</strong>
            </div>
            <span class="backend-preview-location">{{ importResult.locationName }}</span>
          </div>
          <p class="backend-preview-meta">
            {{ t('words.wordList.upload.importResultSummary', { imported: importResult.importedCount, skipped: importResult.skippedCount }) }}
          </p>
          <div
            v-if="importResult.errors.length"
            class="backend-preview-errors-block"
          >
            <ul class="backend-preview-errors">
              <li
                v-for="error in importResult.errors"
                :key="error"
              >
                {{ error }}
              </li>
            </ul>
            <p class="backend-preview-errors-hint">
              {{ t('words.wordList.upload.importResultErrorsHint') }}
            </p>
          </div>
        </div>
        <input
          type="file"
          ref="fileInputEl"
          accept=".xlsx,.xls,.csv,.tsv,.docx,.doc"
          style="display: none"
          @change="handleUploadFile"
        />
        <div
          v-if="!selectedUploadFile"
          class="upload-zone-drop"
          :class="{ 'drag-over': isDragOver }"
          @click="fileInputEl?.click()"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleDrop"
        >
          <div class="upload-zone-icon"><InlineIcon icon="📄" /></div>
          <p class="upload-zone-hint">{{ t('words.wordList.upload.dropHint') }}</p>
        </div>

        <div class="upload-actions">
          <button
            v-if="selectedUploadFile || importResult"
            class="glass-button"
            data-variant="secondary"
            type="button"
            :disabled="isUploading"
            @click="fileInputEl?.click()"
          >
            {{ t('common.importPreview.actions.reselect') }}
          </button>
          <button
            v-if="uploadFile && !backendPreview"
            class="glass-button"
            data-variant="secondary"
            type="button"
            :disabled="!canConfirmUpload"
            @click="handlePreviewImport()"
          >
            {{ isPreviewingImport ? t('common.label.loading') : t('words.wordList.upload.previewAction') }}
          </button>
          <button
            class="glass-button"
            data-variant="primary"
            type="button"
            :disabled="!canImportAfterPreview"
            @click="handleImportAfterPreview"
          >
            {{ isUploading ? t('common.label.loading') : t('words.wordList.upload.submit') }}
          </button>
        </div>

      </div>
    </section>

    <LocationEditorModal
      v-model="isUploadLocationEditorOpen"
      v-model:draft="uploadLocationDraft"
      width="860px"
      max-height="84dvh"
      :title="uploadLocationDraft.location_name || t('words.wordList.upload.locationName')"
      :close-label="t('common.button.close')"
      :fields="uploadLocationFields"
      :cancel-text="t('common.button.cancel')"
      :confirm-text="t('common.button.confirm')"
      :map-label="t('words.wordList.upload.coordinates')"
      @close="closeUploadLocationEditor"
      @cancel="closeUploadLocationEditor"
      @confirm="confirmUploadLocationEditor"
    >
      <template #location-helper>
        <div class="upload-existing-location">
          <h4 class="upload-section-title">
            {{ t('words.wordList.upload.overwriteExistingLocation') }}
          </h4>
          <SimpleSelectDropdown
            :model-value="existingLocationKey"
            :options="existingLocationOptions"
            :title="t('words.wordList.upload.overwriteExistingLocation')"
            :placeholder="t('words.wordList.upload.selectExistingLocation')"
            width="fit-content"
            style="max-width: 100%"
            :disabled="isLoadingExistingLocations || !canUploadVocabulary"
            searchable
            match-trigger-width
            @update:model-value="selectExistingLocation"
          />
        </div>
      </template>
      <template #map>
        <MiniMapSelector
          v-model:coord="uploadLocationCoord"
          :visible="isUploadLocationEditorOpen"
          mode="picker"
          :points="uploadLocationMapPoints"
          :hint-text="t('words.wordList.upload.mapPickerHint')"
        />
      </template>
    </LocationEditorModal>

    <AppModal
      :model-value="showFormatHelp"
      size="lg"
      :title="t('words.wordList.upload.formatHelpTitle')"
      :close-label="t('common.button.close')"
      @update:modelValue="showFormatHelp = false"
    >
      <div class="format-help-content ui-scrollbar">
        <div class="help-section">
          <div class="help-section-head">
            <h4>{{ t('words.wordList.upload.formatHelpTable.title') }}</h4>
            <a class="help-download" :href="`/data/sample/vocabulary_sample_table.xlsx`" download>{{ t('words.wordList.upload.downloadSample') }}</a>
          </div>
          <p>{{ t('words.wordList.upload.formatHelpTable.desc') }}</p>
          <div class="format-details">
            <p><strong>{{ t('words.wordList.upload.formatHelpTable.required') }}</strong></p>
            <table class="help-table">
              <thead>
                <tr>
                  <th>{{ t('words.wordList.upload.formatHelpTable.colField') }}</th>
                  <th>{{ t('words.wordList.upload.formatHelpTable.colAliases') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="col in formatHelpTableColumns" :key="col.key">
                  <td>
                    <code>{{ col.label }}</code><span v-if="col.required" class="help-required">*</span>
                    <span v-if="col.hint" class="help-field-hint">{{ col.hint }}</span>
                  </td>
                  <td>{{ col.aliases }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="t('words.wordList.upload.formatHelpTable.note')" class="help-note">{{ t('words.wordList.upload.formatHelpTable.note') }}</p>
          </div>
        </div>

        <div class="help-section">
          <div class="help-section-head">
            <h4>{{ t('words.wordList.upload.formatHelpBracket.title') }}</h4>
            <a class="help-download" :href="`/data/sample/vocabulary_sample_doc_bracket.docx`" download>{{ t('words.wordList.upload.downloadSample') }}</a>
          </div>
          <p>{{ t('words.wordList.upload.formatHelpBracket.desc') }}</p>
          <div class="format-details">
            <table class="help-table">
              <thead>
                <tr>
                  <th>{{ t('words.wordList.upload.formatHelpBracket.colSymbol') }}</th>
                  <th>{{ t('words.wordList.upload.formatHelpBracket.colMeaning') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>[ ]</code></td>
                  <td>{{ t('words.wordList.upload.formatHelpBracket.ipa') }}</td>
                </tr>
                <tr>
                  <td><code>{ }</code></td>
                  <td>{{ t('words.wordList.upload.formatHelpBracket.notes') }}</td>
                </tr>
                <tr>
                  <td><code>( )</code> / <code>（ ）</code></td>
                  <td>{{ t('words.wordList.upload.formatHelpBracket.localExpression') }}</td>
                </tr>
                <tr>
                  <td>{{ t('words.wordList.upload.formatHelpBracket.remaining') }}</td>
                  <td>{{ t('words.wordList.upload.formatHelpBracket.standardWord') }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="t('words.wordList.upload.formatHelpBracket.note')" class="help-note">{{ t('words.wordList.upload.formatHelpBracket.note') }}</p>
          </div>
        </div>

        <div class="help-section">
          <div class="help-section-head">
            <h4>{{ t('words.wordList.upload.formatHelpWhitespace.title') }}</h4>
            <a class="help-download" :href="`/data/sample/vocabulary_sample_doc_whitespace.docx`" download>{{ t('words.wordList.upload.downloadSample') }}</a>
          </div>
          <p>{{ t('words.wordList.upload.formatHelpWhitespace.desc') }}</p>
          <div class="format-details">
            <table class="help-table">
              <thead>
                <tr>
                  <th>{{ t('words.wordList.upload.formatHelpWhitespace.colPosition') }}</th>
                  <th>{{ t('words.wordList.upload.formatHelpWhitespace.colField') }}</th>
                  <th>{{ t('words.wordList.upload.formatHelpWhitespace.colRequired') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>{{ t('words.wordList.columns.definition') }}</td>
                  <td>{{ t('common.label.yes') }}</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>
                    {{ t('words.wordList.columns.headword') }}
                    <span class="help-field-hint">{{ t('words.wordList.upload.formatHelpTable.atLeastOne') }}</span>
                  </td>
                  <td>{{ t('common.label.no') }}</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>
                    {{ t('words.wordList.columns.pronunciation') }}
                    <span class="help-field-hint">{{ t('words.wordList.upload.formatHelpTable.atLeastOne') }}</span>
                  </td>
                  <td>{{ t('common.label.no') }}</td>
                </tr>
                <tr>
                  <td>4+</td>
                  <td>{{ t('words.wordList.columns.detail') }}</td>
                  <td>{{ t('common.label.no') }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="t('words.wordList.upload.formatHelpWhitespace.note')" class="help-note">{{ t('words.wordList.upload.formatHelpWhitespace.note') }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="glass-button" data-variant="primary" type="button" @click="showFormatHelp = false">
          {{ t('tools.checkTool.help.gotIt') }}
        </button>
      </template>
    </AppModal>

  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PhArrowsClockwise, PhDownloadSimple } from '@phosphor-icons/vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getVocabularyCounts, getVocabularyLocations, previewVocabularyImport, uploadVocabulary } from '@/api'
import AppModal from '@/components/common/AppModal.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import { useTabularImportFlow } from '@/composables/import/useTabularImportFlow.js'
import { transformTabularFile } from '@/utils/import/transformTabularFile.js'
import MiniMapSelector from '@/main/components/map/MiniMapSelector.vue'
import LocationEditorModal from './LocationEditorModal.vue'
import { LOCATION_BASE_FIELDS, TONE_FIELDS } from './vocabularyLocationFields.js'
import { formatCoord } from '@/main/utils/drawMap/formatCoord.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { showError, showInfo, showSuccess, showWarning } from '@/utils/ui/message.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const SURVEY_TEMPLATE_URL = '/data/sample/方音圖鑑詞彙模板.xlsx'
const SURVEY_TEMPLATE_FILE_NAME = '方音圖鑑詞彙模板.xlsx'

const props = defineProps({
  vocabularyMe: { type: Object, default: null },
  isLoadingVocabularyMe: { type: Boolean, default: false },
  vocabularyMeError: { type: String, default: '' },
  isAuthenticated: { type: Boolean, default: false },
  isAuthReady: { type: Boolean, default: false },
})

const refreshVocabularyMe = inject('refreshVocabularyMe', null)
const canUploadVocabulary = computed(() => props.vocabularyMe?.can_upload === true)
const isWaitingForAuth = computed(() => !props.isAuthReady || props.isLoadingVocabularyMe)
const requiresLogin = computed(() => props.isAuthReady && !props.isAuthenticated)
const requiresVocabularyPermission = computed(() => (
  props.isAuthReady
  && props.isAuthenticated
  && !props.isLoadingVocabularyMe
  && !canUploadVocabulary.value
  && !props.vocabularyMeError
))
const shouldShowPermissionRequest = computed(() => (
  requiresLogin.value || requiresVocabularyPermission.value
))
const canShowRefreshVocabularyPermission = computed(() => (
  props.isAuthReady && props.isAuthenticated && Boolean(refreshVocabularyMe)
))
const uploadAccessNotice = computed(() => {
  if (isWaitingForAuth.value) return t('words.wordList.access.loadingDesc')
  if (requiresLogin.value) return t('words.wordList.access.loginUploadDesc')
  if (props.vocabularyMeError) return `${t('words.wordList.access.permissionLoadFailedTitle')}：${props.vocabularyMeError}`
  if (requiresVocabularyPermission.value) {
    return t('words.wordList.access.noUploadPermissionDesc')
  }
  return ''
})

const vocabTotalCount = ref(null)
const vocabLocationCount = ref(null)

async function refreshVocabularyCounts() {
  const counts = await getVocabularyCounts()
  if (counts.total != null) vocabTotalCount.value = counts.total
  if (counts.locations != null) vocabLocationCount.value = counts.locations
}

onMounted(refreshVocabularyCounts)

function navigateToSuggestion() {
  router.push({
    path: buildLocalePath(resolveRouteLocale(route), '/menu/about/suggestion'),
    query: {
      category: 'vocabulary_permission',
      from: 'vocabulary_import',
    },
  })
}

const isUploading = ref(false)
const isPreviewingImport = ref(false)
const showFormatHelp = ref(false)
const backendPreview = ref(null)
const isOverwriteConfirmed = ref(false)
const importResult = ref(null)

const uploadParserMode = ref('auto')
const fillStandardFromLocal = ref(false)
const uploadFile = ref(null)
const fileInputEl = ref(null)
const isDragOver = ref(false)

const createEmptyUploadLocation = () => Object.fromEntries(
  [...LOCATION_BASE_FIELDS, ...TONE_FIELDS].map((field) => [field.key, ''])
)
const uploadLocation = ref(createEmptyUploadLocation())
const uploadLocationDraft = ref(createEmptyUploadLocation())
const isUploadLocationEditorOpen = ref(false)
const existingLocations = ref([])
const existingLocationKey = ref('')
const uploadTargetLocation = ref(null)
const isLoadingExistingLocations = ref(false)
const existingLocationsError = ref('')
let existingLocationsRequest = 0
let preserveBackendPreviewOnFilePromotion = false

function getExistingLocationKey(location) {
  return JSON.stringify([location.user_id, location.location_name])
}

const existingLocationOptions = computed(() => [
  { value: '', label: t('words.wordList.upload.newLocation') },
  ...existingLocations.value.map((location) => ({
    value: getExistingLocationKey(location),
    label: `${location.location_name} (${location.username || location.user_id})`,
  })),
])

const uploadLocationFields = computed(() => [
  ...LOCATION_BASE_FIELDS.map((field) => ({
    key: field.key,
    label: t(field.labelKey),
    placeholder: t(field.placeholderKey || field.labelKey),
    required: Boolean(field.required),
  })),
  ...TONE_FIELDS.map((field) => ({
    key: field.key,
    label: t(field.labelKey),
    placeholder: t(field.labelKey),
    required: false,
  })),
])

const parserModeOptions = computed(() => [
  { value: 'auto', label: t('words.wordList.upload.parserModes.auto') },
  { value: 'table', label: t('words.wordList.upload.parserModes.table') },
  { value: 'doc_whitespace', label: t('words.wordList.upload.parserModes.docWhitespace') },
  { value: 'doc_bracket', label: t('words.wordList.upload.parserModes.docBracket') },
])

const formatHelpTableColumns = computed(() => [
  { key: 'standard_word', label: t('words.wordList.columns.definition'), required: true, aliases: 'standard_word / written / 释义 / 书面 / 书面词条 / 词条 / meaning' },
  { key: 'local_expression', label: t('words.wordList.columns.headword'), required: false, aliases: 'local_expression / vocabulary / 当地讲法 / 方言词 / 方言讲法 / local', hint: t('words.wordList.upload.formatHelpTable.atLeastOne') },
  { key: 'ipa', label: t('words.wordList.columns.pronunciation'), required: false, aliases: 'ipa / IPA / 音标 / 国际音标', hint: t('words.wordList.upload.formatHelpTable.atLeastOne') },
  { key: 'notes', label: t('words.wordList.columns.detail'), required: false, aliases: 'notes / note / 注释 / 备注 / 说明' },
])

const importSchema = computed(() => [
  {
    key: 'standard_word',
    label: t('words.wordList.columns.definition'),
    required: !fillStandardFromLocal.value,
    aliases: ['standard_word', 'written', '释义', '釋義', '书面', '書面', '书面词条', '書面詞條', '词条', '詞條', 'meaning'],
    example: t('words.wordList.import.examples.definition')
  },
  {
    key: 'local_expression',
    label: t('words.wordList.columns.headword'),
    required: false,
    aliases: ['local_expression', 'vocabulary', '当地讲法', '當地講法', '方言词', '方言詞', '方言讲法', '方言講法', 'local'],
    example: t('words.wordList.import.examples.headword')
  },
  {
    key: 'ipa',
    label: t('words.wordList.columns.pronunciation'),
    required: false,
    aliases: ['ipa', 'IPA', '音标', '音標', '国际音标', '國際音標'],
    example: t('words.wordList.import.examples.pronunciation')
  },
  {
    key: 'notes',
    label: t('words.wordList.columns.detail'),
    required: false,
    aliases: ['notes', 'note', '注释', '註釋', '备注', '備註', '说明', '說明'],
    example: t('words.wordList.import.examples.detail')
  }
])

const importPreview = useTabularImportPreview({
  schema: importSchema,
  requireExplicitConfirmation: true
})

const importFlow = useTabularImportFlow({
  previewState: importPreview
})

const selectedUploadFile = computed(() => uploadFile.value || importFlow.pendingFile.value)

const uploadLocationSummaryItems = computed(() => {
  const values = uploadLocation.value
  return uploadLocationFields.value
    .filter((field) => field.key !== 'location_name')
    .map((field) => ({
      key: field.key,
      label: field.label,
      value: String(values[field.key] || '').trim()
    }))
    .filter((item) => item.value)
})

const uploadLocationSummaryText = computed(() => {
  if (!uploadLocation.value.location_name) {
    return t('words.wordList.upload.missingLocation')
  }

  const locationParts = [
    uploadLocation.value.province,
    uploadLocation.value.city,
    uploadLocation.value.county,
    uploadLocation.value.town,
    uploadLocation.value.administrative_village,
    uploadLocation.value.natural_village,
  ].map((value) => String(value || '').trim()).filter(Boolean)

  return locationParts.length
    ? locationParts.join(' - ')
    : (uploadLocation.value.coordinates || t('words.wordList.upload.coordinates'))
})

const uploadLocationCoord = computed({
  get() {
    return parseCoordText(uploadLocationDraft.value.coordinates)
  },
  set(coord) {
    if (!Array.isArray(coord) || coord.length < 2) return
    uploadLocationDraft.value.coordinates = formatCoord(coord[0], coord[1])
  }
})

const uploadLocationMapPoints = computed(() => {
  const coord = uploadLocationCoord.value
  if (!coord) return []
  return [
    {
      coord,
      label: uploadLocationDraft.value.location_name,
      active: true,
    }
  ]
})

const canConfirmUpload = computed(() => {
  const file = selectedUploadFile.value
  if (!file || isUploading.value || isPreviewingImport.value || !canUploadVocabulary.value) {
    return false
  }
  return !isVocabularyPreviewFile(file) || importPreview.diagnostics.value.isComplete
})

const shouldConfirmOverwrite = computed(() => {
  return Number(backendPreview.value?.would_delete_existing_count) > 0
})

const previewErrors = computed(() => parseErrorDetails(backendPreview.value?.errors))
const previewSkippedCount = computed(() => (Number(backendPreview.value?.skipped_count) || 0) + previewErrors.value.length)

const hasImportableRows = computed(() => isPreviewImportable(backendPreview.value))

const canImportAfterPreview = computed(() => {
  return canConfirmUpload.value
    && hasImportableRows.value
    && (!shouldConfirmOverwrite.value || isOverwriteConfirmed.value)
})

function isPreviewImportable(response) {
  return Number(response?.parsed_count) > 0
}

function isVocabularyPreviewFile(file) {
  return Boolean(file?.name && /\.(xlsx|xls|csv|tsv)$/i.test(file.name))
}

function isVocabularyUploadFile(file) {
  return Boolean(file?.name && /\.(xlsx|xls|csv|tsv|docx|doc)$/i.test(file.name))
}

function parseCoordText(text) {
  if (!text || typeof text !== 'string') return null
  const [lngText, latText] = text.split(',')
  const lng = Number(String(lngText || '').trim())
  const lat = Number(String(latText || '').trim())
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return [lng, lat]
}

function normalizeUploadLocation(location) {
  return Object.fromEntries(
    Object.entries(createEmptyUploadLocation()).map(([key]) => [key, String(location?.[key] || '').trim()])
  )
}

function openUploadLocationEditor() {
  uploadLocationDraft.value = { ...uploadLocation.value }
  existingLocationKey.value = uploadTargetLocation.value ? getExistingLocationKey(uploadTargetLocation.value) : ''
  isUploadLocationEditorOpen.value = true
  loadExistingLocations()
}

function closeUploadLocationEditor() {
  existingLocationsRequest += 1
  isLoadingExistingLocations.value = false
  isUploadLocationEditorOpen.value = false
  uploadLocationDraft.value = createEmptyUploadLocation()
}

function confirmUploadLocationEditor() {
  const target = existingLocations.value.find((location) => getExistingLocationKey(location) === existingLocationKey.value)
  if (existingLocationKey.value && (!target || isLoadingExistingLocations.value)) {
    showWarning(existingLocationsError.value || t('common.label.loading'))
    return
  }
  const draft = normalizeUploadLocation(uploadLocationDraft.value)
  const matchingTarget = target?.location_name === draft.location_name ? target : null
  uploadTargetLocation.value = matchingTarget ? { user_id: matchingTarget.user_id, location_name: matchingTarget.location_name } : null
  uploadLocation.value = draft
  closeUploadLocationEditor()
}

async function loadExistingLocations() {
  const request = ++existingLocationsRequest
  existingLocations.value = []
  existingLocationsError.value = ''
  if (!canUploadVocabulary.value) return
  isLoadingExistingLocations.value = true
  try {
    const locations = []
    let page = 1
    let total = 0
    do {
      const response = await getVocabularyLocations({ page, page_size: 200 })
      if (request !== existingLocationsRequest) return
      const rows = Array.isArray(response.locations) ? response.locations : []
      total = Number(response.total) || 0
      if (!rows.length && locations.length < total) throw new Error(t('words.wordList.locations.loadFailed'))
      locations.push(...rows)
      page += 1
    } while (locations.length < total)
    existingLocations.value = locations
  } catch (error) {
    if (request !== existingLocationsRequest) return
    existingLocationsError.value = error.message || t('words.wordList.locations.loadFailed')
    showError(existingLocationsError.value)
  } finally {
    if (request === existingLocationsRequest) isLoadingExistingLocations.value = false
  }
}

function selectExistingLocation(key) {
  const location = existingLocations.value.find((item) => getExistingLocationKey(item) === key)
  existingLocationKey.value = location ? key : ''
  uploadLocationDraft.value = location ? normalizeUploadLocation(location) : createEmptyUploadLocation()
}

watch(() => uploadLocationDraft.value.location_name, (name) => {
  const target = existingLocations.value.find((location) => getExistingLocationKey(location) === existingLocationKey.value)
  if (target && name !== target.location_name) existingLocationKey.value = ''
})

watch([() => props.vocabularyMe?.user_id, () => props.vocabularyMe?.permission_level, canUploadVocabulary], () => {
  closeUploadLocationEditor()
  existingLocations.value = []
  existingLocationKey.value = ''
  if (uploadTargetLocation.value) uploadLocation.value = createEmptyUploadLocation()
  uploadTargetLocation.value = null
  backendPreview.value = null
  isOverwriteConfirmed.value = false
})

onBeforeUnmount(() => { existingLocationsRequest += 1 })

function clearUploadFile() {
  uploadFile.value = null
  backendPreview.value = null
  isOverwriteConfirmed.value = false
  importResult.value = null
  importFlow.clearPreview()
}

function handleDrop(event) {
  isDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  backendPreview.value = null
  clearUploadFile()

  if (!isVocabularyUploadFile(file)) {
    showWarning(t('words.wordList.upload.unsupportedFile'))
    return
  }

  if (isVocabularyPreviewFile(file)) {
    importFlow.loadPreview(file)
  } else {
    uploadFile.value = file
    handlePreviewImport()
  }
}

function handleUploadFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  backendPreview.value = null
  clearUploadFile()

  if (!isVocabularyUploadFile(file)) {
    showWarning(t('words.wordList.upload.unsupportedFile'))
    event.target.value = ''
    return
  }

  if (isVocabularyPreviewFile(file)) {
    importFlow.loadPreview(file)
  } else {
    uploadFile.value = file
    handlePreviewImport()
  }

  event.target.value = ''
}

watch(fillStandardFromLocal, (val) => {
  if (val) {
    showInfo(t('words.wordList.upload.fillStandardFromLocalHint'))
  }
})

watch([uploadParserMode, selectedUploadFile, uploadLocation, uploadTargetLocation], () => {
  if (preserveBackendPreviewOnFilePromotion) {
    preserveBackendPreviewOnFilePromotion = false
    return
  }
  backendPreview.value = null
  isOverwriteConfirmed.value = false
}, { deep: true })

function buildUploadLocation() {
  return normalizeUploadLocation(uploadLocation.value)
}

function buildVocabularyImportColumnMap() {
  const mapping = importPreview.mapping.value
  return [
    { sourceKey: mapping.standard_word, header: 'standard_word' },
    { sourceKey: mapping.local_expression, header: 'local_expression' },
    { sourceKey: mapping.ipa, header: 'ipa' },
    { sourceKey: mapping.notes, header: 'notes' },
  ].filter((entry) => entry.sourceKey)
}

function buildMappedVocabularyImportFile(file) {
  const columnMap = buildVocabularyImportColumnMap()
  if (!columnMap.length) {
    return file
  }

  return transformTabularFile({
    parsedFile: importPreview.parsedFile.value,
    columnMap,
    selectedSheetId: importPreview.selectedSheetId.value,
    headerRowIndex: importPreview.headerRowIndex.value,
    mode: 'replace'
  })
}

async function handlePreviewImport(fileOverride = null) {
  const file = fileOverride || uploadFile.value || importFlow.pendingFile.value

  if (!file || isUploading.value || isPreviewingImport.value) {
    return null
  }

  const location = buildUploadLocation()

  if (!location.location_name || !location.coordinates) {
    showWarning(t('words.wordList.upload.missingLocation'))
    return null
  }

  if (!canUploadVocabulary.value) {
    showWarning(t('words.wordList.upload.permissionRequired'))
    return null
  }

  isPreviewingImport.value = true
  backendPreview.value = null

  try {
    const previewResponse = await previewVocabularyImport({
      file,
      location,
      target_user_id: uploadTargetLocation.value?.user_id,
      parser_mode: uploadParserMode.value,
      fill_standard_from_local: fillStandardFromLocal.value,
    })
    backendPreview.value = previewResponse
    if (!isPreviewImportable(previewResponse)) {
      const details = parseErrorDetails(previewResponse.errors)
      const message = details.length
        ? details.join('；')
        : t('words.wordList.upload.noImportableData')
      showError(message)
    }
    return previewResponse
  } catch (error) {
    showError(error.message || t('words.wordList.upload.previewFailed'))
    return null
  } finally {
    isPreviewingImport.value = false
  }
}

async function handleConfirmUpload() {
  const file = importFlow.pendingFile.value
  if (!file || !importPreview.diagnostics.value.isComplete) {
    showError(t('common.importPreview.messages.mappingIncomplete'))
    return
  }

  const transformedFile = buildMappedVocabularyImportFile(file)
  const previewResponse = await handlePreviewImport(transformedFile)
  if (isPreviewImportable(previewResponse)) {
    preserveBackendPreviewOnFilePromotion = true
    uploadFile.value = transformedFile
    importFlow.pendingFile.value = null
  }
}

async function handleImportAfterPreview() {
  const file = uploadFile.value || importFlow.pendingFile.value

  if (!file || isUploading.value || !hasImportableRows.value) {
    return
  }

  const location = buildUploadLocation()

  if (!location.location_name || !location.coordinates) {
    showWarning(t('words.wordList.upload.missingLocation'))
    return
  }

  isUploading.value = true

  try {
    const response = await uploadVocabulary({
      file,
      location,
      target_user_id: uploadTargetLocation.value?.user_id,
      parser_mode: uploadParserMode.value,
      overwrite: shouldConfirmOverwrite.value ? isOverwriteConfirmed.value : false,
      fill_standard_from_local: fillStandardFromLocal.value,
    })
    void refreshVocabularyCounts()
    const importedCount = Number(response.imported_count) || 0
    const errors = parseErrorDetails(response.errors)
    const skippedCount = (Number(response.skipped_count) || 0) + errors.length
    const locationName = location.location_name
    clearUploadFile()
    uploadLocation.value = createEmptyUploadLocation()
    uploadTargetLocation.value = null
    existingLocationKey.value = ''
    closeUploadLocationEditor()
    uploadParserMode.value = 'auto'
    fillStandardFromLocal.value = false
    importResult.value = { importedCount, skippedCount, errors, locationName }
    const message = skippedCount > 0
      ? t('words.wordList.upload.successWithSkipped', { imported: importedCount, skipped: skippedCount })
      : t('words.wordList.upload.success', { count: importedCount })
    if (skippedCount > 0) {
      showWarning(message)
    } else {
      showSuccess(message)
    }
  } catch (error) {
    const message = isNoImportableRowsMessage(error?.message)
      ? t('words.wordList.upload.noImportableData')
      : (error.message || t('words.wordList.upload.failed'))
    showError(message)
  } finally {
    isUploading.value = false
  }
}

// 后端在没有可导入行时用这句英文兜底（preview 放进 errors，import 抛 400）
function isNoImportableRowsMessage(message) {
  return /no valid vocabulary rows/i.test(String(message || ''))
}

function parseErrorDetails(errors) {
  return (Array.isArray(errors) ? errors : []).filter((message) => !isNoImportableRowsMessage(message))
}
</script>

<script>
export default {
  name: 'VocabularyImportPage'
}
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
