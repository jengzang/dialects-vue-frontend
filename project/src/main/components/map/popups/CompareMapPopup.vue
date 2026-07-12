<template>
  <div class="map-popup active">
    <p>{{ item.location }}</p>
    <p v-if="item.pair">{{ item.pair }}</p>

    <ul>
      <li>
        <span class="map-popup__label">{{ labels.feature }}</span>
        <span class="val">{{ item.featureLabel || item.feature }}</span>
      </li>
      <li>
        <span class="map-popup__label">{{ labels.result }}</span>
        <span class="val">{{ status.icon }} {{ status.text }}</span>
      </li>
      <li v-if="showReadingComparison">
        <span class="map-popup__label">{{ labels.readingComparison }}</span>
        <span class="map-popup__detail" v-html="detailHtml"></span>
      </li>
      <li v-if="showSimilarity">
        <span class="map-popup__label">{{ labels.similarity }}</span>
        <span class="map-popup__percentage">{{ item.overlap }}%</span>
      </li>
      <li v-if="showDetail">
        <div v-if="structuredDetailRows.length" class="map-popup__detail-groups">
          <div
            v-for="(row, index) in structuredDetailRows"
            :key="`${row.label}-${index}`"
            class="map-popup__detail-group"
          >
            <span class="map-popup__detail-group-label">{{ row.label }}</span>
            <div class="map-popup__detail-group-values">
              <span
                v-for="(entry, entryIndex) in row.entries"
                :key="`${entry}-${entryIndex}`"
                class="map-popup__detail-chip"
              >
                {{ entry }}
              </span>
            </div>
          </div>
        </div>
        <span v-else class="map-popup__detail" v-html="detailHtml"></span>
      </li>
      <li v-if="showToneComparison">
        <span class="map-popup__label">{{ labels.toneComparison }}</span>
        <span class="map-popup__detail" v-html="detailHtml"></span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  display: {
    type: Object,
    default: () => ({})
  },
  status: {
    type: Object,
    default: () => ({})
  }
})

const display = computed(() => ({
  compareType: '',
  labels: {
    feature: '',
    result: '',
    similarity: '',
    readingComparison: '',
    detail: '',
    toneComparison: ''
  },
  ...props.display
}))

const labels = computed(() => ({
  feature: '',
  result: '',
  similarity: '',
  readingComparison: '',
  detail: '',
  toneComparison: '',
  ...(display.value.labels || {})
}))

const status = computed(() => ({
  icon: '',
  text: '',
  ...props.status
}))

const detailHtml = computed(() => props.item.value || '')
const detailLines = computed(() => {
  if (!props.item.value) {
    return []
  }

  return props.item.value
    .split(/<br\s*\/?>|\r?\n/i)
    .map(line => line.trim())
    .filter(Boolean)
})

const structuredDetailRows = computed(() => {
  if (display.value.compareType !== 'zhonggu') {
    return []
  }

  const rows = detailLines.value
    .map(line => {
      const match = line.match(/^([^:：]+)[:：]\s*(.+)$/)
      if (!match) {
        return null
      }

      const [, label, valueText] = match
      const entries = valueText
        .split(/[，,]\s*/)
        .map(entry => entry.trim())
        .filter(Boolean)

      if (!entries.length) {
        return {
          label: label.trim(),
          entries: [valueText.trim()]
        }
      }

      return {
        label: label.trim(),
        entries
      }
    })
    .filter(Boolean)

  return rows.length === detailLines.value.length ? rows : []
})

const hasValue = computed(() => Boolean(props.item.value))

const showReadingComparison = computed(() => display.value.compareType === 'chars' && hasValue.value)
const showSimilarity = computed(() => display.value.compareType === 'zhonggu' && props.item.overlap !== undefined)
const showDetail = computed(() => display.value.compareType === 'zhonggu' && hasValue.value)
const showToneComparison = computed(() => display.value.compareType === 'tones' && hasValue.value)
</script>
