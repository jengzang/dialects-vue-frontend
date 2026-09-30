# Leaderboard Category Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every desktop leaderboard category's row-spanning summary area clear upper and lower boundaries.

**Architecture:** Keep the existing `rowspan` markup and table data untouched. Extend only the category summary cell styles so the current primary/ranking colour variants also colour their top and bottom borders; these cells span precisely one category's endpoint rows.

**Tech Stack:** Vue 3 SFC, scoped SCSS, existing CSS custom properties and local ranking colour variables.

---

### Task 1: Add desktop category summary boundaries

**Files:**
- Modify: `project/src/main/components/user/LeaderboardPanel.vue:1001-1082`
- Test: `project/package.json` build script

- [ ] **Step 1: Inspect the existing desktop category cell styles and baseline build command**

Run: `sed -n '996,1084p' project/src/main/components/user/LeaderboardPanel.vue && node -e "const p=require('./project/package.json'); console.log(p.scripts.build)"`

Expected: `category-cell` has only a right border; its gold, silver, and bronze variants override only that right-border colour.

- [ ] **Step 2: Add the minimal category-boundary declarations**

In the `.category-cell` rule, add a top and bottom border using the existing primary colour, then override both border colours in the gold, silver, and bronze variants. In `.category-data`, add the matching top and bottom primary borders, then override them in each existing ranking variant. Do not modify the template, `tableData`, mobile styles, or any text.

```scss
border-top: 2px solid rgba($primary, 0.3);
border-bottom: 2px solid rgba($primary, 0.3);
```

- [ ] **Step 3: Verify the change**

Run: `cd project && npm run build`

Expected: the production build completes successfully.

- [ ] **Step 4: Review the exact change and encoding safety**

Run: `git diff --check && git diff -- project/src/main/components/user/LeaderboardPanel.vue && git diff --numstat -- project/src/main/components/user/LeaderboardPanel.vue`

Expected: only the intended SCSS border declarations appear; no template/script/Chinese/emoji lines change and whitespace validation passes.

- [ ] **Step 5: Commit the implementation**

```bash
git add project/src/main/components/user/LeaderboardPanel.vue
git commit -m "style: separate leaderboard category groups"
```
