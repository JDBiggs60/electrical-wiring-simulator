import { test, expect, type Page } from '@playwright/test';
const end=(p:Page,id:string)=>p.locator(`#junction-workspace [data-end="${id}"]`);
async function join(p:Page,ids:string[]){for(const id of ids)await end(p,id).locator('circle[fill="transparent"]').click();await p.locator('.junction-dialog [data-action="join"]').click();}
async function open(p:Page){await p.goto('/?view=trainer');await p.locator('#board [data-action="junction"]').click();await expect(p.getByRole('dialog')).toBeVisible();}
async function complete(p:Page){
  await join(p,['a.hot','b.hot']);await join(p,['a.neutral','b.neutral']);
  await p.locator('.junction-dialog [data-action="pigtail"]').click();
  await join(p,['a.ground','b.ground','pigtail.end']);
  await p.locator('#junction-workspace [data-bond]').click();
}
test('learner joins the actual conductor ends, bonds the box, powers and operates the test circuit',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await open(page);
  const box=await page.getByRole('dialog').boundingBox();expect(box!.width).toBeGreaterThan(1300);
  await expect(page.locator('#junction-workspace [data-end]')).toHaveCount(6);
  await page.locator('.junction-dialog [data-action="power"]').click();
  await expect(page.locator('.junction-feedback')).toContainText('Test power stays off');
  await complete(page);await page.locator('.junction-dialog [data-action="check"]').click();
  await expect(page.locator('.junction-feedback')).toContainText('Junction correctly connected');
  await expect(page.locator('[data-connector-graphic]')).toHaveCount(3);
  await page.locator('.junction-dialog [data-action="power"]').click();
  await expect(page.locator('.junction-lamp')).toHaveText('Test power ON · Test light OFF');
  await page.locator('.junction-dialog [data-action="switch"]').click();
  await expect(page.locator('.junction-lamp')).toHaveText('Test power ON · Test light ON');
  await expect(page.locator('.junction-dialog [data-remove-connector]').first()).toBeDisabled();
  await expect(page.locator('.junction-dialog [data-action="pigtail"]')).toBeDisabled();
  await page.locator('.junction-dialog [data-action="power"]').click();
  await page.locator('.junction-dialog [data-remove-connector="1"]').click();
  await page.locator('.junction-dialog [data-action="check"]').click();
  await expect(page.locator('.junction-feedback')).toContainText('Open hot');
  await join(page,['a.hot','b.hot']);await page.locator('.junction-dialog [data-action="power"]').click();
  await expect(page.locator('.junction-lamp')).toHaveText('Test power ON · Test light ON');expect(errors).toEqual([]);
});
test('incorrect splices give understandable fault feedback and can be removed and corrected',async({page})=>{
  await open(page);await join(page,['a.hot','b.neutral']);
  await page.locator('.junction-dialog [data-action="check"]').click();
  await expect(page.locator('.junction-feedback')).toContainText('Hot-to-neutral fault');
  await page.locator('.junction-dialog [data-action="power"]').click();
  await expect(page.locator('.junction-lamp')).toHaveText('Test power OFF · Test light OFF');
  await page.locator('.junction-dialog [data-remove-connector="1"]').click();await join(page,['b.hot','a.ground']);
  await page.locator('.junction-dialog [data-action="check"]').click();
  await expect(page.locator('.junction-feedback')).toContainText('Hot-to-ground fault');
  await page.locator('.junction-dialog [data-remove-connector="2"]').click();await complete(page);
  await page.locator('.junction-dialog [data-action="check"]').click();
  await expect(page.locator('.junction-feedback')).toContainText('Junction correctly connected');
});
test('a splice-connected pigtail with an unattached box end fails bonding validation',async({page})=>{
  await open(page);await complete(page);await page.locator('.junction-dialog [data-action="bond"]').click();
  await page.locator('.junction-dialog [data-action="check"]').click();
  await expect(page.locator('.junction-feedback')).toContainText('Missing steel-box bond');
  await expect(page.locator('.junction-continuity')).toContainText('Ground path: continuous');
  await expect(page.locator('.junction-continuity')).toContainText('Steel box bond: open');
  await page.locator('.junction-dialog [data-action="power"]').click();
  await expect(page.locator('.junction-lamp')).toContainText('Test power OFF');
});
test('closing and reopening preserves connectors and the separate Phase 1 exercise',async({page})=>{
  await page.goto('/?view=trainer');await page.locator('[data-terminal="panel.hot1"]').click();await page.locator('[data-terminal="switch.a"]').click();
  await page.locator('#open-junction').click();await join(page,['a.hot','b.hot']);
  await page.getByRole('button',{name:'Close box',exact:true}).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();await expect(page.locator('#wire-count')).toHaveText('1');
  await expect(page.locator('[data-wire="1"]')).toHaveCount(1);
  await page.locator('#board [data-action="junction"]').click();
  await expect(page.locator('[data-connector-graphic]')).toHaveCount(1);
  await expect(page.locator('.junction-connectors')).toContainText('Cable A · black + Cable B · black');
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.locator('#open-junction').click();await expect(page.locator('[data-connector-graphic]')).toHaveCount(1);
});
test('keyboard selection works and mobile controls remain accessible without horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/?view=trainer');await page.locator('#open-junction').click();
  await end(page,'a.hot').focus();await page.keyboard.press('Enter');await end(page,'b.hot').focus();await page.keyboard.press('Space');
  await expect(page.locator('.junction-selection')).toContainText('Cable A · black + Cable B · black');
  await page.locator('.junction-dialog [data-action="join"]').click();await expect(page.locator('[data-connector-graphic]')).toHaveCount(1);
  const widths=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth,dialog:document.querySelector('dialog')!.scrollWidth,width:document.querySelector('dialog')!.clientWidth}));
  expect(widths.doc).toBeLessThanOrEqual(widths.viewport);expect(widths.dialog).toBeLessThanOrEqual(widths.width);
});
