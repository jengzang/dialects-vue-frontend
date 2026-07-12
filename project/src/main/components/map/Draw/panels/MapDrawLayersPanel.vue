<template>
  <Transition name="draw-panel-slide">
    <aside
      v-show="isOpen"
      class="draw-tool-panel main-glass-panel layers-panel"
    >
      <div class="draw-tool-panel-header">
        <div>
          <div class="draw-tool-panel-title">
            {{ t('map.drawTab.buttons.layers') }}
          </div>
        </div>
      </div>

      <div class="draw-tool-panel-body">
        <section class="draw-tool-section">
          <div class="draw-tool-section-header">
            <div class="draw-tool-section-title">
              {{ t('map.drawTab.labels.layerList') }}
            </div>
            <div class="draw-tool-inline-actions">
              <button
                class="main-glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                @click="$emit('set-all-layers-visibility', true)"
              >
                {{ t('map.drawTab.buttons.showAllLayers') }}
              </button>
              <button
                class="main-glass-button draw-tool-inline-button"
                data-variant="secondary"
                type="button"
                @click="$emit('set-all-layers-visibility', false)"
              >
                {{ t('map.drawTab.buttons.hideAllLayers') }}
              </button>
            </div>
          </div>
          <div class="draw-style-hint">
            {{ t('map.drawTab.labels.styleHint') }}
          </div>

          <div
            v-if="layers.length"
            class="draw-layer-list"
          >
            <div
              v-for="layer in layers"
              :key="layer.id"
              class="draw-layer-row"
              :data-active="activeLayerId === layer.id"
            >
              <button
                class="main-glass-button draw-layer-row-button"
                :data-variant="activeLayerId === layer.id ? 'primary' : 'secondary'"
                :data-active="activeLayerId === layer.id"
                type="button"
                @click="$emit('select-layer', layer.id)"
              >
                {{ getLayerLabel(layer) }}
              </button>
              <div class="draw-layer-row-actions">
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  title="置顶"
                  @click.stop="$emit('move-layer-to-top', layer.id)"
                >
                  ⤒
                </button>
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  title="上移"
                  @click.stop="$emit('move-layer', layer.id, -1)"
                >
                  ↑
                </button>
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  title="下移"
                  @click.stop="$emit('move-layer', layer.id, 1)"
                >
                  ↓
                </button>
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  title="置底"
                  @click.stop="$emit('move-layer-to-bottom', layer.id)"
                >
                  ⤓
                </button>
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  @click.stop="$emit('toggle-layer-visibility', layer.id)"
                >
                  {{ layer.visible ? '隐藏' : '显示' }}
                </button>
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  @click.stop="$emit('toggle-layer-lock', layer.id)"
                >
                  {{ layer.locked ? '解锁' : '锁定' }}
                </button>
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  @click.stop="$emit('delete-layer', layer.id)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
          <div
            v-else
            class="draw-layer-empty"
          >
            {{ t('map.drawTab.labels.emptyState') }}
          </div>
        </section>

        <section class="draw-tool-section">
          <div class="draw-tool-section-title">
            视图设置
          </div>
          <div class="draw-basemap-select">
            <span class="draw-field-label">{{ t('map.drawTab.labels.basemap') }}</span>
            <SimpleSelectDropdown
              :model-value="currentStyleKey"
              :options="mapStyleOptions"
              @update:model-value="handleStyleUpdate"
            />
          </div>
        </section>
      </div>
    </aside>
  </Transition>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'

const { t } = useI18n()

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  layers: { type: Array, default: () => [] },
  activeLayerId: { type: String, default: '' },
  currentStyleKey: { type: String, default: 'gaode' },
  mapStyleOptions: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'select-layer',
  'move-layer',
  'move-layer-to-top',
  'move-layer-to-bottom',
  'toggle-layer-visibility',
  'toggle-layer-lock',
  'delete-layer',
  'set-all-layers-visibility',
  'update-style-key',
])

const getLayerLabel = (layer) => {
  const count = layer.featureCollection?.features?.length ?? 0
  return `${layer.name} · ${count}`
}

const handleStyleUpdate = (value) => {
  if (value === props.currentStyleKey) return
  emit('update-style-key', value)
}
</script>

<style scoped lang="scss">
@use '../../_map-variables' as *;

@use './panelShared';
</style>
