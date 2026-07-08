<template>
  <div class="glass-container glass-container-shell">
    <div class="header-section">
      <h2 style="margin: 0;">{{ t('villages.pages.allVillages.title') }}</h2>
    </div>
    <div class="content-area">
      <p>{{ t('villages.pages.allVillages.placeholder') }}</p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.glass-container-shell {
  min-width: 80dvw;
  min-height: 70dvh;
  padding: 20px;
}

.header-section {
  margin-bottom: 20px;
}

.content-area {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50dvh;
  color: #666;
}
</style>
