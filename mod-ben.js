/* =====================================================================
   مديول المستفيدين: السجل، البرامج، المساعدات (نقدية بخطوتين/عينية)، التقارير + تاب «صرف المساعدات» في الحسابات
   ===================================================================== */
(()=>{
const BN=()=>D.ben;
const br=()=>BN().role;
const isM=()=>['admin','manager'].includes(br());
const canW=()=>['admin','manager','officer'].includes(br());
const opt=a=>a.map(x=>[x,x]);
const bO=id=>BN().list.find(x=>x.id==id)||{};
const bN=id=>{const b=bO(id);return b.code?b.code+' · '+b.name:'—'};
const pO=id=>BN().progs.find(x=>x.id==id)||{};
const pN=id=>{const p=pO(id);return p.code?p.code+' · '+p.name:'—'};
const iN=id=>{const i=BN().items.find(x=>x.id==id);return i?i.name:'؟'};
let RS={from:today().slice(0,4)+'-01-01',to:today(),prog:'',res:null};
MODS.ben={title:'المستفيدون',has:()=>D.user.mods.ben&&D.ben,nav:()=>[['b_ben','المستفيدون'],['b_prog','البرامج'],['b_aid','المساعدات'],['b_rep','التقارير']]};

V.b_ben=()=>{const L=BN().list;
  return head('سجل المستفيدين',canW()?'nbn':'','+ مستفيد')+`<div class="box">${tbl(['الكود','الاسم','الرقم القومي','المدينة','الفئة','الأسرة','الدخل','الحالة',''],L.map(b=>[esc(b.code),`<b>${esc(b.name)}</b>`,esc(b.nid),esc(b.city),esc(b.cat),b.hh||'',b.income?f(b.income):'',st(b.st),(canW()?btn('nbn',b.id,'تعديل','o'):'')+btn('bhs',b.id,'السجل','g')]))}</div><p class="mu">يمنع النظام تكرار الرقم القومي (يُطبَّع من الأرقام العربية)، وينبّه عند تطابق الاسم. بيانات المستفيدين لا يراها إلا من له صلاحية هذا المديول.</p>`};
A.nbn=i=>{const x=i?bO(i):{st:'نشط'};
  mdl(i?'تعديل مستفيد':'مستفيد جديد',fld('الاسم','name',x.name,'text','full')+fld('الرقم القومي (14 رقمًا)','nid',x.nid)+sel('النوع','gender',[['','—'],['ذكر','ذكر'],['أنثى','أنثى']],x.gender||'')+fld('تاريخ الميلاد','birth',x.birth,'date')+fld('الهاتف','phone',x.phone)+fld('المدينة/المنطقة','city',x.city)+fld('العنوان','addr',x.addr,'text','full')+fld('عدد أفراد الأسرة','hh',x.hh,'number')+fld('الدخل الشهري','income',x.income,'number')+fld('الفئة (أيتام، أرامل، ذوو إعاقة…)','cat',x.cat)+(i?sel('الحالة','st',opt(['نشط','موقوف','مستبعد']),x.st):'')+fld('ملاحظات','note',x.note,'text','full')+(i?attBox('BEN',i):''),
  ()=>{const o=rd();if(i){o.id=i;o.ver=x.ver}return run('saveBen',o,'تم الحفظ')});if(i)attInit&&attInit()};
A.bhs=i=>{const b=bO(i),L=BN().aid.filter(a=>a.ben==i);mdl('سجل مساعدات: '+b.name,tbl(['الرقم','التاريخ','البرنامج','النوع','المبلغ/القيمة','الحالة'],L.map(a=>[esc(a.no),esc(a.date),esc(pN(a.prog)),esc(a.kind),f(a.amount),st(a.st)]))+`<div class="full mu">إجمالي المصروف: <b>${f(L.filter(a=>a.st==='مصروف').reduce((s,a)=>s+a.amount,0))}</b></div>`,null)};

V.b_prog=()=>{const L=BN().progs;
  return head('برامج المساعدات',isM()?'npg':'','+ برنامج')+`<div class="box">${tbl(['الكود','البرنامج','المشروع','الموازنة','المعتمد/المصروف','المتبقي','الفترة','الحالة',''],L.map(p=>[esc(p.code),`<b>${esc(p.name)}</b>`,esc(p.proj||'—'),p.budget?f(p.budget):'بلا سقف',f(p.used),p.budget?f(p.budget-p.used):'—',esc((p.start||'')+(p.end?' ← '+p.end:'')),st(p.st),isM()?btn('npg',p.id,'تعديل','o')+btn('dpg',p.id,'حذف','r'):'']))}</div>`};
A.npg=i=>{const x=i?pO(i):{st:'جاري'};mdl(i?'تعديل برنامج':'برنامج جديد',fld('اسم البرنامج','name',x.name,'text','full')+fld('المشروع (كود)','proj',x.proj)+fld('سقف الموازنة (0 = بلا سقف)','budget',x.budget,'number')+fld('من','start',x.start,'date')+fld('إلى','end',x.end,'date')+sel('الحالة','st',opt(['جاري','مغلق']),x.st)+fld('ملاحظات','note',x.note,'text','full'),()=>{const o=rd();if(i){o.id=i;o.ver=x.ver}return run('saveProg',o,'تم الحفظ')})};
A.dpg=i=>{if(confirm('حذف البرنامج؟'))run('delProg',{id:i},'تم الحذف')};

V.b_aid=()=>{const L=BN().aid;
  return head('المساعدات',canW()?'nad2':'','+ مساعدة')+`<div class="box">${tbl(['الرقم','التاريخ','المستفيد','البرنامج','النوع','المبلغ/القيمة','التفاصيل','الحالة','أعدّها',''],L.map(a=>[esc(a.no),esc(a.date),esc(bN(a.ben)),esc(pN(a.prog)),esc(a.kind),f(a.amount),a.kind==='عيني'?esc(a.items.map(x=>iN(x.item)+' × '+x.q).join('، ')):esc(a.note),st(a.st)+(a.st==='مرفوض'&&a.reason?`<br><small class="mu">${esc(a.reason)}</small>`:''),esc(a.byName),
   (isM()&&a.st==='بانتظار الاعتماد'?btn('bapd',a.id,'اعتماد','g')+btn('apr',a.id,'رفض','r'):'')+(canW()&&a.kind==='عيني'&&a.st==='معتمد'?btn('api',a.id,'صرف من المخزن','g'):'')+(canW()&&['بانتظار الاعتماد','معتمد'].includes(a.st)?btn('apc',a.id,'إلغاء','r'):'')+btn('apv',a.id,'مرفقات','o')]))}</div><p class="mu">المساعدة النقدية: تُسجَّل ← يعتمدها مدير البرامج ← تصرفها الحسابات بقيد (تاب «صرف المساعدات» في الحسابات). العينية: تُعتمد ثم تُصرف من المخزن فيُخصم الرصيد وتُقيَّد التكلفة تلقائيًا.</p>`};
A.apv=i=>{const a=BN().aid.find(x=>x.id==i);mdl('مساعدة '+a.no,kv('المستفيد',bN(a.ben))+kv('البرنامج',pN(a.prog))+kv('الحالة',a.st)+attBox('AID',i),null);attInit&&attInit()};
A.nad2=()=>{const act=BN().list.filter(b=>b.st==='نشط'),P=BN().progs.filter(p=>p.st==='جاري');
  const row=n=>`<div class="full" style="display:grid;grid-template-columns:3fr 1fr;gap:6px;align-items:end">${sel('الصنف '+n,'it'+n,[['','—']].concat(BN().items.map(x=>[x.id,x.code+' · '+x.name])),'')}${fld('الكمية','q'+n,'','number')}</div>`;
  mdl('تسجيل مساعدة',sel('المستفيد','ben',[['','— اختر —']].concat(act.map(b=>[b.id,b.code+' · '+b.name+' · '+b.nid])),'','full')+sel('البرنامج','prog',[['','— اختر —']].concat(P.map(p=>[p.id,p.code+' · '+p.name])),'','full')+sel('نوع المساعدة','kind',opt(['نقدي','عيني']),'نقدي')+fld('التاريخ','date',today(),'date')+fld('المبلغ (للنقدي)','amount','','number')
   +(BN().items.length?`<div class="full mu">للمساعدة العينية: اختر المخزن والأصناف</div>`+sel('المخزن','wh',[['','—']].concat(BN().whs.map(w=>[w.id,w.code+' · '+w.name])),'','full')+row(1)+row(2)+row(3):'')+fld('ملاحظات','note','','text','full')+(isM()?`<label class="full"><input type="checkbox" id="adup" style="width:auto"> السماح بالتكرار في نفس الشهر لنفس البرنامج</label>`:''),
  ()=>{const o=rd();if(!o.ben||!o.prog){toast('اختر المستفيد والبرنامج',1);return false}
   const items=[1,2,3].filter(n=>o['it'+n]).map(n=>({item:o['it'+n],q:o['q'+n]}));
   return run('saveAid',{ben:o.ben,prog:o.prog,kind:o.kind,date:o.date,amount:o.amount,note:o.note,wh:o.wh,items,allowDup:isM()&&$('#adup')&&$('#adup').checked||undefined},'تم تسجيل المساعدة')})};
A.bapd=i=>{const a=BN().aid.find(x=>x.id==i);run('decideAid',{id:i,ver:a.ver,decision:'معتمد'},'تم الاعتماد')};
A.apr=i=>{const a=BN().aid.find(x=>x.id==i);mdl('رفض المساعدة '+a.no,fld('السبب','reason','','text','full'),()=>run('decideAid',{id:i,ver:a.ver,decision:'مرفوض',reason:rd().reason},'تم الرفض'),'رفض')};
A.api=i=>{const a=BN().aid.find(x=>x.id==i);if(confirm('صرف الأصناف من المخزن للمستفيد؟'))run('issueAid',{id:i,ver:a.ver},'تم الصرف المخزني')};
A.apc=i=>{const a=BN().aid.find(x=>x.id==i);if(confirm('إلغاء المساعدة؟'))run('cancelAid',{id:i,ver:a.ver},'تم الإلغاء')};

V.b_rep=()=>{const r=RS.res;
  return head('تقارير المستفيدين','')+`<div class="box"><div class="db" id="brf2">${fld('من','from',RS.from,'date')}${fld('إلى','to',RS.to,'date')}${sel('البرنامج','prog',[['','كل البرامج']].concat(BN().progs.map(p=>[p.id,p.code+' · '+p.name])),RS.prog)}</div><button class="b" data-a="brun2">عرض</button></div>`+(r?`<div class="cards"><div class="card"><small>عدد المساعدات المصروفة</small><h2>${r.count}</h2></div><div class="card"><small>عدد المستفيدين</small><h2>${r.beneficiaries}</h2></div><div class="card"><small>إجمالي النقدي</small><h2>${f(r.cash)}</h2></div><div class="card"><small>إجمالي العيني</small><h2>${f(r.inkind)}</h2></div></div>
<div class="box"><h3>حسب البرنامج</h3>${tbl(['البرنامج','عدد المساعدات','المستفيدون','النقدي','العيني'],r.byProg.map(x=>[esc(x.name),x.n,x.ben,f(x.cash),f(x.inkind)]))}</div><div class="box"><h3>حسب الفئة</h3>${tbl(['الفئة','العدد','القيمة'],r.byCat.map(x=>[esc(x.name),x.n,f(x.v)]))}</div><div class="box"><h3>حسب المدينة</h3>${tbl(['المدينة','العدد','القيمة'],r.byCity.map(x=>[esc(x.name),x.n,f(x.v)]))}</div>`:'')};
A.brun2=async()=>{const o=rd('#brf2');RS.from=o.from;RS.to=o.to;RS.prog=o.prog;try{RS.res=await api('benRep',o);render()}catch(e){toast(e.message,1)}};

/* ---------- تاب الحسابات: صرف المساعدات النقدية ---------- */
NAVX.acc.push(['c_aid','صرف المساعدات']);
const FP=()=>D.aidFin||{pend:[],done:[]};
V.c_aid=()=>{const P=FP(),can=['admin','manager','accountant'].includes((D.acc||{}).role);
  return head('صرف المساعدات النقدية','')+`<div class="box"><h3>بانتظار الصرف (${P.pend.length})</h3>${tbl(['الرقم','التاريخ','المستفيد','البرنامج','المبلغ','ملاحظات',''],P.pend.map(a=>[esc(a.no),esc(a.date),esc(a.benName),esc(a.progName),f(a.amount),esc(a.note),can?btn('cfa',a.id,'صرف وترحيل القيد','g'):'']))}</div><div class="box"><h3>آخر المصروف</h3>${tbl(['الرقم','تاريخ الصرف','المستفيد','البرنامج','المبلغ','بواسطة'],P.done.map(a=>[esc(a.no),esc(a.finDate),esc(a.benName),esc(a.progName),f(a.amount),esc(a.finBy)]))}</div>`};
A.cfa=i=>{const a=FP().pend.find(x=>x.id==i),acs=(D.acc&&D.acc.payAccts)||[];mdl('صرف المساعدة '+a.no+' — '+f(a.amount),sel('الصرف من','acc',acs.map(x=>[x.id,x.code+' · '+x.name+' (رصيد '+f(x.bal)+')']),'')+fld('التاريخ','date',today(),'date'),()=>{const o=rd();return run('confirmAid',{id:i,ver:a.ver,acc:o.acc,date:o.date},'تم الصرف وترحيل القيد')},'صرف')};
})();
