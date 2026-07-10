<template>
  <div class="check-tool-container">
    <!-- 欢迎屏幕 -->
    <div v-if="!fileUploaded" class="welcome-screen">
      <div class="glass-container welcome-card">
        <div class="welcome-icon">📋</div>
        <h2 class="title">{{ t('tools.checkTool.welcome.title') }}</h2>
<!--        <p class="subtitle">上傳文件開始檢查和編輯</p>-->

        <div class="welcome-features">
          <div class="feature-item">
            <span class="feature-icon">✓</span>
            <span>{{ t('tools.checkTool.welcome.feature1') }}</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✓</span>
            <span>{{ t('tools.checkTool.welcome.feature2') }}</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✓</span>
            <span>{{ t('tools.checkTool.welcome.feature3') }}</span>
          </div>
        </div>

        <div class="format-selector">
          <div class="format-label-row">
            <label class="format-label">{{ t('tools.checkTool.welcome.formatLabel') }}</label>
            <button class="main-glass-button info-help-btn" data-size="small" @click="showFormatHelpModal = true">
              📋 {{ t('tools.checkTool.welcome.formatHelp') }}
            </button>
          </div>
          <div class="format-options">
            <RadioGroup
              v-model="selectedFormat"
              name="format"
              :options="formatOptions"
              :size="12"
            />
            <RadioGroup
              v-model="isSimplified"
              name="script"
              :options="scriptOptions"
              :size="11"
            />
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
          @click="!isUploading && !pendingPreviewFile && $refs.fileInput.click()"
          @dragover.prevent="!isUploading && (isDragOver = true)"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="!isUploading && handleDrop($event)"
        >
          <template v-if="!isUploading">
            <div class="upload-icon-large">📄</div>
            <h3 class="upload-text">{{ t('tools.checkTool.welcome.uploadTitle') }}</h3>
            <p class="hint-text">{{ t('tools.checkTool.welcome.uploadHint') }}</p>
          </template>
          <template v-else>
            <div class="ui-loading--page" aria-hidden="true"></div>
            <h3 class="upload-text">{{ t('tools.checkTool.welcome.uploadingTitle') }}</h3>
            <p class="hint-text">{{ t('tools.checkTool.welcome.uploadingHint') }}</p>
          </template>
        </div>

        <TabularImportPreview
          v-if="pendingPreviewFile"
          :key="previewConfirmKey"
          :title="t('common.importPreview.checkToolTitle')"
          :description="t('common.importPreview.checkToolDescription')"
          :file="pendingPreviewFile"
          :schema="checkImportSchema"
          :loading="checkPreviewState.loading"
          :preview-table="checkPreviewState.previewTable"
          :diagnostics="checkPreviewState.diagnostics"
          :mapping="checkPreviewState.mapping"
          :selected-sheet-id="checkPreviewState.selectedSheetId"
          :header-row-index="checkPreviewState.headerRowIndex"
          :sheets="checkPreviewState.parsedFile?.sheets || []"
          @update:selectedSheetId="checkPreviewState.selectedSheetId = $event"
          @update:headerRowIndex="checkPreviewState.headerRowIndex = $event"
          @update:mapping="handleCheckMappingUpdate"
          @reset="clearPendingPreview"
        />

        <div v-if="pendingPreviewFile" class="upload-preview-actions upload-preview-actions--check">
          <p v-if="checkImportSummary" class="hint-text hint-text--summary">{{ checkImportSummary }}</p>
          <div class="upload-preview-actions__buttons">
            <button class="main-glass-button" data-variant="secondary" type="button" @click="clearPendingPreview">
              {{ t('common.button.cancel') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="primary"
              type="button"
              :disabled="!isCheckImportReady"
              @click="confirmPreviewAndUpload"
            >
              {{ t('common.importPreview.actions.confirmAndUse') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 工作区域 -->
    <div v-else class="work-area">
      <!-- 侧边栏 -->
      <aside v-if="!isPortrait && !sidebarCollapsed" class="sidebar glass-panel">
        <div class="sidebar-header">
          <h3>📋 {{ t('tools.checkTool.sidebar.title') }}</h3>
          <button class="main-glass-button" data-size="small" @click="toggleShowAll">
            {{ showingAll ? '👁️ ' + t('tools.checkTool.sidebar.showErrorsOnly') : '👁️ ' + t('tools.checkTool.sidebar.showAll') }}
          </button>
          <button class="collapse-btn" @click="toggleSidebar">
            {{ sidebarCollapsed ? '▶' : '◀' }}
          </button>
        </div>

        <div v-if="!sidebarCollapsed" class="sidebar-content ui-scrollbar">
          <!-- 错误统计卡片 -->
          <div class="sidebar-section" :class="{ collapsed: !errorStatsExpanded }">
            <div class="section-header" @click="toggleErrorStats">
              <span class="section-title">🔍 {{ t('tools.checkTool.sidebar.errorListTitle') }}</span>
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
                  :placeholder="`🔍 ${t('tools.checkTool.sidebar.searchPlaceholder')}`"
                  @input="handleSearch"
                />
                <button class="main-glass-button" data-size="small" @click="resetFilter">{{ t('tools.checkTool.sidebar.clearFilter') }}</button>
              </div>

              <!-- 错误列表 -->
              <div class="error-list">
                <div
                  v-for="error in displayedErrors.slice(0, 50)"
                  :key="error.row"
                  class="error-item"
                  @click="jumpToRow(error.row)"
                >
                  <div class="error-row-num">{{ t('tools.checkTool.sidebar.rowLabel', { row: error.row }) }}</div>
                  <div class="error-char">{{ error.value || error.char || '' }}</div>
                  <div class="error-type-badge" :class="error.error_type || error.type">
                    {{ getErrorTypeLabel(error.error_type || error.type) }}
                  </div>
                </div>
                <div v-if="displayedErrors.length > 50" class="error-more">
                  {{ t('tools.checkTool.sidebar.moreErrors', { count: displayedErrors.length - 50 }) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 调值统计卡片 -->
          <div class="sidebar-section" :class="{ collapsed: !toneStatsExpanded }">
            <div class="section-header" @click="toggleToneStats">
              <span class="section-title">📊 {{ t('tools.checkTool.sidebar.toneStatsTitle') }}</span>
              <span class="toggle-icon">{{ toneStatsExpanded ? '▼' : '▶' }}</span>
            </div>

            <div v-show="toneStatsExpanded" class="section-content">
              <div v-if="toneStats" class="tone-stats-content">
                <!-- 入声调 -->
                <div v-if="Object.keys(toneStats.ru_tones).length > 0" class="tone-section">
                  <div class="tone-section-title ru">{{ t('tools.checkTool.sidebar.ruToneTitle') }}</div>
                  <div
                    v-for="([tone, info], index) in sortedRuTones"
                    :key="'ru-' + index"
                    class="tone-item ru"
                    @click="showAllChars(tone, info, 'ru')"
                  >
                    <div class="tone-header">
                      <span class="tone-value">{{ tone }}</span>
                      <span class="tone-count">{{ t('tools.checkTool.sidebar.charCount', { count: info.count }) }}{{ info.count > info.chars.length ? ' 👁️' : '' }}</span>
                    </div>
                    <div class="tone-chars">
                      {{ info.chars.join(' ') }}{{ info.count > info.chars.length ? '...' : '' }}
                    </div>
                  </div>
                </div>

                <!-- 舒声调 -->
                <div v-if="Object.keys(toneStats.shu_tones).length > 0" class="tone-section">
                  <div class="tone-section-title shu">{{ t('tools.checkTool.sidebar.shuToneTitle') }}</div>
                  <div
                    v-for="([tone, info], index) in sortedShuTones"
                    :key="'shu-' + index"
                    class="tone-item shu"
                    @click="showAllChars(tone, info, 'shu')"
                  >
                    <div class="tone-header">
                      <span class="tone-value">{{ tone }}</span>
                      <span class="tone-count">{{ t('tools.checkTool.sidebar.charCount', { count: info.count }) }}{{ info.count > info.chars.length ? ' 👁️' : '' }}</span>
                    </div>
                    <div class="tone-chars">
                      {{ info.chars.join(' ') }}{{ info.count > info.chars.length ? '...' : '' }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                {{ t('tools.checkTool.sidebar.noToneStats') }}
              </div>
            </div>
          </div>

          <!-- 声韵统计卡片 -->
          <div class="sidebar-section" :class="{ collapsed: !onsetRimeStatsExpanded }">
            <div class="section-header" @click="toggleOnsetRimeStats">
              <span class="section-title">🔤 {{ t('tools.checkTool.sidebar.onsetRimeTitle') }}</span>
              <span class="toggle-icon">{{ onsetRimeStatsExpanded ? '▼' : '▶' }}</span>
            </div>

            <div v-show="onsetRimeStatsExpanded" class="section-content">
              <div v-if="onsetStats.length > 0 || rimeStats.length > 0" class="onset-rime-stats-content">
                <!-- 声母统计 -->
                <div v-if="onsetStats.length > 0" class="onset-rime-section">
                  <div class="onset-rime-section-title">{{ t('tools.checkTool.sidebar.onsetTitle') }}</div>
                  <div class="onset-rime-items">
                    <div
                      v-for="(item, index) in onsetStats"
                      :key="'onset-' + index"
                      class="onset-rime-item"
                      :class="{ 'filtered': isOnsetFiltered(item.value) }"
                      @click="filterByOnset(item.value)"
                    >
                      <span class="onset-rime-value">{{ item.value || t('tools.checkTool.sidebar.emptyValue') }}</span>
                      <span class="onset-rime-count">{{ item.count }}</span>
                    </div>
                  </div>
                </div>

                <!-- 韵母统计 -->
                <div v-if="rimeStats.length > 0" class="onset-rime-section">
                  <div class="onset-rime-section-title">{{ t('tools.checkTool.sidebar.rimeTitle') }}</div>
                  <div class="onset-rime-items">
                    <div
                      v-for="(item, index) in rimeStats"
                      :key="'rime-' + index"
                      class="onset-rime-item"
                      :class="{ 'filtered': isRimeFiltered(item.value) }"
                      @click="filterByRime(item.value)"
                    >
                      <span class="onset-rime-value">{{ item.value || t('tools.checkTool.sidebar.emptyValue') }}</span>
                      <span class="onset-rime-count">{{ item.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                {{ t('tools.checkTool.sidebar.noOnsetRimeStats') }}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <button v-if="!isPortrait && sidebarCollapsed" class="sidebar-expand-btn" @click="toggleSidebar">
        ▶
      </button>

      <!-- 主工作区 -->
      <main class="main-work-area">
        <!-- 文件信息栏 -->
        <div class="file-info-bar glass-panel">
          <div class="file-info-left">
            <span class="file-name">📁 {{ fileName }}</span>
            <span class="file-rows">{{ t('tools.checkTool.fileBar.rows', { count: totalRows }) }}</span>
          </div>
          <button v-if="!isPortrait" class="main-glass-button" data-variant="secondary" data-size="small" @click="resetUpload">{{ t('tools.checkTool.fileBar.changeFile') }}</button>
          <button v-if="!isPortrait" class="main-glass-button info-help-btn" data-size="small" @click="showHelpModal = true">
            ❓ {{ t('tools.checkTool.fileBar.help') }}
          </button>
          <!-- 模式切换 -->
          <div class="mode-tabs glass-panel">
            <button
                class="tab-btn"
                :class="{ active: currentMode === 'table' }"
                @click="switchMode('table')"
            >
              📊 {{ t('tools.checkTool.fileBar.tableView') }}
            </button>
            <button
                class="tab-btn"
                :class="{ active: currentMode === 'command' }"
                @click="switchMode('command')"
            >
              💻 {{ t('tools.checkTool.fileBar.commandMode') }}
            </button>
          </div>
        </div>



        <!-- 表格视图 -->
        <div v-show="currentMode === 'table'" class="table-view">
          <!-- 工具栏 -->
          <div class="table-toolbar glass-panel">
            <div class="table-stats">
              <span>{{ t('tools.checkTool.table.errorCount') }}<strong>{{ errorStats.total }}</strong></span>
              <span class="ml-2">{{ t('tools.checkTool.table.pendingCount') }}<strong>{{ totalPendingChanges }}</strong></span>
              <span v-if="isEditMode" class="edit-hint">💡 {{ t('tools.checkTool.table.clickToEdit') }}</span>
            </div>
            <div class="table-actions">
              <button
                class="main-glass-button"
                data-size="small"
                :data-active="isEditMode ? 'true' : null"
                @click="toggleEditMode"
              >
                {{ isEditMode ? '👁️ ' + t('tools.checkTool.table.exitEdit') : '✏️ ' + t('tools.checkTool.table.enterEdit') }}
              </button>
              <button
                v-show="isEditMode"
                class="main-glass-button"
                data-size="small"
                data-variant="primary"
                :disabled="totalPendingChanges === 0"
                @click="batchSave"
              >
                💾 {{ t('tools.checkTool.table.saveChanges') }} ({{ totalPendingChanges }})
              </button>
              <button
                v-show="isEditMode"
                class="main-glass-button"
                data-size="small"
                @click="cancelEdit"
              >
                ❌ {{ t('tools.checkTool.table.cancel') }}
              </button>
              <button v-show="!isEditMode" class="main-glass-button" data-size="small" @click="showBatchReplaceModal = true">
                🔄 {{ t('tools.checkTool.table.batchReplace') }}
              </button>
              <button v-show="!isEditMode" class="main-glass-button" data-size="small" @click="downloadFile">
                ⬇️ {{ t('tools.checkTool.table.download') }}
              </button>
            </div>
          </div>

          <!-- 表格 -->
          <div class="table-container glass-panel" :class="{ loading: isLoadingTable || isEditModeLoading }">
            <div v-if="isLoadingTable || isEditModeLoading " class="table-loading-overlay">
              <div class="ui-loading--page" aria-hidden="true"></div>
              <div class="table-loading-text">{{ t('tools.checkTool.table.loading') }}</div>
            </div>

            <!-- Fixed Header -->
            <div class="virtual-table-header" :style="{ gridTemplateColumns: isEditMode ? '60px 80px 90px 80px 80px 80px 1fr 80px' : '60px 80px 90px 80px 80px 80px 1fr' }">
              <div class="header-cell">{{ t('tools.checkTool.table.row') }}</div>
              <div class="header-cell">{{ t('tools.checkTool.table.char') }}</div>
              <div class="header-cell">{{ t('tools.checkTool.table.ipa') }}</div>
              <div
                class="header-cell filterable-header"
                @click="openFilterModal('onset')"
                :class="{ 'filtered': filterOnset.size > 0 }"
              >
                {{ t('tools.checkTool.table.onset') }}{{ getFilterDisplayText('onset') }}
              </div>
              <div
                class="header-cell filterable-header"
                @click="openFilterModal('rime')"
                :class="{ 'filtered': filterRime.size > 0 }"
              >
                {{ t('tools.checkTool.table.rime') }}{{ getFilterDisplayText('rime') }}
              </div>
              <div
                class="header-cell filterable-header"
                @click="openFilterModal('tone')"
                :class="{ 'filtered': filterTone.size > 0 }"
              >
                {{ t('tools.checkTool.table.tone') }}{{ getFilterDisplayText('tone') }}
              </div>
              <div class="header-cell">{{ t('tools.checkTool.table.note') }}</div>
              <div v-show="isEditMode" class="header-cell">{{ t('tools.checkTool.table.actions') }}</div>
            </div>

            <!-- Virtual Scroller Body -->
            <RecycleScroller
              v-slot="{ item: row }"
              :items="displayedTableData"
              :item-size="40"
              :buffer="200"
              key-field="row"
              :key="`scroller-${showingAll}-${filterOnset.size}-${filterRime.size}-${filterTone.size}`"
              class="virtual-table-scroller ui-scrollbar"
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
                    :title="rowsToDelete.has(row.row) ? t('tools.checkTool.table.cancelDelete') : t('tools.checkTool.table.markDelete')"
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
              <h3>💻 {{ t('tools.checkTool.command.title') }}</h3>
              <button v-if="!isPortrait" class="main-glass-button info-help-btn" data-size="small" @click="showHelpModal = true">
                ❓ {{ t('tools.checkTool.command.help') }}
              </button>
            </div>

            <textarea
              v-model="commandInput"
              class="command-textarea ui-scrollbar"
              :placeholder="t('tools.checkTool.command.placeholder')"
            ></textarea>

            <div class="command-actions">
              <button class="main-glass-button" @click="clearCommand">🗑️ {{ t('tools.checkTool.command.clear') }}</button>
              <button class="main-glass-button" data-variant="primary" @click="executeCommand">▶️ {{ t('tools.checkTool.command.execute') }}</button>
            </div>

            <!-- 执行结果 -->
            <div v-if="commandLog.length > 0" class="command-result glass-panel">
              <div class="result-header">
                <h4>📋 {{ t('tools.checkTool.command.resultTitle') }}</h4>
                <button class="main-glass-button" data-size="small" @click="clearCommandLog">{{ t('tools.checkTool.command.clearResult') }}</button>
              </div>
              <div class="result-log ui-scrollbar">
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
    <AppModal
      :model-value="showBatchReplaceModal"
      size="sm"
      :title="t('tools.checkTool.batchReplace.title')"
      :close-label="t('tools.common.close')"
      :z-index="1500"
      @update:modelValue="showBatchReplaceModal = false"
    >
      <div class="check-tool-batch-replace-content">
        <div class="form-group">
          <label>{{ t('tools.checkTool.batchReplace.replaceType') }}</label>
          <SimpleSelectDropdown
            v-model="replaceType"
            :options="replaceTypeOptions"
            class="glass-input"
          />
        </div>

        <div v-if="replaceType === 'p'" class="form-group">
          <label>{{ t('tools.checkTool.batchReplace.sourceChar') }}</label>
          <input v-model="replaceFrom" type="text" class="glass-input" :placeholder="t('tools.checkTool.batchReplace.sourceCharPlaceholder')" />
          <div class="hint">{{ t('tools.checkTool.batchReplace.sourceCharHint') }}</div>
        </div>

        <div v-if="replaceType !== 'p'" class="form-group">
          <label>{{ t('tools.checkTool.batchReplace.sourceTone') }}</label>
          <input v-model="replaceFrom" type="text" class="glass-input" :placeholder="t('tools.checkTool.batchReplace.sourceTonePlaceholder')" />
          <div class="hint">{{ t('tools.checkTool.batchReplace.sourceToneHint') }}</div>
        </div>

        <div class="form-group">
          <label>{{ replaceType === 'p' ? t('tools.checkTool.batchReplace.targetChar') : t('tools.checkTool.batchReplace.targetTone') }}</label>
          <input
            v-model="replaceTo"
            type="text"
            class="glass-input"
            :placeholder="replaceType === 'p' ? t('tools.checkTool.batchReplace.targetCharPlaceholder') : t('tools.checkTool.batchReplace.targetTonePlaceholder')"
          />
          <div class="hint">{{ replaceType === 'p' ? t('tools.checkTool.batchReplace.targetCharHint') : t('tools.checkTool.batchReplace.targetToneHint') }}</div>
        </div>

        <div v-if="replaceType !== 'p'" class="hint-box">
          <strong>{{ replaceType === 'r' ? t('tools.checkTool.batchReplace.ruToneTitle') : t('tools.checkTool.batchReplace.shuToneTitle') }}</strong>
          {{
            replaceType === 'r'
              ? t('tools.checkTool.batchReplace.ruToneHint')
              : t('tools.checkTool.batchReplace.shuToneHint')
          }}
        </div>

        <div class="form-group">
          <label>{{ t('tools.checkTool.batchReplace.previewCommand') }}</label>
          <input :value="commandPreview" type="text" class="glass-input" readonly style="background: rgba(0,0,0,0.1);" />
        </div>
      </div>

      <template #footer>
<!--        <div class="check-tool-simple-modal-footer">-->
          <button class="main-glass-button" data-variant="secondary" @click="showBatchReplaceModal = false">{{ t('tools.checkTool.batchReplace.cancel') }}</button>
          <button class="main-glass-button" data-variant="primary" @click="executeBatchReplace">🔄 {{ t('tools.checkTool.batchReplace.execute') }}</button>
<!--        </div>-->
      </template>
    </AppModal>

    <!-- 帮助对话框 -->
    <AppModal
      :model-value="showHelpModal"
      size="lg"
      :title="t('tools.checkTool.help.title')"
      :close-label="t('tools.common.close')"
      :z-index="1500"
      @update:modelValue="showHelpModal = false"
    >
      <div class="help-content ui-scrollbar">
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
              <h4>🔍 {{ t('tools.checkTool.help.checksTitle') }}</h4>
              <ul>
                <li>{{ t('tools.checkTool.help.checkNonSingleChar') }}</li>
                <li>{{ t('tools.checkTool.help.checkInvalidIpa') }}</li>
                <li>{{ t('tools.checkTool.help.checkMissingTone') }}</li>
              </ul>
            </div>

            <div class="help-section">
              <h4>💻 {{ t('tools.checkTool.help.commandTitle') }}</h4>
              <table class="help-table">
                <thead>
                  <tr>
                    <th>{{ t('tools.checkTool.help.commandHeader') }}</th>
                    <th>{{ t('tools.checkTool.help.descriptionHeader') }}</th>
                    <th>{{ t('tools.checkTool.help.exampleHeader') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>c-漢字-新字</code></td>
                    <td>{{ t('tools.checkTool.help.replaceCharDesc') }}</td>
                    <td><code>c-帥-好</code></td>
                  </tr>
                  <tr>
                    <td><code>c-漢字-d</code></td>
                    <td>{{ t('tools.checkTool.help.deleteRowDesc') }}</td>
                    <td><code>c-帥-d</code></td>
                  </tr>
                  <tr>
                    <td><code>i-漢字-新音標</code></td>
                    <td>{{ t('tools.checkTool.help.modifyIpaDesc') }}</td>
                    <td><code>i-帥-jat4</code></td>
                  </tr>
                  <tr>
                    <td><code>p-原-新</code></td>
                    <td>{{ t('tools.checkTool.help.replaceIpaDesc') }}</td>
                    <td><code>p-'-ʰ</code></td>
                  </tr>
                  <tr>
                    <td><code>r{原}>{新}</code></td>
                    <td>{{ t('tools.checkTool.help.replaceRuToneDesc') }}</td>
                    <td><code>r5>2</code></td>
                  </tr>
                  <tr>
                    <td><code>s{原}>{新}</code></td>
                    <td>{{ t('tools.checkTool.help.replaceShuToneDesc') }}</td>
                    <td><code>s22>33</code></td>
                  </tr>
                </tbody>
              </table>
              <p class="hint-text">💡 {{ t('tools.checkTool.help.commandHint') }}<code>c-帥-好; i-帥-jat4</code></p>
            </div>

            <div class="help-section">
              <h4>✏️ {{ t('tools.checkTool.help.editTitle') }}</h4>
              <ul>
                <li>{{ t('tools.checkTool.help.editCell') }}</li>
                <li>{{ t('tools.checkTool.help.editBatch') }}</li>
                <li>{{ t('tools.checkTool.help.editCommand') }}</li>
              </ul>
            </div>
      </div>

      <template #footer>
        <div class="check-tool-modal-footer-actions">
          <button class="main-glass-button" data-variant="primary" @click="showHelpModal = false">{{ t('tools.checkTool.help.gotIt') }}</button>
        </div>
      </template>
    </AppModal>

    <!-- 文件格式说明对话框 -->
    <AppModal
      :model-value="showFormatHelpModal"
      size="lg"
      :title="t('tools.checkTool.formatHelp.title')"
      :close-label="t('tools.common.close')"
      :z-index="1500"
      @update:modelValue="showFormatHelpModal = false"
    >
      <div class="help-content ui-scrollbar">
            <!-- 音典格式 -->
            <div class="help-section">
              <h4>{{ t('tools.checkTool.formatHelp.singleTitle') }}</h4>
              <div class="format-details">
                <p><strong>{{ t('tools.checkTool.formatHelp.fileRequirement') }}</strong>{{ t('tools.checkTool.formatHelp.excelRequirement') }}</p>
                <p><strong>{{ t('tools.checkTool.formatHelp.requiredColumns') }}</strong></p>
                <ul>
                  <li>{{ t('tools.checkTool.formatHelp.singleCharColumn') }}</li>
                  <li>{{ t('tools.checkTool.formatHelp.singleIpaColumn') }}</li>
                  <li>{{ t('tools.checkTool.formatHelp.singleNoteColumn') }}</li>
                </ul>
                <p><strong>{{ t('tools.checkTool.formatHelp.feature') }}</strong>{{ t('tools.checkTool.formatHelp.singleFeature') }}</p>
              </div>
            </div>

            <!-- 跳跳老鼠格式 -->
            <div class="help-section">
              <h4>{{ t('tools.checkTool.formatHelp.multiTitle') }}</h4>
              <p>{{ t('tools.checkTool.formatHelp.multiSubtitle') }}</p>
              <div class="format-details">
                <p><strong>{{ t('tools.checkTool.formatHelp.fileRequirement') }}</strong>{{ t('tools.checkTool.formatHelp.excelRequirement') }}</p>
                <p><strong>{{ t('tools.checkTool.formatHelp.layout') }}</strong></p>
                <ul>
                  <li>{{ t('tools.checkTool.formatHelp.multiRule1') }}</li>
                  <li>{{ t('tools.checkTool.formatHelp.multiRule2') }}</li>
                </ul>
                <p><strong>{{ t('tools.checkTool.formatHelp.feature') }}</strong>{{ t('tools.checkTool.formatHelp.multiFeature') }}</p>
              </div>
            </div>

            <!-- 縣志格式 -->
            <div class="help-section">
              <h4>{{ t('tools.checkTool.formatHelp.gazetteerTitle') }}</h4>
              
              <div class="format-subsection">
                <h5>{{ t('tools.checkTool.formatHelp.excelTitle') }}</h5>
                <div class="format-details">
                  <p><strong>{{ t('tools.checkTool.formatHelp.fileRequirement') }}</strong>{{ t('tools.checkTool.formatHelp.excelRequirement') }}</p>
                  <p><strong>{{ t('tools.checkTool.formatHelp.contentRules') }}</strong></p>
                  <ul>
                    <li>{{ t('tools.checkTool.formatHelp.gazetteerExcelRule1') }}</li>
                    <li>{{ t('tools.checkTool.formatHelp.gazetteerExcelRule2') }}</li>
                    <li>{{ t('tools.checkTool.formatHelp.gazetteerExcelRule3') }}</li>
                  </ul>
                  <p><strong>{{ t('tools.checkTool.formatHelp.feature') }}</strong>{{ t('tools.checkTool.formatHelp.gazetteerExcelFeature') }}</p>
                </div>
              </div>

              <div class="format-subsection">
                <h5>{{ t('tools.checkTool.formatHelp.wordTitle') }}</h5>
                <div class="format-details">
                  <p><strong>{{ t('tools.checkTool.formatHelp.fileRequirement') }}</strong>{{ t('tools.checkTool.formatHelp.wordRequirement') }}</p>
                  <p><strong>{{ t('tools.checkTool.formatHelp.hierarchyRules') }}</strong></p>
                  <ul>
                    <li>{{ t('tools.checkTool.formatHelp.gazetteerWordRule1') }}</li>
                    <li>{{ t('tools.checkTool.formatHelp.gazetteerWordRule2') }}</li>
                  </ul>
                  <p><strong>{{ t('tools.checkTool.formatHelp.feature') }}</strong>{{ t('tools.checkTool.formatHelp.gazetteerWordFeature') }}</p>
                </div>
              </div>
            </div>
      </div>
      <template #footer>
        <div class="check-tool-modal-footer-actions">
          <button class="main-glass-button" data-variant="primary" @click="showFormatHelpModal = false">{{ t('tools.checkTool.formatHelp.gotIt') }}</button>
        </div>
      </template>
    </AppModal>

    <!-- 调值字符显示对话框 -->
    <AppModal
      :model-value="showToneCharsModal"
      size="sm"
      :title="toneCharsModalTitle"
      :close-label="t('tools.common.close')"
      :z-index="1500"
      @update:modelValue="showToneCharsModal = false"
    >
      <div class="tone-chars-display">
        {{ toneCharsModalContent }}
      </div>

      <template #footer>
<!--        <div class="check-tool-simple-modal-footer">-->
          <button class="main-glass-button" data-variant="primary" @click="showToneCharsModal = false">{{ t('tools.checkTool.toneChars.close') }}</button>
<!--        </div>-->
      </template>
    </AppModal>

    <!-- 列筛选对话框 -->
    <AppModal
      :model-value="showFilterModal"
      size="sm"
      :title="t('tools.checkTool.filter.title', { column: getFilterColumnLabel(filterColumnType) })"
      :close-label="t('tools.common.close')"
      :z-index="1500"
      @update:modelValue="showFilterModal = false"
    >
      <div class="filter-modal-body">
        <div class="filter-actions">
          <button class="main-glass-button" data-size="small" @click="toggleSelectAll">
            {{ isAllSelected ? t('tools.checkTool.filter.clearAll') : t('tools.checkTool.filter.selectAll') }}
          </button>
          <button class="main-glass-button" data-size="small" data-variant="secondary" @click="invertSelection">
            {{ t('tools.checkTool.filter.invert') }}
          </button>
        </div>

        <div class="filter-values-list ui-scrollbar">
          <div
            v-for="value in getUniqueValues(filterColumnType)"
            :key="value"
            class="filter-value-item"
            :class="{ 'selected': getCurrentFilterSet().has(value) }"
            @click="toggleFilterValue(value)"
          >
            <span class="checkbox">{{ getCurrentFilterSet().has(value) ? '✓' : '' }}</span>
            <span class="value-text">{{ value || t('tools.checkTool.filter.emptyValue') }}</span>
            <span class="value-count">
              {{ getValueCount(filterColumnType, value) }}
            </span>
          </div>
        </div>
      </div>

      <template #footer>
<!--        <div class="check-tool-simple-modal-footer">-->
          <button class="main-glass-button" data-variant="secondary" @click="showFilterModal = false">{{ t('tools.checkTool.filter.close') }}</button>
          <button class="main-glass-button" data-variant="primary" @click="showFilterModal = false">{{ t('tools.checkTool.filter.confirm') }}</button>
<!--        </div>-->
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RecycleScroller } from 'vue-virtual-scroller'
import AppModal from '@/components/common/AppModal.vue'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { useAsyncTask } from '@/composables/core/useAsyncTask.js'
import { useAuthGuard } from '@/composables/router/useAuthGuard.js'
import { useTabularImportFlow } from '@/composables/import/useTabularImportFlow.js'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import {
  uploadCheckFile,
  analyzeFile as analyzeFileApi,
  getToneStats,
  getTableData,
  updateRow as updateRowApi,
  batchDelete as batchDeleteApi,
  executeBatchOperation,
  downloadCheckResult
} from '@/api'
import { showSuccess, showError, showWarning, showConfirm } from '@/utils/message.js'

const { t } = useI18n()
const { requireAuth } = useAuthGuard()
const uploadTask = useAsyncTask()

// 基本状态
const fileInput = ref(null)
const fileUploaded = ref(false)
const fileName = ref('')
const totalRows = ref(0)
const taskId = ref(null)
const isDragOver = ref(false)
const selectedFormat = ref('音典') // 文件格式类型
const isSimplified = ref(false) // 新增：默认为 false (繁体)
const isUploading = ref(false) // 上传加载状态
const pendingPreviewFile = ref(null)
const previewConfirmKey = ref(0)
const checkImportPayload = ref(null)
const requireExplicitConfirmation = ref(false)

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

const errorStatsConfig = computed(() => ({
  nonSingleChar: { icon: '❌', label: t('tools.checkTool.errorTypes.nonSingleChar'), type: 'error' },
  invalidIpa: { icon: '⚠️', label: t('tools.checkTool.errorTypes.invalidIpa'), type: 'warning' },
  missingTone: { icon: '🔍', label: t('tools.checkTool.errorTypes.missingTone'), type: 'info' }
}))

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
const toneCharsModalToneType = ref('')
const toneCharsModalTone = ref('')
const toneCharsModalCount = ref(0)
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

// Replace type options
const replaceTypeOptions = computed(() => [
  { label: t('tools.checkTool.batchReplace.replaceTypeAll'), value: 'p' },
  { label: t('tools.checkTool.batchReplace.replaceTypeRu'), value: 'r' },
  { label: t('tools.checkTool.batchReplace.replaceTypeShu'), value: 's' }
])

const formatOptions = computed(() => [
  { label: t('tools.checkTool.welcome.formatYindian'), value: '音典' },
  { label: t('tools.checkTool.welcome.formatMultiChar'), value: '跳跳老鼠' },
  { label: t('tools.checkTool.welcome.formatGazetteer'), value: '縣志' }
])

const scriptOptions = computed(() => [
  { label: t('tools.checkTool.welcome.traditionalRecommended'), value: false },
  { label: t('tools.checkTool.welcome.simplifiedConvert'), value: true }
])

const checkImportSchema = computed(() => ([
  {
    key: 'char',
    label: t('common.importPreview.schemas.checkTool.char.label'),
    required: true,
    aliases: [
      t('common.importPreview.schemas.checkTool.char.aliases.char'),
      t('common.importPreview.schemas.checkTool.char.aliases.character'),
      t('common.importPreview.schemas.checkTool.char.aliases.word')
    ],
    description: t('common.importPreview.schemas.checkTool.char.description'),
    example: t('common.importPreview.schemas.checkTool.char.example')
  },
  {
    key: 'ipa',
    label: t('common.importPreview.schemas.checkTool.ipa.label'),
    required: true,
    aliases: [
      t('common.importPreview.schemas.checkTool.ipa.aliases.ipa'),
      t('common.importPreview.schemas.checkTool.ipa.aliases.phonetic'),
      t('common.importPreview.schemas.checkTool.ipa.aliases.pronunciation')
    ],
    description: t('common.importPreview.schemas.checkTool.ipa.description'),
    example: t('common.importPreview.schemas.checkTool.ipa.example')
  },
  {
    key: 'note',
    label: t('common.importPreview.schemas.checkTool.note.label'),
    required: false,
    aliases: [
      t('common.importPreview.schemas.checkTool.note.aliases.note'),
      t('common.importPreview.schemas.checkTool.note.aliases.comment')
    ],
    description: t('common.importPreview.schemas.checkTool.note.description'),
    example: t('common.importPreview.schemas.checkTool.note.example')
  }
]))
const checkPreviewState = useTabularImportPreview({
  schema: checkImportSchema,
  previewRowCount: 8,
  requireExplicitConfirmation: () => requireExplicitConfirmation.value
})
const checkImportFlow = useTabularImportFlow({
  previewState: checkPreviewState,
  pendingFileRef: pendingPreviewFile,
  payloadRef: checkImportPayload,
  confirmKeyRef: previewConfirmKey,
  beforePreview: async (file) => {
    const isAllowed = await requireAuth({
      message: t('tools.checkTool.messages.loginRequired'),
    })
    if (!isAllowed) {
      return false
    }

    const allowedExts = ['.xlsx', '.xls']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!allowedExts.includes(ext)) {
      showError(t('tools.checkTool.messages.previewInvalidFileType'))
      return false
    }

    if (file.size > 3 * 1024 * 1024) {
      showError(t('tools.checkTool.messages.fileTooLarge'))
      return false
    }

    return true
  },
  onAutoApply: async () => {
    await confirmPreviewAndUpload()
  },
  onPreviewError: (error) => {
    showError(t('tools.checkTool.messages.previewFailed', { message: error.message }))
  },
  resetInput: () => {
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
})
const isCheckImportReady = computed(() => checkImportFlow.isReady.value)
const checkImportSummary = computed(() => {
  if (!checkImportPayload.value) {
    return ''
  }

  const mappedCount = Object.values(checkImportPayload.value.mapping || {}).filter(Boolean).length
  const columnCount = checkImportPayload.value.sourceColumns?.length || 0
  return t('common.importPreview.mergeReferenceSummary', {
    mappedCount,
    columnCount
  })
})

// 计算属性
const totalPendingChanges = computed(() => {
  return pendingChanges.value.size + rowsToDelete.value.size
})

const toneCharsModalTitle = computed(() =>
  t('tools.checkTool.toneChars.title', {
    toneType: getToneTypeLabel(toneCharsModalToneType.value),
    tone: toneCharsModalTone.value,
    count: toneCharsModalCount.value
  })
)

const displayedErrors = computed(() => {
  // 侧边栏显示错误元数据，不是完整行数据
  if (currentFilter.value && currentFilter.value !== 'search') {
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
    checkImportFlow.loadPreview(file)
  }
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    checkImportFlow.loadPreview(file)
  }
}

const uploadFile = async (file, options = {}) => {
  const isAllowed = await requireAuth({
    message: t('tools.checkTool.messages.loginRequired'),
  })
  if (!isAllowed) {
    return
  }

  const allowedExts = ['.xlsx', '.xls', '.doc', '.docx', '.tsv']
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

  if (!allowedExts.includes(ext)) {
    showError(t('tools.checkTool.messages.invalidFileType'))
    return
  }

  if (file.size > 3 * 1024 * 1024) {
    showError(t('tools.checkTool.messages.fileTooLarge'))
    return
  }

  fileName.value = file.name

  await uploadTask.run(
    async () => {
      isUploading.value = true
      const data = await uploadCheckFile(file, selectedFormat.value || 'excel', isSimplified.value, options)

      taskId.value = data.task_id
      totalRows.value = data.total_rows || 0
      fileUploaded.value = true

      await analyzeFile()
    },
    {
      onError: (error) => {
        showError(t('tools.checkTool.messages.uploadFailed', { message: error.message }))
      },
      onFinally: () => {
        isUploading.value = false
      }
    }
  )
}

const previewFile = async (file) => {
  await checkImportFlow.loadPreview(file)
}

const handleCheckMappingUpdate = ({ fieldKey, sourceKey }) => {
  checkImportFlow.updateManualMapping({ fieldKey, sourceKey })
}

const clearPendingPreview = () => {
  checkImportFlow.clearPreview()
}

const confirmPreviewAndUpload = async () => {
  if (!pendingPreviewFile.value || !checkImportPayload.value?.isComplete) {
    showError(t('common.importPreview.messages.mappingIncomplete'))
    return
  }

  const activeSheet = checkPreviewState.previewTable.value?.activeSheet
  const columnMapping = {
    headerChar: checkPreviewState.mapping.value.char || null,
    headerIpa: checkPreviewState.mapping.value.ipa || null,
    headerNotes: checkPreviewState.mapping.value.note || null
  }

  const selectedFile = pendingPreviewFile.value
  checkImportFlow.clearPreview()
  await uploadFile(selectedFile, {
    columnMapping,
    headerRowIndex: checkPreviewState.headerRowIndex.value,
    sheetName: activeSheet?.name || null
  })
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
    showError(t('tools.checkTool.messages.analyzeFailed', { message: error.message }))
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
  const confirmed = await showConfirm(t('tools.checkTool.messages.confirmChangeFile'))
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
    pendingPreviewFile.value = null
    checkImportPayload.value = null
    checkPreviewState.resetState()
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
    showWarning(t('tools.checkTool.messages.nothingToSave'))
    return
  }

  const confirmMsg = t('tools.checkTool.messages.confirmSave', {
    modified: pendingChanges.value.size,
    deleted: rowsToDelete.value.size
  })
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

    showSuccess(t('tools.checkTool.messages.saveSuccess', {
      modified: pendingChanges.value.size,
      deleted: rowsToDelete.value.size
    }))

    // 清空并重新分析
    pendingChanges.value.clear()
    rowsToDelete.value.clear()
    isEditMode.value = false
    await analyzeFile()
  } catch (error) {
    showError(t('tools.checkTool.messages.saveFailed', { message: error.message }))
  }
}

const cancelEdit = async () => {
  if (totalPendingChanges.value > 0) {
    const confirmed = await showConfirm(t('tools.checkTool.messages.discardChanges'))
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
    showWarning(t('tools.checkTool.messages.enterCommand'))
    return
  }

  try {
    const data = await executeBatchOperation(taskId.value, {
      type: 'command',
      params: { commands: command.split('\n').filter(c => c.trim()) }
    })

    if (data.success) {
      commandLog.value = data.logs.map(log => ({
        type: log.includes('✅') || /成功|success/i.test(log) ? 'success' : 'error',
        message: log
      }))

      await analyzeFile()
    }
  } catch (error) {
    commandLog.value.push({
      type: 'error',
      message: '❌ ' + t('tools.checkTool.messages.commandExecutionFailed', { message: error.message })
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
    showWarning(t('tools.checkTool.messages.enterReplaceSource'))
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
      showSuccess(t('tools.checkTool.messages.replaceSuccess'))
      showBatchReplaceModal.value = false
      replaceFrom.value = ''
      replaceTo.value = ''
      await analyzeFile()
    }
  } catch (error) {
    showError(t('tools.checkTool.messages.replaceFailed', { message: error.message }))
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

        if ((toneType === 'ru' && isRu) || (toneType === 'shu' && !isRu)) {
          chars.push(row.char)
        }
      }

      toneCharsModalToneType.value = toneType
      toneCharsModalTone.value = tone
      toneCharsModalCount.value = chars.length
      toneCharsModalContent.value = chars.join(' ')
      showToneCharsModal.value = true
    }
  } catch (error) {
    showError(t('tools.checkTool.messages.fetchDataFailed', { message: error.message }))
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
    a.download = t('tools.checkTool.export.filePrefix') + nameWithoutExt + '.xlsx'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    showError(t('tools.checkTool.messages.downloadFailed', { message: error.message }))
  }
}

// 工具函数
const getFilterColumnLabel = (columnType) => {
  if (columnType === 'onset') return t('tools.checkTool.filter.onset')
  if (columnType === 'rime') return t('tools.checkTool.filter.rime')
  if (columnType === 'tone') return t('tools.checkTool.filter.tone')
  return ''
}

const getToneTypeLabel = (toneType) => {
  if (toneType === 'ru') return t('tools.checkTool.sidebar.ruToneTitle')
  if (toneType === 'shu') return t('tools.checkTool.sidebar.shuToneTitle')
  return ''
}

const getErrorTypeLabel = (type) => {
  if (type === 'nonSingleChar') return t('tools.checkTool.errorTypes.nonSingleChar')
  if (type === 'invalidIpa') return t('tools.checkTool.errorTypes.invalidIpa')
  if (type === 'missingTone') return t('tools.checkTool.errorTypes.missingTone')
  return type
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


$primary: var(--color-primary);
$text-main: var(--text-deep);
$text-muted: var(--text-tertiary);
$danger: var(--color-error-light);
$warning: var(--color-warning);
$success: var(--color-success);

$glass-light: rgba(255, 255, 255, 0.3);
$glass-soft: rgba(255, 255, 255, 0.4);
$glass-panel: rgba(255, 255, 255, 0.5);
$glass-strong: rgba(255, 255, 255, 0.6);
$glass-solid: rgba(255, 255, 255, 0.8);

$primary-soft: rgba(0, 122, 255, 0.1);
$primary-hover: rgba(0, 122, 255, 0.15);
$primary-selected: rgba(0, 122, 255, 0.2);
$danger-soft: rgba(255, 59, 48, 0.1);
$warning-soft: rgba(255, 149, 0, 0.15);
$success-soft: rgba(52, 199, 89, 0.1);

@mixin glass-blur($bg: $glass-panel, $blur: 10px, $radius: 16px, $border: rgba(255, 255, 255, 0.5)) {
  background: $bg;
  backdrop-filter: blur($blur);
  -webkit-backdrop-filter: blur($blur);
  border: 1px solid $border;
  border-radius: $radius;
}

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.check {
  /* 基础布局 */

  &-tool-container {
    width: 100%;
    height: 90%;
    display: flex;
    flex-direction: column;
    padding-top: 30px;
    --main-glass-button-padding: 8px 16px;
    --main-glass-button-border-radius: 10px;
    --main-glass-button-font-size: 13px;
    --main-glass-button-small-padding: 6px 12px;
    --main-glass-button-small-font-size: 12px;
    --main-glass-button-white-space: nowrap;
  }

  &-tool-simple-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin: 20px -18px -20px;
    padding: 16px 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.5);
  }

  &-tool-batch-replace-content {
    min-height: 0;
  }

  &-tool-modal-footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    width: 100%;
  }
}

.welcome {
  &-screen {
    width: 100%;
    height: 100%;
    @include flex-center;
    padding: 20px;
  }

  &-card {
    max-width: 980px;
    width: 100%;
    padding: 20px 30px;
    text-align: center;
  }

  &-icon {
    font-size: 64px;
  }

  &-features {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 24px 0;
    text-align: left;
  }
}

.feature {
  &-item {
    white-space: nowrap;
    justify-content: center;
    display: flex;
    font-size: 15px;
    align-items: center;
    gap: 12px;
    padding: 6px;
    background: $glass-light;
    border-radius: 12px;
  }

  &-icon {
    width: 24px;
    height: 24px;
    @include flex-center;
    background: rgba(52, 199, 89, 0.2);
    border-radius: 50%;
    color: $success;
    font-weight: 700;
  }
}

.format {
  &-selector {
    margin: 10px 0;
    padding: 8px;
    background: $glass-soft;
    border-radius: 16px;
    text-align: left;
  }

  &-label-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  &-label {
    font-size: 14px;
    font-weight: 600;
    color: $text-main;
    margin: 0;
  }

  &-options {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    :deep(.liquid-radio-group) {
      justify-content: flex-start;
      gap: 12px;
    }
  }

  &-details {
    margin-top: 8px;
    padding: 12px;
    background: $glass-light;
    border-radius: 8px;

    p {
      margin: 6px 0;
    }

    ul {
      margin: 8px 0;
      padding-left: 24px;
    }
  }

  &-subsection {
    margin-top: 16px;
    padding-left: 16px;
    border-left: 3px solid rgba(0, 122, 255, 0.3);

    h5 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: $primary;
    }
  }
}

.upload-zone-drop {
  @include glass-blur(rgba(255, 255, 255, 0.45), 12px, 22px, rgba(255, 255, 255, 0.58));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 26px 28px;
  border: 2px dashed rgba(0, 122, 255, 0.28);
  cursor: pointer;
  transition: all 0.25s ease;

  &.drag-over {
    border-color: rgba(0, 122, 255, 0.58);
    background: rgba(0, 122, 255, 0.08);
  }

  &.uploading {
    cursor: progress;
  }
}

.upload-preview-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &--check {
    margin-top: 8px;
  }

  &__buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.hint-text--summary {
  margin: 0;
  color: rgba(11, 37, 64, 0.72);
}

.work {
  &-area {
    height: 100%;
    display: flex;
    gap: 16px;
    padding: 20px;
    overflow: hidden;
    width: 90dvw;
    position: relative;
  }
}


.sidebar {
  /* 侧边栏 */

  width: 280px;
  min-width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
  transition: all 0.3s ease;

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      font-size: 16px;
      margin: 0;
      white-space: nowrap;
    }
  }

  &-expand-btn {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 20;
    width: 40px;
    height: 40px;
    @include glass-blur(rgba(255, 255, 255, 0.75), 10px, 10px);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.9);
    }
  }

  &-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  /* 侧边栏分区 */

  &-section {
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 12px;
    overflow: hidden;
    transition: flex 0.3s ease;

    /* 两个都展开时各占一半 */

    &:not(.collapsed) {
      flex: 1;
      min-height: 0;
    }

    /* 收起时只占标题高度 */

    &.collapsed {
      flex: 0 0 auto;
    }
  }
}

