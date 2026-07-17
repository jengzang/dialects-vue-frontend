<template>
  <div class="villages-page">
    <h2 class="page-title">{{ $t('villages.title') }}</h2>

    <div class="villages-grid">
      <button class="entry-button" @click="handleGdVillages">
        <div class="entry-button__icon">🏘️</div>
        <div class="entry-button__name">
          {{ $t('villages.gdVillages.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('villages.gdVillages.desc') }}
        </div>
      </button>

      <button class="entry-button" @click="handleVillagesML">
        <div class="entry-button__icon">🤖</div>
        <div class="entry-button__name">
          {{ $t('villages.villagesML.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('villages.villagesML.desc') }}
        </div>
      </button>

      <button class="entry-button" @click="handleGdVillagesTable">
        <div class="entry-button__icon">📈</div>
        <div class="entry-button__name">
          {{ $t('villages.gdVillagesTable.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('villages.gdVillagesTable.desc') }}
        </div>
      </button>

      <button class="entry-button" @click="handleYcVillages">
        <div class="entry-button__icon">🏠</div>
        <div class="entry-button__name">
          {{ $t('villages.ycVillages.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('villages.ycVillages.desc') }}
        </div>
      </button>

      <button
        v-if="userStore.role === 'admin'"
        class="entry-button"
        @click="handleAllVillages"
      >
        <div class="entry-button__icon">📋</div>
        <div class="entry-button__name">
          {{ $t('villages.allVillages.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('villages.allVillages.desc') }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { userStore } from '@/main/store/store.js'

const router = useRouter()
const route = useRoute()

const handleGdVillagesTable = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/villages/table'))
};

const handleGdVillages = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/villages/gd'))
};

const handleYcVillages = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/villages/yc'))
};

const handleVillagesML = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/villages/ml'))
};

const handleAllVillages = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/villages/all'))
};
</script>

<style scoped lang="scss">

.villages-page {
  min-width: 80dvw;
  min-height: 70dvh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.page-title {
  margin: 0 0 40px;
  color: var(--text-deep);
  font-size: 28px;
  font-weight: 700;
  text-align: center;
}

.villages-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

@media (max-aspect-ratio: 1 / 1) {
  .page-title {
    margin-bottom: 15px;
    font-size: 24px;
  }

  .villages-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
