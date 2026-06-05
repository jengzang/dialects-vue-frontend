<template>
  <div
    v-if="tutorialEnabled && currentMatchedEntry"
    class="page-tutorial-guide"
    :style="guideStyle"
    data-page-tutorial-guide
  >
    <button
      type="button"
      class="tutorial-trigger"
      :title="t('tutorial.ui.openLabel', { title: currentMatchedEntry.title })"
      :aria-label="t('tutorial.ui.openLabel', { title: currentMatchedEntry.title })"
      data-tutorial-trigger
      @click="openGuide"
    >
      <span class="tutorial-trigger__dice">🎲</span>
      <span class="tutorial-trigger__copy">
        <span class="tutorial-trigger__eyebrow">{{ t('tutorial.assist.badge') }}</span>
        <span class="tutorial-trigger__label">{{ t('tutorial.ui.triggerLabel') }}</span>
      </span>
    </button>

    <AppModal
      :model-value="isOpen"
      size="lg"
      :title="t('tutorial.ui.modalTitle')"
      :close-label="t('tutorial.ui.closeLabel')"
      width="min(1080px, 96dvw)"
      max-height="min(82dvh, 780px)"
      @update:model-value="handleModalChange"
    >
      <div
        ref="modalBodyRef"
        class="tutorial-shell"
        :class="{ 'is-mobile': isCompact }"
        data-tutorial-modal
      >
        <div class="tutorial-shell__topbar">
          <div class="tutorial-shell__current">
            <span class="tutorial-shell__current-label">{{ t('tutorial.ui.currentPage') }}</span>
            <strong class="tutorial-shell__current-value">{{ currentMatchedEntry.title }}</strong>
          </div>

          <button
            v-if="isCompact"
            type="button"
            class="tutorial-shell__catalog-toggle"
            @click="isCatalogOpen = !isCatalogOpen"
          >
            {{ isCatalogOpen ? t('tutorial.ui.collapseCatalog') : t('tutorial.ui.expandCatalog') }}
          </button>
        </div>

        <section
          v-if="currentDiceEntry"
          class="tutorial-experience"
          data-tutorial-experience
        >
          <div class="tutorial-experience__body">
            <p class="tutorial-experience__eyebrow">{{ t('tutorial.assist.experience.badge') }}</p>
            <h3 class="tutorial-experience__title">{{ t(currentDiceEntry.titleKey) }}</h3>
            <p class="tutorial-experience__description">{{ t(currentDiceEntry.descriptionKey) }}</p>
          </div>

          <button
            type="button"
            class="tutorial-experience__button"
            @click="applyDiceConfig"
          >
            <span class="tutorial-experience__button-icon">🎲</span>
            <span>{{ t(currentDiceEntry.buttonKey) }}</span>
          </button>
        </section>

        <div class="tutorial-shell__body">
          <aside
            v-show="!isCompact || isCatalogOpen"
            class="tutorial-catalog"
          >
            <section
              v-for="group in groupedEntries"
              :key="group.key"
              class="tutorial-catalog__group"
            >
              <h3 class="tutorial-catalog__group-title">
                {{ group.label }}
              </h3>

              <button
                v-for="entry in group.entries"
                :key="entry.key"
                type="button"
                class="tutorial-entry"
                :class="{
                  'is-active': entry.key === selectedEntry.key,
                  'is-current-route': entry.key === currentMatchedEntry.key
                }"
                :data-tutorial-key="entry.key"
                data-tutorial-entry
                @click="selectEntry(entry.key)"
              >
                <span class="tutorial-entry__title-row">
                  <span class="tutorial-entry__title">{{ entry.title }}</span>
                  <span
                    v-if="entry.key === currentMatchedEntry.key"
                    class="tutorial-entry__badge"
                  >
                    {{ t('tutorial.ui.currentBadge') }}
                  </span>
                </span>
                <span class="tutorial-entry__summary">{{ entry.summary }}</span>
              </button>
            </section>
          </aside>

          <article class="tutorial-article">
            <div
              ref="articleTopRef"
              class="tutorial-article__anchor"
            />
            <p class="tutorial-article__group">
              {{ selectedEntry.groupLabel }}
            </p>
            <h2
              class="tutorial-article__title"
              data-tutorial-title
            >
              {{ selectedEntry.title }}
            </h2>
            <p class="tutorial-article__summary">
              {{ selectedEntry.summary }}
            </p>

            <!-- eslint-disable vue/no-v-html -->
            <div
              v-if="selectedDocument?.html"
              class="tutorial-article__content"
              data-tutorial-content
              v-html="selectedDocument.html"
            />
            <!-- eslint-enable vue/no-v-html -->

            <p
              v-else
              class="tutorial-article__paragraph"
            >
              {{ t('tutorial.ui.missing') }}
            </p>
          </article>
        </div>

        <div class="tutorial-pagination">
          <button
            type="button"
            class="tutorial-pagination__button"
            :disabled="!previousEntry"
            data-tutorial-prev
            @click="goPrevious"
          >
            {{ t('tutorial.ui.previous') }}
          </button>

          <span class="tutorial-pagination__status">
            {{ selectedIndex + 1 }} / {{ tutorialEntries.length }}
          </span>

          <button
            type="button"
            class="tutorial-pagination__button"
            :disabled="!nextEntry"
            data-tutorial-next
            @click="goNext"
          >
            {{ t('tutorial.ui.next') }}
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import { tutorialEnabled, requestTutorialAssistApply } from '@/main/store/store.js'
import { tutorialManifest } from './tutorialManifest'
import { resolveTutorialDocument } from './tutorialMarkdown'
import { tutorialDiceConfig } from './tutorialDiceConfig'

