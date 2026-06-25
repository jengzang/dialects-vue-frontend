import { api } from '../../auth/httpClient.js';
import { showError } from '@/utils/message.js';

export async function getUserPoints(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    const queryString = query.toString();
    return await api(`/user/custom/points${queryString ? `?${queryString}` : ''}`);
  } catch (error) {
    showError(error.message || '獲取方言點列表失敗');
    throw error;
  }
}

export async function getUserFeatures(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    const queryString = query.toString();
    return await api(`/user/custom/features${queryString ? `?${queryString}` : ''}`);
  } catch (error) {
    showError(error.message || '獲取特徵列表失敗');
    throw error;
  }
}

export async function getDataByPoint(location, region) {
  try {
    const query = new URLSearchParams();
    query.append('location', location || '');
    query.append('region', region || '');
    return await api(`/user/custom/data-by-point?${query.toString()}`);
  } catch (error) {
    showError(error.message || '獲取地點數據失敗');
    throw error;
  }
}

export async function getDataByFeature(feature, phonology) {
  try {
    const query = new URLSearchParams();
    query.append('feature', feature);
    query.append('phonology', phonology || '');
    return await api(`/user/custom/data-by-feature?${query.toString()}`);
  } catch (error) {
    showError(error.message || '獲取特徵數據失敗');
    throw error;
  }
}
