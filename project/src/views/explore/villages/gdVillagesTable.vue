<template>
  <div style="width: 100%;justify-content: center;align-items:center;display: flex;flex-direction: column">
    <div class="title-row">
      <h2 style="margin: 0;">全粵村情</h2>
<!--      <button class="village-link-btn" @click="goToGDVillages">-->
<!--        <span role="img" aria-label="ycVillages">🏠</span> 樹狀圖-->
<!--      </button>-->
    </div>
    <UniversalTable
        db-key="village"
        table-name="广东省自然村"
        :columns="spokenColumns"
    />
  </div>
</template>

<script setup>
import UniversalTable from '@/components/TableAndTree/UniversalTable.vue';
import { useRouter } from 'vue-router';
const router = useRouter();

const spokenColumns = [
  {key: '市级', label: '地级', filterable: true, width: 0.8},
  {key: '区县级', label: '縣級', filterable: true, width: 0.8},
  {key: '乡镇级', label: '鎮級', filterable: true, width: 0.8},
  {key: '行政村', label: '行政村', filterable: true, width: 0.8},
  {key: '自然村', label: '自然村', filterable: false, width: 1.5},
  {key: '方言分布', label: '方言', filterable: true, width: 1},
  {key: 'longitude', label: '經度', filterable: false, width: 1},
  {key: 'latitude', label: '緯度', filterable: false, width: 1},

];

const goToGDVillages = () => {
  router.push({ path: '/explore', query: { page: 'gdVillages' } });
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