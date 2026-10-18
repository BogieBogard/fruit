import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,args:['--renderer-process-limit=2']});
await mkdir('test-results',{recursive:true});
const cases=[
  ['phone',390,844],['small-phone',320,640],['tall-cover',344,900],
  ['fold-short',432,550],['fold-wide',540,660],['fold-open',768,700],
  ['fold-large',900,740],['tablet',1024,840],['landscape',844,390],
];
try{
  const context=await browser.newContext({isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const[name,width,height]of cases){
    await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:4173/fruit/');await page.waitForTimeout(160);
    const metrics=await page.evaluate(()=>{
      const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom,r:r.right}};
      const btn=rect('#play'),over=rect('#overlay');
      return{width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,game:rect('.game'),board:rect('#board'),footer:rect('.game-footer'),play:btn,overlay:over,
        preview:rect('.next-box'),rail:rect('.evolution'),previewFit:getComputedStyle(document.querySelector('#next')).objectFit,
        scaleX:document.querySelector('#board').getContext('2d').getTransform().a,scaleY:document.querySelector('#board').getContext('2d').getTransform().d};
    });
    assert.ok(metrics.scroll<=width,`${name}: horizontal overflow`);
    assert.ok(metrics.footer.b<=height+.5,`${name}: footer clipped ${metrics.footer.b}/${height}`);
    assert.ok(metrics.board.y>=0&&metrics.board.b<=height,`${name}: board clipped`);
    assert.ok(metrics.play.y>=metrics.overlay.y&&metrics.play.b<=metrics.overlay.b,`${name}: play button clipped`);
    assert.ok(Math.abs(metrics.scaleX/metrics.scaleY-1)<.006,`${name}: stretched fruit`);
    assert.equal(metrics.previewFit,'contain');assert.ok(metrics.preview.b<=metrics.rail.y,`${name}: preview overlaps evolution rail`);
    if(width/height<1.2)assert.ok(metrics.game.w>=Math.min(width-24,680),`${name}: excessive side gutters`);
    await page.screenshot({path:`test-results/layout-${name}-menu.png`,fullPage:true});
    await page.locator('#play').tap();await page.locator('#overlay').waitFor({state:'hidden'});
    const b=await page.locator('#board').boundingBox();await page.touchscreen.tap(b.x+b.width*.75,b.y+b.height*.6);await page.waitForTimeout(450);
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('mbogard.fruit.orchard.v1')).run);
    assert.ok(state.bodies.length>0,`${name}: touch drop failed`);
    await page.screenshot({path:`test-results/layout-${name}-game.png`,fullPage:true});
    await page.evaluate(()=>localStorage.clear());
    console.log(`PASS ${name} ${width}×${height}: board ${Math.round(metrics.board.w)}×${Math.round(metrics.board.h)}, no clipping or stretch`);
  }
  // Fold/unfold a paused live run; geometry can change, but fruit and undo history survive.
  await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4173/fruit/');await page.locator('#play').tap();
  let b=await page.locator('#board').boundingBox();await page.touchscreen.tap(b.x+b.width*.5,b.y+b.height*.6);await page.waitForTimeout(1200);await page.locator('#pause').tap();
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('mbogard.fruit.orchard.v1')).run);
  for(const size of[{width:768,height:700},{width:844,height:390},{width:390,height:844}]){await page.setViewportSize(size);await page.waitForTimeout(180)}
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('mbogard.fruit.orchard.v1')).run);
  assert.equal(after.score,before.score);assert.deepEqual(after.bodies.map(b=>b.id),before.bodies.map(b=>b.id));assert.equal(after.status,'paused');
  await page.locator('#play').tap();await page.locator('#undo').tap();assert.equal(await page.locator('#undo-count').innerText(),'∞');assert.deepEqual(errors,[]);
  console.log('PASS fold/unfold/rotate: saved run and undo history preserved');
  const fixture=await page.evaluate(async()=>{
    const{Engine}=await import('/fruit/engine.js?v=4');const e=new Engine('classic',44,700);
    e.status='paused';e.score=1234;e.bodies=[[9,598],[7,444],[5,337],[3,267]].map(([t,y])=>({...e.body(t,210,y),age:5,delay:0}));
    return {settings:{best:{}},run:e.serialize()};
  });
  await page.addInitScript(payload=>localStorage.setItem('mbogard.fruit.orchard.v1',JSON.stringify(payload)),fixture);
  await page.reload();await page.setViewportSize({width:432,height:550});await page.waitForTimeout(200);
  const crowded=await page.evaluate(()=>JSON.parse(localStorage.getItem('mbogard.fruit.orchard.v1')).run);
  assert.equal(crowded.score,1234);assert.equal(crowded.bodies.length,4);
  const radii=[12,16,21,27,34,43,53,64,76,90,106];
  assert.ok(crowded.bodies.every(b=>b.y-radii[b.t]>=88&&b.y+radii[b.t]<=crowded.height-11),'Crowded pile stays inside resized bucket');
  console.log('PASS crowded pile stays visible when folding into a shorter viewport');await context.close();
}finally{await browser.close()}
