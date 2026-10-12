import {test} from '@playwright/test';
import {checkAnchoredInspection} from '../scripts/anchored-inspection-browser-check.mjs';
for(const kind of ['switch','receptacle'])for(const phone of [false,true])test(`${kind} anchored pigtails and contained routes on ${phone?'phone':'desktop'}`,async({page,baseURL})=>{
 test.setTimeout(90000);await checkAnchoredInspection(page,`${baseURL}/?view=cables`,kind,phone);
});
