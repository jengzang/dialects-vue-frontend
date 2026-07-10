<template>
  <div class="audio-input-panel main-glass-panel">
<!--    <h2 class="panel-title">音頻輸入</h2>-->

    <!-- File Upload Area -->
    <div
      class="upload-area"
      :class="{ 'drag-over': isDragOver }"
      @drop="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @click="triggerFileInput"
    >
      <div class="upload-icon">🎵</div>
      <p class="upload-text">{{ t('praat.audioInput.upload.text') }}</p>
      <p class="upload-hint">{{ t('praat.audioInput.upload.hint') }}</p>
      <input
        ref="fileInput"
        type="file"
        accept="audio/*"
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <!-- Recording Controls -->
    <div class="recording-section">
      <div class="recording-row">
        <div class="divider-inline">
          <span>{{ t('praat.audioInput.recording.or') }}</span>
        </div>

        <button
          class="record-button main-glass-button"
          :class="{ 'recording': isRecording }"
          @click="toggleRecording"
          :disabled="isProcessing"
        >
          <span class="record-icon">{{ isRecording ? '⏹' : '🎤' }}</span>
          <span>{{ isRecording ? t('praat.audioInput.recording.stop') : t('praat.audioInput.recording.start') }}</span>
        </button>
      </div>

      <div v-if="isRecording" class="recording-timer">
        {{ t('praat.audioInput.recording.timer', { time: recordingTime }) }}
      </div>
    </div>

    <!-- Selected File Info -->
    <div v-if="displayFile" class="file-info main-glass-panel-inner">
      <div class="file-details">
        <span class="file-name">📁 {{ displayFile.name }}</span>
        <span class="file-size">{{ formatFileSize(displayFile.size) }}</span>
      </div>
      <button class="clear-button" @click="clearFile">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { PRAAT_AUDIO_LIMITS } from '@/main/config/constants.js'
import { showError } from '@/utils/message.js'

const props = defineProps({
  selectedSegment: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['file-selected', 'segments-ready', 'clear-selection'])
const { t } = useI18n()

const isDragOver = ref(false)
const isRecording = ref(false)
const isProcessing = ref(false)
const selectedFile = ref(null)
const recordingTime = ref(0)
const fileInput = ref(null)

// Computed property for display file (priority: selectedSegment > local selectedFile)
const displayFile = computed(() => {
  if (props.selectedSegment && props.selectedSegment.file) {
    return props.selectedSegment.file
  }
  return selectedFile.value
})

let mediaRecorder = null
let audioChunks = []
let recordingTimer = null
let mediaStream = null

const SUPPORTED_FORMATS = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/x-m4a', 'audio/flac', 'audio/aac', 'audio/x-aac']

const validateFile = (file) => {
  if (file.size > PRAAT_AUDIO_LIMITS.MAX_FILE_SIZE) {
    showError(t('praat.audioInput.errors.fileSizeExceeded'))
    return false
  }

  const fileType = file.type || ''
  const fileExt = file.name.split('.').pop().toLowerCase()
  const isSupported = SUPPORTED_FORMATS.some(format => fileType.includes(format.split('/')[1])) ||
                      ['wav', 'mp3', 'ogg', 'webm', 'm4a', 'flac', 'aac'].includes(fileExt)

  if (!isSupported) {
    showError(t('praat.audioInput.errors.unsupportedFormat'))
    return false
  }

  return true
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false

  const file = event.dataTransfer.files[0]
  if (file && validateFile(file)) {
    processFile(file)
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file && validateFile(file)) {
    processFile(file)
  }
}

const processFile = async (file) => {
  selectedFile.value = file
  isProcessing.value = true

  try {
    // Check audio duration and split if necessary
    const segments = await checkAndSplitAudio(file)

    if (segments.length === 1) {
      // Single segment, emit as before
      const blob = new Blob([file], { type: file.type })
      const duration = segments[0]?.duration ?? 0
      emit('file-selected', {
        file,
        blob,
        duration: duration,
        origin: 'original'
      })
    } else {
      // Multiple segments, emit segments array
      emit('segments-ready', segments)
    }
  } catch (error) {
    console.error('Process file error:', error)
    showError(t('praat.audioInput.errors.processingFailed', { error: error.message }))
  } finally {
    isProcessing.value = false
  }
}

const checkAndSplitAudio = async (file) => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const fileReader = new FileReader()

    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        const duration = audioBuffer.duration

        if (duration <= PRAAT_AUDIO_LIMITS.MAX_SEGMENT_DURATION) {
          // No splitting needed
          resolve([{
            file: file,
            blob: new Blob([file], { type: file.type }),
            duration: duration,
            startTime: 0,
            endTime: duration,
            index: 0,
            name: file.name,
            origin: 'original'  // Tag as original segment
          }])
        } else {
          // Split into segments
          const segments = await splitAudioBuffer(audioBuffer, file)
          resolve(segments)
        }

        audioContext.close()
      } catch (error) {
        audioContext.close()
        reject(error)
      }
    }

    fileReader.onerror = () => {
      reject(new Error(t('praat.audioInput.errors.readFailed')))
    }

    fileReader.readAsArrayBuffer(file)
  })
}

