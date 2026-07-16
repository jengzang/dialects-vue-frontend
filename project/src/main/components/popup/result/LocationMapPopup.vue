<template>
  <AppModal
    :model-value="visible"
    size="sm"
    :title="modalTitle"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <div class="location-map-content">
      <MiniMapSelector
        :coord="coord"
        :visible="visible"
        :readonly="true"
        mode="picker"
      />
    </div>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import MiniMapSelector from '@/main/components/map/MiniMapSelector.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  coord: { type: Array, default: () => [] },
  locationName: { type: String, default: '' }
})

const emit = defineEmits(['close'])
const { t } = useI18n()

const modalTitle = computed(() =>
  props.locationName
    ? `📍 ${t('result.locationMapPopup.title', { name: props.locationName })}`
    : `📍 ${t('result.locationMapPopup.titleFallback')}`
)

function handleClose() {
  emit('close')
}
</script>

<style scoped lang="scss">
.location-map-content {
  width: 100%;
  height: 360px;
}
</style>
