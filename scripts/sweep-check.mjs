import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {Engine,FRUITS,FLOOR} from '../engine.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,args:['--renderer-process-limit=2']});
try{
  const e=new Engine('classic',42);e.status='paused';e.score=1250;
  // Walls brace the two jackfruits so the watermelon cannot settle before sweeping.
  const topY=FLOOR-90-Math.sqrt((90+106)**2-110**2);
  e.bodies=[e.body(9,100,FLOOR-90),e.body(9,320,FLOOR-90),e.body(10,210,topY)];
  for(const b of e.bodies){b.sleeping=true;b.age=5;b.delay=0}
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(run=>localStorage.setItem('mbogard.fruit.orchard.v1',JSON.stringify({settings:{best:{}},run})),e.serialize());
  await page.goto('http://127.0.0.1:4173/fruit/');await page.locator('#play').tap();
  await page.waitForFunction(()=>{const r=JSON.parse(localStorage.getItem('mbogard.fruit.orchard.v1')).run;return r.bodies.length===3&&r.bodies.every(b=>b.sleeping)},{},{timeout:12000});
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('mbogard.fruit.orchard.v1')).run.bodies.find(b=>b.t===10).y);
  await page.locator('#sweep').tap();
  try{await page.waitForFunction(y=>{const r=JSON.parse(localStorage.getItem('mbogard.fruit.orchard.v1')).run;return r.bodies.length===1&&r.bodies[0].y>y+40},before,{timeout:6000})}
  catch(error){console.log(JSON.stringify({before,state:await page.evaluate(()=>JSON.parse(localStorage.getItem('mbogard.fruit.orchard.v1')).run)}));throw error}
  await page.waitForTimeout(2500);
  const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('mbogard.fruit.orchard.v1')).run);
  assert.equal(result.bodies.length,1);assert.ok(Math.abs(result.bodies[0].y+FRUITS[10].r-(result.height-12))<1);
  assert.deepEqual(errors,[]);await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/sweep-settled.png',fullPage:true});
  console.log('PASS: real sweep button removes two sleeping supports; watermelon falls under gravity and settles on the floor.');
}finally{await browser.close()}
