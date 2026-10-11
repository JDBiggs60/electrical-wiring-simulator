import { test, expect, type Page } from '@playwright/test';
async function trayDrag(page: Page, kind: string, x: number, y: number) {
  const tray = await page.locator(`[data-tray-part="${kind}"]`).boundingBox();
  const board = await page.locator('#wb-canvas').boundingBox();
  await page.mouse.move(tray!.x+tray!.width/2,tray!.y+tray!.height/2);
  await page.mouse.down();
  await page.mouse.move(board!.x+x,board!.y+y,{steps:15});
}
async function movePart(page: Page, id: string, dx: number, dy: number) {
  const el = await page.locator(`[data-component="${id}"]`).boundingBox();
  await page.mouse.move(el!.x+el!.width/2,el!.y+el!.height/2);
  await page.mouse.down(); await page.mouse.move(el!.x+el!.width/2+dx,el!.y+el!.height/2+dy,{steps:12}); await page.mouse.up();
}

test('mouse places parts, previews mount, snaps in model, moves assembly and restores each action', async ({ page }) => {
  const errors: string[]=[]; page.on('pageerror',e => errors.push(e.message));
  await page.goto('/?view=workbench');
  await expect(page.locator('[data-component]')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
  await trayDrag(page,'box',450,320); await page.mouse.up();
  const box = page.locator('[data-kind="box"]');
  await expect(box).toHaveCount(1);
  const bx = Number(await box.getAttribute('data-x')), by = Number(await box.getAttribute('data-y'));
  await movePart(page,'part-1',60,30);
  await expect(box).toHaveAttribute('data-x',String(bx+60));
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(box).toHaveAttribute('data-x',String(bx));
  await trayDrag(page,'switch',bx+35+54,by-6+151);
  await expect(page.locator('[data-snap-target="part-1"]')).toBeVisible();
  await page.mouse.up();
  const sw = page.locator('[data-kind="switch"]');
  await expect(sw).toHaveAttribute('data-parent','part-1');
  await expect(sw).toHaveAttribute('data-x',String(bx+35));
  await expect(sw).toHaveAttribute('data-y',String(by-6));
  await movePart(page,'part-2',130,70);
  await expect(box).toHaveAttribute('data-x',String(bx+130));
  await expect(sw).toHaveAttribute('data-x',String(bx+165));
  await page.keyboard.press('Control+z');
  await expect(sw).toHaveAttribute('data-x',String(bx+35));
  await page.keyboard.press('Control+y');
  await expect(sw).toHaveAttribute('data-x',String(bx+165));
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(page.locator('[data-component]')).toHaveCount(0);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(page.locator('[data-component]')).toHaveCount(2);
  await expect(sw).toHaveAttribute('data-parent','part-1');
  await page.screenshot({path:'work/phase3-assembled.png',fullPage:true});
  expect(errors).toEqual([]);
});

test('delete selected assembly, redo branch, cancelled placement and collapsible tray', async ({ page }) => {
  await page.goto('/?view=workbench');
  await trayDrag(page,'box',420,320); await page.mouse.up();
  await page.getByRole('button',{name:'Delete',exact:true}).click();
  await expect(page.locator('[data-component]')).toHaveCount(0);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(page.locator('[data-component]')).toHaveCount(1);
  await trayDrag(page,'box',750,380); await page.mouse.up();
  await expect(page.getByRole('button',{name:'Redo',exact:true})).toBeDisabled();
  await trayDrag(page,'switch',950,350); await page.keyboard.press('Escape'); await page.mouse.up();
  await expect(page.locator('[data-component]')).toHaveCount(2);
  await page.locator('.wb-tray summary').click();
  await expect(page.locator('[data-tray-part="box"]')).not.toBeVisible();
});

test('real touch events place, mount and move components on a narrow workbench', async ({ browser }) => {
  const context = await browser.newContext({viewport:{width:430,height:900},hasTouch:true,isMobile:true});
  const page = await context.newPage(); await page.goto('/?view=workbench');
  const cdp = await context.newCDPSession(page);
  async function touchDrag(from: {x:number;y:number}, to: {x:number;y:number}) {
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});
    for (let i=1;i<=12;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/12,y:from.y+(to.y-from.y)*i/12}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  const board = (await page.locator('#wb-canvas').boundingBox())!;
  const trayBox = (await page.locator('[data-tray-part="box"]').boundingBox())!;
  await touchDrag({x:trayBox.x+trayBox.width/2,y:trayBox.y+trayBox.height/2},{x:board.x+280,y:board.y+390});
  const box = page.locator('[data-kind="box"]'); await expect(box).toHaveCount(1);
  const x = Number(await box.getAttribute('data-x')), y = Number(await box.getAttribute('data-y'));
  const traySwitch = (await page.locator('[data-tray-part="switch"]').boundingBox())!;
  await touchDrag({x:traySwitch.x+traySwitch.width/2,y:traySwitch.y+traySwitch.height/2},{x:board.x+x+89,y:board.y+y+145});
  await expect(page.locator('[data-kind="switch"]')).toHaveAttribute('data-parent','part-1');
  const sw = (await page.locator('[data-kind="switch"]').boundingBox())!;
  await touchDrag({x:sw.x+sw.width/2,y:sw.y+sw.height/2},{x:sw.x+sw.width/2-40,y:sw.y+sw.height/2+80});
  await expect(box).toHaveAttribute('data-x',String(x-40));
  await expect(page.locator('[data-kind="switch"]')).toHaveAttribute('data-x',String(x-5));
  await page.getByRole('button',{name:'Reset',exact:true}).tap();
  await expect(page.locator('[data-component]')).toHaveCount(0);
  await page.getByRole('button',{name:'Undo',exact:true}).tap();
  await expect(page.locator('[data-component]')).toHaveCount(2);
  await page.getByRole('button',{name:'Redo',exact:true}).tap();
  await expect(page.locator('[data-component]')).toHaveCount(0);
  await page.locator('.wb-tray summary').tap();
  await expect(page.locator('[data-tray-part="box"]')).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
