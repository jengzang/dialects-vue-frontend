<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  visibleCount: {
    type: Number,
    default: 15
  },
  itemOrder: {
    type: String,
    default: 'source'
  },
  followId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['jump'])

const hoverId = ref('')
const activeId = ref('')
const centerIndex = ref(0)

// 自然滾動參數
// 數值越大，滾動越慢；數值越小，滾動越快
const WHEEL_THRESHOLD = 90

// 兩次換項之間的最小間隔，防止觸控板慣性連續飛過很多項
const WHEEL_STEP_COOLDOWN_MS = 90

// 停止滾動一小段時間後，清空累積量
const WHEEL_IDLE_RESET_MS = 180

let wheelDeltaBuffer = 0
let wheelResetTimer = null
let lastWheelMoveAt = 0

const orderedItems = computed(() => {
  if (props.itemOrder === 'pinyin') {
    return [...props.items].sort((a, b) => {
      return a.fullLabel.localeCompare(b.fullLabel, 'zh-Hans-CN-u-co-pinyin')
    })
  }

  return props.items
})

const totalItems = computed(() => orderedItems.value.length)

const toOdd = (value) => {
  const count = Math.max(1, Number(value) || 1)
  return count % 2 === 0 ? count + 1 : count
}

const visibleSlotCount = computed(() => {
  if (totalItems.value <= 0) return 0

  const configuredOdd = toOdd(props.visibleCount)
  const usefulOdd = toOdd(totalItems.value)

  // 地點少時，不顯示一大堆空占位；地點多時，最多顯示 visibleCount 個窗口位
  return Math.min(configuredOdd, usefulOdd)
})

const middleVisibleIndex = computed(() => Math.floor(visibleSlotCount.value / 2))

const canMove = computed(() => totalItems.value > 1)
const canMovePrev = computed(() => centerIndex.value > 0)
const canMoveNext = computed(() => centerIndex.value < totalItems.value - 1)

const clampCenterIndex = (value) => {
  if (totalItems.value <= 0) return 0
  return Math.min(totalItems.value - 1, Math.max(0, value))
}

const centerItem = computed(() => orderedItems.value[centerIndex.value] || null)

const visibleSlots = computed(() => {
  const slots = []
  const count = visibleSlotCount.value
  const middle = middleVisibleIndex.value

  for (let slotIndex = 0; slotIndex < count; slotIndex += 1) {
    const offset = slotIndex - middle
    const itemIndex = centerIndex.value + offset
    const item = orderedItems.value[itemIndex] || null
    const depth = Math.min(4, Math.abs(offset))

    slots.push({
      slotIndex,
      offset,
      itemIndex,
      item,
      depth,
      isCenter: offset === 0,
      isPlaceholder: !item
    })
  }

  return slots
})

const resetWheelBuffer = () => {
  wheelDeltaBuffer = 0

  if (wheelResetTimer) {
    clearTimeout(wheelResetTimer)
    wheelResetTimer = null
  }
}

const resetWheelBufferLater = () => {
  if (wheelResetTimer) {
    clearTimeout(wheelResetTimer)
  }

  wheelResetTimer = window.setTimeout(() => {
    wheelDeltaBuffer = 0
    wheelResetTimer = null
  }, WHEEL_IDLE_RESET_MS)
}

const normalizeWheelDelta = (event) => {
  // deltaMode:
  // 0 = pixel，多數觸控板 / 現代瀏覽器
  // 1 = line，部分滑鼠
  // 2 = page，極少見
  if (event.deltaMode === 1) {
    return event.deltaY * 16
  }

  if (event.deltaMode === 2) {
    return event.deltaY * window.innerHeight
  }

  return event.deltaY
}

const getWheelStep = (event) => {
  wheelDeltaBuffer += normalizeWheelDelta(event)

  if (Math.abs(wheelDeltaBuffer) < WHEEL_THRESHOLD) {
    return 0
  }

  const now = Date.now()

  if (now - lastWheelMoveAt < WHEEL_STEP_COOLDOWN_MS) {
    return 0
  }

  const step = wheelDeltaBuffer > 0 ? 1 : -1

  // 只消費一格，不保留過大的慣性殘留
  wheelDeltaBuffer = 0
  lastWheelMoveAt = now

  return step
}

