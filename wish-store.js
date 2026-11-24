const fs=require('node:fs'),path=require('node:path');

function openWishStore(file){
  let wishes=[];
  try{
    wishes=JSON.parse(fs.readFileSync(file,'utf8'));
    if(!Array.isArray(wishes)||!wishes.every(v=>v&&typeof v.id==='string'&&typeof v.name==='string'&&typeof v.wish==='string'&&['lotus','rose','gold'].includes(v.style)&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.created)))throw Error('Invalid wish data');
  }catch(error){if(error.code!=='ENOENT')throw new Error(`Cannot load wishes from ${file}: ${error.message}`)}
  return {
    recent:()=>wishes.slice(-80),
    append(item){
      const next=[...wishes,item];
      fs.mkdirSync(path.dirname(file),{recursive:true});
      const temporary=file+'.tmp';
      try{
        fs.writeFileSync(temporary,JSON.stringify(next,null,2),'utf8');
        fs.renameSync(temporary,file);
      }catch(error){try{fs.unlinkSync(temporary)}catch{}throw error}
      wishes=next;
    }
  };
}
module.exports={openWishStore};
