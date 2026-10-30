# Font size token migration

The user's updated requirement supersedes the initial fine-grained scale: retain exactly eight global font size tokens (12, 14, 16, 18, 20, 24, 32, 48). Round existing static font sizes to the nearest tier, choosing the larger tier on ties. Only font-size declarations and their configuration references may change; padding, margin, dimensions and other layout values must remain unchanged.

- [x] Establish shared tokens and migrate shared styles (78d0dba1). The initial precise scale is superseded by the eight-tier requirement below.
- [x] Connect three bars to bounded viewport font scaling and fix undersized portrait labels (defd62c4). Retain tab multipliers and CommonBar's mobile icon ratio. Chrome checks cover normal desktop, 4K, three portrait viewports, active state, icon settings and enlarged root fonts.
- [x] Consolidate to eight tokens and migrate static component styles. Removed extra aliases and rounded font sizes only. Snapshot verification covers 237 migrated files and confirms unchanged non-font source, including layout and Chinese/emoji. Independent review found no defects. Web production build and Chrome navigation checks passed.

Keep relative em rules and dynamic chart/export/Sass exceptions. For interpolation expressions, round endpoint text sizes rather than treating an offset as an independent font size. No dependency installation, no unrelated refactors, and no sitemap changes in commits.

Verification: 162 test files completed with 1146 passing tests and 10 failures matching the pre-migration baseline exactly. A separate theme palette run passed all 26 tests. The regionInputResolution test did not finish during baseline execution (Node heap exhaustion), so it was excluded from the final suite run. No unrelated test failures were fixed. Concurrent copy/SEO commit d479dcbb and the pre-existing sitemap modification are outside this change.
