# Leaderboard desktop category boundaries

## Goal

Make each major leaderboard category visually distinct in the desktop (landscape) table, so its endpoint rows are clearly understood as one group.

## Scope

- Change only the desktop table styles in `LeaderboardPanel.vue`.
- Add top and bottom borders to the existing row-spanning category summary cells (`category-cell` and `category-data`).
- Reuse the existing primary, gold, silver, and bronze category colours for those borders.

## Non-goals

- Do not change table markup, row construction, ranking logic, copy, mobile table, or responsive behaviour.
- Do not add cards, headers, shadows, or new colour tokens.

## Verification

- Build/lint the frontend using the available project script.
- Inspect the diff to confirm only the requested desktop category-boundary styles changed and that Chinese/emoji source text is unchanged.
