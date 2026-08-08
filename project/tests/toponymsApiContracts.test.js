import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMock = vi.fn();

vi.mock('../src/api/auth/httpClient.js', () => ({
  api: apiMock,
}));

const { getToponymNames, getToponymPoints } = await import('../src/api/main/toponyms.js');

const testsDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testsDir, '..');

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8');
}

describe('toponyms API contracts', () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it('uses the real split toponyms endpoints', () => {
    const source = readSource('src/api/main/toponyms.js');

    expect(source).toContain('/api/toponyms/names');
    expect(source).toContain('/api/toponyms/points');
    expect(source).toContain('/api/toponyms/details');
    expect(source).toContain('https://dmfw.mca.gov.cn/9095/stname/detailsPub');
    expect(source).toContain('getToponymOfficialDetail');
    expect(source).toContain('TOPONYM_DEFAULT_POINT_LIMIT = 0');
    expect(source).toContain('parent_path');
    expect(source).toContain('page_size');
    expect(source).not.toContain('/api/toponyms/map');
  });

  it('guards details requests to the backend maximum of 10 ids', () => {
    const source = readSource('src/api/main/toponyms.js');

    expect(source).toContain('TOPONYM_DETAILS_ID_LIMIT');
    expect(source).toContain('ids cannot contain more than 10 values');
  });

  it('does not force a single place type when callers omit the filter', async () => {
    apiMock.mockResolvedValueOnce({
      items: [],
      count: 0,
      truncated: false,
      next: null,
    });

    await getToponymPoints({
      q: '黄',
      match_mode: 'prefix',
      limit: 0,
    });

    const calledUrl = apiMock.mock.calls[0][0];
    const query = new URL(`https://example.test${calledUrl}`).searchParams;

    expect(query.get('place_type_code')).toBeNull();
  });

  it('exports toponyms APIs from the shared API surface', () => {
    const source = readSource('src/api/index.js');

    expect(source).toContain('getToponymNames');
    expect(source).toContain('getToponymPoints');
    expect(source).toContain('getToponymOfficialDetail');
    expect(source).toContain('getToponymDetails');
    expect(source).toContain('./main/toponyms.js');
  });

  it('serializes lazy tree parent paths as repeated query params and keeps lazy response fields', async () => {
    apiMock.mockResolvedValueOnce({
      mode: 'lazy',
      level: 4,
      parent_path: ['安徽省', '池州市', '东至县', '木塔乡'],
      names: ['黄家垄', '黄屋'],
      page: 1,
      page_size: 100,
      has_more: true,
    });

    const payload = await getToponymNames({
      q: '黄',
      match_mode: 'prefix',
      place_type_code: '22200',
      include_division_tree: true,
      parent_path: ['安徽省', '池州市', '东至县', '木塔乡'],
      page: 1,
      page_size: 100,
    });

    const calledUrl = apiMock.mock.calls[0][0];
    const query = new URL(`https://example.test${calledUrl}`).searchParams;

    expect(query.getAll('parent_path')).toEqual(['安徽省', '池州市', '东至县', '木塔乡']);
    expect(query.get('page_size')).toBe('100');
    expect(payload).toMatchObject({
      mode: 'lazy',
      level: 4,
      parent_path: ['安徽省', '池州市', '东至县', '木塔乡'],
      names: ['黄家垄', '黄屋'],
      page: 1,
      page_size: 100,
      has_more: true,
    });
  });

  it('keeps lazy fallback bootstrap fields from tree responses', async () => {
    apiMock.mockResolvedValueOnce({
      mode: 'lazy_fallback',
      reason: 'tree_result_too_large',
      threshold: 5000,
      filtered_count: 59739,
      levels: 4,
      lazy_bootstrap: [
        {
          name: '广东省',
          level: 1,
          children: [{ name: '广州市', level: 2 }],
        },
      ],
    });

    const payload = await getToponymNames({
      q: '黄',
      match_mode: 'prefix',
      include_division_tree: true,
      limit: 0,
    });

    expect(payload).toMatchObject({
      mode: 'lazy_fallback',
      reason: 'tree_result_too_large',
      threshold: 5000,
      filtered_count: 59739,
      levels: 4,
      lazy_bootstrap: [
        {
          name: '广东省',
          level: 1,
          children: [{ name: '广州市', level: 2 }],
        },
      ],
    });
  });
});
