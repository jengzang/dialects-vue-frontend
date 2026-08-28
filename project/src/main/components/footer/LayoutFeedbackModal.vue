<template>
  <AppModal
    :model-value="modelValue"
    size="sm"
    :title="t('layoutFooter.feedback.title')"
    :close-label="t('common.button.close')"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form
      class="feedback-form"
      data-layout-feedback-modal
      @submit.prevent="submit"
    >
      <div class="field feedback-category">
        <span>{{ t('layoutFooter.feedback.category') }}</span>
        <ChoiceSelector
          v-model="category"
          :options="categoryOptions"
          :aria-label="t('layoutFooter.feedback.category')"
        />
      </div>

      <label class="field">
        <span>{{ t('layoutFooter.feedback.titleLabel') }}</span>
        <input
          v-model.trim="title"
          class="glass-field"
          name="title"
          maxlength="200"
          :placeholder="t('layoutFooter.feedback.titlePlaceholder')"
        >
      </label>

      <label class="field">
        <span>{{ t('layoutFooter.feedback.contentLabel') }}</span>
        <textarea
          v-model.trim="content"
          class="glass-field"
          name="content"
          maxlength="5000"
          rows="5"
          :placeholder="t('layoutFooter.feedback.contentPlaceholder')"
        />
      </label>

      <label class="field">
        <span>{{ t('layoutFooter.feedback.contactLabel') }}</span>
        <input
          v-model.trim="contact"
          class="glass-field"
          name="contact"
          maxlength="200"
          :placeholder="t('layoutFooter.feedback.contactPlaceholder')"
        >
      </label>

      <CheckBox
        v-model="includeScreenshot"
        class="screenshot-field"
        data-include-screenshot
      >
        {{ t('layoutFooter.feedback.screenshot.label') }}
      </CheckBox>
      <p class="hint screenshot-hint">
        {{ t('layoutFooter.feedback.screenshot.hint') }}
      </p>
      <div
        v-if="includeScreenshot"
        class="surface-subpanel screenshot-preview"
      >
        <img
          v-if="screenshotDataUrl"
          :src="screenshotDataUrl"
          :alt="t('layoutFooter.feedback.screenshot.previewAlt')"
        >
        <span v-else>{{ t('layoutFooter.feedback.screenshot.capturing') }}</span>
        <button
          type="button"
          class="glass-button screenshot-retake"
          data-size="compact"
          :disabled="isCapturingScreenshot"
          @click="captureScreenshotPreview"
        >
          {{ t('layoutFooter.feedback.screenshot.retake') }}
        </button>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="glass-button submit-button"
        data-variant="primary"
        data-size="small"
        data-submit-feedback
        :disabled="isSubmitting || isCapturingScreenshot || !canSubmit"
        @click="submit"
      >
        {{ t('layoutFooter.feedback.submit') }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import ChoiceSelector from '@/components/selector/ChoiceSelector.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import { SUGGESTION_CATEGORY_OPTIONS, submitSuggestion } from '@/api/main/suggestions.js'
import { capturePageSnapshot } from '@/utils/share/pageSnapshot.js'
import { showError, showSuccess } from '@/utils/ui/message.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  pageTitle: {
    type: String,
    default: '',
  },
  sourcePath: {
    type: String,
    default: '',
  },
  context: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const category = ref('general')
const title = ref('')
const content = ref('')
const contact = ref('')
const includeScreenshot = ref(false)
const screenshotDataUrl = ref('')
const isSubmitting = ref(false)
const isCapturingScreenshot = ref(false)

const categoryOptions = computed(() => SUGGESTION_CATEGORY_OPTIONS.map(value => ({
  value,
  label: t(`layoutFooter.feedback.categories.${value}`),
})))

const canSubmit = computed(() => title.value.trim() && content.value.trim())

function resetForm() {
  category.value = 'general'
  title.value = ''
  content.value = ''
  contact.value = ''
  includeScreenshot.value = false
  screenshotDataUrl.value = ''
  isCapturingScreenshot.value = false
}

async function captureScreenshotPreview() {
  if (!includeScreenshot.value || isCapturingScreenshot.value) {
    return
  }

  isCapturingScreenshot.value = true
  try {
    screenshotDataUrl.value = await capturePageSnapshot()
  } catch (error) {
    screenshotDataUrl.value = ''
    includeScreenshot.value = false
    const errorKey = error?.message === 'screenshot_too_large'
      ? 'layoutFooter.feedback.validationFailed'
      : 'layoutFooter.feedback.failed'
    showError(t(errorKey))
  } finally {
    isCapturingScreenshot.value = false
  }
}

async function submit() {
  if (!canSubmit.value || isSubmitting.value || isCapturingScreenshot.value) {
    return
  }

  isSubmitting.value = true
  try {
    const imageBase64 = includeScreenshot.value
      ? screenshotDataUrl.value || await capturePageSnapshot()
      : ''

    await submitSuggestion({
      title: title.value,
      content: content.value,
      category: category.value,
      source_path: props.sourcePath,
      contact: contact.value,
      context: {
        ...props.context,
        pageTitle: props.pageTitle,
      },
      image_base64: imageBase64,
    })
    showSuccess(t('layoutFooter.feedback.success'))
    emit('update:modelValue', false)
    resetForm()
  } catch (error) {
    const errorKey = error?.status === 422 || error?.message === 'screenshot_too_large'
      ? 'layoutFooter.feedback.validationFailed'
      : 'layoutFooter.feedback.failed'
    showError(t(errorKey))
  } finally {
    isSubmitting.value = false
  }
}

watch(includeScreenshot, (checked) => {
  if (!checked) {
    screenshotDataUrl.value = ''
    return
  }

  captureScreenshotPreview()
})

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) resetForm()
  }
)
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.feedback-form {
  @include flex-col;
  gap: 12px;
}

.field {
  @include flex-col;
  gap: 6px;
}

.feedback-category {
  align-items: flex-start;
}

textarea {
  resize: vertical;
}

.submit-button {
  min-width: 96px;
}

.screenshot-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.screenshot-hint {
  margin: -6px 0 0;
}

.screenshot-preview {
  @include flex-col;
  gap: 8px;
  padding: 8px;
}

.screenshot-preview img {
  display: block;
  width: 100%;
  max-height: 180px;
  object-fit: contain;
}

.screenshot-retake {
  align-self: flex-start;
}
</style>
