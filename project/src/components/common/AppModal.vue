<template>
  <Teleport :to="teleportTo">
    <Transition
      :name="transitionName"
      @before-enter="prepareFlipEnter"
      @before-leave="prepareFlipLeave"
    >
      <div
        v-if="modelValue"
        class="app-modal"
        :class="{
          'is-frameless': frameless,
          'uses-flip-detail': transitionName === 'flip-to-detail'
        }"
        :data-size="resolvedSize"
        :style="rootStyle"
        @mousedown.self="handleBackdropClose"
        @wheel.self.prevent
        @touchmove.self.prevent
      >
        <div
          class="panel"
          :style="panelStyle"
          @click.stop
          @wheel.stop
          @touchmove.stop
        >
          <div
            class="panel-detail"
            :role="dialogRole"
            :aria-modal="dialogRole === 'dialog' ? 'true' : undefined"
          >
            <div
              v-if="hasHeader"
              class="header"
            >
              <slot name="header">
                <component
                  :is="titleTag"
                  v-if="title"
                  class="title"
                >
                  {{ title }}
                </component>
                <button
                  v-if="showClose"
                  type="button"
                  :class="resolvedCloseButtonClass"
                  :aria-label="closeLabel"
                  @click="close"
                >
                  {{ closeText }}
                </button>
              </slot>
            </div>

            <div class="content ui-scrollbar">
              <slot />
            </div>

            <div
              v-if="hasFooter"
              class="footer"
            >
              <slot name="footer" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
// module-level state shared across all AppModal instances
let modalCount = 0
let savedBodyOverflow = ''
let pointerTrackingCount = 0
let lastPointerOrigin = null
let lastPointerAt = 0

function trackPointerOrigin(event) {
  const target = event.target
  if (!(target instanceof Element)) return

  const interactiveTarget = target.closest('button, a, [role="button"], [data-modal-trigger]')
  lastPointerOrigin = interactiveTarget instanceof HTMLElement
    ? interactiveTarget
    : target instanceof HTMLElement ? target : null
  lastPointerAt = Date.now()
}

function startPointerTracking() {
  if (pointerTrackingCount === 0) {
    document.addEventListener('pointerdown', trackPointerOrigin, true)
  }
  pointerTrackingCount++
}

function stopPointerTracking() {
  pointerTrackingCount = Math.max(0, pointerTrackingCount - 1)
  if (pointerTrackingCount === 0) {
    document.removeEventListener('pointerdown', trackPointerOrigin, true)
  }
}
</script>

<script setup>
import { computed, useSlots, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'sm'
  },
  title: {
    type: String,
    default: ''
  },
  titleTag: {
    type: String,
    default: 'h3'
  },
  transitionName: {
    type: String,
    default: 'flip-to-detail'
  },
  teleportTo: {
    type: String,
    default: 'body'
  },
  zIndex: {
    type: [Number, String],
    default: 20000
  },
  width: {
    type: [Number, String],
    default: ''
  },
  height: {
    type: [Number, String],
    default: ''
  },
  maxWidth: {
    type: [Number, String],
    default: ''
  },
  maxHeight: {
    type: [Number, String],
    default: ''
  },
  closeLabel: {
    type: String,
    default: 'Close'
  },
  closeText: {
    type: String,
    default: '\u00D7'
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  },
  showClose: {
    type: Boolean,
    default: true
  },
  frameless: {
    type: Boolean,
    default: false
  },
  dialogRole: {
    type: String,
    default: 'dialog'
  }
})

const emit = defineEmits(['update:modelValue', 'close'])
const slots = useSlots()

const defaultCloseButtonClassMap = {
  sm: 'close-btn close-btn-sm close-btn-inline',
  lg: 'close-btn close-btn-lg close-btn-inline'
}

const hasHeader = computed(() => Boolean(slots.header) || Boolean(props.title) || props.showClose)
const hasFooter = computed(() => Boolean(slots.footer))

const resolvedSize = computed(() => (props.size === 'lg' ? 'lg' : 'sm'))

const rootStyle = computed(() => ({
  '--app-modal-z-index': String(props.zIndex)
}))

function normalizeSize(value) {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  return typeof value === 'number' ? `${value}px` : value
}

const panelStyle = computed(() => ({
  width: normalizeSize(props.width),
  height: normalizeSize(props.height),
  maxWidth: normalizeSize(props.maxWidth),
  maxHeight: normalizeSize(props.maxHeight)
}))

