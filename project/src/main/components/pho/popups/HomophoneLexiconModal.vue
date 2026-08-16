<template>
  <AppModal
    :model-value="visible"
    size="lg"
    :close-label="t('common.button.close')"
    :show-close="false"
    @update:modelValue="handleClose"
  >
    <template #header>
      <div class="lexicon-modal-title">
        <InlineIcon icon="📖" />{{ titleText }}
      </div>
      <div class="header-actions">
        <RadioGroup
          v-if="lexiconData"
          :model-value="displayMode"
          :options="modeOptions"
          name="homophone-display-mode"
          :size="12"
          @update:modelValue="displayMode = $event"
        />
        <SimpleSelectDropdown
          v-if="hasToneMap"
          :model-value="toneMode"
          :options="toneModeOptions"
          width="auto"
          @update:modelValue="toneMode = $event"
        />
        <button
          v-if="lexiconData"
          type="button"
          class="copy-btn"
          @click="handleCopy"
        >
          {{ copyState === 'copied'
            ? t('phonology.phonology.homophoneLexicon.copied')
            : t('phonology.phonology.homophoneLexicon.copy') }}
        </button>
        <button class="close-btn close-btn-sm close-btn-inline" type="button" @click="handleClose">×</button>
      </div>
    </template>

    <div v-if="loading" class="loading-state">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <span>{{ t('result.locationDetailPopup.loading') }}</span>
    </div>

    <HomophoneLexicon
      v-else-if="lexiconData"
      ref="lexiconRef"
      :location="location"
      :data="lexiconData"
      :show-copy="false"
      :show-mode-switch="false"
      :show-tone-switch="false"
      :display-mode="displayMode"
      :tone-mode="toneMode"
      :tone-map="toneMap"
    />

    <div v-else class="empty-state">
      {{ t('result.noData') }}
    </div>
  </AppModal>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import HomophoneLexicon from '@/main/components/pho/HomophoneLexicon.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import { getPhonologyMatrix, getLocationDetail } from '@/api'
import { buildToneMapFromDetail } from '@/main/utils/phonology/toneMap.js'

const { t } = useI18n()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const lexiconData = ref(null)
const lexiconRef = ref(null)
const copyState = ref('idle')
const displayMode = ref('final-grouped')
const toneMode = ref('category')
const toneMap = ref(null)

const titleText = computed(() => {
  const title = t('phonology.phonology.homophoneLexicon.title')
  return props.location ? `${title} · ${props.location}` : title
})

const modeOptions = computed(() => [
  { value: 'final-grouped', label: t('phonology.phonology.homophoneLexicon.modeFinalGrouped') },
  { value: 'syllable', label: t('phonology.phonology.homophoneLexicon.modeSyllable') }
])

const toneModeOptions = computed(() => [
  { value: 'category', label: t('phonology.phonology.homophoneLexicon.toneCategory') },
  { value: 'value', label: t('phonology.phonology.homophoneLexicon.toneValue') },
  { value: 'number', label: t('phonology.phonology.homophoneLexicon.toneNumber') }
])

const hasToneMap = computed(() => !!toneMap.value && Object.keys(toneMap.value).length > 0)

const loadLexicon = async () => {
  if (!props.location) return

  loading.value = true
  lexiconData.value = null
  toneMap.value = null

  try {
    const [result, detail] = await Promise.all([
      getPhonologyMatrix({ locations: [props.location] }),
      getLocationDetail(props.location)
    ])
    lexiconData.value = result?.data?.[props.location] || null
    toneMap.value = buildToneMapFromDetail(detail?.data?.[0])
  } catch (err) {
    console.error('加載同音字匯失敗:', err)
    lexiconData.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.location],
  ([visible, location]) => {
    if (visible && location) {
      loadLexicon()
    }
  },
  { immediate: true }
)

const handleClose = () => {
  emit('close')
}

const handleCopy = async () => {
  const ok = await lexiconRef.value?.copyPlainText?.()
  if (ok) {
    copyState.value = 'copied'
    setTimeout(() => {
      copyState.value = 'idle'
    }, 2000)
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$text-main: var(--text-primary);
$text-secondary: var(--text-slate);

.lexicon-modal-title {
  color: $text-main;
  font-size: 16px;
  font-weight: 650;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.copy-btn {
  padding: 6px 12px;
  background: var(--glass-80);
  border: 1px solid var(--bg-hover-strong);
  border-radius: var(--radius-sm);
  color: $text-main;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.loading-state {
  min-height: 200px;
  @include flex-col;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: $text-secondary;
}

.empty-state {
  min-height: 120px;
  @include flex-center;
  color: $text-secondary;
}
</style>
