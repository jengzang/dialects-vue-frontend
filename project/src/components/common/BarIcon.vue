<template>
  <svg
    v-if="svgContent"
    class="bar-icon-svg"
    :style="{ width: '1em', height: '1em' }"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-html="svgContent"
  />
  <span v-else class="bar-icon-emoji">{{ icon }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: { type: String, required: true }
})

const SVG_MAP = {
  // 示例：'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  // 后续在此处添加图标映射
}

const svgContent = computed(() => SVG_MAP[props.icon] || null)
</script>
