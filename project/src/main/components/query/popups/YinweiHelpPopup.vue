<template>
  <AppModal
    :model-value="visible"
    size="sm"
    transition-name="fade-scale"
    :title="t('query.components.yinweiSelector.modalTitle')"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <div v-if="!hasLocations" class="empty-state">
      <div class="icon-warn">!</div>
      <p class="empty-text">{{ t('query.components.yinweiSelector.emptyState') }}</p>
    </div>

    <div v-else-if="openingAnimating" class="popup-opening-state" aria-hidden="true">
      <span class="ui-loading--hourglass popup-opening-loader"></span>
    </div>

    <ul v-else class="glass-list">
      <li v-for="(loc, index) in locationList" :key="index" class="glass-list-item">
        <div class="item-row">
          <span class="loc-name">{{ loc }}</span>
        </div>

        <Transition name="slide-down">
          <div v-if="apiResults[loc]" class="result-box">
            <div class="stat-section" v-if="apiResults[loc]['聲母']">
              <h4 class="stat-title">{{ t('query.components.yinweiSelector.initial') }}</h4>
              <div class="stat-tags">
                <span v-for="(count, key) in apiResults[loc]['聲母']" :key="key" class="glass-tag">
                  <span class="tag-key">{{ key }}</span>
                  <span class="tag-count">{{ count }}</span>
                </span>
              </div>
            </div>

            <div class="stat-section" v-if="apiResults[loc]['韻母']">
              <h4 class="stat-title">{{ t('query.components.yinweiSelector.final') }}</h4>
              <div class="stat-tags">
                <span v-for="(count, key) in apiResults[loc]['韻母']" :key="key" class="glass-tag">
                  <span class="tag-key">{{ key }}</span>
                  <span class="tag-count">{{ count }}</span>
                </span>
              </div>
            </div>

            <div class="stat-section" v-if="apiResults[loc]['聲調']">
              <h4 class="stat-title">{{ t('query.components.yinweiSelector.tone') }}</h4>
              <div class="stat-tags">
                <span v-for="(count, key) in apiResults[loc]['聲調']" :key="key" class="glass-tag">
                  <span class="tag-key">{{ key }}</span>
                  <span class="tag-count">{{ count }}</span>
                </span>
              </div>
            </div>
          </div>
        </Transition>
      </li>
    </ul>
  </AppModal>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'

defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  hasLocations: {
    type: Boolean,
    default: false
  },
  locationList: {
    type: Array,
    default: () => []
  },
  loadingStates: {
    type: Object,
    default: () => ({})
  },
  openingAnimating: {
    type: Boolean,
    default: false
  },
  apiResults: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])
const { t } = useI18n()

function handleClose() {
  emit('close')
}
</script>


$text-main: var(--text-dark);
$text-secondary: var(--text-tertiary);
$text-muted: var(--text-secondary);
$primary: var(--color-primary);

$divider-color: rgba(0, 0, 0, 0.05);
$glass-background: var(--glass-40);
$glass-background-medium: var(--glass-50);
$glass-background-hover: var(--glass-80);
$glass-border: var(--glass-50);
$glass-border-strong: var(--glass-60);

$transition-fast: 0.2s;
$transition-normal: 0.3s;
.empty-state {
  padding: 30px 0;
  color: $text-secondary;
  text-align: center;

  .icon-warn {
    margin-bottom: 10px;
    font-size: 40px;
  }

  .empty-text {
    white-space: pre-line;
  }
}

.popup-opening-state {
  min-height: 160px;

  @include flex-center;

  .popup-opening-loader {
    transform: scale(1.2);
  }
}

.glass-list {
  margin: 0;
  padding: 0;
  list-style: none;

  .glass-list-item {
    padding: 12px 0;
    border-bottom: 1px solid $divider-color;

    &:last-child {
      border-bottom: none;
    }
  }
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .loc-name {
    font-size: 16px;
    font-weight: 500;
  }
}

/* 统计结果展开动画 */
.slide-down {
  &-enter-active,
  &-leave-active {
    max-height: 200px;
    opacity: 1;
    transition:
      max-height $transition-normal ease,
      opacity $transition-normal ease;
  }

  &-enter-from,
  &-leave-to {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
  }
}

.result-box {
  margin-top: 10px;
  padding: 15px;
  background: $glass-background;
  border: 1px solid $glass-border;
  border-radius: var(--radius-md);

  .stat-section {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.stat-title {
  margin: 0 0 6px 4px;
  color: $text-muted;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.stat-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.glass-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: $glass-background-medium;
  border: 1px solid $glass-border-strong;
  border-radius: var(--radius-xl);
  box-shadow: 0 1px 2px $divider-color;
  color: $text-main;
  font-size: 13px;
  transition:
    transform $transition-fast,
    background $transition-fast;

  &:hover {
    background: $glass-background-hover;
    transform: translateY(-1px);
  }

  .tag-key {
    margin-right: 6px;
    font-family: "Menlo", "Consolas", monospace;
    font-weight: 600;
  }

  .tag-count {
    min-width: 14px;
    padding: 1px 5px;
    background: rgba(var(--color-primary-rgb), 0.1);
    border-radius: var(--radius-sm2);
    color: $primary;
    text-align: center;
    font-size: 11px;
    font-weight: 700;
  }
}

