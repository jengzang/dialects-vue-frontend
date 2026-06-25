<template>
  <div class="universal-table glass-container">
    <div class="toolbar">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
          <input
              v-model="searchText"
              @compositionstart="handleSearchCompositionStart"
              @compositionend="handleSearchCompositionEnd"
              @input="handleSearch"
              :placeholder="t('tableTree.universalTable.toolbar.searchPlaceholder')"
              class="search-input"
          />
      </div>
      <div v-if="userStore.role === 'admin'" class="action-buttons">
        <button v-if="!isEditMode" class="main-glass-button" data-size="compact" @click="exportToExcel">
          <span class="icon">📤</span><span class="btn-text">Excel</span>
        </button>
        <button class="main-glass-button" data-variant="primary" @click="openAddModal">
          <span class="icon">＋</span> <span class="btn-text">{{ t('tableTree.universalTable.toolbar.add') }}</span>
        </button>
        <button
          class="main-glass-button"
          data-role="edit-toggle"
          :data-state="isEditMode ? 'edit-mode' : 'default'"
          @click="toggleEditMode"
        >
          <span class="icon">{{ isEditMode ? '✕' : '✎' }}</span>
          <span class="btn-text">{{ isEditMode ? t('common.button.cancel') : t('common.button.edit') }}</span>
        </button>
        <button
          v-if="isEditMode"
          class="main-glass-button"
          data-variant="secondary"
          @click="openBatchReplaceModal"
          :title="t('tableTree.universalTable.toolbar.batchReplace')"
        >
          <span class="icon">🔄</span>
          <span class="btn-text">{{ t('tableTree.universalTable.toolbar.batchReplace') }}</span>
        </button>
        <button
          v-if="isEditMode"
          class="main-glass-button"
          data-role="submit"
          @click="submitBatchEdit"
          :disabled="Object.keys(changedCells).length === 0"
        >
          <span class="icon">✓</span>
          <span class="btn-text">{{ t('tableTree.universalTable.toolbar.submitWithCount', { count: changedRowCount }) }}</span>
        </button>
      </div>
    </div>

    <div class="table-scroll-area ui-scrollbar">
      <div v-if="isLoading" class="loading-overlay">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <span>{{ t('tableTree.universalTable.states.loadingData') }}</span>
      </div>

      <div v-else-if="tableData.length === 0" class="empty-state">
        <span>📭 {{ t('tableTree.universalTable.states.noData') }}</span>
      </div>
      <table>
        <colgroup>
          <col
              v-for="col in columns"
              :key="col.key"
              :style="{ width: ((Number(col.width) || 1) / totalRatio * 100) + '%' }"
          />
          <col v-if="userStore.role === 'admin'" style="width: 60px; min-width: 50px;" />
        </colgroup>

        <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">
            <div class="header-content">
              <div
                  class="header-text-wrapper"
                  :class="{ 'clickable': col.filterable, 'filtering': filterState[col.key]?.length > 0 }"
                  @click.stop="col.filterable ? openFilter(col.key, $event) : null"
              >
                <span class="header-text">{{ col.label }}</span>
                <span v-if="col.filterable" class="filter-hint-icon">⑆</span>
              </div>

              <div class="sort-controls">
                <span @click.stop="toggleSort(col.key, false)" class="sort-arrow up" :class="{active: sortCol===col.key && !sortDesc}">▲</span>
                <span @click.stop="toggleSort(col.key, true)" class="sort-arrow down" :class="{active: sortCol===col.key && sortDesc}">▼</span>
              </div>
            </div>
          </th>
          <th v-if="userStore.role === 'admin'" class="action-th">{{ t('tableTree.universalTable.toolbar.action') }}</th>
        </tr>
        </thead>

        <tbody :class="{ 'blur-content': isLoading }">
        <tr v-for="row in tableData" :key="getRowPrimaryKey(row)">
          <td
            v-for="col in columns"
            :key="col.key"
            :contenteditable="isEditMode"
            :class="{ 'editable-cell': isEditMode, 'cell-changed': isCellChanged(getRowPrimaryKey(row), col.key) }"
            @input="handleCellEdit(getRowPrimaryKey(row), col.key, $event)"
            @blur="handleCellBlur(getRowPrimaryKey(row), col.key, $event)"
          >
            {{ row[col.key] }}
          </td>
          <td v-if="userStore.role === 'admin'" class="action-td">
            <button class="icon-action-btn delete" :title="t('common.button.delete')" @click="handleDelete(row)">✕</button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button class="page-btn" @click="changePage(-1)" :disabled="currentPage === 1">←</button>
      <div class="page-info-wrapper">
        <span v-if="!isEditingPageNumber" class="page-info clickable" @click="startEditPageNumber">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <div v-else class="page-input-wrapper">
          <input
            ref="pageInputRef"
            v-model.number="inputPageNumber"
            type="number"
            class="page-input"
            :min="1"
            :max="totalPages"
            @keyup.enter="confirmPageJump"
            @blur="confirmPageJump"
          />
          <span class="page-total">/ {{ totalPages }}</span>
        </div>
      </div>
      <button class="page-btn" @click="changePage(1)" :disabled="currentPage >= totalPages">→</button>
      <button class="fullscreen-toggle-btn" @click="toggleFullscreen">
        {{ isFullscreen ? t('tableTree.universalTable.toolbar.exit') : `⛶ ${t('tableTree.universalTable.toolbar.fullscreen')}` }}
      </button>
    </div>

    <!-- 全屏模式 -->
    <Teleport to="body">
      <transition name="fade-scale">
        <div v-if="isFullscreen" class="table-fullscreen-overlay">
          <div class="fullscreen-container">
            <div class="table-scroll-area fullscreen-table ui-scrollbar">
              <div v-if="isLoading" class="loading-overlay">
                <div class="ui-loading--page" aria-hidden="true"></div>
                <span>{{ t('tableTree.universalTable.states.loadingData') }}</span>
              </div>

              <div v-else-if="tableData.length === 0" class="empty-state">
                <span>📭 {{ t('tableTree.universalTable.states.noData') }}</span>
              </div>
              <table>
                <colgroup>
                  <col
                      v-for="col in columns"
                      :key="col.key"
                      :style="{ width: ((Number(col.width) || 1) / totalRatio * 100) + '%' }"
                  />
                  <col v-if="userStore.role === 'admin'" style="width: 60px; min-width: 50px;" />
                </colgroup>

                <thead>
                <tr>
                  <th v-for="col in columns" :key="col.key">
                    <div class="header-content">
                      <div
                          class="header-text-wrapper"
                          :class="{ 'clickable': col.filterable, 'filtering': filterState[col.key]?.length > 0 }"
                          @click.stop="col.filterable ? openFilter(col.key, $event) : null"
                      >
                        <span class="header-text">{{ col.label }}</span>
                        <span v-if="col.filterable" class="filter-hint-icon">⑆</span>
                      </div>

                      <div class="sort-controls">
                        <span @click.stop="toggleSort(col.key, false)" class="sort-arrow up" :class="{active: sortCol===col.key && !sortDesc}">▲</span>
                        <span @click.stop="toggleSort(col.key, true)" class="sort-arrow down" :class="{active: sortCol===col.key && sortDesc}">▼</span>
                      </div>
                    </div>
                  </th>
                  <th v-if="userStore.role === 'admin'" class="action-th">{{ t('tableTree.universalTable.toolbar.action') }}</th>
                </tr>
                </thead>

                <tbody :class="{ 'blur-content': isLoading }">
                <tr v-for="row in tableData" :key="getRowPrimaryKey(row)">
                  <td
                    v-for="col in columns"
                    :key="col.key"
                    :contenteditable="isEditMode"
                    :class="{ 'editable-cell': isEditMode, 'cell-changed': isCellChanged(getRowPrimaryKey(row), col.key) }"
                    @input="handleCellEdit(getRowPrimaryKey(row), col.key, $event)"
                    @blur="handleCellBlur(getRowPrimaryKey(row), col.key, $event)"
                  >
                    {{ row[col.key] }}
                  </td>
                  <td v-if="userStore.role === 'admin'" class="action-td">
                    <button class="icon-action-btn delete" :title="t('common.button.delete')" @click="handleDelete(row)">✕</button>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>

            <div class="pagination fullscreen-pagination">
              <button class="page-btn" @click="changePage(-1)" :disabled="currentPage === 1">←</button>
              <div class="page-info-wrapper">
                <span v-if="!isEditingPageNumber" class="page-info clickable" @click="startEditPageNumber">
                  {{ currentPage }} / {{ totalPages }}
                </span>
                <div v-else class="page-input-wrapper">
                  <input
                    ref="pageInputRefFullscreen"
                    v-model.number="inputPageNumber"
                    type="number"
                    class="page-input"
                    :min="1"
                    :max="totalPages"
                    @keyup.enter="confirmPageJump"
                    @blur="confirmPageJump"
                  />
                  <span class="page-total">/ {{ totalPages }}</span>
                </div>
              </div>
              <button class="page-btn" @click="changePage(1)" :disabled="currentPage >= totalPages">→</button>
              <button class="fullscreen-toggle-btn exit-btn" @click="toggleFullscreen">
                {{ t('tableTree.universalTable.toolbar.exitFullscreen') }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <Teleport to="body">
      <transition name="fade-scale">
        <div v-if="activeFilterCol" class="teleport-overlay" @click="closeFilter">
          <div
              class="main-glass-panel"
              data-surface="filter-popup"
              :style="popupStyle"
              @click.stop
            >
              <div class="filter-header">
              <span>{{ t('tableTree.universalTable.filter.title', { label: currentFilterLabel }) }}</span>
              <button class="close-btn close-btn-sm close-btn-inline close-btn-mobile-only" :aria-label="t('common.button.close')" @click="closeFilter">✕</button>
            </div>

            <div v-bind="containerProps" class="filter-list ui-scrollbar" style="max-height: 300px">

              <div v-bind="wrapperProps">

                <div v-if="popupLoading" class="loading-item">{{ t('tableTree.universalTable.filter.loading') }}</div>

<!--                <label class="checkbox-item empty-option">-->
<!--                  <input type="checkbox" :value="null" v-model="filterState[activeFilterCol]">-->
<!--                  <span class="custom-checkbox"></span>-->
<!--                  <span class="label-text italic">(空值)</span>-->
<!--                </label>-->

                <label
                    v-for="item in list"
                    :key="item.index"
                    class="checkbox-item"
                    :style="{ height: '35px' }"
                >
                  <input type="checkbox" :value="item.data" v-model="filterState[activeFilterCol]">
                  <span class="custom-checkbox"></span>
                  <span class="label-text">{{ item.data }}</span>
                </label>

              </div>
            </div>

            <div class="filter-actions">
              <button class="text-btn toggle-select" @click="handleToggleSelect">
                {{ isSelectionEmpty ? t('tableTree.universalTable.filter.selectAll') : t('tableTree.universalTable.filter.invertSelection') }}
              </button>
              <button class="text-btn cancel" @click="closeFilter">{{ t('common.button.cancel') }}</button>
              <button class="text-btn confirm" @click="applyFilter">{{ t('common.button.confirm') }}</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- 新增记录模态框 -->
    <AppModal
      :model-value="showAddModal"
      size="sm"
      :title="t('tableTree.universalTable.addModal.title')"
      :close-label="t('common.button.close')"
      transition-name="fade-scale"
      :z-index="9999"
      @update:modelValue="closeAddModal"
    >
      <div class="form-content ui-scrollbar">
        <div v-for="col in columns" :key="col.key" class="form-field">
          <label class="field-label">{{ col.label }}</label>
          <input
            v-model="newRecordData[col.key]"
            type="text"
            class="field-input"
            :placeholder="t('tableTree.universalTable.addModal.inputPlaceholder', { label: col.label })"
          />
        </div>
      </div>

      <template #footer>
        <div class="add-record-modal-actions">
        <button class="modal-btn cancel-btn" @click="closeAddModal">{{ t('common.button.cancel') }}</button>
        <button class="modal-btn confirm-btn" @click="submitNewRecord">{{ t('tableTree.universalTable.addModal.confirmAdd') }}</button>
        </div>
      </template>
    </AppModal>

    <!-- 批量替换对话框 -->
    <AppModal
      :model-value="showBatchReplaceModal"
      size="sm"
      :title="t('tableTree.universalTable.batchReplace.title')"
      :close-label="t('common.button.close')"
      transition-name="modal-fade"
      :z-index="9999"
      @update:modelValue="closeBatchReplaceModal"
    >
      <div class="batch-replace-modal-body ui-scrollbar">
              <!-- 列选择器 -->
              <div class="form-group">
                <label>{{ t('tableTree.universalTable.batchReplace.selectColumns') }}</label>
                <div class="column-selector">
                  <label
                    v-for="col in editableColumns"
                    :key="col.key"
                    class="column-checkbox-item"
                  >
                    <input
                      type="checkbox"
                      :value="col.key"
                      v-model="batchReplace.selectedColumns"
                    />
                    <span class="custom-checkbox"></span>
                    <span class="label-text">{{ col.label }}</span>
                  </label>
                </div>
              </div>

              <!-- 查找内容 -->
              <div class="form-group">
                <label>{{ t('tableTree.universalTable.batchReplace.findContent') }}</label>
                <input
                  type="text"
                  v-model="batchReplace.findText"
                  :placeholder="t('tableTree.universalTable.batchReplace.findPlaceholder')"
                  class="glass-input"
                />
                <small v-if="batchReplace.findText.trim() === ''" class="help-text">
                  ℹ️ {{ t('tableTree.universalTable.batchReplace.emptySearchHint') }}
                </small>
              </div>

              <!-- 替换内容 -->
              <div class="form-group">
                <label>{{ t('tableTree.universalTable.batchReplace.replaceWith') }}</label>
                <input
                  type="text"
                  v-model="batchReplace.replaceText"
                  :placeholder="t('tableTree.universalTable.batchReplace.replacePlaceholder')"
                  class="glass-input"
                />
              </div>

              <!-- 匹配模式 -->
              <div class="form-group">
                <label>{{ t('tableTree.universalTable.batchReplace.matchMode') }}</label>
                <div class="radio-group">
                  <label class="radio-item">
                    <input
                      type="radio"
                      value="exact"
                      v-model="batchReplace.matchMode"
                    />
                    <span>{{ t('tableTree.universalTable.batchReplace.exactMatch') }}</span>
                  </label>
                  <label class="radio-item">
                    <input
                      type="radio"
                      value="contains"
                      v-model="batchReplace.matchMode"
                    />
                    <span>{{ t('tableTree.universalTable.batchReplace.containsMatch') }}</span>
                  </label>
                </div>
              </div>

              <!-- ✅ 新增：替换范围选项 -->
              <div class="form-group">
                <label>{{ t('tableTree.universalTable.batchReplace.replaceScope') }}</label>
                <div class="radio-group">
                  <label class="radio-item">
                    <input
                      type="radio"
                      :value="false"
                      v-model="batchReplace.replaceAllPages"
                    />
                    <span>{{ t('tableTree.universalTable.batchReplace.currentPageOnly') }}</span>
                  </label>
                  <label class="radio-item highlight-option">
                    <input
                      type="radio"
                      :value="true"
                      v-model="batchReplace.replaceAllPages"
                    />
                    <span>{{ t('tableTree.universalTable.batchReplace.allPages') }}</span>
                  </label>
                </div>
                <small v-if="batchReplace.replaceAllPages" class="help-text warning-help">
                  ⚠️ {{ t('tableTree.universalTable.batchReplace.allPagesHint') }}
                </small>
              </div>

              <!-- 预览结果 -->
              <div v-if="batchReplace.previewResults.length > 0 || batchReplace.totalMatches > 0" class="preview-section">
                <!-- ✅ 全表模式：仅显示统计 -->
                <div v-if="batchReplace.replaceAllPages && batchReplace.totalMatches > 0" class="all-pages-preview">
                  <h4>{{ t('tableTree.universalTable.batchReplace.allPagesPreviewTitle') }}</h4>
                  <div class="stats-box">
                    <p class="stats-item">
                      <span class="label">{{ t('tableTree.universalTable.batchReplace.matchCount') }}</span>
                      <span class="value">{{ batchReplace.totalMatches }} {{ t('tableTree.universalTable.batchReplace.countUnit') }}</span>
                    </p>
                    <p class="stats-item">
                      <span class="label">{{ t('tableTree.universalTable.batchReplace.replaceScopeLabel') }}</span>
                      <span class="value">{{ t('tableTree.universalTable.batchReplace.allPagesScope') }}</span>
                    </p>
                    <p class="stats-item">
                      <span class="label">{{ t('tableTree.universalTable.batchReplace.filterCondition') }}</span>
                      <span class="value">{{ hasActiveFilters ? t('tableTree.universalTable.batchReplace.applied') : t('tableTree.universalTable.batchReplace.none') }}</span>
                    </p>
                  </div>
                  <p class="warning-text">
                    ⚠️ {{ t('tableTree.universalTable.batchReplace.instantWarning') }}
                  </p>
                </div>

                <!-- 原有的当前页预览列表 -->
                <div v-else-if="batchReplace.previewResults.length > 0">
                  <h4>{{ t('tableTree.universalTable.batchReplace.previewTitle', { count: batchReplace.previewResults.length }) }}</h4>
                  <div class="preview-list ui-scrollbar">
                    <div
                      v-for="(item, index) in batchReplace.previewResults.slice(0, 50)"
                      :key="index"
                      class="preview-item"
                    >
                      <div class="preview-row">
                        <span class="row-label">{{ t('tableTree.universalTable.batchReplace.row', { row: item.rowIndex + 1 }) }}</span>
                        <span class="col-label">{{ item.columnLabel }}</span>
                      </div>
                      <div class="preview-change">
                        <span class="old-value">{{ item.oldValue }}</span>
                        <span class="arrow">→</span>
                        <span class="new-value">{{ item.newValue }}</span>
                      </div>
                    </div>
                    <div v-if="batchReplace.previewResults.length > 50" class="preview-more">
                      {{ t('tableTree.universalTable.batchReplace.moreChanges', { count: batchReplace.previewResults.length - 50 }) }}
                    </div>
                  </div>
                </div>
              </div>
      </div>

      <template #footer>
        <div class="batch-replace-modal-footer">
              <button
                class="main-glass-button"
                data-variant="secondary"
                @click="previewBatchReplace"
                :disabled="!canPreview"
              >
                <span class="icon">👁️</span>
                <span>{{ t('tableTree.universalTable.batchReplace.preview') }}</span>
              </button>
              <button
                class="main-glass-button"
                data-variant="primary"
                @click="executeBatchReplace"
                :disabled="batchReplace.replaceAllPages ? batchReplace.totalMatches === 0 : batchReplace.previewResults.length === 0"
              >
                <span class="icon">✓</span>
                <span>{{ t('tableTree.universalTable.batchReplace.replaceWithCount', { count: batchReplaceCount }) }}</span>
              </button>
              <button
                class="main-glass-button"
                @click="closeBatchReplaceModal"
              >
                <span>{{ t('common.button.cancel') }}</span>
              </button>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import * as XLSX from 'xlsx';
import {
  sqlQuery,
  distinctQuery,
  mutateSingleRow,
  batchMutate,
  batchReplacePreview,
  batchReplaceExecute
} from '@/api'
import AppModal from '@/components/common/AppModal.vue';
import { userStore } from '@/main/store/store.js';
import { useVirtualList } from '@vueuse/core';
import { TABLE_CONFIG } from '@/main/config/constants.js';
import { showSuccess, showWarning, showConfirm, showError } from '@/utils/message.js';

const { t } = useI18n();

// ✅ 定义事件
const emit = defineEmits(['update:total', 'data-loaded'])

const props = defineProps({
  dbKey: { type: String, required: true },
  tableName: { type: String, required: true },
  columns: { type: Array, required: true },
  defaultFilter: { type: Object, default: null }, // 新增：默认筛选 { columnKey: value }
  // ✅ 新增：可选的主键字段名
  primaryKey: { type: String, default: null }
});

// 狀態定義
const tableData = ref([]);
const total = ref(0);
const currentPage = ref(1);
const searchText = ref('');
const sortCol = ref(null);
const sortDesc = ref(false);
const isFullscreen = ref(false);

// ✅ 新增：主键字段名（自动检测或使用 props）
const primaryKeyField = ref('rowid');

// 页码输入相关状态
const isEditingPageNumber = ref(false);
const inputPageNumber = ref(1);
const pageInputRef = ref(null);
const pageInputRefFullscreen = ref(null);

// 編輯模式相關狀態
const isEditMode = ref(false);
const changedCells = reactive({}); // { rowId: { colKey: newValue } }
const originalData = ref([]); // 保存進入編輯模式時的原始數據

// 新增記錄相關狀態
const showAddModal = ref(false);
const newRecordData = reactive({});

// 批量替换相关状态
const showBatchReplaceModal = ref(false)
const batchReplace = reactive({
  selectedColumns: [],      // 选中的列 keys
  findText: '',             // 查找内容
  replaceText: '',          // 替换内容
  matchMode: 'contains',    // 匹配模式：'exact' | 'contains'
  previewResults: [],       // 预览结果 [{ rowId, rowIndex, columnKey, columnLabel, oldValue, newValue }]
  replaceAllPages: false,   // ✅ 新增：是否全表替换
  totalMatches: 0           // ✅ 新增：全表匹配数量统计
})

const changedRowCount = computed(() => Object.keys(changedCells).length)
const batchReplaceCount = computed(() => (
  batchReplace.replaceAllPages ? batchReplace.totalMatches : batchReplace.previewResults.length
))
const hasActiveFilters = computed(() =>
  Object.values(filterState).some(values => Array.isArray(values) && values.length > 0)
)

// ========================================
// (已移除移动端滚动锁定相关状态，恢复为普通双向滚动)
// ========================================

// ✅ 可编辑的列（排除主键字段）
const editableColumns = computed(() => {
  return props.columns.filter(col => col.key !== primaryKeyField.value)
})

// 是否可以预览
const canPreview = computed(() => {
  return batchReplace.selectedColumns.length > 0
  // 移除查找文本非空限制，允许空值查找
})

// 篩選相關狀態
const activeFilterCol = ref(null); // 當前激活的篩選列 Key
const distinctValues = reactive({}); // 緩存各列的篩選選項
const filterState = reactive({});    // 存儲選中的篩選值
const popupPos = reactive({ top: 0, left: 0 }); // 彈窗座標
const isLoading = ref(false);
// 計算總寬度比例
const totalRatio = computed(() => {
  return props.columns.reduce((sum, col) => sum + (Number(col.width) || 1), 0);
});

// 計算總頁數
const totalPages = computed(() => {
  return Math.ceil(total.value / TABLE_CONFIG.PAGE_SIZE) || 1;
});

// 初始化篩選狀態
props.columns.forEach(col => {
  if (col.filterable) filterState[col.key] = [];
});

// 應用默認篩選
if (props.defaultFilter) {
  Object.keys(props.defaultFilter).forEach(key => {
    const value = props.defaultFilter[key];
    // 如果该列不在 filterState 中，初始化它
    if (!filterState[key]) {
      filterState[key] = [];
    }
    // 将默认值添加到筛选状态（确保是数组形式）
    if (Array.isArray(value)) {
      filterState[key] = [...value];
    } else {
      filterState[key] = [value];
    }
  });
}

// 獲取數據
const fetchData = async () => {
  isLoading.value = true; // 開啟 loading
  const searchCols = props.columns.map(c => c.key);
  const payload = {
    db_key: props.dbKey,
    table_name: props.tableName,
    page: currentPage.value,
    page_size: TABLE_CONFIG.PAGE_SIZE,  // ✅ 使用 constants 配置
    sort_by: sortCol.value,
    sort_desc: sortDesc.value,
    filters: filterState,
    search_text: searchText.value,
    search_columns: searchCols
  };

  try {
    const response = await sqlQuery(payload);

    tableData.value = response.data;
    total.value = response.total;

    // ✅ 发出事件，让父组件可以获取 total
    emit('update:total', response.total)
    emit('data-loaded', { total: response.total, data: response.data })

    // ✅ 新增：智能主键字段检测
    if (tableData.value.length > 0) {
      const firstRow = tableData.value[0];

      // 优先级 1: 使用 props 指定的主键
      if (props.primaryKey && props.primaryKey in firstRow) {
        primaryKeyField.value = props.primaryKey;
        console.log(`✅ 使用 props 指定的主键: ${primaryKeyField.value}`);
      }
      // 优先级 2: 使用后端返回的主键信息
      else if (response.primary_key && response.primary_key in firstRow) {
        primaryKeyField.value = response.primary_key;
        console.log(`✅ 使用后端返回的主键: ${primaryKeyField.value}`);
      }
      // 优先级 3: 自动检测常见主键名
      else {
        const commonPKNames = ['rowid', 'id', '_id', 'pk', 'ID', 'Id'];
        let detected = false;

        for (const pkName of commonPKNames) {
          if (pkName in firstRow && firstRow[pkName] != null) {
            primaryKeyField.value = pkName;
            // console.log(`✅ 自动检测到主键字段: ${primaryKeyField.value}`);
            detected = true;
            break;
          }
        }

        // 优先级 4: 查找第一个看起来像主键的字段（唯一的整数字段）
        if (!detected) {
          const potentialPK = detectPrimaryKeyField(tableData.value);
          if (potentialPK) {
            primaryKeyField.value = potentialPK;
            console.log(`✅ 检测到可能的主键字段: ${primaryKeyField.value}`);
          } else {
            // Fallback: 使用第一个非 null 字段
            const firstNonNullField = Object.keys(firstRow).find(
              key => firstRow[key] != null
            );
            primaryKeyField.value = firstNonNullField || 'rowid';
            console.warn(
              `⚠️ 表 ${props.tableName} 未找到明确的主键字段，使用: ${primaryKeyField.value}`
            );
          }
        }
      }
    }
  } catch (e) {
    console.error("Data Load Error:", e);
  }finally {
    isLoading.value = false; // 請求結束（無論成功失敗）都關閉
  }
};

/**
 * 检测主键字段（查找唯一的整数或UUID字段）
 * @param {Array} data - 表格数据
 * @returns {string|null} 主键字段名或 null
 */
const detectPrimaryKeyField = (data) => {
  if (data.length === 0) return null;

  const firstRow = data[0];
  const fields = Object.keys(firstRow);

  for (const field of fields) {
    const values = data.map(row => row[field]);

    // 检查唯一性
    const uniqueValues = new Set(values);
    if (uniqueValues.size !== values.length) {
      continue; // 不唯一，跳过
    }

    // 检查是否有 null 值
    if (values.some(v => v == null)) {
      continue; // 有 null，跳过
    }

    // 检查是否是整数
    const isInteger = values.every(v => Number.isInteger(v) || typeof v === 'number');
    if (isInteger) {
      return field; // 找到唯一的整数字段
    }

    // 检查是否是 UUID 格式（简单判断）
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = values.every(v => typeof v === 'string' && uuidPattern.test(v));
    if (isUUID) {
      return field; // 找到 UUID 字段
    }
  }

  return null; // 未找到合适的主键
};

// ========================================
// 主键字段辅助函数
// ========================================

/**
 * 获取行的主键值
 * @param {Object} row - 数据行对象
 * @returns {any} 主键值（rowid 或 id）
 */
const getRowPrimaryKey = (row) => {
  return row[primaryKeyField.value];
};

// 排序切換
const toggleSort = (key, desc) => {
  sortCol.value = key;
  sortDesc.value = desc;
  fetchData();
};

// 計算當前篩選彈窗的標題
const currentFilterLabel = computed(() => {
  const col = props.columns.find(c => c.key === activeFilterCol.value);
  return col ? col.label : '';
});

const popupLoading = ref(false);
// 計算彈窗樣式 (PC端定位)
const popupStyle = computed(() => {
  // 移動端樣式由 CSS class 控制 (fixed center)，這裡返回空
  if (window.innerWidth <= 768) {
    return {};
  }
  // PC 端：使用計算出的絕對坐標
  return {
    position: 'absolute',
    top: `${popupPos.top}px`,
    left: `${popupPos.left}px`,
    // 防止彈窗超出屏幕右側
    transform: window.innerWidth - popupPos.left < 300 ? 'translateX(-100%)' : 'none'
  };
});

// 把当前要显示的列表数据变成一个 computed
const currentListSource = computed(() => {
  return distinctValues[activeFilterCol.value] || [];
});

// 使用 useVirtualList
const { list, containerProps, wrapperProps } = useVirtualList(
    currentListSource,
    {
      itemHeight: 35, // 预估每一行的高度(px)，根据你的 CSS 调整
      overscan: 10,   // 多渲染几个在视口外，防止滚动白屏
    }
);
// 打開篩選器
const openFilter = async (key, event) => {
  // 1. 如果點擊當前已打開的列，則關閉
  if (activeFilterCol.value === key) {
    closeFilter();
    return;
  }

  // 2. ✨ 計算位置核心邏輯
  if (event && event.currentTarget) {
    const rect = event.currentTarget.getBoundingClientRect();
    popupPos.top = rect.bottom + window.scrollY + 8;
    popupPos.left = rect.left + window.scrollX;
  }

  // 3. 設置當前激活列
  activeFilterCol.value = key;

  // 移動端打開時鎖定背景滾動
  if (window.innerWidth <= 768) {
    document.body.style.overflow = 'hidden';
  }

  // 4. 準備 Payload (核心修改部分)
  // -------------------------------------------------

  // A. 處理上下文篩選 (排除當前列自己)
  const contextFilters = { ...filterState };
  delete contextFilters[key];

  // B. 準備搜索相關參數 (新增!)
  const searchCols = props.columns.map(c => c.key);

  const payload = {
    db_key: props.dbKey,
    table_name: props.tableName,
    target_column: key,
    current_filters: contextFilters,
    // ✅ 新增：把全局搜索詞和搜索列發給後端
    search_text: searchText.value || "",
    search_columns: searchCols
  };
  // -------------------------------------------------

  // 5. 發送請求
  popupLoading.value = true;
  distinctValues[key] = []; // 先清空

  try {
    const res = await distinctQuery(payload);
    distinctValues[key] = res.values;
  } catch (e) {
    console.error("Filter Load Error:", e);
  } finally {
    popupLoading.value = false;
  }
};

// 確認篩選
const applyFilter = () => {
  closeFilter();
  currentPage.value = 1;
  fetchData();
};

// 關閉篩選
const closeFilter = () => {
  activeFilterCol.value = null;
  document.body.style.overflow = ''; // 恢復滾動
};

// 搜索
let timeout = null;
const isSearchComposing = ref(false);

const handleSearchCompositionStart = () => {
  isSearchComposing.value = true;

  // 输入法组合期间，取消已有的搜索定时器
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
};

const handleSearchCompositionEnd = () => {
  isSearchComposing.value = false;

  // 选字完成后，再执行一次搜索
  handleSearch();
};

const handleSearch = (event) => {
  // 输入法组合期间不搜索
  if (isSearchComposing.value || event?.isComposing) {
    return;
  }

  if (timeout) clearTimeout(timeout);

  timeout = setTimeout(() => {
    currentPage.value = 1;
    fetchData();
  }, TABLE_CONFIG.SEARCH_DEBOUNCE);
};
// --- 新增逻辑：全选/反选 ---

// 1. 计算属性：判断当前列是否完全没选
const isSelectionEmpty = computed(() => {
  const current = filterState[activeFilterCol.value];
  return !current || current.length === 0;
});

// 2. 核心逻辑：全选/反选
const handleToggleSelect = () => {
  const key = activeFilterCol.value;
  const currentSelected = filterState[key] || [];
  const rawOptions = distinctValues[key] || [];

  // 构建页面上显示的所有选项集合
  // 逻辑：页面上有个硬编码的 (空值) 选项，加上接口返回的非 null 值
  const allPossibleOptions = [null, ...rawOptions.filter(v => v !== null)];

  if (currentSelected.length === 0) {
    // 【全选】：将所有可能的选项赋值给 filterState
    filterState[key] = [...allPossibleOptions];
  } else {
    // 【反选】：从全集中 剔除 已经在 currentSelected 里的项
    // 使用 filter 和 includes 实现差集
    filterState[key] = allPossibleOptions.filter(opt => !currentSelected.includes(opt));
  }
};
// 導出 Excel
const exportToExcel = () => {
  const ws = XLSX.utils.json_to_sheet(tableData.value);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${props.tableName}_export.xlsx`);
};

// 翻頁
const changePage = (delta) => {
  currentPage.value += delta;
  fetchData();
};

// 页码输入相关函数
const startEditPageNumber = () => {
  isEditingPageNumber.value = true;
  inputPageNumber.value = currentPage.value;
  // 使用 nextTick 确保输入框已渲染
  nextTick(() => {
    const inputEl = pageInputRef.value || pageInputRefFullscreen.value;
    if (inputEl) {
      inputEl.focus();
      inputEl.select();
    }
  });
};

const confirmPageJump = () => {
  const targetPage = inputPageNumber.value;

  // 关闭编辑模式
  isEditingPageNumber.value = false;

  // 如果页码没变化，不需要跳转
  if (targetPage === currentPage.value) {
    return;
  }

  // 验证页码范围
  if (!targetPage || targetPage < 1 || targetPage > totalPages.value) {
    showWarning(t('tableTree.universalTable.messages.pageNumberRange', { max: totalPages.value }));
    inputPageNumber.value = currentPage.value;
    return;
  }

  // 跳转到目标页
  currentPage.value = targetPage;
  fetchData();
};

// 切換全屏模式
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;

  // 全屏時鎖定背景滾動
  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

// ========================================
// 權限檢查
// ========================================
const checkAdminPermission = () => {
  if (userStore.role !== 'admin') {
    showWarning(t('tableTree.universalTable.messages.adminOnly'));
    return false;
  }
  return true;
};

// ========================================
// 編輯模式相關函數
// ========================================

// 切換編輯模式
const toggleEditMode = () => {
  if (!checkAdminPermission()) return;

  if (isEditMode.value) {
    // 取消編輯：恢復原始數據
    tableData.value = JSON.parse(JSON.stringify(originalData.value));
    Object.keys(changedCells).forEach(key => delete changedCells[key]);
  } else {
    // 進入編輯模式：保存原始數據
    originalData.value = JSON.parse(JSON.stringify(tableData.value));
  }

  isEditMode.value = !isEditMode.value;
};

// 處理單元格編輯
const handleCellEdit = (rowId, colKey, event) => {
  const newValue = event.target.innerText.trim();

  // 初始化該行的變更記錄
  if (!changedCells[rowId]) {
    changedCells[rowId] = {};
  }

  // ✅ 使用动态主键字段
  const originalRow = originalData.value.find(r => r[primaryKeyField.value] === rowId);
  const originalValue = originalRow ? originalRow[colKey] : '';

  // 如果值改變了，記錄；如果改回原值，刪除記錄
  if (newValue !== String(originalValue)) {
    changedCells[rowId][colKey] = newValue;
  } else {
    delete changedCells[rowId][colKey];
    // 如果該行沒有任何改變，刪除該行記錄
    if (Object.keys(changedCells[rowId]).length === 0) {
      delete changedCells[rowId];
    }
  }
};

// 處理單元格失焦（更新 tableData）
const handleCellBlur = (rowId, colKey, event) => {
  const newValue = event.target.innerText.trim();
  // ✅ 使用动态主键字段
  const row = tableData.value.find(r => r[primaryKeyField.value] === rowId);
  if (row) {
    row[colKey] = newValue;
  }
};

// 判斷單元格是否已改變
const isCellChanged = (rowId, colKey) => {
  return changedCells[rowId] && changedCells[rowId][colKey] !== undefined;
};

// 提交批量編輯
const submitBatchEdit = async () => {
  if (!checkAdminPermission()) return;

  if (Object.keys(changedCells).length === 0) {
    showWarning(t('tableTree.universalTable.messages.noChangesToSubmit'));
    return;
  }

  const confirmed = await showConfirm(
    t('tableTree.universalTable.messages.confirmBatchUpdate', { count: changedRowCount.value }),
    {
      title: t('tableTree.universalTable.messages.confirmBatchUpdateTitle'),
      confirmText: t('common.button.submit'),
      cancelText: t('common.button.cancel')
    }
  );

  if (!confirmed) return;

  try {
    // 構建批量更新數據
    const updateData = Object.keys(changedCells).map(rowId => {
      return {
        // ✅ 使用动态主键字段名
        [primaryKeyField.value]: rowId,
        ...changedCells[rowId]
      };
    });

    const payload = {
      db_key: props.dbKey,
      table_name: props.tableName,
      action: 'batch_update',
      pk_column: primaryKeyField.value,  // ✅ 动态主键列名
      update_data: updateData
    };

    const response = await batchMutate(payload);

    if (response.status === 'completed') {
      showSuccess(t('tableTree.universalTable.messages.batchUpdateSuccess', { count: response.success_count }));

      if (response.error_count > 0) {
        console.warn('部分記錄更新失敗:', response.errors);
        showWarning(t('tableTree.universalTable.messages.batchUpdatePartialFailure', { count: response.error_count }));
      }

      // 清空變更記錄並退出編輯模式
      Object.keys(changedCells).forEach(key => delete changedCells[key]);
      isEditMode.value = false;

      // 重新加載數據
      await fetchData();
    }
  } catch (error) {
    console.error('批量更新失敗:', error);
    showError(t('tableTree.universalTable.messages.batchUpdateFailed', { message: error.message }));
  }
};

// ========================================
// 操作按鈕
// ========================================

// 刪除操作（需要管理員權限）
const handleDelete = async (row) => {
  if (!checkAdminPermission()) return;

  const confirmed = await showConfirm(t('tableTree.universalTable.messages.deleteConfirm', {
    name: row.自然村 || row.name || t('tableTree.universalTable.messages.deleteFallbackName')
  }), {
    title: t('tableTree.universalTable.messages.deleteConfirmTitle'),
    confirmText: t('common.button.delete'),
    cancelText: t('common.button.cancel')
  });

  if (!confirmed) return;

  try {
    const payload = {
      db_key: props.dbKey,
      table_name: props.tableName,
      action: 'delete',
      pk_column: primaryKeyField.value,  // ✅ 动态主键列名
      pk_value: row[primaryKeyField.value]  // ✅ 动态主键值
    };

    await mutateSingleRow(payload);

    showSuccess(t('tableTree.universalTable.messages.deleteSuccess'));
    await fetchData();
  } catch (error) {
    console.error('刪除失敗:', error);
    showError(t('tableTree.universalTable.messages.deleteFailed', { message: error.message }));
  }
};

// 新增操作（需要管理員權限）
const openAddModal = () => {
  if (!checkAdminPermission()) return;

  // 初始化新增表單數據
  props.columns.forEach(col => {
    newRecordData[col.key] = '';
  });

  showAddModal.value = true;
};

// 關閉新增模態框
const closeAddModal = () => {
  showAddModal.value = false;
  // 清空表單數據
  Object.keys(newRecordData).forEach(key => {
    newRecordData[key] = '';
  });
};

// 提交新增記錄
const submitNewRecord = async () => {
  if (!checkAdminPermission()) return;

// 检查是否至少有一个字段非空
  const hasAtLeastOneField = props.columns.some(col => newRecordData[col.key]);
  if (!hasAtLeastOneField) {
    showWarning(t('tableTree.universalTable.messages.atLeastOneField'));
    return;
  }



  try {
    const payload = {
      db_key: props.dbKey,
      table_name: props.tableName,
      action: 'create',
      data: { ...newRecordData }
    };

    await mutateSingleRow(payload);

    showSuccess(t('tableTree.universalTable.messages.addSuccess'));
    closeAddModal();
    await fetchData();
  } catch (error) {
    console.error('新增失敗:', error);
    showError(t('tableTree.universalTable.messages.addFailed', { message: error.message }));
  }
};

// ========================================
// 批量替换相关函数
// ========================================

/**
 * 打开批量替换对话框
 */
const openBatchReplaceModal = () => {
  if (!checkAdminPermission()) return

  // 重置状态
  batchReplace.selectedColumns = []
  batchReplace.findText = ''
  batchReplace.replaceText = ''
  batchReplace.matchMode = 'contains'
  batchReplace.previewResults = []
  batchReplace.replaceAllPages = false  // ✅ 新增：重置全表替换选项
  batchReplace.totalMatches = 0         // ✅ 新增：重置匹配统计

  showBatchReplaceModal.value = true
}

/**
 * 关闭批量替换对话框
 */
const closeBatchReplaceModal = () => {
  showBatchReplaceModal.value = false
}

/**
 * 预览批量替换
 */
const previewBatchReplace = async () => {
  if (!canPreview.value) return

  const findText = batchReplace.findText.trim()
  const matchMode = batchReplace.matchMode

  // 判断是否为空值查找
  const isEmptySearch = findText === ''

  // ✅ 新增：全表预览模式
  if (batchReplace.replaceAllPages) {
    await previewAllPagesReplace(findText, matchMode, isEmptySearch)
    return
  }

  // 原有的当前页预览逻辑
  const results = []

  // console.log('=== 批量替换预览 ===')
  // console.log('查找内容:', `"${findText}"`)
  // console.log('匹配模式:', matchMode)
  // console.log('选中的列:', batchReplace.selectedColumns)
  // console.log('表格数据行数:', tableData.value.length)

  // 遍历所有数据行
  tableData.value.forEach((row, rowIndex) => {
    // ✅ 使用动态主键
    const rowId = row[primaryKeyField.value]

    // 遍历选中的列
    batchReplace.selectedColumns.forEach(colKey => {
      const rawValue = row[colKey]
      const oldValue = String(rawValue ?? '')  // 使用 ?? 更明确地处理 null/undefined
      let shouldReplace = false

      // 空值查找特殊处理
      if (isEmptySearch) {
        // 查找文本为空：匹配空单元格（null、undefined、空字符串）
        shouldReplace = rawValue == null || rawValue === ''
      }
      // 正常查找逻辑
      else {
        if (matchMode === 'exact') {
          shouldReplace = oldValue === findText
        } else {
          shouldReplace = oldValue.includes(findText)
        }
      }

      // // 调试：输出前3个不匹配的例子
      // if (!shouldReplace && results.length < 3) {
      //   console.log(`行${rowIndex + 1} [${colKey}]: "${oldValue}" ${matchMode === 'exact' ? '不等于' : '不包含'} "${findText}"`)
      // }

      if (shouldReplace) {
        // 计算新值
        let newValue
        if (isEmptySearch || matchMode === 'exact') {
          // 空值查找或完全匹配：直接替换为 replaceText
          newValue = batchReplace.replaceText
        } else {
          // 包含匹配：替换所有出现的 findText
          newValue = oldValue.replaceAll(findText, batchReplace.replaceText)
        }

        // 查找列标签
        const column = props.columns.find(c => c.key === colKey)
        const columnLabel = column ? column.label : colKey

        results.push({
          rowId,
          rowIndex,
          columnKey: colKey,
          columnLabel,
          oldValue: oldValue || t('tableTree.universalTable.batchReplace.emptyValue'),  // UI 显示优化
          newValue
        })

        // console.log(`✓ 匹配: 行${rowIndex + 1} [${columnLabel}]: "${oldValue}" → "${newValue}"`)
      }
    })
  })

  batchReplace.previewResults = results

  // console.log('匹配结果数:', results.length)
  // console.log('===================')

  if (results.length === 0) {
    showWarning(t('tableTree.universalTable.messages.noMatchesFound'))
  } else if (isEmptySearch) {
    showSuccess(t('tableTree.universalTable.messages.foundEmptyCells', { count: results.length }))
  } else {
    showSuccess(t('tableTree.universalTable.messages.foundMatches', { count: results.length }))
  }
}

/**
 * ✅ 新增：全表预览（仅统计数量）
 */
const previewAllPagesReplace = async (findText, matchMode, isEmptySearch) => {
  try {
    const payload = {
      db_key: props.dbKey,
      table_name: props.tableName,
      columns: batchReplace.selectedColumns,
      find_text: findText,
      match_mode: matchMode,
      is_empty_search: isEmptySearch,
      filters: filterState,         // 尊重筛选条件
      search_text: searchText.value  // 尊重搜索条件
    }

    const response = await batchReplacePreview(payload)

    batchReplace.totalMatches = response.total_matches
    batchReplace.previewResults = []  // 全表模式不显示详细列表

    if (response.total_matches === 0) {
      showWarning(t('tableTree.universalTable.messages.noMatchesFound'))
    } else if (isEmptySearch) {
      showSuccess(t('tableTree.universalTable.messages.foundEmptyCells', { count: response.total_matches }))
    } else {
      showSuccess(t('tableTree.universalTable.messages.foundMatches', { count: response.total_matches }))
    }
  } catch (error) {
    console.error('全表预览失败:', error)
    showError(t('tableTree.universalTable.messages.previewAllPagesFailed'))
  }
}

/**
 * 执行批量替换
 */
const executeBatchReplace = async () => {
  // ✅ 新增：全表替换模式
  if (batchReplace.replaceAllPages) {
    await executeAllPagesReplace()
    return
  }

  // 原有的当前页替换逻辑
  if (batchReplace.previewResults.length === 0) return

  // 确认对话框
  const confirmed = await showConfirm(
    t('tableTree.universalTable.messages.executeBatchReplaceConfirm', { count: batchReplace.previewResults.length }),
    {
      title: t('tableTree.universalTable.messages.executeBatchReplaceTitle'),
      confirmText: t('common.button.confirm'),
      cancelText: t('common.button.cancel')
    }
  )

  if (!confirmed) return

  // 将变更写入 changedCells
  batchReplace.previewResults.forEach(item => {
    const { rowId, columnKey, newValue } = item

    // 初始化行记录
    if (!changedCells[rowId]) {
      changedCells[rowId] = {}
    }

    // 记录变更
    changedCells[rowId][columnKey] = newValue

    // 更新 tableData 显示
    // ✅ 使用动态主键查找行
    const row = tableData.value.find(r => r[primaryKeyField.value] === rowId)
    if (row) {
      row[columnKey] = newValue
    }
  })

  showSuccess(t('tableTree.universalTable.messages.batchReplaceDone', { count: batchReplace.previewResults.length }))
  closeBatchReplaceModal()
}

/**
 * ✅ 新增：执行全表替换
 */
const executeAllPagesReplace = async () => {
  if (batchReplace.totalMatches === 0) {
    showWarning(t('tableTree.universalTable.messages.noReplaceableMatches'))
    return
  }

  // 二次确认
  const confirmMsg = t('tableTree.universalTable.messages.executeAllPagesConfirm', { count: batchReplace.totalMatches })
  const confirmed = await showConfirm(confirmMsg, {
    title: t('tableTree.universalTable.messages.executeAllPagesTitle'),
    confirmText: t('tableTree.universalTable.messages.executeAllPagesConfirmText'),
    cancelText: t('common.button.cancel')
  })

  if (!confirmed) return

  try {
    const findText = batchReplace.findText.trim()
    const isEmptySearch = findText === ''

    const payload = {
      db_key: props.dbKey,
      table_name: props.tableName,
      pk_column: primaryKeyField.value,
      columns: batchReplace.selectedColumns,
      find_text: findText,
      replace_text: batchReplace.replaceText,
      match_mode: batchReplace.matchMode,
      is_empty_search: isEmptySearch,
      filters: filterState,         // 尊重筛选条件
      search_text: searchText.value  // 尊重搜索条件
    }

    const response = await batchReplaceExecute(payload)

    if (response.status === 'success') {
      showSuccess(t('tableTree.universalTable.messages.allPagesReplaceDone', { count: response.affected_rows }))

      // 刷新当前页数据
      await fetchData()

      closeBatchReplaceModal()
    } else {
      showError(t('tableTree.universalTable.messages.replaceFailed', { message: response.message || t('tableTree.universalTable.messages.unknownError') }))
    }
  } catch (error) {
    console.error('全表替换失败:', error)
    showError(t('tableTree.universalTable.messages.allPagesReplaceFailed'))
  }
}


// ========================================
// (已移除移动端触摸滚动锁定函数，恢复为普通双向滚动)
// ========================================

const handleGlobalClick = () => {
  if (activeFilterCol.value) {
    closeFilter();
  }
};

onMounted(() => {
  fetchData();
  // 添加全局監聽
  document.addEventListener('click', handleGlobalClick);
});

onUnmounted(() => {
  // 組件銷毀時移除監聽，防止內存洩漏
  document.removeEventListener('click', handleGlobalClick);
  // 恢復背景滾動
  document.body.style.overflow = '';
});
</script>



<style scoped>
/* ========================================
   UniversalTable 组件样式
   使用全局 CSS 变量和工具类
   ======================================== */

.universal-table.glass-container {
  /* 使用全局变量替代局部变量 */
  background: var(--glass-light);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-md);
  padding: 12px 4px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 85dvh;
  width: 88dvw;
  overflow: hidden;
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-light);
  gap: 6px;
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  width: 300px;
  min-width: 200px;
}

.search-input {
  width: 80%;
  padding: 10px 12px 10px 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-medium);
  background: var(--glass-medium);
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
}

.search-input:focus {
  background: var(--bg-white);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  gap: 8px;

}

.main-glass-button {
  --main-glass-button-padding: 8px 16px;
  --main-glass-button-border-radius: var(--radius-md);
  --main-glass-button-font-size: 13px;
  padding: 8px 16px;
  border: 1px solid var(--border-light);
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  max-width: 100px;
  white-space: nowrap;
}

.main-glass-button:hover:not(:disabled) {
  background: var(--bg-white);
  transform: translateY(-1px);
}

.main-glass-button[data-size='compact'] {
  --main-glass-button-padding: 8px 6px;
}

.main-glass-button[data-variant='primary'] {
  background: var(--color-primary);
  color: white;
}

.main-glass-button[data-role='edit-toggle'] {
  background: darkgoldenrod;
}

/* 編輯模式按鈕樣式 */
.main-glass-button[data-role='edit-toggle'][data-state='edit-mode'] {
  background: #ff9500;
  color: white;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 149, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 149, 0, 0);
  }
}

/* 提交按鈕樣式 */
.main-glass-button[data-role='submit'] {
  background: linear-gradient(135deg, #34c759, #28a745);
  color: white;
  font-weight: 600;
}

.main-glass-button[data-role='submit']:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #ccc;
}

/* Table Area */
.table-scroll-area {
  flex: 1;
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;
  border-radius: var(--radius-md);
  background: var(--glass-light);
  min-height: 200px;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  min-width: 1000px;
}

thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

th, td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-light);
  border-right: 1px solid var(--border-light);
}

th {
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 600;
  padding: 8px 3px !important;
}

td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-light);
  font-size: 14px;
  white-space: normal;
  word-break: break-word;
  vertical-align: top;
  line-height: 1.5;
}

/* 可編輯單元格樣式 */
td.editable-cell {
  cursor: text;
  background: #fffbf0;
  border: 1px solid #ffd700;
  transition: all 0.2s;
}

td.editable-cell:hover {
  background: #fff9e6;
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
}

td.editable-cell:focus {
  outline: none;
  background: white;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
  border-color: var(--color-primary);
}

/* 已改變的單元格樣式 */
td.cell-changed {
  background: #e6f7ff;
  border-color: var(--color-primary);
  font-weight: 600;
  position: relative;
}

td.cell-changed::after {
  content: '✎';
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 10px;
  color: var(--color-primary);
}

/* Header & Filter */
.header-content {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  width: 100%;
  overflow: hidden;
}

.header-text-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.header-text {
  white-space: nowrap;
}

.header-text-wrapper.clickable {
  cursor: pointer;
}

.header-text-wrapper.clickable:hover {
  background: var(--bg-hover);
}

.header-text-wrapper.filtering .header-text {
  color: var(--color-primary);
  font-weight: bold;
}

.filter-hint-icon {
  font-size: 10px;
  opacity: 0.5;
}

.sort-controls {
  display: flex;
  flex-direction: column;
  height: 16px;
  justify-content: center;
  opacity: 0.2;
  cursor: pointer;
  font-size: 9px;
}

.header-content:hover .sort-controls {
  opacity: 0.8;
  font-size: 12px;
}

.sort-arrow.active {
  color: var(--color-primary);
  opacity: 1;
}

/* Filter Popup */
.main-glass-panel[data-surface='filter-popup'] {
  --main-glass-panel-background: var(--glass-light);
  --main-glass-panel-backdrop-filter: blur(25px);
  --main-glass-panel-border: 1px solid rgba(255, 255, 255, 0.8);
  --main-glass-panel-shadow: var(--shadow-lg);
  --main-glass-panel-hover-shadow: var(--shadow-lg);
  --main-glass-panel-border-radius: var(--radius-lg);
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  z-index: 10000;
  min-width: 240px;
  max-width: 300px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  max-height: 400px;
}

.main-glass-panel[data-surface='filter-popup'].align-right {
  left: auto;
  right: 0;
}

.main-glass-panel[data-surface='filter-popup'] {
  max-height: 50dvh;
}

.filter-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 8px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
}

.filter-list {
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border-light);
  flex-shrink: 0;
}

/* Checkbox Styling */
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 3px;
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.checkbox-item:hover {
  background: var(--bg-hover-light);
}

.checkbox-item input {
  display: none;
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border: 2px solid var(--border-gray);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: white;
  flex-shrink: 0;
  position: relative;
}

.checkbox-item input:checked + .custom-checkbox {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-item input:checked + .custom-checkbox::after {
  content: '✓';
  color: darkgreen;
  font-size: 14px;
  font-weight: bold;
  line-height: 1;
  display: block;
}

.text-btn {
  background: none;
  border: none;
  font-size: 13px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
}

.toggle-select {
  color: var(--color-accent-purple);
  font-weight: bold;
}

.toggle-select:hover {
  background: var(--color-accent-purple-light);
}

.text-btn.confirm {
  background: var(--color-gradient);
  color: white;
}

.text-btn.cancel {
  color: var(--text-tertiary);
}

.text-btn.cancel:hover {
  background: var(--bg-hover);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .universal-table.glass-container {
    padding: 8px 2px;
    border-radius: 20px;
    height: 85dvh;
    border: none;
  }

  th, td {
    padding: 4px 6px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    width: 100%;
  }

  .action-buttons {
    justify-content: space-between;
  }

  .action-buttons .main-glass-button {
    flex: 1;
    justify-content: center;
    padding: 8px;
  }

  table {
    min-width: 800px;
  }

  .mobile-overlay {
    position: fixed;
    inset: 0;
    background: var(--bg-overlay);
    z-index: 999;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }

  .main-glass-panel[data-surface='filter-popup'],
  .main-glass-panel[data-surface='filter-popup'].align-right {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 85dvw;
    max-height: 70vh;
    margin: 0;
    z-index: 1000;
  }

}

/* Action Buttons */
.action-td {
  display: flex;
  gap: 8px;
}

.icon-action-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--bg-hover-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}

.icon-action-btn:hover {
  background: var(--color-primary);
  color: white;
}

/* 删除按钮专用样式（暗红色） */
.icon-action-btn.delete {
  background: #8B0000; /* 暗红色 */
  color: white;
}

.icon-action-btn.delete:hover {
  background: #A52A2A; /* 悬停时更浅的红色 */
  color: white;
  transform: scale(1.1);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.page-info-wrapper {
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-info {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.page-info.clickable {
  cursor: pointer;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--border-light);
}

.page-info.clickable:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.page-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-input {
  width: 50px;
  padding: 6px 8px;
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
  background: white;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  outline: none;
  transition: all 0.2s;
  -moz-appearance: textfield;
}

.page-input::-webkit-outer-spin-button,
.page-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.page-input:focus {
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.page-total {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.page-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: white;
  border: 1px solid var(--border-medium);
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.label-text {
  font-size: 14px;
}

/* Loading States */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-muted);
  font-weight: bold;
}



.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
  font-size: 16px;
}

.blur-content {
  opacity: 0.5;
}

/* ========================================
   新增记录模态框样式
   ======================================== */

.form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  max-height: 50dvh;
  padding: 4px;
}

.form-field {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  min-width: 60px;
}

.field-input {
  flex: 1;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-medium);
  background: white;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
}

.field-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.add-record-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.modal-btn {
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.cancel-btn:hover {
  background: var(--bg-hover-strong);
}

.confirm-btn {
  background: var(--color-primary);
  color: white;
}

.confirm-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .form-content {
    max-height: 60dvh;
  }

  .add-record-modal-actions {
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
  }
}

/* ========================================
   全屏模式样式
   ======================================== */

.fullscreen-toggle-btn {
  padding: 8px 16px;
  margin-left: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-medium);
  background: var(--color-primary);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.fullscreen-toggle-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.fullscreen-toggle-btn.exit-btn {
  background: #ff3b30;
  margin-left: auto;
}

.fullscreen-toggle-btn.exit-btn:hover {
  background: #ff6259;
}

.table-fullscreen-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.fullscreen-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.5);
}

.fullscreen-table {
  flex: 1;
  margin: 0;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.5);
}

.fullscreen-pagination {
  flex-shrink: 0;
  padding: 2px 12px;
  border-top: 2px solid var(--border-light);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}

/* 移动端全屏适配 */
@media (max-width: 768px) {
  .fullscreen-toggle-btn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .fullscreen-pagination {
    padding: 2px 8px;
  }
}

/* ==========================================
   批量替换对话框样式

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.batch-replace-modal-body {
  min-height: 0;
}

.batch-replace-modal-body .form-group {
  margin-bottom: 20px;
}

.batch-replace-modal-body .form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.batch-replace-modal-body .glass-input {
  width: 80%;
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.batch-replace-modal-body .glass-input:focus {
  border-color: #007aff;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

/* 列选择器 */
.column-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
  overflow-y: auto;
}

.column-checkbox-item {
  display: flex!important;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  user-select: none;
  white-space: nowrap;
}

.column-checkbox-item:hover {
  background: rgba(0, 122, 255, 0.05);
  border-color: rgba(0, 122, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15);
}

.column-checkbox-item input[type="checkbox"] {
  display: none;
}

.column-checkbox-item .custom-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  flex-shrink: 0;
  position: relative;
}

.column-checkbox-item input:checked + .custom-checkbox {
  background: linear-gradient(135deg, #007aff, #0051d5);
  border-color: #007aff;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.4);
}

.column-checkbox-item input:checked + .custom-checkbox::after {
  content: '✓';
  color: white;
  font-size: 14px;
  font-weight: bold;
  line-height: 1;
  display: block;
  animation: checkmark 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes checkmark {
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(0deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.column-checkbox-item input:checked ~ .label-text {
  color: #007aff;
  font-weight: 600;
}

.column-checkbox-item .label-text {
  font-size: 13px;
  color: #333;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

/* 单选按钮组 */
.radio-group {
  display: flex;
  gap: 16px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.radio-item input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.radio-item span {
  font-size: 14px;
  color: #333;
  user-select: none;
}

/* 帮助文本 */
.help-text {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #88bffb;
  font-weight: 500;
}

/* 预览区域 */
.preview-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px dashed rgba(0, 0, 0, 0.1);
}

.preview-section h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: #007aff;
}

.preview-list {
  max-height: 300px;
  overflow-y: auto;
  background: rgba(0, 122, 255, 0.03);
  border-radius: 10px;
  padding: 12px;
}

.preview-item {
  padding: 10px;
  margin-bottom: 8px;
  background: white;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.preview-row {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 12px;
}

.row-label {
  padding: 2px 8px;
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
  border-radius: 4px;
  font-weight: 600;
}

.col-label {
  padding: 2px 8px;
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
  border-radius: 4px;
  font-weight: 600;
}

.preview-change {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.old-value {
  color: #d32f2f;
  text-decoration: line-through;
  opacity: 0.7;
}

.arrow {
  color: #666;
  font-weight: bold;
}

.new-value {
  color: #34c759;
  font-weight: 600;
}

.preview-more {
  text-align: center;
  padding: 8px;
  color: #666;
  font-size: 12px;
  font-style: italic;
}

/* ✅ 新增：全表预览统计样式 */
.all-pages-preview {
  padding: 16px;
  background: rgba(255, 152, 0, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 152, 0, 0.2);
}

.all-pages-preview h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: #ff9800;
}

.stats-box {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.stats-item {
  margin: 8px 0;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-item .label {
  color: #666;
  font-weight: 500;
}

.stats-item .value {
  color: #ff9800;
  font-weight: 600;
  font-size: 16px;
}

.warning-text {
  margin: 12px 0 0 0;
  padding: 10px;
  background: rgba(255, 152, 0, 0.1);
  border-radius: 6px;
  color: #ff6f00;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}

/* ✅ 新增：高亮全表替换选项 */
.radio-item.highlight-option {
  border: 2px solid rgba(255, 152, 0, 0.3);
  background: rgba(255, 152, 0, 0.05);
}

.radio-item.highlight-option:hover {
  background: rgba(255, 152, 0, 0.1);
  border-color: rgba(255, 152, 0, 0.5);
}

.radio-item.highlight-option input[type="radio"]:checked + span {
  color: #ff9800;
  font-weight: 600;
}

.help-text.warning-help {
  color: #ff6f00;
  background: rgba(255, 152, 0, 0.1);
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 8px;
  display: block;
  font-weight: 500;
}



/* 底部按钮栏 */
.batch-replace-modal-footer {
  display: flex;
  gap: 12px;
  margin: 20px -18px -20px;
  padding: 16px 18px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.5);
}

.batch-replace-modal-footer .main-glass-button {
  flex: 1;
}

.batch-replace-modal-footer .main-glass-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-replace-modal-footer .main-glass-button[data-variant='secondary'] {
  background: rgba(108, 117, 125, 0.1);
  color: #495057;
  border: 1px solid rgba(108, 117, 125, 0.2);
}

.batch-replace-modal-footer .main-glass-button[data-variant='secondary']:hover:not(:disabled) {
  background: rgba(108, 117, 125, 0.2);
}

/* 响应式 */
@media (max-width: 768px) {
  .batch-replace-modal-footer {
    margin-inline: -18px;
    margin-bottom: -20px;
    flex-direction: column;
  }

  .column-selector {
    grid-template-columns: 1fr;
    gap:1px
  }
}
</style>
