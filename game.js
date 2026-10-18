import{Engine,FRUITS,MODES,W,H,LINE,WALL}from'./engine.js?v=6';
import{fruit}from'./art.js?v=5';
const $=s=>document.querySelector(s),board=$('#board'),ctx=board.getContext('2d'),next=$('#next').getContext('2d');
let worldHeight=H,worldWidth=W;
function fitBoard(){
  const box=board.getBoundingClientRect();if(!box.width||!box.height)return;
  const settled=engine?.bodies.filter(b=>b.age>1.4)??[];
  const pileHeight=settled.length?Math.max(...settled.map(b=>engine.floor-b.y+FRUITS[b.t].r))+LINE+16:360;
  worldHeight=Math.max(360,pileHeight,W*box.height/box.width);worldWidth=worldHeight*box.width/box.height;
  const density=Math.min(devicePixelRatio||1,3),pixelWidth=Math.round(box.width*density),pixelHeight=Math.round(box.height*density);
  if(board.width!==pixelWidth||board.height!==pixelHeight){board.width=pixelWidth;board.height=pixelHeight}
  ctx.setTransform(pixelWidth/worldWidth,0,0,pixelHeight/worldHeight,0,0);
  $('.board-wrap').style.setProperty('--caption-top',`${(LINE+18)/worldHeight*100}%`);
  if(engine&&(engine.height!==worldHeight||engine.width!==worldWidth)){engine.resizeBoard(worldHeight,worldWidth);save()}
}
const KEY='mbogard.fruit.orchard.v1';
let engine=null,selected='classic',particles=[],bursts=[],rings=[],last=0,acc=0,lastSave=0,sound=false,audio=null;
let settings={best:{},sound:false},storage=true,uiStamp='',returnFromHelp=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
try{
  const saved=JSON.parse(localStorage.getItem(KEY)||'null');
  if(saved){if(saved.settings?.best&&typeof saved.settings.best==='object')for(const mode of Object.keys(MODES)){const n=saved.settings.best[mode];if(Number.isFinite(n)&&n>=0)settings.best[mode]=n}
    sound=!!saved.settings?.sound;
    if(saved.run)try{engine=Engine.restore(saved.run);selected=engine.mode;if(engine.status!=='over')engine.status='paused'}catch{}}
}catch{storage=false}
function save(){try{settings.sound=sound;localStorage.setItem(KEY,JSON.stringify({settings,run:engine?.serialize()??null}));$('#save-status').textContent='● AUTO-SAVED'}catch{storage=false;$('#save-status').textContent='SAVING UNAVAILABLE'}}
function tone(t=0,drop=false){
  if(!sound)return;
  try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const now=audio.currentTime;
    for(let i=0;i<(drop?1:3);i++){const o=audio.createOscillator(),g=audio.createGain();o.type=drop?'sine':'triangle';const freq=drop?160:310*Math.pow(1.12,t)*[1,1.25,1.5][i];o.frequency.setValueAtTime(freq,now+i*.035);o.frequency.exponentialRampToValueAtTime(freq*(drop?.55:1.04),now+i*.035+.12);g.gain.setValueAtTime(.0001,now+i*.035);g.gain.exponentialRampToValueAtTime(drop?.04:.027,now+i*.035+.012);g.gain.exponentialRampToValueAtTime(.0001,now+i*.035+.23);o.connect(g);g.connect(audio.destination);o.start(now+i*.035);o.stop(now+i*.035+.25)}}catch{}
}
function soundUI(){$('#sound').setAttribute('aria-pressed',sound);$('#sound').setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');$('.off-slash').hidden=sound}
function toggleSound(){sound=!sound;soundUI();save();if(sound)tone(2)}
function sync(force=false){
  const mode=engine?.mode||selected,time=Math.floor(engine?.elapsed||0);
  const stamp=[mode,engine?.score,settings.best[mode],time,engine?.current,engine?.queue.join(','),engine?.status,engine?.history.length].join('|');
  if(!force&&stamp===uiStamp)return;uiStamp=stamp;
  $('#mode-label').textContent=MODES[mode].name.toUpperCase();$('#score').textContent=(engine?.score||0).toLocaleString();$('#best').textContent=(settings.best[mode]||0).toLocaleString();$('#time').textContent=`${Math.floor(time/60)}:${String(time%60).padStart(2,'0')}`;
  next.clearRect(0,0,240,85);for(let i=0;i<3;i++)fruit(next,engine?.queue[i]??[1,2,4][i],40+i*80,47,i===0?27:23,0,i===0?1:.65);
  $('#next').setAttribute('aria-label',`Next fruit: ${FRUITS[engine?.next??1].name}`);
  $('#pause').disabled=!engine||engine.status==='over';$('#pause').textContent=engine?.status==='paused'?'▶':'Ⅱ';$('#pause').setAttribute('aria-label',engine?.status==='paused'?'Resume game':'Pause game');
  $('#undo-count').textContent='∞';$('#sweep-count').textContent='∞';
  $('#undo').disabled=!engine||!engine.history.length;
  $('#sweep').disabled=!engine||!engine.bodies.length||engine.status!=='running';
  for(const c of document.querySelectorAll('#evolution canvas'))c.classList.toggle('current',Number(c.dataset.tier)===engine?.current);
}
function overlay(type){
  $('#overlay').hidden=false;const fresh=type==='new',over=type==='over';
  $('#mode-picker').hidden=!fresh;$('#mode-description').hidden=!fresh;$('#restart').hidden=fresh;
  $('#overlay-kicker').textContent=fresh?'DROP · MATCH · MERGE':over?'ONE MORE TRY?':'YOUR FRUIT IS WAITING';
  $('#overlay-title').innerHTML=fresh?'FRUIT<br><span>MERGE!</span>':over?'GAME<br><span>OVER!</span>':'GAME<br><span>PAUSED</span>';
  $('#overlay-text').innerHTML=fresh?'Match two of a kind.<br>Make bigger fruit. Keep below the line!':over?`<b>${engine.score.toLocaleString()} POINTS</b><br>Make room for an even bigger score.`:'Your progress is saved.<br>Ready for the next big merge?';
  $('#play').innerHTML=(fresh?'LET’S PLAY':over?'TRY AGAIN':'CONTINUE')+' <span>▶</span>';
  $('#restart').textContent=over?'CHANGE DIFFICULTY':'START A NEW GAME';
  for(const b of document.querySelectorAll('[data-mode]')){const active=b.dataset.mode===selected;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active)}
  $('#mode-description').textContent=MODES[selected].description;sync(true);
}
function fresh(){if(engine?.status==='running')engine.status='paused';overlay('new');save()}
function play(){
  if(!engine||!$('#mode-picker').hidden||engine.status==='over'){engine=new Engine(selected,Date.now(),worldHeight,worldWidth);particles=[];bursts=[];rings=[]}
  engine.status='running';engine.wake();$('#overlay').hidden=true;last=0;acc=0;save();sync(true);board.focus({preventScroll:true});
}
function pause(){if(!engine||engine.status==='over')return;if(engine.status==='running'){engine.status='paused';overlay('paused');save()}else play()}
function drop(){if(engine?.drop()){tone(0,true);save();sync(true)}}
function undo(){if(engine?.undo()){particles=[];bursts=[];rings=[];$('#overlay').hidden=true;last=0;acc=0;save();sync(true);board.focus({preventScroll:true});announce('Last action undone.')}}
function sweep(){if(engine?.sweep()){for(const e of engine.events)effects(e);save();sync(true);board.focus({preventScroll:true});announce('Smallest fruit cleared.')}}
function announce(text){$('#announcement').textContent=text}
for(const button of document.querySelectorAll('[data-mode]'))button.addEventListener('click',()=>{selected=button.dataset.mode;for(const b of document.querySelectorAll('[data-mode]')){b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button))}$('#mode-description').textContent=MODES[selected].description;$('#mode-label').textContent=MODES[selected].name.toUpperCase();$('#best').textContent=(settings.best[selected]||0).toLocaleString()});
$('#play').onclick=play;$('#pause').onclick=pause;$('#sound').onclick=toggleSound;$('#restart').onclick=fresh;$('#undo').onclick=undo;$('#sweep').onclick=sweep;
$('#new-game').onclick=()=>{if(engine&&engine.status!=='over'&&engine.bodies.length){engine.status='paused';overlay('paused');$('#overlay-title').innerHTML='START<br><span>AGAIN?</span>';$('#overlay-text').innerHTML='Continue your saved game,<br>or start fresh below.';save()}else fresh()};
$('#help-button').onclick=()=>{returnFromHelp=engine?.status==='running';if(returnFromHelp){engine.status='paused';save()}$('#help').showModal();sync(true)};
function closeHelp(){$('#help').close();if(returnFromHelp&&engine){engine.status='running';last=0}returnFromHelp=false;sync(true)}
$('#close-help').onclick=closeHelp;$('#help-ok').onclick=closeHelp;$('#help').addEventListener('cancel',e=>{e.preventDefault();closeHelp()});
function aim(e){if(!engine)return;const box=board.getBoundingClientRect();engine.setAim((e.clientX-box.left)/box.width*worldWidth)}
board.addEventListener('pointermove',aim);
board.addEventListener('pointerdown',e=>{if(engine?.status!=='running')return;board.setPointerCapture(e.pointerId);aim(e);e.preventDefault()});
board.addEventListener('pointerup',e=>{if(!board.hasPointerCapture(e.pointerId))return;aim(e);drop();board.releasePointerCapture(e.pointerId)});
document.addEventListener('keydown',e=>{
  if(e.target.closest('button,a,input,select')||$('#help').open)return;
  const k=e.key.toLowerCase();if(['arrowleft','arrowright',' ','p','escape','u','m'].includes(k))e.preventDefault();
  if(k==='m')toggleSound();if(k==='p'||k==='escape')pause();
  if(engine?.status==='running'&&$('#overlay').hidden){if(k==='arrowleft')engine.setAim(engine.aim-14);if(k==='arrowright')engine.setAim(engine.aim+14);if(k===' '&&!e.repeat)drop();if(k==='u'&&!e.repeat)undo()}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&engine?.status==='running'){engine.status='paused';overlay('paused');save()}last=0;acc=0});window.addEventListener('pagehide',save);
