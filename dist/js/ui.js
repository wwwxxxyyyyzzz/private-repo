import {installMotion} from './motion.js?v=6';
import {sound} from './audio.js?v=6';
import {species} from './data.js?v=6';
import {readCollection} from './store.js?v=6';
let toastTimer;
export function notify(message){let el=document.querySelector('.toast');if(!el){el=document.createElement('div');el.className='toast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.append(el)}el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800)}
export function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}
export function installShell(){
 installMotion();
 const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('.nav');
 menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',open);menu.setAttribute('aria-label',open?'收起导航':'展开导航');nav.classList.toggle('open',open)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.focus()}});
 const button=document.querySelector('.sound-toggle');
 const update=()=>{const on=sound.state==='playing'&&!sound.muted;button?.setAttribute('aria-pressed',String(on));button?.setAttribute('aria-label',on?'关闭声音':'开启声音');const label=button?.querySelector('.sound-label');if(label)label.textContent=on?'声音开启':'声音关闭'};
 button?.addEventListener('click',async()=>{try{if(sound.state==='playing'){sound.setMuted(!sound.muted)}else{if(!sound.buffer)await sound.demo(species[0]);sound.setMuted(false);await sound.play();notify('合成声景演示 · 非真实动物录音')}}catch(e){notify(e.message)}});sound.addEventListener('statechange',update);update();
 const count=()=>{document.querySelectorAll('[data-collection-count]').forEach(el=>el.textContent=readCollection().length)};count();addEventListener('rms-collection',count);addEventListener('storage',count);
 for(const dialog of document.querySelectorAll('dialog')){dialog.querySelector('[data-close]')?.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close()})}
 // Browser view transitions provide a brief reveal; reduced motion uses the native instant navigation.
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('allow-transitions');
 sound.addEventListener('error',e=>notify(e.detail));
}
