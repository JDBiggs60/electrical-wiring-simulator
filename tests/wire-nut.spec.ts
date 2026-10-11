import {test} from '@playwright/test';
import {checkWireNutMouse} from '../scripts/wire-nut-browser-check.mjs';
test('mouse panel routing and persistent switch-box wire nuts drive actual 120V continuity and open-neutral undo/redo',async({page,baseURL})=>{test.setTimeout(90000);await checkWireNutMouse(page,`${baseURL}/?view=cables`);});
