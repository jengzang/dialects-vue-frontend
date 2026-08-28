# Footer 去玻璃化重构方案

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `feature-footer-suggestions` 分支上的 `AppFooter` 从「浮动玻璃卡片」重构为「通栏扁平页脚」，保留教程、反馈、分享、设置、语言主题、备案和统计，但降低视觉层级。

**Architecture:** 只改页脚本体的信息架构和视觉层级，不改反馈弹窗、截图、建议提交、教程打开、统计缓存请求等业务逻辑。页脚采用通栏容器、发丝线分隔、低强调文字 action；统计和法务信息拆成弱化 meta 行。若缺少合适的共享文字按钮 utility，先补共享 utility，再在 `AppFooter.vue` 复用，避免组件私写视觉系统。

**Tech Stack:** Vue 3, Vue Router, Vue I18n, scoped SCSS, existing design tokens, existing footer tests.

---

## 背景与判断

当前页脚来自 `ce48b87d feat:页脚和建议弹窗（codex未彻底测试）`，位于 `feature-footer-suggestions` 分支。不好看的主要原因不是单个样式值，而是层级模型错了：

- 根节点用了 `glass-panel`，自带 blur、圆角、阴影和玻璃边框。
- 四个操作按钮又用了 `glass-button`，形成「玻璃面板里套玻璃按钮」。
- 页脚被限制成 `width: min(100%, 1200px)` 的居中卡片，看起来像正文下方又塞了一个工具面板。
- 页面标题/描述、操作、访问统计、数据库统计、语言主题、备案号混在一个紧凑区域，信息层级不清。

成熟项目的 footer 通常更安静：它是页面底部的导航、legal、meta 区，不是主操作面板。`docs/reference/DialectAtlasHomepage.vue` 的 `site-footer` 体现的是：通栏、发丝线、足够留白、低对比文字链接、copyright/meta 放底部。我们应吸收这种视觉原则，而不是照搬它的 logo + 三列导航结构。

## 成熟 Footer 模式结论

- **通栏而非浮动卡片**：footer 是页面结构的一部分，通常只用 top border 或底色区分。
- **链接像链接，不像 primary button**：footer action 多用文字链接或低强调按钮，hover 只做颜色/下划线变化。
- **信息分层**：导航/操作、状态信息、legal/copyright 分开，避免一行里塞不同受众的信息。
- **内容克制**：footer 可提供 fallback navigation，但不应重复页面主标题，也不应把内部遥测做成主视觉。
- **可访问性**：使用语义 `<footer>`；触发弹窗、分享、router push 的项目继续用 `<button type="button">`；disabled 状态必须可感知。

本项目的取舍：

- 站内导航已由 `NavBar` / `ExploreBar` / sidebar 承担，页脚不再做多列导航。
- 保留 `教程 / 反馈 / 分享 / 设置`，因为它们是跨页面辅助动作。
- 保留访问量、字表、数据量、数据库版本，因为用户明确要求和 homepage/sidebar 共享缓存；但降级为弱化 meta 行。
- 移除页脚里可见的当前页面标题/描述，因为页面顶部通常已有标题；这些上下文继续传给反馈 modal 和分享卡。

## 目标状态

- 页脚是通栏扁平区域：无 `glass-panel`、无 backdrop blur、无圆角、无阴影、无浮动卡片感。
- 页脚只有一条发丝线分隔：`border-top: 1px solid var(--border-glass)` 或项目现有等价 token。
- 四个 action 是低强调文字按钮：不使用 `glass-button`，不画 background、border、shadow。
- 信息架构固定为三层：
  - `footer-actions`：教程 / 反馈 / 分享 / 设置。
  - `footer-stats`：语言·主题、今日访问/总访问、字表/数据、数据库版本。
  - `footer-legal`：版权、备案号。
- `LayoutFeedbackModal` 不参与去玻璃化。它继续使用 `AppModal`、`ChoiceSelector`、`CheckBox`、`glass-field` 等既有表单体系。

## 样式边界

