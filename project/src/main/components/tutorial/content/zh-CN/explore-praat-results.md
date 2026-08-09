# 分析结果

查看声学分析的详细结果，包括基频、强度、共振峰、频谱图等。

## 单音节分析结果

单音节模式的分析最为精确：

![单音节分析结果概览](/tutorial/explore-praat-results/01-single-overview.webp)

### 基频与强度

基频轨迹可以较为清晰地看出调型走向，黄色部分为韵核。五度标调是后端自动计算的调值波动，例如 `3.67-1.7-1.18-1.04-1.85`，表示先降后微升的调型。强度轨迹反映了声音的大小变化：

![基频曲线和强度轨迹](/tutorial/explore-praat-results/02-pitch-and-intensity.webp)

### 共振峰与频谱图

共振峰轨迹反映元音音值；频谱图展示频率-时间的能量分布（仅支持 3 秒以内语音，需手动点击载入）：

![共振峰轨迹和频谱图](/tutorial/explore-praat-results/03-formant-spectrogram.webp)

### 质量分析与设置

音质分析包括谐噪比（HNR）、基频微扰（jitter）、振幅微扰（shimmer）等指标。点击齿轮图标可重新调整分析设置：

![质量分析卡片和分析设置](/tutorial/explore-praat-results/04-quality-and-settings.webp)

## 连续语流分析结果

连续语流的分析概览：

![连续语流分析结果概览](/tutorial/explore-praat-results/05-continuous-overview.webp)

基频轨迹图中，深蓝色是 voiced，浅蓝色是 speech，无颜色是 silence。连续语流的五度标调参考价值有限：

![连续语流基频轨迹](/tutorial/explore-praat-results/06-continuous-pitch.webp)

强度轨迹反映了音频的音量大小变化：

![连续语流强度轨迹](/tutorial/explore-praat-results/07-continuous-intensity.webp)

连续语流的共振峰轨迹较乱：

![连续语流共振峰轨迹](/tutorial/explore-praat-results/08-continuous-formant.webp)

频谱图加载完成后可查看能量分布：

![连续语流频谱图加载完成](/tutorial/explore-praat-results/09-spectrogram-loaded.webp)

连续语流的质量分析结果：

![连续语流质量分析](/tutorial/explore-praat-results/10-continuous-quality.webp)

## 图表交互

所有图表支持拖动、缩放，可查看每个数据点的具体数值：

![图表拖拽缩放交互](/tutorial/explore-praat-results/11-chart-interaction.webp)

## 任务流程

1. 点击「开始分析」后上传音频并建立分析任务
2. 自动轮询任务状态，显示进度
3. 任务完成后自动加载完整结果
4. 离开页面时自动取消未完成的任务

## 提示

- 没有登录时会先跳转到登录页面
- 如果某个模块没有勾选，对应的卡片和图表不会显示
