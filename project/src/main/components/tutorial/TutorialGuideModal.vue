<template>
  <AppModal
    :model-value="modelValue"
    size="sm"
    :show-close="false"
    :close-label="t('tutorial.ui.closeLabel')"
    :width="modalWidth"
    :max-height="modalMaxHeight"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      <div
        class="tutorial-modal-header"
        :class="{
          'is-compact': isCompact,
          'is-landscape': isMobileLandscape
        }"
      >
        <div class="tutorial-shell__topbar">
          <div class="tutorial-shell__current">
            <!-- <span class="tutorial-shell__current-label">
              {{ t('tutorial.ui.modalTitle') }} · {{ t('tutorial.ui.currentPage') }}
            </span> -->
            <strong class="tutorial-shell__current-value">
              {{ currentEntry.title }}
            </strong>
          </div>

          <div class="tutorial-shell__actions">
            <button
              v-if="isCompact && !isMobileLandscape"
              type="button"
              class="tutorial-shell__catalog-toggle"
              @click="$emit('update:isCatalogOpen', !isCatalogOpen)"
            >
              {{ isCatalogOpen ? t('tutorial.ui.collapseCatalog') : t('tutorial.ui.expandCatalog') }}
            </button>

            <button
              type="button"
              class="close-btn close-btn-sm close-btn-inline"
              :aria-label="t('tutorial.ui.closeLabel')"
              @click="$emit('update:modelValue', false)"
            >
              ×
            </button>
          </div>
        </div>

        <section
          v-if="currentDiceEntry"
          class="tutorial-experience"
          data-tutorial-experience
        >
          <div class="tutorial-experience__body">
            <p class="tutorial-experience__eyebrow">
              {{ t('tutorial.assist.experience.badge') }}
            </p>
            <h3 class="tutorial-experience__title">
              {{ t(currentDiceEntry.titleKey) }}
            </h3>
            <p class="tutorial-experience__description">
              {{ t(currentDiceEntry.descriptionKey) }}
            </p>
          </div>

          <button
            type="button"
            class="tutorial-experience__button"
            @click="$emit('applyDice')"
          >
            <span class="tutorial-experience__button-icon">🎲</span>
            <span>{{ t(currentDiceEntry.buttonKey) }}</span>
          </button>
        </section>
      </div>
    </template>

    <div
      ref="modalBodyRef"
      class="tutorial-shell"
      :class="{
        'is-compact': isCompact,
        'is-landscape': isMobileLandscape
      }"
      data-tutorial-modal
    >
      <div class="tutorial-shell__body">
        <aside
          v-show="shouldShowCatalog"
          class="tutorial-catalog ui-scrollbar"
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
                'is-current-route': entry.key === currentEntry.key
              }"
              :data-tutorial-key="entry.key"
              data-tutorial-entry
              @click="$emit('selectEntry', entry.key)"
            >
              <span class="tutorial-entry__title-row">
                <span class="tutorial-entry__title">{{ entry.title }}</span>
                <span
                  v-if="entry.key === currentEntry.key"
                  class="tutorial-entry__badge"
                >
                  {{ t('tutorial.ui.currentBadge') }}
                </span>
              </span>

              <span class="tutorial-entry__summary">{{ entry.summary }}</span>
            </button>
          </section>
        </aside>

        <article class="tutorial-article ui-scrollbar">
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
    </div>

    <template #footer>
      <div
        class="tutorial-pagination"
        :class="{
          'is-compact': isCompact,
          'is-landscape': isMobileLandscape
        }"
      >
        <button
          type="button"
          class="tutorial-pagination__button"
          :disabled="!previousEntry"
          data-tutorial-prev
          @click="$emit('previous')"
        >
          {{ t('tutorial.ui.previous') }}
        </button>

        <span class="tutorial-pagination__status">
          {{ selectedIndex + 1 }} / {{ totalCount }}
        </span>

        <button
          type="button"
          class="tutorial-pagination__button"
          :disabled="!nextEntry"
          data-tutorial-next
          @click="$emit('next')"
        >
          {{ t('tutorial.ui.next') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  currentEntry: {
    type: Object,
    required: true,
  },
  currentDiceEntry: {
    type: Object,
    default: null,
  },
  groupedEntries: {
    type: Array,
    default: () => [],
  },
  selectedEntry: {
    type: Object,
    required: true,
  },
  selectedDocument: {
    type: Object,
    default: null,
  },
  selectedIndex: {
    type: Number,
    default: 0,
  },
  totalCount: {
    type: Number,
    default: 0,
  },
  previousEntry: {
    type: Object,
    default: null,
  },
  nextEntry: {
    type: Object,
    default: null,
  },
  isCompact: {
    type: Boolean,
    default: false,
  },
  isMobileLandscape: {
    type: Boolean,
    default: false,
  },
  isCatalogOpen: {
    type: Boolean,
    default: false,
  },
})

defineEmits([
  'update:modelValue',
  'update:isCatalogOpen',
  'selectEntry',
  'previous',
  'next',
  'applyDice',
])

