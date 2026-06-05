<template>
  <section class="point-card-list">
    <div class="point-card-toolbar">
      <div class="point-card-heading">
        <input v-model="keyword" class="point-card-search" type="text" :placeholder="t('customEntry.pointList.searchPlaceholder')" />
        <h4 class="point-card-title">{{ t('customEntry.pointList.title') }}</h4>
        <p class="point-card-description">{{ t('customEntry.pointList.description') }}</p>
      </div>
      <button class="main-glass-button" data-variant="primary" type="button" @click="$emit('create')">
        {{ t('customEntry.pointList.create') }}
      </button>
    </div>

    <div v-if="loading" class="point-grid">
      <div v-for="index in 3" :key="index" class="point-card point-card-skeleton" aria-hidden="true">
        <div class="skeleton-line skeleton-line-lg"></div>
        <div class="skeleton-line skeleton-line-sm"></div>
        <div class="skeleton-line skeleton-line-xs"></div>
      </div>
    </div>

    <div v-else-if="errorMessage" class="point-list-state point-list-state-error">
      <div class="point-list-state-title">{{ t('customEntry.pointList.loadFailed') }}</div>
      <p class="point-list-state-text">{{ errorMessage }}</p>
      <button class="main-glass-button" type="button" @click="$emit('retry')">{{ t('customEntry.pointList.retry') }}</button>
    </div>

    <div v-else-if="filteredItems.length === 0" class="point-list-state">
      <div class="point-list-state-title">{{ t('customEntry.pointList.emptyTitle') }}</div>
      <p class="point-list-state-text">{{ t('customEntry.pointList.emptyText') }}</p>
    </div>

    <div v-else class="point-grid">
      <button
        v-for="item in filteredItems"
        :key="item.point_key || `${item['簡稱'] || ''}-${item['音典分區'] || ''}`"
        class="point-card"
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
}

.point-card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.point-card-description {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.point-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.point-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.64);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.point-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.14);
}

.point-card-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.point-card-region {
  font-size: 13px;
  color: #475569;
}

.point-card-badge {
  margin-top: 4px;
  font-size: 12px;
  color: #007aff;
  font-weight: 600;
}

.point-card-skeleton {
  cursor: default;
}

.skeleton-line {
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.9), rgba(241, 245, 249, 0.9), rgba(226, 232, 240, 0.9));
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}

.skeleton-line-lg {
  width: 58%;
  height: 18px;
}

.skeleton-line-sm {
  width: 36%;
  height: 14px;
}

.skeleton-line-xs {
  width: 46%;
  height: 12px;
  margin-top: 12px;
}

.point-list-state {
  padding: 28px 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.6);
  text-align: center;
}

.point-list-state-error {
  border-color: rgba(220, 38, 38, 0.15);
}

.point-list-state-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.point-list-state-text {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 768px) {
  .point-grid {
    grid-template-columns: 1fr;
  }
}
</style>