const props = defineProps({
  bottomOffset: {
    type: String,
    default: '30px',
  },
  mobileBottomOffset: {
    type: String,
    default: '20px',
  },
  rightOffset: {
    type: String,
    default: '30px',
  },
  mobileRightOffset: {
    type: String,
    default: '20px',
  },
})

const route = useRoute()
const { locale, t } = useI18n()

const isOpen = ref(false)
const isCatalogOpen = ref(false)
const selectedKey = ref('')
const viewportWidth = ref(typeof window === 'undefined' ? 1280 : window.innerWidth)
const modalBodyRef = ref(null)
const articleTopRef = ref(null)

const isCompact = computed(() => viewportWidth.value <= 900)

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

function updateViewportWidth() {
  if (typeof window === 'undefined') {
    return
  }

  viewportWidth.value = window.innerWidth
}

function scrollSelectionIntoView() {
  nextTick(() => {
    articleTopRef.value?.scrollIntoView?.({ block: 'start' })
    const activeEntryElement = modalBodyRef.value?.querySelector?.(
      `[data-tutorial-key="${selectedEntry.value.key}"]`
    )
    activeEntryElement?.scrollIntoView?.({ block: 'nearest' })
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
  if (!isCompact.value) {
    isCatalogOpen.value = true
  }

  scrollSelectionIntoView()
}

function selectEntry(key) {
  if (!tutorialEntryMap.value.has(key)) {
    return
  }

  selectedKey.value = key
  if (isCompact.value) {
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
  if (!isCompact.value) {
    isCatalogOpen.value = true
  }
  scrollSelectionIntoView()
}, { immediate: true })

watch(locale, () => {
  if (!selectedEntry.value) {
    return
  }

  nextTick(() => {
    scrollSelectionIntoView()
  })
})

watch(isCompact, (compact) => {
  if (!compact) {
    isCatalogOpen.value = true
    return
  }

  if (!isOpen.value) {
    isCatalogOpen.value = false
  }
})

onMounted(() => {
  updateViewportWidth()
  window.addEventListener('resize', updateViewportWidth)
  if (!isCompact.value) {
    isCatalogOpen.value = true
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportWidth)
})
</script>

<style scoped>
.page-tutorial-guide {
  position: fixed;
  right: var(--tutorial-guide-right);
  bottom: var(--tutorial-guide-bottom);
  z-index: 60;
}

.tutorial-trigger {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(228, 241, 255, 0.92));
  box-shadow:
    0 14px 32px rgba(64, 118, 176, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  color: #19507e;
  cursor: pointer;
  backdrop-filter: blur(14px) saturate(135%);
  -webkit-backdrop-filter: blur(14px) saturate(135%);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.tutorial-trigger:hover {
  transform: translateY(-2px);
  box-shadow:
    0 18px 36px rgba(64, 118, 176, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.tutorial-trigger__dice {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(180deg, #72b3ff, #4f92ea);
  color: #fff;
  font-size: 1.4rem;
  box-shadow: 0 10px 20px rgba(59, 120, 205, 0.24);
}

.tutorial-trigger__copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.tutorial-trigger__eyebrow {
  font-size: 0.72rem;
  color: #6790b6;
  letter-spacing: 0.04em;
}

.tutorial-trigger__label {
  font-size: 0.96rem;
  font-weight: 700;
  color: #19507e;
}

.tutorial-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.tutorial-shell__topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.tutorial-shell__current {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tutorial-shell__current-label {
  font-size: 0.82rem;
  color: #6d8cab;
}

.tutorial-shell__current-value {
  font-size: 1.1rem;
  color: #173f63;
}

.tutorial-shell__catalog-toggle {
  border: none;
  border-radius: 999px;
  background: rgba(95, 148, 210, 0.12);
  color: #2a5e90;
  padding: 8px 12px;
  cursor: pointer;
}

.tutorial-experience {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 20px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(234, 246, 255, 0.96), rgba(217, 236, 255, 0.9));
  border: 1px solid rgba(163, 202, 240, 0.86);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.72);
}

.tutorial-experience__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tutorial-experience__eyebrow {
  margin: 0;
  color: #6b92b6;
  font-size: 0.76rem;
  letter-spacing: 0.05em;
}

.tutorial-experience__title {
  margin: 0;
  font-size: 1.06rem;
  color: #15466f;
}

.tutorial-experience__description {
  margin: 0;
  color: #466b8c;
  line-height: 1.55;
}

.tutorial-experience__button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(180deg, #4f92ea, #3e7dd0);
  color: #fff;
  padding: 12px 18px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 12px 24px rgba(62, 125, 208, 0.24);
}

.tutorial-experience__button-icon {
  font-size: 1.1rem;
}

.tutorial-shell__body {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 18px;
  min-height: 0;
}

.tutorial-catalog {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-right: 6px;
  overflow: auto;
  max-height: min(54dvh, 560px);
}

.tutorial-catalog__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tutorial-catalog__group-title {
  margin: 0;
  font-size: 0.88rem;
  color: #6e8aa8;
}

.tutorial-entry {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(185, 210, 234, 0.75);
  background: rgba(249, 252, 255, 0.92);
  border-radius: 16px;
  padding: 12px 14px;
  cursor: pointer;
}

.tutorial-entry.is-active {
  border-color: rgba(92, 149, 211, 0.8);
  background: rgba(228, 242, 255, 0.95);
}

.tutorial-entry__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tutorial-entry__title {
  color: #1d4f7a;
  font-weight: 700;
}

.tutorial-entry__badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(91, 150, 212, 0.16);
  color: #2c679b;
  font-size: 0.72rem;
}

.tutorial-entry__summary {
  display: block;
  margin-top: 6px;
  color: #587998;
  line-height: 1.45;
}

.tutorial-article {
  min-width: 0;
  max-height: min(54dvh, 560px);
  overflow: auto;
  padding-right: 4px;
}

.tutorial-article__anchor {
  height: 1px;
}

.tutorial-article__group {
  margin: 0 0 8px;
  color: #6b8ba7;
  font-size: 0.84rem;
}

.tutorial-article__title {
  margin: 0;
  color: #173f63;
}

.tutorial-article__summary {
  margin: 10px 0 18px;
  color: #58738f;
  line-height: 1.6;
}

.tutorial-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.tutorial-pagination__button {
  border: none;
  border-radius: 999px;
  background: rgba(89, 144, 207, 0.14);
  color: #2a5e90;
  padding: 10px 16px;
  cursor: pointer;
}

.tutorial-pagination__button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tutorial-pagination__status {
  color: #6584a0;
  font-size: 0.9rem;
}

@media (max-width: 900px) {
  .tutorial-trigger {
    padding: 10px 12px;
    gap: 10px;
  }

  .tutorial-trigger__dice {
    width: 40px;
    height: 40px;
  }

  .tutorial-trigger__label {
    font-size: 0.88rem;
  }

  .tutorial-experience {
    flex-direction: column;
    align-items: stretch;
  }

  .tutorial-shell__body {
    grid-template-columns: 1fr;
  }

  .tutorial-catalog,
  .tutorial-article {
    max-height: none;
  }
}
</style>
