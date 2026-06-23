<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'

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

const navRef = ref(null)
const hoverId = ref('')
const activeId = ref('')
const topIndex = ref(0)
const wheelStep = 2

const orderedItems = computed(() => {
  if (props.itemOrder === 'pinyin') {
    return [...props.items].sort((a, b) => a.fullLabel.localeCompare(b.fullLabel, 'zh-Hans-CN-u-co-pinyin'))
  }
  return props.items
})

const totalItems = computed(() => orderedItems.value.length)
const maxTopIndex = computed(() => Math.max(0, totalItems.value - props.visibleCount))
const visibleItems = computed(() => orderedItems.value.slice(topIndex.value, topIndex.value + props.visibleCount))
const canScroll = computed(() => totalItems.value > props.visibleCount)
const middleVisibleIndex = computed(() => Math.floor(props.visibleCount / 2))
const showCenterLabel = ref(false)

const clampTopIndex = (value) => Math.min(maxTopIndex.value, Math.max(0, value))

const syncActiveToWindow = (id) => {
  if (!id) return
  const index = orderedItems.value.findIndex((item) => item.id === id)
  if (index < 0) return
  const targetTopIndex = clampTopIndex(index - middleVisibleIndex.value)
  topIndex.value = targetTopIndex
}

const scrollWindow = (delta) => {
  if (!canScroll.value) return
  topIndex.value = clampTopIndex(topIndex.value + delta)
}

const handleWheel = (event) => {
  if (!canScroll.value) return
  showCenterLabel.value = true
  const delta = event.deltaY > 0 ? wheelStep : -wheelStep
  scrollWindow(delta)
  event.preventDefault()
}

const handleKeydown = (event) => {
  if (!canScroll.value) return
  showCenterLabel.value = true
  if (event.key === 'ArrowDown') {
    scrollWindow(1)
    event.preventDefault()
  }
  if (event.key === 'ArrowUp') {
    scrollWindow(-1)
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
  if (activeId.value !== nav.id) {
    activeId.value = nav.id
    hoverId.value = nav.id
    syncActiveToWindow(nav.id)
    return
  }

  await nextTick()
  emit('jump', nav)
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
    topIndex.value = clampTopIndex(topIndex.value)
  },
  { deep: true }
)

watch(activeId, (value) => syncActiveToWindow(value))

onMounted(() => {
  const current = navRef.value
  current?.addEventListener('wheel', handleWheel, { passive: false })
  current?.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  const current = navRef.value
  current?.removeEventListener('wheel', handleWheel)
  current?.removeEventListener('keydown', handleKeydown)
})

const jumpIndicatorTop = computed(() => {
  if (!canScroll.value) return 0
  const ratio = maxTopIndex.value === 0 ? 0 : topIndex.value / maxTopIndex.value
  return ratio * 100
})
</script>

<template>
  <Teleport to="body">
    <nav
      v-if="items.length > 0"
      ref="navRef"
      class="count-location-jump-nav"
      :class="{ 'is-scrollable': canScroll }"
      tabindex="0"
      aria-label="count location quick jump"
      @mouseenter="showCenterLabel = true"
      @mouseleave="showCenterLabel = false"
      @focusin="showCenterLabel = true"
      @focusout="showCenterLabel = false"
    >
      <div v-if="canScroll" class="count-location-jump-nav-rail">
        <div class="count-location-jump-nav-track"></div>
        <div class="count-location-jump-nav-thumb" :style="{ top: `${jumpIndicatorTop}%` }"></div>
      </div>

      <div class="count-location-jump-nav-items">
        <button
          v-for="(nav, visibleIndex) in visibleItems"
          :key="nav.id"
          type="button"
          class="count-location-jump-nav-item"
          :class="[
            { expanded: hoverId === nav.id || activeId === nav.id },
            `depth-${Math.min(3, Math.abs(visibleIndex - middleVisibleIndex))}`,
            { 'is-center': visibleIndex === middleVisibleIndex, 'center-label-visible': showCenterLabel && visibleIndex === middleVisibleIndex }
          ]"
          :aria-label="nav.fullLabel"
          @mouseenter="handleItemEnter(nav)"
          @mouseleave="handleItemLeave(nav)"
          @focus="handleItemEnter(nav)"
          @blur="handleItemLeave(nav)"
          @click="handleItemClick(nav)"
        >
          <span class="count-location-jump-nav-hitbox">
            <span class="count-location-jump-nav-bubble">
              <span class="count-location-jump-nav-text">{{ nav.fullLabel }}</span>
            </span>
            <span class="count-location-jump-nav-dot" aria-hidden="true"></span>
          </span>
        </button>
      </div>
    </nav>
  </Teleport>