.collapse {
  &-btn {
    padding: 4px 8px;
    background: $glass-light;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: $glass-panel;
    }
  }
}

.section {
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: $primary-soft;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover {
      background: $primary-hover;
    }
  }

  &-title {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &-content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
    min-height: 0;
  }
}

.toggle {
  &-icon {
    font-size: 12px;
    transition: transform 0.2s ease;
  }
}

.error {
  /* 错误统计 */

  &-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }

  /* 错误列表 */

  &-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
  }

  &-item {
    padding: 8px;
    background: $glass-light;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;
    display: flex;
    gap: 10px;
    justify-content: center;

    > * {
      flex: 1;           /* 強制每個元素佔據相等的剩餘空間 */
      text-align: center; /* 讓文字在各自平分的區塊內居中 */
    }

    &:hover {
      background: $glass-panel;
    }
  }

  &-row-num {
    font-size: 10px;
    color: $text-muted;
    margin-bottom: 2px;
  }

  &-char {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 2px;
  }

  &-type-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 500;

    &.nonSingleChar {
      background: rgba(255, 59, 48, 0.15);
      color: $danger;
    }

    &.invalidIpa {
      background: $warning-soft;
      color: $warning;
    }

    &.missingTone {
      background: rgba(0, 122, 255, 0.15);
      color: $primary;
    }
  }

  &-more {
    padding: 8px;
    text-align: center;
    font-size: 12px;
    color: $text-muted;
  }

  &-cell {
    position: relative;
  }

  &-indicator {
    margin-left: 4px;
    font-size: 12px;
  }
}

