<template>
  <div class="region-select">
    <!-- ✅ 選框（點擊打開分區樹） -->
    <div
        ref="anchorEl"
        class="region-select-box"
        :class="{ open: popupOpen }"
        role="button"
        tabindex="0"
        @click="togglePopup"
        @keydown.enter.prevent="togglePopup"
        @keydown.space.prevent="togglePopup"
    >
      <!-- ✅ 已選葉子列表（選框內可刪除） -->
      <div v-if="selectedLeafs.length || externalCustomRegions.length" class="region-tags">
        <span
            v-for="(s, i) in selectedLeafs"
            :key="s + '_' + i"
            class="region-tag"
            :title="s"
        >
          {{ regionLabel(s) }}
          <button class="tag-remove" type="button" @click.stop="removeCommitted(s)">×</button>
        </span>
        <span
            v-for="(s, i) in externalCustomRegions"
            :key="'custom_' + s + '_' + i"
            class="region-tag custom-region-tag"
            :title="s"
        >
          {{ s }}
          <button class="tag-remove" type="button" @click.stop="removeCustomRegionCommitted(s)">×</button>
        </span>
      </div>

      <div v-else class="region-placeholder">
        {{ placeholder || $t('query.components.regionSelector.placeholder') }}
      </div>

      <div class="region-caret">⌵</div>
    </div>

    <!-- ✅ 彈出分區樹（全局玻璃） -->
    <Teleport to="body">
      <div v-if="popupOpen" class="partition-overlay">
        <!-- ✅ 頂部確認欄：顯示已選 + 可刪除 + 確認 -->
        <div ref="topbarEl" class="partition-topbar" @mousedown.stop>
          <!-- 第一行：标题 + 按钮 -->
          <div class="topbar-row topbar-row-1">
            <div class="topbar-title">
              {{ $t('query.components.regionSelector.selectedTitle') }}
              <span class="topbar-count">({{ draftSelected.length }})</span>
            </div>

            <div class="topbar-right">
              <button
                  class="topbar-btn ghost"
                  type="button"
                  @click="clearDraft"
                  :disabled="draftSelected.length === 0"
              >
                {{ $t('query.components.regionSelector.clearButton') }}
              </button>
              <button class="topbar-btn" type="button" @click="confirmAndClose">
                {{ $t('query.components.regionSelector.confirmButton') }}
              </button>
            </div>
          </div>

          <!-- 第二行：tags + 自定義分區按鈕 -->
          <div class="topbar-row topbar-row-2">
            <!-- Left: Tags -->
            <div class="topbar-tags" v-if="draftSelected.length || draftCustomRegions.length">
              <!-- Partition tags -->
              <span
                  v-for="(s, i) in draftSelected"
                  :key="'partition_' + s + '_' + i"
                  class="topbar-tag"
                  :title="s"
              >
                {{ regionLabel(s) }}
                <button class="tag-remove" type="button" @click="removeDraft(s)">×</button>
              </span>

              <!-- Custom region tags -->
              <span
                  v-for="(s, i) in draftCustomRegions"
                  :key="'custom_' + s + '_' + i"
                  class="topbar-tag custom-region-tag"
                  :title="s"
              >
                {{ s }}
                <button class="tag-remove" type="button" @click="removeCustomRegion(s)">×</button>
              </span>
            </div>
            <div class="topbar-empty" v-else>
              {{ $t('query.components.regionSelector.emptyState') }}
            </div>

            <!-- Right: Custom Region Button -->
            <div v-if="allowCustomRegions" class="topbar-right-actions">
              <button
                  ref="customRegionButtonRef"
                  class="custom-region-btn"
                  :class="`btn-${customRegionButtonState.color}`"
                  type="button"
                  @click="handleCustomRegionButtonClick"
                  :title="customRegionButtonState.text"
              >
                <span class="btn-icon">{{ customRegionButtonState.icon }}</span>
                <span class="btn-text">{{ customRegionButtonState.text }}</span>
              </button>

              <!-- Multi-Select Dropdown (only for green state) -->
              <MultiSelectDropdown
                  v-if="customRegionButtonState.color === 'green' && customRegionDropdownOpen"
                  v-model="draftCustomRegions"
                  :options="customRegionOptions"
                  :triggerEl="customRegionButtonRef"
                  :placeholder="$t('query.components.regionSelector.customRegionSelectPlaceholder')"
                  align="right"
                  direction="down"
                  @close="customRegionDropdownOpen = false"
              />
            </div>
          </div>
        </div>

        <!-- 分區列橫向滾動；確認欄保持固定，各列獨立縱向滾動。 -->
        <div ref="stageEl" class="partition-stage ui-scrollbar" @mousedown.stop>
          <div v-if="allowCustomRegions" class="custom-region-trigger" @click.stop="openCustomRegionPopup">
            <div class="custom-region-icon"><InlineIcon icon="🗂️" /></div>
            <div class="custom-region-label">{{ $t('query.components.regionSelector.myCustomRegions') }}</div>
            <div class="custom-region-arrow">→</div>
          </div>
          <div v-if="loading || error || treeLoading || treeError" class="partition-tree-state">
            {{ error || treeError || $t('common.label.loading') }}
          </div>
          <div
              v-for="(column, index) in columns"
              :key="JSON.stringify([mode, index])"
              class="partition-popup ui-scrollbar"
              :class="{ 'partition-root': index === 0 }"
              :style="{ marginTop: `${column.offset}px`, '--column-offset': `${column.offset}px` }"
          >
            <div
                v-for="item in column.nodes"
                :key="JSON.stringify([mode, item.path])"
                class="partition-line"
                :class="{ active: activePaths[index] === item.path }"
                @mouseenter="hoverNode(item, index, $event)"
            >
              <div
                  class="partition-item"
                  :class="{ chosen: draftSelected.includes(item.path) }"
                  @click="toggleLeaf(item.path)"
                  :title="item.path"
              >
                {{ item.label }}
              </div>
              <div
                  v-if="item.children.length"
                  class="partition-arrow"
                  @click.stop="hoverNode(item, index, $event, true)"
                  :title="$t('query.components.regionSelector.expandChildren')"
              >⌵</div>
            </div>
          </div>
        </div>

      </div>
    </Teleport>

    <!-- 自定義分區彈窗 -->
    <AppModal
      v-if="allowCustomRegions"
      :model-value="showCustomRegionPopup"
      size="sm"
      :title="`🗂️ ${$t('query.components.regionSelector.customRegionModal.title')}`"
      @update:modelValue="showCustomRegionPopup = false"
    >
      <div class="custom-region-content">
            <div v-if="loadingCustomRegions" class="loading">
              <div class="ui-loading--page" aria-hidden="true"></div>
              <p>{{ $t('query.components.regionSelector.customRegionModal.loading') }}</p>
            </div>

            <div v-else-if="storedCustomRegions.length === 0" class="empty-custom-regions">
              <p>{{ $t('query.components.regionSelector.customRegionModal.empty') }}</p>
              <button class="btn-create" @click="goToManagePage">
                {{ $t('query.components.regionSelector.customRegionModal.createButton') }}
              </button>
            </div>

            <div v-else class="region-list">
              <div
                v-for="region in storedCustomRegions"
                :key="region.id"
                class="region-item"
                @click="selectCustomRegion(region)"
              >
                <div class="region-name">{{ region.region_name }}</div>
                <div class="region-info">
                  {{ $t('query.components.regionSelector.customRegionModal.locationCount', { count: region.location_count || region.locations?.length || 0 }) }}
                  <span v-if="region.description" class="region-desc">
                    · {{ region.description }}
                  </span>
                </div>
              </div>
            </div>
      </div>
      <template #footer>
