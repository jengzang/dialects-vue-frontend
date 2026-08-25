<template>
  <div class="tools-page">
    <h1 class="page-title"><BarIcon icon="🛠️" />{{ $t('navigation.pageTitles.portals.tools') }}</h1>

    <div class="tools-grid">
      <RouterLink class="portal-entry-card glass-card" data-interactive="true" :to="localeTo('/explore/tools/check')">
        <div class="portal-entry-card__icon"><InlineIcon icon="📋" /></div>
        <div class="portal-entry-card__name">
          {{ $t('tools.dataCheck.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('tools.dataCheck.desc') }}
        </div>
      </RouterLink>

      <RouterLink class="portal-entry-card glass-card" data-interactive="true" :to="localeTo('/explore/tools/jyut2ipa')">
        <div class="portal-entry-card__icon"><InlineIcon icon="🔤" /></div>
        <div class="portal-entry-card__name">
          {{ $t('tools.jyutpingToIpa.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('tools.jyutpingToIpa.desc') }}
        </div>
      </RouterLink>

      <RouterLink class="portal-entry-card glass-card" data-interactive="true" :to="localeTo('/explore/tools/merge')">
        <div class="portal-entry-card__icon"><InlineIcon icon="🔗" /></div>
        <div class="portal-entry-card__name">
          {{ $t('tools.mergeTables.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('tools.mergeTables.desc') }}
        </div>
      </RouterLink>

      <!-- <button class="portal-entry-card glass-card" data-interactive="true" @click="handleDeriveTables">
        <div class="portal-entry-card__icon"><InlineIcon icon="🧪" /></div>
        <div class="portal-entry-card__name">
          {{ $t('tools.deriveTables.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('tools.deriveTables.desc') }}
        </div>
      </button> -->

      <RouterLink class="portal-entry-card glass-card" data-interactive="true" :to="localeTo('/explore/tools/praat')">
        <div class="portal-entry-card__icon"><InlineIcon icon="🎙️" /></div>
        <div class="portal-entry-card__name">
          {{ $t('tools.praatAnalysis.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('tools.praatAnalysis.desc') }}
        </div>
      </RouterLink>

      <RouterLink class="portal-entry-card glass-card" data-interactive="true" :to="localeTo('/explore/gis')">
        <div class="portal-entry-card__icon"><InlineIcon icon="🗺" /></div>
        <div class="portal-entry-card__name">
          {{ $t('tools.gis.name') }}
        </div>
        <div class="portal-entry-card__desc">
          {{ $t('tools.gis.desc') }}
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import BarIcon from '@/components/common/BarIcon.vue'
import { useRoute } from 'vue-router'
import {
  buildLocalePath,
  resolveRouteLocale
} from '@/i18n/localeRouting.js'

const route = useRoute()

const localeTo = (path) => buildLocalePath(resolveRouteLocale(route), path)
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