- 新增或修改的 Vue `<style>` 必须是 `<style scoped lang="scss">`，并以 `@use '@/styles/global/mixins' as *;` 开头。
- 不使用宽度型 media query。竖屏只用 `@media (max-aspect-ratio: 1 / 1)`。
- 不使用 `letter-spacing`。参考组件里的大写列标题风格不照搬。
- 页脚本体不得残留 `glass-panel`、`glass-button`、`backdrop-filter`、`box-shadow`、`border-radius`、hover `transform`。
- `AppFooter.vue` 只写布局 glue：宽度、内边距、flex/grid、gap、对齐、换行。
- 颜色、字体、hover、disabled 等视觉皮肤优先来自共享 utility。
- 如果现有共享样式没有低强调文字按钮，新增一个共享 utility，例如 `.text-action`，放在共享样式文件中，再由 `AppFooter.vue` 复用。
- 不把 footer action 做成 `<a>`，因为它们触发教程弹窗、反馈弹窗、分享 API、router push，本质是命令按钮。

## 文件范围

预计修改：

- `project/src/components/footer/AppFooter.vue`
  - 去掉根节点 `glass-panel`。
  - 去掉四个 action 的 `glass-button`。
  - 移除页脚可见的页面标题/描述。
  - 拆分 actions / stats / legal 三行。
  - 保持 `openTutorial`、`shareCurrentPage`、`goToSettings`、`fetchFooterStats` 逻辑不变。
- `project/src/styles/main/_info.scss`
  - 仅在没有可复用低强调文字按钮 utility 时新增共享 `.text-action`。
- `project/src/i18n/locales/zh-CN/layoutFooter.json`
- `project/src/i18n/locales/zh-Hant/layoutFooter.json`
- `project/src/i18n/locales/en/layoutFooter.json`
  - 如缺少 copyright 或分享提示，补充页脚文案。
  - ICP 字符串保持官方原文：`粤ICP备2025466875号`。
- `project/tests/appFooterActions.test.js`
- `project/tests/layoutFooterMounting.test.js`
- `project/tests/layoutFooterContext.test.js`
  - 更新 DOM 结构和 legal 文案断言。
- `docs/superpowers/plans/2026-08-06-layout-footer-actions.md`
  - 修订旧计划里的 footer style contract，避免后续继续要求 `glass-panel` / `glass-button`。

不修改，除非测试显示与去玻璃化直接相关的回归：

- `project/src/main/components/footer/LayoutFeedbackModal.vue`
- `project/src/api/main/suggestions.js`
- `project/src/utils/share/pageSnapshot.js`
- `project/src/utils/share/shareCard.js`
- `project/src/main/store/store.js`
- `project/src/main/components/tutorial/PageTutorialGuide.vue`
- `project/src/layouts/MenuLayout.vue`
- `project/src/layouts/ExploreLayout.vue`
- `project/src/layouts/SimpleLayout.vue`

## Task 1: 更新旧样式契约

**Files:**
- Modify: `docs/superpowers/plans/2026-08-06-layout-footer-actions.md`

- [ ] **Step 1: 定位旧约束**

Run:

```bash
rg -n "glass-panel|glass-button|Shared Style Contract|footer shell|footer actions" docs/superpowers/plans/2026-08-06-layout-footer-actions.md
```

Expected: 找到旧计划中要求 footer shell 使用 `glass-panel`、footer action 使用 `glass-button` 的段落。

- [ ] **Step 2: 改为新契约**

把旧契约替换为：

```markdown
- The footer shell must be flat and full-width. Do not use `glass-panel` on `AppFooter`.
- Footer actions must use a low-emphasis shared text-action/link utility. Do not use `glass-button` for footer actions.
- `glass-button` remains valid inside dialogs and tool panels, but not for the shared layout footer surface.
- The footer shell may use a single top border token and layout spacing only. Do not add backdrop blur, radius, shadow, or hover lift.
```

- [ ] **Step 3: CR**

Run:

```bash
git diff -- docs/superpowers/plans/2026-08-06-layout-footer-actions.md
```

Confirm: 只修订 footer 样式契约，不改 API、反馈、截图、统计缓存要求。

## Task 2: 确认或新增共享文字 Action Utility

