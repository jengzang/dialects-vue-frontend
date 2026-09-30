# AppModal Flip to Detail Design

## Goal

Make the shared `AppModal` use a three-dimensional “Flip to Detail” motion by default. On opening, the modal should travel from the element that triggered it to the viewport center, grow to its final panel size, rotate around the Y axis to reveal its detail side, and settle with a small rebound. On closing, it should play the same path in reverse back to the original element.

## Scope

- Change only `project/src/components/common/AppModal.vue` and focused tests for its modal transition behavior.
- Do not change existing modal consumers.
- Do not alter a consumer that explicitly supplies `transition-name`; its named transition remains authoritative.
- In `data-ui-mode="compact"`, show and hide immediately with no motion.

## Opening Origin

`AppModal` records `document.activeElement` when its `modelValue` changes to `true`. When that element is a connected DOM element, its `getBoundingClientRect()` is the origin rectangle.

The rendered modal panel is measured before its enter animation begins. The component derives the translation between the origin center and the panel center, plus a scale factor that maps the panel to the origin rectangle. These values are used only by the current transition.

If there is no usable active element, or the origin has been removed before the modal closes, the animation degrades safely to a centered scale-and-flip motion. It does not throw and it does not prevent the modal from opening or closing.

## Motion

The new default transition name is `flip-to-detail`.

Opening sequence:

1. Backdrop fades in while the panel begins at the recorded origin’s position and scale, facing forward.
2. The panel flies to the centered final position while expanding and rotating on its Y axis.
3. The rotation and scale overshoot slightly, then settle at `rotateY(180deg)` to show the detail face.

Closing sequence reverses the spatial path: the detail face rotates back to the forward face, shrinks, and returns to the stored origin. The backdrop fades out at the same time.

The panel uses `perspective`, `transform-style: preserve-3d`, and `backface-visibility: hidden` so the rotation behaves as a real card flip rather than a flat fade.

## Compact Mode and Accessibility

The project already applies `animation: none !important` and `transition: none !important` below `:root[data-ui-mode="compact"]`. The new transition classes must remain subject to those rules, yielding immediate show/hide without flight, flip, or rebound in compact mode.

The implementation also respects `prefers-reduced-motion: reduce` by disabling the 3D motion for that preference. Focus management, Escape behavior, scroll locking, dialog semantics, and backdrop closing retain their existing behavior.

## Compatibility

The default changes from `modal-fade` to `flip-to-detail`. Explicit consumer transition names continue to select the existing named styles. Existing `size`, dimensions, teleport target, z-index, header, footer, frameless mode, and body scroll-lock behavior are not changed.

## Verification

- Add focused tests for the new default transition name and for preserving an explicit custom transition.
- Test origin capture and centered fallback through the exported or component-visible transition state.
- Verify compact-mode CSS still suppresses the new animation classes.
- Run the focused tests and the project’s relevant test command.
- Inspect the final diff for scope, visual-style preservation, and Chinese/emoji encoding integrity.