.stat {
  &-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px;
    background: $glass-light;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: $glass-panel;
      transform: translateY(-2px);
    }

    .badge {
      font-size: 18px;
    }

    .label {
      flex: 1;
      font-size: 13px;
    }

    .count {
      font-weight: 700;
      font-size: 16px;
    }

    &.error .count {
      color: $danger;
    }

    &.warning .count {
      color: $warning;
    }

    &.info .count {
      color: $primary;
    }
  }
}

.tone {
  /* 调值统计 */

  &-stats-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
  }

  &-section-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    flex-shrink: 0;

    &.ru {
      color: $danger;
    }

    &.shu {
      color: $primary;
    }
  }

  &-item {
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s ease;

    &.ru {
      background: $danger-soft;

      &:hover {
        background: rgba(255, 59, 48, 0.2);
      }
    }

    &.shu {
      background: $primary-soft;

      &:hover {
        background: $primary-selected;
      }
    }
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  &-value {
    font-weight: 600;
  }

  &-count {
    color: $text-muted;
    font-size: 11px;
  }

  &-chars {
    color: $text-muted;
    font-size: 11px;
    line-height: 1.4;
  }

  &-chars-display {
    font-size: 16px;
    line-height: 2;
    word-break: break-all;
  }
}

.onset {
  /* 声韵统计 */

  &-rime-stats-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
  }

  &-rime-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &-rime-section-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
    flex-shrink: 0;
    color: $primary;
  }

  &-rime-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &-rime-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    background: $glass-light;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;

    &:hover {
      background: $glass-panel;
    }

    &.filtered {
      background: $primary-selected;
      border: 1px solid rgba(0, 122, 255, 0.4);
    }
  }

  &-rime-value {
    font-weight: 500;
    flex: 1;
  }

  &-rime-count {
    color: $text-muted;
    font-size: 11px;
    background: rgba(0, 0, 0, 0.05);
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 24px;
    text-align: center;
  }
}

