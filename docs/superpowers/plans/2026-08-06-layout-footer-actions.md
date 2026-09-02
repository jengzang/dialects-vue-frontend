# Layout Footer Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared footer to `MenuLayout`, `ExploreLayout`, and `SimpleLayout` with cached stats, current-page help text, tutorial, feedback, share, settings, language/theme identity, version, and ICP information.

**Architecture:** Build one shared footer component and small focused helpers. The footer reuses existing stats composables, existing common controls, existing design tokens, and the existing tutorial modal through a tiny global request bridge. Feedback submits directly to the confirmed backend suggestions API with optional screenshot upload; link sharing ships in the first pass, while branded image sharing stays as a phase-2 enhancement.

**Tech Stack:** Vue 3, Vue Router, Vue I18n, SCSS scoped component styles, existing `api()` client, existing `AppModal`, existing selector controls, existing `glass-button` / `glass-field` for dialog controls, existing `surface-subpanel` / info utility classes, existing design tokens, existing `useVisitStats()` and `useSourceStats()`, Vitest.

---

## Backend Contract

The backend has confirmed these suggestions APIs are ready for frontend
integration.

### Submit Feedback

`POST /api/suggestions`

Authentication is optional. Anonymous visitors can submit feedback; logged-in
users are recorded only as optional attribution through `user_id` and
`username`.

Request body:

```json
{
  "title": "页面反馈标题",
  "content": "具体反馈内容",
  "category": "bug",
  "source_path": "/some/page",
  "context": {
    "client_version": "web-v5.0.0",
    "extra": "optional"
  },
  "contact": "optional@example.com",
  "image_base64": "data:image/webp;base64,..."
}
```

Field rules:

- `title`: required, 1-200 characters after trimming.
- `content`: required, 1-5000 characters after trimming.
- `category`: optional open text, defaults to `general`; backend does not enforce a whitelist.
- `source_path`: optional. The footer should send the current page path, not the full query string.
- `context`: optional object. The footer should include route diagnostics, locale, theme, layout kind, and app/database version.
- `contact`: optional. Anonymous visitors can provide contact information if they want follow-up.
- `image_base64`: optional. Supports `data:image/webp;base64,...`, `data:image/png;base64,...`, and `data:image/jpeg;base64,...`.

Backend image limits:

- `image_base64` maximum is 1 MB.
- Invalid image format or oversize image returns `422`.
- The frontend should compress automatic screenshots to about 600 KB for safer submission.

Success response:

```json
{
  "success": true,
  "id": 123,
  "message": "建议已提交"
}
```

Normal submit responses do not return screenshot data.

### My Feedback

`GET /api/suggestions/my?status=open&page=1&page_size=20`

Requires login. Anonymous visitors cannot query historical anonymous feedback.
Response items do not include `image_base64`, keeping the list light.

### Admin Feedback

`GET /admin/suggestions?status=open&category=bug&user_id=7&q=关键词&page=1&page_size=50`

Admin list items include `image_base64` so UI/page problems can be inspected.

`PATCH /admin/suggestions/{suggestion_id}`

```json
{
  "status": "reviewing",
  "priority": "high",
  "admin_note": "需要跟进"
}
```

`status` supports `open`, `reviewing`, `accepted`, `rejected`, and `done`.
`priority` supports `low`, `normal`, and `high`.

Frontend category options should stay fixed initially for analytics and admin
filtering: `general`, `bug`, `feature`, `data_issue`, and `ui`. The backend
still accepts open category strings for future expansion.

## Implementation Constraints

These constraints are part of the plan, not optional style advice:

- Work from the current `dev` branch. Preserve unrelated local changes, especially map draw files.
- Do not introduce new visual systems for the footer. Reuse existing common components and global classes:
  - `AppModal` for feedback.
  - `ChoiceSelector` for compact feedback category selection.
  - `CheckBox` for optional screenshot consent.
  - A shared low-emphasis text action utility for footer actions.
  - `glass-button` for modal submit buttons and screenshot retake buttons.
  - `glass-field` for feedback title, content, and contact fields.
  - `surface-subpanel` for inline screenshot preview/status blocks.
  - `page-footer`, `info-text`, and `hint` for footer copy, meta, and helper text.
  - `page-title` remains the shared page-heading utility; avoid it inside the compact footer unless the footer deliberately needs page-heading treatment.
- Every new Vue component style block must be `<style scoped lang="scss">` and must start with `@use '@/styles/global/mixins' as *;`.
- Use existing CSS custom properties from `project/src/styles/global/_tokens.scss` for colors, radii, shadows, surfaces, and text. Do not add hardcoded UI colors in component SCSS.
- Use existing mixins such as `flex-col`, `flex-center`, `text-truncate`, `disabled-state`, and `glass-blur` instead of raw duplicated declarations where they apply.
- Component-local SCSS may only define placement and layout glue: spacing, sizing, wrapping, grid/flex layout, overflow containment, and local CSS custom-property overrides for shared classes.
- Component-local SCSS must not define visual skin for buttons, inputs, panels, chips, cards, modal surfaces, screenshot blocks, or state blocks. No component-local `background`, `border`, `border-radius`, `box-shadow`, `color`, or focus-ring styling unless a shared class cannot satisfy the requirement and the exception is explicitly noted in that task's CR checklist.
- Language/theme metadata is neutral in v1 and uses `info-text`. If colored theme labels are still required, add a small shared utility under `project/src/styles/main/_info.scss` in a separately confirmed task instead of styling a private chip inside the footer component.
- Do not add width-based media queries. Responsive footer layout must use `@media (max-aspect-ratio: 1 / 1)`.
- The footer is a compact utility surface, not a marketing section. It should not use hero-scale text, decorative blobs, nested cards, or one-off visual effects.
- Footer stats must use the shared `useVisitStats()` and `useSourceStats()` cache path. Do not create duplicate homepage/sidebar stats requests.
- First-pass feedback opens a modal and calls `POST /api/suggestions` directly. Do not navigate users to the old `/menu/about/suggestion` page for this flow.
- First-pass feedback includes optional automatic screenshot capture because backend `image_base64` support is confirmed.
- First-pass share behavior is link-first: `navigator.share` when available, then clipboard fallback. Branded share images are a phase-2 task and must not block the base footer.

## Shared Style Contract

Use this contract while executing every task in this plan:

- The footer shell must be flat and full-width. Do not use `glass-panel` on `AppFooter`.
- Footer actions must use a low-emphasis shared text-action/link utility. Do not use `glass-button` for footer actions.
- `glass-button` remains valid inside dialogs and tool panels, but not for the shared layout footer surface.
- The footer shell may use a single top border token and layout spacing only. Do not add backdrop blur, radius, shadow, or hover lift.
- `glass-field` is the only feedback text input and textarea skin. Component SCSS may set textarea behavior such as `resize`, but must not draw field borders, fills, text colors, or focus states.
- `surface-subpanel` is the nested screenshot preview/status surface. The feedback component may set preview spacing and image sizing, but the preview surface itself comes from the shared class.
- `page-footer` is the shared inline footer/meta row utility. Use it for the stats/legal/language row, then add local wrapping and spacing only where the layout requires it.
- `info-text` is the shared neutral text row utility. Use it for stats items, language/theme metadata, and compact page identity text.
- `hint` is the shared muted helper-text utility. Use it for the one-line feature description and screenshot helper copy.
- `page-title` is a page-heading utility, not the default compact footer title style. Only use it inside the footer if the footer is intentionally elevated into a page-heading role.
- `ChoiceSelector` owns the visual behavior of feedback category selection. Do not rebuild category tabs with local buttons and styles.
- `CheckBox` owns the screenshot opt-in control skin.
- `AppModal` owns the feedback dialog shell, fixed header, scrollable content, and footer slot.

## File Structure

- Create `project/src/api/main/suggestions.js`
  - Owns public suggestion API calls and payload normalization.
- Modify `project/src/api/index.js`
  - Re-exports suggestion API helpers.
- Modify `project/src/main/store/store.js`
  - Adds a small request bridge for opening the current page tutorial.
- Modify `project/src/main/components/tutorial/PageTutorialGuide.vue`
  - Watches the tutorial-open request bridge and calls existing `openGuide()`.
- Create `project/src/main/config/layoutFooter.js`
  - Resolves current page title/description, language label, theme label, version, and tutorial availability for the footer.
- Create `project/src/components/footer/AppFooter.vue`
  - Shared footer UI and action wiring.
- Create `project/src/main/components/footer/LayoutFeedbackModal.vue`
  - Feedback type picker and suggestion form. Reuses `AppModal`, `ChoiceSelector`, and `CheckBox` for screenshot consent.
- Create `project/src/utils/share/pageSnapshot.js`
  - Optional page screenshot capture and compression helper for feedback.
- Create `project/src/utils/share/shareCard.js`
  - Optional phase-2 branded share-image canvas helper for social sharing.
- Modify `project/src/layouts/MenuLayout.vue`
  - Mounts `AppFooter`.
- Modify `project/src/layouts/ExploreLayout.vue`
  - Mounts `AppFooter`.
- Modify `project/src/layouts/SimpleLayout.vue`
  - Mounts `AppFooter` without changing the existing floating buttons/sidebar behavior.
- Create `project/src/i18n/locales/zh-CN/layoutFooter.json`
- Create `project/src/i18n/locales/zh-Hant/layoutFooter.json`
- Create `project/src/i18n/locales/en/layoutFooter.json`
- Modify locale indexes in:
  - `project/src/i18n/locales/zh-CN/index.js`
  - `project/src/i18n/locales/zh-Hant/index.js`
  - `project/src/i18n/locales/en/index.js`
