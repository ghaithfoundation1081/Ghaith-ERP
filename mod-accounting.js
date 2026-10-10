/* =====================================================================
   مديول الحسابات: لوحة التحكم، القيود، الموردون والسداد، دفتر الأستاذ، ميزان المراجعة،
   القوائم المالية (إيرادات ومصروفات حسب المشروع، مركز مالي، تقادم الموردين)،
   دليل الحسابات، المشروعات والممولون، الفترات وفحص السلامة
   ===================================================================== */
(()=>{
const AC=()=>D.acc;
const ar=()=>AC().role;
const isAM=()=>['admin','manager'].includes(ar());
const canJE=()=>['admin','manager','accountant'].includes(ar());
const accO=id=>AC().accounts.find(a=>a.id==id)||{};
const accN=id=>{const a=accO(id);return a.code?a.code+' · '+a.name:'—'};
const prjN=id=>id?((AC().projects.find(p=>p.id==id)||{}).name||'؟'):'غير موزع';
const TYPES={asset:'أصول',liability:'خصوم',equity:'صافي الأصول / حقوق',revenue:'إيرادات',expense:'مصروفات'};
const JT={MAN:'قيد يدوي',REC:'سند قبض',PAYV:'سند صرف',GRN:'استلام مخزني',ISS:'صرف مخزني',OPN:'رصيد افتتاحي مخزني',CNT:'تسوية جرد',PAY:'سداد مورد',OPENAP:'قيد افتتاحي',DON:'تبرع',TRN:'تحويل نقدي',ADV:'صرف عهدة/سلفة',ADVS:'تسوية عهدة',DEP:'إهلاك أصول',FAP:'اقتناء أصل',FAD:'استبعاد أصل'};
const jtN=t=>String(t).startsWith('REV-')?'عكس: '+(JT[t.slice(4)]||t.slice(4)):(JT[t]||t);
const jTot=j=>Math.round(j.lines.reduce((s,l)=>s+(+l.dr||0),0)*100)/100;
const yStart=()=>today().slice(0,4)+'-01-01';
const ST={tb:{from:yStart(),to:today(),proj:''},gl:{acc:'',from:yStart(),to:today(),proj:''},ie:{from:yStart(),to:today()},bs:{to:today()},age:{to:today()},rt:'ie'};
const jeById=id=>AC().je.find(j=>j.id==id);

MODS.acc={title:'الحسابات',has:()=>D.user.mods.acc,nav:()=>{
  if(!AC().linked)return ar()=='admin'?[['c_act','تفعيل الحسابات']]:[['c_na','غير مفعّل']];
  const N=[['c_dash','لوحة التحكم'],['c_je','القيود'],['c_ap','الموردون والسداد'],['c_gl','دفتر الأستاذ'],['c_tb','ميزان المراجعة'],['c_rep','القوائم المالية'],['c_coa','دليل الحسابات'],['c_dpn','تحصيل التبرعات'+(((AC().donPend||{}).pend||[]).length?' ('+AC().donPend.pend.length+')':'')],['c_prj','المشروعات والممولون'],['c_map','ربط الحسابات'],['c_per','الفترات والفحص']];
  return N.concat(NAVX.acc);
}};

/* ---------- تحصيل التبرعات: تأكيد الحسابات هو الذي يرحّل قيد التبرع النقدي ---------- */
const canCD=()=>['admin','manager','accountant'].includes(ar());
V.c_dpn=()=>{const P=AC().donPend||{pend:[],done:[]};
  return `<div class="tb"><h2>تحصيل التبرعات</h2></div><div class="box"><h3>معتمدة من التبرعات وبانتظار تأكيد وصول المبلغ (${P.pend.length})</h3>${tbl(['التبرع','تاريخه','المتبرع','القناة / الوسيلة','المرجع','المبلغ','التخصيص','المشروع / الحملة','الإيصال','اعتمدها','إجراءات'],P.pend.map(x=>[esc(x.no),esc(x.date),esc(x.donor),esc(x.chn||x.method),esc(x.ref)||'—',f(x.amount),esc(x.restr||'عام'),esc([pjl(x.proj),x.campaign].filter(Boolean).join(' / '))||'—',esc(x.rcpt),esc(x.actBy),canCD()?btn('cdn',x.id,'تأكيد التحصيل وترحيل القيد','g'):'']))}<p class="mu">بعد التأكد من دخول المبلغ في الخزينة أو البنك (كشف الحساب / رسالة التحويل) اضغط تأكيد؛ يُرحَّل القيد: مدين حساب الخزينة / البنك، دائن إيراد التبرعات. لو لم يصل المبلغ فأبلغ مدير التبرعات لإلغاء التبرع.</p></div>
<div class="box"><h3>آخر التبرعات المؤكدة</h3>${tbl(['التبرع','تاريخ التحصيل','المتبرع','القناة','المبلغ','الحساب','أكّده'],P.done.map(x=>[esc(x.no),esc(x.fdate),esc(x.donor),esc(x.chn||x.method),f(x.amount),esc(accN(x.acc)),esc(x.finByName)]))}</div>`};
A.cdn=i=>{const x=((AC().donPend||{}).pend||[]).find(z=>z.id==i);if(!x)return;
  const cash=AC().accounts.filter(a=>a.cash&&a.active);
  mdl('تأكيد تحصيل '+x.no,`<div class="full">المتبرع: <b>${esc(x.donor)}</b> — المبلغ: <b>${f(x.amount)}</b> ج.م — ${esc(x.chn||x.method)}${x.ref?' — مرجع '+esc(x.ref):''}</div>`+sel('حساب الخزينة / البنك الذي دخل فيه المبلغ','acc',[['','— اختر الحساب —']].concat(cash.map(a=>[a.id,a.code+' · '+a.name])),x.chnAcc||'','full')+fld('تاريخ التحصيل الفعلي','date',x.date,'date')+`<div class="full mu">سيُرحَّل قيد: مدين الحساب المختار / دائن إيراد التبرعات ${x.restr==='مقيد'?'المقيدة':'العامة'}${x.proj?' موزعًا على المشروع':''}.</div>`,()=>run('confirmDonation',{id:i,ver:x.ver,acc:rd().acc,date:rd().date},'تم تأكيد التحصيل وترحيل القيد').then(r=>r!==false),'تأكيد وترحيل')};

/* ---------- غير مفعّل ---------- */
V.c_na=()=>`<div class="box"><h3>مديول الحسابات غير مفعّل بعد</h3><p class="mu">يفعّله مدير النظام. بعد التفعيل تُنشأ القيود تلقائيًا من المشتريات والمخازن.</p></div>`;
V.c_act=()=>`<div class="box"><h3>تفعيل الربط المحاسبي</h3>
<p>عند التفعيل يحدث الآتي، ولا يمكن التراجع عنه:</p>
<ul><li>يُنشأ دليل حسابات جاهز لمؤسسة تنموية (يمكن تعديله وإضافة حسابات).</li>
<li>يُرحَّل قيد افتتاحي تلقائي بقيمة المخزون الحالية وبما استُلم ولم يُسدَّد من أوامر التوريد.</li>
<li>كل استلام وصرف وجرد ورصيد افتتاحي مخزني يُنشئ قيده تلقائيًا، وسداد الموردين يتم بدفعات من الخزينة أو البنك.</li>
<li>لا تُقبل مستندات مخزنية أو قيود بتاريخ قبل اليوم (بداية التطبيق المحاسبي)، ويصبح ربط المخازن بالمشتريات إلزاميًا.</li></ul>
<p class="mu">قبل التفعيل: أدخل الأرصدة الافتتاحية للمخزون، وأنهِ أو أغلق أوامر التوريد التي لا تريدها في المستحقات.</p>
<button class="b" data-a="cact">تفعيل الربط المحاسبي</button></div>`;
A.cact=()=>{if(confirm('تفعيل الربط المحاسبي؟ لا يمكن التراجع عن هذا الإجراء.'))run('enableAcc',{},'تم تفعيل الحسابات')};

/* ---------- لوحة التحكم ---------- */
V.c_dash=()=>{const s=AC().sum||{cash:0,ap:0,rev:0,exp:0,surplus:0},dr=AC().je.filter(j=>j.st=='مسودة'),cash=AC().accounts.filter(a=>a.cash);
  const cd=[['النقدية والبنوك (ج.م)',f(s.cash)],['مستحق للموردين (ج.م)',f(s.ap)],['إجمالي الإيرادات',f(s.rev)],['إجمالي المصروفات',f(s.exp)],['الفائض / (العجز)',f(s.surplus)]];
  if(isAM())cd.push(['قيود بانتظار الترحيل',dr.length]);
  return `<div class="cards">${cd.map(c=>`<div class="card"><small>${c[0]}</small><h2>${c[1]}</h2></div>`).join('')}</div>
<div class="box"><h3>أرصدة الخزائن والبنوك</h3>${tbl(['الحساب','الرصيد'],cash.map(a=>[esc(a.code+' · '+a.name),f(AC().bal[a.id]||0)]))}</div>
<div class="box"><h3>آخر القيود</h3>${tbl(['الرقم','التاريخ','النوع','البيان','المبلغ','الحالة'],AC().je.filter(j=>j.st!='مسودة').slice(0,8).map(j=>[j.no,j.date,jtN(j.type),esc(j.memo),f(jTot(j)),st(j.st)]))}</div>
<p class="mu">${AC().closedTo?'الفترة مُقفلة حتى '+esc(AC().closedTo)+'. ':'لا توجد فترة مُقفلة. '}بداية التطبيق المحاسبي: ${esc(AC().start)}. الإجماليات منذ البداية.</p>`};

/* ---------- القيود ---------- */
const jsel=(s,manual)=>'<option value="">— الحساب —</option>'+AC().accounts.filter(a=>a.active&&!(manual&&['INV','AP'].includes(a.sys))).map(a=>`<option value="${esc(a.id)}"${a.id==s?' selected':''}>${esc(a.code)} · ${esc(a.name)}</option>`).join('');
const psel=s=>'<option value="">غير موزع</option>'+AC().projects.filter(p=>p.active||p.id==s).map(p=>`<option value="${esc(p.id)}"${p.id==s?' selected':''}>${esc(p.code+' · '+p.name)}</option>`).join('');
const jrow=(x={})=>`<tr><td><select class="ja" style="min-width:210px">${jsel(x.acc,true)}</select></td><td><input class="jd" type="number" min="0" step="any" value="${x.dr||''}" style="width:100px" oninput="jcalc()"></td><td><input class="jc" type="number" min="0" step="any" value="${x.cr||''}" style="width:100px" oninput="jcalc()"></td><td><select class="jp">${psel(x.proj)}</select></td><td><input class="jm" value="${esc(x.memo)}" placeholder="بيان السطر" style="min-width:130px"></td><td><button type="button" class="b s r" onclick="this.closest('tr').remove();jcalc()">✕</button></td></tr>`;
window.jadd=()=>{$('#jl tbody').insertAdjacentHTML('beforeend',jrow());jcalc()};
window.jcalc=()=>{if(!$('#jl'))return;let d=0,c=0;$$('#jl tbody tr').forEach(r=>{d+=+r.querySelector('.jd').value||0;c+=+r.querySelector('.jc').value||0});d=r2(d);c=r2(c);
  const e=$('#jt');e.innerHTML=`مدين: <b>${f(d)}</b> — دائن: <b>${f(c)}</b> — الفرق: <b class="${d==c&&d>0?'good':''}" ${d==c&&d>0?'':'style="color:#a11"'}>${f(r2(d-c))}</b>`};
const jget=()=>$$('#jl tbody tr').map(r=>({acc:r.querySelector('.ja').value,dr:+r.querySelector('.jd').value||0,cr:+r.querySelector('.jc').value||0,proj:r.querySelector('.jp').value,memo:r.querySelector('.jm').value.trim()})).filter(l=>l.acc||l.dr||l.cr);
const prevH=mdlHook;mdlHook=()=>{prevH&&prevH();jcalc()};

V.c_je=()=>{const me=D.user.username;return head('القيود اليومية',canJE()?'nje':'','+ قيد يدوي',canJE()?`<button class="b o" data-a="nvc" data-i="REC">+ سند قبض</button><button class="b o" data-a="nvc" data-i="PAYV">+ سند صرف</button>`:'')+`<div class="box">${tbl(['الرقم','التاريخ','النوع','البيان','المبلغ','الحالة','إجراءات'],AC().je.map(j=>{const man=['MAN','REC','PAYV'].includes(j.type)&&!j.src,own=j.by==me;let b=btn('vje',j.id,'عرض','o')+btn('pje',j.id,'طباعة','g')+btn('pjex',j.id,'Excel','g');
  if(man&&['مسودة','مرفوض'].includes(j.st)&&canJE()&&(own||isAM()))b+=btn('nje',j.id,j.st=='مرفوض'?'تعديل وإعادة إرسال':'تعديل','o')+btn('djc',j.id,'حذف','r');
  if(man&&j.st=='مسودة'&&isAM()&&(!own||ar()=='admin'))b+=btn('pst',j.id,'ترحيل')+btn('rjj',j.id,'رفض','r');
  if(man&&j.st=='مرحّل'&&isAM())b+=btn('rvj',j.id,'عكس','r');
  return[j.no,j.date,jtN(j.type),esc(j.memo)+(j.st=='مرفوض'&&j.reason?`<br><small class="mu">${esc(j.reason)}</small>`:''),f(jTot(j)),st(j.st),b]}))}</div>`};
const jhdr=j=>kv('الرقم',j.no)+kv('النوع',jtN(j.type))+kv('الحالة',j.st)+kv('التاريخ',j.date)+kv('أعدّه',j.byName)+(j.actBy?kv('آخر إجراء بواسطة',j.actBy):'')+(j.srcNo&&j.src?kv('المستند المصدر',j.srcNo):'')+(j.reason?kv('السبب',j.reason):'');
const jtab=j=>tbl(['الحساب','مدين','دائن','المشروع','البيان'],j.lines.map(l=>[esc(accN(l.acc)),l.dr?f(l.dr):'',l.cr?f(l.cr):'',esc(prjN(l.proj)),esc(l.memo)]).concat([['<b>الإجمالي</b>','<b>'+f(jTot(j))+'</b>','<b>'+f(jTot(j))+'</b>','','']]));
A.vje=i=>{const j=jeById(i);mdl('قيد '+j.no,jhdr(j)+`<div class="full"><label>البيان</label>${esc(j.memo)}</div><div class="full" style="overflow-x:auto">${jtab(j)}</div>`+attBox('JE',j.id),null)};
A.pje=(i,x)=>{const j=jeById(i),P=(l,t)=>t?`<p><b>${l}:</b> ${esc(t)}</p>`:'';
  docOut(printHead(j.type=='REC'?'سند قبض':j.type=='PAYV'?'سند صرف':'قيد يومية')+`<div class="g"><div>${P('الرقم',j.no)+P('التاريخ',j.date)}</div><div>${P('النوع',jtN(j.type))+P('الحالة',j.st)}</div></div>${P('البيان',j.memo)}`+jtab(j)+`<div class="sg"><div>أعدّه<br>${esc(j.byName)}</div><div>المراجع / المحاسب</div><div>المعتمد${j.actBy&&j.st!='مسودة'?'<br>'+esc(j.actBy):''}</div></div>`+printFoot(),(j.type=='REC'?'سند قبض ':j.type=='PAYV'?'سند صرف ':'قيد ')+j.no,x)};
A.pjex=i=>A.pje(i,1);
A.nje=i=>{const x=i?jeById(i):{lines:[{},{}],date:today(),memo:'',type:'MAN'};
  mdl(i?'تعديل قيد':'قيد يدوي جديد',fld('التاريخ','date',x.date,'date')+fld('البيان','memo',x.memo,'text','full')+`<div class="full" style="overflow-x:auto"><table id="jl"><thead><tr><th>الحساب</th><th>مدين</th><th>دائن</th><th>المشروع</th><th>بيان السطر</th><th></th></tr></thead><tbody>${x.lines.map(jrow).join('')}</tbody></table><button type="button" class="b o s" style="margin-top:6px" onclick="jadd()">+ سطر</button> <span id="jt" style="float:left"></span></div><div class="full mu">يحفظ كمسودة، ويرحّله مدير حسابات آخر (حسابا المخزون والموردين لا يُرحَّل عليهما يدويًا).</div>`,()=>{const o=rd(),l=jget();
    if(!o.memo.trim()){toast('اكتب بيان القيد',1);return false}return run('saveJE',{id:i||undefined,ver:x.ver,type:x.type||'MAN',date:o.date,memo:o.memo,lines:l},'تم حفظ القيد كمسودة')})};
A.nvc=t=>{const rec=t=='REC',cash=AC().accounts.filter(a=>a.cash&&a.active),oth=AC().accounts.filter(a=>a.active&&!['INV','AP'].includes(a.sys)&&!a.cash&&(rec?['revenue','liability','equity','asset']:['expense','asset','liability']).includes(a.type));
  mdl(rec?'سند قبض':'سند صرف',fld('التاريخ','date',today(),'date')+sel(rec?'استلام في (خزينة/بنك)':'الصرف من (خزينة/بنك)','cash',cash.map(a=>[a.id,a.code+' · '+a.name+' (رصيد '+f(AC().bal[a.id]||0)+')']))+sel(rec?'الإيراد / الحساب الدائن':'المصروف / الحساب المدين','oth',[['','— اختر —']].concat(oth.map(a=>[a.id,a.code+' · '+a.name])))+fld('المبلغ','amt','','number')+sel('المشروع','proj',[['','غير موزع']].concat(AC().projects.filter(p=>p.active).map(p=>[p.id,p.name])))+fld('البيان','memo','','text','full'),()=>{const o=rd(),a=+o.amt;
    if(!o.oth||!(a>0)||!o.memo.trim()){toast('اختر الحساب وأدخل المبلغ والبيان',1);return false}
    const L=rec?[{acc:o.cash,dr:a,cr:0,proj:o.proj},{acc:o.oth,dr:0,cr:a,proj:o.proj}]:[{acc:o.oth,dr:a,cr:0,proj:o.proj},{acc:o.cash,dr:0,cr:a,proj:o.proj}];
    return run('saveJE',{type:t,date:o.date,memo:o.memo,lines:L},'تم حفظ السند كمسودة')})};
A.djc=i=>{if(confirm('حذف المسودة؟'))run('delJE',{id:i},'تم الحذف')};
A.pst=i=>{if(confirm('ترحيل القيد إلى دفتر الأستاذ؟'))run('postJE',{id:i,ver:jeById(i).ver},'تم ترحيل القيد')};
A.rjj=i=>mdl('رفض القيد '+jeById(i).no,fld('سبب الرفض (إلزامي)','reason','','ta','full'),()=>{const r=rd().reason.trim();if(!r){toast('اكتب سبب الرفض',1);return false}return run('rejectJE',{id:i,ver:jeById(i).ver,reason:r},'تم رفض القيد')},'تأكيد الرفض');
A.rvj=i=>mdl('عكس القيد '+jeById(i).no,`<div class="full mu">يُرحَّل قيد عكسي بتاريخ اليوم ويبقى القيد الأصلي ظاهرًا بحالة "معكوس".</div>`+fld('سبب العكس (إلزامي)','reason','','ta','full'),()=>{const r=rd().reason.trim();if(!r){toast('اكتب سبب العكس',1);return false}return run('reverseJE',{id:i,ver:jeById(i).ver,reason:r},'تم عكس القيد')},'تأكيد العكس');

/* ---------- الموردون والسداد ---------- */
const payBtn=a=>AC().payAccts.length&&a.o>0.004?btn('pay',a.po,'سداد','g'):'';
V.c_ap=()=>{const A_=AC().ap,sup={};A_.forEach(a=>{const o=sup[a.supName]||(sup[a.supName]={b:0,p:0,o:0});o.b+=a.b;o.p+=a.p;o.o+=a.o});
  return head('الموردون والسداد')+`<div class="box"><h3>أرصدة الموردين</h3>${tbl(['المورد','المفوتر','المسدد','المتبقي'],Object.entries(sup).map(([n,o])=>[esc(n),f(o.b),f(o.p),f(o.o)]))}</div>
<div class="box"><h3>أوامر التوريد المستلمة</h3>${tbl(['أمر التوريد','المورد','المشروع','أول استلام','المفوتر','المسدد','المتبقي','الحالة',''],A_.map(a=>[a.no,esc(a.supName),esc(pjl(a.proj)),a.first||'—',f(a.b),f(a.p),f(a.o),st(a.st),payBtn(a)]))}</div>
<div class="box"><h3>دفعات السداد</h3>${tbl(['الرقم','التاريخ','أمر التوريد','المورد','المبلغ','المرجع','الحالة',''],AC().pays.map(p=>[p.no,p.date,esc(p.poNo),esc(p.supName),f(p.amount),esc(p.ref),st(p.st)+(p.st=='معكوس'&&p.reason?`<br><small class="mu">${esc(p.reason)}</small>`:''),p.st=='مرحّل'&&isAM()?btn('rpay',p.id,'عكس','r'):'']))}</div>`};
A.pay=poId=>{const a=(AC().ap||[]).find(x=>x.po==poId);if(!a){toast('لا يوجد مستحق على هذا الأمر',1);return}
  mdl('سداد '+a.no+' — '+a.supName,kv('المفوتر',f(a.b))+kv('المسدد',f(a.p))+kv('المتبقي',f(a.o))+sel('الدفع من','acc',AC().payAccts.map(x=>[x.id,x.code+' · '+x.name+' (رصيد '+f(x.bal)+')']))+fld('التاريخ','date',today(),'date')+fld('المبلغ','amount',a.o,'number')+fld('المرجع (رقم الشيك / التحويل)','ref')+fld('ملاحظات','note','','ta','full'),()=>{const o=rd();
    if(!(+o.amount>0)){toast('أدخل مبلغًا أكبر من صفر',1);return false}return run('payPO',{poId,acc:o.acc,date:o.date,amount:+o.amount,ref:o.ref,note:o.note},'تم تسجيل السداد')},'تسجيل السداد')};
A.rpay=i=>{const p=AC().pays.find(x=>x.id==i);mdl('عكس الدفعة '+p.no,`<div class="full mu">يُنشأ قيد عكسي وتعود المبالغ لمستحقات المورد.</div>`+fld('سبب العكس (إلزامي)','reason','','ta','full'),()=>{const r=rd().reason.trim();if(!r){toast('اكتب سبب العكس',1);return false}return run('reversePay',{id:i,reason:r},'تم عكس الدفعة')},'تأكيد العكس')};

/* ---------- عناصر التقارير ---------- */
const accOpts=s=>'<option value="">— اختر الحساب —</option>'+AC().accounts.map(a=>`<option value="${esc(a.id)}"${a.id==s?' selected':''}>${esc(a.code)} · ${esc(a.name)}</option>`).join('');
const pOpts=s=>'<option value="">كل المشروعات</option><option value="-"'+(s=='-'?' selected':'')+'>غير موزع</option>'+AC().projects.map(p=>`<option value="${esc(p.id)}"${p.id==s?' selected':''}>${esc(p.name)}</option>`).join('');
const dr=(v,cr)=>v>0.004?f(v):'';
const rp=h=>{const e=$('#rp');if(e)e.innerHTML=h};
const bar=(items)=>`<div class="tb" style="flex-wrap:wrap;gap:8px">${items}</div>`;
const V$=id=>($('#'+id)||{}).value||'';
const rapi=async(a,d)=>{try{return await api(a,d)}catch(e){toast(e.message,1);return null}};

/* ---------- دفتر الأستاذ ---------- */
V.c_gl=()=>{const s=ST.gl;setTimeout(()=>s.acc&&A.glRun(),0);return head('دفتر الأستاذ','','',``)+bar(`<select id="gla" style="min-width:240px">${accOpts(s.acc)}</select><label>من</label><input id="glf" type="date" value="${s.from}"><label>إلى</label><input id="glt" type="date" value="${s.to}"><select id="glp" class="sel-sm">${pOpts(s.proj)}</select><button class="b" data-a="glRun">عرض</button><button class="b o" data-a="glPr">طباعة</button>`)+`<div class="box" id="rp"><span class="mu">اختر الحساب ثم اضغط عرض.</span></div>`};
let GLR=null;
A.glRun=async()=>{const s=ST.gl;s.acc=V$('gla')||s.acc;s.from=V$('glf');s.to=V$('glt');s.proj=V$('glp');if(!s.acc){toast('اختر الحساب',1);return}
  const j=await rapi('gl',{acc:s.acc,from:s.from,to:s.to,proj:s.proj});if(!j)return;GLR=j;
  rp(`<h3>${esc(j.acc.code+' · '+j.acc.name)}</h3><div style="overflow-x:auto">${tbl(['التاريخ','القيد','النوع','البيان','المشروع','مدين','دائن','الرصيد'],[['','','','<b>رصيد أول المدة</b>','','','',f(j.open)]].concat(j.rows.map(r=>[r.date,`<a href="#" data-a="vje2" data-i="${esc(r.jeId)}">${esc(r.jeNo)}</a>`,jtN(r.jt),esc(r.memo),esc(prjN(r.proj)),dr(r.dr),dr(r.cr),f(r.bal)])).concat([['','','','<b>الرصيد الختامي</b>','','','','<b>'+f(j.close)+'</b>']]))}</div><p class="mu">الرصيد: موجب = مدين، سالب = دائن.</p>`)};
A.vje2=i=>{const j=jeById(i);if(j)A.vje(i);else toast('القيد خارج آخر 300 قيد محمّلة؛ ابحث عنه برقمه من النسخة الاحتياطية أو ضيّق الفترة',1)};
A.glPr=()=>{if(!GLR){toast('اعرض التقرير أولًا',1);return}const j=GLR;printHtml(printHead('دفتر الأستاذ — '+j.acc.name)+`<p>الفترة: ${esc(ST.gl.from)} إلى ${esc(ST.gl.to)}</p>`+tbl(['التاريخ','القيد','البيان','مدين','دائن','الرصيد'],[['','','رصيد أول المدة','','',f(j.open)]].concat(j.rows.map(r=>[r.date,esc(r.jeNo),esc(r.memo),dr(r.dr),dr(r.cr),f(r.bal)])))+printFoot())};

/* ---------- ميزان المراجعة ---------- */
V.c_tb=()=>{const s=ST.tb;setTimeout(()=>A.tbRun(),0);return head('ميزان المراجعة')+bar(`<label>من</label><input id="tbf" type="date" value="${s.from}"><label>إلى</label><input id="tbt" type="date" value="${s.to}"><select id="tbp" class="sel-sm">${pOpts(s.proj)}</select><button class="b" data-a="tbRun">عرض</button><button class="b o" data-a="tbPr">طباعة</button>`)+`<div class="box" id="rp"></div>`};
let TBR=null;
const split=v=>[v>0.004?f(v):'',v<-0.004?f(-v):''];
A.tbRun=async()=>{const s=ST.tb;if($('#tbf')){s.from=V$('tbf');s.to=V$('tbt');s.proj=V$('tbp')}
  const j=await rapi('tb',{from:s.from,to:s.to,proj:s.proj});if(!j)return;TBR=j;
  const T=j.totals;rp(`<div style="overflow-x:auto">${tbl(['الكود','الحساب','الافتتاحي مدين','الافتتاحي دائن','حركة مدينة','حركة دائنة','الختامي مدين','الختامي دائن'],j.rows.map(r=>[esc(r.code),esc(r.name)].concat(split(r.open),[dr(r.dr),dr(r.cr)],split(r.close))).concat([['','<b>الإجمالي</b>'].concat(split(T.open).map(x=>'<b>'+x+'</b>'),['<b>'+f(T.dr)+'</b>','<b>'+f(T.cr)+'</b>'],split(T.close).map(x=>'<b>'+x+'</b>'))]))}</div><p class="${Math.abs(T.dr-T.cr)<0.005?'good':''}">${Math.abs(T.dr-T.cr)<0.005?'✔ الميزان متوازن (إجمالي المدين = إجمالي الدائن).':'⚠ الميزان غير متوازن!'}</p>`)};
A.tbPr=()=>{if(!TBR){toast('اعرض التقرير أولًا',1);return}const j=TBR;printHtml(printHead('ميزان المراجعة')+`<p>الفترة: ${esc(ST.tb.from)} إلى ${esc(ST.tb.to)}</p>`+tbl(['الكود','الحساب','افتتاحي','مدين','دائن','ختامي'],j.rows.map(r=>[esc(r.code),esc(r.name),f(r.open),dr(r.dr),dr(r.cr),f(r.close)]))+printFoot())};

/* ---------- القوائم المالية ---------- */
V.c_rep=()=>{setTimeout(()=>A.repRun(),0);const t=ST.rt;
  return head('القوائم المالية')+`<div class="tb" style="gap:8px">${[['ie','الإيرادات والمصروفات حسب المشروع'],['bs','المركز المالي'],['age','تقادم أرصدة الموردين']].map(x=>`<button class="b ${t==x[0]?'':'o'}" data-a="repT" data-i="${x[0]}">${x[1]}</button>`).join('')}</div>`+
  bar(t=='ie'?`<label>من</label><input id="rf" type="date" value="${ST.ie.from}"><label>إلى</label><input id="rt" type="date" value="${ST.ie.to}">`:`<label>حتى تاريخ</label><input id="rt" type="date" value="${ST[t].to}">`)+`<div class="tb"><button class="b" data-a="repRun">عرض</button><button class="b o" data-a="repPr">طباعة</button></div><div class="box" id="rp"></div>`};
A.repT=i=>{ST.rt=i;render()};
let REPH='';
A.repRun=async()=>{const t=ST.rt;if(t=='ie'){if($('#rf')){ST.ie.from=V$('rf');ST.ie.to=V$('rt')}}else if($('#rt'))ST[t].to=V$('rt');
  if(t=='ie'){const j=await rapi('ie',{from:ST.ie.from,to:ST.ie.to});if(!j)return;
    const cols=j.projects.map(p=>({id:p.id,n:p.name,fu:p.funder})).concat([{id:'',n:'غير موزع',fu:''}]);
    const sec=ty=>j.rows.filter(r=>r.type==ty),sm=rs=>cols.map(c=>r2(rs.reduce((s,r)=>s+(r.byProj[c.id]||0),0)));
    const rv=sec('revenue'),ex=sec('expense'),rs=sm(rv),es=sm(ex),tot=rs.map((v,i)=>r2(v-es[i]));
    const row=(r)=>[esc(r.code+' · '+r.name)].concat(cols.map(c=>f(r.byProj[c.id]||0)),['<b>'+f(r.total)+'</b>']);
    const sumRow=(l,a)=>['<b>'+l+'</b>'].concat(a.map(v=>'<b>'+f(v)+'</b>'),['<b>'+f(r2(a.reduce((x,y)=>x+y,0)))+'</b>']);
    const h=['البند'].concat(cols.map(c=>esc(c.n)+(c.fu?'<br><small class="mu">'+esc(c.fu)+'</small>':'')),['الإجمالي']);
    REPH=`<h3>قائمة الإيرادات والمصروفات — ${esc(ST.ie.from)} إلى ${esc(ST.ie.to)}</h3><div style="overflow-x:auto">${tbl(h,rv.map(row).concat([sumRow('إجمالي الإيرادات',rs)],ex.map(row),[sumRow('إجمالي المصروفات',es)],[sumRow('الفائض / (العجز)',tot)]))}</div>`;rp(REPH)}
  else if(t=='bs'){const j=await rapi('bs',{to:ST.bs.to});if(!j)return;const sec=(l,a)=>[['<b>'+l+'</b>','']].concat(a.map(x=>[esc(x.code+' · '+x.name),f(x.v)]));
    REPH=`<h3>المركز المالي حتى ${esc(ST.bs.to)}</h3><div style="overflow-x:auto">${tbl(['البند','المبلغ'],sec('الأصول',j.assets).concat([['<b>إجمالي الأصول</b>','<b>'+f(j.totals.assets)+'</b>']],sec('الخصوم',j.liabilities),[['<b>إجمالي الخصوم</b>','<b>'+f(j.totals.liabilities)+'</b>']],sec('صافي الأصول',j.equity),[['فائض / (عجز) الفترة (الإيرادات − المصروفات)',f(j.surplus)],['<b>إجمالي صافي الأصول</b>','<b>'+f(j.totals.equity)+'</b>'],['<b>إجمالي الخصوم وصافي الأصول</b>','<b>'+f(j.totals.le)+'</b>']]))}</div><p class="${Math.abs(j.totals.assets-j.totals.le)<0.005?'good':''}">${Math.abs(j.totals.assets-j.totals.le)<0.005?'✔ الأصول = الخصوم + صافي الأصول.':'⚠ المعادلة المحاسبية غير متوازنة!'}</p>`;rp(REPH)}
  else{const j=await rapi('apAging',{to:ST.age.to});if(!j)return;const B=['0-30 يوم','31-60','61-90','أكثر من 90'];
    REPH=`<h3>تقادم أرصدة الموردين حتى ${esc(ST.age.to)}</h3><div style="overflow-x:auto">${tbl(['أمر التوريد','المورد','المشروع','أول استلام','العمر (يوم)','الفئة','المتبقي'],j.rows.map(r=>[esc(r.no),esc(r.supName),esc(pjl(r.proj)),r.first,r.age,B[r.bucket],f(r.o)]).concat([['<b>الإجمالي</b>','','','','','','<b>'+f(j.total)+'</b>']]))}</div><div class="cards" style="margin-top:12px">${B.map((b,i)=>`<div class="card"><small>${b}</small><h2>${f(j.buckets[i])}</h2></div>`).join('')}</div>`;rp(REPH)}};
A.repPr=()=>{if(!REPH){toast('اعرض التقرير أولًا',1);return}printHtml(printHead('قوائم مالية')+REPH.replace(/<a [^>]*>/g,'').replace(/<\/a>/g,'')+printFoot())};

/* ---------- دليل الحسابات ---------- */
V.c_coa=()=>head('دليل الحسابات',isAM()?'nacc':'','+ حساب جديد')+`<div class="box">${tbl(['الكود','الحساب','النوع','المجموعة','خصائص','الرصيد (مدين + / دائن −)','الحالة',''],AC().accounts.map(a=>[esc(a.code),esc(a.name),TYPES[a.type],esc(a.grp),[a.cash?'خزينة/بنك':'',a.sys?'مرتبط بالنظام':''].filter(Boolean).join('، ')||'—',f(AC().bal[a.id]||0),a.active?'<span class="st">نشط</span>':'<span class="st">موقوف</span>',isAM()?btn('nacc',a.id,'تعديل','o'):'']))}</div><p class="mu">حسابا المخزون والموردين تحت رقابة المخازن والمشتريات؛ لا يُرحَّل عليهما يدويًا.</p>`;
A.nacc=i=>{const x=i?accO(i):{type:'expense',active:true};mdl(i?'تعديل حساب':'حساب جديد',fld('كود الحساب','code',x.code)+fld('اسم الحساب','name',x.name)+sel('النوع','type',Object.entries(TYPES),x.type)+fld('المجموعة (للعرض)','grp',x.grp)+sel('خزينة / بنك؟ (يظهر في السداد والسندات)','cash',[['false','لا'],['true','نعم (أصل نقدي)']],String(!!x.cash))+(i?sel('الحالة','active',[['true','نشط'],['false','موقوف']],x.active?'true':'false'):''),()=>{const o=rd();return run('saveAcc',{...o,id:i||undefined},'تم حفظ الحساب')})};

/* ---------- المشروعات ---------- */
V.c_prj=()=>head('المشروعات والممولون',isAM()?'nprj':'','+ مشروع جديد')+`<div class="box">${tbl(['الكود','المشروع','الممول','إيرادات','مصروفات','الحالة',''],AC().projects.map(p=>{const j=AC().je.filter(x=>x.st=='مرحّل'||x.st=='معكوس'),sum=ty=>j.reduce((s,x)=>s+x.lines.filter(l=>l.proj==p.id&&accO(l.acc).type==ty).reduce((a,l)=>a+(ty=='revenue'?l.cr-l.dr:l.dr-l.cr),0),0);
  return[esc(p.code),esc(p.name),esc(p.funder),f(sum('revenue')),f(sum('expense')),p.active?'<span class="st">نشط</span>':'<span class="st">موقوف</span>',isAM()?btn('nprj',p.id,'تعديل','o'):'']}))}</div><p class="mu">المشاريع تُكوَّد مركزيًا (الإدارة ← المشاريع) ويختارها المستخدم من قائمة في طلب الشراء وأمر التوريد وطلب الصرف، فتُوزَّع القيود عليها تلقائيًا؛ ما بلا مشروع يظهر "غير موزع". الأرقام هنا من آخر القيود المحمّلة؛ التقرير الكامل في القوائم المالية.</p>`;

/* ---------- الفترات والفحص ---------- */
V.c_per=()=>`<div class="box"><h3>إقفال الفترات</h3><p>${AC().closedTo?'الفترة مُقفلة حتى <b>'+esc(AC().closedTo)+'</b>: لا قيود ولا مستندات مخزنية ولا سداد بتاريخ ضمنها.':'لا توجد فترة مُقفلة.'}</p>${isAM()?`<button class="b" data-a="clp">إقفال حتى تاريخ</button> `:''}${ar()=='admin'&&AC().closedTo?`<button class="b o" data-a="rop">إعادة فتح (مدير النظام)</button>`:''}<p class="mu">لا يُقفل بوجود قيود غير مُرحَّلة ضمن الفترة. لا حاجة لقيود إقفال سنوية: الفائض/العجز يُحسب في المركز المالي.</p></div>
<div class="box"><h3>فحص سلامة الدفاتر</h3><p class="mu">يتحقق من توازن كل قيد وميزان المراجعة، ومطابقة رصيد المخزون وحساب الموردين مع المخازن وأوامر التوريد، وسلامة الدفعات.</p>${['admin','manager','viewer'].includes(ar())?'<button class="b o" data-a="chk">تشغيل الفحص</button>':''}</div>`;
A.clp=()=>mdl('إقفال فترة',fld('إقفال حتى تاريخ (شامل)','date',today(),'date')+`<div class="full mu">بعد الإقفال لا يمكن الترحيل بتاريخ ضمن الفترة إلا بإعادة فتحها بواسطة مدير النظام.</div>`,()=>run('closePeriod',{date:rd().date},'تم إقفال الفترة'),'إقفال');
A.rop=()=>mdl('إعادة فتح الفترات',fld('فتح الفترات بعد التاريخ (اتركه فارغًا لفتح الكل)','date','','date')+fld('السبب (إلزامي)','reason','','ta','full'),()=>{const o=rd();if(!o.reason.trim()){toast('اكتب السبب',1);return false}return run('reopenPeriod',{date:o.date,reason:o.reason},'تمت إعادة الفتح')},'إعادة فتح');
A.chk=async()=>{const j=await rapi('acctCheck',{});if(!j)return;mdl('فحص سلامة الدفاتر',`<div class="full">${j.issues.length?`<p style="color:#a11"><b>${j.issues.length} ملاحظة:</b></p><ul>${j.issues.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="good"><b>✔ الدفاتر سليمة ومطابقة للمخازن والمشتريات.</b></p>'}<p class="mu">تم فحص ${j.lines} سطر دفتر و${j.entries} قيد.</p></div>`,null)};

/* ---------- ربط الحسابات بأدوار النظام ---------- */
const MAPR=[['INV','asset','المخزون','المخازن: الاستلام يُدين والصرف يُدائن','lock'],['AP','liability','الموردون','المشتريات: ذمم الموردين والسداد','lock'],['VATIN','asset','ضريبة القيمة المضافة - مدخلات','فواتير التوريد'],['ISS_EXP','expense','مصروف صرف المواد','صرف المخزون على الطلبات والمشروعات'],['PROC_EXP','expense','مصروف الخدمات والأعمال','بنود الخدمات في أوامر التوريد'],['INV_ADJ','expense','فروقات الجرد','تسويات الجرد (زيادة/عجز)'],['OPEN_EQ','equity','الرصيد الافتتاحي','الأرصدة الافتتاحية للمخزون والموردين'],['DON_RESTR','revenue','إيراد التبرعات المقيدة','التبرعات النقدية المقيدة بمشروع'],['DON_GEN','revenue','إيراد التبرعات العامة','التبرعات النقدية العامة'],['DON_INKIND','revenue','إيراد التبرعات العينية','التبرعات العينية (مقابل المخزون)'],['ADV','asset','عهد وسلف العاملين','العهد والسلف (يُنشأ 1410 تلقائيًا)'],['FA','asset','الأصول الثابتة (بالتكلفة)','الأصول الثابتة (1510)'],['ACCDEP','asset','مجمع إهلاك الأصول الثابتة','الإهلاك (1590)'],['DEPEXP','expense','مصروف الإهلاك','الإهلاك (5310)'],['FA_GAIN','revenue','أرباح استبعاد أصول','الاستبعاد (4190)'],['FA_LOSS','expense','خسائر استبعاد أصول','الاستبعاد (5290)']];
const TYN={asset:'أصول',liability:'خصوم',equity:'حقوق ملكية',revenue:'إيرادات',expense:'مصروفات'};
V.c_map=()=>{const A_=AC().accounts;
  return head('ربط الحسابات بأدوار النظام')+`<div class="box">${tbl(['الدور','يُستخدم في','النوع المطلوب','الحساب المرتبط حاليًا','إجراءات'],MAPR.map(m=>{const a=A_.find(x=>x.sys===m[0]);return[`<b>${esc(m[2])}</b><br><small class="mu">${m[0]}</small>`,esc(m[3]),TYN[m[1]],a?esc(a.code+' · '+a.name):'<span class="mu">تلقائي (يُنشأ/يُربط بالكود المعتاد عند أول استخدام)</span>',isAM()?btn('map',m[0],'تغيير الحساب','o'):'']}))}</div>
<div class="box"><h3>ملاحظات</h3><p class="mu">• تغيير الربط يسري على القيود الجديدة فقط؛ القيود القديمة تبقى على حساباتها (ويظهر الفرق في ميزان المراجعة).<br>• المخزون والموردون لا يُنقلان بعد وجود قيود على الحساب الحالي أو الجديد لارتباطهما بتسوية الأرصدة؛ اربطهما قبل بدء العمل أو بحسابات لم تُستخدم.<br>• الحساب الواحد لا يؤدي إلا دورًا واحدًا، ولا يصح ربط حساب خزينة/بنك؛ حسابات التحصيل النقدية تُربط بقنوات التحصيل (التبرعات ← قنوات التحصيل).<br>• لإضافة حساب جديد ثم ربطه: دليل الحسابات ← حساب جديد.</p></div>`};
A.map=k=>{const m=MAPR.find(x=>x[0]==k),cur=AC().accounts.find(x=>x.sys===k);
  const el=AC().accounts.filter(a=>a.type===m[1]&&a.active&&!a.cash&&(!a.sys||a.sys===k));
  mdl('ربط دور: '+m[2],`<div class="full mu">${esc(m[3])}${m[4]?'<br>هذا الدور لا يُنقل بعد وجود قيود على الحساب.':''}</div>`+sel('الحساب ('+TYN[m[1]]+')','acc',[['','— اختر —']].concat(el.map(a=>[a.id,a.code+' · '+a.name])),cur?cur.id:'','full'),()=>{const o=rd();if(!o.acc){toast('اختر الحساب',1);return false}return run('saveAccMap',{key:k,acc:o.acc},'تم ربط الحساب')})};
})();
