<template>
  <div class="glass-container">
    <div class="header-section">
      <div class="title-row">
        <h2 style="margin: 0;">陽春行政規劃</h2>
<!--        <button class="village-link-btn" @click="goToGDVillages">-->
<!--          <span role="img" aria-label="ycVillages">🏠</span> 廣東自然村-->
<!--        </button>-->
      </div>
      <p>數據源：《陽春縣志》(1996)</p>
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索村委、社區或自然村..."
            class="glass-input"
        />
      </div>
    </div>

    <div class="tree-content custom-scrollbar">
      <div v-if="displayData.length === 0" class="empty-state">
        沒有找到匹配的結果
      </div>

      <TreeItem
          v-for="item in displayData"
          :key="item.id"
          :node="item"
          :search-query="searchQuery"
      />
    </div>
  </div>
</template>

<script setup>
import {ref, computed} from 'vue';
import TreeItem from '@/components/TableAndTree/TreeItem.vue'; // 👈 導入剛才創建的子組件
import villageData from '@/assets/yc_villages.json'; // 👈 導入你的 JSON
import { useRouter } from 'vue-router';
const router = useRouter();

// 數據標準化邏輯
let idCounter = 0;
const generateId = () => `node-${idCounter++}`;

const normalizeData = (data, name = 'Root') => {
  const children = [];

  if (Array.isArray(data)) {
    // 處理數組的情況 (最底層的村)
    data.forEach(item => {
      if (typeof item === 'string') {
        children.push({ id: generateId(), name: item, children: [] });
      } else {
        children.push(normalizeData(item, 'Unknown'));
      }
    });
  } else if (typeof data === 'object' && data !== null) {
    // 處理對象的情況 (居委會、鎮級等)
    Object.keys(data).forEach(key => {
      const value = data[key];

      // 🔥 新增過濾邏輯：如果子內容為空，直接跳過 (不顯示該分類)
      const isEmptyArray = Array.isArray(value) && value.length === 0;
      const isEmptyObject = typeof value === 'object' && value !== null && Object.keys(value).length === 0;

      // 只有「不為空」的時候，才處理並加入 children
      if (!isEmptyArray && !isEmptyObject) {
        children.push(normalizeData(value, key));
      }
    });
  }

  return {
    id: generateId(),
    name: name,
    children: children
  };
};

// 初始化數據
// 注意：根據你的 JSON 結構，你可能需要根據實際情況調整這裡取 children 的層級
// 假設 JSON 根就是 { "陂面镇": ... }
const initTree = () => {
  const normalized = normalizeData(villageData);
  return normalized.children;
};

const fullTreeData = ref(initTree());
const searchQuery = ref('');


// 修改 VillageMap.vue 中的 filterTree 函數
const filterTree = (nodes, query) => {
  return nodes.reduce((acc, node) => {
    // 1. 判斷自己是否匹配
    const selfMatch = node.name.toLowerCase().includes(query.toLowerCase());

    // 2. 遞歸過濾子節點
    let filteredChildren = [];
    if (node.children && node.children.length > 0) {
      filteredChildren = filterTree(node.children, query);
    }

    // 3. 判斷是否有子節點匹配
    const hasChildMatch = filteredChildren.length > 0;

    if (hasChildMatch) {
      // 情況 A：子孫中有匹配項 (我是路徑)
      // 動作：必須保留，且必須自動展開 (_autoExpand: true)
      // 注意：這裡我們使用 filteredChildren (只顯示匹配的那條路徑)
      acc.push({
        ...node,
        children: filteredChildren,
        _autoExpand: true  // 🔥 關鍵：路徑節點要展開
      });
    } else if (selfMatch) {
      // 情況 B：我自己匹配到了，但子孫沒匹配 (或者沒搜子孫)
      // 動作：保留我自己，但默認折疊 (_autoExpand: false)
      // 注意：這裡我們恢復 node.children (原始完整數據)，
      // 這樣用戶點擊加號時，可以看到裡面所有的內容，而不是空的
      acc.push({
        ...node,
        children: node.children, // 🔥 關鍵：保留原始子數據供手動查看
        _autoExpand: false // 🔥 關鍵：雖然匹配了，但不主動展開
      });
    }

    return acc;
  }, []);
};

const displayData = computed(() => {
  if (!searchQuery.value.trim()) return fullTreeData.value;
  return filterTree(fullTreeData.value, searchQuery.value.trim());
});

const goToGDVillages = () => {
  router.push({ path: '/explore', query: { page: 'gdVillages' } });
};


</script>

<style scoped>
/* 父容器樣式 */
.glass-container {
  width: 60dvw;
  height: 95%;
  max-width: 400px;
  margin: 20px auto;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #1d1d1f;
}
@media (max-aspect-ratio: 1/1){
  .glass-container{
    height: 92%;
    width: 90dvw;
  }

}

.header-section {
  padding: 20px 20px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.3);
}

.header-section p{
  margin: 0 0 12px 0;
  color: dimgrey;
  font-size: 14px;
}

.title {
  margin:0;
  font-size: 22px;
  font-weight: 700;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
  opacity: 0.5;
}

.glass-input {
  width: 100%;
  padding: 10px 16px 10px 36px;
  border: none;
  border-radius: 15px;
  background: rgba(0, 0, 0, 0.05);
  outline: none;
  transition: all 0.3s;
}

.glass-input:focus {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3);
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #888;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0;
}
.village-link-btn {
  padding: 8px 6px;
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