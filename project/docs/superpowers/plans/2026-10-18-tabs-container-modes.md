# TabsContainer 双模式实施计划

> Execution: use writing-plans / executing-plans, implement each step in the current workspace, review and commit it before continuing. Use an independent code reviewer for each implementation step.

**Goal:** 同一个 TabsContainer 通过 `mode="underline"` 和 `mode="adaptive"` 提供两种导航样式，并让 Praat 复用。

**Architecture:** 保留现有组件和插槽，不提取组件或 composable。`mode` 仅控制外观及布局；路径导航保留 replace，受控模式只通知父页面。Praat 继续通过原有 `switchTab()` 处理 query、禁用条件和音频预览，所有分析面板保留原有 v-show。

**Tech Stack:** Vue 3、Vue Router、SCSS、Vitest/jsdom、现有 playwright-core。

## 范围与兼容约束

- `underline` 为默认模式，现有查询、比较、地图、音系、关于五个调用处无需改业务逻辑。
- `adaptive` 横屏左侧浮动、竖屏顶部横向；只使用 `max-aspect-ratio: 1 / 1` 响应式断点。
- 支持 `{ name, label, disabled }`。路径导航使用链接；内部切换使用按钮，支持方向键、Home/End 移动焦点、Enter/Space 激活和禁用项跳过。
- 保留 `modelValue / routeValue / resolveRoute / defaultTab / useRouter`、`update:modelValue / tab-change`、默认插槽、header、tab-extra。
- tab-extra 辅助控件位于真正的 tablist 之外，仍排列在导航左侧。
- 禁止通用组件改写父页面的 v-show、KeepAlive、路由映射或业务状态。
- 通用组件不强制 80dvh 最小高度；adaptive 在横屏预留导航空间，内容限制在可用宽度内。
- 不改标题、中文、emoji、分析 API、任务轮询、浮窗逻辑及无关路由。
- 不安装依赖，不包含已存在的 sitemap、toponyms API、router 和旧计划文件改动。

## Step 1：通用组件双模式

**Files:**
- Modify: `src/components/common/TabsContainer.vue`
- Create: `src/styles/global/_tabs.scss`（通用导航外观）
- Modify: `src/styles/global-entry.scss`（注册共享样式）
- Create: `tests/tabsContainer.test.js`（挂载真实组件和 memory router）

- [ ] 检查工作区、暂存区和全部调用处；运行现有测试建立基线。
- [ ] 写行为回归测试：默认/显式 mode、禁用点击无副作用、受控切换只 emit、路径及 query 保留、replace 不增加历史、方向键跳过禁用项、保留插槽和输入状态。
- [ ] 执行 `./node_modules/.bin/vitest run tests/tabsContainer.test.js`，确认缺失能力导致失败。
- [ ] 给现有 props 增加：

  ```js
  mode: { type: String, default: 'underline', validator: value => ['underline', 'adaptive'].includes(value) }
  ```

- [ ] 根据 useRouter 使用 RouterLink 或 button；保留默认路由解析 `{ query: { ...route.query, sub: tabName } }`。local 模式点击只发事件，不自行选择或写路由。
- [ ] 添加 disabled、选中状态、焦点与面板关联；内部视图使用手动激活，方向键不触发业务切换。选中项变化时只滚动导航自身。
- [ ] 将外观放入 `_tabs.scss`，复用现有 color/surface/border/radius/shadow token 和 mixins；组件 scoped SCSS 只放尺寸、排列及浮动定位。
- [ ] 验证现有五个页面；特别检查地图额外控件、音系 KeepAlive、查询/比较 v-show 和关于页条件渲染。
- [ ] 运行定向测试、相关页面测试、变更文件 ESLint errors 检查和 `./node_modules/.bin/vite build`（绕过会改写 sitemap 的 npm build 前置脚本）。
- [ ] 独立 CR、检查 unstaged/staged diff、UTF-8 与 emoji；仅提交这一步文件。

## Step 2：Praat 复用 adaptive 模式

**Files:**
- Modify: `src/main/views/explore/Praat.vue`
- Create: `tests/praatTabs.test.js`（挂载真实 Praat，隔离 API 和复杂子面板）

- [ ] 重新检查工作区和 Praat 源文件，保留步骤间的用户改动。
- [ ] 写接入测试，验证初始禁用、任务开始开放结果入口、数据条件控制元音/基频入口、内部切换 query 历史、面板实例保留。
- [ ] 执行 `./node_modules/.bin/vitest run tests/praatTabs.test.js`，确认旧页面尚未复用组件。
- [ ] 导入 TabsContainer，基于原有四个标签及 enabled 条件构造 computed tabs：

  ```vue
  <TabsContainer
    mode="adaptive"
    :tabs="tabs"
    :model-value="activeTab"
    :use-router="false"
    @tab-change="switchTab"
  >
    <!-- 原有标题、v-show 面板、设置和音频预览，保留其逻辑 -->
  </TabsContainer>
  ```

- [ ] 移除原有导航模板及其专属 `.tab-navigation / .tab-container / .tab-btn` 样式；不清理其他历史代码。
- [ ] 给 Praat 原有内容加 `max-width: 100%`，使横屏导航预留空间有效；保留标题、面板对齐、浮窗及竖屏原有行为。
- [ ] 验证 `switchTab()`、`useRouteQueryState('tab')`、上传→创建任务→轮询及全部 `v-show` 未被改写。
- [ ] 运行两个新测试、相关现有测试、变更文件 ESLint errors 检查和 Vite build。
- [ ] 浏览器验证两种模式在横屏/竖屏的导航位置、横向溢出、禁用和键盘；保存截图供检查。
- [ ] 独立 CR、检查全部 diff、UTF-8 与 emoji；仅提交这一步文件。

## 完成条件

- [ ] 两个 mode 共用同一组件，现有五个页面使用 underline，Praat 使用 adaptive。
- [ ] 定向行为回归测试和构建通过；现有基线失败单独列出，不扩大修改范围。
- [ ] 每步已审查、提交；最终工作区只保留用户原有改动。
