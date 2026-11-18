// Three close-up studies of the mechanisms in Slider, SignalGraph and HexStat.
// The film renderer supplies the canvas, local time and both brand fonts.
const P = {
  void: '#090b12', graphite: '#191c23', red: '#ff403b', cyan: '#7df6ee',
  white: '#f1eee9', dim: '#929da7', yellow: '#f7d856',
};
const TAU = 2 * Math.PI;
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (n) => { const u = clamp(n); return u * u * (3 - 2 * u); };
const ramp = (t, a, b) => smooth((t - a) / (b - a));
const mix = (a, b, f) => a + (b - a) * f;

function path(ctx, pts, closed = false) {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]);
  if (closed) ctx.closePath();
}
function shape(ctx, pts, fill, edge, width = 1) {
  path(ctx, pts, true);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (edge) { ctx.lineWidth = width; ctx.strokeStyle = edge; ctx.stroke(); }
}
function line(ctx, pts, color, width = 1) {
  path(ctx, pts); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
}
function ellipse(ctx, x, y, rx, ry, color, edge, width = 1) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  if (color) { ctx.fillStyle = color; ctx.fill(); }
  if (edge) { ctx.lineWidth = width; ctx.strokeStyle = edge; ctx.stroke(); }
}
function text(ctx, words, x, y, size, color, options = {}) {
  const {font = 'JetBrains Mono', align = 'left', weight = 500} = options;
  ctx.font = weight + ' ' + size + 'px "' + font + '", sans-serif';
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillText(words, x, y);
}
function gradient(ctx, x1, y1, x2, y2, colors) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of colors) g.addColorStop(at, color);
  return g;
}
function cut(x, y, w, h, a = 14, b = 22) {
  return [[x+a,y],[x+w,y],[x+w,y+h-b],[x+w-b,y+h],[x,y+h],[x,y+a]];
}
function screw(ctx, x, y) {
  ellipse(ctx, x, y, 5, 5, '#08090d', '#62636c', 1.2);
  line(ctx, [[x-2.2,y+2],[x+2.2,y-2]], '#8c9499', 1.3);
}
function handle(ctx, x, resting) {
  ctx.save(); ctx.translate(x, 0);
  // Three surfaces, milled grip, and a luminous index engraved into the cap.
  const foot = [[-30,291],[14,291],[28,305],[28,380],[13,396],[-30,396]];
  const cap = foot.map(([u,v]) => [u-4,v-11]);
  shape(ctx, foot.map(([u,v]) => [u+6,v+9]), '#06070b');
  shape(ctx, foot, '#4c5860', '#9aa8af', 1.2);
  shape(ctx, [[24,294],[28,305],[28,380],[24,369]], '#bbc8c9');
  shape(ctx, cap, gradient(ctx,-32,270,21,385,[
    [0,'#fbf8e8'],[.22,'#b1bcc0'],[.5,'#4b5966'],[.7,'#b0bbc0'],[1,'#656f79']
  ]), '#c7d3d2', 1.3);
  for (let i=0;i<8;i++) {
    const yy=309+6.7*i;
    line(ctx,[[-22,yy],[13,yy]],'#313d46',2);
    line(ctx,[[-22,yy+1.6],[13,yy+1.6]],'#c3cccd',.8);
  }
  rect(ctx,-24,291,36,4,resting ? P.cyan : P.white);
  ctx.restore();
}
function gain(ctx, t) {
  const change = ramp(t, .17, 1.12);
  const v = 18 + 66 * change;
  const x = 69 + v * 8.38;
  ctx.translate(539 + mix(-10,8,ramp(t,0,1.875)), 671);
  ctx.rotate(mix(-.091,-.047,ramp(t,0,1.875)));
  const zoom=mix(1.06,.96,ramp(t,0,1.7));
  ctx.scale(zoom,zoom); ctx.translate(-490,-224);
  const outline=cut(-2,0,984,482,36,51);
  shape(ctx,outline.map(([a,b])=>[a+4,b+27]),'#08080d','#252831');
  shape(ctx,outline.map(([a,b])=>[a+2,b+16]),'#24272e','#343b42');
  shape(ctx,outline,gradient(ctx,0,0,930,440,[
    [0,'#3e3e45'],[.11,'#24262d'],[.46,'#171a22'],[.78,'#252932'],[1,'#393a40']
  ]),'#656970',1.7);
  // Narrow machined ridges on the front edge.
  for(let i=0;i<3;i++) line(ctx,[[5,486+4*i],[933,486+4*i],[972,447+4*i]],'#484850',1);
  const face=cut(17,16,946,447,25,39);
  shape(ctx,face,gradient(ctx,17,16,947,460,[[0,'#1e2229'],[.55,'#10131a'],[1,'#181c23']]),'#090b11',2);
  line(ctx,[[45,17],[962,17]],'#7a777a',1);
  for(const [a,b] of [[34,49],[942,37],[36,441],[928,433]]) screw(ctx,a,b);
  // The body is engraved with the same sloping cuts as the registry frame.
  text(ctx,'CH. A',68,66,21,P.dim);
  text(ctx,'GAIN',62,183,111,P.white,{font:'Rajdhani',weight:700});
  rect(ctx,70,207,395,2,'#484b50');
  for(let i=0;i<27;i++){
    const active = i < Math.round(v*.27);
    rect(ctx,70+i*13.1,226,8,10,active ? P.red : '#35343d');
  }
  // Bonded glass with a contained cyan readout.
  shape(ctx,cut(495,48,410,195,16,18),'#070a11','#414650',2);
  shape(ctx,cut(503,55,394,181,12,15),gradient(ctx,490,0,842,250,[[0,'#193437'],[.5,'#0d171c'],[1,'#111b20']]));
  const digit=String(Math.round(v)).padStart(2,'0');
  text(ctx,digit,813,206,170,P.cyan,{font:'Rajdhani',weight:600,align:'right'});
  text(ctx,'%',874,202,53,'#9eadb4',{font:'Rajdhani',weight:600,align:'right'});
  // The scale shares its detents and cut rectangular thumb with the real Slider.
  for(let i=0;i<=50;i++){
    const xx=69+i*16.76, major=i%5===0;
    line(ctx,[[xx,335],[xx,major?298:315]],i<=v/2 ? '#ff6057':'#585963',major?2.4:1.3);
    if(i%10===0) text(ctx,String(i*2),xx,285,19,i<=v/2 ? '#cfc4c4':'#8f9099',{align:'center'});
  }
  shape(ctx,cut(60,341,858,22,5,6),'#080a0e','#454952',1.5);
  rect(ctx,69,350,x-69,4,P.red); rect(ctx,69,350,x-69,1.4,'#ffb3a6');
  handle(ctx,x,t>.15 && t<1.28);
  text(ctx,'INPUT LEVEL',69,430,18,'#b3a8a8');
  text(ctx,'0 — 100%',909,429,18,'#a3a6ab',{align:'right'});
}

