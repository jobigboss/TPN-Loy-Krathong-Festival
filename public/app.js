const $=id=>document.getElementById(id),canvas=$('river'),ctx=canvas.getContext('2d');let items=[],style='lotus',online=false,busy=false,positions=[],w=0,h=0;const colors={lotus:'#fa83b5',rose:'#f15b6d',gold:'#ffc64b'};const arrivals=new Map();const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;const stars=Array.from({length:85},()=>[Math.random(),Math.random()*.45,Math.random()*1.6+.3]);
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0)}new ResizeObserver(resize).observe(canvas);resize();
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function draw(t){const s=reducedMotion?0:t/1000;let g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#111831');g.addColorStop(.43,'#40334e');g.addColorStop(.44,'#132f45');g.addColorStop(1,'#071c2b');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);for(const [x,y,r] of stars)ellipse(x*w,y*h,r,r,'#e8dbbf99');const mx=w*.73,my=h*.23,mr=Math.min(w,h)*.075;g=ctx.createRadialGradient(mx,my,mr*.4,mx,my,mr*2.8);g.addColorStop(0,'#ffe1a78a');g.addColorStop(1,'#ffe1a700');ellipse(mx,my,mr*2.8,mr*2.8,g);ellipse(mx,my,mr,mr,'#ffe6b1');ctx.fillStyle='#121e30';for(let i=0;i<12;i++){const x=i*w/11;ctx.beginPath();ctx.moveTo(x-w*.13,h*.44);ctx.lineTo(x,h*(.32+.04*Math.sin(i*4)));ctx.lineTo(x+w*.13,h*.44);ctx.fill()}for(let i=0;i<30;i++){const y=h*(.46+i*.018),x=mx+Math.sin(i*2+s*.6)*w*.045;ellipse(x,y,w*(.012+i*.002),1,'#e7bc7130')}positions=[];for(const item of [...items].sort((a,b)=>a.y-b.y)){const x=item.x*w+Math.sin(s*.45+item.x*12)*w*.035,y=(.44+item.y*.53)*h+Math.sin(s+item.x*10)*3,k=.65+item.y*.65;const age=(t-(arrivals.get(item.id)??(t-3000)))/1800,progress=reducedMotion?1:Math.min(1,Math.max(0,age)),ease=1-Math.pow(1-progress,3),py=y+(1-ease)*h*.17;positions.push({item,x,y:py,k});ctx.save();ctx.globalAlpha=ease;ctx.translate(x,py);ctx.scale(k,k);ellipse(0,12,32,4,'#eab65c22');ellipse(0,0,29,9,'#325b42');for(let j=0;j<7;j++){ctx.save();ctx.translate((j-3)*7,-3-Math.abs(j-3)*.6);ctx.rotate((j-3)*.18);ellipse(0,-4,6,12,colors[item.style]);ctx.restore()}ellipse(0,-3,15,5,'#f9d06c');ctx.fillStyle='#fff1c7';ctx.fillRect(-2,-21,4,18);let glow=ctx.createRadialGradient(0,-26,1,0,-26,22);glow.addColorStop(0,'#ffdf75aa');glow.addColorStop(1,'#ffb13a00');ellipse(0,-26,22,22,glow);const phase=item.x*17+item.y*11,sway=Math.sin(s*2.4+phase)*1.2,breath=1+Math.sin(s*3.1+phase)*.07;ctx.save();ctx.translate(sway,-25);ctx.scale(1,breath);ctx.fillStyle='#ffb544';ctx.beginPath();ctx.moveTo(0,-9);ctx.bezierCurveTo(5,-3,5,3,0,5);ctx.bezierCurveTo(-5,3,-4,-3,0,-9);ctx.fill();ellipse(0,1,1.7,3.2,'#fff4c5');ctx.restore();ctx.restore()}drawFireworks(t);requestAnimationFrame(draw)}requestAnimationFrame(draw);
function refresh(){ $('total').textContent=items.length; $('feed').replaceChildren();for(const a of items.slice(-6).reverse()){const div=document.createElement('div');div.className='entry';const b=document.createElement('strong');b.textContent=a.name;div.append(b,document.createTextNode(' · '+(a.wish||'ลอยกระทงแล้ว')));$('feed').append(div)}}
function state(){ $('connection').textContent=online?'เชื่อมต่อแล้ว':'กำลังเชื่อมต่อ';$('launch').disabled=!online||busy}const es=new EventSource('/events');es.onopen=()=>{online=true;state()};es.onerror=()=>{online=false;state()};es.addEventListener('snapshot',e=>{items=JSON.parse(e.data);refresh()});es.addEventListener('float',e=>{const a=JSON.parse(e.data);if(!items.some(i=>i.id===a.id)){items.push(a);arrivals.set(a.id,performance.now());launchFireworks()};items=items.slice(-80);refresh()});es.addEventListener('count',e=>{$('count').textContent=JSON.parse(e.data)});
document.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{style=b.dataset.style;document.querySelectorAll('[data-style]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)))});$('form').onsubmit=async e=>{e.preventDefault();if(busy||!online)return;busy=true;state();$('launch').textContent='กำลังลอยกระทง?';try{const r=await fetch('/float',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('name').value,wish:$('wish').value,style})});const a=await r.json();if(!r.ok)throw Error(a.error);$('message').textContent='กระทงของคุณลอยแล้ว ✨';$('wish').value='';$('wish-length').textContent='0/100';}catch(e){$('message').textContent=e.message||'ไม่สามารถลอยกระทงได้'}finally{busy=false;state();$('launch').textContent='ลอยกระทง'}};canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const p=[...positions].reverse().find(p=>Math.abs(x-p.x)<35*p.k&&Math.abs(y-p.y+10)<32*p.k);$('notice').textContent=p?p.item.name+' · '+(p.item.wish||'สุขสันต์วันลอยกระทง'):''});

if(new URLSearchParams(location.search).get("display")==="1"){document.body.classList.add("display-mode");$("form").inert=true;}

// Accessible wish reading and a live preview of the selected flower.
const flowers={lotus:'🪷',rose:'🌹',gold:'🌼'};
const originalRefresh=refresh;
refresh=function(){
  originalRefresh();
  $('empty-river').hidden=items.length>0;
  $('feed').replaceChildren();
  if(!items.length){const p=document.createElement('p');p.className='feed-empty';p.textContent='สายน้ำกำลังรอคำอธิษฐานแรกของคืนนี้';$('feed').append(p)}
  for(const item of items.slice(-6).reverse()){
    const button=document.createElement('button');button.type='button';button.className='entry';
    const name=document.createElement('strong');name.textContent=flowers[item.style]+' '+item.name;
    button.append(name,document.createTextNode(item.wish||'สุขสันต์วันลอยกระทง'));
    button.onclick=()=>{$('notice').textContent=item.name+' · '+(item.wish||'สุขสันต์วันลอยกระทง')};
    $('feed').append(button);
  }
};
document.querySelectorAll('[data-style]').forEach(button=>button.addEventListener('click',()=>{$('preview-flower').textContent=flowers[button.dataset.style]}));
$('wish').addEventListener('input',()=>{$('wish-length').textContent=$('wish').value.length+'/100'});

$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('notice').textContent='ใช้เมนูของเบราว์เซอร์เพื่อเปิดเต็มหน้าจอ'}};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'ออกจากเต็มหน้าจอ':'เต็มหน้าจอ'});
refresh();

