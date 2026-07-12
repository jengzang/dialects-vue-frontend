<template>
  <AppModal
    :model-value="modelValue"
    :title="t('map.drawTab.voronoi.customImport.modalTitle')"
    size="xl"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="voronoi-custom-import-modal">
      <div class="voronoi-custom-import-modal__intro main-glass-panel-inner">
        <div>
          <div class="voronoi-custom-import-modal__intro-title">
            {{ t('map.drawTab.voronoi.customImport.introTitle') }}
          </div>
          <p class="voronoi-custom-import-modal__intro-text">
            {{ t('map.drawTab.voronoi.customImport.introText') }}
          </p>
        </div>
        <div class="voronoi-custom-import-modal__meta">
          <span class="voronoi-custom-import-modal__meta-item">
            {{ t('map.drawTab.voronoi.customImport.summary.rows', { count: previewSummary?.totalRowCount || 0 }) }}
          </span>
          <span class="voronoi-custom-import-modal__meta-item">
            {{ t('map.drawTab.voronoi.customImport.summary.validRows', { count: importDiagnostics.mappedRowCount }) }}
          </span>
        </div>
      </div>

      <div class="voronoi-custom-import-modal__controls main-glass-panel-inner">
        <div class="voronoi-custom-import-modal__control-row">
          <div class="voronoi-custom-import-modal__upload-block">
            <span class="draw-field-label">{{ t('map.drawTab.voronoi.customImport.fileLabel') }}</span>
            <div class="voronoi-custom-import-modal__upload-actions">
              <button
                class="main-glass-button"
                data-variant="primary"
                type="button"
                @click="openFilePicker"
              >
                {{ t('map.drawTab.voronoi.customImport.actions.selectFile') }}
              </button>
              <button
                v-if="hasPreview"
                class="main-glass-button"
                data-variant="secondary"
                type="button"
                @click="clearPreview"
              >
                {{ t('common.importPreview.actions.reselect') }}
              </button>
            </div>
            <input
              ref="fileInputRef"
              class="voronoi-custom-import-modal__input"
              type="file"
              accept=".xlsx,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              @change="handleFileChange"
            >
          </div>

          <div class="voronoi-custom-import-modal__mode-block">
            <span class="draw-field-label">{{ t('map.drawTab.voronoi.customImport.partitionModeLabel') }}</span>
            <SimpleSelectDropdown
              :model-value="partitionMode"
              :options="sourceModeOptions"
              width="220px"
              @update:modelValue="handlePartitionModeChange"
            />
          </div>
        </div>

        <div v-if="previewError" class="voronoi-custom-import-modal__error">
          {{ previewError }}
        </div>

        <div v-if="hasPreview" class="voronoi-custom-import-modal__diagnostics">
          <div
            class="voronoi-custom-import-modal__diagnostic"
            :class="importDiagnostics.isReady ? 'is-success' : 'is-warning'"
          >
            {{ importDiagnostics.isReady
              ? t('map.drawTab.voronoi.customImport.messages.ready')
              : t('map.drawTab.voronoi.customImport.messages.incomplete') }}
          </div>
          <div v-if="importDiagnostics.invalidCoordinateRows" class="voronoi-custom-import-modal__diagnostic is-warning">
            {{ t('map.drawTab.voronoi.customImport.messages.invalidCoordinates', { count: importDiagnostics.invalidCoordinateRows }) }}
          </div>
          <div v-if="importDiagnostics.missingPartitionRows" class="voronoi-custom-import-modal__diagnostic is-warning">
            {{ t('map.drawTab.voronoi.customImport.messages.missingPartition', { count: importDiagnostics.missingPartitionRows }) }}
          </div>
          <div v-if="importDiagnostics.duplicateNames.length" class="voronoi-custom-import-modal__diagnostic is-info">
            {{ t('map.drawTab.voronoi.customImport.messages.duplicateNames', { count: importDiagnostics.duplicateNames.length }) }}
          </div>
        </div>
      </div>

      <TabularImportPreview
        embedded
        :title="t('map.drawTab.voronoi.customImport.previewTitle')"
        :description="t('map.drawTab.voronoi.customImport.previewDescription')"
        :file="tabularState.file.value"
        :schema="schema"
        :loading="tabularState.loading.value"
        :preview-table="tabularState.previewTable.value"
        :diagnostics="tabularState.diagnostics.value"
        :mapping="tabularState.mapping.value"
        :selected-sheet-id="tabularState.selectedSheetId.value"
        :header-row-index="tabularState.headerRowIndex.value"
        :sheets="tabularState.parsedFile.value?.sheets || []"
        @update:selected-sheet-id="tabularState.selectedSheetId.value = $event"
        @update:header-row-index="tabularState.headerRowIndex.value = $event"
        @update:mapping="handleMappingChange"
        @reset="clearPreview"
      />
    </div>

    <template #footer>
      <div class="voronoi-custom-import-modal__footer">
        <button
          class="main-glass-button"
          type="button"
          @click="$emit('update:modelValue', false)"
        >
          {{ t('common.button.cancel') }}
        </button>
        <button
          class="main-glass-button"
          data-variant="primary"
          type="button"
          :disabled="!importDiagnostics.isReady"
          @click="confirmImport"
        >
          {{ t('map.drawTab.voronoi.customImport.actions.confirm') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import { useVoronoiCustomImport } from '@/composables/import/useVoronoiCustomImport.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { t } = useI18n()

const fileInputRef = ref(null)
const previewError = ref('')

const {
  schema,
  partitionMode,
  sourceModeOptions,
  diagnostics: importDiagnostics,
  updateSummaryFromPreview,
  applyPreviewSummary,
  clearImportedData,
} = useVoronoiCustomImport()

const tabularState = useTabularImportPreview({
  schema,
  requireExplicitConfirmation: true,
})

const previewSummary = computed(() => updateSummaryFromPreview(tabularState.summary.value) || tabularState.summary.value)
const hasPreview = computed(() => !!tabularState.file.value)

watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    previewError.value = ''
  }
})

