# 查中古

按中古音韵地位整理各方言点的读音。系统会根据所选的中古条件，在数据库中找出符合条件的字，再展示这些字在不同地点的读音。

## 输入页面

首先选择分析维度：声母、韵母或声调。

![输入页面总览](/tutorial/menu-query-zhonggu/01-输入页面总览.webp)

然后选择需要查询的中古地位。

![选择声母韵母声调](/tutorial/menu-query-zhonggu/02-选择声母韵母声调.webp)

也可以选择多种组合，系统会自动计算笛卡尔积（全部所选项相互组合一遍，再看组合的地位是否存在）。

![选择中古地位](/tutorial/menu-query-zhonggu/03-选择中古地位.webp)

![多种组合笛卡尔积](/tutorial/menu-query-zhonggu/04-多种组合笛卡尔积.webp)

具体可选择摄、韵、等、呼、清浊、系、组、母、舒入、调、部位、方式，共 12 种类型。

![12种条件类型](/tutorial/menu-query-zhonggu/05-12种条件类型.webp)

点击「详情」可查看所选地位组合具体包含哪些字。

![点击详情查看组合的字](/tutorial/menu-query-zhonggu/06-点击详情查看组合的字.webp)

### 输入地点或分区

地点输入框会调用后端进行模糊匹配，输入简繁都可以，输入所属的行政区划也能匹配上。点击下拉提示框中的地点确认填入。

![输入地点或分区](/tutorial/menu-query-zhonggu/07-输入地点或分区.webp)

![地点模糊匹配](/tutorial/menu-query-zhonggu/08-地点模糊匹配.webp)

输入「东莞」能匹配所有东莞的地点。

![输入东莞匹配所有东莞地点](/tutorial/menu-query-zhonggu/09-输入东莞匹配所有东莞地点.webp)

也可点击「选择地点」，按地图集分区或行政区划选择。

![选择地图集分区](/tutorial/menu-query-zhonggu/10-选择地图集分区.webp)

![行政区划选择地点](/tutorial/menu-query-zhonggu/11-行政区划选择地点.webp)

通过选择分区，可以避免逐个输入大量地点。

![选择分区便捷](/tutorial/menu-query-zhonggu/12a-选择分区便捷.webp)

![分区选择详情](/tutorial/menu-query-zhonggu/12b-分区选择详情.webp)

点击即可选择分区，相当方便。

![点击选择分区](/tutorial/menu-query-zhonggu/12-点击选择分区.webp)

后端会计算出所选地点的总数。

![显示地点总数](/tutorial/menu-query-zhonggu/13-显示地点总数.webp)

展开可查看具体有哪些地点。

![展开查看具体地点](/tutorial/menu-query-zhonggu/14-展开查看具体地点.webp)

单击「运行」后稍等即可得到结果。

![运行查询](/tutorial/menu-query-zhonggu/15-运行查询.webp)

## 结果页面

结果页面有非常详细的展示界面，按中古地位分组展示各地方言读音。

![结果页面总览](/tutorial/menu-query-zhonggu/16-结果页面总览.webp)

多音字也能展示多个读音。

![多音字展示](/tutorial/menu-query-zhonggu/17-多音字展示.webp)

### 统计与细分查询

点击「统计」按钮后会再次细分查询。例如当前是查中古-韵母，点击统计后会查询声母、声调分布，适用于判断当前读音分化是否来源于锐钝分化（如声母是否都是钝音等）。

![统计按钮细分查询](/tutorial/menu-query-zhonggu/18-统计按钮细分查询.webp)

再点击「详情」按钮，可查看这些字的详细信息。

![详情按钮查看字信息](/tutorial/menu-query-zhonggu/19-详情按钮查看字信息.webp)

点击地位标签后可以再次细分查询。

![点击地位细分查询](/tutorial/menu-query-zhonggu/20-点击地位细分查询.webp)

例如查询「等」，则按照「等」去组合查询。

![按等细分查询结果](/tutorial/menu-query-zhonggu/20b-按等细分查询结果.webp)

可以开多个小窗不断细分查询，方便同时对比。

![多小窗并列对比](/tutorial/menu-query-zhonggu/21-多小窗并列对比.webp)

点击音值会弹窗，可以反查音节来源。

![点击音值弹窗](/tutorial/menu-query-zhonggu/22-点击音值弹窗.webp)