- Add or modify tests:
  - `project/tests/suggestionsApi.test.js`
  - `project/tests/tutorialGuideRequest.test.js`
  - `project/tests/layoutFooterContext.test.js`
  - `project/tests/layoutFooterMounting.test.js`
  - `project/tests/layoutFeedbackModal.test.js`
  - `project/tests/shareHelpers.test.js`

---

### Task 1: Suggestions API Client

**Files:**
- Create: `project/src/api/main/suggestions.js`
- Modify: `project/src/api/index.js`
- Test: `project/tests/suggestionsApi.test.js`

- [ ] **Step 1: Write the failing API tests**

Create `project/tests/suggestionsApi.test.js`:

```js
import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.fn()

vi.mock('../src/api/auth/httpClient.js', () => ({
  api: apiMock,
}))

beforeEach(() => {
  vi.resetModules()
  apiMock.mockReset()
})

describe('suggestions API client', () => {
  it('submits trimmed suggestion payload with page context and optional screenshot', async () => {
    apiMock.mockResolvedValue({ success: true, id: 9, message: '建议已提交' })

    const { submitSuggestion } = await import('../src/api/main/suggestions.js')
    const result = await submitSuggestion({
      title: '  地图颜色建议  ',
      content: '  希望绿色主题的地图点更明显。  ',
      category: 'ui',
      source_path: '/menu/map/view',
      contact: '  user@example.com  ',
      context: { routeName: 'map-view' },
      image_base64: 'data:image/webp;base64,abc',
    })

    expect(result).toEqual({ success: true, id: 9, message: '建议已提交' })
    expect(apiMock).toHaveBeenCalledWith('/api/suggestions', {
      method: 'POST',
      body: {
        title: '地图颜色建议',
        content: '希望绿色主题的地图点更明显。',
        category: 'ui',
        source_path: '/menu/map/view',
        contact: 'user@example.com',
        context: { routeName: 'map-view' },
        image_base64: 'data:image/webp;base64,abc',
      },
      responseType: 'json',
    })
  })

  it('omits empty optional fields and defaults category to general', async () => {
    apiMock.mockResolvedValue({ success: true, id: 10, message: '建议已提交' })

    const { submitSuggestion } = await import('../src/api/main/suggestions.js')
    await submitSuggestion({
      title: '  资料问题  ',
      content: '  某地点注释可能有误。  ',
      category: '',
      source_path: '',
      contact: '   ',
      context: null,
      image_base64: '',
    })

    expect(apiMock).toHaveBeenCalledWith('/api/suggestions', {
      method: 'POST',
      body: {
        title: '资料问题',
        content: '某地点注释可能有误。',
        category: 'general',
      },
      responseType: 'json',
    })
  })

})
```

- [ ] **Step 2: Run test to verify it fails**

Run from `project/`:

```bash
npm test -- tests/suggestionsApi.test.js
```

Expected: FAIL because `src/api/main/suggestions.js` does not exist.

- [ ] **Step 3: Implement the API helper**

Create `project/src/api/main/suggestions.js`:

```js
import { api } from '../../auth/httpClient.js'

export const SUGGESTION_CATEGORY_OPTIONS = [
  'general',
  'bug',
  'feature',
  'data_issue',
  'ui',
]

function trimText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function appendIfPresent(target, key, value) {
  if (value !== undefined && value !== null && value !== '') {
    target[key] = value
  }
}

export function normalizeSuggestionPayload(payload) {
  const body = {
    title: trimText(payload.title),
    content: trimText(payload.content),
    category: trimText(payload.category) || 'general',
  }

  appendIfPresent(body, 'source_path', trimText(payload.source_path))
  appendIfPresent(body, 'contact', trimText(payload.contact))

  if (payload.context && typeof payload.context === 'object') {
    body.context = payload.context
  }

  appendIfPresent(body, 'image_base64', trimText(payload.image_base64))

  return body
}

export function submitSuggestion(payload) {
  return api('/api/suggestions', {
    method: 'POST',
    body: normalizeSuggestionPayload(payload),
    responseType: 'json',
  })
}

```

Modify `project/src/api/index.js`:

```js
export {
  SUGGESTION_CATEGORY_OPTIONS,
  normalizeSuggestionPayload,
  submitSuggestion,
} from './main/suggestions.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run from `project/`:

```bash
npm test -- tests/suggestionsApi.test.js
```

Expected: PASS.

- [ ] **Step 5: CR and commit**

Run from repository root:

```bash
git diff -- project/src/api/main/suggestions.js project/src/api/index.js project/tests/suggestionsApi.test.js
```

CR checklist:

- The API path is exactly `/api/suggestions`.
- Optional empty fields are not sent.
- `category` defaults to `general`.
- `SUGGESTION_CATEGORY_OPTIONS` matches the initial frontend filter set: `general`, `bug`, `feature`, `data_issue`, `ui`.
- `image_base64` is optional and omitted when empty.
- The API file is neutral `suggestions.js`; it is not under `api/main/user/`.
- Chinese strings in tests remain literal Chinese.
- No unrelated files are changed.

Commit:

```bash
git add project/src/api/main/suggestions.js project/src/api/index.js project/tests/suggestionsApi.test.js
git commit -m "feat: add suggestions api client"
```

---

### Task 2: Tutorial Open Request Bridge

**Files:**
- Modify: `project/src/main/store/store.js`
- Modify: `project/src/main/components/tutorial/PageTutorialGuide.vue`
- Test: `project/tests/tutorialGuideRequest.test.js`

- [ ] **Step 1: Write the failing tutorial bridge test**

Create `project/tests/tutorialGuideRequest.test.js`:

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'
import { createI18n } from 'vue-i18n'

globalThis.__WEB_BASE__ = ''

let route
let confirmMock

vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

vi.mock('../src/utils/ui/message.js', () => ({
  showConfirm: (...args) => confirmMock(...args),
}))

vi.mock('../src/main/components/tutorial/TutorialDiceTrigger.vue', () => ({
  default: {
    props: ['entry', 'hasDiceConfig'],
    emits: ['open', 'apply-dice'],
    template: '<button data-tutorial-trigger @click="$emit(\'open\')">{{ entry.title }}</button>',
  },
}))

vi.mock('../src/main/components/tutorial/TutorialGuideModal.vue', () => ({
  default: {
    props: ['modelValue', 'currentEntry'],
    emits: ['update:model-value'],
    template: '<div v-if="modelValue" data-tutorial-modal>{{ currentEntry.title }}</div>',
  },
}))

function mountGuide(PageTutorialGuide) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const i18n = createI18n({
    legacy: false,
    locale: 'zh-CN',
    messages: {
      'zh-CN': {
        tutorial: {
          ui: { missing: '缺少教程' },
          categories: { multiCompare: '多方言点对比分析' },
          groups: { menuQuery: '查询' },
          disclaimer: {
            title: '提示',
            message: '教程内容仅供参考',
            confirm: '知道了',
          },
        },
      },
    },
  })
  const app = createApp(PageTutorialGuide)
  app.use(i18n)
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('tutorial guide open request bridge', () => {
  beforeEach(() => {
    vi.resetModules()
    confirmMock = vi.fn().mockResolvedValue(true)
    route = reactive({
      path: '/menu/query/zhonggu',
      fullPath: '/menu/query/zhonggu',
      query: {},
      params: { sub: 'zhonggu' },
      hash: '',
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('opens the current page tutorial when the shared request token changes', async () => {
    const { default: PageTutorialGuide } = await import('../src/main/components/tutorial/PageTutorialGuide.vue')
    const { requestCurrentTutorialGuideOpen } = await import('../src/main/store/store.js')

    const wrapper = mountGuide(PageTutorialGuide)
    await nextTick()

    expect(wrapper.host.querySelector('[data-tutorial-modal]')).toBeNull()

    requestCurrentTutorialGuideOpen()
    await nextTick()
    await nextTick()

    expect(wrapper.host.querySelector('[data-tutorial-modal]')).toBeTruthy()

    wrapper.unmount()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run from `project/`:

```bash
npm test -- tests/tutorialGuideRequest.test.js
```

Expected: FAIL because `requestCurrentTutorialGuideOpen` is not exported.

- [ ] **Step 3: Add the store bridge**

Modify `project/src/main/store/store.js` after the existing `tutorialEnabled` functions:

```js
export const tutorialGuideRequestState = reactive({
    openToken: 0
})

