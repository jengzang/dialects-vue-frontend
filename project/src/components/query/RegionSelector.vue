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
      <div v-if="selectedLeafs.length" class="region-tags">
        <span
            v-for="(s, i) in selectedLeafs"
            :key="s + '_' + i"
            class="region-tag"
            :title="s"
        >
          {{ s }}
          <button class="tag-remove" type="button" @click.stop="removeCommitted(s)">×</button>
        </span>
      </div>

      <div v-else class="region-placeholder">
        {{ placeholder }}
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
              已選分區
              <span class="topbar-count">({{ draftSelected.length }})</span>
            </div>

            <div class="topbar-right">
              <button
                  class="topbar-btn ghost"
                  type="button"
                  @click="clearDraft"
                  :disabled="draftSelected.length === 0"
              >
                清空
              </button>
              <button class="topbar-btn" type="button" @click="confirmAndClose">
                確認
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
              尚未選擇分區
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
                  placeholder="選擇自定義分區"
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
            <div class="custom-region-label">我的自定義分區</div>
            <div class="custom-region-arrow">→</div>
          </div>

          <!-- lvl1 -->
          <div ref="lvl1El" class="partition-popup partition-lvl1" @mousedown.stop>
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
                  title="展開"
              >
                ⌵
              </div>
            </div>
          </div>

          <!-- lvl2：fixed，跟随 lvl1 hover 行 -->
          <div
              ref="lvl2El"
              v-if="lvl2.length"
              class="partition-popup partition-lvl2"
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
                  title="展開"
              >
                ⌵
              </div>
            </div>
          </div>

          <!-- lvl3：fixed，跟随 lvl2 hover 行 -->
          <div
              ref="lvl3El"
              v-if="lvl3.length"
              class="partition-popup partition-lvl3"
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
    <Teleport to="body">
      <div v-if="showCustomRegionPopup" class="custom-region-overlay" @click.self="showCustomRegionPopup = false">
        <div class="custom-region-popup" @mousedown.stop>
          <div class="popup-header">
            <h3>🗂️ 我的自定義分區</h3>
            <button class="close-btn" @click="showCustomRegionPopup = false">✕</button>
          </div>

          <div class="popup-content">
            <div v-if="loadingCustomRegions" class="loading">
              <div class="spinner"></div>
              <p>加載中...</p>
            </div>

            <div v-else-if="customRegions.length === 0" class="empty-custom-regions">
              <p>您還沒有創建自定義分區</p>
              <button class="btn-create" @click="goToManagePage">
                前往創建
              </button>
            </div>

            <div v-else class="region-list">
              <div
                v-for="region in customRegions"
                :key="region.id"
                class="region-item"
                @click="selectCustomRegion(region)"
              >
                <div class="region-name">{{ region.region_name }}</div>
                <div class="region-info">
                  {{ region.location_count || region.locations?.length || 0 }} 個地點
                  <span v-if="region.description" class="region-desc">
                    · {{ region.description }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="popup-footer">
            <button class="btn-manage" @click="goToManagePage">
              管理我的分區
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getPartitions, getCustomRegions } from '@/api'
import { STATIC_REGION_TREE, top_yindian } from '@/config'
import { userStore } from '@/utils/store.js'
import { showError, showSuccess, showConfirm } from '@/utils/message.js'
import MultiSelectDropdown from '@/components/common/MultiSelectDropdown.vue'

// 全局已有（你原来 Cascader 就这么用的）
const STATIC_TREE = STATIC_REGION_TREE ?? {}
const TOP_YINDIAN = top_yindian ?? []

const props = defineProps({
  mode: { type: String, required: true },
  selected: { type: Array, default: () => [] },
  placeholder: { type: String, default: '請選擇分區' }
})

const emit = defineEmits(['update:selected', 'selectCustomRegion', 'update:customRegions'])

const router = useRouter()

/* =========================
   Custom Region State
   ========================= */
const showCustomRegionPopup = ref(false)
const customRegions = ref([])
const loadingCustomRegions = ref(false)

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
    const CACHE_KEY = '__YINDIAN_TREE_CACHE__'

    // ✅ 先读缓存
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const tree = JSON.parse(cached)
        loadedTree.value = filterTopLevelKeys(tree)
        return
      } catch {
        sessionStorage.removeItem(CACHE_KEY)
      }
    }

    // ✅ 再请求后端
    const tree = await getPartitions()
    const filteredTree = filterTopLevelKeys(tree)

    sessionStorage.setItem(CACHE_KEY, JSON.stringify(filteredTree))
    loadedTree.value = filteredTree
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
    if (userStore.isAuthenticated && customRegions.value.length === 0) {
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
      text: '登錄即可自定義分區',
      icon: '🔒'
    }
  }

  if (customRegions.value.length === 0) {
    return {
      color: 'blue',
      text: '創建自定義分區',
      icon: '➕'
    }
  }

  return {
    color: 'green',
    text: '使用自定義分區',
    icon: '🗂️'
  }
})

