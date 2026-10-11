import { expect } from '@playwright/test';
export async function checkCableMouse(page,url) {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await expect(page.locator('.wb-cable-guide')).toBeVisible();
  const board=await page.locator('#wb-canvas').boundingBox();
  async function place(x,y) {
    const r=await page.locator('[data-tray-part="box"]').boundingBox();
    await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(board.x+x,board.y+y,{steps:12});await page.mouse.up();
  }
  await place(430,340);await place(960,460);
  const tool=await page.locator('[data-cable-tool]').boundingBox();
  await page.mouse.move(tool.x+tool.width/2,tool.y+tool.height/2);await page.mouse.down();await page.mouse.move(board.x+660,board.y+500,{steps:12});
  await expect(page.locator('[data-cable-draft]')).toBeVisible();await page.mouse.up();
  const draft=page.locator('[data-cable-draft]'),before=await draft.getAttribute('transform'),r=await draft.boundingBox();
  await page.mouse.move(r.x+r.width/2,r.y+12);await page.mouse.down();await page.mouse.move(r.x+r.width/2+50,r.y+62,{steps:10});await page.mouse.up();
  expect(await draft.getAttribute('transform')).not.toBe(before);await page.keyboard.press('Escape');
  await page.locator('[data-cable-tool]').click();
  await expect(page.locator('[data-entry-highlight="true"]')).toHaveCount(4);
  const a=await page.locator('[data-entry-box="part-1"][data-entry="right"]').boundingBox(),b=await page.locator('[data-entry-box="part-2"][data-entry="left"]').boundingBox();
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(board.x+700,board.y+350,{steps:12});
  await expect(page.locator('[data-cable-preview]')).toBeVisible();
  const preview=await page.locator('[data-cable-preview] path').first().getAttribute('d');
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});
  expect(await page.locator('[data-cable-preview] path').first().getAttribute('d')).not.toBe(preview);
  await expect(page.locator('[data-cable-preview]')).toContainText('Release to install');await page.mouse.up();
  const cable=page.locator('[data-installed-cable="cable-1"]');await expect(cable).toHaveCount(1);
  for(const id of ['part-1','part-2']) {
    const path=await cable.locator('path').first().getAttribute('d'),box=await page.locator(`[data-component="${id}"]`).boundingBox();
    await page.mouse.move(box.x+30,box.y+230);await page.mouse.down();await page.mouse.move(box.x+65,box.y+260,{steps:12});await page.mouse.up();
    expect(await cable.locator('path').first().getAttribute('d')).not.toBe(path);
    await expect(cable).toHaveAttribute('data-from-box','part-1');await expect(cable).toHaveAttribute('data-to-box','part-2');
    await page.locator(`[data-inspect-box="${id}"]`).click();await expect(page.locator('[data-inspect-cable="cable-1"]')).toHaveCount(1);
    await expect(page.locator('[data-termination="disconnected"]')).toHaveCount(3);
    await page.getByRole('button',{name:'Return to workbench',exact:true}).click();
  }
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(cable).toHaveCount(1);
  await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(cable).toHaveCount(1);
  expect(errors).toEqual([]);
  return {url:page.url(),mouseTrayDrag:true,mouseDraftPickup:true,highlightedEntries:true,mouseCableSnap:true,bothBoxRoutesUpdated:true,sharedInspection:true,runtimeErrors:errors};
}
