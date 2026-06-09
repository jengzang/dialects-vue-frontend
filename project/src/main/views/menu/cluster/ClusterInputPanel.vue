<template>
  <section
    class="panel main-glass-panel"
    data-step="input"
  >
    <div class="panel-header">
      <div>
        <h2>{{ t('cluster.input.title') }}</h2>
        <p>{{ t('cluster.input.description') }}</p>
      </div>
      <button
        class="global-action-btn global-action-btn-secondary add-group-btn"
        type="button"
        @click="addGroup"
      >
        {{ t('cluster.actions.addGroup') }}
      </button>
    </div>

    <div
      v-if="formErrorMessage"
      class="panel-alert panel-alert--error"
    >
      {{ formErrorMessage }}
    </div>

    <div class="location-section main-glass-panel-inner">
      <div class="section-heading">
        <h3>{{ t('cluster.input.locationTitle') }}</h3>
        <p>{{ t('cluster.input.locationDescription') }}</p>
      </div>
      <LocationAndRegionInput
        v-model="locationModel"
        :limit-context="'default'"
        @update:run-disabled="locationInputDisabled = $event"
      />
      <div class="inline-toggle-row">
        <label class="inline-toggle">
          <input
            v-model="workspaceState.requestDraft.include_special_locations"
            type="checkbox"
          >
          <span>{{ t('cluster.input.includeSpecialLocations') }}</span>
        </label>
      </div>
    </div>

    <div class="groups-stack">
      <article
        v-for="(group, index) in workspaceState.requestDraft.groups"
        :key="group.id"
        class="group-panel main-glass-panel-inner"
      >
        <div class="group-panel__header">
          <h3>{{ t('cluster.input.groupTitle', { index: index + 1 }) }}</h3>
          <button
            class="global-action-btn global-action-btn-secondary group-remove-btn"
            type="button"
            :disabled="workspaceState.requestDraft.groups.length === 1"
            @click="removeGroup(index)"
          >
            {{ t('cluster.actions.removeGroup') }}
          </button>
        </div>

        <div class="form-grid">
          <label class="field">
            <span>{{ t('cluster.input.groupLabel') }}</span>
            <input
              v-model="group.label"
              type="text"
              :placeholder="t('cluster.input.groupLabelPlaceholder')"
            >
          </label>

          <div class="field">
            <span>{{ t('cluster.input.compareDimension') }}</span>
            <ChoiceSelector
              v-model="group.compare_dimension"
              :options="compareDimensionOptions"
              :aria-label="t('cluster.input.compareDimension')"
            />
          </div>

          <div class="field">
            <span>{{ t('cluster.input.sourceMode') }}</span>
            <ChoiceSelector
              v-model="group.source_mode"
              :options="sourceModeOptions"
              :aria-label="t('cluster.input.sourceMode')"
            />
          </div>
        </div>

        <div
          v-if="group.source_mode === 'path_strings'"
          class="source-section source-section--path"
        >
          <p class="source-hint">
            {{ t('cluster.input.pathStringsHint') }}
          </p>
          <KeyButtonGroup
            :available-keys="availableKeys"
            :exclusive-rules="exclusiveRules"
            :single-select-keys="singleSelectKeys"
            :model-value="group.pathKeys"
            @update:model-value="(value) => updateGroupPathKeys(group, value)"
          />
          <DropdownValueSelector
            :selected-keys="group.pathKeys"
            :model-value="group.pathValueMap"
            :key-value-map="keyValueMap"
            @update:model-value="(value) => updateGroupPathValueMap(group, value)"
          />
          <div class="preview-box">
            <strong>{{ t('cluster.input.pathStringsPreview', { count: getGroupPathStrings(group).length }) }}</strong>
            <div
              v-if="getGroupPathStrings(group).length"
              class="preview-chip-list"
            >
              <span
                v-for="pathString in getGroupPathStrings(group)"
                :key="pathString"
                class="preview-chip"
              >
                {{ pathString }}
              </span>
            </div>
            <p
              v-else
              class="preview-empty"
            >
              {{ t('cluster.input.emptyPathStrings') }}
            </p>
          </div>
        </div>

        <div
          v-else
          class="source-section source-section--chars"
        >
          <label class="field">
            <span>{{ t('cluster.input.resolvedCharsLabel') }}</span>
            <textarea
              v-model="group.resolvedCharsText"
              rows="4"
              :placeholder="t('cluster.input.resolvedCharsPlaceholder')"
            />
          </label>
          <div class="preview-box">
            <strong>{{ t('cluster.input.resolvedCharsPreview', { count: getResolvedChars(group).length }) }}</strong>
            <div
              v-if="getResolvedChars(group).length"
              class="preview-chip-list"
            >
              <span
                v-for="char in getResolvedChars(group)"
                :key="`${group.id}-${char}`"
                class="preview-chip"
              >
                {{ char }}
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div class="panel-actions">
      <button
        class="global-action-btn global-action-btn-primary"
        type="button"
        :disabled="isPreviewPending"
        @click="handlePreview"
      >
        {{ workspaceState.previewData ? t('cluster.actions.refreshPreview') : t('cluster.actions.createPreview') }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import ChoiceSelector from '@/components/selector/ChoiceSelector.vue'
import DropdownValueSelector from '@/main/components/query/DropdownValueSelector.vue'
import LocationAndRegionInput from '@/main/components/geo/LocationAndRegionInput.vue'
import KeyButtonGroup from '@/main/components/query/KeyButtonGroup.vue'
import { useClusterWorkspaceContext } from './clusterContext.js'

const { t } = useI18n()
const {
  workspaceState,
  locationModel,
  formErrorMessage,
  locationInputDisabled,
  compareDimensionOptions,
  sourceModeOptions,
  isPreviewPending,
  availableKeys,
  exclusiveRules,
  singleSelectKeys,
  keyValueMap,
  addGroup,
  removeGroup,
  updateGroupPathKeys,
  updateGroupPathValueMap,
  getGroupPathStrings,
  getResolvedChars,
  handlePreview
} = useClusterWorkspaceContext()
</script>
