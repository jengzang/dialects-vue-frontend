<template>
  <div class="region-select">
    <!-- ✅ 選框（點擊打開三級分區） -->
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
          {{ s }}
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

    <!-- ✅ 彈出三級分區（全局玻璃） -->
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
                {{ s }}
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
            <div class="topbar-right-actions">
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

        <!-- ✅ Stage：lvl1 仍放在文档流；lvl2/lvl3 以 fixed 浮層跟随 -->
        <div class="partition-stage">
          <!-- 自定義分區觸發按鈕 -->
          <div class="custom-region-trigger" @click.stop="openCustomRegionPopup">
            <div class="custom-region-icon">🗂️</div>
            <div class="custom-region-label">{{ $t('query.components.regionSelector.myCustomRegions') }}</div>
            <div class="custom-region-arrow">→</div>
          </div>

          <!-- lvl1 -->
          <div ref="lvl1El" class="partition-popup partition-lvl1 ui-scrollbar" @mousedown.stop>
            <div
                v-for="item in lvl1"
                :key="'l1_' + item.label"
                class="partition-line"
                :class="{ active: activeL1 === item.label }"
                @mouseenter="onHoverL1(item, $event)"
            >
              <!-- ✅ 點擊=選擇（lvl1 也允許） -->
              <div
                  class="partition-item"
                  :class="{ chosen: draftSelected.includes(item.label) }"
                  @click="toggleLeaf(item.label)"
                  :title="item.label"
              >
                {{ item.label }}
              </div>

              <!-- ✅ 箭頭只負責展開，不再影響選擇 -->
              <div
                  v-if="item.hasChildren"
                  class="partition-arrow"
                  @click.stop="expand(item, 1, $event)"
                  :title="$t('query.components.regionSelector.expandChildren')"
              >
                ⌵
              </div>
            </div>
          </div>

          <!-- lvl2：fixed，跟随 lvl1 hover 行 -->
          <div
              ref="lvl2El"
              v-if="lvl2.length"
              class="partition-popup partition-lvl2 ui-scrollbar"
              :style="lvl2Pos"
              @mousedown.stop
          >
            <div
                v-for="item in lvl2"
                :key="'l2_' + item.label"
                class="partition-line"
                :class="{ active: activeL2 === item.label }"
                @mouseenter="onHoverL2(item, $event)"
            >
              <!-- ✅ 點擊=選擇（lvl2 也允許） -->
              <div
                  class="partition-item"
                  :class="{ chosen: draftSelected.includes(item.label) }"
                  @click="toggleLeaf(item.label)"
                  :title="item.label"
              >
                {{ item.label }}
              </div>

              <div
                  v-if="item.hasChildren"
                  class="partition-arrow"
                  @click.stop="expand(item, 2, $event)"
                  :title="$t('query.components.regionSelector.expandChildren')"
              >
                ⌵
              </div>
            </div>
          </div>

          <!-- lvl3：fixed，跟随 lvl2 hover 行 -->
          <div
              ref="lvl3El"
              v-if="lvl3.length"
              class="partition-popup partition-lvl3 ui-scrollbar"
              :style="lvl3Pos"
              @mousedown.stop
          >
            <div
                v-for="item in lvl3"
                :key="'l3_' + item.label"
                class="partition-line"
            >
              <!-- lvl3 點擊=選擇 -->
              <div
                  class="partition-item"
                  :class="{ chosen: draftSelected.includes(item.label) }"
                  @click="toggleLeaf(item.label)"
                  :title="item.label"
              >
                {{ item.label }}
              </div>
            </div>
          </div>
        </div>

      </div>
    </Teleport>

    <!-- 自定義分區彈窗 -->
    <AppModal
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
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getPartitions } from '@/api/index.js'
import { useAuthGuard } from '@/composables/router/useAuthGuard.js'
import { useCustomRegionStore } from '@/main/store/customRegionStore.js'
import { userStore } from '@/main/store/store.js'
import { showError, showSuccess, showConfirm } from '@/utils/message.js'
import AppModal from '@/components/common/AppModal.vue'
import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue'
import {STATIC_REGION_TREE, top_yindian} from "@/main/config/RegionTree.js";
import { usePartitionCache } from '@/composables/domain/usePartitionCache.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { t } = useI18n()

