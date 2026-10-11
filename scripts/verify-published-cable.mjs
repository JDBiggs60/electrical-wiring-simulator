import { checkPanelMouse } from './panel-browser-check.mjs';
import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
import { checkCableMouse, checkReceptacleMouse } from './cable-browser-check.mjs';
const base='https://jdbiggs60.github.io/electrical-wiring-simulator/preview/';
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const revision=process.env.GITHUB_SHA;
  let fresh=false;
  for(let i=0;i<12;i++) {
    const response=await page.request.get(`${base}preview-revision.json?check=${Date.now()}`);
    if(response.ok() && (await response.json()).revision===revision) {fresh=true;break;}
    await new Promise(resolve=>setTimeout(resolve,5000));
  }
  if(!fresh) throw new Error('Published preview has not reached the deployed revision');
  const report=await checkCableMouse(page,`${base}?view=cables&revision=${revision}`);
  Object.assign(report,await checkReceptacleMouse(page));
  Object.assign(report,await checkPanelMouse(page,`${base}?view=cables&revision=${revision}`));
  await mkdir('work/published-cable-check',{recursive:true});
  await page.screenshot({path:'work/published-cable-check/workbench.png',fullPage:true});
  await writeFile('work/published-cable-check/result.json',JSON.stringify({revision,...report},null,2));
  console.log(JSON.stringify(report));
} finally {await browser.close();}