const moveCenter = (delta) => {
  if (!canMove.value) return

  const nextIndex = clampCenterIndex(centerIndex.value + delta)

  if (nextIndex === centerIndex.value) return

  centerIndex.value = nextIndex
  hoverId.value = ''
}

const moveCenterToItem = (id) => {
  const index = orderedItems.value.findIndex((item) => item.id === id)
  if (index < 0) return

  centerIndex.value = clampCenterIndex(index)
}

const jumpToNav = async (nav) => {
  if (!nav) return

  activeId.value = nav.id
  hoverId.value = nav.id
  moveCenterToItem(nav.id)

  await nextTick()
  emit('jump', nav)
}

const jumpCenter = async () => {
  if (!centerItem.value) return
  await jumpToNav(centerItem.value)
}

const handleWheel = (event) => {
  if (!canMove.value) return

  const step = getWheelStep(event)

  if (step !== 0) {
    moveCenter(step)
  }

  resetWheelBufferLater()
  event.preventDefault()
}

const handleKeydown = async (event) => {
  if (event.key === 'ArrowDown') {
    moveCenter(1)
    resetWheelBuffer()
    event.preventDefault()
    return
  }

  if (event.key === 'ArrowUp') {
    moveCenter(-1)
    resetWheelBuffer()
    event.preventDefault()
    return
  }

  if (event.key === 'PageDown') {
    moveCenter(Math.max(1, middleVisibleIndex.value))
    resetWheelBuffer()
    event.preventDefault()
    return
  }

  if (event.key === 'PageUp') {
    moveCenter(-Math.max(1, middleVisibleIndex.value))
    resetWheelBuffer()
    event.preventDefault()
    return
  }

  if (event.key === 'Home') {
    centerIndex.value = 0
    resetWheelBuffer()
    event.preventDefault()
    return
  }

  if (event.key === 'End') {
    centerIndex.value = clampCenterIndex(totalItems.value - 1)
    resetWheelBuffer()
    event.preventDefault()
    return
  }

  if (event.key === 'Enter' || event.key === ' ') {
    await jumpCenter()
    event.preventDefault()
  }
}

const handleItemEnter = (nav) => {
  hoverId.value = nav.id
}

const handleItemLeave = (nav) => {
  if (hoverId.value === nav.id) {
    hoverId.value = ''
  }
}

const handleItemClick = async (nav) => {
  await jumpToNav(nav)
}

watch(
  () => orderedItems.value,
  (nextItems) => {
    if (!nextItems.some((item) => item.id === activeId.value)) {
      activeId.value = ''
    }

    if (!nextItems.some((item) => item.id === hoverId.value)) {
      hoverId.value = ''
    }

    centerIndex.value = clampCenterIndex(centerIndex.value)
    resetWheelBuffer()
  },
  { deep: true }
)

watch(activeId, (value) => {
  if (value) {
    moveCenterToItem(value)
  }
})

watch(
  () => props.followId,
  (value) => {
    if (value) {
      moveCenterToItem(value)
    }
  }
)

onBeforeUnmount(() => {
  resetWheelBuffer()
})
</script>