const { t } = useI18n()

const modalBodyRef = ref(null)
const articleTopRef = ref(null)

const shouldShowCatalog = computed(() => {
  return !props.isCompact || props.isMobileLandscape || props.isCatalogOpen
})

const modalWidth = computed(() => {
  if (props.isMobileLandscape) {
    return 'min(920px, 96dvw)'
  }

  if (props.isCompact) {
    return 'min(560px, 94dvw)'
  }

  return 'min(1080px, 96dvw)'
})

const modalMaxHeight = computed(() => {
  if (props.isMobileLandscape) {
    return 'min(92dvh, 560px)'
  }

  if (props.isCompact) {
    return 'min(88dvh, 720px)'
  }

  return 'min(82dvh, 780px)'
})

function scrollSelectionIntoView() {
  nextTick(() => {
    articleTopRef.value?.scrollIntoView?.({ block: 'start' })

    const key = props.selectedEntry?.key
    if (!key) {
      return
    }

    const activeEntryElement = modalBodyRef.value?.querySelector?.(
      `[data-tutorial-key="${key}"]`
    )

    activeEntryElement?.scrollIntoView?.({ block: 'nearest' })
  })
}

defineExpose({
  scrollSelectionIntoView,
})
</script>

<style lang="scss" scoped>
.tutorial-modal-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.tutorial-shell {
  --tutorial-content-max-height: min(52dvh, 520px);

  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tutorial-shell__topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.tutorial-shell__current {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.tutorial-shell__current-label {
  font-size: 0.76rem;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
}

.tutorial-shell__current-value {
  max-width: 100%;
  font-size: 1.02rem;
  line-height: 1.25;
  color: var(--color-blue-custom);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tutorial-shell__actions {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tutorial-shell__catalog-toggle{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.86), rgba(220, 238, 255, 0.62));
  color: var(--color-blue-logo);
  cursor: pointer;
  box-shadow:
    0 8px 18px rgba(56, 123, 196, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow:
      0 10px 22px rgba(56, 123, 196, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 3px solid rgba(79, 154, 255, 0.28);
    outline-offset: 2px;
  }
}

.tutorial-shell__catalog-toggle {
  min-height: 32px;
  padding: 6px 11px;
  font-size: 0.82rem;
  font-weight: 700;
}

.tutorial-experience {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid rgba(122, 176, 230, 0.18);
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.62), rgba(226, 241, 255, 0.42));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.74),
    0 8px 20px rgba(45, 103, 160, 0.06);
}

.tutorial-experience__body {
  display: grid;
  grid-template-columns: auto minmax(0, auto) minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tutorial-experience__eyebrow,
.tutorial-experience__title,
.tutorial-experience__description {
  margin: 0;
  min-width: 0;
}

.tutorial-experience__eyebrow {
  color: var(--text-secondary);
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.tutorial-experience__title {
  color: var(--color-blue-dark);
  font-size: 0.92rem;
  font-weight: 800;
  white-space: nowrap;
}

.tutorial-experience__description {
  color: var(--text-medium);
  font-size: 0.84rem;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tutorial-experience__button {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 34px;
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(86, 166, 255, 0.98), rgba(42, 120, 216, 0.98));
  color: var(--text-white);
  font-size: 0.86rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  box-shadow:
    0 10px 20px rgba(45, 128, 224, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow:
      0 12px 24px rgba(45, 128, 224, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }

  &:active {
    transform: scale(0.98);
  }
}

.tutorial-experience__button-icon {
  font-size: 1rem;
}

.tutorial-shell__body {
  display: grid;
  grid-template-columns: minmax(230px, 290px) minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
}

.tutorial-catalog,
.tutorial-article {
  border: 1px solid rgba(255, 255, 255, 0.66);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(230, 242, 255, 0.42)),
    radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.9), transparent 38%);
  box-shadow:
    0 14px 34px rgba(38, 105, 176, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
}

.tutorial-catalog {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: var(--tutorial-content-max-height);
  padding: 12px 10px;
  border-radius: var(--radius-xl);
  overflow: auto;
}

.tutorial-catalog__group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.tutorial-catalog__group-title {
  margin: 0;
  padding: 0 4px;
  font-size: 0.82rem;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
}

.tutorial-entry {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(116, 168, 220, 0.18);
  background: rgba(255, 255, 255, 0.46);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.68),
    0 6px 14px rgba(45, 103, 160, 0.05);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(76, 146, 222, 0.34);
    background: rgba(255, 255, 255, 0.68);
  }

  &.is-active {
    border-color: rgba(58, 138, 231, 0.56);
    background:
      linear-gradient(135deg, rgba(234, 246, 255, 0.92), rgba(210, 231, 255, 0.68));
    box-shadow:
      0 10px 22px rgba(62, 132, 211, 0.13),
      inset 0 1px 0 rgba(255, 255, 255, 0.82);
  }

  &.is-current-route:not(.is-active) {
    border-color: rgba(75, 148, 224, 0.26);
  }
}

