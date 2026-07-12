# TabularImportPreview Source Export Design

> For Hermes: use superpower-style scoped feature execution with repo-grounded verification and scope-limited commits.

Goal: make `TabularImportPreview` a true shared import workbench that can both preview tabular sources and export/download the currently previewed source file, while deleting MergeTool’s private default-reference download path.

Architecture:
- Keep preview/mapping semantics inside `TabularImportPreview.vue`.
- Add a minimal shared tabular-source export helper in `src/utils/import/`.
- Let parent pages pass either `file` or a richer `source` object; the component normalizes them and renders a built-in export action.
- Keep business confirmation/apply/upload semantics in the parent page (`MergeTool.vue`), but move source-file export into the shared component.

Tech stack:
- Vue SFCs with `lang="scss"`
- Existing shared glass UI primitives from `src/styles/main/_buttons.scss` and `src/styles/main/_surfaces.scss`
- Existing i18n JSON files under `src/i18n/locales/*/common.json`

---

## Current grounded findings

1. Shared preview stack already exists:
- `project/src/components/import/TabularImportPreview.vue`
- `project/src/composables/import/useTabularImportPreview.js`
- `project/src/composables/import/useTabularImportFlow.js`
- `project/src/utils/import/tabularPreview.js`
- `project/src/utils/import/columnMapping.js`

2. `MergeTool.vue` already routes the built-in default reference workbook through the shared preview flow, but still keeps a page-local download implementation.

3. `TabularImportPreview.vue` already has a header action area and uses the project’s shared glass panel/button classes. That means adding built-in export is structurally straightforward and does not need a second visual system.

4. The repo style constraint is explicit and binding for this work:
- use SCSS
- reuse common tokens
- reuse shared component/button/surface styles
- avoid ad-hoc visual one-offs

## Product decision (fixed)

`TabularImportPreview` formally supports source export.

Meaning of export:
- export/download the current preview source file itself
- not a transformed sheet subset
- not a mapping JSON
- not an uploaded backend result

This is a built-in shared capability, not a parent-only business action.

## Shared source contract

Add a minimal source model that the component can consume directly.

Shape:

```js
{
  id?: string,
  kind?: 'upload' | 'preset' | 'remote',
  file?: File | null,
  fileName?: string,
  displayName?: string,
  exportLabel?: string,
  downloadable?: boolean,
  resolveFile?: async () => File,
  resolveExport?: async () => ({ blob: Blob, fileName?: string })
}
```

Rules:
- `file` is the fastest path.
- `resolveFile()` is the standard path for preset/remote sources that can become a `File`.
- `resolveExport()` is a fallback for blob-only cases.
- If none of these exist, the component is not exportable.

## Component API changes

Target file:
- `project/src/components/import/TabularImportPreview.vue`

Add props:
- `source` (Object, default `null`)
- `showExport` (Boolean, default `true`)

Keep existing `file` prop for compatibility.

Add emits:
- `export-start`
- `export-success`
- `export-error`

Add internal derived state:
- `effectiveSource`
- `canExport`
- `resolvedExportLabel`
- `isExporting`

Behavior:
- If `source` exists, prefer it.
- Else, synthesize an upload-style source from `file`.
- Render a built-in export button in the header action area when `canExport` is true.
- Export button triggers shared helper logic and emits export lifecycle events.

## Shared helper additions

New file:
- `project/src/utils/import/downloadTabularSource.js`

Functions:
1. `resolveTabularSourceExport(source)`
   - returns `{ blob, fileName }`
   - priority:
     - `source.file`
     - `await source.resolveFile()`
     - `await source.resolveExport()`
2. `downloadTabularSource(source)`
   - resolves export payload
   - creates object URL
   - triggers browser download
   - revokes URL

This keeps all fetch/blob/download details out of individual tool pages.

## MergeTool integration

Target file:
- `project/src/main/views/explore/tools/MergeTool.vue`

Required changes:
1. Replace sentinel-oriented default reference handling with a standard source object for preview/export semantics.
2. Keep preview behavior unchanged from the user point of view.
3. Delete page-local `downloadDefaultReference()`.
4. Pass `source` into `TabularImportPreview` so the built-in export button appears automatically.
5. Keep `handleReferenceConfirm()` in the page; confirmation/apply remains business logic.

Recommended source object in MergeTool:
- `defaultReferenceSource` with `kind: 'preset'`, `fileName`, `downloadable: true`, and `resolveFile()` fetching `/data/参考表.xlsx`.

## Styling constraints

Must follow existing repo patterns:
- component style block stays `scoped lang="scss"`
- export button uses `.main-glass-button` with existing variants/sizes
- no new standalone button visual system
- surface primitives remain `.main-glass-panel` and `.main-glass-panel-inner`
- colors/text/borders use existing CSS vars already used by the component

Allowed new SCSS scope:
- tiny header-action layout tweaks only
- optional exporting-state spacing/alignment only

## i18n changes

Target files:
- `project/src/i18n/locales/zh-Hant/common.json`
- `project/src/i18n/locales/zh-CN/common.json`
- `project/src/i18n/locales/en/common.json`

Add common import-preview action keys for:
- export source file
- exporting

Allow source-level override through `source.exportLabel`, but shared defaults must exist in i18n.

## Tests / verification expectations

Need at least:
1. helper-level tests or equivalent proof for source export resolution order:
- file path
- resolveFile path
- resolveExport path
2. component-level or targeted behavior proof that export button renders only when exportable
3. real frontend build from the actual app root:
- `cd project && npm run build`

Also inspect:
- `git diff --` for touched files only
- no unrelated dirty files included in staged commits

## Scope boundaries

In scope:
- shared source export capability in `TabularImportPreview`
- shared helper for export/download
- MergeTool migration to shared export capability
- i18n updates
- tests/build verification

Out of scope:
- exporting transformed preview subsets
- exporting mapping JSON
- moving confirm/apply/upload semantics into the shared component
- broad refactor of all import flows in the repo

## Acceptance criteria

1. `TabularImportPreview` shows a built-in export action when the current source is exportable.
2. Exporting works for plain uploaded files and preset/resolveFile-backed sources.
3. `MergeTool.vue` no longer contains its own default-reference download implementation.
4. Existing preview/mapping behavior remains intact.
5. Styling stays within SCSS + shared token/shared glass component conventions.
6. Frontend build passes from `project/`.
7. Commits are scope-limited despite the dirty tree.
