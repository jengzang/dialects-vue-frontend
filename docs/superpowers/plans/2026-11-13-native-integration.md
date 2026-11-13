# Native integration implementation plan

User-authorized scope: unify every file export and share on iOS/Android through existing native services, list external links, receive audio from other apps, and handle back actions in the order overlay, keyboard, page, exit. Preserve browser behavior and the user's current changes. No dependency installation.

1. Audit all export primitives and callers. Add native branches using the existing file service; preserve browser download bodies and file contents. Await native completion before success feedback. Test native dispatch and browser regressions; inspect diffs; commit.
2. Inventory clickable external destinations, excluding assets and API calls. Report findings without changing external navigation.
3. Route page-image and screenshot sharing through the native Share plugin on App only. Keep browser share/download behavior. Test native dispatch and cancellation; inspect diffs; commit.
4. Add native audio intake using existing Capacitor infrastructure, with Android share intents and iOS document opening. Queue cold-start input, copy content to app cache, deliver to Praat for preview only, and acknowledge consumed input. Verify native configuration and JS intake; commit. iOS system share-sheet reception requires a Share Extension and must be distinguished from Open In.
5. Audit modal implementations. Add native-only dismissal registration and native back dispatch covering overlays and keyboard before history; retain Android double-back exit and iOS history gestures. Test stacked overlays, keyboard, navigation, cleanup and browser isolation; commit.

Verification: focused Vitest tests per step, full suite at integration end where feasible, direct Vite native build without regenerating the user's sitemap, native compilation when installed SDKs permit. Record device-only limitations explicitly.
