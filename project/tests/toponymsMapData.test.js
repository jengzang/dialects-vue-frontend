import { describe, expect, it } from 'vitest';
import {
  buildEmptyToponymsFeatureCollection,
  buildToponymPointFeatureCollection,
  getToponymFeatureIdentity,
} from '../src/main/views/explore/villages/toponyms/toponymsMapData.js';

describe('toponyms map data helpers', () => {
  it('builds an empty FeatureCollection', () => {
    expect(buildEmptyToponymsFeatureCollection()).toEqual({
      type: 'FeatureCollection',
      features: [],
    });
  });

  it('converts id-only point responses to GeoJSON and drops invalid coordinates', () => {
    const collection = buildToponymPointFeatureCollection([
      { id: 'a', longitude: 114.1, latitude: 22.2 },
      { id: 'bad', longitude: 999, latitude: 22.2 },
      { id: 'missing', longitude: '', latitude: 22.2 },
    ]);

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0]).toEqual({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [114.1, 22.2] },
      properties: { id: 'a' },
    });
  });

  it('returns selected feature identity without assuming a name is available', () => {
    const feature = {
      type: 'Feature',
      properties: { id: 'abc' },
      geometry: { type: 'Point', coordinates: [114.1, 22.2] },
    };

    expect(getToponymFeatureIdentity(feature)).toEqual({
      id: 'abc',
      coordinates: [114.1, 22.2],
      properties: { id: 'abc' },
    });
  });
});
