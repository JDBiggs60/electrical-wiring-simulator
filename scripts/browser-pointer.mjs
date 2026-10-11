import {expect} from '@playwright/test';
/** SVG redraws replace nodes. Wait for a visible, attached element's real bounds
 * before issuing mouse events; never fabricate coordinates or skip the gesture. */
export async function mouseBounds(locator) {
 let bounds=null;
 await expect.poll(async()=>{bounds=await locator.boundingBox();return bounds!==null&&bounds.width>0&&bounds.height>0;},{message:`Mouse target has valid bounds: ${locator}`}).toBe(true);
 return bounds;
}
