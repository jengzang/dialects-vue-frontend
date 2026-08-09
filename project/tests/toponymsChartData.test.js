import { describe, expect, it } from 'vitest';
import {
  buildRiverLineSeriesData,
  buildToponymScatterData,
  extractToponymPointFromChartParams,
  findNearestToponymPoint,
  getToponymPointExtent,
} from '../src/main/views/explore/villages/toponyms/toponymsChartData.js';

describe('toponyms ECharts data helpers', () => {
  it('converts id-only points to ECharts scatter data and drops invalid coordinates', () => {
    const data = buildToponymScatterData([
      { id: 'a', longitude: 114.1, latitude: 22.2 },
      { id: 'bad-lng', longitude: 999, latitude: 22.2 },
      { id: 'empty-lng', longitude: '', latitude: 22.2 },
      { id: '', longitude: 114.1, latitude: 22.2 },
    ]);

    expect(data).toEqual([
      {
        id: 'a',
        name: 'a',
        value: [114.1, 22.2],
      },
    ]);
  });

  it('extracts selected point identity from ECharts click params without assuming a name', () => {
    expect(
      extractToponymPointFromChartParams({
        componentType: 'series',
        seriesType: 'scatter',
        data: { id: 'abc', value: [114.1, 22.2] },
      })
    ).toEqual({
      id: 'abc',
      coordinates: [114.1, 22.2],
    });
  });

  it('finds the nearest toponym point within a click tolerance', () => {
    const data = [
      { id: 'far', value: [110, 20] },
      { id: 'near', value: [113.05, 23.02] },
      { id: 'outside', value: [113.6, 23.6] },
    ];

    expect(findNearestToponymPoint(data, [113, 23], 0.1)).toEqual({
      id: 'near',
      coordinates: [113.05, 23.02],
    });
    expect(findNearestToponymPoint(data, [113, 23], 0.01)).toBeNull();
  });

  it('converts river GeoJSON lines into ECharts line segments', () => {
    const data = buildRiverLineSeriesData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: '河流', level: 'river_l1' },
          geometry: { type: 'LineString', coordinates: [[110, 20], [111, 21], [112, 22]] },
        },
      ],
    });

    expect(data).toEqual([
      {
        name: '河流',
        coords: [[110, 20], [111, 21], [112, 22]],
        level: 'river_l1',
      },
    ]);
  });

  it('computes extent for valid scatter data', () => {
    expect(
      getToponymPointExtent([
        { id: 'a', value: [110, 20] },
        { id: 'b', value: [120, 30] },
      ])
    ).toEqual({
      minLng: 110,
      minLat: 20,
      maxLng: 120,
      maxLat: 30,
    });
  });
});
