<template>
  <Teleport :to="teleportTo">
    <Transition :name="transitionName">
      <div
        v-if="modelValue"
        class="app-modal"
        :class="{ 'is-frameless': frameless }"
        :data-size="resolvedSize"
        :style="rootStyle"
        @mousedown.self="handleBackdropClose"
        @wheel.self.prevent
        @touchmove.self.prevent
      >
        <div
          class="panel"
          :style="panelStyle"
          :role="dialogRole"
          :aria-modal="dialogRole === 'dialog' ? 'true' : undefined"
          @click.stop
          @wheel.stop
          @touchmove.stop
        >
          <div v-if="hasHeader" class="header">
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

          <div v-if="hasFooter" class="footer">
            <slot name="footer" />
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
</script>

<script setup>
import { computed, useSlots, watch, onBeforeUnmount } from 'vue'

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
    default: 'modal-fade'
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

watch(
  () => props.modelValue,
  (visible) => {
    if (typeof document === 'undefined') return

    if (visible && !isOpen) {
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
  if (isOpen) {
    modalCount = Math.max(0, modalCount - 1)
    isOpen = false
    if (modalCount === 0 && typeof document !== 'undefined') {
      document.body.style.overflow = savedBodyOverflow
    }
  }
})

</script>


@use '../../styles/global/scrollbars' as scrollbars;

$transition-duration: 0.3s;
$transition-ease: ease;
$panel-transition-ease: cubic-bezier(0.25, 0.8, 0.25, 1);

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

  position: fixed;
  inset: 0;
  z-index: var(--app-modal-z-index, 20000);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
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
    --modal-content-padding-inline: 18px;
    --modal-content-padding-bottom: 20px;
  }

  &[data-size='lg'] {
    --modal-width: min(1100px, 95dvw);
    --modal-max-height: 88dvh;
    --modal-header-padding: 20px 24px;
    --modal-title-size: 20px;
    --modal-content-padding-top: 20px;
    --modal-content-padding-inline: 24px;
    --modal-content-padding-bottom: 20px;
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
  display: flex;
  flex-direction: column;
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
  border-radius: 20px;
  -webkit-overflow-scrolling: touch;

  @include scrollbars.visible-scrollbar;
  @include scrollbars.visible-scrollbar-webkit;
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

