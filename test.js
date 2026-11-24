const {test}=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {openWishStore}=require('./wish-store');
test('wishes survive reopening; archive retains more than the river limit',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'tpn-store-')),file=path.join(directory,'wishes.json');
 try{
  const store=openWishStore(file);
  for(let i=0;i<82;i++)store.append({id:String(i),name:'ผู้ร่วมงาน',wish:'มีความสุข',style:'lotus',x:.5,y:.5,created:Date.now()});
  const reopened=openWishStore(file);
  assert.equal(reopened.recent().length,80);assert.equal(reopened.recent()[0].id,'2');
  assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).length,82);
  assert.equal(reopened.recent()[79].wish,'มีความสุข');
  fs.writeFileSync(file,'broken');assert.throws(()=>openWishStore(file),/Cannot load wishes/);
  assert.equal(fs.readFileSync(file,'utf8'),'broken');
 }finally{fs.rmSync(directory,{recursive:true,force:true})}
});
test('a failed save does not add a wish to memory',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'tpn-failure-')),file=path.join(directory,'wishes.json'),store=openWishStore(file);
 try{fs.mkdirSync(file+'.tmp');assert.throws(()=>store.append({id:'1'}));assert.deepEqual(store.recent(),[])}
 finally{fs.rmSync(directory,{recursive:true,force:true})}
});

test('HTTP validation and real-time broadcast to two clients',async()=>{const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'tpn-http-'));const p=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'39182',DATA_DIR:dataDir}});const base='http://127.0.0.1:39182';const ac=new AbortController();try{await new Promise((resolve,reject)=>{p.stdout.once('data',resolve);p.once('error',reject);p.once('exit',()=>reject(Error('server exited')))});const page=await fetch(base+'/?display=1');assert.equal(page.status,200);assert.match(await page.text(),/TPN FlexPak Loy Krathong Festival/);assert.equal((await fetch(base+'/app.js')).status,200);const streams=await Promise.all([1,2].map(()=>fetch(base+'/events',{signal:ac.signal})));const readers=streams.map(s=>s.body.getReader());const post=body=>fetch(base+'/float',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal((await post({name:'a',wish:'b',style:'bad'})).status,400);const r=await post({name:'Test',wish:'Happy',style:'lotus'});assert.equal(r.status,201);const item=await r.json();await Promise.all(readers.map(async reader=>{let str='';while(!str.includes(item.id)){const {value,done}=await reader.read();assert.ok(!done);str+=Buffer.from(value).toString()}assert.ok(str.includes('event: float'))}));assert.equal((await post({name:'a',wish:'b',style:'lotus'})).status,429);assert.equal((await fetch(base+'/missing')).status,404)}finally{ac.abort();p.kill();await new Promise(resolve=>p.once('exit',resolve));fs.rmSync(dataDir,{recursive:true,force:true})}});
