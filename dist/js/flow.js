// A coherent two-axis warp: cached grains move as a continuous material.
// Two neighboring low-rate flow frames are blended at display rate. This keeps
// pointer response fast without regenerating the dense particle field per frame.
export function flowPoint(x,y,w,h,time,amount){
  const fx=(Math.sin(y/h*5.4+time*.68)*.65+Math.sin(y/h*10.1-time*.39)*.35)*amount;
  const px=x+fx;
  const fy=(Math.cos(px/w*4.8-time*.61)*.65+Math.sin(px/w*9.2+time*.35)*.35)*amount;
  return [px,y+fy];
}

export class FlowWarp {
  constructor(){this.frames=[document.createElement('canvas'),document.createElement('canvas')];this.pass=document.createElement('canvas');this.index=-1;this.version=-1;this.rate=8;}
  resize(w,h){
    if(this.w===w&&this.h===h)return;
    this.w=w;this.h=h;this.dpr=Math.min(1,Math.sqrt(380000/(w*h)));
    for(const c of [...this.frames,this.pass]){c.width=Math.max(1,Math.round(w*this.dpr));c.height=Math.max(1,Math.round(h*this.dpr));c.getContext('2d').setTransform(1,0,0,1,0,0)}
    this.index=-1;
  }
  paint(target,source,time,amount){
    const w=target.width,h=target.height,pc=this.pass.getContext('2d'),tc=target.getContext('2d');
    const amplitude=amount*this.dpr;
    pc.clearRect(0,0,w,h);tc.clearRect(0,0,w,h);
    // Integer, non-overlapping strip boundaries prevent bright grid seams.
    const rows=72,cols=72;
    for(let row=0;row<rows;row++){
      const y=Math.round(row*h/rows),end=Math.round((row+1)*h/rows),center=(y+end)*.5;
      const shift=(Math.sin(center/h*5.4+time*.68)*.65+Math.sin(center/h*10.1-time*.39)*.35)*amplitude;
      pc.drawImage(source,0,y/h*source.height,source.width,(end-y)/h*source.height,shift,y,w,end-y);
    }
    for(let col=0;col<cols;col++){
      const x=Math.round(col*w/cols),end=Math.round((col+1)*w/cols),center=(x+end)*.5;
      const shift=(Math.cos(center/w*4.8-time*.61)*.65+Math.sin(center/w*9.2+time*.35)*.35)*amplitude;
      tc.drawImage(this.pass,x,0,end-x,h,x,shift,end-x,h);
    }
  }

  draw(ctx,source,w,h,time,amount,version){
    this.resize(w,h);
    const index=Math.floor(time*this.rate),mix=time*this.rate-index;
    if(this.version!==version||this.index<0||Math.abs(this.amount-amount)>.05||index!==this.index){
      if(this.version===version&&this.index===index-1&&Math.abs(this.amount-amount)<=.05){
        this.frames.reverse();this.paint(this.frames[1],source,(index+1)/this.rate,amount);
      }else{
        this.paint(this.frames[0],source,index/this.rate,amount);this.paint(this.frames[1],source,(index+1)/this.rate,amount);
      }
      this.version=version;this.index=index;this.amount=amount;
    }
    const alpha=ctx.globalAlpha,composite=ctx.globalCompositeOperation;
    ctx.globalAlpha=alpha*(1-mix);ctx.drawImage(this.frames[0],-w/2,-h/2,w,h);
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha*mix;ctx.drawImage(this.frames[1],-w/2,-h/2,w,h);ctx.globalAlpha=alpha;ctx.globalCompositeOperation=composite;
  }
}
