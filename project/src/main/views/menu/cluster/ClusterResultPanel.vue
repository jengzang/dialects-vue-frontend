<template>
  <section
    class="panel main-glass-panel"
    data-step="result"
  >
    <div class="panel-header">
      <div>
        <h2>{{ t('cluster.result.title') }}</h2>
        <p>{{ t('cluster.result.description') }}</p>
      </div>
      <button
        v-if="canReloadResult"
        class="global-action-btn global-action-btn-secondary reload-result-btn"
        type="button"
        @click="reloadCurrentResult"
      >
        {{ t('cluster.actions.reloadResult') }}
      </button>
    </div>

    <div
      v-if="clusterResult"
      class="result-stack"
    >
      <div class="summary-card-grid">
        <div
          v-for="card in resultSummaryCards"
          :key="card.label"
          class="summary-card main-glass-panel-inner"
        >
          <span class="summary-card__label">{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </div>
      </div>

      <div class="result-section main-glass-panel-inner">
        <h3>{{ t('cluster.result.assignments') }}</h3>
        <div class="table-scroll ui-scrollbar">
          <table class="result-table">
            <thead>
              <tr>
                <th>{{ t('cluster.result.columns.location') }}</th>
                <th>{{ t('cluster.result.columns.clusterId') }}</th>
                <th>{{ t('cluster.result.columns.province') }}</th>
                <th>{{ t('cluster.result.columns.city') }}</th>
                <th>{{ t('cluster.result.columns.county') }}</th>
                <th>{{ t('cluster.result.columns.town') }}</th>
                <th>{{ t('cluster.result.columns.yindianRegion') }}</th>
                <th>{{ t('cluster.result.columns.mapRegion') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="assignment in assignments"
                :key="assignment.location + '-' + assignment.cluster_id"
              >
                <td>{{ assignment.location || '—' }}</td>
                <td>{{ assignment.cluster_id ?? '—' }}</td>
                <td>{{ assignment.province || '—' }}</td>
                <td>{{ assignment.city || '—' }}</td>
                <td>{{ assignment.county || '—' }}</td>
                <td>{{ assignment.town || '—' }}</td>
                <td>{{ assignment.yindian_region || '—' }}</td>
                <td>{{ assignment.map_region || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="result-section main-glass-panel-inner">
        <h3>{{ t('cluster.result.groups') }}</h3>
        <div class="diagnostic-list">
          <article
            v-for="group in resultGroups"
            :key="group.label || group.group_id || JSON.stringify(group)"
            class="diagnostic-card"
          >
            <h4>{{ group.label || 'Group' }}</h4>
            <pre>{{ formatStructuredValue(group) }}</pre>
          </article>
        </div>
      </div>

      <details class="result-section main-glass-panel-inner">
        <summary>{{ t('cluster.result.advanced') }}</summary>
        <div class="advanced-stack">
          <div>
            <h3>{{ t('cluster.result.performance') }}</h3>
            <div class="performance-list">
              <div
                v-for="[key, value] in performanceEntries"
                :key="key"
                class="performance-row"
              >
                <span>{{ key }}</span>
                <strong>{{ formatNumeric(value) }}</strong>
              </div>
            </div>
          </div>
          <div v-if="cacheEntries.length > 0">
            <h3>{{ t('cluster.result.cacheInfo') }}</h3>
            <div class="performance-list">
              <div
                v-for="[key, value] in cacheEntries"
                :key="key"
                class="performance-row"
              >
                <span>{{ key }}</span>
                <strong>{{ String(value) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>

    <p
      v-else
      class="section-note"
    >
      {{ t('cluster.result.empty') }}
    </p>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useClusterWorkspaceContext } from './clusterContext.js'

const { t } = useI18n()
const {
  clusterResult,
  canReloadResult,
  resultSummaryCards,
  assignments,
  resultGroups,
  performanceEntries,
  cacheEntries,
  reloadCurrentResult,
  formatNumeric,
  formatStructuredValue
} = useClusterWorkspaceContext()
</script>
