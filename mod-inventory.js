/* =====================================================================
   مديول المخازن: الأصناف، المخازن، الأرصدة، الاستلام (GRN) من المشتريات،
   طلبات وأذون الصرف، التحويل بين المخازن، الجرد، الرصيد الافتتاحي، فحص السلامة
   ===================================================================== */
(()=>{
const IV=()=>D.inv||{role:'none',cost:false,wh:[],items:[],stock:[],docs:[],pos:[]};
const itm=id=>IV().items.find(i=>i.id==id)||D.catalog.find(i=>i.id==id)||{};
const whn=id=>(IV().wh.find(w=>w.id==id)||{}).name||'—';
const iname=id=>{const i=itm(id);return i.code?i.code+' · '+i.name:'—'};
const unit=id=>itm(id).unit||'';
const isM=()=>iis('admin','manager')||is('admin');
const ro=()=>iis('admin','manager','storekeeper')||is('admin');   // يستطيع تنفيذ حركات
const roleOf=()=>is('admin')?'admin':ir();
const actWh=()=>IV().wh.filter(w=>w.active);
const DT={REQ:'طلب صرف',ISS:'إذن صرف',GRN:'إذن استلام',TRF:'تحويل مخزني',CNT:'جرد',OPN:'رصيد افتتاحي',DNI:'استلام تبرع عيني'};
const docs=t=>IV().docs.filter(d=>d.type==t);
const vdoc=id=>IV().docs.find(d=>d.id==id);
const stk=(wh,item)=>{let q=0;IV().stock.forEach(s=>{if(s.item==item&&(!wh||s.wh==wh))q+=s.q});return Math.round(q*1000)/1000};
const dl=(t,d)=>d.map(x=>x);

MODS.inv={title:'المخازن',has:()=>D.user.mods.inv,nav:()=>{
  const r=roleOf();
  if(r=='requester')return[['i_dash','لوحة التحكم'],['i_req','طلبات الصرف']];
  const N=[['i_dash','لوحة التحكم'],['i_stock','الأرصدة'],['i_req','طلبات الصرف'],['i_grn','الاستلام'],['i_iss','الصرف'],['i_trf','التحويلات'],['i_cnt','الجرد'],['i_items','الأصناف']];
  if(r=='admin'||r=='manager')N.push(['i_wh','المخازن']);
  return N;
}};

/* ---------- محرر البنود العام ---------- */
// mode: q = صنف + كمية | cnt = صنف + رصيد دفتري + كمية فعلية | opn = صنف + كمية + تكلفة الوحدة
const iopts=s=>'<option value="">— اختر الصنف —</option>'+IV().items.filter(i=>i.active||i.id==s).map(i=>`<option value="${esc(i.id)}"${i.id==s?' selected':''}>${esc(i.code)} · ${esc(i.name)}</option>`).join('');
const lrow=(mode,x={})=>{const sel=`<select class="li" style="min-width:200px">${iopts(x.item)}</select>`,
  qi=`<input class="lq" type="number" min="0" step="any" value="${x.q??x.cnt??''}" style="width:90px">`;
  let cells=`<td>${sel}<div class="sub av"></div></td><td class="un">${esc(unit(x.item))}</td>`;
  if(mode=='cnt')cells+=`<td class="sy">—</td><td>${qi}</td>`;
  else if(mode=='opn')cells+=`<td>${qi}</td><td><input class="lc" type="number" min="0" step="any" value="${x.c??''}" style="width:100px"></td>`;
  else cells+=`<td>${qi}</td>`;
  return `<tr>${cells}<td><button type="button" class="b s r" onclick="this.closest('tr').remove()">✕</button></td></tr>`};
const lhead={q:['الصنف','الوحدة','الكمية'],cnt:['الصنف','الوحدة','الرصيد الدفتري','الكمية الفعلية'],opn:['الصنف','الوحدة','الكمية','تكلفة الوحدة']};
const led=(mode,rows)=>`<div class="full" style="overflow-x:auto"><table id="le" data-mode="${mode}"><thead><tr>${lhead[mode].map(h=>`<th>${h}</th>`).join('')}<th></th></tr></thead><tbody>${(rows&&rows.length?rows:[{}]).map(x=>lrow(mode,x)).join('')}</tbody></table><button type="button" class="b o s" style="margin-top:6px" onclick="ladd()">+ إضافة صنف</button></div>`;
window.ladd=()=>{const m=$('#le').dataset.mode;$('#le tbody').insertAdjacentHTML('beforeend',lrow(m));icalc()};
const lget=()=>{const m=$('#le').dataset.mode;return $$('#le tbody tr').map(r=>({item:r.querySelector('.li').value,q:r.querySelector('.lq').value,c:(r.querySelector('.lc')||{}).value,cnt:r.querySelector('.lq').value})).filter(x=>x.item||x.q!=='')};
// عرض المتاح/الرصيد الدفتري حسب المخزن المختار في نفس النافذة
window.icalc=()=>{const t=$('#le');if(!t)return;const m=t.dataset.mode,w=($('#m [name=wh]')||{}).value;
  t.querySelectorAll('tbody tr').forEach(r=>{const id=r.querySelector('.li').value;r.querySelector('.un').textContent=unit(id);
    const av=r.querySelector('.av'),sy=r.querySelector('.sy');
    if(sy)sy.textContent=id&&w?q3(stk(w,id)):'—';
    if(av)av.textContent=!id?'':(m=='q'&&iis('requester')&&!is('admin')?'المتاح بالمخازن: '+q3(D.avail[id]||0):(w?'المتاح بالمخزن: '+q3(stk(w,id)):'المتاح بالمخازن: '+q3(D.avail[id]||0)))});
};
const prevHook=mdlHook;mdlHook=()=>{prevHook&&prevHook();icalc()};
dlg.addEventListener('change',e=>{const t=e.target;if(!t||!t.matches)return;
  if(t.matches('#le .li,#m [name=wh]'))icalc();
  if(t.name=='poId')A.grnFill();
});
const lines=(it,mode)=>{
  const cost=IV().cost,h=['م','الصنف','الوحدة'];
  if(mode=='cnt')h.push('الدفتري','الفعلي','الفرق');else if(mode=='grn')h.push('البيان','الكمية','المعامل');else h.push('الكمية');
  if(cost&&mode!='cnt'&&mode!='req')h.push(mode=='opn'?'تكلفة الوحدة':'القيمة');if(cost&&mode=='cnt')h.push('قيمة التسوية');
  return tbl(h,it.map((x,n)=>{
    if(mode=='grn'){const r=[n+1,x.ns?'<small class="mu">خدمة / غير مخزني</small>':esc(iname(x.item)),esc(x.ns?x.u:unit(x.item)),esc(x.d),q3(x.q),x.ns?'—':q3(x.cf)];if(cost)r.push(f(x.v));return r}
    if(mode=='cnt'){const r=[n+1,esc(iname(x.item)),esc(unit(x.item)),q3(x.sys),q3(x.cnt),x.delta==null?'—':q3(x.delta)];if(cost)r.push(x.v==null?'—':f(x.v));return r}
    const r=[n+1,esc(iname(x.item)),esc(unit(x.item)),q3(x.q)];
    if(mode=='req'){const g=x.i;if(g!=null)r.push(q3(g))}
    if(cost&&mode=='opn')r.push(f(x.c));else if(cost&&mode!='req')r.push(x.v==null?'—':f(x.v));
    return r}));
};

/* ---------- لوحة التحكم ---------- */
const lowItems=()=>IV().items.filter(i=>i.active&&i.min>0&&stk('',i.id)<=i.min);
V.i_dash=()=>{const r=roleOf(),d=IV().docs,n=(t,s)=>d.filter(x=>x.type==t&&x.st==s).length;
  if(r=='requester'){const m=d.filter(x=>x.type=='REQ');
    return `<div class="cards">${[['إجمالي طلباتي',m.length],['قيد الاعتماد',m.filter(x=>x.st=='جديد').length],['جاهزة / قيد الصرف',m.filter(x=>['معتمد','مصروف جزئيًا'].includes(x.st)).length],['تم صرفها',m.filter(x=>x.st=='مصروف').length]].map(c=>`<div class="card"><small>${c[0]}</small><h2>${c[1]}</h2></div>`).join('')}</div><div class="box"><h3>آخر طلباتي</h3>${tbl(['الرقم','التاريخ','الجهة','الحالة'],m.slice(0,6).map(x=>[x.no,x.date,esc(x.party),st(x.st)]))}</div>`}
  const val=IV().stock.reduce((s,x)=>s+(x.v||0),0),low=lowItems();
  const cd=[['أصناف نشطة',IV().items.filter(i=>i.active).length],['أصناف تحت الحد الأدنى',low.length]];
  if(IV().cost)cd.push(['قيمة المخزون (ج.م)',f(val)]);
  if(isM())cd.push(['طلبات صرف بانتظار الاعتماد',n('REQ','جديد')],['جرد بانتظار الاعتماد',n('CNT','مقدم')]);
  cd.push(['طلبات جاهزة للصرف',n('REQ','معتمد')+n('REQ','مصروف جزئيًا')],['أوامر توريد بانتظار الاستلام',IV().pos.length],['تحويلات في الطريق',n('TRF','مرسل')]);
  return `<div class="cards">${cd.map(c=>`<div class="card"><small>${c[0]}</small><h2>${c[1]}</h2></div>`).join('')}</div>`+
  `<div class="box"><h3>أصناف تحت الحد الأدنى</h3>${tbl(['الكود','الصنف','الرصيد','الحد الأدنى'],low.map(i=>[esc(i.code),esc(i.name),q3(stk('',i.id))+' '+esc(i.unit),q3(i.min)]))}</div>`+
  `<div class="box"><h3>آخر الحركات</h3>${tbl(['المستند','النوع','التاريخ','المخزن','الحالة'],d.filter(x=>x.type!='REQ').slice(0,8).map(x=>[x.no,DT[x.type],x.date,esc(whn(x.wh)),st(x.st)]))}</div>`};

/* ---------- الأرصدة ---------- */
let swf='';
V.i_stock=()=>{const cost=IV().cost,h=['الكود','الصنف','الوحدة','الرصيد','الحد الأدنى','الحالة'];if(cost)h.push('متوسط التكلفة','القيمة');h.push('');
  const wopt='<option value="">كل المخازن</option>'+IV().wh.map(w=>`<option value="${esc(w.id)}"${w.id==swf?' selected':''}>${esc(w.name)}</option>`).join('');
  const rows=IV().items.filter(i=>i.active||stk(swf,i.id)).map(i=>{const q=stk(swf,i.id);let v=0;IV().stock.forEach(s=>{if(s.item==i.id&&(!swf||s.wh==swf))v+=s.v||0});
    const low=i.min>0&&q<=i.min,r=[esc(i.code),esc(i.name),esc(i.unit),q3(q),q3(i.min),low?'<span class="st" style="background:#fde2e2;color:#a11">تحت الحد</span>':'<span class="st">طبيعي</span>'];
    if(cost)r.push(q>0?f(v/q):'—',f(v));r.push(btn('card',i.id,'بطاقة الصنف','o'));return r});
  return head('أرصدة المخازن','',' ',`<select class="sel-sm" onchange="swf_(this.value)">${wopt}</select>`)+`<div class="box">${tbl(h,rows)}</div>`};
window.swf_=v=>{swf=v;render()};
A.card=async i=>{try{const j=await api('stockCard',{item:i,wh:swf||undefined}),cost=IV().cost;
  mdl('بطاقة الصنف: '+j.item.code+' · '+j.item.name+(swf?' — '+whn(swf):''),`<div class="full" style="overflow-x:auto">${tbl(['التاريخ','النوع','المستند','المخزن','الكمية','الرصيد'].concat(cost?['القيمة','قيمة الرصيد']:[]),j.rows.map(r=>[r.date,esc(r.type),esc(r.docNo),esc(whn(r.wh)),q3(r.qty),q3(r.bq)].concat(cost?[f(r.value),f(r.bv)]:[])))}</div>`,null)}catch(e){toast(e.message,1)}};

/* ---------- عرض مستند + طباعة + عكس ---------- */
const hdr=d=>kv('الرقم',d.no)+kv('النوع',DT[d.type])+kv('الحالة',d.st)+kv('التاريخ',d.date)+(d.wh?kv(d.type=='TRF'?'من مخزن':'المخزن',whn(d.wh)):'')+(d.wh2?kv('إلى مخزن',whn(d.wh2)):'')+(d.refNo?kv('المرجع',d.refNo):'')+(d.party?kv(d.type=='GRN'?'المورد':'الجهة / المستلم',d.party):'')+(d.proj?kv('المشروع',pjl(d.proj)):'')+(d.dn?kv('رقم إذن التسليم',d.dn):'')+kv('أعدّه',d.byName)+(d.actBy?kv('آخر إجراء بواسطة',d.actBy):'')+(d.reason?kv('السبب / الملاحظة',d.reason):'')+(d.rev?kv('العكس',String(d.rev).split('|').slice(1).join(' — ')):'');
A.vd=i=>{const d=vdoc(i),m={REQ:'req',ISS:'iss',GRN:'grn',TRF:'trf',CNT:'cnt',OPN:'opn',DNI:'opn'}[d.type];
  const it=d.type=='REQ'?d.items.map((x,n)=>Object.assign({},x,{i:(d.iss||[])[n]||0})):d.items;
  mdl(DT[d.type]+' '+d.no,hdr(d)+`<div class="full" style="overflow-x:auto">${lines(it,m=='req'?'req':m)}${d.type=='REQ'?'<p class="mu">آخر عمود: الكمية المصروفة حتى الآن</p>':''}</div>`+(d.note?`<div class="full"><label>ملاحظات</label>${esc(d.note)}</div>`:''),null)};
A.pd=(i,x)=>{const d=vdoc(i),m={ISS:'iss',GRN:'grn',TRF:'trf',REQ:'req',CNT:'cnt',OPN:'opn',DNI:'opn'}[d.type],cost=IV().cost;
  const it=d.type=='REQ'?d.items.map((x,n)=>Object.assign({},x,{i:(d.iss||[])[n]||0})):d.items;
  const P=(l,t)=>t?`<p><b>${l}:</b> ${esc(t)}</p>`:'';
  docOut(printHead(DT[d.type])+`<div class="g"><div>${P('الرقم',d.no)+P('التاريخ',d.date)+P('الحالة',d.st)}</div><div>${P(d.type=='TRF'?'من مخزن':'المخزن',d.wh?whn(d.wh):'')+P('إلى مخزن',d.wh2?whn(d.wh2):'')}</div><div>${P('المرجع',d.refNo)+P(d.type=='GRN'?'المورد':'الجهة / المستلم',d.party)}</div><div>${P('المشروع',pjl(d.proj))+P('رقم إذن التسليم',d.dn)}</div></div>`+lines(it,m)+(d.note?`<p><b>ملاحظات:</b> ${esc(d.note)}</p>`:'')+`<div class="sg"><div>أعدّه<br>${esc(d.byName)}</div><div>أمين المخزن</div><div>المستلم / المعتمد</div></div>`+printFoot(),DT[d.type]+' '+d.no,x)};
A.pdx=i=>A.pd(i,1);
A.rev=i=>{const d=vdoc(i);mdl('عكس '+DT[d.type]+' '+d.no,`<div class="full mu">يُنشئ حركة عكسية في دفتر المخزون (لا يحذف المستند الأصلي) ويعيد حالة ${d.type=='GRN'?'أمر التوريد':'طلب الصرف'}.</div>`+fld('سبب العكس (إلزامي)','reason','','ta','full'),()=>{const r=rd().reason.trim();if(!r){toast('اكتب سبب العكس',1);return false}return run('reverseDoc',{id:i,reason:r},'تم عكس المستند')},'تأكيد العكس')};
const rvBtn=d=>isM()&&d.st=='مرحّل'?btn('rev',d.id,'عكس','r'):'';

/* ---------- طلبات الصرف ---------- */
V.i_req=()=>{const me=D.user.username,can=['admin','manager','storekeeper','requester'].includes(roleOf());
  return head('طلبات الصرف',can?'nreq':'','+ طلب صرف جديد')+`<div class="box">${tbl(['الرقم','التاريخ','الطالب','الجهة','المشروع','الحالة','إجراءات'],docs('REQ').map(x=>{const own=x.by==me;let b=btn('vd',x.id,'عرض','o');
    if(x.st=='جديد'&&isM()&&(!own||is('admin')))b+=btn('rok',x.id,'اعتماد')+btn('rrj',x.id,'رفض','r');
    if((own||is('admin'))&&['جديد','مرفوض'].includes(x.st))b+=btn('nreq',x.id,x.st=='مرفوض'?'تعديل وإعادة إرسال':'تعديل','o');
    if(['معتمد','مصروف جزئيًا'].includes(x.st)&&ro())b+=btn('iss',x.id,'صرف','g');
    if(x.st=='جديد'||x.st=='مرفوض'){if(own||isM())b+=btn('rcn',x.id,'إلغاء','o')}else if(x.st=='معتمد'&&isM())b+=btn('rcn',x.id,'إلغاء','o');
    return[x.no,x.date,esc(x.byName),esc(x.party),esc(pjl(x.proj)),st(x.st)+(x.st=='مرفوض'&&x.reason?`<br><small class="mu">${esc(x.reason)}</small>`:''),b]}))}</div>`};
A.nreq=i=>{const x=i?vdoc(i):{items:[],date:today()};mdl(i?'تعديل طلب صرف':'طلب صرف جديد',fld('الجهة / القسم الطالب','dept',x.party)+fld('التاريخ','date',x.date,'date')+psl('المشروع / البرنامج',x.proj,'full')+led('q',x.items)+fld('ملاحظات','note',x.note,'ta','full'),()=>{const o=rd(),it=lget().filter(z=>z.item||z.q!=='');
  if(!o.dept.trim()||!it.length){toast('أدخل الجهة وصنفًا واحدًا على الأقل',1);return false}if(it.some(z=>!z.item||!(+z.q>0))){toast('اختر الصنف وأدخل كمية أكبر من صفر لكل بند',1);return false}
  return run('saveReq',{...o,items:it.map(z=>({item:z.item,q:+z.q})),id:i||undefined,ver:x.ver},'تم حفظ الطلب')})};
A.rok=i=>{if(confirm('اعتماد طلب الصرف؟'))run('decideReq',{id:i,ver:vdoc(i).ver,decision:'معتمد'},'تم اعتماد الطلب')};
A.rrj=i=>mdl('رفض طلب الصرف '+vdoc(i).no,fld('سبب الرفض (إلزامي)','reason','','ta','full'),()=>{const r=rd().reason.trim();if(!r){toast('اكتب سبب الرفض',1);return false}return run('decideReq',{id:i,ver:vdoc(i).ver,decision:'مرفوض',reason:r},'تم رفض الطلب')},'تأكيد الرفض');
A.rcn=i=>{if(confirm('تأكيد إلغاء طلب الصرف؟'))run('cancelReq',{id:i,ver:vdoc(i).ver},'تم إلغاء الطلب')};

/* ---------- الصرف (ISS) ---------- */
V.i_iss=()=>head('أذون الصرف',isM()?'diss':'',' + صرف مباشر (بدون طلب)')+`<div class="box">${tbl(['الرقم','التاريخ','المخزن','الطلب','المستلم / الجهة','الحالة','إجراءات'],docs('ISS').map(x=>[x.no,x.date,esc(whn(x.wh)),esc(x.refNo),esc(x.party),st(x.st),btn('vd',x.id,'عرض','o')+btn('pd',x.id,'طباعة','g')+btn('pdx',x.id,'Excel','g')+rvBtn(x)]))}</div>`;
const whSel=(v)=>sel('المخزن','wh',actWh().filter(w=>iis('admin','manager')||is('admin')||(D.user.wh||[]).includes('*')||(D.user.wh||[]).includes(w.id)).map(w=>[w.id,w.name]),v);
A.iss=i=>{const r=vdoc(i),rem=r.items.map((x,n)=>({item:x.item,rem:Math.round((x.q-((r.iss||[])[n]||0))*1000)/1000})).filter(x=>x.rem>0);
  mdl('صرف على الطلب '+r.no,`<div class="full mu">الجهة: ${esc(r.party)} — يتم تحديد الكمية المصروفة لكل صنف (الافتراضي = المتبقي من الطلب).</div>`+whSel()+fld('التاريخ','date',today(),'date')+fld('المستلم (اختياري)','party',r.party)+
  `<div class="full" style="overflow-x:auto"><table id="le" data-mode="iss"><thead><tr><th>الصنف</th><th>الوحدة</th><th>المتبقي بالطلب</th><th>الكمية المصروفة</th></tr></thead><tbody>${rem.map(x=>`<tr data-i="${esc(x.item)}"><td>${esc(iname(x.item))}<input class="li" type="hidden" value="${esc(x.item)}"><div class="sub av"></div></td><td class="un">${esc(unit(x.item))}</td><td>${q3(x.rem)}</td><td><input class="lq" type="number" min="0" step="any" value="${x.rem}" style="width:90px"></td></tr>`).join('')}</tbody></table></div>`+fld('ملاحظات','note','','ta','full'),()=>{const o=rd(),it=$$('#le tbody tr').map(t=>({item:t.dataset.i,q:+t.querySelector('.lq').value||0})).filter(x=>x.q>0);
    if(!o.wh){toast('اختر المخزن',1);return false}if(!it.length){toast('أدخل كمية لصنف واحد على الأقل',1);return false}
    return run('postIssue',{reqId:i,wh:o.wh,date:o.date,party:o.party,note:o.note,items:it},'تم ترحيل إذن الصرف')},'ترحيل الصرف')};
A.diss=()=>mdl('صرف مباشر بدون طلب (مدير المخازن)',`<div class="full mu">استثناء: يتطلب المستلم وسبب الصرف.</div>`+whSel()+fld('التاريخ','date',today(),'date')+fld('المستلم / الجهة','party')+psl('المشروع','')+led('q',[])+fld('سبب الصرف المباشر (إلزامي)','note','','ta','full'),()=>{const o=rd(),it=lget();
  if(!o.wh||!o.party.trim()||!o.note.trim()){toast('اختر المخزن واكتب المستلم وسبب الصرف',1);return false}if(!it.length||it.some(z=>!z.item||!(+z.q>0))){toast('أضف أصنافًا بكميات أكبر من صفر',1);return false}
  return run('postIssue',{...o,items:it.map(z=>({item:z.item,q:+z.q}))},'تم ترحيل إذن الصرف')},'ترحيل الصرف');

/* ---------- الاستلام (GRN) ---------- */
V.i_grn=()=>head('الاستلام المخزني',ro()?'ngrn':'','+ استلام من أمر توريد')+`<div class="box">${tbl(['الرقم','التاريخ','المخزن','أمر التوريد','المورد','إذن التسليم','الحالة','إجراءات'],docs('GRN').map(x=>[x.no,x.date,esc(whn(x.wh)),esc(x.refNo),esc(x.party),esc(x.dn),st(x.st),btn('vd',x.id,'عرض','o')+btn('pd',x.id,'طباعة','g')+btn('pdx',x.id,'Excel','g')+rvBtn(x)]))}</div>`+(docs('DNI').length?`<div class="box"><h3>استلام تبرعات عينية (من مديول التبرعات)</h3>${tbl(['الرقم','التاريخ','المخزن','التبرع','المتبرع','الحالة','إجراءات'],docs('DNI').map(x=>[x.no,x.date,esc(whn(x.wh)),esc(x.refNo),esc(x.party),st(x.st),btn('vd',x.id,'عرض','o')+btn('pd',x.id,'طباعة','g')+btn('pdx',x.id,'Excel','g')]))}<p class="mu">تُنشأ هذه المستندات تلقائيًا عند اعتماد تبرع عيني، وتُلغى بإلغاء التبرع نفسه.</p></div>`:'');
A.ngrn=()=>{const P=IV().pos;if(!P.length){toast('لا توجد أوامر توريد معتمدة بانتظار الاستلام',1);return}
  mdl('استلام مخزني من أمر توريد',sel('أمر التوريد','poId',[['','— اختر أمر التوريد —']].concat(P.map(p=>[p.id,p.no+' — '+p.sup+(p.st=='مستلم جزئيًا'?' (جزئي)':'')])),P.length==1?P[0].id:'','full')+whSel()+fld('التاريخ','date',today(),'date')+fld('رقم إذن تسليم المورد','dn')+`<div class="full" id="gl"></div>`+fld('ملاحظات','note','','ta','full'),()=>{const o=rd(),ls=$$('#gl tbody tr').map(r=>({pl:+r.dataset.pl,q:+r.querySelector('.gq').value||0,ns:r.querySelector('.gn').checked,item:r.querySelector('.gi').value,cf:+r.querySelector('.gc').value||1})).filter(x=>x.q>0);
    if(!o.poId||!o.wh){toast('اختر أمر التوريد والمخزن',1);return false}if(!ls.length){toast('أدخل كمية مستلمة لبند واحد على الأقل',1);return false}
    const bad=ls.find(x=>!x.ns&&!x.item);if(bad){toast('اربط كل بند مستلم بصنف أو علّمه خدمة / غير مخزني',1);return false}
    return run('postGrn',{poId:o.poId,wh:o.wh,date:o.date,dn:o.dn,note:o.note,lines:ls.map(x=>({pl:x.pl,q:x.q,ns:x.ns,item:x.ns?'':x.item,cf:x.cf}))},'تم ترحيل الاستلام')},'ترحيل الاستلام');
  A.grnFill()};
A.grnFill=()=>{const g=$('#gl');if(!g)return;const id=($('#m [name=poId]')||{}).value,p=IV().pos.find(x=>x.id==id);if(!p){g.innerHTML='';return}
  const rec=p.rec||[];
  g.innerHTML=`<div style="overflow-x:auto"><table><thead><tr><th>البيان</th><th>المطلوب</th><th>المستلم سابقًا</th><th>المتبقي</th><th>الكمية المستلمة الآن</th><th>الصنف المخزني</th><th>خدمة / غير مخزني</th><th>معامل التحويل</th></tr></thead><tbody>${p.items.map((x,n)=>{const r=rec[n]||0,m=Math.max(0,Math.round((x.q-r)*1000)/1000);
    return `<tr data-pl="${n}"><td>${esc(x.d)}<br><small class="mu">${esc(x.u)}</small></td><td>${q3(x.q)}</td><td>${q3(r)}</td><td>${q3(m)}</td><td><input class="gq" type="number" min="0" step="any" value="${m}" style="width:90px"></td><td><select class="gi" style="min-width:170px">${iopts(x.it)}</select></td><td style="text-align:center"><input class="gn" type="checkbox"></td><td><input class="gc" type="number" min="0" step="any" value="1" style="width:70px" title="كم وحدة مخزنية تساوي وحدة الشراء الواحدة"></td></tr>`}).join('')}</tbody></table><p class="mu">معامل التحويل: عدد وحدات المخزن لكل وحدة شراء (مثال: الشراء بالكرتونة والمخزن بالقطعة → 12). التكلفة تُحسب تلقائيًا من سعر أمر التوريد.</p></div>`};

/* ---------- التحويل بين المخازن ---------- */
V.i_trf=()=>{const me=D.user.username;return head('التحويل بين المخازن',ro()?'ntrf':'','+ تحويل جديد')+`<div class="box">${tbl(['الرقم','التاريخ','من','إلى','الحالة','إجراءات'],docs('TRF').map(x=>{let b=btn('vd',x.id,'عرض','o')+btn('pd',x.id,'طباعة','g')+btn('pdx',x.id,'Excel','g');
  if(ro()){if(x.st=='مسودة')b+=btn('ntrf',x.id,'تعديل','o')+btn('tsd',x.id,'إرسال');if(x.st=='مرسل')b+=btn('trc',x.id,'تأكيد الاستلام','g');
    if(x.st=='مسودة'&&(x.by==me||isM()))b+=btn('tcn',x.id,'إلغاء','o');if(x.st=='مرسل'&&isM())b+=btn('tcn',x.id,'إلغاء (إرجاع للمصدر)','o')}
  return[x.no,x.date,esc(whn(x.wh)),esc(whn(x.wh2)),st(x.st),b]}))}</div>`};
A.ntrf=i=>{const x=i?vdoc(i):{items:[],date:today()};const o=actWh().map(w=>[w.id,w.name]);
  mdl(i?'تعديل تحويل':'تحويل مخزني جديد',sel('من مخزن','wh',o.filter(a=>whSel(0).includes('value="'+a[0]+'"')),x.wh)+sel('إلى مخزن','wh2',o,x.wh2)+fld('التاريخ','date',x.date,'date')+led('q',x.items)+fld('ملاحظات','note',x.note,'ta','full'),()=>{const v=rd(),it=lget();
    if(!v.wh||!v.wh2||v.wh==v.wh2){toast('اختر مخزنين مختلفين',1);return false}if(!it.length||it.some(z=>!z.item||!(+z.q>0))){toast('أضف أصنافًا بكميات أكبر من صفر',1);return false}
    return run('saveTrf',{...v,items:it.map(z=>({item:z.item,q:+z.q})),id:i||undefined,ver:x.ver},'تم حفظ التحويل')})};
A.tsd=i=>{if(confirm('إرسال التحويل؟ سيُخصم من المخزن المصدر فورًا.'))run('sendTrf',{id:i,ver:vdoc(i).ver},'تم إرسال التحويل')};
A.trc=i=>{if(confirm('تأكيد استلام التحويل في المخزن المستلم؟'))run('receiveTrf',{id:i,ver:vdoc(i).ver},'تم استلام التحويل')};
A.tcn=i=>{const d=vdoc(i);if(d.st=='مسودة'){if(confirm('إلغاء التحويل؟'))run('cancelTrf',{id:i,ver:d.ver},'تم الإلغاء');return}
  mdl('إلغاء التحويل '+d.no,fld('سبب الإلغاء (إلزامي)','reason','','ta','full'),()=>{const r=rd().reason.trim();if(!r){toast('اكتب سبب الإلغاء',1);return false}return run('cancelTrf',{id:i,ver:d.ver,reason:r},'تم الإلغاء وإرجاع الكميات')},'تأكيد الإلغاء')};

/* ---------- الجرد ---------- */
V.i_cnt=()=>{const me=D.user.username;return head('الجرد',ro()?'ncnt':'','+ جرد جديد')+`<div class="box">${tbl(['الرقم','التاريخ','المخزن','الحالة','إجراءات'],docs('CNT').map(x=>{let b=btn('vd',x.id,'عرض','o');
  if(ro()&&['مسودة','مرفوض'].includes(x.st)&&(x.by==me||isM()))b+=btn('ncnt',x.id,'تعديل','o')+btn('csb',x.id,'تقديم للاعتماد');
  if(x.st=='مقدم'&&isM()&&(x.by!=me||is('admin')))b+=btn('cok',x.id,'اعتماد وترحيل')+btn('crj',x.id,'رفض','r');
  return[x.no,x.date,esc(whn(x.wh)),st(x.st)+(x.st=='مرفوض'&&x.reason?`<br><small class="mu">${esc(x.reason)}</small>`:''),b]}))}</div>`};
A.ncnt=i=>{const x=i?vdoc(i):{items:[],date:today()};
  mdl(i?'تعديل جرد':'جرد جديد',`<div class="full mu">الرصيد الدفتري يُسحب لحظة الحفظ. أدخل الكمية الفعلية بعد العد.</div>`+whSel(x.wh)+fld('التاريخ','date',x.date,'date')+`<div class="full"><button type="button" class="b o s" onclick="cfill()">تعبئة بكل أصناف المخزن المختار</button></div>`+led('cnt',x.items)+fld('ملاحظات','note',x.note,'ta','full'),()=>{const o=rd(),it=lget();
    if(!o.wh){toast('اختر المخزن',1);return false}if(!it.length||it.some(z=>!z.item||z.cnt===''||!(+z.cnt>=0))){toast('اختر الصنف وأدخل الكمية الفعلية لكل بند',1);return false}
    return run('saveCnt',{...o,items:it.map(z=>({item:z.item,cnt:+z.cnt})),id:i||undefined,ver:x.ver},'تم حفظ الجرد')})};
window.cfill=()=>{const w=($('#m [name=wh]')||{}).value;if(!w){toast('اختر المخزن أولًا',1);return}const its=IV().items.filter(i=>stk(w,i.id)>0);
  if(!its.length){toast('لا توجد أصناف ذات رصيد في هذا المخزن',1);return}$('#le tbody').innerHTML=its.map(i=>lrow('cnt',{item:i.id})).join('');icalc()};
A.csb=i=>{if(confirm('تقديم الجرد للاعتماد؟'))run('submitCnt',{id:i,ver:vdoc(i).ver},'تم تقديم الجرد')};
A.cok=i=>{if(confirm('اعتماد الجرد وترحيل فروقه على المخزون؟'))run('decideCnt',{id:i,ver:vdoc(i).ver,decision:'مرحّل'},'تم اعتماد الجرد وترحيل الفروق')};
A.crj=i=>mdl('رفض الجرد '+vdoc(i).no,fld('سبب الرفض (إلزامي)','reason','','ta','full'),()=>{const r=rd().reason.trim();if(!r){toast('اكتب سبب الرفض',1);return false}return run('decideCnt',{id:i,ver:vdoc(i).ver,decision:'مرفوض',reason:r},'تم رفض الجرد')},'تأكيد الرفض');

/* ---------- الأصناف ---------- */
V.i_items=()=>{const cost=IV().cost;return head('دليل الأصناف',ro()?'nitm':'','+ صنف جديد')+`<div class="box">${tbl(['الكود','الصنف','الوحدة','التصنيف','الحد الأدنى','الرصيد الكلي','الحالة',''],IV().items.map(i=>[esc(i.code),esc(i.name),esc(i.unit),esc(i.cat),q3(i.min),q3(stk('',i.id)),i.active?'<span class="st">نشط</span>':'<span class="st">موقوف</span>',isM()?btn('nitm',i.id,'تعديل','o'):'']))}</div>`};
A.nitm=i=>{const x=i?itm(i):{active:true};mdl(i?'تعديل صنف '+x.code:'صنف جديد',fld('اسم الصنف','name',x.name,'text','full')+fld('وحدة القياس','unit',x.unit)+fld('التصنيف','cat',x.cat)+fld('الحد الأدنى للمخزون','min',x.min||0,'number')+(i?sel('الحالة','active',[['true','نشط'],['false','موقوف']],x.active?'true':'false'):''),()=>{const o=rd();if(!o.name.trim()||!o.unit.trim()){toast('أدخل اسم الصنف والوحدة',1);return false}return run('saveItem',{...o,id:i||undefined},'تم حفظ الصنف')})};

/* ---------- المخازن + رصيد افتتاحي + فحص السلامة ---------- */
V.i_wh=()=>head('المخازن','nwh','+ مخزن جديد',`<button class="b o" data-a="opn" data-i="">رصيد افتتاحي</button><button class="b o" data-a="rec" data-i="">فحص سلامة الأرصدة</button>`)+`<div class="box">${tbl(['الكود','المخزن','الموقع','الحالة',''],IV().wh.map(w=>[esc(w.code),esc(w.name),esc(w.loc),w.active?'<span class="st">نشط</span>':'<span class="st">موقوف</span>',btn('nwh',w.id,'تعديل','o')]))}</div>`;
A.nwh=i=>{const x=i?IV().wh.find(w=>w.id==i):{active:true};mdl(i?'تعديل مخزن':'مخزن جديد',fld('اسم المخزن','name',x.name,'text','full')+fld('الموقع','loc',x.loc,'text','full')+(i?sel('الحالة','active',[['true','نشط'],['false','موقوف']],x.active?'true':'false'):''),()=>{const o=rd();if(!o.name.trim()){toast('أدخل اسم المخزن',1);return false}return run('saveWh',{...o,id:i||undefined},'تم حفظ المخزن')})};
A.opn=()=>{if(!actWh().length){toast('أضف مخزنًا أولًا',1);return}mdl('رصيد افتتاحي',`<div class="full mu">يُستخدم مرة واحدة لتحميل الأرصدة الحالية قبل بدء التشغيل. التكلفة إلزامية لكل صنف.</div>`+whSel()+fld('التاريخ','date',today(),'date')+led('opn',[])+fld('ملاحظات','note','','ta','full'),()=>{const o=rd(),it=lget();
  if(!o.wh){toast('اختر المخزن',1);return false}if(!it.length||it.some(z=>!z.item||!(+z.q>0)||!(+z.c>0))){toast('أدخل الصنف والكمية وتكلفة الوحدة (أكبر من صفر) لكل بند',1);return false}
  return run('postOpn',{...o,items:it.map(z=>({item:z.item,q:+z.q,c:+z.c}))},'تم ترحيل الرصيد الافتتاحي')},'ترحيل')};
A.rec=async()=>{try{const j=await api('reconcile');mdl('فحص سلامة الأرصدة',`<div class="full">${j.issues.length?`<p style="color:#a11"><b>تم العثور على ${j.issues.length} ملاحظة:</b></p><ul>${j.issues.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:`<p class="good"><b>✔ لا توجد اختلافات.</b></p>`}<p class="mu">تمت مطابقة ${j.ledgerRows} حركة في دفتر المخزون مع ${j.docs} مستند وأوامر التوريد وطلبات الصرف.</p></div>`,null)}catch(e){toast(e.message,1)}};
})();
