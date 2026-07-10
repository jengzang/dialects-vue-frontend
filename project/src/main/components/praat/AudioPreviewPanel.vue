<template>
  <div v-if="effectiveSegments.length > 0 || audioBlob" class="audio-preview-panel">
    <h3 class="panel-title">
      🎵 {{ t('praat.audioPreview.title') }}
      <span v-if="effectiveSegments.length > 1" class="segment-count">{{ t('praat.audioPreview.segmentCount', { count: effectiveSegments.length }) }}</span>
    </h3>

    <!-- Mode Toggle -->
    <div v-if="audioBlob && totalDuration <= 10" class="mode-selector">
      <button
        :class="{ active: mode === 'auto' }"
        @click="switchMode('auto')"
        class="mode-button">
        {{ t('praat.audioPreview.modes.auto') }}
      </button>
      <button
        :class="{ active: mode === 'manual' }"
        @click="switchMode('manual')"
        class="mode-button">
        {{ t('praat.audioPreview.modes.manual') }}
      </button>
    </div>

    <!-- Manual Mode -->
    <div v-if="mode === 'manual' && audioBlob" class="manual-mode">
      <!-- Full Waveform Section -->
      <div class="full-waveform-section">
        <div class="waveform-header">
          <h4>{{ t('praat.audioPreview.manual.fullWaveform', { duration: totalDuration.toFixed(1) }) }}</h4>
        </div>
        <div ref="fullWaveformContainer" class="full-waveform"></div>
        <p class="hint">💡 {{ t('praat.audioPreview.manual.hint') }}</p>
      </div>

      <!-- Control Buttons -->
      <div class="control-buttons">
        <button
          @click="confirmManualSegments"
          class="btn-confirm main-glass-button"
          :disabled="!selectedRegionId || isConfirming"
        >
          <span v-if="isConfirming">{{ t('praat.audioPreview.manual.processing') }}</span>
          <span v-else>✓ {{ t('praat.audioPreview.manual.confirmButton') }}</span>
        </button>
        <button @click="clearAllRegions" class="btn-clear main-glass-button">
          🗑️ {{ t('praat.audioPreview.manual.clearButton') }}
        </button>
      </div>

      <!-- Validation Messages -->
      <div v-if="validationError" class="validation-error">
        ⚠️ {{ validationError }}
      </div>

      <!-- Selected Regions List -->
      <div v-if="manualRegions.length > 0" class="regions-list">
        <h4>{{ t('praat.audioPreview.manual.candidateSegments', { count: manualRegions.length }) }}</h4>
        <div
          v-for="(region, index) in manualRegions"
          :key="region.id"
          class="region-card main-glass-panel-inner"
          :class="{ 'selected-region': selectedRegionId === region.id }"
          @click="selectRegion(region.id)"
        >
          <div class="region-header">
            <span class="region-badge" :style="{ backgroundColor: region.color }">
              {{ t('praat.audioPreview.manual.segment', { index: index + 1 }) }}
            </span>
            <span class="region-duration">{{ t('praat.audioPreview.manual.duration', { duration: region.duration.toFixed(1) }) }}</span>
            <div class="region-actions">
              <span v-if="selectedRegionId === region.id" class="selected-indicator">✓ {{ t('praat.audioPreview.manual.selected') }}</span>
              <button @click.stop="deleteRegion(region.id)" class="btn-delete">
                🗑️
              </button>
            </div>
          </div>

          <!-- Region Waveform Preview -->
          <div :ref="el => setRegionWaveformRef(region.id, el)" class="region-waveform"></div>

          <!-- Time Controls -->
          <div class="time-controls">
            <label>
              {{ t('praat.audioPreview.manual.start') }}: <input
                type="number"
                v-model.number="region.start"
                @change="updateRegionTime(region)"
                step="0.1"
                min="0"
                :max="totalDuration"
              />s
            </label>
            <label>
              {{ t('praat.audioPreview.manual.end') }}: <input
                type="number"
                v-model.number="region.end"
                @change="updateRegionTime(region)"
                step="0.1"
                min="0"
                :max="totalDuration"
              />s
            </label>
            <span class="duration-display">{{ t('praat.audioPreview.manual.duration', { duration: region.duration.toFixed(1) }) }}</span>
          </div>

          <!-- Playback Controls -->
          <div class="playback-controls">
            <button @click="togglePlayRegion(region.id)" class="control-button main-glass-button">
              {{ region.playing ? '⏸️' : '▶️' }}
            </button>
            <button @click="stopRegion(region.id)" class="control-button main-glass-button">
              ⏹️
            </button>
            <span class="time-display">
              {{ formatTime(region.currentTime) }} / {{ formatTime(region.duration) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Auto Mode (Original) -->
    <div v-else class="auto-mode">
      <div v-if="effectiveSegments.length > 1" class="info-banner">
        <span class="info-icon">ℹ️</span>
        <span>{{ t('praat.audioPreview.auto.selectHint') }}</span>
      </div>

      <div class="segments-container">
        <div
            v-for="(segment, index) in effectiveSegments"
            :key="index"
            class="segment-item"
            :class="{ 'selected': selectedIndex === index }"
            @click="selectSegment(index)"
            draggable="true"
            @dragstart="handleDragStart($event, segment)"
        >
          <div class="segment-header">
            <div class="segment-info">
              <span class="segment-number">{{ t('praat.audioPreview.auto.segment', { index: index + 1 }) }}</span>
              <span class="segment-badge" :class="`badge-${segment.origin || 'unknown'}`">
                {{ getSegmentBadgeText(segment.origin) }}
              </span>
              <span class="segment-duration">
                {{ formatTime(realDurations[index] || segment.duration || 0) }}
              </span>
              <span v-if="segment.startTime > 0" class="segment-time-range">
                ({{ formatTime(segment.startTime) }} - {{ formatTime(segment.endTime) }})
              </span>
            </div>
            <div class="segment-actions">
              <span v-if="selectedIndex === index" class="selected-badge">✓ {{ t('praat.audioPreview.auto.selected') }}</span>
              <span class="drag-hint">⋮⋮</span>
            </div>
          </div>

          <div :ref="el => waveformRefs[index] = el" class="waveform-container"></div>

          <div class="controls">
            <button class="control-button main-glass-button" @click.stop="togglePlayPause(index)">
              <span class="control-icon">{{ playingIndex === index ? '⏸' : '▶' }}</span>
            </button>

            <div class="time-display">
              <span class="current-time">{{ formatTime(currentTimes[index] || 0) }}</span>
              <span class="separator">/</span>
              <span class="duration">
                {{ formatTime(realDurations[index] || segment.duration || 0) }}
              </span>
            </div>

            <button class="control-button main-glass-button" @click.stop="stop(index)">
              <span class="control-icon">⏹</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'
import { userStore } from '@/main/store/store.js'
import { showSuccess } from '@/utils/message.js'

const props = defineProps({
  audioBlob: {
    type: Blob,
    default: null
  },
  segments: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['segment-selected', 'manual-segments-ready'])
const { t } = useI18n()

// Auto mode state
const waveformRefs = ref([])
const playingIndex = ref(-1)
const selectedIndex = ref(0)
const currentTimes = ref({})
const realDurations = ref({})
let wavesurfers = []

// Manual mode state
const mode = ref('auto')
const fullWaveformContainer = ref(null)
const fullWaveform = ref(null)
const manualRegions = ref([])
const regionWaveformRefs = ref({})
const validationError = ref('')
const totalDuration = ref(0)
const isConfirming = ref(false)
const selectedRegionId = ref(null)
let regionsPlugin = null

// Region colors
const regionColors = [
  'var(--color-success)',  // Green
  'var(--color-primary)',  // Blue
  'var(--color-warning)',  // Orange
  '#ff2d55',  // Pink
  'var(--color-purple)',  // Purple
]

const effectiveSegments = computed(() => {
  if (props.segments && props.segments.length > 0) {
    return props.segments
  } else if (props.audioBlob) {
      return [{
        blob: props.audioBlob,
        duration: 0,
        startTime: 0,
        endTime: 0,
        index: 0,
        name: t('praat.audioPreview.auto.badges.original')
      }]
  }
  return []
})

// Helper function to get segment badge text
const getSegmentBadgeText = (origin) => {
  const badges = {
    original: t('praat.audioPreview.auto.badges.original'),
    'auto-split': t('praat.audioPreview.auto.badges.autoSplit'),
    manual: t('praat.audioPreview.auto.badges.manual')
  }
  return badges[origin] || t('praat.audioPreview.auto.badges.unknown')
}

// Helper to set region waveform refs
const setRegionWaveformRef = (regionId, el) => {
  if (el) {
    regionWaveformRefs.value[regionId] = el
  }
}

// Switch between auto and manual mode
const switchMode = async (newMode) => {
  mode.value = newMode

  if (newMode === 'manual') {
    await nextTick()
    await initFullWaveform()
  } else {
    // Clean up manual mode
    if (fullWaveform.value) {
      fullWaveform.value.destroy()
      fullWaveform.value = null
    }
    manualRegions.value = []
    selectedRegionId.value = null
    validationError.value = ''

    // Reinitialize auto mode
    await initWaveSurfers()
  }
}

// Initialize full waveform for manual mode
const initFullWaveform = async () => {
  if (!fullWaveformContainer.value || !props.audioBlob) return

  // Destroy existing instance
  if (fullWaveform.value) {
    fullWaveform.value.destroy()
  }

  // Create WaveSurfer instance
  fullWaveform.value = WaveSurfer.create({
    container: fullWaveformContainer.value,
    waveColor: 'rgba(0, 122, 255, 0.3)',
    progressColor: 'var(--color-primary)',
    cursorColor: 'var(--color-primary)',
    height: 120,
    responsive: true,
    barWidth: 2,
    barGap: 1,
    barRadius: 2
  })

  // Load audio
  await fullWaveform.value.loadBlob(props.audioBlob)
  totalDuration.value = fullWaveform.value.getDuration()

  // Create regions plugin
  regionsPlugin = fullWaveform.value.registerPlugin(RegionsPlugin.create({
    dragSelection: {
      slop: 5,
      color: 'rgba(0, 122, 255, 0.2)'
    }
  }))

  // Listen for region events
  regionsPlugin.on('region-created', handleRegionCreated)
  regionsPlugin.on('region-updated', handleRegionUpdated)

  regionsPlugin.enableDragSelection({
    color: 'rgba(0, 122, 255, 0.2)'
  })
}

// Handle region created
const handleRegionCreated = async (region) => {
  const duration = region.end - region.start
  const isAdmin = userStore.role === 'admin'

  // Validate duration (管理员不受限制)
  if (duration > 10 && !isAdmin) {
    validationError.value = t('praat.audioPreview.manual.errors.durationExceeded')
    region.remove()
    return
  }

  // Check for overlaps
  if (hasOverlap(region)) {
    validationError.value = t('praat.audioPreview.manual.errors.overlap')
    region.remove()
    return
  }

  validationError.value = ''

  // Add to manual regions
  const regionData = {
    id: region.id,
    start: region.start,
    end: region.end,
    duration: duration,
    color: region.color,
    playing: false,
    currentTime: 0,
    wavesurfer: null,
    blob: null,
    region: region
  }

  manualRegions.value.push(regionData)

  // Auto-select if it's the only region
  if (manualRegions.value.length === 1) {
    selectedRegionId.value = regionData.id
  }

  // Extract audio for this region
  await nextTick()
  await initRegionWaveform(regionData)

  // Emit manual segments
  emitManualSegments()
}

// Handle region updated
const handleRegionUpdated = (region) => {
  const regionData = manualRegions.value.find(r => r.id === region.id)
  if (!regionData) return

  const duration = region.end - region.start
  const isAdmin = userStore.role === 'admin'

  // Validate duration (管理员不受限制)
  if (duration > 10 && !isAdmin) {
    validationError.value = t('praat.audioPreview.manual.errors.durationExceeded')
    region.update({ start: regionData.start, end: regionData.end })
    return
  }

  // Check for overlaps
  if (hasOverlap(region)) {
    validationError.value = t('praat.audioPreview.manual.errors.overlap')
    region.update({ start: regionData.start, end: regionData.end })
    return
  }

  validationError.value = ''

  // Update region data
  regionData.start = region.start
  regionData.end = region.end
  regionData.duration = duration

  // Re-extract audio
  initRegionWaveform(regionData)

  // Emit manual segments
  emitManualSegments()
}

// Update region time from input
const updateRegionTime = (regionData) => {
  if (regionData.start >= regionData.end) {
    validationError.value = t('praat.audioPreview.manual.errors.invalidTimeRange')
    return
  }

  const duration = regionData.end - regionData.start
  const isAdmin = userStore.role === 'admin'

  // 管理员不受 10 秒限制
  if (duration > 10 && !isAdmin) {
    validationError.value = t('praat.audioPreview.manual.errors.durationExceeded')
    return
  }

  validationError.value = ''
  regionData.duration = duration

  // Update the region on waveform
  if (regionData.region) {
    regionData.region.update({
      start: regionData.start,
      end: regionData.end
    })
  }

  // Re-extract audio
  initRegionWaveform(regionData)

  // Emit manual segments
  emitManualSegments()
}

// Check for overlaps
const hasOverlap = (newRegion) => {
  if (!regionsPlugin) return false

  const existingRegions = regionsPlugin.getRegions().filter(r => r.id !== newRegion.id)

  return existingRegions.some(region => {
    return (newRegion.start < region.end && newRegion.end > region.start)
  })
}

// Extract region audio
const extractRegionAudio = async (start, end) => {
  const audioContext = new AudioContext()
  const arrayBuffer = await props.audioBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  const sampleRate = audioBuffer.sampleRate
  const startSample = Math.floor(start * sampleRate)
  const endSample = Math.floor(end * sampleRate)
  const length = endSample - startSample

  // Create new buffer for region
  const regionBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    length,
    sampleRate
  )

  // Copy audio data
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel)
    const regionData = regionBuffer.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      regionData[i] = sourceData[startSample + i]
    }
  }

  // Convert to WAV blob
  return audioBufferToWav(regionBuffer)
}

