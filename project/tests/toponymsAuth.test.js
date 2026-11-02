import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compileScript, parse } from '@vue/compiler-sfc';
import { describe, expect, it, vi } from 'vitest';

const cases = [
  ['ToponymsPage', 'handleSearch'],
  ['ToponymsPage', 'handleNameTreeRequest'],
  ['ToponymsPage', 'handleNameTreeNodeExpand'],
  ['ToponymsPage', 'handleNameTreeNamesMore'],
  ['ToponymsPage', 'handleLocalDetailRequest'],
  ['ToponymsPage', 'handleOfficialDetailRequest'],
  ['ToponymSearchPage', 'handleSearch'],
  ['ToponymSearchPage', 'handleSelectResult'],
];

describe('toponyms login guards', () => {
  it.each(cases)('%s.%s stops guests before changing state or requesting data', async (page, handler) => {
    const source = readFileSync(resolve(`src/main/views/explore/villages/toponyms/${page}.vue`), 'utf8');
    const { descriptor } = parse(source);
    const script = compileScript(descriptor, { id: 'toponyms-auth' });
    const node = script.scriptSetupAst.find((node) => node.type === 'FunctionDeclaration' && node.id.name === handler);
    const declaration = descriptor.scriptSetup.content.slice(node.start, node.end);
    const guardToponymRequest = vi.fn(async () => false);
    const run = new Function('guardToponymRequest', `${declaration}; return ${handler};`)(guardToponymRequest);
    await run({ id: 'test-id', path: ['广东省'], lazy: true, namesHasMore: true });
    expect(guardToponymRequest).toHaveBeenCalledOnce();
    expect(source).toContain('const { requireAuth, isAuthenticated } = useAuthGuard(');
  });

  describe.each(['ToponymsPage', 'ToponymSearchPage'])('%s confirmation', (page) => {
    function loadGuard(authenticated, confirmed) {
      const source = readFileSync(resolve(`src/main/views/explore/villages/toponyms/${page}.vue`), 'utf8');
      const { descriptor } = parse(source);
      const script = compileScript(descriptor, { id: 'toponyms-confirmation' });
      const node = script.scriptSetupAst.find((node) => node.type === 'FunctionDeclaration' && node.id.name === 'guardToponymRequest');
      expect(node, 'page must confirm before sending guests to login').toBeDefined();
      const declaration = descriptor.scriptSetup.content.slice(node.start, node.end);
      const bindings = {
        isAuthenticated: { value: authenticated },
        showConfirm: vi.fn(async () => confirmed), requireAuth: vi.fn(async () => false), t: (key) => key,
      };
      return { ...bindings, run: new Function(...Object.keys(bindings), `${declaration}; return guardToponymRequest;`)(...Object.values(bindings)) };
    }

    it('allows logged-in users without prompting', async () => {
      const guard = loadGuard(true, false);
      expect(await guard.run()).toBe(true);
      expect(guard.showConfirm).not.toHaveBeenCalled();
      expect(guard.requireAuth).not.toHaveBeenCalled();
    });

    it('stays on the page when login confirmation is cancelled', async () => {
      const guard = loadGuard(false, false);
      expect(await guard.run()).toBe(false);
      expect(guard.showConfirm).toHaveBeenCalledOnce();
      expect(guard.requireAuth).not.toHaveBeenCalled();
    });

    it('navigates only after confirmation and stops the original request', async () => {
      const guard = loadGuard(false, true);
      let resolveConfirm;
      guard.showConfirm.mockImplementation(() => new Promise((resolve) => { resolveConfirm = resolve; }));
      const pending = guard.run();
      expect(guard.requireAuth).not.toHaveBeenCalled();
      resolveConfirm(true);
      expect(await pending).toBe(false);
      expect(guard.requireAuth).toHaveBeenCalledOnce();
    });
  });
});
