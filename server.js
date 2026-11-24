const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {openWishStore}=require('./wish-store');
const store=openWishStore(path.join(process.env.DATA_DIR||path.join(__dirname,'data'),'wishes.json'));
const clients=new Set(), floats=store.recent(), limits=new Map();
const send=(res,event,data)=>res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
function broadcast(event,data){for(const c of clients)send(c,event,data)}
function count(){broadcast('count',clients.size)}
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 if(req.method==='GET'&&url.pathname==='/health'){
  res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify({status:'ok'}));return;
 }
 if(req.method==='GET'&&url.pathname==='/music/background.mp3'){
  const file=path.join(__dirname,'public','music','background.mp3');
  if(!fs.existsSync(file)){res.writeHead(404).end('Music file not added');return}
  res.writeHead(200,{'Content-Type':'audio/mpeg','Content-Length':fs.statSync(file).size});
  const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);return;
 }
 if(req.method==='GET'&&url.pathname==='/events'){
  if(clients.size>=300){res.writeHead(503).end();return}
  res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write(': connected\n\n');clients.add(res);send(res,'snapshot',floats);count();res.on('close',()=>{clients.delete(res);count()});return;
 }
 if(req.method==='POST'&&url.pathname==='/float'){
  const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data))};
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return reply(415,{error:'Invalid content type'});
  const ip=req.socket.remoteAddress,now=Date.now();if(now-(limits.get(ip)||0)<2000)return reply(429,{error:'กรุณารอสักครู่'});
  try{let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096){return reply(413,{error:'ข้อมูลยาวเกินไป'})}}
  const v=JSON.parse(body);if(!v||typeof v.name!=='string'||typeof v.wish!=='string'||!['lotus','rose','gold'].includes(v.style)||[...v.name].length>24||[...v.wish].length>100)return reply(400,{error:'ข้อมูลไม่ถูกต้อง'});
  const item={id:crypto.randomUUID(),name:v.name.trim()||'ผู้ร่วมงาน',wish:v.wish.trim(),style:v.style,x:0.12+Math.random()*0.76,y:0.38+Math.random()*0.48,created:now};
  try{store.append(item)}catch(error){console.error('Unable to save wish:',error.message);return reply(503,{error:'บันทึกคำอวยพรไม่ได้ กรุณาลองอีกครั้ง'})}
  limits.set(ip,now);floats.push(item);if(floats.length>80)floats.shift();broadcast('float',item);return reply(201,item);
  }catch{return reply(400,{error:'ข้อมูลไม่ถูกต้อง'})}
 }
 if(req.method==='GET'&&['/','/app.js','/style.css'].includes(url.pathname)){const file=url.pathname==='/'?'index.html':url.pathname.slice(1);res.writeHead(200,{'Content-Type':({'index.html':'text/html','app.js':'text/javascript','style.css':'text/css'})[file]+'; charset=utf-8','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; media-src 'self' blob:; frame-ancestors 'none'"});return res.end(fs.readFileSync(path.join(__dirname,'public',file)))}
 res.writeHead(404).end('Not found');
});
setInterval(()=>{for(const c of clients)c.write(': heartbeat\n\n');for(const [ip,t] of limits)if(Date.now()-t>60000)limits.delete(ip)},15000).unref();
server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Loy Krathong: http://localhost:'+(process.env.PORT||3000)));
