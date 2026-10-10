import { test, expect } from '@playwright/test';

test('NM cable splices carry continuity and power prevents editing', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?view=trainer');
  await page.getByRole('button', { name: 'Load NM cable example' }).click();
  await expect(page.locator('.nm-cables')).toHaveCount(1);
  await expect(page.locator('[data-terminal^="switch."]')).toHaveCount(3);
  await expect(page.locator('[data-terminal^="switch."] circle[fill="url(#brass-screw)"]')).toHaveCount(2);
  await expect(page.locator('[data-terminal="switch.ground"] circle[fill="url(#green-screw)"]')).toHaveCount(1);
  await expect(page.locator('.mounting-hardware [data-terminal]')).toHaveCount(0);
  await page.locator('[data-splice="switch-neutral"]').click();
  await expect(page.locator('#feedback')).toContainText('Connect the panel NEUTRAL');
  await page.getByRole('button', { name: 'Turn power on' }).click();
  await expect(page.locator('#power-status')).toHaveText('Power off');
  await page.locator('[data-splice="switch-neutral"]').click();
  await page.getByRole('button', { name: 'Check my wiring' }).click();
  await expect(page.locator('#feedback')).toContainText('complete circuit');
  await page.getByRole('button', { name: 'Turn power on' }).click();
  await page.getByRole('button', { name: 'Toggle light switch' }).click();
  await expect(page.locator('.bulb-glow')).toHaveCount(1);
  await expect(page.locator('[data-splice="switch-neutral"]')).toBeDisabled();
  await page.getByRole('button', { name: 'Inspect fixture box', exact: true }).click();
  await expect(page.locator('[data-splice="fixture-hot"]')).toBeDisabled();
  await page.getByRole('button', { name: 'Turn power off' }).click();
  await page.locator('[data-splice="fixture-hot"]').click();
  await expect(page.locator('#feedback')).toContainText('switched hot path');
  await page.getByRole('button', { name: 'Turn power on' }).click();
  await expect(page.locator('#power-status')).toHaveText('Power off');
  await expect(page.locator('.bulb-glow')).toHaveCount(0);
  await page.locator('[data-splice="fixture-hot"]').click();
  await page.getByRole('button', { name: 'Turn power on' }).click();
  await expect(page.locator('.bulb-glow')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('a metal-box bonding pigtail is required independently of the device ground', async ({ page }) => {
  await page.goto('/?view=trainer');
  await page.getByRole('button', { name: 'Load NM cable example' }).click();
  await page.locator('.conductor-details summary').click();
  await page.locator('[data-conductor="switch-box-bond"]').click();
  await expect(page.locator('#feedback')).toContainText('Bond the switch metal box');
  await page.getByRole('button', { name: 'Turn power on' }).click();
  await expect(page.locator('#power-status')).toHaveText('Power off');
  await expect(page.locator('.conductor-details')).toHaveAttribute('open', '');
  await page.locator('[data-conductor="switch-box-bond"]').click();
  await expect(page.locator('#feedback')).toContainText('complete circuit');
});

test('the original terminal exercise survives using the cable example and reset clears both modes', async ({ page }) => {
  await page.goto('/?view=trainer');
  await page.locator('[data-terminal="panel.hot1"]').click();
  await page.locator('[data-terminal="switch.a"]').click();
  await expect(page.locator('#wire-count')).toHaveText('1');
  await page.getByRole('button', { name: 'Load NM cable example' }).click();
  await page.getByRole('button', { name: 'Terminal wiring', exact: true }).click();
  await expect(page.locator('#wire-count')).toHaveText('1');
  await expect(page.locator('[data-wire="1"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Load NM cable example' }).click();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('.nm-cables')).toHaveCount(0);
  await expect(page.locator('#wire-count')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Terminal wiring', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('box inspection and splice controls fit mobile and remain keyboard accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=trainer');
  await page.getByRole('button', { name: 'Load NM cable example' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.inspection-diagram')).toBeVisible();
  await page.locator('[data-splice="switch-neutral"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-splice="switch-neutral"]')).toHaveText('Reconnect splice');
  const widths = await page.evaluate(() => ({ body: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
});
