import {FlowWarp,flowPoint} from './flow.js?v=6';
export const motion = {
  dprLimit: 1.5, spacing: 1.65, maxPoints: 42000,
  radius: 185, scatter: 210, returnForce: .025, friction: .89,
};

const vertexSource = `
attribute vec4 a_particle;
uniform vec2 u_resolution;
uniform float u_dpr;
uniform vec2 u_drift;
uniform vec4 u_pointer;
uniform vec4 u_trails[4];
uniform float u_opacity;
uniform float u_reduced;
uniform vec4 u_audio;
uniform vec2 u_flow;
uniform float u_detail;
varying float v_seed;
varying float v_alpha;
void main() {
  vec2 anchor = a_particle.xy;
  float seed = a_particle.z;
  vec2 flowing=anchor;
  flowing.x+=(sin(anchor.y/u_resolution.y*5.4+u_flow.x*.68)*.65+sin(anchor.y/u_resolution.y*10.1-u_flow.x*.39)*.35)*u_flow.y;
  flowing.y+=(cos(flowing.x/u_resolution.x*4.8-u_flow.x*.61)*.65+sin(flowing.x/u_resolution.x*9.2+u_flow.x*.35)*.35)*u_flow.y;
  vec2 centered=flowing-u_resolution*.5;
  vec2 p=centered*(1.0+u_audio.x*.10)+u_resolution*.5;
  p+=vec2(seed-.5,fract(seed*29.1)-.5)*u_drift*(1.0+u_audio.x*8.0+u_audio.y*3.0)*(1.0-u_reduced);
  p+=centered*(seed-.5)*u_audio.z*.07;
  v_seed=seed;
  if(u_pointer.z>0.001){
    vec2 delta=p-u_pointer.xy;
    float d2=dot(delta,delta);
    if(d2<u_pointer.w*u_pointer.w){
      float dist=sqrt(max(d2,.01));
      float reach=max(0.0,1.0-dist/u_pointer.w);
      float influence=reach*reach*u_pointer.z;
      vec2 direction=delta/dist;
      p+=direction*influence*(145.0+seed*140.0);
      p+=vec2(fract(seed*73.1)-.5,fract(seed*97.3)-.5)*influence*100.0;
    }
  }
  for(int i=0;i<4;i++) {
    if(u_trails[i].w>0.001){
      vec2 td=anchor-u_trails[i].xy;
      float d2=dot(td,td);
      if(d2<40000.0&&d2>.01){
        float distance=sqrt(d2),reach=1.0-distance/200.0;
        p+=td/distance*reach*reach*u_trails[i].w*85.0;
      }
    }
  }
  gl_Position = vec4(p/u_resolution*vec2(2.0,-2.0)+vec2(-1.0,1.0),0.0,1.0);
  gl_PointSize = (3.5+seed*2.2)*u_dpr*u_detail*(1.0+u_audio.w*.6);
  v_alpha = a_particle.w*u_opacity;
}`;
const fragmentSource = `
precision mediump float;
uniform vec3 u_color;
uniform float u_density;
uniform sampler2D u_grain;
varying float v_seed;
varying float v_alpha;
void main() {
  if(v_seed>u_density) discard;
  vec2 uv=vec2((floor(v_seed*7.999)+gl_PointCoord.x)/8.0,gl_PointCoord.y);
  float grain=texture2D(u_grain,uv).a;
  gl_FragColor=vec4(u_color,v_alpha*grain);
}`;

function colorRGB(color) {
  const c=document.createElement('canvas').getContext('2d');
  c.fillStyle=color;c.fillRect(0,0,1,1);
  return Array.from(c.getImageData(0,0,1,1).data).slice(0,3).map(n=>n/255);
}

// Seeded noise is painted once. The same micrograin atlas serves WebGL and Canvas.
function grainAtlas(color){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=16;
  const ctx=canvas.getContext('2d'),image=ctx.createImageData(128,16),rgb=colorRGB(color);
  let seed=83173;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646};
  for(let tile=0;tile<8;tile++)for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const dx=(x-7.5)/8,dy=(y-7.5)/8,d=Math.sqrt(dx*dx+dy*dy),n=random();
    const index=(y*128+tile*16+x)*4;
    image.data[index]=rgb[0]*255;image.data[index+1]=rgb[1]*255;image.data[index+2]=rgb[2]*255;
    image.data[index+3]=d<1.05&&n>.38?Math.round((.35+random()*.65)*Math.min(1,(1.05-d)*3.3)*255):0;
  }
  ctx.putImageData(image,0,0);return canvas;
}

