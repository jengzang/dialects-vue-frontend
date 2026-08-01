import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testsDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testsDir, '..');

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8');
}

describe('toponyms page shell', () => {
  it('wires split toponyms APIs without first-paint point loading', () => {
    const page = readSource('src/main/views/explore/villages/toponyms/ToponymsPage.vue');

    expect(page).toContain('getToponymNames');
    expect(page).toContain('getToponymPoints');
    expect(page).toContain('getToponymDetails');
    expect(page).toContain('getToponymOfficialDetail');
    expect(page).toContain('loadToponymsGisAsset(\'country\')');
    expect(page).toContain('const hasSearched = ref(false)');
    expect(page).toContain('async function handleSearch');
    expect(page).toContain('async function handleSelectPoint');
    expect(page).toContain('async function handleOfficialDetailRequest');
    expect(page).not.toContain('/api/toponyms/map');
    expect(page).not.toContain('onMounted(handleSearch');
  });

  it('uses dedicated shell components for horizontal search, optional layers, results, and details', () => {
    const page = readSource('src/main/views/explore/villages/toponyms/ToponymsPage.vue');
    const searchBar = readSource('src/main/views/explore/villages/toponyms/ToponymSearchBar.vue');
    const layerControls = readSource('src/main/views/explore/villages/toponyms/ToponymLayerControls.vue');
    const resultsPanel = readSource('src/main/views/explore/villages/toponyms/ToponymResultsPanel.vue');
    const detailPanel = readSource('src/main/views/explore/villages/toponyms/ToponymDetailPanel.vue');

    expect(page).toContain('<ToponymSearchBar');
    expect(page).toContain('<ToponymLayerControls');
    expect(page).toContain('<ToponymResultsPanel');
    expect(page).toContain(':suggestions="suggestions"');
    expect(page).toContain(':local-detail="selectedLocalDetail"');
    expect(searchBar).toContain('<SimpleSelectDropdown');
    expect(searchBar).toContain('class="toponym-search-bar__form"');
    expect(searchBar).toContain('@submit.prevent');
    expect(layerControls).toContain('riverL1');
    expect(layerControls).toContain('riverL2');
    expect(layerControls).toContain('riverL3');
    expect(resultsPanel).toContain('<ToponymDetailPanel');
    expect(detailPanel).toContain("emit('request-official-detail')");
  });

  it('keeps toponyms component styles scoped, tokenized, nested, and aspect-ratio responsive', () => {
    const files = [
      'src/main/views/explore/villages/toponyms/ToponymsPage.vue',
      'src/main/views/explore/villages/toponyms/ToponymSearchBar.vue',
      'src/main/views/explore/villages/toponyms/ToponymLayerControls.vue',
      'src/main/views/explore/villages/toponyms/ToponymResultsPanel.vue',
      'src/main/views/explore/villages/toponyms/ToponymDetailPanel.vue',
    ];

    for (const file of files) {
      const source = readSource(file);
      expect(source).toContain('<style scoped lang="scss">');
      expect(source).toContain("@use '@/styles/global/mixins' as *;");
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}/);
      expect(source).not.toMatch(/@media\s*\((?:max|min)-width/);
    }

    expect(readSource(files[0])).toContain('@media (max-aspect-ratio: 1 / 1)');
  });
});
