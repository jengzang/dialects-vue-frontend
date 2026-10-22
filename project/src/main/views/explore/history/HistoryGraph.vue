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
    <ol class="history-timeline">
      <li
        v-for="(entry, index) in historyEntries"
        :key="entry.date"
        class="history-entry"
      >
        <time
          class="history-date"
          :datetime="entry.dateTime"
        >{{ entry.date }}</time>
        <p class="history-content">
          <template
            v-for="(part, partIndex) in entry.parts"
            :key="partIndex"
          >
            <template v-if="typeof part === 'string'">
              {{ part }}
            </template>
            <a
              v-else
              class="text-action"
              :href="part.href"
              target="_blank"
              rel="noopener noreferrer"
            >{{ part.href }}</a>
          </template>
        </p>
        <span
          v-if="index < historyEntries.length - 1"
          class="history-connector"
          aria-hidden="true"
        />
      </li>
    </ol>
  </section>
</template>

<script setup>
import { historyEntries } from './history.data.js'
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

.history-timeline {
  max-width: 60rem;
  margin: 2rem auto 0;
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
