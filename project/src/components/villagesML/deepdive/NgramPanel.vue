<template>
  <div class="ngram-panel glass-panel">
    <h3 class="panel-title">📐 N-gram 分解</h3>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加載中...</p>
    </div>

    <div v-else-if="data" class="ngram-content">
      <!-- Unigrams -->
      <div v-if="data.ngrams?.unigrams" class="ngram-section">
        <h4>單字 (Unigrams)</h4>
        <div class="ngram-list">
          <span
            v-for="(gram, index) in data.ngrams.unigrams"
            :key="index"
            class="ngram-item unigram"
          >
            {{ gram }}
          </span>
        </div>
      </div>

      <!-- Bigrams -->
      <div v-if="data.ngrams?.bigrams" class="ngram-section">
        <h4>二元組 (Bigrams)</h4>
        <div class="ngram-list">
          <span
            v-for="(gram, index) in data.ngrams.bigrams"
            :key="index"
            class="ngram-item bigram"
          >
            {{ gram }}
          </span>
        </div>
      </div>

      <!-- Trigrams -->
      <div v-if="data.ngrams?.trigrams" class="ngram-section">
        <h4>三元組 (Trigrams)</h4>
        <div class="ngram-list">
          <span
            v-for="(gram, index) in data.ngrams.trigrams"
            :key="index"
            class="ngram-item trigram"
          >
            {{ gram }}
          </span>
        </div>
      </div>

      <!-- Statistics -->
      <div class="ngram-stats">
        <div class="stat-item">
          <span class="stat-label">單字數量:</span>
          <span class="stat-value">{{ data.ngrams?.unigrams?.length || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">二元組數量:</span>
          <span class="stat-value">{{ data.ngrams?.bigrams?.length || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">三元組數量:</span>
          <span class="stat-value">{{ data.ngrams?.trigrams?.length || 0 }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>暫無數據</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  villageId: {
    type: Number,
    required: true
  },
  data: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.ngram-panel {
  padding: 24px;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ngram-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.ngram-section {
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.ngram-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.ngram-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ngram-item {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  transition: transform 0.3s ease;
}

.ngram-item:hover {
  transform: translateY(-2px);
}

.unigram {
  background: rgba(74, 144, 226, 0.2);
  color: var(--primary-color);
}

.bigram {
  background: rgba(80, 200, 120, 0.2);
  color: #2d8659;
}

.trigram {
  background: rgba(243, 156, 18, 0.2);
  color: #c87f0a;
}

.ngram-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}
</style>
