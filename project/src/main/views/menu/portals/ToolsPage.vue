<template>
  <div class="tools-page">
    <h2 class="page-title">{{ $t('tools.title') }}</h2>

    <div class="tools-grid">
      <button class="entry-button" @click="handleDataCheck">
        <div class="entry-button__icon">📋</div>
        <div class="entry-button__name">
          {{ $t('tools.dataCheck.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('tools.dataCheck.desc') }}
        </div>
      </button>

      <button class="entry-button" @click="handleJyutpingToIpa">
        <div class="entry-button__icon">🔤</div>
        <div class="entry-button__name">
          {{ $t('tools.jyutpingToIpa.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('tools.jyutpingToIpa.desc') }}
        </div>
      </button>

      <button class="entry-button" @click="handleMergeTables">
        <div class="entry-button__icon">🔗</div>
        <div class="entry-button__name">
          {{ $t('tools.mergeTables.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('tools.mergeTables.desc') }}
        </div>
      </button>

      <!-- <button class="entry-button" @click="handleDeriveTables">
        <div class="entry-button__icon">🧪</div>
        <div class="entry-button__name">
          {{ $t('tools.deriveTables.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('tools.deriveTables.desc') }}
        </div>
      </button> -->

      <button class="entry-button" @click="handlePraatTables">
        <div class="entry-button__icon">🎙️</div>
        <div class="entry-button__name">
          {{ $t('tools.praatAnalysis.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('tools.praatAnalysis.desc') }}
        </div>
      </button>

      <button class="entry-button" @click="handleGis">
        <div class="entry-button__icon">🗺</div>
        <div class="entry-button__name">
          {{ $t('tools.gis.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('tools.gis.desc') }}
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