let hardwareGPU;
function hasHardwareGPU(){
  if(hardwareGPU!==undefined)return hardwareGPU;
  const probe=document.createElement('canvas'),gl=probe.getContext('webgl');
  if(!gl)return hardwareGPU=false;
  const info=gl.getExtension('WEBGL_debug_renderer_info');
  const renderer=info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):'';
  hardwareGPU=!/swiftshader|llvmpipe|software|softpipe/i.test(renderer);
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return hardwareGPU;
}

export class ResonanceField {
  constructor(canvas,{color,complexity=4.5,opacity=1,interactive=true,flow=false}={}) {
    this.canvas=canvas;this.color=color||getComputedStyle(document.documentElement).getPropertyValue('--particle').trim();
    this.complexity=complexity;this.opacity=opacity;this.phase=0;this.distortion=.65;this.density=1;this.detail=1;this.response=1;this.audio={rms:0,low:0,mid:0,high:0};this.audioLevel=0;
    this.flowEnabled=flow;this.flowPaused=false;this.flowSpeed=.8;this.flowTime=0;this.textureVersion=0;this.warp=flow?new FlowWarp():null;
    this.pointer={x:-1000,y:-1000,down:false,active:false};
    this.strength=0;this.radius=motion.radius;this.trails=new Float32Array(16);
    this.textureDirty=true;this.lastTrail=0;this.trailIndex=0;this.visible=false;this.raf=0;this.lastFrame=0;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
    this.gl=hasHardwareGPU()&&canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
    if(this.gl)this.initGPU();else this.ctx=canvas.getContext('2d');
    this.setup();
    this.observer=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.schedule()});this.observer.observe(canvas);
    this.ro=new ResizeObserver(()=>this.setup());this.ro.observe(canvas);
    document.addEventListener('visibilitychange',()=>this.schedule());
    this.reduced.addEventListener('change',()=>{this.strength=0;this.draw();this.schedule()});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(this.raf);this.lost=true});
    canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.initGPU();this.setup();this.schedule()});
    if(interactive){
      canvas.addEventListener('pointermove',e=>this.move(e));
      canvas.addEventListener('pointerdown',e=>{this.pointer.down=true;this.move(e)});
      canvas.addEventListener('pointerup',e=>{this.pointer.down=false;if(e.pointerType!=='mouse')this.leave()});
      for(const type of ['pointercancel','pointerleave'])canvas.addEventListener(type,()=>this.leave());
    }
  }
  initGPU(){
    const gl=this.gl;
    const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
    this.program=gl.createProgram();const vs=compile(gl.VERTEX_SHADER,vertexSource),fs=compile(gl.FRAGMENT_SHADER,fragmentSource);
    gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
    gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(this.program);
    this.buffer=gl.createBuffer();this.uniforms={};
    for(const n of ['resolution','dpr','drift','pointer','trails[0]','opacity','reduced','color','audio','detail','density','grain','flow'])this.uniforms[n]=gl.getUniformLocation(this.program,'u_'+n);
    this.attribute=gl.getAttribLocation(this.program,'a_particle');
    this.grainTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.grainTexture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,grainAtlas('#ffffff'));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);
  }
  setup(){
    const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;
    this.w=r.width;this.h=r.height;this.dpr=Math.min(devicePixelRatio||1,motion.dprLimit);
    this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);
    if(this.ctx)this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    this.rebuild();
  }
  rebuild(){
    if(!this.w||this.lost)return;
    const particles=[],a=this.complexity,cols=Math.ceil(this.w/12)+2,rows=Math.ceil(this.h/12)+2,grid=new Float32Array(cols*rows);
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const nx=col*12/this.w*6.28,ny=row*12/this.h*6.28,warp=Math.sin(ny*1.4+nx*.6)*this.distortion;
      grid[row*cols+col]=Math.sin((nx+warp)*a*.47+this.phase)*Math.cos(ny*a*.37+Math.sin(nx*.9)*.65)+Math.cos(nx*a*.39-ny*.8)*Math.sin(ny*a*.43+warp+this.phase);
    }
    let seed=17;const rnd=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646};
    const cap=this.gl?motion.maxPoints:11000;
    const step=Math.max(this.gl?motion.spacing:2.4,Math.sqrt(this.w*this.h*.23/cap));
    for(let y=0;y<this.h;y+=step)for(let x=0;x<this.w;x+=step){
      const px=x+rnd()*step,py=y+rnd()*step,n=rnd(),gx=px/12,gy=py/12,i=Math.floor(gy)*cols+Math.floor(gx),fx=gx%1,fy=gy%1;
      const value=Math.abs((grid[i]*(1-fx)+grid[i+1]*fx)*(1-fy)+(grid[i+cols]*(1-fx)+grid[i+cols+1]*fx)*fy),threshold=.19+n*.12;
      if(value<=threshold)particles.push(px,py,n,.65+(1-value/threshold)*.35);
    }
    this.particles=new Float32Array(particles);this.count=particles.length/4;this.textureDirty=true;
    if(this.gl){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,this.particles,gl.STATIC_DRAW);}
    this.draw();
  }
  setComplexity(n){this.complexity=n;cancelAnimationFrame(this.rebuildFrame);this.rebuildFrame=requestAnimationFrame(()=>this.rebuild())}
  setAudio(metrics){this.audio=metrics;if(!this.raf&&this.visible)this.schedule();}
  setSettings(settings){
    let rebuild=false;
    for(const key of ['complexity','distortion','density','detail','response','flowSpeed'])if(Number.isFinite(settings[key])){
      if((key==='complexity'||key==='distortion')&&this[key]!==settings[key])rebuild=true;
      if(this[key]!==settings[key]&&['density','detail'].includes(key))this.textureDirty=true;this[key]=settings[key];
    }
    if(Number.isFinite(settings.flowTime))this.flowTime=Math.max(0,settings.flowTime);
    if(rebuild){cancelAnimationFrame(this.rebuildFrame);this.rebuildFrame=requestAnimationFrame(()=>this.rebuild())}else this.draw();
  }
  setColor(color){this.color=color;this.rgb=null;this.atlas=null;this.textureDirty=true;this.draw();}
  setFlowPaused(value){this.flowPaused=!!value;this.lastFrame=0;this.draw();this.schedule();}
  flowAmount(){return this.flowEnabled&&!this.reduced.matches?Math.min(this.w,this.h)*.072*(.8+this.distortion*.4):0;}
  mapPoint(x,y){return this.flowEnabled?flowPoint(x,y,this.w,this.h,this.flowTime,this.flowAmount()):[x,y];}
  settings(){return {flowSpeed:this.flowSpeed,flowTime:this.flowTime,complexity:this.complexity,distortion:this.distortion,density:this.density,detail:this.detail,response:this.response,color:this.color,phase:this.phase};}
  pulse(e){this.move(e);this.pointer.down=true;clearTimeout(this.pulseTimer);this.pulseTimer=setTimeout(()=>this.leave(),350);}
  move(e){
    const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    this.pointer.x=x;this.pointer.y=y;this.pointer.active=true;
    const now=performance.now()/1000;
    if(now-this.lastTrail>.045){const i=(this.trailIndex++%4)*4;this.trails.set([x,y,now,1],i);this.lastTrail=now;}
    if(!this.raf&&this.visible)this.schedule();
    // Reduced motion keeps the artwork static rather than dispersing particles.
  }
  leave(){this.pointer.active=false;this.pointer.down=false;}
  schedule(){
    cancelAnimationFrame(this.raf);this.raf=0;
    if(!this.visible||document.hidden||this.reduced.matches||this.lost){this.lastFrame=0;return;}
    if(!this.gl&&!(this.flowEnabled&&!this.flowPaused)&&!this.textureDirty&&!this.pointer.active&&this.strength<.001&&this.audio.rms<.001&&this.audioLevel<.001){this.lastFrame=0;return;}
    this.raf=requestAnimationFrame(t=>{this.draw(t);this.schedule()});
  }
  buildTexture(){
    if(this.gl)return;
    this.atlas||=grainAtlas(this.color);
    this.texture||=document.createElement('canvas');this.texture.width=this.canvas.width;this.texture.height=this.canvas.height;
    const c=this.texture.getContext('2d');c.setTransform(this.dpr,0,0,this.dpr,0,0);c.imageSmoothingEnabled=true;
    const p=this.particles,step=Math.max(2.4,Math.sqrt(this.w*this.h*.23/11000));
    this.clusterSize=Math.max(4.4,step*1.8)*this.detail;
    for(let i=0;i<p.length;i+=4){if(p[i+2]>this.density)continue;const size=this.clusterSize*(.85+p[i+2]*.3);
      c.drawImage(this.atlas,Math.floor(p[i+2]*7.999)*16,0,16,16,p[i]-size/2,p[i+1]-size/2,size,size);
    }
    this.textureDirty=false;this.textureVersion++;
  }
  draw(time=performance.now()){
    if(!this.w||this.lost)return;
    const dt=this.lastFrame?Math.min(.05,(time-this.lastFrame)/1000):1/60;this.lastFrame=time;
    const target=this.pointer.active&&!this.reduced.matches?(this.pointer.down?1.5:1):0;
    this.strength+=(target-this.strength)*(1-Math.exp(-dt*(target?13:3.2)));
    this.radius+=((this.pointer.down?235:motion.radius)-this.radius)*(1-Math.exp(-dt*10));
    const t=this.reduced.matches?0:time/1000;
    if(this.flowEnabled&&!this.flowPaused&&!this.reduced.matches)this.flowTime+=dt*this.flowSpeed*(1+Math.min(.8,this.audio.low)*.4);
    const flowClock=this.flowEnabled?this.flowTime:t;
    this.audioLevel+=(Math.min(1,this.audio.rms*5)*this.response-this.audioLevel)*(1-Math.exp(-dt*14));
    const level=this.audioLevel,low=this.audio.low*this.response,mid=this.audio.mid*this.response,high=this.audio.high*this.response;
    this.trailUniforms||=new Float32Array(16);
    for(let i=0;i<16;i+=4){this.trailUniforms[i]=this.trails[i];this.trailUniforms[i+1]=this.trails[i+1];this.trailUniforms[i+3]=this.reduced.matches?0:Math.exp(-Math.max(0,t-this.trails[i+2])*2.6)*this.trails[i+3];}
    if(this.gl){
      const gl=this.gl,u=this.uniforms;gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.enableVertexAttribArray(this.attribute);gl.vertexAttribPointer(this.attribute,4,gl.FLOAT,false,16,0);
      gl.uniform2f(u.resolution,this.w,this.h);gl.uniform1f(u.dpr,this.dpr);gl.uniform2f(u.drift,Math.sin(flowClock*.28)*8,Math.cos(flowClock*.23)*8);gl.uniform1f(u.opacity,this.opacity);gl.uniform1f(u.reduced,this.reduced.matches?1:0);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.grainTexture);gl.uniform1i(u.grain,0);
      gl.uniform2f(u.flow,this.flowTime,this.flowAmount());gl.uniform4f(u.audio,level,low,mid,high);gl.uniform1f(u.detail,this.detail);gl.uniform1f(u.density,this.density);
      gl.uniform4f(u.pointer,this.pointer.x,this.pointer.y,this.strength,this.radius);gl.uniform4fv(u['trails[0]'],this.trailUniforms);
      this.rgb||=colorRGB(this.color);gl.uniform3fv(u.color,this.rgb);gl.drawArrays(gl.POINTS,0,this.count);
    }else{
      // Dense micrograin is cached, so an idle field needs a single blit, not thousands of fills.
      if(this.textureDirty||!this.texture)this.buildTexture();
      const c=this.ctx,p=this.particles,scale=1+level*.10,dx=Math.sin(t*.7)*level*5,dy=Math.cos(t*.8)*level*5;
      c.clearRect(0,0,this.w,this.h);c.globalAlpha=this.opacity;c.save();
      c.translate(this.w/2+dx,this.h/2+dy);c.scale(scale,scale);
      if(this.flowEnabled&&!this.reduced.matches){this.warp.rate=8/Math.max(1,this.flowSpeed);this.warp.draw(c,this.texture,this.w,this.h,this.flowTime,this.flowAmount(),this.textureVersion)}else c.drawImage(this.texture,-this.w/2,-this.h/2,this.w,this.h);c.restore();
      if(this.strength>.001&&!this.reduced.matches){
        const radius=this.radius*1.12,px=this.pointer.x,py=this.pointer.y,flowMargin=this.flowAmount()*2+50;
        const localChance=Math.min(1,750/Math.max(1,this.count*Math.min(1,Math.PI*radius*radius/(this.w*this.h))));
        const mask=c.createRadialGradient(px,py,0,px,py,radius);mask.addColorStop(0,'rgba(0,0,0,1)');mask.addColorStop(.48,'rgba(0,0,0,.98)');mask.addColorStop(1,'rgba(0,0,0,0)');
        c.globalCompositeOperation='destination-out';c.globalAlpha=Math.min(1,this.strength);c.fillStyle=mask;c.fillRect(px-radius,py-radius,radius*2,radius*2);c.globalCompositeOperation='source-over';c.globalAlpha=this.opacity*Math.min(1,this.strength);
        for(let i=0;i<p.length;i+=4){if(p[i+2]>this.density)continue;
          if(Math.abs(p[i]-px)>radius+flowMargin||Math.abs(p[i+1]-py)>radius+flowMargin)continue;
          const mapped=this.mapPoint(p[i],p[i+1]);let x=(mapped[0]-this.w/2)*scale+this.w/2+dx,y=(mapped[1]-this.h/2)*scale+this.h/2+dy;
          const vx=x-px,vy=y-py,d2=vx*vx+vy*vy;if(d2>=radius*radius||d2<.01||((p[i+2]*41.129)%1)>localChance)continue;
          const d=Math.sqrt(d2),reach=1-d/radius,influence=reach*reach*this.strength,seed=p[i+2],push=influence*(145+seed*140);
          x+=vx/d*push+((seed*73.1)%1-.5)*influence*100;y+=vy/d*push+((seed*97.3)%1-.5)*influence*100;
          const size=this.clusterSize*(.85+seed*.3);c.drawImage(this.atlas,Math.floor(seed*7.999)*16,0,16,16,x-size/2,y-size/2,size,size);
        }
      }
      c.globalAlpha=1;

    }
  }
}

