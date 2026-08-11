<template>
  <div class="vocabulary-manage-page">
    <RadioGroup
      v-if="!shouldShowAccessGate"
      v-model="manageSection"
      :options="manageSectionOptions"
      name="manage-section"
      class="contribute-mode-switch"
    />
    <section v-if="shouldShowAccessGate" class="content-area">
      <div class="access-gate glass-panel">
        <h3>{{ accessGateTitle }}</h3>
        <p>{{ accessGateDescription }}</p>
        <div class="access-gate-actions">
          <button
            v-if="requiresLogin"
            class="main-glass-button"
            data-variant="primary"
            type="button"
            @click="navigateToAuth()"
          >
            {{ t('words.wordList.access.loginAction') }}
          </button>
          <button class="main-glass-button" data-variant="secondary" type="button" @click="navigateToList">
            {{ t('words.wordList.access.backToList') }}
          </button>
        </div>
      </div>
    </section>

    <KeepAlive v-if="!shouldShowAccessGate">
      <ManageEntriesSection
        v-if="manageSection === 'entries'"
        :has-vocabulary-permission="hasVocabularyPermission"
        :manage-user-id="effectiveVocabularyMe?.user_id"
        :manage-permission-level="effectiveVocabularyMe?.permission_level"
      />
      <ManageLocationsSection
        v-else-if="manageSection === 'locations'"
        :has-vocabulary-permission="hasVocabularyPermission"
        :can-delete-location="canViewVocabularyLogs"
      />
      <ManageLogsSection
        v-else-if="manageSection === 'logs'"
        :can-view-vocabulary-logs="canViewVocabularyLogs"
      />
    </KeepAlive>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { getVocabularyMe } from '@/api'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import ManageEntriesSection from './ManageEntriesSection.vue'
import ManageLocationsSection from './ManageLocationsSection.vue'
import ManageLogsSection from './ManageLogsSection.vue'
import { buildLocalePath, resolveRouteLocale, stripLocaleFromPath } from '@/i18n/localeRouting.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const props = defineProps({
  vocabularyMe: { type: Object, default: null },
  isLoadingVocabularyMe: { type: Boolean, default: false },
  vocabularyMeError: { type: String, default: '' },
  isAuthenticated: { type: Boolean, default: false },
  isAuthReady: { type: Boolean, default: false },
})

const localVocabularyMe = ref(null)

const effectiveVocabularyMe = computed(() => props.vocabularyMe || localVocabularyMe.value)
const hasVocabularyPermission = computed(() => Boolean(effectiveVocabularyMe.value?.permission_level))
const canViewVocabularyLogs = computed(() => effectiveVocabularyMe.value?.can_view_logs === true)

const entriesTabLabel = computed(() => {
  if (effectiveVocabularyMe.value?.permission_level === 'edit') {
    return t('words.wordList.tabs.myEntries')
  }
  return t('words.wordList.tabs.allEntries')
})

const manageSectionOptions = computed(() => {
  const options = []
  if (hasVocabularyPermission.value) {
    options.push({ value: 'entries', label: entriesTabLabel.value })
    options.push({ value: 'locations', label: t('words.wordList.locations.title') })
  }
  if (canViewVocabularyLogs.value) {
    options.push({ value: 'logs', label: t('words.wordList.logs.title') })
  }
  return options
})

function resolveManageSection(querySection) {
  if (querySection === 'locations') return 'locations'
  if (querySection === 'logs') return 'logs'
  return 'entries'
}

const manageSection = ref(resolveManageSection(route.query.section))

watch(manageSection, (val) => {
  const current = route.query.section
  if (current !== val) {
    router.replace({ query: { ...route.query, section: val || undefined } })
  }
})

watch(() => route.query.section, (q) => {
  const section = resolveManageSection(q)
  if (manageSection.value !== section) {
    manageSection.value = section
  }
})

const isWaitingForAuth = computed(() => !props.isAuthReady || props.isLoadingVocabularyMe)
const requiresLogin = computed(() => props.isAuthReady && !props.isAuthenticated)
const requiresVocabularyPermission = computed(() => (
  props.isAuthReady
  && props.isAuthenticated
  && !props.isLoadingVocabularyMe
  && !hasVocabularyPermission.value
  && !props.vocabularyMeError
))
const shouldShowAccessGate = computed(() => (
  isWaitingForAuth.value
  || requiresLogin.value
  || requiresVocabularyPermission.value
  || Boolean(props.vocabularyMeError)
))
const accessGateTitle = computed(() => {
  if (isWaitingForAuth.value) return t('words.wordList.access.loadingTitle')
  if (requiresLogin.value) return t('words.wordList.access.loginManageTitle')
  if (props.vocabularyMeError) return t('words.wordList.access.permissionLoadFailedTitle')
  return t('words.wordList.access.noManagePermissionTitle')
})
const accessGateDescription = computed(() => {
  if (isWaitingForAuth.value) return t('words.wordList.access.loadingDesc')
  if (requiresLogin.value) return t('words.wordList.access.loginManageDesc')
  if (props.vocabularyMeError) return props.vocabularyMeError
  return t('words.wordList.access.noManagePermissionDesc')
})

async function ensureVocabularyMe() {
  if (props.vocabularyMe) {
    return props.vocabularyMe
  }
  localVocabularyMe.value = await getVocabularyMe()
  return localVocabularyMe.value
}

function navigateToAuth() {
  router.push({
    path: buildLocalePath(resolveRouteLocale(route), '/auth'),
    query: { view: 'login', redirect: route.fullPath },
  })
}

function navigateToList() {
  router.push(buildLocalePath(resolveRouteLocale(route), '/menu/vocabulary/view'))
}

watch(() => [
  props.isAuthReady,
  props.isAuthenticated,
  props.vocabularyMe?.permission_level,
  props.vocabularyMe?.can_view_logs,
], () => {
  if (shouldShowAccessGate.value) {
    return
  }
  ensureVocabularyMe().catch(() => null)
}, { immediate: true })
</script>

<script>
export default {
  name: 'VocabularyManagePage'
}
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
