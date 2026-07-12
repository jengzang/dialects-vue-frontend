<template>
  <AppModal
    v-if="!embedded"
    v-model="isModalOpen"
    size="lg"
    :title="title"
    :close-label="t('common.button.close')"
    :max-height="modalMaxHeight"
  >
    <template #header>
      <div class="tabular-import-preview__modal-header">
        <div>
          <component :is="titleTag" class="tabular-import-preview__title">{{ title }}</component>
          <p v-if="description" class="tabular-import-preview__description">{{ description }}</p>
        </div>
        <div class="tabular-import-preview__header-actions">
          <button
            v-if="canExport"
            class="main-glass-button"
            data-variant="secondary"
            data-size="small"
            type="button"
            :disabled="isExporting"
            @click="handleExport"
          >
            {{ isExporting ? t('common.importPreview.actions.exporting') : resolvedExportLabel }}
          </button>
          <button
            v-if="file"
            class="main-glass-button"
            data-variant="secondary"
            data-size="small"
            type="button"
            @click="$emit('reset')"
          >
            {{ t('common.importPreview.actions.reselect') }}
          </button>
          <button
            type="button"
            class="close-btn close-btn-lg close-btn-inline"
            :aria-label="t('common.button.close')"
            @click="isModalOpen = false"
          >
            ×
          </button>
        </div>
      </div>
    </template>

    <div class="tabular-import-preview">
      <div v-if="!file" class="tabular-import-preview__empty">
        <div class="tabular-import-preview__empty-icon">📄</div>
        <div class="tabular-import-preview__empty-copy">
          <p class="tabular-import-preview__empty-title">{{ t('common.importPreview.empty.title') }}</p>
          <p class="tabular-import-preview__empty-text">{{ t('common.importPreview.empty.description') }}</p>
        </div>
      </div>

      <template v-else>
        <div class="tabular-import-preview__toolbar">
          <div class="tabular-import-preview__toolbar-item">
            <span class="tabular-import-preview__toolbar-label">{{ t('common.importPreview.controls.sheet') }}</span>
            <SimpleSelectDropdown
              :model-value="selectedSheetId"
              :options="sheetOptions"
              searchable
              match-trigger-width
              width="220px"
              @update:modelValue="$emit('update:selectedSheetId', $event)"
            />
          </div>
          <div class="tabular-import-preview__toolbar-item tabular-import-preview__toolbar-item--compact">
            <span class="tabular-import-preview__toolbar-label">{{ t('common.importPreview.controls.headerRow') }}</span>
            <SimpleSelectDropdown
              :model-value="headerRowIndex"
              :options="headerRowOptions"
              width="160px"
              @update:modelValue="$emit('update:headerRowIndex', $event)"
            />
          </div>
          <div class="tabular-import-preview__toolbar-meta">
            <span>{{ t('common.importPreview.controls.fileName') }}: {{ file.name }}</span>
            <span>{{ t('common.importPreview.controls.columns') }}: {{ previewTable?.sourceColumns?.length ?? 0 }}</span>
            <span>{{ t('common.importPreview.controls.rows') }}: {{ previewTable.activeSheet?.rowCount || 0 }}</span>
          </div>
        </div>

        <div v-if="loading" class="tabular-import-preview__loading">
          <div class="ui-loading--inline" aria-hidden="true"></div>
          <span>{{ t('common.label.loading') }}</span>
        </div>

        <div v-else class="tabular-import-preview__body">
          <div v-if="mappingEnabled" class="tabular-import-preview__mapping main-glass-panel-inner">
            <div class="tabular-import-preview__section-head">
              <div>
                <h4>{{ t('common.importPreview.mapping.title') }}</h4>
                <p>{{ t('common.importPreview.mapping.description') }}</p>
              </div>
              <div class="tabular-import-preview__mapping-summary">
                <span :class="['mapping-badge', diagnostics.isComplete ? 'is-success' : 'is-warning']">
                  {{ diagnostics.isComplete ? t('common.importPreview.mapping.ready') : t('common.importPreview.mapping.incomplete') }}
                </span>
              </div>
            </div>

            <div class="tabular-import-preview__mapping-list ui-scrollbar">
              <div
                v-for="field in schema"
                :key="field.key"
                class="tabular-import-preview__mapping-row"
              >
                <div class="tabular-import-preview__mapping-meta">
                  <div class="tabular-import-preview__mapping-name-row">
                    <span class="tabular-import-preview__mapping-name">{{ field.label }}</span>
                    <span v-if="field.required" class="mapping-required">{{ t('common.importPreview.mapping.required') }}</span>
                  </div>
                  <p v-if="field.description" class="tabular-import-preview__mapping-desc">{{ field.description }}</p>
                  <p v-if="field.example" class="tabular-import-preview__mapping-example">{{ t('common.importPreview.mapping.example', { value: field.example }) }}</p>
                </div>
                <div class="tabular-import-preview__mapping-control">
                  <SimpleSelectDropdown
                    :model-value="mapping[field.key]"
                    :options="columnOptions"
                    searchable
                    match-trigger-width
                    @update:modelValue="$emit('update:mapping', { fieldKey: field.key, sourceKey: $event })"
                  />
                </div>
              </div>
            </div>

            <div class="tabular-import-preview__diagnostics">
              <p v-if="diagnostics.missingRequiredFields.length" class="diagnostic diagnostic--warning">
                {{ t('common.importPreview.diagnostics.missingRequired', { count: diagnostics.missingRequiredFields.length }) }}
              </p>
              <p v-if="diagnostics.duplicateSourceKeys.length" class="diagnostic diagnostic--warning">
                {{ t('common.importPreview.diagnostics.duplicateSource', { count: diagnostics.duplicateSourceKeys.length }) }}
              </p>
              <p v-if="!diagnostics.missingRequiredFields.length && !diagnostics.duplicateSourceKeys.length" class="diagnostic diagnostic--success">
                {{ t('common.importPreview.diagnostics.ok') }}
              </p>
            </div>
          </div>

          <div class="tabular-import-preview__preview main-glass-panel-inner">
            <div class="tabular-import-preview__section-head">
              <div>
                <h4>{{ t('common.importPreview.preview.title') }}</h4>
                <p>{{ t('common.importPreview.preview.description') }}</p>
              </div>
            </div>

            <div class="tabular-import-preview__table-wrap ui-scrollbar">
              <table class="tabular-import-preview__table">
                <thead>
                  <tr>
                    <th v-for="column in previewTable.sourceColumns" :key="column.key">{{ column.label }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIndex) in previewTable.previewRows" :key="rowIndex">
                    <td v-for="(cell, cellIndex) in row" :key="`${rowIndex}-${cellIndex}`">{{ cell || '—' }}</td>
                  </tr>
                  <tr v-if="!previewTable.previewRows.length">
                    <td :colspan="Math.max(previewTable?.sourceColumns?.length ?? 0, 1)" class="tabular-import-preview__table-empty">
                      {{ t('common.importPreview.preview.empty') }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <button class="main-glass-button" data-variant="secondary" type="button" @click="handleCancel">
        {{ t('common.button.cancel') }}
      </button>
      <button
        class="main-glass-button"
        data-variant="primary"
        type="button"
        :disabled="mappingEnabled && !diagnostics.isComplete"
        @click="emit('confirm')"
      >
        {{ t('common.importPreview.actions.confirmAndUse') }}
      </button>
    </template>
  </AppModal>

  <div v-else class="tabular-import-preview main-glass-panel">
    <div class="tabular-import-preview__embedded-header">
      <div>
        <p class="tabular-import-preview__eyebrow">{{ title }}</p>
        <h3 class="tabular-import-preview__title">{{ description }}</h3>
      </div>
      <div class="tabular-import-preview__header-actions">
        <button
          v-if="canExport"
          class="main-glass-button"
          data-variant="secondary"
          data-size="small"
          type="button"
          :disabled="isExporting"
          @click="handleExport"
        >
          {{ isExporting ? t('common.importPreview.actions.exporting') : resolvedExportLabel }}
        </button>
        <button
          v-if="file"
          class="main-glass-button"
          data-variant="secondary"
          data-size="small"
          type="button"
          @click="$emit('reset')"
        >
          {{ t('common.importPreview.actions.reselect') }}
        </button>
      </div>
    </div>

    <div v-if="!file" class="tabular-import-preview__empty">
      <div class="tabular-import-preview__empty-icon">📄</div>
      <div class="tabular-import-preview__empty-copy">
        <p class="tabular-import-preview__empty-title">{{ t('common.importPreview.empty.title') }}</p>
        <p class="tabular-import-preview__empty-text">{{ t('common.importPreview.empty.description') }}</p>
      </div>
    </div>

    <template v-else>
      <div class="tabular-import-preview__toolbar">
        <div class="tabular-import-preview__toolbar-item">
          <span class="tabular-import-preview__toolbar-label">{{ t('common.importPreview.controls.sheet') }}</span>
          <SimpleSelectDropdown
            :model-value="selectedSheetId"
            :options="sheetOptions"
            searchable
            match-trigger-width
            width="220px"
            @update:modelValue="$emit('update:selectedSheetId', $event)"
          />
        </div>
        <div class="tabular-import-preview__toolbar-item tabular-import-preview__toolbar-item--compact">
          <span class="tabular-import-preview__toolbar-label">{{ t('common.importPreview.controls.headerRow') }}</span>
          <SimpleSelectDropdown
            :model-value="headerRowIndex"
            :options="headerRowOptions"
            width="160px"
            @update:modelValue="$emit('update:headerRowIndex', $event)"
          />
        </div>
        <div class="tabular-import-preview__toolbar-meta">
          <span>{{ t('common.importPreview.controls.fileName') }}: {{ file.name }}</span>
          <span>{{ t('common.importPreview.controls.columns') }}: {{ previewTable?.sourceColumns?.length ?? 0 }}</span>
          <span>{{ t('common.importPreview.controls.rows') }}: {{ previewTable.activeSheet?.rowCount || 0 }}</span>
        </div>
      </div>

      <div v-if="loading" class="tabular-import-preview__loading">
        <div class="ui-loading--inline" aria-hidden="true"></div>
        <span>{{ t('common.label.loading') }}</span>
      </div>

      <div v-else class="tabular-import-preview__body">
        <div v-if="mappingEnabled" class="tabular-import-preview__mapping main-glass-panel-inner">
          <div class="tabular-import-preview__section-head">
            <div>
              <h4>{{ t('common.importPreview.mapping.title') }}</h4>
              <p>{{ t('common.importPreview.mapping.description') }}</p>
            </div>
            <div class="tabular-import-preview__mapping-summary">
              <span :class="['mapping-badge', diagnostics.isComplete ? 'is-success' : 'is-warning']">
                {{ diagnostics.isComplete ? t('common.importPreview.mapping.ready') : t('common.importPreview.mapping.incomplete') }}
              </span>
            </div>
          </div>

          <div class="tabular-import-preview__mapping-list ui-scrollbar">
            <div
              v-for="field in schema"
              :key="field.key"
              class="tabular-import-preview__mapping-row"
            >
              <div class="tabular-import-preview__mapping-meta">
                <div class="tabular-import-preview__mapping-name-row">
                  <span class="tabular-import-preview__mapping-name">{{ field.label }}</span>
                  <span v-if="field.required" class="mapping-required">{{ t('common.importPreview.mapping.required') }}</span>
                </div>
                <p v-if="field.description" class="tabular-import-preview__mapping-desc">{{ field.description }}</p>
                <p v-if="field.example" class="tabular-import-preview__mapping-example">{{ t('common.importPreview.mapping.example', { value: field.example }) }}</p>
              </div>
              <div class="tabular-import-preview__mapping-control">
                <SimpleSelectDropdown
                  :model-value="mapping[field.key]"
                  :options="columnOptions"
                  searchable
                  match-trigger-width
                  @update:modelValue="$emit('update:mapping', { fieldKey: field.key, sourceKey: $event })"
                />
              </div>
            </div>
          </div>

          <div class="tabular-import-preview__diagnostics">
            <p v-if="diagnostics.missingRequiredFields.length" class="diagnostic diagnostic--warning">
              {{ t('common.importPreview.diagnostics.missingRequired', { count: diagnostics.missingRequiredFields.length }) }}
            </p>
            <p v-if="diagnostics.duplicateSourceKeys.length" class="diagnostic diagnostic--warning">
              {{ t('common.importPreview.diagnostics.duplicateSource', { count: diagnostics.duplicateSourceKeys.length }) }}
            </p>
            <p v-if="!diagnostics.missingRequiredFields.length && !diagnostics.duplicateSourceKeys.length" class="diagnostic diagnostic--success">
              {{ t('common.importPreview.diagnostics.ok') }}
            </p>
          </div>
        </div>

        <div class="tabular-import-preview__preview main-glass-panel-inner">
          <div class="tabular-import-preview__section-head">
            <div>
              <h4>{{ t('common.importPreview.preview.title') }}</h4>
              <p>{{ t('common.importPreview.preview.description') }}</p>
            </div>
          </div>

          <div class="tabular-import-preview__table-wrap ui-scrollbar">
            <table class="tabular-import-preview__table">
              <thead>
                <tr>
                  <th v-for="column in previewTable.sourceColumns" :key="column.key">{{ column.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in previewTable.previewRows" :key="rowIndex">
                  <td v-for="(cell, cellIndex) in row" :key="`${rowIndex}-${cellIndex}`">{{ cell || '—' }}</td>
                </tr>
                <tr v-if="!previewTable.previewRows.length">
                  <td :colspan="Math.max(previewTable?.sourceColumns?.length ?? 0, 1)" class="tabular-import-preview__table-empty">
                    {{ t('common.importPreview.preview.empty') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import { downloadTabularSource, isTabularSourceExportable } from '@/utils/import/downloadTabularSource.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  source: {
    type: Object,
    default: null
  },
  file: {
    type: Object,
    default: null
  },
  showExport: {
    type: Boolean,
    default: true
  },
  schema: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  previewTable: {
    type: Object,
    default: () => ({
      activeSheet: null,
      sourceColumns: [],
      previewRows: []
    })
  },
  diagnostics: {
    type: Object,
    default: () => ({
      missingRequiredFields: [],
      duplicateSourceKeys: [],
      isComplete: false
    })
  },
  mapping: {
    type: Object,
    default: () => ({})
  },
  selectedSheetId: {
    type: String,
    default: ''
  },
  headerRowIndex: {
    type: Number,
    default: 0
  },
  sheets: {
    type: Array,
    default: () => []
  },
  titleTag: {
    type: String,
    default: 'h3'
  },
  modalMaxHeight: {
    type: String,
    default: '88dvh'
  },
  embedded: {
    type: Boolean,
    default: false
  },
  mappingEnabled: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'update:selectedSheetId', 'update:headerRowIndex', 'update:mapping', 'reset', 'confirm', 'export-start', 'export-success', 'export-error'])

const { t } = useI18n()
const isExporting = ref(false)

const isModalOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const sheetOptions = computed(() => props.sheets.map((sheet) => ({
  label: `${sheet.name} (${sheet.rowCount})`,
  value: sheet.id
})))

const effectiveSource = computed(() => {
  if (props.source) {
    return props.source
  }

  if (props.file) {
    return {
      kind: 'upload',
      file: props.file,
      fileName: props.file.name,
      displayName: props.file.name,
      downloadable: true
    }
  }

  return null
})

const canExport = computed(() => props.showExport && isTabularSourceExportable(effectiveSource.value))

const resolvedExportLabel = computed(() => effectiveSource.value?.exportLabel || t('common.importPreview.actions.exportSource'))

async function handleExport() {
  if (!canExport.value || isExporting.value) {
    return
  }

  isExporting.value = true
  emit('export-start', effectiveSource.value)

  try {
    const result = await downloadTabularSource(effectiveSource.value)
    emit('export-success', result)
  } catch (error) {
    emit('export-error', error)
  } finally {
    isExporting.value = false
  }
}

function handleCancel() {
  isModalOpen.value = false
  emit('reset')
}

const headerRowOptions = computed(() => {
  const rowCount = props.previewTable?.activeSheet?.rowCount || 0
  const maxCount = Math.min(Math.max(rowCount, 1), 6)
  return Array.from({ length: maxCount }, (_, index) => ({
    label: t('common.importPreview.controls.headerRowOption', { row: index + 1 }),
    value: index
  }))
})

const columnOptions = computed(() => ([
  {
    label: t('common.importPreview.mapping.unselected'),
    value: null
  },
  ...props.previewTable.sourceColumns.map((column) => ({
    label: column.sampleValues?.length
      ? `${column.label} · ${column.sampleValues.join(' / ')}`
      : column.label,
    value: column.key
  }))
]))
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$text-primary: var(--text-deep);
$text-secondary: rgba(var(--text-deep-rgb), 0.68);
$text-muted: rgba(var(--text-deep-rgb), 0.58);
$text-light: rgba(var(--text-deep-rgb), 0.55);

$success-green: var(--color-success);
$warning-orange: var(--color-warning-dark);

$panel-gap: 16px;
$section-gap: 12px;

.tabular-import-preview {
  @include flex-col;

  gap: $panel-gap;
  padding: 18px;

  &__header,
  &__toolbar,
  &__body,
  &__section-head,
  &__mapping-row,
  &__mapping-name-row,
  &__toolbar-item,
  &__toolbar-meta {
    display: flex;
  }

  &__header,
  &__section-head {
    gap: $section-gap;
    justify-content: space-between;
  }

  &__header {
    align-items: flex-start;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: flex-end;
  }

  &__eyebrow {
    margin: 0 0 6px;
    color: $text-light;
    font-size: 12px;
  }

  &__title {
    margin: 0;
    color: $text-primary;
    font-size: 18px;
  }

  &__empty {
    display: flex;
    gap: 16px;
    align-items: center;
    min-height: 140px;
    padding: 20px;
    background: var(--glass-40);
    border: 1px dashed rgba(var(--color-primary-rgb), 0.22);
    border-radius: var(--radius-xl);

    &-icon {
      font-size: 36px;
    }

    &-title {
      margin: 0 0 4px;
      color: $text-primary;
      font-size: 16px;
      font-weight: 600;
    }

    &-text {
      margin: 0;
      color: $text-secondary;
      font-size: 14px;
      line-height: 1.5;
    }
  }

  &__toolbar {
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
    justify-content: space-between;
  }

  &__toolbar-item {
    flex-direction: column;
    gap: 8px;

    &--compact {
      min-width: 160px;
    }
  }

  &__toolbar-label {
    color: $text-secondary;
    font-size: 13px;
  }

  &__toolbar-meta {
    flex-wrap: wrap;
    gap: 12px;
    justify-content: flex-end;
    color: $text-muted;
    font-size: 12px;
  }

  &__loading {
    @include flex-center;

    gap: 10px;
    min-height: 140px;
    color: $text-secondary;
  }

  &__body {
    gap: $panel-gap;
    align-items: stretch;
  }

  &__mapping,
  &__preview {
    @include flex-col;

    gap: 14px;
    padding: 16px;
  }

  &__mapping,
  &__preview,
  &__table-wrap {
    min-width: 0;
  }

  &__preview {
    flex: 1 1 0;
  }

  &__section-head {
    align-items: flex-start;

    h4 {
      margin: 0 0 4px;
      color: $text-primary;
      font-size: 16px;
    }

    p {
      margin: 0;
      color: $text-secondary;
      font-size: 13px;
      line-height: 1.5;
    }
  }

  &__mapping-summary {
    display: flex;
    align-items: center;
  }

  &__mapping-list {
    display: grid;
    gap: 12px;
    max-height: 280px;
    padding-right: 4px;
    overflow: auto;
  }

  &__mapping-row {
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
    padding: 12px;
    background: var(--glass-35);
    border: 1px solid var(--glass-30);
    border-radius: var(--radius-lg);
  }

  &__mapping-meta {
    min-width: 0;
    flex: 1;
  }

  &__mapping-name-row {
    gap: 8px;
    align-items: center;
    margin-bottom: 6px;
  }

  &__mapping-name {
    color: $text-primary;
    font-size: 14px;
    font-weight: 600;
  }

  &__mapping-desc,
  &__mapping-example {
    margin: 0;
    color: $text-secondary;
    font-size: 12px;
    line-height: 1.5;
  }

  &__mapping-example {
    margin-top: 4px;
    color: $text-muted;
  }

  &__mapping-control {
    min-width: 220px;
  }

  &__diagnostics {
    @include flex-col;
    gap: 8px;
  }

  &__table-wrap {
    overflow: auto;
    border: 1px solid var(--glass-30);
    border-radius: var(--radius-lg);
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    thead {
      background: var(--glass-45);
    }

    th,
    td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--glass-20);
      text-align: left;
      vertical-align: top;
    }

    th {
      color: $text-primary;
      font-weight: 600;
      white-space: nowrap;
    }

    td {
      color: $text-secondary;
      line-height: 1.5;
    }
  }

  &__table-empty {
    text-align: center !important;
    color: $text-muted !important;
  }
}

