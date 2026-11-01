// All bundled sounds are generated demonstrations, never field recordings.
export class SoundEngine extends EventTarget {
 constructor(){super();this.state='empty';this.offset=0;this.duration=0;this.volume=.65;this.metrics={rms:0,low:0,mid:0,high:0,centroid:0};this.request=0;this.version=0;this.muted=false;this.lastUI=0}
 async init(){
  const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)throw Error('当前浏览器不支持音频分析，请使用较新的浏览器。');
  if(!this.context){this.context=new Ctx();this.analyser=this.context.createAnalyser();this.analyser.fftSize=1024;this.analyser.smoothingTimeConstant=.78;this.gain=this.context.createGain();this.analyser.connect(this.gain);this.gain.connect(this.context.destination);this.gain.gain.value=this.volume;this.wave=new Uint8Array(this.analyser.fftSize);this.spectrum=new Uint8Array(this.analyser.frequencyBinCount);}
  await this.context.resume();
 }
 emit(){this.dispatchEvent(new Event('statechange'))}
 detach(){if(this.source){this.source.onended=null;try{this.source.stop()}catch{}this.source.disconnect();this.source=null}cancelAnimationFrame(this.request)}
 async demo(species){
  const version=++this.version;await this.init();if(version!==this.version)return;
  this.detach();this.buffer=this.makeDemo(species.demo||0);this.duration=this.buffer.duration;this.offset=0;this.name=species.name+' · 合成演示';this.speciesId=species.id;this.kind='demo';this.state='ready';this.emit();
 }
 makeDemo(kind){
  const sr=this.context.sampleRate,duration=10,buffer=this.context.createBuffer(1,sr*duration,sr),d=buffer.getChannelData(0);let phase=0,noise=0;
  for(let i=0;i<d.length;i++){
   const t=i/sr,fade=Math.min(1,t/0.2,(duration-t)/.4),pulse=(t*(kind===0?.85:kind===4?2.8:2.1))%1;
   const env=Math.pow(Math.sin(Math.PI*pulse),kind===0?2:kind===4?8:12);
   const base=[270,2200,740,980,165][kind],sweep=kind===1?Math.sin(pulse*9)*1100:kind===4?Math.sin(pulse*15)*45:Math.sin(pulse*5)*base*.3;
   phase+=2*Math.PI*(base+sweep)/sr;noise=noise*.96+(Math.random()*2-1)*.04;
   d[i]=fade*(Math.sin(phase)+Math.sin(phase*2.01)*.18)*env*.22+noise*.008*fade;
  }return buffer;
 }
 async upload(file){
  if(!file)throw Error('请先选择音频文件。');if(file.size>50*1024*1024)throw Error('请选择小于 50 MB 的音频文件。');
  const version=++this.version;await this.init();this.detach();this.state='loading';this.emit();
  try{const data=await file.arrayBuffer(),buffer=await this.context.decodeAudioData(data);if(version!==this.version)return;
   if(!buffer.duration)throw Error();this.buffer=buffer;this.duration=buffer.duration;this.offset=0;this.name=file.name;this.kind='upload';this.speciesId=null;this.state='ready';this.emit();
  }catch{if(version===this.version){this.state=this.buffer?'ready':'empty';this.emit()}throw Error('无法读取这段音频，请尝试 MP3 或 WAV 格式。')}
 }
 async play(){
  if(!this.buffer)throw Error('请先选择演示声音或上传音频。');await this.init();this.detach();if(this.offset>=this.duration)this.offset=0;
  const source=this.context.createBufferSource();source.buffer=this.buffer;source.connect(this.analyser);this.started=this.context.currentTime-this.offset;this.source=source;this.state='playing';
  source.onended=()=>{if(this.source!==source)return;this.source=null;source.disconnect();this.state='ended';this.offset=this.duration;cancelAnimationFrame(this.request);this.metrics={rms:0,low:0,mid:0,high:0,centroid:0};this.dispatchEvent(new Event('metrics'));this.emit();this.dispatchEvent(new Event('ended'))};
  source.start(0,this.offset);this.emit();this.tick();
 }
 pause(){if(this.state!=='playing')return;this.offset=this.position;this.detach();this.state='paused';this.resetMetrics();this.emit()}
 stop(){this.detach();this.offset=0;this.state=this.buffer?'ready':'empty';this.resetMetrics();this.emit()}
 resetMetrics(){this.metrics={rms:0,low:0,mid:0,high:0,centroid:0};this.dispatchEvent(new Event('metrics'))}
 seek(position){const playing=this.state==='playing';this.detach();this.offset=Math.max(0,Math.min(this.duration,Number(position)||0));this.state='paused';this.emit();if(playing)this.play().catch(e=>this.dispatchEvent(new CustomEvent('error',{detail:e.message})))}
 setVolume(value){this.volume=Math.max(0,Math.min(1,+value));if(this.gain)this.gain.gain.setTargetAtTime(this.muted?0:this.volume,this.context.currentTime,.04);this.emit()}
 setMuted(value){this.muted=value;if(this.gain)this.gain.gain.setTargetAtTime(value?0:this.volume,this.context.currentTime,.04);this.emit()}
 get position(){return this.state==='playing'?Math.min(this.duration,this.context.currentTime-this.started):this.offset}
 tick(){
  if(this.state!=='playing')return;this.analyser.getByteTimeDomainData(this.wave);this.analyser.getByteFrequencyData(this.spectrum);
  let sum=0;for(const n of this.wave){const v=(n-128)/128;sum+=v*v}let low=0,mid=0,high=0,nl=0,nm=0,nh=0,weight=0,total=0;
  const binHz=this.context.sampleRate/this.analyser.fftSize;
  for(let i=0;i<this.spectrum.length;i++){const hz=i*binHz,v=this.spectrum[i]/255;if(hz<400){low+=v;nl++}else if(hz<2500){mid+=v;nm++}else if(hz<10000){high+=v;nh++}weight+=hz*v;total+=v}
  this.metrics={rms:Math.sqrt(sum/this.wave.length),low:low/Math.max(1,nl),mid:mid/Math.max(1,nm),high:high/Math.max(1,nh),centroid:total?weight/total:0};
  this.dispatchEvent(new Event('metrics'));if(performance.now()-this.lastUI>120){this.lastUI=performance.now();this.dispatchEvent(new Event('progress'))}this.request=requestAnimationFrame(()=>this.tick());
 }
}
export const sound=new SoundEngine();
export function timeLabel(t=0){return Math.floor(t/60)+':'+Math.floor(t%60).toString().padStart(2,'0')}
document.addEventListener('visibilitychange',()=>{if(document.hidden)sound.pause()});
addEventListener('pagehide',()=>sound.stop());
