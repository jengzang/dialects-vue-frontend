# Master 样式修正计划（Vue 组件优先版）

> For Hermes: this is a hard-boundary execution plan. Do not use git-diff-style bulk rollback of Vue style blocks as a repair strategy. Do not introduce any hardcoded color literals in CSS/SCSS. Colors must come from existing tokens, or from new tokens added deliberately first.
> Dependencies loaded: frontend-design, executing-plans, verification-before-completion, requesting-code-review

**Goal:** 在保留当前 SCSS 架构（global/main/villagesml partial、token、mixin、模块化拆分）的前提下，先把当前仍脏的 shared `.scss` 全部回滚到用户当前认可基线；之后把样式回归的主战场收缩到 Vue 组件，逐批分析并修复真正的视觉/布局/交互错误。

**Binding user rules:**
- 永远不要把颜色写成具体值，必须引用 token
- 不把 shared SCSS 架构本身当作问题，除非用户再次明确指出具体 shared 文件有错
- 先完全回滚当前脏的几个 `.scss`
- 主要问题默认在 Vue 组件里
- 一次性持续推进，但内部要分批 CR、分批 commit

---

## 1. 硬边界

### 1.1 当前第一阶段允许修改的文件
仅允许：
- `.hermes/plans/2026-07-11_152529-master-style-fix-plan.md`
- `project/src/styles/global/_base.scss`
- `project/src/styles/global/_glass.scss`
- `project/src/styles/villagesml/_maps.scss`

### 1.2 第一阶段动作
- 更新 plan
- 将上述 3 个 `.scss` 完全回滚到当前分支上用户认可的基线版本（如果工作树脏但相对 HEAD 有改动，则先撤销这些改动）
- 不在第一阶段修改任何 `.vue`

### 1.3 第一阶段禁止项
- 不分析之外顺手改任何 `.vue`
- 不改 `main/_buttons.scss`, `main/_forms.scss`, `main/_overlays.scss`, `main/_surfaces.scss`
- 不把 `origin/master` 整段样式块抄回当前文件
- 不引入任何新的硬编码颜色字面量（hex/rgb/rgba/color-name）

### 1.4 第二阶段允许修改的文件范围
只允许真实存在样式回归证据的 Vue 组件；优先：
- `project/src/main/views/menu/QueryPage.vue`
- `project/src/main/views/menu/ComparePage.vue`
- 以及后续分析中被证明确实回归的 bar/layout/support/result 相关 `.vue`

### 1.5 第二阶段禁止项
- 不因为“看起来像旧版”就整段替回 `origin/master` 的 `<style>`
- 不把共享职责重新拉回页面 scoped style
- 不在未确认问题来源前改 shared SCSS
- 不在单个 commit 中混入无关页面/组件

### 1.6 强制范围闸门
每一批提交前必须执行：
- `git status --short`
- `git diff --name-only`
- `git diff --cached --name-only`

若发现超出该批计划文件集合，必须先停下 CR，不得直接提交。

---

## 2. 问题归因原则

### 2.1 默认判断
当前用户已明确判断：
- shared SCSS 架构大体没问题
- 当前问题主要在 Vue 组件内样式

因此后续默认从组件侧查：
- scoped style 内容是否被错误回填/覆盖
- 局部 selector 是否与 shared class 语义冲突
- 布局容器/定位/overflow/flex 是否错误
- style block 结构是否合法

### 2.2 shared SCSS 的处理原则
- 当前仅做“回滚我造成的脏改动”
- 不继续主动优化 shared SCSS
- 若后续证据证明某个 shared 规则仍然直接导致组件问题，必须先记录证据，再单独立项修，不得顺手混改

### 2.3 颜色规则
- 所有颜色必须用 token
- 若组件当前存在旧硬编码颜色且需要修复，优先改成现有 token
- 若现有 token 无法表达，再单独补 token；补 token 需要明确说明用途，不能临时写字面量顶替

---

## 3. 执行波次

### Wave 1：Plan + shared SCSS 回滚
**目标：** 清掉我错误残留的 shared scss 改动，恢复用户认可基线。

Tasks:
1. 更新本 plan
2. 回滚：
   - `project/src/styles/global/_base.scss`
   - `project/src/styles/global/_glass.scss`
   - `project/src/styles/villagesml/_maps.scss`
3. 验证回滚后 `git status --short` 中不再有这 3 个 scss 脏改动
4. 做一次 scoped CR
5. 单独 commit

### Wave 2：Query / Compare 组件分析
**目标：** 明确 Vue 组件问题边界，不靠猜。

Tasks:
1. 对比 `origin/master` 与当前：
   - `project/src/main/views/menu/QueryPage.vue`
   - `project/src/main/views/menu/ComparePage.vue`
2. 分类记录：
   - 纯结构合法性问题
   - 局部 style block 被错误回填/破坏
   - scoped selector 与 shared class 冲突
   - 真实布局/交互回归
3. 只锁定当前批真正要修的组件集合
4. 不在分析提交里混入修改

### Wave 3+: 小批次组件修复
**目标：** 每批只修一组真实回归的 Vue 文件。

每批流程固定：
1. 锁定文件集合
2. 最小修改
3. `git diff -- <files>` 自 CR
4. `npm run build`（在 `project/` 目录）
5. staged scope 检查
6. commit

优先顺序：
1. QueryPage.vue / ComparePage.vue
2. 若证据存在，再到：MenuLayout / NavBar / SimpleSidebar / HomePage 等
3. 每批最多处理一个功能簇，避免再失控

---

## 4. CR 清单

每一批都要检查：
- 是否违反 token 规则
- 是否把 shared 职责重新塞回页面
- 是否有整段旧 style block 回填
- 是否有 style block 结构损坏
- 是否出现超计划文件扩散
- 是否 build 通过
- 是否 commit scope 干净

---

## 5. 完成标准

只有在以下条件都满足时才可称完成：
- 当前错误遗留的 shared `.scss` 改动已回滚
- Query/Compare 主问题已至少完成一轮组件级修复并通过 build
- 所有新增 CSS/SCSS 颜色均为 token 引用
- 每个 commit 都是 scope-limited 并经过 diff CR
- 最终工作树不包含本任务无关脏改动被误提交
