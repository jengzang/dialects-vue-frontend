<template>
  <AppModal
    :model-value="modelValue"
    size="md"
    :title="mode === 'import' ? t('map.drawTab.voronoi.clipBoundaryImportTitle') : t('map.drawTab.voronoi.clipBoundarySettings')"
    @update:modelValue="handleClose"
  >
    <div class="clip-boundary-modal">
      <div class="clip-boundary-field">
        <label class="clip-boundary-label">{{ t('map.drawTab.voronoi.clipBoundaryLevel') }}</label>
        <SimpleSelectDropdown
          :model-value="localLevel"
          :options="levelOptions"
          :width="'160px'"
          @update:model-value="handleLevelChange"
        />
      </div>

      <div class="clip-boundary-field">
        <label class="clip-boundary-label">{{ t('map.drawTab.voronoi.clipBoundarySelectRegions') }}</label>
        <input
          v-if="localLevel !== 'country'"
          v-model="searchQuery"
          type="text"
          class="clip-boundary-search"
          :placeholder="t('map.drawTab.voronoi.clipBoundarySearchPlaceholder')"
        >
        <div class="clip-boundary-list ui-scrollbar">
          <CheckBox
            v-for="option in filteredOptions"
            :key="option.value"
            class="clip-boundary-item"
            :model-value="localSelected.includes(option.value)"
            :disabled="localLevel === 'country'"
            @update:model-value="(checked) => handleToggle(option.value, checked)"
          >
            {{ option.label }}
          </CheckBox>
          <div v-if="currentOptions.length === 0" class="clip-boundary-empty">
            {{ t('map.drawTab.voronoi.clipBoundaryNoOptions') }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="clip-boundary-footer">
        <button
          class="main-glass-button"
          type="button"
          @click="handleClose"
        >
          {{ t('map.drawTab.buttons.cancel') }}
        </button>
        <button
          class="main-glass-button"
          data-variant="primary"
          type="button"
          :disabled="localSelected.length === 0"
          @click="handleConfirm"
        >
          {{ mode === 'import' ? t('map.drawTab.voronoi.clipBoundaryConfirmImport') : t('map.drawTab.voronoi.confirmExport') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppModal from '@/components/common/AppModal.vue';
import CheckBox from '@/components/selector/CheckBox.vue';
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  boundaryConfig: {
    type: Object,
    default: () => ({ enabled: false, level: 'country', selectedNames: [] }),
  },
  boundaryOptions: {
    type: Object,
    default: () => ({ country: [], provinces: [], cities: [] }),
  },
  mode: {
    type: String,
    default: 'clip',
    validator: (value) => ['clip', 'import'].includes(value),
  },
});

const emit = defineEmits(['update:modelValue', 'confirm']);
const { t } = useI18n();

const localLevel = ref('country');
const localSelected = ref([]);
const searchQuery = ref('');

const levelOptions = computed(() => [
  { label: t('map.drawTab.voronoi.clipBoundaryLevelCountry'), value: 'country' },
  { label: t('map.drawTab.voronoi.clipBoundaryLevelProvinces'), value: 'provinces' },
  { label: t('map.drawTab.voronoi.clipBoundaryLevelCities'), value: 'cities' },
]);

const currentOptions = computed(() => {
  return props.boundaryOptions[localLevel.value] ?? [];
});

const filteredOptions = computed(() => {
  if (localLevel.value === 'country') return currentOptions.value;
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return currentOptions.value;
  return currentOptions.value.filter((opt) => opt.label.toLowerCase().includes(query));
});

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      searchQuery.value = '';
      localLevel.value = props.boundaryConfig.level || 'country';
      localSelected.value = [...(props.boundaryConfig.selectedNames || [])];
      if (localSelected.value.length === 0 && localLevel.value === 'country') {
        localSelected.value = ['中国'];
      }
    }
  },
);

function handleLevelChange(level) {
  localLevel.value = level;
  searchQuery.value = '';
  if (level === 'country') {
    localSelected.value = ['中国'];
  } else {
    localSelected.value = [];
  }
}

function handleToggle(name, checked) {
  if (checked) {
    localSelected.value = [...localSelected.value, name];
  } else {
    localSelected.value = localSelected.value.filter((item) => item !== name);
  }
}

function handleClose() {
  emit('update:modelValue', false);
}

function handleConfirm() {
  const payload = {
    level: localLevel.value,
    selectedNames: [...localSelected.value],
  };
  if (props.mode !== 'import') {
    payload.enabled = true;
  }
  emit('confirm', payload);
  emit('update:modelValue', false);
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.clip-boundary-modal {
  @include flex-col;
  gap: 16px;
}

.clip-boundary-field {
  @include flex-col;
  gap: 8px;
}

.clip-boundary-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-deep);
}

.clip-boundary-search {
  padding: 7px 10px;
  color: var(--text-deep);
  font-size: 13px;
  background: var(--glass-50);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  outline: none;

  &:focus {
    border-color: rgba(var(--color-primary-rgb), 0.5);
  }

  &::placeholder {
    color: var(--text-tertiary);
  }
}

.clip-boundary-list {
  @include flex-col;
  gap: 4px;
  max-height: 280px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  background: var(--glass-50);
}

.clip-boundary-item {
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  font-size: 13px;

  &:hover {
    background: var(--glass-60);
  }
}

.clip-boundary-empty {
  padding: 24px;
  color: var(--text-tertiary);
  font-size: 13px;
  text-align: center;
}

.clip-boundary-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
