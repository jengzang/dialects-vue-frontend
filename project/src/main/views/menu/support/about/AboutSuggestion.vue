<template>
  <div class="page2">
    <h1 class="tabs-title">💬 {{ $t('navigation.pageTitles.support.aboutSuggestion') }}</h1>
    <TabSwitcher
      mode="segmented"
      navigation-only
      :use-router="false"
      :tabs="suggestionTabs"
      :model-value="suggestionTab"
      :aria-label="$t('navigation.pageTitles.support.aboutSuggestion')"
      @update:modelValue="suggestionTab = $event"
    />
    <div v-show="suggestionTab === 'external'" class="suggestion-box">
      <p v-html="$t('about.suggestion.description')"></p>
      <p class="subtext">👇 {{ $t('about.suggestion.subtext') }}</p>
      <div class="card-links">
        <a
          href="https://github.com/jengzang/dialects-js-frontend/issues"
          target="_blank"
          rel="noopener"
          class="card glass-card"
          data-interactive="true"
        >
          <img class="card-icon" src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub" />
          <span v-html="$t('about.suggestion.frontend.title')"></span>
          <span class="thanks-link">👉 {{ $t('about.suggestion.frontend.link') }}</span>
        </a>
        <a
          href="https://github.com/jengzang/dialects-build/issues"
          target="_blank"
          rel="noopener"
          class="card glass-card"
          data-interactive="true"
        >
          <img class="card-icon" src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub" />
          <span v-html="$t('about.suggestion.backend.title')"></span>
          <span class="thanks-link">👉 {{ $t('about.suggestion.backend.link') }}</span>
        </a>
        <a
          href="https://www.zhihu.com/project/detail/60225"
          target="_blank"
          rel="noopener"
          class="card glass-card"
          data-interactive="true"
        >
          <img class="card-icon" src="https://static.zhihu.com/heifetz/favicon.ico" alt="Zhihu" />
          <span v-html="$t('about.suggestion.zhihu.title')"></span>
          <span class="thanks-link">👉 {{ $t('about.suggestion.zhihu.link') }}</span>
        </a>
      </div>
    </div>

    <h2 v-show="suggestionTab === 'internal'" class="tabs-title"
        style="margin-top: 2rem;">{{ $t('layoutFooter.feedback.title') }}
    </h2>
    <div
      v-show="suggestionTab === 'internal'"
      class="surface-panel suggestion-form-section"
      data-about-suggestion-form
    >
      <form
        class="suggestion-page-form"
        @submit.prevent="submitSuggestionForm"
      >
        <div class="suggestion-form-row suggestion-form-row--identity">
          <div class="field feedback-category">
            <span>{{ $t('layoutFooter.feedback.category') }}</span>
            <SimpleSelectDropdown
              v-model="suggestionCategory"
              :options="suggestionCategoryOptions"
              :disabled="isSubmittingSuggestion || isCapturingSuggestionScreenshot"
              width="100%"
            />
          </div>

          <label class="field">
            <span>{{ $t('layoutFooter.feedback.titleLabel') }}</span>
            <input
              v-model.trim="suggestionTitle"
              class="glass-field"
              name="title"
              maxlength="200"
              :placeholder="$t('layoutFooter.feedback.titlePlaceholder')"
            >
          </label>
        </div>

        <label class="field">
          <span>{{ $t('layoutFooter.feedback.contentLabel') }}</span>
          <textarea
            v-model.trim="suggestionContent"
            class="glass-field"
            name="content"
            maxlength="5000"
            rows="5"
            :placeholder="$t('layoutFooter.feedback.contentPlaceholder')"
          />
        </label>

        <div class="suggestion-form-row suggestion-form-row--meta">
          <label class="field">
            <span>{{ $t('layoutFooter.feedback.contactLabel') }}</span>
            <input
              v-model.trim="suggestionContact"
              class="glass-field"
              name="contact"
              maxlength="200"
              :placeholder="$t('layoutFooter.feedback.contactPlaceholder')"
            >
          </label>

          <div class="suggestion-screenshot-control">
            <CheckBox
              v-model="includeSuggestionScreenshot"
              class="screenshot-field"
              data-include-screenshot
            >
              {{ $t('layoutFooter.feedback.screenshot.label') }}
            </CheckBox>
            <p class="hint screenshot-hint">
              {{ $t('layoutFooter.feedback.screenshot.hint') }}
            </p>
          </div>
        </div>
        <div
          v-if="includeSuggestionScreenshot"
          class="surface-subpanel screenshot-preview"
        >
          <img
            v-if="suggestionScreenshotDataUrl"
            :src="suggestionScreenshotDataUrl"
            :alt="$t('layoutFooter.feedback.screenshot.previewAlt')"
          >
          <span v-else>{{ $t('layoutFooter.feedback.screenshot.capturing') }}</span>
          <button
            type="button"
            class="glass-button screenshot-retake"
            data-size="compact"
            :disabled="isCapturingSuggestionScreenshot"
            @click="captureSuggestionScreenshotPreview"
          >
            {{ $t('layoutFooter.feedback.screenshot.retake') }}
          </button>
        </div>

        <div class="suggestion-form-actions">
          <button
            type="submit"
            class="glass-button suggestion-submit-button"
            data-variant="primary"
            data-size="small"
            data-submit-feedback
            :disabled="isSubmittingSuggestion || isCapturingSuggestionScreenshot || !canSubmitSuggestion"
          >
            {{ $t('layoutFooter.feedback.submit') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import TabSwitcher from '@/components/common/TabSwitcher.vue'
import { useSuggestionForm } from '@/composables/suggestions/useSuggestionForm.js'

const { t, locale } = useI18n()
const route = useRoute()
const suggestionTab = ref('internal')
const suggestionTabs = computed(() => [
  { name: 'internal', label: t('about.suggestion.internalTab') },
  { name: 'external', label: t('about.suggestion.externalTab') },
])

const suggestionPageContext = computed(() => ({
  path: route.path,
  fullPath: route.fullPath,
  query: route.query,
  hash: route.hash,
  locale: locale.value,
}))

const {
  category: suggestionCategory,
  title: suggestionTitle,
  content: suggestionContent,
  contact: suggestionContact,
  includeScreenshot: includeSuggestionScreenshot,
  screenshotDataUrl: suggestionScreenshotDataUrl,
  isSubmitting: isSubmittingSuggestion,
  isCapturingScreenshot: isCapturingSuggestionScreenshot,
  categoryOptions: suggestionCategoryOptions,
  canSubmit: canSubmitSuggestion,
  captureScreenshotPreview: captureSuggestionScreenshotPreview,
  submit: submitSuggestionForm,
} = useSuggestionForm({
  t,
  pageTitle: () => t('navigation.pageTitles.support.aboutSuggestion'),
  sourcePath: () => route.path,
  context: () => suggestionPageContext.value,
  initialCategory: () => route.query.category,
})


onMounted(() => {
  if (route.query.from === 'vocabulary_import') {
    nextTick(() => {
      document.querySelector('[data-about-suggestion-form]')?.scrollIntoView?.({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
@use './aboutShared' as *;

/* 建议页面 */
.page2 {
  @include flex-col;

  max-width: 900px;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  padding: 1dvw 8dvw;
  // background: var(--glass-05);
  // border: 1px solid var(--glass-10);
  // border-radius: var(--radius-md);
  // box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  font-size: 18px;

  // @include glass-blur(8px);
}
/* 建议入口 */
.suggestion-box {
  max-width: 500px;
  margin: 0 auto;
  justify-content: center;
  color: var(--text-deep);
  font-family: var(--font-sans);
  text-align: center;

  p {
    margin: 10px 0;
    color: var(--text-secondary);
    font-size: 18px;
  }
}

.subtext {
  color: var(--text-tertiary);
  font-size: 16px;
}

.card-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 24px;
}

.card {
  position: relative;
  flex: 1 1 200px;
  min-width: 180px;
  @include flex-col;
  align-items: center;
  padding: 20px;
  overflow: hidden;
  // background: var(--glass-50);

  // @include glass-card;

  // border-radius: var(--radius-lg);
  // box-shadow: 0 6px 12px rgba(var(--color-primary-rgb), 0.1);
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  // transform: scale(1);
  // transition: all $ease-standard;

  // &:hover {
  //   background: var(--glass-80);
  //   border-color: rgba(var(--color-primary-rgb), 0.35);
  //   box-shadow: 0 10px 20px rgba(var(--color-primary-rgb), 0.2);
  //   transform: scale(1.02) translateY(-2px);
  // }

  span {
    margin-top: 10px;
    font-size: 15px;
    transition: color $ease-standard;
  }
}

.card-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin-bottom: 4px;
}

.suggestion-form-section {
  @include flex-col;
  gap: 14px;
  // width: 100%;
  max-width: 820px;
  margin: 4px auto 0;
  padding: 20px;
  text-align: left;

  @media (max-aspect-ratio: #{1 / 1}) {
    min-width: 75dvw;
  }

  .tabs-title {
    margin-bottom: 0;
  }
}

.suggestion-page-form {
  @include flex-col;
  gap: 12px;

  textarea {
    resize: vertical;
  }
}

.suggestion-page-form .field {
  @include flex-col;
  gap: 6px;
}

.suggestion-form-row {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(0, 1.4fr);
  gap: 12px;
  align-items: end;
}

.suggestion-form-row > * {
  min-width: 0;
}

.suggestion-form-row--meta {
  grid-template-columns: minmax(0, 1.4fr) minmax(220px, 0.8fr);
}

.suggestion-screenshot-control {
  @include flex-col;
  gap: 6px;
  justify-content: flex-end;
}

.suggestion-form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.suggestion-submit-button {
  min-width: 96px;
}

.screenshot-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.screenshot-hint {
    white-space: nowrap;
  font-size: 12px;
  margin: 0;
}

.screenshot-preview {
  @include flex-col;
  gap: 8px;
  padding: 8px;
}

.screenshot-preview img {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: contain;
}

.screenshot-retake {
  align-self: flex-start;
}

@media (max-aspect-ratio: #{1 / 1}) {
  .page2 {
    max-width: none;
    padding: 10px 14px;
    font-size: 16px;
  }
  .suggestion-box {
    max-width: 100%;

    p {
      margin: 8px 0;
      font-size: 16px;
    }
  }

  .subtext {
    font-size: 14px;
  }

  .card-links {
    gap: 12px;
    margin-top: 16px;
  }

  .card {
    flex: 1 1 100%;
    min-width: 0;
    padding: 14px 16px;
    border-radius: 14px;
    font-size: 16px;

    span {
      margin-top: 6px;
      font-size: 13px;
    }
  }

  .card-icon {
    width: 24px;
    height: 24px;
    margin-bottom: 2px;
  }

  .suggestion-form-section {
    margin-top: 22px;
    padding: 16px;
  }

  .suggestion-form-row,
  .suggestion-form-row--meta {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .suggestion-form-actions {
    justify-content: stretch;
  }

  .suggestion-submit-button {
    width: 100%;
  }
}
</style>
