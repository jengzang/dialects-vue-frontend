<template>
  <div
    class="tutorial-trigger"
    :class="{
      'has-dice': hasDiceConfig,
      'is-text-only': !hasDiceConfig
    }"
    data-tutorial-trigger
  >
    <button
      v-if="hasDiceConfig"
      type="button"
      class="tutorial-trigger__orb"
      :title="diceTitle"
      :aria-label="diceTitle"
      @click="$emit('applyDice')"
    >
      <span
        class="tutorial-trigger__dice"
        aria-hidden="true"
      >
        🎲
      </span>
    </button>

    <button
      type="button"
      class="tutorial-trigger__main"
      :title="t('tutorial.ui.openLabel', { title: entry.title })"
      :aria-label="t('tutorial.ui.openLabel', { title: entry.title })"
      @click="$emit('open')"
    >
      <span class="tutorial-trigger__copy">
        <span class="tutorial-trigger__eyebrow">{{ t('tutorial.assist.badge') }}</span>
        <span class="tutorial-trigger__label">{{ t('tutorial.ui.triggerLabel') }}</span>
      </span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  entry: {
    type: Object,
    required: true,
  },
  hasDiceConfig: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['open', 'applyDice'])

const { t } = useI18n()

const diceTitle = computed(() => {
  return t('tutorial.assist.badge')
})
</script>

<style lang="scss" scoped>
$trigger-radius: 999px;
$trigger-z-index: 1200;

$glass-border: rgba(255, 255, 255, 0.72);
$glass-border-hover: rgba(255, 255, 255, 0.9);

$shadow-base:
  0 12px 30px rgba(34, 109, 192, 0.2),
  0 3px 10px rgba(64, 125, 190, 0.12),
  inset 0 1px 0 rgba(255, 255, 255, 0.86),
  inset 0 -1px 0 rgba(91, 139, 186, 0.08);

$shadow-hover:
  0 16px 36px rgba(34, 109, 192, 0.25),
  0 6px 16px rgba(64, 125, 190, 0.16),
  inset 0 1px 0 rgba(255, 255, 255, 0.92);

@mixin glass-bg {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(226, 241, 255, 0.46)),
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.92), transparent 40%);
  backdrop-filter: blur(20px) saturate(165%);
  -webkit-backdrop-filter: blur(20px) saturate(165%);
}

@mixin reset-button {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font: inherit;
}

@mixin focus-ring {
  outline: 3px solid rgba(79, 154, 255, 0.34);
  outline-offset: 3px;
  border-radius: $trigger-radius;
}

@mixin vertical-screen {
  @media (max-aspect-ratio: 1/1) {
    @content;
  }
}

@mixin short-landscape {
  @media (min-aspect-ratio: 1/1) and (max-height: 560px) {
    @content;
  }
}

.tutorial-trigger {
  position: fixed;
  right: calc(var(--tutorial-guide-right) + env(safe-area-inset-right, 0px));
  bottom: calc(var(--tutorial-guide-bottom) + env(safe-area-inset-bottom, 0px));
  z-index: $trigger-z-index;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  max-width: calc(100dvw - 32px);
  min-height: 46px;
  padding: 6px 12px 6px 9px;

  border: 1px solid $glass-border;
  border-radius: $trigger-radius;
  box-shadow: $shadow-base;

  color: var(--color-primary-hover);
  overflow: hidden;

  @include glass-bg;

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
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.52), transparent 44%);
  }

  &:hover {
    transform: translateY(-1px) scale(1.01);
    border-color: $glass-border-hover;
    box-shadow: $shadow-hover;
  }

  &__orb,
  &__main {
    position: relative;
    z-index: 1;

    @include reset-button;
  }

  &__orb {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 36px;
    height: 36px;
    flex: 0 0 auto;

    border-radius: 50%;
    box-shadow: none;

    transition:
      transform 0.18s ease,
      filter 0.18s ease;

    &:hover {
      transform: rotate(-10deg) scale(1.12);
      filter: drop-shadow(0 5px 10px rgba(42, 120, 216, 0.22));
    }

    &:active {
      transform: scale(0.94);
    }

    &:focus-visible {
      @include focus-ring;
    }
  }

  &__dice {
    font-size: 1.82rem;
    line-height: 1;

    filter:
      drop-shadow(0 2px 3px rgba(0, 56, 120, 0.18))
      drop-shadow(0 8px 12px rgba(42, 120, 216, 0.16));
  }

  &__main {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    text-align: left;

    &:focus-visible {
      @include focus-ring;
    }
  }

  &__copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    min-width: 0;
  }

  &__eyebrow {
    font-size: 0.66rem;
    color: var(--text-secondary);
    letter-spacing: 0.06em;
  }

  &__label {
    max-width: 7em;

    font-size: 0.86rem;
    font-weight: 800;
    color: var(--color-primary-hover);
    letter-spacing: 0.01em;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 竖屏 / 接近竖屏：宽高比 <= 1，统一隐藏骰子，只保留打开教程入口 */
  @include vertical-screen {
    gap: 0;
    min-height: 24px;
    padding: 7px 12px;

    &__orb {
      display: none;
    }

    &__main {
      display: inline-flex;
      min-width: 0;
    }

    &__eyebrow {
      display: none;
    }

    &__label {
      max-width: 7em;
      font-size: 0.8rem;
      line-height: 1.1;
    }
  }

  /* 横屏低高度：宽高比 >= 1，且高度较矮 */
  @include short-landscape {
    gap: 6px;
    min-height: 38px;
    padding: 4px 10px 4px 7px;

    &.is-text-only {
      padding: 6px 12px;
    }

    &__orb {
      width: 30px;
      height: 30px;
    }

    &__dice {
      font-size: 1.54rem;
    }

    &__eyebrow {
      display: none;
    }

    &__label {
      max-width: 6em;
      font-size: 0.78rem;
      line-height: 1.1;
    }
  }
}
</style>