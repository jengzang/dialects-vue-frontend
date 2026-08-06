import { api } from '../auth/httpClient.js';

export const TOPONYM_DEFAULT_PLACE_TYPE_CODE = '22200';
export const TOPONYM_DEFAULT_POINT_LIMIT = 0;
export const TOPONYM_DEFAULT_NAME_LIMIT = 20;
export const TOPONYM_DETAILS_ID_LIMIT = 10;

const OFFICIAL_DETAIL_URL = 'https://dmfw.mca.gov.cn/9095/stname/detailsPub';
const MATCH_MODES = new Set(['prefix', 'suffix', 'exact', 'contains']);

function normalizeMatchMode(value) {
  return MATCH_MODES.has(value) ? value : 'prefix';
}

function normalizeLimit(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : fallback;
}

function appendCommonSearchParams(query, params = {}, defaultLimit) {
  const keyword = String(params.q || '').trim();
  if (!keyword) {
    throw new Error('toponyms query cannot be empty');
  }

  query.set('q', keyword);
  query.set('match_mode', normalizeMatchMode(params.match_mode));
  query.set('limit', String(normalizeLimit(params.limit, defaultLimit)));
  query.set('place_type_code', String(params.place_type_code || TOPONYM_DEFAULT_PLACE_TYPE_CODE));

  if (params.bbox) {
    query.set('bbox', String(params.bbox));
  }

  if (params.zoom !== undefined && params.zoom !== null && params.zoom !== '') {
    query.set('zoom', String(params.zoom));
  }
}

function getFastApiErrorMessage(error, fallback) {
  const detail = error?.detail ?? error?.response?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.message || String(item))
      .filter(Boolean)
      .join('; ');
  }

  return error?.message || fallback;
}

function normalizeOfficialDetail(payload) {
  const detail = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  if (!detail || typeof detail !== 'object') {
    return null;
  }

  const areaName = detail.area_name || detail.areaName || '';
  const cityName = detail.city_name || detail.cityName || '';
  const oldName = detail.old_name || detail.oldName || '';

  if (!areaName && !cityName && !oldName) {
    return null;
  }

  return {
    source: 'official',
    areaName,
    cityName,
    oldName,
    raw: detail,
  };
}

export async function getToponymNames(params = {}) {
  const query = new URLSearchParams();
  appendCommonSearchParams(query, params, TOPONYM_DEFAULT_NAME_LIMIT);

  if (params.include_division_tree) {
    query.set('include_division_tree', 'true');
  }
  if (params.parent_path) {
    query.set('parent_path', String(params.parent_path));
  }
  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', String(params.page));
  }
  if (params.page_size !== undefined && params.page_size !== null && params.page_size !== '') {
    query.set('page_size', String(params.page_size));
  }

  try {
    const payload = await api(`/api/toponyms/names?${query.toString()}`);
    return {
      items: Array.isArray(payload?.items) ? payload.items : [],
      mode: payload?.mode || 'full_tree',
      page: payload?.page ?? null,
      page_size: payload?.page_size ?? null,
      has_more: Boolean(payload?.has_more),
    };
  } catch (error) {
    throw new Error(getFastApiErrorMessage(error, 'failed to load toponym names'));
  }
}

export async function getToponymPoints(params = {}) {
  const query = new URLSearchParams();
  appendCommonSearchParams(query, params, TOPONYM_DEFAULT_POINT_LIMIT);

  try {
    const payload = await api(`/api/toponyms/points?${query.toString()}`);
    return {
      items: Array.isArray(payload?.items) ? payload.items : [],
      count: Number(payload?.count || 0),
      truncated: Boolean(payload?.truncated),
      next: payload?.next || null,
    };
  } catch (error) {
    throw new Error(getFastApiErrorMessage(error, 'failed to load toponym points'));
  }
}

export async function getToponymDetails(ids) {
  const uniqueIds = Array.from(
    new Set(
      (Array.isArray(ids) ? ids : [ids])
        .map((id) => String(id || '').trim())
        .filter(Boolean)
    )
  );

  if (uniqueIds.length === 0) {
    return { items: [], count: 0 };
  }

  if (uniqueIds.length > TOPONYM_DETAILS_ID_LIMIT) {
    throw new Error('ids cannot contain more than 10 values');
  }

  const query = new URLSearchParams();
  query.set('ids', uniqueIds.join(','));

  try {
    const payload = await api(`/api/toponyms/details?${query.toString()}`);
    return {
      items: Array.isArray(payload?.items) ? payload.items : [],
      count: Number(payload?.count || 0),
    };
  } catch (error) {
    throw new Error(getFastApiErrorMessage(error, 'failed to load toponym details'));
  }
}

export async function getToponymOfficialDetail(id, options = {}) {
  const normalizedId = String(id || '').trim();
  if (!normalizedId) {
    throw new Error('toponym id cannot be empty');
  }

  const response = await fetch(OFFICIAL_DETAIL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: normalizedId }),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`official toponym detail request failed: ${response.status}`);
  }

  const payload = await response.json();
  const detail = normalizeOfficialDetail(payload);
  if (!detail) {
    throw new Error('official toponym detail is empty');
  }

  return detail;
}
