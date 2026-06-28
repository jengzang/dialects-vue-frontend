<template>
  <div class="tools-page">
      <h2 class="page-title">{{ $t('tools.title') }}</h2>

      <div class="tools-grid">
        <button class="tool-btn" @click="handleDataCheck">
          <div class="tool-icon">🔍</div>
          <div class="tool-name">{{ $t('tools.dataCheck.name') }}</div>
          <div class="tool-desc">{{ $t('tools.dataCheck.desc') }}</div>
        </button>

        <button class="tool-btn" @click="handleJyutpingToIpa">
          <div class="tool-icon">🔄</div>
          <div class="tool-name">{{ $t('tools.jyutpingToIpa.name') }}</div>
          <div class="tool-desc">{{ $t('tools.jyutpingToIpa.desc') }}</div>
        </button>

        <button class="tool-btn" @click="handleMergeTables">
          <div class="tool-icon">🔗</div>
          <div class="tool-name">{{ $t('tools.mergeTables.name') }}</div>
          <div class="tool-desc">{{ $t('tools.mergeTables.desc') }}</div>
        </button>

        <button class="tool-btn" @click="handleDeriveTables">
          <div class="tool-icon">🧪</div>
          <div class="tool-name">{{ $t('tools.deriveTables.name') }}</div>
          <div class="tool-desc">{{ $t('tools.deriveTables.desc') }}</div>
        </button>

        <button class="tool-btn" @click="handlePraatTables">
          <div class="tool-icon">👂️</div>
          <div class="tool-name">{{ $t('tools.praatAnalysis.name') }}</div>
          <div class="tool-desc">{{ $t('tools.praatAnalysis.desc') }}</div>
        </button>

      </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 跳转到对应的工具页面
const handleDataCheck = () => {
  router.push('/explore/tools/check')
};

const handleJyutpingToIpa = () => {
  router.push('/explore/tools/jyut2ipa')
};

const handleMergeTables = () => {
  router.push('/explore/tools/merge')
};

const handleDeriveTables = () => {
  router.push('/explore/tools/derive')
};

const handlePraatTables = () => {
  router.push('/explore/tools/praat')
};
</script>

<style scoped>
.tools-page {
  min-width: 80dvw;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 20px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 30px;
  text-align: center;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 1000px;
}

.tool-btn {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(0, 122, 255, 0.2);
  border-radius: 16px;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.tool-btn:hover {
  transform: translateY(-4px);
  border-color: #007aff;
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.2);
  background: rgba(255, 255, 255, 1);
}

.tool-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.tool-name {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
}

.tool-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 24px;
  }
}
</style>
