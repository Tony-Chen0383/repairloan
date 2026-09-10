(() => {
const cfg=window.REPAIRLOAN_CONFIG,API=window.RepairLoanAPI,R=window.RepairLoanRenderer;const token=new URLSearchParams(location.search).get('token')||'';const sides=[['front','正面'],['back','背面'],['left','左側'],['right','右側'],['top','上方'],['bottom','下方']];let loan=null,photos={},idPhotos={},signatureDrawn=false,ctx=null,drawing=false,last=null,busy=false;let sigState={hasInk:false,normalizedCanvas:null,fullscreen:false,suppressAutoOpen:false,autoOpenTimer:null,inView:false,exiting:false,returnScrollY:0};
const $=id=>document.getElementById(id);const TERMS=['本契約條款已於簽立前經出借人（乙方）逐條向借用人（甲方）說明，並經甲方審閱完成。雙方謹簽訂本契約條款如下，以憑信守。','一、本手機借用前機況圖、借用期間詳如下方所載，甲方簽妥本契約後，視為本手機交付與驗收完畢。惟本手機之所有權仍歸屬乙方，本契約僅係將本手機在甲方送修維修手機期間提供甲方使用，甲方不擁有其他任何權利。在借用期間內，未經乙方事前核准甲方不得將本手機拆解或更換其零件、交予第三人使用或有出售、出租等處分行為，否則應賠償乙方因此所受之一切損害及損失。','二、本手機借用方式：借用期限自甲方送修手機開始到甲方領取維修手機為止，若需借用本手機須先付清手機維修費用，乙方不另收取本手機額外租借費用。甲方應盡善良管理人之注意義務妥善保管本手機，本手機如遭失竊、刮傷、損毀、缺件或維修，甲方應負損壞賠償責任或維修責任，並負擔相關修繕或賠償金額。','三、甲方借用本手機應在取回送修之維修機時歸還，不得藉故不送還本手機，若甲方領取送修之維修機時未一併送還本手機，乙方有權於甲方交還本手機或賠償本手機前，暫不返還甲方送修之手機予甲方。','四、質權設定與處分：甲方同意簽訂本合約即表示將其送修之維修手機設定質權予乙方，用以擔保本手機之歸還義務。倘若乙方將維修手機維修完畢並依甲方提供之聯絡方式通知甲方二次後，自第二次通知當日起算一個月內，如甲方仍未歸還本手機者，甲方同意由乙方取得甲方送修之維修手機的所有權，且乙方有權逕行出售甲方送修之維修手機，並得就出售所得價金享有優先受償之權，如仍有不足者，乙方得要求甲方補償其差額。','五、雙方如因本契約涉訟，同意以台灣桃園地方法院為第一審管轄法院。'];
function showError(e){$('loading').classList.add('hidden');$('main').classList.add('hidden');$('errorBox').textContent=e;$('errorBox').classList.remove('hidden')}
async function init(){
  if(!token)return showError('QR Token 不存在');
  $('terms').innerHTML=TERMS.map((x,i)=>`<p${i===0?' style="font-weight:900"':''}>${x}</p>`).join('');
  renderSlots();
  $('clearSig').onclick=clearSignature;
  $('previewBtn').onclick=()=>makePreview(false);
  $('finalBtn').onclick=finalize;
  try{
    const r=await API.call('capture-load',{capture_token:token},{noSession:true});
    loan=r.loan;
    for(const p of (r.borrow_photos||[])){
      if(p.signed_url)photos[p.side]={url:p.signed_url,uploaded:true,resumed:true};
    }
    renderLoan();
    renderPhotoPreviews();
    $('loading').classList.add('hidden');
    $('main').classList.remove('hidden');
    // Canvas must be initialized only after #main is visible.
    requestAnimationFrame(()=>requestAnimationFrame(setupSignature));
  }catch(e){
    showError(e.message||'借用資料讀取失敗');
  }
}
function renderLoan(){const d=loan.loaner_devices,s=loan.loaner_stores;$('summary').innerHTML=[["維修單號",loan.repair_order],["門市",s.name],["經辦人",`${loan.employee_name_snapshot}｜${loan.employee_no_snapshot}`],["顧客",loan.customer_name],["電話",loan.customer_phone],["待用機",`${d.model_name}｜${d.capacity}｜${d.color}`],["IMEI",d.imei],["送修商品",loan.repair_device||'—']].map(([a,b])=>`<div class="item"><span>${a}</span><b>${escapeHtml(b)}</b></div>`).join('')}
function renderSlots(){$('photoGrid').innerHTML=sides.map(([k,l])=>`<div class="photo"><label>${l}<span id="tag_${k}" class="oktag"></span></label><input type="file" accept="image/*" capture="environment" data-side="${k}"><div id="prev_${k}" class="preview">尚未拍照</div></div>`).join('');$('photoGrid').querySelectorAll('input').forEach(i=>i.onchange=e=>handleCondition(e,i.dataset.side));$('idGrid').innerHTML=[['front','證件正面'],['back','證件背面']].map(([k,l])=>`<div class="photo"><label>${l} <span class="watermark">自動浮水印</span></label><input type="file" accept="image/*" capture="environment" data-id="${k}"><div id="idprev_${k}" class="preview">尚未拍照</div></div>`).join('');$('idGrid').querySelectorAll('input').forEach(i=>i.onchange=e=>handleId(e,i.dataset.id))}
function renderPhotoPreviews(){for(const [k,v] of Object.entries(photos)){if(v.url){$('prev_'+k).innerHTML=`<img src="${v.url}">`;$('tag_'+k).textContent='✓ 已上傳'}}updateCount()}
function updateCount(){$('photoCount').textContent=`${Object.keys(photos).filter(k=>photos[k]?.uploaded).length} / 6`}
async function source(file){if('createImageBitmap'in window){try{return await createImageBitmap(file,{imageOrientation:'from-image'})}catch{}}const u=URL.createObjectURL(file);return await new Promise((res,rej)=>{const i=new Image();i.onload=()=>{URL.revokeObjectURL(u);res(i)};i.onerror=rej;i.src=u})}
async function compress(file,maxEdge,quality){const img=await source(file),scale=Math.min(1,maxEdge/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);if(img.close)img.close();const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',quality));const url=await blobData(blob);return {blob,url,width:c.width,height:c.height}}
function blobData(b){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(b)})}
async function handleCondition(e,side){const f=e.target.files?.[0];if(!f)return;$('tag_'+side).textContent='上傳中…';try{const im=await compress(f,cfg.pdfPolicy.photoMaxEdge,cfg.pdfPolicy.photoQuality);const u=await API.call('photo-upload-url',{capture_token:token,phase:'borrow',side},{noSession:true});const form=new FormData();form.append('cacheControl','3600');form.append('',im.blob,`${side}.jpg`);const rr=await fetch(u.signed_url,{method:'PUT',headers:{'x-upsert':'true'},body:form});if(!rr.ok)throw new Error('照片 Storage 上傳失敗 '+rr.status);await API.call('photo-register',{capture_token:token,phase:'borrow',side,storage_path:u.path,mime_type:'image/jpeg',file_size_bytes:im.blob.size,width:im.width,height:im.height},{noSession:true});photos[side]={...im,uploaded:true,path:u.path};$('prev_'+side).innerHTML=`<img src="${im.url}">`;$('tag_'+side).textContent='✓ 已上傳';updateCount();maybeAutoSignatureOpen()}catch(err){$('tag_'+side).textContent='✕ 失敗';alert(err.message||err)}}
async function handleId(e,side){const f=e.target.files?.[0];if(!f)return;try{idPhotos[side]=await watermark(f);$('idprev_'+side).innerHTML=`<img src="${idPhotos[side]}">`;maybeAutoSignatureOpen()}catch(err){alert('證件處理失敗：'+(err.message||err))}}
async function watermark(file){const im=await compress(file,cfg.pdfPolicy.idMaxEdge,cfg.pdfPolicy.idQuality),img=await loadImage(im.url),c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);x.save();x.translate(c.width/2,c.height/2);x.rotate(-Math.PI/7);const fs=Math.max(28,Math.round(Math.min(c.width,c.height)*.055));x.font=`900 ${fs}px "Microsoft JhengHei",sans-serif`;x.fillStyle='rgba(180,0,0,.28)';x.textAlign='center';x.textBaseline='middle';for(let yy=-c.height;yy<=c.height;yy+=fs*3.2)for(let xx=-c.width;xx<=c.width;xx+=Math.max(c.width*.68,fs*13))x.fillText(cfg.watermarkText,xx,yy);x.restore();return c.toDataURL('image/jpeg',cfg.pdfPolicy.idQuality)}
function loadImage(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
function isProbablyMobileSignatureDevice(){
  return (navigator.maxTouchPoints||0)>0 || matchMedia?.('(pointer:coarse)')?.matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'');
}
function signatureOrientationState(){
  const landscape=window.innerWidth>window.innerHeight;
  if(!landscape)return {allowed:false,reason:'portrait',angle:null};

  // Desktop keeps mouse testing available; the strict direction gate is for the QR phone/tablet signing flow.
  if(!isProbablyMobileSignatureDevice())return {allowed:true,reason:'desktop-landscape',angle:null};

  const type=String(screen.orientation?.type||'');
  const rawScreen=Number(screen.orientation?.angle);
  const rawWindow=Number(window.orientation);
  let angle=null;
  if(Number.isFinite(rawScreen))angle=((rawScreen%360)+360)%360;
  else if(Number.isFinite(rawWindow))angle=((rawWindow%360)+360)%360;

  // Same fixed direction as the recycle system: landscape-secondary / 270°
  // = rotate the phone counter-clockwise 90°, top/front camera to the left.
  if(type==='landscape-primary'||angle===90)return {allowed:false,reason:'opposite',angle};
  if(type==='landscape-secondary'||angle===270)return {allowed:true,reason:'secondary',angle};

  // Safari/iPad fallback: when primary/secondary is not exposed reliably,
  // accept physical landscape only. Portrait is still always blocked.
  if(landscape&&(angle===null||angle===0))return {allowed:true,reason:'fallback',angle};

  return {allowed:false,reason:'unknown',angle};
}
function updateSignatureOrientationGuard(){
  const wrap=$('signaturePadWrap');
  if(!wrap||!wrap.classList.contains('fullscreen'))return false;
  const st=signatureOrientationState();
  wrap.classList.toggle('orientation-invalid',!st.allowed);
  const complete=$('completeSignatureFullscreenBtn');
  if(complete)complete.disabled=!st.allowed||!sigState.hasInk;
  const guide=$('signatureDirectionGuide');
  if(guide){
    guide.innerHTML=st.allowed
      ? '<b>固定簽名方向 ✓</b><span>請保持手機頂端／前鏡頭朝左，姓名由左往右簽。</span>'
      : '<b>固定簽名方向</b><span>請將手機逆時針旋轉 90°（手機頂端／前鏡頭朝左）後再簽名；直立畫面不可簽名。</span>';
  }
  return st.allowed;
}
function setSignatureDrawingLock(on){
  document.body.classList.toggle('signature-drawing-lock',!!on);
  if(on)document.activeElement?.blur?.();
}
function readyForAutoSignature(){
  return !signatureDrawn &&
    sides.every(([k])=>photos[k]?.uploaded) &&
    !!idPhotos.front && !!idPhotos.back &&
    !!$('idNo').value.trim() &&
    !!$('agree').checked;
}
function cancelPendingAutoSignatureOpen(){
  if(sigState.autoOpenTimer){clearTimeout(sigState.autoOpenTimer);sigState.autoOpenTimer=null}
}
function scheduleAutoSignatureOpen(){
  const wrap=$('signaturePadWrap');
  if(!wrap||wrap.classList.contains('fullscreen')||sigState.suppressAutoOpen||sigState.exiting||!sigState.inView||!readyForAutoSignature())return;
  cancelPendingAutoSignatureOpen();
  let lastW=0,lastH=0,stable=0,attempt=0;
  const tick=()=>{
    sigState.autoOpenTimer=null;
    if(sigState.suppressAutoOpen||sigState.exiting||!sigState.inView||!readyForAutoSignature())return;
    if(!signatureOrientationState().allowed)return;
    const vv=window.visualViewport;
    const w=Math.round(vv?.width||window.innerWidth),h=Math.round(vv?.height||window.innerHeight);
    if(Math.abs(w-lastW)<=2&&Math.abs(h-lastH)<=2)stable++;else{stable=0;lastW=w;lastH=h}
    attempt++;
    if(stable>=2||attempt>=6){enterSignatureFullscreen('auto');return}
    sigState.autoOpenTimer=setTimeout(tick,120);
  };
  sigState.autoOpenTimer=setTimeout(tick,120);
}
function maybeAutoSignatureOpen(){
  const wrap=$('signaturePadWrap');if(!wrap)return;
  if(wrap.classList.contains('fullscreen')){updateSignatureOrientationGuard();return}
  if(signatureOrientationState().allowed&&sigState.inView&&readyForAutoSignature()&&!sigState.suppressAutoOpen)scheduleAutoSignatureOpen();
}
function setupSignature(){
  const c=$('sig'),wrap=$('signaturePadWrap');
  if(!c||!wrap||c.dataset.ready==='1')return;
  c.dataset.ready='1';

  // Stable horizontal master canvas. The visible size changes, the master does not rotate.
  c.width=1200;c.height=360;
  ctx=c.getContext('2d');
  ctx.lineWidth=5;
  ctx.lineCap='round';
  ctx.lineJoin='round';
  ctx.strokeStyle='#12243d';

  const pos=e=>{
    const b=c.getBoundingClientRect();
    return {
      x:(e.clientX-b.left)*(c.width/Math.max(1,b.width)),
      y:(e.clientY-b.top)*(c.height/Math.max(1,b.height))
    };
  };
  const stop=e=>{
    drawing=false;last=null;setSignatureDrawingLock(false);
    try{if(e?.pointerId!=null)c.releasePointerCapture?.(e.pointerId)}catch{}
    updateSignatureOrientationGuard();
  };
  const start=e=>{
    if(!wrap.classList.contains('fullscreen'))return;
    if(!updateSignatureOrientationGuard()){e.preventDefault();return}
    e.preventDefault();e.stopPropagation();
    setSignatureDrawingLock(true);
    sigState.normalizedCanvas=null;
    drawing=true;last=pos(e);signatureDrawn=true;sigState.hasInk=true;
    ctx.beginPath();ctx.arc(last.x,last.y,2.5,0,Math.PI*2);ctx.fillStyle='#12243d';ctx.fill();
    updateSignatureOrientationGuard();
    try{c.setPointerCapture?.(e.pointerId)}catch{}
  };
  const move=e=>{
    if(!wrap.classList.contains('fullscreen')||!drawing)return;
    if(!signatureOrientationState().allowed){stop(e);return}
    e.preventDefault();e.stopPropagation();
    const p=pos(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;
  };

  if('PointerEvent' in window){
    c.addEventListener('pointerdown',start,{passive:false});
    c.addEventListener('pointermove',move,{passive:false});
    c.addEventListener('pointerup',stop,{passive:false});
    c.addEventListener('pointercancel',stop,{passive:false});
    c.addEventListener('lostpointercapture',()=>{drawing=false;setSignatureDrawingLock(false)});
  }else{
    let mouseDown=false;
    c.addEventListener('mousedown',e=>{mouseDown=true;start(e)});
    c.addEventListener('mousemove',e=>{if(mouseDown)move(e)});
    window.addEventListener('mouseup',e=>{if(mouseDown){mouseDown=false;stop(e)}});
    const tp=e=>{const t=e.touches?.[0]||e.changedTouches?.[0];return t?{clientX:t.clientX,clientY:t.clientY,preventDefault:()=>e.preventDefault(),stopPropagation:()=>e.stopPropagation()}:e};
    c.addEventListener('touchstart',e=>start(tp(e)),{passive:false});
    c.addEventListener('touchmove',e=>move(tp(e)),{passive:false});
    c.addEventListener('touchend',e=>stop(tp(e)),{passive:false});
  }

  $('toggleSignatureFullscreen').onclick=()=>enterSignatureFullscreen('manual');
  $('completeSignatureFullscreenBtn').onclick=e=>{e?.stopPropagation?.();completeSignatureFullscreen()};
  $('clearSignatureFullscreenBtn').onclick=e=>{e?.stopPropagation?.();clearSignature()};

  // A manual tap on the normal signing box enters the same full-screen flow.
  wrap.addEventListener('click',e=>{
    if(wrap.classList.contains('fullscreen'))return;
    if(e.target.closest?.('button,input,label,a,select,textarea'))return;
    enterSignatureFullscreen('manual');
  });

  // Only auto-open when the actual signature area is on screen and prior steps are complete.
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      sigState.inView=entries.some(x=>x.isIntersecting&&x.intersectionRatio>=0.25);
      if(sigState.inView)maybeAutoSignatureOpen();else cancelPendingAutoSignatureOpen();
    },{threshold:[0,.25,.5]});
    io.observe(wrap);
  }else sigState.inView=true;

  const sync=()=>{
    if(sigState.exiting)return;
    const st=signatureOrientationState();
    if(!st.allowed&&sigState.suppressAutoOpen)sigState.suppressAutoOpen=false;
    if(wrap.classList.contains('fullscreen'))updateSignatureOrientationGuard();
    else maybeAutoSignatureOpen();
  };
  window.addEventListener('orientationchange',()=>setTimeout(sync,120));
  window.addEventListener('resize',()=>setTimeout(sync,120));
  if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>setTimeout(sync,80));

  $('agree').addEventListener('change',maybeAutoSignatureOpen);
  $('idNo').addEventListener('input',maybeAutoSignatureOpen);
}
function enterSignatureFullscreen(mode='manual'){
  const wrap=$('signaturePadWrap');if(!wrap||wrap.classList.contains('fullscreen'))return;
  sigState.exiting=false;sigState.fullscreen=true;sigState.returnScrollY=window.scrollY||0;
  wrap.classList.add('fullscreen');
  document.body.style.overflow='hidden';
  updateSignatureOrientationGuard();
  requestAnimationFrame(()=>updateSignatureOrientationGuard());
  setTimeout(()=>updateSignatureOrientationGuard(),180);
}
function completeSignatureFullscreen(){
  const wrap=$('signaturePadWrap');if(!wrap?.classList.contains('fullscreen'))return;
  if(!updateSignatureOrientationGuard()||!sigState.hasInk)return;
  const frozen=document.createElement('canvas');frozen.width=$('sig').width;frozen.height=$('sig').height;
  frozen.getContext('2d').drawImage($('sig'),0,0);
  sigState.normalizedCanvas=frozen;signatureDrawn=true;sigState.suppressAutoOpen=true;
  exitSignatureFullscreen();
}
function exitSignatureFullscreen(){
  const wrap=$('signaturePadWrap');if(!wrap?.classList.contains('fullscreen'))return;
  sigState.exiting=true;drawing=false;last=null;setSignatureDrawingLock(false);
  wrap.classList.remove('fullscreen','orientation-invalid');
  document.body.style.overflow='';
  sigState.fullscreen=false;
  const y=sigState.returnScrollY||0;
  requestAnimationFrame(()=>{try{window.scrollTo(0,y)}catch{}});
  setTimeout(()=>{sigState.exiting=false},180);
}
function clearSignature(){
  const c=$('sig');if(ctx){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,c.width,c.height);ctx.restore()}
  signatureDrawn=false;sigState.hasInk=false;sigState.normalizedCanvas=null;
  updateSignatureOrientationGuard();
}
function sigData(){
  return (sigState.normalizedCanvas||$('sig')).toDataURL('image/png');
}
function complete(){return sides.every(([k])=>photos[k]?.uploaded)&&idPhotos.front&&idPhotos.back&&$('idNo').value.trim()&&$('agree').checked&&signatureDrawn}
async function makePreview(silent){if(!complete()){if(!silent)alert('請先完成 6 面照片、證件正反面、完整證件號碼、條款同意與電子簽名');return null}setProgress(20,'正在產生正式 P1＋P2…');const pages=await R.renderBorrowPages({loan,idNo:$('idNo').value.trim(),idFront:idPhotos.front,idBack:idPhotos.back,signature:sigData(),borrowPhotos:Object.fromEntries(sides.map(([k])=>[k,photos[k].url])),borrowNote:$('borrowNote').value.trim(),signedAt:new Date().toLocaleString('zh-TW',{hour12:false}),logoUrl:'assets/company-logo.png',p1Target:cfg.pdfPolicy.p1TargetBytes,p2Target:cfg.pdfPolicy.p2TargetBytes});$('p1Prev').src=pages.page1;$('p2Prev').src=pages.page2;$('preview').classList.remove('hidden');setProgress(45,'P1＋P2 已產生，可進行最後確認');return pages}
async function sha256(s){const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function maskId(v){v=String(v||'');return v.length<5?v:v.slice(0,2)+'*'.repeat(Math.max(1,v.length-4))+v.slice(-2)}
async function finalize(){if(busy)return;busy=true;$('finalBtn').disabled=true;$('previewBtn').disabled=true;try{let pages=await makePreview(true);if(!pages)throw new Error('借出資料尚未完整');setProgress(60,'正在建立借出 PDF 並歸檔 Google Drive…');const signature=sigData();const r=await API.call('finalize-borrow',{capture_token:token,page1_jpeg:pages.page1,page2_jpeg:pages.page2,id_no_masked:maskId($('idNo').value.trim()),signature_sha256:await sha256(signature),borrow_note:$('borrowNote').value.trim()},{noSession:true});setProgress(100,'借出成立');$('done').innerHTML=`<b>✅ 借出成立</b><br>${escapeHtml(r.filename)}<br>PDF ${(r.pdf_size_bytes/1024/1024).toFixed(2)} MB${r.drive_url?`<br><a href="${r.drive_url}" target="_blank" rel="noopener">查看 Google Drive PDF</a>`:''}`;$('done').classList.remove('hidden');$('finalBtn').classList.add('hidden');$('previewBtn').classList.add('hidden');$('idNo').value='';idPhotos={};clearSignature();document.querySelectorAll('#idGrid input').forEach(x=>x.value='')}catch(e){setProgress(0,'');alert(e.message||'確認借出失敗');$('finalBtn').disabled=false;$('previewBtn').disabled=false}finally{busy=false}}
function setProgress(n,t){$('bar').style.width=n+'%';$('statusText').textContent=t||''}function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]))}
window.addEventListener('DOMContentLoaded',init);
})();
