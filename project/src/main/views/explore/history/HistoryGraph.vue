<template>
  <section
    class="history-page glass-panel"
    aria-labelledby="history-title"
  >
    <h1
      id="history-title"
      class="page-title"
    >
      网站历史
    </h1>
    <div
      class="history-filter ui-tabs-navigation--segmented"
      role="group"
      aria-label="历史筛选"
    >
      <button
        type="button"
        class="ui-tab-item"
        :class="{ active: !onlyImportant }"
        :aria-pressed="!onlyImportant"
        @click="onlyImportant = false"
      >
        全部历史
      </button>
      <button
        type="button"
        class="ui-tab-item"
        :class="{ active: onlyImportant }"
        :aria-pressed="onlyImportant"
        @click="onlyImportant = true"
      >
        仅重要更新
      </button>
    </div>
    <p
      class="history-filter-summary hint"
      aria-live="polite"
    >
      共 {{ visibleEntryCount }} 条更新
    </p>
    <section
      v-for="stage in visibleStages"
      :key="stage.major"
      class="history-stage"
      :aria-labelledby="`history-stage-${stage.major}`"
    >
      <h2
        :id="`history-stage-${stage.major}`"
        class="history-stage-title"
      >
        {{ stage.title }}
      </h2>
      <ol
        v-if="stage.entries.length"
        class="history-timeline"
      >
        <li
          v-for="(entry, index) in stage.entries"
          :key="entry.date"
          class="history-entry"
        >
          <div class="history-date-column">
            <time
              class="history-date"
              :datetime="entry.dateTime"
            >{{ entry.date }}</time>
            <span
              v-if="entry.important"
              class="hint"
              :title="entry.importanceReason"
            >重要更新</span>
          </div>
          <p class="history-content">
            <template
              v-for="(part, partIndex) in entry.displayParts"
              :key="partIndex"
            >
              <template v-if="typeof part === 'string'">
                {{ part }}
              </template>
              <code
                v-else-if="part.version"
                class="history-version"
              >{{ part.version }}</code>
              <RouterLink
                v-else-if="part.to"
                class="text-action history-link history-link--internal"
                :to="buildLocalePath(resolveRouteLocale(route), part.to)"
              >
                {{ part.text }}
              </RouterLink>
              <a
                v-else
                class="text-action history-link history-link--external"
                :href="part.href"
                target="_blank"
                rel="noopener noreferrer"
              >{{ part.href }}</a>
            </template>
          </p>
          <span
            v-if="index < stage.entries.length - 1"
            class="history-connector"
            aria-hidden="true"
          />
        </li>
      </ol>
    </section>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { historyStages } from './history.data.js'

const route = useRoute()
const onlyImportant = ref(false)
const visibleStages = computed(() => historyStages.map(stage => ({
  ...stage,
  entries: onlyImportant.value ? stage.entries.filter(entry => entry.important) : stage.entries
})))
const visibleEntryCount = computed(() => visibleStages.value.reduce((count, stage) => count + stage.entries.length, 0))
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.history-page {
  box-sizing: border-box;
  align-self: flex-start;
  width: 100%;
  max-width: 70rem;
  padding: clamp(1rem, 3vw, 2rem);
}

.history-stage {
  max-width: 60rem;
  margin: 2.5rem auto 0;

  & + & {
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-primary-border);
  }
}

.history-filter {
  display: flex;
  justify-content: center;
  width: fit-content;
  max-width: 100%;
  margin: 1.5rem auto 0;
  padding: 0.25rem;

  .ui-tab-item {
    padding: 0.6rem 1rem;
  }
}

.history-filter-summary {
  margin: 0.75rem 0 0;
  text-align: center;
}

.history-stage-title {
  margin: 0;
  color: var(--text-primary);
  line-height: 1.6;
}

.history-timeline {
  margin: 1.5rem 0 0;
  padding: 0;
  list-style: none;
}

.history-entry {
  position: relative;
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr);
  gap: 1.5rem;
  padding: 0 0 2.5rem 2rem;

  &::before {
    content: '';
    position: absolute;
    top: 0.55rem;
    left: 0;
    width: 0.65rem;
    height: 0.65rem;
    border-radius: var(--radius-pill);
    background: var(--color-primary);
  }

  &:last-child {
    padding-bottom: 0;
  }
}

.history-date-column {
  @include flex-col;
  gap: 0.25rem;
  align-items: flex-start;
}

.history-date {
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-weight: 600;
  line-height: 1.9;
}

.history-content {
  min-width: 0;
  margin: 0;
  color: var(--text-primary);
  line-height: 1.9;
  overflow-wrap: anywhere;
}

// 本页的版本标签与两类行内链接需要在同一段原文中明显区分。
.history-version {
  padding: 0.1em 0.4em;
  margin-inline: 0.15em;
  border-radius: var(--radius-sm);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-weight: 600;
  white-space: nowrap;
}

.history-link {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 0.2em;

  &:hover,
  &:focus-visible {
    color: var(--color-primary-hover);
  }

  &--external {
    color: var(--color-secondary-text);
    text-decoration-style: dotted;

    &::after {
      content: ' ↗';
    }

    &:hover,
    &:focus-visible {
      color: var(--color-secondary-hover);
    }
  }
}

// 时间线节点和箭头是本页独有的图形，其余表面与文字复用全站样式。
.history-connector {
  position: absolute;
  top: 1.5rem;
  bottom: 0.35rem;
  left: 0.3rem;
  border-left: 1px solid var(--color-primary-medium2);

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -0.25rem;
    width: 0.4rem;
    height: 0.4rem;
    border-right: 1px solid var(--color-primary-medium2);
    border-bottom: 1px solid var(--color-primary-medium2);
    transform: rotate(45deg);
  }
}

@media (max-aspect-ratio: 1 / 1) {
  .history-entry {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.5rem;
    padding-left: 1.5rem;
  }
}
</style>