.filter {
  /* 筛选 */

  &-section {
    display: flex;
    flex-direction: row;
    gap: 8px;
    flex-shrink: 0;
    align-items: center;
  }

  &-indicator {
    margin-left: 4px;
    font-size: 12px;
  }

  &-modal-body {
    max-height: 60dvh;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  &-values-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 400px;
  }

  &-value-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: $glass-light;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.97);
    }

    &.selected {
      background: $primary-selected;
      border: 1px solid rgba(0, 122, 255, 0.4);

      .checkbox {
        background: $primary-selected;
        border-color: $primary;
      }
    }

    .checkbox {
      width: 20px;
      height: 20px;
      @include flex-center;
      background: $glass-panel;
      border: 2px solid rgba(0, 122, 255, 0.3);
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      color: $primary;
      flex-shrink: 0;
    }

    .value-text {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }

    .value-count {
      font-size: 12px;
      color: $text-muted;
      background: rgba(0, 0, 0, 0.05);
      padding: 2px 8px;
      border-radius: 12px;
      flex-shrink: 0;
    }
  }
}

.search {
  &-input {
    flex: 1;
    min-width: 0;
  }
}

.main {
  /* 主工作区 */

  &-work-area {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }
}

.file {
  &-info-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
  }

  &-info-left {
    display: flex;
    align-items: center;
    flex-direction: column;
    max-width: 150px;
  }

  &-name {
    font-weight: 600;
    font-size: 14px;
    white-space: nowrap;
  }

  &-rows {
    font-size: 13px;
    color: $text-muted;
  }
}

