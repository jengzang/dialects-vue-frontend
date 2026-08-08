# Tabular Import Preview Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a reusable tabular import preview and column-mapping workbench for xlsx/xls/csv-style inputs that fits the existing project UI language and can be reused across multiple import tools.

**Architecture:** Introduce a shared import-preview layer composed of one orchestration component, several small display components, two focused composables, and pure import utilities. Reuse the existing glass-shell, selector, loading, scrollbar, i18n, and button systems rather than introducing a third-party viewer or a new visual language. Keep v1 strictly focused on preview, sheet/header selection, column mapping, and validation; explicitly defer spreadsheet-style editing.

**Tech Stack:** Vue 3 `script setup`, existing `xlsx` dependency, Vue I18n locale JSON files, scoped SCSS, current shared selector/loading/scroll/button/surface styles.

---

## 1. Background and Current-State Findings

This repository already contains several import-oriented tools and already ships most of the UI primitives needed for a shared pre-import workbench.

### 1.1 Existing file-import surfaces

Confirmed upload entry points:

- `project/src/main/views/explore/tools/MergeTool.vue`
  - Reference-file upload accepts `.xlsx,.xls`
  - Merge-files upload accepts `.xlsx,.xls` and `multiple`
  - Existing structure is a three-step workbench
- `project/src/main/views/explore/tools/CheckTool.vue`
  - Upload accepts `.xlsx,.xls,.doc,.docx,.tsv`
  - Existing page is a heavy work area with sidebar, scroll areas, and validation state
- `project/src/main/views/explore/tools/Jyut2IpaTool.vue`
  - Upload accepts `.xlsx,.xls`
  - Existing page is a linear upload/config/process/result workbench

### 1.2 Existing shared technical assets

Confirmed reusable assets:

- Excel parsing dependency already exists
  - `project/package.json` includes `xlsx`
- Shared loading styles already exist
  - `project/src/styles/global/_loading.scss`
  - `.ui-loading--page`, `.ui-loading--inline`, `.ui-loading--hourglass`
- Shared scrollbar system already exists
  - `project/src/styles/global/_scrollbars.scss`
  - `.ui-scrollbar` and dropdown/table/content wrappers are already standardized
- Shared button system already exists
  - `project/src/styles/main/_buttons.scss`
  - `.main-glass-button` with `data-variant` and `data-size`
- Shared shell/panel surfaces already exist
  - `project/src/styles/main/_surfaces.scss`
  - `.main-glass-panel`, `.main-glass-panel-inner`, `.main-glass-shell`, `.glass-container-shell`
- Shared selector components already exist
  - `project/src/components/selector/SimpleSelectDropdown.vue`
  - `project/src/components/selector/SimpleDropdown.vue`
  - `project/src/components/selector/CheckBox.vue`
  - `project/src/components/selector/RadioGroup.vue`
- Shared i18n layout already exists
  - locale files are organized under:
    - `project/src/i18n/locales/zh-Hant/*.json`
    - `project/src/i18n/locales/zh-CN/*.json`
    - `project/src/i18n/locales/en/*.json`

### 1.3 Current visual language for tool/workbench pages

The current import-capable tools do **not** use a bare admin style and do **not** look like generic document viewers. They use a consistent project language:

- title + subtitle page header
- glass shell container
- card-like upload zones
- unified loading spinners
- internally scrolling preview/result areas
- lightweight but polished selector and button patterns
- portal/workbench feeling instead of raw spreadsheet UI

This is the style the shared component must inherit.

---

## 2. Core Decisions

### 2.1 Do not directly reuse `flyfish-dev/file-viewer`

Decision: **do not adopt it as the core implementation**.

Reasoning:

- The primary need is not general file viewing; it is import-time schema alignment.
- The repository already has `xlsx`, so tabular preview can be built without adding a large external dependency.
- The project already has strong visual conventions; a generic viewer would still need a heavy wrapper and style adaptation.
- The future value lies in:
  - required-column schemas
  - auto/manual column mapping
  - validation state
  - confirm payload contracts
  - multi-page reuse

