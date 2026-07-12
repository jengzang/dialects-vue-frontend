<template>
  <div class="pho-page">
    <TabsContainer
      :tabs="tabs"
      :model-value="currentTab"
      :route-value="currentTab"
      :resolve-route="resolveTabRoute"
    >
      <template #default="{ currentTab }">
        <div class="pho-content">
          <KeepAlive>
            <component :is="getTabComponent(currentTab)" />
          </KeepAlive>
        </div>
      </template>
    </TabsContainer>
  </div>
</template>

<script setup>
import { KeepAlive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import TabsContainer from '@/components/common/TabsContainer.vue'
import PhonologyMatrixPage from '@/main/components/pho/PhonologyPage.vue'
import PhonologyCustomPage from '@/main/components/pho/PhonologyCustom.vue'
import CountphosPage from '@/main/components/pho/Countphos.vue'
import EvolutionPage from '@/main/components/pho/EvolutionPage.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const pathSectionToTab = {
  matrix: 'phonologyMatrix',
  custom: 'phonologyCustom',
  count: 'Countphos',
  evolution: 'evolution'
}

const tabToPathSection = {
  phonologyMatrix: 'matrix',
  phonologyCustom: 'custom',
  Countphos: 'count',
  evolution: 'evolution'
}

const currentTab = computed(() => {
  const routeSection = route.params.section
  if (typeof routeSection === 'string' && pathSectionToTab[routeSection]) {
    return pathSectionToTab[routeSection]
  }

  return 'phonologyMatrix'
})

const tabs = computed(() => [
  { name: 'phonologyMatrix', label: t('phonology.tabs.matrix') },
  { name: 'phonologyCustom', label: t('phonology.tabs.custom') },
  { name: 'Countphos', label: t('phonology.tabs.count') },
  { name: 'evolution', label: t('phonology.tabs.evolution') }
])

const tabComponentMap = {
  phonologyMatrix: PhonologyMatrixPage,
  phonologyCustom: PhonologyCustomPage,
  Countphos: CountphosPage,
  evolution: EvolutionPage
}

const getTabComponent = (tabName) => tabComponentMap[tabName] || PhonologyMatrixPage

const resolveTabRoute = (tabName) => {
  const section = tabToPathSection[tabName] || 'matrix'
  return {
    path: buildLocalePath(resolveRouteLocale(route), `/menu/pho/${section}`),
    query: route.query
  }
}
</script>

<style scoped lang="scss">
.pho-page {
  width: 100%;
}

.pho-content {
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
