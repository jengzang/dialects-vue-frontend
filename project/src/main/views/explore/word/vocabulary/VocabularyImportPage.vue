<template>
  <div class="vocabulary-import-page">
    <section class="content-area">
      <div class="upload-mode main-glass-panel">
        <div class="upload-head">
            <h3>{{ t('words.wordList.upload.title') }}</h3>
            <div class="upload-head-counts">
              <span>{{ t('words.wordList.upload.totalEntries', { count: vocabTotalCount ?? '…' }) }}</span>
              <span class="count-sep">·</span>
              <span>{{ t('words.wordList.upload.totalLocations', { count: vocabLocationCount ?? '…' }) }}</span>
            </div>
            <!-- <p>{{ t('words.wordList.upload.desc') }}</p> -->
            <div v-if="requiresLogin" class="upload-access-notice">
              <p>{{ uploadAccessNotice }}</p>
              <button
                class="main-glass-button"
                data-variant="primary"
                type="button"
                @click="navigateToSuggestion"
              >
                {{ t('words.wordList.access.requestEditPermission') }}
              </button>
            </div>
            <p v-else-if="uploadAccessNotice" class="upload-status">{{ uploadAccessNotice }}</p>
        </div>

        <div class="upload-location-summary">
          <div>
            <strong>{{ uploadLocation.location_name || t('words.wordList.upload.locationName') }}</strong>
            <p>{{ uploadLocationSummaryText }}</p>
          </div>
          <button class="main-glass-button" data-variant="primary" type="button" @click="openUploadLocationEditor">
            {{ uploadLocation.location_name ? t('common.button.edit') : t('words.wordList.upload.enterLocationInfo') }}
          </button>
        </div>

        <div class="upload-location-summary-grid">
          <span v-for="item in uploadLocationSummaryItems" :key="item.key">
            {{ item.label }}：{{ item.value }}
          </span>
        </div>

        <div class="upload-example">
          <div class="upload-example__title">{{ t('words.wordList.upload.dataExample') }}</div>
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

        <div class="upload-parser-row">
          <div class="upload-parser-head">
            <h3 class="upload-section-title">{{ t('words.wordList.upload.chooseFile') }}</h3>
            <button class="main-glass-button info-help-btn" data-size="small" type="button" @click="showFormatHelp = true">
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
        <div v-if="backendPreview" class="backend-preview">
          <div class="backend-preview-head">
            <div class="backend-preview-title-row">
              <span class="backend-preview-icon">&#10003;</span>
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
              <span class="backend-preview-stat-value">{{ backendPreview.skipped_count ?? 0 }}</span>
              <span class="backend-preview-stat-label">{{ t('words.wordList.upload.previewSkippedCount') }}</span>
            </div>
            <div class="backend-preview-stat">
              <span class="backend-preview-stat-value">{{ backendPreview.would_delete_existing_count ?? 0 }}</span>
              <span class="backend-preview-stat-label">{{ t('words.wordList.upload.previewDeleteCount') }}</span>
            </div>
          </div>
          <div class="backend-preview-meta">
            <span>{{ t('words.wordList.upload.previewParserMode') }}：{{ backendPreview.parser_mode || uploadParserMode }}</span>
          </div>
          <p v-if="(backendPreview.would_delete_existing_count ?? 0) > 0" class="backend-preview-warning">
            {{ t('words.wordList.upload.replaceWarning', { count: backendPreview.would_delete_existing_count }) }}
          </p>
          <label v-if="shouldConfirmOverwrite" class="backend-preview-overwrite">
            <input v-model="isOverwriteConfirmed" type="checkbox" />
            <span>{{ t('words.wordList.upload.confirmOverwrite') }}</span>
          </label>
          <ul v-if="backendPreview.errors?.length" class="backend-preview-errors">
            <li v-for="error in backendPreview.errors" :key="error">{{ error }}</li>
          </ul>
        </div>
        <p v-if="uploadStatusText" class="upload-status">{{ uploadStatusText }}</p>

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
          <div class="upload-zone-icon">📄</div>
          <p class="upload-zone-hint">{{ t('words.wordList.upload.dropHint') }}</p>
        </div>

        <div class="upload-actions">
          <button
            v-if="selectedUploadFile"
            class="main-glass-button"
            data-variant="secondary"
            type="button"
            :disabled="isUploading"
            @click="clearUploadFile()"
          >
            {{ t('common.importPreview.actions.reselect') }}
          </button>
          <button
            class="main-glass-button"
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

    <AppModal
      v-model="isUploadLocationEditorOpen"
      size="lg"
      width="860px"
      max-height="84dvh"
      :title="uploadLocationDraft.location_name || t('words.wordList.upload.locationName')"
      :close-label="t('common.button.close')"
      @close="closeUploadLocationEditor"
    >
      <div class="upload-location-modal">
        <div class="upload-location-modal-toolbar">
          <button
            class="main-glass-button"
            data-variant="primary"
            type="button"
            :disabled="isLoadingYindianLocation || !uploadLocationDraft.location_name.trim()"
            @click="useYindianLocationData"
          >
            {{ isLoadingYindianLocation ? t('common.label.loading') : t('words.wordList.upload.useYindianData') }}
          </button>
          <p class="upload-location-modal-hint">{{ t('words.wordList.upload.yindianHint') }}</p>
          <span v-if="uploadLocationEditorStatus">{{ uploadLocationEditorStatus }}</span>
        </div>

        <div class="upload-location-modal-layout">
          <div class="upload-location-grid">
            <label v-for="field in uploadLocationFields" :key="field.key" class="upload-field">
              <span>{{ field.label }}</span>
              <input
                v-model="uploadLocationDraft[field.key]"
                type="text"
                :required="field.required"
                :placeholder="field.placeholder"
              />
            </label>
          </div>

          <div class="upload-location-map-panel">
            <strong>{{ t('words.wordList.upload.coordinates') }}</strong>
            <MiniMapSelector
              v-model:coord="uploadLocationCoord"
              :visible="isUploadLocationEditorOpen"
              mode="picker"
              :points="uploadLocationMapPoints"
              :hint-text="t('words.wordList.upload.mapPickerHint')"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="location-edit-modal-actions">
          <button class="main-glass-button" data-variant="secondary" type="button" @click="closeUploadLocationEditor">
            {{ t('common.button.cancel') }}
          </button>
          <button class="main-glass-button" data-variant="primary" type="button" @click="confirmUploadLocationEditor">
            {{ t('common.button.confirm') }}
          </button>
        </div>
      </template>
    </AppModal>

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
        <button class="main-glass-button" data-variant="primary" type="button" @click="showFormatHelp = false">
          {{ t('tools.checkTool.help.gotIt') }}
        </button>
      </template>
    </AppModal>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getLocationDetail, getVocabularyCounts, previewVocabularyImport, uploadVocabulary } from '@/api'