.mode {
  /* 模式切换 */

  &-tabs {
    display: flex;
    gap: 8px;
    padding: 8px;
  }
}

.tab {
  &-btn {
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

    &.active {
      background: rgba(0, 122, 255, 0.7);
      backdrop-filter: blur(14px);
      border-color: rgba(0, 122, 255, 0.6);
      color: white;
      box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
    }
  }
}

.table {
  /* 表格视图 */

  &-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  &-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
  }

  &-stats {
    display: flex;
    gap: 16px;
    font-size: 13px;
    align-items: center;
    flex-wrap: wrap;

    strong {
      color: $primary;
      font-weight: 700;
    }
  }

  &-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &-container {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    position: relative;

    &.loading {
      pointer-events: none;
    }
  }

  &-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: $glass-solid;
    backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 100;
  }

  &-loading-text {
    font-size: 14px;
    color: $primary;
    font-weight: 500;
  }
}

.edit {
  &-hint {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: $primary-soft;
    border-radius: 8px;
    font-size: 12px;
    color: $primary;
    font-weight: 500;
    animation: pulse 2s ease-in-out infinite;
  }
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

.ml {
  &-2 {
    margin-left: 8px;
  }
}

.virtual {
  /* Virtual Table Styles */

  &-table-header {
    display: grid;
    width: max-content;
    min-width: 100%;
    background: $glass-strong;
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 2px solid rgba(0, 122, 255, 0.2);
  }

  &-table-scroller {
    height: calc(100% - 44px);
    overflow-y: auto;
    min-width: 100%;
  }

  &-table-row {
    display: grid;
    width: max-content;
    min-width: 100%;
    min-height: 40px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    transition: background 0.2s ease;

    &:hover {
      background: rgba(0, 122, 255, 0.05);
    }

    &.modified-row {
      background: rgba(255, 204, 0, 0.1);
    }

    &.marked-for-delete {
      background: $danger-soft;
      text-decoration: line-through;
    }

    &.highlight-row {
      background: $primary-selected;
      animation: highlight 2s ease;
    }
  }
}

.header {
  &-cell {
    padding: 10px 12px;
    text-align: center;
    font-weight: 600;
    color: $text-main;
    font-size: 13px;
    border-right: 1px solid rgba(255, 255, 255, 0.3);

    &:last-child {
      border-right: none;
    }
  }
}

.filterable {
  &-header {
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      background: $primary-soft;
    }

    &.filtered {
      background: $primary-hover;
      color: $primary;
    }
  }
}

