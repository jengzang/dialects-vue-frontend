<template>
  <AppModal
    :model-value="modelValue"
    size="md"
    :title="t('map.drawTab.voronoi.fieldMergeTitle')"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <template #default>
      <div class="field-merge-modal">
        <div class="field-merge-search">
          <input
            v-model="searchText"
            type="text"
            class="scope-search-input glass-field"
            data-shape="search"
            :placeholder="t('map.drawTab.voronoi.searchPlaceholder')"
          >
        </div>

        <div v-if="filteredEntries.length === 0" class="field-merge-empty">
          {{ t('map.drawTab.voronoi.emptyRegions') }}
        </div>

        <div v-else class="field-merge-list ui-scrollbar">
          <div
            v-for="entry in filteredEntries"
            :key="entry.original"
            class="field-merge-row"
          >
            <span class="field-merge-original">{{ entry.original }}</span>
            <input
              class="scope-search-input field-merge-input glass-field"
              :value="entry.groupName"
              @input="$emit('update:field-merge', entry.original, $event.target.value)"
            >
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="field-merge-footer">
        <button
          class="glass-button"
          data-variant="secondary"
          type="button"
          @click="$emit('reset-field-merge')"
        >
          {{ t('map.drawTab.voronoi.fieldMergeReset') }}
        </button>
        <button
          class="glass-button"
          data-variant="primary"
          type="button"
          @click="$emit('update:modelValue', false)"
        >
          {{ t('common.button.close') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  fieldMergeEntries: { type: Array, default: () => [] },
})

defineEmits(['update:modelValue', 'update:field-merge', 'reset-field-merge'])

const { t } = useI18n()

const searchText = ref('')

const normalizedSearch = computed(() => searchText.value.trim().toLowerCase())

const filteredEntries = computed(() => {
  if (!normalizedSearch.value) return props.fieldMergeEntries
  return props.fieldMergeEntries.filter(entry =>
    String(entry.original || '').toLowerCase().includes(normalizedSearch.value) ||
    String(entry.groupName || '').toLowerCase().includes(normalizedSearch.value)
  )
})

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    searchText.value = ''
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.field-merge-modal {
  @include flex-col;
  gap: 14px;
  min-height: 200px;
  max-height: min(50dvh, 30rem);
  overflow: hidden;
}

.field-merge-search {
  .scope-search-input {
    width: 100%;
    height: 38px;
    font-size: 13px;
    box-sizing: border-box;
  }
}

.field-merge-empty {
  text-align: center;
  padding: 24px 0;
  color: var(--text-muted);
  font-size: 14px;
}

.field-merge-list {
  @include flex-col;
  gap: 8px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.field-merge-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.field-merge-original {
  flex: 0 0 auto;
  min-width: 90px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-strong);
}

.field-merge-input {
  flex: 1;
}

.field-merge-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
