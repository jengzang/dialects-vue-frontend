<template>
  <div class="merge-tool-container">
    <div class="glass-container">
      <!-- 头部区域 -->
      <div class="header-section">
        <h2 class="title">字表合併工具</h2>
        <p class="subtitle">按統一字表合併多個方言調查表</p>
      </div>

      <!-- 步骤指示器 -->
      <div class="steps-indicator">
        <div
          class="step"
          :class="{ active: currentStep >= 1, completed: currentStep > 1 }"
          @click="currentStep > 1 && goToStep(1)"
        >
          <div class="step-number">1</div>
          <div class="step-label">參考表</div>
        </div>
        <div class="step-line" :class="{ active: currentStep >= 2 }"></div>
        <div
          class="step"
          :class="{ active: currentStep >= 2, completed: currentStep > 2 }"
          @click="currentStep > 2 && goToStep(2)"
        >
          <div class="step-number">2</div>
          <div class="step-label">待合併文件</div>
        </div>
        <div class="step-line" :class="{ active: currentStep >= 3 }"></div>
        <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
          <div class="step-number">3</div>
          <div class="step-label">合併結果</div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- 步骤1: 上传参考表 -->
        <div class="step-content" v-show="currentStep === 1">
          <h3 class="step-title">上傳參考字表</h3>
          <p class="step-desc">參考字表的列名應為“單字”/“单字”</p>

          <div
            class="upload-zone"
            :class="{ 'has-file': referenceFile }"
            @click="!referenceFile && $refs.refInput.click()"
            @dragover.prevent="dragOver1 = true"
            @dragleave.prevent="dragOver1 = false"
            @drop.prevent="handleRefDrop"
          >
            <input
              ref="refInput"
              type="file"
              accept=".xlsx,.xls"
              @change="handleRefSelect"
              style="display: none"
            />

            <template v-if="!referenceFile">
              <div class="upload-icon">📋</div>
              <div class="upload-text">點擊或拖拽上傳參考字表</div>
              <div class="upload-hint">支持 .xlsx 和 .xls 格式</div>
            </template>

            <template v-else>
              <div class="file-info-card">
                <div class="file-icon">✅</div>
                <div class="file-details">
                  <div class="file-name">{{ referenceFile.name }}</div>
                  <div class="file-meta">
                    <span>字數：{{ referenceStats.charCount }}</span>
                    <span>列數：{{ referenceStats.columnCount }}</span>
                  </div>
                </div>
                <button class="remove-btn" @click.stop="removeReference">✕</button>
              </div>
            </template>
          </div>

          <div class="step-actions">
            <button
              class="glass-button secondary"
              @click="showDefaultReference"
              :disabled="isLoadingRef"
            >
              <span class="icon">{{ isLoadingRef ? '⏳' : '👁️' }}</span>
              <span>{{ isLoadingRef ? '讀取中...' : '查看默認參考表' }}</span>
            </button>
            <button
              class="glass-button primary large"
              :disabled="!referenceFile"
              @click="nextStep"
            >
              下一步 →
            </button>
          </div>
        </div>

        <!-- 步骤2: 上传待合并文件 -->
        <div class="step-content" v-show="currentStep === 2">
          <h3 class="step-title">上傳待合併文件</h3>
          <p class="step-desc">
            僅支持「一字一音」的格式，如需格式轉換，可使用
            <button
                class="glass-button small"
                style="display: inline-block; padding: 2px 8px; margin: 0 2px; vertical-align: middle;background: #007aff;color:white"
                @click="$router.push('/explore?page=check')"
            >
              字表檢查
            </button>
            工具
          </p>

          <div
            class="upload-zone multiple"
            @click="$refs.filesInput.click()"
            @dragover.prevent="dragOver2 = true"
            @dragleave.prevent="dragOver2 = false"
            @drop.prevent="handleFilesDrop"
          >
            <input
              ref="filesInput"
              type="file"
              accept=".xlsx,.xls"
              multiple
              @change="handleFilesSelect"
              style="display: none"
            />
            <div class="upload-icon">📁</div>
            <div class="upload-text">點擊或拖拽上傳待合併文件</div>
            <div class="upload-hint">可以一次選擇多個文件</div>
          </div>

          <div class="files-list" v-if="mergeFiles.length > 0">
            <h4 class="list-title">已選擇 {{ mergeFiles.length }} 個文件：</h4>
            <div class="file-items">
              <div
                v-for="(file, index) in mergeFiles"
                :key="index"
                class="file-item"
              >
                <div class="file-item-icon">📄</div>
                <div class="file-item-name">{{ file.name }}</div>
                <button class="file-item-remove" @click="removeFile(index)">🗑️</button>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="glass-button secondary" @click="prevStep">← 上一步</button>
            <button
              class="glass-button primary large"
              :disabled="mergeFiles.length === 0"
              @click="startMerge"
            >
              開始合併
            </button>
          </div>
        </div>

        <!-- 步骤3: 合并结果 -->
        <div class="step-content" v-show="currentStep === 3">
          <!-- 处理中 -->
          <div class="processing-view" v-if="processing">
            <div class="processing-icon">
              <div class="spinner"></div>
            </div>
            <h3 class="processing-title">正在合併中...</h3>
            <p class="processing-text">{{ processingText }}</p>

            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progress + '%' }"></div>
              </div>
              <div class="progress-label">{{ progress }}%</div>
            </div>

            <div class="processing-details" v-if="mergeStats.total > 0">
              <div class="detail-item">
                <span class="label">總文件數：</span>
                <span class="value">{{ mergeStats.total }}</span>
              </div>
              <div class="detail-item">
                <span class="label">已處理：</span>
                <span class="value">{{ mergeStats.processed }}</span>
              </div>
              <div class="detail-item">
                <span class="label">成功：</span>
                <span class="value success">{{ mergeStats.success }}</span>
              </div>
            </div>
          </div>

          <!-- 完成 -->
          <div class="complete-view" v-else>
