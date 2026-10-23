<template>
  <main class="yangchun-expressions">
    <section class="yc-expressions-hero">
      <div>
        <span class="yc-eyebrow">Yangchun Expressions</span>
        <h1><BarIcon icon="📝" />{{ t('navigation.pageTitles.yangchun.expressions') }}</h1>
        <p>
          AABB、ABB、AAB、歇后语、农谚、惯用语都可以在这里按类型浏览，后续资料会继续补全。
        </p>
      </div>
      <div class="surface-subpanel yc-expressions-hero__note">
        <strong>资料状态</strong>
        <span>当前展示示例条目，真实资料会按同一分类继续补全。</span>
      </div>
    </section>

    <section class="yc-expression-controls glass-panel">
      <label class="yc-search-field">
        <span>搜索</span>
        <input
          v-model="searchQuery"
          class="glass-field"
          data-shape="search"
          type="search"
          placeholder="搜词形、释义、例句、地域或标签"
        >
      </label>

      <div
        class="yc-filter-row"
        role="group"
        aria-label="熟语分类"
      >
        <span
          class="yc-filter-label"
          aria-hidden="true"
        >分类</span>
        <button
          v-for="category in yangchunExpressionCategories"
          :key="category.id"
          class="glass-button"
          data-size="small"
          :data-active="activeCategory === category.id"
          :aria-pressed="activeCategory === category.id"
          type="button"
          @click="activeCategory = category.id"
        >
          {{ category.label }}
        </button>
      </div>

      <div
        class="yc-filter-row yc-filter-row--secondary"
        role="group"
        aria-label="词形模式"
      >
        <span
          class="yc-filter-label"
          aria-hidden="true"
        >词形</span>
        <button
          v-for="pattern in yangchunExpressionPatterns"
          :key="pattern"
          class="glass-button"
          data-size="small"
          :data-active="activePattern === pattern"
          :aria-pressed="activePattern === pattern"
          type="button"
          @click="activePattern = pattern"
        >
          {{ pattern }}
        </button>
      </div>

      <div class="yc-filter-footer">
        <span>共 {{ filteredItems.length }} 条</span>
        <div class="yc-view-switch">
          <button
            class="glass-button"
            data-size="small"
            :data-active="viewMode === 'card'"
            :aria-pressed="viewMode === 'card'"
            type="button"
            @click="viewMode = 'card'"
          >
            卡片
          </button>
          <button
            class="glass-button"
            data-size="small"
            :data-active="viewMode === 'table'"
            :aria-pressed="viewMode === 'table'"
            type="button"
            @click="viewMode = 'table'"
          >
            表格
          </button>
        </div>
      </div>
    </section>

    <section
      v-if="viewMode === 'card'"
      class="yc-expression-results"
    >
      <div
        v-if="filteredItems.length"
        class="main-card-grid yc-expression-grid"
      >
        <article
          v-for="item in filteredItems"
          :key="item.id"
          class="glass-card yc-expression-card"
        >
          <div class="yc-expression-card__head">
            <span class="yc-pattern-pill glass-subpanel">{{ item.pattern }}</span>
            <small>{{ item.area }}</small>
          </div>
          <h2>{{ item.expression }}</h2>
          <span class="yc-pronunciation">{{ item.pronunciation }}</span>
          <p class="yc-expression-meaning">
            {{ item.meaning }}
          </p>
          <blockquote class="surface-subpanel">
            {{ item.example }}
          </blockquote>
          <div class="yc-tag-list">
            <span
              v-for="tag in item.tags"
              :key="`${item.id}-${tag}`"
              class="glass-subpanel"
            >{{ tag }}</span>
          </div>
          <small class="yc-expression-note">{{ item.note }}</small>
        </article>
      </div>

      <div
        v-else
        class="empty-state-base glass-panel yc-empty-state"
      >
        <strong>没有匹配条目</strong>
        <span>换一个分类、模式或搜索词试试。</span>
      </div>
    </section>

    <section
      v-else
      class="yc-expression-table"
    >
      <GlassTable
        :columns="tableColumns"
        :data="filteredItems"
        row-key="id"
        empty-text="没有匹配条目"
      />
    </section>
  </main>
</template>

<script setup>
import BarIcon from '@/components/common/BarIcon.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GlassTable from '@/components/common/GlassTable.vue'
import {
  yangchunExpressionCategories,
  yangchunExpressionPatterns,
  normalizedYangchunExpressionItems,
} from './yangchunExpressionsMock.js'

const activeCategory = ref('all')
const { t } = useI18n()
const activePattern = ref('全部')
const searchQuery = ref('')
const viewMode = ref('card')

