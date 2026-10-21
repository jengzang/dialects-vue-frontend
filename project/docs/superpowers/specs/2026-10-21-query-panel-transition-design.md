# Query panel transition distance

## Goal

Make the compact-to-expanded and expanded-to-compact morph feel slower by extending the scroll distance over which its progress changes.

## Design

The transition is driven by scroll progress, not a CSS duration. Increase the current maximum morph distance from one `.query-intro` height to 1.5 times that height. Keep the compact resting position, 64px compact hold distance, scroll trigger, and reduced-motion behavior unchanged. With the current 160px minimum intro height, the maximum morph distance becomes 240px.

## Verification

Update the progress test to confirm the morph spans the longer distance, then run the focused query entrance tests and verify compact and expanded endpoints remain unchanged.