function openFilePicker() {
  fileInputRef.value?.click()
}

async function handleFileChange(event) {
  const nextFile = event?.target?.files?.[0]
  if (!nextFile) {
    return
  }

  previewError.value = ''

  try {
    await tabularState.loadFile(nextFile)
  } catch (error) {
    previewError.value = t('map.drawTab.voronoi.customImport.messages.parseFailed', {
      error: error?.message || String(error || ''),
    })
  } finally {
    if (event?.target) {
      event.target.value = ''
    }
  }
}

function handleMappingChange(payload) {
  tabularState.updateMapping(payload.fieldKey, payload.sourceKey)
}

function handlePartitionModeChange(value) {
  partitionMode.value = value
  updateSummaryFromPreview(tabularState.summary.value)
}

function clearPreview() {
  previewError.value = ''
  tabularState.resetState()
  clearImportedData()
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function confirmImport() {
  const rows = applyPreviewSummary(tabularState.summary.value)
  if (!rows.length) {
    previewError.value = t('map.drawTab.voronoi.customImport.messages.noValidRows')
    return
  }

  emit('confirm', {
    rows,
    partitionMode: partitionMode.value,
    summary: previewSummary.value,
  })
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.voronoi-custom-import-modal {
  @include flex-col;
  gap: 1rem;
}

.voronoi-custom-import-modal__intro,
.voronoi-custom-import-modal__controls {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.voronoi-custom-import-modal__intro-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: rgba(var(--text-deep-rgb), 0.92);
}

.voronoi-custom-import-modal__intro-text {
  margin: 0.35rem 0 0;
  color: rgba(var(--text-deep-rgb), 0.68);
  line-height: 1.6;
}

.voronoi-custom-import-modal__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.voronoi-custom-import-modal__meta-item {
  display: inline-flex;
  align-items: center;
  padding: 0.32rem 0.75rem;
  border-radius: var(--radius-pill);
  background: var(--glass-70);
  border: 1px solid var(--glass-80);
  color: rgba(var(--text-deep-rgb), 0.72);
  font-size: 0.8rem;
}

.voronoi-custom-import-modal__control-row {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(220px, 0.8fr);
  gap: 1rem;
  width: 100%;
}

.voronoi-custom-import-modal__upload-block,
.voronoi-custom-import-modal__mode-block {
  @include flex-col;
  gap: 0.55rem;
}

.voronoi-custom-import-modal__upload-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.voronoi-custom-import-modal__input {
  display: none;
}

.voronoi-custom-import-modal__diagnostics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.85rem;
}

.voronoi-custom-import-modal__diagnostic {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.7rem;
  border-radius: var(--radius-pill);
  font-size: 0.8rem;
  border: 1px solid transparent;
}

.voronoi-custom-import-modal__diagnostic.is-success {
  color: var(--color-success);
  background: rgba(var(--color-success-rgb), 0.12);
  border-color: rgba(var(--color-success-rgb), 0.22);
}

.voronoi-custom-import-modal__diagnostic.is-warning {
  color: var(--color-warning-dark);
  background: rgba(var(--color-warning-rgb), 0.14);
  border-color: rgba(var(--color-warning-rgb), 0.24);
}

.voronoi-custom-import-modal__diagnostic.is-info {
  color: var(--color-primary-hover);
  background: rgba(var(--color-primary-rgb), 0.12);
  border-color: rgba(var(--color-primary-rgb), 0.22);
}

.voronoi-custom-import-modal__error {
  margin-top: 0.85rem;
  color: var(--color-error-dark);
  font-size: 0.85rem;
}

.voronoi-custom-import-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 900px) {
  .voronoi-custom-import-modal__intro,
  .voronoi-custom-import-modal__controls {
    flex-direction: column;
  }

  .voronoi-custom-import-modal__control-row {
    grid-template-columns: 1fr;
  }
}
</style>