// Custom region options for dropdown
const customRegionOptions = computed(() => {
  return customRegions.value.map(region => ({
    label: region.region_name,
    value: region.region_name,
    locations: region.locations  // Store locations for later use
  }))
})

async function loadCustomRegions() {
  if (loadingCustomRegions.value) return

  loadingCustomRegions.value = true
  try {
    const data = await getCustomRegions()
    customRegions.value = data.regions || []
  } catch (error) {
    showError('加載自定義分區失敗：' + error.message)
  } finally {
    loadingCustomRegions.value = false
  }
}

async function openCustomRegionPopup() {
  // 檢查是否登錄
  if (!userStore.isAuthenticated) {
    showError('請先登錄以使用自定義分區功能')
    await router.push('/auth?view=login')
    return
  }

  // 加載自定義分區
  loadingCustomRegions.value = true
  try {
    const data = await getCustomRegions()
    // console.log('📦 getCustomRegions 返回數據:', data)
    customRegions.value = data.regions || []
    // console.log('📊 customRegions.value.length:', customRegions.value.length)

    if (customRegions.value.length === 0) {
      // console.log('⚠️ 沒有自定義分區，準備顯示 confirm')
      // 沒有分區，詢問是否前往創建
      const confirmed = await showConfirm(
        '您還沒有創建自定義分區，是否前往創建？',
        { confirmText: '前往創建', cancelText: '取消' }
      )
      // console.log('✅ confirm 結果:', confirmed)
      if (confirmed) {
        await router.push('/auth/regions')
      }
      return
    }

    showCustomRegionPopup.value = true
  } catch (error) {
    // console.error('❌ 加載自定義分區失敗:', error)
    showError('加載自定義分區失敗：' + error.message)
  } finally {
    loadingCustomRegions.value = false
  }
}

async function selectCustomRegion(region) {
  try {
    // 獲取該分區的詳細信息（包含完整地點列表）
    const data = await getCustomRegions(region.region_name)

    if (!data.success || data.regions.length === 0) {
      showError('獲取分區詳情失敗')
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

    showSuccess(`已選擇自定義分區：${selectedRegion.region_name}`)
  } catch (error) {
    showError('選擇分區失敗：' + error.message)
  }
}

function goToManagePage() {
  showCustomRegionPopup.value = false
  closePopup()
  router.push('/auth/regions')
}

// New: Handle custom region button click
const handleCustomRegionButtonClick = async () => {
  // Red state: Not logged in → redirect to auth
  if (!userStore.isAuthenticated) {
    showError('請先登錄以使用自定義分區功能')
    await router.push('/auth?view=login')
    return
  }

  // Blue state: No custom regions → redirect to UserRegionPage
  if (customRegions.value.length === 0) {
    await router.push(`/auth/regions?username=${userStore.username}`)
    return
  }

  // Green state: Has custom regions → toggle dropdown
  customRegionDropdownOpen.value = !customRegionDropdownOpen.value

  // Load custom regions if not loaded
  if (customRegions.value.length === 0) {
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
    customRegions.value.find(r => r.region_name === name)
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

<style scoped>
/* ===== 選框（液態玻璃） ===== */
.region-select-box {
  width: 98%;
  min-height: 38px;
  border-radius: 14px;
  padding: 8px 34px 8px 10px;
  box-sizing: border-box;

  display: flex;
  gap: 8px;
  cursor: pointer;
  position: relative;

  background: rgba(255, 255, 255, 0.40);
  border: 1px solid rgba(200, 200, 200, 0.45);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.10);

  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  max-height: 60px;
  overflow-y: auto;
  overflow-x: hidden;
  align-items: flex-start;
}

/* 滚动条 */
.region-select-box::-webkit-scrollbar {
  width: 6px;
}
.region-select-box::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.18);
  border-radius: 6px;
}
.region-select-box::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 6px;
}

.region-select-box.open {
  border-color: rgba(0, 122, 255, 0.35);
  box-shadow: 0 12px 36px rgba(0, 122, 255, 0.16);
}

.region-placeholder {
  font-size: 13px;
  color: rgba(60, 60, 60, 0.72);
  white-space: nowrap;
  overflow: hidden;
}

.region-caret {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(0, 0, 0, 0.55);
  font-weight: 700;
}

.region-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.region-tag,
.topbar-tag {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 13px;
  color: rgba(25, 25, 25, 0.86);
  background: rgba(255, 255, 255, 0.48);
  border: 1px solid rgba(160, 160, 160, 0.22);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  max-width: 100%;
  white-space: nowrap;
}

.tag-remove {
  border: none;
  background: rgba(0, 0, 0, 0.06);
  width: 18px;
  height: 18px;
  border-radius: 8px;
  cursor: pointer;
  flex: 0 0 auto;
}

/* ===== Overlay ===== */
.partition-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  background: rgba(0, 0, 0, 0.10);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(4px);
  overflow: auto;
}

/* ===== 頂部確認欄 ===== */
.partition-topbar {
  position: sticky;
  top: 0;
  z-index: 20010;
  display: flex;
  flex-direction: column;
  gap: 6px;

  align-items: flex-start;
  justify-content: space-between;

  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.28);
  border-bottom: 1px solid rgba(255, 255, 255, 0.30);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);

  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
}