// 全局已有（你原来 Cascader 就这么用的）
const STATIC_TREE = STATIC_REGION_TREE ?? {}
const TOP_YINDIAN = top_yindian ?? []
const { getYindianTree } = usePartitionCache()

const props = defineProps({
  mode: { type: String, required: true },
  selected: { type: Array, default: () => [] },
  customRegions: { type: Array, default: () => [] },
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
} = useCustomRegionStore()

// New: Custom region selection state
const selectedCustomRegions = ref([])  // Committed custom regions
const draftCustomRegions = ref([])     // Draft custom regions (in popup)
const customRegionDropdownOpen = ref(false)  // Dropdown visibility
const customRegionButtonRef = ref(null)  // Button element ref for dropdown positioning

/* =========================
   UI state
   ========================= */
const popupOpen = ref(false)
const lvl1 = ref([])
const lvl2 = ref([])
const lvl3 = ref([])
const activeL1 = ref('')
const activeL2 = ref('')
let hoverTimer = null

const anchorEl = ref(null)

/* =========================
   ✅ fixed 定位所需：lvl1 容器 ref + lvl2/lvl3 position
   ========================= */
const lvl1El = ref(null)
const lvl2Pos = ref({ position: 'fixed', left: '0px', top: '0px' })
const lvl3Pos = ref({ position: 'fixed', left: '0px', top: '0px' })

/* =========================
   selected
   ========================= */
const selectedLeafs = computed(() => (Array.isArray(props.selected) ? props.selected : []))
const externalCustomRegions = computed(() => (Array.isArray(props.customRegions) ? props.customRegions : []))
const draftSelected = ref([])

/* =========================
   ✅ 你的原逻辑：加载整棵树（map/yindian）
   ========================= */
const loadedTree = ref({}) // 当前 mode 对应的 tree（对象结构）

function filterTopLevelKeys(obj) {
  if (typeof obj !== 'object' || Array.isArray(obj) || obj === null) {
    console.warn('[Yindian Tree] invalid tree:', obj)
    return {}
  }
  const filtered = {}
  for (const key of TOP_YINDIAN) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      filtered[key] = obj[key]
    }
  }
  return filtered
}
const topbarEl = ref(null)
const lvl2El = ref(null)
const lvl3El = ref(null)

function onDocMouseDown(e) {
  if (!popupOpen.value) return

  const t = e.target

  // Check if click is inside custom region dropdown
  const isInsideCustomDropdown =
    customRegionButtonRef.value?.contains(t) ||
    t.closest('.dropdown-panel') ||
    t.closest('.dropdown-overlay')

  const allow =
      topbarEl.value?.contains(t) ||
      lvl1El.value?.contains(t) ||
      lvl2El.value?.contains(t) ||
      lvl3El.value?.contains(t) ||
      isInsideCustomDropdown

  if (!allow) {
    // 你现在的外部点击是"确认并关闭"，保持一致
    confirmAndClose()
  }
}

async function loadTreeFor(mode) {
  loadedTree.value = {};

  if (mode === 'map') {
    loadedTree.value = STATIC_TREE || {}
    return
  }

  if (mode === 'yindian') {
    loadedTree.value = await getYindianTree(() => getPartitions(), {
      transform: filterTopLevelKeys,
    })
  }
}

watch(
    () => props.mode,
    async (m) => {
      closePopup()
      await loadTreeFor(m)
    },
    { immediate: true }
)

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
   Tree helpers（从对象树取 children）
   ========================= */
function nodeHasChildren(node) {
  if (!node) return false
  if (Array.isArray(node)) return node.length > 0
  if (typeof node === 'object') return Object.keys(node).length > 0
  return false
}

