<script setup>
import { computed, nextTick, ref, watch } from 'vue'

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
  }
})

const emit = defineEmits(['jump'])

const hoverId = ref('')
const activeId = ref('')
const centerIndex = ref(0)

const wheelStep = 1

const orderedItems = computed(() => {
  if (props.itemOrder === 'pinyin') {
    return [...props.items].sort((a, b) => {
      return a.fullLabel.localeCompare(b.fullLabel, 'zh-Hans-CN-u-co-pinyin')
    })
  }

  return props.items
})

const totalItems = computed(() => orderedItems.value.length)

const visibleSlotCount = computed(() => {
  const count = Math.max(3, Number(props.visibleCount) || 15)

  // 保證有一個明確的正中間
  return count % 2 === 0 ? count + 1 : count
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

  const delta = event.deltaY > 0 ? wheelStep : -wheelStep
  moveCenter(delta)
  event.preventDefault()
}

const handleKeydown = async (event) => {
  if (event.key === 'ArrowDown') {
    moveCenter(1)
    event.preventDefault()
    return
  }

  if (event.key === 'ArrowUp') {
    moveCenter(-1)
    event.preventDefault()
    return
  }

  if (event.key === 'PageDown') {
    moveCenter(Math.max(1, middleVisibleIndex.value))
    event.preventDefault()
    return
  }

  if (event.key === 'PageUp') {
    moveCenter(-Math.max(1, middleVisibleIndex.value))
    event.preventDefault()
    return
  }

  if (event.key === 'Home') {
    centerIndex.value = 0
    event.preventDefault()
    return
  }

  if (event.key === 'End') {
    centerIndex.value = clampCenterIndex(totalItems.value - 1)
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
  },
  { deep: true }
)

watch(activeId, (value) => {
  if (value) {
    moveCenterToItem(value)
  }
})
</script>

<template>
  <Teleport to="body">
    <nav
      v-if="items.length > 0"
      class="count-location-jump-nav"
      tabindex="0"
      aria-label="count location quick jump"
      @wheel="handleWheel"
      @keydown="handleKeydown"
    >
      <button
        v-if="canMove"
        type="button"
        class="count-location-jump-nav-control count-location-jump-nav-control--up"
        :class="{ disabled: !canMovePrev }"
        :disabled="!canMovePrev"
        aria-label="向上滑動"
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
        aria-label="向下滑動"
        @click="moveCenter(1)"
      >
        <span aria-hidden="true">⌄</span>
      </button>
    </nav>
  </Teleport>
</template>

<style lang="scss" scoped>
.count-location-jump-nav {
  position: fixed;
  top: 50%;
  right: 10px;
  z-index: 1600;
  width: 214px;
  max-height: min(82vh, 620px);
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  outline: none;
  pointer-events: none;

  .count-location-jump-nav-control,
  .count-location-jump-nav-item {
    pointer-events: auto;
  }

  .count-location-jump-nav-control {
    width: 30px;
    height: 30px;
    margin-right: 7px;
    border: 1px solid rgba(0, 122, 255, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    color: var(--color-primary);
    font-size: 18px;
    font-weight: 800;
    line-height: 1;
    cursor: pointer;
    box-shadow:
      0 8px 18px rgba(24, 38, 64, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.78);
    backdrop-filter: blur(14px) saturate(150%);
    -webkit-backdrop-filter: blur(14px) saturate(150%);
    transition:
      transform 0.18s ease,
      opacity 0.18s ease,
      background 0.18s ease,
      box-shadow 0.18s ease;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      background: rgba(255, 255, 255, 0.92);
      box-shadow:
        0 10px 22px rgba(24, 38, 64, 0.14),
        0 4px 10px rgba(0, 122, 255, 0.1);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &.disabled,
    &:disabled {
      opacity: 0.28;
      cursor: not-allowed;
      box-shadow: none;
    }
  }

  .count-location-jump-nav-control--down {
    &:hover:not(:disabled) {
      transform: translateY(1px);
    }
  }

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
      right: 9px;
      bottom: 4px;
      width: 24px;
      border-radius: 999px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(255, 255, 255, 0.24)),
        rgba(240, 246, 255, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.44);
      box-shadow:
        0 12px 30px rgba(24, 38, 64, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(16px) saturate(160%);
      -webkit-backdrop-filter: blur(16px) saturate(160%);
      pointer-events: none;
    }
  }

  .count-location-jump-nav-placeholder,
  .count-location-jump-nav-item {
    position: relative;
    width: 42px;
    height: 26px;
    flex: 0 0 auto;
  }

  .count-location-jump-nav-placeholder {
    pointer-events: none;
    visibility: hidden;

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

  .count-location-jump-nav-item {
    padding: 0;
    border: none;
    border-radius: 999px;
    background: transparent;
    cursor: pointer;
    text-align: right;
    overflow: visible;
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
    }

    &:focus-visible {
      outline: none;

      .count-location-jump-nav-dot {
        box-shadow:
          0 0 0 5px rgba(0, 122, 255, 0.18),
          0 4px 12px rgba(0, 122, 255, 0.2);
      }
    }

    &:hover,
    &:focus-visible,
    &.is-hovered,
    &.is-center {
      .count-location-jump-nav-label {
        opacity: 1;
        transform: translateY(-50%) translateX(0);
      }
    }

    &.is-center {
      height: 36px;
      opacity: 1;
      z-index: 3;

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
        width: 14px;
        height: 14px;
        right: 8px;
        margin-top: -7px;
        background: linear-gradient(135deg, #007aff, #004fc4);
        box-shadow:
          0 0 0 6px rgba(0, 122, 255, 0.16),
          0 6px 16px rgba(0, 122, 255, 0.24);
      }
    }

    &.is-active:not(.is-center) {
      .count-location-jump-nav-dot {
        background: linear-gradient(135deg, #0051d5, #003d9e);
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
        width: 10px;
        height: 10px;
        right: 10px;
        margin-top: -5px;
      }
    }

    &.depth-2 {
      height: 26px;
      opacity: 0.62;

      .count-location-jump-nav-dot {
        width: 8px;
        height: 8px;
        right: 11px;
        margin-top: -4px;
      }
    }

    &.depth-3 {
      height: 22px;
      opacity: 0.42;

      .count-location-jump-nav-dot {
        width: 6px;
        height: 6px;
        right: 12px;
        margin-top: -3px;
      }
    }

    &.depth-4 {
      height: 22px;
      opacity: 0.24;

      .count-location-jump-nav-dot {
        width: 5px;
        height: 5px;
        right: 12.5px;
        margin-top: -2.5px;
      }
    }

    &:hover {
      opacity: 1;
      z-index: 4;

      .count-location-jump-nav-dot {
        transform: scale(1.16);
        box-shadow:
          0 0 0 4px rgba(0, 122, 255, 0.16),
          0 4px 12px rgba(0, 122, 255, 0.2);
      }
    }
  }

  .count-location-jump-nav-label {
    position: absolute;
    top: 50%;
    right: 30px;
    max-width: 150px;
    padding: 5px 10px;
    border-radius: 999px;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-50%) translateX(8px);
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(0, 122, 255, 0.12);
    box-shadow:
      0 8px 20px rgba(24, 38, 64, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.78);
    backdrop-filter: blur(14px) saturate(150%);
    -webkit-backdrop-filter: blur(14px) saturate(150%);
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
    font-size: 12px;
    font-weight: 650;
    line-height: 1.25;
    white-space: nowrap;
    text-overflow: ellipsis;
    transition:
      color 0.18s ease,
      font-size 0.18s ease,
      font-weight 0.18s ease;
  }

  .count-location-jump-nav-dot {
    position: absolute;
    top: 50%;
    right: 10px;
    width: 9px;
    height: 9px;
    margin-top: -4.5px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(0, 122, 255, 0.88), rgba(0, 81, 213, 0.88));
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

@media (max-width: 960px) {
  .count-location-jump-nav {
    right: 6px;
    width: 176px;
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

@media (max-width: 640px) {
  .count-location-jump-nav {
    right: 4px;
    width: 150px;
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
        width: 20px;
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
          width: 13px;
          height: 13px;
          right: 6px;
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
</style>