**Files:**
- Inspect: `project/src/styles/main/_info.scss`
- Inspect: `project/src/styles/global/_tokens.scss`
- Modify only if needed: `project/src/styles/main/_info.scss`

- [ ] **Step 1: 查找现有 utility**

Run:

```bash
rg -n "text-action|footer-link|info-text|page-footer|hint|text-muted|text-primary|text-deep" project/src/styles project/src/components project/src/main/views/HomePage.vue
```

Expected: 找到 `page-footer`、`info-text`、`hint` 等弱文本工具。若没有命令按钮用的低强调文字 action，再新增共享 utility。

- [ ] **Step 2: 如需新增，添加共享 utility**

在 `project/src/styles/main/_info.scss` 中新增：

```scss
.text-action {
  padding: 0;
  color: var(--text-secondary);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
  background: transparent;
  border: 0;

  &:hover:not(:disabled) {
    color: var(--text-deep);
    text-decoration: underline;
  }

  &:disabled {
    @include disabled-state;
    text-decoration: none;
  }
}
```

If `--text-deep` is not appropriate after inspecting tokens, use the closest existing token. Do not invent a new token for this task.

- [ ] **Step 3: CR**

Run:

```bash
git diff -- project/src/styles/main/_info.scss
```

Confirm: utility 是共享样式，不是 `AppFooter.vue` 私有视觉；无填充背景、实边框、圆角、阴影、transform。

## Task 3: 重构 AppFooter DOM 层级

**Files:**
- Modify: `project/src/components/footer/AppFooter.vue`
- Test: `project/tests/appFooterActions.test.js`

- [ ] **Step 1: 写失败测试**

Add/update:

```js
it('renders footer actions, stats, and legal information as separate flat rows', async () => {
  const { default: AppFooter } = await import('../src/components/footer/AppFooter.vue')
  const wrapper = mountFooter(AppFooter)
  await nextTick()

  const footer = wrapper.host.querySelector('[data-app-footer]')
  expect(footer.classList.contains('glass-panel')).toBe(false)
  expect(footer.querySelector('.footer-actions')).toBeTruthy()
  expect(footer.querySelector('.footer-stats')).toBeTruthy()
  expect(footer.querySelector('.footer-legal')).toBeTruthy()
  expect(footer.querySelector('.page-copy')).toBeNull()
  expect([...footer.querySelectorAll('.footer-action')].some(button => button.classList.contains('glass-button'))).toBe(false)

  wrapper.unmount()
})
```

- [ ] **Step 2: 跑测试确认失败**

Run:

```bash
npm test -- tests/appFooterActions.test.js
```

Expected: FAIL because current footer still uses `glass-panel`, `glass-button`, and `.page-copy`.

- [ ] **Step 3: 改模板**

Use this visible footer shape:

```vue
<footer
  class="app-footer"
  data-app-footer
  :data-layout-kind="layoutKind"
>
  <div class="footer-actions" aria-label="layout footer actions">
    <button type="button" class="text-action footer-action" :disabled="!context.hasTutorial" @click="openTutorial">
      {{ t('layoutFooter.actions.tutorial') }}
    </button>
    <button type="button" class="text-action footer-action" @click="isFeedbackOpen = true">
      {{ t('layoutFooter.actions.feedback') }}
    </button>
    <button type="button" class="text-action footer-action" @click="shareCurrentPage">
      {{ t('layoutFooter.actions.share') }}
    </button>
    <button type="button" class="text-action footer-action" @click="goToSettings">
      {{ t('layoutFooter.actions.settings') }}
    </button>
  </div>

  <div class="page-footer footer-stats">
    <span class="info-text">{{ t(context.languageLabelKey) }} · {{ t(context.themeLabelKey) }}</span>
    <span class="info-text">{{ t('layoutFooter.stats.visits', { today: todayVisits, total: totalVisits }) }}</span>
    <span class="info-text">{{ t('layoutFooter.stats.source', { locationCount: sourceLocationCount, dataCount: sourceDataCount }) }}</span>
    <span class="info-text">{{ t('layoutFooter.stats.databaseVersion', { version: sourceDbVersion }) }}</span>
  </div>

  <div class="page-footer footer-legal">
    <span class="info-text">{{ t('layoutFooter.legal.copyright') }}</span>
    <span class="info-text">{{ t('layoutFooter.legal.icp') }}</span>
  </div>

  <LayoutFeedbackModal
    v-model="isFeedbackOpen"
    :page-title="t(context.pageTitleKey)"
    :source-path="route.path"
    :context="feedbackContext"
  />
</footer>
```

