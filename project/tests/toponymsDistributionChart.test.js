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
    expect(chart).toContain("echarts.registerMap('toponyms-country'");
    expect(chart).toContain("coordinateSystem: 'geo'");
    expect(chart).toContain("seriesType: 'scatter'");
    expect(chart).toContain('buildRiverLineSeriesData');
    expect(chart).toContain('buildMapOverlaySeries');
    expect(chart).toContain('buildRiverSeries');
    expect(chart).toContain('extractToponymPointFromChartParams');
    expect(chart).toContain("emit('select-point'");
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
