<template>
  <AppModal
    :model-value="visible"
    size="sm"
    :title="t('home.supportModal.title')"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <div class="home-support-content">
      <p class="home-support-subtitle">{{ t('home.supportModal.subtitle') }}</p>
      <div class="donate-qr-grid">
        <div class="donate-qr-box">
          <img :src="weixinQR" :alt="t('home.supportModal.weixinAlt')" />
          <p class="donate-qr-label">{{ t('home.supportModal.weixinLabel') }}</p>
        </div>
        <div class="donate-qr-box">
          <img :src="alipayQR" :alt="t('home.supportModal.alipayAlt')" />
          <p class="donate-qr-label">{{ t('home.supportModal.alipayLabel') }}</p>
        </div>
      </div>
      <section v-if="sortedDonors.length > 0" class="donor-section">
        <p class="donor-thanks">{{ t('home.supportModal.donorThanks') }}</p>
        <div class="donor-table-wrap">
          <table class="donor-table">
            <thead>
              <tr>
                <th>{{ t('home.supportModal.donorColumns.time') }}</th>
                <th>{{ t('home.supportModal.donorColumns.donor') }}</th>
                <th>{{ t('home.supportModal.donorColumns.amount') }}</th>
                <th>{{ t('home.supportModal.donorColumns.method') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="donor in sortedDonors"
                :key="`${donor.sortTime}-${donor.name}-${donor.amount}`"
              >
                <td class="donor-time">{{ donor.time }}</td>
                <td class="donor-name">{{ donor.name }}</td>
                <td class="donor-amount">{{ donor.amount }}</td>
                <td class="donor-method">{{ donor.method }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppModal>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import weixinQR from '@/assets/picture/weixin.png'
import alipayQR from '@/assets/picture/zfb.jpg'

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])
const { t } = useI18n()
const donors = [
  {
    sortTime: '2025-10-08T21:39:11+08:00',
    time: '2025.10.8 21:39:11',
    name: '*',
    amount: '100.00',
    method: '微信'
  },
  {
    sortTime: '2025-09-02T12:27:11+08:00',
    time: '2025.9.2 12:27:11',
    name: '*子',
    amount: '9.90',
    method: '微信'
  },
  // {
  //   sortTime: '2025-09-01T21:15:12+08:00',
  //   time: '2025.9.1 21:15:12',
  //   name: '不*',
  //   amount: '1.00',
  //   method: '微信'
  // },
  {
    sortTime: '2026-01-09T21:42:04+08:00',
    time: '2026.1.9 21:42:04',
    name: '*⁰',
    amount: '7.00',
    method: '微信'
  },
  {
    sortTime: '2026-04-07T13:01:35+08:00',
    time: '2026.4.7 13:01:35',
    name: 'S*Y',
    amount: '6.66',
    method: '微信'
  },
  {
    sortTime: '2026-01-08T13:45:30+08:00',
    time: '2026.1.8 13:45:30',
    name: '**培',
    amount: '10.00',
    method: '支付宝'
  },
  {
    sortTime: '2026-01-31T15:57:21+08:00',
    time: '2026.1.31 15:57:21',
    name: '**珠',
    amount: '100.00',
    method: '支付宝'
  },
  {
    sortTime: '2026-04-29T22:04:40+08:00',
    time: '2026.4.29 22:04:40',
    name: '*良',
    amount: '50.00',
    method: '微信'
  }
]
const sortedDonors = [...donors].sort((left, right) =>
  new Date(left.sortTime) - new Date(right.sortTime)
)

function handleClose() {
  emit('close')
}
</script>


$text-main: var(--text-primary);
$text-secondary: rgba(0, 0, 0, 0.6);

$surface-border: rgba(0, 0, 0, 0.06);
$surface-background: rgba(255, 255, 255, 0.56);
$surface-header: rgba(255, 255, 255, 0.72);
$surface-row-even: rgba(255, 255, 255, 0.38);

$shadow-default: 0 4px 12px rgba(0, 0, 0, 0.1);
$shadow-hover: 0 6px 16px rgba(0, 0, 0, 0.15);

$transition-duration: 0.3s;

.home-support-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.home-support-subtitle {
  margin: 0;
  color: $text-secondary;
  text-align: center;
}

.donate-qr-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
}

.donate-qr-box {
  display: flex;
  flex-direction: column;
  align-items: center;

  img {
    width: 100%;
    max-width: 150px;
    height: auto;
    border-radius: 10px;
    box-shadow: $shadow-default;
    cursor: pointer;
    transition:
      box-shadow $transition-duration ease,
      transform $transition-duration ease;

    &:hover {
      box-shadow: $shadow-hover;
      transform: scale(1.05);
    }
  }

  .donate-qr-label {
    margin: 0.625rem 0 0;
    color: $text-main;
    text-align: center;
    font-size: 0.9375rem;
    font-weight: 600;
  }
}

.donor-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.donor-thanks {
  margin: 0;
  color: $text-main;
  text-align: center;
  font-size: 1rem;
  line-height: 1.6;
}

.donor-table-wrap {
  overflow-x: auto;
  background: $surface-background;
  border: 1px solid $surface-border;
  border-radius: 14px;
}

.donor-table {
  width: 100%;
  min-width: 200px;
  border-collapse: collapse;

  th,
  td {
    padding: 12px 14px;
    border-bottom: 1px solid $surface-border;
    color: $text-main;
    text-align: left;
    font-size: 0.9375rem;
  }

  th {
    background: $surface-header;
    white-space: nowrap;
    font-weight: 650;
  }

  tbody {
    tr {
      &:nth-child(even) {
        background: $surface-row-even;
      }

      &:last-child {
        td {
          border-bottom: none;
        }
      }
    }
  }

  .donor-time,
  .donor-amount {
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .donor-amount {
    font-weight: 650;
  }

  .donor-method {
    white-space: nowrap;
  }
}

@media (max-width: 640px) {
  .donor-table {
    th,
    td {
      padding: 10px 12px;
      font-size: 0.875rem;
    }
  }
}

@media (orientation: portrait) {
  .donate-qr-grid {
    gap: 1rem;
  }

  .donate-qr-box {
    img {
      max-width: 120px;
    }
  }
}

