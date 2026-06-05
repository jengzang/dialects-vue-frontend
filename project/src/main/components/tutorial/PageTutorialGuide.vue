<template>
  <div
    v-if="currentMatchedEntry"
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
      <span class="tutorial-trigger__icon">❓</span>
      <span class="tutorial-trigger__label">{{ t('tutorial.ui.triggerLabel') }}</span>
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
import { tutorialManifest } from './tutorialManifest'
import { resolveTutorialDocument } from './tutorialMarkdown'

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

watch(
  () => currentMatchedEntry.value?.key,
  (newKey) => {
    if (!newKey) {
      isOpen.value = false
      selectedKey.value = ''
      isCatalogOpen.value = false
      return
    }

    if (!isOpen.value) {
      selectedKey.value = newKey
      return
    }

    selectedKey.value = newKey

    if (!isCompact.value) {
      isCatalogOpen.value = true
    }

    scrollSelectionIntoView()
  },
  { immediate: true }
)

watch(isCompact, (compact) => {
  if (!compact) {
    isCatalogOpen.value = true
  } else if (!isOpen.value) {
    isCatalogOpen.value = false
  }
})

onMounted(() => {
  updateViewportWidth()
  window.addEventListener('resize', updateViewportWidth)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportWidth)
})
</script>

<style scoped>
.page-tutorial-guide {
  --tutorial-guide-bottom: 30px;
  --tutorial-guide-right: 30px;
}

.tutorial-trigger {
  position: fixed;
  right: calc(var(--tutorial-guide-right) + env(safe-area-inset-right));
  bottom: calc(var(--tutorial-guide-bottom) + env(safe-area-inset-bottom));
  z-index: 1200;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  background:
    linear-gradient(140deg, rgba(255, 255, 255, 0.86), rgba(230, 242, 255, 0.72)),
    rgba(255, 255, 255, 0.72);
  box-shadow:
    0 14px 30px rgba(18, 55, 94, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  color: #0f3c66;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.tutorial-trigger:hover {
  transform: translateY(-2px);
  box-shadow:
    0 18px 34px rgba(18, 55, 94, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.tutorial-trigger:active {
  transform: translateY(0);
}

.tutorial-trigger__icon {
  font-size: 1.1rem;
}

.tutorial-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  color: #17324d;
}

.tutorial-shell__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tutorial-shell__current {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.tutorial-shell__current-label {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(17, 106, 184, 0.1);
  color: #0f5da8;
  font-size: 0.82rem;
  font-weight: 700;
}

.tutorial-shell__current-value {
  font-size: 0.98rem;
}

.tutorial-shell__catalog-toggle {
  border: none;
  border-radius: 999px;
  background: #0f5da8;
  color: #fff;
  padding: 8px 14px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.tutorial-shell__body {
  display: grid;
  grid-template-columns: minmax(250px, 290px) minmax(0, 1fr);
  gap: 18px;
  min-height: 0;
}

.tutorial-catalog {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(247, 251, 255, 0.98), rgba(237, 245, 255, 0.9));
  border: 1px solid rgba(142, 180, 220, 0.35);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.tutorial-catalog__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tutorial-catalog__group-title {
  margin: 0;
  font-size: 0.84rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #5f7994;
}

.tutorial-entry {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(156, 189, 224, 0.45);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.84);
  color: inherit;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

.tutorial-entry:hover {
  transform: translateX(2px);
  border-color: rgba(30, 111, 181, 0.45);
}

.tutorial-entry.is-active {
  border-color: rgba(15, 93, 168, 0.8);
  box-shadow: 0 8px 18px rgba(15, 93, 168, 0.16);
  background: linear-gradient(180deg, rgba(236, 246, 255, 0.98), rgba(248, 252, 255, 0.98));
}

.tutorial-entry.is-current-route .tutorial-entry__title {
  color: #0f5da8;
}

.tutorial-entry__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tutorial-entry__title {
  font-weight: 700;
}

.tutorial-entry__badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(15, 93, 168, 0.14);
  color: #0f5da8;
  font-size: 0.72rem;
  font-weight: 700;
}

.tutorial-entry__summary {
  color: #5a7189;
  font-size: 0.84rem;
  line-height: 1.45;
}

.tutorial-article {
  min-width: 0;
  padding: 20px 22px;
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 250, 255, 0.92));
  border: 1px solid rgba(154, 185, 215, 0.32);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.tutorial-article__anchor {
  height: 1px;
}

.tutorial-article__group {
  margin: 0 0 8px;
  color: #0f5da8;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.tutorial-article__title {
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.2;
}

.tutorial-article__summary {
  margin: 10px 0 0;
  color: #587089;
  line-height: 1.6;
}

.tutorial-article__content {
  margin-top: 20px;
  color: #24445f;
}

.tutorial-article__paragraph {
  margin: 20px 0 0;
  line-height: 1.7;
}

.tutorial-article__content :deep(h2),
.tutorial-article__content :deep(h3),
.tutorial-article__content :deep(h4) {
  margin: 24px 0 10px;
  color: #163d63;
  line-height: 1.3;
}

.tutorial-article__content :deep(h2) {
  font-size: 1rem;
}

.tutorial-article__content :deep(h3) {
  font-size: 0.96rem;
}

.tutorial-article__content :deep(p) {
  margin: 0 0 12px;
  line-height: 1.7;
}

.tutorial-article__content :deep(ul),
.tutorial-article__content :deep(ol) {
  margin: 0 0 14px;
  padding-left: 20px;
  line-height: 1.7;
}

.tutorial-article__content :deep(li + li) {
  margin-top: 8px;
}

.tutorial-article__content :deep(a) {
  color: #0f5da8;
  font-weight: 700;
}

.tutorial-article__content :deep(code) {
  padding: 0.16em 0.4em;
  border-radius: 0.45rem;
  background: rgba(15, 93, 168, 0.1);
  color: #0b4c8b;
  font-size: 0.92em;
}

.tutorial-article__content :deep(img) {
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 18px 0;
  border-radius: 18px;
  border: 1px solid rgba(154, 185, 215, 0.45);
  background: #f7fbff;
  box-shadow: 0 14px 24px rgba(18, 55, 94, 0.08);
}

.tutorial-pagination {
  position: sticky;
  bottom: -4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  background: linear-gradient(180deg, rgba(248, 251, 255, 0), rgba(248, 251, 255, 0.96) 30%);
}

.tutorial-pagination__button {
  border: none;
  border-radius: 14px;
  background: #0f5da8;
  color: #fff;
  padding: 10px 16px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.tutorial-pagination__button:disabled {
  background: #adc4da;
  cursor: not-allowed;
}

.tutorial-pagination__status {
  color: #5b738b;
  font-size: 0.88rem;
  font-weight: 700;
}

@media (max-width: 900px) {
  .tutorial-trigger {
    padding: 11px 14px;
    gap: 8px;
  }

  .tutorial-trigger__label {
    font-size: 0.95rem;
  }

  .tutorial-shell__body {
    grid-template-columns: 1fr;
  }

  .tutorial-catalog {
    padding: 14px;
  }

  .tutorial-article {
    padding: 18px 16px;
    border-radius: 20px;
  }

  .tutorial-article__title {
    font-size: 1.24rem;
  }

  .tutorial-pagination {
    padding-bottom: 4px;
  }
}
</style>
