import {installShell,notify,downloadBlob} from './ui.js?v=7';
import {readCollection,removeImpression,safeText,dateLabel} from './store.js?v=7';
installShell();const $=s=>document.querySelector(s);let removing=null,mapVersion=0;
function safeImage(value){return /^data:image\/(webp|png);base64,/.test(value||'')?value:'assets/pattern.webp'}
async function render(){
 const items=readCollection();$('#collection-total').textContent=items.length;$('#collection-empty').hidden=items.length>0;$('#personal-map').hidden=items.length===0;
 $('#collection-grid').innerHTML=items.map(item=>`<article class="impression-card"><img src="${safeImage(item.image)}" alt="${safeText(item.name)}的声纹印记"><div class="impression-info"><h2>${safeText(item.name)}</h2><div class="impression-meta"><span>${safeText(item.source)}</span><time datetime="${safeText(item.date)}">${dateLabel(item.date)}</time></div><div class="impression-actions"><a href="lab.html?impression=${encodeURIComponent(item.id)}">再次共振 ↗</a><button data-download="${safeText(item.id)}">导出 ↗</button><button class="delete-impression" data-delete="${safeText(item.id)}" aria-label="移除${safeText(item.name)}印记">移除</button></div></div></article>`).join('');
 if(items.length)await drawMap(items);
}
$('#collection-grid').addEventListener('click',e=>{const remove=e.target.closest('[data-delete]'),download=e.target.closest('[data-download]');if(remove){removing=remove.dataset.delete;$('#delete-confirm').showModal()}if(download){const item=readCollection().find(x=>x.id===download.dataset.download);if(!item)return;const a=document.createElement('a');a.href=safeImage(item.image);a.download='RMS-sound-impression.webp';a.click()}});
$('#cancel-delete').addEventListener('click',()=>$('#delete-confirm').close());$('#confirm-delete').addEventListener('click',()=>{try{removeImpression(removing);$('#delete-confirm').close();notify('声音印记已移除')}catch{notify('无法更新本地收藏，请检查浏览器设置')}});
async function drawMap(items){
 const version=++mapVersion,canvas=$('#map-canvas'),c=canvas.getContext('2d'),style=getComputedStyle(document.documentElement),bg=style.getPropertyValue('--bg').trim(),accent=style.getPropertyValue('--accent').trim();
 c.fillStyle=bg;c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle=accent;c.font='11px Arial';c.fillText('RMS / MY RAINFOREST RESONANCE MAP',60,50);c.font='36px Arial';c.fillText('每一次相遇，都在此共鸣。',60,112);
 const images=await Promise.all(items.slice(0,12).map(item=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=safeImage(item.image)})));if(version!==mapVersion)return;
 const n=images.length,columns=Math.ceil(Math.sqrt(n*1.4)),rows=Math.ceil(n/columns),width=1080/columns,height=700/rows;
 c.save();c.beginPath();c.rect(45,150,1110,740);c.clip();
 images.forEach((image,i)=>{if(!image)return;const x=60+(i%columns)*width,y=170+Math.floor(i/columns)*height;c.save();c.translate(x+width/2,y+height/2);c.rotate(((i%3)-1)*.08);c.globalCompositeOperation='screen';c.drawImage(image,-width*.6,-height*.6,width*1.2,height*1.2);c.restore()});c.restore();
 c.strokeStyle=style.getPropertyValue('--border').trim();c.beginPath();c.moveTo(60,920);c.lineTo(1140,920);c.stroke();c.fillStyle=accent;c.font='12px Arial';c.fillText(`${items.length} SOUND IMPRESSIONS / ${dateLabel(new Date().toISOString())}`,60,955);c.textAlign='right';c.fillText('NATURE RESONATES WITH US.',1140,955);c.textAlign='left';
}
$('#export-map').addEventListener('click',()=>$('#map-canvas').toBlob(blob=>{if(blob){downloadBlob(blob,'RMS-my-rainforest-map.png');notify('个人共声地图已导出')}},'image/png'));
addEventListener('rms-collection',render);addEventListener('storage',render);render();
