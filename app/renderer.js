(() => {
const TERMS=[
'一、本手機借用前機況圖、借用期間詳如下方所載，甲方簽妥本契約後，視為本手機交付與驗收完畢。惟本手機之所有權仍歸屬乙方，本契約僅係將本手機在甲方送修維修手機期間提供甲方使用，甲方不擁有其他任何權利。在借用期間內，未經乙方事前核准甲方不得將本手機拆解或更換其零件、交予第三人使用或有出售、出租等處分行為，否則應賠償乙方因此所受之一切損害及損失。',
'二、本手機借用方式：借用期限自甲方送修手機開始到甲方領取維修手機為止，若需借用本手機須先付清手機維修費用，乙方不另收取本手機額外租借費用。甲方應盡善良管理人之注意義務妥善保管本手機，本手機如遭失竊、刮傷、損毀、缺件或維修，甲方應負損壞賠償責任或維修責任，並負擔相關修繕或賠償金額。',
'三、甲方借用本手機應在取回送修之維修機時歸還，不得藉故不送還本手機，若甲方領取送修之維修機時未一併送還本手機，乙方有權於甲方交還本手機或賠償本手機前，暫不返還甲方送修之手機予甲方。',
'四、質權設定與處分：甲方同意簽訂本合約即表示將其送修之維修手機設定質權予乙方，用以擔保本手機之歸還義務。倘若乙方將維修手機維修完畢並依甲方提供之聯絡方式通知甲方二次後，自第二次通知當日起算一個月內，如甲方仍未歸還本手機者，甲方同意由乙方取得甲方送修之維修手機的所有權，且乙方有權逕行出售甲方送修之維修手機，並得就出售所得價金享有優先受償之權，如仍有不足者，乙方得要求甲方補償其差額。',
'五、雙方如因本契約涉訟，同意以台灣桃園地方法院為第一審管轄法院。'
];
const FONT='"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
function canvas(){const c=document.createElement('canvas');c.width=1240;c.height=1754;return c}
function rect(ctx,x,y,w,h,fill='#fff',stroke='#d5dde8',r=10){ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();ctx.restore()}
function text(ctx,t,x,y,size=22,weight=400,color='#203148',align='left'){ctx.save();ctx.font=`${weight} ${size}px ${FONT}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='top';ctx.fillText(String(t??''),x,y);ctx.restore()}
function wrap(ctx,t,x,y,maxW,size=18,lineH=27,weight=400,color='#2f4055',maxLines=99){ctx.save();ctx.font=`${weight} ${size}px ${FONT}`;ctx.fillStyle=color;ctx.textBaseline='top';let line='',lines=0;for(const ch of String(t??'')){const test=line+ch;if(ctx.measureText(test).width>maxW&&line){ctx.fillText(line,x,y+lines*lineH);line=ch;lines++;if(lines>=maxLines){ctx.restore();return y+lines*lineH}}else line=test}if(line&&lines<maxLines){ctx.fillText(line,x,y+lines*lineH);lines++}ctx.restore();return y+lines*lineH}
function field(ctx,label,value,x,y,w){text(ctx,label,x,y,16,800,'#607087');wrap(ctx,value||'—',x,y+24,w,20,28,700,'#1d2a3a',2)}
function sectionTitle(ctx,t,y){ctx.fillStyle='#0f2747';ctx.fillRect(48,y,7,32);text(ctx,t,68,y-1,23,900,'#0f2747');return y+44}
function load(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
function contain(ctx,img,x,y,w,h,bg='#fff'){ctx.save();ctx.fillStyle=bg;ctx.fillRect(x,y,w,h);const s=Math.min(w/img.width,h/img.height),dw=img.width*s,dh=img.height*s;ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore()}
async function toTarget(c,target,qStart=.84){let q=qStart,b;for(let i=0;i<6;i++){b=await new Promise(r=>c.toBlob(r,'image/jpeg',q));if(!b)throw new Error('JPEG_ENCODE_FAILED');if(b.size<=target||q<=.58)break;q-=.05}return await blobDataUrl(b)}
function blobDataUrl(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob)})}
async function renderBorrowPages(o){const logo=await load(o.logoUrl),idf=await load(o.idFront),idb=await load(o.idBack),sig=await load(o.signature);const photos={};for(const [k,v] of Object.entries(o.borrowPhotos))photos[k]=await load(v);
// P1
let c=canvas(),ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#0f2747';ctx.lineWidth=5;ctx.strokeRect(28,28,1184,1698);contain(ctx,logo,48,48,100,72);text(ctx,'創・宇・通・訊　手機借用合約書',620,54,34,900,'#0f2747','center');text(ctx,'電子借用文件｜P1',1160,61,17,800,'#607087','right');text(ctx,`維修單號：${o.loan.repair_order}`,48,136,21,900);text(ctx,`門市：${o.loan.loaner_stores.name}`,460,136,20,800);text(ctx,`經辦：${o.loan.employee_name_snapshot}｜${o.loan.employee_no_snapshot}`,820,136,20,800);
let y=190;rect(ctx,48,y,1144,150,'#f8fbff');field(ctx,'甲方／借用人',o.loan.customer_name,72,y+22,240);field(ctx,'證件類型',o.loan.id_type,330,y+22,160);field(ctx,'證件字號',o.idNo,510,y+22,270);field(ctx,'電話',o.loan.customer_phone,805,y+22,320);field(ctx,'地址',o.loan.customer_address,72,y+84,1050);y+=174;
rect(ctx,48,y,1144,135,'#f8fbff');const d=o.loan.loaner_devices;field(ctx,'待用機',`${d.brand} ${d.model_name}`,72,y+18,350);field(ctx,'容量',d.capacity,445,y+18,150);field(ctx,'顏色',d.color,615,y+18,150);field(ctx,'等級',d.grade,785,y+18,120);field(ctx,'IMEI',d.imei,925,y+18,230);field(ctx,'送修商品',o.loan.repair_device||'—',72,y+76,310);field(ctx,'送修 IMEI/SN',o.loan.repair_sn||'—',405,y+76,310);field(ctx,'送修原因',o.loan.repair_reason||'—',740,y+76,400);y+=160;
y=sectionTitle(ctx,'契約條款',y);text(ctx,'本契約條款已於簽立前經出借人（乙方）逐條向借用人（甲方）說明，並經甲方審閱完成。雙方謹簽訂本契約條款如下，以憑信守。',60,y,17,800,'#2c3d52');y+=45;for(const t of TERMS){y=wrap(ctx,t,60,y,1120,16,23,400,'#33475e',8)+9}
y=sectionTitle(ctx,'證件正反面（已加浮水印）',Math.max(y+4,1015));rect(ctx,55,y,545,250,'#fff');rect(ctx,640,y,545,250,'#fff');contain(ctx,idf,65,y+10,525,230);contain(ctx,idb,650,y+10,525,230);text(ctx,'證件正面',327,y+220,16,800,'#607087','center');text(ctx,'證件背面',912,y+220,16,800,'#607087','center');y+=275;
y=sectionTitle(ctx,'電子簽名',y);rect(ctx,55,y,650,180,'#fff');contain(ctx,sig,70,y+15,620,145);field(ctx,'簽署時間',o.signedAt,740,y+20,390);field(ctx,'乙方', '創宇數位科技有限公司｜統一編號 25166891',740,y+80,390);text(ctx,'本文件以登入經辦人、簽署時間、PDF SHA-256 與 Google Drive File ID 作為電子留存資訊。',60,1682,15,700,'#68778a');
const p1=await toTarget(c,o.p1Target||1500*1024,.84);
// P2
c=canvas();ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#0f2747';ctx.lineWidth=5;ctx.strokeRect(28,28,1184,1698);contain(ctx,logo,48,48,90,65);text(ctx,'借出前 6 面機況照片',620,55,34,900,'#0f2747','center');text(ctx,'P2',1160,61,18,900,'#607087','right');text(ctx,`${o.loan.repair_order}｜${o.loan.loaner_stores.name}｜${d.model_name}｜${d.imei}`,60,135,19,800,'#33475e');const labels={front:'正面',back:'背面',left:'左側',right:'右側',top:'上方',bottom:'下方'},order=['front','back','left','right','top','bottom'];let top=185,cellW=540,cellH=390,gapX=50,gapY=24;for(let i=0;i<6;i++){const col=i%2,row=Math.floor(i/2),x=55+col*(cellW+gapX),yy=top+row*(cellH+gapY);rect(ctx,x,yy,cellW,cellH,'#fafcff');text(ctx,labels[order[i]],x+18,yy+14,20,900,'#0f2747');contain(ctx,photos[order[i]],x+15,yy+48,cellW-30,cellH-65,'#fff')}
let ny=top+3*(cellH+gapY)+2;ny=sectionTitle(ctx,'借出前機況備註',ny);rect(ctx,55,ny,1130,150,'#fbfcfe');wrap(ctx,o.borrowNote||'無',75,ny+25,1090,19,30,500,'#31445c',4);text(ctx,`拍攝面向：正面、背面、左側、右側、上方、下方｜共 6 / 6 張｜借出確認：${o.signedAt}`,60,1682,15,700,'#68778a');const p2=await toTarget(c,o.p2Target||2400*1024,.78);return {page1:p1,page2:p2};}
window.RepairLoanRenderer={renderBorrowPages};
})();
