這一頁對應 /menu/villages，是村落資料入口頁。

建議新手這樣用：
1. 先看四張卡片的主題。
2. 再依需求進入廣東村落地圖、機器學習頁、統計表，或粵西村落頁。

實際規則：
- 這一頁不直接顯示村落資料，只提供入口。
- 四個按鈕分別會跳到：
  - /explore/villages/gd
  - /explore/villages/ml
  - /explore/villages/table
  - /explore/villages/yc
- 全部都是站內 router.push 跳轉。

容易踩坑：
- 「表格」與「地圖」是不同子頁，不會在同一頁內切換。
- 如果你要的是粵西村落資料，請直接選 yc，不要先進 gd 再找切換。