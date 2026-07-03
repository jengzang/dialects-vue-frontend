<template>
  <Teleport to="body" v-if="modelValue && isCompact && !isMobileLandscape && !isCatalogOpen">
    <button
      type="button"
      class="tutorial-catalog-float-button"
      @click="$emit('update:isCatalogOpen', true)"
    >
      <span class="tutorial-catalog-float-button__icon">☰</span>
      {{ t('tutorial.ui.catalogLabel') }}
    </button>
  </Teleport>

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
            <CheckBox
              class="tutorial-hide-checkbox"
              v-model="hideTutorialLocal"
              :label="t('tutorial.ui.hideTutorial')"
              :size="16"
              :font-size="12"
            />

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
            <!-- <p class="tutorial-experience__description">
              {{ t(currentDiceEntry.descriptionKey) }}
            </p> -->
          </div>

          <button
            type="button"
            class="tutorial-experience__button"
            @click="$emit('applyDice')"
          >
            <span class="tutorial-experience__button-icon">🎲</span>
            <span class="tutorial-experience__button-text">{{ t(currentDiceEntry.buttonKey) }}</span>
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
          <div
            v-if="isCompact && !isMobileLandscape"
            class="tutorial-catalog__float-header"
          >
            <span>{{ t('tutorial.ui.catalogLabel') }}</span>
            <button
              type="button"
              class="close-btn close-btn-sm close-btn-inline"
              :aria-label="t('tutorial.ui.collapseCatalog')"
              @click="$emit('update:isCatalogOpen', false)"
            >
              ×
            </button>
          </div>

          <section
            v-for="category in groupedEntries"
            :key="category.key"
            class="tutorial-catalog__category"
          >
            <h2 class="tutorial-catalog__category-title">
              {{ category.label }}
            </h2>

            <section
              v-for="group in category.groups"
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
          </section>
        </aside>

        <article class="tutorial-article ui-scrollbar">
          <div
            ref="articleTopRef"
            class="tutorial-article__anchor"
          />

          <p class="tutorial-article__group">
            {{ selectedEntry.categoryLabel }} · {{ selectedEntry.groupLabel }}
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
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import { tutorialEnabled, setTutorialEnabled } from '@/main/store/store.js'
import CheckBox from '@/components/selector/CheckBox.vue'
import { showInfo } from '@/utils/message.js'

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

