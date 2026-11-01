const KEY='rms-sound-impressions-v1';
export function readCollection(){try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string').slice(0,24):[]}catch{return []}}
export function saveImpression(item){
 const list=readCollection();const entry={...item,id:crypto.randomUUID?.()||'rms-'+Date.now(),date:new Date().toISOString()};
 const next=[entry,...list].slice(0,24);
 try{localStorage.setItem(KEY,JSON.stringify(next));dispatchEvent(new Event('rms-collection'));return entry}catch{throw new Error('当前浏览器无法保存，或本地存储空间不足。请先导出图片。')}
}
export function removeImpression(id){localStorage.setItem(KEY,JSON.stringify(readCollection().filter(x=>x.id!==id)));dispatchEvent(new Event('rms-collection'))}
export function safeText(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
export function dateLabel(date){return new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Shanghai'}).format(new Date(date))}
