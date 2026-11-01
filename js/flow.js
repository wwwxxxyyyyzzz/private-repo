// A coherent two-axis flow shared by the shader, CPU point raster and SVG export.
export function flowPoint(x,y,w,h,time,amount){
  const fx=(Math.sin(y/h*5.4+time*.68)*.65+Math.sin(y/h*10.1-time*.39)*.35)*amount;
  const px=x+fx;
  const fy=(Math.cos(px/w*4.8-time*.61)*.65+Math.sin(px/w*9.2+time*.35)*.35)*amount;
  return [px,y+fy];
}