// Convert audio buffer to WAV
const audioBufferToWav = (audioBuffer) => {
  const numberOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numberOfChannels * bytesPerSample

  const data = []
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i]
      const int16 = Math.max(-1, Math.min(1, sample)) * 0x7FFF
      data.push(int16 < 0 ? int16 + 0x10000 : int16)
    }
  }

  const dataLength = data.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  let offset = 44
  for (let i = 0; i < data.length; i++) {
    view.setInt16(offset, data[i], true)
    offset += 2
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

const writeString = (view, offset, string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

// Initialize region waveform
const initRegionWaveform = async (regionData) => {
  const container = regionWaveformRefs.value[regionData.id]
  if (!container) return

  // Destroy existing wavesurfer
  if (regionData.wavesurfer) {
    regionData.wavesurfer.destroy()
  }

  // Extract audio for this region
  const regionBlob = await extractRegionAudio(regionData.start, regionData.end)
  regionData.blob = regionBlob

  // Create WaveSurfer for region preview
  const wavesurfer = WaveSurfer.create({
    container: container,
    waveColor: 'rgba(0, 122, 255, 0.3)',
    progressColor: regionData.color,
    height: 60,
    responsive: true,
    barWidth: 2,
    barGap: 1,
    barRadius: 2
  })

  await wavesurfer.loadBlob(regionBlob)
  regionData.wavesurfer = wavesurfer

  // Setup event listeners
  wavesurfer.on('play', () => {
    regionData.playing = true
  })

  wavesurfer.on('pause', () => {
    regionData.playing = false
  })

  wavesurfer.on('finish', () => {
    regionData.playing = false
  })

  wavesurfer.on('audioprocess', () => {
    regionData.currentTime = wavesurfer.getCurrentTime()
  })
}

// Toggle play region
const togglePlayRegion = (regionId) => {
  const regionData = manualRegions.value.find(r => r.id === regionId)
  if (regionData && regionData.wavesurfer) {
    regionData.wavesurfer.playPause()
  }
}

// Stop region
const stopRegion = (regionId) => {
  const regionData = manualRegions.value.find(r => r.id === regionId)
  if (regionData && regionData.wavesurfer) {
    regionData.wavesurfer.stop()
    regionData.currentTime = 0
  }
}

// Select a region
const selectRegion = (regionId) => {
  selectedRegionId.value = regionId
  validationError.value = ''
}

// Delete region
const deleteRegion = (regionId) => {
  // Remove from WaveSurfer
  if (regionsPlugin) {
    const region = regionsPlugin.getRegions().find(r => r.id === regionId)
    if (region) {
      region.remove()
    }
  }

  // Remove from manual regions
  const index = manualRegions.value.findIndex(r => r.id === regionId)
  if (index !== -1) {
    // Destroy wavesurfer instance
    if (manualRegions.value[index].wavesurfer) {
      manualRegions.value[index].wavesurfer.destroy()
    }
    manualRegions.value.splice(index, 1)
  }

  // Clear selection if deleted region was selected
  if (selectedRegionId.value === regionId) {
    selectedRegionId.value = manualRegions.value.length > 0 ? manualRegions.value[0].id : null
  }

  validationError.value = ''

  // Emit manual segments
  emitManualSegments()
}

// Clear all regions
const clearAllRegions = () => {
  if (regionsPlugin) {
    regionsPlugin.clearRegions()
  }

  // Destroy all wavesurfer instances
  manualRegions.value.forEach(region => {
    if (region.wavesurfer) {
      region.wavesurfer.destroy()
    }
  })

  manualRegions.value = []
  selectedRegionId.value = null
  validationError.value = ''

  // Emit empty segments
  emitManualSegments()
}

// Reset to original segments
const resetToOriginal = () => {
  clearAllRegions()
  // This will trigger emitManualSegments with empty array
  // which will restore original segments in parent
}

// Confirm manual segments and switch to results view
const confirmManualSegments = async () => {
  if (!selectedRegionId.value) {
    validationError.value = t('praat.audioPreview.manual.errors.noSelection')
    return
  }

  // Get the selected region
  const selectedRegion = manualRegions.value.find(r => r.id === selectedRegionId.value)
  if (!selectedRegion) {
    validationError.value = t('praat.audioPreview.manual.errors.segmentNotFound')
    return
  }

  // Validate duration limit
  const duration = selectedRegion.end - selectedRegion.start
  const isAdmin = userStore.role === 'admin'
  if (duration > 10 && !isAdmin) {
    validationError.value = t('praat.audioPreview.manual.errors.durationExceededConfirm')
    return
  }

  isConfirming.value = true

  try {
    // Clean up manual mode UI FIRST
    if (fullWaveform.value) {
      fullWaveform.value.destroy()
      fullWaveform.value = null
    }
    manualRegions.value = []
    selectedRegionId.value = null
    validationError.value = ''

    // Switch mode to 'auto' BEFORE emitting
    mode.value = 'auto'

    // Wait for mode change to propagate
    await nextTick()

    // NOW emit the segment (watch will have correct mode)
    emitSingleManualSegment(selectedRegion)

    // Wait for parent to update and watch to trigger
    await nextTick()

    showSuccess(t('praat.audioPreview.manual.success.confirmed'))
  } finally {
    isConfirming.value = false
  }
}

// Emit single manual segment
const emitSingleManualSegment = (region) => {
  const fileName = 'manual_segment.wav'
  const file = new File([region.blob], fileName, { type: 'audio/wav' })

  const segment = {
    file: file,
    blob: region.blob,
    duration: region.duration,
    startTime: region.start,
    endTime: region.end,
    index: 0,
    name: fileName,
    origin: 'manual'
  }

  emit('manual-segments-ready', [segment])
}

// Auto segment
const autoSegment = () => {
  clearAllRegions()

  const segmentDuration = 10
  const numSegments = Math.ceil(totalDuration.value / segmentDuration)

  for (let i = 0; i < numSegments; i++) {
    const start = i * segmentDuration
    const end = Math.min((i + 1) * segmentDuration, totalDuration.value)

    regionsPlugin.addRegion({
      start: start,
      end: end,
      color: regionColors[i % regionColors.length],
      drag: true,
      resize: true
    })
  }
}

// Emit manual segments
const emitManualSegments = () => {
  if (manualRegions.value.length === 0) {
    emit('manual-segments-ready', [])
    return
  }

  // Sort regions by start time
  const sortedRegions = [...manualRegions.value].sort((a, b) => a.start - b.start)

  const segments = sortedRegions.map((region, index) => {
    const fileName = `manual_segment_${index + 1}.wav`
    const file = new File([region.blob], fileName, { type: 'audio/wav' })

    return {
      file: file,
      blob: region.blob,
      duration: region.duration,
      startTime: region.start,
      endTime: region.end,
      index: index,
      name: fileName,
      origin: 'manual'  // Tag as manual segment
    }
  })

  emit('manual-segments-ready', segments)
}

// Auto mode functions
const initWaveSurfers = async () => {
  // 销毁旧实例
  wavesurfers.forEach(ws => ws && ws.destroy())
  wavesurfers = []

  await nextTick()

  // 遍历 effectiveSegments
  effectiveSegments.value.forEach((segment, index) => {
    const container = waveformRefs.value[index]
    if (!container) return

    const wavesurfer = WaveSurfer.create({
      container: container,
      waveColor: 'rgba(0, 122, 255, 0.3)',
      progressColor: 'var(--color-primary)',
      cursorColor: 'var(--color-primary)',
      height: 60,
      responsive: true,
      barWidth: 2,
      barGap: 1,
      barRadius: 2
    })

    wavesurfer.on('play', () => {
      playingIndex.value = index
      wavesurfers.forEach((ws, i) => {
        if (i !== index && ws && ws.isPlaying()) {
          ws.pause()
        }
      })
    })

    wavesurfer.on('pause', () => {
      if (playingIndex.value === index) playingIndex.value = -1
    })

    wavesurfer.on('finish', () => {
      if (playingIndex.value === index) playingIndex.value = -1
    })

    wavesurfer.on('audioprocess', () => {
      currentTimes.value[index] = wavesurfer.getCurrentTime()
    })

    wavesurfer.on('seek', () => {
      currentTimes.value[index] = wavesurfer.getCurrentTime()
    })

    wavesurfer.on('ready', () => {
      const duration = wavesurfer.getDuration()
      realDurations.value[index] = duration

      if (!segment.duration) {
        segment.duration = duration
      }
    })

    wavesurfer.loadBlob(segment.blob)
    wavesurfers[index] = wavesurfer
  })
}

const selectSegment = (index) => {
  selectedIndex.value = index
  emit('segment-selected', effectiveSegments.value[index])
}

const togglePlayPause = (index) => {
  const wavesurfer = wavesurfers[index]
  if (wavesurfer) wavesurfer.playPause()
}

const stop = (index) => {
  const wavesurfer = wavesurfers[index]
  if (wavesurfer) {
    wavesurfer.stop()
    currentTimes.value[index] = 0
  }
}

const handleDragStart = (event, segment) => {
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'audio-segment',
    segment: {
      name: segment.name,
      duration: segment.duration,
      index: segment.index
    }
  }))
  if (segment.file && event.dataTransfer.items) {
    event.dataTransfer.items.add(segment.file)
  }
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

