# SwitchToggle 实施方案

> For Hermes: use writing-plans discipline, then implement directly without extra confirmation.

目标：抽出一个像素保真的 SwitchToggle.vue 基础组件，先统一项目中“视觉型开关”场景，不吞并普通 checkbox。

架构：新增一个可复用的基础开关组件，内部统一轨道、滑块、文案和交互语义；首批仅替换结构最接近、可做到视觉 1:1 的页面。普通多选/勾选项继续保留 Checkbox 或原生 checkbox。

技术栈：Vue 3 `<script setup>`、SCSS、现有全局样式 token。

---

## 范围

首批纳入：
1. `src/main/components/geo/PartitionInfoModal.vue`
2. `src/main/components/praat/VowelSpacePanel.vue`
3. `src/VillagesML/workspace/modules/semantic/SemanticIndices.vue`
4. `src/VillagesML/workspace/modules/semantic/SemanticNgrams.vue`
5. `src/VillagesML/workspace/modules/semantic/SemanticSettingsPanel.vue`

暂不纳入：
1. `src/main/views/menu/support/AboutPage.vue`（大胶囊特化开关）
2. `src/main/components/result/ResultList.vue`（glow + 自定义布局特化）
3. 所有普通 checkbox 多选场景

---

## 组件 API

文件：`src/components/common/SwitchToggle.vue`

Props：
- `modelValue: boolean`
- `disabled?: boolean`
- `width?: number | string`
- `height?: number | string`
- `thumbSize?: number | string`
- `color?: 'blue' | 'green' | 'purple' | 'gray' | string`
- `variant?: 'solid' | 'glow' | 'minimal'`
- `showLabel?: boolean`
- `activeText?: string`
- `inactiveText?: string`
- `labelPosition?: 'left' | 'right' | 'inside'`
- `gap?: number | string`
- `ariaLabel?: string`

事件：
- `update:modelValue`
- `change`

关键约束：
- 尺寸以 px 为准，优先支持 number，内部转换为 px
- 通过 `width/height/thumbSize` 自动计算 thumb 位移，保证旧样式等价
- 使用 `button type="button" role="switch" :aria-checked` 统一语义
- 组件允许外层继续包场景布局，不负责整行 setting row 布局

---

## 实施步骤

### 任务 1：新增基础组件
目标：落地像素保真的 SwitchToggle 原子组件
文件：
- Create: `src/components/common/SwitchToggle.vue`

实现要点：
1. 解析 width/height/thumbSize 数值
2. 自动计算：
   - track radius
   - thumb inset
   - translateX
3. 支持 left/right/inside 三种文案布局
4. 支持 solid/glow/minimal 三种视觉变体
5. 支持预设 color 和自定义字符串 color
6. 支持 disabled

验证：
- 组件语法正确
- 构建通过

### 任务 2：替换首批最标准小开关
目标：先替换结构最接近的 switch 场景
文件：
- Modify: `src/main/components/geo/PartitionInfoModal.vue`
- Modify: `src/main/components/praat/VowelSpacePanel.vue`
- Modify: `src/VillagesML/workspace/modules/semantic/SemanticIndices.vue`
- Modify: `src/VillagesML/workspace/modules/semantic/SemanticNgrams.vue`
- Modify: `src/VillagesML/workspace/modules/semantic/SemanticSettingsPanel.vue`

要求：
- 视觉保持与原来一致
- 尺寸用真实 px 映射
- 不改变业务逻辑，只替换开关结构

验证：
- 构建通过
- diff 仅限目标文件与新组件

### 任务 3：CR 与收尾
目标：确认这次抽象边界正确
检查项：
1. 普通 checkbox 未被误改
2. AboutPage / ResultList 这类特化开关未被误纳入
3. 目标场景开关尺寸、颜色、文案位置与之前一致
4. 新组件是否适合后续继续承接 glow / 大胶囊场景

验证命令：
- `npm run build`
- `git diff -- <target files>`
- `git status --short`

---

## 完成标准

1. 有可复用 `SwitchToggle.vue`
2. 首批 5 个视觉型 switch 已接入
3. 样式与旧实现保持一致或仅有极小无害差异
4. 构建通过
5. diff 范围受控
