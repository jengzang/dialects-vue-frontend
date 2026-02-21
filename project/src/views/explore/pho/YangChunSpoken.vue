<template>
  <div style="width: 100%;justify-content: center;align-items:center;display: flex;flex-direction: column">
    <div class="title-row">
      <h2 style="margin: 0;">陽春口語詞</h2>
      <button class="village-link-btn" @click="goToYCVillages">
        <span role="img" aria-label="ycVillages">🏠</span> 陽春自然村
      </button>
    </div>
    <UniversalTable
        db-key="spoken"
        table-name="口语字"
        :columns="spokenColumns"
    />
  </div>
</template>

<script setup>
import UniversalTable from '@/components/TableAndTree/UniversalTable.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const spokenColumns = [
  { key: '本字考', label: '字', filterable: false,width:1 },
  { key: 'IPA', label: 'IPA', filterable: false,width:0.8 },
  { key: '粤拼', label: '粵拼', filterable: false,width:0.8 },
  { key: '来源', label: '來源', filterable: true,width:0.8 },
  { key: '声母', label: '聲', filterable: true,width:0.5},
  { key: '韵母', label: '韻', filterable: true,width:0.8},
  { key: '音调', label: '調', filterable: true,width:0.5},
  { key: '词性', label: '詞性', filterable: true,width:1},
  { key: '释义', label: '釋義', filterable: false,width:2 },
  { key: '例词例句', label: '例詞例句', filterable: false,width:2 },
  { key: '待校及说明', label: '待校', filterable: true ,width:0.8},
];

const goToYCVillages = () => {
  router.push({ path: '/explore', query: { page: 'ycVillages' } });
};
</script>

<style scoped>
.title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0;
}

.village-link-btn {
  padding: 8px 16px;
  border-radius: 25px;
  border: 3px solid rgba(255, 255, 255, 0.4);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  color: #005fd3;
  font-weight: 1000;
  font-size: 1rem;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.village-link-btn:hover {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.3));
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}
</style>