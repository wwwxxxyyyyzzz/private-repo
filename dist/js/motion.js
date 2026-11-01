import Lenis from '../vendor/lenis.mjs';

const {gsap,ScrollTrigger,SplitText}=window;
if(gsap&&ScrollTrigger&&SplitText)gsap.registerPlugin(ScrollTrigger,SplitText);
export const timings={reveal:.8,lineStagger:.095,charStagger:.028,feedback:.22};
let lenis=null,installed=false;

export function scrollToPosition(top,{immediate=false}={}){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(lenis)lenis.scrollTo(top,{immediate:immediate||reduce,duration:.85});
  else window.scrollTo({top,behavior:reduce||immediate?'instant':'smooth'});
}
export function revealElement(el,{center=false,immediate=false}={}){
  if(!el)return;
  const r=el.getBoundingClientRect();
  scrollToPosition(Math.max(0,r.top+scrollY-(center?Math.max(24,(innerHeight-r.height)/2):24)),{immediate});
}

export async function installMotion(){
  if(installed)return;installed=true;
  if(!gsap||!ScrollTrigger||!SplitText){document.documentElement.dataset.motion="fallback";return;}
  lenis=new Lenis({autoRaf:false,lerp:.115,anchors:true,syncTouch:false,respectReducedMotion:true,
    prevent:node=>node.tagName==='DIALOG'||node.hasAttribute?.('data-lenis-prevent')});
  const tick=seconds=>{if(!document.hidden)lenis?.raf(seconds*1000)};
  lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(tick);
  document.querySelectorAll('dialog').forEach(el=>el.setAttribute('data-lenis-prevent',''));
  // Native touch scrolling and the actual scroll container are preserved.
  let media;
  addEventListener('pagehide',e=>{gsap.ticker.remove(tick);if(e.persisted){lenis?.stop();return;}media?.revert();lenis?.destroy();lenis=null});
  addEventListener('pageshow',e=>{if(e.persisted&&lenis){lenis.start();gsap.ticker.add(tick);ScrollTrigger.refresh()}});
  try{await Promise.all([document.fonts.load('700 16px "Bricolage Display"'),document.fonts.load('700 16px "Noto Sans SC"'),document.fonts.ready])}catch{/* Readable system fallbacks remain visible. */}

  media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{
    const splits=[],intro=gsap.timeline({defaults:{ease:'power3.out'}});
    const hero=document.querySelector('#hero-title');
    if(hero){
      intro.from(hero,{y:12,autoAlpha:0,duration:.7,clearProps:'transform,opacity,visibility'},0);
      intro.from('.hero-subtitle',{y:14,autoAlpha:0,duration:.5,clearProps:'transform,opacity,visibility'},.25)
        .from('.hero-description,.hero-copy>.primary-button',{y:12,autoAlpha:0,duration:.45,stagger:.07,clearProps:'transform,opacity,visibility'},.36);
    }
    const headings=document.querySelectorAll('.page-intro h1,.lab-intro h1,.about-hero h1,.section-heading h2,.product-head h2,.next-chapter h2,.manifesto-grid h2,.brand-language h2,.product-design-notes h2,.footer-top h2');
    for(const el of headings){
      el.classList.add('resonant-heading');
      const split=SplitText.create(el,{type:'lines',mask:'lines',linesClass:'rms-line',aria:'auto',autoSplit:true,onSplit(instance){
        return gsap.from(instance.lines,{yPercent:105,autoAlpha:0,duration:timings.reveal,stagger:timings.lineStagger,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 94%',once:true}});
      }});splits.push(split);
    }
    // A single photographic movement supports the held sound narrative.
    const art=document.querySelector('.story-art>img');
    if(art&&!matchMedia('(pointer: coarse)').matches)gsap.fromTo(art,{yPercent:-2},{yPercent:2,ease:'none',scrollTrigger:{trigger:'.story',start:'top bottom',end:'bottom top',scrub:true}});
    const feedback=[];
    for(const button of document.querySelectorAll('.primary-button,.text-button,.nav>a')){
      const arrow=Array.from(button.children).find(el=>el.tagName==='SPAN'&&/^[↗↻→✧]$/.test(el.textContent.trim()));
      const target=arrow||button;
      const enter=()=>gsap.to(target,{x:arrow?3:0,y:arrow?-3:-2,duration:timings.feedback,ease:'power2.out',overwrite:true});
      const leave=()=>gsap.to(target,{x:0,y:0,duration:timings.feedback,ease:'power2.out',overwrite:true,clearProps:'transform'});
      button.addEventListener('pointerenter',enter);button.addEventListener('pointerleave',leave);feedback.push(()=>{button.removeEventListener('pointerenter',enter);button.removeEventListener('pointerleave',leave);gsap.set(target,{clearProps:'transform'})});
    }
    const stage=()=>{const el=document.querySelector('#story-title');if(el)gsap.fromTo(el,{y:12,autoAlpha:.4},{y:0,autoAlpha:1,duration:.42,ease:'power2.out',overwrite:true,clearProps:'transform,opacity,visibility'})};
    addEventListener('rms-stage',stage);
    ScrollTrigger.refresh();
    return()=>{removeEventListener('rms-stage',stage);feedback.forEach(clean=>clean());splits.forEach(split=>split.revert())};
  });
  document.documentElement.dataset.motion='ready';
}
