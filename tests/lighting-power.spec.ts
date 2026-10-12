import {test} from '@playwright/test';
import {checkLighting} from '../scripts/lighting-browser-check.mjs';
for(const phone of [false,true])test(`actual lighting power, faults and repair ${phone?'phone':'desktop'}`,async({page})=>{test.setTimeout(120000);await checkLighting(page,'/?view=cables',phone);});
