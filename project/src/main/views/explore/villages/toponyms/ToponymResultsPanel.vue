<template>
  <aside class="toponym-results-panel toponym-results-panel__inspector main-glass-panel">
    <div class="toponym-results-panel__inner main-glass-panel-inner">
      <section class="toponym-results-panel__summary">
        <h2>{{ t('villages.pages.toponyms.results.title') }}</h2>
        <p v-if="!hasSearched">
          {{ t('villages.pages.toponyms.results.empty') }}
        </p>
        <p v-else-if="loading">
          {{ t('villages.pages.toponyms.results.loading') }}
        </p>
        <p
          v-else-if="error"
          class="toponym-results-panel__error"
        >
          {{ error }}
        </p>
        <p v-else>
          {{
            t('villages.pages.toponyms.results.count', {
              count: pointCount,
              shown: scatterCount,
            })
          }}
        </p>
        <p
          v-if="truncated"
          class="toponym-results-panel__warning"
        >
          {{ t('villages.pages.toponyms.results.truncated') }}
        </p>
      </section>

      <section class="toponym-results-panel__suggestions">
        <div class="toponym-results-panel__section-header">
          <h3>{{ t('villages.pages.toponyms.suggestions.title') }}</h3>
          <span v-if="suggestionsLoading">{{ t('villages.pages.toponyms.suggestions.loading') }}</span>
        </div>
        <p
          v-if="suggestionsError"
          class="toponym-results-panel__error"
        >
          {{ suggestionsError }}
        </p>
        <p
          v-else-if="!suggestions.length"
          class="toponym-results-panel__muted toponym-results-panel__suggestion-note"
        >
          {{ t('villages.pages.toponyms.suggestions.empty') }}
        </p>
        <div
          v-else
          class="toponym-results-panel__chips ui-scrollbar"
        >
          <button
            v-for="name in suggestions"
            :key="name"
            class="toponym-results-panel__chip"
            type="button"
            @click="emit('select-suggestion', name)"
          >
            {{ name }}
          </button>
        </div>
      </section>

      <ToponymDetailPanel
        :selected-point="selectedPoint"
        :local-detail="localDetail"
        :local-loading="localLoading"
        :local-error="localError"
        :official-detail="officialDetail"
        :official-loading="officialLoading"
        :official-error="officialError"
        @request-official-detail="emit('request-official-detail')"
      />
    </div>
  </aside>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import ToponymDetailPanel from './ToponymDetailPanel.vue';

defineProps({
  hasSearched: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  pointCount: {
    type: Number,
    default: 0,
  },
  scatterCount: {
    type: Number,
    default: 0,
  },
  truncated: {
    type: Boolean,
    default: false,
  },
  suggestions: {
    type: Array,
    default: () => [],
  },
  suggestionsLoading: {
    type: Boolean,
    default: false,
  },
  suggestionsError: {
    type: String,
    default: '',
  },
  selectedPoint: {
    type: Object,
    default: null,
  },
  localDetail: {
    type: Object,
    default: null,
  },
  localLoading: {
    type: Boolean,
    default: false,
  },
  localError: {
    type: String,
    default: '',
  },
  officialDetail: {
    type: Object,
    default: null,
  },
  officialLoading: {
    type: Boolean,
    default: false,
  },
  officialError: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['select-suggestion', 'request-official-detail']);
const { t } = useI18n();
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.toponym-results-panel {
  min-inline-size: 320px;

  &__inspector {
    align-self: stretch;
  }

  &__inner {
    @include flex-col;
    gap: 14px;
    max-block-size: 68dvh;
    overflow: auto;
  }

  &__summary,
  &__suggestions {
    @include flex-col;
    gap: 8px;

    h2,
    h3,
    p {
      margin: 0;
    }

    h2 {
      color: var(--text-deep);
      font-size: 16px;
      line-height: 1.35;
    }

    h3 {
      color: var(--text-deep);
      font-size: 15px;
      line-height: 1.4;
    }

    p {
      color: var(--text-secondary);
      font-size: 13px;
      line-height: 1.6;
    }
  }

  &__section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;

    span {
      color: var(--text-tertiary);
      font-size: 12px;
    }
  }

  &__chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    max-block-size: 132px;
    overflow: auto;
    padding-inline-end: 4px;
  }

  &__suggestion-note {
    color: var(--text-tertiary);
  }

  &__chip {
    max-inline-size: 100%;
    padding: 6px 10px;
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-pill);
    background: var(--surface-glass-button);
    color: var(--text-primary);
    font: inherit;
    cursor: pointer;

    &:hover {
      background: var(--surface-glass-button-hover);
    }
  }

  &__muted {
    color: var(--text-muted);
  }

  &__warning {
    color: var(--color-warning);
  }

  &__error {
    color: var(--color-error);
  }
}
</style>
