<template>
  <div class="vocabulary-import-page">
    <section class="content-area">
      <div class="upload-mode main-glass-panel">
        <div class="upload-head">
          <div>
            <h3>{{ t('words.wordList.upload.title') }}</h3>
            <p>{{ t('words.wordList.upload.desc') }}</p>
          </div>
          <label class="main-glass-button" data-variant="primary">
            {{ t('words.wordList.upload.chooseFile') }}
            <input class="upload-file-input" type="file" accept=".xlsx,.xls,.csv,.tsv,.docx,.doc" @change="handleUploadFile" />
          </label>
        </div>

        <div class="upload-location-grid">
          <label v-for="field in uploadLocationFields" :key="field.key" class="upload-field">
            <span>{{ field.label }}</span>
            <input
              v-model="uploadLocation[field.key]"
              type="text"
              :required="field.required"
              :placeholder="field.placeholder"
            />
          </label>
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
          :loading="importPreview.loading"
          :preview-table="importPreview.previewTable"
          :diagnostics="importPreview.diagnostics"
          :mapping="importPreview.mapping"
          @update:mapping="importFlow.updateManualMapping"
          @reset="clearUploadFile"
          @confirm="handleConfirmUpload"
        />
        <div class="upload-actions">
          <button
            class="main-glass-button"
            data-variant="primary"
            type="button"
            :disabled="!canConfirmUpload"
            @click="handleConfirmUpload"
          >
            {{ isUploading ? t('common.label.loading') : t('words.wordList.upload.submit') }}
          </button>
        </div>
        <p v-if="uploadStatusText" class="upload-status">{{ uploadStatusText }}</p>
      </div>
    </section>

  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { previewVocabularyImport, uploadVocabulary } from '@/api'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import { useTabularImportFlow } from '@/composables/import/useTabularImportFlow.js'

const { t } = useI18n()

const isUploading = ref(false)
const uploadStatusText = ref('')

const uploadParserMode = ref('auto')
const uploadFile = ref(null)
const uploadLocation = ref({
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
    key: 'definition',
    label: t('words.wordList.columns.definition'),
    required: true,
    aliases: ['释义', '釋義', 'definition', 'gloss'],
    example: t('words.wordList.import.examples.definition')
  },
  {
    key: 'headword',
    label: t('words.wordList.columns.headword'),
    required: true,
    aliases: ['词条', '詞條', '方言词', 'headword', 'word'],
    example: t('words.wordList.import.examples.headword')
  },
  {
    key: 'pronunciation',
    label: t('words.wordList.columns.pronunciation'),
    required: true,
    aliases: ['发音', '發音', '读音', 'pronunciation', 'ipa'],
    example: t('words.wordList.import.examples.pronunciation')
  },
  {
    key: 'detail',
    label: t('words.wordList.columns.detail'),
    required: false,
    aliases: ['详情', '詳情', '描述', 'detail', 'description'],
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

const canConfirmUpload = computed(() => {
  const file = selectedUploadFile.value
  if (!file || isUploading.value) {
    return false
  }
  return !isVocabularyPreviewFile(file) || importPreview.diagnostics.value.isComplete
})

function isVocabularyPreviewFile(file) {
  return Boolean(file?.name && /\.(xlsx|xls|csv|tsv)$/i.test(file.name))
}

function isVocabularyUploadFile(file) {
  return Boolean(file?.name && /\.(xlsx|xls|csv|tsv|docx|doc)$/i.test(file.name))
}

function clearUploadFile() {
  uploadFile.value = null
  importFlow.clearPreview()
}

function handleUploadFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploadStatusText.value = ''
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

async function handleConfirmUpload() {
  const file = uploadFile.value || importFlow.pendingFile.value

  if (!file || isUploading.value) {
    return
  }

  const location = Object.fromEntries(
    Object.entries(uploadLocation.value).map(([key, value]) => [key, String(value || '').trim()])
  )

  if (!location.location_name || !location.coordinates) {
    uploadStatusText.value = t('words.wordList.upload.missingLocation')
    return
  }

  isUploading.value = true
  uploadStatusText.value = ''

  try {
    const previewResponse = await previewVocabularyImport({
      file,
      location,
      parser_mode: uploadParserMode.value,
    })
    if (!previewResponse.success) {
      uploadStatusText.value = previewResponse.errors?.join('；') || t('words.wordList.upload.previewFailed')
      return
    }

    const response = await uploadVocabulary({
      file,
      location,
      parser_mode: uploadParserMode.value,
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