.mapping-required,
.diagnostic {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: var(--radius-pill);
  font-size: 12px;
}

.mapping-badge {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid transparent;

  &.is-success {
    color: $success-green;
    background: rgba(var(--color-success-rgb), 0.12);
    border-color: rgba(var(--color-success-rgb), 0.22);
  }

  &.is-warning {
    color: $warning-orange;
    background: rgba(var(--color-warning-rgb), 0.12);
    border-color: rgba(var(--color-warning-rgb), 0.22);
  }
}

.mapping-required {
  padding: 2px 8px;
  color: $warning-orange;
  background: rgba(var(--color-warning-rgb), 0.12);
}

.diagnostic {
  width: fit-content;
  padding: 6px 12px;
  line-height: 1.4;

  &--warning {
    color: $warning-orange;
    background: rgba(var(--color-warning-rgb), 0.12);
  }

  &--success {
    color: $success-green;
    background: rgba(var(--color-success-rgb), 0.12);
  }
}

@media (orientation: portrait) {
  .tabular-import-preview {
    &__body,
    &__mapping-row,
    &__section-head,
    &__header,
    &__toolbar {
      flex-direction: column;
    }

    &__mapping-control {
      width: 100%;
      min-width: 0;
    }

    &__toolbar-meta,
    &__header-actions {
      justify-content: flex-start;
    }
  }
}
</style>
