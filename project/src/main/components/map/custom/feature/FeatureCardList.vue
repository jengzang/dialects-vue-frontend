<template>
  <section class="feature-card-list">
    <div class="feature-card-toolbar">
      <div class="feature-card-heading">
        <input v-model="keyword" class="feature-card-search main-search-field" type="text" :placeholder="t('customEntry.featureList.searchPlaceholder')" />
        <h4 class="feature-card-title">{{ t('customEntry.featureList.title') }}</h4>
        <p class="feature-card-description">{{ t('customEntry.featureList.description') }}</p>
      </div>
      <button class="main-glass-button" data-variant="primary" type="button" @click="$emit('create')">
        {{ t('customEntry.featureList.create') }}
      </button>
    </div>

    <div v-if="loading" class="feature-grid main-card-grid">
      <div v-for="index in 3" :key="index" class="feature-card feature-card-skeleton main-data-card main-glass-panel-inner" aria-hidden="true">
        <div class="skeleton-line skeleton-line-lg"></div>
        <div class="skeleton-chip"></div>
        <div class="skeleton-line skeleton-line-sm"></div>
      </div>
    </div>

    <div v-else-if="errorMessage" class="feature-list-state main-list-state main-glass-panel-inner" data-state="error">
      <div class="feature-list-state-title main-list-state-title">{{ t('customEntry.featureList.loadFailed') }}</div>
      <p class="feature-list-state-text main-list-state-text">{{ errorMessage }}</p>
      <button class="main-glass-button" type="button" @click="$emit('retry')">{{ t('customEntry.featureList.retry') }}</button>
    </div>

    <div v-else-if="filteredItems.length === 0" class="feature-list-state main-list-state main-glass-panel-inner">
      <div class="feature-list-state-title main-list-state-title">{{ t('customEntry.featureList.emptyTitle') }}</div>
      <p class="feature-list-state-text main-list-state-text">{{ t('customEntry.featureList.emptyText') }}</p>
    </div>

    <div v-else class="feature-grid main-card-grid">
      <button
        v-for="item in filteredItems"
        :key="item.feature_key || `${item['特徵'] || ''}-${item['聲韻調'] || ''}`"
        class="feature-card main-data-card main-glass-panel-inner"
        type="button"
        @click="$emit('select', item)"
      >
        <span class="feature-card-name">{{ item['特徵'] || item.feature || t('customEntry.featureList.unnamed') }}</span>
        <span class="feature-card-tag" :data-tone="resolveToneType(item)">{{ item['聲韻調'] || item.phonology || t('customEntry.featureList.uncategorized') }}</span>
        <span class="feature-card-badge">{{ t('customEntry.featureList.pointCount', { count: item.location_count || 0 }) }}</span>
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
    const feature = String(item['特徵'] || item.feature || '').toLowerCase()
    const phonology = String(item['聲韻調'] || item.phonology || '').toLowerCase()
    return feature.includes(query) || phonology.includes(query)
  })
})

function resolveToneType(item) {
  const value = item?.['聲韻調'] || item?.phonology || ''
  if (value.includes('聲母')) return 'initial'
  if (value.includes('韻母')) return 'final'
  if (value.includes('調值')) return 'tone-value'
  if (value.includes('聲調')) return 'tone'
  if (value.includes('漢字')) return 'hanzi'
  if (value.includes('詞') || value.includes('词')) return 'lexicon'
  return 'other'
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

@use '../../_map-variables' as *;

@use '@/styles/main/_surfaces.scss';

.feature-card-list {
  @include flex-col;
  gap: 18px;
}

.feature-card-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.feature-card-heading {
  @include flex-col;
  gap: 6px;

  .feature-card-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: $text-strong;
  }

  .feature-card-description {
    margin: 0;
    font-size: 14px;
    color: $text-muted;
  }
}

.feature-grid {
  --main-card-min-width: 240px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  --main-data-card-gap: 10px;
}

.feature-card-name {
  font-size: 16px;
  font-weight: 700;
  color: $text-strong;
}

.feature-card-tag {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 700;

  &[data-tone='initial'] {
    background: rgba(var(--color-primary-rgb), 0.06);
    color: $primary;
  }

  &[data-tone='final'] {
    background: $success-bg;
    color: $success;
  }

  &[data-tone='tone'] {
    background: rgba(var(--color-warning-rgb), 0.12);
    color: $warning;
  }

  &[data-tone='hanzi'] {
    background: rgba(var(--color-teal-rgb), 0.07);
    color: $teal;
  }

  &[data-tone='tone-value'] {
    background: $danger-bg;
    color: var(--color-error-light);
  }

  &[data-tone='lexicon'] {
    background: rgba(var(--color-purple-light-rgb), 0.09);
    color: $purple;
  }

  &[data-tone='other'] {
    background: rgba($text-subtle, 0.09);
    color: $text-subtle;
  }
}

.feature-card-badge {
  font-size: 12px;
  color: $text-secondary;
  font-weight: 600;
}

.skeleton-line,
.skeleton-chip {
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, rgba(var(--text-slate-light-rgb), 0.9), $bg-light, rgba(var(--text-slate-light-rgb), 0.9));
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}

.skeleton-line {
  &-lg {
    width: 56%;
    height: 18px;
  }

  &-sm {
    width: 42%;
    height: 14px;
  }
}

.skeleton-chip {
  width: 72px;
  height: 24px;
}

</style>
