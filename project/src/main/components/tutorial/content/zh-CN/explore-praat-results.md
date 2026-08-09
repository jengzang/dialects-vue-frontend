# 分析结果

查看声学分析的详细结果，包括基频、强度、共振峰、频谱图等。

## 结果内容

根据勾选的分析模块，结果页面会展示：

- **基本信息**：时长、采样率
- **基频分析**：调值特征、五度标调计算、基频曲线。黄色部分为韵核
- **强度分析**：平均强度（dB）、强度范围、强度轨迹图
- **共振峰分析**：共振峰轨迹，反映元音音值
- **音质分析**：谐噪比（HNR）、基频微扰（jitter）、振幅微扰（shimmer）
- **音段分析**：单音节模式拆分为 rime_core（韵核）和 syllable_like；连续语流拆分为 voiced、speech、silence
- **频谱图**：频率-时间二维能量分布。仅支持 3 秒以内语音，需手动点击载入

## 单音节分析结果

单音节模式的分析最为精确：

![单音节分析结果概览](/tutorial/explore-praat-results/01-single-results.webp)

### 基频曲线

基频轨迹可以较为清晰地看出调型走向，黄色部分为韵核。五度标调是后端自动计算的调值波动，例如 `3.67-1.7-1.18-1.04-1.85`，表示先降后微升的调型。

![基频轨迹曲线](/tutorial/explore-praat-results/02-pitch-curve.webp)

### 强度轨迹

强度轨迹反映了声音的大小变化：

![强度轨迹图](/tutorial/explore-praat-results/03-intensity.webp)

### 共振峰轨迹

共振峰轨迹反映了元音的音值：

![共振峰轨迹](/tutorial/explore-praat-results/04-formant.webp)

### 频谱图

频谱图分析可能会有一点卡，可以很清晰地看出该语音的能量分布：

![频谱图](/tutorial/explore-praat-results/05-spectrogram.webp)

## 连续语流分析结果

以下是连续语流的分析结果。深蓝色的是 voiced，浅蓝色的是 speech，没有颜色的是 silence。连续语流的共振峰轨迹较乱，五度标调法参考价值有限。

![连续语流分析结果](/tutorial/explore-praat-results/06-continuous-pitch.webp)

## 图表交互

所有图表支持拖动、缩放，可查看每个数据点的具体数值：

![图表交互——拖动缩放查看数据点](/tutorial/explore-praat-results/07-chart-interaction.webp)

## 任务流程

1. 点击「开始分析」后上传音频并建立分析任务
2. 自动轮询任务状态，显示进度
3. 任务完成后自动加载完整结果
4. 离开页面时自动取消未完成的任务

## 提示

- 没有登录时会先跳转到登录页面
- 如果某个模块没有勾选（如共振峰分析），对应的卡片和图表不会显示
- 频谱图仅支持 3 秒以内的语音，需手动点击载入
