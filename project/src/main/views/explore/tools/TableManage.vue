<template>
  <div style="width:100%;">
    <div v-if="authLoading" class="loading-container">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>{{ t('tools.tableManage.loading') }}</p>
    </div>

    <div v-else-if="!isAdmin" class="access-denied">
      <h2>⚠️ {{ t('tools.tableManage.accessDenied.title') }}</h2>
      <p>{{ t('tools.tableManage.accessDenied.desc') }}</p>
      <button @click="goHome">{{ t('tools.tableManage.accessDenied.goHome') }}</button>
    </div>

    <div v-else class="admin-panel">
      <div v-if="showUniversalTable" class="collapsed-toolbar">
        <div class="toolbar-content">
          <h3>{{ t('tools.tableManage.collapsedToolbar.current', { db: selectedDbKey, table: selectedTable }) }}</h3>
          <button @click="toggleConfigPanel" class="btn-toggle">
            {{
              showConfigPanel
                ? t('tools.tableManage.collapsedToolbar.hideConfig')
                : t('tools.tableManage.collapsedToolbar.showConfig')
            }}
          </button>
        </div>
      </div>

      <div v-show="!showUniversalTable || showConfigPanel" class="config-panel">
        <h2 v-if="!showUniversalTable">{{ t('tools.tableManage.page.title') }}</h2>

        <div class="config-actions">
          <button @click="saveCurrentConfig" class="btn-action-small">{{ t('tools.tableManage.actions.saveConfig') }}</button>
          <button @click="loadSavedConfig" class="btn-action-small">{{ t('tools.tableManage.actions.loadConfig') }}</button>
          <button @click="clearSavedConfig" class="btn-action-small danger">{{ t('tools.tableManage.actions.clearConfig') }}</button>
        </div>

        <div class="config-section" style="gap:25px;display: flex;justify-content: center;">
          <label>{{ t('tools.tableManage.steps.selectDatabase') }}</label>
          <div class="input-group">
            <SimpleSelectDropdown
              v-model="selectedDbKey"
              :options="dbKeyOptions"
              width="250px"
              @update:modelValue="onDbKeyChange"
            />
            <input
              v-if="selectedDbKey === '__custom__' || customDbKeyMode"
              v-model="customDbKey"
              type="text"
              :placeholder="t('tools.tableManage.placeholders.customDatabase')"
              class="custom-input"
              @blur="applyCustomDbKey"
            />
          </div>
          <label v-if="selectedDbKey">{{ t('tools.tableManage.steps.selectTable') }}</label>
          <div v-if="selectedDbKey" class="input-group">
            <SimpleSelectDropdown
              v-model="selectedTable"
              :options="tableOptions"
              width="250px"
              @update:modelValue="onTableChange"
            />
            <input
                 v-if="selectedTable === '__custom__' || customTableMode"
                 v-model="customTable"
                 type="text"
                 :placeholder="t('tools.tableManage.placeholders.customTable')"
                 class="custom-input"
                 @blur="applyCustomTable"
            />
          </div>
        </div>


        <div v-if="selectedTable && allColumns.length > 0" class="config-section">
          <h3>{{ t('tools.tableManage.steps.configureColumns') }}</h3>

          <div class="preset-buttons">
            <button @click="applyPresetConfig" class="btn-preset">
              {{ t('tools.tableManage.actions.applyPreset') }}
            </button>
            <button @click="selectAllColumns" class="btn-preset">
              {{
                allColumnsSelected
                  ? t('tools.tableManage.actions.deselectAllColumns')
                  : t('tools.tableManage.actions.selectAllColumns')
              }}
            </button>
          </div>

          <div class="table-wrapper">
            <table class="column-config-table">
              <thead>
                <tr>
                  <th>{{ t('tools.tableManage.tableHeaders.visible') }}</th>
                  <th>{{ t('tools.tableManage.tableHeaders.columnName') }}</th>
                  <th>{{ t('tools.tableManage.tableHeaders.columnWidth') }}</th>
                  <th>{{ t('tools.tableManage.tableHeaders.filterable') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="col in allColumns" :key="col.name">
                  <td>
                    <input
                      type="checkbox"
                      v-model="selectedColumns[col.name]"
                    />
                  </td>
                  <td>{{ col.name }}</td>
                  <td>
                    <input
                      v-if="selectedColumns[col.name]"
                      type="number"
                      v-model.number="columnWidths[col.name]"
                      min="0.5"
                      max="10"
                      step="0.1"
                      class="width-input"
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      v-model="filterableColumns[col.name]"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="filter-config">
            <div class="filter-header" @click="toggleFilterConfig">
              <h4>{{ t('tools.tableManage.steps.defaultFilters') }}</h4>
              <button class="btn-toggle-filter">
                {{
                  showFilterConfig
                    ? t('tools.tableManage.actions.hideFilters')
                    : t('tools.tableManage.actions.showFilters')
                }}
              </button>
            </div>

            <div v-show="showFilterConfig" class="filter-grid">
              <div v-for="col in allColumns" :key="col.name" class="filter-item">
                <label>{{ col.name }}:</label>
                <input
                  type="text"
                  v-model="defaultFilters[col.name]"
                  :placeholder="t('tools.tableManage.placeholders.filterValue')"
                />
              </div>
            </div>
          </div>

          <button @click="showTable" class="btn-show">
            {{ t('tools.tableManage.actions.showTable') }}
          </button>
        </div>
      </div>

      <div v-if="showUniversalTable" class="table-display">
        <UniversalTable
          :db-key="selectedDbKey"
          :table-name="selectedTable"
          :columns="computedColumns"
          :default-filter="computedDefaultFilter"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { userStore } from '@/main/store/store.js'
import { getUserRole, ensureAuthenticated } from '@/api/auth/auth.js'
import { getTableColumns } from '@/api'
import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import { showError, showSuccess, showWarning } from '@/utils/message.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// 权限验证
const authLoading = ref(true)
const isAdmin = computed(() => userStore.role === 'admin')

// 数据库和表映射
const DB_TABLE_MAPPING = {
  spoken: ['口语字'],
  village: ['广东省自然村'],
  chars: ['characters', 'old_chinese', 'zhongyuan', 'menggu', 'hongwu', 'fenyun'],
  query: ['dialects'],
  query_admin: ['dialects'],
  dialects: ['dialects'],
  dialects_admin: ['dialects'],
  yubao: ['grammar', 'vocabulary'],
  logs: ['api_keyword_log', 'api_statistics', 'api_visit_log', 'api_usage_daily', 'api_usage_hourly', 'api_diagnostic_events'],
  // auth: ['api_usage_logs', 'api_usage_summary', 'users', 'refresh_tokens', 'user_db_permissions']
}

// 预设配置（常用表的默认列配置）
const PRESET_CONFIGS = {
  'dialects': {
    columns: ['簡稱', '地圖集二分區', '音典分區', '字表來源（母本）', '省', '市', '縣', '鎮'],
    widths: { '簡稱': 1, '地圖集二分區': 1.5, '音典分區': 1.5, '字表來源（母本）': 3, '省': 0.8, '市': 0.8, '縣': 0.8, '鎮': 0.8 },
    filterable: ['地圖集二分區', '音典分區', '省', '市', '縣', '鎮']
  },
  '口语字': {
    columns: ['本字考', 'IPA', '粤拼', '来源', '声母', '韵母', '音调', '词性', '释义', '例词例句', '待校及说明'],
    widths: { '本字考': 1, 'IPA': 0.8, '粤拼': 0.8, '来源': 0.8, '声母': 0.5, '韵母': 0.8, '音调': 0.5, '词性': 1, '释义': 2, '例词例句': 2, '待校及说明': 0.8 },
    filterable: ['来源', '声母', '韵母', '音调', '词性', '待校及说明']
  },

}

// 状态管理
const selectedDbKey = ref('')
const selectedTable = ref('')
const customDbKey = ref('')
const customTable = ref('')
const customDbKeyMode = ref(false)
const customTableMode = ref(false)
const allColumns = ref([])
const selectedColumns = ref({})
const columnWidths = ref({})
const filterableColumns = ref({})
const defaultFilters = ref({})
const showUniversalTable = ref(false)
const showConfigPanel = ref(false)  // 控制配置面板的显示
const showFilterConfig = ref(false)  // 控制默认筛选的展开/收起

// 计算属性
const dbKeys = computed(() => Object.keys(DB_TABLE_MAPPING))
const availableTables = computed(() => {
  return selectedDbKey.value ? DB_TABLE_MAPPING[selectedDbKey.value] : []
})

// Dropdown options
const dbKeyOptions = computed(() => {
  const options = [{ label: t('tools.tableManage.dropdown.selectDatabase'), value: '' }]
  dbKeys.value.forEach(key => {
    options.push({ label: key, value: key })
  })
  options.push({ label: '✏️ ' + t('tools.tableManage.dropdown.customInput'), value: '__custom__' })
  return options
})

const tableOptions = computed(() => {
  const options = [{ label: t('tools.tableManage.dropdown.selectTable'), value: '' }]
  availableTables.value.forEach(table => {
    options.push({ label: table, value: table })
  })
  options.push({ label: '✏️ ' + t('tools.tableManage.dropdown.customInput'), value: '__custom__' })
  return options
})

// 检查是否所有列都已选中
const allColumnsSelected = computed(() => {
  if (allColumns.value.length === 0) return false
  return allColumns.value.every(col => selectedColumns.value[col.name])
})

const computedColumns = computed(() => {
  return Object.keys(selectedColumns.value)
    .filter(col => selectedColumns.value[col])
    .map(col => ({
      key: col,
      label: col,
      filterable: filterableColumns.value[col] || false,  // 使用配置的可筛选状态
      width: columnWidths.value[col] || 1
    }))
})

const computedDefaultFilter = computed(() => {
  const filters = {}
  Object.keys(defaultFilters.value).forEach(col => {
    if (defaultFilters.value[col]) {
      filters[col] = defaultFilters.value[col]
    }
  })
  return Object.keys(filters).length > 0 ? filters : null
})

// 方法
const goHome = () => {
  router.push('/')
}

const onDbKeyChange = () => {
  selectedTable.value = ''
  allColumns.value = []
  showUniversalTable.value = false
  customDbKeyMode.value = selectedDbKey.value === '__custom__'
}

const onTableChange = async () => {
  showUniversalTable.value = false
  customTableMode.value = selectedTable.value === '__custom__'
  if (selectedTable.value && selectedTable.value !== '__custom__') {
    await fetchColumns()

    // ✅ 新增：切换表后自动尝试加载该表的配置
    const configKey = getConfigKey(selectedDbKey.value, selectedTable.value)
    const saved = localStorage.getItem(configKey)

    if (saved) {
      try {
        const config = JSON.parse(saved)
        selectedColumns.value = config.selectedColumns || {}
        columnWidths.value = config.columnWidths || {}
        filterableColumns.value = config.filterableColumns || {}
        defaultFilters.value = config.defaultFilters || {}
        console.log(`✅ 自动加载配置: ${selectedDbKey.value}/${selectedTable.value}`)
      } catch (err) {
        console.error('自动加载配置失败:', err)
      }
    } else {
      console.log(`ℹ️ 该表没有保存的配置，使用默认配置`)
    }
  }
}

const applyCustomDbKey = () => {
  if (customDbKey.value.trim()) {
    selectedDbKey.value = customDbKey.value.trim()
    customDbKeyMode.value = false
  }
}

const applyCustomTable = async () => {
  if (customTable.value.trim()) {
    selectedTable.value = customTable.value.trim()
    customTableMode.value = false
    await fetchColumns()
  }
}

const fetchColumns = async () => {
  try {
    const dbKey = selectedDbKey.value
    const tableName = selectedTable.value
    const res = await getTableColumns(dbKey, tableName)

    allColumns.value = res.columns || []

    selectedColumns.value = {}
    columnWidths.value = {}
    filterableColumns.value = {}
    defaultFilters.value = {}

    allColumns.value.forEach(col => {
      const colName = col.name
      selectedColumns.value[colName] = false
      columnWidths.value[colName] = 1
      filterableColumns.value[colName] = false
    })

    applyPresetConfig()
  } catch (err) {
    console.error('获取列信息失败:', err)
    showWarning(t('tools.tableManage.messages.fetchColumnsFailed'))
  }
}

const applyPresetConfig = () => {
  const preset = PRESET_CONFIGS[selectedTable.value]
  if (preset) {
    // 应用预设配置
    allColumns.value.forEach(col => {
      const colName = col.name
      selectedColumns.value[colName] = preset.columns.includes(colName)
      columnWidths.value[colName] = preset.widths[colName] || 1
      filterableColumns.value[colName] = preset.filterable.includes(colName)
    })
  } else {
    // 默认选择前 10 列
    selectFirst10Columns()
  }
}

const selectFirst10Columns = () => {
  allColumns.value.forEach((col, index) => {
    const colName = col.name
    selectedColumns.value[colName] = index < 10  // 默认只选前 10 列
    columnWidths.value[colName] = 1
    filterableColumns.value[colName] = false
  })
}

const selectAllColumns = () => {
  // 检查是否所有列都已选中
  const allSelected = allColumns.value.every(col => selectedColumns.value[col.name])

  allColumns.value.forEach((col) => {
    const colName = col.name
    // Toggle: 如果全部选中就全不选，否则全选
    selectedColumns.value[colName] = !allSelected
    // 只在首次选中时初始化宽度，不覆盖已有配置
    if (!allSelected && !columnWidths.value[colName]) {
      columnWidths.value[colName] = 1
    }
    // 不修改 filterableColumns，保持用户的筛选配置
  })
}

const showTable = () => {
  if (computedColumns.value.length === 0) {
    showWarning(t('tools.tableManage.messages.selectOneColumn'))
    return
  }

  // ✅ 显示表格时保存最后使用的表
  saveLastUsedTable(selectedDbKey.value, selectedTable.value)

  // ✅ 强制重新挂载 UniversalTable 组件
  // 先卸载组件，然后在下一个 tick 重新挂载
  // 这样可以确保所有状态（filterState、sortCol 等）都重新初始化
  showUniversalTable.value = false
  nextTick(() => {
    showUniversalTable.value = true
    showConfigPanel.value = false  // 显示表格后自动折叠配置面板
  })
}

const toggleConfigPanel = () => {
  showConfigPanel.value = !showConfigPanel.value
}

const toggleFilterConfig = () => {
  showFilterConfig.value = !showFilterConfig.value
}

// ✅ 记住最后使用的表
const LAST_USED_TABLE_KEY = 'table_manage_last_used'

const saveLastUsedTable = (dbKey, tableName) => {
  localStorage.setItem(LAST_USED_TABLE_KEY, JSON.stringify({ dbKey, tableName }))
}

const getLastUsedTable = () => {
  const saved = localStorage.getItem(LAST_USED_TABLE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  }
  return null
}

// 配置保存/加载
// ✅ 改为基于表的配置键（每个表单独保存）
const getConfigKey = (dbKey, tableName) => {
  return `table_config_${dbKey}_${tableName}`
}

const saveCurrentConfig = () => {
  if (!selectedDbKey.value || !selectedTable.value) {
    showWarning(t('tools.tableManage.messages.selectDbAndTable'))
    return
  }

  const config = {
    selectedDbKey: selectedDbKey.value,
    selectedTable: selectedTable.value,
    selectedColumns: selectedColumns.value,
    columnWidths: columnWidths.value,
    filterableColumns: filterableColumns.value,
    defaultFilters: defaultFilters.value,
    timestamp: Date.now()
  }

  // ✅ 使用表专属的配置键
  const configKey = getConfigKey(selectedDbKey.value, selectedTable.value)
  localStorage.setItem(configKey, JSON.stringify(config))

  // ✅ 保存最后使用的表
  saveLastUsedTable(selectedDbKey.value, selectedTable.value)

  showSuccess(t('tools.tableManage.messages.configSaved', {
    db: selectedDbKey.value,
    table: selectedTable.value
  }))
}

const loadSavedConfig = async () => {
  if (!selectedDbKey.value || !selectedTable.value) {
    showWarning(t('tools.tableManage.messages.selectDbAndTable'))
    return
  }

  // ✅ 使用表专属的配置键
  const configKey = getConfigKey(selectedDbKey.value, selectedTable.value)
  const saved = localStorage.getItem(configKey)

  if (!saved) {
    showWarning(t('tools.tableManage.messages.noSavedConfig', {
      db: selectedDbKey.value,
      table: selectedTable.value
    }))
    return
  }

  try {
    const config = JSON.parse(saved)

    // 恢复配置（无需重新 fetchColumns，因为已经选择了表）
    selectedColumns.value = config.selectedColumns || {}
    columnWidths.value = config.columnWidths || {}
    filterableColumns.value = config.filterableColumns || {}
    defaultFilters.value = config.defaultFilters || {}

    showSuccess(t('tools.tableManage.messages.configLoaded', {
      db: selectedDbKey.value,
      table: selectedTable.value
    }))
  } catch (err) {
    console.error('加载配置失败:', err)
    showError(t('tools.tableManage.messages.loadConfigFailed'))
  }
}

const clearSavedConfig = () => {
  if (!selectedDbKey.value || !selectedTable.value) {
    showWarning(t('tools.tableManage.messages.selectDbAndTable'))
    return
  }

  // ✅ 清除表专属的配置
  const configKey = getConfigKey(selectedDbKey.value, selectedTable.value)
  localStorage.removeItem(configKey)

  showSuccess(t('tools.tableManage.messages.configCleared', {
    db: selectedDbKey.value,
    table: selectedTable.value
  }))
}

// 生命周期
onMounted(async () => {
  // console.log('[TableManage] 组件开始加载')

  try {
    // 先确保用户已认证并获取角色信息
    // console.log('[TableManage] 开始权限验证...')
    await ensureAuthenticated()
    // console.log('[TableManage] ensureAuthenticated 完成')

    await getUserRole()
    // console.log('[TableManage] getUserRole 完成，当前角色:', userStore.role)

    // 权限验证完成
    authLoading.value = false

    if (!isAdmin.value) {
      showWarning(t('tools.tableManage.messages.adminOnly'))
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } else {
      console.log('[TableManage] 管理员身份验证成功')

      // ✅ 如果是管理员，尝试自动加载最后使用的表
      const lastUsed = getLastUsedTable()
      if (lastUsed && lastUsed.dbKey && lastUsed.tableName) {
        console.log('[TableManage] 自动加载最后使用的表:', lastUsed.dbKey, lastUsed.tableName)

        // 静默加载
        selectedDbKey.value = lastUsed.dbKey
        selectedTable.value = lastUsed.tableName

        // 尝试获取列信息，如果失败不影响页面加载
        try {
          await fetchColumns()

          // 尝试加载该表的配置
          const configKey = getConfigKey(lastUsed.dbKey, lastUsed.tableName)
          const saved = localStorage.getItem(configKey)

          if (saved) {
            const config = JSON.parse(saved)
            selectedColumns.value = config.selectedColumns || {}
            columnWidths.value = config.columnWidths || {}
            filterableColumns.value = config.filterableColumns || {}
            defaultFilters.value = config.defaultFilters || {}
            console.log('[TableManage] 配置加载完成')
          } else {
            console.log('[TableManage] 该表没有保存的配置，使用默认配置')
          }
        } catch (fetchErr) {
          console.error('[TableManage] 自动加载列信息失败:', fetchErr)
        }
      } else {
        console.log('[TableManage] 没有最后使用的表记录')
      }
    }
  } catch (err) {
    console.error('[TableManage] 权限验证失败:', err)
    console.error('[TableManage] 错误详情:', err.message, err.stack)

    authLoading.value = false

    showError(t('tools.tableManage.messages.authFailed'))

    setTimeout(() => {
      if (!isAdmin.value) {
        console.log('[TableManage] 延迟检查后仍无权限，跳转到登录页')
        router.push(buildLocalePath(resolveRouteLocale(route), '/auth'))
      }
    }, 3000)
  }
})
</script>


$primary-blue: var(--color-primary);
$primary-blue-dark: var(--color-primary-hover);
$success-green: var(--color-success);
$success-green-dark: var(--color-success);
$danger-red: var(--color-error-light);
$danger-red-dark: var(--color-error-dark);

$text-primary: var(--text-primary);
$text-dark: var(--text-slate);
$white: var(--text-white);

$radius-sm: 8px;
$radius-md: 12px;
$radius-lg: 16px;
$radius-xl: 20px;

$transition-base: 0.3s;
$smooth-easing: cubic-bezier(0.4, 0, 0.2, 1);

@mixin glass-blur($blur: 20px, $saturation: 180%) {
  backdrop-filter: blur($blur) saturate($saturation);
  -webkit-backdrop-filter: blur($blur) saturate($saturation);
}

@mixin glass-panel(
  $background: var(--glass-70),
  $radius: $radius-lg
) {
  background: $background;
  border: 1px solid var(--glass-30);
  border-radius: $radius;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 var(--glass-50);

  @include glass-blur;
}

@mixin primary-gradient {
  background: linear-gradient(
    135deg,
    $primary-blue 0%,
    $primary-blue-dark 100%
  );
}

@mixin button-base(
  $padding: 10px 20px,
  $radius: $radius-md,
  $font-size: 14px
) {
  padding: $padding;
  color: $white;
  font-size: $font-size;
  font-weight: 600;
  cursor: pointer;
  border: none;
  border-radius: $radius;
  transition: all $transition-base $smooth-easing;
}

@mixin primary-button-shadow {
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

@mixin input-focus {
  outline: none;
  border-color: $primary-blue;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

/* 主容器 */
.admin-panel {
  width: 100%;

  h2 {
    margin-bottom: 24px;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(
      135deg,
      $text-primary 0%,
      $primary-blue 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

/* 加载容器 */
.loading-container {
  padding: 60px 20px;
  text-align: center;
  background: var(--glass-70);
  border: 1px solid var(--glass-30);
  border-radius: $radius-xl;
  box-shadow:
    0 8px 32px rgba(0, 122, 255, 0.1),
    inset 0 1px 0 var(--glass-50);

  @include glass-blur;

  p {
    color: $primary-blue;
    font-size: 18px;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

/* 权限拒绝 */
.access-denied {
  padding: 60px 20px;
  text-align: center;
  background: rgba(255, 243, 205, 0.8);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: $radius-xl;
  box-shadow:
    0 8px 32px rgba(255, 193, 7, 0.2),
    inset 0 1px 0 var(--glass-50);

  @include glass-blur;

  h2 {
    margin-bottom: 10px;
    color: var(--color-warning-dark);
    font-weight: 700;
  }

  button {
    @include button-base(12px 24px);
    @include primary-gradient;
    @include primary-button-shadow;

    display: block;
    margin: 20px auto 0;
  }
}

/* 折叠工具栏 */
.collapsed-toolbar {
  margin-bottom: 16px;
  padding: 12px 24px;
  transition: all $transition-base $smooth-easing;

  @include glass-panel;

  &:hover {
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 var(--glass-50);
  }
}

.toolbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    background: linear-gradient(
      135deg,
      $primary-blue 0%,
      $primary-blue-dark 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.btn-toggle {
  @include button-base;
  @include primary-gradient;
  @include primary-button-shadow;

  white-space: nowrap;
}

/* 配置面板 */
.config-panel {
  animation: fadeInUp 0.4s $smooth-easing;
}

/* 配置操作按钮 */
.config-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}

.btn-action-small {
  @include button-base;
  @include primary-gradient;
  @include primary-button-shadow;

  position: relative;
  overflow: hidden;

  &::before {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    content: "";
    background: linear-gradient(
      90deg,
      transparent,
      var(--glass-30),
      transparent
    );
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }

  &.danger {
    background: linear-gradient(
      135deg,
      $danger-red 0%,
      $danger-red-dark 100%
    );
    box-shadow: 0 4px 16px rgba(220, 53, 69, 0.3);

    &:hover {
      box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
    }
  }
}

/* 配置区块 */
.config-section {
  margin-bottom: 20px;
  padding: 20px;
  transition: all $transition-base $smooth-easing;

  @include glass-panel;

  &:hover {
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 var(--glass-50);
    transform: translateY(-2px);
  }

  h3 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 20px;
    font-weight: 700;
    background: linear-gradient(
      135deg,
      $text-primary 0%,
      $primary-blue 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  label {
    display: block;
    margin-top: 5px;
    color: $text-primary;
    font-size: 15px;
    font-weight: 600;
  }

  select {
    flex: 1;
    min-width: 250px;
    max-width: 350px;
    padding: 12px 16px;
    font-size: 15px;
    cursor: pointer;
    background: var(--glass-90);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: $radius-md;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all $transition-base $smooth-easing;

    @include glass-blur(10px, 100%);

    &:hover {
      border-color: $primary-blue;
      box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
    }

    &:focus {
      outline: none;
      border-color: $primary-blue;
      box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
    }
  }
}

.input-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.custom-input {
  flex: 1;
  min-width: 250px;
  max-width: 350px;
  padding: 12px 16px;
  font-size: 15px;
  background: var(--glass-90);
  border: 2px solid $primary-blue;
  border-radius: $radius-md;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.2);
  transition: all $transition-base $smooth-easing;

  @include glass-blur(10px, 100%);

  &:focus {
    outline: none;
    border-color: $primary-blue-dark;
    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15);
    transform: translateY(-2px);
  }
}

/* 预设按钮组 */
.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 16px;
}

.btn-preset {
  @include button-base;

  background: linear-gradient(
    135deg,
    $success-green 0%,
    $success-green-dark 100%
  );
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.3);

  &:hover {
    box-shadow: 0 6px 20px rgba(52, 199, 89, 0.4);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

/* 表格容器 */
.table-wrapper {
  max-height: 500px;
  margin-top: 16px;
  overflow-x: auto;
  overflow-y: auto;
  background: var(--glass-50);
  border-radius: $radius-md;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);

  @include glass-blur(10px, 100%);
}

.column-config-table {
  width: 100%;
  font-size: 14px;
  background: transparent;
  border-spacing: 0;
  border-collapse: separate;

  th,
  td {
    padding: 12px 16px;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  th {
    position: sticky;
    top: 0;
    z-index: 10;
    color: $white;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

    @include primary-gradient;

    &:first-child {
      border-top-left-radius: $radius-md;
    }

    &:last-child {
      border-top-right-radius: $radius-md;
    }
  }

  tbody {
    tr {
      background: var(--glass-80);
      transition: all $transition-base $smooth-easing;

      &:hover {
        background: rgba(0, 122, 255, 0.08);
      }
    }
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: $primary-blue;
  }
}

.width-input {
  width: 80%;
  padding: 6px 12px;
  font-size: 14px;
  background: var(--glass-90);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: $radius-sm;
  transition: all $transition-base $smooth-easing;

  &:focus {
    @include input-focus;
  }
}

/* 筛选配置 */
.filter-config {
  margin-top: 20px;
  padding: 20px;
  background: rgba(233, 236, 239, 0.6);
  border: 1px solid var(--glass-30);
  border-radius: $radius-md;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05);

  @include glass-blur;
  
  h4 {
    margin: 0;
    color: $text-dark;
    font-size: 17px;
    font-weight: 700;
    transition: color $transition-base;
  }
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  margin-bottom: 16px;
  cursor: pointer;
  user-select: none;

  &:hover {
    h4 {
      color: $primary-blue;
    }
  }
}

.btn-toggle-filter {
  @include button-base(6px 12px, $radius-sm, 13px);
  @include primary-gradient;

  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
    transform: translateY(-1px);
  }
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  animation: fadeIn $transition-base ease;
}

.filter-item {
  display: flex;
  gap: 12px;
  align-items: center;

  label {
    min-width: 60px;
    margin: 0;
    color: $text-primary;
    font-size: 14px;
    font-weight: 600;
  }

  input {
    width: 100%;
    padding: 8px 12px;
    font-size: 14px;
    background: var(--glass-90);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: $radius-sm;
    transition: all $transition-base $smooth-easing;

    @include glass-blur(10px, 100%);

    &:focus {
      @include input-focus;
    }
  }
}

/* 显示表格按钮 */
.btn-show {
  @include button-base(16px 40px, $radius-lg, 18px);
  @include primary-gradient;

  position: relative;
  display: block;
  margin: 24px auto 0;
  overflow: hidden;
  font-weight: 700;
  box-shadow: 0 8px 32px rgba(0, 122, 255, 0.4);
  transition: all 0.4s $smooth-easing;

  &::before {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    content: "";
    background: linear-gradient(
      90deg,
      transparent,
      var(--glass-30),
      transparent
    );
    transition: left 0.6s;
  }

  &:hover {
    box-shadow: 0 12px 48px rgba(0, 122, 255, 0.5);
    transform: translateY(-4px);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-2px);
  }
}

/* 表格显示区域 */
.table-display {
  width: 100%;
  margin-top: 20px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .config-section {
    flex-direction: column;
    gap: 10px !important;
    padding: 16px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .config-actions {
    align-items: center;
  }

  .btn-action-small {
    max-width: 320px;
  }

  .admin-panel {
    h2 {
      font-size: 24px;
    }
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .config-section {
    background: rgba(28, 28, 30, 0.7);
    border-color: var(--glass-10);

    select,
    label {
      color: $white;
    }

    select {
      background: rgba(44, 44, 46, 0.9);
      border-color: var(--glass-20);
    }
  }

  .custom-input,
  .filter-item input,
  .width-input {
    color: $white;
    background: rgba(44, 44, 46, 0.9);
    border-color: var(--glass-20);
  }

  .config-section label,
  .filter-item label {
    color: var(--bg-light-gray);
  }

  .column-config-table {
    tbody {
      tr {
        background: rgba(28, 28, 30, 0.8);

        &:hover {
          background: rgba(0, 122, 255, 0.2);
        }
      }
    }
  }
}

