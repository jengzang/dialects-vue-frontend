<template>
  <AppModal
    :model-value="visible"
    size="lg"
    transition-name="fade-scale"
    :title="t('user.benefitsPopup.title')"
    :close-label="t('common.button.close')"
    @update:modelValue="closePopup"
  >
    <div class="benefits-content popup-animated">
          <!-- <div class="popup-header">
            <h3>{{ t('user.benefitsPopup.title') }}</h3>
            <button
              class="close-btn close-btn-lg close-btn-inline"
              :aria-label="t('common.button.close')"
              @click="closePopup"
            >
              ✕
            </button>
          </div> -->

          <div class="benefits-content-inner">
            <div class="benefits-section">
              <h4 class="section-title">{{ t('user.benefitsPopup.comparisonTitle') }}</h4>
              <div class="comparison-table-wrapper">
                <table class="comparison-table">
                  <thead>
                    <tr>
                      <th>{{ t('user.benefitsPopup.table.feature') }}</th>
                      <th class="visitor-col">{{ t('user.benefitsPopup.table.visitor') }}</th>
                      <th class="member-col">{{ t('user.benefitsPopup.table.user') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in comparisonData" :key="item.key" class="table-row">
                      <td class="feature-name">{{ item.feature }}</td>
                      <td class="visitor-cell" :class="getCellClass('anonymous', item)">
                        {{ formatLimit(item.anonymous, item.unit) }}
                      </td>
                      <td class="member-cell" :class="getCellClass('user', item)">
                        <span class="member-value">{{ formatLimit(item.user, item.unit) }}</span>
                        <span v-if="shouldShowUpgradeBadge(item)" class="upgrade-badge">
                          {{
                            t('user.benefitsPopup.format.upgradePercent', {
                              value: getUpgradePercentage(item)
                            })
                          }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="benefits-notice">
              <p>{{ t('user.benefitsPopup.notice') }}</p>
            </div>

            <div class="benefits-section">
              <h4 class="section-title">{{ t('user.benefitsPopup.coreFeaturesTitle') }}</h4>
              <div class="features-grid">
                <div v-for="feature in coreFeatures" :key="feature.key" class="feature-item">
                  <span class="feature-icon">{{ feature.icon }}</span>
                  <span class="feature-text">{{ feature.name }}</span>
                </div>
              </div>
            </div>

            <div v-if="!isAuthenticated" class="benefits-cta">
              <button class="btn-register" @click="goToRegister">
                {{ t('user.benefitsPopup.ctaButton') }}
              </button>
              <p class="cta-hint">{{ t('user.benefitsPopup.ctaHint') }}</p>
            </div>
          </div>
    </div>
  </AppModal>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import { ROLE_LIMITS, LOCATION_LIMITS } from '@/main/config/constants.js'
import { userStore } from '@/main/store/store.js'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'register'])
const { t, locale } = useI18n()

const isAuthenticated = computed(() => userStore.isAuthenticated)

const LIMIT_TAGS = {
  unlimited: 'unlimited',
  userOnly: 'userOnly',
  open: 'open',
  partial: 'partial',
  full: 'full'
}

const comparisonData = computed(() => [
  {
    key: 'queryChars',
    feature: t('user.benefitsPopup.items.queryChars'),
    unit: 'location',
    anonymous: LOCATION_LIMITS.tab1.anonymous.MAX_LOCATIONS,
    user: LOCATION_LIMITS.tab1.user.MAX_LOCATIONS
  },
  {
    key: 'queryMiddleChinese',
    feature: t('user.benefitsPopup.items.queryMiddleChinese'),
    unit: 'location',
    anonymous: LOCATION_LIMITS.tab2.anonymous.MAX_LOCATIONS,
    user: LOCATION_LIMITS.tab2.user.MAX_LOCATIONS
  },
  {
    key: 'queryPhoneme',
    feature: t('user.benefitsPopup.items.queryPhoneme'),
    unit: 'location',
    anonymous: LOCATION_LIMITS.tab3.anonymous.MAX_LOCATIONS,
    user: LOCATION_LIMITS.tab3.user.MAX_LOCATIONS
  },
  {
    key: 'queryTone',
    feature: t('user.benefitsPopup.items.queryTone'),
    unit: 'location',
    anonymous: LOCATION_LIMITS.tab4.anonymous.MAX_LOCATIONS,
    user: LIMIT_TAGS.unlimited
  },
  {
    key: 'locationCombination',
    feature: t('user.benefitsPopup.items.locationCombination'),
    unit: 'group',
    anonymous: ROLE_LIMITS.anonymous.MAX_COMBINATIONS,
    user: ROLE_LIMITS.user.MAX_COMBINATIONS
  },
  {
    key: 'compareChars',
    feature: t('user.benefitsPopup.items.compareChars'),
    unit: 'location',
    anonymous: LOCATION_LIMITS.compare_tab1.anonymous.MAX_LOCATIONS,
    user: LOCATION_LIMITS.compare_tab1.user.MAX_LOCATIONS
  },
  {
    key: 'compareMiddleChinese',
    feature: t('user.benefitsPopup.items.compareMiddleChinese'),
    unit: 'location',
    anonymous: LOCATION_LIMITS.compare_tab2.anonymous.MAX_LOCATIONS,
    user: LOCATION_LIMITS.compare_tab2.user.MAX_LOCATIONS
  },
  {
    key: 'compareToneCategory',
    feature: t('user.benefitsPopup.items.compareToneCategory'),
    unit: 'location',
    anonymous: LOCATION_LIMITS.compare_tab4.anonymous.MAX_LOCATIONS,
    user: LOCATION_LIMITS.compare_tab4.user.MAX_LOCATIONS
  },
    {
    key: 'comparePhonetic',
    feature: t('user.benefitsPopup.items.comparePhonetic'),
    anonymous: LIMIT_TAGS.userOnly,
    user: LIMIT_TAGS.open
  },
  {
    key: 'regionalMap',
    feature: t('user.benefitsPopup.items.regionalMap'),
    unit: 'location',
    anonymous: LOCATION_LIMITS.divide.anonymous.MAX_LOCATIONS,
    user: LOCATION_LIMITS.divide.user.MAX_LOCATIONS
  },
    {
    key: 'drawMap',
    feature: t('user.benefitsPopup.items.drawMap'),
    anonymous: LIMIT_TAGS.userOnly,
    user: LIMIT_TAGS.open
  },
  {
    key: 'phonologyQuery',
    feature: t('user.benefitsPopup.items.phonologyQuery'),
    anonymous: LIMIT_TAGS.open,
    user: LIMIT_TAGS.open
  },
  {
    key: 'phonemeClassification',
    feature: t('user.benefitsPopup.items.phonemeClassification'),
    anonymous: LIMIT_TAGS.open,
    user: LIMIT_TAGS.open
  },
  {
    key: 'syllableStats',
    feature: t('user.benefitsPopup.items.syllableStats'),
    anonymous: LIMIT_TAGS.open,
    user: LIMIT_TAGS.open
  },
    {
    key: 'evolution',
    feature: t('user.benefitsPopup.items.evolution'),
    anonymous: LIMIT_TAGS.userOnly,
    user: LIMIT_TAGS.open
  },
  {
    key: 'customData',
    feature: t('user.benefitsPopup.items.customData'),
    anonymous: LIMIT_TAGS.userOnly,
    user: LIMIT_TAGS.open
  },
    {
    key: 'customRegions',
    feature: t('user.benefitsPopup.items.customRegions'),
    anonymous: LIMIT_TAGS.userOnly,
    user: LIMIT_TAGS.open
  },
  {
    key: 'praatAnalysis',
    feature: t('user.benefitsPopup.items.praatAnalysis'),
    anonymous: LIMIT_TAGS.userOnly,
    user: LIMIT_TAGS.open
  },
  {
    key: 'charListCheck',
    feature: t('user.benefitsPopup.items.charListCheck'),
    anonymous: LIMIT_TAGS.userOnly,
    user: LIMIT_TAGS.open
  },
  {
    key: 'jyutpingToIPA',
    feature: t('user.benefitsPopup.items.jyutpingToIPA'),
    anonymous: LIMIT_TAGS.userOnly,
    user: LIMIT_TAGS.open
  },
  {
    key: 'mergeCharList',
    feature: t('user.benefitsPopup.items.mergeCharList'),
    anonymous: LIMIT_TAGS.userOnly,
    user: LIMIT_TAGS.open
  },
  {
    key: 'corpusQuery',
    feature: t('user.benefitsPopup.items.corpusQuery'),
    anonymous: LIMIT_TAGS.open,
    user: LIMIT_TAGS.open
  },
  {
    key: 'guangdongVillages',
    feature: t('user.benefitsPopup.items.guangdongVillages'),
    anonymous: LIMIT_TAGS.open,
    user: LIMIT_TAGS.open
  },
  {
    key: 'machineLearning',
    feature: t('user.benefitsPopup.items.machineLearning'),
    anonymous: LIMIT_TAGS.partial,
    user: LIMIT_TAGS.full
  },
  {
    key: 'hourlyApiUsage',
    feature: t('user.benefitsPopup.items.hourlyApiUsage'),
    unit: 'callRate',
    anonymous: 50,
    user: 600
  }
])

const coreFeatures = computed(() => [
  { key: 'phonologyQuery', icon: '🔍' },
  { key: 'geoVisualization', icon: '🗺️' },
  { key: 'phonologyAnalysis', icon: '📊' },
  { key: 'charTableTools', icon: '✒️' },
  { key: 'acousticAnalysis', icon: '🎙️' },
  { key: 'guangdongVillages', icon: '🏘️' },
  { key: 'customData', icon: '📁' },
  { key: 'dataExport', icon: '📈' }
].map((item) => ({
  ...item,
  name: t(`user.benefitsPopup.coreFeatures.${item.key}`)
})))

const statusMap = computed(() => ({
  [LIMIT_TAGS.unlimited]: t('user.benefitsPopup.status.unlimited'),
  [LIMIT_TAGS.userOnly]: t('user.benefitsPopup.status.userOnly'),
  [LIMIT_TAGS.open]: t('user.benefitsPopup.status.open'),
  [LIMIT_TAGS.partial]: t('user.benefitsPopup.status.partial'),
  [LIMIT_TAGS.full]: t('user.benefitsPopup.status.full')
}))

const unitMap = computed(() => ({
  location: t('user.benefitsPopup.units.location'),
  group: t('user.benefitsPopup.units.group'),
  callRate: t('user.benefitsPopup.units.callRate')
}))

const formatNumber = (value) => Number(value).toLocaleString(locale.value)

const formatLimit = (value, unit = '') => {
  if (typeof value === 'string') {
    return statusMap.value[value] || value
  }

  const translatedUnit = unit ? unitMap.value[unit] : ''
  const formattedValue = formatNumber(value)

  return translatedUnit
    ? t('user.benefitsPopup.format.limitWithUnit', {
        value: formattedValue,
        unit: translatedUnit
      })
    : formattedValue
}

const getCellClass = (role, item) => {
  const currentRole = userStore.role === 'admin' ? 'user' : userStore.role
  return {
    'cell-highlight': role === currentRole,
    'cell-unlimited': item[role] === LIMIT_TAGS.unlimited
  }
}

const shouldShowUpgradeBadge = (item) => (
  typeof item.user === 'number' &&
  typeof item.anonymous === 'number' &&
  item.anonymous > 0 &&
  item.user > item.anonymous
)

const getUpgradePercentage = (item) => Math.round((item.user / item.anonymous - 1) * 100)

const closePopup = () => {
  emit('close')
}

const goToRegister = () => {
  emit('register')
  closePopup()
}

const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.visible) {
    closePopup()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>


$orange: var(--color-warning);
$orange-dark: var(--color-warning);
$green: var(--color-success);
$green-light: var(--color-success);

$text-main: var(--text-primary);
$text-secondary: var(--text-secondary);
$text-white: var(--text-white);

$orange-bg-subtle: rgba(var(--color-warning-rgb), 0.04);
$orange-bg-light: rgba(var(--color-warning-rgb), 0.05);
$orange-bg-medium: rgba(var(--color-warning-rgb), 0.08);
$orange-bg-strong: rgba(var(--color-warning-rgb), 0.12);
$orange-bg-highlight: rgba(var(--color-warning-rgb), 0.2);

$orange-border: rgba(var(--color-warning-rgb), 0.2);
$orange-shadow: rgba(var(--color-warning-rgb), 0.4);
$orange-shadow-hover: rgba(var(--color-warning-rgb), 0.5);

$border-light: rgba(0, 0, 0, 0.04);
$border-medium: rgba(0, 0, 0, 0.06);

$transition-fast: 0.2s;
$transition-normal: 0.3s;

@mixin orange-gradient($start-alpha, $end-alpha) {
  background: linear-gradient(
    135deg,
    rgba(255, 149, 0, $start-alpha),
    rgba(255, 149, 0, $end-alpha)
  );
}

.benefits-content,
.benefits-content-inner {
  overflow-x: hidden;
}

.benefits-section {
  margin-bottom: 28px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  margin: 0 0 16px;
  color: $text-main;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* 权益对比表 */
.comparison-table-wrapper {
  overflow-x: auto;
  background: rgba(247, 247, 247, 0.5);
  border-radius: 12px;
}

.comparison-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;

  thead {
    @include orange-gradient(0.12, 0.08);
  }

  th,
  td {
    padding: 14px 12px;
    color: $text-main;
    text-align: center;
  }

  th {
    border-bottom: 2px solid $orange-border;
    white-space: nowrap;
    font-size: 15px;
    font-weight: 600;

    &:first-child {
      padding-left: 16px;
      text-align: left;
    }
  }

  td {
    border-bottom: 1px solid $border-light;
    font-size: 15px;
  }

  tbody {
    tr {
      transition: background $transition-fast ease;

      &:hover {
        background: $orange-bg-light;
      }

      &:last-child {
        td {
          border-bottom: none;
        }
      }
    }
  }

  .visitor-col {
    color: $text-secondary;
    font-weight: 500;
  }

  .member-col {
    color: $orange;
    font-weight: 700;

    @include orange-gradient(0.15, 0.08);
  }

  .feature-name {
    padding-left: 16px !important;
    color: $text-main;
    text-align: left !important;
    font-weight: 600;
  }

  .visitor-cell {
    color: $text-secondary;
    font-weight: 500;
  }

  .member-cell {
    position: relative;
    color: $orange;
    font-weight: 700;

    @include orange-gradient(0.12, 0.06);

    .member-value {
      font-size: 16px;
    }

    .upgrade-badge {
      display: inline-block;
      margin-left: 4px;
      padding: 2px 8px;
      background: linear-gradient(135deg, $green, $green-light);
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(var(--color-success-rgb), 0.3);
      color: $text-white;
      font-size: 11px;
      font-weight: 700;
    }
  }

  .cell-highlight {
    background: $orange-bg-highlight;
    box-shadow: inset 0 0 0 2px rgba(var(--color-warning-rgb), 0.3);
    color: rgba(var(--color-warning-rgb), 0.76);
    font-weight: 700;
  }

  .cell-unlimited {
    color: $green;
    font-size: 16px;
    font-weight: 700;
  }
}

/* 核心功能 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--glass-70);
  border: 1px solid $border-medium;
  border-radius: 12px;
  backdrop-filter: blur(20px);
  transition:
    background $transition-fast ease,
    transform $transition-fast ease,
    box-shadow $transition-fast ease;

  &:hover {
    background: var(--glass-90);
    box-shadow: 0 4px 12px $orange-border;
    transform: translateY(-2px);
  }

  .feature-icon {
    font-size: 24px;
  }

  .feature-text {
    color: $text-main;
    font-size: 15px;
    font-weight: 500;
  }
}

/* 提示说明 */
.benefits-notice {
  margin: 20px 0;
  padding: 14px 18px;
  border-left: 3px solid $orange;
  border-radius: 12px;

  @include orange-gradient(0.08, 0.04);

  p {
    margin: 0;
    color: $text-main;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.6;
  }
}

/* 注册引导 */
.benefits-cta {
  margin-top: 24px;
  text-align: center;

  .btn-register {
    width: 100%;
    padding: 16px 32px;
    background: linear-gradient(135deg, $orange, $orange-dark);
    border: none;
    border-radius: 12px;
    box-shadow: 0 6px 16px $orange-shadow;
    color: $text-white;
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
    transition:
      transform $transition-normal cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow $transition-normal cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: 0 8px 20px $orange-shadow-hover;
      transform: translateY(-2px);
    }

    &:active {
      box-shadow: 0 4px 12px $orange-shadow;
      transform: translateY(0);
    }
  }

  .cta-hint {
    margin-top: 12px;
    color: $text-secondary;
    font-size: 13px;
    font-weight: 500;
  }
}

/* 弹窗内容入场动画 */
.popup-animated {
  animation: popup-bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popup-bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-30px);
  }

  50% {
    transform: scale(1.02) translateY(5px);
  }

  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 竖屏 */
@media (max-aspect-ratio: 1/1) {
  .benefits-content-inner {
    padding: 0;
  }

  .section-title {
    font-size: 16px;
  }

  .comparison-table {
    font-size: 12px;

    th,
    td {
      padding: 10px 6px;
    }

    .feature-name {
      padding-left: 12px !important;
    }
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .feature-item {
    padding: 10px 14px;

    .feature-icon {
      font-size: 20px;
    }

    .feature-text {
      font-size: 14px;
    }
  }

  .benefits-cta {
    .btn-register {
      width: 100%;
      padding: 12px 20px;
      font-size: 15px;
    }
  }
}

