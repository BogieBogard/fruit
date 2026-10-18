import{test}from'node:test';
import assert from'node:assert/strict';
import{Engine,FRUITS,FLOOR,MODES,WALL,W}from'../engine.js';
const tick=(e,seconds)=>{for(let i=0;i<seconds*120;i++)e.step(1/120)};

test('contact merges once and awards the correct score',()=>{
  const e=new Engine('classic',123);e.bodies=[e.body(0,200,400),e.body(0,223,400)];
  e.bodies.forEach(b=>b.delay=0);e.step(1/120);
  assert.equal(e.bodies.length,1);assert.equal(e.bodies[0].t,1);assert.equal(e.score,3);
});
test('nearby matching fruit do not merge across a visible gap',()=>{
  const e=new Engine();e.bodies=[e.body(4,150,400),e.body(4,224,400)];
  e.bodies.forEach(b=>b.delay=0);e.step(1/120);assert.equal(e.bodies.length,2);assert.equal(e.score,0);
});
test('different fruit collide without merging',()=>{
  const e=new Engine();e.bodies=[e.body(0,200,400),e.body(1,220,400)];e.step(.01);
  assert.equal(e.bodies.length,2);assert.equal(e.score,0);
});
test('two jackfruits harvest and clear',()=>{
  const e=new Engine();e.bodies=[e.body(10,110,400),e.body(10,310,400)];
  e.bodies.forEach(b=>b.delay=0);e.step(.01);
  assert.equal(e.bodies.length,0);assert.equal(e.harvests,1);assert.equal(e.score,1078);
});
test('restored save preserves exact board, velocities, upcoming fruit, and settings',()=>{
  const e=new Engine('spicy',123);e.drop();tick(e,2);
  const state=JSON.parse(JSON.stringify(e.serialize())),restored=Engine.restore(state);
  assert.deepEqual(restored.serialize(),state);
  tick(restored,4);assert.ok(restored.bodies.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.vx)));
});
test('old eight-fruit saves migrate without losing score or board',()=>{
  const old={version:1,mode:'classic',rng:123,serial:4,score:873,elapsed:55,cooldown:0,danger:0,status:'running',current:3,next:1,aim:210,harvests:0,
    bodies:[{id:1,t:5,x:80,y:545,vx:0,vy:0,angle:0,age:10,delay:0},{id:2,t:6,x:300,y:530,vx:0,vy:0,angle:.2,age:10,delay:0}]};
  const e=Engine.restore(old);assert.equal(e.score,873);assert.deepEqual(e.bodies.map(b=>b.t),[7,8]);assert.equal(e.current,5);assert.equal(e.next,2);assert.equal(e.serialize().version,2);tick(e,2);
});
test('floor and walls stay within one pixel of fruit surfaces',()=>{
  for(const t of[0,2,5,7,10]){
    const e=new Engine();e.bodies=[e.body(t,WALL+FRUITS[t].r,400)];tick(e,7);
    const b=e.bodies[0],r=FRUITS[b.t].r;assert.ok(Math.abs(b.y+r-FLOOR)<1,`${FRUITS[t].name}: floor gap ${FLOOR-b.y-r}`);
    assert.ok(b.x-r>=WALL-1);assert.ok(b.x+r<=W-WALL+1);
  }
});
test('a settled pile has real supporting contacts, no floating fruit',()=>{
  const e=new Engine('cozy',24);
  for(let i=0;i<35;i++){e.setAim(35+(i*97)%350);e.drop();tick(e,.6)}tick(e,10);
  assert.ok(e.bodies.length>8);
  for(const a of e.bodies){
    const r=FRUITS[a.t].r,floorGap=FLOOR-a.y-r;
    const support=e.bodies.some(b=>b!==a&&b.y>a.y+2&&Math.hypot(a.x-b.x,a.y-b.y)-r-FRUITS[b.t].r<1.25);
    assert.ok(floorGap<1.25||support,`Floating ${FRUITS[a.t].name}: floor gap=${floorGap.toFixed(2)}`);
  }
});
test('off-center fruit roll off a larger round fruit',()=>{
  const e=new Engine();e.bodies=[e.body(9,210,FLOOR-FRUITS[9].r),e.body(3,230,FLOOR-FRUITS[9].r*2-FRUITS[3].r)];
  const top=e.bodies[1];tick(e,4);assert.ok(Math.abs(top.x-230)>35,`Only moved ${top.x-230}`);assert.ok(Math.abs(top.angle)>.2);
});
test('undo restores the last drop including its RNG state',()=>{
  const e=new Engine('classic',321);const before=e.serialize();e.drop();tick(e,1);assert.ok(e.undo());
  const after=e.serialize();assert.deepEqual(after.bodies,before.bodies);assert.equal(after.rng,before.rng);assert.equal(after.current,before.current);assert.deepEqual(after.queue,before.queue);
});
test('sweep clears the smallest tier only and can itself be undone',()=>{
  const e=new Engine();e.bodies=[e.body(1,60,400),e.body(4,200,400),e.body(1,340,400)];
  const before=e.serialize();assert.ok(e.sweep());assert.deepEqual(e.bodies.map(b=>b.t),[4]);assert.equal(e.score,0);assert.ok(e.undo());assert.deepEqual(e.serialize(),before);
});
test('more than three drops can be undone, including after game over',()=>{
  const e=new Engine('cozy',712);const first=e.serialize();
  for(let i=0;i<12;i++){e.setAim(50+i*20);assert.ok(e.drop());tick(e,.4)}
  e.status='over';assert.ok(e.undo());assert.equal(e.status,'running');
  for(let i=0;i<11;i++)assert.ok(e.undo());assert.equal(e.bodies.length,0);assert.equal(e.score,first.score);assert.equal(e.undo(),false);
});
test('sweeps work indefinitely and ignore exhausted limits from older saves',()=>{
  const old=new Engine().serialize();old.undos=0;old.sweeps=0;const e=Engine.restore(old);
  for(let i=0;i<20;i++){e.bodies.push(e.body(i%FRUITS.length,210,400));assert.ok(e.sweep());assert.equal(e.bodies.length,0)}
  assert.equal(e.history.length,20);for(let i=0;i<20;i++)assert.ok(e.undo());
});
test('cooldown and pause prevent unintended drops',()=>{
  const e=new Engine();assert.ok(e.drop());assert.equal(e.drop(),false);e.status='paused';
  const state=e.serialize();e.step(1);assert.deepEqual(e.serialize(),state);assert.equal(e.drop(),false);
});
test('overflow ends a round after its grace period',()=>{
  const e=new Engine();const b=e.body(10,110,20);b.age=5;e.bodies=[b];
  for(let i=0;i<400;i++){b.y=25;b.vy=0;e.step(.01)}assert.equal(e.status,'over');
});
test('invalid and incompatible saves are rejected',()=>{
  assert.throws(()=>Engine.restore({version:99}));const e=new Engine().serialize();e.bodies=[{t:500}];assert.throws(()=>Engine.restore(e));
  const b=new Engine().serialize();b.current=NaN;assert.throws(()=>Engine.restore(b));
});
test('crowded long runs remain finite in all modes',()=>{
  for(const mode of Object.keys(MODES)){const e=new Engine(mode,42);
    for(let i=0;i<15000&&e.status==='running';i++){if(i%60===0){e.setAim(30+(i*71)%360);e.drop()}e.step(1/120)}
    for(const b of e.bodies)for(const k of['x','y','vx','vy','angle'])assert.ok(Number.isFinite(b[k]));assert.ok(e.score>0);
  }
});
