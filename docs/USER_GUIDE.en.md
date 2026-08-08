# User Guide

> Current entry paths and common workflows for Chinese Dialect Atlas

**Documentation Language:** English | [中文](./USER_GUIDE.md)

---

## Getting Started

### Entry Paths

The current platform is best understood through these route groups:

- `/`: home page
- `/menu/*`: main-site core flows
- `/explore/*`: Explore tools and gateway pages
- `/explore/villages/ml`: Explore gateway shell for VillagesML
- `/villagesML?...`: canonical VillagesML workspace path

If you still have older bookmarks such as `/menu?tab=...` or `/explore?page=...`, they are currently kept as compatibility inputs and should redirect to the newer path-based routes.

### Supported Browsers

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

### Navigation Overview

**Main-site Menu (`/menu/*`)**
- Query: `/menu/query/*`
- Phonology tools: `/menu/pho/*`
- Result: `/menu/result`
- Map: `/menu/map/*`
- Tool portal: `/menu/tools`
- Words / grammar portal: `/menu/words`
- Village-data portal: `/menu/villages`
- About and language settings: `/menu/about/*`

**Explore (`/explore/*`)**
- Tool pages: `/explore/tools/*`
- Character classification: `/explore/char-class`
- YuBao: `/explore/yubao`
- Yangchun spoken data: `/explore/yc-spoken`
- Village-focused pages: `/explore/villages/*`

**Account (`/auth*`)**
- Login: `/auth?view=login`
- Register: `/auth?view=register`
- Profile overview: `/auth?view=profile`
- User data: `/auth/data`
- Custom regions: `/auth/regions`

---

## Main Query Flows

### Four Query Modes

| Feature | Canonical Path | Purpose |
| --- | --- | --- |
| Character query | `/menu/query/char` | Look up pronunciations and phonological data by Chinese characters |
| Middle Chinese query | `/menu/query/zhonggu` | Search by Middle Chinese conditions and modern reflexes |
| Phoneme query | `/menu/query/yinwei` | Search by phoneme conditions |
| Tone query | `/menu/query/tone` | Inspect tone systems for locations or regions |

### Basic Workflow

1. Open the relevant query page.
2. Fill in the query conditions and location / region scope.
3. Run the query.
4. Inspect the detailed result page.
5. Switch to the map page if you want spatial visualization.

### Practical Notes

- Start with a smaller set of locations when testing a new query.
- Older entry paths such as `/menu?tab=query` still work, but new bookmarks should use `/menu/query/*`.
- The result page and map page depend on the latest query state. If they appear empty, go back and rerun the query first.

---

## Phonology Tools

### Entry Paths

| Feature | Canonical Path | Purpose |
| --- | --- | --- |
| Phonology matrix | `/menu/pho/matrix` | Inspect a location's full sound-system matrix |
| Custom classification | `/menu/pho/custom` | Build a custom classification matrix |
| Syllable / phonology counts | `/menu/pho/count` | Compare phonological statistics across locations |
| Evolution / sound change | `/menu/pho/evolution` | Open the evolution-related phonology page |

### How It Works

1. Open the phonology group from the main navigation.
2. Use the in-page `TabsContainer` to switch between matrix, custom, count, and evolution views.
3. If you want to preserve the current state, bookmark the current path and query.

---

## Results and Maps

### Result Page

**Path:** `/menu/result`

The result page displays the table-style output for the latest executed query.
If no query has been run yet, it may not contain useful data.

### Map Page

| Feature | Canonical Path | Purpose |
| --- | --- | --- |
| Query map | `/menu/map/view` | Render query results on the map |
| Region / divide tools | `/menu/map/divide` | Open divide / region-related operations |
| Custom map mode | `/menu/map/custom` | Work with personal annotations and custom layers |

### Map Behavior

- The map supports zooming, panning, and style switching.
- Query results can appear as markers, clusters, or feature-colored overlays depending on the mode.
- In some modes the page stores `feature`, `locations`, `regions`, and related parameters in the URL query so the state can be refreshed or shared.

---

## Explore Tools

### Tool Pages

You can enter these pages from the `/menu/tools` portal or open them directly:

