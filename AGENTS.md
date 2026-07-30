# AGENTS.md

This repository has strict collaboration and change-control rules. Read this before editing anything.

## 1. Execution Discipline

- Prefer minimal, targeted changes.
- Do not expand scope unless the user explicitly asks.
- If the user requests staged execution, follow it strictly.
- Prefer distributed execution: finish one step, CR it, commit it, then move to the next step.
- Do not batch many unrelated changes into one opaque pass when the user asked for stepwise delivery.
- Before each new step, re-check current workspace state because the user may have edited or reorganized files.

## 2. Review Requirements

- CR means real code review, not a superficial glance.
- After each step, perform CR before commit.
- After implementing a change, always inspect `git diff`.
- Use `git diff` to verify:
  - whether original behavior was unintentionally changed
  - whether original styles were unintentionally changed
  - whether all changes are actually required by the user's request
  - whether any unrelated file was affected
- If a change might affect existing behavior or visuals, explicitly confirm it is user-requested or necessary.

## 3. Change Scope Control

- If the user did not explicitly request a change, do not make it.
- The existing business logic is considered mature and should not be casually rewritten.
- Do not add features without confirmation.
- Do not remove features without confirmation.
- Do not change behavior, structure, or styling beyond the requested scope unless you first confirm with the user.
- Preserve the user's recent refactors and directory reorganizations. Do not force old structure back in.

## 3.1 Confirmation Before Structural Changes

- If a change involves extracting components, introducing composables, reorganizing module boundaries, or changing implementation strategy, confirm with the user first unless they explicitly asked for that exact refactor.
- Do not replace the user's requested implementation approach with a different "better" approach without confirmation.
- If the user explicitly says not to extract, not to split, not to refactor, or to keep everything in one place, follow that constraint strictly.
- If the user specifies a concrete mechanism or implementation form, treat that as a binding requirement unless it is impossible or unsafe, in which case explain the conflict before proceeding.

## 3.2 Current Structure Over Historical Assumptions

- When the user says a directory has been reorganized, treat all prior path assumptions as stale.
- Re-read the current filesystem layout before editing imports, routes, config paths, or view/component references.
- Do not rely on conclusions from earlier turns if the user has since refactored the related area.

## 4. Text, Chinese, Emoji, and Encoding Safety

- Chinese text integrity is critical.
- Do not casually rewrite existing Chinese copy.
- Do not "improve" wording unless explicitly requested.
- Traditional Chinese content, existing release notes, and original wording should be preserved exactly unless the user requests content edits.
- Literal emoji must remain literal emoji characters.
- Do not replace emoji with Unicode escape sequences.
- Watch carefully for mojibake or encoding corruption after edits.
- Windows PowerShell is high risk for encoding damage, especially in files containing Chinese or emoji.
- On Windows/PowerShell, avoid risky bulk rewrites for files containing Chinese or emoji.
- For files containing Chinese or emoji, avoid shell-based full-file rewrites unless absolutely necessary.
- Prefer the smallest possible edit surface for such files.
- Do not assume terminal-rendered mojibake means the file content is actually corrupted.
- Before declaring a Chinese/emoji-heavy file "garbled" or attempting recovery, first verify the real file bytes and decoding with UTF-8-safe inspection methods such as byte checks, escaped/unicode-safe reads, or equivalent non-lossy validation.
- Do not use terminal display alone as evidence that the source file text is broken.
- Before rewriting an entire Chinese/emoji-heavy file, first verify that this is truly necessary.
- After editing a Chinese/emoji-heavy file, immediately verify the file content again instead of assuming the write was safe.
- If text corruption appears, recover by diffing against previous version/history and restore the original literal characters.
- After any text-related or config-related edit, explicitly CR for:
  - Chinese corruption
  - emoji corruption
  - encoding damage

## 5. Routing and Compatibility

- Real page identity should prefer path routes.
- Query parameters should only hold true internal state, not top-level page identity, unless the user explicitly wants a single page with internal tabs.
- Preserve backward compatibility when the user asks for it.
- Do not assume router structure is unchanged; check current route files and current page layout first.
- Avoid bloating the main router file when routes can be split by concern.

## 6. Config Rules

- Do not dump unrelated config into one giant file.
- `config/index.js` should usually be a unified export surface, not a giant content bucket, unless the user explicitly asks otherwise.
- Preserve the user's current config organization.
- Before changing config imports, re-check the current config directory layout.
- If config files were recently reorganized, follow the newest structure instead of old paths.

## 7. Modal and UI Safety

- Header areas in modals must not scroll with content.
- When fixing a UI pattern globally, verify all relevant usages before claiming completion.
- Do not assume partial coverage is enough when the user asks whether "all" places are handled.
- If a style or layout change was not explicitly requested, avoid touching it.

## 7.1 Responsive Design Conventions

- Do NOT use width-based media queries (`max-width`, `min-width`) for responsive layout breakpoints.
- Use `@media (max-aspect-ratio: 1 / 1)` to detect portrait/mobile orientation instead.
- The project does not use pixel-based width breakpoints; aspect-ratio is the only accepted approach for responsive breakpoints.

## 8. Git and Recovery

- Never overwrite or revert unrelated user changes.
- Use git history and git diff to recover broken route mappings, text, emoji, styles, and config.
- Before commit, confirm the current step is in a reviewable state.
- If build or verification fails, report the blocker clearly before committing.

## 8.1 Commit Boundary Hygiene

- Before every commit, inspect both unstaged and staged changes.
- If the user requested a commit for only specific files or a specific step, commit only that exact scope.
- Do not accidentally include previously staged user changes or unrelated renames/moves in the current commit.
- If staged changes already contain unrelated work, cleanly separate the requested commit from that staged state before committing.

## 8.2 Exhaustive Coverage When Requested

- If the user says "all", "全部", "所有", "不要遗漏", or asks whether coverage is complete, perform global verification instead of spot checks.
- Do not claim completion for broad fixes until all relevant call sites, route entries, config references, or component usages have been checked.
- For cross-cutting UI or navigation issues, search the full relevant scope before concluding the work is done.

## 9. Important Repeated User Priorities

- Minimal changes are strongly preferred.
- Preserve the user's own latest edits and reorganizations.
- Chinese text and emoji must be protected carefully.
- PowerShell on Windows can corrupt text; treat it as a known hazard.
- Do thorough global exploration before claiming something is fully handled.
- Every step should be implemented, CR'd, and committed before moving on.
- Any non-requested behavior or style change is unacceptable.
- After implementation, always diff against previous state to ensure only requested changes were introduced.
