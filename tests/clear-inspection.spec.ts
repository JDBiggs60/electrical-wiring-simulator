import {test}from '@playwright/test';import {checkClearInspectionMouse}from '../scripts/clear-inspection-browser-check.mjs';
for(const kind of ['switch','receptacle'])test(`${kind}: exposed terminals, internal grounding, live wire following, disconnect history and shared views`,async({page,baseURL})=>{test.setTimeout(90000);await checkClearInspectionMouse(page,`${baseURL}/?view=cables`,kind);});
