export function buildEmptyToponymsFeatureCollection() {
  return {
    type: 'FeatureCollection',
    features: [],
  };
}

function isValidCoordinate(longitude, latitude) {
  if (longitude === '' || latitude === '' || longitude == null || latitude == null) {
    return false;
  }

  const lng = Number(longitude);
  const lat = Number(latitude);

  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

export function buildToponymPointFeatureCollection(items = []) {
  return {
    type: 'FeatureCollection',
    features: (Array.isArray(items) ? items : [])
      .map((item) => {
        if (!item?.id || !isValidCoordinate(item.longitude, item.latitude)) {
          return null;
        }

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [Number(item.longitude), Number(item.latitude)],
          },
          properties: {
            id: String(item.id),
          },
        };
      })
      .filter(Boolean),
  };
}

export function getToponymFeatureIdentity(feature) {
  const coordinates = feature?.geometry?.coordinates;

  return {
    id: feature?.properties?.id == null ? '' : String(feature.properties.id),
    coordinates: Array.isArray(coordinates) ? coordinates : [],
    properties: feature?.properties || {},
  };
}
