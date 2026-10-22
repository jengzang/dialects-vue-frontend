# Page Tab Navigation Positioning Design

## Goal

Keep the vocabulary page tabs visible while scrolling, with different behavior in landscape and portrait, using logic that other components can reuse.

## Behavior

- In landscape orientation, pin the navigation at its configured initial screen position for the current layout.
- In portrait orientation, let it scroll in normal flow until its placeholder reaches the viewport top, then pin the navigation there.
- Keep the navigation's placeholder in document flow while pinned so the surrounding content does not jump.

## Architecture

Create a reusable Vue composable in `src/composables/ui/useViewportPinnedElement.js`. It accepts refs for the target and its placeholder, an enabled value, orientation offsets, and an optional scroll target. It applies fixed positioning from the target's measured geometry, maintains the placeholder height, responds to scrolling and viewport changes, and removes listeners/styles when disabled or deactivated.

Use the composable from `VocabularyPage.vue`. Keep the vocabulary navigation's appearance and responsive placement in its existing scoped SCSS. Do not change `MenuLayout.vue` or any other layout.

## Scope

Only the reusable composable, its vocabulary page integration, and the vocabulary tab's local layout styles are in scope. Preserve any unrelated current workspace edits.

## Verification

Review the final diff and check that `MenuLayout.vue` matches its state before this feature. Do not add or run tests for this request.
