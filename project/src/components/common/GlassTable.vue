<template>
  <div class="glass-table-shell" :class="{ 'glass-table--loading': loading }">
    <div class="glass-table-scroll">
      <table>
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :style="thStyle(col)"
              :class="[
                col.headerClass,
                alignClass(col.align),
                { 'glass-table-th--sortable': sortable && col.sortable !== false }
              ]"
              @click="onSort(col)"
            >
              <slot :name="`header-${col.key}`" :column="col">
                {{ col.label }}
              </slot>
              <span v-if="sortable && col.sortable !== false" class="glass-table-sort-arrow">
                <template v-if="sortKey === col.key">{{ sortOrder === 'asc' ? '&#9650;' : '&#9660;' }}</template>
                <template v-else>&#8691;</template>
              </span>
            </th>
          </tr>
        </thead>

        <tbody v-if="!loading && data.length > 0">
          <tr
            v-for="(row, index) in data"
            :key="row[rowKey] ?? index"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :style="tdStyle(col)"
              :title="cellTitle(row, col)"
              :class="[col.cellClass, alignClass(col.align)]"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="index">
                {{ formatCell(row[col.key], col) }}
              </slot>
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="loading">
          <tr>
            <td :colspan="columns.length" class="glass-table-state-cell">
              <div class="ui-loading--page" aria-hidden="true"></div>
              <span v-if="loadingText">{{ loadingText }}</span>
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr>
            <td :colspan="columns.length" class="glass-table-state-cell">
              <slot name="empty">
                <span v-if="emptyText" class="glass-table-empty-text">{{ emptyText }}</span>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'GlassTable' })

const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  loading: { type: Boolean, default: false },
  sortable: { type: Boolean, default: false },
  sortKey: { type: String, default: '' },
  sortOrder: { type: String, default: 'asc' },
  emptyText: { type: String, default: '' },
  loadingText: { type: String, default: '' },
})

const emit = defineEmits(['sort'])

function thStyle(col) {
  const style = {}
  if (col.width) style.width = col.width
  if (col.minWidth) style.minWidth = col.minWidth
  if (col.maxWidth) style.maxWidth = col.maxWidth
  return style
}

function tdStyle(col) {
  const style = {}
  if (col.width) style.width = col.width
  if (col.minWidth) style.minWidth = col.minWidth
  if (col.maxWidth) style.maxWidth = col.maxWidth
  return style
}

function formatCell(value, col) {
  if (col.formatter && typeof col.formatter === 'function') {
    return col.formatter(value)
  }
  return value ?? '-'
}

function cellTitle(row, col) {
  const value = row[col.key]
  if (value === null || value === undefined || value === '') return ''
  const display = formatCell(value, col)
  return String(display)
}

function alignClass(align) {
  return align ? `glass-table-align--${align}` : ''
}

function onSort(col) {
  if (!props.sortable || col.sortable === false) return
  const nextOrder = props.sortKey === col.key && props.sortOrder === 'asc' ? 'desc' : 'asc'
  emit('sort', { key: col.key, order: nextOrder })
}
</script>

<style scoped lang="scss">
.glass-table-shell {
  min-width: 0;
  background: var(--surface-panel);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-glass);
  backdrop-filter: blur(18px) saturate(145%);
  -webkit-backdrop-filter: blur(18px) saturate(145%);
}

.glass-table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

th {
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: left;
  white-space: nowrap;
  user-select: none;
  background: var(--glass-90);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-glass-subtle);
}

.glass-table-th--sortable {
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
  }
}

.glass-table-sort-arrow {
  margin-left: 4px;
  font-size: 10px;
  opacity: 0.4;

  .glass-table-th--sortable:hover & {
    opacity: 0.7;
  }
}

td {
  padding: 10px 12px;
  font-size: 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

tbody tr {
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--bg-hover-light);
  }

  &:last-child td {
    border-bottom: none;
  }
}

.glass-table-state-cell {
  text-align: center;
  border-bottom: none !important;
  padding: 40px 20px !important;
  color: var(--text-muted);

  .ui-loading--page {
    margin: 0 auto 10px;
  }
}

.glass-table-empty-text {
  color: var(--text-muted);
  font-size: 14px;
}

.glass-table--loading .glass-table-scroll {
  pointer-events: none;
}

// Align variants
.glass-table-align--center { text-align: center; }
.glass-table-align--right { text-align: right; }

// Mobile
@media (max-aspect-ratio: 1 / 1) {
  .glass-table-scroll {
    table {
      min-width: 700px;
    }
  }

  th, td {
    padding: 8px 10px;
    font-size: 13px;
  }
}
</style>
