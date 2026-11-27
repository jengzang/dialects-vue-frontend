# Native Launch Implementation Plan

> **For agentic workers:** Implement and review each platform step separately; do not create a worktree or install dependencies.

**Goal:** Give Android and iOS a branded, system-aware launch experience while leaving the web startup unchanged.

**Architecture:** Native launch resources provide the initial appearance; a native overlay bridges the WebView startup until the existing Vue entry reports readiness through the existing Capacitor plugin. A bounded fallback releases the overlay if startup fails. Web does not invoke the native bridge.

**Tech Stack:** Capacitor, Android resources and Java, iOS storyboard and Swift, Vue.

### Steps

1. Implement and test the native-only ready signal and existing plugin methods, preserving browser behavior.
2. Implement Android light/dark launch resources and matching overlay; verify resource compilation and startup behavior where available.
3. Implement iOS light/dark launch storyboard and matching overlay; verify storyboard and build where available.
4. Review diffs and verify handoff, dark/light appearance, and web invariance; document any device validation limitations.