Do not remove the `context` computed value; feedback/share still need it.

- [ ] **Step 4: 跑测试确认通过**

Run:

```bash
npm test -- tests/appFooterActions.test.js
```

Expected: PASS.

- [ ] **Step 5: CR**

Run:

```bash
git diff -- project/src/components/footer/AppFooter.vue project/tests/appFooterActions.test.js
```

Confirm: 只移除可见页脚的页面标题/描述；反馈和分享仍拿到页面上下文；教程、分享、设置、统计逻辑不变。

## Task 4: 重构 AppFooter 布局样式

**Files:**
- Modify: `project/src/components/footer/AppFooter.vue`

- [ ] **Step 1: 写样式约束检查**

Run before implementation:

```bash
rg -n "glass-panel|glass-button|backdrop-filter|box-shadow|border-radius|transform:|letter-spacing|@media \\(max-width|@media \\(min-width" project/src/components/footer/AppFooter.vue
```

Expected: currently finds at least `glass-panel` and `glass-button`.

- [ ] **Step 2: 替换 style block**

Use this layout-only shape:

```scss
<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.app-footer {
  width: 100%;
  margin-top: 24px;
  padding: 28px max(16px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  border-top: 1px solid var(--border-glass);
}

.footer-actions,
.footer-stats,
.footer-legal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 18px;
}

.footer-stats {
  margin-top: 14px;
}

.footer-legal {
  margin-top: 8px;
}

.footer-action {
  min-width: 0;
}

@media (max-aspect-ratio: 1 / 1) {
  .app-footer {
    margin-top: 18px;
    padding-top: 22px;
  }

  .footer-actions {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: 100%;
    gap: 8px;
  }
}
</style>
```

The single `border-top` is the footer separator required by this plan. Do not add any other visual property.

- [ ] **Step 3: 跑样式约束检查**

Run:

```bash
rg -n "glass-panel|glass-button|backdrop-filter|box-shadow|border-radius|transform:|letter-spacing|@media \\(max-width|@media \\(min-width" project/src/components/footer/AppFooter.vue
```

Expected: no matches.

- [ ] **Step 4: CR**

Run:

```bash
git diff -- project/src/components/footer/AppFooter.vue
```

Confirm: 只有发丝线分隔，无背景、圆角、阴影、blur、hover lift、letter spacing；竖屏布局只用 aspect-ratio query。

## Task 5: I18n Legal/Copyright Cleanup

**Files:**
- Modify: `project/src/i18n/locales/zh-CN/layoutFooter.json`
- Modify: `project/src/i18n/locales/zh-Hant/layoutFooter.json`
- Modify: `project/src/i18n/locales/en/layoutFooter.json`
- Test: `project/tests/layoutFooterContext.test.js`

- [ ] **Step 1: 写或保留 ICP 精确字符串测试**

Ensure:

```js
it('keeps the official ICP filing text unchanged across locales', async () => {
  const [zhCN, zhHant, en] = await Promise.all([
    import('../src/i18n/locales/zh-CN/layoutFooter.json'),
    import('../src/i18n/locales/zh-Hant/layoutFooter.json'),
    import('../src/i18n/locales/en/layoutFooter.json'),
  ])

  expect(zhCN.default.legal.icp).toBe('粤ICP备2025466875号')
  expect(zhHant.default.legal.icp).toBe('粤ICP备2025466875号')
  expect(en.default.legal.icp).toBe('粤ICP备2025466875号')
})
```

- [ ] **Step 2: 跑测试确认当前状态**

Run:

```bash
npm test -- tests/layoutFooterContext.test.js
```

Expected: PASS if the previous suggestion commit already fixed ICP; otherwise FAIL on `zh-Hant`.