watch(effectiveSegments, async (newSegments) => {
  if (newSegments.length > 0 && mode.value === 'auto') {
    await initWaveSurfers()
    // Auto-select first manual segment, or first segment if no manual
    const manualIndex = newSegments.findIndex(s => s.origin === 'manual')
    selectSegment(manualIndex >= 0 ? manualIndex : 0)
  }
})

onMounted(async () => {
  if (effectiveSegments.value.length > 0) {
    await initWaveSurfers()
    selectSegment(0)
  }
})

onBeforeUnmount(() => {
  wavesurfers.forEach(ws => ws && ws.destroy())
  if (fullWaveform.value) {
    fullWaveform.value.destroy()
  }
  manualRegions.value.forEach(region => {
    if (region.wavesurfer) {
      region.wavesurfer.destroy()
    }
  })
})
</script>


$primary: var(--color-primary);
$error: var(--color-error);
$text-primary: var(--color-text-primary);
$text-secondary: var(--color-text-secondary);
$white: #fff;

$success: var(--color-success);
$warning: var(--color-warning);
$gray: #8e8e93;

$primary-background: rgba(0, 122, 255, 0.05);
$primary-background-medium: rgba(0, 122, 255, 0.1);
$primary-border: rgba(0, 122, 255, 0.3);
$primary-shadow: rgba(0, 122, 255, 0.2);