const splitAudioBuffer = async (audioBuffer, originalFile) => {
  const duration = audioBuffer.duration
  const sampleRate = audioBuffer.sampleRate
  const numberOfChannels = audioBuffer.numberOfChannels
  const segmentDuration = PRAAT_AUDIO_LIMITS.MAX_SEGMENT_DURATION
  const numSegments = Math.ceil(duration / segmentDuration)
  const segments = []

  for (let i = 0; i < numSegments; i++) {
    const startTime = i * segmentDuration
    const endTime = Math.min((i + 1) * segmentDuration, duration)
    const segmentLength = Math.floor((endTime - startTime) * sampleRate)
    const startOffset = Math.floor(startTime * sampleRate)

    // Create new audio buffer for segment
    const segmentBuffer = new AudioContext().createBuffer(
      numberOfChannels,
      segmentLength,
      sampleRate
    )

    // Copy audio data for each channel
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel)
      const segmentData = segmentBuffer.getChannelData(channel)
      for (let j = 0; j < segmentLength; j++) {
        segmentData[j] = sourceData[startOffset + j]
      }
    }

    // Convert buffer to WAV blob
    const blob = await audioBufferToWav(segmentBuffer)
    const fileName = `${originalFile.name.replace(/\.[^/.]+$/, '')}_segment_${i + 1}.wav`
    const file = new File([blob], fileName, { type: 'audio/wav' })

    segments.push({
      file: file,
      blob: blob,
      duration: endTime - startTime,
      startTime: startTime,
      endTime: endTime,
      index: i,
      name: fileName,
      origin: 'auto-split'  // Tag as auto-split segment
    })
  }

  return segments
}

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
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, format, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  // Write audio data
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

const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

const startRecording = async () => {
  try {
    isProcessing.value = true
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/ogg;codecs=opus'

    mediaRecorder = new MediaRecorder(mediaStream, { mimeType })
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: mimeType })
      const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: mimeType })
      selectedFile.value = audioFile

      // Check and split recorded audio
      try {
        const segments = await checkAndSplitAudio(audioFile)
        if (segments.length === 1) {
          emit('file-selected', {
            file: audioFile,
            blob: audioBlob,
            duration: segments[0]?.duration ?? 0,
            origin: 'original'
          })
        } else {
          emit('segments-ready', segments)
        }
      } catch (error) {
        console.error('Process recording error:', error)
        emit('file-selected', {
          file: audioFile,
          blob: audioBlob,
          duration: 0,
          origin: 'original'
        })
      }

      cleanupRecording()
    }

    mediaRecorder.start()
    isRecording.value = true
    isProcessing.value = false
    recordingTime.value = 0

    recordingTimer = setInterval(() => {
      recordingTime.value++
      if (recordingTime.value >= PRAAT_AUDIO_LIMITS.MAX_RECORDING_TIME) {
        stopRecording()
      }
    }, 1000)
  } catch (error) {
    console.error('Recording error:', error)
    showError(t('praat.audioInput.errors.microphoneAccessDenied'))
    isProcessing.value = false
  }
}

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  isRecording.value = false
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
}

const cleanupRecording = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
}

const clearFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  emit('clear-selection')
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

onBeforeUnmount(() => {
  if (isRecording.value) {
    stopRecording()
  }
  cleanupRecording()
})
</script>

<style scoped lang="scss">
$text-primary: var(--color-text-primary);
$text-secondary: var(--color-text-secondary);
$error-color: var(--color-error);
$white: var(--text-white);

$transition-duration: 0.3s;

.audio-input-panel {
  max-width: 800px;
  margin-bottom: 1.5rem;
  padding: 1rem 5rem;
}

.upload-area {
  padding: 1rem 2rem;
  background: var(--glass-30);
  border: 2px dashed var(--glass-40);
  border-radius: var(--radius-xl);
  text-align: center;
  cursor: pointer;
  transition:
    background $transition-duration ease,
    border-color $transition-duration ease,
    transform $transition-duration ease;

  &:hover,
  &.drag-over {
    background: var(--glass-60);
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }

  .upload-icon {
    margin-bottom: 0.5rem;
    font-size: 3rem;
  }

  .upload-text {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    color: $text-primary;
    font-size: 1.1rem;
  }

  .upload-hint {
    margin: 0;
    color: $text-secondary;
    font-size: 0.9rem;
  }
}

.recording-section {
  margin-top: 1.5rem;
}

.recording-row {
  display: flex;
  align-items: center;
  gap: 1rem;

  .divider-inline {
    flex-shrink: 0;
    padding: 0.5rem 1rem;
    background: var(--glass-30);
    border-radius: var(--radius-md);
    color: $text-secondary;
    font-size: 0.9rem;
  }

  .record-button {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    border: none;
    font-size: 1rem;
    cursor: pointer;

    &.recording {
      background: $error-color;
      color: $white;

      &:hover {
        background: $error-color;
      }
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .record-icon {
      font-size: 1.5rem;
    }
  }
}

.recording-timer {
  margin-top: 1rem;
  color: $error-color;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding: 0.8rem;

  .file-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .file-name {
    color: $text-primary;
    font-size: 15px;
    font-weight: 500;
  }

  .file-size {
    color: $text-secondary;
    font-size: 0.9rem;
  }

  .clear-button {
    padding: 0.5rem 0.75rem;
    background: var(--glass-30);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition:
      background $transition-duration ease,
      color $transition-duration ease,
      transform $transition-duration ease;

    &:hover {
      background: $error-color;
      color: $white;
      transform: scale(1.1);
    }
  }
}

@media (max-aspect-ratio: 1/1) {
  .audio-input-panel {
    padding: 1rem;
  }
}
</style>