@keyframes highlight {
  0%, 100% {
    background: rgba(0, 122, 255, 0.05);
  }

  50% {
    background: rgba(0, 122, 255, 0.3);
  }
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

  &:last-child {
    border-right: none;
  }

  &-note {
    text-align: left;
    justify-content: flex-start;
  }

  /* 删除按钮 */

  &-action {
    text-align: center;
  }
}

.editable {
  &-cell {
    cursor: pointer;
    position: relative;
    background: rgba(0, 122, 255, 0.02);
    border: 1px dashed rgba(0, 122, 255, 0.2) !important;

    &:hover {
      background: rgba(0, 122, 255, 0.08);
      border-color: rgba(0, 122, 255, 0.4) !important;
    }
  }
}

.delete {
  &-btn-icon {
    padding: 4px 8px;
    background: $danger-soft;
    border: 1px solid rgba(255, 59, 48, 0.3);
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 59, 48, 0.2);
      transform: scale(1.1);
    }

    &.delete-active {
      background: rgba(52, 199, 89, 0.2);
      border-color: rgba(52, 199, 89, 0.5);

      &:hover {
        background: rgba(52, 199, 89, 0.3);
      }
    }
  }
}

.command {
  /* 指令视图 */

  &-view {
    flex: 1;
    overflow-y: auto;
  }

  &-panel {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      margin: 0;
      font-size: 18px;
    }
  }

  &-textarea {
    min-height: 300px;
    padding: 16px;
    @include glass-blur($glass-panel, 10px, 16px);
    color: $text-main;
    font-size: 14px;
    font-family: "SF Mono", Monaco, monospace;
    resize: vertical;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.7);
      border-color: rgba(0, 122, 255, 0.5);
      box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
    }
  }

  &-actions {
    display: flex;
    gap: 12px;
  }

  &-result {
    padding: 16px;
    max-height: 300px;
  }
}