The viewer problem is secondary; the workbench problem is primary.

### 2.2 Build a shared “tabular import preflight layer”

Decision: create a reusable shared layer that sits **before** each page’s real business logic.

That layer should handle:

- file parsing
- sheet selection
- header-row selection
- source-column preview
- required/optional target schema
- auto-match suggestions
- manual mapping
- validation summary
- final normalized mapping payload

The parent page should continue to own actual business execution.

### 2.3 Keep v1 intentionally narrow

Decision: v1 supports preview + mapping only.

V1 includes:

- xlsx / xls / csv parsing
- multi-sheet handling
- configurable header row
- preview rows
- required/optional target schema
- auto-matching
- manual mapping
- missing/duplicate validation
- confirm payload

V1 explicitly excludes:

- cell editing
- row editing
- batch rewrite
- spreadsheet-editor behavior
- arbitrary non-tabular doc/docx preview

### 2.4 The component is shared infrastructure, not a page-specific widget

Decision: place it under shared `src/components`, not inside one tool page.

Because this will likely be reused by:

- `MergeTool`
- `Jyut2IpaTool`
- the tabular path in `CheckTool`
- future import tools

it should be built as common infrastructure from the start.

---

## 3. Proposed File Structure

### 3.1 New shared components

Create:

- `project/src/components/import/TabularImportPreview.vue`
- `project/src/components/import/ImportFileSummary.vue`
- `project/src/components/import/ColumnMappingPanel.vue`
- `project/src/components/import/SourceTablePreview.vue`
- `project/src/components/import/ImportValidationSummary.vue`

### 3.2 New shared composables

Create:

- `project/src/composables/useTabularFilePreview.js`
- `project/src/composables/useColumnMapping.js`

### 3.3 New shared import utilities

Create:

- `project/src/utils/import/tabularParse.js`
- `project/src/utils/import/columnNormalize.js`
- `project/src/utils/import/columnMatch.js`

### 3.4 Optional shared schema helpers

Optional if several pages begin sharing schema definitions:

- `project/src/constants/importSchemas.js`

### 3.5 Likely first integration target

Modify first:

- `project/src/main/views/explore/tools/MergeTool.vue`

Likely later:

- `project/src/main/views/explore/tools/Jyut2IpaTool.vue`
- `project/src/main/views/explore/tools/CheckTool.vue`

### 3.6 I18n files to extend

Recommended first choice: add common shared import-preview strings under all three locale sets in `common.json`:

- `project/src/i18n/locales/zh-Hant/common.json`
- `project/src/i18n/locales/zh-CN/common.json`
- `project/src/i18n/locales/en/common.json`

Rationale: this is shared infrastructure, not a one-page-only feature.

---

## 4. Parent/Child Responsibility Boundaries

### 4.1 Parent page responsibilities

Each business page should remain responsible for:

- deciding when the import-preview layer appears
- defining the required/optional target schema
- deciding whether a confirmed mapping is sufficient to continue
- converting the normalized mapping payload into business-specific data
- performing the actual merge/check/convert/import action

The parent page should **not** push parsing/mapping details into its own large local script if the shared component can own them.

### 4.2 Shared import-preview responsibilities

The shared layer should own:

- tabular file parsing
- active sheet state
- header-row-derived source columns
- preview rows
- auto-match suggestions
- manual mapping state
- validation summary state
- normalized confirm payload

### 4.3 Explicit non-goals for the shared layer

The shared layer should not own:

- final backend requests
- page-specific transformation rules beyond generic mapping
- post-import result rendering
- spreadsheet editing
- non-tabular document rendering

---

## 5. Main Component Contracts

## 5.1 `TabularImportPreview.vue`

Role: orchestration container

### Props

```js
{
  file: File | null,
  requiredColumns: Array,
  optionalColumns: {
    type: Array,
    default: () => []
  },
  acceptedFormats: {
    type: Array,
    default: () => ['xlsx', 'xls', 'csv']
  },
  previewRowCount: {
    type: Number,
    default: 8
  },
  initialHeaderRowIndex: {
    type: Number,
    default: 0
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: ''
  },
  allowSheetSelect: {
    type: Boolean,
    default: true
  },
  allowHeaderRowAdjust: {
    type: Boolean,
    default: true
  },
  autoMatchOnLoad: {
    type: Boolean,
    default: true
  },
  compact: {
    type: Boolean,
    default: false
  }
}
```

