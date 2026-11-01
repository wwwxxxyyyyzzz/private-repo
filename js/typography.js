// Letterforms have three cached material states: ink, contour and granular mist.
// Only cached strips and a bounded set of near-pointer grains move each frame.
export class ResonantType {
  constructor(el,{color,phase=0}={}){
    this.el=el;this.color=color;this.phase=phase;this.time=0;this.last=0;this.raf=0;this.hover=0;this.targetHover=0;this.level=0;this.visible=false;
    this.pointer={x:-1000,y:-1000};this.reduce=matchMedia('(prefers-reduced-motion: reduce)');
    this.text=el.textContent.trim();this.canvas=document.createElement('canvas');this.canvas.className='resonant-ink-canvas';this.canvas.setAttribute('aria-hidden','true');this.el.append(this.canvas);this.ctx=this.canvas.getContext('2d');if(!this.ctx)return;
    this.resize=new ResizeObserver(()=>this.setup());this.resize.observe(el);
    this.observer=new IntersectionObserver(e=>{this.visible=e[0].isIntersecting;this.schedule()});this.observer.observe(el);
    el.addEventListener('pointermove',e=>{const r=this.canvas.getBoundingClientRect();this.pointer={x:e.clientX-r.left,y:e.clientY-r.top};this.targetHover=1;this.schedule()});
    el.addEventListener('pointerleave',()=>{this.targetHover=0;this.pointer={x:-1000,y:-1000}});
    el.addEventListener('pointerdown',()=>{this.targetHover=1;clearTimeout(this.press);this.press=setTimeout(()=>{this.targetHover=0},800)});
    this.reduce.addEventListener('change',()=>{this.el.classList.toggle('resonant-type-ready',!this.reduce.matches);this.canvas.hidden=this.reduce.matches;this.last=0;this.schedule()});
    document.addEventListener('visibilitychange',()=>{this.last=0;this.schedule()});this.setup();
  }
  setAudio(level){this.level=Math.min(1,level*5)}
  setup(){
    const r=this.el.getBoundingClientRect();if(!r.width||!r.height)return;
    this.pad=28;this.w=r.width+this.pad*2;this.h=r.height+this.pad*2;this.dpr=Math.min(devicePixelRatio||1,1.35);
    this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    const make=()=>{const c=document.createElement('canvas');c.width=this.canvas.width;c.height=this.canvas.height;return c};
    this.solid=make();this.outline=make();this.mist=make();this.grain=make();
    const style=getComputedStyle(this.el),font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    for(const [canvas,stroke] of [[this.solid,false],[this.outline,true]]){
      const c=canvas.getContext('2d');c.setTransform(this.dpr,0,0,this.dpr,0,0);c.font=font;c.textBaseline='alphabetic';c.fontKerning='normal';if('letterSpacing' in c)c.letterSpacing=style.letterSpacing;
      const m=c.measureText(this.text),asc=m.fontBoundingBoxAscent??m.actualBoundingBoxAscent,desc=m.fontBoundingBoxDescent??m.actualBoundingBoxDescent;
      const baseline=this.pad+(r.height-asc-desc)/2+asc;c.fillStyle=this.color;c.strokeStyle=this.color;c.lineWidth=.8;
      stroke?c.strokeText(this.text,this.pad,baseline):c.fillText(this.text,this.pad,baseline);
    }
    const mc=this.mist.getContext('2d');mc.filter=`blur(${4*this.dpr}px)`;mc.drawImage(this.solid,0,0);
    const gc=this.grain.getContext('2d'),data=this.solid.getContext('2d').getImageData(0,0,this.solid.width,this.solid.height);let seed=27183;
    const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646};this.points=[];
    for(let i=3;i<data.data.length;i+=4){const alpha=data.data[i];if(!alpha)continue;data.data[i]=random()>.46?alpha*(.3+random()*.7):0;}
    gc.putImageData(data,0,0);
    for(let y=0;y<this.solid.height;y+=9)for(let x=0;x<this.solid.width;x+=9){if(data.data[(y*this.solid.width+x)*4+3]>100&&random()>.65)this.points.push({x:x/this.dpr,y:y/this.dpr,seed:random()})}
    if(this.points.length>450)this.points=this.points.filter((_,i)=>i%Math.ceil(this.points.length/450)===0);
    this.el.classList.toggle('resonant-type-ready',!this.reduce.matches);this.canvas.hidden=this.reduce.matches;this.draw(performance.now());this.schedule();
  }
  schedule(){cancelAnimationFrame(this.raf);this.raf=0;if(!this.visible||this.reduce.matches||document.hidden){this.last=0;return}this.raf=requestAnimationFrame(t=>{this.draw(t);this.schedule()})}
  draw(now){
    if(!this.solid||this.reduce.matches)return;
    const dt=this.last?Math.min(.05,(now-this.last)/1000):0;this.last=now;this.time+=dt;this.hover+=(this.targetHover-this.hover)*(1-Math.exp(-dt*8));
    const wave=(1-Math.cos(this.time*.72+this.phase))*.5,q=Math.max(0,Math.min(1,(wave-.12)/.76)),cycle=q*q*(3-2*q);
    const dissolve=Math.min(.98,cycle*.92+this.hover*.65+this.level*.12),c=this.ctx;
    c.clearRect(0,0,this.w,this.h);c.globalAlpha=1-dissolve*.84;c.drawImage(this.solid,0,0,this.w,this.h);
    c.globalAlpha=dissolve*.78;c.drawImage(this.outline,0,0,this.w,this.h);c.globalAlpha=dissolve*.26;c.drawImage(this.mist,0,0,this.w,this.h);
    c.globalAlpha=dissolve*.9;const cols=22,sw=this.w/cols;
    for(let col=0;col<cols;col++){
      const x=col*sw,width=Math.min(sw+.5,this.w-x),local=Math.max(0,1-Math.abs(x+sw/2-this.pointer.x)/145);
      const dy=Math.sin(col*.38-this.time*1.55)*(2+dissolve*3+this.hover*local*9)*dissolve;
      c.drawImage(this.grain,x/this.w*this.grain.width,0,width/this.w*this.grain.width,this.grain.height,x,dy,width,this.h);
    }
    if(this.hover>.02){c.fillStyle=this.color;c.globalAlpha=this.hover*.72;for(const p of this.points){const dx=p.x-this.pointer.x,dy=p.y-this.pointer.y,d2=dx*dx+dy*dy;if(d2<1||d2>21025)continue;const d=Math.sqrt(d2),push=(1-d/145)**2*this.hover*(45+p.seed*45);c.fillRect(p.x+dx/d*push,p.y+dy/d*push,.8,.8)}}
    c.globalAlpha=1;const state=dissolve>.62?'mist':dissolve<.28?'solid':'resonating';if(this.el.dataset.inkState!==state)this.el.dataset.inkState=state;
  }
}
