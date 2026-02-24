<template>
  <span class="region-display" :class="displayClass" :title="fullPath">
    <template v-if="mode === 'full'">
      <span v-if="item.city && !skipCity" class="region-part city">{{ item.city }}</span>
      <span v-if="item.city && !skipCity && item.county" class="region-separator">{{ separator }}</span>
      <span v-if="item.county" class="region-part county">{{ item.county }}</span>
      <span v-if="item.township" class="region-separator">{{ separator }}</span>
      <span v-if="item.township" class="region-part township">{{ item.township }}</span>
      <span v-if="!hasHierarchy" class="region-part fallback">{{ item.region_name }}</span>
    </template>
    <template v-else-if="mode === 'short'">
      {{ shortName }}
    </template>
    <template v-else>
      {{ displayText }}
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { buildRegionPath, getRegionShortName, hasHierarchyInfo } from '@/utils/regionDisplay.js'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  mode: {
    type: String,
    default: 'full', // 'full' | 'short' | 'auto'
    validator: (value) => ['full', 'short', 'auto'].includes(value)
  },
  separator: {
    type: String,
    default: ' > '
  },
  skipCity: {
    type: Boolean,
    default: true  // 默認不顯示市級
  },
  highlightLast: {
    type: Boolean,
    default: false
  }
})

const hasHierarchy = computed(() => hasHierarchyInfo(props.item))

const fullPath = computed(() => buildRegionPath(props.item, {
  separator: props.separator,
  skipCity: props.skipCity
}))

const shortName = computed(() => getRegionShortName(props.item))

const displayText = computed(() => {
  if (props.mode === 'auto') {
    return hasHierarchy.value ? fullPath.value : (props.item.region_name || '')
  }
  return fullPath.value
})

const displayClass = computed(() => ({
  'has-hierarchy': hasHierarchy.value,
  'highlight-last': props.highlightLast
}))
</script>

<style scoped>
.region-display {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--text-primary);
}

.region-part {
  white-space: nowrap;
}

.region-part.city {
  color: var(--text-secondary);
  font-size: 0.9em;
}

.region-part.county {
  color: var(--text-primary);
  font-size: 0.95em;
}

.region-part.township {
  color: var(--text-primary);
  font-weight: 600;
}

.region-separator {
  color: var(--text-tertiary);
  font-size: 0.8em;
  opacity: 0.6;
}

.region-display.highlight-last .region-part.township {
  color: var(--color-primary);
  font-weight: 700;
}

.region-part.fallback {
  color: var(--text-primary);
}

/* Tooltip support */
.region-display[title] {
  cursor: help;
}
</style>
