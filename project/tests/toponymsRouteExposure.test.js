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
    expect(source).not.toContain('/toponyms/map');
  });

  it('places toponyms above Guangdong villages in ExploreBar', () => {
    const source = readSource('src/main/config/BarAndTabs/ExploreBarConfig.js');
    const toponymsIndex = source.indexOf('navigation.submenu.villages.toponyms');
    const gdIndex = source.indexOf('navigation.submenu.villages.gdVillages');

    expect(toponymsIndex).toBeGreaterThan(-1);
    expect(gdIndex).toBeGreaterThan(-1);
    expect(toponymsIndex).toBeLessThan(gdIndex);
  });

  it('places toponyms above Guangdong villages in SideBar', () => {
    const source = readSource('src/main/config/BarAndTabs/SideBarConfig.js');
    const toponymsIndex = source.indexOf('/explore/villages/toponyms');
    const gdIndex = source.indexOf('/explore/villages/gd');

    expect(toponymsIndex).toBeGreaterThan(-1);
    expect(gdIndex).toBeGreaterThan(-1);
    expect(toponymsIndex).toBeLessThan(gdIndex);
  });

  it('adds the villages portal entry above Guangdong villages', () => {
    const source = readSource('src/main/views/menu/portals/VillagesPage.vue');
    const toponymsIndex = source.indexOf('handleToponyms');
    const gdIndex = source.indexOf('handleGdVillages');

    expect(toponymsIndex).toBeGreaterThan(-1);
    expect(gdIndex).toBeGreaterThan(-1);
    expect(toponymsIndex).toBeLessThan(gdIndex);
  });
});
