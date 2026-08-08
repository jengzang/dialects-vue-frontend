<template>
  <component
    v-if="phosphorIcon"
    :is="phosphorIcon"
    class="bar-icon-svg"
    :size="'1em'"
    :weight="phosphorWeight"
    :mirrored="false"
    color="currentColor"
  />
  <span v-else class="bar-icon-emoji">{{ icon }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { resolvePhosphorIcon } from '@/composables/bar/usePhosphorMap.js'
import { currentIconMode, ICON_MODE_ALL_EMOJI } from '@/composables/core/uiPreferences.js'

const props = defineProps({
  icon: { type: String, required: true },
  weight: { type: String, default: 'bold' }
})

const phosphorWeight = computed(() => props.weight)

const phosphorIcon = computed(() => {
  if (currentIconMode.value === ICON_MODE_ALL_EMOJI) return null
  return resolvePhosphorIcon(props.icon)
})
</script>
