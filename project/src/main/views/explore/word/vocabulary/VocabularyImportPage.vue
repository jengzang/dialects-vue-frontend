<template>
  <div class="vocabulary-import-page">
    <section class="content-area">
      <RadioGroup
        v-model="contributeSubMode"
        :options="contributeModeOptions"
        name="contribute-mode"
        class="contribute-mode-switch"
      />
      <div class="upload-mode main-glass-panel">
        <div class="upload-head">
          <div>
            <h3>{{ t('words.wordList.upload.title') }}</h3>
            <p>{{ t('words.wordList.upload.desc') }}</p>
            <p v-if="uploadAccessNotice" class="upload-status">{{ uploadAccessNotice }}</p>
          </div>
          <label class="main-glass-button" data-variant="primary">
            {{ t('words.wordList.upload.chooseFile') }}
            <input class="upload-file-input" type="file" accept=".xlsx,.xls,.csv,.tsv,.docx,.doc" @change="handleUploadFile" />
          </label>
        </div>

        <div class="upload-location-summary">
          <div>
            <strong>{{ uploadLocation.location_name || t('words.wordList.upload.locationName') }}</strong>
            <p>{{ uploadLocationSummaryText }}</p>
          </div>
          <button class="main-glass-button" data-variant="secondary" type="button" @click="openUploadLocationEditor">
            {{ uploadLocation.location_name ? t('common.button.edit') : t('words.wordList.upload.locationName') }}
          </button>
        </div>

        <div class="upload-location-summary-grid">
          <span v-for="item in uploadLocationSummaryItems" :key="item.key">
            {{ item.label }}：{{ item.value }}
          </span>
        </div>

        <div class="upload-parser-row">
          <label class="upload-field">
            <span>{{ t('words.wordList.upload.parserMode') }}</span>
            <select v-model="uploadParserMode">
              <option v-for="option in parserModeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>

        <TabularImportPreview
          embedded
          :title="t('words.wordList.upload.previewTitle')"
          :description="t('words.wordList.upload.previewDesc')"
          :file="selectedUploadFile"
          :schema="importSchema"
          :mapping-enabled="isVocabularyPreviewFile(selectedUploadFile)"
          :loading="importPreview.loading.value"
          :preview-table="importPreview.previewTable.value"
          :diagnostics="importPreview.diagnostics.value"
          :mapping="importPreview.mapping.value"
          @update:mapping="importFlow.updateManualMapping"
          @reset="clearUploadFile"
          @confirm="handleConfirmUpload"
        />
        <div v-if="backendPreview" class="backend-preview">
          <div class="backend-preview-head">
            <strong>{{ t('words.wordList.upload.backendPreviewTitle') }}</strong>
            <span>{{ backendPreview.location_name || uploadLocation.location_name }}</span>
          </div>
          <div class="backend-preview-grid">
            <span>{{ t('words.wordList.upload.previewParserMode') }}：{{ backendPreview.parser_mode || uploadParserMode }}</span>
            <span>{{ t('words.wordList.upload.previewParsedCount') }}：{{ backendPreview.parsed_count ?? 0 }}</span>
            <span>{{ t('words.wordList.upload.previewSkippedCount') }}：{{ backendPreview.skipped_count ?? 0 }}</span>
            <span>{{ t('words.wordList.upload.previewDeleteCount') }}：{{ backendPreview.would_delete_existing_count ?? 0 }}</span>
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
        <div class="upload-actions">
          <button
            class="main-glass-button"
            data-variant="secondary"
            type="button"
            :disabled="!canConfirmUpload"
            @click="handlePreviewImport"
          >
            {{ isPreviewingImport ? t('common.label.loading') : t('words.wordList.upload.previewAction') }}
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
        <p v-if="uploadStatusText" class="upload-status">{{ uploadStatusText }}</p>
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
            data-variant="secondary"
            type="button"
            :disabled="isLoadingYindianLocation || !uploadLocationDraft.location_name.trim()"
            @click="useYindianLocationData"
          >
            {{ isLoadingYindianLocation ? t('common.label.loading') : t('words.wordList.upload.useYindianData') }}
          </button>
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

  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getLocationDetail, previewVocabularyImport, uploadVocabulary } from '@/api'
