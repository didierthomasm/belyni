import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

test('admin UI is not part of the static build', async () => {
  expect(existsSync('dist/keystatic/index.html')).toBe(false);
});
