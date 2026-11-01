export const motion={dprLimit:1.6,spacing:1.65,returnForce:.025,friction:.89,radius:110};
export class ResonanceField{
 constructor(canvas,{color,complexity=4.5,opacity=1,interactive=true}={}){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.color=color||getComputedStyle(document.documentElement).getPropertyValue('--particle').trim();this.complexity=complexity;this.opacity=opacity;this.pointer={x:-1000,y:-1000,down:false};this.reduced=matchMedia('(prefers-reduced-motion: reduce)');this.phase=0;this.visible=false;this.raf=0;this.frame=0;this.resize=()=>this.setup();this.setup();this.observer=new IntersectionObserver(e=>{this.visible=e[0].isIntersecting;this.schedule()});this.observer.observe(canvas);this.ro=new ResizeObserver(this.resize);this.ro.observe(canvas);this.visibility=()=>this.schedule();document.addEventListener('visibilitychange',this.visibility);this.reduced.addEventListener('change',()=>{this.draw();this.schedule()});if(interactive){canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();this.pointer.x=e.clientX-r.left;this.pointer.y=e.clientY-r.top;if(this.reduced.matches)this.draw()});canvas.addEventListener('pointerdown',e=>{this.pointer.down=true;this.phase+=.35;if(e.pointerType!=='mouse')this.pointer.x=e.offsetX,this.pointer.y=e.offsetY;this.draw()});for(const type of ['pointerup','pointercancel','pointerleave'])canvas.addEventListener(type,()=>{this.pointer.down=false;this.pointer.x=-1000;this.pointer.y=-1000})}}
 setup(){
  const r=this.canvas.getBoundingClientRect();this.w=r.width;this.h=r.height;
  if(!this.w||!this.h)return;
  const dpr=Math.min(devicePixelRatio||1,motion.dprLimit);
  this.canvas.width=Math.round(this.w*dpr);this.canvas.height=Math.round(this.h*dpr);
  this.ctx.setTransform(dpr,0,0,dpr,0,0);
  // Evaluate the wave field on a coarse lattice, then interpolate for dense sand grains.
  // This retains fine grain detail without evaluating trigonometry for every particle.
  this.cell=12;this.cols=Math.ceil(this.w/this.cell)+2;this.rows=Math.ceil(this.h/this.cell)+2;
  this.field=new Float32Array(this.cols*this.rows);this.points=[];
  let seed=17;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
  const step=this.w<500?1.9:motion.spacing;
  for(let y=0;y<this.h;y+=step)for(let x=0;x<this.w;x+=step){
   const px=x+rnd()*step,py=y+rnd()*step,gx=px/this.cell,gy=py/this.cell;
   this.points.push({x:px,y:py,n:rnd(),index:Math.floor(gy)*this.cols+Math.floor(gx),fx:gx%1,fy:gy%1});
  }
  this.draw();
 }
 setComplexity(n){this.complexity=n;this.draw()}
 schedule(){cancelAnimationFrame(this.raf);this.raf=0;if(!this.visible||document.hidden||this.reduced.matches)return;this.raf=requestAnimationFrame(t=>{this.draw(t);this.schedule()})}
 draw(time=0){
  if(!this.w||!this.h)return;
  const c=this.ctx;c.clearRect(0,0,this.w,this.h);c.fillStyle=this.color;
  const a=this.complexity,t=this.reduced.matches?0:time*.000055;
  const grid=this.field,cols=this.cols;
  for(let row=0;row<this.rows;row++)for(let col=0;col<cols;col++){
   const nx=col*this.cell/this.w*6.28,ny=row*this.cell/this.h*6.28;
   const warp=Math.sin(ny*1.4+nx*.6+t)*.65;
   grid[row*cols+col]=Math.sin((nx+warp)*a*.47+this.phase+t)*Math.cos(ny*(a*.37)+Math.sin(nx*.9)*.65-t)+Math.cos(nx*(a*.39)-ny*.8+t)*Math.sin(ny*(a*.43)+warp+this.phase);
  }
  for(const p of this.points){
   const i=p.index;
   const top=grid[i]*(1-p.fx)+grid[i+1]*p.fx;
   const bottom=grid[i+cols]*(1-p.fx)+grid[i+cols+1]*p.fx;
   const value=Math.abs(top*(1-p.fy)+bottom*p.fy);
   const threshold=.19+p.n*.12;if(value>threshold)continue;
   const dx=p.x-this.pointer.x,dy=p.y-this.pointer.y,dist=Math.hypot(dx,dy);
   const power=Math.max(0,1-dist/130),shift=power*power*(this.pointer.down?44:22);
   const x=p.x+(dist?dx/dist:0)*shift,y=p.y+(dist?dy/dist:0)*shift;
   c.globalAlpha=(.58+(1-value/threshold)*.4)*this.opacity;
   const size=p.n>.75?1.8:1.25;c.fillRect(x,y,size,size);
  }
  c.globalAlpha=1;
 }
}
export function titleParticles(canvas,word){const ctx=canvas.getContext('2d');let points=[],w=0,h=0,raf=0,pointer={x:-1000,y:-1000};const reduced=matchMedia('(prefers-reduced-motion: reduce)');const color=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();function setup(){const r=word.getBoundingClientRect(),style=getComputedStyle(word);w=r.width+30;h=r.height+30;const d=Math.min(devicePixelRatio||1,1.6);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);const off=document.createElement('canvas');off.width=w;off.height=h;const c=off.getContext('2d',{willReadFrequently:true});c.font=`900 ${style.fontSize} Arial`;c.textBaseline='top';c.fillText('WILD.',15,9);const data=c.getImageData(0,0,w,h).data;points=[];for(let y=0;y<h;y+=2.5)for(let x=0;x<w;x+=2.5)if(data[(Math.floor(y)*off.width+Math.floor(x))*4+3]>100)points.push({x,y,tx:x,ty:y,vx:0,vy:0});}
function draw(){ctx.clearRect(0,0,w,h);let moving=false;ctx.fillStyle=color;for(const p of points){const dx=p.x-pointer.x,dy=p.y-pointer.y,dist=Math.hypot(dx,dy);if(dist<95&&dist>0){p.vx+=dx/dist*(95-dist)*.045;p.vy+=dy/dist*(95-dist)*.045}p.vx+=(p.tx-p.x)*motion.returnForce;p.vy+=(p.ty-p.y)*motion.returnForce;p.vx*=motion.friction;p.vy*=motion.friction;p.x+=p.vx;p.y+=p.vy;const delta=Math.hypot(p.x-p.tx,p.y-p.ty);if(delta>.4){ctx.globalAlpha=Math.min(1,delta/10);ctx.fillRect(p.x,p.y,1.8,1.8);moving=true}}ctx.globalAlpha=1;raf=moving&&!document.hidden&&!reduced.matches?requestAnimationFrame(draw):0}
function start(){if(!raf&&!reduced.matches)raf=requestAnimationFrame(draw)}word.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top};start()});word.addEventListener('pointerleave',()=>{pointer={x:-1000,y:-1000};start()});word.addEventListener('pointerdown',e=>{if(reduced.matches)return;const r=canvas.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top};start();setTimeout(()=>{pointer={x:-1000,y:-1000};start()},450)});new ResizeObserver(setup).observe(word);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else start()});setup();}