<!--        <div class="custom-region-footer">-->
            <button class="btn-manage" @click="goToManagePage">
              {{ $t('query.components.regionSelector.customRegionModal.manageButton') }}
            </button>
<!--        </div>-->
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getPartitions } from '@/api/index.js'
import { useAuthGuard } from '@/composables/router/useAuthGuard.js'
import { customRegionStore } from '@/main/store/customRegionStore.js'
import { userStore } from '@/main/store/store.js'
import { showError, showSuccess, showConfirm } from '@/utils/ui/message.js'
import AppModal from '@/components/common/AppModal.vue'
import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue'
import { usePartitionCache } from '@/composables/data/usePartitionCache.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { t } = useI18n()

const { getDefaultTree } = usePartitionCache()

const props = defineProps({
  mode: { type: String, required: true },
  selected: { type: Array, default: () => [] },
  customRegions: { type: Array, default: () => [] },
  nodes: { type: Array, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  allowCustomRegions: { type: Boolean, default: true },
  maxSelected: { type: Number, default: Infinity },
  maxPathLength: { type: Number, default: Infinity },
  placeholder: { type: String, default: '' }
})

const emit = defineEmits([
  'update:selected',
  'selectCustomRegion',
  'update:customRegions',
  'update:customRegionData'
])

const router = useRouter()
const { requireAuth } = useAuthGuard()

/* =========================
   Custom Region State
   ========================= */
const showCustomRegionPopup = ref(false)
// Use custom region store
const {
  customRegions: storedCustomRegions,
  loading: loadingCustomRegions,
  fetchCustomRegions
} = customRegionStore()

// New: Custom region selection state
const selectedCustomRegions = ref([])  // Committed custom regions
const draftCustomRegions = ref([])     // Draft custom regions (in popup)
const customRegionDropdownOpen = ref(false)  // Dropdown visibility
const customRegionButtonRef = ref(null)  // Button element ref for dropdown positioning

/* =========================
   UI state
   ========================= */
const popupOpen = ref(false)
const columns = ref([])
const activePaths = ref([])
const stageEl = ref(null)
const anchorEl = ref(null)
let hoverTimer = null
let hoverSequence = 0
let loadSequence = 0

function clearHover() {
  clearTimeout(hoverTimer)
  hoverSequence++
}

/* =========================
   selected
   ========================= */
const selectedLeafs = computed(() => (Array.isArray(props.selected) ? props.selected : []))
const externalCustomRegions = computed(() => (props.allowCustomRegions && Array.isArray(props.customRegions) ? props.customRegions : []))
const draftSelected = ref([])

const loadedTree = ref([])
const treeLoading = ref(false)
const treeError = ref('')
const topbarEl = ref(null)

const pathsByName = computed(() => {
  const names = new Map()
  const pending = [...loadedTree.value]
  while (pending.length) {
    const node = pending.pop()
    if (!names.has(node.label)) names.set(node.label, [])
    names.get(node.label).push(node.path)
    pending.push(...node.children)
  }
  return names
})

function regionLabel(path) {
  const parts = path.split('-')
  const matches = pathsByName.value.get(parts.at(-1)) || []
  if (!matches.includes(path)) return path
  for (let count = 1; count <= parts.length; count++) {
    const suffix = parts.slice(-count).join('-')
    if (matches.filter(candidate => candidate === suffix || candidate.endsWith('-' + suffix)).length === 1) {
      return parts.slice(-count).join('·')
    }
  }
  return parts.join('·')
}

function onDocMouseDown(e) {
  if (!popupOpen.value) return

  const t = e.target

  // Check if click is inside custom region dropdown
  const isInsideCustomDropdown =
    customRegionButtonRef.value?.contains(t) ||
    t.closest('.dropdown-panel') ||
    t.closest('.dropdown-overlay')

  const stage = stageEl.value
  const isInsideStagePanel = stage?.contains(t) &&
      t.closest('.partition-popup, .custom-region-trigger, .partition-tree-state')
  const isStageScrollbar = t === stage && stage.scrollWidth > stage.clientWidth &&
      e.clientY >= stage.getBoundingClientRect().top + stage.clientTop + stage.clientHeight

  const allow =
      topbarEl.value?.contains(t) ||
      isInsideStagePanel ||
      isStageScrollbar ||
      isInsideCustomDropdown

  if (!allow) {
    // 你现在的外部点击是"确认并关闭"，保持一致
    confirmAndClose()
  }
}

async function loadTreeFor(mode) {
  const sequence = ++loadSequence
  loadedTree.value = []
  columns.value = []
  treeError.value = ''
  if (props.nodes !== null) {
    treeLoading.value = false
    loadedTree.value = props.nodes
    if (popupOpen.value) columns.value = [{ nodes: props.nodes, offset: 0 }]
    return
  }
  treeLoading.value = true
  try {
    const tree = await getDefaultTree(mode, () => getPartitions(mode), {
      identity: JSON.stringify([userStore.role, userStore.id]),
    })
    if (sequence !== loadSequence) return
    loadedTree.value = tree.nodes
    if (popupOpen.value) columns.value = [{ nodes: tree.nodes, offset: 0 }]
  } catch (error) {
    if (sequence === loadSequence) treeError.value = error.message
  } finally {
    if (sequence === loadSequence) treeLoading.value = false
  }
}

watch(
    () => [props.mode, userStore.role, userStore.id],
    () => {
      closePopup()
      loadTreeFor(props.mode)
    },
    { immediate: true }
)

watch(() => props.nodes, () => {
  clearHover()
  activePaths.value = []
  loadTreeFor(props.mode)
})

watch(
    externalCustomRegions,
    (nextCustomRegions) => {
      selectedCustomRegions.value = [...nextCustomRegions]
      if (!popupOpen.value) {
        draftCustomRegions.value = [...nextCustomRegions]
      }
    },
    { immediate: true }
)

/* =========================
   Open/Close
   ========================= */
function openPopup() {
  clearHover()
  popupOpen.value = true
  draftSelected.value = selectedLeafs.value.slice()
  syncDraftCustomRegions()
  columns.value = [{ nodes: loadedTree.value, offset: 0 }]
  activePaths.value = []
  bindEsc()
  document.addEventListener('mousedown', onDocMouseDown, true)
  if (treeError.value) loadTreeFor(props.mode)
  if (props.allowCustomRegions && userStore.isAuthenticated && storedCustomRegions.value.length === 0) loadCustomRegions()
}

function closePopup() {
  clearHover()
  popupOpen.value = false
  columns.value = []
  activePaths.value = []
  unbindEsc()
  document.removeEventListener('mousedown', onDocMouseDown, true)
}

function togglePopup() {
  if (popupOpen.value) closePopup()
  else openPopup()
}

/* =========================
   Custom Region Functions
   ========================= */

// Button state based on user status
const customRegionButtonState = computed(() => {
  if (!userStore.isAuthenticated) {
    return {
      color: 'red',
      text: t('query.components.regionSelector.customRegionButton.notLoggedIn'),
      icon: '🔒'
    }
  }

  if (storedCustomRegions.value.length === 0) {
    return {
      color: 'blue',
      text: t('query.components.regionSelector.customRegionButton.noRegions'),
      icon: '➕'
    }
  }

  return {
    color: 'green',
    text: t('query.components.regionSelector.customRegionButton.hasRegions'),
    icon: '🗂️'
  }
})

// Custom region options for dropdown
const customRegionOptions = computed(() => {
  return storedCustomRegions.value.map(region => ({
    label: region.region_name,
    value: region.region_name,
    locations: region.locations  // Store locations for later use
  }))
})

async function loadCustomRegions() {
  // Authentication guard - prevent API calls for unauthenticated users
  if (!userStore.isAuthenticated) {
    return
  }

  try {
    await fetchCustomRegions() // Use cached version
  } catch (error) {
    showError(t('query.components.regionSelector.messages.loadCustomRegionsFailed', { message: error.message }))
  }
}

async function openCustomRegionPopup() {
  // 檢查是否登錄
  if (!userStore.isAuthenticated) {
    showError('query.components.regionSelector.messages.loginRequired')
    await requireAuth()
    return
  }

  // 加載自定義分區（使用缓存）
  try {
    await fetchCustomRegions()

    if (storedCustomRegions.value.length === 0) {
      // 沒有分區，詢問是否前往創建
      const confirmed = await showConfirm(
        t('query.components.regionSelector.messages.noCustomRegionsConfirm'),
        { confirmText: 'query.components.regionSelector.customRegionModal.createButton', cancelText: 'common.button.cancel' }
      )
      if (confirmed) {
        await router.push(buildLocalePath(resolveRouteLocale(route), '/auth/regions'))
      }
      return
    }

    showCustomRegionPopup.value = true
  } catch (error) {
    showError(t('query.components.regionSelector.messages.loadCustomRegionsFailed', { message: error.message }))
  }
}

async function selectCustomRegion(region) {
  try {
    // 獲取該分區的詳細信息（包含完整地點列表）
    // 注意：传入 regionName 参数时不使用缓存
    const data = await fetchCustomRegions(region.region_name)

    if (!data.success || data.regions.length === 0) {
      showError('query.components.regionSelector.messages.loadRegionDetailsFailed')
      return
    }

    const selectedRegion = data.regions[0]
    const locations = selectedRegion.locations // ['廣州', '佛山', '南海']

    // 關閉彈窗
    showCustomRegionPopup.value = false
    closePopup()

    // 通知父組件使用這些地點
    emit('selectCustomRegion', {
      regionName: selectedRegion.region_name,
      locations: locations
    })

    showSuccess(t('query.components.regionSelector.messages.selectedCustomRegion', { name: selectedRegion.region_name }))
  } catch (error) {
    showError(t('query.components.regionSelector.messages.selectRegionFailed', { message: error.message }))
  }
}

function goToManagePage() {
  showCustomRegionPopup.value = false
  closePopup()
  router.push(buildLocalePath(resolveRouteLocale(route), '/auth/regions'))
}

// New: Handle custom region button click
const handleCustomRegionButtonClick = async () => {
  // Red state: Not logged in → redirect to auth
  if (!userStore.isAuthenticated) {
    showError('query.components.regionSelector.messages.loginRequired')
    await requireAuth()
    return
  }

  // Blue state: No custom regions → redirect to UserRegionPage
  if (storedCustomRegions.value.length === 0) {
    await router.push(`/auth/regions?username=${userStore.username}`)
    return
  }

  // Green state: Has custom regions → toggle dropdown
  customRegionDropdownOpen.value = !customRegionDropdownOpen.value

  // Load custom regions if not loaded
  if (storedCustomRegions.value.length === 0) {
    await loadCustomRegions()
  }
}

// Remove custom region tag
const removeCustomRegion = (regionName) => {
  const index = draftCustomRegions.value.indexOf(regionName)
  if (index > -1) {
    draftCustomRegions.value.splice(index, 1)
  }
}

// Sync draft custom regions when popup opens
const syncDraftCustomRegions = () => {
  draftCustomRegions.value = [...selectedCustomRegions.value]
}

/* =========================
   Expand/Hover
   ========================= */
function hoverNode(item, index, event, immediate = false) {
  clearHover()
  const sequence = hoverSequence
  const line = event?.currentTarget?.closest?.('.partition-line')
  const top = line?.getBoundingClientRect().top ?? 0
  const stage = stageEl.value?.getBoundingClientRect()
  const style = stageEl.value ? getComputedStyle(stageEl.value) : null
  const paddingTop = parseFloat(style?.paddingTop) || 0
  const paddingBottom = parseFloat(style?.paddingBottom) || 0
  const availableHeight = (stageEl.value?.clientHeight || 0) - paddingTop - paddingBottom
  const offset = stage ? Math.max(0, Math.min(top - stage.top - paddingTop, availableHeight - 240)) : 0
  const run = () => {
    if (!popupOpen.value || sequence !== hoverSequence) return
    activePaths.value = [...activePaths.value.slice(0, index), item.path]
    columns.value = columns.value.slice(0, index + 1)
    if (item.children.length) columns.value.push({ nodes: item.children, offset })
  }
  if (immediate) run()
  else hoverTimer = setTimeout(run, 100)
}

/* =========================
   Selection（叶子字符串数组）
   ========================= */
function toggleLeaf(label) {
  const arr = draftSelected.value.slice()
  const idx = arr.indexOf(label)
  if (idx >= 0) arr.splice(idx, 1)
  else {
    if (Array.from(label).length > props.maxPathLength) {
      showError(t('query.components.regionSelector.messages.pathTooLong', { max: props.maxPathLength }))
      return
    }
    if (arr.length >= props.maxSelected) {
      showError(t('query.components.regionSelector.messages.selectionLimit', { max: props.maxSelected }))
      return
    }
    arr.push(label)
  }
  draftSelected.value = arr
}

function removeDraft(label) {
  draftSelected.value = draftSelected.value.filter(x => x !== label)
}

function clearDraft() {
  draftSelected.value = []
}

function confirmAndClose() {
  // Commit partition regions
  emit('update:selected', draftSelected.value.slice())

  // Commit custom regions (names only for tags)
  selectedCustomRegions.value = [...draftCustomRegions.value]
  emit('update:customRegions', [...draftCustomRegions.value])

  // Also emit full custom region data for location extraction
  const selectedRegionObjects = draftCustomRegions.value.map(name =>
    storedCustomRegions.value.find(r => r.region_name === name)
  ).filter(Boolean)
  emit('update:customRegionData', selectedRegionObjects)

  closePopup()
}

// ✅ 选框内删已选：立即对外生效
function removeCommitted(label) {
  const next = selectedLeafs.value.filter(x => x !== label)
  emit('update:selected', next)
  if (popupOpen.value) {
    draftSelected.value = draftSelected.value.filter(x => x !== label)
  }
}

function removeCustomRegionCommitted(regionName) {
  const next = externalCustomRegions.value.filter(x => x !== regionName)
  emit('update:customRegions', next)
  if (popupOpen.value) {
    draftCustomRegions.value = draftCustomRegions.value.filter(x => x !== regionName)
  }
}

/* =========================
   ESC
   ========================= */
function onKeydown(e) {
  if (e.key === 'Escape') closePopup()
}
function bindEsc() {
  document.addEventListener('keydown', onKeydown)
}
function unbindEsc() {
  document.removeEventListener('keydown', onKeydown)
}

onBeforeUnmount(() => {
  clearHover()
  loadSequence++
  unbindEsc()
  document.removeEventListener('mousedown', onDocMouseDown, true)
})


/* expose for template */
defineExpose({ togglePopup, openPopup, closePopup })
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$primary-dark: var(--color-primary-hover);
$success: var(--color-success);
$danger: var(--color-error-light);
$portrait-ratio: 1;

/* 选择框 */
.region-select-box {
  position: relative;
  width: 98%;
  min-height: 38px;
  max-height: 60px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 34px 8px 10px;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;

  background: var(--glass-40);
  border: 1px solid rgba(var(--color-silver-rgb), 0.45);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

  @include glass-blur(16px, 160%);

  cursor: pointer;

  &.open {
    border-color: rgba(var(--color-primary-rgb), 0.35);
    box-shadow: 0 12px 36px rgba(var(--color-primary-rgb), 0.16);
  }
}

.region-placeholder {
  overflow: hidden;
  color: var(--text-secondary);
  white-space: nowrap;
  font-size: 13px;
}

.region-caret {
  position: absolute;
  top: 50%;
  right: 10px;
  color: var(--text-dark-lighter);
  font-weight: 700;
  transform: translateY(-50%);
}

.region-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.region-tag,
.topbar-tag {
  position: relative;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;

  background: var(--glass-50);
  border: 1px solid rgba(160, 160, 160, 0.22);
  border-radius: var(--radius-pill);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);

  color: var(--text-primary);
  white-space: nowrap;
  font-size: 13px;

  &.custom-region-tag {
    background: rgba(var(--color-primary-rgb), 0.5);
    border-color: rgba(var(--color-success-rgb), 0.3);
    color: var(--text-white);
  }
}

