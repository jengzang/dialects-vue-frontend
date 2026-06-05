<template>
  <section class="feature-card-list">
    <div class="feature-card-toolbar">
      <div class="feature-card-heading">
        <h4 class="feature-card-title">製作特徵分布</h4>
        <p class="feature-card-description">先選擇一個特徵，再逐步把不同方言點補入，形成可上圖的特徵分布資料。</p>
      </div>
      <button class="main-glass-button" data-variant="primary" type="button" @click="$emit('create')">
        + 新增特徵
      </button>
    </div>

    <div v-if="loading" class="feature-grid">
      <div v-for="index in 3" :key="index" class="feature-card feature-card-skeleton" aria-hidden="true">
        <div class="skeleton-line skeleton-line-lg"></div>
        <div class="skeleton-chip"></div>
        <div class="skeleton-line skeleton-line-sm"></div>
      </div>
    </div>

    <div v-else-if="errorMessage" class="feature-list-state feature-list-state-error">
      <div class="feature-list-state-title">載入特徵列表失敗</div>
      <p class="feature-list-state-text">{{ errorMessage }}</p>
      <button class="main-glass-button" type="button" @click="$emit('retry')">重試</button>
    </div>

    <div v-else-if="items.length === 0" class="feature-list-state">
      <div class="feature-list-state-title">暫無特徵資料</div>
      <p class="feature-list-state-text">點擊右上角「新增特徵」開始建立你的第一個特徵分布條目。</p>
    </div>

    <div v-else class="feature-grid">
      <button
        v-for="item in items"
        :key="item.feature_key || `${item['特徵'] || ''}-${item['聲韻調'] || ''}`"
        class="feature-card"
        type="button"
        @click="$emit('select', item)"
      >
        <span class="feature-card-name">{{ item['特徵'] || item.feature || '未命名特徵' }}</span>
        <span class="feature-card-tag" :data-tone="resolveToneType(item)">{{ item['聲韻調'] || item.phonology || '未分類' }}</span>
        <span class="feature-card-badge">已收錄 {{ item.location_count || 0 }} 個方言點</span>
      </button>
    </div>
  </section>
</template>

<script setup>
defineProps({
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

function resolveToneType(item) {
  const value = item?.['聲韻調'] || item?.phonology || ''
  if (value.includes('聲母')) return 'initial'
  if (value.includes('韻母')) return 'final'
  if (value.includes('調')) return 'tone'
  if (value.includes('詞')) return 'lexicon'
  return 'other'
}
</script>

<style scoped lang="scss">
.feature-card-list {
  display: flex;
  flex-direction: column;
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
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feature-card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.feature-card-description {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.64);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.14);
}

.feature-card-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.feature-card-tag {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.feature-card-tag[data-tone='initial'] {
  background: #e3f0ff;
  color: #007aff;
}

.feature-card-tag[data-tone='final'] {
  background: #e8f8ef;
  color: #34c759;
}

.feature-card-tag[data-tone='tone'] {
  background: #fff3e0;
  color: #ff9500;
}

.feature-card-tag[data-tone='lexicon'] {
  background: #f3e8ff;
  color: #af52de;
}

.feature-card-tag[data-tone='other'] {
  background: #f2f2f7;
  color: #8e8e93;
}

.feature-card-badge {
  font-size: 12px;
  color: #475569;
  font-weight: 600;
}

.feature-card-skeleton {
  cursor: default;
}

.skeleton-line,
.skeleton-chip {
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.9), rgba(241, 245, 249, 0.9), rgba(226, 232, 240, 0.9));
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}

.skeleton-line-lg {
  width: 56%;
  height: 18px;
}

.skeleton-line-sm {
  width: 42%;
  height: 14px;
}

.skeleton-chip {
  width: 72px;
  height: 24px;
}

.feature-list-state {
  padding: 28px 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.6);
  text-align: center;
}

.feature-list-state-error {
  border-color: rgba(220, 38, 38, 0.15);
}

.feature-list-state-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.feature-list-state-text {
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
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
