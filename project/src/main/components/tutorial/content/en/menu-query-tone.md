# Tone Query

This is one of the simplest query pages: no need to enter characters or Middle Chinese conditions — just pick which locations or regions to query, and you can directly view tone values and tone categories for each location.

## What you'll see on this page

- This tab has no additional upper filter area.
- The main interactive element is the location / region input component below.
- After clicking Run, the system navigates to the results page, which loads data in "tone query" mode.

## Best workflow for beginners

1. Pick a few locations you're interested in, or pick one region first.
2. For the first try, avoid selecting too many locations at once — the tone table will be too spread out.
3. Click Run, then review tone categories, tone values, and their relationships across locations on the results page.

## How this page actually works

- No additional filter conditions are needed — the core constraint is just locations / regions.
- The query only passes locations, regions, and region_mode to the results page.
- The results page calls the tone query API, so what you see after clicking the button is a page navigation, not an in-page refresh.

## Tips to stay organized

- If you just want to see the tone system of a few specific locations, entering locations directly is fastest.
- If you want to see the tone distribution across a broader area, pick a region first, then read the results.
- If there's too much data, narrow the scope first, then observe tone class names and values — avoid reading everything at once.

## Common stumbling blocks

- Can't see differences: usually too many locations selected. Narrow the scope first.
- Not sure whether to look at tone classes or tone values first: start with the category names, then look at the specific numbers.
- Thinking this page has no content: it's actually a shortcut entry for "query tones directly by location." The focus is not on the upper section, but on the location conditions and the results page.

## When to use a different page

- To compare whether two tone classes have merged: switch to Compare Tones.
- To approach from characters or Middle Chinese conditions: switch to Query Characters, Query Middle Chinese, or Query Phonemes.