<template>
  <button
    v-if="diceEntry && tutorialEnabled"
    type="button"
    class="pill-btn tutorial-quick-start"
    @click="apply"
  >
    <span>{{ t('tutorial.assist.quickStart') }}</span>
    <span v-if="presetState" class="tutorial-quick-start__progress">
      {{ presetState.index }}/{{ presetState.total }}
    </span>
    <svg
      class="tutorial-quick-start__arrow"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { tutorialEnabled, requestTutorialAssistApply } from '@/main/store/store.js'
import {
  getTutorialDiceEntryByTarget,
  getTutorialDicePresetState,
} from '@/main/config/tutorial/tutorialDiceConfig.js'

const props = defineProps({
  target: {
    type: String,
    required: true,
  },
})

const route = useRoute()
const { t } = useI18n()

const diceEntry = computed(() => getTutorialDiceEntryByTarget(props.target))
const presetState = computed(() => {
  return diceEntry.value ? getTutorialDicePresetState(diceEntry.value.key) : null
})

function apply() {
  if (!diceEntry.value) {
    return
  }

  requestTutorialAssistApply(
    diceEntry.value.target,
    diceEntry.value.createPayload({ route }),
  )
}
</script>

<style lang="scss" scoped>
.tutorial-quick-start {
  align-self: center;
  // margin-top: 1.5dvh;
}

.tutorial-quick-start__progress {
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
}

.tutorial-quick-start__arrow {
  flex: 0 0 auto;
}
</style>
