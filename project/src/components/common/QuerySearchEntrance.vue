<template>
  <section v-if="enabled" ref="heroEl" class="query-hero" :aria-label="title" :style="heroStyle">
    <h2 class="query-entrance-title">{{ title }}</h2>
    <form class="query-entrance-panel glass-panel" @submit.prevent @focusout="handleFocusOut">
      <div class="query-entrance-field">
        <textarea
          v-model="draft"
          class="query-entrance-input glass-field"
          :aria-label="placeholder"
          :placeholder="placeholder"
          rows="2"
          @focus="showSuggestions = true"
          @input="showSuggestions = true"
          @keydown.esc="showSuggestions = false"
        />
        <div v-if="visibleSuggestions.length" class="query-suggestions glass-dropdown-panel" :aria-label="placeholder">
          <button
            v-for="item in visibleSuggestions"
            :key="item"
            class="query-suggestion glass-dropdown-item ui-tab-item"
            type="button"
            @mousedown.prevent
            @click="selectSuggestion(item)"
          >{{ item }}</button>
        </div>
      </div>
      <button
        class="query-entrance-submit glass-button"
        data-variant="primary"
        type="button"
        :disabled="disabled || !isDraftValid"
        @click="submitQuery"
      >
        <PhMagnifyingGlass :size="18" aria-hidden="true" />
        {{ t('common.button.search') }}
      </button>
      <p v-if="validationHint && draft.trim() && !isDraftValid" class="query-validation-hint" role="status">{{ validationHint }}</p>
    </form>
  </section>
  <div ref="compactEl" class="query-compact" :class="{ 'query-compact--enabled': enabled }">
    <slot />
  </div>
</template>

<script setup>
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhMagnifyingGlass } from '@phosphor-icons/vue'

const props = defineProps({
  query: { type: String, default: '' },
  queryKey: { type: String, default: '' },
  title: { type: String, required: true },
  placeholder: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  getSuggestions: { type: Function, default: null },
  validateQuery: { type: Function, default: null },
  validationHint: { type: String, default: '' },
})
const emit = defineEmits(['submit'])
const { t } = useI18n()
const heroEl = ref(null)
const compactEl = ref(null)
const draft = ref(props.query)
const showSuggestions = ref(false)
const progress = ref(0)
let scrollFrame = null

const isDraftValid = computed(() => props.validateQuery ? props.validateQuery(draft.value.trim()) : true)
const visibleSuggestions = computed(() => (
  showSuggestions.value && draft.value.trim() && props.getSuggestions
    ? props.getSuggestions(draft.value.trim())
    : []
))
const heroStyle = computed(() => ({ '--query-entrance-progress': progress.value }))

watch(() => [props.query, props.queryKey], () => {
  draft.value = props.query
  showSuggestions.value = false
})

function selectSuggestion(item) {
  draft.value = item
  showSuggestions.value = false
}

function handleFocusOut(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) showSuggestions.value = false
}

async function submitQuery() {
  if (props.disabled || !isDraftValid.value) return
  showSuggestions.value = false
  emit('submit', draft.value.trim())
  await nextTick()
  compactEl.value?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start',
    inline: 'nearest',
  })
}

function updateProgress() {
  scrollFrame = null
  const rect = heroEl.value?.getBoundingClientRect()
  progress.value = rect?.height ? Math.max(0, Math.min(1, -rect.top / rect.height)) : 0
}

function handleScroll() {
  if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(updateProgress)
}

function startListening() {
  window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
  window.addEventListener('resize', handleScroll, { passive: true })
  updateProgress()
}

function stopListening() {
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleScroll)
  if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame)
  scrollFrame = null
}

onMounted(startListening)
onActivated(startListening)
onDeactivated(stopListening)
onBeforeUnmount(stopListening)
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.query-hero {
  @include flex-col;
  align-items: center;
  justify-content: center;
  gap: 28px;
  min-height: 66dvh;
  padding: 48px 0 64px;
  box-sizing: border-box;
  opacity: calc(1 - var(--query-entrance-progress, 0) * 0.65);
  transform: translateY(calc(var(--query-entrance-progress, 0) * -24px));
}

.query-entrance-title {
  margin: 0;
  text-align: center;
}

.query-entrance-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  width: min(100%, 760px);
  padding: 24px;
  box-sizing: border-box;
}

.query-entrance-field {
  position: relative;
  min-width: 0;
}

.query-entrance-input {
  --glass-field-font-size: 16px;
  display: block;
  min-height: 72px;
  resize: vertical;
}

.query-entrance-submit {
  min-height: 44px;
}

.query-suggestions {
  top: calc(100% + 6px);
  right: 0;
  left: 0;
}

.query-suggestion {
  display: block;
  width: 100%;
  text-align: left;
}

.query-validation-hint {
  grid-column: 1 / -1;
  margin: 0;
}

.query-compact--enabled {
  min-height: 86dvh;
  scroll-margin-top: 12dvh;
}

@media (max-aspect-ratio: 1 / 1) {
  .query-hero {
    min-height: 62dvh;
    gap: 20px;
    padding: 32px 0 48px;
  }

  .query-entrance-panel {
    gap: 10px;
    padding: 16px;
  }

  .query-entrance-submit {
    --glass-button-padding: 12px;
  }

  .query-compact--enabled {
    min-height: 82dvh;
    scroll-margin-top: 16dvh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .query-hero {
    opacity: 1;
    transform: none;
  }
}
</style>
