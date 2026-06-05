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
    <div v-else class="feature-mode-placeholder main-glass-panel-inner">
      <button class="main-glass-button" type="button" @click="handleBack">← 返回</button>
      <div class="feature-mode-placeholder-title">{{ selectedFeatureTitle }}</div>
      <p class="feature-mode-placeholder-text">本步先完成特徵卡片列表，下一步接入特徵詳情表格與分布點位編輯。</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getUserFeatures } from '@/api'
import FeatureCardList from './FeatureCardList.vue'

const loading = ref(false)
const errorMessage = ref('')
const featureItems = ref([])
const view = ref('list')
const selectedFeature = ref(null)

const selectedFeatureTitle = computed(() => {
  if (!selectedFeature.value) return '特徵詳情'
  const feature = selectedFeature.value['特徵'] || selectedFeature.value.feature || '未命名特徵'
  const phonology = selectedFeature.value['聲韻調'] || selectedFeature.value.phonology || '未分類'
  return `${feature}（${phonology}）`
})

const loadFeatures = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getUserFeatures()
    featureItems.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    errorMessage.value = error.message || '獲取特徵列表失敗'
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

.feature-mode-placeholder {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 28px 24px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
}

.feature-mode-placeholder-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.feature-mode-placeholder-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #64748b;
}
</style>
