<template>
  <div class="villages-page">
      <h2 class="page-title">自然村</h2>

      <div class="villages-grid">

        <button class="village-btn" @click="handleGdVillages">
          <div class="village-icon">🏘️</div>
          <div class="village-name">廣東自然村</div>
          <div class="village-desc">廣東省自然村樹狀圖</div>
        </button>

        <button class="village-btn" @click="handleVillagesML">
          <div class="village-icon">🤖</div>
          <div class="village-name">廣東自然村分析</div>
          <div class="village-desc">廣東自然村數據機器學習、NLP等</div>
        </button>

        <button class="village-btn" @click="handleGdVillagesTable">
          <div class="village-icon">📈</div>
          <div class="village-name">全粵村情表格</div>
          <div class="village-desc">廣東省自然村表格數據</div>
        </button>

        <button class="village-btn" @click="handleYcVillages">
          <div class="village-icon">🏠</div>
          <div class="village-name">陽春自然村</div>
          <div class="village-desc">廣東省陽春縣自然村(來自縣志)</div>
        </button>
      </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const handleGdVillagesTable = () => {
  router.push('/explore?page=gdVillagesTable')
};

const handleGdVillages = () => {
  router.push('/explore?page=gdVillages')
};

const handleYcVillages = () => {
  router.push('/explore?page=ycVillages')
};

const handleVillagesML = () => {
  router.push('/explore?page=VillagesML')
};
</script>

<style scoped>
.villages-page {
  min-width: 80dvw;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 70dvh;
}

.page-title {
  margin: 0 0 40px 0;
  font-size: 28px;
  font-weight: 700;
  color: #0b2540;
  text-align: center;
}

.villages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  width: 100%;
}

.village-btn {
  padding: 24px 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.15));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.village-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.08);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.3));
  border-color: rgba(0, 122, 255, 0.3);
}

.village-btn:active {
  transform: translateY(-2px);
}

.village-icon {
  font-size: 48px;
  line-height: 1;
}

.village-name {
  font-size: 20px;
  font-weight: 700;
  color: #005fd3;
}

.village-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

/* 移动端适配 */
@media (max-aspect-ratio: 1/1) {
  .page-title {
    font-size: 24px;
    margin-bottom: 15px;
  }

  .villages-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .village-btn {
    padding: 12px 12px;
  }

  .village-icon {
    font-size: 30px;
  }

  .village-name {
    font-size: 18px;
  }

  .village-desc {
    font-size: 12px;
  }
}
</style>
