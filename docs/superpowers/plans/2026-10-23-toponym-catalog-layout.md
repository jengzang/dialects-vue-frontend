# Toponym catalog search layout

**Goal:** Apply the approved distribution-page search layout to the catalog search page, retaining its own filters, requests, result selection, detail lookup, and distribution navigation.

**Architecture:** Keep all markup and business state in `ToponymSearchPage.vue`. Reuse the unchanged `QuerySearchEntrance` through intro, controls, and default slots. Preserve results with `v-show`, reserve scroll space while collapsing, and release it while expanded just as the distribution page does. Reset remounts only this entrance to reset its internal gesture/submission state, then scrolls back respecting reduced motion.

**Layout:** Center the existing title and large keyword input initially. Retain all six fields and both actions. Use a three-column filter grid in landscape and a two-column grid in portrait, with the keyword spanning the full row when expanded. Compact mode places search/reset beside the keyword in landscape; portrait retains the full keyword row. Results and details are side by side in landscape and stacked in portrait. Use shared surfaces, buttons, fields and theme tokens; remove the outer nested glass shell.

## Execution

- [x] Add integration coverage for initial state, full filter submission, empty validation, second upward gesture, persisted results/details, and reset. Run before implementation.
- [x] Apply the interaction shell and responsive layout to the existing page without extracting components or changing APIs/text/routes.
- [x] Update only outdated shell assertions in existing toponym tests. Run all toponym suites and shared entrance suites, focused lint and direct production Vite build.
- [x] Inspect desktop, portrait and short landscape layouts and verify first collapse/return/reset.
- [x] Perform code review, inspect staged and unstaged changes, verify original non-ASCII content, and commit only this page, its integration test, updated shell tests and this plan.

## Verification and review

- 67 tests passed across all toponym and shared entrance suites. New integration tests cover initial filters, complete request parameters, result/detail/distribution actions, empty-input validation, second upward gesture, retained selection/details and reset.
- Focused ESLint passed with zero warnings. Production build completed successfully with existing chunk-size warnings.
- Browser checked 1440×900 desktop, 390×844 portrait and 844×390 landscape: no horizontal overflow, first submission reached compact mode, portrait results remained reachable below the six filters, two upward gestures re-expanded search, and reset returned to the empty expanded entrance.
- Read-only code review found no actionable issues. APIs, labels, route targets and shared component sources remain unchanged; original non-ASCII content is intact.
- The existing development guard prevents live data queries. Error rendering was checked in-browser; successful result and detail behavior was verified in integration tests.
