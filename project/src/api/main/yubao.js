// api/main/yubao.js - 语保（Yubao）业务接口
import { api } from '../auth/httpClient.js';
import { showError } from '@/utils/message.js';

function appendIfPresent(params, key, value) {
  if (value === undefined || value === null || value === '') {
    return;
  }
  params.append(key, String(value));
}

/**
 * 获取词汇候选列表
 * @param {{q?: string, limit?: number, all?: boolean}} [params={}]
 * @returns {Promise<{items: string[], total: number}>}
 */
export async function getYubaoVocabularyWords(params = {}) {
  try {
    const query = new URLSearchParams();
    appendIfPresent(query, 'q', params.q);
    appendIfPresent(query, 'limit', params.limit);
    if (params.all !== undefined) {
      query.append('all', String(Boolean(params.all)));
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return await api(`/api/yubao/vocabulary/words${suffix}`);
  } catch (error) {
    console.error('Get yubao vocabulary words error:', error);
    showError(error.message || '獲取語保詞彙候選失敗');
    throw new Error(error.message || '獲取語保詞彙候選失敗');
  }
}

/**
 * 获取语法候选列表
 * @param {{q?: string, limit?: number, all?: boolean}} [params={}]
 * @returns {Promise<{items: string[], total: number}>}
 */
export async function getYubaoGrammarSentences(params = {}) {
  try {
    const query = new URLSearchParams();
    appendIfPresent(query, 'q', params.q);
    appendIfPresent(query, 'limit', params.limit);
    if (params.all !== undefined) {
      query.append('all', String(Boolean(params.all)));
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return await api(`/api/yubao/grammar/sentences${suffix}`);
  } catch (error) {
    console.error('Get yubao grammar sentences error:', error);
    showError(error.message || '獲取語保語法候選失敗');
    throw new Error(error.message || '獲取語保語法候選失敗');
  }
}

/**
 * 按词汇查询明细
 * @param {{word: string, page?: number, page_size?: number, sort_by?: string, sort_desc?: boolean}} params
 * @returns {Promise<{items: Array<object>, total: number, page: number, page_size: number}>}
 */
export async function getYubaoVocabularyItems(params) {
  try {
    const query = new URLSearchParams();
    appendIfPresent(query, 'word', params?.word);
    appendIfPresent(query, 'page', params?.page);
    appendIfPresent(query, 'page_size', params?.page_size);
    appendIfPresent(query, 'sort_by', params?.sort_by);
    if (params?.sort_desc !== undefined) {
      query.append('sort_desc', String(Boolean(params.sort_desc)));
    }
    return await api(`/api/yubao/vocabulary/items?${query.toString()}`);
  } catch (error) {
    console.error('Get yubao vocabulary items error:', error);
    showError(error.message || '獲取語保詞彙明細失敗');
    throw new Error(error.message || '獲取語保詞彙明細失敗');
  }
}

/**
 * 按语法句查询明细
 * @param {{sentence: string, page?: number, page_size?: number, sort_by?: string, sort_desc?: boolean}} params
 * @returns {Promise<{items: Array<object>, total: number, page: number, page_size: number}>}
 */
export async function getYubaoGrammarItems(params) {
  try {
    const query = new URLSearchParams();
    appendIfPresent(query, 'sentence', params?.sentence);
    appendIfPresent(query, 'page', params?.page);
    appendIfPresent(query, 'page_size', params?.page_size);
    appendIfPresent(query, 'sort_by', params?.sort_by);
    if (params?.sort_desc !== undefined) {
      query.append('sort_desc', String(Boolean(params.sort_desc)));
    }
    return await api(`/api/yubao/grammar/items?${query.toString()}`);
  } catch (error) {
    console.error('Get yubao grammar items error:', error);
    showError(error.message || '獲取語保語法明細失敗');
    throw new Error(error.message || '獲取語保語法明細失敗');
  }
}
