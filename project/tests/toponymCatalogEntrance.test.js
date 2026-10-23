import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import ToponymSearchPage from '../src/main/views/explore/villages/toponyms/ToponymSearchPage.vue';

const mocks = vi.hoisted(() => ({ search: vi.fn(), details: vi.fn(), push: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }));
vi.mock('@/api', () => ({ getToponymSearch: mocks.search, getToponymDetails: mocks.details }));
vi.mock('@/components/selector/SimpleSelectDropdown.vue', () => ({ default: {
  props: ['modelValue', 'options', 'disabled'],
  emits: ['update:modelValue'],
  setup: (props, { emit }) => () => h('select', {
    value: props.modelValue,
    disabled: props.disabled,
    onChange: event => emit('update:modelValue', props.options.find(option => String(option.value) === event.target.value).value),
  }, props.options.map(option => h('option', { value: option.value }, option.label))),
} }));
vi.mock('@/components/selector/MultiSelectDropdown.vue', () => ({ default: {
  props: ['modelValue', 'options'],
  emits: ['update:modelValue'],
  setup: (props, { emit }) => () => h('select', {
    multiple: true,
    onChange: event => emit('update:modelValue', [...event.target.selectedOptions].map(option => option.value)),
  }, props.options.map(option => h('option', { value: option.value, selected: props.modelValue.includes(option.value) }, option.label))),
} }));

let app, host;
const settle = async () => {
  for (let i = 0; i < 8; i++) {
    await nextTick();
    await vi.advanceTimersByTimeAsync(50);
  }
};
async function mount() {
  host = document.createElement('div');
  document.body.append(host);
  app = createApp(ToponymSearchPage);
  app.mount(host);
  await settle();
}
async function change(element, value, eventType = 'input') {
  element.value = value;
  element.dispatchEvent(new Event(eventType, { bubbles: true }));
  await nextTick();
}
async function submit(keyword = '黄村') {
  await change(host.querySelector('input'), keyword);
  host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await settle();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    return { top: 300 - window.scrollY, height: this.classList.contains('query-intro') ? 160 : 200 };
  });
  vi.spyOn(window, 'scrollTo').mockImplementation(({ top }) => {
    vi.stubGlobal('scrollY', top);
    window.dispatchEvent(new Event('scroll'));
  });
  mocks.search.mockReset().mockResolvedValue({ items: [{ id: 'village-1', name: '黄村' }], count: 1 });
  mocks.details.mockReset().mockResolvedValue({ items: [{ name: '黄村', place_type: '农村居民点' }] });
  mocks.push.mockReset();
});
afterEach(() => {
  app?.unmount();
  host?.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('toponym catalog entrance', () => {
  it('starts expanded with all catalog filters and no request or visible results', async () => {
    await mount();
    expect(host.querySelector('.query-search-panel')).not.toBeNull();
    expect(host.querySelectorAll('form input')).toHaveLength(2);
    expect(host.querySelectorAll('form select')).toHaveLength(4);
    expect(host.querySelector('.toponym-search-page__workspace').style.display).toBe('none');
    expect(mocks.search).not.toHaveBeenCalled();
  });

  it('keeps catalog filter parameters and detail/distribution actions after collapsing', async () => {
    await mount();
    await change(host.querySelectorAll('select')[0], 'suffix', 'change');
    await change(host.querySelectorAll('input')[1], '440000');
    await change(host.querySelectorAll('select')[2], 'exact', 'change');
    await change(host.querySelectorAll('select')[3], '100', 'change');
    await submit();
    expect(mocks.search).toHaveBeenCalledWith({
      q: '黄村', match_mode: 'suffix', place_type_code: ['22200', '21610', '27610'],
      area_code: '440000', area_scope: 'exact', limit: 100,
    });
    expect(host.querySelector('.query-search-panel.is-compact')).not.toBeNull();
    expect(host.querySelector('.toponym-search-page__workspace').style.display).not.toBe('none');
    host.querySelector('.toponym-search-page__result-card').click();
    await settle();
    expect(mocks.details).toHaveBeenCalledWith('village-1');
    host.querySelector('.toponym-search-page__detail header button').click();
    expect(mocks.push).toHaveBeenCalledWith({ path: '/explore/villages/toponyms', query: { q: '黄村', match_mode: 'suffix' } });
  });

  it('shows empty input validation in the expanded form without querying', async () => {
    await mount();
    await submit('  ');
    expect(host.querySelector('.query-search-panel.is-compact')).toBeNull();
    expect(host.querySelector('[role="alert"]').textContent).toContain('villages.pages.toponymSearch.errors.emptyQuery');
    expect(mocks.search).not.toHaveBeenCalled();
  });

  it('expands on a second upward gesture and preserves selected result and detail data', async () => {
    await mount();
    await submit();
    host.querySelector('.toponym-search-page__result-card').click();
    await settle();
    window.scrollTo({ top: 0 });
    await settle();
    expect(host.querySelector('.query-search-panel.is-compact')).not.toBeNull();
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }));
    await settle();
    expect(host.querySelector('.query-search-panel.is-compact')).toBeNull();
    expect(host.querySelector('.toponym-search-page.is-search-expanded')).not.toBeNull();
    expect(host.querySelector('.toponym-search-page__workspace').style.display).toBe('none');
    expect(host.querySelector('.toponym-search-page__result-card').dataset.active).toBe('true');
    expect(host.querySelector('.toponym-search-page__detail').textContent).toContain('农村居民点');
    expect(mocks.search).toHaveBeenCalledTimes(1);
    expect(mocks.details).toHaveBeenCalledTimes(1);
  });

  it('resets filters, results and shared entrance state without another request', async () => {
    await mount();
    await submit();
    host.querySelector('form button[type="button"]').click();
    await settle();
    expect(host.querySelector('.query-search-panel.is-compact')).toBeNull();
    expect(host.querySelector('input').value).toBe('');
    expect(host.querySelectorAll('select')[0].value).toBe('prefix');
    expect(host.querySelectorAll('select')[3].value).toBe('50');
    expect(host.querySelector('.toponym-search-page__workspace').style.display).toBe('none');
    expect(host.querySelector('.toponym-search-page__result-card')).toBeNull();
    expect(mocks.search).toHaveBeenCalledTimes(1);
    expect(window.scrollY).toBe(0);
  });
});
