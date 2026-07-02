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

<style scoped>
.help-content {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;
}

.help-section {
  margin-bottom: 20px;
}

.help-subtitle {
  margin: 0 0 10px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.help-examples-note {
  margin: 0 0 8px;
  color: #888;
  font-size: 12px;
  font-style: italic;
}

.help-rules {
  margin: 0;
  padding-left: 20px;
  list-style: decimal;
}

.help-rules li {
  margin-bottom: 6px;
  color: #444;
  font-size: 14px;
  line-height: 1.6;
}

.help-examples {
  margin: 0;
  padding-left: 20px;
  list-style: disc;
}

.help-examples li {
  margin-bottom: 6px;
  color: #444;
  font-size: 14px;
  line-height: 1.6;
}

.help-table-wrapper {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 8px;
}

.help-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.help-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.help-table th {
  padding: 10px 12px;
  background: var(--glass-medium-strong, #f0f0f0);
  color: #333;
  font-weight: 600;
  text-align: left;
  border-bottom: 2px solid var(--border-medium, #ddd);
}

.help-table td {
  padding: 8px 12px;
  color: #444;
  border-bottom: 1px solid var(--border-light, #eee);
  vertical-align: top;
}

.help-table td:first-child {
  font-weight: 600;
  white-space: nowrap;
  color: var(--color-blue-custom, #007aff);
}

.help-table tr:last-child td {
  border-bottom: none;
}
</style>
