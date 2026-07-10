<template>
  <div style="width: 100%;justify-content: center;align-items:center;display: flex;flex-direction: column">
    <div class="title-row">
      <h2 style="margin: 0;">{{ t('villages.pages.gdTable.title') }}</h2>
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
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue';
const { t } = useI18n();

const spokenColumns = computed(() => [
  { key: '市级', label: t('villages.pages.gdTable.columns.prefecture'), filterable: true, width: 0.8 },
  { key: '区县级', label: t('villages.pages.gdTable.columns.county'), filterable: true, width: 0.8 },
  { key: '乡镇级', label: t('villages.pages.gdTable.columns.town'), filterable: true, width: 0.8 },
  { key: '行政村', label: t('villages.pages.gdTable.columns.adminVillage'), filterable: true, width: 0.8 },
  { key: '自然村', label: t('villages.pages.gdTable.columns.naturalVillage'), filterable: false, width: 1.5 },
  { key: '方言分布', label: t('villages.pages.gdTable.columns.dialect'), filterable: true, width: 1 },
  { key: 'longitude', label: t('villages.pages.gdTable.columns.longitude'), filterable: false, width: 1 },
  { key: 'latitude', label: t('villages.pages.gdTable.columns.latitude'), filterable: false, width: 1 },

]);

</script>


```vue

$button-text-color: var(--color-blue-logo);
$button-transition: 0.3s ease;

.title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0;
}

.village-link-btn {
  padding: 8px 16px;
  color: $button-text-color;
  font-size: 1rem;
  font-weight: 1000;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.1)
  );
  border: 3px solid rgba(255, 255, 255, 0.4);
  border-radius: 25px;
  box-shadow:
    0 6px 10px rgba(0, 0, 0, 0.1),
    0 1px 4px rgba(0, 0, 0, 0.08);
  transition: all $button-transition;

  &:hover {
    background: linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.5),
      rgba(255, 255, 255, 0.3)
    );
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
    transform: scale(1.05);
  }
}

```