.result {
  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    h4 {
      margin: 0;
      font-size: 14px;
    }
  }

  &-log {
    max-height: 200px;
    overflow-y: auto;
  }
}

.log {
  &-item {
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: 8px;
    font-size: 13px;
    font-family: "SF Mono", Monaco, monospace;

    &.success {
      background: $success-soft;
      color: $success;
    }

    &.error {
      background: $danger-soft;
      color: $danger;
    }
  }
}

.glass {
  /* 通用样式 */

  &-container {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(25px) saturate(180%);
    -webkit-backdrop-filter: blur(25px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 30px;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  }

  &-panel {
    @include glass-blur($glass-panel, 10px, 16px);
  }

  &-input {
    padding: 8px 12px;
    @include glass-blur($glass-strong, 8px, 8px);
    color: $text-main;
    font-size: 13px;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      background: $glass-solid;
      border-color: rgba(0, 122, 255, 0.5);
      box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
    }
  }
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: $text-main;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: rgba(11, 37, 64, 0.7);
  margin: 0 0 24px 0;
}

.upload {
  &-zone-drop {
    padding: 20px 40px;
    background: $glass-soft;
    backdrop-filter: blur(10px);
    border: 2px dashed rgba(0, 122, 255, 0.3);
    border-radius: 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    &:hover,
    &.drag-over {
      background: rgba(0, 122, 255, 0.05);
      border-color: rgba(0, 122, 255, 0.6);
      transform: scale(1.02);
    }

    &.uploading {
      cursor: not-allowed;
      background: rgba(0, 122, 255, 0.03);
      border-color: rgba(0, 122, 255, 0.2);
      pointer-events: none;
    }
  }

  &-icon-large {
    font-size: 48px;
    animation: float 3s ease-in-out infinite;
  }

  &-text {
    font-size: 16px;
    font-weight: 500;
    color: $text-main;
    margin: 0;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

.hint {
  margin-top: 4px;
  font-size: 11px;
  color: $text-muted;

  &-text {
    font-size: 12px;
    color: $text-muted;
    margin: 0;
  }

  &-box {
    padding: 12px;
    background: $primary-soft;
    border-radius: 8px;
    font-size: 12px;
    color: $text-muted;
  }
}

.form {
  &-group {
    margin-bottom: 16px;
    align-items: center;
    display: flex;
    flex-direction: column;

    label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 600;
      color: $text-main;
    }
  }
}

.help {
  /* 帮助内容 */

  &-content {
    max-height: 60vh;
  }

  &-section {
    margin-bottom: 24px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 15px;
      color: $text-main;
    }

    ul {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      line-height: 1.8;
    }

    p {
      margin: 8px 0;
      font-size: 13px;
      line-height: 1.6;
      color: rgba(11, 37, 64, 0.8);
    }
  }

  &-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin: 12px 0;

    th,
    td {
      padding: 8px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      text-align: left;
    }

    th {
      background: $primary-soft;
      font-weight: 600;
    }

    code {
      background: $primary-soft;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: "SF Mono", Monaco, monospace;
      font-size: 11px;
    }
  }
}

/* 移动端适配 */

