<template>
  <AppModal
    :model-value="modelValue"
    size="md"
    :title="mode === 'import' ? t('map.drawTab.voronoi.clipBoundaryImportTitle') : t('map.drawTab.voronoi.clipBoundarySettings')"
    @update:modelValue="handleClose"
  >
    <div class="clip-boundary-modal">
      <div class="clip-boundary-row">
        <div class="clip-boundary-field" style="flex:1">
          <label class="clip-boundary-label">{{ t('map.drawTab.voronoi.clipBoundaryLevel') }}</label>
          <SimpleSelectDropdown
            :model-value="localLevel"
            :options="levelOptions"
            :width="'160px'"
            @update:model-value="handleLevelChange"
          />
        </div>
        <div class="clip-boundary-field">
          <label class="clip-boundary-label">{{ t('map.drawTab.voronoi.clipBoundaryHighPrecision') }}</label>
          <SwitchToggle
            :model-value="localHighPrecision"
            :disabled="loading"
            @update:model-value="handleHighPrecisionToggle"
          />
        </div>
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
        <p v-if="highPrecisionLimit" class="clip-boundary-hint">
          {{ t('map.drawTab.voronoi.clipBoundaryHighPrecisionLimitHint') }}
        </p>
        <div v-if="isOptionsLoading" class="clip-boundary-loading">
          <div class="ui-loading--page" aria-hidden="true" />
          <span>{{ t('map.drawTab.voronoi.clipBoundaryLoading') }}</span>
        </div>
        <div v-else class="clip-boundary-list ui-scrollbar">
          <CheckBox
            v-for="option in filteredOptions"
            :key="option.value"
            class="clip-boundary-item"
            :model-value="localSelected.includes(option.value)"
            :disabled="isOptionDisabled(option.value)"
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
import SwitchToggle from '@/components/common/SwitchToggle.vue';
import { api } from '@/api/auth/httpClient.js';

const HIGH_PRECISION_MAX = 3;
const LEVEL_DEEP_MAP = { provinces: 0, cities: 1, counties: 2 };

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  boundaryConfig: {
    type: Object,
    default: () => ({ enabled: false, level: 'country', selectedNames: [] }),
  },
  boundaryOptions: {
    type: Object,
    default: () => ({ country: [], provinces: [], cities: [], counties: [] }),
  },
  mode: {
    type: String,
    default: 'clip',
    validator: (value) => ['clip', 'import'].includes(value),
  },
  loading: { type: Boolean, default: false },
  highPrecision: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'confirm', 'update:highPrecision']);
const { t } = useI18n();

const localLevel = ref('country');
const localSelected = ref([]);
const searchQuery = ref('');
const localHighPrecision = ref(false);
const highPrecisionOptions = ref([]);
const isHighPrecisionLoading = ref(false);

const highPrecisionLimit = computed(() => localHighPrecision.value && localLevel.value !== 'country');

const isOptionsLoading = computed(() => {
  if (localHighPrecision.value) return isHighPrecisionLoading.value;
  return props.loading;
});

const levelOptions = computed(() => [
  { label: t('map.drawTab.voronoi.clipBoundaryLevelCountry'), value: 'country' },
  { label: t('map.drawTab.voronoi.clipBoundaryLevelProvinces'), value: 'provinces' },
  { label: t('map.drawTab.voronoi.clipBoundaryLevelCities'), value: 'cities' },
  { label: t('map.drawTab.voronoi.clipBoundaryLevelCounties'), value: 'counties' },
]);

const currentOptions = computed(() => {
  if (localHighPrecision.value && localLevel.value !== 'country') {
    return highPrecisionOptions.value;
  }
  return props.boundaryOptions[localLevel.value] ?? [];
});

const filteredOptions = computed(() => {
  if (localLevel.value === 'country') return currentOptions.value;
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return currentOptions.value;
  return currentOptions.value.filter((opt) => opt.label.toLowerCase().includes(query));
});

const fetchHighPrecisionOptions = async (level) => {
  const deep = LEVEL_DEEP_MAP[level];
  if (deep === undefined) return;
  isHighPrecisionLoading.value = true;
  try {
    const data = await api(`/api/gis/children?deep=${deep}`);
    highPrecisionOptions.value = (data?.items ?? []).map((item) => ({
      label: item.name,
      value: item.id,
    }));
  } catch (error) {
    console.warn('Failed to fetch boundary options from API', error);
    highPrecisionOptions.value = [];
  } finally {
    isHighPrecisionLoading.value = false;
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      searchQuery.value = '';
      localLevel.value = props.boundaryConfig.level || 'country';
      localHighPrecision.value = props.highPrecision;
      highPrecisionOptions.value = [];
      localSelected.value = [...(props.boundaryConfig.selectedNames || [])];
      if (localSelected.value.length === 0 && localLevel.value === 'country') {
        localSelected.value = ['中国'];
      }
    }
  },
);

function isOptionDisabled(optionValue) {
  if (localLevel.value === 'country') return true;
  if (!highPrecisionLimit.value) return false;
  return !localSelected.value.includes(optionValue) && localSelected.value.length >= HIGH_PRECISION_MAX;
}

function handleHighPrecisionToggle(val) {
  localHighPrecision.value = val;
  emit('update:highPrecision', val);
  if (val && localLevel.value !== 'country') {
    localSelected.value = [];
    fetchHighPrecisionOptions(localLevel.value);
  } else if (!val) {
    highPrecisionOptions.value = [];
    localSelected.value = [];
  }
}

function handleLevelChange(level) {
  localLevel.value = level;
  searchQuery.value = '';
  localSelected.value = [];
  if (level === 'country') {
    localSelected.value = ['中国'];
  } else if (localHighPrecision.value) {
    fetchHighPrecisionOptions(level);
  }
}

function handleToggle(optionValue, checked) {
  if (checked) {
    localSelected.value = [...localSelected.value, optionValue];
  } else {
    localSelected.value = localSelected.value.filter((item) => item !== optionValue);
  }
}

function handleClose() {
  emit('update:modelValue', false);
}

function handleConfirm() {
  const payload = {
    level: localLevel.value,
    highPrecision: localHighPrecision.value,
  };
  if (localHighPrecision.value && localLevel.value !== 'country') {
    payload.selectedIds = [...localSelected.value];
    const idToName = new Map(highPrecisionOptions.value.map((o) => [o.value, o.label]));
    payload.selectedNames = localSelected.value.map((id) => idToName.get(id)).filter(Boolean);
  } else {
    payload.selectedNames = [...localSelected.value];
  }
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

.clip-boundary-row {
  display: flex;
  gap: 24px;
  align-items: flex-end;
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

.clip-boundary-hint {
  margin: 0;
  color: var(--color-warning, #e6a23c);
  font-size: 12px;
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

.clip-boundary-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 160px;
  padding: 24px;
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
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