<template>
  <Teleport to="body">
    <nav
      v-if="items.length > 0"
      class="count-location-jump-nav"
      tabindex="0"
      :aria-label="t('phonology.phonology.countphos.nav.navLabel')"
      @wheel="handleWheel"
      @keydown="handleKeydown"
    >
      <button
        v-if="canMove"
        type="button"
        class="count-location-jump-nav-control count-location-jump-nav-control--up"
        :class="{ disabled: !canMovePrev }"
        :disabled="!canMovePrev"
        :aria-label="t('phonology.phonology.countphos.nav.scrollUp')"
        @click="moveCenter(-1)"
      >
        <span aria-hidden="true">⌃</span>
      </button>

      <div class="count-location-jump-nav-items">
        <template
          v-for="slot in visibleSlots"
          :key="slot.item ? slot.item.id : `placeholder-${slot.slotIndex}-${slot.itemIndex}`"
        >
          <div
            v-if="slot.isPlaceholder"
            class="count-location-jump-nav-placeholder"
            :class="`depth-${slot.depth}`"
            aria-hidden="true"
          ></div>

          <button
            v-else
            type="button"
            class="count-location-jump-nav-item"
            :class="[
              `depth-${slot.depth}`,
              {
                'is-center': slot.isCenter,
                'is-hovered': hoverId === slot.item.id,
                'is-active': activeId === slot.item.id
              }
            ]"
            :aria-label="slot.item.fullLabel"
            :aria-current="activeId === slot.item.id ? 'true' : undefined"
            :title="slot.item.fullLabel"
            @mouseenter="handleItemEnter(slot.item)"
            @mouseleave="handleItemLeave(slot.item)"
            @focus="handleItemEnter(slot.item)"
            @blur="handleItemLeave(slot.item)"
            @click="handleItemClick(slot.item)"
          >
            <span class="count-location-jump-nav-label">
              <span class="count-location-jump-nav-text">
                {{ slot.item.fullLabel }}
              </span>
            </span>

            <span class="count-location-jump-nav-dot" aria-hidden="true"></span>
          </button>
        </template>
      </div>

      <button
        v-if="canMove"
        type="button"
        class="count-location-jump-nav-control count-location-jump-nav-control--down"
        :class="{ disabled: !canMoveNext }"
        :disabled="!canMoveNext"
        :aria-label="t('phonology.phonology.countphos.nav.scrollDown')"
        @click="moveCenter(1)"
      >
        <span aria-hidden="true">⌄</span>
      </button>
    </nav>
  </Teleport>
</template>


$primary: var(--color-primary);
$primary-dark: var(--color-primary-hover);
$primary-deep: #004fc4;

$desktop-width: 214px;
$tablet-width: 176px;
$mobile-width: 150px;

@mixin glass-blur($blur, $saturation) {
  backdrop-filter: blur($blur) saturate($saturation);
  -webkit-backdrop-filter: blur($blur) saturate($saturation);
}

