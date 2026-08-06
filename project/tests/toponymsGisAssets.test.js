import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testsDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testsDir, '..');

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(projectRoot, relativePath), 'utf8'));
}

function countGeometryTypes(geoJson) {
  return (geoJson.features || []).reduce((counts, feature) => {
    const type = feature.geometry?.type || 'null';
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});
}

describe('toponyms GIS assets', () => {
  it('keeps country boundary as the only default GIS asset', () => {
    const source = readFileSync(
      resolve(projectRoot, 'src/main/views/explore/villages/toponyms/toponymsGisAssets.js'),
      'utf8'
    );

    expect(source).toContain("defaultBase: 'country'");
    expect(source).toContain('/data/gis/china_country.geojson');
    expect(source).toContain('/data/gis/china_provinces.geojson');
    expect(source).toContain('/data/gis/china_cities_simplified_light.geojson');
    expect(source).toContain('/data/gis/china_rivers_l1.geojson');
  });

  it('ships valid country, province, city, and river GeoJSON assets', () => {
    const country = readJson('public/data/gis/china_country.geojson');
    const provinces = readJson('public/data/gis/china_provinces.geojson');
    const cities = readJson('public/data/gis/china_cities_simplified_light.geojson');
    const rivers = readJson('public/data/gis/china_rivers_l1.geojson');

    expect(country.type).toBe('FeatureCollection');
    expect(provinces.type).toBe('FeatureCollection');
    expect(cities.type).toBe('FeatureCollection');
    expect(rivers.type).toBe('FeatureCollection');
    expect(countGeometryTypes(country)).toEqual({ MultiPolygon: 1 });
    expect(Object.keys(countGeometryTypes(provinces))).toEqual(
      expect.arrayContaining(['Polygon', 'MultiPolygon'])
    );
    expect(Object.keys(countGeometryTypes(cities))).toEqual(
      expect.arrayContaining(['Polygon', 'MultiPolygon'])
    );
    expect(Object.keys(countGeometryTypes(rivers))).toEqual(expect.arrayContaining(['LineString']));
  });
});
