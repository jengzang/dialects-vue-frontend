<template>
  <div class="tools-page">
    <h2 class="page-title">{{ $t('tools.title') }}</h2>

    <div class="tools-grid">
      <button class="entry-button" @click="handleDataCheck">
        <div class="entry-button__icon">🔍</div>
        <div class="entry-button__name">
          {{ $t('tools.dataCheck.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('tools.dataCheck.desc') }}
        </div>
      </button>

      <button class="entry-button" @click="handleJyutpingToIpa">
        <div class="entry-button__icon">🔄</div>
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
        <div class="entry-button__icon">👂️</div>
        <div class="entry-button__name">
          {{ $t('tools.praatAnalysis.name') }}
        </div>
        <div class="entry-button__desc">
          {{ $t('tools.praatAnalysis.desc') }}
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
</script>

<style scoped lang="scss">
.tools-page {
  min-width: 80dvw;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.page-title {
  margin: 0 0 30px;
  color: var(--text-primary);
  font-size: 32px;
  font-weight: 700;
  text-align: center;
}

.tools-grid {
  width: 100%;
  max-width: 1000px;
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(250px, 1fr)
  );
  gap: 20px;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>