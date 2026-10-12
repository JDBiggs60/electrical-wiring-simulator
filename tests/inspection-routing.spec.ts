import {test, expect, type Locator} from '@playwright/test';

for (const kind of ['switch', 'lampholder'] as const) test(`${kind}: bounded inspection routing preserves connections and drag history`, async ({page}) => {
  test.setTimeout(90000);
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?view=cables');
  const dialog=page.getByRole('dialog');
  async function drag(a:Locator,b:Locator) {
    const f=(await a.boundingBox())!,t=(await b.boundingBox())!;
    await page.mouse.move(f.x+f.width/2,f.y+f.height/2);await page.mouse.down();
    await page.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps:12});await page.mouse.up();
  }
  async function place(k:string,x:number,y:number) {
    const a=(await page.locator(`[data-tray-part="${k}"]`).boundingBox())!,b=(await page.locator('#wb-canvas').boundingBox())!;
    await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();
    await page.mouse.move(b.x+x,b.y+y,{steps:12});await page.mouse.up();
  }
  await place('box',400,350);await place(kind==='switch'?'box':'ceiling',800,420);
  await place(kind,803,424);
  await page.locator('[data-cable-tool]').click();
  await drag(page.locator('[data-entry-box="part-1"][data-entry="right"]'),page.locator('[data-entry-box="part-2"][data-entry="left"]'));
  if(kind==='switch') {
    await place('box',1110,650);await page.locator('[data-cable-tool]').click();
    await drag(page.locator('[data-entry-box="part-2"][data-entry="right"]'),page.locator('[data-entry-box="part-4"][data-entry="left"]'));
  }
  const open=()=>page.locator('[data-inspect-box="part-2"]').click();
  const close=()=>page.getByRole('button',{name:'Return to workbench',exact:true}).click();
  const end=(id:string)=>dialog.locator(`[data-drag-end="${id}"],[data-anchored-end="${id}"]`);
  const terminal=(id:string)=>dialog.locator(`[data-wire-target="${id}"] circle`).last();
  async function connect(id:string,target:string) {
    await drag(end(id),terminal(target));
    await expect(dialog.locator(`[data-end-id="${id}"]`)).toHaveAttribute('data-connection-target',target);
  }
  await open();await dialog.locator('[data-wire-action="pull"]').click();
  const hot=kind==='switch'?'part-3.a':'part-3.hot';
  await connect('cable-1.black.to',hot);
  if(kind==='switch') {
    await connect('cable-2.black.from','part-3.b');
    await drag(end('cable-1.white.to'),end('cable-2.white.from'));
    await dialog.locator('[data-install-wire-nut]').click();
  } else await connect('cable-1.white.to','part-3.neutral');
  if(kind==='switch')await dialog.locator('[data-wire-action="device-tail"]').click();
  await dialog.locator('[data-wire-action="box-tail"]').click();
  await dialog.locator('[data-wire-action="connector"]').click();
  const tails=await dialog.locator('[data-drag-end],[data-anchored-end]').evaluateAll(es=>es.map(e=>(e.getAttribute('data-drag-end')??e.getAttribute('data-anchored-end'))!).filter(id=>id.startsWith('pigtail')));
  const nut=(await dialog.locator('[data-ground-connector]').getAttribute('data-ground-connector'))!;
  await connect('cable-1.bare.to',nut);
  if(kind==='switch')await connect('cable-2.bare.from',nut);
  for(let i=0;i<tails.length;i+=2)await connect(tails[i]!,nut);
  if(kind==='switch')await expect(dialog.locator(`[data-end-id="${tails[1]}"]`)).toHaveAttribute('data-connection-target','part-3.ground');
  await expect(dialog.locator(`[data-end-id="${tails.at(-1)}"]`)).toHaveAttribute('data-connection-target','part-2.box');
  await page.mouse.move(1200,60);
  await dialog.screenshot({path:`work/${kind}-inspection-after.png`});
  const snapshot=async()=>dialog.locator('[data-end-id]').evaluateAll(es=>es.map(e=>({id:e.getAttribute('data-end-id'),to:e.getAttribute('data-connection-target')})));
  const initial=await snapshot();
  await expect(dialog.locator('[data-ground-status="box"]')).toHaveAttribute('data-complete','true');
  await expect(dialog.locator('[data-ground-status="splice"]')).toHaveAttribute('data-complete','true');
  if(kind==='switch')await expect(dialog.locator('[data-ground-status="device"]')).toHaveAttribute('data-complete','true');
  async function checkGeometry() {
    const result=await dialog.locator('[data-wiring-canvas]').evaluate((svg,ceiling)=>{
      const inverse=(svg as SVGSVGElement).getScreenCTM()!.inverse();
      const local=(p:DOMPoint)=>p.matrixTransform(inverse);
      // Interior polygons in the same SVG coordinates as the artwork, including
      // a small safety inset. Device-bound leads may bridge to the pulled device.
      const inside=(p:DOMPoint)=>{
        const x=(p.x-140)/1.9,y=(p.y-90)/1.9;
        return ceiling ? x>=20&&x<=200&&y>=20&&y<=200&&x+y>=90&&x+y<=350&&x-y<=130&&y-x<=130 : x>=27&&x<=145&&y>=19&&y<=259;
      };
      const escaped:string[]=[],crossed:string[]=[],overshot:string[]=[];
      const face=svg.querySelector('[data-inspection-device] [data-device-body]');
      const r=face!.getBoundingClientRect();
      for(const path of svg.querySelectorAll<SVGPathElement>('[data-wiring-wire] path:first-of-type')) {
        const wire=path.parentElement!,id=wire.getAttribute('data-end-id')!;
        const length=path.getTotalLength(),a=path.getPointAtLength(0),b=path.getPointAtLength(length);
        if(length>Math.hypot(a.x-b.x,a.y-b.y)+2*(r.width+r.height)/path.getScreenCTM()!.a)overshot.push(id);
        const tip=svg.querySelector(`[data-drag-end="${id}"] circle,[data-anchored-end="${id}"] circle`) as SVGCircleElement;
        if(Math.hypot(b.x-tip.cx.baseVal.value,b.y-tip.cy.baseVal.value)>.1)overshot.push('incorrect endpoint: '+id);
        for(let i=0;i<=100;i++) {
          const point=path.getPointAtLength(length*i/100),screen=point.matrixTransform(path.getScreenCTM()!);
          if(screen.x>r.left+3&&screen.x<r.right-3&&screen.y>r.top+3&&screen.y<r.bottom-3)crossed.push(id);
          if(!inside(local(screen)))escaped.push(id);
          if(point.y<Math.min(a.y,b.y,local(new DOMPoint(r.left,r.top)).y)-20||point.y>Math.max(a.y,b.y,local(new DOMPoint(r.right,r.bottom)).y)+20)overshot.push(id);
        }
      }
      for(const cap of svg.querySelectorAll('[data-wire-nut] [data-hardware="wire-nut"]')){
        const b=cap.getBoundingClientRect();
        for(const [x,y]of [[b.left,b.top],[b.right,b.top],[b.right,b.bottom],[b.left,b.bottom]])if(!inside(local(new DOMPoint(x,y))))escaped.push('wire nut');
      }
      return {escaped:[...new Set(escaped)],crossed:[...new Set(crossed)],overshot:[...new Set(overshot)]};
    },kind==='lampholder');
    expect(result).toEqual({escaped:[],crossed:[],overshot:[]});
  }
  await checkGeometry();
  const before=await dialog.locator(`[data-end-id="cable-1.bare.to"] path`).first().getAttribute('d');
  const cap=dialog.locator(`[data-move-wire-nut="${nut}"]`),bounds=(await cap.boundingBox())!;
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();
  await page.mouse.move(bounds.x+bounds.width/2+250,bounds.y+bounds.height/2-250,{steps:12});await page.mouse.up();
  expect(await dialog.locator(`[data-end-id="cable-1.bare.to"] path`).first().getAttribute('d')).not.toBe(before);
  expect(await snapshot()).toEqual(initial);await checkGeometry();
  await dialog.locator('[data-wire-action="undo"]').click();
  await expect(dialog.locator(`[data-end-id="cable-1.bare.to"] path`).first()).toHaveAttribute('d',before!);
  await dialog.locator('[data-wire-action="redo"]').click();await checkGeometry();
  await end('cable-1.black.to').click();await dialog.locator('[data-wire-action="disconnect"]').click();
  await expect(dialog.locator('[data-end-id="cable-1.black.to"]')).toHaveAttribute('data-connection-target','');
  await close();await expect(page.locator('[data-main-end="cable-1.black.to"]')).toHaveCount(0);
  await open();await connect('cable-1.black.to',hot);await checkGeometry();
  await dialog.locator('[data-wire-action="undo"]').click();
  await expect(dialog.locator('[data-end-id="cable-1.black.to"]')).toHaveAttribute('data-connection-target','');
  await dialog.locator('[data-wire-action="redo"]').click();expect(await snapshot()).toEqual(initial);await checkGeometry();
  await close();await expect(page.locator('[data-main-end="cable-1.black.to"]')).toHaveAttribute('data-connection-target',hot);
  const box=(await page.locator('[data-component="part-2"]').boundingBox())!;
  await page.mouse.move(box.x+28,box.y+30);await page.mouse.down();await page.mouse.move(box.x+68,box.y+60,{steps:12});await page.mouse.up();
  await open();expect(await snapshot()).toEqual(initial);await checkGeometry();
  expect(errors).toEqual([]);
});
