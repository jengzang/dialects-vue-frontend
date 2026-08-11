<template>
  <div class="tools-page">
    <h1 class="page-title"><BarIcon icon="🛠️" />{{ $t('navigation.pageTitles.portals.tools') }}</h1>

    <div class="tools-grid">
      <button class="portal-entry-card glass-card" data-interactive="true" @click="handleDataCheck">
        <div class="portal-entry-card__icon"><InlineIcon icon="📋" /></div>
        <div class="portal-entry-card__name">
          {{ $t('tools.dataCheck.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('tools.dataCheck.desc') }}
        </div>
      </button>

      <button class="portal-entry-card glass-card" data-interactive="true" @click="handleJyutpingToIpa">
        <div class="portal-entry-card__icon"><InlineIcon icon="🔤" /></div>
        <div class="portal-entry-card__name">
          {{ $t('tools.jyutpingToIpa.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('tools.jyutpingToIpa.desc') }}
        </div>
      </button>

      <button class="portal-entry-card glass-card" data-interactive="true" @click="handleMergeTables">
        <div class="portal-entry-card__icon"><InlineIcon icon="🔗" /></div>
        <div class="portal-entry-card__name">
          {{ $t('tools.mergeTables.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('tools.mergeTables.desc') }}
        </div>
      </button>

      <!-- <button class="portal-entry-card glass-card" data-interactive="true" @click="handleDeriveTables">
        <div class="portal-entry-card__icon"><InlineIcon icon="🧪" /></div>
        <div class="portal-entry-card__name">
          {{ $t('tools.deriveTables.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('tools.deriveTables.desc') }}
        </div>
      </button> -->

      <button class="portal-entry-card glass-card" data-interactive="true" @click="handlePraatTables">
        <div class="portal-entry-card__icon"><InlineIcon icon="🎙️" /></div>
        <div class="portal-entry-card__name">
          {{ $t('tools.praatAnalysis.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('tools.praatAnalysis.desc') }}
        </div>
      </button>

      <button class="portal-entry-card glass-card" data-interactive="true" @click="handleGis">
        <div class="portal-entry-card__icon"><InlineIcon icon="🗺" /></div>
        <div class="portal-entry-card__name">
          {{ $t('tools.gis.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('tools.gis.desc') }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import BarIcon from '@/components/common/BarIcon.vue'
import { useRoute, useRouter } from 'vue-router'
import {
  buildLocalePath,
  resolveRouteLocale
} from '@/i18n/localeRouting.js'

const router = useRouter()
const route = useRoute()

// 跳转到对应的工具页面
const handleDataCheck = () => {
  router.push(
    buildLocalePath(
      resolveRouteLocale(route),
      '/explore/tools/check'
    )
  )
}

const handleJyutpingToIpa = () => {
  router.push(
    buildLocalePath(
      resolveRouteLocale(route),
      '/explore/tools/jyut2ipa'
    )
  )
}

const handleMergeTables = () => {
  router.push(
    buildLocalePath(
      resolveRouteLocale(route),
      '/explore/tools/merge'
    )
  )
}

// const handleDeriveTables = () => {
//   router.push(
//     buildLocalePath(
//       resolveRouteLocale(route),
//       '/explore/tools/derive'
//     )
//   )
// }

const handlePraatTables = () => {
  router.push(
    buildLocalePath(
      resolveRouteLocale(route),
      '/explore/tools/praat'
    )
  )
}

const handleGis = () => {
  router.push(
    buildLocalePath(
      resolveRouteLocale(route),
      '/explore/gis'
    )
  )
}
</script>

<style scoped lang="scss">
@use './portal-page' as *;

.tools-page {
  @include portal-page;
}

.page-title {
  @include portal-page-title;
}

.tools-grid {
  @include portal-grid;
}
</style>