const resolvedCloseButtonClass = computed(() => defaultCloseButtonClassMap[resolvedSize.value])

let originElement = null

function captureOrigin() {
  const activeElement = document.activeElement
  const pointerOriginIsFresh = lastPointerOrigin?.isConnected
    && Date.now() - lastPointerAt < 1000
  originElement = pointerOriginIsFresh
    ? lastPointerOrigin
    : activeElement instanceof HTMLElement && activeElement !== document.body
      ? activeElement
      : null
}

function getFlipOrigin(panel) {
  if (!originElement?.isConnected) {
    return { x: 0, y: 0, scale: 0.92 }
  }

  const origin = originElement.getBoundingClientRect()
  const target = panel.getBoundingClientRect()

  if (!origin.width || !origin.height || !target.width || !target.height) {
    return { x: 0, y: 0, scale: 0.92 }
  }

  return {
    x: origin.left + origin.width / 2 - (target.left + target.width / 2),
    y: origin.top + origin.height / 2 - (target.top + target.height / 2),
    scale: Math.min(origin.width / target.width, origin.height / target.height)
  }
}

function applyFlipOrigin(root) {
  const panel = root.querySelector('.panel')
  if (!panel) return

  const { x, y, scale } = getFlipOrigin(panel)
  root.style.setProperty('--flip-origin-x', `${x}px`)
  root.style.setProperty('--flip-origin-y', `${y}px`)
  root.style.setProperty('--flip-origin-scale', String(scale))
}

function prepareFlipEnter(root) {
  if (props.transitionName !== 'flip-to-detail') return
  applyFlipOrigin(root)
}

