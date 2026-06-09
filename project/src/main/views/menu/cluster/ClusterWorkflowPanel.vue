<template>
  <section
    class="panel main-glass-panel"
    data-step="preview"
  >
    <div class="panel-header">
      <div>
        <h2>{{ t('cluster.preview.title') }}</h2>
        <p>{{ t('cluster.preview.description') }}</p>
      </div>
    </div>

    <div
      v-if="workspaceState.previewData"
      class="summary-card-grid"
    >
      <div class="summary-card main-glass-panel-inner">
        <span class="summary-card__label">{{ t('cluster.preview.metrics.groupCount') }}</span>
        <strong>{{ workspaceState.previewData.group_count ?? 0 }}</strong>
      </div>
      <div class="summary-card main-glass-panel-inner">
        <span class="summary-card__label">{{ t('cluster.preview.metrics.uniqueCharCount') }}</span>
        <strong>{{ workspaceState.previewData.unique_char_count ?? 0 }}</strong>
      </div>
      <div class="summary-card main-glass-panel-inner">
        <span class="summary-card__label">{{ t('cluster.preview.metrics.requestedLocationCount') }}</span>
        <strong>{{ workspaceState.previewData.requested_location_count ?? 0 }}</strong>
      </div>
      <div class="summary-card main-glass-panel-inner">
        <span class="summary-card__label">{{ t('cluster.preview.metrics.matchedLocationCount') }}</span>
        <strong>{{ workspaceState.previewData.matched_location_count ?? 0 }}</strong>
      </div>
      <div class="summary-card main-glass-panel-inner">
        <span class="summary-card__label">{{ t('cluster.preview.metrics.pairCount') }}</span>
        <strong>{{ workspaceState.previewData.estimated_pair_count ?? 0 }}</strong>
      </div>
      <div class="summary-card main-glass-panel-inner">
        <span class="summary-card__label">{{ t('cluster.preview.metrics.matrixMb') }}</span>
        <strong>{{ formatNumeric(workspaceState.previewData.estimated_dense_matrix_mb) }}</strong>
      </div>
    </div>

    <div
      v-if="workspaceState.prepareHash"
      class="hash-line"
    >
      <span>{{ t('cluster.preview.hashLabel') }}</span>
      <code>{{ workspaceState.prepareHash }}</code>
    </div>

    <p class="preview-hint">
      {{ t('cluster.preview.continueHint') }}
    </p>

    <div class="panel-actions">
      <button
        class="global-action-btn global-action-btn-primary"
        type="button"
        :disabled="!workspaceState.prepareHash || isPreparePending"
        @click="handlePrepare"
      >
        {{ t('cluster.actions.continuePrepare') }}
      </button>
    </div>
  </section>

  <section
    class="panel main-glass-panel"
    data-step="prepare"
  >
    <div class="panel-header">
      <div>
        <h2>{{ t('cluster.prepare.title') }}</h2>
        <p>{{ t('cluster.prepare.description') }}</p>
      </div>
      <span
        class="status-badge"
        :class="statusBadgeClass(prepareStepStatus)"
      >
        {{ t(`cluster.status.${prepareStepStatus}`) }}
      </span>
    </div>
    <p class="section-note">
      {{ workspaceState.prepareCompleted ? t('cluster.prepare.ready') : t('cluster.prepare.waiting') }}
    </p>
  </section>

  <section
    class="panel main-glass-panel"
    data-step="distance"
  >
    <div class="panel-header">
      <div>
        <h2>{{ t('cluster.distance.title') }}</h2>
        <p>{{ t('cluster.distance.description') }}</p>
      </div>
    </div>

    <div class="mode-panel main-glass-panel-inner">
      <RadioGroup
        v-model="workspaceState.selectedPhonemeMode"
        name="phoneme-mode"
        :options="phonemeModeOptions"
      />
    </div>

    <div
      v-if="currentDistanceHash"
      class="hash-line"
    >
      <span>{{ t('cluster.distance.hashLabel') }}</span>
      <code>{{ currentDistanceHash }}</code>
    </div>

    <p class="section-note">
      {{ workspaceState.prepareCompleted ? t('cluster.distance.ready') : t('cluster.distance.waiting') }}
    </p>

    <div class="panel-actions">
      <button
        class="global-action-btn global-action-btn-primary"
        type="button"
        :disabled="!workspaceState.prepareCompleted || isDistancePending"
        @click="handleDistance"
      >
        {{ t('cluster.actions.runDistance') }}
      </button>
    </div>
  </section>

  <section
    class="panel main-glass-panel"
    data-step="cluster"
  >
    <div class="panel-header">
      <div>
        <h2>{{ t('cluster.clustering.title') }}</h2>
        <p>{{ t('cluster.clustering.description') }}</p>
      </div>
    </div>

    <div class="cluster-form main-glass-panel-inner">
      <div class="form-grid">
        <div class="field">
          <span>{{ t('cluster.clustering.algorithm') }}</span>
          <SimpleSelectDropdown
            v-model="workspaceState.clustering.algorithm"
            :options="algorithmOptions"
            :match-trigger-width="true"
            width="100%"
          />
        </div>

        <label
          v-if="showNClustersField"
          class="field"
        >
          <span>{{ t('cluster.clustering.nClusters') }}</span>
          <input
            v-model.number="workspaceState.clustering.n_clusters"
            type="number"
            min="2"
            step="1"
          >
        </label>

        <div
          v-if="workspaceState.clustering.algorithm === 'agglomerative'"
          class="field"
        >
          <span>{{ t('cluster.clustering.linkage') }}</span>
          <SimpleSelectDropdown
            v-model="workspaceState.clustering.linkage"
            :options="linkageOptions"
            :match-trigger-width="true"
            width="100%"
          />
        </div>

        <label
          v-if="workspaceState.clustering.algorithm === 'dbscan'"
          class="field"
        >
          <span>{{ t('cluster.clustering.eps') }}</span>
          <input
            v-model.number="workspaceState.clustering.eps"
            type="number"
            min="0"
            step="0.1"
          >
        </label>

        <label
          v-if="workspaceState.clustering.algorithm === 'dbscan'"
          class="field"
        >
          <span>{{ t('cluster.clustering.minSamples') }}</span>
          <input
            v-model.number="workspaceState.clustering.min_samples"
            type="number"
            min="1"
            step="1"
          >
        </label>

        <label
          v-if="showRandomStateField"
          class="field"
        >
          <span>{{ t('cluster.clustering.randomState') }}</span>
          <input
            v-model.number="workspaceState.clustering.random_state"
            type="number"
            step="1"
          >
        </label>
      </div>
    </div>

    <div
      v-if="currentResultHash"
      class="hash-line"
    >
      <span>{{ t('cluster.clustering.resultHash') }}</span>
      <code>{{ currentResultHash }}</code>
    </div>

    <p class="section-note">
      {{ currentDistanceHash ? t('cluster.clustering.description') : t('cluster.clustering.waiting') }}
    </p>

    <div class="panel-actions">
      <button
        class="global-action-btn global-action-btn-primary"
        type="button"
        :disabled="!currentDistanceHash || isClusterPending"
        @click="handleCluster"
      >
        {{ t('cluster.actions.runCluster') }}
      </button>
    </div>
  </section>

  <section
    class="panel main-glass-panel quick-run-panel"
    data-step="quick-run"
  >
    <details :open="quickRunOpen">
      <summary
        class="quick-run-summary"
        @click.prevent="quickRunOpen = !quickRunOpen"
      >
        <span>{{ t('cluster.quickRun.collapsed') }}</span>
        <span class="quick-run-summary__label">{{ QUICK_RUN_FALLBACK_LABEL }}</span>
      </summary>
      <div class="quick-run-body">
        <h2>{{ t('cluster.quickRun.title') }}</h2>
        <p>{{ t('cluster.quickRun.description') }}</p>
        <button
          class="global-action-btn global-action-btn-secondary"
          type="button"
          :disabled="isQuickRunPending"
          @click="handleQuickRun"
        >
          {{ t('cluster.actions.runQuick') }}
        </button>
      </div>
    </details>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import { useClusterWorkspaceContext } from './clusterContext.js'

const { t } = useI18n()
const {
  QUICK_RUN_FALLBACK_LABEL,
  workspaceState,
  quickRunOpen,
  prepareStepStatus,
  currentDistanceHash,
  currentResultHash,
  showNClustersField,
  showRandomStateField,
  isPreparePending,
  isDistancePending,
  isClusterPending,
  isQuickRunPending,
  phonemeModeOptions,
  algorithmOptions,
  linkageOptions,
  handlePrepare,
  handleDistance,
  handleCluster,
  handleQuickRun,
  statusBadgeClass,
  formatNumeric
} = useClusterWorkspaceContext()
</script>
