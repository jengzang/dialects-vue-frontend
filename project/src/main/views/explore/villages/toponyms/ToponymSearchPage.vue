<template>
  <main class="toponym-search-page glass-shell">
    <section class="toponym-search-page__header glass-panel">
      <div class="toponym-search-page__copy">
        <h1>{{ t('villages.pages.toponymSearch.title') }}</h1>
        <p>{{ t('villages.pages.toponymSearch.subtitle') }}</p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.toponym-search-page {
  @include flex-col;
  gap: 16px;
  width: 100%;
  min-height: 70dvh;
  padding: 20px;
}

.toponym-search-page__header {
  padding: 18px;
}

.toponym-search-page__copy {
  @include flex-col;
  gap: 8px;

  h1,
  p {
    margin: 0;
  }
}

@media (max-aspect-ratio: 1 / 1) {
  .toponym-search-page {
    padding: 14px;
  }
}
</style>