function gauss(x,c,w) { return Math.exp(-Math.pow((x-c)/w,2)); }
function sample(u,d,time) {
  // Each stacked contour is an earlier acquisition of the same signal.
  const phase = time * 2.35 - d * 2.38;
  const x = u + .045*Math.sin(phase);
  const envelope = .21*gauss(x,.16,.11) + .83*gauss(x,.51+.03*Math.cos(phase),.105)
    + .61*gauss(x,.72,.077) + .34*gauss(x,.89,.056);
  return .075 + envelope*(.79+.15*Math.sin(64*u+4*phase)+.065*Math.sin(159*u+phase))
    + .036*Math.sin(28*u+phase)*Math.sin(Math.PI*u);
}
function signal(ctx,t) {
  const drift=ramp(t,0,1.875), extent=.52+.48*ramp(t,-.18,.67);
  const frontX=64-9*drift, frontY=878+9*drift;
  const project=(u,d,amp=0) => [
    frontX+794*u+145*d+10*drift*d,
    frontY-182*d-57*u-345*amp,
  ];
  // Readout and waterfall share the same samples. Each ribbon is one acquisition.
  const marker=.49+.055*Math.sin(2.08*t+.04);
  const value=Math.round(100*sample(marker,0,t));
  text(ctx,'RELAY SIGNAL',70,402,23,'#bbaeb2');
  text(ctx,String(value),59,530,147,P.cyan,{font:'Rajdhani',weight:600});
  text(ctx,'dB',220,519,45,P.white,{font:'Rajdhani',weight:500});
  const foot=[project(0,0),project(1,0),project(1,1),project(0,1)];
  shape(ctx,foot,'#14161f','#41373f',1.3);
  for(let j=0;j<=10;j++) line(ctx,[project(j/10,0),project(j/10,1)],'#46313a',1);
  for(let j=0;j<=5;j++) line(ctx,[project(0,j/5),project(1,j/5)],'#462f38',1);
  const history=35, steps=142;
  for(let i=history;i>=0;i--){
    const depth=i/history, points=[];
    const edge=extent+(1-extent)*depth;
    for(let j=0;j<=steps;j++){
      const u=(j/steps)*edge;
      points.push(project(u,depth,sample(u,depth,t)));
    }
    const fill=depth>.44?'#18141d':'#111e25';
    shape(ctx,[project(0,depth),...points,project(edge,depth)],fill);
    // Copper behind, ion-blue at the live front edge.
    const color=depth>.44
      ? 'rgb('+Math.round(239-65*depth)+','+Math.round(84-17*depth)+','+Math.round(82-14*depth)+')'
      : 'rgb('+Math.round(84+43*(1-depth)) +','+Math.round(229-75*depth)+','+Math.round(222-33*depth)+')';
    line(ctx,points,i===0 ? '#d0fff7' : color,i===0?3.9:1.8);
  }
  // A moving acquisition reticle picks out a sample on the live trace.
  const [mx,my]=project(marker,0,sample(marker,0,t));
  line(ctx,[[mx,my+10],[mx,frontY-57*marker+9]],'#478d8b',1.5);
  ellipse(ctx,mx,my,6,6,P.cyan,'#121e24',2);
  const pulse=(t*1.8)%1;
  ellipse(ctx,mx,my,8+12*pulse,8+12*pulse,null,'rgba(125,246,238,'+(.7*(1-pulse))+')',1.6);
  // The paired bar-graph readout is a second real SignalGraph variant.
  line(ctx,[[64,939],[1011,939]],'#3f393f',1.2);
  text(ctx,'SPECTRUM',66,987,21,'#c6bdc0');
  const bars=60;
  for(let i=0;i<bars;i++){
    const u=i/(bars-1), val=sample(u,.52,t-.12);
    const h=8+val*64;
    rect(ctx,256+i*12.5,1004-h,7.5,h,i===bars-1?P.yellow:(val>.51?P.red:'#a84448'));
  }
}