.tag-remove {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  background: var(--glass-30);
  border: none;
  border-radius: var(--radius-sm2);
  cursor: pointer;
}

/* 全屏遮罩 */
.partition-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  @include flex-col;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.1);

  @include glass-blur(5px);
}

/* 顶部确认栏 */
.partition-topbar {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 20010;
  @include flex-col;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
  padding: 10px 12px;

  background: var(--glass-30);
  border-bottom: 1px solid var(--glass-30);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);

  @include glass-blur(14px, 160%);
}

.topbar-row {
  &-1 {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &-2 {
    width: 100%;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
}

.topbar-tags {
  flex: 1;
  max-height: 20vh;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  overflow-x: auto;
  overflow-y: auto;
}

.topbar-empty {
  flex: 1;
  color: rgba(60, 60, 60, 0.7);
  font-size: 13px;
}

.topbar-right-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.topbar-title {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
}

.topbar-count {
  margin-left: 6px;
  color: var(--text-secondary);
  font-weight: 600;
}

/* 自定义分区按钮 */
.custom-region-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &.btn-red {
    background: rgba(var(--color-error-light-rgb), 0.15);
    border: 1px solid rgba(var(--color-error-light-rgb), 0.3);
    box-shadow: 0 4px 12px rgba(var(--color-error-light-rgb), 0.15);
    color: $danger;

    @include glass-blur(12px, 180%);
  }

  &.btn-blue {
    background: rgba(var(--color-primary-rgb), 0.15);
    border: 1px solid rgba(var(--color-primary-rgb), 0.3);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.15);
    color: $primary;

    @include glass-blur(12px, 180%);
  }

  &.btn-green {
    background: rgba(var(--color-success-rgb), 0.15);
    border: 1px solid rgba(var(--color-success-rgb), 0.3);
    box-shadow: 0 4px 12px rgba(var(--color-success-rgb), 0.15);
    color: $success;

    @include glass-blur(12px, 180%);
  }

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    transform: translateY(-1px);
  }

  .btn-icon {
    font-size: 14px;
  }

  .btn-text {
    font-size: 12px;
  }
}

