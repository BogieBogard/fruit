import{FRUITS}from'./engine.js?v=5';

// Every fruit has a full circular silhouette matching its physical radius.
// Details and leaves never replace, shrink, or inset the contact silhouette.
export function fruit(ctx,t,x,y,r,angle=0,alpha=1,expression=0){
  const f=FRUITS[t];ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;
  const stroke=Math.max(1.3,r*.047),rr=r-stroke*.3;
  const fill=ctx.createRadialGradient(-r*.34,-r*.42,r*.08,0,r*.1,r*1.2);
  fill.addColorStop(0,f.light);fill.addColorStop(1,f.color);
  ctx.fillStyle=fill;ctx.strokeStyle=f.edge;ctx.lineWidth=stroke;
  ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.save();ctx.beginPath();ctx.arc(0,0,rr-stroke*.4,0,Math.PI*2);ctx.clip();
  ctx.strokeStyle='#ffffff28';ctx.lineWidth=r*.055;ctx.beginPath();ctx.arc(-r*.02,-r*.02,r*.85,Math.PI*1.05,Math.PI*1.62);ctx.stroke();
  if(t===0){ctx.fillStyle='#1376bc';ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=r*(i%2?.14:.29);const xx=Math.cos(a)*rad,yy=-r*.6+Math.sin(a)*rad;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.closePath();ctx.fill()}
  if(t===2){ctx.fillStyle='#ffe792';for(let i=0;i<13;i++){const a=i*2.399,rad=r*(.38+(i%4)*.13);ctx.beginPath();ctx.ellipse(Math.cos(a)*rad,Math.sin(a)*rad,Math.max(.9,r*.035),r*.065,a,0,7);ctx.fill()}}
  if(t===3){ctx.fillStyle='#ffffff14';for(const[p,q]of[[-.42,-.38],[.37,-.4],[0,-.62],[-.55,.1],[.52,.2],[0,.6]]){ctx.beginPath();ctx.arc(p*r,q*r,r*.26,0,7);ctx.fill()}}
  if(t===4){ctx.fillStyle='#d86a172e';for(let i=0;i<17;i++){const a=i*2.399,rad=r*(.48+(i%4)*.1);ctx.beginPath();ctx.arc(Math.cos(a)*rad,Math.sin(a)*rad,Math.max(.6,r*.025),0,7);ctx.fill()}}
  if(t===6){ctx.strokeStyle='#d25b8255';ctx.lineWidth=r*.025;ctx.beginPath();ctx.moveTo(0,-r);ctx.bezierCurveTo(r*.18,-r*.6,-r*.17,-r*.3,0,r*.62);ctx.stroke()}
  if(t===7){ctx.strokeStyle='#cb9a2270';ctx.lineWidth=r*.026;for(let j=-4;j<=4;j++){ctx.beginPath();ctx.moveTo(-r,j*r*.36-r);ctx.lineTo(r,j*r*.36+r);ctx.stroke();ctx.beginPath();ctx.moveTo(r,j*r*.36-r);ctx.lineTo(-r,j*r*.36+r);ctx.stroke()}}
  if(t===8){ctx.fillStyle='#fff0e3';ctx.beginPath();ctx.arc(0,0,r*.78,0,7);ctx.fill();ctx.fillStyle='#743659';for(let i=0;i<31;i++){const a=i*2.399,rad=r*(.12+(i%7)*.095);ctx.beginPath();ctx.ellipse(Math.cos(a)*rad,Math.sin(a)*rad,r*.015,r*.025,a,0,7);ctx.fill()}}
  if(t===10){ctx.strokeStyle='#168725';ctx.lineWidth=r*.11;for(let j=-3;j<=3;j++){ctx.beginPath();for(let i=0;i<=35;i++){const yy=-r+i*r*2/35,xx=j*r*.35+Math.sin(yy/r*4+j)*r*.09;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.stroke()}}
  if(t===9){ctx.fillStyle='#719a21aa';for(let row=-5;row<=5;row++)for(let col=-5;col<=5;col++){const xx=col*r*.18+(row%2)*r*.09,yy=row*r*.18;if(Math.hypot(xx,yy)>r*.88)continue;ctx.beginPath();ctx.moveTo(xx,yy-r*.035);ctx.lineTo(xx+r*.03,yy+r*.025);ctx.lineTo(xx-r*.03,yy+r*.025);ctx.closePath();ctx.fill()}}
  ctx.restore();
  // Small protruding leaves keep the round collision surface readable.
  if(t!==0&&t!==3&&t!==10){ctx.strokeStyle='#5a402b';ctx.lineWidth=Math.max(1.5,r*.06);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-r*.9);ctx.quadraticCurveTo(-r*.05,-r*1.12,r*.09,-r*1.12);ctx.stroke();ctx.fillStyle=t===7?'#4eaa3d':'#69ba35';ctx.strokeStyle='#347329';ctx.lineWidth=Math.max(1,r*.025);ctx.beginPath();if(t===7){ctx.moveTo(-r*.38,-r*.85);ctx.lineTo(-r*.43,-r*1.26);ctx.lineTo(-r*.12,-r*1.06);ctx.lineTo(0,-r*1.44);ctx.lineTo(r*.19,-r*1.06);ctx.lineTo(r*.42,-r*1.26);ctx.lineTo(r*.34,-r*.86)}else if(t===2){for(let i=0;i<10;i++){const a=i*Math.PI/5,rad=i%2?r*.15:r*.38,xx=Math.cos(a)*rad,yy=-r*.85+Math.sin(a)*rad*.45;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}}else{ctx.moveTo(0,-r*.98);ctx.quadraticCurveTo(r*.12,-r*1.3,r*.44,-r*1.12);ctx.quadraticCurveTo(r*.32,-r*.86,0,-r*.98)}ctx.closePath();ctx.fill();ctx.stroke()}
  const face='#542f37';ctx.fillStyle=face;ctx.strokeStyle=face;ctx.lineWidth=Math.max(1.7,r*.055);ctx.lineCap='round';
  const happy=t===10||expression>0;
  for(const sign of[-1,1]){ctx.beginPath();if(happy){ctx.moveTo(sign*r*.34-r*.08,r*.04);ctx.lineTo(sign*r*.34,-r*.045);ctx.lineTo(sign*r*.34+r*.08,r*.04);ctx.stroke()}else if(t===3){ctx.moveTo(sign*r*.3-r*.06,-r*.015);ctx.lineTo(sign*r*.3+r*.05,r*.04);ctx.lineTo(sign*r*.3-r*.06,r*.09);ctx.stroke()}else{ctx.ellipse(sign*r*.3,r*.04,r*.048,r*.069,0,0,7);ctx.fill();ctx.fillStyle='#ffffffb0';ctx.beginPath();ctx.arc(sign*r*.3-r*.012,r*.015,r*.014,0,7);ctx.fill();ctx.fillStyle=face}}
  ctx.beginPath();ctx.arc(0,r*.14,r*(happy?.23:.16),.12,Math.PI-.12);ctx.stroke();
  if(happy){ctx.lineTo(-r*.22,r*.18);ctx.closePath();ctx.fill();ctx.fillStyle='#f47688';ctx.beginPath();ctx.ellipse(0,r*.31,r*.1,r*.055,0,0,7);ctx.fill()}
  ctx.fillStyle=t===10?'#e4b64566':'#ed577b55';for(const sign of[-1,1]){ctx.beginPath();ctx.ellipse(sign*r*.45,r*.2,r*.095,r*.055,-sign*.15,0,7);ctx.fill()}
  ctx.restore();
}