.count-location-jump-nav {
  position: fixed;
  top: 50%;
  right: 10px;
  z-index: 1600;
  width: $desktop-width;
  max-height: min(82vh, 620px);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  outline: none;
  pointer-events: none;
  transform: translateY(-50%);

  .count-location-jump-nav-control,
  .count-location-jump-nav-item {
    pointer-events: auto;
  }

  /* 上下控制按钮 */
  .count-location-jump-nav-control {
    width: 30px;
    height: 30px;
    margin-right: 5px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(0, 122, 255, 0.14);
    border-radius: 999px;
    box-shadow:
      0 8px 18px rgba(24, 38, 64, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.78);
    color: var(--color-primary);
    font-size: 18px;
    font-weight: 800;
    line-height: 1;
    cursor: pointer;

    @include glass-blur(14px, 150%);

    transition:
      transform 0.18s ease,
      opacity 0.18s ease,
      background 0.18s ease,
      box-shadow 0.18s ease;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.92);
      box-shadow:
        0 10px 22px rgba(24, 38, 64, 0.14),
        0 4px 10px rgba(0, 122, 255, 0.1);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &.disabled,
    &:disabled {
      opacity: 0.28;
      box-shadow: none;
      cursor: not-allowed;
    }
  }

  .count-location-jump-nav-control--down {
    &:hover:not(:disabled) {
      transform: translateY(1px);
    }
  }

  /* 导航项目容器 */
  .count-location-jump-nav-items {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    overflow: visible;

    &::before {
      content: '';
      position: absolute;
      top: 4px;
      right: 7px;
      bottom: 4px;
      width: 20px;
      background:
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.52),
          rgba(255, 255, 255, 0.24)
        ),
        rgba(240, 246, 255, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.44);
      border-radius: 999px;
      box-shadow:
        0 12px 30px rgba(24, 38, 64, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.72);
      pointer-events: none;

      @include glass-blur(16px, 160%);
    }
  }

  .count-location-jump-nav-placeholder,
  .count-location-jump-nav-item {
    position: relative;
    flex: 0 0 auto;
    width: 42px;
    height: 26px;
  }

  /* 边界占位项 */
  .count-location-jump-nav-placeholder {
    visibility: hidden;
    pointer-events: none;

    &.depth-0 {
      height: 36px;
    }

    &.depth-1 {
      height: 30px;
    }

    &.depth-2 {
      height: 26px;
    }

    &.depth-3,
    &.depth-4 {
      height: 22px;
    }
  }

  /* 可交互地点项 */
  .count-location-jump-nav-item {
    padding: 0;
    overflow: visible;
    background: transparent;
    border: none;
    border-radius: 999px;
    text-align: right;
    cursor: pointer;

    transition:
      width 0.2s ease,
      height 0.2s ease,
      transform 0.2s ease,
      opacity 0.2s ease;

    &:hover,
    &:focus-visible,
    &.is-hovered,
    &.is-center {
      width: 198px;

      .count-location-jump-nav-label {
        opacity: 1;
        transform: translateY(-50%) translateX(0);
      }
    }

    &:focus-visible {
      outline: none;

      .count-location-jump-nav-dot {
        box-shadow:
          0 0 0 5px rgba(0, 122, 255, 0.18),
          0 4px 12px rgba(0, 122, 255, 0.2);
      }
    }

    &.is-center {
      z-index: 3;
      height: 36px;
      opacity: 1;

      .count-location-jump-nav-label {
        max-width: 158px;
        padding: 7px 12px;
        background: rgba(255, 255, 255, 0.9);
        border-color: rgba(0, 122, 255, 0.18);
        box-shadow:
          0 12px 26px rgba(24, 38, 64, 0.14),
          0 5px 12px rgba(0, 122, 255, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.82);
      }

      .count-location-jump-nav-text {
        max-width: 134px;
        color: var(--color-primary);
        font-size: 14px;
        font-weight: 800;
      }

      .count-location-jump-nav-dot {
        right: 8px;
        width: 14px;
        height: 14px;
        margin-top: -7px;
        background: linear-gradient(135deg, $primary, $primary-deep);
        box-shadow:
          0 0 0 6px rgba(0, 122, 255, 0.16),
          0 6px 16px rgba(0, 122, 255, 0.24);
      }
    }

    &.is-active:not(.is-center) {
      .count-location-jump-nav-dot {
        background: linear-gradient(135deg, $primary-dark, var(--color-primary-hover));
        box-shadow:
          0 0 0 4px rgba(0, 122, 255, 0.16),
          0 4px 12px rgba(0, 122, 255, 0.18);
      }
    }

    &.depth-0 {
      opacity: 1;
    }

    &.depth-1 {
      height: 30px;
      opacity: 0.84;

      .count-location-jump-nav-dot {
        right: 10px;
        width: 10px;
        height: 10px;
        margin-top: -5px;
      }
    }

    &.depth-2 {
      height: 26px;
      opacity: 0.62;

      .count-location-jump-nav-dot {
        right: 11px;
        width: 8px;
        height: 8px;
        margin-top: -4px;
      }
    }

    &.depth-3 {
      height: 22px;
      opacity: 0.42;

      .count-location-jump-nav-dot {
        right: 12px;
        width: 6px;
        height: 6px;
        margin-top: -3px;
      }
    }

    &.depth-4 {
      height: 22px;
      opacity: 0.24;

      .count-location-jump-nav-dot {
        right: 12.5px;
        width: 5px;
        height: 5px;
        margin-top: -2.5px;
      }
    }

    &:hover {
      z-index: 4;
      opacity: 1;

      .count-location-jump-nav-dot {
        box-shadow:
          0 0 0 4px rgba(0, 122, 255, 0.16),
          0 4px 12px rgba(0, 122, 255, 0.2);
        transform: scale(1.16);
      }
    }
  }

  /* 展开的地点名称 */
  .count-location-jump-nav-label {
    position: absolute;
    top: 50%;
    right: 30px;
    max-width: 150px;
    padding: 5px 10px;
    opacity: 0;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(0, 122, 255, 0.12);
    border-radius: 999px;
    box-shadow:
      0 8px 20px rgba(24, 38, 64, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.78);
    pointer-events: none;
    transform: translateY(-50%) translateX(8px);

    @include glass-blur(14px, 150%);

    transition:
      opacity 0.16s ease,
      transform 0.2s ease,
      padding 0.2s ease,
      background 0.2s ease,
      box-shadow 0.2s ease;
  }

  .count-location-jump-nav-text {
    display: block;
    max-width: 128px;
    overflow: hidden;
    color: var(--text-dark);
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 12px;
    font-weight: 650;
    line-height: 1.25;

    transition:
      color 0.18s ease,
      font-size 0.18s ease,
      font-weight 0.18s ease;
  }

  /* 右侧圆点 */
  .count-location-jump-nav-dot {
    position: absolute;
    top: 50%;
    right: 10px;
    width: 9px;
    height: 9px;
    margin-top: -4.5px;
    background: linear-gradient(
      135deg,
      rgba(0, 122, 255, 0.88),
      rgba(0, 81, 213, 0.88)
    );
    border-radius: 50%;
    box-shadow:
      0 0 0 3px rgba(0, 122, 255, 0.1),
      0 3px 8px rgba(0, 122, 255, 0.14);

    transition:
      width 0.18s ease,
      height 0.18s ease,
      right 0.18s ease,
      margin-top 0.18s ease,
      transform 0.18s ease,
      background 0.18s ease,
      box-shadow 0.18s ease;
  }
}

