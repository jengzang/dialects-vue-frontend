<template>
  <div class="homophone-lexicon">
    <div class="lexicon-toolbar">
      <span class="lexicon-title">{{ t('phonology.phonology.homophoneLexicon.title') }}</span>

      <div class="lexicon-actions">
        <RadioGroup
          :model-value="currentMode"
          :options="modeOptions"
          name="homophone-display-mode"
          :size="12"
          @update:modelValue="setMode"
        />

        <button v-if="showCopy" type="button" class="glass-button" data-size="compact" @click="handleCopy">
          {{ copyState === 'copied'
            ? t('phonology.phonology.homophoneLexicon.copied')
            : t('phonology.phonology.homophoneLexicon.copy') }}
        </button>
      </div>
    </div>

    <div class="lexicon-body">
      <div v-if="groups.length === 0" class="empty-state">
        {{ t('result.noData') }}
      </div>

      <template v-else>
        <section v-for="group in groups" :key="group.key" class="lexicon-group">
          <div v-if="group.label" class="group-label">{{ group.label }}</div>
          <div v-for="row in group.rows" :key="row.key" class="lexicon-row">
            <span v-if="row.prefix" class="row-prefix" :class="{ 'row-prefix--title': !group.label }">{{ row.prefix }}</span>
            <span
              v-for="segment in row.segments"
              :key="segment.key"
              class="lexicon-segment"
            >
              <span class="segment-tone">{{ segment.prefix }}</span>
              <span
                v-for="(charItem, charIndex) in segment.chars"
                :key="charIndex"
                class="lexicon-char"
                :style="charColorStyle(charItem.label)"
              >{{ charItem.char }}<span v-if="readingMark(charItem.label)" class="reading-mark">({{ readingMark(charItem.label) }})</span></span>
            </span>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import { READING_COLORS } from '@/main/config/colors/readingColors.js'
import {
  transformMatrixReadStats,
  resolveCharReadingLabel
} from '@/main/utils/phonology/readingStats.js'

const { t } = useI18n()