| Feature | Path |
| --- | --- |
| Character-table check | `/explore/tools/check` |
| Jyutping to IPA | `/explore/tools/jyut2ipa` |
| Table merge | `/explore/tools/merge` |
| Praat audio analysis | `/explore/tools/praat` |
| Table manager | `/explore/manage` |

### Tool Usage Notes

- `check`, `merge`, and `jyut2ipa` include operations that may require login before running.
- When unauthenticated, the app redirects to `/auth` and keeps the current page in the `redirect` query so you can return after login.
- Praat now lives at `/explore/tools/praat`; the older `/explore?tab=praat` form should no longer be treated as the primary route.

---

## Words, Classification, and Village Pages

### Words and Grammar

| Feature | Path |
| --- | --- |
| YuBao vocabulary | `/explore/yubao?tab=vocabulary` |
| YuBao grammar | `/explore/yubao?tab=grammar` |
| Yangchun spoken | `/explore/yc-spoken` |

### Character Classification

**Base path:** `/explore/char-class`

This page still uses query parameters for in-page state, for example:

- `/explore/char-class?tab=zhonggu`
- `/explore/char-class?tab=shanggu`
- `/explore/char-class?tab=jingu`
- `/explore/char-class?tab=yueyun`

That query is page-internal state, not a top-level identity pattern for the whole application.

### Village-Focused Pages

| Feature | Path |
| --- | --- |
| Guangdong village tree / map | `/explore/villages/gd` |
| Guangdong village table | `/explore/villages/table` |
| Yangchun villages | `/explore/villages/yc` |
| VillagesML gateway | `/explore/villages/ml` |

Among these:

- `/explore/villages/ml` is the main-site gateway shell for VillagesML
- the real VillagesML workspace lives under `/villagesML?...`

---

## VillagesML Workspace

### How to Enter

1. Open `/explore/villages/ml` if you want the dashboard / gateway view first.
2. Use cards or direct links to open `/villagesML?module=...&subtab=...` workspace pages.

### Common Direct Links

| Feature | Path |
| --- | --- |
| Search | `/villagesML?module=search` |
| Character frequency tendency | `/villagesML?module=character&subtab=frequency` |
| Semantic subcategories | `/villagesML?module=semantic&subtab=subcategories` |
| Spatial hotspots | `/villagesML?module=spatial&subtab=hotspots` |
| Regional similarity | `/villagesML?module=regional&subtab=similarity` |
| ML basic clustering | `/villagesML?module=compute&subtab=clustering` |

For fuller module details, see the [VillagesML user guide](./VillagesML/USER_GUIDE.md) and [VillagesML feature overview](./VillagesML/FEATURE_OVERVIEW.md).

---

## Accounts and Permissions

### Login / Registration

- Login: `/auth?view=login`
- Register: `/auth?view=register`
- Profile overview: `/auth?view=profile`

### Personal Data and Custom Regions

- User data: `/auth/data`
- Custom regions: `/auth/regions`

Both routes are protected by router checks and redirect unauthenticated users back to `/auth`.

### Language Settings

**Path:** `/menu/settings`

This page is mainly for site-level language and interface preferences. It is not the same as the profile overview.

---

## FAQ

### Why do I still see old query-style links?

Because the project still keeps legacy compatibility entry points.
New documentation uses path routes as the primary reference, but older bookmarks should often continue to work.

### Why do some tools redirect me to login first?

Because selected tools and pages use the shared `useAuthGuard` flow.
When needed, the app redirects to `/auth` with a `redirect` query so you can return afterward.

### What is the right VillagesML entry path?

Use `/explore/villages/ml` if you want the dashboard / discovery view first.
Use `/villagesML?module=...&subtab=...` if you already know which workspace module you want.

### What is the difference between `/menu/settings` and `/auth?view=profile`?

- `/menu/settings`: site language and interface settings
- `/auth?view=profile`: personal account overview

---

**Further reading:**

- [Architecture Guide](./ARCHITECTURE.en.md)
- [API Reference](./API.en.md)
- [VillagesML User Guide](./VillagesML/USER_GUIDE.md)
- [VillagesML Feature Overview](./VillagesML/FEATURE_OVERVIEW.md)
