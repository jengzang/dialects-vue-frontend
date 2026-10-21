# Theme Colors Implementation Plan

> Execute inline, one reviewed and verified commit per task.

**Goal:** Apply the approved four-theme palette without merging tokens or changing application behavior.

**Architecture:** Keep the existing theme selectors and token names. Add only secondary foreground, RGB, subtle background and border roles. Keep chart/category/status colors separate from interface accents.

**Tech Stack:** Vue, SCSS custom properties, Vitest, existing Vite and Chromium dependencies.

## Approved design

| Theme | Primary | Secondary | Surface direction |
| --- | --- | --- | --- |
| Blue | #0070e8 | #6e00ff (Praat purple) | Pale blue day |
| Green | #86d99b | #d5a06f (copper) | Forest green night, #0c2416 / #173c26 |
| Light | #4b5563 (graphite) | #99663d (ochre) | Existing light backgrounds |
| Dark | #f0f6fc | #9fbce0 (mist blue) | Existing dark backgrounds |

Primary identifies main actions, focus and selection. Secondary is a limited interface accent for the existing decorative Praat title/progress/step markers and the table selection utility. Main actions use the existing action foreground/background pairing, including dark labels on bright green/white buttons. Preserve literal Chinese and emoji, layouts, routes, data colors, status meanings and all unrelated user edits.

## Task 1: Palette and roles

- [ ] Add `tests/themePaletteContrast.test.js`: read actual theme declarations, resolve aliases and alpha composites, check dark green surfaces, readable text/actions, secondary foreground on tinted surfaces, RGB consistency and VillagesML green text.
- [ ] Run `./node_modules/.bin/vitest run tests/themePaletteContrast.test.js`; verify expected failures before changing source.
- [ ] Update `src/styles/global/_tokens.scss`: lighten blue page; apply approved primary/secondary values; map all green surface/text/sidebar/interaction overrides to night colors; preserve legacy accent names as compatibility aliases.
- [ ] Update only corresponding primary mappings in `src/styles/villagesml/_tokens.scss`.
- [ ] Update intentionally changed blue/light palette expectations in `tests/colorThemeTokens.test.js`. Preserve assertions for unrelated pre-existing failures.
- [ ] Run contrast tests and existing theme/Praat tests. Baseline has three obsolete theme-style assertions and two obsolete Praat-path failures; do not restore removed structure.
- [ ] Inspect scoped and full diffs, UTF-8, independent CR; fix introduced issues, stage only task files, inspect index and commit.

## Task 2: Interface accent adoption

- [ ] Recheck worktree. Replace fixed blue-purple decorations in `src/main/views/explore/Praat.vue` and `src/main/components/praat/PitchTonePanel.vue` with primary/secondary roles. Use semantic action pairing for the start button and action pairing for filled step numbers. Leave chart palettes intact.
- [ ] Change `src/main/components/TableAndTree/UniversalTable.vue` selection utility foreground and hover background to secondary roles.
- [ ] Verify compiled SCSS and Vue build using existing Vite (`--outDir` in task artifact directory; avoid sitemap generation), inspect actual browser rendering for four theme/component combinations and narrow layout.
- [ ] Inspect scoped/full diffs and UTF-8; independent CR; stage only task files, inspect index and commit.

No dependency installation, structural refactors, token consolidation, or unrelated fixes.

## Task 1 verification and review

- Added four secondary roles, retaining all existing token names; legacy accent names forward to the secondary role.
- Extended the palette step to correct actual primary-filled label pairings and existing white-background exceptions for green night. These are color-only compatibility corrections required by the approved bright green primary. No component extraction or behavior changes.
- Independent CR found fixed-white primary labels, dark close-button foreground and dark-only white-surface exceptions. Corrected these, including RegionSelector's confirmation action; preserved its ghost variant.
- Contrast suite: 17 passed, including compiled SCSS consumers in all four themes. Praat tabs: 5 passed. Existing theme/risk suites retain their five baseline failures (obsolete switch/sidebar assertions and old Praat paths).
- Vite web production build succeeded. Existing bundle-size and globe.gl browser-externalization warnings remain.