$error-background: rgba(255, 59, 48, 0.1);
$error-border: rgba(255, 59, 48, 0.3);

$surface-medium: rgba(255, 255, 255, 0.5);
$surface-strong: rgba(255, 255, 255, 0.7);
$surface-hover: rgba(255, 255, 255, 0.8);

$transition-normal: 0.3s;

@mixin selected-card {
  background: $primary-background;
  border-color: $primary;
  box-shadow: 0 4px 16px $primary-shadow;
}

.audio-preview-panel {
  padding: 1.25rem;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: $text-primary;
  text-align: center;
  font-size: 1rem;
  font-weight: 600;

  .segment-count {
    color: $text-secondary;
    font-size: 0.85rem;
    font-weight: 500;
  }
}

/* 模式切换 */
.mode-selector {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.mode-button {
  flex: 1;
  padding: 0.5rem 1rem;
  background: $surface-medium;
  border: 2px solid var(--glass-40);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background $transition-normal ease,
    border-color $transition-normal ease,
    color $transition-normal ease,
    transform $transition-normal ease;

  &.active {
    background: $primary;
    border-color: $primary;
    color: $white;
  }

  &:hover:not(.active) {
    background: $surface-strong;
    transform: translateY(-1px);
  }
}

/* 自动分段模式 */
.info-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: $primary-background-medium;
  border: 1px solid $primary-border;
  border-radius: var(--radius-md);
  color: $primary;
  font-size: 0.85rem;

  .info-icon {
    flex-shrink: 0;
    font-size: 1.1rem;
  }
}

