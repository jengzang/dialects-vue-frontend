import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testsDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testsDir, '..');

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8');
}

function functionBody(source, functionName) {
  const start = source.indexOf(`function ${functionName}`);
  if (start === -1) return '';
  const nextFunction = source.indexOf('\nasync function ', start + 1);
  const nextPlainFunction = source.indexOf('\nfunction ', start + 1);
  const candidates = [nextFunction, nextPlainFunction].filter((index) => index > start);
  const end = candidates.length ? Math.min(...candidates) : source.length;
  return source.slice(start, end);
}

describe('toponyms page shell', () => {
  it('builds the independent toponym catalog search page with shared glass and selector primitives', () => {
    const page = readSource('src/main/views/explore/villages/toponyms/ToponymSearchPage.vue');

    expect(page).toContain('getToponymSearch');
    expect(page).toContain("import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue'");
    expect(page).toContain("import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'");
    expect(page).toContain('class="toponym-search-page glass-shell"');
    expect(page).toContain('class="toponym-search-page__header glass-panel"');
    expect(page).toContain('class="toponym-search-page__results glass-panel"');
    expect(page).toContain('class="toponym-search-page__detail glass-panel"');
    expect(page).toContain('class="toponym-search-page__result-grid main-card-grid"');
    expect(page).toContain('class="toponym-search-page__result-card glass-card"');
    expect(page).toContain('data-interactive="true"');
    expect(page).toContain('<SimpleSelectDropdown');
    expect(page).toContain('<MultiSelectDropdown');
    expect(page).toContain('class="toponym-search-page__select-trigger select-trigger"');
    expect(page).toContain('@submit.prevent="handleSearch"');
    expect(page).toContain('const selectedPlaceTypeCodes = ref([');
    expect(page).toContain('place_type_code: selectedPlaceTypeCodes.value');
    expect(page).toContain('const limit = ref(50)');
    expect(page).not.toContain('getToponymPoints');
    expect(page).not.toContain('/api/toponyms/points');
    expect(page).not.toContain('watch([query');
    expect(page).not.toContain('main-glass');
    expect(page).not.toContain('main-search-field');
    expect(page).not.toMatch(/@media\s*\((?:max|min)-width/);
  });

  it('loads catalog entry details only after result clicks and keeps distribution navigation separate', () => {
    const page = readSource('src/main/views/explore/villages/toponyms/ToponymSearchPage.vue');
    const searchBody = functionBody(page, 'handleSearch');
    const detailBody = functionBody(page, 'handleSelectResult');
    const distributionBody = functionBody(page, 'handleViewDistribution');

    expect(page).toContain("import { getToponymDetails, getToponymSearch } from '@/api'");
    expect(page).toContain('const router = useRouter()');
    expect(page).toContain('@click="handleSelectResult(item)"');
    expect(page).toContain(':aria-pressed="selectedItem?.id === item.id"');
    expect(page).toContain('selectedLocalDetail');
    expect(page).toContain('detailsLoading');
    expect(page).toContain('detailsError');
    expect(page).toContain('class="toponym-search-page__detail-list glass-subpanel"');
    expect(page).toContain('@click="handleViewDistribution"');
    expect(searchBody).not.toContain('getToponymDetails');
    expect(detailBody).toContain('const id = item?.id');
    expect(detailBody).toContain('const payload = await getToponymDetails(id)');
    expect(detailBody).not.toContain('getToponymPoints');
    expect(distributionBody).toContain("path: '/explore/villages/toponyms'");
    expect(distributionBody).toContain('q: query.value.trim()');
    expect(distributionBody).toContain('match_mode: matchMode.value');
    expect(distributionBody).not.toContain('place_type_code');
    expect(distributionBody).not.toContain('area_code');
    expect(page).not.toContain('/api/toponyms/points');
  });

  it('wires split toponyms APIs without first-paint point loading', () => {
    const page = readSource('src/main/views/explore/villages/toponyms/ToponymsPage.vue');

    expect(page).toContain('getToponymNames');
    expect(page).toContain('getToponymPoints');
    expect(page).toContain('getToponymDetails');
    expect(page).toContain('getToponymOfficialDetail');
    expect(page).toContain('loadToponymsGisAsset(\'country\')');
    expect(page).toContain('const hasSearched = ref(false)');
    expect(page).toContain('async function handleSearch');
    expect(page).toContain('async function handleNameTreeRequest');
    expect(page).toContain('async function handleSelectPoint');
    expect(page).toContain('async function handleLocalDetailRequest');
    expect(page).toContain('async function handleOfficialDetailRequest');
    expect(page).not.toContain('/api/toponyms/map');
    expect(page).not.toContain('onMounted(handleSearch');
  });

  it('uses dedicated shell components for horizontal search, optional layers, results, and details', () => {
    const page = readSource('src/main/views/explore/villages/toponyms/ToponymsPage.vue');
    const chart = readSource('src/main/views/explore/villages/toponyms/ToponymDistributionChart.vue');
    const searchBar = readSource('src/main/views/explore/villages/toponyms/ToponymSearchBar.vue');
    const layerControls = readSource('src/main/views/explore/villages/toponyms/ToponymLayerControls.vue');
    const resultsPanel = readSource('src/main/views/explore/villages/toponyms/ToponymResultsPanel.vue');
    const detailPanel = readSource('src/main/views/explore/villages/toponyms/ToponymDetailPanel.vue');

    expect(page).toContain('<ToponymSearchBar');
    expect(chart).toContain('<ToponymLayerControls');
    expect(page).toContain('<ToponymResultsPanel');
    expect(page).toContain(':name-tree="nameTree"');
    expect(page).toContain(':name-tree-meta="nameTreeMeta"');
    expect(page).toContain('@request-name-tree="handleNameTreeRequest"');
    expect(page).toContain('@expand-name-tree-node="handleNameTreeNodeExpand"');
    expect(page).toContain('@load-more-name-tree-names="handleNameTreeNamesMore"');
    expect(page).toContain('<HoverDetailCard');
    expect(searchBar).toContain('<SimpleSelectDropdown');
    expect(searchBar).toContain('class="toponym-search-bar__form"');
    expect(searchBar).toContain('@submit.prevent');
    expect(searchBar).not.toContain('pointLimit');
    expect(searchBar).not.toContain('toponyms.search.limit');
    expect(searchBar).not.toContain('placeTypeCode');
    expect(searchBar).not.toContain('placeTypeOptions');
    expect(searchBar).not.toContain('toponyms.search.placeType');
    expect(layerControls).toContain('riverL1');
    expect(layerControls).toContain('riverL2');
    expect(layerControls).toContain('riverL3');
    expect(resultsPanel).not.toContain('<ToponymDetailPanel');
    expect(resultsPanel).toContain("emit('request-name-tree')");
    expect(resultsPanel).toContain("emit('expand-name-tree-node'");
    expect(resultsPanel).toContain("emit('load-more-name-tree-names'");
    expect(resultsPanel).toContain('toponym-results-panel__name-tree');
    expect(resultsPanel).toContain('flattenNameTreeNodes');
    expect(resultsPanel).toContain('!nameTreeLoading && !nameTreeRows.length');
    expect(detailPanel).toContain("emit('request-local-detail')");
    expect(detailPanel).toContain("emit('request-official-detail')");
  });

  it('loads full point results and only fetches name trees on explicit request', () => {
    const page = readSource('src/main/views/explore/villages/toponyms/ToponymsPage.vue');
    const searchBar = readSource('src/main/views/explore/villages/toponyms/ToponymSearchBar.vue');
    const searchBody = functionBody(page, 'handleSearch');
    const nameTreeBody = functionBody(page, 'handleNameTreeRequest');

    expect(searchBody).toContain('limit: 0');
    expect(page).toContain("const TOPONYM_VILLAGE_PLACE_TYPE_CODES = ['22200', '21610', '27610']");
    expect(searchBody).toContain('place_type_code: TOPONYM_VILLAGE_PLACE_TYPE_CODES');
    expect(searchBody).toContain('lastPointSearchParams.value = searchParams');
    expect(searchBody).not.toContain('pointLimit.value');
    expect(nameTreeBody).toContain('getToponymNames');
    expect(nameTreeBody).toContain('const searchParams = lastPointSearchParams.value');
    expect(nameTreeBody).toContain('include_division_tree: true');
    expect(nameTreeBody).toContain('normalizeToponymNameTreePayload');
    expect(nameTreeBody).not.toContain('query.value.trim()');
    expect(page).toContain('async function handleNameTreeNodeExpand');
    expect(page).toContain('async function handleNameTreeNamesMore');
    expect(page).toContain('parent_path: node.path');
    expect(page).toContain('page_size: TOPONYM_NAME_TREE_PAGE_SIZE');
    expect(page).toContain('mergeLazyTreePayload');
    expect(functionBody(page, 'mergeLazyTreePayload').indexOf('Array.isArray(payload.names)')).toBeLessThan(
      functionBody(page, 'mergeLazyTreePayload').indexOf('Array.isArray(payload.children)')
    );
    expect(page).toContain('lazy_bootstrap');
    expect(page).toContain('lazyBootstrap: true');
    expect(page).toContain('expanded: true');
    expect(page).not.toContain('const placeTypeCode');
    expect(page).not.toContain('v-model:place-type-code');
    expect(page).not.toContain('place_type_code: placeTypeCode.value');
    expect(page).not.toContain('watch([query, matchMode, placeTypeCode]');
    expect(page).not.toContain('scheduleSuggestionLoad');
    expect(page).not.toContain('loadSuggestions');
    expect(searchBar).not.toContain("emit('update:pointLimit'");
  });

  it('opens point detail cards without exposing ids or auto-fetching details', () => {
    const page = readSource('src/main/views/explore/villages/toponyms/ToponymsPage.vue');
    const chart = readSource('src/main/views/explore/villages/toponyms/ToponymDistributionChart.vue');
    const detailPanel = readSource('src/main/views/explore/villages/toponyms/ToponymDetailPanel.vue');
    const zhCNVillages = readSource('src/i18n/locales/zh-CN/villages.json');
    const zhHantVillages = readSource('src/i18n/locales/zh-Hant/villages.json');
    const enVillages = readSource('src/i18n/locales/en/villages.json');
    const selectPointBody = functionBody(page, 'handleSelectPoint');
    const localDetailBody = functionBody(page, 'handleLocalDetailRequest');

    expect(page).toContain("import HoverDetailCard from '@/components/ToastAndHelp/HoverDetailCard.vue'");
    expect(page).toContain("import { resolveHoverDetailCardPosition } from '@/utils/EchartHover/hoverDetailCardPosition.js'");
    expect(page).toContain('isDetailCardOpen');
    expect(page).toContain('desktopCardPosition');
    expect(selectPointBody).not.toContain('getToponymDetails');
    expect(localDetailBody).toContain('getToponymDetails');
    expect(chart).toContain("t('villages.pages.toponyms.chart.pointTooltip')");
    expect(chart).not.toContain('point.id');
    expect(detailPanel).not.toContain('{{ selectedPoint.id }}');
    expect(zhCNVillages).not.toContain('已知 ID');
    expect(zhHantVillages).not.toContain('已知 ID');
    expect(enVillages).not.toContain('known ID');
  });

  it('uses a denser explore-tool layout with chart-first hierarchy and quiet inspector panels', () => {
    const page = readSource('src/main/views/explore/villages/toponyms/ToponymsPage.vue');
    const searchBar = readSource('src/main/views/explore/villages/toponyms/ToponymSearchBar.vue');
    const resultsPanel = readSource('src/main/views/explore/villages/toponyms/ToponymResultsPanel.vue');
    const detailPanel = readSource('src/main/views/explore/villages/toponyms/ToponymDetailPanel.vue');

    expect(page).toContain('toponyms-page__workspace');
    expect(page).toContain('toponyms-page__toolbar-copy');
    expect(page).toContain('toponyms-page__chart-header');
    expect(page).toContain('toponyms-page__stat-strip');
    expect(page).not.toContain('toponyms-page__hero');
    expect(searchBar).toContain('toponym-search-bar__hint');
    expect(resultsPanel).toContain('toponym-results-panel__inspector');
    expect(resultsPanel).toContain('toponym-results-panel__name-tree-note');
    expect(detailPanel).toContain('toponym-detail-panel__source-label');
  });

  it('keeps toponyms component styles scoped, tokenized, nested, and aspect-ratio responsive', () => {
    const files = [
      'src/main/views/explore/villages/toponyms/ToponymsPage.vue',
      'src/main/views/explore/villages/toponyms/ToponymSearchBar.vue',
      'src/main/views/explore/villages/toponyms/ToponymLayerControls.vue',
      'src/main/views/explore/villages/toponyms/ToponymResultsPanel.vue',
      'src/main/views/explore/villages/toponyms/ToponymDetailPanel.vue',
      'src/main/views/explore/villages/toponyms/ToponymDistributionChart.vue',
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
