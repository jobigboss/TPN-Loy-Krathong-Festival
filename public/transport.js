/* Shared transport: Node.js locally, Supabase REST on GitHub Pages. */
window.createFestivalTransport=function({snapshot,connection,count}){
  const config=window.FESTIVAL_CONFIG||{};
  const cloud=Boolean(config.supabaseUrl&&config.supabaseKey);
  if(!cloud&&location.hostname.endsWith('github.io')){
    connection(false,'ยังไม่ได้เชื่อมฐานข้อมูล');
    return {submit:async()=>{throw Error('ยังไม่ได้ตั้งค่า Supabase')}};
  }
  if(!cloud){
    const events=new EventSource('/events');let current=[];
    events.onopen=()=>connection(true);events.onerror=()=>connection(false);
    events.addEventListener('snapshot',e=>{current=JSON.parse(e.data);snapshot(current,false)});
    events.addEventListener('float',e=>{const item=JSON.parse(e.data);if(!current.some(v=>v.id===item.id))current.push(item);current=current.slice(-80);snapshot(current,true)});
    events.addEventListener('count',e=>count(JSON.parse(e.data)));
    return {submit:async value=>{const r=await fetch('/float',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});const data=await r.json();if(!r.ok)throw Error(data.error);return data}};
  }
  // Polling avoids external scripts and uses no Realtime connection quota.
  const base=config.supabaseUrl.replace(/\/$/,'')+'/rest/v1';
  const headers={apikey:config.supabaseKey,'Content-Type':'application/json'};
  if(config.supabaseKey.startsWith('eyJ'))headers.Authorization='Bearer '+config.supabaseKey;
  let initialized=false,timer,device,polling=false;
  try{device=localStorage.getItem('festival-device');if(!device){device=crypto.randomUUID();localStorage.setItem('festival-device',device)}}catch{device=crypto.randomUUID()}
  async function request(route,options={}){
    const r=await fetch(base+route,{...options,headers,signal:AbortSignal.timeout(10000)});
    const value=await r.json();if(!r.ok)throw Error(value.message||'เชื่อมต่อฐานข้อมูลไม่ได้');return value;
  }
  async function poll(){
    if(polling)return;
    polling=true;
    clearTimeout(timer);
    try{const rows=await request('/festival_wishes?select=id,name,wish,style,x,y,created&order=created.desc,id.desc&limit=80');snapshot(rows.reverse(),initialized);initialized=true;connection(true,'เชื่อมต่อแล้ว · อัปเดตทุก 5 วินาที')}
    catch{connection(false,'เชื่อมต่อฐานข้อมูลไม่ได้ กำลังลองใหม่')}
    finally{polling=false;timer=setTimeout(poll,document.hidden?30000:5000)}
  }
  count(null);void poll();
  return {submit:async value=>{const rows=await request('/rpc/float_festival_wish',{method:'POST',body:JSON.stringify({p_name:value.name,p_wish:value.wish,p_style:value.style,p_device:device})});void poll();return rows[0]}};
};