export function requestCurrentTutorialGuideOpen() {
    tutorialGuideRequestState.openToken += 1
}
```

Modify the import in `project/src/main/components/tutorial/PageTutorialGuide.vue`:

```js
import {
  tutorialEnabled,
  requestTutorialAssistApply,
  tutorialGuideRequestState
} from '@/main/store/store.js'
```

Add this watcher after `openGuide()` is declared:

```js
watch(
  () => tutorialGuideRequestState.openToken,
  () => {
    openGuide()
  }
)
```

- [ ] **Step 4: Run test to verify it passes**

Run from `project/`:

```bash
npm test -- tests/tutorialGuideRequest.test.js
```

Expected: PASS.

- [ ] **Step 5: CR and commit**

Run from repository root:

```bash
git diff -- project/src/main/store/store.js project/src/main/components/tutorial/PageTutorialGuide.vue project/tests/tutorialGuideRequest.test.js
```

CR checklist:

- Existing dice/tutorial assist behavior is unchanged.
- The modal still opens only when `currentMatchedEntry` exists.
- Chinese tutorial disclaimer text in tests remains literal.
- No unrelated route or tutorial manifest changes are included.

Commit:

```bash
git add project/src/main/store/store.js project/src/main/components/tutorial/PageTutorialGuide.vue project/tests/tutorialGuideRequest.test.js
git commit -m "feat: allow shared tutorial open requests"
```

---

### Task 3: Footer Context and I18n

**Files:**
- Create: `project/src/main/config/layoutFooter.js`
- Create: `project/src/i18n/locales/zh-CN/layoutFooter.json`
- Create: `project/src/i18n/locales/zh-Hant/layoutFooter.json`
- Create: `project/src/i18n/locales/en/layoutFooter.json`
- Modify: `project/src/i18n/locales/zh-CN/index.js`
- Modify: `project/src/i18n/locales/zh-Hant/index.js`
- Modify: `project/src/i18n/locales/en/index.js`
- Test: `project/tests/layoutFooterContext.test.js`

- [ ] **Step 1: Write failing context tests**

Create `project/tests/layoutFooterContext.test.js`:

```js
import { describe, expect, it } from 'vitest'

describe('layout footer context', () => {
  it('resolves route-specific copy for known menu routes', async () => {
    const { resolveLayoutFooterContext } = await import('../src/main/config/layoutFooter.js')

    const context = resolveLayoutFooterContext({
      route: { path: '/menu/query/zhonggu', fullPath: '/menu/query/zhonggu', query: {} },
      t: (key) => key,
      locale: 'zh-CN',
      colorTheme: 'green',
    })

    expect(context.pageTitleKey).toBe('layoutFooter.pages.menuQueryZhonggu.title')
    expect(context.pageDescriptionKey).toBe('layoutFooter.pages.menuQueryZhonggu.description')
    expect(context.hasTutorial).toBe(true)
    expect(context.languageLabelKey).toBe('layoutFooter.language.zhCN')
    expect(context.themeLabelKey).toBe('layoutFooter.theme.green')
  })

  it('falls back to generic copy for routes without a tutorial entry', async () => {
    const { resolveLayoutFooterContext } = await import('../src/main/config/layoutFooter.js')

    const context = resolveLayoutFooterContext({
      route: { path: '/menu/settings', fullPath: '/menu/settings', query: {} },
      t: (key) => key,
      locale: 'zh-Hant',
      colorTheme: 'blue',
    })

    expect(context.pageTitleKey).toBe('layoutFooter.pages.generic.title')
    expect(context.pageDescriptionKey).toBe('layoutFooter.pages.generic.description')
    expect(context.hasTutorial).toBe(false)
    expect(context.languageLabelKey).toBe('layoutFooter.language.zhHant')
    expect(context.themeLabelKey).toBe('layoutFooter.theme.blue')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run from `project/`:

```bash
npm test -- tests/layoutFooterContext.test.js
```

Expected: FAIL because `src/main/config/layoutFooter.js` does not exist.

- [ ] **Step 3: Add context resolver**

Create `project/src/main/config/layoutFooter.js`:

```js
import { stripLocaleFromPath } from '@/i18n/localeRouting.js'
import { tutorialManifest } from '@/main/components/tutorial/tutorialManifest.js'

const PAGE_COPY_BY_PATH = {
  '/menu/query/zhonggu': {
    pageTitleKey: 'layoutFooter.pages.menuQueryZhonggu.title',
    pageDescriptionKey: 'layoutFooter.pages.menuQueryZhonggu.description',
  },
  '/menu/query/char': {
    pageTitleKey: 'layoutFooter.pages.menuQueryChar.title',
    pageDescriptionKey: 'layoutFooter.pages.menuQueryChar.description',
  },
  '/menu/query/yinwei': {
    pageTitleKey: 'layoutFooter.pages.menuQueryYinwei.title',
    pageDescriptionKey: 'layoutFooter.pages.menuQueryYinwei.description',
  },
  '/menu/query/tone': {
    pageTitleKey: 'layoutFooter.pages.menuQueryTone.title',
    pageDescriptionKey: 'layoutFooter.pages.menuQueryTone.description',
  },
  '/menu/map/view': {
    pageTitleKey: 'layoutFooter.pages.menuMapView.title',
    pageDescriptionKey: 'layoutFooter.pages.menuMapView.description',
  },
  '/explore/tools/praat': {
    pageTitleKey: 'layoutFooter.pages.explorePraat.title',
    pageDescriptionKey: 'layoutFooter.pages.explorePraat.description',
  },
}

const LANGUAGE_LABEL_KEYS = {
  'zh-CN': 'layoutFooter.language.zhCN',
  'zh-Hant': 'layoutFooter.language.zhHant',
  en: 'layoutFooter.language.en',
}

const THEME_LABEL_KEYS = {
  blue: 'layoutFooter.theme.blue',
  light: 'layoutFooter.theme.light',
  dark: 'layoutFooter.theme.dark',
  green: 'layoutFooter.theme.green',
}

function hasTutorialEntry(route) {
  return tutorialManifest.some((entry) => entry.match(route))
}

export function resolveLayoutFooterContext({
  route,
  locale,
  colorTheme,
}) {
  const normalizedPath = stripLocaleFromPath(route?.path || '')
  const pageCopy = PAGE_COPY_BY_PATH[normalizedPath] || {
    pageTitleKey: 'layoutFooter.pages.generic.title',
    pageDescriptionKey: 'layoutFooter.pages.generic.description',
  }

  return {
    ...pageCopy,
    hasTutorial: hasTutorialEntry(route),
    languageLabelKey: LANGUAGE_LABEL_KEYS[locale] || LANGUAGE_LABEL_KEYS['zh-Hant'],
    themeLabelKey: THEME_LABEL_KEYS[colorTheme] || THEME_LABEL_KEYS.blue,
  }
}
```

Create `project/src/i18n/locales/zh-CN/layoutFooter.json`:

```json
{
  "actions": {
    "tutorial": "教程",
    "feedback": "反馈",
    "share": "分享",
    "settings": "设置",
    "copyLink": "复制链接",
    "downloadShareImage": "下载分享图"
  },
  "stats": {
    "visits": "今日 {today} · 总访问 {total}",
    "source": "字表 {locationCount} · 数据 {dataCount}",
    "databaseVersion": "数据库 {version}"
  },
  "language": {
    "zhCN": "简体",
    "zhHant": "繁体",
    "en": "English"
  },
  "theme": {
    "blue": "蓝色",
    "light": "浅色",
    "dark": "深色",
    "green": "绿色"
  },
  "pages": {
    "generic": {
      "title": "方音图鉴",
      "description": "探索方言音韵、词句资料与地理分布。"
    },
    "menuQueryZhonggu": {
      "title": "查中古",
      "description": "按中古地位整理各方言点读音。"
    },
    "menuQueryChar": {
      "title": "查字",
      "description": "按汉字查询读音、地位与注释。"
    },
    "menuQueryYinwei": {
      "title": "查音位",
      "description": "分析音位对应字的中古来源。"
    },
    "menuQueryTone": {
      "title": "查调",
      "description": "查询调值、调类与声调分布。"
    },
    "menuMapView": {
      "title": "地图显示",
      "description": "在地图上查看查询和比较结果。"
    },
    "explorePraat": {
      "title": "Praat 声学分析",
      "description": "上传或录音并查看声学分析结果。"
    }
  },
  "legal": {
    "copyright": "© 2026 方音图鉴",
    "icp": "粤ICP备2025466875号"
  },
  "share": {
    "copied": "已复制当前页面链接",
    "failed": "分享失败，请稍后再试"
  }
}
```

Create `project/src/i18n/locales/zh-Hant/layoutFooter.json` with literal Traditional Chinese:

```json
{
  "actions": {
    "tutorial": "教程",
    "feedback": "反饋",
    "share": "分享",
    "settings": "設置",
    "copyLink": "複製連結",
    "downloadShareImage": "下載分享圖"
  },
  "stats": {
    "visits": "今日 {today} · 總訪問 {total}",
    "source": "字表 {locationCount} · 數據 {dataCount}",
    "databaseVersion": "資料庫 {version}"
  },
  "language": {
    "zhCN": "簡體",
    "zhHant": "繁體",
    "en": "English"
  },
  "theme": {
    "blue": "藍色",
    "light": "淺色",
    "dark": "深色",
    "green": "綠色"
  },
  "pages": {
    "generic": {
      "title": "方音圖鑑",
      "description": "探索方言音韻、詞句資料與地理分佈。"
    },
    "menuQueryZhonggu": {
      "title": "查中古",
      "description": "按中古地位整理各方言點讀音。"
    },
    "menuQueryChar": {
      "title": "查字",
      "description": "按漢字查詢讀音、地位與注釋。"
    },
    "menuQueryYinwei": {
      "title": "查音位",
      "description": "分析音位對應字的中古來源。"
    },
    "menuQueryTone": {
      "title": "查調",
      "description": "查詢調值、調類與聲調分佈。"
    },
    "menuMapView": {
      "title": "地圖顯示",
      "description": "在地圖上查看查詢和比較結果。"
    },
    "explorePraat": {
      "title": "Praat 聲學分析",
      "description": "上傳或錄音並查看聲學分析結果。"
    }
  },
  "legal": {
    "copyright": "© 2026 方音圖鑑",
    "icp": "粵ICP備2025466875號"
  },
  "share": {
    "copied": "已複製當前頁面連結",
    "failed": "分享失敗，請稍後再試"
  }
}
```

Create `project/src/i18n/locales/en/layoutFooter.json`:

```json
{
  "actions": {
    "tutorial": "Tutorial",
    "feedback": "Feedback",
    "share": "Share",
    "settings": "Settings",
    "copyLink": "Copy link",
    "downloadShareImage": "Download share image"
  },
  "stats": {
    "visits": "Today {today} · Total {total}",
    "source": "{locationCount} tables · {dataCount} records",
    "databaseVersion": "Database {version}"
  },
  "language": {
    "zhCN": "Simplified",
    "zhHant": "Traditional",
    "en": "English"
  },
  "theme": {
    "blue": "Blue",
    "light": "Light",
    "dark": "Dark",
    "green": "Green"
  },
  "pages": {
    "generic": {
      "title": "Chinese Dialect Atlas",
      "description": "Explore dialect phonology, lexical resources, and geographic patterns."
    },
    "menuQueryZhonggu": {
      "title": "Middle Chinese Query",
      "description": "Organize dialect readings by Middle Chinese categories."
    },
    "menuQueryChar": {
      "title": "Character Query",
      "description": "Look up readings, phonological positions, and notes by character."
    },
    "menuQueryYinwei": {
      "title": "Phoneme Query",
      "description": "Analyze the Middle Chinese sources of selected phonemes."
    },
    "menuQueryTone": {
      "title": "Tone Query",
      "description": "Inspect tone values, tone classes, and tone distributions."
    },
    "menuMapView": {
      "title": "Map View",
      "description": "View query and comparison results on the map."
    },
    "explorePraat": {
      "title": "Praat Acoustic Analysis",
      "description": "Upload or record audio and inspect acoustic results."
    }
  },
  "legal": {
    "copyright": "© 2026 Chinese Dialect Atlas",
    "icp": "粤ICP备2025466875号"
  },
  "share": {
    "copied": "Current page link copied",
    "failed": "Sharing failed. Please try again later."
  }
}
```

Modify each locale index by importing and exporting `layoutFooter`:

```js
import layoutFooter from './layoutFooter.json'
```

and add it to the default export object:

```js
layoutFooter,
```

- [ ] **Step 4: Run test to verify it passes**

Run from `project/`:

```bash
npm test -- tests/layoutFooterContext.test.js
```

Expected: PASS.

- [ ] **Step 5: CR and commit**

Run from repository root:

```bash
git diff -- project/src/main/config/layoutFooter.js project/src/i18n/locales/zh-CN/layoutFooter.json project/src/i18n/locales/zh-Hant/layoutFooter.json project/src/i18n/locales/en/layoutFooter.json project/src/i18n/locales/zh-CN/index.js project/src/i18n/locales/zh-Hant/index.js project/src/i18n/locales/en/index.js project/tests/layoutFooterContext.test.js
```

CR checklist:

- No existing Chinese copy was rewritten.
- New Simplified and Traditional Chinese strings are intentionally different where script differs.
- No width-based media queries are introduced.
- `layoutFooter` is registered in all three locale indexes.

Commit:

```bash
git add project/src/main/config/layoutFooter.js project/src/i18n/locales/zh-CN/layoutFooter.json project/src/i18n/locales/zh-Hant/layoutFooter.json project/src/i18n/locales/en/layoutFooter.json project/src/i18n/locales/zh-CN/index.js project/src/i18n/locales/zh-Hant/index.js project/src/i18n/locales/en/index.js project/tests/layoutFooterContext.test.js
git commit -m "feat: add layout footer context copy"
```

---

### Task 4: Shared AppFooter Component and Layout Mounting

**Files:**
- Create: `project/src/components/footer/AppFooter.vue`
- Modify: `project/src/layouts/MenuLayout.vue`
- Modify: `project/src/layouts/ExploreLayout.vue`
- Modify: `project/src/layouts/SimpleLayout.vue`
- Test: `project/tests/layoutFooterMounting.test.js`

- [ ] **Step 1: Write failing mounting tests**

Create `project/tests/layoutFooterMounting.test.js`:

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'

globalThis.__WEB_BASE__ = ''

let route

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values = {}) => key.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? ''),
    locale: { value: 'zh-CN' },
  }),
}))

