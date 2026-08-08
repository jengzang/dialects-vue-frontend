<template>
  <component
    v-if="phosphorIcon"
    :is="phosphorIcon"
    class="inline-icon-svg"
    :size="'1em'"
    :weight="'regular'"
    :mirrored="false"
    color="currentColor"
  />
  <span v-else class="inline-icon-emoji">{{ icon }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { resolvePhosphorIcon } from '@/composables/bar/usePhosphorMap.js'
import { currentIconMode, ICON_MODE_ALL_SVG } from '@/composables/core/uiPreferences.js'

const props = defineProps({
  icon: { type: String, required: true }
})

const phosphorIcon = computed(() => {
  if (currentIconMode.value !== ICON_MODE_ALL_SVG) return null
  return resolvePhosphorIcon(props.icon)
})
</script>

<style scoped>
.inline-icon-svg,
.inline-icon-emoji {
  display: inline;
  vertical-align: -0.125em;
}
</style>