.segments-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  padding-right: 0.25rem;
  overflow-y: auto;
}

.segment-item {
  padding: 0.75rem;
  background: $surface-medium;
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    background $transition-normal ease,
    border-color $transition-normal ease,
    box-shadow $transition-normal ease;

  &.selected {
    @include selected-card;
  }

  &:hover {
    .drag-hint {
      opacity: 1;
    }
  }

  &:active {
    .drag-hint {
      cursor: grabbing;
    }
  }
}

.segment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.segment-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;

  .segment-number {
    color: $text-primary;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .segment-duration {
    color: $primary;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .segment-time-range {
    color: $text-secondary;
    font-size: 0.75rem;
  }
}

.segment-badge {
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-sm);
  color: $white;
  font-size: 0.7rem;
  font-weight: 600;

  &.badge-original {
    background: $success;
  }

  &.badge-auto-split {
    background: var(--color-primary);
  }

  &.badge-manual {
    background: $warning;
  }

  &.badge-unknown {
    background: $gray;
  }
}

.segment-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .selected-badge {
    padding: 0.25rem 0.5rem;
    background: $primary;
    border-radius: var(--radius-sm);
    color: $white;
    white-space: nowrap;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .drag-hint {
    opacity: 0.5;
    color: $text-secondary;
    font-size: 1.2rem;
    cursor: grab;
    transition: opacity $transition-normal ease;
  }
}