vi.mock('../src/components/bar/NavBar.vue', () => ({
  default: { template: '<div data-navbar-stub></div>' },
}))

vi.mock('../src/components/bar/ExploreBar.vue', () => ({
  default: { template: '<div data-explorebar-stub></div>' },
}))

vi.mock('../src/components/bar/FloatingButtons.vue', () => ({
  default: {
    props: ['authButtonPosition'],
    emits: ['toggle-sidebar'],
    template: '<div data-floating-buttons-stub></div>',
  },
}))

vi.mock('../src/components/bar/SimpleSidebar.vue', () => ({
  default: {
    props: ['isOpen'],
    emits: ['close'],
    template: '<div data-simple-sidebar-stub></div>',
  },
}))

vi.mock('../src/main/components/tutorial/PageTutorialGuide.vue', () => ({
  default: { template: '<div data-page-tutorial-guide></div>' },
}))

vi.mock('../src/main/components/result/PanelManager.vue', () => ({
  default: { template: '<div data-panel-manager-stub></div>' },
}))

vi.mock('../src/components/footer/AppFooter.vue', () => ({
  default: {
    props: ['layoutKind'],
    template: '<footer data-app-footer>{{ layoutKind }}</footer>',
  },
}))

function mountComponent(component) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(component)
  app.component('RouterView', {
    template: '<div data-router-view-stub></div>',
  })
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('layout footer mounting', () => {
  beforeEach(() => {
    route = reactive({
      path: '/menu/query/zhonggu',
      fullPath: '/menu/query/zhonggu',
      query: {},
      params: { sub: 'zhonggu' },
      hash: '',
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('renders AppFooter in MenuLayout', async () => {
    const { default: MenuLayout } = await import('../src/layouts/MenuLayout.vue')
    const wrapper = mountComponent(MenuLayout)
    await nextTick()

    expect(wrapper.host.querySelector('[data-app-footer]')?.textContent).toBe('menu')

    wrapper.unmount()
  })

  it('renders AppFooter in ExploreLayout', async () => {
    route.path = '/explore/tools/check'
    route.fullPath = '/explore/tools/check'

    const { default: ExploreLayout } = await import('../src/layouts/ExploreLayout.vue')
    const wrapper = mountComponent(ExploreLayout)
    await nextTick()

    expect(wrapper.host.querySelector('[data-app-footer]')?.textContent).toBe('explore')

    wrapper.unmount()
  })

  it('renders AppFooter in SimpleLayout', async () => {
    route.path = '/explore/tools/praat'
    route.fullPath = '/explore/tools/praat'

    const { default: SimpleLayout } = await import('../src/layouts/SimpleLayout.vue')
    const wrapper = mountComponent(SimpleLayout)
    await nextTick()

    expect(wrapper.host.querySelector('[data-app-footer]')?.textContent).toBe('simple')

    wrapper.unmount()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run from `project/`:

```bash
npm test -- tests/layoutFooterMounting.test.js
```

Expected: FAIL because the layouts do not mount `AppFooter`.

- [ ] **Step 3: Create AppFooter**

Create `project/src/components/footer/AppFooter.vue`:

```vue
<template>
  <footer class="app-footer" data-app-footer :data-layout-kind="layoutKind">
    <div class="footer-primary">
      <p class="info-text page-copy">
        <strong>{{ t(context.pageTitleKey) }}</strong>
        <span class="hint">{{ t(context.pageDescriptionKey) }}</span>
      </p>

      <div class="footer-actions" aria-label="layout footer actions">
        <button
          type="button"
          class="text-action footer-action"
          :disabled="!context.hasTutorial"
          @click="openTutorial"
        >
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
    </div>

    <div class="page-footer footer-meta">
      <span class="info-text">
        {{ t(context.languageLabelKey) }} · {{ t(context.themeLabelKey) }}
      </span>
      <span class="info-text">{{ t('layoutFooter.stats.visits', { today: todayVisits, total: totalVisits }) }}</span>
      <span class="info-text">{{ t('layoutFooter.stats.source', { locationCount: sourceLocationCount, dataCount: sourceDataCount }) }}</span>
      <span class="info-text">{{ t('layoutFooter.stats.databaseVersion', { version: sourceDbVersion }) }}</span>
      <span class="info-text">{{ t('layoutFooter.legal.icp') }}</span>
    </div>

    <LayoutFeedbackModal
      v-model="isFeedbackOpen"
      :page-title="t(context.pageTitleKey)"
      :source-path="route.path"
      :context="feedbackContext"
    />
  </footer>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { requestCurrentTutorialGuideOpen } from '@/main/store/store.js'
import { resolveLayoutFooterContext } from '@/main/config/layoutFooter.js'
import { getHomeUpdateNotice } from '@/utils/user/updateNoticeConfig.js'
import { getCachedSourceStats, getSourceStats } from '@/composables/data/useSourceStats.js'
import { useVisitStats } from '@/composables/data/useVisitStats.js'
import { currentColorTheme } from '@/composables/core/uiPreferences.js'
import { showError, showSuccess } from '@/utils/ui/message.js'
import LayoutFeedbackModal from '@/main/components/footer/LayoutFeedbackModal.vue'

const props = defineProps({
  layoutKind: {
    type: String,
    required: true,
    validator: value => ['menu', 'explore', 'simple'].includes(value),
  },
})

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const homeUpdateNotice = getHomeUpdateNotice(t)
const sourceDbVersion = homeUpdateNotice.dbVersion
const cachedSourceStats = getCachedSourceStats()
const sourceLocationCount = ref(cachedSourceStats.locationCount)
const sourceDataCount = ref(cachedSourceStats.dataCount)
const isFeedbackOpen = ref(false)

const {
  todayVisits,
  totalVisits,
  ensureVisitStats,
} = useVisitStats()

const context = computed(() => resolveLayoutFooterContext({
  route,
  locale: locale.value,
  colorTheme: currentColorTheme.value,
}))

const feedbackContext = computed(() => ({
  path: route.path,
  fullPath: route.fullPath,
  query: route.query,
  hash: route.hash,
  layout: props.layoutKind,
  locale: locale.value,
  colorTheme: currentColorTheme.value,
  client_version: `web-${homeUpdateNotice.version}`,
  database_version: sourceDbVersion,
  pageTitle: t(context.value.pageTitleKey),
  pageDescription: t(context.value.pageDescriptionKey),
  viewport: typeof window === 'undefined'
    ? null
    : {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
}))

function openTutorial() {
  if (!context.value.hasTutorial) return
  requestCurrentTutorialGuideOpen()
}

function goToSettings() {
  router.push(buildLocalePath(resolveRouteLocale(route), '/menu/settings'))
}

async function shareCurrentPage() {
  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({
        title: t(context.value.pageTitleKey),
        text: t(context.value.pageDescriptionKey),
        url,
      })
      return
    }

    await navigator.clipboard.writeText(url)
    showSuccess(t('layoutFooter.share.copied'))
  } catch {
    showError(t('layoutFooter.share.failed'))
  }
}

async function fetchFooterStats() {
  try {
    await ensureVisitStats()
  } catch (error) {
    console.error('獲取訪問統計失敗:', error)
  }

  try {
    const stats = await getSourceStats()
    sourceLocationCount.value = stats.locationCount
    sourceDataCount.value = stats.dataCount
  } catch (error) {
    console.error('獲取字表統計失敗:', error)
  }
}

onMounted(fetchFooterStats)
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.app-footer {
  width: min(100%, 1200px);
  margin: 10px auto 0;
  padding: 10px 12px;
}

.footer-primary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.page-copy {
  min-width: 0;
  margin: 0;
  @include flex-col;
  gap: 2px;
}

.footer-actions,
.footer-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.footer-actions {
  justify-content: flex-end;
}

.footer-action {
  min-width: 0;
}

.footer-meta {
  justify-content: center;
  margin-top: 8px;
}

@media (max-aspect-ratio: 1 / 1) {
  .app-footer {
    padding: 8px;
  }

  .footer-primary {
    @include flex-col;
    align-items: stretch;
  }

  .footer-actions {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .footer-action {
    min-width: 0;
  }
}
</style>
```

- [ ] **Step 4: Mount AppFooter in layouts**

Modify `project/src/layouts/MenuLayout.vue`:

```vue
<AppFooter layout-kind="menu" />
```

Add import:

```js
import AppFooter from '@/components/footer/AppFooter.vue'
```

Modify `project/src/layouts/ExploreLayout.vue`:

```vue
<AppFooter layout-kind="explore" />
```

Add import:

```js
import AppFooter from '@/components/footer/AppFooter.vue'
```

Modify `project/src/layouts/SimpleLayout.vue`:

```vue
<AppFooter layout-kind="simple" />
```

Add import:

```js
import AppFooter from '@/components/footer/AppFooter.vue'
```

In `SimpleLayout.vue`, preserve existing floating buttons and sidebar. Change only the root flow so content and footer stack vertically:

```scss
.simple-layout {
  min-height: 100dvh;
  @include flex-col;
  align-items: center;
  justify-content: flex-start;
}
```

Also add the required mixin import at the top of the style block if it is not already present:

```scss
@use '@/styles/global/mixins' as *;
```

- [ ] **Step 5: Run mounting tests**

Run from `project/`:

```bash
npm test -- tests/layoutFooterMounting.test.js
```

Expected: PASS.

- [ ] **Step 6: CR and commit**

Run from repository root:

```bash
git diff -- project/src/components/footer/AppFooter.vue project/src/layouts/MenuLayout.vue project/src/layouts/ExploreLayout.vue project/src/layouts/SimpleLayout.vue project/tests/layoutFooterMounting.test.js
```

CR checklist:

- Existing `PageTutorialGuide`, `PanelManager`, `FloatingButtons`, and `SimpleSidebar` remain mounted.
- `SimpleLayout` behavior changes only enough to stack footer after content.
- Styles use `<style scoped lang="scss">` and project mixins.
- Footer action buttons reuse a shared low-emphasis text action utility; footer SCSS does not draw button visual skin.
- Footer shell is a flat full-width surface with a single top border; footer copy and metadata reuse `info-text`, `hint`, and `page-footer`.
- Component-local footer SCSS contains only layout glue and no `background`, `border`, `border-radius`, `box-shadow`, `color`, or focus-ring styling.
- Footer surfaces, text, borders, and states come from shared classes and existing `var(--...)` design tokens.
- `source_path` passed to feedback is `route.path`; `route.fullPath`, query, hash, locale, theme, layout, app version, and database version stay in feedback context.
- No width-based responsive media query appears.

Commit:

```bash
git add project/src/components/footer/AppFooter.vue project/src/layouts/MenuLayout.vue project/src/layouts/ExploreLayout.vue project/src/layouts/SimpleLayout.vue project/tests/layoutFooterMounting.test.js
git commit -m "feat: mount shared layout footer"
```

---

### Task 5: Feedback Modal API Submission

**Files:**
- Create: `project/src/main/components/footer/LayoutFeedbackModal.vue`
- Test: `project/tests/layoutFeedbackModal.test.js`

- [ ] **Step 1: Write failing modal test**

Create `project/tests/layoutFeedbackModal.test.js`:

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const submitSuggestionMock = vi.fn()
const showSuccessMock = vi.fn()
const showErrorMock = vi.fn()

vi.mock('../src/api/main/suggestions.js', () => ({
  submitSuggestion: submitSuggestionMock,
}))

vi.mock('../src/utils/ui/message.js', () => ({
  showSuccess: showSuccessMock,
  showError: showErrorMock,
}))

vi.mock('../src/components/common/AppModal.vue', () => ({
  default: {
    props: ['modelValue', 'title'],
    emits: ['update:modelValue', 'close'],
    template: `
      <section v-if="modelValue" data-app-modal>
        <h2>{{ title }}</h2>
        <slot />
        <slot name="footer" />
      </section>
    `,
  },
}))

vi.mock('../src/components/selector/ChoiceSelector.vue', () => ({
  default: {
    props: ['modelValue', 'options', 'ariaLabel', 'disabled'],
    emits: ['update:modelValue'],
    template: `
      <div role="tablist" :aria-label="ariaLabel">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          :data-feedback-category="option.value"
          :data-active="modelValue === option.value"
          :disabled="disabled"
          @click="$emit('update:modelValue', option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    `,
  },
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

function mountModal(component, props = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(component, {
    modelValue: true,
    pageTitle: '查中古',
    sourcePath: '/menu/query/zhonggu',
    context: { path: '/menu/query/zhonggu', fullPath: '/menu/query/zhonggu', locale: 'zh-CN' },
    ...props,
  })
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('LayoutFeedbackModal', () => {
  beforeEach(() => {
    vi.resetModules()
    submitSuggestionMock.mockReset()
    showSuccessMock.mockReset()
    showErrorMock.mockReset()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('submits typed feedback with selected category and context', async () => {
    submitSuggestionMock.mockResolvedValue({ success: true, id: 12 })

    const { default: LayoutFeedbackModal } = await import('../src/main/components/footer/LayoutFeedbackModal.vue')
    const wrapper = mountModal(LayoutFeedbackModal)
    await nextTick()

    wrapper.host.querySelector('[data-feedback-category="bug"]').click()
    wrapper.host.querySelector('[name="title"]').value = '地图没有刷新'
    wrapper.host.querySelector('[name="title"]').dispatchEvent(new Event('input'))
    wrapper.host.querySelector('[name="content"]').value = '切换分区后地图颜色没有变化。'
    wrapper.host.querySelector('[name="content"]').dispatchEvent(new Event('input'))

    wrapper.host.querySelector('[data-submit-feedback]').click()
    await nextTick()
    await nextTick()

    expect(submitSuggestionMock).toHaveBeenCalledWith({
      title: '地图没有刷新',
      content: '切换分区后地图颜色没有变化。',
      category: 'bug',
      source_path: '/menu/query/zhonggu',
      contact: '',
      context: {
        path: '/menu/query/zhonggu',
        fullPath: '/menu/query/zhonggu',
        locale: 'zh-CN',
        pageTitle: '查中古',
      },
      image_base64: '',
    })
    expect(showSuccessMock).toHaveBeenCalledWith('layoutFooter.feedback.success')

    wrapper.unmount()
  })

  it('shows a validation message for backend 422 responses', async () => {
    submitSuggestionMock.mockRejectedValue({ status: 422 })

    const { default: LayoutFeedbackModal } = await import('../src/main/components/footer/LayoutFeedbackModal.vue')
    const wrapper = mountModal(LayoutFeedbackModal)
    await nextTick()

    wrapper.host.querySelector('[name="title"]').value = '截图太大'
    wrapper.host.querySelector('[name="title"]').dispatchEvent(new Event('input'))
    wrapper.host.querySelector('[name="content"]').value = '后端返回字段或截图不合法。'
    wrapper.host.querySelector('[name="content"]').dispatchEvent(new Event('input'))

    wrapper.host.querySelector('[data-submit-feedback]').click()
    await nextTick()
    await nextTick()

    expect(showErrorMock).toHaveBeenCalledWith('layoutFooter.feedback.validationFailed')

    wrapper.unmount()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run from `project/`:

```bash
npm test -- tests/layoutFeedbackModal.test.js
```

Expected: FAIL because `LayoutFeedbackModal.vue` does not exist.

- [ ] **Step 3: Add feedback i18n keys**

Add this block to each `layoutFooter.json`, translated per locale:

```json
"feedback": {
  "title": "提交反馈",
  "category": "类型",
  "titleLabel": "标题",
  "titlePlaceholder": "简要说明问题或建议",
  "contentLabel": "内容",
  "contentPlaceholder": "请描述你看到的问题、想法或期待的改进。",
  "contactLabel": "联系方式",
  "contactPlaceholder": "邮箱或其他联系方式，可留空",
  "submit": "提交",
  "success": "反馈已提交，感谢你的帮助",
  "validationFailed": "反馈内容或截图不符合要求，请检查后再提交",
  "failed": "反馈提交失败，请稍后再试",
  "categories": {
    "general": "其他",
    "bug": "问题",
    "feature": "功能建议",
    "data_issue": "资料问题",
    "ui": "界面体验"
  }
}
```

Use Traditional Chinese in `zh-Hant/layoutFooter.json` and English in `en/layoutFooter.json`.

- [ ] **Step 4: Create modal component**

Create `project/src/main/components/footer/LayoutFeedbackModal.vue`:

```vue
<template>
  <AppModal
    :model-value="modelValue"
    size="sm"
    data-layout-feedback-modal
    :title="t('layoutFooter.feedback.title')"
    :close-label="t('common.button.close')"
    @update:modelValue="emit('update:modelValue', $event)"
  >
    <form class="feedback-form" @submit.prevent="submit">
      <div class="field feedback-category">
        <span>{{ t('layoutFooter.feedback.category') }}</span>
        <ChoiceSelector
          v-model="category"
          :options="categoryOptions"
          :aria-label="t('layoutFooter.feedback.category')"
        />
      </div>

      <label class="field">
        <span>{{ t('layoutFooter.feedback.titleLabel') }}</span>
        <input
          v-model.trim="title"
          class="glass-field"
          name="title"
          maxlength="200"
          :placeholder="t('layoutFooter.feedback.titlePlaceholder')"
        />
      </label>

      <label class="field">
        <span>{{ t('layoutFooter.feedback.contentLabel') }}</span>
        <textarea
          v-model.trim="content"
          class="glass-field"
          name="content"
          maxlength="5000"
          rows="5"
          :placeholder="t('layoutFooter.feedback.contentPlaceholder')"
        ></textarea>
      </label>

      <label class="field">
        <span>{{ t('layoutFooter.feedback.contactLabel') }}</span>
        <input
          v-model.trim="contact"
          class="glass-field"
          name="contact"
          maxlength="200"
          :placeholder="t('layoutFooter.feedback.contactPlaceholder')"
        />
      </label>
    </form>

    <template #footer>
      <button
        type="button"
        class="glass-button submit-button"
        data-variant="primary"
        data-size="small"
        data-submit-feedback
        :disabled="isSubmitting || !canSubmit"
        @click="submit"
      >
        {{ t('layoutFooter.feedback.submit') }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import ChoiceSelector from '@/components/selector/ChoiceSelector.vue'
import { submitSuggestion } from '@/api/main/suggestions.js'
import { showError, showSuccess } from '@/utils/ui/message.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  pageTitle: {
    type: String,
    default: '',
  },
  sourcePath: {
    type: String,
    default: '',
  },
  context: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const category = ref('general')
const title = ref('')
const content = ref('')
const contact = ref('')
const isSubmitting = ref(false)

const categoryOptions = computed(() => ([
  { value: 'general', label: t('layoutFooter.feedback.categories.general') },
  { value: 'bug', label: t('layoutFooter.feedback.categories.bug') },
  { value: 'feature', label: t('layoutFooter.feedback.categories.feature') },
  { value: 'data_issue', label: t('layoutFooter.feedback.categories.data_issue') },
  { value: 'ui', label: t('layoutFooter.feedback.categories.ui') },
]))

const canSubmit = computed(() => title.value.trim() && content.value.trim())

function resetForm() {
  category.value = 'general'
  title.value = ''
  content.value = ''
  contact.value = ''
}

async function submit() {
  if (!canSubmit.value || isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  try {
    await submitSuggestion({
      title: title.value,
      content: content.value,
      category: category.value,
      source_path: props.sourcePath,
      contact: contact.value,
      context: {
        ...props.context,
        pageTitle: props.pageTitle,
      },
      image_base64: '',
    })
    showSuccess(t('layoutFooter.feedback.success'))
    emit('update:modelValue', false)
    resetForm()
  } catch (error) {
    const errorKey = error?.status === 422 || error?.message === 'screenshot_too_large'
      ? 'layoutFooter.feedback.validationFailed'
      : 'layoutFooter.feedback.failed'
    showError(t(errorKey))
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) resetForm()
  }
)
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.feedback-form {
  @include flex-col;
  gap: 12px;
}

.field {
  @include flex-col;
  gap: 6px;
}

.feedback-category {
  align-items: flex-start;
}

textarea {
  resize: vertical;
}

.submit-button {
  min-width: 96px;
}
</style>
```

- [ ] **Step 5: Run modal test**

Run from `project/`:

```bash
npm test -- tests/layoutFeedbackModal.test.js
```

Expected: PASS.

- [ ] **Step 6: CR and commit**

Run from repository root:

```bash
git diff -- project/src/main/components/footer/LayoutFeedbackModal.vue project/src/i18n/locales/zh-CN/layoutFooter.json project/src/i18n/locales/zh-Hant/layoutFooter.json project/src/i18n/locales/en/layoutFooter.json project/tests/layoutFeedbackModal.test.js
```

CR checklist:

- The modal uses `AppModal`, so the header does not scroll with content.
- Feedback submits directly through `submitSuggestion()`; it does not navigate to `/menu/about/suggestion`.
- The category picker reuses `ChoiceSelector`; do not replace it with a custom segmented-control skin.
- Title, content, and contact controls reuse `glass-field`; do not add component-local input or textarea visual styling.
- The submit button reuses `glass-button` with `data-variant="primary"`.
- Component-local modal SCSS contains only layout glue and no `background`, `border`, `border-radius`, `box-shadow`, `color`, or focus-ring styling.
- The initial frontend category choices are `general`, `bug`, `feature`, `data_issue`, and `ui`.
- Backend `422` responses show `layoutFooter.feedback.validationFailed`; other errors show `layoutFooter.feedback.failed`.
- Existing Chinese copy outside `layoutFooter.json` is untouched.
- The request includes route context but does not include screenshot data yet.
- No width-based media queries are introduced.

Commit:

```bash
git add project/src/main/components/footer/LayoutFeedbackModal.vue project/src/i18n/locales/zh-CN/layoutFooter.json project/src/i18n/locales/zh-Hant/layoutFooter.json project/src/i18n/locales/en/layoutFooter.json project/tests/layoutFeedbackModal.test.js
git commit -m "feat: add layout feedback modal"
```

---

### Task 6: Opt-In Screenshot Capture for Feedback

Backend `image_base64` support is confirmed. This task adds optional automatic
page screenshots to the real feedback submission path.

**Files:**
- Modify: `project/package.json`
- Create: `project/src/utils/share/pageSnapshot.js`
- Modify: `project/src/main/components/footer/LayoutFeedbackModal.vue`
- Test: `project/tests/shareHelpers.test.js`
- Test: `project/tests/layoutFeedbackModal.test.js`

- [ ] **Step 1: Add dependency**

This is the only planned new runtime dependency for the footer work. Do not add
another screenshot or DOM-to-image library in the same pass.

Run from `project/`:

```bash
npm install html2canvas --save
```

Expected: `project/package.json` gains `html2canvas` in dependencies.

- [ ] **Step 2: Write failing screenshot helper tests**

Create `project/tests/shareHelpers.test.js`:

```js
import { beforeEach, describe, expect, it, vi } from 'vitest'

const html2canvasMock = vi.fn()

vi.mock('html2canvas', () => ({
  default: html2canvasMock,
}))

beforeEach(() => {
  vi.resetModules()
  html2canvasMock.mockReset()
})

describe('page snapshot helper', () => {
  it('returns a compressed data URL from the document body', async () => {
    const canvas = {
      width: 1200,
      height: 800,
      toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,abc'),
    }
    html2canvasMock.mockResolvedValue(canvas)

    const { capturePageSnapshot } = await import('../src/utils/share/pageSnapshot.js')
    const result = await capturePageSnapshot({ maxWidth: 1200, quality: 0.72 })

    expect(result).toBe('data:image/webp;base64,abc')
    expect(html2canvasMock).toHaveBeenCalledWith(document.body, {
      backgroundColor: null,
      ignoreElements: expect.any(Function),
      logging: false,
      scale: 1,
      useCORS: true,
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
    })
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/webp', 0.72)
  })

  it('lowers webp quality until the screenshot is below the target size', async () => {
    const largeDataUrl = `data:image/webp;base64,${'a'.repeat(1200)}`
    const smallDataUrl = 'data:image/webp;base64,abc'
    const canvas = {
      width: 1200,
      height: 800,
      toDataURL: vi.fn()
        .mockReturnValueOnce(largeDataUrl)
        .mockReturnValueOnce(smallDataUrl),
    }
    html2canvasMock.mockResolvedValue(canvas)

    const { capturePageSnapshot } = await import('../src/utils/share/pageSnapshot.js')
    const result = await capturePageSnapshot({ targetBytes: 100, maxBytes: 1024, quality: 0.8 })

    expect(result).toBe(smallDataUrl)
    expect(canvas.toDataURL).toHaveBeenNthCalledWith(1, 'image/webp', 0.8)
    expect(canvas.toDataURL).toHaveBeenNthCalledWith(2, 'image/webp', 0.72)
  })
})
```

- [ ] **Step 3: Run helper test to verify it fails**

Run from `project/`:

```bash
npm test -- tests/shareHelpers.test.js
```

Expected: FAIL because `pageSnapshot.js` does not exist.

- [ ] **Step 4: Implement snapshot helper**

Create `project/src/utils/share/pageSnapshot.js`:

```js
import html2canvas from 'html2canvas'

const DEFAULT_MAX_WIDTH = 1200
const DEFAULT_TARGET_BYTES = 600 * 1024
const DEFAULT_MAX_BYTES = 1024 * 1024
const DEFAULT_QUALITY = 0.72
const MIN_QUALITY = 0.42
const QUALITY_STEP = 0.08

export function estimateDataUrlBytes(dataUrl) {
  if (typeof dataUrl !== 'string') return 0
  const base64 = dataUrl.split(',', 2)[1] || ''
  return Math.ceil((base64.length * 3) / 4)
}

function resizeCanvasIfNeeded(canvas, maxWidth) {
  if (!canvas || !maxWidth || canvas.width <= maxWidth) {
    return canvas
  }

  const ratio = maxWidth / canvas.width
  const resizedCanvas = document.createElement('canvas')
  resizedCanvas.width = maxWidth
  resizedCanvas.height = Math.round(canvas.height * ratio)
  resizedCanvas
    .getContext('2d')
    .drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height)

  return resizedCanvas
}

export function encodeCanvasWithinLimit(
  canvas,
  {
    mimeType = 'image/webp',
    quality = DEFAULT_QUALITY,
    targetBytes = DEFAULT_TARGET_BYTES,
    maxBytes = DEFAULT_MAX_BYTES,
  } = {}
) {
  let currentQuality = quality
  let dataUrl = canvas.toDataURL(mimeType, currentQuality)

  while (estimateDataUrlBytes(dataUrl) > targetBytes && currentQuality > MIN_QUALITY) {
    currentQuality = Math.max(MIN_QUALITY, Number((currentQuality - QUALITY_STEP).toFixed(2)))
    dataUrl = canvas.toDataURL(mimeType, currentQuality)
  }

  if (estimateDataUrlBytes(dataUrl) > maxBytes) {
    throw new Error('screenshot_too_large')
  }

  return dataUrl
}

export async function capturePageSnapshot({
  target = document.body,
  maxWidth = DEFAULT_MAX_WIDTH,
  quality = DEFAULT_QUALITY,
  targetBytes = DEFAULT_TARGET_BYTES,
  maxBytes = DEFAULT_MAX_BYTES,
} = {}) {
  const canvas = await html2canvas(target, {
    backgroundColor: null,
    ignoreElements: (element) => {
      return Boolean(
        element.closest?.('[data-layout-feedback-modal]') ||
        element.closest?.('[data-page-tutorial-guide]') ||
        element.closest?.('[data-app-footer]')
      )
    },
    logging: false,
    scale: 1,
    useCORS: true,
    windowHeight: window.innerHeight,
    windowWidth: window.innerWidth,
  })

  return encodeCanvasWithinLimit(resizeCanvasIfNeeded(canvas, maxWidth), {
    quality,
    targetBytes,
    maxBytes,
  })
}
```

- [ ] **Step 5: Wire optional screenshot checkbox into modal**

Modify `project/src/main/components/footer/LayoutFeedbackModal.vue`.

Add i18n keys to all three `layoutFooter.json` files:

```json
"screenshot": {
  "label": "附带当前页面截图",
  "hint": "勾选后会生成压缩预览，并随反馈提交。若页面含跨域地图瓦片，截图可能不完整。",
  "capturing": "正在生成截图预览…",
  "retake": "重新截图",
  "previewAlt": "当前页面截图预览"
}
```

Add the checkbox inside the form:

```vue
<CheckBox
  v-model="includeScreenshot"
  class="screenshot-field"
  data-include-screenshot
>
  {{ t('layoutFooter.feedback.screenshot.label') }}
</CheckBox>
<p class="hint screenshot-hint">{{ t('layoutFooter.feedback.screenshot.hint') }}</p>
<div v-if="includeScreenshot" class="surface-subpanel screenshot-preview">
  <img
    v-if="screenshotDataUrl"
    :src="screenshotDataUrl"
    :alt="t('layoutFooter.feedback.screenshot.previewAlt')"
  />
  <span v-else>{{ t('layoutFooter.feedback.screenshot.capturing') }}</span>
  <button
    type="button"
    class="glass-button screenshot-retake"
    data-size="compact"
    :disabled="isCapturingScreenshot"
    @click="captureScreenshotPreview"
  >
    {{ t('layoutFooter.feedback.screenshot.retake') }}
  </button>
</div>
```

Add imports and state:

```js
import CheckBox from '@/components/selector/CheckBox.vue'
import { capturePageSnapshot } from '@/utils/share/pageSnapshot.js'

const includeScreenshot = ref(false)
const screenshotDataUrl = ref('')
const isCapturingScreenshot = ref(false)
```

Update `resetForm()`:

```js
includeScreenshot.value = false
screenshotDataUrl.value = ''
isCapturingScreenshot.value = false
```

Add preview capture logic:

```js
async function captureScreenshotPreview() {
  if (!includeScreenshot.value || isCapturingScreenshot.value) {
    return
  }

  isCapturingScreenshot.value = true
  try {
    screenshotDataUrl.value = await capturePageSnapshot()
  } catch (error) {
    screenshotDataUrl.value = ''
    includeScreenshot.value = false
    const errorKey = error?.message === 'screenshot_too_large'
      ? 'layoutFooter.feedback.validationFailed'
      : 'layoutFooter.feedback.failed'
    showError(t(errorKey))
  } finally {
    isCapturingScreenshot.value = false
  }
}

watch(includeScreenshot, (checked) => {
  if (!checked) {
    screenshotDataUrl.value = ''
    return
  }

  captureScreenshotPreview()
})
```

Update `submit()` before calling `submitSuggestion`:

```js
const imageBase64 = includeScreenshot.value
  ? screenshotDataUrl.value || await capturePageSnapshot()
  : ''
```

Update the submit button disabled state:

```vue
:disabled="isSubmitting || isCapturingScreenshot || !canSubmit"
```

Update payload:

```js
image_base64: imageBase64,
```

Add styles:

```scss
.screenshot-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.screenshot-hint {
  margin: -6px 0 0;
}

.screenshot-preview {
  @include flex-col;
  gap: 8px;
  padding: 8px;
}

.screenshot-preview img {
  display: block;
  width: 100%;
  max-height: 180px;
  object-fit: contain;
}

.screenshot-retake {
  align-self: flex-start;
}
```

- [ ] **Step 6: Add modal screenshot test**

Append this test to `project/tests/layoutFeedbackModal.test.js`:

```js
vi.mock('../src/utils/share/pageSnapshot.js', () => ({
  capturePageSnapshot: vi.fn().mockResolvedValue('data:image/webp;base64,shot'),
}))

it('includes a compressed screenshot when the user opts in', async () => {
  submitSuggestionMock.mockResolvedValue({ success: true, id: 13 })

  const { default: LayoutFeedbackModal } = await import('../src/main/components/footer/LayoutFeedbackModal.vue')
  const wrapper = mountModal(LayoutFeedbackModal)
  await nextTick()

  wrapper.host.querySelector('[name="title"]').value = '页面截图'
  wrapper.host.querySelector('[name="title"]').dispatchEvent(new Event('input'))
  wrapper.host.querySelector('[name="content"]').value = '附上截图方便定位。'
  wrapper.host.querySelector('[name="content"]').dispatchEvent(new Event('input'))
  const screenshotInput = wrapper.host.querySelector('[data-include-screenshot] input')
  screenshotInput.checked = true
  screenshotInput.dispatchEvent(new Event('change'))
  await nextTick()
  await nextTick()

  expect(wrapper.host.querySelector('.screenshot-preview img')?.getAttribute('src'))
    .toBe('data:image/webp;base64,shot')

  wrapper.host.querySelector('[data-submit-feedback]').click()
  await nextTick()
  await nextTick()

  expect(submitSuggestionMock).toHaveBeenCalledWith(expect.objectContaining({
    image_base64: 'data:image/webp;base64,shot',
  }))

  wrapper.unmount()
})
```

- [ ] **Step 7: Run tests**

Run from `project/`:

```bash
npm test -- tests/shareHelpers.test.js tests/layoutFeedbackModal.test.js
```

Expected: PASS.

- [ ] **Step 8: CR and commit**

Run from repository root:

```bash
git diff -- project/package.json project/src/utils/share/pageSnapshot.js project/src/main/components/footer/LayoutFeedbackModal.vue project/src/i18n/locales/zh-CN/layoutFooter.json project/src/i18n/locales/zh-Hant/layoutFooter.json project/src/i18n/locales/en/layoutFooter.json project/tests/shareHelpers.test.js project/tests/layoutFeedbackModal.test.js
```

CR checklist:

- `image_base64` is included only when the checkbox is checked.
- Automatic screenshots are encoded as `image/webp`.
- Screenshot compression targets about 600 KB and throws `screenshot_too_large` if output remains above 1 MB.
- Screenshot consent reuses `CheckBox`; do not style a native checkbox from scratch.
- Screenshot helper copy reuses `hint`; preview/status surface reuses `surface-subpanel`; retake action reuses `glass-button`.
- Component-local screenshot SCSS contains only spacing and image sizing.
- Modal and footer are ignored by screenshot capture.
- Chinese and emoji content remain literal.
- The new dependency is justified by current-page screenshot support.

Commit:

```bash
git add project/package.json project/src/utils/share/pageSnapshot.js project/src/main/components/footer/LayoutFeedbackModal.vue project/src/i18n/locales/zh-CN/layoutFooter.json project/src/i18n/locales/zh-Hant/layoutFooter.json project/src/i18n/locales/en/layoutFooter.json project/tests/shareHelpers.test.js project/tests/layoutFeedbackModal.test.js
git commit -m "feat: support screenshot feedback"
```

---

### Task 7: Phase-2 Branded Share Image

Execute this after the base footer share button is working. The base share path
in Task 4 remains `navigator.share` first and clipboard fallback second; this
task only adds an optional image fallback for platforms/workflows that benefit
from picture sharing.

**Files:**
- Create: `project/src/utils/share/shareCard.js`
- Modify: `project/src/components/footer/AppFooter.vue`
- Test: `project/tests/shareHelpers.test.js`

- [ ] **Step 1: Add failing share-card tests**

Append to `project/tests/shareHelpers.test.js`:

```js
describe('share card helper', () => {
  it('draws a branded share card and returns a PNG data URL', async () => {
    const calls = []
    const context = {
      fillStyle: '',
      font: '',
      textAlign: '',
      fillRect: (...args) => calls.push(['fillRect', ...args]),
      fillText: (...args) => calls.push(['fillText', ...args]),
      measureText: (text) => ({ width: text.length * 12 }),
    }
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,card'),
    }
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') return canvas
      return createElement(tagName)
    })

    const { createShareCardDataUrl } = await import('../src/utils/share/shareCard.js')
    const result = createShareCardDataUrl({
      title: '查中古',
      description: '按中古地位整理各方言点读音。',
      url: 'https://dialects.yzup.top/menu/query/zhonggu',
      languageLabel: '简体',
      themeLabel: '绿色',
      colorTheme: 'green',
    })

    expect(result).toBe('data:image/png;base64,card')
    expect(canvas.width).toBe(1200)
    expect(canvas.height).toBe(630)
    expect(calls.some(call => call.includes('方音图鉴'))).toBe(true)
    expect(calls.some(call => call.includes('简体 · 绿色'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run share helper test to verify it fails**

Run from `project/`:

```bash
npm test -- tests/shareHelpers.test.js
```

Expected: FAIL because `shareCard.js` does not exist.

- [ ] **Step 3: Implement share card helper**

Create `project/src/utils/share/shareCard.js`:

```js
const THEME_COLOR_TOKENS = {
  blue: '--color-primary',
  green: '--color-success',
  light: '--text-slate',
  dark: '--text-deep',
}

function readCssToken(tokenName, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  return getComputedStyle(document.documentElement)
    .getPropertyValue(tokenName)
    .trim() || fallback
}

function wrapText(ctx, text, maxWidth) {
  const chars = Array.from(text)
  const lines = []
  let current = ''

  for (const char of chars) {
    const next = current + char
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current)
      current = char
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines.slice(0, 3)
}

export function createShareCardDataUrl({
  title,
  description,
  url,
  languageLabel,
  themeLabel,
  colorTheme,
}) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')
  const accent = readCssToken(THEME_COLOR_TOKENS[colorTheme] || THEME_COLOR_TOKENS.blue, '#2f74c0')

  ctx.fillStyle = readCssToken('--surface-panel-strong', '#f7fbf8')
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, canvas.width, 18)

  ctx.fillStyle = readCssToken('--text-deep', '#203026')
  ctx.font = '500 54px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText(title, 80, 160)

  ctx.font = '400 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  const descLines = wrapText(ctx, description, 920)
  descLines.forEach((line, index) => {
    ctx.fillText(line, 80, 230 + index * 48)
  })

  ctx.fillStyle = accent
  ctx.font = '500 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText(`${languageLabel} · ${themeLabel}`, 80, 450)

  ctx.fillStyle = readCssToken('--text-slate', '#637268')
  ctx.font = '400 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('方音图鉴', 80, 530)
  ctx.fillText(url, 80, 570)

  return canvas.toDataURL('image/png')
}
```

- [ ] **Step 4: Wire enhanced share into AppFooter**

Modify `project/src/components/footer/AppFooter.vue`.

Add import:

```js
import { createShareCardDataUrl } from '@/utils/share/shareCard.js'
```

Add helper:

```js
function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
```

Replace `shareCurrentPage()` with:

```js
async function shareCurrentPage() {
  const url = window.location.href
  const title = t(context.value.pageTitleKey)
  const text = t(context.value.pageDescriptionKey)

  try {
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return
    }

    const dataUrl = createShareCardDataUrl({
      title,
      description: text,
      url,
      languageLabel: t(context.value.languageLabelKey),
      themeLabel: t(context.value.themeLabelKey),
      colorTheme: currentColorTheme.value,
    })

    downloadDataUrl(dataUrl, 'dialects-share.png')
    await navigator.clipboard.writeText(url)
    showSuccess(t('layoutFooter.share.copied'))
  } catch {
    showError(t('layoutFooter.share.failed'))
  }
}
```

- [ ] **Step 5: Run share helper test**

Run from `project/`:

```bash
npm test -- tests/shareHelpers.test.js
```

Expected: PASS.

- [ ] **Step 6: CR and commit**

Run from repository root:

```bash
git diff -- project/src/utils/share/shareCard.js project/src/components/footer/AppFooter.vue project/tests/shareHelpers.test.js
```

CR checklist:

- Link sharing remains the first path when `navigator.share` exists.
- The generated share card includes page title, description, language, theme, brand, and URL.
- The share card reads theme colors from CSS custom properties and uses literal color values only as canvas fallbacks.
- The share card helper does not depend on external network resources.

Commit:

```bash
git add project/src/utils/share/shareCard.js project/src/components/footer/AppFooter.vue project/tests/shareHelpers.test.js
git commit -m "feat: add branded page sharing"
```

---

### Task 8: Full Verification

**Files:**
- All files changed by Tasks 1-7.

- [ ] **Step 1: Run focused tests**

Run from `project/`:

```bash
npm test -- tests/suggestionsApi.test.js tests/tutorialGuideRequest.test.js tests/layoutFooterContext.test.js tests/layoutFooterMounting.test.js tests/layoutFeedbackModal.test.js tests/shareHelpers.test.js tests/pageTutorialGuideLayouts.test.js
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run from `project/`:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run from `project/`:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Inspect complete diff**

Run from repository root:

```bash
git diff HEAD
```

CR checklist:

- The only user-facing layout change is the approved footer.
- Existing navigation, sidebar, tutorial guide, and result panel behavior remain intact.
- Chinese and emoji text are not corrupted.
- No PowerShell or bulk rewrite was used on Chinese/emoji-heavy files.
- No width-based responsive media queries were added.
- Footer stats call existing shared composables only.
- Screenshot feedback sends optional `image_base64` only when the user opts in, and compression respects the backend 1 MB limit.

- [ ] **Step 5: Final commit if Task 8 changed files**

If verification required a fix, commit only those fix files:

```bash
git add <verified-fix-files>
git commit -m "fix: verify layout footer integration"
```

If Task 8 did not change files, do not create an empty commit.

---

## Self-Review

Spec coverage:

- Shared footer appears in `MenuLayout`, `ExploreLayout`, and `SimpleLayout`: Task 4.
- Stats share HomePage/sidebar caches: Task 4 uses `useVisitStats()` and `useSourceStats()`.
- Tutorial opens the current page guide: Task 2 and Task 4.
- Feedback uses backend suggestions API and route context: Task 1 and Task 5.
- Screenshot upload is opt-in, compressed, and uses the confirmed backend image field: Task 6.
- Share supports link first and branded image fallback: Task 7.
- Base share does not require Task 7; branded image sharing is explicitly phase 2.
- Language/theme identity, version, database stats, and ICP are displayed: Task 3 and Task 4.
- Responsive behavior uses aspect ratio, not width breakpoints: Tasks 4 and 8 CR checklist.
- Chinese and emoji safety is explicitly reviewed: every commit CR checklist.

Placeholder scan:

- This plan contains no banned placeholder markers or unspecified implementation steps.
- Each code-changing task includes the exact files, commands, and code blocks needed for implementation.

Type consistency:

- Backend image field is consistently named `image_base64`.
- Suggestions are consistently treated as site-wide feedback; logged-in identity is optional attribution, not a submission requirement.
- Tutorial request bridge is consistently named `tutorialGuideRequestState` and `requestCurrentTutorialGuideOpen`.
- Footer context helper is consistently named `resolveLayoutFooterContext`.
- Feedback component is consistently named `LayoutFeedbackModal`.
- Task 5 sends `image_base64: ''` until Task 6 wires the user-controlled screenshot checkbox and compressed capture helper.
