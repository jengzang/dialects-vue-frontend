<template>
  <div class="villages-page">
    <h1 class="page-title"><BarIcon icon="🏘️" />{{ $t('navigation.pageTitles.portals.villages') }}</h1>

    <div class="villages-grid">
      <button class="portal-entry-card glass-card" data-interactive="true" @click="handleToponyms">
        <div class="portal-entry-card__icon"><InlineIcon icon="📍" /></div>
        <div class="portal-entry-card__name">
          {{ $t('villages.toponyms.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('villages.toponyms.desc') }}
        </div>
      </button>

      <button class="portal-entry-card glass-card" data-interactive="true" @click="handleGdVillages">
        <div class="portal-entry-card__icon"><InlineIcon icon="🏘️" /></div>
        <div class="portal-entry-card__name">
          {{ $t('villages.gdVillages.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('villages.gdVillages.desc') }}
        </div>
      </button>

      <button class="portal-entry-card glass-card" data-interactive="true" @click="handleVillagesML">
        <div class="portal-entry-card__icon"><InlineIcon icon="🤖" /></div>
        <div class="portal-entry-card__name">
          {{ $t('villages.villagesML.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('villages.villagesML.desc') }}
        </div>
      </button>

      <button class="portal-entry-card glass-card" data-interactive="true" @click="handleGdVillagesTable">
        <div class="portal-entry-card__icon"><InlineIcon icon="📊" /></div>
        <div class="portal-entry-card__name">
          {{ $t('villages.gdVillagesTable.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('villages.gdVillagesTable.desc') }}
        </div>
      </button>

      <button class="portal-entry-card glass-card" data-interactive="true" @click="handleYcVillages">
        <div class="portal-entry-card__icon"><InlineIcon icon="🌾" /></div>
        <div class="portal-entry-card__name">
          {{ $t('villages.ycVillages.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('villages.ycVillages.desc') }}
        </div>
      </button>

      <button
        v-if="userStore.role === 'admin'"
        class="portal-entry-card glass-card" data-interactive="true"
        @click="handleAllVillages"
      >
        <div class="portal-entry-card__icon"><InlineIcon icon="📋" /></div>
        <div class="portal-entry-card__name">
          {{ $t('villages.allVillages.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('villages.allVillages.desc') }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import BarIcon from '@/components/common/BarIcon.vue'
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { userStore } from '@/main/store/store.js'

const router = useRouter()
const route = useRoute()

const handleToponyms = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/villages/toponyms'))
};

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
@use './portal-page' as *;

.villages-page {
  @include portal-page;
}

.page-title {
  @include portal-page-title;
}

.villages-grid {
  @include portal-grid;
}
</style>
