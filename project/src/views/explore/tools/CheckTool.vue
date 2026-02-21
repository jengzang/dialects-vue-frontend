<template>
  <div class="check-tool-container">
    <!-- 欢迎屏幕 -->
    <div v-if="!fileUploaded" class="welcome-screen">
      <div class="glass-container welcome-card">
        <div class="welcome-icon">📋</div>
        <h2 class="title">方言字表檢查工具</h2>
<!--        <p class="subtitle">上傳文件開始檢查和編輯</p>-->

        <div class="welcome-features">
          <div class="feature-item">
            <span class="feature-icon">✓</span>
            <span>自動檢測非單字、異常音標、缺聲調</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✓</span>
            <span>支持批量編輯以及指令編輯</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✓</span>
            <span>單元格點擊編輯，快速修復</span>
          </div>
        </div>

        <div class="format-selector">
          <div class="format-label-row">
            <label class="format-label">文件格式：</label>
            <button class="glass-button small" @click="showFormatHelpModal = true">
              📋 說明
            </button>
          </div>
          <div class="format-options">
            <label class="format-option">
              <input type="radio" name="format" value="音典" v-model="selectedFormat" />
              <span>一字一音(音典)</span>
            </label>
            <label class="format-option">
              <input type="radio" name="format" value="跳跳老鼠" v-model="selectedFormat" />
              <span>一音多字</span>
            </label>
            <label class="format-option">
              <input type="radio" name="format" value="縣志" v-model="selectedFormat" />
              <span>縣志</span>
            </label>
            <label class="format-option">
              <input type="radio" name="script" :value="false" v-model="isSimplified" />
              <span>繁體(推薦)</span>
            </label>
            <label class="format-option">
              <input type="radio" name="script" :value="true" v-model="isSimplified" />
              <span>简体(簡轉繁,會更改字表)</span>
            </label>
          </div>
        </div>

        <input
          type="file"
          ref="fileInput"
          accept=".xlsx,.xls,.doc,.docx,.tsv"
          @change="handleFileUpload"
          style="display: none"
        />
        <div
          class="upload-zone-drop"
          :class="{ 'drag-over': isDragOver, 'uploading': isUploading }"
          @click="!isUploading && $refs.fileInput.click()"
          @dragover.prevent="!isUploading && (isDragOver = true)"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="!isUploading && handleDrop($event)"
        >
          <template v-if="!isUploading">
            <div class="upload-icon-large">📄</div>
            <h3 class="upload-text">點擊或拖拽文件到此處</h3>
            <p class="hint-text">支持 .xlsx, .xls, .doc, .docx, .tsv 格式</p>
          </template>
          <template v-else>
            <div class="loading-spinner"></div>
            <h3 class="upload-text">上傳中...</h3>
            <p class="hint-text">請稍候，正在處理文件</p>
          </template>
        </div>
      </div>
    </div>

    <!-- 工作区域 -->
    <div v-else class="work-area">
      <!-- 侧边栏 -->
      <aside v-if="!isPortrait" class="sidebar glass-panel" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <h3>📋 邊欄</h3>
          <button class="glass-button small" @click="toggleShowAll">
            {{ showingAll ? '👁️ 只顯示錯誤' : '👁️ 顯示全部' }}
          </button>
          <button class="collapse-btn" @click="toggleSidebar">
            {{ sidebarCollapsed ? '▶' : '◀' }}
          </button>
        </div>

        <div v-if="!sidebarCollapsed" class="sidebar-content custom-scrollbar">
          <!-- 错误统计卡片 -->
          <div class="sidebar-section" :class="{ collapsed: !errorStatsExpanded }">
            <div class="section-header" @click="toggleErrorStats">
              <span class="section-title">🔍 錯誤列表</span>
              <span class="toggle-icon">{{ errorStatsExpanded ? '▼' : '▶' }}</span>
            </div>

            <div v-show="errorStatsExpanded" class="section-content">
              <!-- 错误统计 -->
              <div class="error-stats">
                <div
                  v-for="(config, key) in errorStatsConfig"
                  :key="key"
                  v-show="errorStats[key] > 0"
                  class="stat-item"
                  :class="config.type"
                  @click="filterErrors(key)"
                >
                  <span class="badge">{{ config.icon }}</span>
                  <span class="label">{{ config.label }}</span>
                  <span class="count">{{ errorStats[key] }}</span>
                </div>
              </div>

              <!-- 搜索框 -->
              <div class="filter-section">
                <input
                  v-model="searchQuery"
                  type="text"
                  class="glass-input search-input"
                  placeholder="🔍 搜索漢字..."
                  @input="handleSearch"
                />
                <button class="glass-button small" @click="resetFilter">清除篩選</button>
              </div>

              <!-- 错误列表 -->
              <div class="error-list">
                <div
                  v-for="error in displayedErrors.slice(0, 50)"
                  :key="error.row"
                  class="error-item"
                  @click="jumpToRow(error.row)"
                >
                  <div class="error-row-num">行 {{ error.row }}</div>
                  <div class="error-char">{{ error.value || error.char || '' }}</div>
                  <div class="error-type-badge" :class="error.error_type || error.type">
                    {{ getErrorTypeLabel(error.error_type || error.type) }}
                  </div>
                </div>
                <div v-if="displayedErrors.length > 50" class="error-more">
                  還有 {{ displayedErrors.length - 50 }} 個錯誤...
                </div>
              </div>
            </div>
          </div>

          <!-- 调值统计卡片 -->
          <div class="sidebar-section" :class="{ collapsed: !toneStatsExpanded }">
            <div class="section-header" @click="toggleToneStats">
              <span class="section-title">📊 調值統計</span>
              <span class="toggle-icon">{{ toneStatsExpanded ? '▼' : '▶' }}</span>
            </div>

            <div v-show="toneStatsExpanded" class="section-content">
              <div v-if="toneStats" class="tone-stats-content">
                <!-- 入声调 -->
                <div v-if="Object.keys(toneStats.ru_tones).length > 0" class="tone-section">
                  <div class="tone-section-title ru">入聲調</div>
                  <div
                    v-for="([tone, info], index) in sortedRuTones"
                    :key="'ru-' + index"
                    class="tone-item ru"
                    @click="showAllChars(tone, info, '入声')"
                  >
                    <div class="tone-header">
                      <span class="tone-value">{{ tone }}</span>
                      <span class="tone-count">{{ info.count }}字{{ info.count > info.chars.length ? ' 👁️' : '' }}</span>
                    </div>
                    <div class="tone-chars">
                      {{ info.chars.join(' ') }}{{ info.count > info.chars.length ? '...' : '' }}
                    </div>
                  </div>
                </div>

                <!-- 舒声调 -->
                <div v-if="Object.keys(toneStats.shu_tones).length > 0" class="tone-section">
                  <div class="tone-section-title shu">舒聲調</div>
                  <div
                    v-for="([tone, info], index) in sortedShuTones"
                    :key="'shu-' + index"
                    class="tone-item shu"
                    @click="showAllChars(tone, info, '舒声')"
                  >
                    <div class="tone-header">
                      <span class="tone-value">{{ tone }}</span>
                      <span class="tone-count">{{ info.count }}字{{ info.count > info.chars.length ? ' 👁️' : '' }}</span>
                    </div>
                    <div class="tone-chars">
                      {{ info.chars.join(' ') }}{{ info.count > info.chars.length ? '...' : '' }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                暫無調值統計
              </div>
            </div>
          </div>

          <!-- 声韵统计卡片 -->
          <div class="sidebar-section" :class="{ collapsed: !onsetRimeStatsExpanded }">
            <div class="section-header" @click="toggleOnsetRimeStats">
              <span class="section-title">🔤 聲韻統計</span>
              <span class="toggle-icon">{{ onsetRimeStatsExpanded ? '▼' : '▶' }}</span>
            </div>

            <div v-show="onsetRimeStatsExpanded" class="section-content">
              <div v-if="onsetStats.length > 0 || rimeStats.length > 0" class="onset-rime-stats-content">
                <!-- 声母统计 -->
                <div v-if="onsetStats.length > 0" class="onset-rime-section">
                  <div class="onset-rime-section-title">聲母</div>
                  <div class="onset-rime-items">
                    <div
                      v-for="(item, index) in onsetStats"
                      :key="'onset-' + index"
                      class="onset-rime-item"
                      :class="{ 'filtered': isOnsetFiltered(item.value) }"
                      @click="filterByOnset(item.value)"
                    >
                      <span class="onset-rime-value">{{ item.value || '(空)' }}</span>
                      <span class="onset-rime-count">{{ item.count }}</span>
                    </div>
                  </div>
                </div>

                <!-- 韵母统计 -->
                <div v-if="rimeStats.length > 0" class="onset-rime-section">
                  <div class="onset-rime-section-title">韻母</div>
                  <div class="onset-rime-items">
                    <div
                      v-for="(item, index) in rimeStats"
                      :key="'rime-' + index"
                      class="onset-rime-item"
                      :class="{ 'filtered': isRimeFiltered(item.value) }"
                      @click="filterByRime(item.value)"
                    >
                      <span class="onset-rime-value">{{ item.value || '(空)' }}</span>
                      <span class="onset-rime-count">{{ item.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                暫無聲韻統計
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 主工作区 -->
      <main class="main-work-area">
        <!-- 文件信息栏 -->
        <div class="file-info-bar glass-panel">
          <div class="file-info-left">
            <span class="file-name">📁 {{ fileName }}</span>
            <span class="file-rows">{{ totalRows }} 行</span>
          </div>
          <button v-if="!isPortrait" class="glass-button secondary small" @click="resetUpload">更換文件</button>
          <button v-if="!isPortrait" class="glass-button small" @click="showHelpModal = true">
            ❓ 幫助
          </button>
          <!-- 模式切换 -->
          <div class="mode-tabs glass-panel">
            <button
                class="tab-btn"
                :class="{ active: currentMode === 'table' }"
                @click="switchMode('table')"
            >
              📊 表格視圖
            </button>
            <button
                class="tab-btn"
                :class="{ active: currentMode === 'command' }"
                @click="switchMode('command')"
            >
              💻 指令模式
            </button>
          </div>
        </div>



        <!-- 表格视图 -->
        <div v-show="currentMode === 'table'" class="table-view">
          <!-- 工具栏 -->
          <div class="table-toolbar glass-panel">
            <div class="table-stats">
              <span>錯誤數：<strong>{{ errorStats.total }}</strong></span>
              <span class="ml-2">待保存：<strong>{{ totalPendingChanges }}</strong></span>
              <span v-if="isEditMode" class="edit-hint">💡 單擊單元格編輯</span>
            </div>
            <div class="table-actions">
              <button
                class="glass-button small"
                :class="{ active: isEditMode }"
                @click="toggleEditMode"
              >
                {{ isEditMode ? '👁️ 退出編輯' : '✏️ 進入編輯' }}
              </button>
              <button
                v-show="isEditMode"
                class="glass-button small primary"
                :disabled="totalPendingChanges === 0"
                @click="batchSave"
              >
                💾 保存修改 ({{ totalPendingChanges }})
              </button>
              <button
                v-show="isEditMode"
                class="glass-button small"
                @click="cancelEdit"
              >
                ❌ 取消
              </button>
              <button v-show="!isEditMode" class="glass-button small" @click="showBatchReplaceModal = true">
                🔄 批量替換
              </button>
              <button v-show="!isEditMode" class="glass-button small" @click="downloadFile">
                ⬇️ 下載
              </button>
            </div>
          </div>

          <!-- 表格 -->
          <div class="table-container glass-panel" :class="{ 'loading': isLoadingTable || isEditModeLoading }">
            <div v-if="isLoadingTable || isEditModeLoading " class="table-loading-overlay">
              <div class="table-loading-spinner"></div>
              <div class="table-loading-text">加載中...</div>
            </div>

            <!-- Fixed Header -->
            <div class="virtual-table-header" :style="{ gridTemplateColumns: isEditMode ? '60px 80px 90px 80px 80px 80px 1fr 80px' : '60px 80px 90px 80px 80px 80px 1fr' }">
              <div class="header-cell">行</div>
              <div class="header-cell">漢字</div>
              <div class="header-cell">音標</div>
              <div
                class="header-cell filterable-header"
                @click="openFilterModal('onset')"
                :class="{ 'filtered': filterOnset.size > 0 }"
              >
                聲母{{ getFilterDisplayText('onset') }}
              </div>
              <div
                class="header-cell filterable-header"
                @click="openFilterModal('rime')"
                :class="{ 'filtered': filterRime.size > 0 }"
              >
                韻母{{ getFilterDisplayText('rime') }}
              </div>
              <div
                class="header-cell filterable-header"
                @click="openFilterModal('tone')"
                :class="{ 'filtered': filterTone.size > 0 }"
              >
                聲調{{ getFilterDisplayText('tone') }}
              </div>
              <div class="header-cell">解釋</div>
              <div v-show="isEditMode" class="header-cell">操作</div>
            </div>

            <!-- Virtual Scroller Body -->
            <RecycleScroller
              v-slot="{ item: row }"
              :items="displayedTableData"
              :item-size="40"
              :buffer="200"
              key-field="row"
              :key="`scroller-${showingAll}-${filterOnset.size}-${filterRime.size}-${filterTone.size}`"
              class="virtual-table-scroller custom-scrollbar"
            >
              <div
                class="virtual-table-row"
                :style="{ gridTemplateColumns: isEditMode ? '60px 80px 90px 80px 80px 80px 1fr 80px' : '60px 80px 90px 80px 80px 80px 1fr' }"
                :data-row="row.row"
                :class="{
                  'modified-row': pendingChanges.has(row.row),
                  'marked-for-delete': rowsToDelete.has(row.row)
                }"
              >
                <div class="cell cell-row">{{ row.row }}</div>

                <div
                  class="cell cell-char"
                  :class="{
                    'error-cell': row.errors?.includes('nonSingleChar'),
                    'editable-cell': isEditMode
                  }"
                  @click="isEditMode && startEditing(row.row, 'char')"
                >
                  <input
                    v-if="editingCell.row === row.row && editingCell.field === 'char'"
                    :id="`edit-input-${row.row}-char`"
                    type="text"
                    class="glass-input row-input"
                    :value="getPendingValue(row.row, 'char') ?? row.char ?? ''"
                    @blur="finishEditing(row, 'char', $event.target.value)"
                    @keydown.enter.prevent="$event.target.blur()"
                    @keydown.esc.prevent="editingCell = { row: null, field: null }"
                    @click.stop
                  />
                  <template v-else>
                    {{ getPendingValue(row.row, 'char') || row.char || '' }}
                    <span v-if="row.errors?.includes('nonSingleChar')" class="error-indicator">❌</span>
                  </template>
                </div>

                <div
                  class="cell cell-ipa"
                  :class="{
                    'error-cell': row.errors?.includes('invalidIpa'),
                    'editable-cell': isEditMode
                  }"
                  @click="isEditMode && startEditing(row.row, 'ipa')"
                >
                  <input
                    v-if="editingCell.row === row.row && editingCell.field === 'ipa'"
                    :id="`edit-input-${row.row}-ipa`"
                    type="text"
                    class="glass-input row-input"
                    :value="getPendingValue(row.row, 'ipa') ?? row.ipa ?? ''"
                    @blur="finishEditing(row, 'ipa', $event.target.value)"
                    @keydown.enter.prevent="$event.target.blur()"
                    @keydown.esc.prevent="editingCell = { row: null, field: null }"
                    @click.stop
                  />
                  <template v-else>
                    {{ getPendingValue(row.row, 'ipa') || row.ipa || '' }}
                    <span v-if="row.errors?.includes('invalidIpa')" class="error-indicator">⚠️</span>
                  </template>
                </div>

                <div
                  class="cell cell-onset"
                  :class="{ 'editable-cell': isEditMode }"
                  @click="isEditMode && startEditing(row.row, 'onset')"
                >
                  <input
                    v-if="editingCell.row === row.row && editingCell.field === 'onset'"
                    :id="`edit-input-${row.row}-onset`"
                    type="text"
                    class="glass-input row-input"
                    :value="getPendingValue(row.row, 'onset') ?? row.onset ?? ''"
                    @blur="finishEditing(row, 'onset', $event.target.value)"
                    @keydown.enter.prevent="$event.target.blur()"
                    @keydown.esc.prevent="editingCell = { row: null, field: null }"
                    @click.stop
                  />
                  <template v-else>
                    {{ getPendingValue(row.row, 'onset') || row.onset || '' }}
                  </template>
                </div>

                <div
                  class="cell cell-rime"
                  :class="{ 'editable-cell': isEditMode }"
                  @click="isEditMode && startEditing(row.row, 'rime')"
                >
                  <input
                    v-if="editingCell.row === row.row && editingCell.field === 'rime'"
                    :id="`edit-input-${row.row}-rime`"
                    type="text"
                    class="glass-input row-input"
                    :value="getPendingValue(row.row, 'rime') ?? row.rime ?? ''"
                    @blur="finishEditing(row, 'rime', $event.target.value)"
                    @keydown.enter.prevent="$event.target.blur()"
                    @keydown.esc.prevent="editingCell = { row: null, field: null }"
                    @click.stop
                  />
                  <template v-else>
                    {{ getPendingValue(row.row, 'rime') || row.rime || '' }}
                  </template>
                </div>

                <div
                  class="cell cell-tone"
                  :class="{
                    'error-cell': row.errors?.includes('missingTone'),
                    'editable-cell': isEditMode
                  }"
                  @click="isEditMode && startEditing(row.row, 'tone')"
                >
                  <input
                    v-if="editingCell.row === row.row && editingCell.field === 'tone'"
                    :id="`edit-input-${row.row}-tone`"
                    type="text"
                    class="glass-input row-input"
                    :value="getPendingValue(row.row, 'tone') ?? row.tone ?? ''"
                    @blur="finishEditing(row, 'tone', $event.target.value)"
                    @keydown.enter.prevent="$event.target.blur()"
                    @keydown.esc.prevent="editingCell = { row: null, field: null }"
                    @click.stop
                  />
                  <template v-else>
                    {{ getPendingValue(row.row, 'tone') || row.tone || '' }}
                    <span v-if="row.errors?.includes('missingTone')" class="error-indicator">🔍</span>
                  </template>
                </div>

                <div
                  class="cell cell-note"
                  :class="{ 'editable-cell': isEditMode }"
                  @click="isEditMode && startEditing(row.row, 'note')"
                >
                  <input
                    v-if="editingCell.row === row.row && editingCell.field === 'note'"
                    :id="`edit-input-${row.row}-note`"
                    type="text"
                    class="glass-input row-input"
                    style="text-align: left;"
                    :value="getPendingValue(row.row, 'note') ?? row.note ?? ''"
                    @blur="finishEditing(row, 'note', $event.target.value)"
                    @keydown.enter.prevent="$event.target.blur()"
                    @keydown.esc.prevent="editingCell = { row: null, field: null }"
                    @click.stop
                  />
                  <template v-else>
                    {{ getPendingValue(row.row, 'note') || row.note || '' }}
                  </template>
                </div>

                <div v-show="isEditMode" class="cell cell-action">
                  <button
                    class="delete-btn-icon"
                    :class="{ 'delete-active': rowsToDelete.has(row.row) }"
                    @click="markForDelete(row.row)"
                    :title="rowsToDelete.has(row.row) ? '取消刪除' : '標記刪除'"
                  >
                    {{ rowsToDelete.has(row.row) ? '↩️' : '🗑️' }}
                  </button>
                </div>
              </div>
            </RecycleScroller>
          </div>
        </div>

        <!-- 指令模式 -->
        <div v-show="currentMode === 'command'" class="command-view">
          <div class="command-panel glass-panel">
            <div class="command-header">
              <h3>💻 指令輸入</h3>
              <button v-if="!isPortrait" class="glass-button small" @click="showHelpModal = true">
                ❓ 指令說明
              </button>
            </div>

            <textarea
              v-model="commandInput"
              class="command-textarea custom-scrollbar"
              placeholder="輸入指令，每行一條或用分號分隔

                示例：
                c-帥-好
                i-帥-jat4
                p-'-ʰ
                r5>3
                s22>33

                多條指令用分號分隔：
                c-帥-好; i-帥-jat4"
            ></textarea>

            <div class="command-actions">
              <button class="glass-button" @click="clearCommand">🗑️ 清空</button>
              <button class="glass-button primary" @click="executeCommand">▶️ 執行指令</button>
            </div>

            <!-- 执行结果 -->
            <div v-if="commandLog.length > 0" class="command-result glass-panel">
              <div class="result-header">
                <h4>📋 執行結果</h4>
                <button class="glass-button small" @click="clearCommandLog">清空</button>
              </div>
              <div class="result-log custom-scrollbar">
                <div
                  v-for="(log, index) in commandLog"
                  :key="index"
                  class="log-item"
                  :class="log.type"
                >
                  {{ log.message }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 批量替换对话框 -->
    <teleport to="body">
      <div v-if="showBatchReplaceModal" class="modal-overlay" @click.self="showBatchReplaceModal = false">
        <div class="modal-content glass-panel">
          <div class="modal-header">
            <h3>🔄 批量替換</h3>
            <button class="close-btn" @click="showBatchReplaceModal = false">×</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>替換類型</label>
              <select v-model="replaceType" class="glass-input">
                <option value="p">全表音標(ipa)替換</option>
                <option value="r">入聲調替換</option>
                <option value="s">舒聲調替換</option>
              </select>
            </div>

            <div v-if="replaceType === 'p'" class="form-group">
              <label>原字符</label>
              <input v-model="replaceFrom" type="text" class="glass-input" placeholder="例如：'" />
              <div class="hint">要替換的字符或字符串</div>
            </div>

            <div v-if="replaceType !== 'p'" class="form-group">
              <label>原調值</label>
              <input v-model="replaceFrom" type="text" class="glass-input" placeholder="例如：5" />
              <div class="hint">要替換的調值（1-4位數字）</div>
            </div>

            <div class="form-group">
              <label>{{ replaceType === 'p' ? '新字符' : '新調值' }}</label>
              <input
                v-model="replaceTo"
                type="text"
                class="glass-input"
                :placeholder="replaceType === 'p' ? '例如：ʰ' : '例如：2'"
              />
              <div class="hint">{{ replaceType === 'p' ? '替換後的字符或字符串' : '替換後的調值（1-4位數字）' }}</div>
            </div>

            <div v-if="replaceType !== 'p'" class="hint-box">
              <strong>{{ replaceType === 'r' ? '入聲調：' : '舒聲調：' }}</strong>
              {{
                replaceType === 'r'
                  ? '只替換以塞音結尾的調值（p, t, k, ʔ, b, d, g）'
                  : '只替換舒聲的調值'
              }}
            </div>

            <div class="form-group">
              <label>預覽命令</label>
              <input :value="commandPreview" type="text" class="glass-input" readonly style="background: rgba(0,0,0,0.1);" />
            </div>
          </div>

          <div class="modal-footer">
            <button class="glass-button secondary" @click="showBatchReplaceModal = false">取消</button>
            <button class="glass-button primary" @click="executeBatchReplace">🔄 執行替換</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 帮助对话框 -->
    <teleport to="body">
      <div v-if="showHelpModal" class="modal-overlay" @click.self="showHelpModal = false">
        <div class="modal-content glass-panel help-modal">
          <div class="modal-header">
            <h3>❓ 使用幫助</h3>
            <button class="close-btn" @click="showHelpModal = false">×</button>
          </div>

          <div class="modal-body help-content custom-scrollbar">
<!--            <div class="help-section">-->
<!--              <h4>📋 文件要求</h4>-->
<!--              <ul>-->
<!--                <li>支持 .xlsx 和 .xls 格式</li>-->
<!--                <li>必須包含"漢字"或"單字"列</li>-->
<!--                <li>必須包含"音標"或"IPA"列</li>-->
<!--                <li>可選包含"解釋"或"注釋"列</li>-->
<!--              </ul>-->
<!--            </div>-->

            <div class="help-section">
              <h4>🔍 檢查項目</h4>
              <ul>
                <li><strong>非漢字</strong>：漢字列應為單個字符</li>
                <li><strong>異常音標</strong>：包含非法字符或格式錯誤</li>
                <li><strong>缺聲調</strong>：音標末尾缺少數字聲調</li>
              </ul>
            </div>

            <div class="help-section">
              <h4>💻 指令格式</h4>
              <table class="help-table">
                <thead>
                  <tr>
                    <th>指令</th>
                    <th>說明</th>
                    <th>示例</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>c-漢字-新字</code></td>
                    <td>替換漢字</td>
                    <td><code>c-帥-好</code></td>
                  </tr>
                  <tr>
                    <td><code>c-漢字-d</code></td>
                    <td>刪除行</td>
                    <td><code>c-帥-d</code></td>
                  </tr>
                  <tr>
                    <td><code>i-漢字-新音標</code></td>
                    <td>修改音標</td>
                    <td><code>i-帥-jat4</code></td>
                  </tr>
                  <tr>
                    <td><code>p-原-新</code></td>
                    <td>全表替換音標</td>
                    <td><code>p-'-ʰ</code></td>
                  </tr>
                  <tr>
                    <td><code>r{原}>{新}</code></td>
                    <td>只替換入聲的調值</td>
                    <td><code>r5>2</code></td>
                  </tr>
                  <tr>
                    <td><code>s{原}>{新}</code></td>
                    <td>只替換舒聲的調值</td>
                    <td><code>s22>33</code></td>
                  </tr>
                </tbody>
              </table>
              <p class="hint-text">💡 多條指令用分號分隔，例如：<code>c-帥-好; i-帥-jat4</code></p>
            </div>

            <div class="help-section">
              <h4>✏️ 編輯方式</h4>
              <ul>
                <li><strong>單元格編輯</strong>：雙擊表格單元格直接編輯</li>
                <li><strong>批量編輯</strong>：進入編輯模式，修改後統一保存</li>
                <li><strong>指令模式</strong>：批量處理多個修改</li>
              </ul>
            </div>
          </div>

          <div class="modal-footer">
            <button class="glass-button primary" @click="showHelpModal = false">知道了</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 文件格式说明对话框 -->
    <teleport to="body">
      <div v-if="showFormatHelpModal" class="modal-overlay" @click.self="showFormatHelpModal = false">
        <div class="modal-content glass-panel help-modal">
          <div class="modal-header">
            <h3>📋 文件格式說明</h3>
            <button class="close-btn" @click="showFormatHelpModal = false">×</button>
          </div>

          <div class="modal-body help-content custom-scrollbar">
            <!-- 音典格式 -->
            <div class="help-section">
              <h4>1. 一字一音(音典)</h4>
              <div class="format-details">
                <p><strong>文件要求：</strong>Excel (.xlsx, .xls)。</p>
                <p><strong>必須包含三列：</strong></p>
                <ul>
                  <li><strong>漢字列：</strong>列名可以是「單字」、「phrase」、「单字」、「漢字」、「汉字」</li>
                  <li><strong>音標列：</strong>列名可以是「IPA」、「ipa」、「音標」、「音标」、「syllable」</li>
                  <li><strong>解釋列：</strong>列名可以是「注释」、「注釋」、「解釋」、「notes」</li>
                </ul>
                <p><strong>特點：</strong>系統會自動識別列名，支持多種列名變體。</p>
              </div>
            </div>

            <!-- 跳跳老鼠格式 -->
            <div class="help-section">
              <h4>2. 一音多字(跳跳老鼠)</h4>
              <p>「一音對多字」</p>
              <div class="format-details">
                <p><strong>文件要求：</strong>Excel (.xlsx, .xls)。</p>
                <p><strong>欄位排版：</strong></p>
                <ul>
                  <li>第一欄 (A)：音節（如：ka1）。</li>
                  <li>第二欄 (B)：漢字組，支持註釋（如：家{住所} 加[增加] 佳）。</li>
                </ul>
                <p><strong>特點：</strong>系統會自動拆分第二欄的每個字，並配上第一欄的音標。</p>
              </div>
            </div>

            <!-- 縣志格式 -->
            <div class="help-section">
              <h4>3. 縣志</h4>
              
              <div class="format-subsection">
                <h5>Excel 格式：</h5>
                <div class="format-details">
                  <p><strong>文件要求：</strong>Excel (.xlsx, .xls)。</p>
                  <p><strong>內容規則：</strong></p>
                  <ul>
                    <li>行首：聲母+韻母（如：pan）。</li>
                    <li>後續內容：必須包含「方括號調號」，格式為 [調號]漢字{註釋}。</li>
                    <li>範例：pan [1]班{班級} [2]板 [3]拌。</li>
                  </ul>
                  <p><strong>特點：</strong>自動識別 [ ] 或 ［ ］ 內的調號並與行首拼音組合成完整音標。</p>
                </div>
              </div>

              <div class="format-subsection">
                <h5>Word 格式：</h5>
                <div class="format-details">
                  <p><strong>文件要求：</strong>Word (.docx)</p>
                  <p><strong>層級規則：</strong></p>
                  <ul>
                    <li>韻母層：以 # 開頭（如：#ang）。</li>
                    <li>內容行：聲母 [調號]漢字{註釋}。</li>
                  </ul>
                  <p><strong>特點：</strong>支持複雜匹配。若一項中有多個字或多個音標（用 ; 或 / 分隔），系統會自動進行交叉匹配（笛卡爾積）。</p>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="glass-button primary" @click="showFormatHelpModal = false">知道了</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 调值字符显示对话框 -->
    <teleport to="body">
      <div v-if="showToneCharsModal" class="modal-overlay" @click.self="showToneCharsModal = false">
        <div class="modal-content glass-panel">
          <div class="modal-header">
            <h3>📊 {{ toneCharsModalTitle }}</h3>
            <button class="close-btn" @click="showToneCharsModal = false">×</button>
          </div>

          <div class="modal-body">
            <div class="tone-chars-display">
              {{ toneCharsModalContent }}
            </div>
          </div>

          <div class="modal-footer">
            <button class="glass-button primary" @click="showToneCharsModal = false">關閉</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 列筛选对话框 -->
    <teleport to="body">
      <div v-if="showFilterModal" class="modal-overlay" @click.self="showFilterModal = false">
        <div class="modal-content glass-panel filter-modal">
          <div class="modal-header">
            <h3>
              🔍 篩選
              <span v-if="filterColumnType === 'onset'">聲母</span>
              <span v-else-if="filterColumnType === 'rime'">韻母</span>
              <span v-else-if="filterColumnType === 'tone'">聲調</span>
            </h3>
            <button class="close-btn" @click="showFilterModal = false">×</button>
          </div>

          <div class="modal-body filter-modal-body">
            <div class="filter-actions">
              <button class="glass-button small" @click="toggleSelectAll">
                {{ isAllSelected ? '全消' : '全選' }}
              </button>
              <button class="glass-button small secondary" @click="invertSelection">
                反選
              </button>
            </div>
            
            <div class="filter-values-list custom-scrollbar">
              <div
                v-for="value in getUniqueValues(filterColumnType)"
                :key="value"
                class="filter-value-item"
                :class="{ 'selected': getCurrentFilterSet().has(value) }"
                @click="toggleFilterValue(value)"
              >
                <span class="checkbox">{{ getCurrentFilterSet().has(value) ? '✓' : '' }}</span>
                <span class="value-text">{{ value || '(空)' }}</span>
                <span class="value-count">
                  {{ getValueCount(filterColumnType, value) }}
                </span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="glass-button secondary" @click="showFilterModal = false">關閉</button>
            <button class="glass-button primary" @click="showFilterModal = false">確定</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import {
  uploadCheckFile,
  analyzeFile as analyzeFileApi,
  getToneStats,
  getTableData,
  updateRow as updateRowApi,
  batchDelete as batchDeleteApi,
  executeBatchOperation,
  downloadCheckResult
} from '@/api/tools/index.js'
import { userStore } from '@/utils/store.js'
import { showSuccess, showError, showWarning, showConfirm } from '@/utils/message.js'

const router = useRouter()

// 基本状态
const fileInput = ref(null)
const fileUploaded = ref(false)
const fileName = ref('')
const totalRows = ref(0)
const taskId = ref(null)
const isDragOver = ref(false)
const selectedFormat = ref('') // 文件格式类型
const isSimplified = ref(false) // 新增：默认为 false (繁体)
const isUploading = ref(false) // 上传加载状态

// 数据
const allData = ref([])
const errorData = ref([])  // 错误行的完整数据（用于表格显示）
const errorMetadata = ref([])  // 错误元数据（用于侧边栏）
const filteredData = ref([])

// UI状态
const currentMode = ref('table')
const sidebarCollapsed = ref(false)
const showingAll = ref(false)
const searchQuery = ref('')
const currentFilter = ref(null)
const errorStatsExpanded = ref(true)  // 错误列表展开状态
const isPortrait = ref(false) // 竖屏检测
const isLoadingTable = ref(false) // 表格加载状态

// 编辑状态
const isEditMode = ref(false)
const isEditModeLoading = ref(false) // 编辑模式加载状态
const pendingChanges = ref(new Map())
const rowsToDelete = ref(new Set())

// 错误统计
const errorStats = ref({
  nonSingleChar: 0,
  invalidIpa: 0,
  missingTone: 0,
  total: 0
})

const errorStatsConfig = {
  nonSingleChar: { icon: '❌', label: '非漢字', type: 'error' },
  invalidIpa: { icon: '⚠️', label: '異常音標', type: 'warning' },
  missingTone: { icon: '🔍', label: '缺聲調', type: 'info' }
}

// 调值统计
const toneStats = ref(null)
const toneStatsExpanded = ref(false)

// 声韵统计
const onsetRimeStatsExpanded = ref(false)

// 指令模式
const commandInput = ref('')
const commandLog = ref([])

// 对话框状态
const showBatchReplaceModal = ref(false)
const showHelpModal = ref(false)
const showToneCharsModal = ref(false)
const toneCharsModalTitle = ref('')
const toneCharsModalContent = ref('')
const showFilterModal = ref(false)
const filterColumnType = ref(null) // 'onset', 'rime', 'tone'
const showFormatHelpModal = ref(false)

// 筛选状态
const filterOnset = ref(new Set())
const filterRime = ref(new Set())
const filterTone = ref(new Set())

// 批量替换
const replaceType = ref('p')
const replaceFrom = ref('')
const replaceTo = ref('')

// 计算属性
const totalPendingChanges = computed(() => {
  return pendingChanges.value.size + rowsToDelete.value.size
})

const displayedErrors = computed(() => {
  // 侧边栏显示错误元数据，不是完整行数据
  if (currentFilter.value) {
    return errorMetadata.value.filter(e =>
      (e.error_type === currentFilter.value) || (e.type === currentFilter.value)
    )
  }

  if (searchQuery.value.trim()) {
    return errorMetadata.value.filter(e =>
      e.value?.includes(searchQuery.value.trim()) || e.char?.includes(searchQuery.value.trim())
    )
  }

  return errorMetadata.value
})

const displayedTableData = computed(() => {
  let data = showingAll.value
    ? (currentFilter.value ? (filteredData.value || []) : (allData.value || []))
    : (currentFilter.value ? (filteredData.value || []) : (errorData.value || []))
  
  // 应用列筛选
  if (filterOnset.value.size > 0) {
    data = (data || []).filter(row => {
      if (!row) return false
      const value = getPendingValue(row.row, 'onset') || row.onset || ''
      return filterOnset.value.has(value)
    })
  }
  if (filterRime.value.size > 0) {
    data = (data || []).filter(row => {
      if (!row) return false
      const value = getPendingValue(row.row, 'rime') || row.rime || ''
      return filterRime.value.has(value)
    })
  }
  if (filterTone.value.size > 0) {
    data = (data || []).filter(row => {
      if (!row) return false
      const value = getPendingValue(row.row, 'tone') || row.tone || ''
      return filterTone.value.has(value)
    })
  }
  
  return data || []
})

// 获取唯一值列表
const getUniqueValues = (columnType) => {
  // 从所有数据中获取唯一值（包括全部数据和错误数据）
  const allDataForFilter = [...(allData.value || []), ...(errorData.value || [])]
  const values = new Set()
  
  allDataForFilter.forEach(row => {
    if (!row) return
    let value = ''
    if (columnType === 'onset') {
      value = getPendingValue(row.row, 'onset') || row.onset || ''
    } else if (columnType === 'rime') {
      value = getPendingValue(row.row, 'rime') || row.rime || ''
    } else if (columnType === 'tone') {
      value = getPendingValue(row.row, 'tone') || row.tone || ''
    }
    // 包括空值
    values.add(value || '')
  })
  
  return Array.from(values).sort((a, b) => {
    // 空值排在最后
    if (!a) return 1
    if (!b) return -1
    return a.localeCompare(b)
  })
}

// 获取当前筛选的选中状态
const getCurrentFilterSet = () => {
  if (filterColumnType.value === 'onset') return filterOnset.value
  if (filterColumnType.value === 'rime') return filterRime.value
  if (filterColumnType.value === 'tone') return filterTone.value
  return new Set()
}

const sortedRuTones = computed(() => {
  if (!toneStats.value?.ru_tones) return []
  return Object.entries(toneStats.value.ru_tones).sort((a, b) => a[0].localeCompare(b[0]))
})

const sortedShuTones = computed(() => {
  if (!toneStats.value?.shu_tones) return []
  return Object.entries(toneStats.value.shu_tones).sort((a, b) => a[0].localeCompare(b[0]))
})

// 声母统计
const onsetStats = computed(() => {
  const data = showingAll.value ? (allData.value || []) : (errorData.value || [])
  const stats = new Map()
  
  data.forEach(row => {
    if (!row) return
    const value = getPendingValue(row.row, 'onset') || row.onset || ''
    const count = stats.get(value) || 0
    stats.set(value, count + 1)
  })
  
  return Array.from(stats.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      if (!a.value) return 1
      if (!b.value) return -1
      return a.value.localeCompare(b.value)
    })
})

