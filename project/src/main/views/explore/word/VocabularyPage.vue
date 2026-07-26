<template>
  <div class="vocabulary-page">
    <div class="page-tab-navigation">
      <div class="page-tab-container" role="tablist" :aria-label="t('words.wordList.tabs.label')">
        <button
          v-for="tab in pageTabs"
          :key="tab.path"
          class="page-tab-btn"
          :class="{ active: isActivePage(tab.path) }"
          type="button"
          role="tab"
          :aria-selected="isActivePage(tab.path)"
          @click="navigateTo(tab.path)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <router-view
      :vocabulary-me="vocabularyMe"
      :is-loading-vocabulary-me="isLoadingVocabularyMe"
      :vocabulary-me-error="vocabularyMeError"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getVocabularyMe } from '@/api'
import { buildLocalePath, resolveRouteLocale, stripLocaleFromPath } from '@/i18n/localeRouting.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const vocabularyMe = ref(null)
const isLoadingVocabularyMe = ref(false)
const vocabularyMeError = ref('')
const canUploadVocabulary = computed(() => vocabularyMe.value?.can_upload === true)
const hasVocabularyPermission = computed(() => Boolean(vocabularyMe.value?.permission_level))

const pageTabs = computed(() => {
  const tabs = [
    { label: t('words.wordList.tabs.list'), path: '/explore/vocabulary/view' },
  ]

  if (canUploadVocabulary.value) {
    tabs.push({ label: t('words.wordList.tabs.upload'), path: '/explore/vocabulary/import' })
  }

  if (hasVocabularyPermission.value) {
    tabs.push({ label: t('words.wordList.tabs.manage'), path: '/explore/vocabulary/manage' })
  }

  return tabs
})

async function loadVocabularyMe() {
  isLoadingVocabularyMe.value = true
  vocabularyMeError.value = ''

  try {
    vocabularyMe.value = await getVocabularyMe()
  } catch (error) {
    vocabularyMe.value = {
      user_id: null,
      permission_level: null,
      can_upload: false,
      can_manage_entries: false,
      can_view_logs: false,
    }
    vocabularyMeError.value = error.message || ''
  } finally {
    isLoadingVocabularyMe.value = false
  }
}

function isActivePage(path) {
  return stripLocaleFromPath(route.path) === path
}

function navigateTo(path) {
  router.push(buildLocalePath(resolveRouteLocale(route), path))
}

function redirectUnavailablePage() {
  const currentPath = stripLocaleFromPath(route.path)
  const canUseCurrentPage = pageTabs.value.some((tab) => tab.path === currentPath)

  if (!canUseCurrentPage) {
    navigateTo('/explore/vocabulary/view')
  }
}

onMounted(() => {
  loadVocabularyMe()
})

watch([pageTabs, () => route.path], () => {
  redirectUnavailablePage()
})
</script>

<style scoped lang="scss" src="./vocabulary/vocabulary.scss"></style>