.waveform-container {
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: $surface-medium;
  border-radius: var(--radius-md);
}

.controls,
.playback-controls {
  display: flex;
  align-items: center;
  justify-content: center;
}

.controls {
  gap: 0.75rem;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: rgba(255, 255, 255, 0.6);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition:
    background $transition-normal ease,
    transform $transition-normal ease;

  &:hover {
    background: $surface-hover;
    transform: scale(1.1);
  }

  .control-icon {
    font-size: 1rem;
  }
}

.time-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-width: 70px;
  color: $text-primary;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;

  .separator {
    color: $text-secondary;
  }
}

/* 手动分段模式 */
.manual-mode {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.full-waveform-section {
  padding: 1rem;
  background: $surface-medium;
  border-radius: var(--radius-lg);
}

.waveform-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;

  h4 {
    margin: 0;
    color: $text-primary;
    font-size: 0.9rem;
    font-weight: 600;
  }
}

.full-waveform {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: $surface-strong;
  border-radius: var(--radius-md);
}

.hint {
  margin: 0.5rem 0 0;
  color: $text-secondary;
  text-align: center;
  font-size: 0.8rem;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;

  button {
    flex: 1;
    padding: 0.6rem 1rem;
    border: none;
    font-size: 0.85rem;
    cursor: pointer;
    transition:
      background $transition-normal ease,
      box-shadow $transition-normal ease,
      opacity $transition-normal ease,
      transform $transition-normal ease;
  }
}

