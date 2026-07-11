<template>
  <div class="villages-page">
      <h2 class="page-title">{{ $t('villages.title') }}</h2>

      <div class="villages-grid">

        <button class="village-btn" @click="handleGdVillages">
          <div class="village-icon">🏘️</div>
          <div class="village-name">{{ $t('villages.gdVillages.name') }}</div>
          <div class="village-desc">{{ $t('villages.gdVillages.desc') }}</div>
        </button>

        <button class="village-btn" @click="handleVillagesML">
          <div class="village-icon">🤖</div>
          <div class="village-name">{{ $t('villages.villagesML.name') }}</div>
          <div class="village-desc">{{ $t('villages.villagesML.desc') }}</div>
        </button>

        <button class="village-btn" @click="handleGdVillagesTable">
          <div class="village-icon">📈</div>
          <div class="village-name">{{ $t('villages.gdVillagesTable.name') }}</div>
          <div class="village-desc">{{ $t('villages.gdVillagesTable.desc') }}</div>
        </button>

        <button class="village-btn" @click="handleYcVillages">
          <div class="village-icon">🏠</div>
          <div class="village-name">{{ $t('villages.ycVillages.name') }}</div>
          <div class="village-desc">{{ $t('villages.ycVillages.desc') }}</div>
        </button>

        <button v-if="userStore.role === 'admin'" class="village-btn" @click="handleAllVillages">
          <div class="village-icon">📋</div>
          <div class="village-name">{{ $t('villages.allVillages.name') }}</div>
          <div class="village-desc">{{ $t('villages.allVillages.desc') }}</div>
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
@use '@/styles/global/mixins' as *;

.villages-page {
  min-width: 80dvw;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 70dvh;
}

.page-title {
  margin: 0 0 40px 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-deep);
  text-align: center;
}

.villages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  width: 100%;
}

.village-btn {
  padding: 24px 16px;
  border: 2px solid var(--glass-40);
  border-radius: var(--radius-xl);
  background: linear-gradient(145deg, var(--glass-30), var(--glass-20));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.3s ease;
  @include flex-col;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.village-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.08);
  background: linear-gradient(145deg, var(--glass-50), var(--glass-30));
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.village-btn:active {
  transform: translateY(-2px);
}

.village-icon {
  font-size: 48px;
  line-height: 1;
}

.village-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary-hover);
}

.village-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  line-height: 1.4;
}

/* 移动端适配 */
@media (max-aspect-ratio: 1/1) {
  .page-title {
    font-size: 24px;
    margin-bottom: 15px;
  }

  .villages-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .village-btn {
    padding: 12px 12px;
  }

  .village-icon {
    font-size: 30px;
  }

  .village-name {
    font-size: 18px;
  }

  .village-desc {
    font-size: 12px;
  }
}
</style>
