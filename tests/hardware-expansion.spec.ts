import {test} from '@playwright/test';import {checkHardwareExpansionMouse} from '../scripts/hardware-expansion-browser-check.mjs';
test('place all box sizes, snap devices, route and wire ceiling fixture with mouse',async({page})=>{test.setTimeout(120000);await checkHardwareExpansionMouse(page,'/?view=cables');});
