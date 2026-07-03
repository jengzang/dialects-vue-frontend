<template>
  <div style="width: 100%;justify-content: center;align-items:center;display: flex;flex-direction: column">
    <div class="title-row">
      <h2>{{ t('words.ycSpoken.name') }}</h2>
      <button class="village-link-btn" @click="goToYCVillages">
        <span role="img" aria-label="ycVillages">🏠</span> {{ t('villages.ycVillages.name') }}
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
import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { t } = useI18n();
const router = useRouter();

const spokenColumns = computed(() => [
  { key: '本字考', label: t('words.ycSpoken.columns.character'), filterable: false, width: 1 },
  { key: 'IPA', label: 'IPA', filterable: false, width: 0.8 },
  { key: '粤拼', label: t('words.ycSpoken.columns.jyutping'), filterable: false, width: 0.8 },
  { key: '来源', label: t('words.ycSpoken.columns.source'), filterable: true, width: 0.8 },
  { key: '声母', label: t('words.ycSpoken.columns.initial'), filterable: true, width: 0.5 },
  { key: '韵母', label: t('words.ycSpoken.columns.final'), filterable: true, width: 0.8 },
  { key: '音调', label: t('words.ycSpoken.columns.tone'), filterable: true, width: 0.5 },
  { key: '词性', label: t('words.ycSpoken.columns.partOfSpeech'), filterable: true, width: 1 },
  { key: '释义', label: t('words.ycSpoken.columns.definition'), filterable: false, width: 2 },
  { key: '例词例句', label: t('words.ycSpoken.columns.examples'), filterable: false, width: 2 },
  { key: '待校及说明', label: t('words.ycSpoken.columns.review'), filterable: true, width: 0.8 },
]);

const goToYCVillages = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/villages/yc'));
};
</script>

<style lang="scss" scoped>
.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0px;
  margin: 0;
  font-size: 1em;
  flex-wrap: wrap;

  & h2 {
    margin: 0 20px 0 0;
    white-space: nowrap;
  }
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
