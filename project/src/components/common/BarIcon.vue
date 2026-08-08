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

const props = defineProps({
  icon: { type: String, required: true }
})

const phosphorWeight = 'regular'

/*
 * PHOSPHOR_MAP: icon key → Phosphor Vue component
 *
 * 用法示例（等 UI 确认后添加）：
 *   import { MagnifyingGlass, MapTrifold, House } from '@phosphor-icons/vue'
 *   const PHOSPHOR_MAP = {
 *     'search': MagnifyingGlass,
 *     'map': MapTrifold,
 *     'home': House,
 *   }
 *
 * 届时 config 文件中的 icon: '🔍' 改为 icon: 'search' 即可。
 * 未匹配到的 key 自动 fallback 为 emoji 渲染。
 */

const PHOSPHOR_MAP = {}

const phosphorIcon = computed(() => PHOSPHOR_MAP[props.icon] || null)
</script>