<!--            <div class="complete-icon">✅</div>-->
            <h3 class="complete-title">✅ 合併完成！</h3>
            <p class="complete-text">請在5分鐘內下載</p>

            <div class="result-summary">
<!--              <div class="summary-card">-->
<!--                <div class="summary-icon">📊</div>-->
<!--                <div class="summary-content">-->
<!--                  <div class="summary-number">{{ mergeStats.totalRows }}</div>-->
<!--                  <div class="summary-label">總行數</div>-->
<!--                </div>-->
<!--              </div>-->
              <div class="summary-card">
                <div class="summary-icon">📁</div>
                <div class="summary-content">
                  <div class="summary-number">{{ mergeStats.totalFiles }}</div>
                  <div class="summary-label">合併文件數</div>
                </div>
              </div>
<!--              <div class="summary-card">-->
<!--                <div class="summary-icon">📋</div>-->
<!--                <div class="summary-content">-->
<!--                  <div class="summary-number">{{ mergeStats.totalColumns }}</div>-->
<!--                  <div class="summary-label">總列數</div>-->
<!--                </div>-->
<!--              </div>-->
            </div>

            <div class="result-actions">
              <button class="glass-button primary large" @click="downloadMerged">
                <span class="icon">⬇️</span>
                <span>下載 merge.xlsx</span>
              </button>
              <button class="glass-button secondary" @click="reset">
                <span class="icon">🔄</span>
                <span>重新開始</span>
              </button>
            </div>

            <!-- 文件列表 -->
            <div class="merged-files-info">
              <h4 class="info-title">已合併的文件：</h4>
              <div class="merged-list custom-scrollbar">
                <div
                  v-for="(file, index) in mergedFilesList"
                  :key="index"
                  class="merged-item"
                >
                  <span class="merged-index">{{ index + 1 }}</span>
                  <span class="merged-name">{{ file.name }}</span>
                  <span class="merged-status">✓ 成功</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 默认参考表查看弹窗 -->
    <div v-if="showDefaultRefModal" class="modal-overlay" @click.self="showDefaultRefModal = false">
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title">📋 默認參考表</h3>
          <button class="close-btn" @click="showDefaultRefModal = false">✕</button>
        </div>

        <div class="modal-tabs">
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'main' }"
            @click="currentTab = 'main'"
          >
            主表 ({{ mainTableData.length }} 行)
          </button>
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'supplement' }"
            @click="currentTab = 'supplement'"
          >
            補充表 ({{ supplementTableData.length }} 行)
          </button>
        </div>

        <div class="modal-body">
          <div class="table-container custom-scrollbar">
            <!-- 主表 -->
            <table v-if="currentTab === 'main'" class="data-table">
              <thead>
                <tr>
                  <th v-for="(col, index) in mainTableHeaders" :key="index">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in displayedMainData" :key="index">
                  <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell || '' }}</td>
                </tr>
              </tbody>
            </table>

            <!-- 补充表 -->
            <table v-if="currentTab === 'supplement'" class="data-table">
              <thead>
                <tr>
                  <th v-for="(col, index) in supplementTableHeaders" :key="index">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in displayedSupplementData" :key="index">
                  <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell || '' }}</td>
                </tr>
              </tbody>
            </table>

            <div v-if="hasMoreData" class="load-more-hint">
              显示前 {{ maxDisplayRows }} 行，共 {{ currentTab === 'main' ? mainTableData.length : supplementTableData.length }} 行
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="glass-button primary" @click="downloadDefaultReference">
            <span class="icon">⬇️</span>
            <span>下載默認參考表</span>
          </button>
          <button
              class="glass-button secondary"
              @click="useDefaultReference"
              style="background: rgba(31,138,54,0.43)"
          >
            <span class="icon">✅</span>
            <span>使用此參考表</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { uploadReference, uploadFiles, executeMerge, getMergeProgress, downloadMerge } from '@/api/tools/index.js'
