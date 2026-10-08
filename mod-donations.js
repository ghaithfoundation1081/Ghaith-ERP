/* =====================================================================
   مديول التبرعات: لوحة التحكم، المتبرعون (أفراد / شركات / جمعيات ومؤسسات / جهات...)،
   التبرعات (نقدي وعيني) والإيصالات، الالتزامات، التواصل والمتابعة، الحملات والمبادرات، التقارير
   مرتبط بالمشاريع (دليل المشاريع)، المخازن (التبرع العيني)، والحسابات (قيد الإيراد)
   ===================================================================== */
(()=>{
const DN=()=>D.don;
const dr=()=>DN().role;
const isM=()=>['admin','manager'].includes(dr());
const canW=()=>['admin','manager','officer'].includes(dr());
const donorO=id=>DN().donors.find(x=>x.id==id)||{};
const donorN=id=>{const d=donorO(id);return d.code?d.code+' · '+d.name:'—'};
const cmpO=id=>DN().campaigns.find(x=>x.id==id)||{};
const cmpN=id=>id?(cmpO(id).code?cmpO(id).code+' · '+cmpO(id).name:'؟'):'—';
const TYPES=['فرد','شركة','جمعية / مؤسسة','جهة حكومية','جهة دولية / ممول','أخرى'];
const METHODS=['نقدي','تحويل بنكي','شيك','بطاقة','محفظة إلكترونية','أخرى'];
const CHANNELS=['اتصال هاتفي','واتساب','بريد إلكتروني','زيارة','اجتماع','رسالة نصية','أخرى'];
const OUTCOMES=['تم التواصل','لم يرد','وعد بالتبرع','تبرع','اعتذر','يحتاج متابعة','شكر / تقدير'];
const PREF=['هاتف','واتساب','بريد إلكتروني','زيارة'];
const CKINDS=['حملة','مبادرة','برنامج','طارئ'];
const CST=['مخطط','جاري','مغلق'];
const opt=a=>a.map(x=>[x,x]);
const yS=()=>today().slice(0,4)+'-01-01';
const ST={rep:{kind:'campaign',from:yS(),to:today(),campaign:'',proj:'',months:12,res:null},fs:''};

MODS.don={title:'التبرعات',has:()=>D.user.mods.don,nav:()=>[['d_dash','لوحة التحكم'],['d_donors','المتبرعون'],['d_don','التبرعات'],['d_plg','الالتزامات'],['d_com','التواصل والمتابعة'],['d_cmp','الحملات والمبادرات'],['d_rep','التقارير']]};

/* ---------- تفقيط المبلغ بالعربية (جنيه مصري) ---------- */
const O1=['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر'];
const T1=['','','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'];
const H1=['','مائة','مائتان','ثلاثمائة','أربعمائة','خمسمائة','ستمائة','سبعمائة','ثمانمائة','تسعمائة'];
function w3(n){const p=[],h=Math.floor(n/100),r=n%100;if(h)p.push(H1[h]);if(r){if(r<20)p.push(O1[r]);else{const o=r%10,t=Math.floor(r/10);p.push((o?O1[o]+' و':'')+T1[t])}}return p.join(' و')}
const SC=[['',''],['ألف','ألفان','آلاف'],['مليون','مليونان','ملايين'],['مليار','ملياران','مليارات']];
function words(n){
  if(n===0)return 'صفر';const g=[];while(n>0){g.push(n%1000);n=Math.floor(n/1000)}
  const out=[];
  for(let i=g.length-1;i>=0;i--){const v=g[i];if(!v)continue;
    if(i===0){out.push(w3(v));continue}
    const s=SC[i]||['','',''];
    if(v===1)out.push(s[0]);else if(v===2)out.push(s[1]);else if(v<=10)out.push(w3(v)+' '+s[2]);else out.push(w3(v)+' '+s[0]);
  }
  return out.join(' و');
}
const tafq=a=>{a=Math.round((+a||0)*100)/100;const i=Math.floor(a+1e-9),c=Math.round((a-i)*100);if(i>=1e12)return '';return 'فقط '+words(i)+' جنيهًا مصريًا'+(c?' و'+words(c)+' قرشًا':'')+' لا غير'};
window.tafqeet=tafq;

/* ---------- لوحة التحكم ---------- */
V.d_dash=()=>{const s=DN().sum||{month:0,year:0,all:0,cash:0,inkind:0,nMonth:0,drafts:0,donors:0,overdueN:0,overdueAmt:0,followDue:0,followToday:0,series:[],top:[],newDonors:0};
  const cd=[['تبرعات هذا الشهر (ج.م)',f(s.month)],['عدد التبرعات هذا الشهر',s.nMonth],['تبرعات هذه السنة',f(s.year)],['الإجمالي منذ البداية',f(s.all)],['منها نقدي',f(s.cash)],['منها عيني (تقديري)',f(s.inkind)],['متبرعون نشطون',s.donors],['متبرعون جدد هذا الشهر',s.newDonors],['التزامات متأخرة',s.overdueN+' ('+f(s.overdueAmt)+')'],['متابعات مستحقة',s.followDue+(s.followToday?' (اليوم '+s.followToday+')':'')]];
  if(isM())cd.push(['مسودات بانتظار الاعتماد',s.drafts]);
  const mx=Math.max(1,...s.series.map(x=>x.v));
  const bars=`<div style="display:flex;gap:6px;align-items:flex-end;height:120px;overflow-x:auto">${s.series.map(x=>`<div style="flex:1;min-width:34px;text-align:center"><div title="${esc(x.k)}: ${f(x.v)}" style="background:var(--p);height:${Math.round(x.v/mx*90)}px;min-height:${x.v?2:0}px;border-radius:3px 3px 0 0"></div><small class="mu">${esc(x.k.slice(2))}</small></div>`).join('')}</div>`;
  const fu=DN().comms.filter(c=>c.fst==='مفتوحة'&&c.next&&c.next<=today()).sort((a,b)=>a.next<b.next?-1:1).slice(0,8);
  const dr0=DN().donations.filter(x=>x.st==='مسودة').slice(0,8);
  return `<div class="cards">${cd.map(c=>`<div class="card"><small>${c[0]}</small><h2>${c[1]}</h2></div>`).join('')}</div>
<div class="box"><h3>التبرعات آخر 12 شهرًا (ج.م)</h3>${bars}</div>
<div class="box"><h3>أكبر المتبرعين</h3>${tbl(['المتبرع','عدد التبرعات','الإجمالي'],(s.top||[]).map(x=>[esc(donorN(x.id)),x.n,f(x.total)]))}</div>
<div class="box"><h3>متابعات مستحقة</h3>${tbl(['موعد المتابعة','المتبرع','الموضوع','وسيلة'],fu.map(c=>[esc(c.next),esc(donorN(c.donor)),esc(c.subject),esc(c.channel)]))}</div>
${isM()?`<div class="box"><h3>مسودات تبرعات بانتظار الاعتماد</h3>${tbl(['الرقم','التاريخ','المتبرع','المبلغ','سجّلها','إجراءات'],dr0.map(x=>[x.no,x.date,esc(donorN(x.donor)),f(x.amount),esc(x.byName),btn('apd',x.id,'اعتماد','g')+btn('vdn',x.id,'عرض','o')]))}</div>`:''}`};

/* ---------- المتبرعون ---------- */
const typeSel=()=>`<select id="dtf" onchange="dflt()" style="width:auto"><option value="">كل الأنواع</option>${TYPES.map(t=>`<option>${esc(t)}</option>`).join('')}</select>`;
window.dflt=()=>{const t=($('#dtf')||{}).value||'',q=($('#v input[placeholder="بحث..."]')||{}).value||'';$$('#v tbody tr').forEach(r=>{r.hidden=!(r.textContent.includes(q)&&(!t||(r.dataset.t||'')===t))})};
V.d_donors=()=>{const L=DN().donors;
  const rows=L.map(x=>`<tr data-t="${esc(x.type)}"><td><b>${esc(x.code)}</b></td><td>${esc(x.name)}${x.dnc?' <span class="st" title="لا يُتواصل معه">لا تتصل</span>':''}</td><td>${esc(x.type)}</td><td>${esc(x.phone)}</td><td>${esc(x.email)}</td><td>${esc(x.city)}</td><td>${x.n}</td><td>${f(x.total)}</td><td>${esc(x.last)||'—'}</td><td>${x.pledged?f(x.pledged):'—'}</td><td>${st(x.active?'نشط':'موقوف')}</td><td>${btn('dst',x.id,'كشف حساب','o')+(canW()?btn('ndn','d:'+x.id,'+ تبرع','g')+btn('ncm',x.id,'+ تواصل','o')+btn('nd',x.id,'تعديل','o'):'')+(isM()?btn('dd',x.id,'حذف','r'):'')}</td></tr>`).join('');
  return head('المتبرعون',canW()?'nd':'','+ متبرع جديد',typeSel())+`<div class="box"><table><thead><tr>${['الكود','الاسم','النوع','الهاتف','البريد','المدينة','عدد التبرعات','إجمالي التبرعات','آخر تبرع','التزامات قائمة','الحالة','إجراءات'].map(h=>'<th>'+h+'</th>').join('')}</tr></thead><tbody>${rows||'<tr><td colspan="12" style="text-align:center;color:var(--m)">لا توجد بيانات</td></tr>'}</tbody></table></div>`};
const donorForm=x=>fld('الاسم (الشخص / الجهة)','name',x.name,'text','full')+sel('نوع المتبرع','type',opt(TYPES),x.type||'فرد')+fld('الشخص المسؤول (للجهات)','contact',x.contact)+fld('الهاتف','phone',x.phone,'tel')+fld('هاتف آخر','phone2',x.phone2,'tel')+fld('البريد الإلكتروني','email',x.email,'email')+fld('المدينة','city',x.city)+fld('العنوان','addr',x.addr,'text','full')+fld('الرقم القومي / السجل التجاري / الرقم الضريبي','idno',x.idno)+sel('وسيلة التواصل المفضلة','channel',[['','—']].concat(opt(PREF)),x.channel||'')+fld('وسوم (مثال: كبار، رمضان)','tags',x.tags)+fld('مصدر التعرف على المتبرع','source',x.source)+sel('عدم التواصل (لا يرغب في الاتصال به)','dnc',[['false','لا'],['true','نعم: لا تتواصل معه']],x.dnc?'true':'false')+(x.id?sel('الحالة','active',[['true','نشط'],['false','موقوف']],x.active===false?'false':'true'):'')+fld('ملاحظات','note',x.note,'ta','full');
A.nd=i=>{const x=i?Object.assign({},donorO(i)):{};
  mdl(i?'تعديل متبرع':'متبرع جديد',donorForm(x),async()=>{
    const o={...rd(),id:i||undefined,ver:x.ver};
    try{await api('saveDonor',o)}catch(e){
      if(/بنفس الاسم/.test(e.message)&&confirm(e.message+'\nهل هو متبرع مختلف فعلًا؟ اضغط موافق للحفظ رغم التشابه.')){try{await api('saveDonor',{...o,allowDup:true})}catch(e2){toast(e2.message,1);return false}}
      else{toast(e.message,1);return false}}
    await load(1);toast('تم حفظ المتبرع');return true})};
A.dd=i=>{if(!confirm('حذف المتبرع '+donorN(i)+'؟'))return;run('delDonor',{id:i,ver:donorO(i).ver},'تم حذف المتبرع')};

/* ---------- كشف حساب المتبرع ---------- */
let stmt=null;
const stmtHtml=(j,forPrint)=>{const d=j.donor;
  const P=(l,t)=>t?`<p><b>${l}:</b> ${esc(t)}</p>`:'';
  const dn=j.donations.map(x=>[esc(x.no),esc(x.date),esc(x.kind),f(x.amount),esc(x.kind==='عيني'?'عيني':x.method),esc(x.rcpt||'—'),esc(cmpN(x.campaign)),esc(pjl(x.proj)||'—'),esc(x.st)]);
  const pl=j.pledges.map(p=>[esc(p.no),esc(p.date),f(p.amount),f(p.coll),f(Math.max(0,p.amount-p.coll)),esc(p.due||'—'),esc(p.st)]);
  const cm=j.comms.map(c=>[esc(c.date),esc(c.channel),esc(c.outcome),esc(c.subject),esc(c.next||'—'),esc(c.fst||'')]);
  const head1=['الرقم','التاريخ','النوع','المبلغ','الوسيلة','الإيصال','الحملة','المشروع','الحالة'];
  const t1=tbl(head1,dn);
  return (forPrint?printHead('كشف حساب متبرع'):'')+`<div class="g"><div>${P('الكود',d.code)+P('الاسم',d.name)+P('النوع',d.type)}</div><div>${P('الهاتف',d.phone)+P('البريد',d.email)+P('المدينة',d.city)}</div><div>${P('عدد التبرعات المعتمدة',String(j.count))+P('إجمالي التبرعات المعتمدة',f(j.total)+' ج.م')}</div><div>${P('أول تبرع',j.first)+P('آخر تبرع',j.last)}</div></div><h4>التبرعات</h4>${t1}<h4>الالتزامات</h4>${tbl(['الرقم','التاريخ','المبلغ','المحصَّل','المتبقي','الاستحقاق','الحالة'],pl)}`+(forPrint?'':`<h4>سجل التواصل</h4>${tbl(['التاريخ','الوسيلة','النتيجة','الموضوع','المتابعة','حالتها'],cm)}`)+(forPrint?printFoot():'')};
A.dst=async i=>{try{const j=await api('donorStmt',{id:i});stmt=j;
  mdl('كشف حساب: '+j.donor.name,`<div class="full" style="overflow-x:auto">${stmtHtml(j,false)}</div><div class="full"><button class="b g" data-a="dstp" data-i="">طباعة</button> <button class="b g" data-a="dstx" data-i="">Excel</button></div>`,null)}catch(e){toast(e.message,1)}};
A.dstp=()=>{if(stmt)docOut(stmtHtml(stmt,true),'كشف حساب '+stmt.donor.name)};
A.dstx=()=>{if(stmt)docOut(stmtHtml(stmt,true),'كشف حساب '+stmt.donor.name,1)};

/* ---------- التبرعات ---------- */
const dbadge=x=>x==='معتمد'?'<span class="st" style="background:#dff3e6">معتمد</span>':x==='ملغي'?'<span class="st" style="background:#f6dede">ملغي</span>':st(x);
V.d_don=()=>{const L=DN().donations,me=D.user.username;
  const rows=L.map(x=>{let b=btn('vdn',x.id,'عرض','o');
    if(x.st==='معتمد')b+=btn('rcp',x.id,'إيصال','g')+btn('rcpx',x.id,'Excel','g');
    if(x.st==='مسودة'&&canW()&&(isM()||x.by===me))b+=btn('ndn',x.id,'تعديل','o')+btn('ddn',x.id,'حذف','r');
    if(x.st==='مسودة'&&isM()&&(x.by!==me||dr()==='admin'||D.user.role==='admin'))b+=btn('apd',x.id,'اعتماد','g');
    if(x.st==='معتمد'&&isM())b+=btn('cnd',x.id,'إلغاء','r');
    return `<tr data-s="${esc(x.st)}"><td>${esc(x.no)}</td><td>${esc(x.date)}</td><td>${esc(donorN(x.donor))}</td><td>${esc(x.kind)}${x.kind==='عيني'?'':' · '+esc(x.method)}</td><td>${f(x.amount)}</td><td>${esc(cmpN(x.campaign))}</td><td>${esc(pjl(x.proj))||'—'}</td><td>${esc(x.restr||'عام')}</td><td>${esc(x.rcpt)||'—'}</td><td>${dbadge(x.st)}</td><td>${b}</td></tr>`}).join('');
  const sf=`<select id="dsf" onchange="dsflt()" style="width:auto"><option value="">كل الحالات</option><option>مسودة</option><option>معتمد</option><option>ملغي</option></select>`;
  return head('التبرعات',canW()?'ndn':'','+ تسجيل تبرع',sf)+`<div class="box"><table><thead><tr>${['الرقم','التاريخ','المتبرع','النوع / الوسيلة','المبلغ (ج.م)','الحملة','المشروع','التخصيص','الإيصال','الحالة','إجراءات'].map(h=>'<th>'+h+'</th>').join('')}</tr></thead><tbody>${rows||'<tr><td colspan="11" style="text-align:center;color:var(--m)">لا توجد بيانات</td></tr>'}</tbody></table></div><p class="mu">يظهر آخر 500 تبرع معتمد/ملغي وكل المسودات. التبرع العيني يُقيَّد بقيمته التقديرية.</p>`};
window.dsflt=()=>{const s=($('#dsf')||{}).value||'',q=($('#v input[placeholder="بحث..."]')||{}).value||'';$$('#v tbody tr').forEach(r=>{r.hidden=!(r.textContent.includes(q)&&(!s||(r.dataset.s||'')===s))})};
const donOpts=cur=>[['','— اختر المتبرع —']].concat(DN().donors.filter(d=>d.active||d.id==cur).map(d=>[d.id,d.code+' · '+d.name]));
const pledgeOpts=(donor,cur)=>[['','— بدون التزام —']].concat(DN().pledges.filter(p=>p.st==='قائم'&&(p.donor==donor)||p.id==cur).map(p=>[p.id,p.no+' — المتبقي '+f(Math.max(0,p.amount-p.coll-(p.id==cur?0:(p.held||0))))]));
const iopt=s=>'<option value="">— الصنف —</option>'+DN().items.map(i=>`<option value="${esc(i.id)}"${i.id==s?' selected':''}>${esc(i.code+' · '+i.name+' ('+i.unit+')')}</option>`).join('');
const irow=(x={})=>`<tr><td><select class="ik" style="min-width:200px">${iopt(x.item)}</select></td><td><input class="iq" type="number" min="0" step="any" value="${x.q||''}" style="width:90px" oninput="dcalc()"></td><td><input class="ic" type="number" min="0" step="any" value="${x.c||''}" style="width:110px" oninput="dcalc()"></td><td class="it">0.00</td><td><button type="button" class="b s r" onclick="this.closest('tr').remove();dcalc()">✕</button></td></tr>`;
window.dadd=()=>{$('#dl tbody').insertAdjacentHTML('beforeend',irow());dcalc()};
window.dcalc=()=>{let t=0;$$('#dl tbody tr').forEach(r=>{const v=r2((+r.querySelector('.iq').value||0)*(+r.querySelector('.ic').value||0));r.querySelector('.it').textContent=f(v);t+=v});const e=$('#dlt');if(e)e.innerHTML='إجمالي القيمة التقديرية: <b>'+f(r2(t))+'</b> ج.م'};
function dnToggle(){const k=($('#m [name=kind]')||{}).value,inK=k==='عيني';
  $$('#m .dcash').forEach(e=>e.hidden=inK);$$('#m .dink').forEach(e=>e.hidden=!inK);
  const m=($('#m [name=method]')||{}).value;const rr=$('#m .dref');if(rr)rr.hidden=inK||!['شيك','تحويل بنكي','بطاقة','محفظة إلكترونية'].includes(m)}
function dnPledge(){const p=$('#m [name=pledge]');if(!p)return;const cur=p.value,d=($('#m [name=donor]')||{}).value;p.innerHTML=pledgeOpts(d,cur).map(o=>`<option value="${esc(o[0])}"${o[0]==cur?' selected':''}>${esc(o[1])}</option>`).join('')}
dlg.addEventListener('change',e=>{const n=e.target&&e.target.name;if(!$('#m .dnform'))return;
  if(n==='kind'||n==='method')dnToggle();
  if(n==='donor')dnPledge();
  if(n==='campaign'){const c=cmpO(e.target.value),p=$('#m [name=proj]');if(c.proj&&p&&!p.value)p.value=c.proj}
  if(n==='pledge'){const pl=DN().pledges.find(z=>z.id==e.target.value);if(pl){const a=$('#m [name=amount]');if(a&&!a.value)a.value=r2(Math.max(0,pl.amount-pl.coll-(pl.held||0)));const c=$('#m [name=campaign]');if(c&&!c.value&&pl.campaign)c.value=pl.campaign}}});
A.ndn=i=>{
  if(!DN().donors.length){toast('أضف متبرعًا أولًا',1);return}
  let x={date:today(),kind:'نقدي',method:'نقدي',restr:'عام',items:[]};
  if(i&&i.startsWith('d:'))x.donor=i.slice(2);else if(i)x=Object.assign({},DN().donations.find(z=>z.id==i));
  const id=(i&&!i.startsWith('d:'))?i:'';
  const inK=x.kind==='عيني';
  const body=`<div class="dnform full"></div>`+fld('التاريخ','date',x.date,'date')+sel('المتبرع','donor',donOpts(x.donor),x.donor||'','full')+sel('نوع التبرع','kind',[['نقدي','نقدي (مبلغ)'],['عيني','عيني (أصناف تدخل المخزن)']],x.kind)
   +`<div class="dcash"${inK?' hidden':''}>${fld('المبلغ (ج.م)','amount',x.kind==='نقدي'?x.amount:'','number')}</div><div class="dcash"${inK?' hidden':''}>${sel('وسيلة الدفع','method',opt(METHODS),x.method||'نقدي')}</div><div class="dcash dref" hidden>${fld('رقم الشيك / مرجع التحويل','ref',x.ref)}</div>`
   +`<div class="dink full"${inK?'':' hidden'}>${sel('المخزن المستلِم','wh',[['','— اختر المخزن —']].concat(DN().whs.map(w=>[w.id,w.name])),x.wh||'')}<label>الأصناف المتبرَّع بها (القيمة التقديرية لوحدة الصنف)</label><div style="overflow-x:auto"><table id="dl"><thead><tr><th>الصنف</th><th>الكمية</th><th>القيمة التقديرية للوحدة</th><th>الإجمالي</th><th></th></tr></thead><tbody>${(x.items||[]).map(irow).join('')}</tbody></table></div><button type="button" class="b s o" onclick="dadd()">+ صنف</button><div id="dlt" class="mu"></div></div>`
   +sel('الحملة / المبادرة','campaign',[['','— بدون —']].concat(DN().campaigns.filter(c=>c.st!=='مغلق'||c.id==x.campaign).map(c=>[c.id,c.code+' · '+c.name])),x.campaign||'')+psl('المشروع',x.proj||'')+sel('التخصيص','restr',[['عام','عام (غير مقيد)'],['مقيد','مقيد بمشروع']],x.restr||'عام')+sel('سداد التزام قائم','pledge',pledgeOpts(x.donor,x.pledge),x.pledge||'')+fld('ملاحظات','note',x.note,'ta','full');
  mdl(id?'تعديل تبرع '+x.no:'تسجيل تبرع',body,async()=>{
    const o={...rd(),id:id||undefined,ver:x.ver};
    if(o.kind==='عيني'){o.items=$$('#dl tbody tr').map(r=>({item:r.querySelector('.ik').value,q:+r.querySelector('.iq').value||0,c:r.querySelector('.ic').value})).filter(l=>l.item||l.q||l.c);delete o.amount;delete o.method}
    const d=donorO(o.donor);if(d.dnc&&!confirm('هذا المتبرع محدد بأنه لا يرغب في التواصل. متابعة التسجيل؟'))return false;
    return run('saveDonation',o,'تم حفظ التبرع كمسودة').then(r=>r!==false)});
  dnToggle();dcalc();
};
A.ddn=i=>{if(confirm('حذف مسودة التبرع؟'))run('delDonation',{id:i,ver:(DN().donations.find(z=>z.id==i)||{}).ver},'تم الحذف')};
A.vdn=i=>{const x=DN().donations.find(z=>z.id==i);if(!x)return;
  const it=(x.items||[]).map((l,n)=>{const m=DN().items.find(z=>z.id==l.item)||{};return [n+1,esc(m.name||'؟'),esc(m.unit||''),q3(l.q),f(l.c),f(r2(l.q*l.c))]});
  mdl('تبرع '+x.no,kv('الرقم',x.no)+kv('التاريخ',x.date)+kv('المتبرع',donorN(x.donor))+kv('النوع',x.kind==='عيني'?'عيني':'نقدي — '+x.method)+kv('المبلغ',f(x.amount)+' ج.م')+(x.ref?kv('المرجع',x.ref):'')+kv('الحملة',cmpN(x.campaign))+kv('المشروع',pjl(x.proj))+kv('التخصيص',x.restr||'عام')+kv('الحالة',x.st)+(x.rcpt?kv('رقم الإيصال',x.rcpt):'')+kv('سجّله',x.byName)+(x.actBy?kv('آخر إجراء بواسطة',x.actBy):'')+(x.reason?kv('سبب الإلغاء',x.reason):'')+(x.note?`<div class="full"><label>ملاحظات</label>${esc(x.note)}</div>`:'')+(it.length?`<div class="full" style="overflow-x:auto">${tbl(['#','الصنف','الوحدة','الكمية','قيمة الوحدة','الإجمالي'],it)}</div>`:''),null)};
A.apd=i=>{const x=DN().donations.find(z=>z.id==i);if(!x)return;
  const cash=x.kind!=='عيني'&&DN().cashAccts.length;
  mdl('اعتماد التبرع '+x.no,`<div class="full">المتبرع: <b>${esc(donorN(x.donor))}</b> — المبلغ: <b>${f(x.amount)}</b> ج.م${x.kind==='عيني'?' (عيني: يُدخل الأصناف المخزن ويُقيَّد بقيمته التقديرية)':''}</div>`+(cash?sel('حساب الخزينة / البنك المستلِم','acc',[['','— اختر الحساب —']].concat(DN().cashAccts.map(a=>[a.id,a.code+' · '+a.name])),DN().cashAccts.length===1?DN().cashAccts[0].id:'','full'):'')+`<div class="full mu">بعد الاعتماد يُصدر رقم إيصال${cash||x.kind==='عيني'?' ويُرحَّل قيد محاسبي تلقائي':''} ولا يمكن تعديل التبرع، ويمكن إلغاؤه لاحقًا بسبب.</div>`,()=>run('approveDonation',{id:i,ver:x.ver,acc:(rd().acc)||undefined},'تم اعتماد التبرع وإصدار الإيصال').then(r=>r!==false))};
A.cnd=i=>{const x=DN().donations.find(z=>z.id==i);
  mdl('إلغاء التبرع '+x.no,`<div class="full mu">يُلغى التبرع ويُعكس قيده المحاسبي${x.kind==='عيني'?' وتُخرَج الأصناف من المخزن (إن لم تتحرك بعده)':''}.</div>`+fld('سبب الإلغاء','reason','','ta','full'),()=>run('cancelDonation',{id:i,ver:x.ver,reason:rd().reason},'تم إلغاء التبرع').then(r=>r!==false),'إلغاء التبرع')};
/* إيصال التبرع */
const rcpHtml=x=>{const P=(l,t)=>t?`<p><b>${l}:</b> ${esc(t)}</p>`:'';const d=donorO(x.donor);
  const it=(x.items||[]).map((l,n)=>{const m=DN().items.find(z=>z.id==l.item)||{};return [n+1,esc(m.name||'؟'),esc(m.unit||''),q3(l.q),f(l.c),f(r2(l.q*l.c))]});
  return printHead('إيصال تبرع '+(x.kind==='عيني'?'عيني':'نقدي'))+`<div class="g"><div>${P('رقم الإيصال',x.rcpt)+P('رقم التبرع',x.no)+P('التاريخ',x.date)}</div><div>${P('المتبرع',d.name)+P('النوع',d.type)+P('الهاتف',d.phone)}</div><div>${P('وسيلة الدفع',x.kind==='عيني'?'تبرع عيني':x.method)+P('المرجع',x.ref)}</div><div>${P('الحملة / المبادرة',x.campaign?cmpN(x.campaign):'')+P('المشروع',pjl(x.proj))+P('التخصيص',x.restr||'عام')}</div></div>`
   +(it.length?tbl(['#','الصنف','الوحدة','الكمية','القيمة التقديرية للوحدة','الإجمالي'],it):'')
   +`<div class="tt"><p><span>المبلغ${x.kind==='عيني'?' (القيمة التقديرية)':''}</span><span>${f(x.amount)}</span></p></div><p><b>المبلغ كتابةً:</b> ${esc(tafq(x.amount))}</p>`+(x.note?`<p><b>ملاحظات:</b> ${esc(x.note)}</p>`:'')+(S().donNote?`<p>${esc(S().donNote)}</p>`:'')+`<div class="sg"><div>أعدّه<br>${esc(x.byName)}</div><div>أمين الصندوق / المعتمد<br>${esc(x.actBy||'')}</div><div>توقيع المتبرع</div></div>`+printFoot()};
A.rcp=(i,xl)=>{const x=DN().donations.find(z=>z.id==i);if(x)docOut(rcpHtml(x),'إيصال '+x.rcpt,xl)};
A.rcpx=i=>A.rcp(i,1);

/* ---------- الالتزامات ---------- */
V.d_plg=()=>{const L=DN().pledges;
  return head('الالتزامات (وعود التبرع)',canW()?'npl':'','+ التزام جديد')+`<div class="box">${tbl(['الرقم','التاريخ','المتبرع','الحملة','المشروع','المبلغ','المحصَّل','المتبقي','الاستحقاق','الحالة','إجراءات'],L.map(p=>{const left=Math.max(0,r2(p.amount-p.coll)),late=p.st==='قائم'&&p.due&&p.due<today();
    return [esc(p.no),esc(p.date),esc(donorN(p.donor)),esc(cmpN(p.campaign)),esc(pjl(p.proj))||'—',f(p.amount),f(p.coll),f(left),esc(p.due)||'—'+'',st(p.st)+(late?' <span class="st" style="background:#f6dede">متأخر</span>':''),
      (p.st==='قائم'&&canW()?btn('ndn','p:'+p.id,'تسجيل تحصيل','g')+btn('npl',p.id,'تعديل','o'):'')+(p.st==='قائم'&&isM()?btn('cpl',p.id,'شطب','r'):'')]}))}</div><p class="mu">الالتزام وعد غير مُقيَّد محاسبيًا؛ يُقيَّد الإيراد عند اعتماد التبرع الفعلي المرتبط به. الشطب بعد تحصيل جزئي يحوّله إلى «مشطوب».</p>`};
const _ndn=A.ndn;A.ndn=i=>{if(i&&String(i).startsWith('p:')){const p=DN().pledges.find(z=>z.id==String(i).slice(2));if(!p)return;_ndn('d:'+p.donor);setTimeout(()=>{const set=(n,v)=>{const e=$('#m [name='+n+']');if(e&&v)e.value=v};dnPledge();set('pledge',p.id);set('campaign',p.campaign);set('amount',r2(Math.max(0,p.amount-p.coll-(p.held||0))));const pj=$('#m [name=proj]');if(pj&&p.proj)pj.value=p.proj},0);return}_ndn(i)};
A.npl=i=>{const x=i?Object.assign({},DN().pledges.find(z=>z.id==i)):{date:today()};
  mdl(i?'تعديل التزام '+x.no:'التزام جديد',fld('تاريخ الالتزام','date',x.date,'date')+sel('المتبرع','donor',donOpts(x.donor),x.donor||'','full')+fld('المبلغ الملتزم به (ج.م)','amount',x.amount,'number')+fld('تاريخ الاستحقاق','due',x.due||'','date')+sel('الحملة / المبادرة','campaign',[['','— بدون —']].concat(DN().campaigns.map(c=>[c.id,c.code+' · '+c.name])),x.campaign||'')+psl('المشروع',x.proj||'')+fld('ملاحظات','note',x.note,'ta','full'),
  ()=>run('savePledge',{...rd(),id:i||undefined,ver:x.ver},'تم حفظ الالتزام').then(r=>r!==false))};
A.cpl=i=>{const x=DN().pledges.find(z=>z.id==i);mdl('شطب الالتزام '+x.no,fld('سبب الشطب','reason','','ta','full'),()=>run('cancelPledge',{id:i,ver:x.ver,reason:rd().reason},'تم شطب الالتزام').then(r=>r!==false),'شطب')};

/* ---------- التواصل والمتابعة ---------- */
V.d_com=()=>{const me=D.user.username,L=DN().comms;
  return head('التواصل والمتابعة',canW()?'ncm':'','+ تسجيل تواصل')+`<div class="box">${tbl(['التاريخ','المتبرع','الوسيلة','النتيجة','الموضوع','ملاحظات','موعد المتابعة','حالتها','سجّله','إجراءات'],L.map(c=>{const late=c.fst==='مفتوحة'&&c.next&&c.next<today();
    return [esc(c.date),esc(donorN(c.donor)),esc(c.channel),esc(c.outcome),esc(c.subject),esc(c.notes),esc(c.next)||'—',st(c.fst||'—')+(late?' <span class="st" style="background:#f6dede">متأخرة</span>':''),esc(c.byName),
      (c.fst==='مفتوحة'&&canW()?btn('dcm',c.id,'تمت المتابعة','g'):'')+(canW()&&(isM()||c.by===me)?btn('ncm','c:'+c.id,'تعديل','o')+btn('xcm',c.id,'حذف','r'):'')]}))}</div>`};
A.ncm=i=>{const edit=i&&String(i).startsWith('c:'),x=edit?Object.assign({},DN().comms.find(z=>z.id==String(i).slice(2))):{date:today(),donor:i||''};
  const d=donorO(x.donor);
  mdl(edit?'تعديل سجل تواصل':'تسجيل تواصل',(d.dnc?'<div class="full" style="color:#a11">⚠ هذا المتبرع لا يرغب في التواصل معه.</div>':'')+fld('التاريخ','date',x.date,'date')+sel('المتبرع','donor',donOpts(x.donor),x.donor||'','full')+sel('وسيلة التواصل','channel',opt(CHANNELS),x.channel||'اتصال هاتفي')+sel('النتيجة','outcome',opt(OUTCOMES),x.outcome||'تم التواصل')+fld('الموضوع','subject',x.subject,'text','full')+fld('تفاصيل / ملاحظات','notes',x.notes,'ta','full')+fld('موعد المتابعة القادمة (اختياري)','next',x.next||'','date'),
  ()=>run('saveComm',{...rd(),id:edit?x.id:undefined,ver:x.ver},'تم حفظ سجل التواصل').then(r=>r!==false))};
A.dcm=i=>run('doneComm',{id:i,ver:(DN().comms.find(z=>z.id==i)||{}).ver},'تم إنهاء المتابعة');
A.xcm=i=>{if(confirm('حذف سجل التواصل؟'))run('delComm',{id:i,ver:(DN().comms.find(z=>z.id==i)||{}).ver},'تم الحذف')};

/* ---------- الحملات والمبادرات ---------- */
V.d_cmp=()=>{const L=DN().campaigns;
  return head('الحملات والمبادرات',isM()?'ncp':'','+ حملة / مبادرة')+`<div class="box">${tbl(['الكود','الاسم','النوع','المشروع','من','إلى','المستهدف','المحصَّل','النسبة','عدد التبرعات','الحالة','إجراءات'],L.map(c=>{const pct=c.target>0?Math.min(100,Math.round(c.raised/c.target*1000)/10):null;
    return [`<b>${esc(c.code)}</b>`,esc(c.name),esc(c.kind),esc(pjl(c.proj))||'—',esc(c.start)||'—',esc(c.end)||'—',c.target?f(c.target):'—',f(c.raised),pct==null?'—':`<div style="background:#eee;border-radius:4px;min-width:90px"><div style="background:var(--p);color:#fff;font-size:11px;padding:1px 4px;border-radius:4px;width:${pct}%;min-width:30px">${pct}%</div></div>`,c.n,st(c.st),isM()?btn('ncp',c.id,'تعديل','o'):'']}))}</div>`};
A.ncp=i=>{const x=i?Object.assign({},cmpO(i)):{st:'جاري',kind:'حملة'};
  mdl(i?'تعديل '+x.name:'حملة / مبادرة جديدة',fld('الاسم','name',x.name,'text','full')+sel('النوع','kind',opt(CKINDS),x.kind)+sel('الحالة','st',opt(CST),x.st)+psl('المشروع المرتبط (اختياري)',x.proj||'')+fld('المبلغ المستهدف (ج.م)','target',x.target||'','number')+fld('من','start',x.start||'','date')+fld('إلى','end',x.end||'','date')+fld('الوصف','descr',x.descr,'ta','full'),
  ()=>run('saveCampaign',{...rd(),id:i||undefined,ver:x.ver},'تم حفظ الحملة').then(r=>r!==false))};

/* ---------- التقارير ---------- */
const RK=[['campaign','حسب الحملة / المبادرة'],['type','حسب نوع المتبرع'],['method','حسب وسيلة الدفع'],['month','شهريًا'],['restr','عام / مقيد'],['top','أكبر المتبرعين'],['lapsed','متبرعون منقطعون (لم يتبرعوا منذ مدة)'],['pledges','تقادم الالتزامات'],['funding','تمويل المشاريع مقابل المصروفات']];
const repTable=r=>{if(!r)return '<p class="mu">اختر التقرير واضغط «عرض».</p>';const k=r.kind,R=r.rows||[];
  const tot=(key)=>f(R.reduce((s,x)=>s+(+x[key]||0),0));
  if(k==='campaign')return tbl(['الحملة','النوع','الحالة','المستهدف','المحصَّل','عيني منه','عدد التبرعات','عدد المتبرعين','النسبة','المتبقي'],R.map(x=>[esc(x.label),esc(x.kind),esc(x.st),x.target?f(x.target):'—',f(x.total),f(x.inkind),x.n,x.donors,x.pct==null?'—':x.pct+'%',x.left==null?'—':f(x.left)]));
  if(['type','method','month','restr'].includes(k))return tbl([{type:'نوع المتبرع',method:'الوسيلة',month:'الشهر',restr:'التخصيص'}[k],'الإجمالي','عيني منه','عدد التبرعات','عدد المتبرعين'],R.map(x=>[esc(x.label),f(x.total),f(x.inkind),x.n,x.donors]).concat([['<b>الإجمالي</b>','<b>'+tot('total')+'</b>',tot('inkind'),R.reduce((s,x)=>s+x.n,0),'']]));
  if(k==='top')return tbl(['#','المتبرع','النوع','الإجمالي','عدد التبرعات'],R.map((x,n)=>[n+1,esc(x.label),esc(x.type),f(x.total),x.n]));
  if(k==='lapsed')return `<p class="mu">متبرعون نشطون لم يتبرعوا منذ ${r.months} شهرًا أو أكثر.</p>`+tbl(['المتبرع','النوع','الهاتف','البريد','آخر تبرع','إجمالي ما تبرع','عدد التبرعات','ملاحظة'],R.map(x=>[esc(x.label),esc(x.type),esc(x.phone),esc(x.email),esc(x.last),f(x.total),x.n,x.dnc?'لا يُتواصل معه':'']));
  if(k==='pledges')return tbl(['الالتزام','المتبرع','الهاتف','المبلغ','المحصَّل','المتبقي','الاستحقاق','التأخير (يوم)','الفئة'],R.map(x=>[esc(x.no),esc(x.label),esc(x.phone),f(x.amount),f(x.coll),f(x.left),esc(x.due),x.age||'—',esc(x.bucket)]));
  if(k==='funding')return (r.linked?'':'<p class="mu">الحسابات غير مفعّلة: يظهر إجمالي التبرعات فقط دون المصروفات.</p>')+tbl(['المشروع','الممول','التبرعات المعتمدة','المصروفات (من الحسابات)','الصافي'],R.map(x=>[esc(x.label),esc(x.funder),f(x.total),x.exp==null?'—':f(x.exp),x.net==null?'—':f(x.net)]));
  return ''};
V.d_rep=()=>{const s=ST.rep;
  return `<div class="tb"><h2>التقارير</h2></div><div class="box"><div class="db" id="drf">${sel('التقرير','kind',RK,s.kind)}${fld('من','from',s.from,'date')}${fld('إلى','to',s.to,'date')}${sel('الحملة','campaign',[['','الكل']].concat(DN().campaigns.map(c=>[c.id,c.code+' · '+c.name])),s.campaign)}${PJ().length?sel('المشروع','proj',[['','الكل']].concat(PJ().map(p=>[p.code,p.code+' · '+p.name])),s.proj):''}${fld('مدة الانقطاع (شهر) لتقرير المنقطعين','months',s.months,'number')}</div><button class="b" data-a="drRun">عرض</button> <button class="b o" data-a="drPr">طباعة</button> <button class="b g" data-a="xl">تصدير Excel</button></div><div class="box" id="drr">${repTable(s.res)}</div>`};
A.drRun=async()=>{const o=rd('#drf');Object.assign(ST.rep,{kind:o.kind,from:o.from,to:o.to,campaign:o.campaign||'',proj:o.proj||'',months:+o.months||12});
  try{const j=await api('donRep',{kind:o.kind,from:o.from,to:o.to,campaign:o.campaign,proj:o.proj,months:+o.months||12});ST.rep.res=j;$('#drr').innerHTML=repTable(j)}catch(e){toast(e.message,1)}};
A.drPr=()=>{const s=ST.rep;if(!s.res){toast('اعرض التقرير أولًا',1);return}
  docOut(printHead((RK.find(k=>k[0]===s.kind)||[])[1]||'تقرير')+`<p>الفترة: ${esc(s.from)} إلى ${esc(s.to)}</p>`+repTable(s.res)+printFoot())};
})();
