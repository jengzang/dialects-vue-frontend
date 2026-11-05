import { getCurrentScope, onScopeDispose, watch } from 'vue';
import * as echarts from 'echarts';
import { currentColorMode, currentColorTheme } from '@/composables/core/uiPreferences';

const FALLBACK_TOKENS = {
  text: '#1d1d1f',
  textSecondary: '#86868b',
  axis: '#6E7079',
  split: '#E0E6F1',
  surface: '#ffffff',
  border: '#d1d1d6',
};

export function readChartTokens() {
  if (typeof document === 'undefined') return { ...FALLBACK_TOKENS };
  const style = getComputedStyle(document.documentElement);
  const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  return {
    text: read('--text-primary', FALLBACK_TOKENS.text),
    textSecondary: read('--text-secondary', FALLBACK_TOKENS.textSecondary),
    axis: read('--text-tertiary', FALLBACK_TOKENS.axis),
    split: read('--border-divider', FALLBACK_TOKENS.split),
    surface: read('--surface-elevation-0', FALLBACK_TOKENS.surface),
    border: read('--border-gray', FALLBACK_TOKENS.border),
  };
}

function buildAxisTheme(tokens) {
  return {
    axisLabel: { color: tokens.axis },
    axisLine: { lineStyle: { color: tokens.axis } },
    axisTick: { lineStyle: { color: tokens.axis } },
    splitLine: { lineStyle: { color: tokens.split } },
    nameTextStyle: { color: tokens.text },
  };
}

function chartThemeDefaults() {
  const tokens = readChartTokens();
  return {
    textStyle: { color: tokens.text },
    title: {
      textStyle: { color: tokens.text },
      subtextStyle: { color: tokens.textSecondary },
    },
    legend: { textStyle: { color: tokens.text } },
    tooltip: {
      backgroundColor: tokens.surface,
      borderColor: tokens.border,
      textStyle: { color: tokens.text },
    },
    radar: {
      name: { textStyle: { color: tokens.text } },
      axisLabel: { color: tokens.axis },
    },
    visualMap: { textStyle: { color: tokens.text } },
    dataZoom: { textStyle: { color: tokens.text } },
    toolbox: {
      iconStyle: { borderColor: tokens.axis },
      textStyle: { color: tokens.text },
      emphasis: { iconStyle: { borderColor: tokens.text } },
    },
    xAxis: buildAxisTheme(tokens),
    yAxis: buildAxisTheme(tokens),
  };
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function mergeDefaults(defaults, value) {
  if (value === undefined) return defaults;
  if (Array.isArray(defaults) || Array.isArray(value)) return value;
  if (!isPlainObject(defaults) || !isPlainObject(value)) return value;
  const merged = { ...value };
  for (const key of Object.keys(defaults)) {
    merged[key] = key in value ? mergeDefaults(defaults[key], value[key]) : defaults[key];
  }
  return merged;
}

function mergeAxis(defaults, axis) {
  if (Array.isArray(axis)) return axis.map((item) => mergeDefaults(defaults, item));
  return mergeDefaults(defaults, axis);
}

export function withChartTheme(option) {
  if (!option || !isPlainObject(option)) return option;

  const defaults = chartThemeDefaults();
  const themed = { ...option, textStyle: mergeDefaults(defaults.textStyle, option.textStyle) };

  for (const key of ['title', 'legend', 'tooltip', 'radar', 'toolbox']) {
    if (option[key] !== undefined) themed[key] = mergeDefaults(defaults[key], option[key]);
  }
  for (const key of ['visualMap', 'dataZoom']) {
    if (option[key] === undefined) continue;
    themed[key] = Array.isArray(option[key])
      ? option[key].map((item) => mergeDefaults(defaults[key], item))
      : mergeDefaults(defaults[key], option[key]);
  }
  for (const key of ['xAxis', 'yAxis']) {
    if (option[key] !== undefined) themed[key] = mergeAxis(defaults[key], option[key]);
  }

  return themed;
}

function patchSetOption(chart) {
  if (!chart || chart.__chartThemePatched) return chart;
  const originalSetOption = chart.setOption.bind(chart);
  const originalMock = chart.setOption?.mock;
  const themedSetOption = (option, ...rest) => originalSetOption(withChartTheme(option), ...rest);
  if (originalMock) themedSetOption.mock = originalMock;
  chart.setOption = themedSetOption;
  chart.__chartThemePatched = true;
  return chart;
}

export function initChart(el, ...args) {
  return patchSetOption(echarts.init(el, ...args));
}

export function getOrInitChart(el, ...args) {
  return patchSetOption(echarts.getInstanceByDom(el) || echarts.init(el, ...args));
}

const themeListeners = new Set();
let watchingTheme = false;

export function onChartThemeChange(listener) {
  if (!watchingTheme) {
    watchingTheme = true;
    watch(
      [currentColorMode, currentColorTheme],
      () => {
        themeListeners.forEach((fn) => fn());
      },
      { flush: 'post' }
    );
  }
  themeListeners.add(listener);
  if (getCurrentScope()) onScopeDispose(() => themeListeners.delete(listener));
}
