<template>
  <section class="panel main-glass-panel">
    <div class="panel-header">
      <div>
        <h2>{{ t('cluster.task.title') }}</h2>
        <p>{{ t('cluster.task.message') }}</p>
      </div>
    </div>

    <div
      v-if="workspaceState.activeTask.taskId"
      class="task-status-card main-glass-panel-inner"
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
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useClusterWorkspaceContext } from './clusterContext.js'

const { t } = useI18n()
const { workspaceState, mapTaskStatus } = useClusterWorkspaceContext()
</script>
