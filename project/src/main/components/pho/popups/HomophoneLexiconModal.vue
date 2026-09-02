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
        {{ t('phonology.phonology.homophoneLexicon.title') }}
      </div>
      <div class="header-actions">
        <div ref="toolbarTarget" class="toolbar-target"></div>
        <button class="close-btn close-btn-sm close-btn-inline" type="button" @click="handleClose">×</button>
      </div>
    </template>

    <div v-if="loading" class="loading-state">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <span>{{ t('result.locationDetailPopup.loading') }}</span>
    </div>

    <template v-else-if="lexiconData">
      <div v-if="location" class="lexicon-location-title">{{ location }}</div>

      <HomophoneLexicon
        :location="location"
        :data="lexiconData"
        :show-copy="false"
        :show-title="false"
        :toolbar-to="toolbarTarget"
        :tone-map="toneMap"
      />
    </template>

    <div v-else class="empty-state">
      {{ t('result.noData') }}
    </div>
  </AppModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import HomophoneLexicon from '@/main/components/pho/HomophoneLexicon.vue'
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
const toneMap = ref(null)
const toolbarTarget = ref(null)

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

  :deep(.liquid-radio-group) {
    gap: 6px;
  }
  :deep(.liquid-radio-label){
    padding: 2px 4px;
    gap: 4px;
  }
}

.toolbar-target {
  display: contents;
}

.lexicon-location-title {
  margin-bottom: 12px;
  color: $text-main;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
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