.topbar-right {
  flex: 0 0 auto;
  display: flex;
  gap: 10px;
  margin-left: auto;
  padding-top: 2px;
}

.topbar-btn {
  padding: 8px 12px;
  background: rgba(var(--color-primary-rgb), 0.85);
  border: 1px solid rgba(var(--color-primary-rgb), 0.35);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 26px rgba(var(--color-primary-rgb), 0.18);
  color: var(--text-white);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &.ghost {
    background: var(--glass-40);
    border-color: rgba(160, 160, 160, 0.26);
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
    color: var(--text-primary);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

/* 分区级联区域 */
.partition-stage {
  display: flex;
  flex: 1;
  min-height: 0;
  align-items: flex-start;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 12px;
}

.partition-tree-state {
  padding: 8px;
}

.partition-popup {
  z-index: 20020;
  flex: 0 0 auto;
  min-width: 80px;
  max-width: 140px;
  max-height: min(240px, calc(100% - var(--column-offset, 0px)));
  overflow-y: auto;
  box-sizing: border-box;
  @include flex-col;
  padding: 8px;

  background: var(--glass-40);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md);
  user-select: none;

  &.partition-root {
    max-height: 100%;
  }
}

.partition-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 6px;
  border-radius: var(--radius-pill);
  cursor: default;
  transition:
    background 0.2s,
    box-shadow 0.2s;

  &:hover {
    background: var(--glass-30);
    box-shadow: 0 0 6px var(--glass-60) inset;
  }

  &.active {
    background: rgba(var(--color-primary-rgb), 0.25);
    box-shadow: 0 0 8px rgba(var(--color-primary-rgb), 0.28);
  }
}