import { userStore } from '@/utils/store.js'
import { showSuccess, showError, showWarning, showConfirm } from '@/utils/message.js'

const router = useRouter()

const currentStep = ref(1)
const referenceFile = ref(null)
const mergeFiles = ref([])
const processing = ref(false)
const progress = ref(0)
const processingText = ref('')
const dragOver1 = ref(false)
const dragOver2 = ref(false)
const taskId = ref(null)

const refInput = ref(null)
const filesInput = ref(null)

const referenceStats = reactive({
  charCount: 0,
  columnCount: 0
})

const mergeStats = reactive({
  total: 0,
  processed: 0,
  success: 0,
  totalRows: 0,
  totalFiles: 0,
  totalColumns: 0
})

const mergedFilesList = ref([])

// 默认参考表相关
const showDefaultRefModal = ref(false)
const currentTab = ref('main')
const mainTableHeaders = ref([])
const mainTableData = ref([])
const supplementTableHeaders = ref([])
const supplementTableData = ref([])
const defaultRefWorkbook = ref(null)
const maxDisplayRows = 500 // 限制显示行数，提升性能
const isLoadingRef = ref(false)

// 计算属性：限制显示的数据量
const displayedMainData = computed(() => mainTableData.value.slice(0, maxDisplayRows))
const displayedSupplementData = computed(() => supplementTableData.value.slice(0, maxDisplayRows))
const hasMoreData = computed(() => {
  if (currentTab.value === 'main') {
    return mainTableData.value.length > maxDisplayRows
  } else {
    return supplementTableData.value.length > maxDisplayRows
  }
})

const handleRefSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    setReferenceFile(file)
  }
}

const handleRefDrop = (event) => {
  dragOver1.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    setReferenceFile(file)
  }
}

const setReferenceFile = async (file) => {
  // 检查登录状态
  if (!userStore.isAuthenticated) {
    showWarning('請先登錄')
    router.push('/auth')
    return
  }

  if (!file.name.match(/\.(xlsx|xls)$/)) {
    showError('請上傳Excel文件（.xlsx或.xls格式）')
    return
  }

  if (file.size > 3 * 1024 * 1024) {
    showError('文件大小不得超過3MB')
    return
  }

  try {
    // 上传参考表
    const data = await uploadReference(file)

    referenceFile.value = file
    taskId.value = data.task_id

    // 设置参考表信息
    referenceStats.charCount = data.char_count || 0
    referenceStats.columnCount = data.column_count || 0
  } catch (error) {
    showError('上傳失敗: ' + error.message)
  }
}

const removeReference = () => {
  referenceFile.value = null
  referenceStats.charCount = 0
  referenceStats.columnCount = 0
  if (refInput.value) {
    refInput.value.value = ''
  }
}

const handleFilesSelect = (event) => {
  const files = Array.from(event.target.files)
  addFiles(files)
}

const handleFilesDrop = (event) => {
  dragOver2.value = false
  const files = Array.from(event.dataTransfer.files)
  addFiles(files)
}

