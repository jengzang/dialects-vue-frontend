import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '..');

function readSource(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('phonology action auto query contracts', () => {
  it('keeps LocationDetailPopup phonology actions behind the shared location resolver', () => {
    const source = readSource('src/main/components/geo/popups/LocationDetailPopup.vue');

    expect(source).toContain('resolvePhonologyActionLocation');
    expect(source).toContain('getLocations');
    expect(source).toContain(':location="lexiconLocation"');
  });

  it('does not let matrix URL locations bypass LocationMultiInput matching', () => {
    const source = readSource('src/main/components/pho/PhonologyPage.vue');

    expect(source).toContain('pendingUrlAutoQuery');
    expect(source).not.toContain('matchedLocations.value = [...urlLocations]');
    expect(source).not.toContain('matchedLocations.value = [...limitedUrlLocations]');
  });

  it('does not let evolution URL locations bypass LocationMultiInput matching', () => {
    const source = readSource('src/main/components/pho/EvolutionPage.vue');

    expect(source).toContain('pendingUrlAutoQuery');
    expect(source).not.toContain('matchedLocations.value = [...limitedUrlLocations]');
  });

  it('normalizes pending count phonology locations before the automatic count query', () => {
    const source = readSource('src/main/components/pho/Countphos.vue');

    expect(source).toContain('resolvePhonologyActionLocations');
    expect(source).toContain('getLocations');
    expect(source.indexOf('resolvePhonologyActionLocations')).toBeLessThan(
      source.indexOf('loadData()')
    );
  });
});
