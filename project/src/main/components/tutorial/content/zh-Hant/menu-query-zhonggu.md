# 查中古

按中古音韻地位整理各方言點的讀音。系統會根據所選的中古條件，在資料庫中找出符合條件的字，再展示這些字在不同地點的讀音。

## 輸入頁面

首先選擇分析維度：聲母、韻母或聲調。

![输入页面总览](/tutorial/menu-query-zhonggu/01-输入页面总览.webp)

然後選擇需要查詢的中古地位。

![选择声母韵母声调](/tutorial/menu-query-zhonggu/02-选择声母韵母声调.webp)

也可以選擇多種組合，系統會自動計算笛卡爾積（全部所選項相互組合一遍，再看組合的地位是否存在）。

![选择中古地位](/tutorial/menu-query-zhonggu/03-选择中古地位.webp)

![多种组合笛卡尔积](/tutorial/menu-query-zhonggu/04-多种组合笛卡尔积.webp)

具體可選擇攝、韻、等、呼、清濁、系、組、母、舒入、調、部位、方式，共 12 種類型。

![12种条件类型](/tutorial/menu-query-zhonggu/05-12种条件类型.webp)

點選「詳情」可檢視所選地位組合具體包含哪些字。

![点击详情查看组合的字](/tutorial/menu-query-zhonggu/06-点击详情查看组合的字.webp)

### 輸入地點或分區

地點輸入框會呼叫後端進行模糊匹配，輸入簡繁都可以，輸入所屬的行政區劃也能匹配上。點選下拉提示框中的地點確認填入。

![输入地点或分区](/tutorial/menu-query-zhonggu/07-输入地点或分区.webp)

![地点模糊匹配](/tutorial/menu-query-zhonggu/08-地点模糊匹配.webp)

輸入「東莞」能匹配所有東莞的地點。

![输入东莞匹配所有东莞地点](/tutorial/menu-query-zhonggu/09-输入东莞匹配所有东莞地点.webp)

也可點選「選擇地點」，按地圖集分區或行政區劃選擇。

![选择地图集分区](/tutorial/menu-query-zhonggu/10-选择地图集分区.webp)

![行政区划选择地点](/tutorial/menu-query-zhonggu/11-行政区划选择地点.webp)

通過選擇分區，可以避免逐個輸入大量地點。

![选择分区便捷](/tutorial/menu-query-zhonggu/12a-选择分区便捷.webp)

![分区选择详情](/tutorial/menu-query-zhonggu/12b-分区选择详情.webp)

點選即可選擇分區，相當方便。

![点击选择分区](/tutorial/menu-query-zhonggu/12-点击选择分区.webp)

後端會計算出所選地點的總數。

![显示地点总数](/tutorial/menu-query-zhonggu/13-显示地点总数.webp)

展開可檢視具體有哪些地點。

![展开查看具体地点](/tutorial/menu-query-zhonggu/14-展开查看具体地点.webp)

單擊「執行」後稍等即可得到結果。

![运行查询](/tutorial/menu-query-zhonggu/15-运行查询.webp)

## 結果頁面

結果頁面有非常詳細的展示介面，按中古地位分組展示各地方言讀音。

![结果页面总览](/tutorial/menu-query-zhonggu/16-结果页面总览.webp)

多音字也能展示多個讀音。

![多音字展示](/tutorial/menu-query-zhonggu/17-多音字展示.webp)

### 統計與細分查詢

點選「統計」按鈕後會再次細分查詢。例如當前是查中古-韻母，點選統計後會查詢聲母、聲調分佈，適用於判斷當前讀音分化是否來源於銳鈍分化（如聲母是否都是鈍音等）。

![统计按钮细分查询](/tutorial/menu-query-zhonggu/18-统计按钮细分查询.webp)

再點選「詳情」按鈕，可檢視這些字的詳細資訊。

![详情按钮查看字信息](/tutorial/menu-query-zhonggu/19-详情按钮查看字信息.webp)

點選地位標籤後可以再次細分查詢。

![点击地位细分查询](/tutorial/menu-query-zhonggu/20-点击地位细分查询.webp)

例如查詢「等」，則按照「等」去組合查詢。

![按等细分查询结果](/tutorial/menu-query-zhonggu/20b-按等细分查询结果.webp)

可以開多個小窗不斷細分查詢，方便同時對比。

![多小窗并列对比](/tutorial/menu-query-zhonggu/21-多小窗并列对比.webp)

點選音值會彈窗，可以反查音節來源。

