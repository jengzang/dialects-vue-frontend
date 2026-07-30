<template>
  <div class="vocabulary-page">
    <div class="page-tab-navigation">
      <div class="page-tab-container" role="tablist" :aria-label="t('words.wordList.tabs.label')">
        <button
          class="page-tab-btn"
          :class="{ active: isActivePage(pageTabs[0].path) }"
          type="button"
          role="tab"
          :aria-selected="isActivePage(pageTabs[0].path)"
          @click="navigateTo(pageTabs[0].path)"
        >
          {{ pageTabs[0].label }}
        </button>
        <ChoiceSelector
          v-if="isQueryTabActive"
          v-model="viewModeQuery"
          :options="viewModeOptions"
          class="tab-view-mode-selector"
        />
        <button
          class="page-tab-btn"
          :class="{ active: isActivePage(pageTabs[1].path) }"
          type="button"
          role="tab"
          :aria-selected="isActivePage(pageTabs[1].path)"
          @click="navigateTo(pageTabs[1].path)"
        >
          {{ pageTabs[1].label }}
        </button>
      </div>
    </div>

    <router-view
      :vocabulary-me="vocabularyMe"
      :is-loading-vocabulary-me="isLoadingVocabularyMe"
      :vocabulary-me-error="vocabularyMeError"
      :is-authenticated="isAuthenticated"
      :is-auth-ready="isAuthReady"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getVocabularyMe } from '@/api'
import { buildLocalePath, resolveRouteLocale, stripLocaleFromPath } from '@/i18n/localeRouting.js'
import { userStore } from '@/main/store/store.js'
import ChoiceSelector from '@/components/selector/ChoiceSelector.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const vocabularyMe = ref(null)
const isLoadingVocabularyMe = ref(false)
const vocabularyMeError = ref('')
const isAuthReady = computed(() => userStore.authReady)
const isAuthenticated = computed(() => userStore.isAuthenticated)
const contributeTabPaths = ['/explore/vocabulary/import', '/explore/vocabulary/manage']

const pageTabs = computed(() => {
  return [
    { label: t('words.wordList.tabs.query'), path: '/explore/vocabulary/view' },
    { label: t('words.wordList.tabs.contribute'), path: '/explore/vocabulary/import' },
  ]
})

function createEmptyVocabularyMe() {
  return {
    user_id: null,
    permission_level: null,
    can_upload: false,
    can_manage_entries: false,
    can_view_logs: false,
  }
}

async function loadVocabularyMe() {
  if (!userStore.authReady) {
    isLoadingVocabularyMe.value = true
    return
  }

  if (!userStore.isAuthenticated) {
    vocabularyMe.value = createEmptyVocabularyMe()
    vocabularyMeError.value = ''
    isLoadingVocabularyMe.value = false
    return
  }

  isLoadingVocabularyMe.value = true
  vocabularyMeError.value = ''

  try {
    vocabularyMe.value = await getVocabularyMe()
  } catch (error) {
    vocabularyMe.value = createEmptyVocabularyMe()
    vocabularyMeError.value = error.message || ''
  } finally {
    isLoadingVocabularyMe.value = false
  }
}

function isActivePage(tabPath) {
  const currentPath = stripLocaleFromPath(route.path)
  if (tabPath === '/explore/vocabulary/import') {
    return contributeTabPaths.includes(currentPath)
  }
  return currentPath === tabPath
}

const isQueryTabActive = computed(() => {
  return stripLocaleFromPath(route.path) === '/explore/vocabulary/view'
})

const viewModeOptions = computed(() => [
  { value: 'card', label: t('words.wordList.viewModes.card') },
  { value: 'map', label: t('words.wordList.viewModes.map') },
  { value: 'table', label: t('words.wordList.viewModes.table') },
])

const viewModeQuery = computed({
  get: () => {
    const tab = route.query.tab
    return (tab === 'map' || tab === 'table') ? tab : 'card'
  },
  set: (val) => {
    router.replace({ query: { ...route.query, tab: val } })
  },
})

const lastContributePath = ref('/explore/vocabulary/import')

watch(() => route.path, () => {
  const currentPath = stripLocaleFromPath(route.path)
  if (contributeTabPaths.includes(currentPath)) {
    lastContributePath.value = currentPath
  }
})

function navigateTo(path) {
  if (path === '/explore/vocabulary/import') {
    const currentPath = stripLocaleFromPath(route.path)
    if (contributeTabPaths.includes(currentPath)) {
      return
    }
    path = lastContributePath.value
  }
  router.push(buildLocalePath(resolveRouteLocale(route), path))
}

watch(
  () => [userStore.authReady, userStore.isAuthenticated, userStore.id, userStore.role],
  () => {
    loadVocabularyMe()
  },
  { immediate: true }
)
</script>

<style scoped lang="scss" src="./vocabulary/vocabulary.scss"></style>
