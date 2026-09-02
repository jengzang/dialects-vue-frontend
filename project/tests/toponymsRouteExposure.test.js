import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testsDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testsDir, '..');

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8');
}

describe('toponyms route exposure', () => {
  it('registers toponyms as an Explore villages route', () => {
    const source = readSource('src/main/router/exploreRoutes.js');

    expect(source).toContain('explore/villages/toponyms');
    expect(source).toContain('ToponymsPage');
    expect(source).toContain('explore/villages/search');
    expect(source).toContain("const ToponymSearchPage = () => import('@/main/views/explore/villages/toponyms/ToponymSearchPage.vue')");
    expect(source).toContain('component: ToponymSearchPage');
    expect(source).not.toContain('/toponyms/map');
  });

  it('places toponyms above Guangdong villages in ExploreBar', () => {
    const source = readSource('src/main/config/BarAndTabs/ExploreBarConfig.js');
    const toponymsIndex = source.indexOf('navigation.submenu.villages.toponyms');
    const searchIndex = source.indexOf('navigation.submenu.villages.toponymSearch');
    const gdIndex = source.indexOf('navigation.submenu.villages.gdVillages');

    expect(toponymsIndex).toBeGreaterThan(-1);
    expect(searchIndex).toBeGreaterThan(-1);
    expect(gdIndex).toBeGreaterThan(-1);
    expect(toponymsIndex).toBeLessThan(gdIndex);
    expect(searchIndex).toBeLessThan(gdIndex);
  });

  it('places toponyms above Guangdong villages in SideBar', () => {
    const source = readSource('src/main/config/BarAndTabs/SideBarConfig.js');
    const toponymsIndex = source.indexOf('/explore/villages/toponyms');
    const searchIndex = source.indexOf('/explore/villages/search');
    const gdIndex = source.indexOf('/explore/villages/gd');

    expect(toponymsIndex).toBeGreaterThan(-1);
    expect(searchIndex).toBeGreaterThan(-1);
    expect(gdIndex).toBeGreaterThan(-1);
    expect(toponymsIndex).toBeLessThan(gdIndex);
    expect(searchIndex).toBeLessThan(gdIndex);
  });

  it('exposes toponym search SEO and localized navigation copy', () => {
    const seo = readSource('src/seo/config.js');
    const zhCnNavigation = readSource('src/i18n/locales/zh-CN/navigation.json');
    const zhHantNavigation = readSource('src/i18n/locales/zh-Hant/navigation.json');
    const enNavigation = readSource('src/i18n/locales/en/navigation.json');

    expect(seo).toContain('/explore/villages/search');
    expect(zhCnNavigation).toContain('"toponymSearch": "地名查询"');
    expect(zhHantNavigation).toContain('"toponymSearch": "地名查詢"');
    expect(enNavigation).toContain('"toponymSearch": "Toponym Search"');
  });

  it('adds the villages portal entry above Guangdong villages', () => {
    const source = readSource('src/main/views/menu/portals/VillagesPage.vue');
    const toponymsIndex = source.indexOf("localeTo('/explore/villages/toponyms')");
    const gdIndex = source.indexOf("localeTo('/explore/villages/gd')");

    expect(toponymsIndex).toBeGreaterThan(-1);
    expect(gdIndex).toBeGreaterThan(-1);
    expect(toponymsIndex).toBeLessThan(gdIndex);
  });
});
