<template>
  <div class="recent-query-pills">
    <slot />
    <div
      v-if="entries.length"
      class="recent-query-pills__history"
      role="group"
      :aria-label="t('common.recentQueries.label')"
    >
      <button
        v-for="(entry, index) in entries"
        :key="index"
        type="button"
        class="pill-btn pill-btn--history recent-query-pills__item"
        :disabled="disabled"
        :title="t('common.recentQueries.restore', { summary: entry.summary })"
        :aria-label="t('common.recentQueries.restore', { summary: entry.summary })"
        @click="emit('restore', JSON.parse(JSON.stringify(entry.snapshot)))"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M3 11a9 9 0 1 1 2.6 7M3 4v7h7M12 7v5l3 2" />
        </svg>
        <span class="recent-query-pills__summary">{{ entry.summary }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  entries: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['restore'])
const { t } = useI18n()
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.recent-query-pills {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 100%;

  :deep(.location-quick-fill-list) {
    margin-top: 0;
  }

  &__history {
    display: flex;
    justify-content: center;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
  }

  &__item {
    min-width: 0;
    max-width: 200px;

    svg { flex-shrink: 0; }
  }

  &__summary { @include text-truncate; }
}

@media (max-aspect-ratio: 1 / 1) {
  .recent-query-pills__item {
    max-width: 42dvw;

    &:nth-child(n + 3) { display: none; }
  }
}
</style>
