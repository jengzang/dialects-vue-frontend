<template>
  <section class="panel glass-panel">
    <div class="panel-header">
      <div>
        <h2>{{ t('cluster.task.title') }}</h2>
        <p>{{ t('cluster.task.description') }}</p>
      </div>
    </div>

    <div class="stage-context-stack">
      <div class="stage-context-card glass-subpanel">
        <h3>{{ t('cluster.context.title') }}</h3>
        <div class="context-list">
          <div
            v-for="card in stageContextCards"
            :key="card.key"
            class="context-row"
          >
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
          </div>
        </div>
      </div>

      <div class="stage-context-card glass-subpanel">
        <h3>{{ t('cluster.context.progressTitle') }}</h3>
        <div class="stage-progress-list">
          <div
            v-for="item in stageProgressItems"
            :key="item.key"
            class="stage-progress-row"
          >
            <span>{{ item.label }}</span>
            <span
              class="status-badge"
              :class="progressStatusClass(item.status)"
            >
              {{ t(`cluster.context.progress.${item.status}`) }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="workspaceState.activeTask.taskId"
        class="task-status-card glass-subpanel"
      >
        <div class="task-row">
          <span>{{ t('cluster.task.source') }}</span>
          <strong>{{ t(`cluster.task.${workspaceState.activeTask.source}`) }}</strong>
        </div>
        <div class="task-row">
          <span>{{ t('cluster.task.taskId') }}</span>
          <code>{{ workspaceState.activeTask.taskId }}</code>
        </div>
        <div class="task-row">
          <span>{{ t('cluster.task.status') }}</span>
          <strong>{{ t(`cluster.status.${mapTaskStatus(workspaceState.activeTask.status)}`) }}</strong>
        </div>
        <div class="progress-shell">
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: `${workspaceState.activeTask.progress || 0}%` }"
            />
          </div>
          <span>{{ workspaceState.activeTask.progress || 0 }}%</span>
        </div>
        <p class="task-message">
          {{ workspaceState.activeTask.message || '—' }}
        </p>
      </div>
      <p
        v-else
        class="section-note"
      >
        {{ t('cluster.status.idle') }}
      </p>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useClusterWorkspaceContext } from './clusterContext.js'

const { t } = useI18n()
const {
  workspaceState,
  stageContextCards,
  stageProgressItems,
  mapTaskStatus
} = useClusterWorkspaceContext()

function progressStatusClass(status) {
  return {
    'is-completed': status === 'completed',
    'is-pending': status === 'pending' || status === 'active',
    'is-idle': status === 'idle'
  }
}
</script>
