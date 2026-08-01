# Praat Mobile Python Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move iOS and Android Praat analysis toward local Python execution while keeping Web behavior unchanged.

**Architecture:** Web continues to use the existing backend Praat job API. Native App builds use a platform-driven Praat config: local Python is the preferred engine, accepted input is WAV only, and backend analysis remains a fallback while native Python packaging is completed. The copied Python core should contain analysis modules and result shaping, but not the backend's FastAPI routes, multi-worker task manager, heartbeat, timeout, or automatic cleanup system.

**Tech Stack:** Vue, Capacitor, Vitest, copied Python Praat core, praat-parselmouth, numpy, scipy.

---

### Task 1: Platform Praat Capability Contract

**Files:**
- Modify: `project/src/platform/featureMatrix.js`
- Create: `project/src/platform/praatCapabilities.js`
- Test: `project/tests/praatPlatformCapabilities.test.js`
- Modify: `docs/PLATFORM_BUILD.md`

- [ ] Add a failing Vitest test that asserts Web supports the existing Praat formats and remote backend engine, while iOS/Android support WAV-only local Python with backend fallback.
- [ ] Implement a small platform Praat capability helper.
- [ ] Wire the helper into the platform matrix acceptance metadata.
- [ ] Document the Web versus native input-format split.
- [ ] Run the focused tests and commit.

### Task 2: Native WAV Input Guard

**Files:**
- Modify: `project/src/main/components/praat/AudioInputPanel.vue`
- Modify: `project/src/main/views/Praat.vue`
- Modify: `project/src/i18n/locales/en/praat.json`
- Modify: `project/src/i18n/locales/zh-CN/praat.json`
- Modify: `project/src/i18n/locales/zh-Hant/praat.json`
- Test: `project/tests/praatNativeInputGuard.test.js`

- [ ] Add a failing test for native WAV-only acceptance and non-WAV rejection copy.
- [ ] Restrict native file picker accept types to WAV.
- [ ] Guard selected files before analysis so non-WAV does not reach the engine.
- [ ] Add concise user-facing copy that tells App users to use Web for other audio formats.
- [ ] Run the focused tests and commit.

### Task 3: Analysis Engine Facade

**Files:**
- Create: `project/src/main/composables/praat/usePraatAnalysis.js`
- Modify: `project/src/main/views/Praat.vue`
- Modify: `project/src/api/main/tools/Praat.js`
- Test: `project/tests/praatAnalysisFacade.test.js`

- [ ] Add a failing test that the facade chooses remote on Web and native-local on App when available.
- [ ] Move the existing upload/create-job/poll/result API sequence behind a remote engine adapter.
- [ ] Add a native engine adapter that calls a Capacitor plugin when present and falls back to remote when unavailable.
- [ ] Keep the result JSON shape consumed by current result panels unchanged.
- [ ] Run the focused tests and commit.

### Task 4: Copied Python Core Package

**Files:**
- Create: `native/praat-python/`
- Create: `native/praat-python/praat_mobile/`
- Test: `project/tests/praatPythonPackageAudit.test.js`

- [ ] Add a failing audit test that the copied package excludes FastAPI routes, task manager, file manager, heartbeat, and cleanup policy code.
- [ ] Copy the backend Praat analysis modules and result-shaping utilities into `native/praat-python/praat_mobile/`.
- [ ] Add a thin `run_analysis.py` entry point that accepts a WAV path and settings JSON, then writes result JSON.
- [ ] Keep temporary audio handling outside the copied backend server abstractions.
- [ ] Run the audit test and commit.

### Task 5: Native Plugin Skeleton And Reporting Client

**Files:**
- Create: `project/src/platform/praatLocal.js`
- Modify: `project/src/api/main/tools/Praat.js`
- Modify: `project/src/platform/featureMatrix.js`
- Test: `project/tests/praatRunReporting.test.js`

- [ ] Add a failing test for authenticated local-run report payload construction.
- [ ] Add `reportLocalPraatRun` for `POST /api/tools/praat/local-runs`.
- [ ] Add a Capacitor-facing local analysis bridge that uses file paths where possible and treats input audio as temporary.
- [ ] Mark local result JSON and run metadata as retained, but input and normalized audio as temporary.
- [ ] Run the focused tests and commit.

### Task 6: Verification

**Files:**
- Modify documentation only if verification commands reveal stale instructions.

- [ ] Run Praat-related Vitest tests.
- [ ] Run platform acceptance verification.
- [ ] Run Web build.
- [ ] Report any native Python packaging blockers separately instead of claiming real iOS/Android Python execution if the native runtimes are not yet wired.
