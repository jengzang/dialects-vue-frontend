function isPresentCoordinate(value) {
  return value !== '' && value !== null && value !== undefined;
}

function toCoordinatePair(longitude, latitude) {
  if (!isPresentCoordinate(longitude) || !isPresentCoordinate(latitude)) {
    return null;
  }

  const lng = Number(longitude);
  const lat = Number(latitude);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
  return [lng, lat];
}

export function buildToponymScatterData(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const id = String(item?.id || '').trim();
      const value = toCoordinatePair(item?.longitude, item?.latitude);
      if (!id || !value) return null;

      return {
        id,
        name: id,
        value,
      };
    })
    .filter(Boolean);
}

export function extractToponymPointFromChartParams(params) {
  const data = params?.data || {};
  const id = String(data.id || data.name || '').trim();
  const coordinates = Array.isArray(data.value) ? data.value.slice(0, 2) : [];

  if (!id || coordinates.length !== 2) {
    return null;
  }

  return { id, coordinates };
}

function pushLineString(lines, feature, coordinates) {
  const cleanCoords = (Array.isArray(coordinates) ? coordinates : [])
    .map((coord) => toCoordinatePair(coord?.[0], coord?.[1]))
    .filter(Boolean);

  if (cleanCoords.length < 2) return;

  lines.push({
    name: feature?.properties?.name || '',
    coords: cleanCoords,
    level: feature?.properties?.level || '',
  });
}

export function buildRiverLineSeriesData(geoJson) {
  const lines = [];
  const features = Array.isArray(geoJson?.features) ? geoJson.features : [];

  features.forEach((feature) => {
    const geometry = feature?.geometry;
    if (geometry?.type === 'LineString') {
      pushLineString(lines, feature, geometry.coordinates);
    }
    if (geometry?.type === 'MultiLineString') {
      (geometry.coordinates || []).forEach((coordinates) => {
        pushLineString(lines, feature, coordinates);
      });
    }
  });

  return lines;
}

export function getToponymPointExtent(scatterData = []) {
  const coordinates = (Array.isArray(scatterData) ? scatterData : [])
    .map((item) => (Array.isArray(item?.value) ? item.value.slice(0, 2) : null))
    .filter(Boolean);

  if (!coordinates.length) {
    return null;
  }

  return coordinates.reduce(
    (extent, [lng, lat]) => ({
      minLng: Math.min(extent.minLng, lng),
      minLat: Math.min(extent.minLat, lat),
      maxLng: Math.max(extent.maxLng, lng),
      maxLat: Math.max(extent.maxLat, lat),
    }),
    {
      minLng: coordinates[0][0],
      minLat: coordinates[0][1],
      maxLng: coordinates[0][0],
      maxLat: coordinates[0][1],
    }
  );
}
