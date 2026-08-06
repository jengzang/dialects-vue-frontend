import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testsDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testsDir, '..');

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8');
}

describe('toponyms ECharts distribution chart', () => {
  it('renders toponym points on an ECharts geo coordinate system with registered GIS layers', () => {
    const chart = readSource('src/main/views/explore/villages/toponyms/ToponymDistributionChart.vue');

    expect(chart).toContain("import * as echarts from 'echarts'");
    expect(chart).toContain('echarts.registerMap(COUNTRY_MAP_NAME');
    expect(chart).toContain("coordinateSystem: 'geo'");
    expect(chart).toContain("seriesType: 'scatter'");
    expect(chart).toContain('buildRiverLineSeriesData');
    expect(chart).toContain('buildBoundaryLineSeriesData');
    expect(chart).toContain('buildBoundarySeries');
    expect(chart).toContain('buildRiverSeries');
    expect(chart).toContain('extractToponymPointFromChartParams');
    expect(chart).toContain("emit('select-point'");
  });

  it('keeps layer controls in a compact chart toolbar and status text centered over the chart', () => {
    const page = readSource('src/main/views/explore/villages/toponyms/ToponymsPage.vue');
    const chart = readSource('src/main/views/explore/villages/toponyms/ToponymDistributionChart.vue');
    const layers = readSource('src/main/views/explore/villages/toponyms/ToponymLayerControls.vue');

    expect(page).toContain('toponyms-page__chart-toolbar');
    expect(page).toContain('<ToponymLayerControls');
    expect(page.indexOf('<ToponymSearchBar')).toBeLessThan(page.indexOf('toponyms-page__chart-toolbar'));
    expect(layers).toContain('toponym-layer-controls--compact');
    expect(layers).toContain('class="toponym-layer-controls__toggle"');
    expect(chart).toContain('inset: 0');
    expect(chart).toContain('@include flex-center');
    expect(chart).not.toContain('inset-block-start: 14px');
  });

  it('uses token-derived chart colors and cleans up ECharts lifecycle resources', () => {
    const chart = readSource('src/main/views/explore/villages/toponyms/ToponymDistributionChart.vue');

    expect(chart).toContain('getComputedStyle(document.documentElement)');
    expect(chart).toContain("cssToken('--text-deep'");
    expect(chart).toContain("cssToken('--color-primary'");
    expect(chart).toContain('new ResizeObserver');
    expect(chart).toContain('resizeObserver.disconnect()');
    expect(chart).toContain('chartInstance.dispose()');
  });

  it('replaces the route placeholder with the real chart component', () => {
    const page = readSource('src/main/views/explore/villages/toponyms/ToponymsPage.vue');

    expect(page).toContain('<ToponymDistributionChart');
    expect(page).toContain(':country-layer="countryLayer"');
    expect(page).toContain(':loaded-layers="loadedLayers"');
    expect(page).toContain(':layer-state="layerState"');
    expect(page).toContain('@select-point="handleSelectPoint"');
    expect(page).not.toContain('placeholderTitle');
  });
});
