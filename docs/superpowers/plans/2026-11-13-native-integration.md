# Native integration implementation plan

User-authorized scope: unify every file export and share on iOS/Android through existing native services, list external links, receive audio from other apps, and handle back actions in the order overlay, keyboard, page, exit. Preserve browser behavior and the user's current changes. No dependency installation.

1. Audit all export primitives and callers. Add native branches using the existing file service; preserve browser download bodies and file contents. Await native completion before success feedback. Test native dispatch and browser regressions; inspect diffs; commit.
2. Inventory clickable external destinations, excluding assets and API calls. Report findings without changing external navigation.
3. Route page-image and screenshot sharing through the native Share plugin on App only. Keep browser share/download behavior. Test native dispatch and cancellation; inspect diffs; commit.
4. Add native audio intake using existing Capacitor infrastructure, with Android share intents and iOS document opening. Queue cold-start input, copy content to app cache, deliver to Praat for preview only, and acknowledge consumed input. Verify native configuration and JS intake; commit. iOS system share-sheet reception requires a Share Extension and must be distinguished from Open In.
5. Audit modal implementations. Add native-only dismissal registration and native back dispatch covering overlays and keyboard before history; retain Android double-back exit and iOS history gestures. Test stacked overlays, keyboard, navigation, cleanup and browser isolation; commit.

Verification: focused Vitest tests per step, full suite at integration end where feasible, direct Vite native build without regenerating the user's sitemap, native compilation when installed SDKs permit. Record device-only limitations explicitly.

## Delivery and verification

- File exports: completed. CSV, XLSX, GeoJSON, map PNG, existing tool exports and four template/sample download anchors use native system sharing on App. Browser download branches remain intact. Native file plugins are registered at startup so geometry workers do not import them.
- External links: 35 fixed destinations documented in 2026-11-13-external-links.md; navigation behavior was not changed.
- Page sharing: completed through the existing Filesystem + Share plugins. Native share-card QR codes point to the public website. Browser sharing is unchanged.
- Audio intake: Android SEND/VIEW and an embedded iOS Share Extension plus Open In support are wired to the Praat preview flow. No automatic upload. The existing 5 MB limit applies. One audio file per share operation.
- Back behavior: native-only overlay registry covers the common AppModal (58 consuming components), independent overlays/menus and all 12 MapLibre popup creation sites. Android handles overlay, IME, history, then existing double-back exit; Android 13+ uses overlay priority, older versions use pre-IME interception. iOS blocks WebKit history gestures while an overlay or keyboard is present and uses an edge gesture to dismiss it.

Validation on the final working tree:
- 26 focused Vitest files, 209 tests passed.
- Web and native Vite builds passed without regenerating sitemap.
- Android Java compilation passed using the installed SDK and Android Studio JDK, offline.
- iOS simulator App build passed, including the embedded audio share extension, with signing disabled. This build used the workspace's concurrently updated native dependency configuration; those unrelated configuration edits are not included in this task's commits.
- Diff review confirmed no component style edits and no changes to existing Chinese/emoji content in the back-navigation step.
- The attempted full suite did not complete: it encountered existing failures and a worker exhausted its heap. Six sampled failures were reproduced against the pre-change commit in a separate temporary checkout. Full-suite passing is not claimed.

Device acceptance remains necessary for system share-sheet interoperability, keyboard/edge-gesture behavior and cross-app audio providers. For signed iOS installation, enable group.top.yzup.dialects for both App and AudioShare provisioning profiles. The iOS extension saves audio and tells the user to open Dialects; it does not use unsupported APIs to launch the host app.
