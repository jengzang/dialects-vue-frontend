# Footer 去玻璃化重构方案（对齐 DialectAtlasHomepage 参考组件）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `AppFooter` 从"浮动玻璃卡片"重构为"通栏扁平页脚"，视觉气质对齐 `docs/reference/DialectAtlasHomepage.vue` 的 `site-footer`，同时保留页脚既有的功能（教程 / 反馈 / 分享 / 设置 / 语言·主题 / 备案 / 统计）。

**Scope note:** 改动对象是 `feature-footer-suggestions` 分支上的 `AppFooter.vue`（尚未合入 dev）。本方案文档写在 dev，但代码改动发生在该特性分支落地之后。

---

## 背景与根因

当前页脚的"玻璃感"不是实现者随意发挥，而是**原始计划的明确约束造成的**：

`docs/superpowers/plans/2026-08-06-layout-footer-actions.md` 约束 #106 写道：

> Do not introduce new visual systems for the footer. Reuse existing... `glass-panel` for the footer shell... `glass-button` for footer actions.

于是得到三层叠加的玻璃：

1. 外壳 `glass-panel`（`project/src/styles/global/_glass.scss`）：`backdrop-filter: blur(18px) saturate(145%)` + `border: 1px solid var(--border-glass)` + `border-radius: var(--radius-xl)`（20px）+ `box-shadow: var(--shadow-glass)` + hover 阴影。
2. 定位：`AppFooter.vue` 里 `.app-footer { width: min(100%, 1200px); margin: 10px auto 0; padding: 10px 12px; }` —— 一个**居中浮动圆角卡片**，不是通栏页脚。
3. 内部 4 个 `glass-button`（`UniversalTable.vue:1667`，`background: var(--glass-80)` 半透明填充）——玻璃面板里再叠玻璃按钮。

而参考组件的页脚（`docs/reference/DialectAtlasHomepage.vue` L262–275 模板 / L1591–1620 SCSS）是反例：

```scss
.site-footer {
  margin-top: 96px;
  border-top: 1px solid var(--glass-border);   // 只有这一条发丝线
  // 零 backdrop-filter / border-radius / box-shadow / hover
}
```

结构 = logo + 3 列导航（Explore / Discover / Legal）+ 一行 `© 2026 Dialect Atlas`。

---

## 问题诊断对照

| 维度 | 当前 AppFooter | 参考 site-footer |
|---|---|---|
| 外壳 | glass-panel：blur18 + saturate + border + shadow + radius + hover | 一条 `border-top: 1px` 发丝线 |
| 形状 | 居中浮动圆角卡片（`margin: 10px auto; width: min(100%,1200px)`） | 通栏 |
| 层次 | 玻璃套玻璃（面板 + 玻璃按钮） | 单层扁平 |
| 操作 | 4 个玻璃按钮 | 无操作按钮，纯导航列 |
| 内容 | 页面标题/描述重复 + 4 操作 + 5 类统计/备案挤一行 | logo + 导航列 + copyright |
| 排版 | 无明确层级 | 12px 大写列标题 + 14px muted 链接 + 12px subtle 版权 |

**关键判断：** 参考组件教给我们的不是"照搬 logo + 导航列结构"，而是**"扁平、安静、分层"的页脚气质**。它是个内容营销站，logo + 导航列合理；本项目是工具型 SPA，导航已存在于菜单/布局里，页脚的真正职责是那 4 个操作 + 备案/身份信息。所以正确的做法是**吸收参考组件的视觉原则（扁平、通栏、发丝线、静音排版），而不是照搬它的 DOM 结构**。

---

## 目标状态

- 页脚**通栏扁平**：`border-top: 1px solid var(--border-glass)` 发丝线，无 blur、无 radius、无 shadow、无 hover。
- 操作按钮**去玻璃化**：从 `glass-button` 降级为静音文字按钮/链接（只保留 color/font，不画 background/border/shadow）。
- 信息**分层**：身份/备案/版权一行小字，操作区独立，遥测统计不再与用户可见信息混排。
- 排版对齐参考组件：标签 12px 大写 + letter-spacing，链接 14px muted hover 转 `--text-primary`，版权 12px subtle。

---

## 设计决策（实现前需确认）

**决策 1 — 页脚是否继续重复页面标题/描述？**

当前 `footer-primary` 用 `context.pageTitleKey` / `pageDescriptionKey` 再显示一遍页面标题（页面顶部已有 `page-title`）。

- **推荐 A**：移除页脚里的页面标题/描述重复；若需保留上下文提示，降级为一行极弱的小字。
- 备选 B：保留，但用 `hint` 样式静音化。

