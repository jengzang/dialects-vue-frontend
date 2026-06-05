這一頁對應 /menu/words，是詞彙與語法相關入口頁。

建議新手這樣用：
1. 先看三張卡片各自的主題。
2. 依需求點進語保詞彙、語保語法，或粵西口語資料。

實際規則：
- 這一頁本身只有三個入口按鈕，不直接顯示詞條內容。
- 三個按鈕分別會跳到：
  - /explore/yubao?tab=vocabulary
  - /explore/yubao?tab=grammar
  - /explore/yc-spoken
- 點擊後使用的是站內 router.push。

容易踩坑：
- 同樣是語保頁，詞彙與語法其實是同一條 /explore/yubao 路由，只靠 tab 參數切頁；如果分享連結，記得保留 tab。