// 韵母统计
const rimeStats = computed(() => {
  const data = showingAll.value ? (allData.value || []) : (errorData.value || [])
  const stats = new Map()
  
  data.forEach(row => {
    if (!row) return
    const value = getPendingValue(row.row, 'rime') || row.rime || ''
    const count = stats.get(value) || 0
    stats.set(value, count + 1)
  })
  
  return Array.from(stats.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      if (!a.value) return 1
      if (!b.value) return -1
      return a.value.localeCompare(b.value)
    })
})

const commandPreview = computed(() => {
  if (replaceType.value === 'p') {
    if (replaceFrom.value || replaceTo.value) {
      return `p-${replaceFrom.value}-${replaceTo.value}`
    }
  } else {
    if (replaceFrom.value || replaceTo.value) {
      return `${replaceType.value}${replaceFrom.value}>${replaceTo.value}`
    }
  }
  return ''
})

// 文件处理
const handleDrop = (event) => {
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    uploadFile(file)
  }
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    uploadFile(file)
  }
}

const uploadFile = async (file) => {
  // 检查登录状态
  if (!userStore.isAuthenticated) {
    showWarning('請先登錄')
    router.push('/auth')
    return
  }

  const allowedExts = ['.xlsx', '.xls', '.doc', '.docx', '.tsv']
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

  if (!allowedExts.includes(ext)) {
    showError('請上傳支持的文件格式（.xlsx, .xls, .doc, .docx, .tsv）')
    return
  }

  if (file.size > 3 * 1024 * 1024) {
    showError('文件大小不得超過3MB')
    return
  }

  try {
    isUploading.value = true
    fileName.value = file.name

    const data = await uploadCheckFile(file, selectedFormat.value || 'excel', isSimplified.value)

    taskId.value = data.task_id
    totalRows.value = data.total_rows || 0
    fileUploaded.value = true

    await analyzeFile()
  } catch (error) {
    showError('上傳失敗: ' + error.message)
  } finally {
    isUploading.value = false
  }
}