### Emits

- `parsed`
- `mapping-change`
- `confirm`
- `reset`
- `error`

### Confirm payload

```js
{
  fileMeta: {
    name: string,
    size: number,
    extension: string,
    sheetCount: number
  },
  activeSheet: {
    id: string,
    name: string,
    index: number,
    rowCount: number,
    columnCount: number
  },
  headerRowIndex: number,
  sourceColumns: [
    {
      id: string,
      index: number,
      excelColumn: string,
      rawName: string,
      normalizedName: string,
      fallbackLabel: string
    }
  ],
  mapping: {
    [targetKey]: {
      sourceColumnId: string,
      sourceName: string
    } | null
  },
  missingRequired: string[],
  duplicateSources: string[],
  unresolvedTargets: string[],
  isComplete: boolean
}
```

Important: mapping should preserve `sourceColumnId`, not only `sourceName`, because duplicate source names are possible.

## 5.2 `ImportFileSummary.vue`

Role: top summary band

### Responsibilities

- file metadata display
- active sheet control
- header-row control
- row/column counts
- reset/reparse affordances

### Suggested props

- `fileMeta`
- `activeSheet`
- `headerRowIndex`
- `sheetOptions`
- `allowSheetSelect`
- `allowHeaderRowAdjust`
- `parsing`
- `parseError`

### Emits

- `update:activeSheet`
- `update:headerRowIndex`
- `reset`

## 5.3 `ColumnMappingPanel.vue`

Role: target-schema mapping panel

### Responsibilities

- display required and optional target fields
- show current match state
- allow manual source-column selection
- optionally filter to unresolved targets

### Suggested props

- `requiredColumns`
- `optionalColumns`
- `sourceColumns`
- `mapping`
- `matchMeta`
- `missingRequired`
- `duplicateSources`
- `unresolvedTargets`
- `disabled`

### Emits

- `update:mapping`
- `auto-match`
- `reset-mapping`
- `focus-target`

## 5.4 `SourceTablePreview.vue`

Role: source data preview panel

### Responsibilities

- show the source header row
- show N preview rows
- visually indicate mapped columns
- optionally allow click-to-bind when a target field is focused

### Suggested props

- `columns`
- `previewRows`
- `activeTargetKey`
- `highlightedSourceColumnId`
- `mappedSourceColumnIds`
- `loading`

### Emits

- `pick-source-column`
- `hover-source-column`

## 5.5 `ImportValidationSummary.vue`

Role: bottom validation and action area

### Responsibilities

- show missing required fields
- show duplicate-source warnings
- show readiness state and completion ratio
- expose final confirm/reset/auto-match actions

### Suggested props

- `missingRequired`
- `duplicateSources`
- `unresolvedTargets`
- `completionRatio`
- `isComplete`
- `confirmText`
- `loading`

### Emits

- `confirm`
- `auto-match`
- `reset`

---

## 6. Composable Design

## 6.1 `useTabularFilePreview.js`

Purpose: parsing and preview state only

### Input

- file
- previewRowCount
- initialHeaderRowIndex

### Return shape

- `isParsing`
- `parseError`
- `workbookMeta`
- `sheets`
- `activeSheetIndex`
- `activeSheetName`
- `headerRowIndex`
- `sourceColumns`
- `previewRows`
- `totalRowCount`
- `totalColumnCount`

### Methods

- `parseFile(file)`
- `setActiveSheet(indexOrName)`
- `setHeaderRowIndex(index)`
- `rebuildPreview()`
- `resetPreview()`

### Data shapes

`workbookMeta`:

```js
{
  fileName: string,
  fileSize: number,
  extension: string,
  sheetCount: number
}
```

`sheet`:

