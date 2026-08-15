<template>
  <div class="homophone-lexicon">
    <div class="lexicon-toolbar">
      <span class="lexicon-title">{{ t('phonology.phonology.homophoneLexicon.title') }}</span>

      <div class="lexicon-actions">
        <div class="mode-switch" role="tablist" :aria-label="t('phonology.phonology.homophoneLexicon.modeLabel')">
          <button
            type="button"
            class="mode-btn"
            :class="{ 'is-active': currentMode === 'final-grouped' }"
            @click="setMode('final-grouped')"
          >
            {{ t('phonology.phonology.homophoneLexicon.modeFinalGrouped') }}
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ 'is-active': currentMode === 'syllable' }"
            @click="setMode('syllable')"
          >
            {{ t('phonology.phonology.homophoneLexicon.modeSyllable') }}
          </button>
        </div>

        <button v-if="showCopy" type="button" class="copy-btn" @click="handleCopy">
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
        <section v-for="group in groups" :key="group.label" class="lexicon-group">
          <div class="group-label">{{ group.label }}</div>
          <div v-for="row in group.rows" :key="row.key" class="lexicon-row">
            <span class="row-prefix">{{ row.prefix }}</span>
            <span class="row-chars">
              <span
                v-for="(charItem, charIndex) in row.chars"
                :key="`${row.key}-${charIndex}`"
                class="lexicon-char"
                :style="charColorStyle(charItem.label)"
              >{{ charItem.char }}</span>
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
      label: syllable,
      rows: list.map((entry) => ({
        key: `${syllable}-${entry.tone}`,
        prefix: `[${toneLabel(entry.tone)}]`,
        chars: entry.chars
      }))
    }))
  }

  const map = new Map()
  for (const entry of entries.value) {
    if (!map.has(entry.final)) map.set(entry.final, [])
    map.get(entry.final).push(entry)
  }

  return [...map.entries()].map(([final, list]) => ({
    label: final,
    rows: list.map((entry) => ({
      key: `${entry.initial}-${entry.tone}`,
      prefix: `${entry.initial} [${toneLabel(entry.tone)}]`,
      chars: entry.chars
    }))
  }))
})

const plainText = computed(() => {
  const lines = []

  for (const group of groups.value) {
    lines.push(group.label)
    for (const row of group.rows) {
      const chars = row.chars.map((c) => c.char).join(' ')
      lines.push(`${row.prefix} ${chars}`)
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

.mode-switch {
  display: inline-flex;
  padding: 2px;
  background: var(--glass-80);
  border: 1px solid var(--bg-hover-strong);
  border-radius: var(--radius-md);
}

.mode-btn {
  padding: 4px 10px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: $text-secondary;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &.is-active {
    background: var(--color-primary);
    color: var(--text-white);
  }
}

.copy-btn {
  padding: 4px 10px;
  background: var(--glass-80);
  border: 1px solid var(--bg-hover-strong);
  border-radius: var(--radius-sm);
  color: $text-main;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
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
}

.row-chars {
  display: inline;
}

.lexicon-char {
  margin-right: 0.5em;
}
</style>
