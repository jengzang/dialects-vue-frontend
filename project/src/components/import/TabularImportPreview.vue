<template>
  <div class="tabular-import-preview main-glass-panel">
    <div class="tabular-import-preview__header">
      <div>
        <p class="tabular-import-preview__eyebrow">{{ title }}</p>
        <h3 class="tabular-import-preview__title">{{ description }}</h3>
      </div>
      <div class="tabular-import-preview__header-actions">
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
          <span>{{ t('common.importPreview.controls.columns') }}: {{ previewTable.sourceColumns.length }}</span>
          <span>{{ t('common.importPreview.controls.rows') }}: {{ previewTable.activeSheet?.rowCount || 0 }}</span>
        </div>
      </div>

      <div v-if="loading" class="tabular-import-preview__loading">
        <div class="ui-loading--inline" aria-hidden="true"></div>
        <span>{{ t('common.label.loading') }}</span>
      </div>

      <div v-else class="tabular-import-preview__body">
        <div class="tabular-import-preview__mapping main-glass-panel-inner">
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
                  <td :colspan="Math.max(previewTable.sourceColumns.length, 1)" class="tabular-import-preview__table-empty">
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  file: {
    type: Object,
    default: null
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
  }
})

defineEmits(['update:selectedSheetId', 'update:headerRowIndex', 'update:mapping', 'reset'])

const { t } = useI18n()

const sheetOptions = computed(() => props.sheets.map((sheet) => ({
  label: `${sheet.name} (${sheet.rowCount})`,
  value: sheet.id
})))

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
$text-primary: var(--text-deep);
$text-secondary: rgba(11, 37, 64, 0.68);
$text-muted: rgba(11, 37, 64, 0.58);
$text-light: rgba(11, 37, 64, 0.55);

$primary-blue: var(--color-primary);
$success-green: var(--color-success);
$warning-orange: var(--color-warning-dark);

$panel-gap: 16px;
$section-gap: 12px;

@mixin flex-column {
  display: flex;
  flex-direction: column;
}

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabular-import-preview {
  @include flex-column;

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
    background: rgba(255, 255, 255, 0.42);
    border: 1px dashed rgba(0, 122, 255, 0.22);
    border-radius: 18px;

    &-icon {
      font-size: 36px;
    }

    &-title {
      margin: 0;
      color: $text-primary;
    }

    &-text {
      margin: 0;
      color: $text-secondary;
    }
  }

  &__toolbar {
    flex-wrap: wrap;
    gap: 12px 18px;
    align-items: flex-end;

    &-item {
      flex-direction: column;
      gap: 6px;

      &--compact {
        min-width: 160px;
      }
    }

    &-label {
      color: $text-muted;
      font-size: 12px;
    }

    &-meta {
      flex: 1 1 100%;
      flex-wrap: wrap;
      gap: 12px;
      color: rgba(11, 37, 64, 0.62);
      font-size: 12px;
    }
  }

  &__loading {
    @include flex-center;

    gap: 8px;
    min-height: 120px;
  }

  &__body {
    gap: $panel-gap;
    align-items: stretch;
  }

  &__mapping,
  &__preview {
    @include flex-column;

    flex: 1 1 0;
    gap: $section-gap;
    min-width: 0;
    padding: 16px;
  }

  &__mapping {
    &-list {
      @include flex-column;

      gap: 10px;
      max-height: 360px;
      padding-right: 4px;
      overflow: auto;
    }

    &-row {
      gap: $section-gap;
      align-items: center;
      padding: 12px;
      background: rgba(255, 255, 255, 0.48);
      border-radius: 14px;
    }

    &-meta {
      @include flex-column;

      flex: 1 1 0;
      gap: 4px;
      min-width: 0;
    }

    &-name {
      color: $text-primary;
      font-weight: 600;
    }

    &-desc,
    &-example {
      margin: 0;
      color: $text-secondary;
    }

    &-control {
      width: 260px;
      max-width: 100%;
    }
  }

  &__section-head {
    h4 {
      margin: 0;
      color: $text-primary;
    }

    p {
      margin: 0;
      color: $text-secondary;
    }
  }

  &__diagnostics {
    @include flex-column;

    gap: 4px;
  }

  &__table-wrap {
    overflow: auto;
    background: rgba(255, 255, 255, 0.36);
    border-radius: 14px;
  }

  &__table {
    width: 100%;
    font-size: 13px;
    border-collapse: collapse;

    th,
    td {
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
      border-bottom: 1px solid rgba(11, 37, 64, 0.08);
    }

    th {
      position: sticky;
      top: 0;
      color: $text-primary;
      background: rgba(231, 241, 255, 0.92);
    }

    &-empty {
      color: $text-muted;
      text-align: center;
    }
  }

  @media (max-width: 1100px) {
    &__body {
      flex-direction: column;
    }

    &__mapping {
      &-control {
        width: 100%;
      }

      &-row {
        flex-direction: column;
        align-items: stretch;
      }
    }
  }
}

.mapping-required,
.mapping-badge {
  @include flex-center;

  padding: 2px 8px;
  font-size: 11px;
  border-radius: 999px;
}

.mapping-required {
  color: $primary-blue;
  background: rgba(0, 122, 255, 0.12);
}

.mapping-badge {
  &.is-success {
    color: $success-green;
  }

  &.is-warning {
    color: $warning-orange;
  }
}

.diagnostic {
  margin: 0;
  color: $text-secondary;

  &--success {
    color: $success-green;
  }

  &--warning {
    color: $warning-orange;
  }
}
</style>