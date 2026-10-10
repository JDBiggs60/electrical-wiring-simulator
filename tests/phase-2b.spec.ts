import { test, expect, type Page } from '@playwright/test';

const pick = async (page: Page, id: string) => page.locator(`[data-pick="${id}"]`).click();
async function attach(page: Page, end: string, terminal: string) {
  await pick(page, end);
  await page.locator(`.d-terminal-picker [data-terminal="${terminal}"]`).click();
}
async function join(page: Page, members: string[]) {
  for (const id of members) await pick(page, id);
  await page.locator('[data-action="join"]').click();
}
async function wireSwitch(page: Page) {
  await page.getByRole('button', { name: 'Open switch box', exact: true }).click();
  await attach(page, 'feed.hot.switch', 'switch.a');
  await attach(page, 'load.hot.switch', 'switch.b');
  await join(page, ['feed.neutral.switch', 'load.neutral.switch']);
  await join(page, ['feed.ground.switch', 'load.ground.switch', 'switch.device-ground.splice', 'switch.box-ground.splice']);
  await attach(page, 'switch.device-ground.terminal', 'switch.ground');
  await attach(page, 'switch.box-ground.terminal', 'switch.box');
  await page.locator('[data-action="close"]').click();
}
async function wireFixture(page: Page) {
  await page.getByRole('button', { name: 'Open fixture box', exact: true }).click();
  for (const kind of ['hot', 'neutral', 'ground']) {
    await join(page, ['load.' + kind + '.fixture', 'fixture.' + kind + '.splice', ...(kind === 'ground' ? ['fixture.box-ground.splice'] : [])]);
    await attach(page, 'fixture.' + kind + '.terminal', 'light.' + kind);
  }
  await attach(page, 'fixture.box-ground.terminal', 'light.box');
  await page.locator('[data-action="close"]').click();
}

test('selectable cables identify conductors and preserve corresponding ports in both box views', async ({ page }) => {
  await page.goto('/?view=lesson');
  await page.locator('[data-cable="load"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.d-cable-inspector')).toContainText('load.hot');
  await expect(page.locator('.d-cable-inspector')).toContainText('switch end loose / fixture end loose');
  await expect(page.locator('#diagram-board [data-cable-port="feed"]')).toHaveAttribute('data-side', 'left');
  await expect(page.locator('#diagram-board [data-cable-port="load"][data-box="switch"]')).toHaveAttribute('data-side', 'top');
  await expect(page.locator('#diagram-board [data-cable-port="load"][data-box="fixture"]')).toHaveAttribute('data-side', 'left');
  await page.getByRole('button', { name: 'Open switch box · top entry', exact: true }).click();
  await expect(page.locator('#diagram-closeup-art [data-cable-port="feed"]')).toHaveAttribute('data-side', 'left');
  await expect(page.locator('#diagram-closeup-art [data-cable-port="load"]')).toHaveAttribute('data-side', 'top');
  // Use the actual stripped-end and brass-screw artwork with the keyboard.
  await page.locator('[data-end="load.hot.switch"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('#diagram-closeup-art [data-terminal="switch.b"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-pick="load.hot.switch"]')).toContainText('connected');
  await page.keyboard.press('Escape');
  await expect(page.locator('.d-cable-inspector')).toContainText('switch end connected / fixture end loose');
  await page.getByRole('button', { name: 'Open fixture box · left entry', exact: true }).click();
  await expect(page.locator('#diagram-closeup-art [data-cable-port="load"]')).toHaveAttribute('data-side', 'left');
  await expect(page.locator('[data-pick="load.hot.fixture"]')).toContainText('loose');
  await expect(page.locator('[data-end="load.hot.fixture"]')).toHaveAttribute('data-conductor-id', 'load.hot');
});

