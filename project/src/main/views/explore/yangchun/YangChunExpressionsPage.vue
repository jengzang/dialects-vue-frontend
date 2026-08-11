<template>
  <main class="yangchun-expressions">
    <section class="yc-expressions-hero glass-shell">
      <div>
        <span class="yc-eyebrow">Yangchun Expressions</span>
        <h1><BarIcon icon="📝" />{{ t('navigation.pageTitles.yangchun.expressions') }}</h1>
        <p>
          AABB、ABB、AAB、歇后语、农谚、惯用语都可以在这里按类型浏览，后续资料会继续补全。
        </p>
      </div>
      <div class="glass-subpanel yc-expressions-hero__note">
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
        <button
          v-for="category in yangchunExpressionCategories"
          :key="category.id"
          class="glass-button"
          data-size="small"
          :data-active="activeCategory === category.id"
          type="button"
          @click="activeCategory = category.id"
        >
          {{ category.label }}
        </button>
      </div>

      <div
        class="yc-filter-row"
        role="group"
        aria-label="词形模式"
      >
        <button
          v-for="pattern in yangchunExpressionPatterns"
          :key="pattern"
          class="glass-button"
          data-size="small"
          :data-active="activePattern === pattern"
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
            type="button"
            @click="viewMode = 'card'"
          >
            卡片
          </button>
          <button
            class="glass-button"
            data-size="small"
            :data-active="viewMode === 'table'"
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
          <strong>{{ item.expression }}</strong>
          <span class="yc-pronunciation">{{ item.pronunciation }}</span>
          <p>{{ item.meaning }}</p>
          <blockquote class="glass-subpanel">
            {{ item.example }}
          </blockquote>
          <div class="yc-tag-list">
            <span
              v-for="tag in item.tags"
              :key="`${item.id}-${tag}`"
              class="glass-subpanel"
            >{{ tag }}</span>
          </div>
          <small>{{ item.note }}</small>
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
  yangchunExpressionItems,
  yangchunExpressionPatterns,
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

  return yangchunExpressionItems.filter((item) => {
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
  gap: 22px;
  width: min(1180px, 94dvw);
  margin: 0 auto;
  padding: 24px 0 64px;
}

.yc-expressions-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.35fr);
  gap: 18px;
  align-items: end;
  padding: 28px;

  h1,
  p {
    margin: 0;
  }

  h1 {
    margin-top: 8px;
    font-size: 3.6rem;
    line-height: 1.08;
  }

  p {
    max-width: 760px;
    color: var(--text-secondary);
    line-height: 1.8;
  }
}

.yc-expressions-hero__note {
  @include flex-col;
  gap: 8px;
  padding: 18px;

  span {
    color: var(--text-secondary);
    line-height: 1.7;
  }
}

.yc-eyebrow {
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.yc-expression-controls {
  @include flex-col;
  gap: 16px;
  padding: 20px;
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

.yc-expression-grid {
  --main-card-min-width: 280px;
}

.yc-expression-card {
  cursor: default;

  strong {
    font-size: 1.35rem;
  }

  p,
  blockquote,
  small {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  blockquote {
    padding: 12px;
  }
}

.yc-expression-card__head {
  justify-content: space-between;
  width: 100%;
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
  font-size: 0.95rem;
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
    padding-top: 14px;
  }

  .yc-expressions-hero {
    grid-template-columns: 1fr;
    padding: 22px;

    h1 {
      font-size: 2.4rem;
    }
  }

  .yc-filter-footer {
    align-items: flex-start;
  }
}
</style>
