<template>
  <Transition name="hover-detail-card-fade">
    <div
      v-if="visible"
      class="hover-detail-card"
      :class="[
        rootClass,
        { 'is-desktop-card': !isMobileLayout, 'is-pinned': isPinned }
      ]"
      :style="!isMobileLayout ? desktopCardPosition : {}"
      @wheel.stop
      @touchmove.stop
    >
      <div class="hover-detail-card__header">
        <div class="hover-detail-card__header-content">
          <slot name="header" />
        </div>
        <slot name="header-actions">
          <button
            v-show="isMobileLayout || isPinned"
            type="button"
            class="close-btn close-btn-sm close-btn-inline"
            @click="$emit('close')"
          >×</button>
        </slot>
      </div>

      <div class="hover-detail-card__body ui-scrollbar">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineOptions({
  name: 'HoverDetailCard',
})

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  isMobileLayout: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  desktopCardPosition: {
    type: Object,
    default: () => ({}),
  },
  rootClass: {
    type: [String, Array, Object],
    default: '',
  },
})

defineEmits(['close'])
</script>

<style scoped lang="scss">
$card-transition: 0.24s ease;

@mixin glass-blur($blur, $saturation: null) {
  @if $saturation {
    backdrop-filter: blur($blur) saturate($saturation);
    -webkit-backdrop-filter: blur($blur) saturate($saturation);
  } @else {
    backdrop-filter: blur($blur);
    -webkit-backdrop-filter: blur($blur);
  }
}

.hover-detail-card {
  position: fixed;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  left: 12px;
  z-index: 1200;
  overscroll-behavior: contain;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--glass-border-weak);
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.18);

  @include glass-blur(18px, 160%);

  &__header {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
    padding: 14px 14px 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  &__header-content {
    flex: 1;
    min-width: 0;
  }

  &__body {
    max-height: min(38dvh, 300px);
    padding: 12px 14px 14px;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  &.is-desktop-card {
    position: fixed;
    right: auto;
    bottom: auto;
    z-index: 9999;
    width: 320px;
    pointer-events: auto;
    border: 1px solid var(--border-medium);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);

    &:not(.is-pinned) {
      pointer-events: none;
    }
  }
}

.hover-detail-card-fade-enter-active,
.hover-detail-card-fade-leave-active {
  transition:
    opacity $card-transition,
    transform $card-transition;
}

.hover-detail-card-fade-enter-from,
.hover-detail-card-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