const addFiles = async (files) => {
  // 检查文件数量限制
  if (mergeFiles.value.length + files.length > 20) {
    showError(`最多只能上傳20個文件，當前已有${mergeFiles.value.length}個文件`)
    return
  }

  const validFiles = files.filter(file => file.name.match(/\.(xlsx|xls)$/))

  if (validFiles.length !== files.length) {
    showError('部分文件格式不正確，只支持 .xlsx 和 .xls 格式')
  }

  if (validFiles.length === 0) return

  // 检查文件大小
  const oversizedFiles = validFiles.filter(file => file.size > 3 * 1024 * 1024)
  if (oversizedFiles.length > 0) {
    showError(`以下文件超過3MB限制：${oversizedFiles.map(f => f.name).join(', ')}`)
    return
  }

  try {
    // 上传待合并文件
    await uploadFiles(taskId.value, validFiles)

    // 添加到文件列表
    mergeFiles.value.push(...validFiles)
  } catch (error) {
    showError('上傳失敗: ' + error.message)
  }
}

const removeFile = (index) => {
  mergeFiles.value.splice(index, 1)
}

const goToStep = (step) => {
  currentStep.value = step
}

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const startMerge = async () => {
  currentStep.value = 3
  processing.value = true
  progress.value = 0

  mergeStats.total = mergeFiles.value.length
  mergeStats.processed = 0
  mergeStats.success = 0

  try {
    // 发起合并请求
    processingText.value = '正在初始化合併...'
    await executeMerge(taskId.value)

    progress.value = 10

    // 轮询进度
    const pollInterval = setInterval(async () => {
      try {
        const progressData = await getMergeProgress(taskId.value)

        progress.value = progressData.progress || 0
        processingText.value = progressData.message || '合併中...'

        if (progressData.processed !== undefined) {
          mergeStats.processed = progressData.processed
          mergeStats.success = progressData.processed
        }

        if (progressData.status === 'completed') {
          clearInterval(pollInterval)
          progress.value = 100
          processingText.value = '完成！'

          // 设置结果统计
          mergeStats.totalRows = progressData.total_rows || 0
          mergeStats.totalFiles = mergeStats.total
          mergeStats.totalColumns = progressData.total_columns || 0
          mergedFilesList.value = mergeFiles.value.map(f => ({ name: f.name }))

          processing.value = false
        } else if (progressData.status === 'failed') {
          clearInterval(pollInterval)
          throw new Error(progressData.message || '合并失败')
        }
      } catch (error) {
        clearInterval(pollInterval)
        showError('獲取進度失敗: ' + error.message)
        reset()
      }
    }, 1000)
  } catch (error) {
    showError('合併失敗: ' + error.message)
    processing.value = false
    reset()
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const downloadMerged = async () => {
  try {
    if (!taskId.value) {
      showError('未找到任務ID')
      return
    }

    const blob = await downloadMerge(taskId.value)

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '方音圖鑑_合併字表.xlsx'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    showError('下載失敗: ' + error.message)
  }
}

// 显示默认参考表
const showDefaultReference = async () => {
  if (isLoadingRef.value) return

  isLoadingRef.value = true

  try {
    // 读取public目录中的参考表.xlsx
    const response = await fetch('/参考表.xlsx')
    const arrayBuffer = await response.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    defaultRefWorkbook.value = workbook

    // 读取主表
    if (workbook.SheetNames.includes('主表')) {
      const mainSheet = workbook.Sheets['主表']
      const mainData = XLSX.utils.sheet_to_json(mainSheet, { header: 1 })
      if (mainData.length > 0) {
        mainTableHeaders.value = mainData[0]
        mainTableData.value = mainData.slice(1)
      }
    }

    // 读取补充表
    if (workbook.SheetNames.includes('補充表')) {
      const supplementSheet = workbook.Sheets['補充表']
      const supplementData = XLSX.utils.sheet_to_json(supplementSheet, { header: 1 })
      if (supplementData.length > 0) {
        supplementTableHeaders.value = supplementData[0]
        supplementTableData.value = supplementData.slice(1)
      }
    }

    showDefaultRefModal.value = true
    currentTab.value = 'main'
  } catch (error) {
    showError('讀取默認參考表失敗: ' + error.message)
  } finally {
    isLoadingRef.value = false
  }
}

// 下载默认参考表
const downloadDefaultReference = async () => {
  try {
    const response = await fetch('/参考表.xlsx')
    const blob = await response.blob()

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '参考表.xlsx'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    showSuccess('默認參考表已下載')
  } catch (error) {
    showError('下載失敗: ' + error.message)
  }
}

// 使用默认参考表
const useDefaultReference = async () => {
  try {
    // 将workbook转为blob
    const wbout = XLSX.write(defaultRefWorkbook.value, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

    // 创建File对象
    const file = new File([blob], '参考表.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    // 使用setReferenceFile函数上传
    await setReferenceFile(file)

    showDefaultRefModal.value = false
    showSuccess('已使用默認參考表')
  } catch (error) {
    showError('使用參考表失敗: ' + error.message)
  }
}

const reset = () => {
  currentStep.value = 1
  referenceFile.value = null
  mergeFiles.value = []
  processing.value = false
  progress.value = 0
  taskId.value = null
  referenceStats.charCount = 0
  referenceStats.columnCount = 0
  mergeStats.total = 0
  mergeStats.processed = 0
  mergeStats.success = 0
  mergeStats.totalRows = 0
  mergeStats.totalFiles = 0
  mergeStats.totalColumns = 0
  mergedFilesList.value = []

  if (refInput.value) refInput.value.value = ''
  if (filesInput.value) filesInput.value.value = ''
}
</script>

<style scoped>
.merge-tool-container {
  width: 100%;
  height: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  padding-top: 60px;
}

.glass-container {
  width: min(95vw, 900px);
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 30px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  padding: 30px 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.header-section {
  text-align: center;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #0b2540;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: rgba(11, 37, 64, 0.7);
  margin: 0;
}

.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 20px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: default;
  transition: all 0.3s ease;
}

.step.completed {
  cursor: pointer;
}

.step-number {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(11, 37, 64, 0.2);
  border-radius: 50%;
  font-size: 18px;
  font-weight: 600;
  color: rgba(11, 37, 64, 0.5);
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.8), rgba(0, 122, 255, 0.6));
  border-color: rgba(0, 122, 255, 0.6);
  color: white;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.step.completed .step-number {
  background: rgba(52, 199, 89, 0.7);
  border-color: rgba(52, 199, 89, 0.6);
  color: white;
}

.step-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(11, 37, 64, 0.6);
  transition: color 0.3s ease;
}

.step.active .step-label {
  color: #0b2540;
}

.step-line {
  width: 60px;
  height: 2px;
  background: rgba(11, 37, 64, 0.2);
  transition: background 0.3s ease;
}

.step-line.active {
  background: rgba(0, 122, 255, 0.6);
}

.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-title {
  font-size: 22px;
  font-weight: 600;
  color: #0b2540;
  margin: 0;
  text-align: center;
}

.step-desc {
  font-size: 14px;
  color: rgba(11, 37, 64, 0.7);
  margin: 0;
  text-align: center;
}

.upload-zone {
  padding: 30px 40px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 2px dashed rgba(0, 122, 255, 0.3);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.upload-zone:hover {
  background: rgba(0, 122, 255, 0.05);
  border-color: rgba(0, 122, 255, 0.6);
}

.upload-zone.has-file {
  cursor: default;
  border-style: solid;
  background: rgba(52, 199, 89, 0.05);
  border-color: rgba(52, 199, 89, 0.4);
}

.upload-icon {
  font-size: 56px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.upload-text {
  font-size: 18px;
  font-weight: 500;
  color: #0b2540;
}

.upload-hint {
  font-size: 13px;
  color: rgba(11, 37, 64, 0.6);
}

.file-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
}

.file-icon {
  font-size: 36px;
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-name {
  font-size: 15px;
  font-weight: 500;
  color: #0b2540;
}

.file-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: rgba(11, 37, 64, 0.7);
}

.remove-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 59, 48, 0.2);
  border: 1px solid rgba(255, 59, 48, 0.4);
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: rgba(255, 59, 48, 0.7);
  color: white;
  transform: scale(1.1);
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-title {
  font-size: 15px;
  font-weight: 600;
  color: #0b2540;
  margin: 0;
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 16px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: rgba(255, 255, 255, 0.7);
}

.file-item-icon {
  font-size: 20px;
}

.file-item-name {
  flex: 1;
  font-size: 14px;
  color: #0b2540;
}

.file-item-remove {
  width: 28px;
  height: 28px;
  background: rgba(255, 59, 48, 0.2);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-item-remove:hover {
  background: rgba(255, 59, 48, 0.7);
  transform: scale(1.1);
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 12px;
}

.glass-button {
  padding: 12px 32px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  color: #0b2540;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

}

.glass-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.glass-button.primary {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.8), rgba(0, 122, 255, 0.6));
  color: white;
  border-color: rgba(0, 122, 255, 0.6);
}

.glass-button.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.9), rgba(0, 122, 255, 0.7));
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
  transform: translateY(-2px);
}