![点击音值弹窗](/tutorial/menu-query-zhonggu/22-点击音值弹窗.webp)

![反查音节来源](/tutorial/menu-query-zhonggu/22b-反查音节来源.webp)

也可以查多個音節來源，不同地點的也可以。

![查多个音节来源](/tutorial/menu-query-zhonggu/23-查多个音节来源.webp)

### 地點與篩選

點選地名會彈窗展示方言點的具體資訊。

![点击地名弹窗详情](/tutorial/menu-query-zhonggu/24-点击地名弹窗详情.webp)

點選左下角的地點列表，可滑動選擇需要跳轉的地點，點選後絲滑滾動到對應位置。

![左下角地点列表跳转](/tutorial/menu-query-zhonggu/25-左下角地点列表跳转.webp)

篩選功能可過濾特定音值。

![筛选功能](/tutorial/menu-query-zhonggu/26-筛选功能.webp)

![筛选特定音值](/tutorial/menu-query-zhonggu/27-筛选特定音值.webp)

### 切換顯示模式

右下角按鈕可切換兩種顯示模式：
- **全顯模式**：方框包著漢字，顯示所有地位
- **主體模式**：只顯示一行漢字，篩掉佔比過低或字數過少的地位，更節省空間

![切换显示模式](/tutorial/menu-query-zhonggu/28-切换显示模式.webp)

### 文白讀顏色標註

部分字表支援文白讀按不同顏色展示：
- 紅色：文讀
- 藍色：白讀
- 紫色：文白讀都是這個聲/韻/調
- 綠色：純粹的多音字，並非文讀或白讀

![文白读颜色标注](/tutorial/menu-query-zhonggu/29-文白读颜色标注.webp)

## 地圖頁面

地圖繪圖預設使用佔比最高的音值。具體規則：
- 大於 50%：直接顯示
- 35%～50%：帶括號
- 20%～35%：帶括號和星號（*）
- 小於 20%：不顯示

![地图页面总览](/tutorial/menu-query-zhonggu/30-地图页面总览.webp)

![地图占比显示规则](/tutorial/menu-query-zhonggu/31-地图占比显示规则.webp)

點選地圖上的點可彈窗查詢詳情。彈窗和結果頁面一致，可以不斷細分查詢。

![地图点击弹窗详情](/tutorial/menu-query-zhonggu/32-地图点击弹窗详情.webp)

![地图小窗细分查询](/tutorial/menu-query-zhonggu/32b-地图小窗细分查询.webp)

開啟右上角「檢視地名」開關，可直接在地圖上檢視各點名稱。

![查看地名开关](/tutorial/menu-query-zhonggu/33-查看地名开关.webp)

點選方言點名稱也會彈出地點詳情彈窗。

![点击地点名称弹窗](/tutorial/menu-query-zhonggu/34-点击地点名称弹窗.webp)

地圖支援全屏展示，方便截圖。

![地图全屏展示](/tutorial/menu-query-zhonggu/35-地图全屏展示.webp)

![全屏方便截图](/tutorial/menu-query-zhonggu/35b-全屏方便截图.webp)

也可切換不同底圖（街道圖、地形圖等）。

![切换底图](/tutorial/menu-query-zhonggu/36-切换底图.webp)

## 切換韻書與字集

在「關於 → 設定」可切換字集（韻書）。當前支援中古、上古、近古等多種韻書，但中古廣韻最為穩定。

![设置切换字集韵书](/tutorial/menu-query-zhonggu/37-设置切换字集韵书.webp)

![支持的韵书列表](/tutorial/menu-query-zhonggu/38-支持的韵书列表.webp)

上古音查詢示例：

![上古音查询](/tutorial/menu-query-zhonggu/39-上古音查询.webp)

![上古音查询结果](/tutorial/menu-query-zhonggu/40-上古音查询结果.webp)

![上古音地图](/tutorial/menu-query-zhonggu/41-上古音地图.webp)

![上古音弹窗详情](/tutorial/menu-query-zhonggu/42-上古音弹窗详情.webp)

使用洪武正韻分析侵部字：

![洪武正韵侵部分析](/tutorial/menu-query-zhonggu/43-洪武正韵侵部分析.webp)

## 提示

- 首次使用建議只選 1-2 個核心條件，結果更容易看懂
- 結果太多時先加分區縮小範圍；結果太少時減少條件數量
- 按鈕灰色時通常表示中古條件尚未形成有效查詢
- 想從字形出發查讀音用「查字」；想從音值倒推中古來源用「查音位」
