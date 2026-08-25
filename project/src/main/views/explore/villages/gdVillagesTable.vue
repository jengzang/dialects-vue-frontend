<template>
  <div style="width: 100%;justify-content: center;align-items:center;display: flex;flex-direction: column">
    <div class="title-row">
      <h1 style="margin: 0;font-size: 1.5em;"><BarIcon icon="📋" />{{ t('navigation.pageTitles.villages.gdTable') }}</h1>
      <RouterLink class="cross-link" :to="localeTo('/explore/villages/gd')">{{ t('villages.pages.gdTree.title') }} →</RouterLink>
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
import { useRoute } from 'vue-router';
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue';
import BarIcon from '@/components/common/BarIcon.vue'
const { t } = useI18n();
const route = useRoute();

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

const localeTo = (path) => buildLocalePath(resolveRouteLocale(route), path);

</script>




<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0;
}

.cross-link {
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
}
</style>