const tableColumns = [
  { key: 'expression', label: '词形', minWidth: '120px' },
  { key: 'pattern', label: '模式', minWidth: '90px' },
  { key: 'meaning', label: '释义', minWidth: '180px' },
  { key: 'example', label: '例句', minWidth: '180px' },
  { key: 'area', label: '地域', minWidth: '150px' },
  { key: 'source', label: '来源', minWidth: '90px' },
]

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return normalizedYangchunExpressionItems.filter((item) => {
    const categoryMatched = activeCategory.value === 'all' || item.category === activeCategory.value
    const patternMatched = activePattern.value === '全部' || item.pattern === activePattern.value
    const searchable = [
      item.expression,
      item.pronunciation,
      item.meaning,
      item.example,
      item.area,
      item.source,
      item.note,
      ...item.tags,
    ].join(' ').toLowerCase()

    return categoryMatched && patternMatched && (!query || searchable.includes(query))
  })
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.yangchun-expressions {
  @include flex-col;
  gap: 28px;
  width: min(1180px, 94dvw);
  margin: 0 auto;
  padding: 40px 0 80px;
}

.yc-expressions-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 0.3fr);
  gap: 24px;
  align-items: center;
  padding: 12px 4px;

  h1,
  p {
    margin: 0;
  }

  h1 {
    margin: 10px 0 14px;
    font-size: clamp(1.9rem, 3.4dvw, 2.75rem);
    line-height: 1.25;
    text-wrap: balance;

    :deep(svg),
    :deep(.bar-icon-emoji) {
      margin-right: 10px;
      font-size: 0.75em;
    }
  }

  p {
    max-width: 760px;
    color: var(--text-tertiary);
    line-height: 1.8;
  }
}

.yc-expressions-hero__note {
  @include flex-col;
  gap: 8px;
  padding: 18px;

  span {
    color: var(--text-tertiary);
    font-size: 0.85rem;
    line-height: 1.7;
  }
}

.yc-eyebrow {
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.yc-expression-controls {
  @include flex-col;
  gap: 12px;
  padding: 22px 24px;
}

.yc-search-field {
  @include flex-col;
  gap: 8px;

  span {
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 700;
  }

  .glass-field {
    min-height: 44px;
  }
}

.yc-filter-row,
.yc-filter-footer,
.yc-view-switch,
.yc-expression-card__head,
.yc-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.yc-filter-footer {
  justify-content: space-between;
  color: var(--text-secondary);
}

.yc-filter-label {
  flex-shrink: 0;
  margin-right: 4px;
  color: var(--text-tertiary);
  font-size: 0.85rem;
  font-weight: 600;
}

.yc-filter-row--secondary {
  .glass-button {
    --glass-button-small-font-size: 12px;
    --glass-button-small-padding: 6px 12px;
    --glass-button-color: var(--text-tertiary);
  }
}

.yc-expression-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  --main-card-grid-gap: 20px;
}

.yc-expression-card {
  @include flex-col;
  gap: 10px;
  min-width: 0;
  padding: 24px;
  cursor: default;

  h2 {
    margin: 10px 0 0;
    color: var(--text-primary);
    font-size: 1.55rem;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  p,
  blockquote,
  small {
    margin: 0;
    color: var(--text-tertiary);
    line-height: 1.7;
  }

  blockquote {
    margin-top: 6px;
    padding: 14px 16px;
    font-size: 0.95rem;
    overflow-wrap: anywhere;
  }

  .yc-expression-meaning {
    color: var(--text-primary);
    line-height: 1.8;
  }

  .yc-expression-note {
    margin-top: auto;
    padding-top: 6px;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
}

.yc-expression-card__head {
  justify-content: space-between;
  width: 100%;

  small {
    font-size: 0.75rem;
  }
}

.yc-pattern-pill,
.yc-tag-list span {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 3px 9px;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.yc-pronunciation {
  color: var(--color-primary);
  font-size: 0.85rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.yc-expression-table {
  min-width: 0;
}

.yc-empty-state {
  gap: 8px;
  min-height: 240px;
  padding: 24px;
  color: var(--text-secondary);
}

@media (max-aspect-ratio: 1 / 1) {
  .yangchun-expressions {
    width: min(94dvw, 760px);
    padding-top: 20px;
    gap: 20px;
  }

  .yc-expressions-hero {
    grid-template-columns: 1fr;
    gap: 16px;

    h1 {
      font-size: clamp(1.7rem, 6.4dvw, 2.4rem);
    }
  }

  .yc-expressions-hero__note {
    gap: 6px;
    padding: 14px 16px;
  }

  .yc-expression-controls {
    padding: 18px;
  }

  .yc-filter-label {
    flex-basis: 100%;
  }

  .yc-filter-row {
    gap: 8px;
  }

  .yc-expression-grid {
    grid-template-columns: minmax(0, 1fr);
    --main-card-grid-gap: 16px;
  }

  .yc-expression-card {
    padding: 22px;
  }

  .yc-filter-footer {
    align-items: flex-start;
  }
}
</style>
