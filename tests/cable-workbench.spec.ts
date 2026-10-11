import { test,expect,type Page } from '@playwright/test';
async function place(page:Page,kind:string,x:number,y:number) {
  const tray=(await page.locator(`[data-tray-part="${kind}"]`).boundingBox())!,board=(await page.locator('#wb-canvas').boundingBox())!;
  await page.mouse.move(tray.x+tray.width/2,tray.y+tray.height/2);await page.mouse.down();await page.mouse.move(board.x+x,board.y+y,{steps:12});await page.mouse.up();
}
const entry=(p:Page,box:string,side:string)=>p.locator(`[data-entry-box="${box}"][data-entry="${side}"]`);
async function cableDrag(page:Page,from:string,fs:string,to:string,ts:string) {
  const a=(await entry(page,from,fs).boundingBox())!,b=(await entry(page,to,ts).boundingBox())!;
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+10,b.y+b.height/2+7,{steps:15});
  await expect(page.locator('[data-cable-preview]')).toBeVisible();await expect(page.locator('[data-cable-preview]')).toContainText('Release to install');await page.mouse.up();
}
async function inspect(page:Page,box:string) {await page.locator(`[data-inspect-box="${box}"]`).click();await expect(page.getByRole('dialog')).toBeVisible();}
async function close(page:Page){await page.getByRole('button',{name:'Return to workbench',exact:true}).click();}

test('two real cables follow both boxes and inspection exposes their same disconnected copper',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?view=cables');await place(page,'box',430,340);await place(page,'box',960,460);
  await expect(page.locator('[data-kind="box"]')).toHaveCount(2);
  await place(page,'switch',430-86+89,340-141+145);
  await expect(page.locator('[data-kind="switch"]')).toHaveAttribute('data-parent','part-1');
  await page.locator('[data-wb-action="unmount"]').click();await expect(page.locator('[data-kind="switch"]')).toHaveAttribute('data-parent','');
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('[data-kind="switch"]')).toHaveAttribute('data-parent','part-1');
  await page.locator('[data-cable-tool]').click();await cableDrag(page,'part-1','right','part-2','left');
  const cable=page.locator('[data-installed-cable="cable-1"]');await expect(cable).toHaveAttribute('data-from-box','part-1');await expect(cable).toHaveAttribute('data-to-box','part-2');
  await expect(cable).toHaveAttribute('data-from-entry','right');await expect(cable).toHaveAttribute('data-to-entry','left');
  const original=await cable.locator('path').first().getAttribute('d');
  for (const id of ['part-1','part-2']) {
    const box=page.locator(`[data-component="${id}"]`),r=(await box.boundingBox())!;
    await page.mouse.move(r.x+30,r.y+230);await page.mouse.down();await page.mouse.move(r.x+75,r.y+275,{steps:12});await page.mouse.up();
    await expect(cable).toHaveAttribute('data-from-box','part-1');await expect(cable).toHaveAttribute('data-to-box','part-2');
    expect(await cable.locator('path').first().getAttribute('d')).not.toBe(original);
  }
  await expect(page.locator('[data-kind="switch"]')).toHaveAttribute('data-parent','part-1');
  for (const id of ['part-1','part-2']) {
    await inspect(page,id);await expect(page.locator('[data-inspect-cable="cable-1"]')).toHaveCount(1);
    expect(await page.locator('[data-conductor-id]').evaluateAll(es=>es.map(e=>e.getAttribute('data-conductor-id')))).toEqual(['cable-1.black','cable-1.white','cable-1.bare']);
    await expect(page.locator('[data-termination="disconnected"]')).toHaveCount(3);await expect(page.locator('[data-hardware="wire-nut"]')).toHaveCount(0);await close(page);
  }
  await cableDrag(page,'part-1','left','part-2','right');
  for (const id of ['part-1','part-2']) {await inspect(page,id);await expect(page.locator('[data-inspect-cable]')).toHaveCount(2);await expect(page.locator('[data-termination="disconnected"]')).toHaveCount(6);await close(page);}
  await page.screenshot({path:'work/phase3b-cables.png',fullPage:true});
  await inspect(page,'part-1');await page.screenshot({path:'work/phase3b-inspection.png'});await close(page);
  expect(errors).toEqual([]);
});

