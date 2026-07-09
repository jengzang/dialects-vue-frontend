<template>
  <section class="point-card-list">
    <div class="point-card-toolbar">
      <div class="point-card-heading">
        <input v-model="keyword" class="point-card-search main-search-field" type="text" :placeholder="t('customEntry.pointList.searchPlaceholder')" />
        <h4 class="point-card-title">{{ t('customEntry.pointList.title') }}</h4>
        <p class="point-card-description">{{ t('customEntry.pointList.description') }}</p>
      </div>
      <button class="main-glass-button" data-variant="primary" type="button" @click="$emit('create')">
        {{ t('customEntry.pointList.create') }}
      </button>
    </div>

    <div v-if="loading" class="point-grid main-card-grid">
      <div v-for="index in 3" :key="index" class="point-card point-card-skeleton main-data-card main-glass-panel-inner" aria-hidden="true">
        <div class="skeleton-line skeleton-line-lg"></div>
        <div class="skeleton-line skeleton-line-sm"></div>
        <div class="skeleton-line skeleton-line-xs"></div>
      </div>
    </div>

    <div v-else-if="errorMessage" class="point-list-state main-list-state main-glass-panel-inner" data-state="error">
      <div class="point-list-state-title main-list-state-title">{{ t('customEntry.pointList.loadFailed') }}</div>
      <p class="point-list-state-text main-list-state-text">{{ errorMessage }}</p>
      <button class="main-glass-button" type="button" @click="$emit('retry')">{{ t('customEntry.pointList.retry') }}</button>
    </div>

    <div v-else-if="filteredItems.length === 0" class="point-list-state main-list-state main-glass-panel-inner">
      <div class="point-list-state-title main-list-state-title">{{ t('customEntry.pointList.emptyTitle') }}</div>
      <p class="point-list-state-text main-list-state-text">{{ t('customEntry.pointList.emptyText') }}</p>
    </div>

    <div v-else class="point-grid main-card-grid">
      <button
        v-for="item in filteredItems"
        :key="item.point_key || `${item['簡稱'] || ''}-${item['音典分區'] || ''}`"
        class="point-card main-data-card main-glass-panel-inner"
        type="button"
        @click="$emit('select', item)"
      >
        <span class="point-card-name">{{ item['簡稱'] || item.location || t('customEntry.pointList.unnamed') }}</span>
        <span class="point-card-region">{{ item['音典分區'] || item.region || t('customEntry.pointList.unregioned') }}</span>
        <span class="point-card-badge">{{ t('customEntry.pointList.recordCount', { count: item.feature_count || 0 }) }}</span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const keyword = ref('')

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

defineEmits(['select', 'create', 'retry'])

const filteredItems = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return props.items
  return props.items.filter((item) => {
    const location = String(item['簡稱'] || item.location || '').toLowerCase()
    const region = String(item['音典分區'] || item.region || '').toLowerCase()
    return location.includes(query) || region.includes(query)
  })
})
</script>

<style scoped lang="scss">
@use '../../_map-variables' as *;

@use '@/styles/main/_surfaces.scss';

.point-card-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.point-card-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.point-card-heading {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .point-card-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: $text-strong;
  }

  .point-card-description {
    margin: 0;
    font-size: 14px;
    color: $text-muted;
  }
}

.point-grid {
  --main-card-min-width: 220px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.point-card-name {
  font-size: 16px;
  font-weight: 700;
  color: $text-strong;
}

.point-card-region {
  font-size: 13px;
  color: $text-secondary;
}

.point-card-badge {
  margin-top: 4px;
  font-size: 12px;
  color: $primary;
  font-weight: 600;
}

.skeleton-line {
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.9), $bg-light, rgba(226, 232, 240, 0.9));
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;

  &-lg {
    width: 58%;
    height: 18px;
  }

  &-sm {
    width: 36%;
    height: 14px;
  }

  &-xs {
    width: 46%;
    height: 12px;
    margin-top: 12px;
  }
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
</style>