function hexagon(x,y,r) {
  return Array.from({length:6},(_,i)=>[x+r*Math.cos(i*TAU/6),y+r*Math.sin(i*TAU/6)]);
}
function boardTrace(ctx,coords,t,live=false) {
  line(ctx,coords,live?'#417c7d':'#58363d',2);
  if(!live) return;
  const lengths=coords.slice(1).map(([x,y],i)=>Math.hypot(x-coords[i][0],y-coords[i][1]));
  const total=lengths.reduce((a,b)=>a+b,0);
  let at=((t*.82)%1)*total;
  let i=0;
  while(i+1<lengths.length&&at>lengths[i]){at-=lengths[i]; i++;}
  const f=at/lengths[i];
  const x=mix(coords[i][0],coords[i+1][0],f),y=mix(coords[i][1],coords[i+1][1],f);
  ellipse(ctx,x,y,2.8,2.8,P.cyan);
}
function icon(ctx,type,x,y,s,color) {
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  if(type==='CIRCUIT'){
    shape(ctx,cut(-11,-11,22,22,3,3),null,color,2.3);
    shape(ctx,cut(-5,-5,10,10,1,1),null,color,1.4);
    for(const axis of [-1,1]) for(const p of [-6,0,6]){
      line(ctx,[[p,12*axis],[p,17*axis]],color,1.7);
      line(ctx,[[12*axis,p],[17*axis,p]],color,1.7);
    }
  } else if(type==='REFLEX'){
    shape(ctx,[[2,-15],[-9,3],[-1,3],[-3,15],[11,-4],[3,-4]],null,color,2.3);
  } else if(type==='FRAME'){
    line(ctx,[[-12,0],[12,0]],color,3);
    for(const a of [-1,1]){line(ctx,[[a*9,-9],[a*9,9]],color,3);line(ctx,[[a*14,-5],[a*14,5]],color,3);}
  } else if(type==='NERVE'){
    for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);line(ctx,[[0,0],[12,0]],color,2.1);line(ctx,[[5,-4],[9,0],[5,4]],color,1.7);}
  } else {
    line(ctx,[[-2,-12],[-9,-8],[-9,-5],[-13,-3],[-11,5],[-7,7],[-6,11],[-1,10],[-1,-9]],color,2.1);
    line(ctx,[[2,-12],[9,-7],[8,-3],[13,-1],[12,5],[6,8],[6,11],[2,10],[2,-12]],color,2.1);
  }
  ctx.restore();
}
function hexCell(ctx, node, selected, t, event) {
  const {x,y,r,label,number}=node;
  const main=label==='CIRCUIT', pulse=main ? Math.exp(-Math.max(t-event,0)*7)*(t>=event?1:0):0;
  const face=hexagon(x,y,r-4), shell=hexagon(x,y,r+2);
  shape(ctx,shell.map(([a,b])=>[a+2,b+10]),'#101218','#42414a',1.4);
  shape(ctx,shell,selected?'#ec4b4b':'#763f46');
  shape(ctx,face,gradient(ctx,x-r,y-r,x+r,y+r,selected?
    [[0,'#56252e'],[.55,'#351c25'],[1,'#201820']]:[[0,'#30232c'],[.55,'#1c1b23'],[1,'#15171e']]));
  if(pulse>.02) shape(ctx,face,'rgba(248,83,78,'+(.27*pulse)+')');
  const h=r*.866;
  line(ctx,[[x-r*.49,y-h+4],[x+r*.49,y-h+4]],selected?P.cyan:'#a5575b',selected?5:2);
  if(selected){
    // Printed target corners remain legible while the active traces turn cyan.
    for(const side of [-1,1]) line(ctx,[[x+side*(r-13),y-7],[x+side*(r-8),y],[x+side*(r-13),y+7]],P.cyan,2.7);
  }
  const color=selected?P.white:'#d1bbc0';
  text(ctx,label,x,y-h*.42,main?28:21,color,{font:'Rajdhani',weight:700,align:'center'});
  icon(ctx,label,x-(main?52:30),y+(main?17:13),main?1.05:.78,selected?P.white:'#ad8189');
  text(ctx,String(number),x+(main?26:17),y+(main?44:35),main?104:62,P.cyan,{font:'Rajdhani',weight:600,align:'center'});
  const kw=main?60:40, kh=main?33:24, cy=y+h;
  shape(ctx,cut(x-kw/2,cy-kh/2,kw,kh,5,5),pulse>.58?P.cyan:'#121d23',selected?'#82d4d1':'#52656b',1.7);
  const colorKey=pulse>.58?P.void:P.cyan;
  line(ctx,[[x-6,cy],[x+6,cy]],colorKey,2);line(ctx,[[x,cy-6],[x,cy+6]],colorKey,2);
}
function attributes(ctx,t){
  const focus=ramp(t,.12,.64), event=.99, raise=t>=event;
  ctx.translate(540,678); const sc=1.02+.035*focus;
  ctx.scale(sc,sc); ctx.translate(-540,-678);
  const coords=[
    {x:250,y:528,r:100,label:'REFLEX',number:7},
    {x:830,y:528,r:100,label:'FRAME',number:9},
    {x:250,y:845,r:100,label:'NERVE',number:13},
    {x:830,y:845,r:100,label:'CORTEX',number:11},
    {x:540,y:688,r:161,label:'CIRCUIT',number:raise?15:14},
  ];
  const [cx,cy]=[540,688];
  // The unfinished side traces and plated through-holes make this read as a PCB.
  for(let i=0;i<4;i++){
    const n=coords[i], sx=Math.sign(n.x-cx), sy=Math.sign(n.y-cy);
    for(let j=-1;j<=1;j++){
      const bus=[[cx+sx*(115+5*j),cy+sy*(60-7*j)],[cx+sx*(145+5*j),cy+sy*(60-7*j)],
        [n.x-sx*86,n.y+sy*(-8+7*j)],[n.x-sx*62,n.y+sy*(-8+7*j)]];
      boardTrace(ctx,bus,t+j*.08+.3*i,t>.36 || i===2);
    }
    for(let j=0;j<3;j++){
      const routing=[[n.x+sx*62,n.y+12*j],[n.x+sx*(114+7*j),n.y+12*j],
        [n.x+sx*(142+7*j),n.y+12*j+sy*28],[n.x+sx*(161+7*j),n.y+12*j+sy*28]];
      boardTrace(ctx,routing,t,false);
      const [ex,ey]=routing[3];ellipse(ctx,ex,ey,3.4,3.4,'#101219','#87535b',1.4);
    }
  }
  for(let i=0;i<4;i++) hexCell(ctx,coords[i],t<.36&&i===2,t,event);
  hexCell(ctx,coords[4],t>=.36,t,event);
  // A point travels into the selected node's raise key. Its balance decrements.
  const lower=982, c=raise ? P.yellow:P.dim;
  text(ctx,'ATTRIBUTE POINTS',543,lower,20,'#ada9b1',{align:'center'});
  text(ctx,(raise?'02':'03')+' LEFT',543,lower+34,25,c,{align:'center'});
  line(ctx,[[446,lower-8],[421,lower-8],[387,lower+26],[334,lower+26]],'#5f444b',1.4);
  line(ctx,[[636,lower-8],[662,lower-8],[696,lower+26],[749,lower+26]],'#5f444b',1.4);
  if(t>.57&&t<event){
    const f=ramp(t,.57,event), yy=mix(940,826,f);
    shape(ctx,[[536,yy],[540,yy-6],[544,yy],[540,yy+6]],P.yellow);
  }
}

export function drawInstruments(ctx, shot, t) {
  ctx.save();
  ctx.lineJoin='miter'; ctx.lineCap='butt';
  if(shot===0) gain(ctx,t);
  else if(shot===1) signal(ctx,t);
  else if(shot===2) attributes(ctx,t);
  ctx.restore();
}