function prepareFlipLeave(root) {
  if (props.transitionName !== 'flip-to-detail') return
  applyFlipOrigin(root)
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function handleBackdropClose() {
  if (!props.closeOnBackdrop) {
    return
  }

  close()
}

let isOpen = false

onMounted(() => {
  startPointerTracking()
})

watch(
  () => props.modelValue,
  (visible) => {
    if (typeof document === 'undefined') return

    if (visible && !isOpen) {
      captureOrigin()
      isOpen = true
      if (modalCount === 0) {
        savedBodyOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
      }
      modalCount++
    } else if (!visible && isOpen) {
      isOpen = false
      modalCount = Math.max(0, modalCount - 1)
      if (modalCount === 0) {
        document.body.style.overflow = savedBodyOverflow
      }
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  stopPointerTracking()

  if (isOpen) {
    modalCount = Math.max(0, modalCount - 1)
    isOpen = false
    if (modalCount === 0 && typeof document !== 'undefined') {
      document.body.style.overflow = savedBodyOverflow
    }
  }
})

</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

@use '../../styles/global/scrollbars' as scrollbars;

$transition-duration: 0.3s;
$transition-ease: ease;
$panel-transition-ease: cubic-bezier(0.25, 1, 0.25, 1);

.app-modal {
  --modal-width: min(720px, 94dvw);
  --modal-max-height: min(70dvh, 640px);
  --modal-background: var(--glass-80);
  --modal-border: 1px solid var(--glass-60);
  --modal-radius: 18px;
  --modal-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
  --modal-backdrop-filter: blur(20px) saturate(160%);
  --modal-header-padding: 14px 18px;
  --modal-header-border: 1px solid rgba(0, 0, 0, 0.08);
  --modal-title-size: 16px;
  --modal-title-weight: 650;
  --modal-title-color: var(--text-primary);
  --modal-content-padding-top: 16px;
  --modal-content-padding-inline: 18px;
  --modal-content-padding-bottom: 20px;
  --modal-content-padding-mobile: 9px;

  position: fixed;
  inset: 0;
  z-index: var(--app-modal-z-index, 20000);
  @include flex-center;
  padding: 18px;
  perspective: 1200px;
  overscroll-behavior: contain;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  &[data-size='sm'] {
    --modal-width: min(720px, 94dvw);
    --modal-max-height: min(70dvh, 640px);
    --modal-header-padding: 14px 18px;
    --modal-title-size: 16px;
    --modal-content-padding-top: 16px;
    --modal-content-padding-inline: 16px;
    --modal-content-padding-bottom: 20px;
  }

  &[data-size='lg'] {
    --modal-width: min(1100px, 95dvw);
    --modal-max-height: 88dvh;
    --modal-header-padding: 16px 20px;
    --modal-title-size: 20px;
    --modal-content-padding-top: 16px;
    --modal-content-padding-inline: 20px;
    --modal-content-padding-bottom: 16px;
  }

  &.is-frameless {
    padding: 0;

    .panel {
      width: auto;
      max-height: none;
      overflow: visible;
      background: transparent;
      border: none;
      border-radius: 0;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    .content {
      padding: 0;
      overflow: visible;
    }

    .footer {
      padding: 0;
      border-top: none;
    }
  }
}

.panel {
  position: relative;
  @include flex-col;
  width: var(--modal-width);
  max-height: var(--modal-max-height);
  overflow: hidden;
  overscroll-behavior: contain;
  background: var(--modal-background);
  border: var(--modal-border);
  border-radius: var(--modal-radius);
  box-shadow: var(--modal-shadow);
  backdrop-filter: var(--modal-backdrop-filter);
  -webkit-backdrop-filter: var(--modal-backdrop-filter);
}

.panel-detail {
  @include flex-col;
  flex: 1;
  width: 100%;
  min-height: 0;
}

.uses-flip-detail .panel {
  transform: rotateY(180deg);
  transform-style: preserve-3d;
}

.uses-flip-detail .panel-detail {
  transform: rotateY(180deg);
  transform-style: preserve-3d;
}

.header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: var(--modal-header-padding);
  border-bottom: var(--modal-header-border);
}

.title {
  margin: 0;
  color: var(--modal-title-color);
  font-size: var(--modal-title-size);
  font-weight: var(--modal-title-weight);
  line-height: 1.3;
}

.content {
  flex: 1;
  min-height: 0;
  padding:
    var(--modal-content-padding-top)
    var(--modal-content-padding-inline)
    var(--modal-content-padding-bottom);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: var(--radius-xl);
  -webkit-overflow-scrolling: touch;

  @include scrollbars.visible-scrollbar;
  @include scrollbars.visible-scrollbar-webkit;

  @media (max-aspect-ratio: 1) {
    padding: var(--modal-content-padding-mobile);
  }
}

.footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  padding: 16px 18px;
  border-top: 1px solid var(--glass-50);
}

.modal-fade-enter-active,
.modal-fade-leave-active,
.fade-scale-enter-active,
.fade-scale-leave-active,
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity $transition-duration $transition-ease;

  .panel {
    transition:
      transform $transition-duration $panel-transition-ease,
      opacity $transition-duration $transition-ease;
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to,
.fade-scale-enter-from,
.fade-scale-leave-to,
.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  .panel {
    opacity: 0;
    transform: scale(0.97);
  }
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  .panel {
    opacity: 0;
    transform: scale(0.95);
  }
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  .panel {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
}

.flip-to-detail-enter-active,
.flip-to-detail-leave-active {
  transition: opacity 0.32s ease;

  .panel {
    animation-duration: 1s;
    animation-fill-mode: both;
  }
}

.flip-to-detail-enter-active .panel {
  animation-name: flip-to-detail-enter;
}

.flip-to-detail-leave-active .panel {
  animation-name: flip-to-detail-leave;
}

.flip-to-detail-enter-from,
.flip-to-detail-leave-to {
  opacity: 0;
}

@keyframes flip-to-detail-enter {
  0% {
    transform: translate3d(var(--flip-origin-x), var(--flip-origin-y), 0)
      scale(var(--flip-origin-scale)) rotateY(0deg);
  }

  70% {
    transform: translate3d(0, 0, 0) scale(1.035) rotateY(192deg);
  }

  85% {
    transform: translate3d(0, 0, 0) scale(0.99) rotateY(176deg);
  }

  100% {
    transform: translate3d(0, 0, 0) scale(1) rotateY(180deg);
  }
}

@keyframes flip-to-detail-leave {
  0% {
    transform: translate3d(0, 0, 0) scale(1) rotateY(180deg);
  }

  15% {
    transform: translate3d(0, 0, 0) scale(0.99) rotateY(176deg);
  }

  30% {
    transform: translate3d(0, 0, 0) scale(1.035) rotateY(192deg);
  }

  100% {
    transform: translate3d(var(--flip-origin-x), var(--flip-origin-y), 0)
      scale(var(--flip-origin-scale)) rotateY(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .flip-to-detail-enter-active,
  .flip-to-detail-leave-active {
    transition: none;

    .panel {
      animation: none;
    }
  }
}

:root[data-color-theme='dark'] .app-modal {
  --modal-background: rgba(22, 27, 34, 0.92);
}
</style>
