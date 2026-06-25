<template>
  <div class="feature-mode-shell">
    <FeatureCardList
      v-if="view === 'list'"
      :items="featureItems"
      :loading="loading"
      :error-message="errorMessage"
      @select="handleSelectFeature"
      @create="handleCreateFeature"
      @retry="loadFeatures"
    />
    <FeatureDetailTable
      v-else
      :feature="selectedFeature"
      @back="handleBack"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getUserFeatures } from '@/api'
import { ensureCustomDataPresence } from '@/composables/custom/useCustomDataPresence.js'
import { userStore } from '@/main/store/store.js'
import FeatureCardList from './FeatureCardList.vue'
import FeatureDetailTable from './FeatureDetailTable.vue'

const { t } = useI18n()

const loading = ref(false)
const errorMessage = ref('')
const featureItems = ref([])
const view = ref('list')
const selectedFeature = ref(null)

const loadFeatures = async () => {
  if (!userStore.isAuthenticated) {
    featureItems.value = []
    errorMessage.value = ''
    return
  }

  const hasCustomData = await ensureCustomDataPresence()
  if (!hasCustomData) {
    featureItems.value = []
    errorMessage.value = ''
    view.value = 'list'
    selectedFeature.value = null
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getUserFeatures()
    featureItems.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    errorMessage.value = error.message || t('customEntry.mode.featureLoadFailed')
    featureItems.value = []
  } finally {
    loading.value = false
  }
}

const handleSelectFeature = (item) => {
  selectedFeature.value = item
  view.value = 'detail'
}

const handleCreateFeature = () => {
  selectedFeature.value = {
    '特徵': '',
    '聲韻調': ''
  }
  view.value = 'detail'
}

const handleBack = () => {
  selectedFeature.value = null
  view.value = 'list'
}

const handleSaved = async (newFeature) => {
  await loadFeatures()
  if (newFeature) {
    selectedFeature.value = newFeature
  }
}

onMounted(() => {
  loadFeatures()
})
</script>

<style scoped lang="scss">
.feature-mode-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
