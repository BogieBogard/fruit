import assert from'node:assert/strict';import{mkdir}from'node:fs/promises';
const{chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--renderer-process-limit=2']});
await mkdir('test-results',{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/fruit/');await page.locator('#play').waitFor();await page.screenshot({path:'test-results/desktop-welcome.png',fullPage:true});
 await page.locator('#play').click();await page.locator('#overlay').waitFor({state:'hidden'});
 const board=await page.locator('#board').boundingBox();
 for(let i=0;i<24;i++){await page.mouse.click(board.x+board.width*(.25+(i%3)*.25),board.y+board.height*.5);await page.waitForTimeout(450)}
 await page.waitForTimeout(3000);assert.ok(Number((await page.locator('#score').innerText()).replaceAll(',',''))>0);
 await page.screenshot({path:'test-results/desktop-gameplay.png',fullPage:true});
 await page.locator('#undo').click();assert.equal(await page.locator('#undo-count').innerText(),'2');
 await page.locator('#sweep').click();assert.equal(await page.locator('#sweep-count').innerText(),'1');
 await page.locator('#help-button').click();await page.locator('#help').waitFor();await page.locator('#help-ok').click();await page.locator('#help').waitFor({state:'hidden'});
 const contactPixels=await page.evaluate(async()=>{
   const{fruit}=await import('/fruit/art.js?v=2');const samples=[];
   for(let t=0;t<11;t++){const c=document.createElement('canvas');c.width=c.height=240;const x=c.getContext('2d');fruit(x,t,120,120,80);let holes=0;for(let a=0;a<360;a+=5){const rad=a*Math.PI/180;if(x.getImageData(Math.round(120+Math.cos(rad)*79),Math.round(120+Math.sin(rad)*79),1,1).data[3]<180)holes++}samples.push(holes)}return samples;
 });assert.ok(contactPixels.every(n=>n===0),`Visible silhouette gaps: ${contactPixels}`);
 await page.locator('#pause').click();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mbogard.fruit.orchard.v1')));assert.ok(saved.run.bodies.length>0);assert.equal(saved.run.status,'paused');
 await page.reload();await page.locator('#play').waitFor();assert.equal(await page.locator('#score').innerText(),saved.run.score.toLocaleString());const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('mbogard.fruit.orchard.v1')));assert.deepEqual(restored.run.bodies,saved.run.bodies);
 await page.locator('#play').click();await page.locator('#overlay').waitFor({state:'hidden'});await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');await page.keyboard.press('p');await page.locator('#overlay').waitFor();
 await page.locator('#new-game').click();await page.locator('#restart').click();await page.locator('[data-mode="cozy"]').click();await page.locator('#play').click();assert.equal(await page.locator('#mode-label').innerText(),'EASY');
 await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}),phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto('http://127.0.0.1:4173/fruit/');await phone.screenshot({path:'test-results/mobile-welcome.png',fullPage:true});await phone.locator('#play').tap();await phone.locator('#overlay').waitFor({state:'hidden'});const mb=await phone.locator('#board').boundingBox();for(let i=0;i<24;i++){await phone.touchscreen.tap(mb.x+mb.width*(.25+(i%3)*.25),mb.y+mb.height*.6);await phone.waitForTimeout(450)}await phone.waitForTimeout(3000);assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.ok((await phone.evaluate(()=>JSON.parse(localStorage.getItem('mbogard.fruit.orchard.v1')).run.bodies.length))>0);await phone.screenshot({path:'test-results/mobile-gameplay.png',fullPage:true});
 assert.ok(await phone.evaluate(()=>document.querySelector('.game-footer').getBoundingClientRect().bottom<=innerHeight),'Phone controls fit the viewport');
 for(const size of[{width:360,height:740},{width:320,height:640},{width:768,height:1024}]){await phone.setViewportSize(size);assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.ok(await phone.evaluate(()=>document.querySelector('.game-footer').getBoundingClientRect().bottom<=innerHeight),`Controls fit ${size.width}x${size.height}`)}
 assert.deepEqual(errors,[]);console.log('PASS: play, scoring, undo, sweep, help, 11 full contact silhouettes, pause, exact board restore, keyboard, mode switch, touch input, 4 mobile/tablet viewports, and no browser errors.');await mobile.close();
}finally{await browser.close()}
