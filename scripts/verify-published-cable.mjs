import {checkAnchoredInspection} from './anchored-inspection-browser-check.mjs';
import {checkHardwareExpansionMouse} from './hardware-expansion-browser-check.mjs';
import { checkClearInspectionMouse } from './clear-inspection-browser-check.mjs';
import { checkWireNutMouse } from './wire-nut-browser-check.mjs';
import { checkReceptacleWiringMouse } from './receptacle-wiring-browser-check.mjs';
import { checkPanelMouse } from './panel-browser-check.mjs';
import { chromium } from '@playwright/test';
import { mkdir,writeFile,copyFile } from 'node:fs/promises';
import { checkCableMouse, checkReceptacleMouse } from './cable-browser-check.mjs';
const base='https://jdbiggs60.github.io/electrical-wiring-simulator/preview/';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined});
let stage='preview revision';
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
  stage='cable installation';
  const report=await checkCableMouse(page,`${base}?view=cables&revision=${revision}`);
  stage='receptacle assembly';
  Object.assign(report,await checkReceptacleMouse(page));
  stage='panel assembly';
  Object.assign(report,await checkPanelMouse(page,`${base}?view=cables&revision=${revision}`));
  stage='receptacle wiring';
  Object.assign(report,await checkReceptacleWiringMouse(page,`${base}?view=cables&revision=${revision}`));
  stage='wire-nut splicing';
  Object.assign(report,await checkWireNutMouse(page,`${base}?view=cables&revision=${revision}`));
  stage='clear switch inspection';
  Object.assign(report,await checkClearInspectionMouse(page,`${base}?view=cables&revision=${revision}`,'switch'));
  stage='clear receptacle inspection';
  Object.assign(report,await checkClearInspectionMouse(page,`${base}?view=cables&revision=${revision}`,'receptacle'));
  stage='multi-gang and ceiling fixture assembly';
  Object.assign(report,await checkHardwareExpansionMouse(page,`${base}?view=cables&revision=${revision}`));
  for(const kind of ['switch','receptacle'])for(const phone of [false,true]){
    stage=`anchored ${kind} ${phone?'phone':'desktop'} inspection`;
    await checkAnchoredInspection(page,`${base}?view=cables&revision=${revision}`,kind,phone);
    report[`${kind}${phone?'Phone':'Desktop'}AnchoredAndBounded`]=true;
  }
  await mkdir('work/published-cable-check',{recursive:true});
  await Promise.all(['head-on-switch-workbench.png','head-on-receptacle-workbench.png','lampholder-bulb-workbench.png','switch-grounding-loose.png','receptacle-grounding-loose.png','triple-gang-inspection.png','ceiling-fixture-inspection.png','neat-panel-routing.png','switch-box-wire-nuts.png','clear-switch-inspection.png','clear-receptacle-inspection.png',...['switch','receptacle'].flatMap(k=>['phone','desktop'].flatMap(size=>['loose','connected'].map(state=>`anchored-${k}-${size}-${state}.png`)))].map(name=>copyFile(`work/${name}`,`work/published-cable-check/${name}`)));
  await page.screenshot({path:'work/published-cable-check/workbench.png',fullPage:true});
  await writeFile('work/published-cable-check/result.json',JSON.stringify({revision,...report},null,2));
  console.log(JSON.stringify(report));
} catch(error) {
  const message=`Published ${stage}: ${error instanceof Error?error.stack:error}`;
  console.error(`::error::${message.replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A')}`);
  throw error;
} finally {await browser.close();}
