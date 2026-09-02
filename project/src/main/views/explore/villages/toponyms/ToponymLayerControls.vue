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
      <CheckBox
        v-for="layer in optionalLayers"
        :key="layer.key"
        :model-value="Boolean(layerState[layer.key])"
        :disabled="Boolean(loadingLayers[layer.key])"
        class="toponym-layer-controls__toggle"
        :font-size="compact ? 12 : 13"
        :size="compact ? 16 : 18"
        @update:model-value="handleToggle(layer.key, $event)"
      >
        <span>{{ t(layer.labelKey) }}</span>
        <small v-if="loadingLayers[layer.key]">{{ t('villages.pages.toponyms.layers.loading') }}</small>
        <small v-else-if="layerErrors[layer.key]">{{ layerErrors[layer.key] }}</small>
      </CheckBox>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CheckBox from '@/components/selector/CheckBox.vue';
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
    gap: 6px;
    min-block-size: 32px;
    padding: 6px 10px;

    small {
      font-size: 12px;
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
      }
    }
  }
}
</style>
