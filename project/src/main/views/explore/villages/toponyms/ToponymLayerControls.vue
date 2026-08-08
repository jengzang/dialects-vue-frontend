<template>
  <section
    class="toponym-layer-controls"
    :class="{ 'toponym-layer-controls--compact': compact }"
    :aria-label="t('villages.pages.toponyms.layers.title')"
  >
    <div class="toponym-layer-controls__header">
      <h2>{{ t('villages.pages.toponyms.layers.title') }}</h2>
      <span>{{ t('villages.pages.toponyms.layers.caption') }}</span>
    </div>

    <div class="toponym-layer-controls__list">
      <label
        v-for="layer in optionalLayers"
        :key="layer.key"
        class="toponym-layer-controls__toggle"
        :class="{ 'toponym-layer-controls__toggle--active': layerState[layer.key] }"
      >
        <input
          type="checkbox"
          :checked="layerState[layer.key]"
          :disabled="loadingLayers[layer.key]"
          @change="handleToggle(layer.key, $event.target.checked)"
        >
        <span>{{ t(layer.labelKey) }}</span>
        <small v-if="loadingLayers[layer.key]">{{ t('villages.pages.toponyms.layers.loading') }}</small>
        <small v-else-if="layerErrors[layer.key]">{{ layerErrors[layer.key] }}</small>
      </label>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { TOPONYMS_GIS_ASSETS } from './toponymsGisAssets.js';

defineProps({
  compact: {
    type: Boolean,
    default: false,
  },
  layerState: {
    type: Object,
    required: true,
  },
  loadingLayers: {
    type: Object,
    default: () => ({}),
  },
  layerErrors: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['toggle-layer']);
const { t } = useI18n();

const optionalLayerKeys = ['provinces', 'cities', 'riverL1', 'riverL2', 'riverL3'];
const optionalLayers = computed(() =>
  optionalLayerKeys.map((key) => TOPONYMS_GIS_ASSETS[key]).filter(Boolean)
);

function handleToggle(key, visible) {
  emit('toggle-layer', { key, visible });
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.toponym-layer-controls {
  @include flex-col;
  gap: 10px;

  &__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;

    h2 {
      margin: 0;
      color: var(--text-deep);
      font-size: 15px;
      line-height: 1.4;
    }

    span {
      color: var(--text-secondary);
      font-size: 12px;
    }
  }

  &__list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-block-size: 32px;
    padding: 6px 10px;
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-sm2);
    background: var(--surface-glass-button);
    color: var(--text-slate);
    font-size: 13px;
    cursor: pointer;

    input {
      margin: 0;
      accent-color: var(--color-primary);
    }

    small {
      color: var(--text-tertiary);
      font-size: 12px;
    }

    &--active {
      border-color: var(--action-active-border);
      background: var(--action-active-bg);
      color: var(--text-deep);
    }

    &:has(input:disabled) {
      @include disabled-state;
    }
  }

  &--compact {
    gap: 6px;

    .toponym-layer-controls {
      &__header {
        justify-content: flex-end;

        h2 {
          font-size: 13px;
        }

        span {
          display: none;
        }
      }

      &__list {
        justify-content: flex-end;
        gap: 6px;
      }

      &__toggle {
        min-block-size: 28px;
        padding: 4px 8px;
        font-size: 12px;
      }
    }
  }
}
</style>
