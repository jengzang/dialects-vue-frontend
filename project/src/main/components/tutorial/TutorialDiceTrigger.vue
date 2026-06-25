<template>
  <button
    type="button"
    class="tutorial-trigger"
    :title="t('tutorial.ui.openLabel', { title: entry.title })"
    :aria-label="t('tutorial.ui.openLabel', { title: entry.title })"
    data-tutorial-trigger
    @click="$emit('open')"
  >
    <span class="tutorial-trigger__orb" aria-hidden="true">
      <span class="tutorial-trigger__dice">🎲</span>
    </span>

    <span class="tutorial-trigger__copy">
      <span class="tutorial-trigger__eyebrow">{{ t('tutorial.assist.badge') }}</span>
      <span class="tutorial-trigger__label">{{ t('tutorial.ui.triggerLabel') }}</span>
    </span>
  </button>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  entry: {
    type: Object,
    required: true,
  },
})

defineEmits(['open'])

const { t } = useI18n()
</script>

<style lang="scss" scoped>
.tutorial-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 58px;
  padding: 10px 16px 10px 10px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(226, 241, 255, 0.54)),
    radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.96), transparent 42%);
  box-shadow:
    0 18px 44px rgba(34, 109, 192, 0.24),
    0 4px 14px rgba(64, 125, 190, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    inset 0 -1px 0 rgba(91, 139, 186, 0.08);
  color: var(--color-blue-dark);
  cursor: pointer;
  overflow: hidden;
  backdrop-filter: blur(22px) saturate(170%);
  -webkit-backdrop-filter: blur(22px) saturate(170%);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: inherit;
    pointer-events: none;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.58), transparent 44%);
  }

  &:hover {
    transform: translateY(-2px) scale(1.01);
    border-color: rgba(255, 255, 255, 0.92);
    box-shadow:
      0 22px 52px rgba(34, 109, 192, 0.3),
      0 8px 20px rgba(64, 125, 190, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.94);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  &:focus-visible {
    outline: 3px solid rgba(79, 154, 255, 0.34);
    outline-offset: 3px;
  }
}

.tutorial-trigger__orb {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.2) 30%, transparent 34%),
    linear-gradient(145deg, rgba(112, 181, 255, 0.98), rgba(45, 128, 224, 0.98));
  box-shadow:
    0 12px 26px rgba(55, 132, 221, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    inset 0 -8px 18px rgba(0, 65, 140, 0.18);
}

.tutorial-trigger__dice {
  font-size: 1.38rem;
  filter: drop-shadow(0 2px 4px rgba(0, 56, 120, 0.22));
}

.tutorial-trigger__copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}

.tutorial-trigger__eyebrow {
  font-size: 0.72rem;
  color: var(--text-secondary);
  letter-spacing: 0.06em;
}

.tutorial-trigger__label {
  font-size: 0.96rem;
  font-weight: 800;
  color: var(--color-blue-dark);
  letter-spacing: 0.01em;
}

@media (max-width: 560px) {
  .tutorial-trigger {
    min-height: 54px;
    padding: 8px;
  }

  .tutorial-trigger__copy {
    display: none;
  }

  .tutorial-trigger__orb {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 900px) and (orientation: landscape) {
  .tutorial-trigger {
    min-height: 48px;
    padding: 6px 12px 6px 6px;
  }

  .tutorial-trigger__orb {
    width: 38px;
    height: 38px;
  }

  .tutorial-trigger__dice {
    font-size: 1.12rem;
  }

  .tutorial-trigger__label {
    font-size: 0.88rem;
  }
}
</style>