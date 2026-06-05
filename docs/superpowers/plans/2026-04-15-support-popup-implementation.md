# Support Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the homepage donation popup to `SupportPopup`, reuse it from all three entry points, and scaffold the donor roster inside the shared popup with a local static array.

**Architecture:** Keep the current homepage popup as the canonical implementation, rename the file, and replace the two inline `AppModal` implementations with direct uses of the shared component. Verify the refactor with a source-level regression test that checks file existence, imports, and donor-roster scaffolding.

**Tech Stack:** Vue 3 SFCs, Vitest, Vite, vue-i18n

---

### Task 1: Lock the refactor with a failing regression test

**Files:**
- Create: `project/tests/supportPopupUnification.test.js`
- Test: `project/tests/supportPopupUnification.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

const supportPopupPath = resolve(projectRoot, 'src/main/components/popup/SupportPopup.vue')
const homeSupportPopupPath = resolve(projectRoot, 'src/main/components/popup/HomeSupportPopup.vue')
const homePagePath = resolve(projectRoot, 'src/main/views/HomePage.vue')
const likeAuthorPath = resolve(projectRoot, 'src/main/views/intro/LikeAuthor.vue')
const aboutPagePath = resolve(projectRoot, 'src/main/views/menu/support/AboutPage.vue')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

describe('support popup unification', () => {
  it('renames the homepage popup component to SupportPopup', () => {
    expect(existsSync(supportPopupPath)).toBe(true)
    expect(existsSync(homeSupportPopupPath)).toBe(false)
  })

  it('keeps the shared popup content and donor list scaffolding in SupportPopup', () => {
    const source = readSource(supportPopupPath)

    expect(source).toContain("t('home.supportModal.title')")
    expect(source).toContain("t('home.supportModal.subtitle')")
    expect(source).toContain("t('home.supportModal.weixinLabel')")
    expect(source).toContain("t('home.supportModal.alipayLabel')")
    expect(source).toContain('const donors = [')
  })

  it('updates the homepage to import the renamed SupportPopup component', () => {
    const source = readSource(homePagePath)

    expect(source).toContain("import('@/main/components/popup/SupportPopup.vue')")
    expect(source).not.toContain("import('@/main/components/popup/HomeSupportPopup.vue')")
    expect(source).toContain('<SupportPopup')
  })

  it('replaces the inline LikeAuthor modal with the shared SupportPopup component', () => {
    const source = readSource(likeAuthorPath)

    expect(source).toContain("import SupportPopup from '@/main/components/popup/SupportPopup.vue'")
    expect(source).toContain('<SupportPopup')
    expect(source).not.toContain('<AppModal')
  })

  it('replaces the inline AboutPage modal with the shared SupportPopup component', () => {
    const source = readSource(aboutPagePath)

    expect(source).toContain("import SupportPopup from '@/main/components/popup/SupportPopup.vue'")
    expect(source).toContain('<SupportPopup')
    expect(source).not.toContain('<AppModal')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- supportPopupUnification.test.js`
Expected: FAIL because `SupportPopup.vue` does not exist yet and the two views still contain inline `AppModal` markup.

- [ ] **Step 3: Write minimal implementation**

```js
// 1. Rename HomeSupportPopup.vue -> SupportPopup.vue
// 2. Update HomePage.vue async import and component tag
// 3. Replace LikeAuthor.vue inline modal with <SupportPopup :visible="showQRCodes" @close="showQRCodes = false" />
// 4. Replace AboutPage.vue inline modal with <SupportPopup :visible="showQRCodes" @close="showQRCodes = false" />
// 5. Add const donors = [] inside SupportPopup.vue and render the roster section only when donors.length > 0
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- supportPopupUnification.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add project/tests/supportPopupUnification.test.js project/src/main/components/popup/SupportPopup.vue project/src/main/views/HomePage.vue project/src/main/views/intro/LikeAuthor.vue project/src/main/views/menu/support/AboutPage.vue
git commit -m "feat: unify support popup"
```

### Task 2: Run broader verification for the touched surface

**Files:**
- Test: `project/tests/supportPopupUnification.test.js`
- Test: `project/tests/eslintSrcQuiet.test.js`

- [ ] **Step 1: Run the targeted regression test again**

Run: `npm test -- supportPopupUnification.test.js`
Expected: PASS

- [ ] **Step 2: Run the existing lightweight source-level regression suite**

Run: `npm test -- eslintSrcQuiet.test.js`
Expected: PASS

- [ ] **Step 3: Review the diff**

```bash
git diff
git diff --cached
```

- [ ] **Step 4: Confirm scope before reporting**

Check that only these changes landed:

- renamed shared popup component
- two view call-site replacements
- donor list scaffolding inside shared popup
- the new regression test
