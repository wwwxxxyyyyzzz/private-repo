import {species,getSpecies} from './data.js?v=4';
import {sound,timeLabel} from './audio.js?v=4';
import {installShell,notify} from './ui.js?v=4';
import {ResonanceField} from './resonance.js?v=4';
import {saveImpression} from './store.js?v=4';
import {patternSnapshot} from './export.js?v=4';
installShell();
const $=s=>document.querySelector(s),grid=$('#archive-grid');
const field=new ResonanceField($('#archive-field'),{complexity:3.8});
let filter='all',query='',selected=null,detail=null,selectionVersion=0,unlocked=false,collected=false;
function render(){
 const results=species.filter(s=>(filter==='all'||s.group===filter)&&(s.name+s.en+s.voice).toLowerCase().includes(query));
 grid.innerHTML=results.map(s=>`<article class="archive-specimen"><div class="archive-photo"><img src="${s.image}" alt="${s.name}参考摄影" loading="lazy"><span class="specimen-number">0${species.indexOf(s)+1}</span><span class="specimen-time">${s.time}</span><button class="card-play" data-play="${s.id}" aria-label="播放${s.name}合成演示" aria-pressed="false">▶</button></div><div class="archive-card-info"><h2>${s.name}<span>${s.en.toUpperCase()}</span></h2><span class="source-tag">SYNTHETIC DEMO</span></div><div class="archive-card-bottom"><span>${s.voice} / ${s.category}</span><button data-detail="${s.id}" class="detail-link">认识它 ↗</button></div></article>`).join('');
 $('#archive-empty').hidden=results.length>0;updatePlayer();
}
async function select(s){
 const version=++selectionVersion;try{
  if(selected?.id===s.id&&sound.speciesId===s.id&&sound.buffer){if(sound.state==='playing')sound.pause();else await sound.play();return;}
  selected=s;unlocked=false;collected=false;field.phase=0;field.setComplexity(s.complexity);field.setColor(getComputedStyle(document.documentElement).getPropertyValue(s.color).trim());
  $('#player-image').src=s.image;$('#player-image').alt=s.name+'参考摄影';$('#player-name').textContent=s.name;$('#player-story').textContent=s.story;$('#open-in-lab').href='lab.html?sound='+s.id;
  $('#collect-sound').disabled=true;$('#collect-sound').textContent='听完这段声音，解锁声音印记 ✧';
  await sound.demo(s);if(version!==selectionVersion)return;await sound.play();
  $('.archive-player').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
 }catch(e){notify(e.message)}
}
grid.addEventListener('click',e=>{const play=e.target.closest('[data-play]'),info=e.target.closest('[data-detail]');if(play)select(getSpecies(play.dataset.play));if(info){detail=getSpecies(info.dataset.detail);$('#detail-image').src=detail.image;$('#detail-image').alt=detail.name;$('#detail-name').textContent=detail.name;$('#detail-description').textContent=detail.description;$('#detail-category').textContent=detail.en.toUpperCase()+' / '+detail.category;$('#species-detail').showModal()}});
$('#detail-listen').addEventListener('click',()=>{$('#species-detail').close();select(detail)});
for(const b of document.querySelectorAll('[data-filter]'))b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(btn=>{const on=btn===b;btn.classList.toggle('selected',on);btn.setAttribute('aria-pressed',on)});render()});
$('#species-search').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();render()});
function updatePlayer(){
 const ready=!!sound.buffer,playing=sound.state==='playing';$('#archive-play').disabled=!ready;$('#archive-stop').disabled=!ready;$('#archive-play').textContent=playing?'Ⅱ':'▶';$('#archive-play').setAttribute('aria-label',playing?'暂停声音':'播放声音');$('#archive-seek').disabled=!ready;$('#archive-seek').max=sound.duration||10;$('#archive-seek').value=sound.position;$('#current-time').textContent=timeLabel(sound.position);$('#total-time').textContent=timeLabel(sound.duration);
 $('#archive-status').textContent=({playing:'正在播放 · 合成演示',paused:'已暂停',ended:'聆听完成',ready:'准备聆听',empty:'等待选择声音',loading:'正在载入'})[sound.state]||'';
 for(const b of document.querySelectorAll('[data-play]')){const on=b.dataset.play===sound.speciesId&&playing;b.textContent=on?'Ⅱ':'▶';b.setAttribute('aria-pressed',on)}
 if(ready&&!selected){selected=getSpecies(sound.speciesId);$('#player-name').textContent=selected.name;$('#player-story').textContent=selected.story;$('#open-in-lab').href='lab.html?sound='+selected.id;}
}
$('#archive-play').addEventListener('click',async()=>{try{sound.state==='playing'?sound.pause():await sound.play()}catch(e){notify(e.message)}});
$('#archive-stop').addEventListener('click',()=>sound.stop());$('#archive-seek').addEventListener('input',e=>sound.seek(e.target.value));$('#archive-volume').addEventListener('input',e=>sound.setVolume(e.target.value));
sound.addEventListener('statechange',updatePlayer);sound.addEventListener('progress',updatePlayer);sound.addEventListener('metrics',()=>field.setAudio(sound.metrics));
sound.addEventListener('ended',()=>{if(!selected)return;unlocked=true;$('#collect-sound').disabled=false;$('#collect-sound').textContent='收藏这段声音的印记 ✧';notify('聆听完成，已解锁声音印记')});
$('#collect-sound').addEventListener('click',()=>{if(!unlocked||collected||!selected)return;try{saveImpression({name:selected.name,speciesId:selected.id,source:'合成声景演示',settings:field.settings(),image:patternSnapshot(field),type:'sound'});collected=true;$('#collect-sound').disabled=true;$('#collect-sound').textContent='已收藏 · 在「我的声音」中查看 ✧';notify('声音印记已收藏')}catch(e){notify(e.message)}});
render();