.btn-confirm {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: $white;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #45a049, #3d8b40);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

.btn-clear {
  background: $error;
  color: $white;

  &:hover {
    background: #cc0000;
    transform: translateY(-2px);
  }
}

.validation-error {
  padding: 0.75rem;
  background: $error-background;
  border: 1px solid $error-border;
  border-radius: var(--radius-md);
  color: $error;
  text-align: center;
  font-size: 0.85rem;
}

.regions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 20rem;
  overflow-y: auto;

  > h4 {
    margin: 0 0 0.5rem;
    color: $text-primary;
    text-align: center;
    font-size: 0.9rem;
    font-weight: 600;
  }
}

.region-card {
  padding: 0.75rem;
  background: $surface-medium;
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    background $transition-normal ease,
    border-color $transition-normal ease,
    box-shadow $transition-normal ease,
    transform $transition-normal ease;

  &:hover {
    background: $surface-strong;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &.selected-region {
    @include selected-card;
  }
}

.region-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;

  .region-badge {
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-sm);
    color: $white;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .region-duration {
    color: $text-secondary;
    font-size: 0.85rem;
    font-weight: 500;
  }
}

.region-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .selected-indicator {
    padding: 0.25rem 0.5rem;
    background: $primary;
    border-radius: var(--radius-sm);
    color: $white;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .btn-delete {
    padding: 0.25rem 0.5rem;
    background: $error-background;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 1rem;
    cursor: pointer;
    transition:
      background $transition-normal ease,
      transform $transition-normal ease;

    &:hover {
      background: $error;
      transform: scale(1.1);
    }
  }
}

.region-waveform {
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: $surface-strong;
  border-radius: var(--radius-md);
}

.time-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: $text-primary;
    font-size: 0.8rem;
  }

  input {
    width: 60px;
    padding: 0.25rem 0.5rem;
    background: $surface-strong;
    border: 1px solid var(--glass-40);
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
  }

  .duration-display {
    margin-left: auto;
    color: $text-secondary;
    font-size: 0.8rem;
  }
}

.playback-controls {
  gap: 0.5rem;

  .control-button {
    width: 2rem;
    height: 2rem;
    border: 1px solid rgba(128, 128, 128, 0.51);
    border-radius: 50%;
    font-size: 0.9rem;
  }

  .time-display {
    min-width: 80px;
    font-size: 0.75rem;
  }
}

@media (max-aspect-ratio: 1/1) {
  .audio-preview-panel {
    padding: 0.5rem;
  }

  .manual-mode {
    gap: 0.5rem;
  }
}