import AppModal from '@/components/common/AppModal.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import { useTabularImportFlow } from '@/composables/import/useTabularImportFlow.js'
import MiniMapSelector from '@/main/components/map/MiniMapSelector.vue'
import { formatCoord } from '@/main/utils/drawMap/formatCoord.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { showError, showInfo, showSuccess, showWarning } from '@/utils/ui/message.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const props = defineProps({
  vocabularyMe: { type: Object, default: null },
  isLoadingVocabularyMe: { type: Boolean, default: false },
  vocabularyMeError: { type: String, default: '' },
  isAuthenticated: { type: Boolean, default: false },
  isAuthReady: { type: Boolean, default: false },
})

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

onMounted(async () => {
  const counts = await getVocabularyCounts()
  vocabTotalCount.value = counts.total
  vocabLocationCount.value = counts.locations
})

function navigateToSuggestion() {
  router.push(buildLocalePath(resolveRouteLocale(route), '/menu/about/suggestion'))
}

const isUploading = ref(false)
const isPreviewingImport = ref(false)
const showFormatHelp = ref(false)
const uploadStatusText = ref('')
const backendPreview = ref(null)
const isOverwriteConfirmed = ref(false)

const uploadParserMode = ref('auto')
const fillStandardFromLocal = ref(false)
const uploadFile = ref(null)
const fileInputEl = ref(null)
const isDragOver = ref(false)
const createEmptyUploadLocation = () => ({
  location_name: '',
  coordinates: '',
  province: '',
  city: '',
  county: '',
  town: '',
  administrative_village: '',
  natural_village: '',
  yindian_region: '',
  atlas_region: '',
})
const uploadLocation = ref(createEmptyUploadLocation())
const uploadLocationDraft = ref(createEmptyUploadLocation())
const isUploadLocationEditorOpen = ref(false)
const isLoadingYindianLocation = ref(false)
const uploadLocationEditorStatus = ref('')