function getChildrenFromTree(tree, parentLabel) {
  if (!tree || typeof tree !== 'object') return []

  function search(node) {
    if (!node || typeof node !== 'object') return null
    if (Array.isArray(node)) return null
    for (const key of Object.keys(node)) {
      if (key === parentLabel) return node[key]
      const found = search(node[key])
      if (found !== null) return found
    }
    return null
  }

  if (parentLabel === null) {
    return Object.keys(tree).map(k => ({
      label: k,
      hasChildren: nodeHasChildren(tree[k])
    }))
  }

  const childrenNode = search(tree)
  if (!childrenNode) return []

  if (Array.isArray(childrenNode)) {
    return childrenNode.map(k => ({ label: k, hasChildren: false }))
  }
  if (typeof childrenNode === 'object') {
    return Object.keys(childrenNode).map(k => ({
      label: k,
      hasChildren: nodeHasChildren(childrenNode[k])
    }))
  }
  return []
}

function getChildren(parentLabel) {
  return getChildrenFromTree(loadedTree.value, parentLabel)
}

/* =========================
   ✅ 定位钳制：模仿你原生版用 lvl1 首尾 item 作为上下锚点
   ========================= */
function clampPopupTopByLvl1(popupTop, popupHeight = 240) {
  const host = lvl1El.value
  if (!host) return popupTop

  const lines = host.querySelectorAll('.partition-line')
  if (!lines.length) return popupTop

  const firstRect = lines[0].getBoundingClientRect()
  const lastRect = lines[lines.length - 1].getBoundingClientRect()

  const anchorTop = firstRect.top
  const anchorBottom = lastRect.bottom

  if (popupTop + popupHeight > anchorBottom) popupTop = anchorBottom - popupHeight
  if (popupTop < anchorTop) popupTop = anchorTop

  popupTop = Math.max(popupTop, 0)
  popupTop = Math.min(popupTop, window.innerHeight - popupHeight)
  return popupTop
}

/* =========================
   Open/Close
   ========================= */
async function openPopup() {
  // ✅ 若 tree 还没加载完（或为空），先加载一次
  if (!loadedTree.value || Object.keys(loadedTree.value).length === 0) {
    await loadTreeFor(props.mode)
  }
  popupOpen.value = true
  draftSelected.value = selectedLeafs.value.slice()

  lvl1.value = getChildren(null)
  lvl2.value = []
  lvl3.value = []
  activeL1.value = ''
  activeL2.value = ''

  bindEsc()
  document.addEventListener('mousedown', onDocMouseDown, true)
}

function closePopup() {
  popupOpen.value = false
  lvl1.value = []
  lvl2.value = []
  lvl3.value = []
  activeL1.value = ''
  activeL2.value = ''
  unbindEsc()
  document.removeEventListener('mousedown', onDocMouseDown, true)
}

