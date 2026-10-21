# Page Tab Navigation Positioning Design

## Goal

Keep the vocabulary page tab navigation visible while the page scrolls, with the requested behavior changing by orientation.

## Behavior

- In landscape orientation, keep the navigation at its initial on-screen position below the global navigation bar as the page scrolls. Preserve its original layout space so page content does not jump.
- In portrait orientation, let the navigation scroll normally until it reaches the top of the viewport, then keep it pinned there.
- Apply the behavior only to `.page-tab-navigation` in the vocabulary page and use the existing `max-aspect-ratio: 1 / 1` orientation convention.

## Scope

Keep the change to the vocabulary page navigation and only adjust its scroll context if required for sticky positioning. Do not change tab content, route behavior, or other page layouts.

## Verification

Review the final diff to confirm the change stays within scope and preserves the existing navigation styles. Check the rendered behavior in both orientations if the local UI can be opened.
