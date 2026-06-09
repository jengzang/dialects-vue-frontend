<template>
  <div class="dialect-clustering-page">
    <header class="page-header main-glass-panel">
      <div>
        <h1>{{ t('cluster.page.title') }}</h1>
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
      class="step-nav main-glass-panel-inner"
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

    <section class="workflow-grid">
      <div class="workflow-main">
        <ClusterInputPanel />
        <ClusterWorkflowPanel />
        <ClusterResultPanel />
      </div>

      <aside class="workflow-side">
        <ClusterTaskSidebar />
      </aside>
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
  showResetModal,
  goToStep,
  isStepReachable,
  confirmResetWorkspace
} = workspace
</script>

<style lang="scss">
.dialect-clustering-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
  min-height: 100%;

  .page-header,
  .panel {
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
  .section-heading h3 {
    margin: 0;
    color: #1d1d1f;
  }

  .page-header p,
  .panel-header p,
  .section-heading p,
  .section-note,
  .preview-hint,
  .task-message {
    margin: 6px 0 0;
    color: #51606f;
    line-height: 1.55;
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
    border: 1px solid rgba(0, 122, 255, 0.18);
    background: rgba(255, 255, 255, 0.72);
    border-radius: 999px;
    padding: 10px 14px;
    color: #425466;
    cursor: not-allowed;
  }

  .step-pill.clickable {
    cursor: pointer;
  }

  .step-pill.active {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(224, 238, 255, 0.88));
    color: #0b3d91;
    border-color: rgba(0, 122, 255, 0.34);
  }

  .step-pill__index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: rgba(0, 122, 255, 0.12);
    font-size: 12px;
    font-weight: 700;
  }

  .workflow-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 20px;
  }

  .workflow-main,
  .workflow-side,
  .groups-stack,
  .result-stack,
  .advanced-stack {
    display: flex;
    flex-direction: column;
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
    background: rgba(255, 59, 48, 0.12);
    border: 1px solid rgba(255, 59, 48, 0.18);
    color: #b42318;
  }

  .location-section,
  .group-panel,
  .summary-card,
  .result-section,
  .task-status-card,
  .cluster-form,
  .mode-panel {
    padding: 16px;
  }

  .inline-toggle-row {
    margin-top: 12px;
  }

  .inline-toggle {
    display: inline-flex;
    gap: 10px;
    align-items: center;
    color: #334155;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-top: 16px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field > span {
    color: #334155;
    font-weight: 600;
  }

  .field input,
  .field textarea {
    width: 100%;
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 14px;
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.82);
    color: #1f2937;
  }

  .field textarea {
    resize: vertical;
  }

  .source-section {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .source-hint,
  .preview-empty {
    margin: 0;
    color: #64748b;
  }

  .preview-box {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.54);
  }

  .preview-chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .preview-chip {
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(0, 122, 255, 0.12);
    color: #0b57d0;
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
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .summary-card__label {
    color: #475569;
    font-size: 14px;
  }

  .summary-card strong,
  .performance-row strong,
  .task-row strong {
    color: #0f172a;
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
    color: #0f172a;
  }

  .status-badge {
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
  }

  .status-badge.is-completed {
    background: rgba(52, 199, 89, 0.12);
    color: #207227;
  }

  .status-badge.is-pending {
    background: rgba(0, 122, 255, 0.12);
    color: #0b57d0;
  }

  .status-badge.is-idle {
    background: rgba(100, 116, 139, 0.16);
    color: #475569;
  }

  .quick-run-summary {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    font-weight: 700;
    color: #1d1d1f;
  }

  .quick-run-summary__label {
    color: #0b57d0;
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
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
    color: #334155;
  }

  .result-table th {
    color: #0f172a;
    font-weight: 700;
  }

  .diagnostic-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 14px;
  }

  .diagnostic-card {
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.66);
    padding: 14px;
  }

  .diagnostic-card h4 {
    margin: 0 0 10px;
    color: #0f172a;
  }

  .diagnostic-card pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    color: #475569;
    font-size: 12px;
  }

  .performance-list {
    display: flex;
    flex-direction: column;
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
    display: flex;
    flex-direction: column;
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
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.22);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #0a84ff, #5ac8fa);
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
    .quick-run-summary {
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
