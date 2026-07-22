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
                <span class="draw-layer-row-main">
                  <span class="draw-layer-row-title">{{ layer.name }}</span>
                  <span class="draw-layer-row-meta">
                    {{ getGeometryLabel(layer.geometryType) }} ·
                    {{ t('map.drawTab.labels.layerFeatureCount', { count: getLayerFeatureCount(layer) }) }}
                  </span>
                </span>
                <span class="draw-layer-row-state">
                  {{ layer.visible ? t('map.drawTab.labels.visibleShort') : t('map.drawTab.labels.hiddenShort') }}
                  <span v-if="layer.locked"> · {{ t('map.drawTab.labels.lockedShort') }}</span>
                </span>
              </button>
              <div class="draw-layer-row-actions">
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  :title="t('map.drawTab.buttons.bringToFront')"
                  @click.stop="$emit('move-layer-to-top', layer.id)"
                >
                  ⤒
                </button>
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  :title="t('map.drawTab.buttons.moveLayerUp')"
                  @click.stop="$emit('move-layer', layer.id, -1)"
                >
                  ↑
                </button>
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  :title="t('map.drawTab.buttons.moveLayerDown')"
                  @click.stop="$emit('move-layer', layer.id, 1)"
                >
                  ↓
                </button>
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  :title="t('map.drawTab.buttons.sendToBack')"
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
                  {{ layer.visible ? t('map.drawTab.buttons.hideLayer') : t('map.drawTab.buttons.showLayer') }}
                </button>
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  @click.stop="$emit('toggle-layer-lock', layer.id)"
                >
                  {{ layer.locked ? t('map.drawTab.buttons.unlockLayer') : t('map.drawTab.buttons.lockLayer') }}
                </button>
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  @click.stop="$emit('duplicate-layer', layer.id)"
                >
                  {{ t('map.drawTab.buttons.duplicateLayer') }}
                </button>
                <button
                  class="main-glass-button draw-layer-chip-action"
                  data-variant="secondary"
                  type="button"
                  @click.stop="$emit('delete-layer', layer.id)"
                >
                  {{ t('map.drawTab.buttons.deleteLayer') }}
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
            {{ t('map.drawTab.labels.viewSettings') }}
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
  'duplicate-layer',
  'delete-layer',
  'set-all-layers-visibility',
  'update-style-key',
])

const getLayerFeatureCount = (layer) => {
  return layer.featureCollection?.features?.length ?? 0
}

const getGeometryLabel = (geometryType) => {
  if (geometryType === 'Point') return t('map.drawTab.geometry.point')
  if (geometryType === 'Polygon') return t('map.drawTab.geometry.polygon')
  return t('map.drawTab.geometry.line')
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
