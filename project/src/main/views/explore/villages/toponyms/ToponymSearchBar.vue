<template>
  <form
    class="toponym-search-bar__form"
    :class="{ 'is-expanded': expanded, 'glass-panel': !expanded }"
    @submit.prevent="handleSubmit"
  >
    <label class="toponym-search-bar__field toponym-search-bar__field--query">
      <span>{{ t('villages.pages.toponyms.search.keyword') }}</span>
      <input
        class="glass-field toponym-search-bar__input"
        data-shape="search"
        :value="query"
        :placeholder="t('villages.pages.toponyms.search.placeholder')"
        autocomplete="off"
        @input="emit('update:query', $event.target.value)"
      >
      <small
        v-if="expanded"
        class="toponym-search-bar__hint"
      >
        {{ t('villages.pages.toponyms.search.placeholder') }}
      </small>
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

    <button
      class="glass-button toponym-search-bar__submit"
      type="submit"
      :disabled="loading"
    >
      {{ loading ? t('villages.pages.toponyms.search.searching') : t('villages.pages.toponyms.search.submit') }}
    </button>
    <slot name="actions" />
    <p
      v-if="error"
      class="toponym-search-bar__error"
      role="alert"
    >
      {{ error }}
    </p>
  </form>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue';

defineProps({
  expanded: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  query: {
    type: String,
    default: '',
  },
  matchMode: {
    type: String,
    default: 'prefix',
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'update:query',
  'update:matchMode',
  'search',
]);

const { t } = useI18n();

const matchModeOptions = computed(() => [
  { value: 'prefix', label: t('villages.pages.toponyms.matchModes.prefix') },
  { value: 'suffix', label: t('villages.pages.toponyms.matchModes.suffix') },
  { value: 'exact', label: t('villages.pages.toponyms.matchModes.exact') },
  { value: 'contains', label: t('villages.pages.toponyms.matchModes.contains') },
]);

function handleSubmit() {
  emit('search');
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.toponym-search-bar__form {
  --glass-panel-background: var(--surface-glass-floating);
  --glass-panel-radius: var(--radius-xl);
  --glass-panel-border: 1px solid var(--border-glass);
  --glass-panel-shadow: var(--shadow-glass-inset);
  --glass-panel-hover-shadow: var(--shadow-glass-inset);
  --glass-panel-backdrop-filter: blur(24px) saturate(180%);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(110px, 160px) auto auto;
  align-items: center;
  gap: 10px;
  min-inline-size: 0;
  padding: 12px;

  &.is-expanded {
    grid-template-columns: minmax(0, 1fr) auto auto;
    padding: 0;

    .toponym-search-bar__field--query {
      grid-column: 1 / -1;
    }
  }
}

.toponym-search-bar {
  &__field {
    @include flex-col;
    gap: 6px;
    min-inline-size: 0;

    span {
      color: var(--text-secondary);
      font-size: 13px;
      line-height: 1.4;
    }
  }

  &__input {
    inline-size: 100%;
    min-inline-size: 0;
    min-block-size: calc(44px + var(--query-input-growth, 0px));
    box-sizing: border-box;
    font-size: calc(15px + 5px * var(--query-expansion, 0));
  }

  &__error {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--color-error);
    font-size: 13px;
  }

  &__hint {
    @include text-truncate;
    color: var(--text-tertiary);
    font-size: 12px;
    line-height: 1.4;
  }

  &__submit {
    min-block-size: 42px;

    &:disabled {
      @include disabled-state;
    }
  }
}

@media (max-aspect-ratio: 1 / 1) {
  .toponym-search-bar__form {
    grid-template-columns: minmax(0, 1fr) auto auto;
    padding: 10px;

    .toponym-search-bar__field--query {
      grid-column: 1 / -1;
    }

    &.is-expanded {
      padding: 0;
    }
  }
}
</style>