@media (max-aspect-ratio: 1/1) {
  .work {
    &-area {
      padding: 10px;
      width: 96dvw;
    }
  }

  .glass {
    &-container {
      padding: 20px 16px;
      border-radius: 20px;
    }
  }

  .header {
    &-section {
      padding-bottom: 16px;
    }
  }

  .title {
    font-size: 22px;
  }

  .subtitle {
    font-size: 13px;
  }

  .format {
    &-selector {
      margin: 0;
      padding: 6px;
    }

    &-label {
      font-size: 13px;
      margin-bottom: 10px;
    }

    &-options {
      gap: 8px;

      :deep(.liquid-radio-group) {
        gap: 8px;
      }
    }
  }

  .welcome {
    &-screen {
      padding: 10px;
    }

    &-card {
      padding: 20px 16px;
      max-width: 100%;
    }

    &-icon {
      font-size: 48px;
    }

    &-features {
      margin: 16px 0;
      gap: 6px;
    }
  }

  .feature {
    &-item {
      padding: 8px 10px;
      font-size: 13px;
      gap: 10px;
    }

    &-icon {
      width: 20px;
      height: 20px;
      font-size: 12px;
    }
  }

  .upload {
    &-zone-drop {
      padding: 24px 20px;
      border-radius: 20px;
    }

    &-icon-large {
      font-size: 48px;
    }

    &-text {
      font-size: 16px;
    }

    &-section {
      padding: 16px;
    }

    &-zone {
      padding: 24px 20px;
    }

    &-icon {
      font-size: 48px;
    }

    &-hint {
      font-size: 12px;
    }
  }

  .hint {
    &-text {
      font-size: 12px;
    }
  }

  .analyze {
    &-btn {
      padding: 14px 28px;
      font-size: 15px;
    }
  }

  .sidebar {
    width: 100%;
    max-height: 300px;
    padding: 12px;

    &-section {
      min-height: 120px;
    }
  }

  .section {
    &-header {
      padding: 10px;
    }

    &-title {
      font-size: 14px;
    }

    &-content {
      padding: 10px;
    }
  }

  .error {
    &-stats {
      gap: 8px;
      padding: 10px;
    }

    &-search {
      padding: 8px 12px;
      font-size: 13px;
    }

    &-list {
      gap: 6px;
    }

    &-item {
      padding: 10px;
      font-size: 12px;
    }

    &-badge {
      font-size: 10px;
      padding: 2px 6px;
    }
  }

  .filter {
    &-section {
      flex-direction: column;
      gap: 6px;

      .main-glass-button {
        width: 100%;
        padding: 8px 12px;
      }
    }
  }

  .search {
    &-input {
      width: 100%;
    }
  }

  .main {
    &-glass-button[data-size="small"] {
      padding: 8px 12px;
      font-size: 12px;
    }
  }

  .stat {
    &-item {
      font-size: 12px;
      padding: 8px 12px;
    }
  }

  .tone {
    &-stats-grid {
      gap: 10px;
    }

    &-card {
      padding: 10px;
    }

    &-label {
      font-size: 12px;
    }

    &-count {
      font-size: 16px;
    }
  }

  .table {
    &-toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      padding: 12px;
    }

    &-stats {
      gap: 10px;
      font-size: 12px;
    }

    &-actions {
      flex-wrap: wrap;
      gap: 8px;
    }

    &-container {
      border-radius: 12px;
    }
  }

  .edit {
    &-hint {
      font-size: 11px;
      padding: 3px 8px;
    }

    /* 编辑对话框移动端适配 */

    &-dialog-overlay {
      padding: 10px;
    }

    &-dialog {
      width: calc(100vw - 20px);
      max-width: 100%;
      border-radius: 16px;
    }
  }

  .mode {
    &-indicator {
      font-size: 13px;
      padding: 8px 14px;
    }
  }

  .toolbar {
    &-btn {
      padding: 10px 16px;
      font-size: 13px;
      white-space: nowrap;
    }
  }

  .data {
    &-table {
      font-size: 11px;

      th,
      td {
        padding: 6px 8px;
      }
    }
  }

  .editable {
    &-cell {
      border: 1px dashed rgba(0, 122, 255, 0.3) !important;
      background: rgba(0, 122, 255, 0.05);

      &::after {
        content: "✏️";
        position: absolute;
        right: 2px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 8px;
        opacity: 0.5;
      }
    }
  }

  .delete {
    &-btn-icon {
      font-size: 16px;
    }
  }

  .dialog {
    &-header {
      padding: 16px;
    }

    &-title {
      font-size: 18px;
    }

    &-body {
      padding: 16px;
      gap: 16px;
    }

    &-footer {
      padding: 12px 16px;
      gap: 8px;
    }

    &-btn {
      flex: 1;
      padding: 12px;
    }
  }

  .form {
    &-group label {
      font-size: 13px;
    }

    &-input,
    &-textarea {
      padding: 10px 12px;
      font-size: 14px;
    }
  }

  .batch {
    /* 批量替换对话框移动端适配 */

    &-replace-dialog {
      width: calc(100vw - 20px);
      max-width: 100%;
    }
  }

  .replace {
    &-type-tabs {
      padding: 12px 16px;
      gap: 6px;
      overflow-x: auto;
    }

    &-tab {
      padding: 8px 12px;
      font-size: 13px;
      white-space: nowrap;
    }
  }

  .command {
    /* 命令面板移动端适配 */

    &-input-container {
      padding: 12px;
    }

    &-input {
      padding: 10px 12px;
      font-size: 14px;
    }

    &-buttons {
      gap: 6px;
    }

    &-output {
      padding: 12px;
      font-size: 12px;
    }
  }

  .cmd {
    &-btn {
      padding: 8px 12px;
      font-size: 12px;
    }
  }
}

/* 额外的小屏幕适配 */

@media (max-width: 480px) {
  .glass {
    &-container {
      padding: 16px 12px;
    }
  }

  .welcome {
    &-screen {
      padding: 5px;
    }

    &-card {
      padding: 16px 12px;
    }

    &-icon {
      font-size: 40px;
    }

    &-features {
      margin: 12px 0;
      gap: 4px;
    }
  }

  .title {
    font-size: 20px;
  }

  .subtitle {
    font-size: 12px;
  }

  .feature {
    &-item {
      padding: 6px 8px;
      font-size: 12px;
      gap: 8px;
    }

    &-icon {
      width: 18px;
      height: 18px;
      font-size: 11px;
    }
  }

  .format {
    &-selector {
      padding: 6px;
      margin: 8px 0;
    }

    &-label {
      font-size: 12px;
    }

    &-options {
      gap: 6px;

      :deep(.liquid-radio-group) {
        gap: 6px;
      }
    }
  }

  .upload {
    &-zone-drop {
      padding: 20px 16px;
    }

    &-icon-large {
      font-size: 40px;
    }

    &-text {
      font-size: 15px;
    }
  }

  .hint {
    &-text {
      font-size: 11px;
    }
  }

  .sidebar {
    max-height: 250px;
    padding: 10px;

    &-section {
      min-height: 100px;
    }
  }

  .section {
    &-header {
      padding: 8px;
    }

    &-title {
      font-size: 13px;
    }

    &-content {
      padding: 8px;
    }
  }

  .error {
    &-stats {
      padding: 8px;
    }

    &-item {
      padding: 8px;
      font-size: 11px;
      gap: 6px;
    }
  }

  .stat {
    &-item {
      padding: 6px 10px;
      font-size: 11px;
    }
  }

  .filter {
    &-section {
      gap: 4px;

      .main-glass-button {
        padding: 6px 12px;
        font-size: 12px;
      }
    }
  }

  .search {
    &-input {
      padding: 6px 10px;
      font-size: 12px;
    }
  }

  .tone {
    &-section-title {
      font-size: 12px;
    }

    &-item {
      padding: 8px;
    }

    &-value {
      font-size: 12px;
    }

    &-count {
      font-size: 11px;
    }

    &-chars {
      font-size: 10px;
    }
  }

  .table {
    &-stats {
      gap: 8px;
      font-size: 11px;
    }
  }

  .edit {
    &-hint {
      font-size: 10px;
      padding: 2px 6px;
    }
  }

  .data {
    &-table {
      font-size: 10px;

      th,
      td {
        padding: 4px 6px;
      }
    }
  }

  .editable {
    &-cell::after {
      font-size: 7px;
      right: 1px;
    }
  }

  .toolbar {
    &-btn {
      padding: 8px 12px;
      font-size: 12px;
    }
  }

  .mode {
    &-indicator {
      font-size: 12px;
      padding: 6px 12px;
    }
  }
}

.row {
  /* 表格行内编辑输入框样式 */

  &-input {
    width: 100%;
    height: 100%;
    padding: 4px;
    text-align: center; /* 让文字居中 */
    border: none;
    background: rgba(255, 255, 255, 0.5); /* 稍微明显的背景 */
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;

    &:focus {
      background: white;
      box-shadow: inset 0 0 0 2px var(--color-primary);
    }
  }
}

// "说明" help buttons — stand out from the glass background with a visible border and hover glow
.info-help-btn {
  border: 1px dashed rgba(0, 122, 255, 0.45) !important;
  background: rgba(0, 122, 255, 0.07) !important;
  color: var(--color-primary-hover) !important;
  font-weight: 600 !important;
  transition: all 0.22s ease !important;

  &:hover:not(:disabled) {
    background: rgba(0, 122, 255, 0.14) !important;
    border-color: rgba(0, 122, 255, 0.65) !important;
    box-shadow: 0 2px 12px rgba(0, 122, 255, 0.18) !important;
    transform: translateY(-2px) !important;
  }
}