/* 末級 hover 復用激活色。 */
.partition-line:not(:has(.partition-arrow)):hover {
  background: rgba(var(--color-primary-rgb), 0.25);
  box-shadow: 0 0 8px rgba(var(--color-primary-rgb), 0.28);
}

.partition-item {
  flex: 1 1 auto;
  @include text-truncate;
  font-size: 15px;
  cursor: pointer;

  &.chosen {
    color: var(--color-primary);
    font-weight: 800;
  }
}

.partition-arrow {
  flex: 0 0 auto;
  @include flex-center;
  padding: 0 6px;

  border-radius: var(--radius-md);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
  opacity: 0.85;
  cursor: pointer;

  &:hover {
    background: var(--glass-30);
    opacity: 1;
  }
}

/* 旧入口保留，但当前隐藏 */
.custom-region-trigger {
  display: none;
}

/* 自定义分区弹窗 */
.custom-region-content {
  padding: 0;
  overflow: visible;
}

.loading {
  flex-direction: column;
  padding: 40px 20px;
  color: var(--text-tertiary);

  @include flex-center;
}

.empty-custom-regions {
  padding: 40px 20px;
  text-align: center;

  p {
    margin-bottom: 20px;
    color: var(--text-tertiary)
  }
}

.btn-create {
  padding: 10px 24px;
  background: linear-gradient(135deg, $primary, $primary-dark);
  border: none;
  border-radius: var(--radius-sm2);
  color: var(--text-white);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
    transform: translateY(-2px);
  }
}

.region-list {
  @include flex-col;
  gap: 12px;
}

.region-item {
  padding: 16px;
  background: var(--glass-90);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(var(--color-primary-rgb), 0.05);
    border-color: rgba(var(--color-primary-rgb), 0.3);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.2);
    transform: translateY(-2px);
  }
}

.region-name {
  margin-bottom: 6px;
  color: var(--text-deep);
  font-size: 16px;
  font-weight: 600;
}

.region-info {
  color: var(--text-tertiary);
  font-size: 13px;
}

.region-desc {
  color: var(--text-lightest);
}

.btn-manage {
  padding: 10px 24px;
  background: var(--glass-90);
  border: 1px solid rgba(var(--color-primary-rgb), 0.3);
  border-radius: var(--radius-sm2);
  color: $primary;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(var(--color-primary-rgb), 0.1);
  }
}

/* 竖屏 */
@media (max-aspect-ratio: $portrait-ratio) {
  .partition-item {
    font-size: 18px;
  }
}
</style>
