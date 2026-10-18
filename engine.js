import './vendor/matter.js';
const {Engine: Physics, Bodies, Body, Composite, Sleeping} = globalThis.Matter;

export const FRUITS = [
  {name:'Blueberry', r:12, color:'#299ced', light:'#62c7ff', edge:'#1557a0', points:3},
  {name:'Cherry', r:16, color:'#f25265', light:'#ff8e9a', edge:'#ad244d', points:6},
  {name:'Strawberry', r:21, color:'#f83c68', light:'#ff8095', edge:'#ae204c', points:10},
  {name:'Grape', r:27, color:'#b66ad0', light:'#e2a0ea', edge:'#783c96', points:15},
  {name:'Orange', r:34, color:'#ff941c', light:'#ffbe40', edge:'#c36312', points:21},
  {name:'Apple', r:43, color:'#ff4938', light:'#ff7c52', edge:'#ae272d', points:28},
  {name:'Peach', r:53, color:'#f5839d', light:'#ffc0b7', edge:'#be4b7d', points:36},
  {name:'Pineapple', r:64, color:'#f4c82e', light:'#ffe76b', edge:'#b47b13', points:45},
  {name:'Dragon fruit', r:76, color:'#ec68b2', light:'#ffacd5', edge:'#ad367e', points:55},
  {name:'Watermelon', r:90, color:'#43bd24', light:'#8fe438', edge:'#1c771b', points:66},
  {name:'Jackfruit', r:106, color:'#b4cb2b', light:'#e3ed5b', edge:'#6d921b', points:78},
];
export const MODES = {
  cozy:{name:'Easy', gravity:880, grace:3.5, max:3, description:'A little more time above the line.'},
  classic:{name:'Classic', gravity:1050, grace:2.5, max:4, description:'The classic drop-and-merge challenge.'},
  spicy:{name:'Hard', gravity:1250, grace:1.5, max:4, description:'Faster fruit. Less room for mistakes.'},
};
export const W=420, H=580, FLOOR=568, LINE=88, WALL=10;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const STEP=1/120;

