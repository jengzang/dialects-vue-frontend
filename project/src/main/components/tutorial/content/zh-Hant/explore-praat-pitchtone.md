# 基頻定調

在音高曲線上手動框選樣本，用石鋒 T 值法進行五度制標調。

## 基本流程

1. 確保分析結果中包含基頻（pitch）資料
2. 在音高曲線上框選一段樣本——推薦單音節的黃色 rime_core（韻核）部分，或連續語流的深藍色 voiced 段

![在音高曲線上框選樣本段（紅框）](/tutorial/explore-praat-pitchtone/01-select-segment.webp)

3. 輸入調類名稱後「加入列表」

![輸入調類名稱並加入列表](/tutorial/explore-praat-pitchtone/02-add-tone.webp)

4. 同調名可重複加入多段樣本，它們會累積在同一調類下。一條錄音可擷取多個調類
5. 擷取完所有調類後點擊「開始分析」
6. 系統根據石鋒 T 值法繪製五度圖

## 結果

石鋒 T 值法五度圖（陽春崗美話 5 個調型）：

![石鋒 T 值法五度圖](/tutorial/explore-praat-pitchtone/03-tvalue-chart.webp)

- 陰平 33（略降）
- 陽平 41（調首略升）
- 上聲 31
- 陰去 425（曲折調）
- 陽去 454（調尾略降）

會顯示最高、最低頻率，也可匯出到 Excel 自行處理（檔名以「方音圖鑑_T值法定調_」開頭）：

![T 值結果——頻率與調值詳情](/tutorial/explore-praat-pitchtone/04-tvalue-result.webp)

## 資料儲存

- 已儲存的調類寫入 localStorage，重新整理頁面後自動恢復
- 可隨時清空全部已儲存調類

## 移動端

移動端也可以很方便地使用基頻定調：

![移動端 T 值介面](/tutorial/explore-praat-pitchtone/05-mobile-tvalue.webp)

移動端 T 值結果與下載：

![移動端 T 值結果與下載](/tutorial/explore-praat-pitchtone/06-mobile-tvalue-result.webp)

## 提示

- 如果沒有 pitch 資料，此頁面無法使用
- 推薦使用單音節模式擷取韻核部分進行精確分析
- 連續語流模式下推薦擷取 voiced（深藍色）段
