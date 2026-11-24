const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('public/transport.js','utf8');
const {detectFireworkPeaks}=require('./public/audio-peaks');
test('firework timing detects attacks and merges closely spaced crackles',()=>{
 const samples=new Float32Array(2000);
 samples[200]=1;samples[250]=.4;samples[1000]=.8;samples[1800]=.7;
 const peaks=detectFireworkPeaks([samples],1000);
 assert.equal(peaks.length,3);
 assert.ok(Math.abs(peaks[0].time-.2)<.011);
 assert.ok(Math.abs(peaks[1].time-1)<.011);
 assert.ok(Math.abs(peaks[2].time-1.8)<.011);
 assert.deepEqual(detectFireworkPeaks([new Float32Array(1000)],1000),[]);
});
test('cloud transport reads shared wishes and submits through restricted RPC',async()=>{
 const requests=[],snapshots=[],connections=[];
 const context={window:{FESTIVAL_CONFIG:{supabaseUrl:'https://example.supabase.co',supabaseKey:'sb_publishable_example'}},location:{hostname:'example.github.io'},document:{hidden:false},localStorage:{getItem:()=> 'device'},crypto:{randomUUID:()=> 'device'},AbortSignal,clearTimeout(){},setTimeout(){},fetch:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>url.includes('/rpc/')?[{id:'new'}]:[{id:'old'}]}}};
 vm.runInNewContext(source,context);
 const transport=context.window.createFestivalTransport({snapshot:rows=>snapshots.push(rows),connection:value=>connections.push(value),count(){}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(snapshots[0][0].id,'old');assert.equal(connections[0],true);
 await transport.submit({name:'Test',wish:'Happy',style:'lotus'});
 const post=requests.find(r=>r.url.endsWith('/rpc/float_festival_wish'));
 assert.equal(post.options.method,'POST');assert.equal(JSON.parse(post.options.body).p_wish,'Happy');
 assert.equal(post.options.headers.apikey,'sb_publishable_example');assert.equal(post.options.headers.Authorization,undefined);
});
test('unconfigured GitHub Pages cannot silently submit to a nonexistent backend',async()=>{
 let connected;
 const context={window:{FESTIVAL_CONFIG:{}},location:{hostname:'example.github.io'}};
 vm.runInNewContext(source,context);
 const transport=context.window.createFestivalTransport({connection:value=>connected=value});
 assert.equal(connected,false);await assert.rejects(transport.submit(),/Supabase/);
});
