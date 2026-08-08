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
        <ChoiceSelector
          v-if="isContributeTabActive"
          v-model="contributeSubMode"
          :options="contributeSubModeOptions"
          class="tab-view-mode-selector"
        />
      </div>
    </div>

    <router-view v-slot="{ Component }">
      <KeepAlive :include="['VocabularyViewPage', 'VocabularyImportPage', 'VocabularyManagePage']">
        <component
          :is="Component"
          :vocabulary-me="vocabularyMe"
          :is-loading-vocabulary-me="isLoadingVocabularyMe"
          :vocabulary-me-error="vocabularyMeError"
          :is-authenticated="isAuthenticated"
          :is-auth-ready="isAuthReady"
        />
      </KeepAlive>
    </router-view>
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
import { showError } from '@/utils/ui/message.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const vocabularyMe = ref(null)
const isLoadingVocabularyMe = ref(false)
const vocabularyMeError = ref('')
const isAuthReady = computed(() => userStore.authReady)
const isAuthenticated = computed(() => userStore.isAuthenticated)
const contributeTabPaths = ['/menu/vocabulary/import', '/menu/vocabulary/manage']

function isContributePath(path) {
  return path === '/menu/vocabulary/import' || path.startsWith('/menu/vocabulary/manage')
}

const pageTabs = computed(() => {
  return [
    { label: t('words.wordList.tabs.query'), path: '/menu/vocabulary/view' },
    { label: t('words.wordList.tabs.contribute'), path: '/menu/vocabulary/import' },
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
    showError(vocabularyMeError.value)
  } finally {
    isLoadingVocabularyMe.value = false
  }
}

function isActivePage(tabPath) {
  const currentPath = stripLocaleFromPath(route.path)
  if (tabPath === '/menu/vocabulary/import') {
    return isContributePath(currentPath)
  }
  return currentPath === tabPath
}

const isQueryTabActive = computed(() => {
  return stripLocaleFromPath(route.path) === '/menu/vocabulary/view'
})

const isContributeTabActive = computed(() => {
  return isContributePath(stripLocaleFromPath(route.path))
})

const viewModeOptions = computed(() => [
  { value: 'card', label: t('words.wordList.viewModes.card') },
  { value: 'map', label: t('words.wordList.viewModes.map') },
  { value: 'table', label: t('words.wordList.viewModes.table') },
])

const STORED_VIEW_MODE_KEY = 'vocabulary_view_mode'

const viewModeQuery = computed({
  get: () => {
    const tab = route.query.tab
    if (tab === 'map' || tab === 'table') return tab
    const stored = sessionStorage.getItem(STORED_VIEW_MODE_KEY)
    if (stored === 'map' || stored === 'table') return stored
    return 'card'
  },
  set: (val) => {
    sessionStorage.setItem(STORED_VIEW_MODE_KEY, val)
    router.replace({ query: { ...route.query, tab: val } })
  },
})

const contributeSubModeOptions = computed(() => [
  { value: 'upload', label: t('words.wordList.tabs.uploadTab') },
  { value: 'manage', label: t('words.wordList.tabs.manageTab') },
])

const contributeSubMode = computed({
  get: () => {
    const currentPath = stripLocaleFromPath(route.path)
    return currentPath.startsWith('/menu/vocabulary/manage') ? 'manage' : 'upload'
  },
  set: (val) => {
    const path = val === 'manage' ? '/menu/vocabulary/manage' : '/menu/vocabulary/import'
    router.replace(buildLocalePath(resolveRouteLocale(route), path))
  },
})

function navigateTo(path) {
  if (path === '/menu/vocabulary/import') {
    const currentPath = stripLocaleFromPath(route.path)
    if (isContributePath(currentPath)) {
      return
    }
    path = contributeSubMode.value === 'manage'
      ? '/menu/vocabulary/manage'
      : '/menu/vocabulary/import'
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

<script>
export default {
  name: 'VocabularyPage'
}
</script>

<style scoped lang="scss" src="@/main/views/explore/word/vocabulary/vocabulary.scss"></style>
