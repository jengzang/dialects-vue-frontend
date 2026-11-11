import { describe, expect, it } from 'vitest';

import {
  CUSTOM_REGION_MAX_LOCATIONS,
  GET_LOCS_EXPLICIT_LOCATIONS_LIMIT,
} from '../src/main/config/constants.js';
import {
  buildExplicitLocationsForGetLocs,
  isExplicitLocationsLimitExceeded,
} from '../src/main/utils/query/queryLimits.js';

describe('location query limits', () => {
  it('exports separate limits for query payloads and custom regions', () => {
    expect(GET_LOCS_EXPLICIT_LOCATIONS_LIMIT).toBe(1000);
    expect(CUSTOM_REGION_MAX_LOCATIONS).toBe(1000);
  });

  it('builds explicit get_locs locations from manual and custom-region sources only', () => {
    expect(
      buildExplicitLocationsForGetLocs({
        locations: ['廣州', '佛山', '廣州'],
        customRegionLocations: ['佛山', '深圳', '東莞'],
      }),
    ).toEqual(['廣州', '佛山', '深圳', '東莞']);
  });

  it('flags only explicit locations that exceed the get_locs payload limit', () => {
    const explicitLocations = Array.from({ length: 1001 }, (_, index) => `地點${index + 1}`);

    expect(isExplicitLocationsLimitExceeded(explicitLocations)).toBe(true);
    expect(isExplicitLocationsLimitExceeded(explicitLocations.slice(0, 1000))).toBe(false);
  });
});
