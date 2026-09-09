import { describe, expect, it, vi } from 'vitest';

import {
  resolvePhonologyActionLocation,
  resolvePhonologyActionLocations,
} from '../src/main/utils/phonology/actionLocationResolver.js';

describe('phonology action location resolver', () => {
  it('normalizes external action locations through get_locs before querying phonology data', async () => {
    const getLocations = vi.fn().mockResolvedValue({
      locations_result: ['廣州', '廣州', '香港'],
    });

    await expect(
      resolvePhonologyActionLocations(['广州', '香港'], getLocations, { limit: 2 }),
    ).resolves.toEqual(['廣州', '香港']);

    expect(getLocations).toHaveBeenCalledWith({ locations: ['广州', '香港'] });
  });

  it('returns no locations when get_locs cannot match the external action location', async () => {
    const getLocations = vi.fn().mockResolvedValue({ locations_result: [] });

    await expect(
      resolvePhonologyActionLocations(['不存在地點'], getLocations, { limit: 1 }),
    ).resolves.toEqual([]);
  });

  it('normalizes the detail row abbreviation before popup actions', async () => {
    const getLocations = vi.fn().mockResolvedValue({
      locations_result: ['廣州'],
    });

    await expect(
      resolvePhonologyActionLocation(
        {
          detailRow: { 簡稱: '廣州' },
          fallbackName: '广州',
        },
        getLocations,
      ),
    ).resolves.toBe('廣州');

    expect(getLocations).toHaveBeenCalledWith({ locations: ['廣州'] });
  });

  it('falls back to get_locs when a popup has no detail abbreviation', async () => {
    const getLocations = vi.fn().mockResolvedValue({
      locations_result: ['廣州'],
    });

    await expect(
      resolvePhonologyActionLocation(
        {
          detailRow: null,
          fallbackName: '广州',
        },
        getLocations,
      ),
    ).resolves.toBe('廣州');
  });
});
