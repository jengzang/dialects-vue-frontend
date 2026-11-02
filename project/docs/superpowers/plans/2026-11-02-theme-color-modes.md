# Six theme combinations implementation plan

Goal: offer blue/red/green with independent light/dark selection, preserving existing blue light, red light and green dark palettes and existing image files.

Architecture: retain the existing stored theme IDs (`blue`, `light`, `green`, `dark`) for compatibility; add `red-dark` and `green-light`. Derive family and brightness from one ID, exposing `data-color-family` and `data-color-mode` for shared rules. Keep implementation in existing modules.

1. Add preference behavior tests for all six combinations, family/mode switching, reload, legacy IDs, favicon MIME type and existing brand asset paths. Run failing tests, implement helpers in uiPreferences.js, review diff, verify, commit.
2. Add computed SCSS palette tests for six modes and footer contrast. Reuse the current dark palette for blue/red dark with themed deep glass fills; add green light. Update all brightness-dependent selectors and consumers, VillagesML colors and existing palette tests. Reuse backgrounds/blue artwork with live filters, preserving existing compositions. Review diff, verify, commit.
3. Split settings into color and brightness controls; add localized mode labels and six footer labels. Test actual settings interactions and share asset selection. Run focused tests, full suite and existing Vite build without sitemap regeneration. Check Chinese/emoji integrity and unchanged brand/background assets, review scope and commit.

Brand mapping: blue/light/green/dark retain their existing files; red-dark reuses the current dark assets; green-light uses favicon_green.ico, GreenCircle.webp and title.webp. No new image files.

Verification: npm test -- tests/uiPreferences.test.js; npm test -- tests/colorThemeTokens.test.js tests/themePaletteContrast.test.js; npm test; ./node_modules/.bin/vite build. Compare unrelated pre-existing failures against HEAD before deciding whether they belong to this task.
