import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
const dir=resolve('presentations/HumanoidTH-4min');
await mkdir(dir+'/preview',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
await page.goto(pathToFileURL(dir+'/HumanoidTH-presentation.html').href);
await page.evaluate(()=>document.fonts.ready);
await page.addStyleTag({content:'#controls{visibility:hidden}'});
const problems=await page.evaluate(()=>[...document.querySelectorAll('.text')].filter(e=>e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2).map(e=>({text:e.textContent,height:e.clientHeight,scroll:e.scrollHeight})));
if(problems.length)throw new Error(JSON.stringify(problems));
const slideCount=await page.locator('.slide').count();
for(let i=0;i<slideCount;i++){
 await page.evaluate(i=>show(i),i);
 await page.locator('.slide.active').screenshot({path:dir+`/preview/slide-${i+1}.png`});
}
await page.emulateMedia({media:'print'});
await page.evaluate(()=>document.title='HumanoidTH — Competition for Progress');
await page.pdf({path:dir+'/HumanoidTH-Competition-for-Progress.pdf',width:'1600px',height:'900px',printBackground:true,preferCSSPageSize:true});
await browser.close();
console.log(`Rendered ${slideCount} slide previews and PDF; no text overflow.`);