- [ ] **Step 3: 补齐 legal 文案**

Ensure every locale has `legal.copyright` and exact `legal.icp`:

```json
"legal": {
  "copyright": "© 2026 方音图鉴",
  "icp": "粤ICP备2025466875号"
}
```

Copyright may be localized if already present. Do not localize the ICP filing number.

- [ ] **Step 4: 跑测试确认通过**

Run:

```bash
npm test -- tests/layoutFooterContext.test.js
```

Expected: PASS.

## Task 6: Verification

**Files:** all footer-related files.

- [ ] **Step 1: 聚焦测试**

Run:

```bash
npm test -- tests/suggestionsApi.test.js tests/tutorialGuideRequest.test.js tests/layoutFooterContext.test.js tests/layoutFooterMounting.test.js tests/layoutFeedbackModal.test.js tests/shareHelpers.test.js tests/pageTutorialGuideLayouts.test.js tests/appFooterActions.test.js
```

Expected: all footer-related tests pass.

- [ ] **Step 2: Targeted lint**

Run:

```bash
npx eslint src/components/footer/AppFooter.vue src/main/components/footer/LayoutFeedbackModal.vue src/main/config/layoutFooter.js src/api/main/suggestions.js src/utils/share/pageSnapshot.js src/utils/share/shareCard.js --max-warnings=0
```

Expected: exit 0.

- [ ] **Step 3: Build**

Run:

```bash
npm run build
```

Expected: build exits 0. If build rewrites `project/public/sitemap.xml` only by changing generated `lastmod`, do not include that sitemap diff unless the user explicitly asks.

- [ ] **Step 4: Final style scan**

Run:

```bash
rg -n "glass-panel|glass-button|backdrop-filter|box-shadow|border-radius|transform:|letter-spacing|@media \\(max-width|@media \\(min-width" project/src/components/footer/AppFooter.vue
```

Expected: no matches.

- [ ] **Step 5: Review diff**

Run:

```bash
git diff -- docs/superpowers/plans/2026-08-06-layout-footer-actions.md project/src/styles/main/_info.scss project/src/components/footer/AppFooter.vue project/src/i18n/locales/zh-CN/layoutFooter.json project/src/i18n/locales/zh-Hant/layoutFooter.json project/src/i18n/locales/en/layoutFooter.json project/tests/appFooterActions.test.js project/tests/layoutFooterMounting.test.js project/tests/layoutFooterContext.test.js
```

Confirm:

- Only requested footer de-glass changes are present.
- Feedback API, screenshot upload, share helper, tutorial bridge, layout mounting, and cached stats logic remain intact.
- Chinese and emoji text are not corrupted.
- `project/public/sitemap.xml` is not accidentally included if it is only generated noise.

## Commit Boundary

Commit only this refactor's files. Preserve unrelated changes and untracked docs.

Suggested commit:

```bash
git add docs/superpowers/plans/2026-08-06-layout-footer-actions.md \
  project/src/styles/main/_info.scss \
  project/src/components/footer/AppFooter.vue \
  project/src/i18n/locales/zh-CN/layoutFooter.json \
  project/src/i18n/locales/zh-Hant/layoutFooter.json \
  project/src/i18n/locales/en/layoutFooter.json \
  project/tests/appFooterActions.test.js \
  project/tests/layoutFooterMounting.test.js \
  project/tests/layoutFooterContext.test.js

git commit -m "refactor: flatten shared layout footer"
```

Before committing, run:

```bash
git diff --cached --name-only
```

Expected: only the files above, plus this plan file if the user asks to commit the plan update itself.

## Decisions

These are fixed for implementation unless the user overrides them:

- Page title/description: remove from visible footer.
- Stats: keep, but weakly separated from legal info.
- Footer shell: flat full-width, no glass.
- Feedback modal: unchanged.
- Share behavior: unchanged.

## Risks

- The footer may feel too quiet after de-glassing. That is acceptable for v1 because footer should not compete with page tools.
- Adding `.text-action` affects future consumers. Keep it minimal and token-based.
- If old plan constraints are not updated, future work may accidentally reintroduce `glass-panel` / `glass-button`.
