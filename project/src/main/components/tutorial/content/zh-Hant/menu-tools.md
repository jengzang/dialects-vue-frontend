這一頁對應 /menu/tools，是工具入口頁。

建議新手這樣用：
1. 先看每張卡片的名稱與說明。
2. 確定需求後，直接點對應卡片進入工具頁。

實際規則：
- 這一頁本身不執行工具，只負責跳轉。
- 四張卡片分別會導向：
  - /explore/tools/check
  - /explore/tools/jyut2ipa
  - /explore/tools/merge
  - /explore/tools/praat
- 每張卡片都是站內 router.push 跳轉，不是外部連結。

容易踩坑：
- 這裡只是入口總覽；真正的上傳、轉換、合併操作都在下一層工具頁裡。