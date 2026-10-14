/* =====================================================================
   عروض الأسعار (RFQ) + سلاسل الاعتماد والتفويض (إدارة) + تقدّم الاعتماد في الطلبات + اتفاقيات المنح
   ===================================================================== */
(()=>{
const jp=(v,d)=>{if(v&&typeof v==='object')return v;try{return v?JSON.parse(v):d}catch(e){return d}};
const RF=()=>D.rfq||[];
const canRfq=()=>is('admin','procurement');
const supN=id=>(D.sup.find(s=>s.id==id)||{}).name||'؟';
const uN=n=>{const u=(D.users||[]).find(x=>x.username===n);return u?u.name+' ('+n+')':n};
const WF=()=>D.wf||{rules:[],deleg:[]};
NAVX.proc.push(['p_rfq','عروض الأسعار']);
/* نضيف التاب بعد الموردين دون تكرار إن وُجد */
{const o=MODS.proc.nav;MODS.proc.nav=()=>{const n=o().filter(x=>x[0]!=='p_rfq');if(is('admin','procurement','approver','finance'))n.push(['p_rfq','عروض الأسعار']);return n}}
{const o=MODS.adm.nav;MODS.adm.nav=()=>{const n=o().filter(x=>x[0]!=='a_wf');const i=n.findIndex(x=>x[0]==='a_log');n.splice(i<0?n.length:i,0,['a_wf','سلاسل الاعتماد والتفويض']);return n}}

/* ---------- عروض الأسعار ---------- */
const rst=x=>({'مفتوح':'مفتوح','مُرسى':'مُرسى','محوّل':'محوّل لأمر توريد','ملغي':'ملغي'}[x]||x);
V.p_rfq=()=>{const L=RF();return head('طلبات عروض الأسعار',canRfq()?'nrfq':'','+ طلب عروض')+`<div class="box">${tbl(['الرقم','التاريخ','طلب الشراء','الموردون','البنود','آخر موعد','الحالة','أمر التوريد',''],L.map(r=>[esc(r.no),esc(r.date),esc(r.prNo||'—'),r.sups.length+' ('+Object.keys(r.quotes).length+' عرض)',r.items.length,esc(r.due||'—'),st(rst(r.st)),esc(r.poNo||'—'),btn('rfv',r.id,'مقارنة','o')+(canRfq()&&r.st==='مفتوح'?btn('rfd',r.id,'إلغاء','r'):'')]))}</div>
<p class="mu">اختر موردَين على الأقل، سجّل عرض كل مورد، قارن، ثم رسِّ الطلب (مع مبرر إن لم يكن الأقل سعرًا) وحوّله لأمر توريد.</p>`};
A.nrfq=()=>{const prs=D.pr.filter(p=>p.st==='معتمد');
  mdl('طلب عروض أسعار',sel('من طلب شراء معتمد (اختياري)','prId',[['','— بنود يدوية —']].concat(prs.map(p=>[p.id,p.no+' · '+pjl(p.proj)])),'','full')
  +`<div class="full"><label>الموردون (اختر موردَين على الأقل)</label><div style="display:flex;flex-wrap:wrap;gap:8px">${D.sup.map(s=>`<label style="font-weight:400"><input type="checkbox" class="rs" value="${esc(s.id)}"> ${esc(s.name)}</label>`).join('')||'<span class="mu">لا موردين</span>'}</div></div>`
  +fld('آخر موعد لاستلام العروض','due','','date')+fld('ملاحظات','note','','text','full')
  +`<div class="full" id="rman"><label>البنود اليدوية (إن لم تختر طلب شراء) — بيان | وحدة | كمية</label><div id="rit"></div><button type="button" class="b o s" data-a="rfadd">+ بند</button></div>`,
  ()=>{const o=rd();o.sups=$$('#mb .rs:checked').map(x=>x.value);if(o.sups.length<2){toast('اختر موردَين على الأقل',1);return false}
   if(!o.prId){o.items=$$('#rit .ri').map(r=>{const i=r.querySelectorAll('input');return{d:i[0].value.trim(),u:i[1].value.trim(),q:+i[2].value||0}}).filter(x=>x.d);if(!o.items.length){toast('أضف بندًا أو اختر طلب شراء',1);return false}}
   return run('saveRFQ',o,'تم إنشاء طلب العروض')});A.rfadd()};
A.rfadd=()=>{const d=document.createElement('div');d.className='ri';d.style.cssText='display:flex;gap:6px;margin:3px 0';d.innerHTML='<input placeholder="البيان" style="flex:3"><input placeholder="الوحدة" style="width:70px"><input type="number" min="0" step="any" placeholder="الكمية" style="width:80px">';$('#rit').appendChild(d)};
A.rfd=i=>{const r=RF().find(x=>x.id==i);if(confirm('إلغاء طلب العروض '+r.no+'؟'))run('delRFQ',{id:i,ver:r.ver},'تم الإلغاء')};
A.rfv=async i=>{const r=RF().find(x=>x.id==i);let c;try{c=await api('rfqCmp',{id:i})}catch(e){toast(e.message,1);return}
  const aw=r.award;
  const head1=['البند','الكمية'].concat(c.sups.map(s=>esc(s.name)));
  const rows=c.items.map((it,k)=>[esc(it.d),it.q+' '+esc(it.u||'')].concat(c.sups.map(s=>{const p=s.quote?+s.quote.prices[k]:0;if(!s.quote)return'—';if(!(p>0))return'<span class="mu">لم يُسعّر</span>';const isB=c.best[k]&&c.best[k].sup===s.id;return isB?`<b style="color:#1e8449">${f(p)} ✔</b>`:f(p)})));
  rows.push([ '<b>الإجمالي بدون ضريبة</b>','' ].concat(c.sups.map(s=>s.total?`<b>${f(s.total.total)}</b>${s.total.complete?'':' <small class="mu">(ناقص)</small>'}`:'—')));
  rows.push(['الضريبة %',''].concat(c.sups.map(s=>s.quote?s.quote.vat:'—')));
  rows.push(['<b>الإجمالي شامل</b>',''].concat(c.sups.map(s=>s.total?`<b>${f(s.total.gross)}</b>${c.lowest===s.id?' ⭐':''}`:'—')));
  rows.push(['التسليم / الشروط',''].concat(c.sups.map(s=>s.quote?esc((s.quote.delivery||'')+' '+(s.quote.terms||'')):'—')));
  rows.push(['',''].concat(c.sups.map(s=>(canRfq()&&r.st==='مفتوح'?btn('rfq1',r.id+'|'+s.id,s.quote?'تعديل العرض':'تسجيل عرض','o'):'')+(canRfq()&&r.st==='مفتوح'&&s.total&&s.total.complete?btn('rfaw',r.id+'|'+s.id,'ترسية','g'):''))));
  mdl('مقارنة العروض '+r.no+' — '+rst(r.st),`<div class="full" style="overflow-x:auto">${tbl(head1,rows)}</div><div class="full mu">⭐ الأقل سعرًا إجمالًا بين العروض المكتملة — ✔ الأقل في البند.</div>`
   +(aw?`<div class="full"><b>الترسية:</b> ${esc(supN(aw.sup))} — بواسطة ${esc(aw.byName)} ${aw.lowest?'(الأقل سعرًا)':'(ليس الأقل — مبرر: '+esc(aw.reason)+')'}</div>`:'')
   +(canRfq()&&r.st==='مُرسى'?`<div class="full"><button class="b g" data-a="rf2po" data-i="${r.id}">إنشاء أمر توريد من العرض المُرسى</button></div>`:'')+attBox('RFQ',r.id),null)};
A.rfq1=p=>{const [id,sid]=p.split('|');const r=RF().find(x=>x.id==id),q=r.quotes[sid]||{prices:[],vat:0};dlg.close();
  setTimeout(()=>mdl('عرض '+supN(sid)+' — '+r.no,`<div class="full" style="overflow-x:auto">${tbl(['البند','الكمية','سعر الوحدة'],r.items.map((it,k)=>[esc(it.d),it.q+' '+esc(it.u||''),`<input class="qp" type="number" min="0" step="any" value="${q.prices[k]||''}" style="width:110px">`]))}</div>`+fld('ضريبة %','vat',q.vat||0,'number')+fld('مدة التسليم','delivery',q.delivery||'')+fld('شروط الدفع','terms',q.terms||'')+fld('ملاحظات','note',q.note||'','text','full'),
   async()=>{const o=rd();o.id=id;o.ver=r.ver;o.sup=sid;o.prices=$$('#mb .qp').map(x=>x.value);const j=await run('quoteRFQ',o,'تم تسجيل العرض');if(j!==false&&j!==undefined)setTimeout(()=>A.rfv(id),400);return j}),200)};
A.rfaw=p=>{const [id,sid]=p.split('|');const r=RF().find(x=>x.id==id);dlg.close();
  setTimeout(()=>mdl('ترسية على '+supN(sid),fld('مبرر الترسية (إلزامي إن لم يكن الأقل سعرًا أو عرض واحد مكتمل)','reason','','ta','full'),async()=>{const j=await run('awardRFQ',{id,ver:r.ver,sup:sid,reason:rd().reason},'تمت الترسية');if(j!==false&&j!==undefined)setTimeout(()=>A.rfv(id),400);return j},'ترسية'),200)};
A.rf2po=async i=>{const r=RF().find(x=>x.id==i);if(!confirm('إنشاء أمر توريد من العرض المُرسى؟'))return;const j=await run('rfqToPO',{id:i,ver:r.ver},'تم إنشاء أمر التوريد');if(j)dlg.close()};

/* ---------- تقدم الاعتماد في الطلبات والأوامر ---------- */
const wfBox=(kind,r,amtTxt)=>{const w=jp(r.wf,null);if(!w||!w.levels)return'';
  const rows=w.levels.map((lv,i)=>{const s=w.steps[i];const who=(lv.users||[]).map(uN).concat((lv.profs||[]).map(p=>'دور: '+((D.profiles||[]).find(x=>x.id==p)||{name:p}).name));return[i+1,esc(lv.name),esc(who.join('، ')||'—'),s?`✔ ${esc(s.byName)}${s.via?' (تفويضًا عن '+esc(s.via)+')':''} — ${esc(String(s.at).slice(0,10))}`:(i===w.steps.length&&['جديد','معتمد جزئيًا'].includes(r.st)?'<b>⏳ المرحلة الحالية</b>':'—')]});
  return `<div class="full"><label>سلسلة الاعتماد: ${esc(w.name)}</label>${tbl(['#','المرحلة','المعتمدون','الحالة'],rows)}</div>`};
{const o=A.vpr;A.vpr=i=>{o(i);const x=D.pr.find(p=>p.id==i);const b=wfBox('PR',x);if(b)$('#mb').insertAdjacentHTML('beforeend',b)}}
{const o=A.vpo;A.vpo=i=>{o(i);const x=D.po.find(p=>p.id==i);const b=wfBox('PO',x);if(b)$('#mb').insertAdjacentHTML('beforeend',b)}}

/* ---------- إدارة: سلاسل الاعتماد والتفويض ---------- */
const lvTxt=lv=>lv.map((l,i)=>(i+1)+') '+esc(l.name)+': '+esc((l.users||[]).map(uN).concat((l.profs||[]).map(p=>'دور '+((D.profiles||[]).find(x=>x.id==p)||{name:p}).name)).join('، '))).join('<br>');
V.a_wf=()=>{const W=WF();
  return head('سلاسل الاعتماد متعددة المراحل','nwf','+ سلسلة جديدة')+`<div class="box">${tbl(['الاسم','النوع','من مبلغ','إلى مبلغ','المراحل','الحالة',''],W.rules.map(r=>[`<b>${esc(r.name)}</b>`,r.kind==='PR'?'طلب شراء':'أمر توريد',f(r.min),r.max?f(r.max):'∞',lvTxt(r.levels),st(r.active?'فعّالة':'موقوفة'),btn('nwf',r.id,'تعديل','o')+btn('xwf',r.id,'حذف','r')]))}</div>
<p class="mu">القاعدة تُطبَّق حسب مبلغ الطلب (التقدير) أو أمر التوريد (بدون ضريبة). إن لم تنطبق أي سلسلة يبقى الاعتماد بخطوة واحدة كالمعتاد. تُثبَّت مراحل السلسلة على الطلب عند أول اعتماد. لا يعتمد الشخص نفسه مرحلتين، والمدير العام يتجاوز المراحل.</p>`
  +head('تفويض الاعتماد (أثناء الإجازة/الغياب)','ndl','+ تفويض')+`<div class="box">${tbl(['من','إلى (المفوَّض)','من تاريخ','إلى تاريخ','ملاحظة','الحالة',''],W.deleg.map(x=>[esc(uN(x.from)),esc(uN(x.to)),esc(x.start),esc(x.end),esc(x.note||''),st(!x.active?'موقوف':(x.end<today()?'منتهٍ':(x.start>today()?'قادم':'ساري'))),btn('ndl',x.id,'تعديل','o')+btn('xdl',x.id,'حذف','r')]))}</div>`};
const lvRow=(l={})=>`<div class="lvr box" style="padding:8px;margin:4px 0"><div style="display:flex;gap:6px;flex-wrap:wrap"><input class="ln" placeholder="اسم المرحلة" value="${esc(l.name||'')}" style="flex:1;min-width:140px"><select class="lu" multiple size="4" style="min-width:180px" title="المعتمدون">${(D.users||[]).filter(u=>u.active!==false).map(u=>`<option value="${esc(u.username)}"${(l.users||[]).includes(u.username)?' selected':''}>${esc(u.name)} (${esc(u.username)})</option>`).join('')}</select><select class="lp" multiple size="4" style="min-width:160px" title="أدوار">${(D.profiles||[]).filter(p=>p.active).map(p=>`<option value="${esc(p.id)}"${(l.profs||[]).includes(p.id)?' selected':''}>دور: ${esc(p.name)}</option>`).join('')}</select><button type="button" class="b r s" data-a="lvx">حذف</button></div></div>`;
A.lvx=()=>{const e=event&&event.target&&event.target.closest('.lvr');if(e)e.remove()};
A.lvadd=()=>$('#lvs').insertAdjacentHTML('beforeend',lvRow());
A.nwf=i=>{const x=i?WF().rules.find(r=>r.id==i):{kind:'PR',min:0,max:0,levels:[{},{}],active:true};
  mdl(i?'تعديل سلسلة':'سلسلة اعتماد',fld('اسم السلسلة','name',x.name,'text','full')+sel('ينطبق على','kind',[['PR','طلبات الشراء'],['PO','أوامر التوريد']],x.kind)+fld('من مبلغ','min',x.min,'number')+fld('إلى مبلغ (0 = بلا حد)','max',x.max,'number')+sel('الحالة','active',[['true','فعّالة'],['false','موقوفة']],String(x.active!==false))
   +`<div class="full"><label>المراحل بالترتيب (اختر معتمدًا أو أكثر و/أو دورًا؛ Ctrl للاختيار المتعدد)</label><div id="lvs">${x.levels.map(lvRow).join('')}</div><button type="button" class="b o s" data-a="lvadd">+ مرحلة</button></div>`,
   ()=>{const o=rd();if(i)o.id=i;o.levels=$$('#lvs .lvr').map(r=>({name:r.querySelector('.ln').value.trim(),users:[...r.querySelector('.lu').selectedOptions].map(x=>x.value),profs:[...r.querySelector('.lp').selectedOptions].map(x=>x.value)}));return run('saveWf',o,'تم الحفظ')})};
A.xwf=i=>{if(confirm('حذف السلسلة؟ لا تتأثر الطلبات الجارية.'))run('delWf',{id:i},'تم الحذف')};
A.ndl=i=>{const x=i?WF().deleg.find(r=>r.id==i):{start:today(),end:today(),active:true};const adm=D.user.role==='admin';
  mdl(i?'تعديل تفويض':'تفويض اعتماد',(adm?sel('المفوِّض','from',(D.users||[]).map(u=>[u.username,u.name+' ('+u.username+')']),x.from||D.user.username):'')+sel('المفوَّض إليه','to',[['','— اختر —']].concat((D.users||[]).filter(u=>u.active!==false&&u.username!==D.user.username).map(u=>[u.username,u.name+' ('+u.username+')'])),x.to||'')+fld('من','start',x.start,'date')+fld('إلى','end',x.end,'date')+sel('الحالة','active',[['true','ساري'],['false','موقوف']],String(x.active!==false))+fld('ملاحظة','note',x.note,'text','full'),()=>{const o=rd();if(i)o.id=i;return run('saveDeleg',o,'تم الحفظ')})};
A.xdl=i=>{if(confirm('حذف التفويض؟'))run('delDeleg',{id:i},'تم الحذف')};

/* ---------- اتفاقيات المنح (داخل الحسابات) ---------- */
NAVX.acc.push(['c_grn','اتفاقيات المنح']);
const GR=()=>D.grants||[];
const gw=()=>['admin','manager','accountant'].includes((D.acc||{}).role);
const gm=()=>['admin','manager'].includes((D.acc||{}).role);
V.c_grn=()=>{const L=GR();const al=[];L.forEach(g=>g.sum.warn.forEach(w=>al.push([esc(g.no+' · '+g.funder),esc(w.k),esc(w.due),w.v?f(w.v):''])));
  return head('اتفاقيات المنح والممولون',gw()?'ngr':'','+ اتفاقية جديدة')+(al.length?`<div class="box" style="border-color:#e67e22"><h3>⚠ تنبيهات المنح</h3>${tbl(['الاتفاقية','التنبيه','التاريخ','المبلغ'],al)}</div>`:'')
  +`<div class="box">${tbl(['الرقم','الممول','العنوان','المشروع','الفترة','القيمة','المحصّل','المستحق','المنصرف (المشروع)','نسبة الصرف','الحالة',''],L.map(g=>[esc(g.no),esc(g.funder),esc(g.title),esc(g.proj||'—'),esc(g.start+' → '+g.end),f(g.amount),f(g.sum.received),f(g.sum.dueAmt),g.proj?f(g.sum.spent):'—',g.sum.pctSpent==null?'—':g.sum.pctSpent+'%',st(g.st),btn('vgr',g.id,'عرض','o')+(gw()?btn('ngr',g.id,'تعديل','o'):'')]))}</div>
<p class="mu">المنصرف = مصروفات المشروع المرتبط خلال فترة الاتفاقية. التنبيهات تظهر هنا فقط (لا إشعار تلقائي خارج النظام).</p>`};
const trRow=(t={})=>`<tr class="gtr" data-id="${esc(t.id||'')}"><td><input type="date" value="${esc(t.due||'')}" ${t.st==='مستلمة'?'disabled':''}></td><td><input type="number" min="0" step="any" value="${t.amount||''}" ${t.st==='مستلمة'?'disabled':''} style="width:110px"></td><td>${t.st==='مستلمة'?'✔ مستلمة '+esc(t.recvDate):`<button type="button" class="b r s" data-a="grx">حذف</button>`}</td></tr>`;
const rpRow=(r={})=>`<tr class="grp" data-id="${esc(r.id||'')}"><td><input type="date" value="${esc(r.due||'')}"></td><td><input value="${esc(r.title||'')}" placeholder="عنوان التقرير"></td><td><label style="font-weight:400"><input type="checkbox" ${r.done?'checked':''}> تم</label></td><td><button type="button" class="b r s" data-a="grx">حذف</button></td></tr>`;
A.grx=()=>{const e=event&&event.target&&event.target.closest('tr');if(e)e.remove()};
A.gtadd=()=>$('#gtb').insertAdjacentHTML('beforeend',trRow());
A.gradd=()=>$('#grb').insertAdjacentHTML('beforeend',rpRow());
A.ngr=i=>{const x=i?GR().find(g=>g.id==i):{cur:'EGP',start:today(),end:today().slice(0,4)+'-12-31',tranches:[],reports:[],st:'ساري'};
  mdl(i?'تعديل اتفاقية':'اتفاقية منحة',fld('الجهة الممولة','funder',x.funder)+fld('عنوان الاتفاقية','title',x.title)+fld('رقم الاتفاقية','agreement',x.agreement)+fld('كود المشروع المرتبط','proj',x.proj)+fld('قيمة المنحة','amount',x.amount,'number')+fld('العملة','cur',x.cur)+fld('بداية','start',x.start,'date')+fld('نهاية','end',x.end,'date')+(i?sel('الحالة','st',[['ساري','ساري'],['منتهي','منتهي'],['ملغى','ملغى']],x.st):'')+fld('الشروط والالتزامات','conds',x.conds,'ta','full')+fld('ملاحظات','note',x.note,'text','full')
  +`<div class="full"><label>الشرائح</label><table><thead><tr><th>الاستحقاق</th><th>المبلغ</th><th></th></tr></thead><tbody id="gtb">${x.tranches.map(trRow).join('')}</tbody></table><button type="button" class="b o s" data-a="gtadd">+ شريحة</button></div>`
  +`<div class="full"><label>مواعيد التقارير</label><table><thead><tr><th>الموعد</th><th>العنوان</th><th></th><th></th></tr></thead><tbody id="grb">${x.reports.map(rpRow).join('')}</tbody></table><button type="button" class="b o s" data-a="gradd">+ تقرير</button></div>`+(i?attBox('GRANT',i):''),
  ()=>{const o=rd();if(i){o.id=i;o.ver=x.ver}
   o.tranches=$$('#gtb .gtr').map(r=>{const k=r.querySelectorAll('input');return{id:r.dataset.id||undefined,due:k[0].value,amount:k[1].value}});
   o.reports=$$('#grb .grp').map(r=>{const k=r.querySelectorAll('input');return{id:r.dataset.id||undefined,due:k[0].value,title:k[1].value,done:k[2].checked}});
   return run('saveGrant',o,'تم الحفظ')});if(i)attInit&&attInit()};
A.vgr=i=>{const g=GR().find(x=>x.id==i),s=g.sum,accs=(D.acc&&D.acc.payAccts)||[];
  mdl('اتفاقية '+g.no+' — '+g.funder,kv('العنوان',g.title)+kv('رقم الاتفاقية',g.agreement)+kv('المشروع',g.proj)+kv('الفترة',g.start+' → '+g.end)+kv('القيمة',f(g.amount)+' '+g.cur)+kv('المحصّل',f(s.received))+kv('المستحق التحصيل',f(s.dueAmt))+kv('المنصرف',g.proj?f(s.spent):'—')+kv('رصيد غير منصرف',g.proj?f(s.balance):'—')+kv('الحالة',g.st)
   +(g.conds?`<div class="full"><label>الشروط</label>${esc(g.conds)}</div>`:'')
   +`<div class="full"><label>الشرائح</label>${tbl(['الاستحقاق','المبلغ','الحالة',''],g.tranches.map(t=>[esc(t.due),f(t.amount),t.st==='مستلمة'?'✔ مستلمة '+esc(t.recvDate):(t.due<today()?'<b style="color:#c0392b">متأخرة</b>':'مستحقة'),(gw()&&t.st!=='مستلمة'&&g.st==='ساري'&&S().accLink?btn('grr',g.id+'|'+t.id,'تحصيل','g'):'')]))}</div>`
   +`<div class="full"><label>التقارير</label>${tbl(['الموعد','العنوان','الحالة'],g.reports.map(r=>[esc(r.due),esc(r.title),r.done?'✔ سُلِّم '+esc(r.doneDate):(r.due<today()?'<b style="color:#c0392b">متأخر</b>':'قادم')]))}</div>`
   +(gm()&&!g.tranches.some(t=>t.st==='مستلمة')?`<div class="full"><button class="b r" data-a="gdl" data-i="${g.id}">حذف الاتفاقية</button></div>`:'')+attBox('GRANT',g.id),null);attInit&&attInit()};
A.grr=p=>{const [id,tid]=p.split('|');const g=GR().find(x=>x.id==id),t=g.tranches.find(x=>x.id==tid),accs=((D.acc&&D.acc.payAccts)||[]);dlg.close();
  setTimeout(()=>mdl('تحصيل شريحة '+f(t.amount),sel('الإيداع في','acc',[['','— اختر —']].concat(accs.map(a=>[a.id,a.code+' · '+a.name])),'','full')+fld('تاريخ التحصيل','date',today(),'date'),()=>{const o=rd();if(!o.acc){toast('اختر الحساب',1);return false}o.id=id;o.ver=g.ver;o.trId=tid;return run('recvTranche',o,'تم التحصيل وترحيل القيد')},'تحصيل'),200)};
A.gdl=i=>{const g=GR().find(x=>x.id==i);if(confirm('حذف الاتفاقية؟')){dlg.close();run('delGrant',{id:i,ver:g.ver},'تم الحذف')}};
})();
