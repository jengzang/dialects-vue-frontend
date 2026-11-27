<template>
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
</template>

<script setup>
import { useI18n } from 'vue-i18n'

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
  },
  {
    sortTime: '2026-09-11T08:32:59+08:00',
    time: '2026.9.11 08:32:59',
    name: '*？',
    amount: '100.00',
    method: '微信'
  },
  {
    sortTime: '2026-09-15T09:00:00+08:00',
    time: '2026.9.15 09:00:00',
    name: '知乎人文',
    amount: '1000.00',
    method: '知乎钱包'
  },
  {
    sortTime: '2026-11-04T15:57:52+08:00',
    time: '2026.11.4 15:57:52',
    name: '*严',
    amount: '100.00',
    method: '微信'
  }
]

const sortedDonors = [...donors].sort((left, right) =>
  new Date(left.sortTime) - new Date(right.sortTime)
)
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$text-main: var(--text-primary);

$surface-border: rgba(0, 0, 0, 0.06);
$surface-background: var(--glass-60);
$surface-header: var(--glass-70);
$surface-row-even: var(--glass-40);

.donor-section {
  @include flex-col;
  gap: 12px;
}

.donor-thanks {
  margin: 0;
  color: $text-main;
  text-align: center;
  font-size: var(--font-size-16);
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
    font-size: var(--font-size-16);
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

@media (max-aspect-ratio: 1 / 1) {
  .donor-table {
    th,
    td {
      padding: 10px 12px;
      font-size: var(--font-size-14);
    }
  }
}
</style>