```js
{
  id: 'sheet-0',
  name: 'Sheet1',
  index: 0,
  rowCount: 120,
  columnCount: 8,
  rows: Array
}
```

`sourceColumns`:

```js
[
  {
    id: 'col-0',
    index: 0,
    excelColumn: 'A',
    rawName: '地點',
    normalizedName: '地点',
    fallbackLabel: 'A'
  }
]
```

`previewRows`:

```js
[
  {
    __rowIndex: 2,
    cells: [
      { columnId: 'col-0', value: '广州' },
      { columnId: 'col-1', value: 'faːn' }
    ]
  }
]
```

### Utility split

`tabularParse.js` should own pure functions like:

- `parseXlsxFile(file)`
- `parseCsvFile(file)`
- `extractSheetRows(...)`
- `inferExtension(fileName)`
- `excelColumnName(index)`

## 6.2 `useColumnMapping.js`

Purpose: mapping state and validation only

### Input

- requiredColumns
- optionalColumns
- sourceColumns
- autoMatchOnLoad

### Return shape

- `mapping`
- `matchMeta`
- `missingRequired`
- `duplicateSources`
- `unresolvedTargets`
- `completionRatio`
- `isComplete`

### Methods

- `setMapping(targetKey, sourceColumnId | null)`
- `applyAutoMatch()`
- `resetMapping()`
- `getMappedSource(targetKey)`
- `getTargetStatus(targetKey)`

### Match metadata shape

```js
{
  location: {
    matchedBy: 'exact' | 'alias' | 'normalized' | 'manual' | null,
    confidence: 'high' | 'medium' | 'low' | null,
    candidateColumnIds: ['col-0', 'col-2']
  }
}
```

### Suggested target statuses

- `matched`
- `unresolved`
- `duplicate`
- `optional-empty`

---

## 7. Schema Contract for Parent Pages

Each business page should pass a target schema instead of hard-coding import assumptions inside a monolithic page component.

### Required/optional column item shape

```js
{
  key: 'ipa',
  label: 'IPA',
  required: true,
  aliases: ['音标', '國際音標'],
  description: 'International Phonetic Alphabet column',
  example: 'faːn'
}
```

### Notes

- `key` is the stable internal business field
- `label` is the user-facing target label
- `aliases` supports auto-match
- `description` and `example` help the user confirm meaning
- `required` determines completion gating

Different pages can pass different schemas without forking the shared workbench.

---

## 8. Auto-Match Strategy

V1 should be deliberately conservative.

### Matching order

1. exact raw-name match to target label
2. exact raw-name match to alias
3. normalized raw-name match to normalized label
4. normalized raw-name match to normalized alias
5. weak contains/partial relation as suggestion only, not auto-confirmed

### Normalize rules for `columnNormalize.js`

- trim
- remove BOM
- collapse line breaks and repeated whitespace
- lowercase
- normalize full-width vs half-width characters where practical
- normalize Chinese/English parentheses
- weaken spaces / underscores / hyphens
- optionally normalize simplified/traditional when safe

### Important constraints

- do not introduce heavy fuzzy scoring in v1
- do not silently auto-confirm low-confidence matches
- do not overwrite manual selections after the user has intervened

---

## 9. UI and Style Design Principles

The shared component must match the current repository’s tool/workbench design.

## 9.1 What it should feel like

It should feel like:

- a polished import workbench
- in the same family as `MergeTool` and `Jyut2IpaTool`
- glass-shell + panel-based + guided workflow
- practical and compact rather than decorative

It should **not** feel like:

- a generic third-party document viewer
- an IDE file browser
- a spreadsheet application clone
- a new standalone visual system unrelated to the rest of the project

## 9.2 Layout recommendation

Desktop:

- top summary band
- middle two-column workspace
  - left: column mapping panel
  - right: source preview table
- bottom validation/action band

Recommended desktop proportions:

- left panel: `minmax(340px, 420px)`
- right panel: remaining width
- panels use controlled heights with internal scrolling

Mobile:

- summary
- mapping
- preview
- validation/actions

Stack vertically with no new interaction model.

## 9.3 Shared classes/components to reuse directly

