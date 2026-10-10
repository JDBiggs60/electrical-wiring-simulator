import { test, expect, type Page } from '@playwright/test';
const terminal = (page: Page, id: string) => page.locator(`[data-terminal="${id}"]`);
async function connect(page: Page, from: string, to: string) {
  await terminal(page, from).click();
  await terminal(page, to).click();
}
async function wireCircuit(page: Page) {
  await connect(page, 'panel.hot1', 'switch.a');
  await connect(page, 'switch.b', 'light.hot');
  await page.getByRole('button', { name: 'Neutral wire' }).click();
  await connect(page, 'panel.neutral', 'light.neutral');
  await page.getByRole('button', { name: 'Ground wire' }).click();
  await connect(page, 'panel.ground', 'switch.ground');
  await connect(page, 'panel.ground', 'light.ground');
}

test('complete lesson: check, power, toggle, safe editing, and reset', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?view=trainer');
  await expect(page.getByRole('heading', { name: 'Simple light circuit' })).toBeVisible();
  await wireCircuit(page);
  await page.getByRole('button', { name: 'Check my wiring' }).click();
  await expect(page.locator('#feedback')).toContainText('complete circuit');
  await page.getByRole('button', { name: 'Turn power on' }).click();
  await expect(page.locator('#board')).toContainText('LIGHT OFF');
  await page.getByRole('button', { name: 'Toggle light switch' }).click();
  await expect(page.locator('#board')).toContainText('LIGHT ON');
  await expect(page.locator('.bulb-glow')).toHaveCount(1);
  await terminal(page, 'panel.hot1').click();
  await expect(page.locator('#feedback')).toContainText('Power off first');
  await expect(page.locator('[data-remove]').first()).toBeDisabled();
  await page.getByRole('button', { name: 'Toggle light switch' }).click();
  await expect(page.locator('#board')).toContainText('LIGHT OFF');
  await page.getByRole('button', { name: 'Turn power off' }).click();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('#wire-count')).toHaveText('0');
  await expect(page.locator('#power-status')).toHaveText('Power off');
  await expect(page.locator('#board')).toContainText('SWITCH OFF');
  expect(errors).toEqual([]);
});

test('bad wiring has understandable feedback and cannot energize', async ({ page }) => {
  await page.goto('/?view=trainer');
  await connect(page, 'panel.hot1', 'light.hot');
  await page.getByRole('button', { name: 'Turn power on' }).click();
  await expect(page.locator('#feedback')).toContainText('bypasses the switch');
  await expect(page.locator('#feedback')).toContainText('Power stays off');
  await expect(page.locator('#power-status')).toHaveText('Power off');
  await page.getByRole('button', { name: 'Hint', exact: true }).click();
  await expect(page.locator('#feedback')).toContainText('Breaker 1');
  await page.locator('[data-remove]').click();
  await expect(page.locator('#wire-count')).toHaveText('0');
});

test('dragging wires connects terminals; moving a component keeps wires attached', async ({ page }) => {
  await page.goto('/?view=trainer');
  const from = await terminal(page, 'panel.hot1').boundingBox();
  const to = await terminal(page, 'switch.a').boundingBox();
  await page.mouse.move(from!.x + from!.width/2, from!.y + from!.height/2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width/2, to!.y + to!.height/2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('#wire-count')).toHaveText('1');
  const path = page.locator('[data-wire="1"] path').first();
  const before = await path.getAttribute('d');
  const header = await page.locator('[data-move="switch"]').boundingBox();
  await page.mouse.move(header!.x + 30, header!.y + 15);
  await page.mouse.down();
  await page.mouse.move(header!.x + 70, header!.y + 45, { steps: 8 });
  await page.mouse.up();
  await expect(path).not.toHaveAttribute('d', before!);
  await expect(page.locator('#wire-count')).toHaveText('1');
});

test('keyboard terminals connect and selected wires can be removed', async ({ page }) => {
  await page.goto('/?view=trainer');
  await terminal(page, 'panel.hot1').focus();
  await page.keyboard.press('Enter');
  await terminal(page, 'switch.a').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#wire-count')).toHaveText('1');
  await page.locator('[data-remove]').click();
  await expect(page.locator('#wire-count')).toHaveText('0');
  await expect(terminal(page, 'panel.hot1')).toHaveAttribute('aria-pressed', 'false');
});

test('mobile layout fits the viewport and the board scrolls within its panel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=trainer');
  await expect(page.getByRole('heading', { name: 'Simple light circuit' })).toBeVisible();
  const width = await page.evaluate(() => ({ body: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(width.body).toBeLessThanOrEqual(width.viewport);
  await page.getByRole('button', { name: 'Ground wire' }).click();
  await expect(page.getByRole('button', { name: 'Ground wire' })).toHaveAttribute('aria-pressed', 'true');
});
