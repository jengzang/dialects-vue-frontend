# Font size token migration

The user approved fine-grained font size tokens and gradual migration, with navigation readability as the immediate visual correction.

## Design

- Define exact size primitives in the existing global token surface. Names express the equivalent CSS pixel size at the default 16px root, including fractional sizes; values use rem. Add semantic aliases for captions, body, labels, headings and navigation.
- Preserve existing sizes at the default root during migration. Keep relative em relationships and fluid viewport terms. Do not change the root font size, copy, layout, routing or business logic.
- Three bars share a bounded fluid font unit, with existing per-tab numeric configuration retained as a multiplier. Preserve the existing active/inactive multipliers. Give stacked mobile labels a readable minimum. Correct CommonBar icons to follow the corresponding desktop/mobile configuration.
- Migrate static font-size declarations in component style blocks and shared SCSS, including component font size custom properties. Retain inline styles, JS chart/Canvas numbers, export templates, and Sass values used in layout calculations until their consumers can be handled separately.

## Execution

- [x] Step 1: Add exact primitives and aliases, migrate shared styles, document usage. Validated both Sass entrypoints, 80 exact token values, 21 files with only font substitutions, and 14 focused tests. Reviewed staged and unstaged scope; the pre-existing sitemap change is excluded.
- [x] Step 2: Connect NavBar, ExploreBar and CommonBar to navigation tokens. Verified computed fonts in Chrome at ordinary desktop, large desktop, three portrait sizes, and enlarged root font; retained tab settings and mobile icon multiplier. Navigation unit tests passed (15 tests). Reviewed font-only changes and CommonBar's corrected desktop icon setting.
- [ ] Step 3: Migrate remaining static component styles without rounding. Verify that restoring token references to their former lengths reproduces the previous source outside approved bar changes; compile the production build and run the existing test suite. Update source-contract tests to resolve tokens while retaining their size assertions. Review and commit.

## Verification

Use existing dependencies only. No installs. Save a pre-migration source baseline for exact comparison. Validate UTF-8, unchanged non-style source, complete token references, original sizes at a 16px root, and retained dynamic/relative exceptions. Run Vite directly in web mode to avoid regenerating the user's modified sitemap. Do not include that sitemap in any commit.
