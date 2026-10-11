import { test, expect } from '@playwright/test';

test('NM-B visibly follows a tray drag and can be picked up after a background drop',async({page})=>{
  await page.goto('/?view=cables');
  const tray=(await page.locator('[data-cable-tool]').boundingBox())!,board=(await page.locator('#wb-canvas').boundingBox())!;
  await page.mouse.move(tray.x+tray.width/2,tray.y+tray.height/2);await page.mouse.down();
  await page.mouse.move(board.x+650,board.y+450,{steps:12});
  await expect(page.locator('[data-cable-draft]')).toBeVisible();
  await page.mouse.up();await expect(page.locator('[data-cable-draft]')).toBeVisible();
  await expect(page.locator('[data-installed-cable]')).toHaveCount(0);
  const before=await page.locator('[data-cable-draft]').getAttribute('transform');
  const draft=(await page.locator('[data-cable-draft]').boundingBox())!;
  await page.mouse.move(draft.x+draft.width/2,draft.y+12);await page.mouse.down();await page.mouse.move(draft.x+draft.width/2+80,draft.y+92,{steps:10});await page.mouse.up();
  expect(await page.locator('[data-cable-draft]').getAttribute('transform')).not.toEqual(before);
  await page.keyboard.press('Escape');await expect(page.locator('[data-cable-draft]')).toHaveCount(0);
  await expect(page.locator('[data-installed-cable]')).toHaveCount(0);
});

test('beginner cable workflow uses real mouse dragging and shared installed routes',async({page})=>{
  const { checkCableMouse }=await import('../scripts/cable-browser-check.mjs');
  await checkCableMouse(page,'/?view=cables');
});