const analyzeFile = async () => {
  try {
    isLoadingTable.value = true
    const data = await analyzeFileApi(taskId.value)

    // errorData存储错误元数据（用于侧边栏）
    const errorMetadata = data.errors || []

    // 更新统计
    errorStats.value = {
      nonSingleChar: data.error_stats?.nonSingleChar || 0,
      invalidIpa: data.error_stats?.invalidIpa || 0,
      missingTone: data.error_stats?.missingTone || 0,
      total: Object.values(data.error_stats || {}).reduce((a, b) => a + b, 0)
    }
    showingAll.value = errorStats.value.total === 0
    // 加载调值统计
    await loadToneStats()

    // 加载全部数据（用于"显示全部"功能）
    await loadAllData()

    // 加载错误行的完整数据（用于表格显示）
    await loadErrorRowsData(errorMetadata)
    isLoadingTable.value = false
  } catch (error) {
    showError('分析失敗: ' + error.message)
  }
}

const loadToneStats = async () => {
  try {
    const data = await getToneStats(taskId.value)

    if (data.success && data.tone_stats) {
      toneStats.value = data.tone_stats
    }
  } catch (error) {
    console.error('加載調值統計失敗:', error)
  }
}

const loadAllData = async () => {
  try {
    isLoadingTable.value = true
    const data = await getTableData(taskId.value, { includeAll: true })

    if (data.success) {
      allData.value = data.data || []
    }
  } catch (error) {
    console.error('加載全部數據失敗:', error)
  } finally {
    isLoadingTable.value = false
  }
}