function effects(e){
  if(e.over){overlay('over');announce(`Game over. ${engine.score} points.`);save();return}
  tone(e.t);if(!e.sweep)bursts.push({...e,life:1});
  if(!reduced){rings.push({x:e.x,y:e.y,r:FRUITS[e.t].r,life:.35,color:FRUITS[e.t].light});for(let i=0;i<16;i++){const a=Math.random()*Math.PI*2,speed=45+Math.random()*110;particles.push({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-20,life:.6,t:e.t,r:2+Math.random()*4})}}
  if(e.combo>=3&&!reduced){$('.game').classList.remove('shake');void $('.game').offsetWidth;$('.game').classList.add('shake')}
  announce(e.harvest?'Watermelon harvest! A thousand bonus points.':e.sweep?'Fruit swept away.':`${FRUITS[e.t].name} merged. ${engine.score} points.`);
}
function render(dt){
  const W=worldWidth,H=worldHeight,FLOOR=engine?.floor??H-12;
  ctx.clearRect(0,0,W,H);ctx.save();
  // The rim, danger line, and physical walls share the same coordinates.
  const bg=ctx.createLinearGradient(0,LINE,0,H);bg.addColorStop(0,'#142028');bg.addColorStop(1,'#101b23');ctx.fillStyle=bg;ctx.fillRect(WALL,LINE-11,W-WALL*2,FLOOR-LINE+11);
  ctx.fillStyle='#ffffff02';for(let i=0;i<14;i++)ctx.fillRect(WALL+i*31,LINE-11,12,FLOOR-LINE+11);
  ctx.lineCap='round';ctx.strokeStyle='#b4d7e7';ctx.lineWidth=5;ctx.setLineDash([14,12]);ctx.beginPath();ctx.moveTo(WALL+8,LINE);ctx.lineTo(W-WALL-8,LINE);ctx.stroke();ctx.setLineDash([]);
  if(engine){
    if(engine.status==='running'){
      const x=engine.aim;ctx.fillStyle='#3287cf';for(let y=74;y<FLOOR;y+=21){ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(x,y,2.8,0,7);ctx.fill()}ctx.globalAlpha=1;
      fruit(ctx,engine.current,x,39,FRUITS[engine.current].r,0,engine.cooldown>0?.45:1);
    }
    for(const b of engine.bodies)fruit(ctx,b.t,b.x,b.y,FRUITS[b.t].r,b.angle);
    if(engine.danger){const pulse=.12+Math.sin(performance.now()*.012)*.06;ctx.fillStyle=`rgba(255,94,111,${pulse})`;ctx.fillRect(WALL,LINE-10,W-WALL*2,70);$('#board-hint').textContent=`TOO HIGH! ${(Math.max(0,MODES[engine.mode].grace-engine.danger)).toFixed(1)}s`}else $('#board-hint').textContent='';
  }
  // Full-width side and bottom rim visibly touches the collision surface.
  const rim=ctx.createLinearGradient(0,0,W,0);rim.addColorStop(0,'#994c7a');rim.addColorStop(.5,'#bf709b');rim.addColorStop(1,'#8b486d');ctx.strokeStyle=rim;ctx.lineWidth=10;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(5,LINE-21);ctx.lineTo(5,FLOOR+5);ctx.lineTo(W-5,FLOOR+5);ctx.lineTo(W-5,LINE-21);ctx.stroke();
  ctx.strokeStyle='#e28eb54d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(8,LINE-18);ctx.lineTo(8,FLOOR+2);ctx.lineTo(W-8,FLOOR+2);ctx.stroke();
  for(const ring of rings){ring.life-=dt;ctx.globalAlpha=Math.max(0,ring.life/.35);ctx.strokeStyle=ring.color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(ring.x,ring.y,ring.r+(1-ring.life/.35)*20,0,7);ctx.stroke()}rings=rings.filter(r=>r.life>0);
  for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=230*dt;ctx.globalAlpha=Math.max(0,p.life/.6);ctx.fillStyle=FRUITS[p.t].light;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill()}particles=particles.filter(p=>p.life>0);
  for(const b of bursts){b.life-=dt;ctx.globalAlpha=Math.max(0,b.life);ctx.font='1000 24px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#202633';ctx.fillStyle='#ffdf51';const text=b.harvest?'HARVEST!':b.combo>=3?`+${b.points} COMBO!`:`+${b.points}`;const yy=b.y-(1-b.life)*55;ctx.strokeText(text,b.x,yy);ctx.fillText(text,b.x,yy)}bursts=bursts.filter(b=>b.life>0);ctx.restore();
}
function frame(now){
  const dt=last?Math.min((now-last)/1000,.05):0;last=now;
  if(!document.hidden){if(engine?.status==='running'&&!$('#help').open){acc+=dt;let count=0;while(acc>=1/120&&count++<8){engine.step(1/120);for(const e of engine.events)effects(e);acc-=1/120;if(engine.status!=='running')break}const previous=settings.best[engine.mode]||0;if(engine.score>previous)settings.best[engine.mode]=engine.score;sync();if(now-lastSave>1200){save();lastSave=now}}render(dt)}requestAnimationFrame(frame);
}
for(let t=0;t<FRUITS.length;t++){
  const c=document.createElement('canvas');c.width=100;c.height=100;c.dataset.tier=t;c.title=FRUITS[t].name;c.setAttribute('role','img');c.setAttribute('aria-label',FRUITS[t].name);fruit(c.getContext('2d'),t,50,55,34);$('#evolution').append(c);
  const row=document.createElement('div');row.className='fruit-row';const copy=c.cloneNode();fruit(copy.getContext('2d'),t,50,55,34);const label=document.createElement('span');label.textContent=FRUITS[t].name;row.append(copy,label);$('#ladder').append(row);
}
const hero=$('#hero').getContext('2d');fruit(hero,4,155,132,65,-.2);fruit(hero,10,310,115,88,.08);fruit(hero,5,466,132,65,.2);
soundUI();overlay(engine?(engine.status==='over'?'over':'paused'):'new');if(!storage)$('#save-status').textContent='SAVING UNAVAILABLE';sync(true);fitBoard();new ResizeObserver(fitBoard).observe($('.board-wrap'));window.visualViewport?.addEventListener('resize',fitBoard);window.addEventListener('resize',fitBoard);requestAnimationFrame(frame);
