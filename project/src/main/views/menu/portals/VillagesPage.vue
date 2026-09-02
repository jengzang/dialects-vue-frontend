<template>
  <div class="villages-page">
    <h1 class="page-title"><BarIcon icon="🏘️" />{{ $t('navigation.pageTitles.portals.villages') }}</h1>

    <div class="villages-grid">
      <RouterLink class="portal-entry-card glass-card" data-interactive="true" :to="localeTo('/explore/villages/toponyms')">
        <div class="portal-entry-card__icon"><InlineIcon icon="📍" /></div>
        <div class="portal-entry-card__name">
          {{ $t('villages.toponyms.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('villages.toponyms.desc') }}
        </div>
      </RouterLink>

      <RouterLink class="portal-entry-card glass-card" data-interactive="true" :to="localeTo('/explore/villages/gd')">
        <div class="portal-entry-card__icon"><InlineIcon icon="🏘️" /></div>
        <div class="portal-entry-card__name">
          {{ $t('villages.gdVillages.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('villages.gdVillages.desc') }}
        </div>
      </RouterLink>

      <RouterLink class="portal-entry-card glass-card" data-interactive="true" :to="localeTo('/explore/villages/ml')">
        <div class="portal-entry-card__icon"><InlineIcon icon="🤖" /></div>
        <div class="portal-entry-card__name">
          {{ $t('villages.villagesML.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('villages.villagesML.desc') }}
        </div>
      </RouterLink>

      <RouterLink class="portal-entry-card glass-card" data-interactive="true" :to="localeTo('/explore/villages/table')">
        <div class="portal-entry-card__icon"><InlineIcon icon="📊" /></div>
        <div class="portal-entry-card__name">
          {{ $t('villages.gdVillagesTable.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('villages.gdVillagesTable.desc') }}
        </div>
      </RouterLink>

      <RouterLink class="portal-entry-card glass-card" data-interactive="true" :to="localeTo('/explore/yc/villages')">
        <div class="portal-entry-card__icon"><InlineIcon icon="🌾" /></div>
        <div class="portal-entry-card__name">
          {{ $t('villages.ycVillages.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('villages.ycVillages.desc') }}
        </div>
      </RouterLink>

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

const localeTo = (path) => buildLocalePath(resolveRouteLocale(route), path)

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
