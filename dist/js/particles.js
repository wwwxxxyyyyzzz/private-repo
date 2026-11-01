// Rasterize individual grains at native canvas resolution. No enlarged noise
// sprites, image warping or interpolated frame blending soften their edges.
export class PointRaster {
  constructor(ctx){this.ctx=ctx;this.fx=new Float32Array(257);this.fy=new Float32Array(257);this.inks=new Uint32Array(32)}
  draw(field,level,time,rgb){
    const {canvas,w,h,dpr,particles:p,density,detail,opacity}=field;
    const width=canvas.width,height=canvas.height;
    if(this.width!==width||this.height!==height){
      this.width=width;this.height=height;this.image=this.ctx.createImageData(width,height);this.pixels=new Uint32Array(this.image.data.buffer);
    }
    if(this.color!==field.color||this.opacity!==opacity){
      this.color=field.color;this.opacity=opacity;
      // The backing bytes are RGBA regardless of the host's integer byte order.
      const bytes=new Uint8Array(this.inks.buffer);
      for(let i=0;i<32;i++){bytes[i*4]=Math.round(rgb[0]*255);bytes[i*4+1]=Math.round(rgb[1]*255);bytes[i*4+2]=Math.round(rgb[2]*255);bytes[i*4+3]=Math.round(i/31*opacity*255)}
    }
    const pixels=this.pixels;pixels.fill(0);
    const amount=field.flowAmount(),clock=field.flowTime,span=w+amount*2;
    if(amount){
      for(let i=0;i<=256;i++){
        const y=i/256,x=(i/256*span-amount)/w;
        this.fx[i]=(Math.sin(y*5.4+clock*.68)*.65+Math.sin(y*10.1-clock*.39)*.35)*amount;
        this.fy[i]=(Math.cos(x*4.8-clock*.61)*.65+Math.sin(x*9.2+clock*.35)*.35)*amount;
      }
    }
    const reduced=field.reduced.matches,scale=1+level*.10,ox=w*.5*(1-scale)+Math.sin(time*.7)*level*5,oy=h*.5*(1-scale)+Math.cos(time*.8)*level*5;
    const strength=reduced?0:field.strength,radius=field.radius*1.12,radius2=radius*radius,px=field.pointer.x,py=field.pointer.y;
    const grainScale=(.75+Math.min(1.8,Math.max(.4,detail))*.25)*dpr;
    for(let i=0;i<p.length;i+=4){
      const seed=p[i+2];if(seed>density)continue;
      let x=p[i],y=p[i+1];
      if(amount){
        const yi=y/h*256,ya=Math.min(255,Math.max(0,yi|0)),yf=yi-ya;
        x+=this.fx[ya]*(1-yf)+this.fx[ya+1]*yf;
        const xi=(x+amount)/span*256,xa=Math.min(255,Math.max(0,xi|0)),xf=xi-xa;
        y+=this.fy[xa]*(1-xf)+this.fy[xa+1]*xf;
      }
      x=x*scale+ox;y=y*scale+oy;
      if(strength>.001){
        const dx=x-px,dy=y-py,d2=dx*dx+dy*dy;
        if(d2>0.01&&d2<radius2){
          const d=Math.sqrt(d2),influence=(1-d/radius)**2*strength,push=influence*(145+seed*140);
          x+=dx/d*push+((seed*73.1)%1-.5)*influence*100;
          y+=dy/d*push+((seed*97.3)%1-.5)*influence*100;
        }
      }
      const ix=Math.round(x*dpr),iy=Math.round(y*dpr);if(ix<0||iy<0||ix>=width-1||iy>=height-1)continue;
      const size=(.65+seed*.6)*grainScale,alpha=Math.max(1,Math.min(31,Math.round(p[i+3]*Math.min(1,size*size)*31))),index=iy*width+ix;
      pixels[index]=this.inks[alpha];
      // A minority of high-DPR grains use a dim adjacent pixel, never a cluster.
      if(size>1.35){const adjacent=seed>.5?1:width;pixels[index+adjacent]=this.inks[Math.round(alpha*Math.min(.65,size-1))]}
    }
    this.ctx.putImageData(this.image,0,0);
  }
}
