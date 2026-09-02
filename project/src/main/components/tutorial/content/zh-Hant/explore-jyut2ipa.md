# 粵拼轉 IPA

批次將 Excel 檔案中的粵拼（Jyutping）轉換為國際音標（IPA）。

## 基本操作

1. 登入賬號
2. 在設定面板中調整轉換規則（可選，預設規則已涵蓋常見轉換）
3. 上傳 Excel 檔案（.xlsx、.xls，單檔案上限 3 MB）
4. 等待任務處理完成
5. 預覽結果並下載
![粵拼1.webp](/tutorial/explore-jyut2ipa/粤拼1.webp)

## 自定義規則

- 可在設定面板中調整替換規則
- 規則按分類整理，方便檢查
- 可匯出規則為 JSON 備份
- 可從 JSON 匯入規則
- 重設會恢復為預設規則
- 規則儲存到 localStorage，跨會話保持
![粵拼2.webp](/tutorial/explore-jyut2ipa/粤拼2.webp)

## 輸出結果

- 預覽表顯示前 10 筆資料
- 欄位包括：字、粵拼、IPA、聲母、韻母、音調
- 下載檔案保留原始檔名並加字首
![粵拼3.webp](/tutorial/explore-jyut2ipa/粤拼3.webp)
![粵拼4.webp](/tutorial/explore-jyut2ipa/粤拼4.webp)

## 提示

- 表中必須有「粵拼」列
- 匯入規則後需手動點選儲存才能持久化
- 檔案格式不正確或過大時會直接報錯
