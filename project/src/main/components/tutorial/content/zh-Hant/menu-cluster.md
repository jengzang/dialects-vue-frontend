# 方言聚類

這一頁不是單次按鈕型工具，而是一個完整的工作流：先準備地點與分組資料、再做 preview、再 prepare、再算 distance、最後做 clustering 並閱讀結果。

## 你在這一頁會看到什麼

- 頂部有頁面說明與「重置工作區」按鈕。
- 上方有一排步驟導航，會顯示目前進度，而且不是每一步一開始都能點。
- 左側主區依序放著輸入面板、工作流程面板、結果面板。
- 右側有任務側欄，會顯示 taskId、狀態、進度與訊息。

## 一定要先理解的核心流程

1. 先在輸入面板設定地點 / 分區。
2. 為聚類建立一組或多組比較資料。
3. 按「建立 preview」先看規模預估。
4. preview 沒問題後，再繼續 prepare。
5. prepare 完成後，選音位模式並跑 distance。
6. 最後再選聚類演算法與參數，執行 clustering。

## 輸入面板怎麼用

- 地點區沿用共用的 LocationAndRegionInput，所以你可以直接輸入地點，也可以配合分區限制。
- 每個 group 都可以自訂標籤、比較維度、來源模式。
- 來源模式有兩類：
  - path_strings：透過鍵名 / 鍵值組出路徑字串
  - chars：直接輸入已解析漢字
- 你可以新增多個 group；只剩 1 個 group 時，刪除按鈕會禁用。

## preview / prepare / distance / clustering 分別在做什麼

- preview：先估算 group 數量、字數、命中地點數、pair 數與矩陣大小，讓你判斷這次任務是不是太大。
- prepare：把前面輸入整理成可供後續步驟使用的中間資料。
- distance：先選 phoneme mode，再跑距離計算。
- clustering：最後才選演算法與參數，例如 n_clusters、linkage、eps、min_samples、random_state。

## 這一頁有哪些實際規則

- 步驟導航不是任意跳，只有已可達的步驟才可點。
- 沒有 preview hash 時，不能繼續 prepare。
- prepare 沒完成時，distance 按鈕會保持不可用。
- 沒有 distance 結果時，cluster 按鈕也不可用。
- 頁面還提供 quick run，可用一組預設流程直接跑完整鏈路。

## 結果怎麼看

- 結果面板先給你摘要卡片，再給 assignment 表格。
- assignment 表會列出 location、cluster_id，以及省 / 市 / 縣 / 鎮、音典分區、地圖分區。
- 再下面會顯示 groups 的結構化內容。
- 進階區還能看到 performance 與 cache 資訊，適合排查任務規模和效能問題。

## 右側任務欄是做什麼的

- 只要後端有任務在跑，這裡會顯示來源、taskId、狀態、進度百分比與訊息。
- 如果你不確定目前卡在哪一步，先看這裡比盯著主區塊更直接。

## 新手最常見的卡點

- 下一步按鈕是灰的：通常不是壞掉，而是前一步還沒完成。
- preview 看起來太大：先減少地點、減少 group，或簡化來源內容。
- clustering 參數不知道怎麼填：第一次可先用預設值，或先跑 quick run 建立感覺。
- 結果太抽象：先看 assignment 表，不要一開始就讀進階資訊。

## 什麼時候去別的頁面

- 想先確認單條資料或條件是否合理：先回查詢 / 比較頁。
- 想把聚類前的語音條件先摸清楚：先去結果頁或地圖頁做基礎核對。
