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

function cleanRing(ring) {
  return (Array.isArray(ring) ? ring : [])
    .map((coord) => toCoordinatePair(coord?.[0], coord?.[1]))
    .filter(Boolean);
}

export function extractPolygonFeatures(geoJson) {
  const features = Array.isArray(geoJson?.features) ? geoJson.features : [];
  return features
    .map((feature) => {
      const geometry = feature?.geometry;
      if (!geometry) return null;
      if (geometry.type === 'Polygon') {
        return (geometry.coordinates || []).map(cleanRing).filter((ring) => ring.length >= 3);
      }
      if (geometry.type === 'MultiPolygon') {
        return (geometry.coordinates || []).flatMap(
          (polygon) => (polygon || []).map(cleanRing).filter((ring) => ring.length >= 3)
        );
      }
      return null;
    })
    .filter((rings) => rings && rings.length > 0);
}

export function buildBoundaryLineSeriesData(geoJson) {
  const lines = [];
  const features = Array.isArray(geoJson?.features) ? geoJson.features : [];

  features.forEach((feature) => {
    const geometry = feature?.geometry;
    const rings = [];
    if (geometry?.type === 'Polygon') {
      rings.push(...(geometry.coordinates || []));
    } else if (geometry?.type === 'MultiPolygon') {
      (geometry.coordinates || []).forEach((polygon) => {
        rings.push(...(polygon || []));
      });
    }
    rings.forEach((ring) => {
      pushLineString(lines, feature, ring);
    });
  });

  return lines;
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

export function findNearestToponymPoint(data, target, tolerance) {
  if (!Array.isArray(data) || !Array.isArray(target) || target.length < 2) return null;
  const maxDist = Number(tolerance);
  if (!Number.isFinite(maxDist) || maxDist <= 0) return null;

  let best = null;
  let bestDist = Infinity;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const value = item?.value;
    if (!Array.isArray(value) || value.length < 2) continue;
    const dlng = Number(value[0]) - Number(target[0]);
    const dlat = Number(value[1]) - Number(target[1]);
    const dist = Math.sqrt(dlng * dlng + dlat * dlat);
    if (dist <= maxDist && dist < bestDist) {
      bestDist = dist;
      best = { id: String(item.id || ''), coordinates: [Number(value[0]), Number(value[1])] };
    }
  }

  return best;
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
