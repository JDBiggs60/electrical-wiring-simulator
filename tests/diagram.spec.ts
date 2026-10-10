import { test, expect } from '@playwright/test';

test('the primary preview is a complete diagram layout, with both box views and no live wiring controls', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Residential lighting circuit', exact: true })).toBeVisible();
  await expect(page.locator('.diagram-review-note')).toContainText('after layout approval');
  await expect(page.locator('#diagram-board')).toBeVisible();
  await expect(page.locator('#board')).toHaveCount(0);
  await expect(page.locator('.diagram-cable')).toHaveCount(2);
  const board = await page.locator('#diagram-board').boundingBox();
  expect(board!.x).toBeGreaterThanOrEqual(0); expect(board!.y+board!.height).toBeLessThanOrEqual(1100);
  await page.locator('[data-open-diagram-box="switch"]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#diagram-closeup-title')).toHaveText('Inside the single-gang switch box');
  await expect(page.locator('#diagram-closeup-art .diagram-device-terminal')).toHaveCount(4); // Two brass, device ground and separate box bond.
  await expect(page.locator('.diagram-closeup-note')).toContainText('not editable or simulated yet');
  await page.getByRole('button', { name: 'Return to circuit' }).click();
  await page.locator('[data-open-diagram-box="fixture"]').click();
  await expect(page.locator('#diagram-closeup-title')).toHaveText('Inside the ceiling fixture box');
  await expect(page.locator('#diagram-closeup-art')).toContainText('FIXTURE LIFTED FOR VIEW');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('the working Phase 1 trainer and junction prototype remain accessible', async ({ page }) => {
  await page.goto('/');
  const popup = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Open working Phase 1 trainer' }).click();
  const trainer = await popup;
  await expect(trainer.getByRole('heading', { name: 'Simple light circuit', exact: true })).toBeVisible();
  await trainer.locator('#open-junction').click();
  await expect(trainer.locator('#junction-workspace')).toBeVisible();
  await expect(trainer.locator('.junction-dialog [data-action="join"]')).toBeVisible();
  await trainer.close();
});

test('box review is keyboard accessible and mobile overflow is contained in the diagram canvas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('[data-open-diagram-box="switch"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open fixture box', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const width = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(width.doc).toBeLessThanOrEqual(width.viewport);
});
