<template>
  <Transition name="hover-detail-card-fade">
    <div
      v-if="visible"
      class="hover-detail-card"
      :class="{ 'is-desktop-card': !isMobileLayout, 'is-pinned': isPinned }"
      :style="!isMobileLayout ? desktopCardPosition : {}"
    >
      <div class="hover-detail-card__header">
        <div class="hover-detail-card__header-content">
          <slot name="header" />
        </div>
        <button
          v-show="isMobileLayout || isPinned"
          type="button"
          class="hover-detail-card__close"
          @click="$emit('close')"
        >×</button>
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
})

defineEmits(['close'])
</script>

<style scoped>
.hover-detail-card {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  z-index: 1200;
  border: 1px solid var(--glass-border-weak);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
}

.hover-detail-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.hover-detail-card.is-desktop-card {
  position: fixed;
  right: auto;
  bottom: auto;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-medium);
  z-index: 9999;
  pointer-events: auto;
}

.hover-detail-card.is-desktop-card:not(.is-pinned) {
  pointer-events: none;
}

.hover-detail-card__header-content {
  min-width: 0;
  flex: 1;
}

.hover-detail-card__close {
  border: none;
  background: rgba(255, 255, 255, 0.55);
  color: var(--text-dark, #333);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
}

.hover-detail-card__body {
  max-height: min(38dvh, 300px);
  overflow-y: auto;
  padding: 12px 14px 14px;
}

.hover-detail-card-fade-enter-active,
.hover-detail-card-fade-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.hover-detail-card-fade-enter-from,
.hover-detail-card-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