test('cable and connected box deletion, cancellation, reset and history preserve attachments',async({page})=>{
  await page.goto('/?view=cables');await place(page,'box',430,340);await place(page,'box',960,460);await cableDrag(page,'part-1','right','part-2','left');
  await page.mouse.click(1200,850);
  const midpoint=await page.locator('[data-installed-cable] path').first().evaluate((el)=>{const path=el as SVGPathElement;const p=path.getPointAtLength(path.getTotalLength()/2).matrixTransform(path.getScreenCTM()!);return {x:p.x,y:p.y};});
  await page.mouse.click(midpoint.x,midpoint.y);await expect(page.locator('.wb-cable-label')).toContainText('cable-1');
  await page.getByRole('button',{name:'Delete',exact:true}).click();await expect(page.locator('[data-installed-cable]')).toHaveCount(0);
  await inspect(page,'part-1');await expect(page.locator('[data-inspect-cable]')).toHaveCount(0);await close(page);
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('[data-installed-cable]')).toHaveCount(1);
  await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(page.locator('[data-installed-cable]')).toHaveCount(0);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await page.locator('[data-component="part-1"]').click({position:{x:35,y:230}});await page.getByRole('button',{name:'Delete',exact:true}).click();
  await expect(page.locator('[data-installed-cable]')).toHaveCount(0);await expect(page.locator('[data-kind="box"]')).toHaveCount(1);
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('[data-installed-cable="cable-1"]')).toHaveCount(1);
  const a=(await entry(page,'part-1','left').boundingBox())!;
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(1100,650);await page.keyboard.press('Escape');await page.mouse.up();
  await expect(page.locator('[data-installed-cable]')).toHaveCount(1);await expect(page.locator('[data-cable-preview]')).toHaveCount(0);
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(1200,750);await page.mouse.up();await expect(page.locator('[data-installed-cable]')).toHaveCount(1);
  await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.locator('[data-component],[data-installed-cable]')).toHaveCount(0);
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('[data-kind="box"]')).toHaveCount(2);await expect(page.locator('[data-installed-cable]')).toHaveCount(1);
});


test('touch cable installation and keyboard entry pairing use the same model',async({browser})=>{
  const context=await browser.newContext({viewport:{width:1100,height:900},hasTouch:true});
  const page=await context.newPage();await page.goto('/?view=cables');
  const cdp=await context.newCDPSession(page);
  async function touch(from:{x:number;y:number},to:{x:number;y:number}) {
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});
    for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/10,y:from.y+(to.y-from.y)*i/10}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  const tray=(await page.locator('[data-tray-part="box"]').boundingBox())!,board=(await page.locator('#wb-canvas').boundingBox())!;
  for(const x of [380,830])await touch({x:tray.x+tray.width/2,y:tray.y+tray.height/2},{x:board.x+x,y:board.y+380});
  const a=(await entry(page,'part-1','right').boundingBox())!,b=(await entry(page,'part-2','left').boundingBox())!;
  await touch({x:a.x+a.width/2,y:a.y+a.height/2},{x:b.x+b.width/2,y:b.y+b.height/2});
  await expect(page.locator('[data-installed-cable="cable-1"]')).toHaveCount(1);
  await page.locator('[data-inspect-box="part-1"]').tap();await expect(page.locator('[data-termination="disconnected"]')).toHaveCount(3);await close(page);
  await entry(page,'part-1','left').focus();await page.keyboard.press('Enter');await entry(page,'part-2','right').focus();await page.keyboard.press('Enter');
  await expect(page.locator('[data-installed-cable]')).toHaveCount(2);
  await page.getByRole('button',{name:'Reset',exact:true}).tap();await expect(page.locator('[data-installed-cable]')).toHaveCount(0);
  await context.close();
});
