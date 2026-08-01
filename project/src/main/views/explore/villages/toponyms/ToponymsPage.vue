<template>
  <main class="toponyms-page glass-container glass-container-shell">
    <section class="toponyms-page__placeholder main-glass-panel">
      <div class="toponyms-page__placeholder-inner main-glass-panel-inner">
        <h1>{{ t('villages.toponyms.name') }}</h1>
        <p>{{ t('villages.toponyms.desc') }}</p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.toponyms-page {
  width: 100%;
  min-height: 70dvh;
  padding: 20px;

  &__placeholder {
    width: 100%;
  }

  &__placeholder-inner {
    @include flex-col;
    gap: 8px;
    color: var(--text-deep);

    h1,
    p {
      margin: 0;
    }

    p {
      color: var(--text-secondary);
    }
  }
}
</style>