.tutorial-entry__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tutorial-entry__title {
  min-width: 0;
  color: var(--color-blue-custom);
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tutorial-entry__badge {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(210, 232, 255, 0.82);
  color: var(--color-blue-logo);
  font-size: 0.7rem;
  font-weight: 800;
}

.tutorial-entry__summary {
  display: -webkit-box;
  margin-top: 5px;
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.42;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.tutorial-article {
  min-width: 0;
  max-height: var(--tutorial-content-max-height);
  padding: 16px 18px;
  border-radius: var(--radius-xl);
  overflow: auto;
}

.tutorial-article__anchor {
  height: 1px;
}

.tutorial-article__group {
  margin: 0 0 7px;
  color: var(--text-secondary);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
}

.tutorial-article__title {
  margin: 0;
  color: var(--color-blue-dark);
  font-size: clamp(1.18rem, 1.8vw, 1.54rem);
  line-height: 1.25;
}

.tutorial-article__summary {
  margin: 8px 0 16px;
  color: var(--text-medium);
  line-height: 1.62;
}

.tutorial-article__paragraph {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.tutorial-article__content {
  color: var(--text-primary);
  line-height: 1.72;

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    color: var(--color-blue-dark);
    line-height: 1.3;
  }

  :deep(p) {
    margin: 0 0 12px;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 1.25em;
  }

  :deep(code) {
    border-radius: 8px;
    background: rgba(226, 240, 255, 0.68);
    padding: 2px 6px;
  }

  :deep(pre) {
    border: 1px solid rgba(110, 160, 214, 0.18);
    border-radius: var(--radius-lg);
    background: rgba(247, 251, 255, 0.72);
    padding: 12px 14px;
    overflow: auto;
  }
}

.tutorial-pagination {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.tutorial-pagination__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 82px;
  min-height: 34px;
  padding: 7px 14px;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.84), rgba(218, 236, 255, 0.58));
  color: var(--color-blue-logo);
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow:
    0 8px 18px rgba(56, 123, 196, 0.11),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;

  &:first-child {
    justify-self: start;
  }

  &:last-child {
    justify-self: end;
  }

  &:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow:
      0 10px 22px rgba(56, 123, 196, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.88);
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.42;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.tutorial-pagination__status {
  justify-self: center;
  color: var(--text-secondary);
  font-size: 0.86rem;
  font-weight: 800;
  white-space: nowrap;
}

.tutorial-modal-header.is-compact {
  gap: 9px;

  .tutorial-shell__topbar {
    align-items: flex-start;
  }

  .tutorial-shell__current-value {
    font-size: 0.96rem;
  }

  .tutorial-experience {
    flex-direction: column;
    align-items: stretch;
    gap: 9px;
    padding: 10px;
  }

  .tutorial-experience__body {
    grid-template-columns: 1fr;
    gap: 3px;
  }

  .tutorial-experience__description {
    white-space: normal;
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .tutorial-experience__button {
    width: 100%;
  }
}

.tutorial-shell.is-compact {
  --tutorial-content-max-height: min(56dvh, 480px);

  .tutorial-shell__body {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .tutorial-catalog,
  .tutorial-article {
    max-height: none;
  }

  .tutorial-article {
    padding: 15px;
  }
}

.tutorial-modal-header.is-landscape {
  gap: 8px;

  .tutorial-experience {
    flex-direction: row;
    padding: 8px 10px;
  }

  .tutorial-experience__body {
    grid-template-columns: auto minmax(0, auto) minmax(0, 1fr);
  }

  .tutorial-experience__description {
    white-space: nowrap;
    -webkit-line-clamp: unset;
  }
}

.tutorial-shell.is-landscape {
  --tutorial-content-max-height: min(46dvh, 320px);

  .tutorial-shell__body {
    grid-template-columns: minmax(190px, 240px) minmax(0, 1fr);
    gap: 12px;
  }

  .tutorial-catalog {
    padding: 10px;
  }

  .tutorial-entry {
    padding: 9px 10px;
  }

  .tutorial-entry__summary {
    -webkit-line-clamp: 1;
  }

  .tutorial-article {
    padding: 12px 14px;
  }
}

.tutorial-pagination.is-compact {
  gap: 8px;

  .tutorial-pagination__button {
    min-width: 70px;
    min-height: 32px;
    padding: 6px 11px;
  }
}

.tutorial-pagination.is-landscape {
  .tutorial-pagination__button {
    min-height: 30px;
    padding-block: 5px;
  }
}

@media (max-width: 520px) and (orientation: portrait) {
  .tutorial-shell__topbar {
    gap: 10px;
  }

  .tutorial-shell__actions {
    gap: 6px;
  }

  .tutorial-shell__catalog-toggle {
    padding-inline: 9px;
  }

  .tutorial-pagination__button {
    min-width: 64px;
    padding-inline: 9px;
  }
}
</style>