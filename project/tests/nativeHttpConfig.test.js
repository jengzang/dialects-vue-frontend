import config from '../capacitor.config.json';
import { expect, it } from 'vitest';

it('enables the bundled native HTTP fetch/XHR transport for both app platforms', () => {
  expect(config.plugins?.CapacitorHttp?.enabled).toBe(true);
});
