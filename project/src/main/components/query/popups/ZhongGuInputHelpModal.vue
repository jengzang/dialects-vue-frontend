<template>
  <AppModal
    :model-value="visible"
    size="lg"
    :title="$t('query.components.zhongguDirectInput.help.title')"
    @update:modelValue="$emit('close')"
  >
    <div class="help-content">
      <section class="help-section">
        <h4 class="help-subtitle">{{ $t('query.components.zhongguDirectInput.help.rules.rule1') }}</h4>
        <ul class="help-rules">
          <li>{{ $t('query.components.zhongguDirectInput.help.rules.rule2') }}</li>
          <li>{{ $t('query.components.zhongguDirectInput.help.rules.rule3') }}</li>
          <li>{{ $t('query.components.zhongguDirectInput.help.rules.rule4') }}</li>
          <li>{{ $t('query.components.zhongguDirectInput.help.rules.rule5') }}</li>
          <li>{{ $t('query.components.zhongguDirectInput.help.rules.rule6') }}</li>
        </ul>
      </section>

      <section class="help-section">
        <h4 class="help-subtitle">{{ $t('query.components.zhongguDirectInput.help.examples.title') }}</h4>
        <p class="help-examples-note">{{ $t('query.components.zhongguDirectInput.help.examplesNote') }}</p>
        <ul class="help-examples">
          <li v-html="$t('query.components.zhongguDirectInput.help.examples.example1')"></li>
          <li v-html="$t('query.components.zhongguDirectInput.help.examples.example2')"></li>
          <li v-html="$t('query.components.zhongguDirectInput.help.examples.example3')"></li>
          <li v-html="$t('query.components.zhongguDirectInput.help.examples.example4')"></li>
          <li v-html="$t('query.components.zhongguDirectInput.help.examples.example5')"></li>
          <li v-html="$t('query.components.zhongguDirectInput.help.examples.example6')"></li>
          <li v-html="$t('query.components.zhongguDirectInput.help.examples.example7')"></li>
          <!-- <li v-html="$t('query.components.zhongguDirectInput.help.examples.example8')"></li> -->
        </ul>
      </section>

      <section class="help-section">
        <h4 class="help-subtitle">{{ tableLabel }}</h4>
        <div class="help-table-wrapper">
          <table class="help-table">
            <thead>
              <tr>
                <th>{{ $t('query.components.zhongguDirectInput.help.table.tableHeaders.category') }}</th>
                <th>{{ $t('query.components.zhongguDirectInput.help.table.tableHeaders.values') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(values, category) in tableColumnValues" :key="category">
                <td>{{ category }}</td>
                <td>{{ Array.isArray(values) ? values.join('、') : values }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import { TABLE_COLUMN_SCHEMAS } from '@/main/config/chars_positions/characters.js'

const { t } = useI18n()

const props = defineProps({
  visible: { type: Boolean, default: false },
  tableName: { type: String, default: 'characters' }
})

defineEmits(['close'])

const tableColumnValues = computed(() => {
  const schema = TABLE_COLUMN_SCHEMAS[props.tableName]
  return schema?.columns?.column_values || {}
})

const tableLabel = computed(() => {
  const schema = TABLE_COLUMN_SCHEMAS[props.tableName]
  const label = schema?.meta?.label || props.tableName
  return `${label} — ${t('query.components.zhongguDirectInput.help.table.title')}`
})
</script>


$text-heading: var(--text-dark);
$text-body: var(--text-dark);
$text-note: var(--text-muted);

$list-font-size: 14px;
$list-line-height: 1.6;
$list-indent: 20px;
$list-item-gap: 6px;

$section-gap: 20px;
$table-radius: 8px;

@mixin help-list($list-style) {
  margin: 0;
  padding-left: $list-indent;
  list-style: $list-style;

  li {
    margin-bottom: $list-item-gap;
    color: $text-body;
    font-size: $list-font-size;
    line-height: $list-line-height;
  }
}

.help-content {
  max-height: 65vh;
  padding-right: 8px;
  overflow-y: auto;

  .help-section {
    margin-bottom: $section-gap;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.help-subtitle {
  margin: 0 0 10px;
  color: $text-heading;
  font-size: 16px;
  font-weight: 600;
}

.help-examples-note {
  margin: 0 0 8px;
  color: $text-note;
  font-size: 12px;
  font-style: italic;
}

.help-rules {
  @include help-list(decimal);
}

.help-examples {
  @include help-list(disc);
}

.help-table-wrapper {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-light, var(--border-light-gray));
  border-radius: $table-radius;
}

.help-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  th {
    padding: 10px 12px;
    background: var(--glass-70, var(--bg-light));
    border-bottom: 2px solid var(--border-medium, #ddd);
    color: $text-heading;
    text-align: left;
    font-weight: 600;
  }

  td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-light, #eee);
    color: $text-body;
    vertical-align: top;

    &:first-child {
      color: var(--color-blue-custom, var(--color-primary));
      white-space: nowrap;
      font-weight: 600;
    }
  }

  tbody {
    tr:last-child {
      td {
        border-bottom: none;
      }
    }
  }
}

