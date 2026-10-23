# Toponyms search layout implementation plan

**Goal:** Match vocabulary's expanded search entrance, compact glass controls, animations and two-gesture return to expanded search, while retaining the toponym-specific filters and all existing APIs.

**Architecture:** Reuse `QuerySearchEntrance` only as the interaction shell. Its `intro`, `controls` and default slots receive the toponym title, `ToponymSearchBar`, and map/results respectively. Keep the default slot mounted and hide the workspace with `v-show` so map settings survive expansion and remain accessible before search. Reserve the shell's submitted-result scroll space during collapse; release it through a page-scoped override when re-expanding. Do not change the shared shell or vocabulary. Keep the existing toponym components and module boundaries.

**Tech stack:** Vue 3, scoped SCSS, shared glass classes/tokens, Vitest.

## Implementation and review boundary

- [x] Add an integration test for initial expanded search, valid submission, empty input, and route-driven submission. Run it before implementation to confirm the missing entrance behavior.
- [x] Replace the nested page/search shells with `QuerySearchEntrance`. Use the same progress-driven result visibility as vocabulary. Collapse on valid submission, including searches hydrated from route parameters. Preserve empty-input feedback without collapsing.
- [x] Let `ToponymSearchBar` accept the shell's expanded state. Keep its own keyword, match selector, submit and settings actions. Grow the input with `--query-input-growth`; use grid placement and aspect-ratio portrait rules so compact controls fit without horizontal overflow.
- [x] Keep map/results in the default slot. Reduce nested panel surfaces, retain a generous map area, and stack the inspector beneath it in portrait. Reuse shared glass primitives and existing theme tokens.
- [x] Run the page integration tests, existing toponym tests, shared entrance gesture/animation tests, focused lint and a direct Vite production build (no dependency installation or sitemap generation).
- [x] Inspect both staged and unstaged diffs for scope, existing behavior, Chinese/emoji integrity and styling. Commit only this plan, the page, its search bar/results layout, and the integration test after review.

## Acceptance criteria

- Before submission: centered title and large keyword input; map/results hidden.
- After a valid submission: compact glass search controls above the map; loading, empty-result and error states remain available in the workspace.
- Returning upward uses the shared shell's existing boundary stop and second independent gesture; wheel, touch, keyboard, reduced motion, navigation clearance and event cleanup remain centralized.
- Re-expanding hides results in the same way as vocabulary. The query and loaded point/name-tree state remain in the page.
- No API, query parameter, i18n, shared component, or unrelated page changes.

## Verification and review results

- 62 tests passed across all toponym suites and the three shared entrance suites, including initial search, route hydration, empty input, two upward gestures, preserved map configuration, and hidden detail cards after expansion.
- Focused ESLint passed with zero warnings. Direct Vite production build passed; existing chunk-size warnings remain.
- Browser checks: 1440×900 desktop, 390×844 portrait, and 844×390 landscape; no horizontal overflow. Portrait search collapsed above the map; two independent upward gestures restored the expanded entrance. Computed result minimum height returned to zero after expansion.
- Code review found and resolved lingering detail cards and retained empty result space on expansion. Final review found no remaining actionable issues.
- Existing Chinese strings and literal emoji were preserved; no API, locale, route, or shared component source changed.
- Live point data could not be verified because the site currently returns the existing development-disabled message. The map and error states rendered correctly.
- An additional vocabulary regression run had two failures in request deduplication and administrative filter timing. Those files were being modified independently during this task and are excluded from this commit; the toponym and shared entrance suites passed.
