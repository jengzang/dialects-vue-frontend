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

      <section class="toponym-results-panel__name-tree">
        <div class="toponym-results-panel__section-header">
          <h3>{{ t('villages.pages.toponyms.nameTree.title') }}</h3>
          <span v-if="nameTreeLoading">{{ t('villages.pages.toponyms.nameTree.loading') }}</span>
        </div>
        <button
          class="main-glass-button toponym-results-panel__tree-action"
          type="button"
          :disabled="loading || nameTreeLoading || !hasSearched"
          @click="emit('request-name-tree')"
        >
          {{
            nameTreeLoading
              ? t('villages.pages.toponyms.nameTree.loading')
              : t('villages.pages.toponyms.nameTree.load')
          }}
        </button>
        <p
          v-if="nameTreeError"
          class="toponym-results-panel__error"
        >
          {{ nameTreeError }}
        </p>
        <p
          v-else-if="!nameTreeLoaded"
          class="toponym-results-panel__muted toponym-results-panel__name-tree-note"
        >
          {{ t('villages.pages.toponyms.nameTree.idle') }}
        </p>
        <p
          v-else-if="!nameTreeRows.length"
          class="toponym-results-panel__muted toponym-results-panel__name-tree-note"
        >
          {{ t('villages.pages.toponyms.nameTree.empty') }}
        </p>
        <ol
          v-else
          class="toponym-results-panel__tree-list ui-scrollbar"
        >
          <li
            v-for="row in nameTreeRows"
            :key="row.key"
            class="toponym-results-panel__tree-node"
            :style="getTreeRowStyle(row)"
          >
            <span>{{ row.name }}</span>
            <small>{{ t('villages.pages.toponyms.nameTree.level', { level: row.level }) }}</small>
            <div
              v-if="row.names.length"
              class="toponym-results-panel__names"
            >
              {{ formatNames(row.names) }}
            </div>
          </li>
        </ol>
      </section>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
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
  nameTree: {
    type: Array,
    default: () => [],
  },
  nameTreeLoading: {
    type: Boolean,
    default: false,
  },
  nameTreeError: {
    type: String,
    default: '',
  },
  nameTreeLoaded: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['request-name-tree']);
const { t } = useI18n();

const nameTreeRows = computed(() => flattenNameTreeNodes(props.nameTree));

function formatNames(names) {
  return names.join(', ');
}

function getTreeRowStyle(row) {
  return {
    '--toponym-tree-indent': `${row.depth * 10}px`,
  };
}

function flattenNameTreeNodes(nodes, lineage = '', depth = 0) {
  if (!Array.isArray(nodes)) return [];

  return nodes.flatMap((node, index) => {
    const name = typeof node?.name === 'string' && node.name ? node.name : '-';
    const level = node?.level ?? '-';
    const key = `${lineage}/${level}:${name}:${index}`;
    const row = {
      key,
      name,
      level,
      names: Array.isArray(node?.names) ? node.names.filter((item) => typeof item === 'string' && item) : [],
      depth,
    };

    return [
      row,
      ...flattenNameTreeNodes(node?.children, key, depth + 1),
    ];
  });
}
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
  &__name-tree {
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

  &__tree-action {
    align-self: flex-start;

    &:disabled {
      @include disabled-state;
    }
  }

  &__tree-list {
    @include flex-col;
    gap: 8px;
    max-block-size: 240px;
    margin: 0;
    overflow: auto;
    padding-inline-start: 0;
    padding-inline-end: 4px;
    list-style: none;
  }

  &__tree-node {
    @include flex-col;
    gap: 3px;
    padding: 8px;
    padding-inline-start: calc(8px + var(--toponym-tree-indent, 0px));
    border: 1px solid var(--border-glass-subtle);
    border-radius: var(--radius-sm2);
    background: var(--surface-panel-subtle);

    span {
      color: var(--text-primary);
      font-size: 13px;
      line-height: 1.4;
    }

    small {
      color: var(--text-tertiary);
      font-size: 12px;
      line-height: 1.4;
    }
  }

  &__names {
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.5;
    word-break: break-word;
  }

  &__name-tree-note {
    color: var(--text-tertiary);
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