/* 平板与较窄桌面 */
@media (max-width: 960px) {
  .count-location-jump-nav {
    right: 6px;
    width: $tablet-width;
    max-height: min(78vh, 560px);

    .count-location-jump-nav-control {
      width: 28px;
      height: 28px;
      margin-right: 6px;
      font-size: 17px;
    }

    .count-location-jump-nav-items {
      gap: 3px;

      &::before {
        right: 8px;
        width: 22px;
      }
    }

    .count-location-jump-nav-item {
      &:hover,
      &:focus-visible,
      &.is-hovered,
      &.is-center {
        width: 166px;
      }

      &.is-center {
        .count-location-jump-nav-label {
          max-width: 126px;
        }

        .count-location-jump-nav-text {
          max-width: 104px;
          font-size: 13px;
        }
      }
    }

    .count-location-jump-nav-label {
      right: 28px;
      max-width: 122px;
      padding: 5px 9px;
    }

    .count-location-jump-nav-text {
      max-width: 104px;
      font-size: 12px;
    }
  }
}

/* 手机 */
@media (max-width: 640px) {
  .count-location-jump-nav {
    right: 4px;
    width: $mobile-width;
    max-height: min(70dvh, 520px);

    .count-location-jump-nav-control {
      width: 28px;
      height: 28px;
      margin-right: 4px;
      background: rgba(255, 255, 255, 0.84);
    }

    .count-location-jump-nav-items {
      &::before {
        right: 6px;
        width: 16px;
      }
    }

    .count-location-jump-nav-placeholder,
    .count-location-jump-nav-item {
      width: 34px;
    }

    .count-location-jump-nav-item {
      &:hover,
      &:focus-visible,
      &.is-hovered,
      &.is-center {
        width: 142px;
      }

      &.is-center {
        .count-location-jump-nav-label {
          max-width: 104px;
          padding: 6px 10px;
        }

        .count-location-jump-nav-text {
          max-width: 84px;
          font-size: 12px;
        }

        .count-location-jump-nav-dot {
          right: 6px;
          width: 13px;
          height: 13px;
          margin-top: -6.5px;
        }
      }
    }

    .count-location-jump-nav-label {
      right: 24px;
      max-width: 100px;
      padding: 4px 8px;
    }

    .count-location-jump-nav-text {
      max-width: 82px;
      font-size: 11px;
    }

    .count-location-jump-nav-dot {
      right: 7px;
    }
  }
}