const emit = defineEmits([
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

const hideTutorialLocal = ref(!tutorialEnabled.value)

watch(() => props.modelValue, (visible) => {
  if (!visible && hideTutorialLocal.value !== !tutorialEnabled.value) {
    setTutorialEnabled(!hideTutorialLocal.value)
  }
  if (visible) {
    hideTutorialLocal.value = !tutorialEnabled.value
  }
})

watch(hideTutorialLocal, (val) => {
  if (val) {
    showInfo(t('tutorial.ui.hideTutorialTip'), 4000)
  }
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

// 只处理竖屏：弹窗打开时，目录默认强制收起。
// 不影响横屏 / 桌面，因为横屏和桌面由 shouldShowCatalog 默认展示左侧目录。
watch(
  () => [props.modelValue, props.isCompact, props.isMobileLandscape],
  ([visible, compact, landscape]) => {
    if (visible && compact && !landscape) {
      emit('update:isCatalogOpen', false)
    }
  }
)

defineExpose({
  scrollSelectionIntoView,
})
</script>

<style lang="scss" scoped>
$radius-pill: 999px;
$z-catalog-button: 20030;
$z-catalog-panel: 20031;

$glass-border: rgba(255, 255, 255, 0.66);
$glass-border-strong: rgba(255, 255, 255, 0.72);

$blue-border-soft: rgba(122, 176, 230, 0.18);
$blue-border-panel: rgba(110, 160, 214, 0.18);

$float-catalog-top: max(50px, calc(env(safe-area-inset-top, 0px) + 20dvh));
$float-catalog-left: max(10px, calc(env(safe-area-inset-left, 0px) + 10px));
$float-catalog-button-left:0;

@mixin glass-panel {
  border: 1px solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.48);
  box-shadow:
    0 14px 34px rgba(38, 105, 176, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
}

@mixin single-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@mixin two-line-clamp {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

@mixin portrait {
  @media (max-aspect-ratio: 1/1) {
    @content;
  }
}

.tutorial-modal-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;

  &.is-compact {
    gap: 9px;

    .tutorial-shell {
      &__topbar {
        align-items: flex-start;
      }

      &__current-value {
        font-size: 0.96rem;
      }
    }

    .tutorial-experience {
      gap: 9px;
      padding: 4px 10px;

      &__body {
        grid-template-columns: 1fr;
        gap: 3px;
      }

      &__description {
        white-space: normal;

        @include two-line-clamp;
      }
    }
  }

  &.is-landscape {
    gap: 8px;

    .tutorial-experience {
      flex-direction: row;
      padding: 8px 10px;

      &__body {
        grid-template-columns: auto minmax(0, auto) minmax(0, 1fr);
      }

      &__description {
        white-space: nowrap;
        -webkit-line-clamp: unset;
      }
    }
  }
}

.tutorial-shell {
  --tutorial-content-max-height: min(52dvh, 520px);

  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;

  &__topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  &__current {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;

    &-label {
      font-size: 0.76rem;
      color: var(--text-secondary);
      letter-spacing: 0.04em;
    }

    &-value {
      max-width: 100%;
      font-size: 1.02rem;
      line-height: 1.25;
      color: var(--color-blue-custom);

      @include single-line;
    }
  }

  &__actions {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .tutorial-hide-checkbox {
    white-space: nowrap;
  }

  &__body {
    position: relative;
    display: grid;
    grid-template-columns: minmax(230px, 290px) minmax(0, 1fr);
    gap: 16px;
    min-height: 0;
  }

  &.is-compact {
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

  &.is-landscape {
    --tutorial-content-max-height: min(46dvh, 320px);

    .tutorial-shell__body {
      grid-template-columns: minmax(190px, 240px) minmax(0, 1fr);
      gap: 12px;
    }

    .tutorial-catalog,
    .tutorial-article {
      max-height: var(--tutorial-content-max-height);
    }

    .tutorial-catalog {
      padding: 10px;
    }

    .tutorial-entry {
      padding: 9px 10px;

      &__summary {
        -webkit-line-clamp: 1;
      }
    }

    .tutorial-article {
      padding: 12px 14px;
    }
  }
}

.tutorial-experience {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 8px 20px rgba(45, 103, 160, 0.08);

  &__body {
    display: grid;
    grid-template-columns: auto minmax(0, auto) minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__eyebrow,
  &__title,
  &__description {
    margin: 0;
    min-width: 0;
  }

  &__eyebrow {
    color: var(--text-secondary);
    font-size: 0.72rem;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  &__title {
    color: var(--color-blue-dark);
    font-size: 0.92rem;
    font-weight: 800;
    white-space: nowrap;
  }

  &__description {
    color: var(--text-medium);
    font-size: 0.84rem;
    line-height: 1.45;

    @include single-line;
  }

  &__button {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 34px;
    max-width: 180px;
    padding: 7px 12px;
    border: 1px solid rgba(255, 255, 255, 0.42);
    border-radius: $radius-pill;
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

    &-icon {
      font-size: 1rem;
    }

    &-text {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.tutorial-catalog,
.tutorial-article {
  @include glass-panel;
}

.tutorial-catalog {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: var(--tutorial-content-max-height);
  padding: 12px 10px;
  border-radius: var(--radius-xl);
  overflow: auto;

  &-float-button,
  &__float-header {
    display: none;
  }

  &__category {
    display: flex;
    flex-direction: column;
    gap: 10px;

    &-title {
      margin: 0;
      padding: 4px 6px;
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--color-blue-logo);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      border-bottom: 1px solid rgba(110, 160, 214, 0.16);
    }
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: 7px;

    &-title {
      margin: 0;
      padding: 0 4px;
      font-size: 0.82rem;
      color: var(--text-secondary);
      letter-spacing: 0.04em;
    }
  }
}

.tutorial-entry {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.38);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  text-align: left;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 6px 14px rgba(45, 103, 160, 0.06);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 255, 255, 0.62);
    background: rgba(255, 255, 255, 0.52);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 8px 18px rgba(45, 103, 160, 0.1);
  }

  &.is-active {
    border-color: rgba(100, 170, 240, 0.55);
    background: rgba(220, 238, 255, 0.52);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    box-shadow:
      0 10px 22px rgba(62, 132, 211, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.86);
  }

  &.is-current-route:not(.is-active) {
    border-color: rgba(255, 255, 255, 0.55);
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__title {
    min-width: 0;
    color: var(--color-blue-custom);
    font-weight: 800;

    @include single-line;
  }

  &__badge {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: $radius-pill;
    background: rgba(210, 232, 255, 0.82);
    color: var(--color-blue-logo);
    font-size: 0.7rem;
    font-weight: 800;
  }

  &__summary {
    margin-top: 5px;
    color: var(--text-secondary);
    font-size: 0.84rem;
    line-height: 1.42;

    @include two-line-clamp;
  }
}

.tutorial-article {
  min-width: 0;
  max-height: var(--tutorial-content-max-height);
  padding: 16px 18px;
  border-radius: var(--radius-xl);
  overflow: auto;

  &__anchor {
    height: 1px;
  }

  &__group {
    margin: 0 0 7px;
    color: var(--text-secondary);
    font-size: 0.8rem;
    letter-spacing: 0.04em;
  }

  &__title {
    margin: 0;
    color: var(--color-blue-dark);
    font-size: clamp(1.18rem, 1.8vw, 1.54rem);
    line-height: 1.25;
  }

  &__summary {
    margin: 8px 0 16px;
    color: var(--text-medium);
    line-height: 1.62;
  }

  &__paragraph {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  &__content {
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
      padding: 2px 6px;
      border-radius: 8px;
      background: rgba(226, 240, 255, 0.68);
    }

    :deep(pre) {
      padding: 12px 14px;
      border: 1px solid $blue-border-panel;
      border-radius: var(--radius-lg);
      background: rgba(247, 251, 255, 0.72);
      overflow: auto;
    }

    :deep(img) {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 12px 0;
      border-radius: var(--radius-lg);
      border: 1px solid rgba(110, 160, 214, 0.12);
    }
  }
}

.tutorial-pagination {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  width: 100%;

  &__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 82px;
    min-height: 34px;
    padding: 7px 14px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: $radius-pill;
    background: rgba(255, 255, 255, 0.44);
    backdrop-filter: blur(20px) saturate(150%);
    -webkit-backdrop-filter: blur(20px) saturate(150%);
    color: var(--color-blue-logo);
    font-size: 0.86rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow:
      0 8px 18px rgba(56, 123, 196, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.82);
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

  &__status {
    justify-self: center;
    color: var(--text-secondary);
    font-size: 0.86rem;
    font-weight: 800;
    white-space: nowrap;
  }

  &.is-compact {
    gap: 8px;

    .tutorial-pagination__button {
      min-width: 70px;
      min-height: 32px;
      padding: 6px 11px;
    }
  }

  &.is-landscape {
    .tutorial-pagination__button {
      min-height: 30px;
      padding-block: 5px;
    }
  }
}

/* 只改竖屏：目录默认收起；目录按钮 fixed；展开后目录 fixed，70dvw × 40dvh */
@include portrait {
  .tutorial-shell {
    &__body {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }

  .tutorial-catalog {
    position: fixed;
    top: $float-catalog-top;
    left: $float-catalog-left;
    z-index: $z-catalog-panel;
    width: 75dvw;
    max-width: 360px;
    height: 40dvh;
    max-height: 40dvh !important;
    padding: 10px;
    border-radius: var(--radius-xl);
    background: var(--glass-medium);
    backdrop-filter: blur(18px) saturate(145%);
    -webkit-backdrop-filter: blur(18px) saturate(145%);
    border: 2px solid var(--glass-border);
    // box-shadow: var(--shadow-glass);
    overflow: auto;
    box-shadow:
      0 18px 42px rgba(38, 105, 176, 0.2),
      0 8px 20px rgba(45, 103, 160, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.84);

    &-float-button {
      position: fixed;
      top: $float-catalog-top;
      left: $float-catalog-button-left;
      z-index: $z-catalog-button;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-width: 46px;
      min-height: 30px;
      padding: 10px 6px 10px 0px;
      border: none;
      border-radius: 0 100px 100px 0;
      background: #007aff;
      color: #fff;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow:
        0 10px 24px rgba(0, 122, 255, 0.32),
        inset 0 1px 0 rgba(255, 255, 255, 0.28);

      &__icon {
        font-size: 0.85rem;
        line-height: 1;
      }

      &:active {
        transform: scale(0.97);
      }
    }

    &__float-header {
      position: sticky;
      top: -10px;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin: -10px -10px 10px;
      padding: 9px 10px;
      border-bottom: 1px solid rgba(223, 220, 220, 0.42);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      background: rgba(255, 255, 255, 0.5);
      color: var(--color-blue-dark);
      font-size: 0.86rem;
      font-weight: 850;
      backdrop-filter: blur(28px) saturate(160%);
      -webkit-backdrop-filter: blur(28px) saturate(160%);
    }
  }

  .tutorial-article {
    padding-top: 52px;
  }
}
</style>