function togglePopup() {
  if (popupOpen.value) {
    closePopup()
  } else {
    popupOpen.value = true
    draftSelected.value = selectedLeafs.value.slice()
    syncDraftCustomRegions()  // Sync custom regions

    lvl1.value = getChildren(null)
    lvl2.value = []
    lvl3.value = []
    activeL1.value = ''
    activeL2.value = ''

    bindEsc()
    document.addEventListener('mousedown', onDocMouseDown, true)

    // Load custom regions if authenticated
    if (userStore.isAuthenticated && storedCustomRegions.value.length === 0) {
      loadCustomRegions()
    }
  }
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
function expand(item, level, e) {
  if (!item?.hasChildren) return

  // ✅ 用箭头所在的 .partition-line 作为展开基准
  const lineEl = e?.currentTarget?.closest?.('.partition-line')
  const fakeEvent = lineEl ? { currentTarget: lineEl } : null

  // ✅ 关键：清掉两层 hover 定时器，并且让两层的旧 hover 全部失效
  clearTimeout(hoverTimerL1)
  clearTimeout(hoverTimerL2)
  hoverSeqL1++
  hoverSeqL2++

  if (level === 1) onHoverL1(item, fakeEvent, true)
  if (level === 2) onHoverL2(item, fakeEvent, true)
}

let hoverTimerL1 = null
let hoverTimerL2 = null
let hoverSeqL1 = 0
let hoverSeqL2 = 0


function onHoverL1(item, e, immediate = false) {
  const seq = ++hoverSeqL1
  clearTimeout(hoverTimerL1)

  const rect = e?.currentTarget?.getBoundingClientRect?.()
  const popupLeft = rect ? rect.right : null
  const rawTop = rect ? rect.top : null

  const run = () => {
    if (seq !== hoverSeqL1) return

    activeL1.value = item.label
    lvl2.value = getChildren(item.label)
    lvl3.value = []
    activeL2.value = ''

    if (popupLeft != null && rawTop != null) {
      const popupTop = clampPopupTopByLvl1(rawTop, 240)
      lvl2Pos.value = { position: 'fixed', left: `${popupLeft}px`, top: `${popupTop}px` }
    }
  }

  if (immediate) return run()
  hoverTimerL1 = setTimeout(run, 100)
}


function onHoverL2(item, e, immediate = false) {
  const seq = ++hoverSeqL2
  clearTimeout(hoverTimerL2)

  const rect = e?.currentTarget?.getBoundingClientRect?.()
  const popupLeft = rect ? rect.right : null
  const rawTop = rect ? rect.top : null

  const run = () => {
    if (seq !== hoverSeqL2) return

    activeL2.value = item.label
    lvl3.value = getChildren(item.label)

    if (popupLeft != null && rawTop != null) {
      const popupTop = clampPopupTopByLvl1(rawTop, 240)
      lvl3Pos.value = { position: 'fixed', left: `${popupLeft}px`, top: `${popupTop}px` }
    }
  }

  if (immediate) return run()
  hoverTimerL2 = setTimeout(run, 100)
}



/* =========================
   Selection（叶子字符串数组）
   ========================= */
function toggleLeaf(label) {
  const arr = draftSelected.value.slice()
  const idx = arr.indexOf(label)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(label)
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
  clearTimeout(hoverTimerL1)
  clearTimeout(hoverTimerL2)
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
$portrait-ratio: 1 / 1;/* 选择框 */
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
  color: rgba(60, 60, 60, 0.72);
  white-space: nowrap;
  font-size: 13px;
}

.region-caret {
  position: absolute;
  top: 50%;
  right: 10px;
  color: rgba(0, 0, 0, 0.55);
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

  color: rgba(25, 25, 25, 0.86);
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
  background: rgba(0, 0, 0, 0.06);
  border: none;
  border-radius: var(--radius-sm2);
  cursor: pointer;
}

/* 全屏遮罩 */
.partition-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  overflow: auto;
  background: rgba(0, 0, 0, 0.1);

  @include glass-blur(5px);
}

/* 顶部确认栏 */
.partition-topbar {
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
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  overflow-x: auto;
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
  color: rgba(20, 20, 20, 0.85);
  font-size: 13px;
  font-weight: 700;
}

.topbar-count {
  margin-left: 6px;
  color: rgba(20, 20, 20, 0.55);
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
    color: rgba(20, 20, 20, 0.82);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

/* 分区级联区域 */
.partition-stage {
  display: flex;
  padding: 12px;
}

.partition-popup {
  z-index: 20020;
  min-width: 80px;
  max-width: 140px;
  @include flex-col;
  padding: 8px;

  background: var(--glass-40);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md);
  user-select: none;

  &.partition-lvl2,
  &.partition-lvl3 {
    position: fixed;
    max-height: 240px;
    overflow-y: auto;
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
    background: rgba(180, 223, 244, 0.72);
    box-shadow: 0 0 8px rgba(var(--color-primary-rgb), 0.28);
  }
}

.partition-item {
  flex: 1 1 auto;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 15px;
  cursor: pointer;

  &.chosen {
    color: rgba(0, 60, 140, 0.92);
    font-weight: 800;
  }
}

.partition-arrow {
  flex: 0 0 auto;
  @include flex-center;
  padding: 0 6px;

  border-radius: var(--radius-md);
  color: rgba(0, 0, 139, 0.85);
  font-size: 13px;
  font-weight: 700;
  opacity: 0.85;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
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
