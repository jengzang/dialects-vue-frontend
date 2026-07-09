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
.tabular-import-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
    justify-content: space-between;
    gap: 12px;
  }

  &__header {
    align-items: flex-start;
  }

  &__eyebrow {
    margin: 0 0 6px;
    font-size: 12px;
    color: rgba(11, 37, 64, 0.55);
  }

  &__title {
    margin: 0;
    font-size: 18px;
    color: #0b2540;
  }

  &__empty {
    display: flex;
    align-items: center;
    gap: 16px;
    min-height: 140px;
    padding: 20px;
    border: 1px dashed rgba(0, 122, 255, 0.22);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.42);

    &-icon {
      font-size: 36px;
    }

    &-title {
      margin: 0;
      color: #0b2540;
    }

    &-text {
      margin: 0;
      color: rgba(11, 37, 64, 0.68);
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
      font-size: 12px;
      color: rgba(11, 37, 64, 0.58);
    }

    &-meta {
      flex: 1 1 100%;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 12px;
      color: rgba(11, 37, 64, 0.62);
    }
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 120px;
  }

  &__body {
    gap: 16px;
    align-items: stretch;
  }

  &__mapping,
  &__preview {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }

  &__mapping {
    &-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 360px;
      overflow: auto;
      padding-right: 4px;
    }

    &-row {
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.48);
    }

    &-meta {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    &-name {
      font-weight: 600;
      color: #0b2540;
    }

    &-desc,
    &-example {
      margin: 0;
      color: rgba(11, 37, 64, 0.68);
    }

    &-control {
      width: 260px;
      max-width: 100%;
    }
  }

  &__section-head {
    h4 {
      margin: 0;
      color: #0b2540;
    }

    p {
      margin: 0;
      color: rgba(11, 37, 64, 0.68);
    }
  }

  &__diagnostics {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__table-wrap {
    overflow: auto;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.36);
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    th,
    td {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(11, 37, 64, 0.08);
      text-align: left;
      vertical-align: top;
    }

    th {
      position: sticky;
      top: 0;
      background: rgba(231, 241, 255, 0.92);
      color: #0b2540;
    }

    &-empty {
      text-align: center;
      color: rgba(11, 37, 64, 0.58);
    }
  }
}

.mapping-required,
.mapping-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.mapping-required {
  color: #0b62c4;
  background: rgba(0, 122, 255, 0.12);
}

.mapping-badge {
  &.is-success {
    color: #1f8a36;
  }

  &.is-warning {
    color: #b26a00;
  }
}

.diagnostic {
  margin: 0;
  color: rgba(11, 37, 64, 0.68);

  &--success {
    color: #1f8a36;
  }

  &--warning {
    color: #b26a00;
  }
}

@media (max-width: 1100px) {
  .tabular-import-preview {
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
</style>