const loadErrorRowsData = async (errors) => {
  try {
    isLoadingTable.value = true
    // 保存错误元数据用于侧边栏
    errorMetadata.value = errors

    // 获取错误行的完整数据
    const data = await getTableData(taskId.value, { includeAll: true })

    if (data.success) {
      // 为每行添加错误信息
      const rowData = data.data || []

      // 按行号分组错误
      const errorsByRow = {}
      errors.forEach(error => {
        if (!errorsByRow[error.row]) {
          errorsByRow[error.row] = []
        }
        errorsByRow[error.row].push(error.error_type || error.type)
      })

      // 为每行数据添加错误数组，并只保留有错误的行
      const errorRows = rowData.filter(row => errorsByRow[row.row])
      errorRows.forEach(row => {
        row.errors = errorsByRow[row.row] || []
      })

      errorData.value = errorRows
      filteredData.value = errorRows
    }
  } catch (error) {
    console.error('加載錯誤行數據失敗:', error)
  } finally {
    isLoadingTable.value = false
  }
}

// UI操作
const resetUpload = async () => {
  const confirmed = await showConfirm('確定要更換文件？未保存的修改將丟失。')
  if (confirmed) {
    fileUploaded.value = false
    fileName.value = ''
    totalRows.value = 0
    taskId.value = null
    allData.value = []
    errorData.value = []
    errorMetadata.value = []
    filteredData.value = []
    errorStats.value = { nonSingleChar: 0, invalidIpa: 0, missingTone: 0, total: 0 }
    toneStats.value = null
    pendingChanges.value.clear()
    rowsToDelete.value.clear()
    isEditMode.value = false
    clearAllColumnFilters()
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const switchMode = (mode) => {
  currentMode.value = mode
}

const toggleShowAll = () => {
  showingAll.value = !showingAll.value
}

const toggleToneStats = () => {
  const newValue = !toneStatsExpanded.value
  // 互斥展开：展开当前时收起其他两个
  if (newValue) {
    errorStatsExpanded.value = false
    onsetRimeStatsExpanded.value = false
  }
  toneStatsExpanded.value = newValue
}

const toggleOnsetRimeStats = () => {
  const newValue = !onsetRimeStatsExpanded.value
  // 互斥展开：展开当前时收起其他两个
  if (newValue) {
    errorStatsExpanded.value = false
    toneStatsExpanded.value = false
  }
  onsetRimeStatsExpanded.value = newValue
}

// 检查是否被筛选
const isOnsetFiltered = (value) => {
  return filterOnset.value && filterOnset.value.has(value)
}

const isRimeFiltered = (value) => {
  return filterRime.value && filterRime.value.has(value)
}

// 点击声母/韵母进行筛选
const filterByOnset = (onset) => {
  if (!filterOnset.value) {
    filterOnset.value = new Set()
  }
  filterOnset.value.clear()
  filterOnset.value.add(onset)
  // 点击韵母时自动取消声母筛选
  if (filterRime.value) {
    filterRime.value.clear()
  }
}

const filterByRime = (rime) => {
  if (!filterRime.value) {
    filterRime.value = new Set()
  }
  filterRime.value.clear()
  filterRime.value.add(rime)
  // 点击韵母时自动取消声母筛选
  if (filterOnset.value) {
    filterOnset.value.clear()
  }
}

const toggleErrorStats = () => {
  const newValue = !errorStatsExpanded.value
  // 互斥展开：展开当前时收起其他两个
  if (newValue) {
    toneStatsExpanded.value = false
    onsetRimeStatsExpanded.value = false
  }
  errorStatsExpanded.value = newValue
}

// 筛选功能
const filterErrors = (errorType) => {
  if (currentFilter.value === errorType) {
    currentFilter.value = null
    filteredData.value = errorData.value
  } else {
    currentFilter.value = errorType
    filteredData.value = errorData.value.filter(row =>
      row.errors?.includes(errorType)
    )
  }
}

// 打开列筛选弹窗
const openFilterModal = (columnType) => {
  filterColumnType.value = columnType
  showFilterModal.value = true
}

// 切换筛选值
const toggleFilterValue = (value) => {
  const filterSet = getCurrentFilterSet()
  if (filterSet.has(value)) {
    filterSet.delete(value)
  } else {
    filterSet.add(value)
  }
}

// 清除当前列的筛选
const clearColumnFilter = () => {
  if (filterColumnType.value === 'onset') {
    filterOnset.value.clear()
  } else if (filterColumnType.value === 'rime') {
    filterRime.value.clear()
  } else if (filterColumnType.value === 'tone') {
    filterTone.value.clear()
  }
}

// 清除所有列筛选
const clearAllColumnFilters = () => {
  filterOnset.value.clear()
  filterRime.value.clear()
  filterTone.value.clear()
}

// 检查是否全部选中
const isAllSelected = computed(() => {
  if (!filterColumnType.value) return false
  const uniqueValues = getUniqueValues(filterColumnType.value)
  const currentFilterSet = getCurrentFilterSet()
  return uniqueValues.length > 0 && uniqueValues.every(value => currentFilterSet.has(value))
})

// 全選/全消
const toggleSelectAll = () => {
  if (!filterColumnType.value) return
  const uniqueValues = getUniqueValues(filterColumnType.value)
  const currentFilterSet = getCurrentFilterSet()
  
  if (isAllSelected.value) {
    // 全消
    currentFilterSet.clear()
  } else {
    // 全選
    uniqueValues.forEach(value => {
      currentFilterSet.add(value)
    })
  }
}

// 反選
const invertSelection = () => {
  if (!filterColumnType.value) return
  const uniqueValues = getUniqueValues(filterColumnType.value)
  const currentFilterSet = getCurrentFilterSet()
  
  uniqueValues.forEach(value => {
    if (currentFilterSet.has(value)) {
      currentFilterSet.delete(value)
    } else {
      currentFilterSet.add(value)
    }
  })
}

// 获取列筛选的显示文本
const getFilterDisplayText = (columnType) => {
  let filterSet
  if (columnType === 'onset') filterSet = filterOnset.value
  else if (columnType === 'rime') filterSet = filterRime.value
  else if (columnType === 'tone') filterSet = filterTone.value
  else return ''
  
  if (filterSet.size === 0) return ''
  return ` (${filterSet.size})`
}

// 获取某个值在数据中的出现次数
const getValueCount = (columnType, value) => {
  const data = showingAll.value ? (allData.value || []) : (errorData.value || [])
  return data.filter(row => {
    const rowValue = columnType === 'onset' 
      ? (getPendingValue(row.row, 'onset') || row.onset || '')
      : columnType === 'rime'
      ? (getPendingValue(row.row, 'rime') || row.rime || '')
      : (getPendingValue(row.row, 'tone') || row.tone || '')
    return rowValue === value
  }).length
}

const handleSearch = () => {
  const query = searchQuery.value.trim()
  if (!query) {
    filteredData.value = errorData.value
    currentFilter.value = null
    return
  }

  currentFilter.value = 'search'
  filteredData.value = errorData.value.filter(row =>
    row.char?.includes(query)
  )
}

const resetFilter = () => {
  searchQuery.value = ''
  currentFilter.value = null
  filteredData.value = errorData.value
}

// 跳转到行
const jumpToRow = (rowNumber) => {
  // Find the row in virtual scroller
  const rowElement = document.querySelector(`div[data-row="${rowNumber}"]`)
  if (rowElement) {
    rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    rowElement.classList.add('highlight-row')
    setTimeout(() => {
      rowElement.classList.remove('highlight-row')
    }, 2000)
  }
}

// 编辑功能
const toggleEditMode = () => {
  if (!isEditMode.value) {
    // 进入编辑模式 - 无需等待，虚拟滚动会自动处理
    isEditMode.value = true
  } else {
    // 退出编辑模式
    isEditMode.value = false
    pendingChanges.value.clear()
    rowsToDelete.value.clear()
  }
}

// 记录当前正在编辑的单元格位置
const editingCell = ref({ row: null, field: null })

// 激活编辑状态（替代原来的 editCell）
const startEditing = (rowId, field) => {
  editingCell.value = { row: rowId, field: field }
  // 下一帧自动聚焦输入框
  nextTick(() => {
    const inputId = `edit-input-${rowId}-${field}`
    const el = document.getElementById(inputId)
    if (el) el.focus()
  })
}

// 结束编辑（保存或取消）
// 3. 修改后的：结束编辑
const finishEditing = (rowObj, field, value) => {
  // 1. 数据清洗：转为字符串并去除首尾空格（防止用户误输空格被当成修改）
  const newValue = String(value ?? '').trim()

  // 2. 获取该字段在文件里的最原始值
  const originalFileValue = String(rowObj[field] ?? '').trim()

  // 3. 获取编辑前一刻显示的值（可能是还没保存的 Pending 值，也可能是原始值）
  const currentPending = pendingChanges.value.get(rowObj.row)?.[field]
  const displayedValue = currentPending !== undefined
      ? String(currentPending).trim()
      : originalFileValue

  // 4. 【关键判断】如果新值和刚才显示的值一样，说明用户点开没改，或者改了又改回去了
  if (newValue === displayedValue) {
    editingCell.value = { row: null, field: null }
    return // 直接退出，不标记为修改
  }

  // 5. 准备写入修改
  if (!pendingChanges.value.has(rowObj.row)) {
    pendingChanges.value.set(rowObj.row, {})
  }

  // 6. 【进阶优化】如果新值等于“最原始的文件值”，说明用户把改过的数据又改回去了
  if (newValue === originalFileValue) {
    // 删除这个字段的 pending 记录
    delete pendingChanges.value.get(rowObj.row)[field]

    // 如果这一行没有其他修改了，把整行从 pending map 中删掉（去掉黄色高亮）
    if (Object.keys(pendingChanges.value.get(rowObj.row)).length === 0) {
      pendingChanges.value.delete(rowObj.row)
    }
  } else {
    // 确实是新的修改，记录下来
    pendingChanges.value.get(rowObj.row)[field] = newValue
  }

  // 退出编辑状态
  editingCell.value = { row: null, field: null }
}

const markForDelete = (row) => {
  if (rowsToDelete.value.has(row)) {
    rowsToDelete.value.delete(row)
  } else {
    rowsToDelete.value.add(row)
  }
}

const getPendingValue = (row, field) => {
  return pendingChanges.value.get(row)?.[field]
}

const batchSave = async () => {
  const totalChanges = totalPendingChanges.value

  if (totalChanges === 0) {
    showWarning('沒有需要保存的更改')
    return
  }

  const confirmMsg = `確認保存？\n- 修改：${pendingChanges.value.size} 行\n- 刪除：${rowsToDelete.value.size} 行`
  const confirmed = await showConfirm(confirmMsg)
  if (!confirmed) {
    return
  }

  try {
    // 保存修改
    for (const [row, data] of pendingChanges.value) {
      await updateRowApi(taskId.value, row, data)
    }

    // 批量删除
    if (rowsToDelete.value.size > 0) {
      await batchDeleteApi(taskId.value, Array.from(rowsToDelete.value))
    }

    showSuccess(`保存成功：修改 ${pendingChanges.value.size} 行，刪除 ${rowsToDelete.value.size} 行`)

    // 清空并重新分析
    pendingChanges.value.clear()
    rowsToDelete.value.clear()
    isEditMode.value = false
    await analyzeFile()
  } catch (error) {
    showError('保存失敗: ' + error.message)
  }
}

const cancelEdit = async () => {
  if (totalPendingChanges.value > 0) {
    const confirmed = await showConfirm('放棄所有未保存的修改？')
    if (!confirmed) {
      return
    }
  }

  pendingChanges.value.clear()
  rowsToDelete.value.clear()
  isEditMode.value = false
}

// 指令模式
const executeCommand = async () => {
  const command = commandInput.value.trim()
  if (!command) {
    showWarning('請輸入指令')
    return
  }

  try {
    const data = await executeBatchOperation(taskId.value, {
      type: 'command',
      params: { commands: command.split('\n').filter(c => c.trim()) }
    })

    if (data.success) {
      commandLog.value = data.logs.map(log => ({
        type: log.includes('✅') || log.includes('成功') ? 'success' : 'error',
        message: log
      }))

      await analyzeFile()
    }
  } catch (error) {
    commandLog.value.push({
      type: 'error',
      message: '❌ 執行失敗: ' + error.message
    })
  }
}

const clearCommand = () => {
  commandInput.value = ''
}

const clearCommandLog = () => {
  commandLog.value = []
}

// 批量替换
const executeBatchReplace = async () => {
  if (!replaceFrom.value) {
    showWarning('請輸入原字符/調值')
    return
  }

  let command = ''
  if (replaceType.value === 'p') {
    command = `p-${replaceFrom.value}-${replaceTo.value}`
  } else {
    command = `${replaceType.value}${replaceFrom.value}>${replaceTo.value}`
  }

  try {
    const data = await executeBatchOperation(taskId.value, {
      type: 'replace',
      params: { commands: command.split('\n').filter(c => c.trim()) }
    })

    if (data.success) {
      showSuccess('替換成功')
      showBatchReplaceModal.value = false
      replaceFrom.value = ''
      replaceTo.value = ''
      await analyzeFile()
    }
  } catch (error) {
    showError('替換失敗: ' + error.message)
  }
}

// 调值字符显示
const showAllChars = async (tone, info, toneType) => {
  if (info.count === info.chars.length) {
    return
  }
  try {
    const data = await getTableData(taskId.value, { includeAll: true })

    if (data.success) {
      const RU_FINALS = new Set('ptkʔˀᵖᵏᵗbdg')
      const chars = []

      for (const row of data.data) {
        // 1. 获取 IPA 并去除空白
        const ipa = row.ipa ? row.ipa.trim() : ''
        if (!ipa) continue

        // -----------------------------------------------------------
        // 【核心修改】兼容普通数字(0-9) 和 上标数字(⁰-⁹)
        // -----------------------------------------------------------
        const match = ipa.match(/[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+$/)

        if (!match) continue

        // 2. 标准化调值（如果是普通数字，这里不做改变；如果是上标，转为普通数字）
        const rawToneStr = match[0]
        const normalizedTone = rawToneStr.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, m =>
            '0123456789'['⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(m)]
        )

        // 3. 比较调值 (强制转字符串比较，防止类型错误)
        if (String(normalizedTone) !== String(tone)) continue

        // 4. 判断是否入声 (查找数字前面的那个字符)
        // 例如 "tɔ33" -> 去掉 "33" -> 剩 "tɔ" -> 取最后字符 "ɔ"
        // 例如 "tap55" -> 去掉 "55" -> 剩 "tap" -> 取最后字符 "p"
        const phoneticPart = ipa.substring(0, ipa.length - rawToneStr.length)
        const lastChar = phoneticPart.slice(-1) // 取最后一个字

        const isRu = RU_FINALS.has(lastChar)

        if ((toneType === '入声' && isRu) || (toneType === '舒声' && !isRu)) {
          chars.push(row.char)
        }
      }

      toneCharsModalTitle.value = `${toneType} ${tone} (${chars.length}字)`
      toneCharsModalContent.value = chars.join(' ')
      showToneCharsModal.value = true
    }
  } catch (error) {
    showError('獲取數據失敗: ' + error.message)
  }
}

// 下载
const downloadFile = async () => {
  try {
    const blob = await downloadCheckResult(taskId.value)

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const originalName = fileName.value
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName
    // 2. 强制加上 .xlsx 后缀
    a.download = '方音圖鑑_' + nameWithoutExt + '.xlsx'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    showError('下載失敗: ' + error.message)
  }
}

// 工具函数
const getErrorTypeLabel = (type) => {
  const labels = {
    nonSingleChar: '非單字',
    invalidIpa: '異常音標',
    missingTone: '缺聲調'
  }
  return labels[type] || type
}

// 竖屏检测
const checkPortrait = () => {
  isPortrait.value = window.matchMedia('(max-aspect-ratio: 1/1)').matches
}

onMounted(() => {
  checkPortrait()
  window.addEventListener('resize', checkPortrait)
  window.addEventListener('orientationchange', checkPortrait)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkPortrait)
  window.removeEventListener('orientationchange', checkPortrait)
})
</script>

<style scoped>
/* 基础布局 */
.check-tool-container {
  width: 100%;
  height: 90%;
  display: flex;
  flex-direction: column;
  padding-top: 30px;
}

.welcome-screen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
@media (max-aspect-ratio: 1/1) {
  .welcome-screen {
    padding: 0;
  }

  .welcome-card {
    padding: 18px 20px;
    max-width: 100%;
  }

  .welcome-icon {
    font-size: 52px;
  }

  .welcome-features {
    margin: 16px 0;
  }

  .format-selector {
    margin: 12px 0;
    padding: 10px;
  }

  .upload-zone-drop {
    padding: 20px 24px;
  }

  .work-area {
    padding: 8px;
  }

  .sidebar {
    max-height: 280px;
  }

  .glass-container {
    padding: 18px 14px;
  }
}

.welcome-card {
  max-width: 800px;
  width: 100%;
  padding: 20px 30px;
  text-align: center;
}

.welcome-icon {
  font-size: 64px;
}

.welcome-features {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 24px 0;
  text-align: left;
}

.feature-item {
justify-content: center;
  display: flex;
  font-size: 15px;
  align-items: center;
  gap: 12px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.feature-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(52, 199, 89, 0.2);
  border-radius: 50%;
  color: #34c759;
  font-weight: 700;
}

.format-selector {
  margin: 10px 0;
  padding: 8px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  text-align: left;
}

.format-label-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.format-label {
  font-size: 14px;
  font-weight: 600;
  color: #0b2540;
  margin: 0;
}

.format-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: rgba(11, 37, 64, 0.85);
}

.format-option:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.format-option input[type="radio"] {
  margin: 0;
  cursor: pointer;
}

.format-option input[type="radio"]:checked + span {
  font-weight: 600;
  color: #007aff;
}

.work-area {
  height: 100%;
  display: flex;
  gap: 16px;
  padding: 20px;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  min-width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.sidebar.collapsed {
  width: 60px;
  min-width: 60px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h3 {
  font-size: 16px;
  margin: 0;
  white-space: nowrap;
}

.collapse-btn {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.5);
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 侧边栏分区 */
.sidebar-section {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  overflow: hidden;
  transition: flex 0.3s ease;
}

/* 两个都展开时各占一半 */
.sidebar-section:not(.collapsed) {
  flex: 1;
  min-height: 0;
}

/* 收起时只占标题高度 */
.sidebar-section.collapsed {
  flex: 0 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.section-header:hover {
  background: rgba(0, 122, 255, 0.15);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.section-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
  min-height: 0;
}

/* 错误统计 */
.error-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.stat-item .badge {
  font-size: 18px;
}

.stat-item .label {
  flex: 1;
  font-size: 13px;
}

.stat-item .count {
  font-weight: 700;
  font-size: 16px;
}

.stat-item.error .count {
  color: #ff3b30;
}

.stat-item.warning .count {
  color: #ff9500;
}

.stat-item.info .count {
  color: #007aff;
}

/* 调值统计 */
.tone-stats-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #666;
  font-size: 13px;
}

.tone-section-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.tone-section-title.ru {
  color: #ff3b30;
}

.tone-section-title.shu {
  color: #007aff;
}

.tone-item {
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.tone-item.ru {
  background: rgba(255, 59, 48, 0.1);
}

.tone-item.ru:hover {
  background: rgba(255, 59, 48, 0.2);
}

.tone-item.shu {
  background: rgba(0, 122, 255, 0.1);
}

.tone-item.shu:hover {
  background: rgba(0, 122, 255, 0.2);
}

.tone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.tone-value {
  font-weight: 600;
}

.tone-count {
  color: #666;
  font-size: 11px;
}

.tone-chars {
  color: #666;
  font-size: 11px;
  line-height: 1.4;
}

/* 声韵统计 */
.onset-rime-stats-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.onset-rime-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.onset-rime-section-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
  flex-shrink: 0;
  color: #007aff;
}

.onset-rime-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.onset-rime-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.onset-rime-item:hover {
  background: rgba(255, 255, 255, 0.5);
}

.onset-rime-item.filtered {
  background: rgba(0, 122, 255, 0.2);
  border: 1px solid rgba(0, 122, 255, 0.4);
}

.onset-rime-value {
  font-weight: 500;
  flex: 1;
}

.onset-rime-count {
  color: #666;
  font-size: 11px;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 24px;
  text-align: center;
}

/* 筛选 */
.filter-section {
  display: flex;
  flex-direction: row;
  gap: 8px;
  flex-shrink: 0;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 0;
}


/* 错误列表 */
.error-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.error-item {
  padding: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  display: flex;
  gap: 10px;
  justify-content: center;

}
.error-item > * {
  flex: 1;           /* 強制每個元素佔據相等的剩餘空間 */
  text-align: center; /* 讓文字在各自平分的區塊內居中 */
}

.error-item:hover {
  background: rgba(255, 255, 255, 0.5);
}

.error-row-num {
  font-size: 10px;
  color: #666;
  margin-bottom: 2px;
}

.error-char {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.error-type-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.error-type-badge.nonSingleChar {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}

.error-type-badge.invalidIpa {
  background: rgba(255, 149, 0, 0.15);
  color: #ff9500;
}

.error-type-badge.missingTone {
  background: rgba(0, 122, 255, 0.15);
  color: #007aff;
}

.error-more {
  padding: 8px;
  text-align: center;
  font-size: 12px;
  color: #666;
}

/* 主工作区 */
.main-work-area {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.file-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.file-info-left {
  display: flex;
  align-items: center;
  flex-direction: column;
  max-width: 150px;
}

.file-name {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.file-rows {
  font-size: 13px;
  color: #666;
}

/* 模式切换 */
.mode-tabs {
  display: flex;
  gap: 8px;
  padding: 8px;
}

.tab-btn {
  flex: 1;
  padding: 10px 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  color: rgba(11, 37, 64, 0.7);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.tab-btn.active {
  background: rgba(0, 122, 255, 0.7);
  backdrop-filter: blur(14px);
  border-color: rgba(0, 122, 255, 0.6);
  color: white;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
}

/* 表格视图 */
.table-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.table-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  align-items: center;
  flex-wrap: wrap;
}

.table-stats strong {
  color: #007aff;
  font-weight: 700;
}

.edit-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: #007aff;
  font-weight: 500;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
}

.ml-2 {
  margin-left: 8px;
}

.table-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.table-container {
  flex: 1;
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.table-container.loading {
  pointer-events: none;
}

.table-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 100;
}

.table-loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0, 122, 255, 0.1);
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.table-loading-text {
  font-size: 14px;
  color: #007aff;
  font-weight: 500;
}

/* Virtual Table Styles */
.virtual-table-header {
  display: grid;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid rgba(0, 122, 255, 0.2);
}

.header-cell {
  padding: 10px 12px;
  text-align: center;
  font-weight: 600;
  color: #0b2540;
  font-size: 13px;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
}

.header-cell:last-child {
  border-right: none;
}

.filterable-header {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  position: relative;
}

.filterable-header:hover {
  background: rgba(0, 122, 255, 0.1);
}

.filterable-header.filtered {
  background: rgba(0, 122, 255, 0.15);
  color: #007aff;
}

.filter-indicator {
  margin-left: 4px;
  font-size: 12px;
}

.virtual-table-scroller {
  height: calc(100% - 44px);
  overflow-y: auto;
}

.virtual-table-row {
  display: grid;
  min-height: 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  transition: background 0.2s ease;
}

.virtual-table-row:hover {
  background: rgba(0, 122, 255, 0.05);
}

.virtual-table-row.modified-row {
  background: rgba(255, 204, 0, 0.1);
}

.virtual-table-row.marked-for-delete {
  background: rgba(255, 59, 48, 0.1);
  text-decoration: line-through;
}

.virtual-table-row.highlight-row {
  background: rgba(0, 122, 255, 0.2);
  animation: highlight 2s ease;
}

@keyframes highlight {
  0%, 100% { background: rgba(0, 122, 255, 0.05); }
  50% { background: rgba(0, 122, 255, 0.3); }
}

.cell {
  padding: 10px 12px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell:last-child {
  border-right: none;
}

.cell-note {
  text-align: left;
  justify-content: flex-start;
}

.error-cell {
  position: relative;
}

.editable-cell {
  cursor: pointer;
  position: relative;
  background: rgba(0, 122, 255, 0.02);
  border: 1px dashed rgba(0, 122, 255, 0.2) !important;
}

.editable-cell:hover {
  background: rgba(0, 122, 255, 0.08);
  border-color: rgba(0, 122, 255, 0.4) !important;
}

.error-indicator {
  margin-left: 4px;
  font-size: 12px;
}

/* 删除按钮 */
.cell-action {
  text-align: center;
}

.delete-btn-icon {
  padding: 4px 8px;
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn-icon:hover {
  background: rgba(255, 59, 48, 0.2);
  transform: scale(1.1);
}

.delete-btn-icon.delete-active {
  background: rgba(52, 199, 89, 0.2);
  border-color: rgba(52, 199, 89, 0.5);
}

.delete-btn-icon.delete-active:hover {
  background: rgba(52, 199, 89, 0.3);
}

/* 指令视图 */
.command-view {
  flex: 1;
  overflow-y: auto;
}

.command-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.command-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.command-header h3 {
  margin: 0;
  font-size: 18px;
}

.command-textarea {
  min-height: 300px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  color: #0b2540;
  font-size: 14px;
  font-family: 'SF Mono', Monaco, monospace;
  resize: vertical;
  transition: all 0.2s ease;
}

.command-textarea:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 122, 255, 0.5);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.command-actions {
  display: flex;
  gap: 12px;
}

.command-result {
  padding: 16px;
  max-height: 300px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.result-header h4 {
  margin: 0;
  font-size: 14px;
}

.result-log {
  max-height: 200px;
  overflow-y: auto;
}

.log-item {
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, monospace;
}

.log-item.success {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

.log-item.error {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

/* 通用样式 */
.glass-container {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 30px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
}

.glass-panel {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
}

.glass-button {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  color: #0b2540;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.glass-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.6);
  transform: translateY(-1px);
}

.glass-button.primary {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.8), rgba(0, 122, 255, 0.6));
  color: white;
  border-color: rgba(0, 122, 255, 0.6);
}

.glass-button.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.9), rgba(0, 122, 255, 0.7));
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
}

.glass-button.secondary {
  background: rgba(255, 255, 255, 0.5);
}

.glass-button.small {
  padding: 6px 12px;
  font-size: 12px;
}

.glass-button.active {
  background: rgba(0, 122, 255, 0.2);
  border-color: rgba(0, 122, 255, 0.5);
}

.glass-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.glass-input {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  color: #0b2540;
  font-size: 13px;
  transition: all 0.2s ease;
}

.glass-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 122, 255, 0.5);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #0b2540;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: rgba(11, 37, 64, 0.7);
  margin: 0 0 24px 0;
}

.upload-zone-drop {
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border: 2px dashed rgba(0, 122, 255, 0.3);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-zone-drop:hover,
.upload-zone-drop.drag-over {
  background: rgba(0, 122, 255, 0.05);
  border-color: rgba(0, 122, 255, 0.6);
  transform: scale(1.02);
}

.upload-zone-drop.uploading {
  cursor: not-allowed;
  background: rgba(0, 122, 255, 0.03);
  border-color: rgba(0, 122, 255, 0.2);
  pointer-events: none;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(0, 122, 255, 0.1);
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.upload-icon-large {
  font-size: 48px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.upload-text {
  font-size: 16px;
  font-weight: 500;
  color: #0b2540;
  margin: 0;
}

.hint-text {
  font-size: 12px;
  color: rgba(11, 37, 64, 0.6);
  margin: 0;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: min(90vw, 600px);
  max-height: 85vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 24px;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-content.help-modal {
  width: min(90vw, 800px);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 59, 48, 0.7);
  color: white;
}

.modal-body {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.5);
}

.form-group {
  margin-bottom: 16px;
  align-items: center;
  display: flex;
  flex-direction: column;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #0b2540;
}

.hint {
  margin-top: 4px;
  font-size: 11px;
  color: #666;
}

.hint-box {
  padding: 12px;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: #666;
}

/* 帮助内容 */
.help-content {
  max-height: 60vh;
}

.help-section {
  margin-bottom: 24px;
}

.help-section h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #0b2540;
}

.help-section ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.8;
}

.help-section p {
  margin: 8px 0;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(11, 37, 64, 0.8);
}

.format-details {
  margin-top: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.format-details p {
  margin: 6px 0;
}

.format-details ul {
  margin: 8px 0;
  padding-left: 24px;
}

.format-subsection {
  margin-top: 16px;
  padding-left: 16px;
  border-left: 3px solid rgba(0, 122, 255, 0.3);
}

.format-subsection h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #007aff;
}

.help-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin: 12px 0;
}