![反查音节来源](/tutorial/menu-query-zhonggu/22b-反查音节来源.webp)

也可以查多个音节来源，不同地点的也可以。

![查多个音节来源](/tutorial/menu-query-zhonggu/23-查多个音节来源.webp)

### 地点与筛选

点击地名会弹窗展示方言点的具体信息。

![点击地名弹窗详情](/tutorial/menu-query-zhonggu/24-点击地名弹窗详情.webp)

点击左下角的地点列表，可滑动选择需要跳转的地点，点击后丝滑滚动到对应位置。

![左下角地点列表跳转](/tutorial/menu-query-zhonggu/25-左下角地点列表跳转.webp)

筛选功能可过滤特定音值。

![筛选功能](/tutorial/menu-query-zhonggu/26-筛选功能.webp)

![筛选特定音值](/tutorial/menu-query-zhonggu/27-筛选特定音值.webp)

### 切换显示模式

右下角按钮可切换两种显示模式：
- **全显模式**：方框包着汉字，显示所有地位
- **主体模式**：只显示一行汉字，筛掉占比过低或字数过少的地位，更节省空间

![切换显示模式](/tutorial/menu-query-zhonggu/28-切换显示模式.webp)

### 文白读颜色标注

部分字表支持文白读按不同颜色展示：
- 红色：文读
- 蓝色：白读
- 紫色：文白读都是这个声/韵/调
- 绿色：纯粹的多音字，并非文读或白读

![文白读颜色标注](/tutorial/menu-query-zhonggu/29-文白读颜色标注.webp)

## 地图页面

地图绘图默认使用占比最高的音值。具体规则：
- 大于 50%：直接显示
- 35%～50%：带括号
- 20%～35%：带括号和星号（*）
- 小于 20%：不显示

![地图页面总览](/tutorial/menu-query-zhonggu/30-地图页面总览.webp)

![地图占比显示规则](/tutorial/menu-query-zhonggu/31-地图占比显示规则.webp)

点击地图上的点可弹窗查询详情。弹窗和结果页面一致，可以不断细分查询。

![地图点击弹窗详情](/tutorial/menu-query-zhonggu/32-地图点击弹窗详情.webp)

![地图小窗细分查询](/tutorial/menu-query-zhonggu/32b-地图小窗细分查询.webp)

打开右上角「查看地名」开关，可直接在地图上查看各点名称。

![查看地名开关](/tutorial/menu-query-zhonggu/33-查看地名开关.webp)

点击方言点名称也会弹出地点详情弹窗。

![点击地点名称弹窗](/tutorial/menu-query-zhonggu/34-点击地点名称弹窗.webp)

地图支持全屏展示，方便截图。

![地图全屏展示](/tutorial/menu-query-zhonggu/35-地图全屏展示.webp)

![全屏方便截图](/tutorial/menu-query-zhonggu/35b-全屏方便截图.webp)

也可切换不同底图（街道图、地形图等）。

![切换底图](/tutorial/menu-query-zhonggu/36-切换底图.webp)

## 切换韵书与字集

在「关于 → 设置」可切换字集（韵书）。当前支持中古、上古、近古等多种韵书，但中古广韵最为稳定。

![设置切换字集韵书](/tutorial/menu-query-zhonggu/37-设置切换字集韵书.webp)

![支持的韵书列表](/tutorial/menu-query-zhonggu/38-支持的韵书列表.webp)

上古音查询示例：

![上古音查询](/tutorial/menu-query-zhonggu/39-上古音查询.webp)

![上古音查询结果](/tutorial/menu-query-zhonggu/40-上古音查询结果.webp)

![上古音地图](/tutorial/menu-query-zhonggu/41-上古音地图.webp)

![上古音弹窗详情](/tutorial/menu-query-zhonggu/42-上古音弹窗详情.webp)

使用洪武正韵分析侵部字：

![洪武正韵侵部分析](/tutorial/menu-query-zhonggu/43-洪武正韵侵部分析.webp)

## 提示

- 首次使用建议只选 1-2 个核心条件，结果更容易看懂
- 结果太多时先加分区缩小范围；结果太少时减少条件数量
- 按钮灰色时通常表示中古条件尚未形成有效查询
- 想从字形出发查读音用「查字」；想从音值倒推中古来源用「查音位」