test('student wiring across both boxes drives continuity, switch and light; edits persist and reset clears both', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?view=lesson');
  await page.locator('[data-lesson-action="power"]').click();
  await expect(page.locator('#lesson-light')).toContainText('Test power OFF · Light OFF');
  await expect(page.locator('.d-circuit-feedback')).toContainText('Correct the wiring first');
  await wireSwitch(page);
  await page.locator('[data-lesson-action="check"]').click();
  await expect(page.locator('.d-circuit-feedback')).toContainText('disconnected');
  await wireFixture(page);
  await page.locator('[data-lesson-action="check"]').click();
  await expect(page.locator('.d-circuit-feedback')).toContainText('Circuit correctly wired');
  await page.locator('[data-lesson-action="power"]').click();
  await expect(page.locator('#lesson-light')).toHaveText('Test power ON · Light OFF');
  await page.locator('[data-lesson-action="switch"]').click();
  await expect(page.locator('#lesson-light')).toHaveText('Test power ON · Light ON');
  await expect(page.locator('.d-lamp-lit')).toHaveCount(1);
  await page.getByRole('button', { name: 'Open fixture box', exact: true }).click();
  await expect(page.locator('.d-box-feedback')).toContainText('Light ON');
  await expect(page.locator('[data-action="join"]')).toBeDisabled();
  await page.locator('[data-action="switch"]').click();
  await expect(page.locator('.d-box-feedback')).toContainText('Light OFF');
  await page.locator('[data-action="power"]').click();
  await pick(page, 'fixture.neutral.terminal');
  await page.locator('[data-action="disconnect"]').click();
  await page.locator('[data-action="check"]').click();
  await expect(page.locator('.d-box-feedback')).toContainText('neutral: open');
  await page.locator('[data-action="close"]').click();
  await page.locator('[data-lesson-action="power"]').click();
  await expect(page.locator('#lesson-light')).toContainText('Test power OFF');
  await page.getByRole('button', { name: 'Open switch box', exact: true }).click();
  await expect(page.locator('[data-pick="feed.hot.switch"]')).toContainText('connected');
  await expect(page.locator('.d-connector-list > div')).toHaveCount(2);
  await page.locator('[data-action="close"]').click();
  await page.locator('[data-lesson-action="reset"]').click();
  await page.getByRole('button', { name: 'Open switch box', exact: true }).click();
  await expect(page.locator('.d-connector-list')).toContainText('No connectors installed');
  await expect(page.locator('.d-terminal-picker')).not.toContainText('occupied');
  await page.locator('[data-action="close"]').click();
  await page.getByRole('button', { name: 'Open fixture box', exact: true }).click();
  await expect(page.locator('.d-connector-list')).toContainText('No connectors installed');
  await expect(page.locator('.d-terminal-picker')).not.toContainText('occupied');
  expect(errors).toEqual([]);
});

test('wrong connector membership reports faults and removal frees the selected ends', async ({ page }) => {
  await page.goto('/?view=lesson');
  await page.getByRole('button', { name: 'Open switch box', exact: true }).click();
  await join(page, ['feed.hot.switch', 'load.neutral.switch']);
  await page.locator('[data-action="check"]').click();
  await expect(page.locator('.d-box-feedback')).toContainText('different purposes');
  await page.locator('[data-action="power"]').click();
  await expect(page.locator('.d-box-feedback')).toContainText('Test power OFF');
  await page.locator('[data-remove-connector="1"]').click();
  await expect(page.locator('[data-pick="feed.hot.switch"]')).toContainText('loose');
  await expect(page.locator('[data-pick="load.neutral.switch"]')).toContainText('loose');
  await join(page, ['feed.neutral.switch', 'load.neutral.switch']);
  await page.locator('[data-action="close"]').click();
  await page.getByRole('button', { name: 'Open switch box', exact: true }).click();
  await expect(page.locator('.d-connector-list')).toContainText('Supply · white + To fixture · white');
});

test('mobile wiring controls are usable and close-up does not overflow the page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=lesson');
  await page.getByRole('button', { name: 'Open switch box', exact: true }).click();
  await attach(page, 'feed.hot.switch', 'switch.a');
  await expect(page.locator('[data-pick="feed.hot.switch"]')).toContainText('connected');
  const width = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(width.doc).toBeLessThanOrEqual(width.viewport);
  await page.getByRole('button', { name: 'Return to circuit' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
