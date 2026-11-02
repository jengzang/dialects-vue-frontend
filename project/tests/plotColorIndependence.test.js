import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createApp, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { compileStyleAsync, parse } from '@vue/compiler-sfc';
import ToponymDistributionChart from '../src/main/views/explore/villages/toponyms/ToponymDistributionChart.vue';
import TendencyHeatmapPanel from '../src/VillagesML/workspace/modules/character/TendencyHeatmapPanel.vue';

const charts = vi.hoisted(() => []);
const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const scssOptions = { importers: [{ findFileUrl: (url) => url.startsWith('@/') ? new URL(pathToFileURL(`${resolve(srcRoot, url.slice(2))}.scss`).href) : null }] };
vi.mock('echarts', () => ({
  registerMap: vi.fn(),
  init: () => {
    const chart = { setOption: vi.fn(), on: vi.fn(), off: vi.fn(), resize: vi.fn(), dispose: vi.fn() };
    charts.push(chart);
    return chart;
  },
}));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }));
vi.mock('@/components/common/AppModal.vue', () => ({ default: { render: () => null } }));
vi.mock('@/components/ToastAndHelp/HelpIcon.vue', () => ({ default: { render: () => null } }));

const themes = [
  { '--color-primary': '#0070e8', '--text-primary': '#1d1d1f', '--color-success': '#34c759', '--color-error': '#d32f2f' },
  { '--color-primary': '#86d99b', '--text-primary': '#e5eee7', '--color-success': '#00ff00', '--color-error': '#ff00ff' },
];
Object.assign(themes[0], { '--surface-panel-subtle': 'rgba(255, 255, 255, 0.4)', '--border-control': 'rgba(148, 163, 184, 0.32)', '--border-medium': 'rgba(0, 0, 0, 0.1)', '--text-deep': '#0b2540' });
Object.assign(themes[1], { '--surface-panel-subtle': '#173c26', '--border-control': '#86d99b', '--border-medium': '#e5eee7', '--text-deep': '#e5eee7' });
const apps = [];

afterEach(() => {
  apps.splice(0).forEach((app) => app.unmount());
  charts.length = 0;
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('style');
  vi.unstubAllGlobals();
});

async function mountInTheme(component, props, theme) {
  for (const [name, value] of Object.entries(theme)) document.documentElement.style.setProperty(name, value);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('requestAnimationFrame', () => 0);
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp(component, props);
  apps.push(app);
  app.mount(host);
  await nextTick();
  await nextTick();
  return charts.at(-1).setOption.mock.calls.at(-1)[0];
}

describe('plot colors stay independent of page theme', () => {
  it('keeps ECharts map, boundary, river, point and tooltip colors stable', async () => {
    const lineLayer = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[110, 20], [111, 21]] } }] };
    const props = {
      countryLayer: { type: 'FeatureCollection', features: [] },
      scatterData: [{ id: 'point', value: [110, 20] }],
      layerState: { provinces: true, cities: true, riverL1: true },
      loadedLayers: { provinces: lineLayer, cities: lineLayer, riverL1: lineLayer },
      hasSearched: true,
    };
    const colors = (option) => ({
      geo: option.geo.itemStyle,
      series: option.series.map((series) => series.lineStyle || series.itemStyle),
      tooltip: option.tooltip.textStyle,
    });
    const first = colors(await mountInTheme(ToponymDistributionChart, props, themes[0]));
    const second = colors(await mountInTheme(ToponymDistributionChart, props, themes[1]));
    expect(first).toEqual(second);
    expect(first.series).toHaveLength(4);
    expect(JSON.stringify(first)).not.toMatch(/var\(--/);
  });

  it('keeps positive and negative bar colors stable and distinct', async () => {
    const props = { data: [{ character: '甲', z_score: 2 }, { character: '乙', z_score: -2 }] };
    const colors = (option) => option.series[0].data.map((item) => item.itemStyle.color);
    const first = colors(await mountInTheme(TendencyHeatmapPanel, props, themes[0]));
    const second = colors(await mountInTheme(TendencyHeatmapPanel, props, themes[1]));
    expect(first).toEqual(second);
    expect(new Set(first).size).toBe(2);
  });

  it.each([
    ['main/components/map/MapLibre.vue', /(?:marker-text|marker-dot|maplibregl-popup-content)/],
    ['main/components/map/MiniMapSelector.vue', /mini-map-point-label/],
    ['main/components/map/VocabularyMap.vue', /vocabulary-marker/],
    ['main/components/map/popups/VillageMapPopup.vue', /maplibregl-popup-content/],
    ['main/components/map/popups/AllVillagesMapPopup.vue', /maplibregl-popup-content/],
    ['main/components/map/MapLegend.vue', /map-legend|legend-title|legend-label/],
  ])('keeps rendered map labels and popup surfaces free of theme colors: %s', async (path, selectors) => {
    const filename = resolve(srcRoot, path);
    const { descriptor } = parse(readFileSync(filename, 'utf8'));
    for (const style of descriptor.styles) {
      const result = await compileStyleAsync({
        filename, source: style.content, id: 'data-v-test', scoped: true,
        preprocessLang: 'scss',
        preprocessOptions: scssOptions,
      });
      expect(result.errors).toEqual([]);
      const rules = [...result.code.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, selector]) => selectors.test(selector));
      expect(rules.length).toBeGreaterThan(0);
      for (const [, selector, body] of rules) {
        const colors = body.split(';').filter((declaration) => /(?:^|\s)(?:color|background(?:-color)?|border(?:-color)?|box-shadow):/.test(declaration));
        expect(colors.join(';'), selector).not.toMatch(/var\(--/);
      }
    }
  });

  it('keeps shared map popup content independent of theme while preserving themed action buttons', async () => {
    const filename = resolve(srcRoot, 'styles/main/_popups.scss');
    const result = await compileStyleAsync({
      filename, source: readFileSync(filename, 'utf8'), id: 'map-popups',
      preprocessLang: 'scss',
      preprocessOptions: scssOptions,
    });
    expect(result.errors).toEqual([]);
    const rules = [...result.code.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    for (const [, selector, body] of rules) {
      if (/mini-button|map-popup__action/.test(selector)) continue;
      const colors = body.split(';').filter((declaration) => /(?:^|\s)(?:color|background(?:-color)?|border(?:-top-color)?|box-shadow):/.test(declaration));
      expect(colors.join(';'), selector).not.toMatch(/var\(--/);
    }
    expect(result.code).toContain('background-color: var(--color-primary)');
  });
});
