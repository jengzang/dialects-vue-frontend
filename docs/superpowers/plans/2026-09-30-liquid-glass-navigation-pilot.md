# Liquid Glass Navigation Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved B2 floating Liquid Glass treatment to NavBar and make the desktop SimpleSidebar a matching floating panel without changing navigation content or behavior.

**Architecture:** NavBar owns one passive, animation-frame-batched scroll bridge that writes a cosmetic CSS variable directly to its root element. Sidebar geometry remains in the shared main toolbar stylesheet, while the component's scoped style preserves the desktop overlay and transition geometry; portrait overrides restore the existing edge drawer.

**Tech Stack:** Vue 3 `<script setup>`, scoped SCSS, shared main SCSS, existing CSS tokens, Vite.

---

### Task 1: Prove the visual hooks are absent

**Files:**

- Test: `project/src/components/bar/NavBar.vue`, `project/src/components/bar/SimpleSidebar.vue`, `project/src/styles/main/_toolbars.scss`

- [ ] **Step 1: Run the focused source-contract assertion before implementation**

```bash
cd project
node -e 'const fs=require("node:fs"); const files=["src/components/bar/NavBar.vue","src/components/bar/SimpleSidebar.vue","src/styles/main/_toolbars.scss"].map((p)=>fs.readFileSync(p,"utf8")).join("\\n"); const expected=["liquidGlassScrollFrame","--liquid-glass-glint-shift","calc(100dvh - 24px)"]; const missing=expected.filter((value)=>!files.includes(value)); if (missing.length) throw new Error(`Missing Liquid Glass hooks: ${missing.join(", ")}`);'
```

Expected: fail because the approved hooks are absent.

### Task 2: Implement NavBar B2 without changing navigation content

**Files:**

- Modify: `project/src/components/bar/NavBar.vue:1, 205-340, 347-410`

- [ ] **Step 1: Add the isolated scroll-to-CSS-variable bridge**

```js
const navbarRef = ref(null)
let liquidGlassScrollFrame = null

const updateLiquidGlassGlint = () => {
  liquidGlassScrollFrame = null
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
  const progress = Math.min(window.scrollY / maxScroll, 1)
  navbarRef.value?.style.setProperty('--liquid-glass-glint-shift', `${20 + progress * 60}%`)
}
```

- [ ] **Step 2: Convert only the outer `.navbar` shell to the B2 inset surface**

Bind the root ref. Keep all desktop/mobile child markup unchanged. Use 12px/16px desktop insets, 8px portrait insets with `env(safe-area-inset-top)`, token-based fill/border/shadow, a moving background highlight, and a `prefers-contrast: more` fallback.

- [ ] **Step 3: Run the Task 1 assertion**

Expected: pass.

### Task 3: Implement the desktop floating SimpleSidebar shell

**Files:**

- Modify: `project/src/styles/main/_toolbars.scss:2-35, 175-194`
- Modify: `project/src/components/bar/SimpleSidebar.vue:482-493, 910-970`

- [ ] **Step 1: Change desktop shared shell geometry only**

Keep existing sidebar tokens and content rules. Add box sizing, a 12px desktop inset, `height: calc(100dvh - 24px)`, rounded corners, and stronger existing blur. In the portrait media block, restore `top: 0`, `left: 0`, `height: 100dvh`, and no left-side radius.

- [ ] **Step 2: Align the component-scoped overlay and transition**

Change only the desktop overlay start position and width so it begins at the floating panel's right edge. Set the desktop transition to clear the 12px gutter when hidden, then restore the existing overlay and `translateX(-100%)` behavior in a portrait aspect-ratio override. Do not modify the user-owned `.stat-value { font-size: 17px; }` line.

- [ ] **Step 3: Run the Task 1 assertion**

Expected: pass.

### Task 4: Verify and commit only the approved files

**Files:**

- Modify: `project/src/components/bar/NavBar.vue`
- Modify: `project/src/components/bar/SimpleSidebar.vue`
- Modify: `project/src/styles/main/_toolbars.scss`

- [ ] **Step 1: Run focused lint and production build**

```bash
cd project
npx eslint src/components/bar/NavBar.vue src/components/bar/SimpleSidebar.vue
npx vite build
```

Expected: no ESLint errors and successful Vite build. Existing project warnings must be listed separately.

- [ ] **Step 2: Review scope and encoding safety**

```bash
git diff --check
git diff -- project/src/components/bar/NavBar.vue project/src/components/bar/SimpleSidebar.vue project/src/styles/main/_toolbars.scss
git diff --numstat -- project/src/components/bar/SimpleSidebar.vue
```

Expected: no whitespace failure, no Chinese or emoji changes, the existing 17px user change remains uncommitted, and no unrelated file appears in the implementation diff.

- [ ] **Step 3: Commit the implementation with an explicit path scope**

```bash
git add project/src/components/bar/NavBar.vue project/src/components/bar/SimpleSidebar.vue project/src/styles/main/_toolbars.scss
git commit --only -m "style: add liquid glass navigation pilot" -- project/src/components/bar/NavBar.vue project/src/components/bar/SimpleSidebar.vue project/src/styles/main/_toolbars.scss
```

Expected: only the three approved implementation files are committed; pre-staged app-modal documentation remains out of the commit.
