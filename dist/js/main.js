import {scrollToPosition} from './motion.js?v=7';
import {installShell,notify} from './ui.js?v=7';
import {sound} from './audio.js?v=7';
installShell();
import{ResonanceField,titleParticles}from'./resonance.js?v=7';
const $=s=>document.querySelector(s);
const rootStyle=getComputedStyle(document.documentElement);
const hero=new ResonanceField($('#hero-field'),{complexity:3.8,opacity:.7});
const storyField=new ResonanceField($('#story-field'),{color:rootStyle.getPropertyValue('--violet').trim(),complexity:5});
const lab=new ResonanceField($('#lab-field'),{complexity:4.5,flow:true});
titleParticles($('#title-particles'),$('#wild-word'));
// The hero field is behind the photographic layer; relay coordinates from the scene.
$('.hero').addEventListener('pointermove',e=>hero.move(e));
$('.hero').addEventListener('pointerdown',e=>{hero.pointer.down=true;hero.move(e)});
$('.hero').addEventListener('pointerup',()=>{hero.pointer.down=false});
$('.hero').addEventListener('pointerleave',()=>hero.leave());
const stages=[{k:'A — SILENCE / 静默',title:'森林从不安静。<br><em>只是我们，尚未听见。</em>',description:'枝叶之间，生命以声音彼此回应。那些不易被看见的鸣叫，构成了雨林最真实的日常。',alpha:.08},{k:'B — LISTEN / 聆听',title:'闭上眼，<br><em>让雨林靠近一点。</em>',description:'清晨的呼应、枝间的鸟鸣、夜晚的蛙声。循着不同生命的声音，感知雨林随时间变化的节奏。',alpha:.25},{k:'C — TRANSLATE / 转译',title:'让声音，<br><em>长出自己的形状。</em>',description:'从声音特征到生成式节点场，将振幅、频率与节奏转译为有机纹样，让听觉成为可见的体验。',alpha:.65},{k:'D — RESONANCE / 共振',title:'在万物之间，<br><em>找到共同的回响。</em>',description:'当真实影像与抽象声纹相遇，一次聆听开始延伸。向下探索，让你的触碰也成为共振的一部分。',alpha:.95}];let current=-1;
function setStage(i){if(i===current)return;current=i;const s=stages[i];$('#story-kicker').textContent=s.k;$('#story-title').innerHTML=s.title;$('#story-description').textContent=s.description;dispatchEvent(new Event('rms-stage'));$('#story-field').style.opacity=s.alpha;$('.story-art>img').style.opacity=1-s.alpha*.7;document.querySelectorAll('[data-stage]').forEach((b,j)=>{b.classList.toggle('selected',j===i);b.setAttribute('aria-pressed',j===i)})}
function updateStory(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const r=$('#story').getBoundingClientRect();const progress=Math.max(0,Math.min(.999,-r.top/Math.max(1,r.height-innerHeight)));setStage(Math.floor(progress*4))}let scrollFrame=0;addEventListener('scroll',()=>{if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{updateStory();scrollFrame=0})},{passive:true});setStage(0);updateStory();
for(const b of document.querySelectorAll('[data-stage]'))b.addEventListener('click',()=>{const i=+b.dataset.stage;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const s=$('#story');scrollToPosition(s.offsetTop+(s.offsetHeight-innerHeight)*((i+.1)/4))}setStage(i)});
$('#complexity').addEventListener('input',e=>lab.setComplexity(+e.target.value));$('#reset-pattern').addEventListener('click',()=>{lab.phase+=1.2;lab.setComplexity(4.5);$('#complexity').value=4.5;notify('新的共振纹样已生成')});
$('#export-pattern').addEventListener('click',()=>{try{const a=document.createElement('a');a.download='RMS-resonance.png';a.href=lab.canvas.toDataURL('image/png');a.click();notify('声纹已导出为透明 PNG')}catch{notify('当前浏览器无法导出图片，请尝试其他浏览器')}});
const species=[{id:'gibbon',name:'长臂猿 / Gibbon',image:'assets/gibbon.webp',description:'林冠之间，猿类以声音彼此呼应。RMS 以这份自然的交流为灵感，探索声音与有机视觉形态之间的连接。'},{id:'warbler',name:'柳莺 / Warbler',image:'assets/warbler.webp',description:'小小的身影隐于枝叶，细微鸣声让森林的层次变得可被感知。从一次驻足开始，重新关注身边的自然声景。'},{id:'pheasant',name:'孔雀雉 / Peacock-pheasant',image:'assets/pheasant.webp',description:'细密的羽纹与层叠的眼斑，呈现出自然独特的视觉秩序。在声音与形态之间，寻找感知生命的新方式。'}];
const dialog=$('#species-dialog');for(const b of document.querySelectorAll('[data-species]'))b.addEventListener('click',()=>{const s=species[+b.dataset.species];$('#dialog-title').textContent=s.name;$('#dialog-image').src=s.image;$('#dialog-image').alt=s.name;$('#dialog-description').textContent=s.description;$('#dialog-resonance').href='lab.html?sound='+s.id;dialog.showModal()});$('.dialog-close').addEventListener('click',()=>dialog.close());$('#dialog-resonance').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
sound.addEventListener('metrics',()=>{hero.setAudio(sound.metrics);lab.setAudio(sound.metrics)});