.help-table th,
.help-table td {
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-align: left;
}

.help-table th {
  background: rgba(0, 122, 255, 0.1);
  font-weight: 600;
}

.help-table code {
  background: rgba(0, 122, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 11px;
}

.hint-text {
  font-size: 12px;
  color: #666;
}

.tone-chars-display {
  font-size: 16px;
  line-height: 2;
  word-break: break-all;
}

/* 筛选弹窗 */
.filter-modal {
  width: min(90vw, 500px);
}

.filter-modal-body {
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.filter-values-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 400px;
}

.filter-value-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-value-item:hover {
  background: rgba(255, 255, 255, 0.97);
}

.filter-value-item.selected {
  background: rgba(0, 122, 255, 0.2);
  border: 1px solid rgba(0, 122, 255, 0.4);
}

.filter-value-item .checkbox {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(0, 122, 255, 0.3);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #007aff;
  flex-shrink: 0;
}

.filter-value-item.selected .checkbox {
  background: rgba(0, 122, 255, 0.2);
  border-color: #007aff;
}

.filter-value-item .value-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.filter-value-item .value-count {
  font-size: 12px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 12px;
  flex-shrink: 0;
}

/* 滚动条 */
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


@media (max-aspect-ratio: 1/1)  {
  .work-area {
    padding: 10px;
  }

  .glass-container {
    padding: 20px 16px;
    border-radius: 20px;
  }

  .header-section {
    padding-bottom: 16px;
  }

  .title {
    font-size: 22px;
  }

  .subtitle {
    font-size: 13px;
  }

  .format-selector {
    margin: 0;
    padding: 6px;
  }

  .format-label {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .format-options {
    gap: 8px;
  }

  .format-option {
    padding: 6px 12px;
    font-size: 13px;
  }

  .welcome-screen {
    padding: 10px;
  }

  .welcome-card {
    padding: 20px 16px;
    max-width: 100%;
  }

  .welcome-icon {
    font-size: 48px;
  }

  .welcome-features {
    margin: 16px 0;
    gap: 6px;
  }

  .feature-item {
    padding: 8px 10px;
    font-size: 13px;
    gap: 10px;
  }

  .feature-icon {
    width: 20px;
    height: 20px;
    font-size: 12px;
  }

  .upload-zone-drop {
    padding: 24px 20px;
    border-radius: 20px;
  }

  .upload-icon-large {
    font-size: 48px;
  }

  .upload-text {
    font-size: 16px;
  }

  .hint-text {
    font-size: 12px;
  }

  .upload-section {
    padding: 16px;
  }

  .upload-zone {
    padding: 24px 20px;
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

  .analyze-btn {
    padding: 14px 28px;
    font-size: 15px;
  }

  .sidebar {
    width: 100%;
    max-height: 300px;
    padding: 12px;
  }

  .sidebar-section {
    min-height: 120px;
  }

  .section-header {
    padding: 10px;
  }

  .section-title {
    font-size: 14px;
  }

  .section-content {
    padding: 10px;
  }

  .error-stats {
    gap: 8px;
    padding: 10px;
  }

  .filter-section {
    flex-direction: column;
    gap: 6px;
  }

  .search-input {
    width: 100%;
  }

  .filter-section .glass-button {
    width: 100%;
    padding: 8px 12px;
  }

  .glass-button.small {
    padding: 8px 12px;
    font-size: 12px;
  }

  .stat-item {
    font-size: 12px;
    padding: 8px 12px;
  }

  .error-search {
    padding: 8px 12px;
    font-size: 13px;
  }

  .error-list {
    gap: 6px;
  }

  .error-item {
    padding: 10px;
    font-size: 12px;
  }

  .tone-stats-grid {
    gap: 10px;
  }

  .tone-card {
    padding: 10px;
  }

  .tone-label {
    font-size: 12px;
  }

  .tone-count {
    font-size: 16px;
  }

  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px;
  }

  .table-stats {
    gap: 10px;
    font-size: 12px;
  }

  .edit-hint {
    font-size: 11px;
    padding: 3px 8px;
  }

  .mode-indicator {
    font-size: 13px;
    padding: 8px 14px;
  }

  .table-actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  .toolbar-btn {
    padding: 10px 16px;
    font-size: 13px;
    white-space: nowrap;
  }

  .table-container {
    border-radius: 12px;
  }

  .data-table {
    font-size: 11px;
  }

  .data-table th,
  .data-table td {
    padding: 6px 8px;
  }

  .editable-cell {
    border: 1px dashed rgba(0, 122, 255, 0.3) !important;
    background: rgba(0, 122, 255, 0.05);
  }

  .editable-cell::after {
    content: '✏️';
    position: absolute;
    right: 2px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 8px;
    opacity: 0.5;
  }

  .error-badge {
    font-size: 10px;
    padding: 2px 6px;
  }

  .delete-btn-icon {
    font-size: 16px;
  }

  /* 编辑对话框移动端适配 */
  .edit-dialog-overlay {
    padding: 10px;
  }

  .edit-dialog {
    width: calc(100vw - 20px);
    max-width: 100%;
    border-radius: 16px;
  }

  .dialog-header {
    padding: 16px;
  }

  .dialog-title {
    font-size: 18px;
  }

  .dialog-body {
    padding: 16px;
    gap: 16px;
  }

  .form-group label {
    font-size: 13px;
  }

  .form-input,
  .form-textarea {
    padding: 10px 12px;
    font-size: 14px;
  }

  .dialog-footer {
    padding: 12px 16px;
    gap: 8px;
  }

  .dialog-btn {
    flex: 1;
    padding: 12px;
  }

  /* 批量替换对话框移动端适配 */
  .batch-replace-dialog {
    width: calc(100vw - 20px);
    max-width: 100%;
  }

  .replace-type-tabs {
    padding: 12px 16px;
    gap: 6px;
    overflow-x: auto;
  }

  .replace-tab {
    padding: 8px 12px;
    font-size: 13px;
    white-space: nowrap;
  }

  /* 命令面板移动端适配 */
  .command-input-container {
    padding: 12px;
  }

  .command-input {
    padding: 10px 12px;
    font-size: 14px;
  }

  .command-buttons {
    gap: 6px;
  }

  .cmd-btn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .command-output {
    padding: 12px;
    font-size: 12px;
  }
}

/* 额外的小屏幕适配 */
@media (max-width: 480px) {
  .glass-container {
    padding: 16px 12px;
  }

  .welcome-screen {
    padding: 5px;
  }

  .welcome-card {
    padding: 16px 12px;
  }

  .welcome-icon {
    font-size: 40px;
  }

  .title {
    font-size: 20px;
  }

  .subtitle {
    font-size: 12px;
  }

  .welcome-features {
    margin: 12px 0;
    gap: 4px;
  }

  .feature-item {
    padding: 6px 8px;
    font-size: 12px;
    gap: 8px;
  }

  .feature-icon {
    width: 18px;
    height: 18px;
    font-size: 11px;
  }

  .format-selector {
    padding: 6px;
    margin: 8px 0;
  }

  .format-label {
    font-size: 12px;
  }

  .format-options {
    gap: 6px;
  }

  .format-option {
    padding: 5px 10px;
    font-size: 12px;
  }

  .upload-zone-drop {
    padding: 20px 16px;
  }

  .upload-icon-large {
    font-size: 40px;
  }

  .upload-text {
    font-size: 15px;
  }

  .hint-text {
    font-size: 11px;
  }

  .sidebar {
    max-height: 250px;
    padding: 10px;
  }

  .sidebar-section {
    min-height: 100px;
  }

  .section-header {
    padding: 8px;
  }

  .section-title {
    font-size: 13px;
  }

  .section-content {
    padding: 8px;
  }

  .error-stats {
    padding: 8px;
  }

  .stat-item {
    padding: 6px 10px;
    font-size: 11px;
  }

  .filter-section {
    gap: 4px;
  }

  .search-input {
    padding: 6px 10px;
    font-size: 12px;
  }

  .filter-section .glass-button {
    padding: 6px 12px;
    font-size: 12px;
  }

  .error-item {
    padding: 8px;
    font-size: 11px;
    gap: 6px;
  }

  .tone-section-title {
    font-size: 12px;
  }

  .tone-item {
    padding: 8px;
  }

  .tone-value {
    font-size: 12px;
  }

  .tone-count {
    font-size: 11px;
  }

  .tone-chars {
    font-size: 10px;
  }

  .table-stats {
    gap: 8px;
    font-size: 11px;
  }

  .edit-hint {
    font-size: 10px;
    padding: 2px 6px;
  }

  .data-table {
    font-size: 10px;
  }

  .data-table th,
  .data-table td {
    padding: 4px 6px;
  }

  .editable-cell::after {
    font-size: 7px;
    right: 1px;
  }

  .toolbar-btn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .mode-indicator {
    font-size: 12px;
    padding: 6px 12px;
  }
}
/* 表格行内编辑输入框样式 */
.row-input {
  width: 100%;
  height: 100%;
  padding: 4px;
  text-align: center; /* 让文字居中 */
  border: none;
  background: rgba(255, 255, 255, 0.5); /* 稍微明显的背景 */
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
  box-sizing: border-box;
}

.row-input:focus {
  background: white;
  box-shadow: inset 0 0 0 2px #4a90e2;
}
</style>
