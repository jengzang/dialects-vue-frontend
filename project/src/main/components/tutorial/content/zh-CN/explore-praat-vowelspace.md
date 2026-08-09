# 元音空间

根据分析结果中的 F1/F2 共振峰数据绘制元音空间图，查看元音音值及滑动轨迹。

## 前提

- 设置中必须勾选「共振峰分析」模块
- 推荐使用「单音节」模式
- 需要在安静环境下精确截取语音

## 显示模式

- **分段显示**（默认）：按 rime_core、syllable_like、voiced 三类片段分别着色
- **全部散点**：所有有效 F1/F2 数据点画到图上，不按片段分色

## 交互

- 可选择/取消选择各段落
- 统计卡片显示当前选中段落的平均 F1、平均 F2 与数据点数
- 可勾选参考元音作为对照

## 实例

阳春白话「你」字的元音轨迹：从 ɛ 往下滑到 æ，再往上滑到 ɨ 附近结束。

![阳春白话「你」字元音滑动轨迹](/tutorial/explore-praat-vowelspace/01-ni-trajectory.webp)

阳春合水涯话的「高」字，韵母并不完全是 ɔ，有向上滑动的动程：

![阳春合水涯话「高」字元音](/tutorial/explore-praat-vowelspace/02-gao-vowel.webp)

东莞石排话的「宝」，起点介于 ə 和 ɐ 之间，终点未达到 u：

![东莞石排话「宝」字元音](/tutorial/explore-praat-vowelspace/03-bao-vowel.webp)

连续语流模式的元音点非常散，需要点击具体的每一段去查看，但误差较大：

![连续语流模式元音散点图](/tutorial/explore-praat-vowelspace/04-continuous-scatter.webp)

## 提示

- 连续语流模式的元音点非常散，误差较大
- 如需精确分析，推荐单音节 + 仔细截取
- 没有 formant 数据时，此页面无法使用