import AppModal from '@/components/common/AppModal.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import { useTabularImportFlow } from '@/composables/import/useTabularImportFlow.js'
import MiniMapSelector from '@/main/components/map/MiniMapSelector.vue'
import { formatCoord } from '@/main/utils/drawMap/formatCoord.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

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
const contributeSubMode = ref('upload')
const contributeModeOptions = computed(() => [
  { value: 'upload', label: t('words.wordList.tabs.uploadTab') },
  { value: 'manage', label: t('words.wordList.tabs.manageTab') },
])
const isUploading = ref(false)
const isPreviewingImport = ref(false)
const uploadStatusText = ref('')
const backendPreview = ref(null)
const isOverwriteConfirmed = ref(false)

const uploadParserMode = ref('auto')
const uploadFile = ref(null)
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

const importSchema = computed(() => [
  {
    key: 'standard_word',
    label: t('words.wordList.columns.definition'),
    required: true,
    aliases: ['standard_word', 'written', '释义', '釋義', '书面', '書面', '书面词条', '書面詞條', '词条', '詞條', 'meaning'],
    example: t('words.wordList.import.examples.definition')
  },
  {
    key: 'local_expression',
    label: t('words.wordList.columns.headword'),
    required: true,
    aliases: ['local_expression', 'vocabulary', '当地讲法', '當地講法', '方言词', '方言詞', '方言讲法', '方言講法', 'local'],
    example: t('words.wordList.import.examples.headword')
  },
  {
    key: 'ipa',
    label: t('words.wordList.columns.pronunciation'),
    required: true,
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
      return
    }
    applyYindianLocationDetail(detail)
    uploadLocationEditorStatus.value = t('words.wordList.upload.yindianFilled')
  } catch (error) {
    uploadLocationEditorStatus.value = error.message || t('words.wordList.upload.yindianFailed')
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

function handleUploadFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploadStatusText.value = ''
  backendPreview.value = null
  clearUploadFile()

  if (!isVocabularyUploadFile(file)) {
    uploadStatusText.value = t('words.wordList.upload.unsupportedFile')
    event.target.value = ''
    return
  }

  if (isVocabularyPreviewFile(file)) {
    importFlow.loadPreview(file)
  } else {
    uploadFile.value = file
  }

  event.target.value = ''
}

watch([uploadParserMode, selectedUploadFile, uploadLocation], () => {
  backendPreview.value = null
  isOverwriteConfirmed.value = false
}, { deep: true })

watch(contributeSubMode, (mode) => {
  if (mode === 'manage') {
    router.replace(buildLocalePath(resolveRouteLocale(route), '/explore/vocabulary/manage'))
  }
})

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
    return
  }

  if (!canUploadVocabulary.value) {
    uploadStatusText.value = t('words.wordList.upload.permissionRequired')
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
    })
    backendPreview.value = previewResponse
    uploadStatusText.value = previewResponse.success
      ? t('words.wordList.upload.previewReady')
      : (previewResponse.errors?.join('；') || t('words.wordList.upload.previewFailed'))
  } catch (error) {
    uploadStatusText.value = error.message || t('words.wordList.upload.previewFailed')
  } finally {
    isPreviewingImport.value = false
  }
}

async function handleConfirmUpload() {
  await handlePreviewImport()
}

async function handleImportAfterPreview() {
  const file = uploadFile.value || importFlow.pendingFile.value

  if (!file || isUploading.value || backendPreview.value?.success !== true) {
    return
  }

  const location = buildUploadLocation()

  if (!location.location_name || !location.coordinates) {
    uploadStatusText.value = t('words.wordList.upload.missingLocation')
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
    })
    uploadStatusText.value = t('words.wordList.upload.success', { count: response.imported_count || 0 })
    clearUploadFile()
  } catch (error) {
    uploadStatusText.value = error.message || t('words.wordList.upload.failed')
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