export class Engine {
  constructor(mode='classic',seed=Date.now()) {
    this.mode=Object.hasOwn(MODES,mode)?mode:'classic';
    this.rng=seed>>>0||1;this.serial=1;this.bodies=[];this.score=0;
    this.elapsed=0;this.cooldown=0;this.danger=0;this.status='running';
    this.current=this.randomFruit();this.queue=[this.randomFruit(),this.randomFruit(),this.randomFruit()];
    this.aim=W/2;this.harvests=0;this.combo=0;this.lastMerge=-10;this.undos=3;this.sweeps=2;
    this.events=[];this.history=[];this._active=new Map();
    this.physics=Physics.create({enableSleeping:true,positionIterations:12,velocityIterations:10});
    this.physics.gravity.y=1;this.physics.gravity.scale=MODES[this.mode].gravity/1000000;
    const options={isStatic:true,friction:.28,restitution:.08,slop:.01};
    Composite.add(this.physics.world,[
      Bodies.rectangle(W/2,FLOOR+40,W+200,80,options),
      Bodies.rectangle(WALL-40,H/2,80,H+1000,options),
      Bodies.rectangle(W-WALL+40,H/2,80,H+1000,options),
    ]);
  }
  get next(){return this.queue[0]}
  random(){let x=this.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.rng=x>>>0;return this.rng/4294967296}
  randomFruit(){return Math.floor(this.random()*(MODES[this.mode].max+1))}
  setAim(x){const r=FRUITS[this.current].r;this.aim=clamp(x,WALL+r,W-WALL-r)}
  body(t,x,y){return{id:this.serial++,t,x,y,vx:0,vy:0,angle:0,omega:0,age:0,delay:.13,sleeping:false}}
  drop(){
    if(this.status!=='running'||this.cooldown>0||this.bodies.length>=150)return false;
    this.history.push(this.serialize());if(this.history.length>3)this.history.shift();
    this.setAim(this.aim);const b=this.body(this.current,this.aim,39);b.vy=25;
    this.bodies.push(b);this.current=this.queue.shift();this.queue.push(this.randomFruit());
    this.cooldown=.32;this.setAim(this.aim);return true;
  }
  undo(){
    if(!this.history.length||this.undos<=0)return false;
    const remaining=this.undos-1,history=this.history.slice(0,-1),state=this.history.at(-1);
    const restored=Engine.restore(state);restored.undos=remaining;restored.history=history;
    restored.status='running';Object.assign(this,restored);return true;
  }
  sweep(){
    if(this.status!=='running'||!this.bodies.length||this.sweeps<=0)return false;
    const tier=Math.min(...this.bodies.map(b=>b.t));
    this.events=this.bodies.filter(b=>b.t===tier).map(b=>({x:b.x,y:b.y,t:b.t,sweep:true,points:0}));
    this.bodies=this.bodies.filter(b=>b.t!==tier);this.sweeps--;this.danger=0;
    this.history=[];this._sync();return true;
  }
  _sync(){
    const ids=new Set(this.bodies.map(b=>b.id));
    for(const[id,rb]of this._active)if(!ids.has(id)){Composite.remove(this.physics.world,rb);this._active.delete(id)}
    for(const b of this.bodies){
      let rb=this._active.get(b.id);
      if(!rb){
        rb=Bodies.circle(b.x,b.y,FRUITS[b.t].r,{friction:.12,frictionStatic:.3,frictionAir:.0018,restitution:.18,density:.001,slop:.015,sleepThreshold:90},64);
        rb.plugin.fruitId=b.id;this._active.set(b.id,rb);Composite.add(this.physics.world,rb);
        Body.setAngle(rb,b.angle);Body.setVelocity(rb,{x:b.vx/60,y:b.vy/60});Body.setAngularVelocity(rb,(b.omega||0)/60);
        if(b.sleeping)Sleeping.set(rb,true);
      }else if(Math.abs(rb.position.x-b.x)>.001||Math.abs(rb.position.y-b.y)>.001){
        Sleeping.set(rb,false);Body.setPosition(rb,{x:b.x,y:b.y});Body.setVelocity(rb,{x:b.vx/60,y:b.vy/60});
      }
    }
  }
  _read(){for(const b of this.bodies){const rb=this._active.get(b.id);if(!rb)continue;b.x=rb.position.x;b.y=rb.position.y;b.vx=rb.velocity.x*60;b.vy=rb.velocity.y*60;b.angle=rb.angle;b.omega=rb.angularVelocity*60;b.sleeping=rb.isSleeping}}
  step(dt){
    this.events=[];if(this.status!=='running')return;
    dt=clamp(dt,0,.05);if(!dt)return;
    const count=Math.max(1,Math.ceil(dt/STEP)),sub=dt/count;
    for(let s=0;s<count;s++){
      this._sync();Physics.update(this.physics,sub*1000);this._read();
      this.elapsed+=sub;this.cooldown=Math.max(0,this.cooldown-sub);
      for(const b of this.bodies){b.age+=sub;b.delay=Math.max(0,b.delay-sub)}
      // Merge on actual contact (including sleeping contacts), once per body per substep.
      const used=new Set(),created=[];
      for(let i=0;i<this.bodies.length;i++)for(let j=i+1;j<this.bodies.length;j++){
        const a=this.bodies[i],b=this.bodies[j];
        if(a.t!==b.t||a.delay>0||b.delay>0||used.has(a.id)||used.has(b.id))continue;
        if(Math.hypot(a.x-b.x,a.y-b.y)>FRUITS[a.t].r*2+.35)continue;
        used.add(a.id);used.add(b.id);
        const t=a.t,x=(a.x+b.x)/2,y=(a.y+b.y)/2,harvest=t===FRUITS.length-1;
        this.combo=this.elapsed-this.lastMerge<1.25?this.combo+1:1;this.lastMerge=this.elapsed;
        const points=FRUITS[t].points+(harvest?1000:0);this.score+=points;
        if(harvest)this.harvests++;
        else{const n=this.body(t+1,clamp(x,WALL+FRUITS[t+1].r,W-WALL-FRUITS[t+1].r),Math.min(y,FLOOR-FRUITS[t+1].r));n.vx=(a.vx+b.vx)*.35;n.vy=Math.min(0,(a.vy+b.vy)*.35);created.push(n)}
        this.events.push({x,y,t,points,harvest,combo:this.combo});
      }
      if(used.size){this.bodies=this.bodies.filter(b=>!used.has(b.id)).concat(created);this._sync();for(const rb of this._active.values())Sleeping.set(rb,false)}
      const overflow=this.bodies.some(b=>b.age>1.4&&b.y-FRUITS[b.t].r<LINE&&Math.abs(b.vy)<110);
      this.danger=overflow?this.danger+sub:Math.max(0,this.danger-sub*2);
      if(this.danger>=MODES[this.mode].grace){this.status='over';this.events.push({over:true});break}
    }
  }
  serialize(){
    const keys=['mode','rng','serial','score','elapsed','cooldown','danger','status','current','aim','harvests','combo','lastMerge','undos','sweeps'];
    const state={version:2,bodies:this.bodies.map(b=>({...b})),queue:[...this.queue]};
    for(const k of keys)state[k]=this[k];return state;
  }
  static restore(input){
    if(!input||![1,2].includes(input.version))throw Error('Incompatible save');
    const data=structuredClone(input);
    if(data.version===1){
      const tiers=[1,2,4,5,6,7,8,10];
      data.current=tiers[data.current];data.queue=[tiers[data.next],0,1];
      data.bodies=data.bodies?.map(b=>({...b,t:tiers[b.t],y:Math.min(b.y*(FLOOR/607),FLOOR-FRUITS[tiers[b.t]]?.r),omega:0,sleeping:false}));
      Object.assign(data,{combo:0,lastMerge:-10,undos:3,sweeps:2});
    }
    if(!Object.hasOwn(MODES,data.mode)||!['running','paused','over'].includes(data.status)||!Array.isArray(data.bodies)||data.bodies.length>150)throw Error('Invalid save');
    const validTier=t=>Number.isInteger(t)&&t>=0&&t<FRUITS.length;
    for(const k of['rng','serial','score','elapsed','cooldown','danger','current','aim','harvests','combo','lastMerge','undos','sweeps'])if(!Number.isFinite(data[k]))throw Error('Invalid state');
    if(data.score<0||data.elapsed<0||!validTier(data.current)||!Array.isArray(data.queue)||data.queue.length!==3||!data.queue.every(validTier)||data.undos<0||data.undos>3||data.sweeps<0||data.sweeps>2)throw Error('Invalid values');
    const ids=new Set();
    for(const b of data.bodies){if(!validTier(b.t)||!['id','x','y','vx','vy','angle','age','delay'].every(k=>Number.isFinite(b[k]))||Math.abs(b.x)>2000||Math.abs(b.y)>5000||ids.has(b.id))throw Error('Invalid fruit');ids.add(b.id);b.omega=Number.isFinite(b.omega)?b.omega:0}
    const e=new Engine(data.mode);for(const k of Object.keys(e.serialize()))if(k!=='version')e[k]=structuredClone(data[k]);
    e.setAim(e.aim);e._sync();return e;
  }
}
