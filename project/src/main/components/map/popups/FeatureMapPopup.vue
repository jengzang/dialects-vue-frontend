<template>
  <div class="map-popup active">
    <p>{{ item.location }}</p>
    <p>{{ item.featureLabel || item.feature }}</p>

    <p v-if="showCustomNote" style="margin-top: 5px;">{{ noteText }}</p>

    <ul v-else-if="hasPercentageDetails">
      <li v-for="(detail, index) in sortedDetails" :key="`${detail.value}-${detail.percentage}-${index}`">
        <span class="dot">{{ bulletSymbol }}</span>
        <span class="val">{{ detail.value }}</span>
        <span class="tilde">~</span>
        <span class="map-popup__percentage">{{ formatPercentage(detail.percentage) }}</span>
      </li>
    </ul>

    <p v-else-if="plainDetailsHtml" v-html="plainDetailsHtml"></p>

    <button
      v-if="showDeleteButton"
      class="map-popup__action map-popup__action--danger"
      @click.stop="$emit('custom-click')"
    >
      {{ deleteButtonText }}
    </button>

    <button
      v-else-if="showDetailButton"
      class="map-popup__action"
      @click.stop="$emit('detail-click')"
    >
      {{ detailButtonText }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  noteText: {
    type: String,
    default: ''
  },
  deleteButtonText: {
    type: String,
    default: ''
  },
  detailButtonText: {
    type: String,
    default: ''
  }
})

defineEmits(['custom-click', 'detail-click'])

const bulletSymbol = '•'

const showCustomNote = computed(() => props.item.iscustoms === 1 && props.isCustom)

const hasPercentageDetails = computed(() => {
  if (!Array.isArray(props.item.detailContent) || props.item.detailContent.length === 0) {
    return false
  }

  return props.item.detailContent.some(detail => {
    return detail && typeof detail === 'object' && Object.prototype.hasOwnProperty.call(detail, 'percentage')
  })
})

const sortedDetails = computed(() => {
  if (!hasPercentageDetails.value) {
    return []
  }

  return [...props.item.detailContent].sort((a, b) => b.percentage - a.percentage)
})

const plainDetails = computed(() => {
  if (showCustomNote.value || hasPercentageDetails.value || !Array.isArray(props.item.detailContent)) {
    return []
  }

  return props.item.detailContent
})

const plainDetailsHtml = computed(() => plainDetails.value.join('<br>'))

const showDeleteButton = computed(() => showCustomNote.value)
const showDetailButton = computed(() => hasPercentageDetails.value)

const formatPercentage = (percentage) => `${(percentage * 100).toFixed(1)}%`
</script>