**决策 2 — 统计/遥测信息（访问量、字表行数、数据库版本）去向？**

当前 `footer-meta` 一行塞了 5 类受众完全不同的信息：语言·主题（用户可见偏好）、访问量 / 数据行数 / 数据库版本（内部遥测）、ICP（法律）。

- **推荐 A**：语言·主题 + ICP 留在页脚底部小字；访问量 / 行数 / 版本移出页脚（进 about / 设置页），页脚不再展示内部遥测。
- 备选 B：全部保留但拆成两行——一行用户身份/备案、一行遥测（`font-size: 12px` 弱化）。
- 备选 C：最小改动，不拆内容，只去玻璃（结构不动）。

---

## 具体改动任务

### Task 1: 页脚外壳去玻璃 + 通栏

- [ ] `AppFooter.vue` 模板根节点 `<footer class="app-footer glass-panel" ...>` 移除 `glass-panel`。
- [ ] `.app-footer` 移除浮动卡片定位 `margin: 10px auto 0; width: min(100%, 1200px)`，改为通栏；`padding` 放大到与参考组件一致的纵向留白（如 `padding-block: 32px`）。
- [ ] 外壳视觉只用 token：`border-top: 1px solid var(--border-glass)`；不得出现本地 `background` / `border-radius` / `box-shadow` / `backdrop-filter`。
- [ ] 竖屏 `@media (max-aspect-ratio: 1/1)` 分支只保留布局调整（grid / 拉伸），不含任何玻璃皮肤。

### Task 2: 操作按钮去玻璃化

- [ ] 4 个 `<button class="glass-button footer-action" data-size="compact">` 去掉 `glass-button`，改用本地 `.footer-action`（或复用 `.info-text` 语义），只声明 `color` / `font` / `gap` / `padding` / hover 颜色变化。
- [ ] 保留 `:disabled`（tutorial 按钮）与 `openTutorial` 守卫逻辑不变。
- [ ] hover / active 效果对齐参考链接：`color: var(--text-muted)` → hover `var(--text-primary)`，无 transform 上浮、无背景填充。

### Task 3: 页脚信息分层（IA 清理）

- [ ] 按「决策 1/2」拆分 `footer-primary` 与 `footer-meta`：
  - 操作区独立一行（右对齐或竖屏网格）。
  - 底部小字行只保留身份（语言·主题）+ 备案，风格化 `12px` subtle（对齐参考 `.copyright`）。
  - 遥测统计（访问量 / 行数 / 版本）按决策 2 移出或弱化为第二行小字。
- [ ] 移除不再使用的 `info-text` 冗余 span 或按新结构复用。

### Task 4: 排版对齐参考组件

- [ ] 标签/列标题采用 12px 大写 + `letter-spacing: 0.05em`（对齐 `.footer-cols h2`）。
- [ ] 链接/操作 14px `var(--text-muted)`，hover `var(--text-primary)`（对齐 `.footer-cols a`）。
- [ ] 版权/备案 12px `var(--text-subtle)`（对齐 `.copyright`）。

### Task 5: 修订旧样式契约

- [ ] 更新 `docs/superpowers/plans/2026-08-06-layout-footer-actions.md` 约束 #106 与 "Shared Style Contract"：把"`glass-panel` 是页脚外壳、`glass-button` 是页脚操作"改为"页脚外壳用 `border-top` 发丝线、页脚操作用静音文字链接"，避免后续 worker 按旧约束又把玻璃加回来。

### Task 6: 验证

- [ ] 三套布局（`MenuLayout` / `ExploreLayout` / `SimpleLayout`）下页脚渲染正常、通栏、无 blur。
- [ ] 竖屏 `max-aspect-ratio: 1/1` 下操作按钮 grid 布局不溢出。
- [ ] tutorial 按钮 disabled / hover 状态正确。
- [ ] 反馈 modal（`LayoutFeedbackModal`）打开、提交、截图流程不受影响。
- [ ] `grep` 确认 footer 作用域内无残留 `backdrop-filter` / `glass-panel` / `glass-button`。
- [ ] 运行现有 `layoutFooterMounting` / `appFooterActions` / `layoutFooterContext` 测试通过。

---

## 风险

- **功能回归**：去玻璃只改皮肤，不动 `openTutorial` / `shareCurrentPage` / `goToSettings` / 反馈提交逻辑，风险低。
- **视觉回归**：若「决策 2」选 C（只去玻璃不改结构），页脚仍会信息拥挤，但这是被明确接受的中间态。
- **旧约束复发**：Task 5 若遗漏，后续 worker 可能按旧契约重新引入玻璃。这是本方案唯一的"防复发"关键步骤。