Reuse directly wherever possible:

- `.glass-container-shell`
- `.main-glass-panel`
- `.main-glass-panel-inner`
- `.main-glass-button`
- `.ui-scrollbar`
- `.ui-loading--page`
- `.ui-loading--inline`
- `.u-nowrap`
- `.u-ellipsis`
- `SimpleSelectDropdown`
- `CheckBox`

## 9.4 Local scoped classes to add

Suggested local classes only:

- `.tabular-import-preview`
- `.import-workspace`
- `.mapping-panel`
- `.preview-panel`
- `.validation-panel`
- `.mapping-row`
- `.mapping-row--required`
- `.mapping-row--duplicate`
- `.mapping-row--unresolved`
- `.source-header-cell`
- `.source-header-cell--mapped`
- `.source-header-cell--active`

### Style constraints

- prefer scoped SCSS in the new components
- do not introduce a parallel global style layer for this feature
- do not copy large page-local style blocks from existing tools if a shared shell/button/panel class already exists
- do not rely on inline styles except for truly dynamic dimensions where existing patterns require it

---

## 10. I18n Plan

Recommended namespace: `common.importPreview.*`

### Suggested keys

- `common.importPreview.title`
- `common.importPreview.description`

- `common.importPreview.summary.fileName`
- `common.importPreview.summary.fileSize`
- `common.importPreview.summary.sheet`
- `common.importPreview.summary.sheetCount`
- `common.importPreview.summary.rowCount`
- `common.importPreview.summary.columnCount`
- `common.importPreview.summary.headerRow`

- `common.importPreview.mapping.title`
- `common.importPreview.mapping.required`
- `common.importPreview.mapping.optional`
- `common.importPreview.mapping.unmatched`
- `common.importPreview.mapping.matched`
- `common.importPreview.mapping.duplicate`
- `common.importPreview.mapping.autoMatched`
- `common.importPreview.mapping.manualMatched`
- `common.importPreview.mapping.showOnlyUnmatched`
- `common.importPreview.mapping.sourceColumnPlaceholder`

- `common.importPreview.preview.title`
- `common.importPreview.preview.empty`
- `common.importPreview.preview.sampleRows`
- `common.importPreview.preview.clickHeaderToBind`

- `common.importPreview.validation.title`
- `common.importPreview.validation.missingRequired`
- `common.importPreview.validation.duplicateSources`
- `common.importPreview.validation.ready`
- `common.importPreview.validation.notReady`

- `common.importPreview.actions.autoMatch`
- `common.importPreview.actions.reset`
- `common.importPreview.actions.confirm`
- `common.importPreview.actions.reparse`

### I18n rule

Do not leave these strings hard-coded in templates:

- required / optional badges
- matched / unmatched / duplicate status labels
- error and empty-state copy
- button labels
- validation messages

---

## 11. Editing Scope Decision

Decision: **v1 does not support full table editing**.

### Why

- The primary problem is schema alignment, not spreadsheet editing.
- The repository already has `UniversalTable.vue` for backend-managed table editing patterns.
- Turning import preview into an editor would explode scope:
  - cell editing
  - dirty tracking
  - undo/redo
  - type validation
  - export-back behavior
  - a large verification surface

### Allowed in v1

- sheet selection
- header-row adjustment
- manual mapping edits
- optional ignore/hide-unmatched display toggles

### Possible later additions

If needed after v1, consider only light metadata-level editing such as:

- display alias confirmation
- target type labeling

Still avoid spreadsheet-style cell editing unless explicitly requested later.

---

## 12. Integration Strategy

## 12.1 First integration target: `MergeTool.vue`

This is the best first target because:

- the value of column mapping is immediate
- the page is already a staged workbench
- the reference file has the clearest schema contract role

### Recommended first integration pattern

Do **not** start with a modal.

Instead, embed the import-preview workbench directly into the existing step flow:

- Step 1: upload reference file
- Step 1.5: show `TabularImportPreview` inline for the reference file
- only after schema confirmation does the user proceed to step 2

Why inline first:

