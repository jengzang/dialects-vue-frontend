# NavBar Liquid Glass Edge Tuning

## Decision

Apply the approved A treatment to the existing Liquid Glass NavBar.

## Scope

- Change only `project/src/components/bar/NavBar.vue`.
- Increase the existing outer glass border from `var(--border-glass)` to `var(--glass-80)`.
- Reduce both standard and WebKit backdrop blur from `18px` to `14px`, retaining saturation at `160%`.

## Non-goals

- Do not change the floating insets, corner radii, gradients, scroll-driven highlight, navigation content, routing, interactions, portrait rules, contrast fallback, or SimpleSidebar.

## Validation

- Verify the compiled NavBar uses the approved border token and 14px blur.
- Run focused lint and the production Vite build.
- Review the exact diff for scope and encoding safety.
