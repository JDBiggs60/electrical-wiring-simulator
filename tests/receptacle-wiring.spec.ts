import {test}from '@playwright/test';
test('real mouse complete receptacle wiring, grounding, mounting, power, faults, correction and shared history',async({page})=>{test.setTimeout(60000);const{checkReceptacleWiringMouse}=await import('../scripts/receptacle-wiring-browser-check.mjs');await checkReceptacleWiringMouse(page,'/?view=cables');});
