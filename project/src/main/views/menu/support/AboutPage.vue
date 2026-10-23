<template>
  <div class="about-page-wrapper">
    <TabSwitcher
      :tabs="tabs"
      :model-value="currentTab"
      :route-value="currentTab"
      :resolve-route="resolveTabRoute"
    >
      <template #default="{ currentTab }">
        <AboutIntro v-if="currentTab === 'intro'" />
        <AboutHistory v-if="currentTab === 'history'" />
        <AboutSuggestion v-if="currentTab === 'suggestion'" />
        <AboutSupport v-if="currentTab === 'like'" />
      </template>
    </TabSwitcher>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import TabSwitcher from '@/components/common/TabSwitcher.vue'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import AboutIntro from './about/AboutIntro.vue'
import AboutHistory from './about/AboutHistory.vue'
import AboutSuggestion from './about/AboutSuggestion.vue'
import AboutSupport from './about/AboutSupport.vue'

const { t } = useI18n()
const route = useRoute()

const pathSectionToTab = {
  intro: 'intro',
  history: 'history',
  suggestion: 'suggestion',
  like: 'like'
}

const tabToPathSection = {
  intro: 'intro',
  history: 'history',
  suggestion: 'suggestion',
  like: 'like'
}

const currentTab = computed(() => {
  const section = route.params.section
  if (typeof section === 'string' && pathSectionToTab[section]) {
    return pathSectionToTab[section]
  }

  return 'intro'
})

const tabs = computed(() => [
  { name: 'intro', label: t('about.tabs.intro') },
  { name: 'history', label: t('about.tabs.history') },
  { name: 'suggestion', label: t('about.tabs.suggestion') },
  { name: 'like', label: t('about.tabs.like') },
])

function resolveTabRoute(tabName) {
  const section = tabToPathSection[tabName] || 'intro'
  return {
    path: buildLocalePath(resolveRouteLocale(route), `/menu/about/${section}`),
    query: route.query
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.about-page-wrapper {
  width: 100%;
  height: 100%;
}
</style>
