import {expect} from '@playwright/test';
export async function checkAnchoredInspection(page,url,kind='switch',phone=false,prefix='work/anchored'){
 const resize=async size=>{await page.setViewportSize(size);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await resize({width:1440,height:1100});await page.goto(url);
 async function place(k,x,y){const a=await page.locator(`[data-tray-part="${k}"]`).boundingBox(),b=await page.locator('#wb-canvas').boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+x,b.y+y,{steps:10});await page.mouse.up();}
 async function drag(a,b){const f=await a.boundingBox(),t=await b.boundingBox();await page.mouse.move(f.x+f.width/2,f.y+f.height/2);await page.mouse.down();await page.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps:12});await page.mouse.up();}
 await place('box',400,350);await place('box',800,420);await place(kind,803,424);await place('box',1110,650);
 for(const [a,ae,b,be]of [['part-1','right','part-2','left'],['part-2','right','part-4','left']]){await page.locator('[data-cable-tool]').click();await drag(page.locator(`[data-entry-box="${a}"][data-entry="${ae}"]`),page.locator(`[data-entry-box="${b}"][data-entry="${be}"]`));}
 const open=()=>page.locator('[data-inspect-box="part-2"]').click(),close=()=>page.getByRole('button',{name:'Return to workbench',exact:true}).click();
 await open();const dialog=page.getByRole('dialog');
 await dialog.locator('[data-wire-action="pull"]').click();
 if(phone)await resize({width:390,height:844});
 await dialog.locator('[data-wire-action="device-tail"]').click();
 await expect(dialog.locator('[data-anchored-end]')).toHaveCount(1);
 const deviceEnd=await dialog.locator('[data-anchored-end]').getAttribute('data-anchored-end');
 await expect(dialog.locator(`[data-end-id="${deviceEnd}"]`)).toHaveAttribute('data-connection-target','part-3.ground');
 await expect(dialog.locator('[data-drag-end]').filter({has:page.locator('circle')})).toHaveCount(7);
 await dialog.locator('[data-wire-action="box-tail"]').click();
 await expect(dialog.locator('[data-anchored-end]')).toHaveCount(2);
 const fixed=await dialog.locator('[data-anchored-end]').evaluateAll(es=>es.map(e=>e.getAttribute('data-anchored-end')));
 await expect(dialog.locator(`[data-end-id="${fixed[1]}"]`)).toHaveAttribute('data-connection-target','part-2.box');
 await dialog.locator('[data-wire-action="undo"]').click();await expect(dialog.locator('[data-anchored-end]')).toHaveCount(1);
 await dialog.locator('[data-wire-action="redo"]').click();await expect(dialog.locator('[data-anchored-end]')).toHaveCount(2);
 const svg=dialog.locator('[data-wiring-canvas]');
 async function geometry(){
  await svg.scrollIntoViewIfNeeded();
  const result=await svg.evaluate(svg=>{
   const inv=svg.getScreenCTM().inverse(),body=svg.querySelector('[data-device-body]').getBoundingClientRect(),bad=[],escaped=[],wrong=[];
   for(const path of svg.querySelectorAll('[data-wiring-wire] path:first-of-type')){
    const id=path.parentElement.dataset.endId,length=path.getTotalLength(),tip=path.getPointAtLength(length),anchor=svg.querySelector(`[data-drag-end="${id}"] circle,[data-anchored-end="${id}"] circle`);
    if(Math.hypot(tip.x-anchor.cx.baseVal.value,tip.y-anchor.cy.baseVal.value)>.1)wrong.push(id);
    for(let i=0;i<=100;i++){
     const screen=path.getPointAtLength(length*i/100).matrixTransform(path.getScreenCTM()),p=screen.matrixTransform(inv),x=(p.x-140)/1.9,y=(p.y-90)/1.9;
     if(x<26||x>147||y<18||y>260)escaped.push(id);
     if(screen.x>body.left+2&&screen.x<body.right-2&&screen.y>body.top+2&&screen.y<body.bottom-2)bad.push(id);
    }
   }
   const v=svg.getBoundingClientRect();return {bad:[...new Set(bad)],escaped:[...new Set(escaped)],wrong:[...new Set(wrong)],fits:v.width<=innerWidth};
  });expect(result).toEqual({bad:[],escaped:[],wrong:[],fits:true});
 }
 await geometry();await svg.screenshot({path:`${prefix}-${kind}-${phone?'phone':'desktop'}-loose.png`});
 const end=id=>dialog.locator(`[data-drag-end="${id}"]`),target=id=>dialog.locator(`[data-wire-target="${id}"] circle`).last();
 async function connect(id,to){await svg.scrollIntoViewIfNeeded();await drag(end(id),target(to));await expect(dialog.locator(`[data-end-id="${id}"]`)).toHaveAttribute('data-connection-target',to);}
 const hotA=kind==='switch'?'part-3.a':'part-3.hot.upper',hotB=kind==='switch'?'part-3.b':'part-3.hot.lower';
 await connect('cable-1.black.to',hotA);await connect('cable-2.black.from',hotB);
 if(kind==='switch'){
  await svg.scrollIntoViewIfNeeded();await drag(end('cable-1.white.to'),end('cable-2.white.from'));await dialog.locator('[data-install-wire-nut]').click();
 }else{await connect('cable-1.white.to','part-3.neutral.upper');await connect('cable-2.white.from','part-3.neutral.lower');}
 await dialog.locator('[data-wire-action="connector"]').click();const nut=await dialog.locator('[data-ground-connector]').getAttribute('data-ground-connector');
 const tails=await dialog.locator('[data-drag-end]').evaluateAll(es=>es.map(e=>e.dataset.dragEnd).filter(id=>id.startsWith('pigtail')));expect(tails).toHaveLength(2);
 for(const id of ['cable-1.bare.to','cable-2.bare.from',...tails])await connect(id,nut);
 for(const k of ['splice','device','box'])await expect(dialog.locator(`[data-ground-status="${k}"]`)).toHaveAttribute('data-complete','true');
 await geometry();
 await svg.screenshot({path:`${prefix}-${kind}-${phone?'phone':'desktop'}-connected.png`});
 // A pull/drag moves the physical screw and the attached endpoint together.
 const device=await dialog.locator('[data-device-body]').boundingBox(),before=await dialog.locator(`[data-anchored-end="${deviceEnd}"]`).boundingBox();
 await page.mouse.move(device.x+device.width/2,device.y+device.height/2);await page.mouse.down();await page.mouse.move(device.x+device.width/2-12,device.y+device.height/2+7,{steps:10});
 const moved=await dialog.locator(`[data-anchored-end="${deviceEnd}"]`).boundingBox();expect(Math.hypot(moved.x-before.x,moved.y-before.y)).toBeGreaterThan(2);
 await expect(dialog.locator(`[data-end-id="${deviceEnd}"]`)).toHaveAttribute('data-connection-target','part-3.ground');await geometry();await page.mouse.up();
 // Clicking/dragging an anchored copper tip must not detach or reroute it.
 await svg.scrollIntoViewIfNeeded();const anchor=await dialog.locator(`[data-anchored-end="${deviceEnd}"]`).boundingBox();
 await page.mouse.move(anchor.x+anchor.width/2,anchor.y+anchor.height/2);await page.mouse.down();await page.mouse.move(anchor.x+anchor.width/2+30,anchor.y+anchor.height/2+15,{steps:5});await page.mouse.up();
 await expect(dialog.locator(`[data-end-id="${deviceEnd}"]`)).toHaveAttribute('data-connection-target','part-3.ground');await geometry();
 await close();await expect(page.locator(`[data-main-end="${deviceEnd}"]`)).toHaveAttribute('data-connection-target','part-3.ground');
 if(phone)await resize({width:1440,height:1100});await open();if(phone)await resize({width:390,height:844});await geometry();await expect(dialog.locator('[data-anchored-end]')).toHaveCount(2);expect(errors).toEqual([]);
 return {kind,phone,anchoredPigtails:true,cavityRoutes:true,realEndpoints:true,deviceMovement:true,reopening:true,undoRedo:true};
}
