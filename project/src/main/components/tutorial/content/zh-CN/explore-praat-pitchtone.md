# 基频定调

在音高曲线上手动框选样本，用石锋 T 值法进行五度制标调。

## 基本流程

1. 确保分析结果中包含基频（pitch）数据
2. 在音高曲线上框选一段样本——推荐单音节的黄色 rime_core（韵核）部分，或连续语流的深蓝色 voiced 段

![在音高曲线上框选样本段（红框）](/tutorial/explore-praat-pitchtone/01-select-segment.webp)

3. 输入调类名称后「加入列表」

![输入调类名称并加入列表](/tutorial/explore-praat-pitchtone/02-add-tone.webp)

4. 同调名可重复加入多段样本，它们会累积在同一调类下。一条录音可截取多个调类
5. 截取完所有调类后点击「开始分析」
6. 系统根据石锋 T 值法绘制五度图

## 结果

石锋 T 值法五度图（阳春岗美话 5 个调型）：

![石锋 T 值法五度图](/tutorial/explore-praat-pitchtone/03-tvalue-chart.webp)

- 阴平 33（略降）
- 阳平 41（调首略升）
- 上声 31
- 阴去 425（曲折调）
- 阳去 454（调尾略降）

会显示最高、最低频率，也可导出到 Excel 自行处理（文件名以「方音图鑑_T值法定調_」开头）：

![T 值结果——频率与调值详情](/tutorial/explore-praat-pitchtone/04-tvalue-result.webp)

## 数据保存

- 已保存的调类写入 localStorage，刷新页面后自动恢复
- 可随时清空全部已保存调类

## 移动端

移动端也可以很方便地使用基频定调：

![移动端 T 值界面](/tutorial/explore-praat-pitchtone/05-mobile-tvalue.webp)

移动端 T 值结果与下载：

![移动端 T 值结果与下载](/tutorial/explore-praat-pitchtone/06-mobile-tvalue-result.webp)

## 提示

- 如果没有 pitch 数据，此页面无法使用
- 推荐使用单音节模式截取韵核部分进行精确分析
- 连续语流模式下推荐截取 voiced（深蓝色）段
