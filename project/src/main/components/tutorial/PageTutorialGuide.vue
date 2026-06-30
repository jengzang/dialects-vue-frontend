<template>
  <div
    v-if="tutorialEnabled && currentMatchedEntry"
    class="page-tutorial-guide"
    :style="guideStyle"
    data-page-tutorial-guide
  >
    <TutorialDiceTrigger
      :entry="currentMatchedEntry"
      :has-dice-config="Boolean(currentDiceEntry)"
      @open="openGuide"
      @apply-dice="applyDiceConfig"
    />

    <TutorialGuideModal
      ref="guideModalRef"
      :model-value="isOpen"
      :current-entry="currentMatchedEntry"
      :current-dice-entry="currentDiceEntry"
      :grouped-entries="groupedEntries"
      :selected-entry="selectedEntry"
      :selected-document="selectedDocument"
      :selected-index="selectedIndex"
      :total-count="tutorialEntries.length"
      :previous-entry="previousEntry"
      :next-entry="nextEntry"
      :is-compact="isCompact"
      :is-mobile-landscape="isMobileLandscape"
      :is-catalog-open="isCatalogOpen"
      @update:model-value="handleModalChange"
      @update:is-catalog-open="isCatalogOpen = $event"
      @select-entry="selectEntry"
      @previous="goPrevious"
      @next="goNext"
      @apply-dice="applyDiceConfig"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { tutorialEnabled, requestTutorialAssistApply } from '@/main/store/store.js'
import { tutorialManifest } from './tutorialManifest'
import { resolveTutorialDocument } from './tutorialMarkdown'
import { tutorialDiceConfig } from './tutorialDiceConfig'
import TutorialDiceTrigger from './TutorialDiceTrigger.vue'
import TutorialGuideModal from './TutorialGuideModal.vue'

const props = defineProps({
  bottomOffset: {
    type: String,
    default: '80dvh',
  },
  mobileBottomOffset: {
    type: String,
    default: '63dvh',
  },
  rightOffset: {
    type: String,
    default: '16px',
  },
  mobileRightOffset: {
    type: String,
    default: '16px',
  },
})

const route = useRoute()
const { locale, t } = useI18n()

const isOpen = ref(false)
const isCatalogOpen = ref(false)
const selectedKey = ref('')
const guideModalRef = ref(null)

const viewport = ref({
  width: typeof window === 'undefined' ? 1280 : window.innerWidth,
  height: typeof window === 'undefined' ? 800 : window.innerHeight,
})

const isCompact = computed(() => viewport.value.width <= 900)
const isMobileLandscape = computed(() => {
  return isCompact.value && viewport.value.width > viewport.value.height
})

const guideStyle = computed(() => ({
  '--tutorial-guide-bottom': isCompact.value ? props.mobileBottomOffset : props.bottomOffset,
  '--tutorial-guide-right': isCompact.value ? props.mobileRightOffset : props.rightOffset,
}))

const tutorialEntries = computed(() => {
  return tutorialManifest
    .map((entry) => {
      const document = resolveTutorialDocument(entry.docKey, locale.value)

      return {
        ...entry,
        document,
        title: document?.title || entry.key,
        summary: document?.summary || t('tutorial.ui.missing'),
        groupLabel: t(`tutorial.groups.${entry.groupKey}`),
      }
    })
    .sort((left, right) => left.order - right.order)
})

const tutorialEntryMap = computed(() => {
  return new Map(tutorialEntries.value.map((entry) => [entry.key, entry]))
})

const groupedEntries = computed(() => {
  const groups = new Map()

  for (const entry of tutorialEntries.value) {
    if (!groups.has(entry.groupKey)) {
      groups.set(entry.groupKey, {
        key: entry.groupKey,
        label: entry.groupLabel,
        entries: [],
      })
    }

    groups.get(entry.groupKey).entries.push(entry)
  }

  return [...groups.values()]
})

const currentMatchedEntry = computed(() => {
  return tutorialEntries.value.find((entry) => entry.match(route)) || null
})

