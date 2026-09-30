# Liquid Glass navigation pilot

## Goal

Use the existing `NavBar` as the Liquid Glass pilot and make `SimpleSidebar` its complementary desktop floating panel, while preserving every existing navigation, menu, overflow, and business interaction.

## Scope

### NavBar

- Change only the outer `.navbar` shell in `project/src/components/bar/NavBar.vue`.
- Desktop: keep the existing bar height and contents, but inset the fixed shell 12px vertically and 16px horizontally.
- Portrait: retain the existing two-row layout and inset the shell 8px horizontally, with the top offset respecting the safe area.
- Replace the current flat glass shell with a token-based translucent fill, stronger blur, a restrained refraction-like highlight, and a rounded outer edge.
- Add one passive `scroll` listener with `requestAnimationFrame` throttling. It updates only a CSS custom property that shifts the shell's highlight; it never moves or reorders navigation content.
- Keep text and control colours on existing theme tokens. Use a high-contrast media-query fallback rather than sampling the pixels behind the bar.

### SimpleSidebar

- Keep all current sidebar content, menu/submenu behavior, visit statistics, overlay click-to-close behavior, and the user's existing 17px statistic value change.
- Desktop: make the existing sidebar shell a 12px-inset floating panel, including a rounded edge and fixed viewport height less the outer gutters.
- Portrait: explicitly retain the current edge-attached drawer geometry and overlay coverage.
- Reuse existing `--sidebar-*` tokens and the shared toolbar stylesheet. The sidebar is a stable, more opaque reading surface, so it has no scroll-driven highlight.

## Non-goals

- Do not edit `ExploreBar`, `CommonBar`, routes, tab configurations, labels, overflow handling, menu items, or business logic.
- Do not add global tokens, new components, a composable, or a content-luminance sampler.
- Do not change the meaning of the colour themes. Pixel-level background luminance detection is deferred because maps, media, iframes, and accessibility settings make it unreliable for this minimal pilot.

## Files and responsibilities

- `project/src/components/bar/NavBar.vue`: outer-shell geometry, Liquid Glass visual layer, and the isolated B2 scroll-to-CSS-variable bridge.
- `project/src/components/bar/SimpleSidebar.vue`: only the component-scoped desktop/portrait overlay geometry and transition offset required by the floating panel; preserve the user's existing change.
- `project/src/styles/main/_toolbars.scss`: shared `.main-sidebar-shell` desktop floating geometry plus portrait reset, using existing sidebar tokens.

## Behaviour and accessibility

- The scroll handler is passive, batches DOM writes in one animation frame, and removes itself at unmount.
- `prefers-contrast: more` uses a stronger opaque surface and suppresses the decorative highlight shift.
- The sidebar retains its backdrop overlay and keyboard/pointer behavior; only its desktop perimeter changes.

## Verification

- Run the focused lint command for both Vue components and the production Vite build without invoking sitemap generation.
- Inspect the SCSS output and exact diff to confirm that no existing navigation content, Chinese copy, emoji, or user-owned sidebar font-size change was altered.
- Manually inspect the pilot in both landscape and portrait orientations, including sidebar open/close and navigation tab overflow.
