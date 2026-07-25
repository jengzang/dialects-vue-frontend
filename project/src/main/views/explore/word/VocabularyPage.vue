<template>
  <section class="vocabulary-page-shell">
    <header class="vocabulary-page-shell__header">
      <span class="vocabulary-page-shell__icon" aria-hidden="true">📒</span>
      <div>
        <h2 class="vocabulary-page-shell__title">{{ t('words.wordList.name') }}</h2>
        <p class="vocabulary-page-shell__desc">{{ t('words.wordList.desc') }}</p>
      </div>
    </header>

    <div class="vocabulary-page-shell__body">
      <p>{{ t('words.wordList.placeholder') }}</p>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped lang="scss">
.vocabulary-page-shell {
  width: min(100%, 960px);
  margin: 0 auto;
  padding: 24px;
  color: var(--text-primary);
}

.vocabulary-page-shell__header {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 20px;
  background: var(--glass-20);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-lg, 8px);
  box-shadow: var(--shadow-soft, 0 8px 24px rgba(0, 0, 0, 0.08));
}

.vocabulary-page-shell__icon {
  display: inline-grid;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  place-items: center;
  font-size: 28px;
  background: var(--glass-30);
  border: 1px solid var(--glass-40);
  border-radius: var(--radius-md, 8px);
}

.vocabulary-page-shell__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.vocabulary-page-shell__desc {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.vocabulary-page-shell__body {
  margin-top: 18px;
  padding: 28px;
  color: var(--text-secondary);
  text-align: center;
  background: var(--glass-10);
  border: 1px dashed var(--glass-40);
  border-radius: var(--radius-lg, 8px);
}

@media (max-width: 768px) {
  .vocabulary-page-shell {
    padding: 16px;
  }

  .vocabulary-page-shell__header {
    align-items: flex-start;
  }
}
</style>