.glass-button.secondary {
  background: rgba(255, 255, 255, 0.5);
}

.glass-button.secondary:hover {
  background: rgba(255, 255, 255, 0.7);
}

.glass-button.large {
  padding: 14px 40px;
  font-size: 16px;
}

.processing-view,
.complete-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 15px 20px;
}

.processing-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(0, 122, 255, 0.2);
  border-top-color: rgba(0, 122, 255, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.processing-title,
.complete-title {
  font-size: 24px;
  font-weight: 600;
  color: #0b2540;
  margin: 0;
}

.processing-text,
.complete-text {
  font-size: 15px;
  color: rgba(11, 37, 64, 0.7);
  margin: 0;
}

.progress-container {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(0, 122, 255, 0.8), rgba(0, 195, 255, 0.8));
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-label {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #0b2540;
}

.processing-details {
  display: flex;
  gap: 24px;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 16px;
}

.detail-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.detail-item .label {
  color: rgba(11, 37, 64, 0.7);
}

.detail-item .value {
  font-weight: 600;
  color: #0b2540;
}

.detail-item .value.success {
  color: #34c759;
}

.complete-icon {
  font-size: 80px;
  animation: scaleIn 0.5s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.result-summary {
  display: flex;
  gap: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 28px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  min-width: 140px;
}

.summary-icon {
  font-size: 32px;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-number {
  font-size: 28px;
  font-weight: 700;
  color: #0b2540;
}

.summary-label {
  font-size: 13px;
  color: rgba(11, 37, 64, 0.7);
}

.result-actions {
  display: flex;
  gap: 16px;
}

.merged-files-info {
  width: 100%;
  max-width: 500px;
  margin-top: 16px;
}

.info-title {
  font-size: 15px;
  font-weight: 600;
  color: #0b2540;
  margin: 0 0 12px 0;
}

.merged-list {
  max-height: 150px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 16px;
}

.merged-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  margin-bottom: 8px;
  font-size: 14px;
}

.merged-item:last-child {
  margin-bottom: 0;
}

.merged-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(0, 122, 255, 0.2);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 122, 255, 0.9);
}

