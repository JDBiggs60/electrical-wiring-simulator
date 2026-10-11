import {test} from '@playwright/test';
test('real mouse panel-to-receptacle-box assembly and shared panel inspection',async({page})=>{
 const {checkPanelMouse}=await import('../scripts/panel-browser-check.mjs');await checkPanelMouse(page,'/?view=cables');
});