// Bundled background music; starts only after a user gesture.
const backgroundTrack=new Audio('/music/background.mp3');
backgroundTrack.loop=true;backgroundTrack.volume=.45;backgroundTrack.preload='none';
function updateMusicButton(){
  $('music').textContent=backgroundTrack.paused?'♫ เปิดเพลง':'♫ ปิดเพลง';
  $('music').setAttribute('aria-pressed',String(!backgroundTrack.paused));
}
$('music').onclick=async()=>{
  const button=$('music');button.disabled=true;
  try{if(backgroundTrack.paused)await backgroundTrack.play();else backgroundTrack.pause()}
  catch{$('notice').textContent='ยังไม่สามารถเล่นเพลงพื้นหลังได้'}
  finally{updateMusicButton();button.disabled=false}
};
backgroundTrack.addEventListener('pause',updateMusicButton);
backgroundTrack.addEventListener('play',updateMusicButton);
backgroundTrack.addEventListener('error',()=>{backgroundTrack.pause();updateMusicButton()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)backgroundTrack.pause()});

// A bounded firework show follows each live submission, synchronized with audio.
const fireworks=[];
let effectsAudio,effectsEnabled=false;
const effectsButton=document.createElement('button');
effectsButton.type='button';effectsButton.className='effects';effectsButton.textContent='เปิดเสียงพลุ';effectsButton.setAttribute('aria-pressed','false');
$('music').after(effectsButton);
effectsButton.onclick=async()=>{
  try{
    if(!effectsEnabled){
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)throw Error('unsupported');
      effectsAudio??=new Audio();await effectsAudio.resume();
    }
    effectsEnabled=!effectsEnabled;
    effectsButton.textContent=effectsEnabled?'ปิดเสียงพลุ':'เปิดเสียงพลุ';
    effectsButton.setAttribute('aria-pressed',String(effectsEnabled));
    if(effectsEnabled)launchFireworks();
  }catch{$('notice').textContent='เปิดเสียงพลุไม่ได้ กรุณาลองอีกครั้ง'}
};
function fireworkSound(burst){
  if(!effectsEnabled||!effectsAudio||effectsAudio.state!=='running'||document.hidden)return;
  const audio=effectsAudio,now=audio.currentTime,duration=burst?1.4:.7;
  const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,burst?2:1);
  const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;
  filter.type=burst?'lowpass':'bandpass';filter.frequency.setValueAtTime(burst?1600:500,now);
  filter.frequency.exponentialRampToValueAtTime(burst?100:2200,now+duration);
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(burst?.22:.07,now+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start();
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};
}
function launchFireworks(){
  if(document.hidden||fireworks.length>=6)return;
  const start=performance.now(),count=Math.min(3,6-fireworks.length);
  for(let i=0;i<count;i++)fireworks.push({start:start+i*380,x:.15+Math.random()*.7,y:.1+Math.random()*.16,color:['#ffcc76','#ff90c1','#91d8ff'][i],launched:false,burst:false});
}
function drawFireworks(t){
  ctx.save();
  for(let i=fireworks.length-1;i>=0;i--){
    const firework=fireworks[i],age=(t-firework.start)/1000;
    if(age<0)continue;
    if(age>2.9){fireworks.splice(i,1);continue}
    if(!firework.launched){firework.launched=true;fireworkSound(false)}
    const x=firework.x*w,y=firework.y*h;
    if(age<.85){
      if(reducedMotion)continue;
      const p=age/.85,rocketY=h*.48+(y-h*.48)*(1-Math.pow(1-p,2));
      ctx.globalAlpha=1;ellipse(x,rocketY,2,3,'#fff1c8');
      for(let j=1;j<10;j++){ctx.globalAlpha=(1-j/10)*.6;ellipse(x,rocketY+j*4,1.5,2,firework.color)}
    }else{
      if(!firework.burst){firework.burst=true;fireworkSound(true)}
      const p=(age-.85)/2.05,radius=Math.min(w,h)*.16*(1-Math.pow(1-p,3));
      ctx.globalAlpha=Math.pow(1-p,1.5);
      if(reducedMotion){ellipse(x,y,5,5,firework.color);continue}
      for(let j=0;j<48;j++){
        const angle=j*Math.PI*2/48,r=radius*(j%2?.7:1),px=x+Math.cos(angle)*r,py=y+Math.sin(angle)*r+p*p*35;
        ctx.strokeStyle=firework.color;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(px-Math.cos(angle)*5*(1-p),py-Math.sin(angle)*5*(1-p));ctx.lineTo(px,py);ctx.stroke();ellipse(px,py,1.5,1.5,firework.color);
      }
    }
  }
  ctx.restore();
}
