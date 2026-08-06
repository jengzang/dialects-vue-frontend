export const TOPONYMS_GIS_ASSETS = {
  defaultBase: 'country',
  country: {
    key: 'country',
    labelKey: 'villages.pages.toponyms.layers.country',
    path: '/data/gis/china_country.geojson',
    kind: 'map',
    defaultVisible: true,
  },
  provinces: {
    key: 'provinces',
    labelKey: 'villages.pages.toponyms.layers.provinces',
    path: '/data/gis/china_provinces.geojson',
    kind: 'map-overlay',
    defaultVisible: false,
  },
  cities: {
    key: 'cities',
    labelKey: 'villages.pages.toponyms.layers.cities',
    path: '/data/gis/china_cities_simplified_light.geojson',
    kind: 'map-overlay',
    defaultVisible: false,
  },
  riverL1: {
    key: 'riverL1',
    labelKey: 'villages.pages.toponyms.layers.riverL1',
    path: '/data/gis/china_rivers_l1.geojson',
    kind: 'river',
    defaultVisible: false,
  },
  riverL2: {
    key: 'riverL2',
    labelKey: 'villages.pages.toponyms.layers.riverL2',
    path: '/data/gis/china_rivers_l2.geojson',
    kind: 'river',
    defaultVisible: false,
  },
  riverL3: {
    key: 'riverL3',
    labelKey: 'villages.pages.toponyms.layers.riverL3',
    path: '/data/gis/china_rivers_l3.geojson',
    kind: 'river',
    defaultVisible: false,
  },
};

const gisAssetCache = new Map();

export function getDefaultToponymsLayerState() {
  return Object.fromEntries(
    Object.values(TOPONYMS_GIS_ASSETS)
      .filter((asset) => asset.key)
      .map((asset) => [asset.key, Boolean(asset.defaultVisible)])
  );
}

export async function loadToponymsGisAsset(key) {
  const asset = TOPONYMS_GIS_ASSETS[key];
  if (!asset?.path) {
    throw new Error(`unknown toponyms GIS asset: ${key}`);
  }

  if (!gisAssetCache.has(key)) {
    gisAssetCache.set(
      key,
      fetch(asset.path).then(async (response) => {
        if (!response.ok) {
          throw new Error(`failed to load GIS asset: ${asset.path}`);
        }
        return response.json();
      })
    );
  }

  return gisAssetCache.get(key);
}

export function clearToponymsGisAssetCache() {
  gisAssetCache.clear();
}