/* 第一行：左右对齐 */
.topbar-row-1 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* 第二行：tags 自动滚动 */
.topbar-row-2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  width: 100%;
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
  font-size: 13px;
  color: rgba(60, 60, 60, 0.70);
}

.topbar-right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.topbar-title {
  font-size: 13px;
  font-weight: 700;
  color: rgba(20, 20, 20, 0.85);
}

.topbar-count {
  font-weight: 600;
  color: rgba(20, 20, 20, 0.55);
  margin-left: 6px;
}

/* Custom region button states */
.custom-region-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.custom-region-btn.btn-red {
  background: rgba(255, 59, 48, 0.15);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 59, 48, 0.3);
  color: #ff3b30;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.15);
}

.custom-region-btn.btn-blue {
  background: rgba(0, 122, 255, 0.15);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(0, 122, 255, 0.3);
  color: #007aff;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
}

.custom-region-btn.btn-green {
  background: rgba(52, 199, 89, 0.15);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(52, 199, 89, 0.3);
  color: #34c759;
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.15);
}

.custom-region-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.custom-region-btn .btn-icon {
  font-size: 14px;
}

.custom-region-btn .btn-text {
  font-size: 12px;
}

/* Custom region tag styling */
.topbar-tag.custom-region-tag {
  background: linear-gradient(135deg, #34c759, #28a745);
  color: white;
  border: 1px solid rgba(52, 199, 89, 0.3);
}

.topbar-right {
  display: flex;
  gap: 10px;
  flex: 0 0 auto;
  padding-top: 2px;
  margin-left: auto;
}

.topbar-btn {
  border: 1px solid rgba(0, 122, 255, 0.35);
  background: rgba(0, 122, 255, 0.85);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 10px 26px rgba(0, 122, 255, 0.18);
}

.topbar-btn.ghost {
  background: rgba(255, 255, 255, 0.42);
  color: rgba(20, 20, 20, 0.82);
  border: 1px solid rgba(160, 160, 160, 0.26);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
}

.topbar-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ===== Stage（lvl1 在流式；lvl2/lvl3 fixed 浮层） ===== */
.partition-stage {
  padding: 12px;
  display: flex;
}

/* ===== 三级容器：仍保留你的玻璃风格 ===== */
.partition-popup {
  min-width: 80px;
  max-width: 140px;

  background: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.30);
  border-radius: 12px;

  padding: 8px;
  display: flex;
  flex-direction: column;
  user-select: none;

  z-index: 20020; /* ✅ 确保在 overlay 内但不被 topbar 压住（topbar 更高） */
}

/* ✅ 兜底：lvl2/lvl3 固定定位（真正跟随靠 :style 写 top/left） */
.partition-popup.partition-lvl2,
.partition-popup.partition-lvl3 {
  position: fixed;
  max-height: 240px;
  overflow-y: auto;
}

.partition-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 6px;
  border-radius: 999px;
  cursor: default;
  transition: background 0.2s, box-shadow 0.2s;
}

.partition-line:hover {
  background: rgba(255, 255, 255, 0.28);
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.55) inset;
}

.partition-line.active {
  background: rgba(180, 223, 244, 0.72);
  box-shadow: 0 0 8px rgba(0, 122, 255, 0.28);
}

.partition-item {
  flex: 1 1 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  font-size: 15px;
}

@media (max-aspect-ratio: 1/1)  {
  .partition-item {
    font-size: 18px;
  }
}

.partition-item.chosen {
  font-weight: 800;
  color: rgba(0, 60, 140, 0.92);
}

.partition-arrow {
  flex: 0 0 auto;
  font-size: 13px;
  color: rgba(0, 0, 139, 0.85);
  font-weight: 700;
  opacity: 0.85;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0 6px;
  border-radius: 10px;
  cursor: pointer;
}

.partition-arrow:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
}

/* Custom Region Trigger */
.custom-region-trigger {
  display: none;  /* Hide old button - moved to topbar-row-2 */
}

/* Custom Region Popup */
.custom-region-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.custom-region-popup {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 18px;
  color: #666;
}

.close-btn:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.popup-content {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 122, 255, 0.2);
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-custom-regions {
  text-align: center;
  padding: 40px 20px;
}

.empty-custom-regions p {
  color: #666;
  margin-bottom: 20px;
}

.btn-create {
  padding: 10px 24px;
  background: linear-gradient(135deg, #007aff, #0051d5);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.region-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.region-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.region-item:hover {
  background: rgba(0, 122, 255, 0.05);
  border-color: rgba(0, 122, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
}

.region-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 6px;
}

.region-info {
  font-size: 13px;
  color: #666;
}

.region-desc {
  color: #999;
}

.popup-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
}

.btn-manage {
  padding: 10px 24px;
  background: rgba(255, 255, 255, 0.9);
  color: #007aff;
  border: 1px solid rgba(0, 122, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.btn-manage:hover {
  background: rgba(0, 122, 255, 0.1);
}

</style>
