import { computed, ref, unref, watch } from 'vue'
import { SUGGESTION_CATEGORY_OPTIONS, submitSuggestion } from '@/api/main/suggestions.js'
import { capturePageSnapshot } from '@/utils/share/pageSnapshot.js'
import { showError, showSuccess } from '@/utils/ui/message.js'

function resolveValue(value) {
  return typeof value === 'function' ? value() : unref(value)
}

function resolveText(value) {
  const resolved = resolveValue(value)
  return typeof resolved === 'string' ? resolved : ''
}

function resolveContext(value) {
  const resolved = resolveValue(value)
  return resolved && typeof resolved === 'object' ? resolved : {}
}

function normalizeSuggestionCategory(value) {
  const resolved = resolveValue(value)
  const category = Array.isArray(resolved) ? resolved[0] : resolved
  return SUGGESTION_CATEGORY_OPTIONS.includes(category) ? category : 'general'
}

export function useSuggestionForm({
  t,
  pageTitle = '',
  sourcePath = '',
  context = {},
  initialCategory = 'general',
  onSubmitted,
} = {}) {
  const category = ref(normalizeSuggestionCategory(initialCategory))
  const title = ref('')
  const content = ref('')
  const contact = ref('')
  const includeScreenshot = ref(false)
  const screenshotDataUrl = ref('')
  const isSubmitting = ref(false)
  const isCapturingScreenshot = ref(false)

  const translate = typeof t === 'function' ? t : key => key

  const categoryOptions = computed(() => SUGGESTION_CATEGORY_OPTIONS.map(value => ({
    value,
    label: translate(`layoutFooter.feedback.categories.${value}`),
  })))

  const canSubmit = computed(() => Boolean(title.value.trim() && content.value.trim()))

  function resetForm() {
    category.value = normalizeSuggestionCategory(initialCategory)
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
      showError(translate(errorKey))
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
        source_path: resolveText(sourcePath),
        contact: contact.value,
        context: {
          ...resolveContext(context),
          pageTitle: resolveText(pageTitle),
        },
        image_base64: imageBase64,
      })
      showSuccess(translate('layoutFooter.feedback.success'))
      resetForm()
      if (typeof onSubmitted === 'function') {
        onSubmitted()
      }
    } catch (error) {
      const errorKey = error?.status === 422 || error?.message === 'screenshot_too_large'
        ? 'layoutFooter.feedback.validationFailed'
        : 'layoutFooter.feedback.failed'
      showError(translate(errorKey))
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
    () => normalizeSuggestionCategory(initialCategory),
    (nextCategory) => {
      category.value = nextCategory
    }
  )

  return {
    category,
    title,
    content,
    contact,
    includeScreenshot,
    screenshotDataUrl,
    isSubmitting,
    isCapturingScreenshot,
    categoryOptions,
    canSubmit,
    resetForm,
    captureScreenshotPreview,
    submit,
  }
}