</template>

<style scoped>
.count-location-jump-nav {
  position: fixed;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 12px 14px 10px;
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.16)),
    rgba(240, 246, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.38);
  box-shadow:
    0 22px 52px rgba(28, 41, 61, 0.18),
    0 8px 22px rgba(0, 122, 255, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    inset 0 -1px 0 rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(26px) saturate(195%);
  -webkit-backdrop-filter: blur(26px) saturate(195%);
  overflow: visible;
  z-index: 1600;
  outline: none;
}

.count-location-jump-nav::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.08));
  pointer-events: none;
}

.count-location-jump-nav.is-scrollable {
  padding-left: 18px;
}

.count-location-jump-nav-rail,
.count-location-jump-nav-items {
  position: relative;
  z-index: 1;
}

.count-location-jump-nav-rail {
  position: absolute;
  left: 8px;
  top: 14px;
  bottom: 14px;
  width: 4px;
}

.count-location-jump-nav-track {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.38);
}

.count-location-jump-nav-thumb {
  position: absolute;
  left: 50%;
  width: 8px;
  height: 30px;
  margin-left: -4px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(0, 122, 255, 0.95), rgba(0, 81, 213, 0.95));
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.14);
  transition: top 0.2s ease;
}

.count-location-jump-nav-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.count-location-jump-nav-item {
  position: relative;
  display: block;
  width: 184px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.count-location-jump-nav-hitbox {
  position: absolute;
  inset: 0;
  display: block;
}

.count-location-jump-nav-dot {
  position: absolute;
  top: 50%;
  right: 0;
  width: 10px;
  height: 10px;
  margin-top: -5px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007aff, #0051d5);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.14);
}

.count-location-jump-nav-bubble {
  position: absolute;
  top: 50%;
  right: 18px;
  transform: translateY(-50%) translateX(8px);
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.44);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72), 0 10px 24px rgba(24, 34, 54, 0.12);
  backdrop-filter: blur(20px) saturate(185%);
  -webkit-backdrop-filter: blur(20px) saturate(185%);
  transition: max-width 0.22s ease, opacity 0.18s ease, transform 0.22s ease, padding 0.22s ease;
}

.count-location-jump-nav-item:hover .count-location-jump-nav-bubble,
.count-location-jump-nav-item.expanded .count-location-jump-nav-bubble,
.count-location-jump-nav-item.center-label-visible .count-location-jump-nav-bubble,
.count-location-jump-nav-item:focus-visible .count-location-jump-nav-bubble {
  max-width: 162px;
  opacity: 1;
  padding: 6px 12px;
  transform: translateY(-50%) translateX(0);
}

.count-location-jump-nav-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
}

@media (max-width: 960px) {
  .count-location-jump-nav {
    right: 10px;
    max-height: min(70vh, 520px);
    overflow: hidden;
  }

  .count-location-jump-nav-item {
    width: 150px;
  }

  .count-location-jump-nav-item:hover .count-location-jump-nav-bubble,
  .count-location-jump-nav-item.expanded .count-location-jump-nav-bubble,
  .count-location-jump-nav-item.center-label-visible .count-location-jump-nav-bubble,
  .count-location-jump-nav-item:focus-visible .count-location-jump-nav-bubble {
    max-width: 126px;
  }
}

.count-location-jump-nav-item.depth-0 {
  opacity: 1;
  transform: scale(1);
}

.count-location-jump-nav-item.depth-1 {
  opacity: 0.88;
  transform: scale(0.94);
}

.count-location-jump-nav-item.depth-2 {
  opacity: 0.7;
  transform: scale(0.88);
}

.count-location-jump-nav-item.depth-3 {
  opacity: 0.52;
  transform: scale(0.82);
}

.count-location-jump-nav-item.is-center .count-location-jump-nav-dot {
  width: 12px;
  height: 12px;
  margin-top: -6px;
  box-shadow: 0 0 0 5px rgba(0, 122, 255, 0.18);
}

.count-location-jump-nav-item.is-center .count-location-jump-nav-text {
  color: var(--color-primary);
}

.count-location-jump-nav-item.center-label-visible .count-location-jump-nav-text {
  color: var(--color-primary);
}

.count-location-jump-nav-items::before,
.count-location-jump-nav-items::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 28px;
  pointer-events: none;
  z-index: 2;
}

.count-location-jump-nav-items::before {
  top: 0;
  background: linear-gradient(180deg, rgba(240, 246, 255, 0.78), rgba(240, 246, 255, 0));
}

.count-location-jump-nav-items::after {
  bottom: 0;
  background: linear-gradient(0deg, rgba(240, 246, 255, 0.78), rgba(240, 246, 255, 0));
}
</style>
