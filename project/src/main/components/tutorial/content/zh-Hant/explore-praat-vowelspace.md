# 元音空間

根據分析結果中的 F1/F2 共振峰資料繪製元音空間圖，檢視元音音值及滑動軌跡。

## 前提

- 設定中必須勾選「共振峰分析」模組
- 推薦使用「單音節」模式
- 需要在安靜環境下精確擷取語音

## 顯示模式

- **分段顯示**（預設）：按 rime_core、syllable_like、voiced 三類片段分別著色
- **全部散點**：所有有效 F1/F2 資料點畫到圖上，不按片段分色

## 互動

- 可選擇/取消選擇各段落
- 統計卡片顯示當前選中段落的平均 F1、平均 F2 與資料點數
- 可勾選參考元音作為對照

## 實例

陽春白話「你」字的元音軌跡：從 ɛ 往下滑到 æ，再往上滑到 ɨ 附近結束。

![陽春白話「你」字的元音滑動軌跡](/tutorial/explore-praat-vowelspace/01-ni-trajectory.webp)

陽春合水涯話的「高」字，韻母並不完全是 ɔ，有向上滑動的動程：

![合水涯話「高」字的元音](/tutorial/explore-praat-vowelspace/02-gao-vowel.webp)

東莞石排話的「寶」，起點介於 ə 和 ɐ 之間，終點未達到 u：

![東莞石排「寶」字的元音](/tutorial/explore-praat-vowelspace/03-bao-vowel.webp)

## 連續語流模式

連續語流模式的元音點非常散，誤差較大。不按語音段分組時所有點混在一起：

![連續語流散點圖——不按語音分段](/tutorial/explore-praat-vowelspace/04-continuous-all-scatter.webp)

按語音段分組著色後，可以分別檢視每段的元音分佈：

![連續語流散點圖——按語音段分組](/tutorial/explore-praat-vowelspace/05-continuous-segment-scatter.webp)

## 提示

- 連續語流模式的元音點非常散，誤差較大
- 如需精確分析，推薦單音節 + 仔細擷取
- 沒有 formant 資料時，此頁面無法使用
