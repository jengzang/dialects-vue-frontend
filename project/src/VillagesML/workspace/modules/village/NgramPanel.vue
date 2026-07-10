<template>
  <div class="vml-glass-panel">
    <h3 class="panel-title">📐 N-gram 分解</h3>

    <div v-if="loading" class="vml-loading">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>加載中...</p>
    </div>

    <div v-else-if="data" class="ngram-content">
      <!-- N value -->
      <div v-if="data.n" class="ngram-section">
        <h4>N-gram 級別: {{ data.n }}</h4>
      </div>

      <!-- Bigrams -->
      <div v-if="data.bigrams" class="ngram-section">
        <h4>二元組 (Bigrams)</h4>
        <div class="ngram-list">
          <span
            v-for="(gram, index) in parseBigrams(data.bigrams)"
            :key="index"
            class="ngram-item bigram"
          >
            {{ gram }}
          </span>
        </div>
      </div>

      <!-- Trigrams -->
      <div v-if="data.trigrams" class="ngram-section">
        <h4>三元組 (Trigrams)</h4>
        <div class="ngram-list">
          <span
            v-for="(gram, index) in parseTrigrams(data.trigrams)"
            :key="index"
            class="ngram-item trigram"
          >
            {{ gram }}
          </span>
        </div>
      </div>

      <!-- Prefix/Suffix -->
      <div class="ngram-section">
        <h4>前綴/後綴</h4>
        <div class="info-grid">
          <div v-if="data.prefix_bigram" class="info-item">
            <span class="info-label">前綴二元組:</span>
            <span class="info-value">{{ data.prefix_bigram }}</span>
          </div>
          <div v-if="data.suffix_bigram" class="info-item">
            <span class="info-label">後綴二元組:</span>
            <span class="info-value">{{ data.suffix_bigram }}</span>
          </div>
          <div v-if="data.prefix_trigram" class="info-item">
            <span class="info-label">前綴三元組:</span>
            <span class="info-value">{{ data.prefix_trigram }}</span>
          </div>
          <div v-if="data.suffix_trigram" class="info-item">
            <span class="info-label">後綴三元組:</span>
            <span class="info-value">{{ data.suffix_trigram }}</span>
          </div>
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

const parseBigrams = (bigrams) => {
  try {
    return JSON.parse(bigrams)
  } catch {
    return []
  }
}

const parseTrigrams = (trigrams) => {
  if (!trigrams) return []
  try {
    return JSON.parse(trigrams)
  } catch {
    return []
  }
}
</script>

<style scoped>
.ngram-content {
  animation: fadeIn 0.3s ease;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: var(--glass-30);
  border-radius: var(--radius-sm);
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
}

.ngram-section {
  margin-bottom: 6px;
  padding: 16px;
  background: var(--glass-30);
  border-radius: var(--radius-md);
}

.ngram-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 6px;
}

.ngram-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ngram-item {
  padding: 8px 16px;
  border-radius: var(--radius-sm2);
  font-size: 15px;
  font-weight: 500;
  transition: transform 0.3s ease;
}

.ngram-item:hover {
  transform: translateY(-2px);
}

.unigram {
  background: rgba(var(--vml-blue-rgb), 0.2);
  color: var(--color-primary);
}

.bigram {
  background: rgba(var(--color-success-rgb), 0.2);
  color: var(--color-success);
}

.trigram {
  background: rgba(var(--color-warning-rgb), 0.2);
  color: var(--color-warning-dark);
}

.ngram-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  padding: 16px;
  background: var(--glass-30);
  border-radius: var(--radius-md);
}

.stat-item {
  @include flex-col;
  align-items: center;
  padding: 12px;
  background: var(--glass-50);
  border-radius: var(--radius-sm2);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

</style>
