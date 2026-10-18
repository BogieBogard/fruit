import{FRUITS}from'./engine.js';
export function fruit(ctx,t,x,y,r,angle=0,alpha=1){
 const f=FRUITS[t];ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;
 ctx.shadowColor='#35462b19';ctx.shadowBlur=r*.13;ctx.shadowOffsetY=r*.09;
 const gradient=ctx.createRadialGradient(-r*.35,-r*.5,r*.04,0,0,r);gradient.addColorStop(0,f.light);gradient.addColorStop(1,f.color);ctx.fillStyle=gradient;ctx.strokeStyle='#4f62364d';ctx.lineWidth=Math.max(1,r*.025);
 ctx.beginPath();if(t===1){ctx.moveTo(0,r);ctx.bezierCurveTo(-r*1.4,r*.1,-r*1.05,-r*.9,0,-r*.82);ctx.bezierCurveTo(r*1.05,-r*.9,r*1.4,r*.1,0,r)}else if(t===4){ctx.moveTo(0,-r*.8);ctx.bezierCurveTo(-r*1.15,-r*1.4,-r*1.35,r*.8,0,r);ctx.bezierCurveTo(r*1.35,r*.8,r*1.15,-r*1.4,0,-r*.8)}else{ctx.ellipse(0,0,r*(t===5?.88:1),r,0,0,Math.PI*2)}ctx.fill();ctx.stroke();ctx.shadowColor='transparent';
 ctx.save();ctx.globalAlpha*=.25;ctx.strokeStyle='#788537';ctx.lineWidth=1;
 if(t===5||t===7){for(let row=-3;row<4;row++)for(let col=-3;col<4;col++){const px=col*r*.23+(row%2)*r*.11,py=row*r*.24;if(Math.hypot(px,py)<r*.83){ctx.beginPath();ctx.moveTo(px,py-2);ctx.lineTo(px+2,py+1);ctx.lineTo(px-2,py+1);ctx.closePath();ctx.stroke()}}}
 if(t===1){ctx.fillStyle='#fff6c5';for(let j=0;j<9;j++){let a=j*2.4,rr=r*(.4+(j%3)*.16);ctx.beginPath();ctx.ellipse(Math.cos(a)*rr,Math.sin(a)*rr,1.2,2,.2,0,7);ctx.fill()}}
 if(t===2){ctx.fillStyle='#bc7b28';for(let j=0;j<13;j++){let a=j*2.4,rr=r*(.5+(j%3)*.12);ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,.7,0,7);ctx.fill()}}
 if(t===4){ctx.beginPath();ctx.moveTo(0,-r*.65);ctx.quadraticCurveTo(r*.18,-r*.15,r*.08,r*.35);ctx.stroke()}
 if(t===6){ctx.fillStyle='#fcf4df';ctx.beginPath();ctx.ellipse(0,0,r*.79,r*.84,0,0,7);ctx.fill();ctx.fillStyle='#313d36';for(let j=0;j<22;j++){const a=j*2.4,rr=r*(.2+(j%5)*.12);ctx.beginPath();ctx.ellipse(Math.cos(a)*rr,Math.sin(a)*rr,1.2,1.9,a,0,7);ctx.fill()}}
 ctx.restore();
 // A little leaf and a face make every fruit feel like family.
 ctx.strokeStyle='#5f6940';ctx.lineWidth=Math.max(1.5,r*.055);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-r*.89);ctx.quadraticCurveTo(-r*.05,-r*1.09,r*.08,-r*1.13);ctx.stroke();ctx.fillStyle='#64865a';ctx.beginPath();
 if(t===5){ctx.moveTo(-r*.4,-r*.8);ctx.lineTo(-r*.4,-r*1.25);ctx.lineTo(-r*.08,-r*1.06);ctx.lineTo(r*.12,-r*1.5);ctx.lineTo(r*.25,-r*1.05);ctx.lineTo(r*.5,-r*1.22);ctx.lineTo(r*.35,-r*.8)}else{ctx.moveTo(0,-r*.94);ctx.quadraticCurveTo(r*.16,-r*1.3,r*.47,-r*1.08);ctx.quadraticCurveTo(r*.29,-r*.83,0,-r*.94)}ctx.fill();
 ctx.fillStyle='#374832';for(const sign of[-1,1]){ctx.beginPath();ctx.ellipse(sign*r*.27,r*.05,r*.052,r*.075,0,0,7);ctx.fill()}
 ctx.strokeStyle='#374832';ctx.lineWidth=Math.max(1.2,r*.033);ctx.beginPath();ctx.arc(0,r*.15,r*.13,.18,Math.PI-.18);ctx.stroke();ctx.fillStyle='#dc7e7370';for(const sign of[-1,1]){ctx.beginPath();ctx.ellipse(sign*r*.42,r*.21,r*.09,r*.055,0,0,7);ctx.fill()}
 ctx.restore();
}
