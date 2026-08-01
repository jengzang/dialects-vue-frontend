<template>
  <form
    class="toponym-search-bar__form"
    @submit.prevent="handleSubmit"
  >
    <label class="toponym-search-bar__field toponym-search-bar__field--query">
      <span>{{ t('villages.pages.toponyms.search.keyword') }}</span>
      <input
        class="main-search-field"
        :value="query"
        :placeholder="t('villages.pages.toponyms.search.placeholder')"
        autocomplete="off"
        @input="emit('update:query', $event.target.value)"
      >
    </label>

    <label class="toponym-search-bar__field">
      <span>{{ t('villages.pages.toponyms.search.matchMode') }}</span>
      <SimpleSelectDropdown
        :model-value="matchMode"
        :options="matchModeOptions"
        match-trigger-width
        @update:model-value="emit('update:matchMode', $event)"
      />
    </label>

    <label class="toponym-search-bar__field">
      <span>{{ t('villages.pages.toponyms.search.placeType') }}</span>
      <SimpleSelectDropdown
        :model-value="placeTypeCode"
        :options="placeTypeOptions"
        match-trigger-width
        @update:model-value="emit('update:placeTypeCode', $event)"
      />
    </label>

    <label class="toponym-search-bar__field">
      <span>{{ t('villages.pages.toponyms.search.limit') }}</span>
      <SimpleSelectDropdown
        :model-value="pointLimit"
        :options="pointLimitOptions"
        match-trigger-width
        @update:model-value="emit('update:pointLimit', Number($event))"
      />
    </label>

    <button
      class="main-glass-button toponym-search-bar__submit"
      type="submit"
      :disabled="loading"
    >
      {{ loading ? t('villages.pages.toponyms.search.searching') : t('villages.pages.toponyms.search.submit') }}
    </button>
  </form>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue';

defineProps({
  query: {
    type: String,
    default: '',
  },
  matchMode: {
    type: String,
    default: 'prefix',
  },
  placeTypeCode: {
    type: String,
    default: '22200',
  },
  pointLimit: {
    type: Number,
    default: 5000,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'update:query',
  'update:matchMode',
  'update:placeTypeCode',
  'update:pointLimit',
  'search',
]);

const { t } = useI18n();

const matchModeOptions = computed(() => [
  { value: 'prefix', label: t('villages.pages.toponyms.matchModes.prefix') },
  { value: 'suffix', label: t('villages.pages.toponyms.matchModes.suffix') },
  { value: 'exact', label: t('villages.pages.toponyms.matchModes.exact') },
  { value: 'contains', label: t('villages.pages.toponyms.matchModes.contains') },
]);

const placeTypeOptions = computed(() => [
  { value: '22200', label: t('villages.pages.toponyms.placeTypes.naturalVillage') },
  { value: '21610', label: t('villages.pages.toponyms.placeTypes.adminVillage') },
  { value: '27610', label: t('villages.pages.toponyms.placeTypes.villageCommittee') },
]);

const pointLimitOptions = computed(() => [
  { value: 1000, label: t('villages.pages.toponyms.limits.oneThousand') },
  { value: 5000, label: t('villages.pages.toponyms.limits.fiveThousand') },
  { value: 10000, label: t('villages.pages.toponyms.limits.tenThousand') },
  { value: 50000, label: t('villages.pages.toponyms.limits.fiftyThousand') },
]);

function handleSubmit() {
  emit('search');
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.toponym-search-bar__form {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.toponym-search-bar {
  &__field {
    @include flex-col;
    gap: 6px;
    min-inline-size: 152px;

    span {
      color: var(--text-secondary);
      font-size: 13px;
      line-height: 1.4;
    }

    &--query {
      flex: 1 1 260px;
    }
  }

  &__submit {
    min-block-size: 42px;

    &:disabled {
      @include disabled-state;
    }
  }
}
</style>