export function titleParticles(canvas,word){
  const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),color=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  let points=[],w=0,h=0,raf=0,pointer={x:-1000,y:-1000},last=0;
  const text=word.querySelector('.wild-text'),margin=100;
  function setup(){
    const r=word.getBoundingClientRect(),style=getComputedStyle(word);w=r.width+margin*2;h=r.height+margin*2;
    const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);
    const off=document.createElement('canvas');off.width=Math.ceil(w);off.height=Math.ceil(h);const c=off.getContext('2d',{willReadFrequently:true});
    c.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;if('letterSpacing' in c)c.letterSpacing=style.letterSpacing;
    const metrics=c.measureText('WILD.');c.textBaseline='alphabetic';c.fillText('WILD.',margin,margin+(r.height+metrics.actualBoundingBoxAscent)/2-2);
    const data=c.getImageData(0,0,off.width,off.height).data;points=[];
    for(let y=0;y<h;y+=3)for(let x=0;x<w;x+=3)if(data[(y*off.width+x)*4+3]>100)points.push({x,y,tx:x,ty:y,vx:0,vy:0});
  }
  function draw(time){
    const dt=Math.min(2,(time-last)/16.67||1);last=time;ctx.clearRect(0,0,w,h);ctx.fillStyle=color;ctx.globalAlpha=.95;let moving=false;
    for(const p of points){const dx=p.x-pointer.x,dy=p.y-pointer.y,d2=dx*dx+dy*dy;
      if(d2<130*130&&d2>.01){const dist=Math.sqrt(d2),force=(1-dist/130)*5*dt;p.vx+=dx/dist*force;p.vy+=dy/dist*force;}
      p.vx+=(p.tx-p.x)*.009*dt;p.vy+=(p.ty-p.y)*.009*dt;p.vx*=Math.pow(.92,dt);p.vy*=Math.pow(.92,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(Math.abs(p.x-p.tx)+Math.abs(p.y-p.ty)>.6){ctx.fillRect(p.x,p.y,.9,.9);moving=true;}
    }
    raf=moving&&!document.hidden&&!reduced.matches?requestAnimationFrame(draw):0;
    if(!raf){ctx.clearRect(0,0,w,h);text?.style.removeProperty('mask-image');}
  }
  function start(){if(!raf&&!reduced.matches){last=performance.now();raf=requestAnimationFrame(draw)}}
  function leave(){pointer={x:-1000,y:-1000};text?.style.removeProperty('mask-image');start()}
  word.addEventListener('pointermove',e=>{if(reduced.matches)return;const r=word.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;pointer={x:x+margin,y:y+margin};if(text)text.style.maskImage=`radial-gradient(circle at ${x}px ${y}px,transparent 0px,transparent 48px,#000 120px)`;start()});
  word.addEventListener('pointerleave',leave);word.addEventListener('pointerdown',e=>{if(reduced.matches)return;const r=word.getBoundingClientRect();pointer={x:e.clientX-r.left+margin,y:e.clientY-r.top+margin};start();setTimeout(leave,600)});
  new ResizeObserver(setup).observe(word);document.fonts.ready.then(setup);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;leave()}else start()});
  reduced.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;ctx.clearRect(0,0,w,h);text?.style.removeProperty('mask-image')});setup();
}
