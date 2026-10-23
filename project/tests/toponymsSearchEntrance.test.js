import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick, ref } from 'vue';
import ToponymsPage from '../src/main/views/explore/villages/toponyms/ToponymsPage.vue';

const mocks = vi.hoisted(() => ({ route: { query: {} }, points: vi.fn() }));
vi.mock('vue-router', () => ({ useRoute: () => mocks.route }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }));
vi.mock('@/api', () => ({
  getToponymPoints: mocks.points,
  getToponymNames: vi.fn(),
  getToponymDetails: vi.fn(),
  getToponymOfficialDetail: vi.fn(),
}));
vi.mock('../src/main/views/explore/villages/toponyms/toponymsGisAssets.js', () => ({
  getDefaultToponymsLayerState: () => ({ country: true }),
  loadToponymsGisAsset: async () => ({ type: 'FeatureCollection', features: [] }),
}));
vi.mock('../src/main/views/explore/villages/toponyms/ToponymDistributionChart.vue', () => ({
  default: {
    emits: ['select-point'],
    setup(_, { expose, emit }) {
      const showConfigModal = ref(false);
      expose({ showConfigModal });
      return () => h('div', { class: 'test-map', 'data-config-open': showConfigModal.value }, [
        h('button', { class: 'test-point', onClick: () => emit('select-point', { id: 'point-1', coordinates: [114, 36] }) }),
      ]);
    },
  },
}));
vi.mock('@/components/selector/SimpleSelectDropdown.vue', () => ({
  default: { render: () => h('div', { class: 'test-match-mode' }) },
}));
vi.mock('@/components/ToastAndHelp/HoverDetailCard.vue', () => ({ default: {
  props: ['visible'],
  setup: props => () => props.visible ? h('div', { class: 'test-detail' }) : null,
} }));

let app, host;
const settle = async () => {
  for (let i = 0; i < 8; i++) {
    await nextTick();
    await vi.advanceTimersByTimeAsync(50);
  }
};
const submit = async (value) => {
  const input = host.querySelector('input');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await nextTick();
  host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await settle();
};
const mount = async () => {
  host = document.createElement('div');
  document.body.append(host);
  app = createApp(ToponymsPage);
  app.mount(host);
  await settle();
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('scrollY', 0);
  mocks.route.query = {};
  mocks.points.mockReset().mockResolvedValue({ items: [], count: 0, truncated: false });
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    return { top: 260 - window.scrollY, height: this.classList.contains('query-intro') ? 160 : 100 };
  });
  vi.spyOn(window, 'scrollTo').mockImplementation(({ top }) => {
    vi.stubGlobal('scrollY', top);
    window.dispatchEvent(new Event('scroll'));
  });
});
afterEach(() => {
  app?.unmount();
  host?.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('toponym search entrance', () => {
  it('starts expanded with its own match filter and no map or point request', async () => {
    await mount();
    expect(host.querySelector('.query-search-panel')).not.toBeNull();
    expect(host.querySelector('.query-search-panel.is-compact')).toBeNull();
    expect(host.querySelector('.toponyms-page.is-search-expanded')).not.toBeNull();
    expect(host.querySelector('.test-match-mode')).not.toBeNull();
    expect(host.querySelector('.toponyms-page__workspace').style.display).toBe('none');
    expect(mocks.points).not.toHaveBeenCalled();
  });

  it('collapses through the shared entrance and shows the map even for zero matches', async () => {
    await mount();
    await submit('黄村');
    expect(mocks.points).toHaveBeenCalledWith(expect.objectContaining({ q: '黄村', match_mode: 'prefix' }));
    expect(host.querySelector('.query-search-panel.is-compact')).not.toBeNull();
    expect(host.querySelector('.test-map')).not.toBeNull();
    expect(host.querySelector('.toponyms-page__workspace').style.display).not.toBe('none');
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('keeps empty input expanded and exposes validation without requesting points', async () => {
    await mount();
    await submit('   ');
    expect(host.querySelector('.query-search-panel.is-compact')).toBeNull();
    expect(host.textContent).toContain('villages.pages.toponyms.errors.emptyQuery');
    expect(mocks.points).not.toHaveBeenCalled();
  });

  it('uses the same compact entrance for searches from catalog links', async () => {
    mocks.route.query = { q: '黄村', match_mode: 'contains' };
    await mount();
    expect(mocks.points).toHaveBeenCalledWith(expect.objectContaining({ q: '黄村', match_mode: 'contains' }));
    expect(host.querySelector('.query-search-panel.is-compact')).not.toBeNull();
    expect(host.querySelector('.test-map')).not.toBeNull();
  });

  it('requires a second upward gesture to expand and retains the map and its settings', async () => {
    await mount();
    host.querySelector('[aria-label="villages.pages.toponyms.chart.configAriaLabel"]').click();
    await settle();
    const map = host.querySelector('.test-map');
    expect(map.dataset.configOpen).toBe('true');
    await submit('黄村');
    host.querySelector('.test-point').click();
    await settle();
    expect(document.querySelector('.test-detail')).not.toBeNull();
    window.scrollTo({ top: 0 });
    await settle();
    expect(host.querySelector('.query-search-panel.is-compact')).not.toBeNull();
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }));
    await settle();
    expect(host.querySelector('.query-search-panel.is-compact')).toBeNull();
    expect(host.querySelector('.toponyms-page__workspace').style.display).toBe('none');
    expect(host.querySelector('.test-map')).toBe(map);
    expect(host.querySelector('.toponyms-page.is-search-expanded')).not.toBeNull();
    expect(document.querySelector('.test-detail')).toBeNull();
    expect(map.dataset.configOpen).toBe('true');
    expect(host.querySelector('input').value).toBe('黄村');
    expect(mocks.points).toHaveBeenCalledTimes(1);
  });
});