const currentDiceEntry = computed(() => {
  const entryKey = currentMatchedEntry.value?.key
  if (!entryKey) {
    return null
  }

  const candidate = tutorialDiceConfig[entryKey]
  if (!candidate?.enabled) {
    return null
  }

  if (typeof candidate.when === 'function' && !candidate.when({ route })) {
    return null
  }

  return candidate
})

const selectedEntry = computed(() => {
  const selected = tutorialEntryMap.value.get(selectedKey.value)
  return selected || currentMatchedEntry.value || tutorialEntries.value[0]
})

const selectedDocument = computed(() => {
  return selectedEntry.value?.document || null
})

const selectedIndex = computed(() => {
  return tutorialEntries.value.findIndex((entry) => entry.key === selectedEntry.value.key)
})

const previousEntry = computed(() => {
  const index = selectedIndex.value
  if (index <= 0) {
    return null
  }

  return tutorialEntries.value[index - 1]
})

const nextEntry = computed(() => {
  const index = selectedIndex.value
  if (index < 0 || index >= tutorialEntries.value.length - 1) {
    return null
  }

  return tutorialEntries.value[index + 1]
})

function updateViewport() {
  if (typeof window === 'undefined') {
    return
  }

  viewport.value = {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

function scrollSelectionIntoView() {
  nextTick(() => {
    guideModalRef.value?.scrollSelectionIntoView?.()
  })
}

function openGuide() {
  if (!currentMatchedEntry.value) {
    return
  }

  selectedKey.value = currentMatchedEntry.value.key
  isCatalogOpen.value = true
  isOpen.value = true
  scrollSelectionIntoView()
}

function handleModalChange(value) {
  isOpen.value = value

  if (!value) {
    return
  }

  if (currentMatchedEntry.value) {
    selectedKey.value = currentMatchedEntry.value.key
  }

  if (!isCompact.value || isMobileLandscape.value) {
    isCatalogOpen.value = true
  }

  scrollSelectionIntoView()
}

function selectEntry(key) {
  if (!tutorialEntryMap.value.has(key)) {
    return
  }

  selectedKey.value = key

  if (isCompact.value && !isMobileLandscape.value) {
    isCatalogOpen.value = false
  }

  scrollSelectionIntoView()
}

function goPrevious() {
  if (previousEntry.value) {
    selectEntry(previousEntry.value.key)
  }
}

function goNext() {
  if (nextEntry.value) {
    selectEntry(nextEntry.value.key)
  }
}

function applyDiceConfig() {
  if (!currentDiceEntry.value) {
    return
  }

  requestTutorialAssistApply(
    currentDiceEntry.value.target,
    currentDiceEntry.value.createPayload({ route })
  )

  // 从弹窗内点击 tutorial-experience__button 后，自动关闭弹窗；
  // 从外部骰子点击时，isOpen 本来就是 false，不会有副作用。
  isOpen.value = false
}

watch(currentMatchedEntry, (entry) => {
  if (!entry) {
    selectedKey.value = ''
    isOpen.value = false
    return
  }

  if (!selectedKey.value || !tutorialEntryMap.value.has(selectedKey.value)) {
    selectedKey.value = entry.key
  }

  if (!isOpen.value) {
    return
  }

  selectedKey.value = entry.key

  if (!isCompact.value || isMobileLandscape.value) {
    isCatalogOpen.value = true
  }

  scrollSelectionIntoView()
}, { immediate: true })

watch(locale, () => {
  if (!selectedEntry.value) {
    return
  }

  scrollSelectionIntoView()
})

watch([isCompact, isMobileLandscape], ([compact, landscape]) => {
  if (!compact || landscape) {
    isCatalogOpen.value = true
    return
  }

  if (!isOpen.value) {
    isCatalogOpen.value = false
  }
})

onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport)
  window.addEventListener('orientationchange', updateViewport)

  if (!isCompact.value || isMobileLandscape.value) {
    isCatalogOpen.value = true
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
  window.removeEventListener('orientationchange', updateViewport)
})
</script>

<style lang="scss" scoped>
.page-tutorial-guide {
  --tutorial-guide-bottom: 30px;
  --tutorial-guide-right: 30px;
}
</style>