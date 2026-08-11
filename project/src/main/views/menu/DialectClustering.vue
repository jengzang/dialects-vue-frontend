<template>
  <div class="dialect-clustering-page">
    <header class="page-header glass-panel">
      <div>
        <h1><BarIcon icon="🕸️" />{{ t('navigation.pageTitles.cluster.workspace') }}</h1>
        <p>{{ t('cluster.page.description') }}</p>
      </div>
      <button
        class="global-action-btn global-action-btn-secondary reset-btn"
        type="button"
        @click="showResetModal = true"
      >
        {{ t('cluster.actions.reset') }}
      </button>
    </header>

    <nav
      class="step-nav glass-subpanel"
      aria-label="Cluster workflow steps"
    >
      <button
        v-for="step in stepOptions"
        :key="step.value"
        class="step-pill"
        :class="{ active: currentStep === step.value, clickable: isStepReachable(step.value) }"
        type="button"
        :disabled="!isStepReachable(step.value)"
        @click="goToStep(step.value)"
      >
        <span class="step-pill__index">{{ step.index }}</span>
        <span>{{ step.label }}</span>
      </button>
    </nav>

    <section class="workspace-stage-shell glass-panel">
      <div class="workspace-stage-head">
        <div>
          <p class="stage-kicker">
            {{ t('cluster.stage.currentStep', { index: activeStepOption?.index || 1 }) }}
          </p>
          <h2>{{ activeStepOption?.label }}</h2>
          <p>{{ activeStepDescription }}</p>
        </div>
      </div>

      <section class="workflow-grid workflow-grid--focused">
        <div class="workflow-main">
          <ClusterInputPanel v-if="visibleMainPanels.input" />
          <ClusterWorkflowPanel v-if="visibleMainPanels.workflow" />
          <ClusterResultPanel v-if="visibleMainPanels.result" />
        </div>

        <aside class="workflow-side">
          <ClusterTaskSidebar />
        </aside>
      </section>
    </section>

    <AppModal
      v-model="showResetModal"
      size="sm"
      :title="t('cluster.actions.reset')"
      :close-label="t('common.button.close')"
    >
      <p>{{ t('cluster.page.description') }}</p>
      <template #footer>
        <button
          class="global-action-btn global-action-btn-secondary"
          type="button"
          @click="showResetModal = false"
        >
          {{ t('common.button.cancel') }}
        </button>
        <button
          class="global-action-btn global-action-btn-primary"
          type="button"
          @click="confirmResetWorkspace"
        >
          {{ t('common.button.confirm') }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import BarIcon from '@/components/common/BarIcon.vue'
import ClusterInputPanel from '@/main/views/menu/cluster/ClusterInputPanel.vue'
import ClusterResultPanel from '@/main/views/menu/cluster/ClusterResultPanel.vue'
import ClusterTaskSidebar from '@/main/views/menu/cluster/ClusterTaskSidebar.vue'
import ClusterWorkflowPanel from '@/main/views/menu/cluster/ClusterWorkflowPanel.vue'
import { provideClusterWorkspace } from '@/main/views/menu/cluster/clusterContext.js'
import { useClusterWorkspace } from '@/main/views/menu/cluster/useClusterWorkspace.js'

const { t } = useI18n()
const workspace = useClusterWorkspace()

provideClusterWorkspace(workspace)

const {
  currentStep,
  stepOptions,
  activeStepOption,
  activeStepDescription,
  visibleMainPanels,
  showResetModal,
  goToStep,
  isStepReachable,
  confirmResetWorkspace
} = workspace
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.dialect-clustering-page {
  @include flex-col;
  gap: 20px;
  padding: 16px;
  min-height: 100%;

  .page-header,
  .panel,
  .workspace-stage-shell {
    padding: 20px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }

  .page-header h1,
  .panel-header h2,
  .section-heading h3,
  .workspace-stage-head h2 {
    margin: 0;
    color: var(--text-primary);
  }

  .page-header p,
  .panel-header p,
  .section-heading p,
  .section-note,
  .preview-hint,
  .task-message,
  .workspace-stage-head p {
    margin: 6px 0 0;
    color: var(--text-slate);
    line-height: 1.55;
  }

  .stage-kicker {
    margin: 0;
    color: var(--color-primary);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .workspace-stage-shell {
    @include flex-col;
    gap: 20px;
  }

  .workspace-stage-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    padding-bottom: 4px;
  }

  .reset-btn,
  .add-group-btn,
  .reload-result-btn,
  .group-remove-btn {
    width: auto;
  }

  .step-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px;
  }

  .step-pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border: 1px solid rgba(var(--color-primary-rgb), 0.18);
    background: var(--glass-70);
    border-radius: var(--radius-pill);
    padding: 10px 14px;
    color: var(--text-dark);
    cursor: not-allowed;
  }

  .step-pill.clickable {
    cursor: pointer;
  }

  .step-pill.active {
    background: linear-gradient(135deg, var(--glass-90), rgba(224, 238, 255, 0.88));
    color: var(--text-deep);
    border-color: rgba(var(--color-primary-rgb), 0.34);
  }

  .step-pill__index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-pill);
    background: rgba(var(--color-primary-rgb), 0.12);
    font-size: 12px;
    font-weight: 700;
  }

  .workflow-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 20px;
  }

  .workflow-grid--focused {
    align-items: start;
  }

  .workflow-main,
  .workflow-side,
  .groups-stack,
  .result-stack,
  .advanced-stack {
    @include flex-col;
    gap: 20px;
  }

  .panel-header,
  .group-panel__header,
  .section-heading,
  .quick-run-body {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }

  .panel-alert {
    padding: 12px 14px;
    border-radius: 14px;
    margin-bottom: 16px;
  }

  .panel-alert--error {
    background: rgba(var(--color-error-light-rgb), 0.12);
    border: 1px solid rgba(var(--color-error-light-rgb), 0.18);
    color: var(--color-error-dark);
  }

  .location-section,
  .group-panel,
  .summary-card,
  .result-section,
  .task-status-card,
  .cluster-form,
  .mode-panel,
  .stage-context-card {
    padding: 16px;
  }

  .inline-toggle-row {
    margin-top: 12px;
  }

  .inline-toggle {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    color: var(--text-dark);
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-top: 16px;
  }

  .field {
    @include flex-col;
    gap: 8px;
  }

  .field > span {
    color: var(--text-dark);
    font-weight: 600;
  }

  .field input,
  .field textarea {
    width: 100%;
    border: 1px solid rgba(var(--text-slate-light-rgb), 0.28);
    border-radius: 14px;
    padding: 12px 14px;
    background: var(--glass-80);
    color: var(--text-deep);
  }

  .field textarea {
    resize: vertical;
  }

  .source-section {
    margin-top: 16px;
    @include flex-col;
    gap: 14px;
  }

  .source-hint,
  .preview-empty {
    margin: 0;
    color: var(--text-tertiary);
  }

  .preview-box {
    @include flex-col;
    gap: 10px;
    padding: 12px;
    border-radius: 14px;
    background: var(--glass-50);
  }

  .preview-chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .preview-chip {
    padding: 6px 10px;
    border-radius: var(--radius-pill);
    background: rgba(var(--color-primary-rgb), 0.12);
    color: var(--color-primary);
    font-size: 13px;
  }

  .panel-actions {
    margin-top: 18px;
    display: flex;
    justify-content: flex-end;
  }

  .summary-card-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .summary-card {
    @include flex-col;
    gap: 10px;
  }

  .summary-card__label {
    color: var(--text-slate);
    font-size: 14px;
  }

  .summary-card strong,
  .performance-row strong,
  .task-row strong {
    color: var(--text-deep);
    font-size: 20px;
  }

  .hash-line,
  .task-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
  }

  .hash-line code,
  .task-row code {
    display: inline-block;
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-deep);
  }

  .status-badge {
    padding: 6px 10px;
    border-radius: var(--radius-pill);
    font-size: 13px;
    font-weight: 700;
  }

  .status-badge.is-completed {
    background: rgba(var(--color-success-rgb), 0.12);
    color: var(--color-success);
  }

  .status-badge.is-pending {
    background: rgba(var(--color-primary-rgb), 0.12);
    color: var(--color-primary);
  }

  .status-badge.is-idle {
    background: rgba(100, 116, 139, 0.16);
    color: var(--text-slate);
  }

  .quick-run-summary {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    font-weight: 700;
    color: var(--text-primary);
  }

  .quick-run-summary__label {
    color: var(--color-primary);
  }

  .table-scroll {
    overflow: auto;
  }

  .result-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
  }

  .result-table th,
  .result-table td {
    text-align: left;
    padding: 12px 10px;
    border-bottom: 1px solid rgba(var(--text-slate-light-rgb), 0.18);
    color: var(--text-dark);
  }

  .result-table th {
    color: var(--text-deep);
    font-weight: 700;
  }

  .diagnostic-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 14px;
  }

  .diagnostic-card {
    border-radius: 14px;
    background: var(--glass-70);
    padding: 14px;
  }

  .diagnostic-card h4 {
    margin: 0 0 10px;
    color: var(--text-deep);
  }

  .diagnostic-card pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--text-slate);
    font-size: 12px;
  }

  .performance-list {
    @include flex-col;
    gap: 10px;
    margin-top: 12px;
  }

  .performance-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }

  .task-status-card {
    @include flex-col;
    gap: 12px;
  }

  .progress-shell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .progress-track {
    flex: 1;
    height: 10px;
    border-radius: var(--radius-pill);
    background: rgba(var(--text-slate-light-rgb), 0.22);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), var(--color-cyan));
    border-radius: inherit;
  }
}

@media (max-width: 1080px) {
  .dialect-clustering-page {
    .workflow-grid {
      grid-template-columns: 1fr;
    }

    .workflow-side {
      order: -1;
    }
  }
}

@media (max-width: 768px) {
  .dialect-clustering-page {
    padding: 12px;

    .page-header,
    .panel-header,
    .group-panel__header,
    .section-heading,
    .quick-run-summary,
    .workspace-stage-head {
      flex-direction: column;
    }

    .form-grid,
    .summary-card-grid {
      grid-template-columns: 1fr;
    }

    .panel-actions {
      justify-content: stretch;
    }

    .panel-actions > button,
    .quick-run-body > button {
      width: 100%;
    }
  }
}
</style>
