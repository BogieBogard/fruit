export const FRUITS = [
  {name:'Cherry',r:15,color:'#e87172',light:'#f5a09a',points:5},
  {name:'Strawberry',r:21,color:'#ed897e',light:'#ffb6a5',points:12},
  {name:'Orange',r:29,color:'#eda955',light:'#ffd089',points:25},
  {name:'Apple',r:38,color:'#a7bd70',light:'#d1df98',points:45},
  {name:'Peach',r:49,color:'#edb098',light:'#ffdac1',points:80},
  {name:'Pineapple',r:62,color:'#d5b855',light:'#f3da85',points:140},
  {name:'Dragon fruit',r:77,color:'#d881a0',light:'#f6b6cb',points:240},
  {name:'Jackfruit',r:94,color:'#a3b460',light:'#d0d992',points:400},
];
export const MODES = {
  cozy:{name:'Cozy',gravity:660,grace:4,max:2,description:'Gentle gravity. A little more breathing room.'},
  classic:{name:'Classic',gravity:850,grace:2.8,max:3,description:'A balanced bounce. The sweet spot.'},
  spicy:{name:'Spicy',gravity:1050,grace:1.7,max:3,description:'Faster falls. A shorter margin for mischief.'},
};
export const W=420,H=620,FLOOR=607,LINE=112;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export class Engine{
  constructor(mode='classic',seed=Date.now()){
    this.mode=Object.hasOwn(MODES,mode)?mode:'classic';this.rng=seed>>>0||1;this.bodies=[];this.score=0;this.elapsed=0;this.cooldown=0;this.danger=0;this.status='running';this.current=this.randomFruit();this.next=this.randomFruit();this.aim=W/2;this.serial=1;this.harvests=0;this.events=[];
  }
  random(){let x=this.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.rng=x>>>0;return this.rng/4294967296}
  randomFruit(){return Math.floor(this.random()*(MODES[this.mode].max+1))}
  setAim(x){const r=FRUITS[this.current].r;this.aim=clamp(x,r+9,W-r-9)}
  body(t,x,y){return{id:this.serial++,t,x,y,vx:0,vy:0,angle:0,age:0,delay:.15}}
  drop(){if(this.status!=='running'||this.cooldown>0||this.bodies.length>=120)return false;this.setAim(this.aim);const b=this.body(this.current,this.aim,48);b.vy=15;this.bodies.push(b);this.current=this.next;this.next=this.randomFruit();this.cooldown=.4;this.setAim(this.aim);return true}
  step(dt){
    this.events=[];if(this.status!=='running')return;
    dt=clamp(dt,0,.05);this.elapsed+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
    const sub=dt/4;
    for(let s=0;s<4;s++){
      for(const b of this.bodies){const r=FRUITS[b.t].r;b.age+=sub;b.delay=Math.max(0,b.delay-sub);b.vy+=MODES[this.mode].gravity*sub;b.vx*=Math.pow(.996,sub*60);b.x+=b.vx*sub;b.y+=b.vy*sub;b.angle+=b.vx*sub/r*.22;
        if(b.x<r+8){b.x=r+8;b.vx=Math.abs(b.vx)*.25}if(b.x>W-r-8){b.x=W-r-8;b.vx=-Math.abs(b.vx)*.25}
        if(b.y>FLOOR-r){b.y=FLOOR-r;b.vy=b.vy>35?-b.vy*.14:0;b.vx*=.96}
      }
      for(let pass=0;pass<5;pass++)for(let i=0;i<this.bodies.length;i++)for(let j=i+1;j<this.bodies.length;j++){
        const a=this.bodies[i],b=this.bodies[j],ra=FRUITS[a.t].r,rb=FRUITS[b.t].r;
        let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=ra+rb)continue;
        if(a.t===b.t&&!a.delay&&!b.delay){
          const t=a.t,x=(a.x+b.x)/2,y=(a.y+b.y)/2,points=FRUITS[t].points;this.score+=points;
          this.bodies.splice(j,1);this.bodies.splice(i,1);
          if(t<FRUITS.length-1){const n=this.body(t+1,x,y);n.vx=(a.vx+b.vx)/2;n.vy=Math.min(0,(a.vy+b.vy)/2)-30;this.bodies.push(n)}else{this.harvests++;this.score+=1000}
          this.events.push({x,y,t,points:t===7?points+1000:points,harvest:t===7});i--;break;
        }
        if(d<.001){dx=.01;dy=.001;d=Math.hypot(dx,dy)}
        const nx=dx/d,ny=dy/d,ia=1/(ra*ra),ib=1/(rb*rb),sum=ia+ib,overlap=(ra+rb-d)*.85;
        a.x-=nx*overlap*ia/sum;a.y-=ny*overlap*ia/sum;b.x+=nx*overlap*ib/sum;b.y+=ny*overlap*ib/sum;
        const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
        if(relative<0){const impulse=-1.13*relative/sum;a.vx-=impulse*ia*nx;a.vy-=impulse*ia*ny;b.vx+=impulse*ib*nx;b.vy+=impulse*ib*ny;
          const tx=-ny,ty=nx,slip=(b.vx-a.vx)*tx+(b.vy-a.vy)*ty,friction=-slip*.035/sum;a.vx-=friction*ia*tx;a.vy-=friction*ia*ty;b.vx+=friction*ib*tx;b.vy+=friction*ib*ty;
        }
      }
    }
    const overflow=this.bodies.some(b=>b.age>1.6&&b.y-FRUITS[b.t].r<LINE&&Math.abs(b.vy)<100);
    this.danger=overflow?this.danger+dt:Math.max(0,this.danger-dt*2);
    if(this.danger>=MODES[this.mode].grace){this.status='over';this.events.push({over:true})}
  }
  serialize(){const {events,...data}=this;return{version:1,...data}}
  static restore(data){
    if(!data||data.version!==1||!Object.hasOwn(MODES,data.mode)||!['running','paused','over'].includes(data.status)||!Array.isArray(data.bodies)||data.bodies.length>120)throw Error('Invalid save');
    for(const key of ['rng','score','elapsed','cooldown','danger','current','next','aim','serial','harvests'])if(!Number.isFinite(data[key]))throw Error('Invalid state');
    if(data.score<0||data.elapsed<0||![data.current,data.next].every(t=>Number.isInteger(t)&&t>=0&&t<4)||data.serial<1)throw Error('Invalid values');
    for(const b of data.bodies)if(!Number.isInteger(b.t)||b.t<0||b.t>=FRUITS.length||!['id','x','y','vx','vy','angle','age','delay'].every(k=>Number.isFinite(b[k]))||Math.abs(b.x)>2000||Math.abs(b.y)>5000)throw Error('Invalid fruit');
    const e=new Engine(data.mode);for(const key of Object.keys(e))if(key!=='events'&&Object.hasOwn(data,key))e[key]=structuredClone(data[key]);e.setAim(e.aim);return e;
  }
}
