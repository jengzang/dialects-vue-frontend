# 分析結果

檢視聲學分析的詳細結果，包括基頻、強度、共振峰、頻譜圖等。

## 單音節分析結果

單音節模式的分析最為精確：

![單音節分析結果概覽](/tutorial/explore-praat-results/01-single-overview.webp)

### 基頻與強度

基頻軌跡可以較為清晰地看出調型走向，黃色部分為韻核。五度標調是後端自動計算的調值波動，例如 `3.67-1.7-1.18-1.04-1.85`，表示先降後微升的調型。強度軌跡反映了聲音的大小變化：

![基頻曲線和強度軌跡](/tutorial/explore-praat-results/02-pitch-and-intensity.webp)

### 共振峰與頻譜圖

共振峰軌跡反映元音音值；頻譜圖展示頻率-時間的能量分佈（僅支援 3 秒以內語音，需手動點選載入）：

![共振峰軌跡和頻譜圖](/tutorial/explore-praat-results/03-formant-spectrogram.webp)

### 品質分析與設定

音質分析包括諧噪比（HNR）、基頻微擾（jitter）、振幅微擾（shimmer）等指標。點選齒輪圖示可重新調整分析設定：

![品質分析卡片和分析設定](/tutorial/explore-praat-results/04-quality-and-settings.webp)

## 連續語流分析結果

連續語流的分析概覽：

![連續語流分析結果概覽](/tutorial/explore-praat-results/05-continuous-overview.webp)

基頻軌跡圖中，深藍色是 voiced，淺藍色是 speech，無顏色是 silence。連續語流的五度標調參考價值有限：

![連續語流基頻軌跡](/tutorial/explore-praat-results/06-continuous-pitch.webp)

強度軌跡反映了音訊的音量大小變化：

![連續語流強度軌跡](/tutorial/explore-praat-results/07-continuous-intensity.webp)

連續語流的共振峰軌跡較亂：

![連續語流共振峰軌跡](/tutorial/explore-praat-results/08-continuous-formant.webp)

頻譜圖載入完成後可檢視能量分佈：

![連續語流頻譜圖載入完成](/tutorial/explore-praat-results/09-spectrogram-loaded.webp)

連續語流的品質分析結果：

![連續語流品質分析](/tutorial/explore-praat-results/10-continuous-quality.webp)

## 圖表互動

所有圖表支援拖動、縮放，可檢視每個資料點的具體數值：

![圖表拖拽縮放互動](/tutorial/explore-praat-results/11-chart-interaction.webp)

## 任務流程

1. 點選「開始分析」後上傳音訊並建立分析任務
2. 自動輪詢任務狀態，顯示進度
3. 任務完成後自動載入完整結果
4. 離開頁面時自動取消未完成的任務

## 提示

- 沒有登入時會先跳轉到登入頁面
- 如果某個模組沒有勾選，對應的卡片和圖表不會顯示
