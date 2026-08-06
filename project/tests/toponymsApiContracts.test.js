import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testsDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testsDir, '..');

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8');
}

describe('toponyms API contracts', () => {
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

  it('exports toponyms APIs from the shared API surface', () => {
    const source = readSource('src/api/index.js');

    expect(source).toContain('getToponymNames');
    expect(source).toContain('getToponymPoints');
    expect(source).toContain('getToponymOfficialDetail');
    expect(source).toContain('getToponymDetails');
    expect(source).toContain('./main/toponyms.js');
  });
});
