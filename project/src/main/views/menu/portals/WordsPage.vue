<template>
  <div class="words-page">
    <h2 class="page-title">{{ $t('words.title') }}</h2>

    <div class="words-grid">
      <button class="entry-button" @click="handleWordList">
        <div class="entry-button__icon">📒</div>
        <div class="entry-button__name">
          {{ $t('words.wordList.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('words.wordList.desc') }}
        </div>
      </button>

      <button class="entry-button" @click="handleYuBaoVocabulary">
        <div class="entry-button__icon">📖</div>
        <div class="entry-button__name">
          {{ $t('words.yuBaoVocabulary.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('words.yuBaoVocabulary.desc') }}
        </div>
      </button>

      <button class="entry-button" @click="handleYuBaoGrammar">
        <div class="entry-button__icon">🗣️</div>
        <div class="entry-button__name">
          {{ $t('words.yuBaoGrammar.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('words.yuBaoGrammar.desc') }}
        </div>
      </button>

      <button class="entry-button" @click="handleYcSpoken">
        <div class="entry-button__icon">💬</div>
        <div class="entry-button__name">
          {{ $t('words.ycSpoken.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('words.ycSpoken.desc') }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import {
  buildLocalePath,
  resolveRouteLocale
} from '@/i18n/localeRouting.js'

const router = useRouter()
const route = useRoute()

const handleYcSpoken = () => {
  router.push(
    buildLocalePath(
      resolveRouteLocale(route),
      '/explore/yc-spoken'
    )
  )
}

const handleWordList = () => {
  router.push(
    buildLocalePath(
      resolveRouteLocale(route),
      '/explore/vocabulary'
    )
  )
}

const handleYuBaoVocabulary = () => {
  router.push({
    path: buildLocalePath(
      resolveRouteLocale(route),
      '/explore/yubao'
    ),
    query: {
      tab: 'vocabulary'
    }
  })
}

const handleYuBaoGrammar = () => {
  router.push({
    path: buildLocalePath(
      resolveRouteLocale(route),
      '/explore/yubao'
    ),
    query: {
      tab: 'grammar'
    }
  })
}
</script>

<style scoped lang="scss">
.words-page {
  min-width: 80dvw;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.page-title {
  margin: 0 0 30px;
  color: var(--text-primary);
  font-size: 32px;
  font-weight: 700;
  text-align: center;
}

.words-grid {
  width: 100%;
  max-width: 1000px;
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(250px, 1fr)
  );
  gap: 20px;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .words-grid {
    grid-template-columns: 1fr;
  }
}
</style>
