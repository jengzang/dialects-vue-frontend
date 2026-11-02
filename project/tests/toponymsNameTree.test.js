import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compileScript, parse } from '@vue/compiler-sfc';
import { reactive, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMock = vi.hoisted(() => vi.fn());
vi.mock('../src/api/auth/httpClient.js', () => ({ api: apiMock }));
const { getToponymNames } = await import('../src/api/main/toponyms.js');

// Run the actual page handlers and API adapter without mounting the unrelated map.
function loadTree() {
  const source = readFileSync(resolve('src/main/views/explore/villages/toponyms/ToponymsPage.vue'), 'utf8');
  const { descriptor } = parse(source);
  const script = compileScript(descriptor, { id: 'toponyms-name-tree' });
  const handlers = [
    'handleNameTreeRequest', 'handleNameTreeNodeExpand', 'handleNameTreeNamesMore',
    'normalizeToponymNameTreePayload', 'updateNameTreeMeta', 'mergeLazyTreePayload',
    'buildToponymTreeNodes', 'createToponymTreeNode',
  ];
  const functions = script.scriptSetupAst
    .filter((node) => node.type === 'FunctionDeclaration' && handlers.includes(node.id.name))
    .map((node) => descriptor.scriptSetup.content.slice(node.start, node.end)).join('\n');
  const bindings = {
    getToponymNames, nameTree: ref([]), nameTreeMeta: reactive({ levels: 4 }),
    nameTreeError: ref(''), nameTreeLoaded: ref(false), nameTreeLoading: ref(false),
    nameTreeRequestId: ref(0), lastPointSearchParams: ref({ q: '村', match_mode: 'contains' }),
    TOPONYM_NAME_TREE_PAGE_SIZE: 100, t: (key) => key,
  };
  return {
    ...bindings,
    ...new Function(...Object.keys(bindings), `${functions}; return { ${handlers.join(', ')} };`)(...Object.values(bindings)),
  };
}

describe('toponym name tree response handling', () => {
  beforeEach(() => apiMock.mockReset());

  it('expands only loaded bootstrap branches and keeps skipped administrative levels lazy', async () => {
    const tree = loadTree();
    apiMock.mockResolvedValueOnce({
      mode: 'lazy_fallback', levels: 4, threshold: 5000, filtered_count: null,
      lazy_bootstrap: [{ name: '广东省', level: 1, children: [{ name: '东莞市', level: 2 }] }],
    });
    await tree.handleNameTreeRequest();
    const province = tree.nameTree.value[0];
    const city = province.children[0];
    expect(province.expanded).toBe(true);
    expect(city.expanded).toBe(false);
    apiMock.mockResolvedValueOnce({
      mode: 'lazy', level: 4, parent_path: city.path,
      children: [{ name: '黄江镇', level: 4 }], has_more: false,
    });
    await tree.handleNameTreeNodeExpand(city);
    expect(city.lazy).toBe(true);
    expect(city.children[0]).toMatchObject({
      name: '黄江镇', level: 4, lazy: true, loaded: false,
      path: ['广东省', '东莞市', '黄江镇'],
    });
  });

  it('preserves leaf pagination after API normalization and appends the next page', async () => {
    const tree = loadTree();
    const node = tree.buildToponymTreeNodes([{ name: '黄江镇', level: 4 }], {
      parentPath: ['广东省', '东莞市'], lazy: true,
    })[0];
    apiMock.mockResolvedValueOnce({
      mode: 'lazy', level: 4, parent_path: node.path,
      names: ['刁朗村', '合路村'], page: 1, page_size: 2, has_more: true,
    });
    await tree.handleNameTreeNodeExpand(node);
    expect(node.names).toEqual(['刁朗村', '合路村']);
    expect(node.namesHasMore).toBe(true);
    apiMock.mockResolvedValueOnce({
      mode: 'lazy', level: 4, parent_path: node.path,
      names: ['大冚村'], page: 2, page_size: 2, has_more: false,
    });
    await tree.handleNameTreeNamesMore(node);
    expect(node.names).toEqual(['刁朗村', '合路村', '大冚村']);
    expect(node.namesPage).toBe(2);
    expect(node.namesHasMore).toBe(false);
    expect(new URL(apiMock.mock.calls[1][0], 'https://example.test').searchParams.getAll('parent_path'))
      .toEqual(['广东省', '东莞市', '黄江镇']);
    expect(node.error).toBe('');
  });

  it('keeps complete trees loaded without lazy requests', async () => {
    const tree = loadTree();
    apiMock.mockResolvedValueOnce({ mode: 'full', levels: 4, items: [
      { name: '广东省', level: 1, names: [], children: [
        { name: '黄江镇', level: 4, names: ['合路村'], children: [] },
      ] },
    ] });
    await tree.handleNameTreeRequest();
    const root = tree.nameTree.value[0];
    expect(root.children[0].names).toEqual(['合路村']);
    await tree.handleNameTreeNodeExpand(root);
    expect(root.expanded).toBe(false);
    expect(apiMock).toHaveBeenCalledTimes(1);
  });
});
