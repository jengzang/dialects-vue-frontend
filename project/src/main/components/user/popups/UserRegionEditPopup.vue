<template>
  <AppModal
    :model-value="visible"
    size="sm"
    :title="popupTitle"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <div class="popup-form">
      <div class="form-group">
        <label class="form-label">{{ t('user.regionPage.form.nameLabel') }}</label>
        <textarea
          :value="formState.editingRegion.region_name"
          class="form-textarea"
          style="height: 45px"
          :placeholder="t('user.regionPage.form.namePlaceholder')"
          :disabled="Boolean(formState.editingRegion.id)"
          @input="updateRegionField('region_name', $event.target.value)"
        />
        <p v-if="formState.editingRegion.id" class="form-hint">
          {{ t('user.regionPage.form.nameLockedHint') }}
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">{{ t('user.regionPage.form.descriptionLabel') }}</label>
        <textarea
          :value="formState.editingRegion.description"
          class="form-textarea"
          :placeholder="t('user.regionPage.form.descriptionPlaceholder')"
          rows="3"
          @input="updateRegionField('description', $event.target.value)"
        ></textarea>
      </div>

      <div class="form-group">
        <div class="location-header">
          <label class="form-label">{{ t('user.regionPage.form.locationsLabel') }}</label>
          <button
            type="button"
            class="select-location-btn"
            :title="t('user.regionPage.form.selectLocationsTitle')"
            @click="emit('open-location-selector')"
          >
            {{ t('user.regionPage.form.selectLocationsButton') }}
          </button>
        </div>

        <textarea
          :value="formState.locationInput"
          class="form-input location-input"
          :placeholder="t('user.regionPage.form.locationInputPlaceholder')"
          rows="6"
          @input="handleLocationInput"
        ></textarea>
        <p class="form-hint">
          {{ t('user.regionPage.form.locationHint') }}
        </p>

        <div class="location-stats">
          <div class="stat-badge">
            <span class="stat-icon">M</span>
            <span>
              {{ t('user.regionPage.form.manualCount', { count: stats.manualInputCount }) }}
            </span>
          </div>
          <div class="stat-badge primary">
            <span class="stat-icon">T</span>
            <span>
              {{ t('user.regionPage.form.treeCount', { count: stats.treeSelectedCount }) }}
            </span>
          </div>
        </div>

        <div v-if="formState.editingRegion.locations.length > 0" class="selected-locations-display">
          <div class="location-tags">
            <span
              v-for="(loc, idx) in formState.editingRegion.locations"
              :key="idx"
              class="location-tag"
              :class="{ 'from-tree': stats.availableLocations.has(loc) }"
            >
              {{ loc }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
<!--      <div class="popup-footer">-->
        <button class="btn-secondary" @click="handleClose">
          {{ t('common.button.cancel') }}
        </button>
        <button class="btn-primary" :disabled="!uiState.canSave || uiState.isSaving" @click="emit('save')">
          <span v-if="uiState.isSaving" class="ui-loading--inline" aria-hidden="true"></span>
          <span v-else>{{ t('common.button.save') }}</span>
        </button>
<!--      </div>-->
    </template>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  formState: {
    type: Object,
    default: () => ({
      editingRegion: {
        region_name: '',
        locations: [],
        description: ''
      },
      locationInput: ''
    })
  },
  stats: {
    type: Object,
    default: () => ({
      availableLocations: new Set(),
      treeSelectedCount: 0,
      manualInputCount: 0
    })
  },
  uiState: {
    type: Object,
    default: () => ({
      canSave: false,
      isSaving: false
    })
  }
})

const formState = computed(() => ({
  editingRegion: {
    region_name: '',
    locations: [],
    description: ''
  },
  locationInput: '',
  ...props.formState
}))

const stats = computed(() => ({
  availableLocations: new Set(),
  treeSelectedCount: 0,
  manualInputCount: 0,
  ...props.stats
}))

const uiState = computed(() => ({
  canSave: false,
  isSaving: false,
  ...props.uiState
}))

const emit = defineEmits([
  'close',
  'save',
  'open-location-selector',
  'update:formState',
  'location-input'
])