.merged-name {
  flex: 1;
  color: #0b2540;
}

.merged-status {
  font-size: 12px;
  color: #34c759;
  font-weight: 500;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 122, 255, 0.3);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 122, 255, 0.5);
}

/* 模态弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  width: min(95vw, 1100px);
  max-height: 80vh;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #0b2540;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #0b2540;
}

.close-btn:hover {
  background: rgba(255, 0, 0, 0.1);
  color: #ff3b30;
}

.modal-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.3);
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(11, 37, 64, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.6);
  color: #0b2540;
}

.tab-btn.active {
  background: rgba(0, 122, 255, 0.12);
  color: #007aff;
  font-weight: 600;
}

.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 0;
  min-height: 0;
}

.table-container {
  height: 100%;
  max-height: 60vh;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 28px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead {
  position: sticky;
  top: 0;
  background: rgba(0, 122, 255, 0.08);
  z-index: 10;
}

.data-table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #0b2540;
  border-bottom: 2px solid rgba(0, 122, 255, 0.2);
  white-space: nowrap;
  font-size: 13px;
}

.data-table td {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  color: rgba(11, 37, 64, 0.85);
  font-size: 13px;
}

.data-table tbody tr:hover {
  background: rgba(0, 122, 255, 0.04);
}

.load-more-hint {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: rgba(11, 37, 64, 0.5);
  background: rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  margin-top: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 28px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .glass-container {
    padding: 20px 16px;
    border-radius: 20px;
    width: 100%;
    min-height: auto;
  }


  .title {
    font-size: 22px;
  }

  .subtitle {
    font-size: 13px;
  }

  .steps-indicator {
    flex-wrap: nowrap;
    gap: 8px;
    padding: 10px;
    overflow-x: auto;
  }

  .step {
    min-width: 80px;
  }

  .step-number {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .step-label {
    font-size: 12px;
  }

  .step-line {
    width: 30px;
    min-width: 30px;
  }

  .content-area {
    padding: 16px 12px;
  }

  .step-title {
    font-size: 20px;
  }

  .step-desc {
    font-size: 13px;
  }

  .upload-zone {
    padding: 24px 20px;
    border-radius: 16px;
  }

  .upload-icon {
    font-size: 48px;
  }

  .upload-text {
    font-size: 15px;
  }

  .upload-hint {
    font-size: 12px;
  }

  .file-info-card {
    padding: 12px;
    gap: 10px;
  }

  .file-details {
    gap: 6px;
  }

  .file-name {
    font-size: 14px;
  }

  .file-meta {
    font-size: 12px;
    flex-wrap: wrap;
  }

  .files-list {
    gap: 12px;
  }

  .list-title {
    font-size: 15px;
  }

  .file-items {
    gap: 8px;
  }

  .file-item {
    padding: 10px 12px;
    gap: 10px;
  }

  .file-item-name {
    font-size: 13px;
  }

  .step-actions {
    flex-direction: column;
    gap: 10px;
    padding-top: 16px;
  }

  .glass-button ,.glass-button.large {
    width: 100%;
    justify-content: center;
    padding: 8px 24px;
  }

  .processing-icon {
    width: 80px;
    height: 80px;
  }

  .spinner {
    width: 80px;
    height: 80px;
  }

  .processing-title {
    font-size: 20px;
  }

  .processing-text {
    font-size: 14px;
  }

  .progress-bar-container {
    max-width: 100%;
  }

  .processing-details {
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
  }

  .complete-icon {
    font-size: 60px;
  }

  .complete-title {
    font-size: 22px;
  }

  .result-summary {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }

  .summary-card {
    width: 100%;
    padding: 16px;
  }

  .summary-number {
    font-size: 26px;
  }

  .summary-label {
    font-size: 13px;
  }

  .result-actions {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .merged-files-info {
    margin-top: 20px;
  }

  .info-title {
    font-size: 15px;
  }

  .merged-list {
    gap: 8px;
  }

  .merged-item {
    padding: 10px 12px;
    font-size: 13px;
  }

  /* 默认参考表模态框移动端适配 */
  .modal-overlay {
    padding: 10px;
  }

  .modal-container {
    width: 100%;
    max-width: 100vw;
    max-height: 85vh;
    border-radius: 16px;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-title {
    font-size: 18px;
  }

  .close-btn {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }

  .modal-tabs {
    padding: 10px 16px;
    gap: 6px;
    overflow-x: auto;
  }

  .tab-btn {
    padding: 8px 14px;
    font-size: 13px;
    white-space: nowrap;
  }

  .modal-body {
    padding: 0;
  }

  .table-container {
    max-height: 50vh;
    padding: 12px 16px;
  }

  .data-table {
    font-size: 11px;
  }

  .data-table th,
  .data-table td {
    padding: 6px 8px;
  }

  .load-more-hint {
    padding: 10px;
    font-size: 11px;
  }

  .modal-footer {
    padding: 12px 16px;
    flex-direction: column;
    gap: 8px;
  }

  .modal-footer .glass-button {
    width: 100%;
  }
}

/* 额外的小屏幕适配 */
@media (max-width: 480px) {
  .glass-container {
    padding: 16px 12px;
  }

  .title {
    font-size: 20px;
  }

  .steps-indicator {
    padding: 8px;
    gap: 6px;
  }

  .step-number {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .step-label {
    font-size: 11px;
  }

  .step-line {
    width: 20px;
    min-width: 20px;
  }

  .upload-zone {
    padding: 20px 16px;
  }

  .data-table {
    font-size: 10px;
  }

  .data-table th,
  .data-table td {
    padding: 4px 6px;
  }
}

</style>
