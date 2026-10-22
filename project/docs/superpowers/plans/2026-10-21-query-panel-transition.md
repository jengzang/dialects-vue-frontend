# Query panel transition distance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spread compact-to-expanded panel morphing across 1.5 times the intro height while keeping its endpoint and compact hold distance unchanged.

**Architecture:** `QuerySearchEntrance` derives visual progress from scroll position. Multiply only its maximum morph distance by 1.5; retain the current available-distance cap. A focused unit test checks the midpoint of that enlarged range.

**Tech Stack:** Vue 3, Vitest.

---

### Task 1: Extend the scroll-linked morph distance

**Files:**
- Modify: `src/components/common/QuerySearchEntrance.vue`
- Test: `tests/querySearchEntrance.test.js`

- [ ] **Step 1: Add a failing midpoint test**

Add this test inside `describe('one query panel morphing with scroll', ...)`:

```js
it('uses 1.5 intro heights for the expanded transition distance', async () => {
  await mountEntrance()
  await entrance.collapse()
  const end = 420 - window.innerHeight * 0.12
  const holdDistance = Math.min(64, end / 2)
  const introHeight = host.querySelector('.query-intro').getBoundingClientRect().height
  const transitionDistance = Math.min(introHeight * 1.5, end - holdDistance)

  scrollPosition = end - holdDistance - transitionDistance / 2
  window.dispatchEvent(new Event('scroll'))
  await settle()

  expect(entrance.progress).toBeCloseTo(0.5)
})
```

- [ ] **Step 2: Run the test and verify it fails on the old distance**

Run: `npm test -- tests/querySearchEntrance.test.js`
Expected: the new midpoint assertion fails because current progress still uses one intro height.

- [ ] **Step 3: Multiply only the available morph distance by 1.5**

In `updateProgress`, change the distance calculation to:

```js
const distance = Math.min((introEl.value?.getBoundingClientRect().height || 0) * 1.5, target - compactHoldDistance)
```

- [ ] **Step 4: Run focused entrance tests**

Run: `npm test -- tests/querySearchEntrance.test.js tests/querySearchEntranceScroll.test.js`
Expected: all tests pass; compact endpoints and the existing 64px hold behavior remain unchanged.

- [ ] **Step 5: Review and commit only the two implementation files**

Run: `git diff --check`, inspect `git diff -- src/components/common/QuerySearchEntrance.vue tests/querySearchEntrance.test.js`, then stage those two paths and commit with `Lengthen query panel transition distance`.
