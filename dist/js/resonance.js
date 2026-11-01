export const motion = {
  dprLimit: 1.5, spacing: 1.65, maxPoints: 80000,
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
varying float v_alpha;
void main() {
  vec2 anchor = a_particle.xy;
  float seed = a_particle.z;
  vec2 p = anchor + vec2(seed-.5,fract(seed*29.1)-.5)*u_drift*(1.0-u_reduced);
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
  gl_PointSize = (1.25+seed*.75)*u_dpr;
  v_alpha = a_particle.w*u_opacity;
}`;
const fragmentSource = `
precision mediump float;
uniform vec3 u_color;
varying float v_alpha;
void main() {
  float edge = 1.0-smoothstep(.35,.53,length(gl_PointCoord-.5));
  gl_FragColor = vec4(u_color,v_alpha*edge);
}`;

function colorRGB(color) {
  const c=document.createElement('canvas').getContext('2d');
  c.fillStyle=color;c.fillRect(0,0,1,1);
  return Array.from(c.getImageData(0,0,1,1).data).slice(0,3).map(n=>n/255);
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
  constructor(canvas,{color,complexity=4.5,opacity=1,interactive=true}={}) {
    this.canvas=canvas;this.color=color||getComputedStyle(document.documentElement).getPropertyValue('--particle').trim();
    this.complexity=complexity;this.opacity=opacity;this.phase=0;
    this.pointer={x:-1000,y:-1000,down:false,active:false};
    this.strength=0;this.radius=motion.radius;this.trails=new Float32Array(16);
    this.lastTrail=0;this.trailIndex=0;this.visible=false;this.raf=0;this.lastFrame=0;
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
    for(const n of ['resolution','dpr','drift','pointer','trails[0]','opacity','reduced','color'])this.uniforms[n]=gl.getUniformLocation(this.program,'u_'+n);
    this.attribute=gl.getAttribLocation(this.program,'a_particle');
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
      const nx=col*12/this.w*6.28,ny=row*12/this.h*6.28,warp=Math.sin(ny*1.4+nx*.6)*.65;
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
    this.particles=new Float32Array(particles);this.count=particles.length/4;
    if(this.gl){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,this.particles,gl.STATIC_DRAW);}
    this.draw();
  }
  setComplexity(n){this.complexity=n;cancelAnimationFrame(this.rebuildFrame);this.rebuildFrame=requestAnimationFrame(()=>this.rebuild())}
  move(e){
    const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    this.pointer.x=x;this.pointer.y=y;this.pointer.active=true;
    const now=performance.now()/1000;
    if(now-this.lastTrail>.045){const i=(this.trailIndex++%4)*4;this.trails.set([x,y,now,1],i);this.lastTrail=now;}
    // Reduced motion keeps the artwork static rather than dispersing particles.
  }
  leave(){this.pointer.active=false;this.pointer.down=false;}
  schedule(){
    cancelAnimationFrame(this.raf);this.raf=0;
    if(!this.visible||document.hidden||this.reduced.matches||this.lost){this.lastFrame=0;return;}
    this.raf=requestAnimationFrame(t=>{this.draw(t);this.schedule()});
  }
  draw(time=performance.now()){
    if(!this.w||this.lost)return;
    const dt=this.lastFrame?Math.min(.05,(time-this.lastFrame)/1000):1/60;this.lastFrame=time;
    const target=this.pointer.active&&!this.reduced.matches?(this.pointer.down?1.5:1):0;
    this.strength+=(target-this.strength)*(1-Math.exp(-dt*(target?13:3.2)));
    this.radius+=((this.pointer.down?235:motion.radius)-this.radius)*(1-Math.exp(-dt*10));
    const t=this.reduced.matches?0:time/1000;
    this.trailUniforms||=new Float32Array(16);
    for(let i=0;i<16;i+=4){this.trailUniforms[i]=this.trails[i];this.trailUniforms[i+1]=this.trails[i+1];this.trailUniforms[i+3]=this.reduced.matches?0:Math.exp(-Math.max(0,t-this.trails[i+2])*2.6)*this.trails[i+3];}
    if(this.gl){
      const gl=this.gl,u=this.uniforms;gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.enableVertexAttribArray(this.attribute);gl.vertexAttribPointer(this.attribute,4,gl.FLOAT,false,16,0);
      gl.uniform2f(u.resolution,this.w,this.h);gl.uniform1f(u.dpr,this.dpr);gl.uniform2f(u.drift,Math.sin(t*.28)*8,Math.cos(t*.23)*8);gl.uniform1f(u.opacity,this.opacity);gl.uniform1f(u.reduced,this.reduced.matches?1:0);
      gl.uniform4f(u.pointer,this.pointer.x,this.pointer.y,this.strength,this.radius);gl.uniform4fv(u['trails[0]'],this.trailUniforms);
      this.rgb||=colorRGB(this.color);gl.uniform3fv(u.color,this.rgb);gl.drawArrays(gl.POINTS,0,this.count);
    }else{
      // Lightweight fallback draws only preselected grains; never scans the full field per frame.
      const c=this.ctx,p=this.particles;c.clearRect(0,0,this.w,this.h);c.fillStyle=this.color;c.globalAlpha=.85*this.opacity;
      for(let i=0;i<p.length;i+=4){let x=p[i],y=p[i+1];const dx=x-this.pointer.x,dy=y-this.pointer.y,d2=dx*dx+dy*dy;
        if(this.strength>.001&&d2<this.radius*this.radius&&d2>.01){
          const d=Math.sqrt(d2),reach=1-d/this.radius,influence=reach*reach*this.strength,seed=p[i+2],push=influence*(145+seed*140);
          x+=dx/d*push+((seed*73.1)%1-.5)*influence*100;
          y+=dy/d*push+((seed*97.3)%1-.5)*influence*100;
        }
        const size=2.0+p[i+2]*.7;c.fillRect(x,y,size,size);
      }c.globalAlpha=1;
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
    c.font=`900 ${style.fontSize} Arial`;if('letterSpacing' in c)c.letterSpacing=style.letterSpacing;
    const metrics=c.measureText('WILD.');c.textBaseline='alphabetic';c.fillText('WILD.',margin,margin+(r.height+metrics.actualBoundingBoxAscent)/2-2);
    const data=c.getImageData(0,0,off.width,off.height).data;points=[];
    for(let y=0;y<h;y+=3)for(let x=0;x<w;x+=3)if(data[(y*off.width+x)*4+3]>100)points.push({x,y,tx:x,ty:y,vx:0,vy:0});
  }
  function draw(time){
    const dt=Math.min(2,(time-last)/16.67||1);last=time;ctx.clearRect(0,0,w,h);ctx.fillStyle=color;ctx.globalAlpha=.95;let moving=false;
    for(const p of points){const dx=p.x-pointer.x,dy=p.y-pointer.y,d2=dx*dx+dy*dy;
      if(d2<130*130&&d2>.01){const dist=Math.sqrt(d2),force=(1-dist/130)*5*dt;p.vx+=dx/dist*force;p.vy+=dy/dist*force;}
      p.vx+=(p.tx-p.x)*.009*dt;p.vy+=(p.ty-p.y)*.009*dt;p.vx*=Math.pow(.92,dt);p.vy*=Math.pow(.92,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(Math.abs(p.x-p.tx)+Math.abs(p.y-p.ty)>.6){ctx.fillRect(p.x,p.y,1.9,1.9);moving=true;}
    }
    raf=moving&&!document.hidden&&!reduced.matches?requestAnimationFrame(draw):0;
    if(!raf){ctx.clearRect(0,0,w,h);text?.style.removeProperty('mask-image');}
  }
  function start(){if(!raf&&!reduced.matches){last=performance.now();raf=requestAnimationFrame(draw)}}
  function leave(){pointer={x:-1000,y:-1000};text?.style.removeProperty('mask-image');start()}
  word.addEventListener('pointermove',e=>{if(reduced.matches)return;const r=word.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;pointer={x:x+margin,y:y+margin};if(text)text.style.maskImage=`radial-gradient(circle at ${x}px ${y}px,transparent 0px,transparent 48px,#000 120px)`;start()});
  word.addEventListener('pointerleave',leave);word.addEventListener('pointerdown',e=>{if(reduced.matches)return;const r=word.getBoundingClientRect();pointer={x:e.clientX-r.left+margin,y:e.clientY-r.top+margin};start();setTimeout(leave,600)});
  new ResizeObserver(setup).observe(word);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;leave()}else start()});
  reduced.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;ctx.clearRect(0,0,w,h);text?.style.removeProperty('mask-image')});setup();
}
