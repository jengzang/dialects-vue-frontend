<template>
  <div style="width: 100%;justify-content: center;align-items:center;display: flex;flex-direction: column">
    <div class="title-row">
      <h1><BarIcon icon="🗣️" />{{ t('words.ycSpoken.name') }}</h1>
      <span class="cross-link" @click="goToYCVillages">{{ t('villages.ycVillages.name') }} →</span>
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
import BarIcon from '@/components/common/BarIcon.vue'
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

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



<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-size: 1em;

  h1 {
    font-size: 1.5em;
    margin: 0 20px 0 0;
    white-space: nowrap;
  }
}

.cross-link {
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
}
</style>