const { t } = useI18n()

const popupTitle = computed(() => (
  formState.value.editingRegion.id
    ? t('user.regionPage.modal.editTitle')
    : t('user.regionPage.modal.createTitle')
))

function handleClose() {
  emit('close')
}

function updateRegionField(field, value) {
  emit('update:formState', {
    ...formState.value,
    editingRegion: {
      ...formState.value.editingRegion,
      [field]: value
    }
  })
}

function handleLocationInput(event) {
  emit('update:formState', {
    ...formState.value,
    locationInput: event.target.value
  })
  emit('location-input')
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$primary-dark: var(--color-primary-hover);
$success: var(--color-success);

$text-label: var(--text-deep);
$text-hint: var(--text-lightest);
$white: var(--text-white);

$surface-background: var(--glass-90);
$surface-border: rgba(0, 0, 0, 0.1);
$disabled-background: rgba(0, 0, 0, 0.05);

$primary-background: rgba(var(--color-primary-rgb), 0.1);
$primary-border: rgba(var(--color-primary-rgb), 0.3);
$primary-shadow: rgba(var(--color-primary-rgb), 0.3);

$success-background: rgba(var(--color-success-rgb), 0.15);
$success-border: rgba(var(--color-success-rgb), 0.3);

$control-radius: 8px;
$transition-fast: 0.2s;
$transition-normal: 0.3s;

.popup-form {
  @include flex-col;
}

.form-group {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: $text-label;
  font-size: 14px;
  font-weight: 500;
}

.form-input,
.form-textarea {
  box-sizing: border-box;
  width: 100%;
  height: auto;
  max-height: 120px;
  padding: 10px 16px;
  background: $surface-background;
  border: 1px solid $surface-border;
  border-radius: $control-radius;
  font-family: inherit;
  font-size: 14px;
  transition:
    background $transition-normal ease,
    border-color $transition-normal ease,
    box-shadow $transition-normal ease;

  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 0 0 3px $primary-background;
  }

  &:disabled {
    background: $disabled-background;
    cursor: not-allowed;
  }
}

.form-hint {
  margin-top: 6px;
  color: $text-hint;
  font-size: 12px;
}

.location-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 4px;
}

.select-location-btn {
  padding: 2px 8px;
  appearance: none;
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary-border2);
  border-radius: $control-radius;
  color: var(--color-primary);
  white-space: nowrap;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition:
    background $transition-fast ease,
    box-shadow $transition-fast ease,
    transform $transition-fast ease;

  &:hover {
    background: var(--color-primary-light2);
    box-shadow: 0 2px 4px rgba(var(--color-primary-rgb), 0.2);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.location-input {
  line-height: 2;
  resize: vertical;
}

.location-stats {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.stat-badge {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: $primary-background;
  border-radius: $control-radius;
  color: $primary;
  font-size: 13px;
  font-weight: 500;

  &.primary {
    background: $success-background;
    color: $success;
  }

  .stat-icon {
    font-size: 14px;
    font-weight: 700;
  }
}

.selected-locations-display {
  margin-top: 12px;
  padding: 12px;
  background: $surface-background;
  border: 1px solid $surface-border;
  border-radius: $control-radius;
}

.location-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.location-tag {
  padding: 4px 10px;
  background: $primary-background;
  border-radius: var(--radius-sm);
  color: $primary;
  font-size: 12px;
  font-weight: 500;

  &.from-tree {
    background: $success-background;
    border: 1px solid $success-border;
    color: $success;
  }
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: $control-radius;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background $transition-normal ease,
    box-shadow $transition-normal ease,
    opacity $transition-normal ease,
    transform $transition-normal ease;
}

.btn-primary {
  background: linear-gradient(135deg, $primary, $primary-dark);
  color: $white;

  &:hover {
    box-shadow: 0 4px 12px $primary-shadow;
    transform: translateY(-2px);
  }

  &:disabled {
    @include disabled-state;
    transform: none;
  }
}

.btn-secondary {
  background: $surface-background;
  border: 1px solid $primary-border;
  color: $primary;

  &:hover {
    background: $primary-background;
  }
}
</style>
