import { test, expect } from '@playwright/test';

test('approval prototype shows recognizable exploded hardware, loose ends and the preserved lesson link', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror',e => errors.push(e.message));
  await page.goto('/?view=study');
  await expect(page.getByRole('heading',{name:'Residential wiring · hardware study'})).toBeVisible();
  await expect(page.locator('.hardware-review')).toContainText('Visual prototype for approval');
  const drawing = page.locator('#hardware-installation');
  await expect(drawing.locator('[data-hardware="steel-device-box"]')).toHaveCount(1);
  await expect(drawing.locator('[data-hardware="steel-octagon-box"]')).toHaveCount(1);
  await expect(drawing.locator('[data-hardware="single-pole-toggle"]')).toHaveCount(1);
  await expect(drawing.locator('[data-hardware="porcelain-keyless-holder"]')).toHaveCount(1);
  await expect(drawing.locator('[data-hardware="box-sidewall"]')).toHaveCount(5);
  await expect(drawing.locator('[data-hardware="nm-box-connector"]')).toHaveCount(3);
  await expect(drawing.locator('[data-end-state="loose"]')).toHaveCount(21);
  await expect(drawing.locator('[data-end-state="connected"],[data-connector-id]')).toHaveCount(0);
  await expect(page.locator('[data-lesson-action]')).toHaveCount(0);
  await expect(drawing.locator('linearGradient,filter,image')).toHaveCount(0);
  await page.getByRole('link',{name:'Open working Phase 2B lesson'}).click();
  await expect(page).toHaveURL(/view=lesson/);
  await expect(page.getByRole('heading',{name:'Residential lighting circuit',exact:true})).toBeVisible();
  await page.locator('[data-lesson-action="power"]').click();
  await expect(page.locator('#lesson-light')).toContainText('Test power OFF · Light OFF');
  expect(errors).toEqual([]);
});

test('enlargements render the same endpoints, cable entries, terminals and state as the complete installation', async ({ page }) => {
  await page.goto('/?view=study');
  for (const box of ['switch','fixture']) {
    const original = await page.locator(`#hardware-installation [data-installation-box="${box}"]`).evaluate(element => ({
      ends: [...element.querySelectorAll('[data-end-id]')].map(e => e.outerHTML),
      ports: [...element.querySelectorAll('[data-cable-port]')].map(e => e.outerHTML),
      terminals: [...element.querySelectorAll('[data-terminal-id]')].map(e => e.outerHTML),
    }));
    await page.locator(`[data-inspect="${box}"]`).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const enlarged = await page.locator('#hardware-detail-art [data-installation-box]').evaluate(element => ({
      ends: [...element.querySelectorAll('[data-end-id]')].map(e => e.outerHTML),
      ports: [...element.querySelectorAll('[data-cable-port]')].map(e => e.outerHTML),
      terminals: [...element.querySelectorAll('[data-terminal-id]')].map(e => e.outerHTML),
    }));
    expect(enlarged).toEqual(original);
    await expect(page.locator('#hardware-detail-art [data-uninstalled="true"] [data-hardware="wire-nut"]')).toHaveCount(1);
    await expect(page.locator('#hardware-detail-art [data-connector-id]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  }
});

test('switch current screws are brass side terminals; grounding and mounting hardware stay distinct', async ({ page }) => {
  await page.goto('/?view=study');
  await page.locator('[data-inspect-box="switch"]').focus();
  await page.keyboard.press('Enter');
  const art = page.locator('#hardware-detail-art');
  for (const id of ['switch.a','switch.b']) {
    const terminal = art.locator(`[data-terminal-id="${id}"]`);
    await expect(terminal).toHaveAttribute('data-terminal-location','body-right-side');
    await expect(terminal.locator('[data-screw-kind]')).toHaveAttribute('data-screw-kind','brass');
  }
  await expect(art.locator('[data-terminal-id="switch.ground"]')).toHaveAttribute('data-terminal-location','metal-yoke-left');
  await expect(art.locator('[data-terminal-id="switch.box"]')).toHaveAttribute('data-terminal-location','recessed-box-back');
  await expect(art.locator('[data-hardware="loose-mounting-screw"]')).toHaveCount(2);
  await page.getByRole('button',{name:'Return to installation'}).click();
  await expect(page.locator('[data-inspect-box="switch"]')).toBeFocused();
  await page.locator('[data-inspect="fixture"]').click();
  await expect(art.locator('[data-terminal-id="light.ground"]')).toHaveAttribute('data-terminal-location','steel-mounting-strap');
  await expect(art.locator('[data-terminal-id="light.neutral"] [data-screw-kind]')).toHaveAttribute('data-screw-kind','steel');
});

test('mobile contains drawing overflow and permits inspecting both detailed assemblies', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?view=study');
  for (const box of ['switch','fixture']) {
    await page.locator(`[data-inspect="${box}"]`).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth, viewport:innerWidth,
      art: document.querySelector('#hardware-detail-art')!.scrollWidth,
      window: document.querySelector('#hardware-detail-art')!.clientWidth,
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.art).toBeGreaterThan(dimensions.window);
    await page.locator('#hardware-detail-art').evaluate(element => { element.scrollLeft = element.scrollWidth; });
    await page.getByRole('button',{name:'Return to installation'}).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  }
});
