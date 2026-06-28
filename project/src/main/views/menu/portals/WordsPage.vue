<template>
  <div class="words-page">
      <h2 class="page-title">{{ $t('words.title') }}</h2>

      <div class="words-grid">
        <button class="word-btn" @click="handleYuBaoVocabulary">
          <div class="word-icon">📖</div>
          <div class="word-name">{{ $t('words.yuBaoVocabulary.name') }}</div>
          <div class="word-desc">{{ $t('words.yuBaoVocabulary.desc') }}</div>
        </button>

        <button class="word-btn" @click="handleYuBaoGrammar">
          <div class="word-icon">🗣️</div>
          <div class="word-name">{{ $t('words.yuBaoGrammar.name') }}</div>
          <div class="word-desc">{{ $t('words.yuBaoGrammar.desc') }}</div>
        </button>

        <button class="word-btn" @click="handleYcSpoken">
          <div class="word-icon">💬</div>
          <div class="word-name">{{ $t('words.ycSpoken.name') }}</div>
          <div class="word-desc">{{ $t('words.ycSpoken.desc') }}</div>
        </button>

      </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const router = useRouter()
const route = useRoute()

const handleYcSpoken = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/yc-spoken'))
};

const handleYuBaoVocabulary = () => {
  router.push({ path: buildLocalePath(resolveRouteLocale(route), '/explore/yubao'), query: { tab: 'vocabulary' } })
};

const handleYuBaoGrammar = () => {
  router.push({ path: buildLocalePath(resolveRouteLocale(route), '/explore/yubao'), query: { tab: 'grammar' } })
};
</script>

<style scoped>
.words-page {
  min-width: 80dvw;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 20px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 30px;
  text-align: center;
}

.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 1000px;
}

.word-btn {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(0, 122, 255, 0.2);
  border-radius: 16px;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.word-btn:hover {
  transform: translateY(-4px);
  border-color: #007aff;
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.2);
  background: rgba(255, 255, 255, 1);
}

.word-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.word-name {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
}

.word-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .words-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 24px;
  }
}
</style>