const uploadLocationFields = computed(() => [
  {
    key: 'location_name',
    label: t('words.wordList.upload.locationName'),
    placeholder: t('words.wordList.upload.locationNamePlaceholder'),
    required: true
  },
  {
    key: 'coordinates',
    label: t('words.wordList.upload.coordinates'),
    placeholder: t('words.wordList.upload.coordinatesPlaceholder'),
    required: true
  },
  { key: 'province', label: t('words.wordList.upload.province'), placeholder: t('words.wordList.upload.province'), required: false },
  { key: 'city', label: t('words.wordList.upload.city'), placeholder: t('words.wordList.upload.city'), required: false },
  { key: 'county', label: t('words.wordList.upload.county'), placeholder: t('words.wordList.upload.county'), required: false },
  { key: 'town', label: t('words.wordList.upload.town'), placeholder: t('words.wordList.upload.town'), required: false },
  { key: 'administrative_village', label: t('words.wordList.upload.administrativeVillage'), placeholder: t('words.wordList.upload.administrativeVillage'), required: false },
  { key: 'natural_village', label: t('words.wordList.upload.naturalVillage'), placeholder: t('words.wordList.upload.naturalVillage'), required: false },
  { key: 'yindian_region', label: t('words.wordList.upload.yindianRegion'), placeholder: t('words.wordList.upload.yindianRegion'), required: false },
  { key: 'atlas_region', label: t('words.wordList.upload.atlasRegion'), placeholder: t('words.wordList.upload.atlasRegion'), required: false },
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
    uploadLocationEditorStatus.value = ''
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

const canImportAfterPreview = computed(() => {
  return canConfirmUpload.value
    && backendPreview.value?.success === true
    && (!shouldConfirmOverwrite.value || isOverwriteConfirmed.value)
})

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
  uploadLocationEditorStatus.value = ''
  isUploadLocationEditorOpen.value = true
}

function closeUploadLocationEditor() {
  isUploadLocationEditorOpen.value = false
  uploadLocationDraft.value = createEmptyUploadLocation()
  uploadLocationEditorStatus.value = ''
}

function confirmUploadLocationEditor() {
  uploadLocation.value = normalizeUploadLocation(uploadLocationDraft.value)
  closeUploadLocationEditor()
}

function getLocationDetailRow(response) {
  if (Array.isArray(response?.data)) return response.data[0] || null
  if (response?.data && typeof response.data === 'object') return response.data
  return response && typeof response === 'object' ? response : null
}

function applyYindianLocationDetail(detail) {
  uploadLocationDraft.value = {
    ...uploadLocationDraft.value,
    location_name: uploadLocationDraft.value.location_name || detail?.['語言'] || '',
    coordinates: detail?.['經緯度'] || uploadLocationDraft.value.coordinates,
    province: detail?.['省'] || uploadLocationDraft.value.province,
    city: detail?.['市'] || uploadLocationDraft.value.city,
    county: detail?.['縣'] || uploadLocationDraft.value.county,
    town: detail?.['鎮'] || uploadLocationDraft.value.town,
    administrative_village: detail?.['行政村'] || uploadLocationDraft.value.administrative_village,
    natural_village: detail?.['自然村'] || uploadLocationDraft.value.natural_village,
    yindian_region: detail?.['音典分區'] || uploadLocationDraft.value.yindian_region,
    atlas_region: detail?.['地圖集二分區'] || uploadLocationDraft.value.atlas_region,
  }
}

async function useYindianLocationData() {
  const locationName = uploadLocationDraft.value.location_name.trim()
  if (!locationName || isLoadingYindianLocation.value) return

  isLoadingYindianLocation.value = true
  uploadLocationEditorStatus.value = ''

  try {
    const response = await getLocationDetail(locationName)
    const detail = getLocationDetailRow(response)
    if (!detail) {
      uploadLocationEditorStatus.value = t('words.wordList.upload.yindianNotFound')
      showWarning(uploadLocationEditorStatus.value)
      return
    }
    applyYindianLocationDetail(detail)
    uploadLocationEditorStatus.value = t('words.wordList.upload.yindianFilled')
    showSuccess(uploadLocationEditorStatus.value)
  } catch (error) {
    uploadLocationEditorStatus.value = error.message || t('words.wordList.upload.yindianFailed')
    showError(uploadLocationEditorStatus.value)
  } finally {
    isLoadingYindianLocation.value = false
  }
}

function clearUploadFile() {
  uploadFile.value = null
  backendPreview.value = null
  isOverwriteConfirmed.value = false
  importFlow.clearPreview()
}

function handleDrop(event) {
  isDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  uploadStatusText.value = ''
  backendPreview.value = null
  clearUploadFile()

  if (!isVocabularyUploadFile(file)) {
    uploadStatusText.value = t('words.wordList.upload.unsupportedFile')
    showWarning(uploadStatusText.value)
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
  uploadStatusText.value = ''
  backendPreview.value = null
  clearUploadFile()

  if (!isVocabularyUploadFile(file)) {
    uploadStatusText.value = t('words.wordList.upload.unsupportedFile')
    showWarning(uploadStatusText.value)
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

watch([uploadParserMode, selectedUploadFile, uploadLocation], () => {
  backendPreview.value = null
  isOverwriteConfirmed.value = false
}, { deep: true })

function buildUploadLocation() {
  return normalizeUploadLocation(uploadLocation.value)
}

async function handlePreviewImport() {
  const file = uploadFile.value || importFlow.pendingFile.value

  if (!file || isUploading.value || isPreviewingImport.value) {
    return
  }

  const location = buildUploadLocation()

  if (!location.location_name || !location.coordinates) {
    uploadStatusText.value = t('words.wordList.upload.missingLocation')
    showWarning(t('words.wordList.upload.missingLocation'))
    return
  }

  if (!canUploadVocabulary.value) {
    uploadStatusText.value = t('words.wordList.upload.permissionRequired')
    showWarning(uploadStatusText.value)
    return
  }

  isPreviewingImport.value = true
  uploadStatusText.value = ''
  backendPreview.value = null

  try {
    const previewResponse = await previewVocabularyImport({
      file,
      location,
      parser_mode: uploadParserMode.value,
      fill_standard_from_local: fillStandardFromLocal.value,
    })
    backendPreview.value = previewResponse
    if (previewResponse.success) {
      uploadStatusText.value = t('words.wordList.upload.previewReady')
    } else {
      uploadStatusText.value = previewResponse.errors?.join('；') || t('words.wordList.upload.previewFailed')
      showError(uploadStatusText.value)
    }
  } catch (error) {
    uploadStatusText.value = error.message || t('words.wordList.upload.previewFailed')
    showError(uploadStatusText.value)
  } finally {
    isPreviewingImport.value = false
  }
}

async function handleConfirmUpload() {
  const file = importFlow.pendingFile.value
  await handlePreviewImport()
  if (backendPreview.value?.success && file) {
    uploadFile.value = file
    importFlow.pendingFile.value = null
  }
}

async function handleImportAfterPreview() {
  const file = uploadFile.value || importFlow.pendingFile.value

  if (!file || isUploading.value || backendPreview.value?.success !== true) {
    return
  }

  const location = buildUploadLocation()

  if (!location.location_name || !location.coordinates) {
    uploadStatusText.value = t('words.wordList.upload.missingLocation')
    showWarning(t('words.wordList.upload.missingLocation'))
    return
  }

  isUploading.value = true
  uploadStatusText.value = ''

  try {
    const response = await uploadVocabulary({
      file,
      location,
      parser_mode: uploadParserMode.value,
      overwrite: shouldConfirmOverwrite.value ? isOverwriteConfirmed.value : false,
      fill_standard_from_local: fillStandardFromLocal.value,
    })
    uploadStatusText.value = t('words.wordList.upload.success', { count: response.imported_count || 0 })
    showSuccess(uploadStatusText.value)
    clearUploadFile()
  } catch (error) {
    uploadStatusText.value = error.message || t('words.wordList.upload.failed')
    showError(uploadStatusText.value)
  } finally {
    isUploading.value = false
  }
}
</script>

<script>
export default {
  name: 'VocabularyImportPage'
}
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
