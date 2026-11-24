// Detect distinct loud attacks in 10 ms windows, merging nearby crackles.
function detectFireworkPeaks(channels,sampleRate){
  const step=Math.max(1,Math.round(sampleRate*.01)),energy=[];
  for(let offset=0;offset<channels[0].length;offset+=step){
    let sum=0,count=0;
    for(const channel of channels)for(let j=offset;j<Math.min(offset+step,channel.length);j++){sum+=channel[j]*channel[j];count++}
    energy.push(Math.sqrt(sum/Math.max(1,count)));
  }
  const maximum=energy.reduce((max,value)=>Math.max(max,value),0);
  if(maximum<.0001)return [];
  const candidates=[];
  for(let i=0;i<energy.length;i++){
    const value=energy[i];
    if(value<maximum*.16)continue;
    let baseline=0;
    for(let j=Math.max(0,i-20);j<i;j++)baseline+=energy[j];
    baseline/=Math.max(1,Math.min(i,20));
    if(value<baseline*1.5)continue;
    if(value<(energy[i-1]||0)||value<(energy[i+1]||0))continue;
    candidates.push({time:i*step/sampleRate,strength:value/maximum});
  }
  const peaks=[];
  for(const candidate of candidates.sort((a,b)=>b.strength-a.strength)){
    if(peaks.every(peak=>Math.abs(peak.time-candidate.time)>.22))peaks.push(candidate);
    if(peaks.length>=160)break;
  }
  return peaks.sort((a,b)=>a.time-b.time);
}
if(typeof module!=='undefined')module.exports={detectFireworkPeaks};