- matches current `MergeTool` structure
- avoids modal/dropdown/preview stacking complexity
- fits the current workbench reading order better than a detached overlay

## 12.2 Second integration target: `Jyut2IpaTool.vue`

Good second target because:

- schema is likely more fixed
- workflow is simpler
- it can validate the shared layer in a more linear tool flow

Possible integration:

- after file upload, show the preview/mapping workbench before processing begins

## 12.3 Third integration target: tabular path in `CheckTool.vue`

This should come later because:

- the page accepts mixed formats (`doc`, `docx`, `tsv`, `xlsx`, `xls`)
- `CheckTool` already has a much heavier workbench surface
- it is better to first prove the shared layer on cleaner tabular-only pages

For its first pass:

- route only xlsx/xls/tsv through the shared preview layer
- leave doc/docx on the existing path

---

## 13. V1 Scope Checklist

### In scope

- xlsx / xls / csv parsing
- multi-sheet support
- configurable header row
- source header + sample row preview
- required and optional target schemas
- auto-match suggestions
- manual column mapping
- missing-required validation
- duplicate-source validation
- normalized confirm payload

### Nice-to-have but not required for first pass

- show-only-unmatched toggle
- click source header to bind to active target field
- auto-match provenance labels in UI
- completion percentage

### Explicitly out of scope

- cell editing
- row editing
- export corrected workbook
- advanced fuzzy matching
- full doc/docx preview support
- external viewer integration

---

## 14. Risks and Mitigations

### 14.1 Duplicate source-column names

Mitigation:

- identify source columns by `sourceColumnId` / index, not only label
- keep both id and display name in emitted mapping

### 14.2 Empty header cells

Mitigation:

- assign fallback labels like `A`, `B`, `C`
- visibly indicate that the original header was empty

### 14.3 Multi-sheet switching

Mitigation:

- when the active sheet changes, rebuild source columns, preview rows, and auto-match state
- do not silently preserve stale mappings unless they are revalidated

### 14.4 Header-row changes

Mitigation:

- changing header row should rebuild source columns and rerun matching
- stale mappings should be cleared or revalidated visibly

### 14.5 CSV encoding edge cases

Mitigation:

- v1 should clearly support UTF-8 / UTF-8 BOM first
- if broader encoding detection is needed later, add it as a separate enhancement

---

## 15. Phased Rollout

### Phase 1: Shared foundation

Create:

- import utilities
- `useTabularFilePreview`
- `useColumnMapping`
- import-preview UI shell

Goal:

- a reusable shared workbench that can parse and map one file correctly

### Phase 2: First real integration

Integrate into:

- `MergeTool.vue`

Goal:

- confirm that the shared layer works in a real staged import flow

### Phase 3: Broader reuse

Integrate into:

- `Jyut2IpaTool.vue`
- selected tabular path in `CheckTool.vue`

Goal:

- validate that the shared layer supports multiple import workflows without page-specific forking

### Phase 4: Post-v1 polish

Only after real usage confirms the need, consider:

- richer suggestions
- alias management helpers
- additional file-type support
- metadata-level corrections

---

## 16. Verification Guidance for Later Implementation

When implementation starts, verify at minimum:

- `xlsx` file with one sheet and clean headers
- `xlsx` file with multiple sheets
- file whose true header row is not the first row
- file with duplicated source-column names
- file with missing required target fields
- file whose source labels only match via aliases/normalization
- responsive layout and internal scroll boundaries
- i18n coverage in `zh-Hant`, `zh-CN`, and `en`
- style consistency with existing tool pages

---

## 17. Final Recommendation

Build the shared component as a reusable import-preflight workbench, not as a generic file viewer and not as a spreadsheet editor.

The strongest initial path is:

1. create a shared `TabularImportPreview` layer
2. reuse existing selector/loading/scroll/button/shell systems
3. keep v1 focused on preview + mapping + validation only
4. integrate first into `MergeTool.vue`
5. expand later to `Jyut2IpaTool.vue` and the tabular path of `CheckTool.vue`

This gives the project a consistent and reusable import architecture without introducing a foreign UI language or unnecessary editing scope.
