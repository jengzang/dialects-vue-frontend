<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import UniversalTable from "@/main/components/TableAndTree/UniversalTable.vue";
import { getCachedSourceStats, getSourceStats } from '@/composables/useSourceStats.js'

const { t } = useI18n()
const router = useRouter()

const cachedStats = getCachedSourceStats()
const locationCount = ref(cachedStats.locationCount)
const dataCount = ref(cachedStats.dataCount)

onMounted(async () => {
  try {
    const stats = await getSourceStats()
    locationCount.value = stats.locationCount
    dataCount.value = stats.dataCount
  } catch (error) {
    console.error('獲取字表統計失敗:', error)
  }
})

const dataColumns = [
  {key: '簡稱', label: t('source.columns.location'), filterable: false, width: 1},
  {key: '地圖集二分區', label: t('source.columns.atlasRegion'), filterable: true, width: 1.5},
  {key: '音典分區', label: t('source.columns.dictRegion'), filterable: true, width: 1.5},
  {key: '字表來源（母本）', label: t('source.columns.source'), filterable: false, width: 3},
  {key: '省', label: t('source.columns.province'), filterable: true, width: 0.8},
  {key: '市', label: t('source.columns.city'), filterable: true, width: 0.8},
  {key: '縣', label: t('source.columns.county'), filterable: true, width: 0.8},
  {key: '鎮', label: t('source.columns.town'), filterable: true, width: 0.8},
  // {key: '經緯度', label: '經緯度', filterable: false, width: 2},
];

// 默认筛选配置（可选）
// 示例1：筛选"存儲標記"为1的数据（该列不在显示列中）
const defaultFilter = { '存儲標記': 1 }

// 示例2：筛选显示列中的数据，例如只显示"省"为"廣東"的数据
// const defaultFilter = { '省': '廣東' }

// 示例3：多列筛选
// const defaultFilter = { '省': '廣東', '市': '陽江' }

// 示例4：筛选多个值（数组形式）
// const defaultFilter = { '省': ['廣東', '廣西'] }

const goToPrivacy = () => {
  router.push('/menu/privacy')
}
</script>

<template>
  <div style="width: 100%;justify-content: center;align-items:center;display: flex;flex-direction: column">
    <div class="header-row">

      <h2 class="tabs-title" style="font-size: 1.5rem;">📚 {{ t('source.title') }}</h2>
      <a class="privacy-link" @click="goToPrivacy">
        {{ t('source.privacyLink') }}
      </a>

    </div>
<!--    <UniversalTable-->
<!--        db-key="query"-->
<!--        table-name="dialects"-->
<!--        :columns="dataColumns"-->
<!--    />-->
    <!-- 如果需要默认筛选，取消下面的注释并定义 defaultFilter 变量 -->
    <UniversalTable
        db-key="query"
        table-name="dialects"
        :columns="dataColumns"
        :default-filter="defaultFilter"
    />
    <p class="summary">{{ t('source.totalRecords', { locationCount, dataCount }) }}</p>
  </div>
</template>

<style scoped>

.privacy-link {
  font-size: 14px;
  color: #007aff;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
  padding: 4px 8px;
  border-radius: 4px;
}

.privacy-link:hover {
  color: #0051d5;
  background: rgba(0, 122, 255, 0.1);
  text-decoration: underline;
}
.header-row {
  display: flex;
  align-items: center; /* 垂直居中對齊 */
  gap: 15px;           /* 標題和下拉框之間的間距 */
  justify-content: center;
}
.summary {
  margin-top: 12px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}
/* 响应式：移动端换行 */
@media (max-width: 768px) {
  .header-row {
    gap: 8px;
  }

  .privacy-link {
    font-size: 13px;
  }
}

/* 背景设置 */
.coming-soon-container {
  position: absolute;
  top: 26dvh;
  left: 0;
  width: 100%;
  height: 74dvh;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(0, 122, 255, 0.15));
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99;
}

/* 提示框样式 */
.coming-soon-message {
  font-size: 28px;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
  padding: 30px 50px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.6);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  transform: scale(0);
  animation: scaleIn 1s ease-out forwards, glowAnimation 1.5s infinite alternate;
}

/* 提示文本的动画效果 */
@keyframes scaleIn {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes glowAnimation {
  0% {
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6), 0 0 30px rgba(0, 122, 255, 0.9);
  }
  100% {
    text-shadow: 0 0 20px rgba(255, 255, 255, 1), 0 0 40px rgba(255, 255, 255, 0.7), 0 0 60px rgba(0, 122, 255, 1);
  }
}

/* 自适应样式，保证在小屏设备上也能很好展示 */
@media (max-width: 480px) {
  .coming-soon-message {
    font-size: 22px;
    padding: 20px 30px;
  }
}
</style>
