<template>
  <Teleport to="body">
    <div
      v-if="src"
      class="image-preview-overlay"
      @click="close"
      @keydown="onKeydown"
    >
      <div class="image-preview-overlay__toolbar">
        <h3
          v-if="alt"
          class="image-preview-overlay__title"
        >
          {{ alt }}
        </h3>
        <span
          v-else
          class="image-preview-overlay__spacer"
        ></span>
        <div class="image-preview-overlay__actions">
          <button
            type="button"
            class="image-preview-overlay__action-btn"
            :aria-label="t('common.button.reset')"
            :title="t('common.button.reset')"
            @click.stop="reset"
          >
            ↺
          </button>
          <button
            type="button"
            class="close-btn image-preview-overlay__close"
            :aria-label="t('common.button.close')"
            @click.stop="close"
          >
            ×
          </button>
        </div>
      </div>

      <img
        :src="src"
        :alt="alt"
        class="image-preview-overlay__img"
        :class="{ 'is-dragging': isDragging }"
        :style="imgStyle"
        @click.stop
        @wheel.prevent="onWheel"
        @dblclick.prevent="toggleZoom"
        @mousedown.prevent="onDragStart"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend.prevent="onTouchEnd"
      >
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps({
  src: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

const { t } = useI18n()

const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const isDragging = ref(false)

const MIN_ZOOM = 0.5
const MAX_ZOOM = 5

const imgStyle = computed(() => ({
  transform: `scale(${zoom.value}) translate(${panX.value}px, ${panY.value}px)`,
  transition: isDragging.value ? 'none' : 'transform 0.2s ease',
  cursor: isDragging.value ? 'grabbing' : zoom.value > 1 ? 'grab' : 'zoom-in',
}))

function reset() {
  zoom.value = 1
  panX.value = 0
  panY.value = 0
}

function close() {
  reset()
  emit('close')
}

function onKeydown(e) {
  if (e.key === 'Escape') close()
}

function toggleZoom() {
  zoom.value = zoom.value > 1 ? 1 : 2
  if (zoom.value === 1) {
    panX.value = 0
    panY.value = 0
  }
}

function onWheel(e) {
  const delta = e.deltaY > 0 ? -0.12 : 0.12
  zoom.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.value + delta))
  if (zoom.value <= 1) {
    panX.value = 0
    panY.value = 0
  }
}

// --- mouse drag ---
let dragStartX = 0
let dragStartY = 0
let panStartX = 0
let panStartY = 0

function onDragStart(e) {
  if (zoom.value <= 1) return
  isDragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  panStartX = panX.value
  panStartY = panY.value
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e) {
  if (!isDragging.value) return
  panX.value = panStartX + (e.clientX - dragStartX) / zoom.value
  panY.value = panStartY + (e.clientY - dragStartY) / zoom.value
}

function onDragEnd() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

// --- touch ---
let pinchStartDist = 0
let pinchStartZoom = 1
let touchDragStartX = 0
let touchDragStartY = 0
let touchPanStartX = 0
let touchPanStartY = 0

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.hypot(dx, dy)
}

function onTouchStart(e) {
  if (e.touches.length === 2) {
    isDragging.value = false
    pinchStartDist = getTouchDist(e.touches)
    pinchStartZoom = zoom.value
    return
  }
  if (e.touches.length !== 1) return
  if (zoom.value <= 1) return
  isDragging.value = true
  touchDragStartX = e.touches[0].clientX
  touchDragStartY = e.touches[0].clientY
  touchPanStartX = panX.value
  touchPanStartY = panY.value
}

function onTouchMove(e) {
  if (e.touches.length === 2) {
    const newDist = getTouchDist(e.touches)
    zoom.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStartZoom * (newDist / pinchStartDist)))
    if (zoom.value <= 1) {
      panX.value = 0
      panY.value = 0
    }
    return
  }
  if (!isDragging.value || e.touches.length !== 1) return
  panX.value = touchPanStartX + (e.touches[0].clientX - touchDragStartX) / zoom.value
  panY.value = touchPanStartY + (e.touches[0].clientY - touchDragStartY) / zoom.value
}

function onTouchEnd(e) {
  if (e.touches.length === 0) {
    isDragging.value = false
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
})
</script>

<style scoped lang="scss">
.image-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 30000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: imagePreviewFadeIn 0.2s ease;

  &__toolbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    pointer-events: none;
    z-index: 1;
  }

  &__title {
    margin: 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 1rem;
    font-weight: 500;
    pointer-events: none;

    @media (max-aspect-ratio: 1/1) {
      font-size: 0.88rem;
    }
  }

  &__spacer {
    flex: 1;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    pointer-events: auto;
  }

  &__action-btn {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.1rem;
    cursor: pointer;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    transition: background 0.2s, border-color 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.35);
    }
  }

  &__close {
    position: static;
    top: auto;
    right: auto;
  }

  &__img {
    max-width: 90dvw;
    max-height: 85dvh;
    object-fit: contain;
    border-radius: var(--radius-lg);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.06),
      0 24px 80px rgba(0, 0, 0, 0.5);
    transform-origin: center center;
    user-select: none;
    -webkit-user-select: none;
    will-change: transform;

    &.is-dragging {
      will-change: transform;
    }

    @media (max-aspect-ratio: 1/1) {
      max-width: 96dvw;
      max-height: 78dvh;
    }
  }
}

@keyframes imagePreviewFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