const props = defineProps({
  location: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    required: true
  },
  displayMode: {
    type: String,
    default: 'final-grouped'
  },
  showCopy: {
    type: Boolean,
    default: true
  },
  toneMode: {
    type: String,
    default: 'category'
  },
  toneMap: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:displayMode'])

const currentMode = ref(props.displayMode)

const setMode = (mode) => {
  currentMode.value = mode
  emit('update:displayMode', mode)
}

const modeOptions = computed(() => [
  { value: 'final-grouped', label: t('phonology.phonology.homophoneLexicon.modeFinalGrouped') },
  { value: 'syllable', label: t('phonology.phonology.homophoneLexicon.modeSyllable') }
])

const READING_TYPE_COLOR = {
  文讀: READING_COLORS.wendu,
  白讀: READING_COLORS.baidu,
  文白讀: READING_COLORS.both,
  多音字: READING_COLORS.polyphonic
}

const charColorStyle = (label) => {
  const color = READING_TYPE_COLOR[label]
  return color ? { color } : {}
}

const READING_MARK = {
  文讀: '文',
  白讀: '白',
  文白讀: '文白'
}

const readingMark = (label) => READING_MARK[label] || ''

const toneLabel = (tone) => {
  if (!props.toneMap) return tone
  const entry = props.toneMap[tone]
  if (!entry) return tone
  return entry[props.toneMode] ?? tone
}

const cellDetails = computed(() => transformMatrixReadStats(props.data.matrix_read_stats))

const entries = computed(() => {
  const result = []
  const initials = props.data.initials || []
  const finals = props.data.finals || []
  const tones = props.data.tones || []
  const matrix = props.data.matrix || {}
  const details = cellDetails.value

  for (const final of finals) {
    for (const initial of initials) {
      const cell = matrix[initial]?.[final]
      if (!cell) continue

      for (const tone of tones) {
        const chars = cell[tone]
        if (!Array.isArray(chars) || chars.length === 0) continue

        const labelMap = resolveCharReadingLabel(details, initial, final, tone)
        result.push({
          initial,
          final,
          tone,
          chars: chars.map((char) => ({ char, label: labelMap.get(char) || '' }))
        })
      }
    }
  }

  return result
})

const groups = computed(() => {
  if (currentMode.value === 'syllable') {
    const map = new Map()
    for (const entry of entries.value) {
      const syllable = entry.initial + entry.final
      if (!map.has(syllable)) map.set(syllable, [])
      map.get(syllable).push(entry)
    }

    return [...map.entries()].map(([syllable, list]) => ({
      key: syllable,
      label: '',
      rows: [{
        key: syllable,
        prefix: syllable,
        segments: list.map((entry) => ({
          key: `${syllable}-${entry.tone}`,
          prefix: `[${toneLabel(entry.tone)}]`,
          chars: entry.chars
        }))
      }]
    }))
  }

  const map = new Map()
  for (const entry of entries.value) {
    if (!map.has(entry.final)) map.set(entry.final, new Map())
    const byInitial = map.get(entry.final)
    if (!byInitial.has(entry.initial)) byInitial.set(entry.initial, [])
    byInitial.get(entry.initial).push(entry)
  }

  const result = []
  for (const [final, byInitial] of map.entries()) {
    const rows = []
    for (const [initial, list] of byInitial.entries()) {
      rows.push({
        key: `${final}-${initial}`,
        prefix: initial,
        segments: list.map((entry) => ({
          key: `${initial}-${entry.tone}`,
          prefix: `[${toneLabel(entry.tone)}]`,
          chars: entry.chars
        }))
      })
    }
    result.push({ key: final, label: final, rows })
  }
  return result
})

const plainText = computed(() => {
  const lines = []

  for (const group of groups.value) {
    if (group.label) lines.push(group.label)
    for (const row of group.rows) {
      const segments = row.segments.map((segment) => {
        const chars = segment.chars.map((c) => {
          const mark = readingMark(c.label)
          return `${c.char}${mark ? `(${mark})` : ''}`
        }).join('')
        return `${segment.prefix}${chars}`
      })
      const parts = row.prefix ? [row.prefix, ...segments] : segments
      lines.push(parts.join(' '))
    }
  }

  return lines.join('\n')
})

const copyState = ref('idle')

const fallbackCopy = (text) => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

const writeClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      fallbackCopy(text)
    }
    return true
  } catch {
    fallbackCopy(text)
    return true
  }
}

const handleCopy = async () => {
  if (!plainText.value) return
  await writeClipboard(plainText.value)
  copyState.value = 'copied'
  setTimeout(() => {
    copyState.value = 'idle'
  }, 2000)
}

defineExpose({
  plainText,
  copyPlainText: async () => {
    if (!plainText.value) return false
    return writeClipboard(plainText.value)
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$text-main: var(--text-primary);
$text-body: var(--text-deep);
$text-secondary: var(--text-slate);

.homophone-lexicon {
  width: 100%;
  margin-top: 20px;
}

.lexicon-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.lexicon-title {
  color: $text-main;
  font-size: 15px;
  font-weight: 700;
}

.lexicon-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.lexicon-body {
  padding: 16px;
  background: var(--glass-60);
  border-radius: var(--radius-md);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;

  @media (max-aspect-ratio: 1/1) {
    font-size: 13px;
  }
}

.empty-state {
  color: $text-secondary;
}

.lexicon-group {
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.group-label {
  color: $text-main;
  font-weight: 700;
}

.lexicon-row {
  color: $text-body;
}

.row-prefix {
  color: $text-secondary;
  margin-right: 0.5em;

  &--title {
    color: $text-main;
    font-weight: 700;
  }
}

.lexicon-segment {
  &:not(:last-child) {
    margin-right: 0.5em;
  }
}

.segment-tone {
  color: $text-secondary;
}

.reading-mark {
  font-size: 0.7em;
  color: $text-secondary;
  vertical-align: sub;
  font-style: italic;
}
</style>
