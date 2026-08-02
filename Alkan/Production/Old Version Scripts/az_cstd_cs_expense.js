/**
 * @description Cash Custody Expense — browser-side client script.
 *              Handles the full expense lifecycle UI:
 *              - List view of all expenses
 *              - Detail view with lines, processing actions
 *              - Inline create form for new expenses with lines
 *
 * @copyright 2026 Azdan
 * @author    Azdan
 */
(function () {
    'use strict';

    /* ================================================================
       COMMON HELPERS  (shared pattern — see az_cstd_cs_dashboard.js)
       ================================================================ */

    var render = renderWithShell;
    var _el    = AzCore.el;
    var post   = AzCore.AzHttp.post;

    function el(tag, attrs) {
        var args = [tag, attrs || {}];
        for (var i = 2; i < arguments.length; i++) {
            var arg = arguments[i];
            if (Array.isArray(arg)) { for (var j = 0; j < arg.length; j++) args.push(arg[j]); }
            else { args.push(arg); }
        }
        return _el.apply(null, args);
    }

    function renderWithShell(c, p) {
        if (c === 'pageshell')   return buildPageShell(p || {});
        if (c === 'alertbanner') return buildAlert(p || {});
        if (c === 'datatable')   return buildTable(p || {});
        if (c === 'statscard')   return buildStatCard(p || {});
        return AzCore.render(c, p || {});
    }

    function buildAlert(p) {
        var pal = { info:{bg:'#eff6ff',bd:'#bfdbfe',fg:'#1e3a8a',ic:'ℹ'}, success:{bg:'#ecfdf5',bd:'#a7f3d0',fg:'#065f46',ic:'✓'}, warning:{bg:'#fffbeb',bd:'#fde68a',fg:'#92400e',ic:'⚠'}, danger:{bg:'#fef2f2',bd:'#fecaca',fg:'#991b1b',ic:'✖'} };
        var s = pal[p.variant] || pal.info;
        return el('div',{style:'display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:6px;border:1px solid '+s.bd+';background:'+s.bg+';color:'+s.fg+';font-size:13px;line-height:1.45;'},
            el('span',{style:'font-weight:700;min-width:18px;text-align:center;'},s.ic),
            el('span',{},p.text||p.message||''));
    }

    function buildStatCard(p) {
        return el('div',{style:'flex:1;min-width:180px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;box-shadow:0 1px 2px rgba(0,0,0,0.04);'},
            el('div',{style:'font-size:12px;color:#6b7280;margin-bottom:6px;'},p.label||''),
            el('div',{style:'font-size:24px;font-weight:700;color:#111827;'},String(p.value!=null?p.value:0)));
    }

    var PAGE_SIZE = 10;
    var PAG_BAR = 'display:flex;align-items:center;gap:8px;padding:10px 12px;font-size:13px;color:#374151;';
    var PAG_BTN = 'border:1px solid #d1d5db;border-radius:4px;padding:4px 12px;font-size:12px;font-weight:600;background:#fff;color:#374151;cursor:pointer;';
    var PAG_BTN_DIS = 'border:1px solid #e5e7eb;border-radius:4px;padding:4px 12px;font-size:12px;font-weight:600;background:#f9fafb;color:#9ca3af;cursor:default;';
    var PAG_INPUT = 'width:48px;height:28px;border:1px solid #d1d5db;border-radius:4px;text-align:center;font-size:12px;';

    function buildPaginationBar(currentPage, totalPages, onPageChange) {
        var prevBtn = el('button',{type:'button',style:currentPage<=1?PAG_BTN_DIS:PAG_BTN},'Prev');
        var nextBtn = el('button',{type:'button',style:currentPage>=totalPages?PAG_BTN_DIS:PAG_BTN},'Next');
        var pageInput = el('input',{type:'text',style:PAG_INPUT,value:String(currentPage)});
        var label = el('span',{},'Page ');
        var ofLabel = el('span',{},' of '+totalPages);
        if (currentPage > 1) { prevBtn.addEventListener('click',function(){ onPageChange(currentPage-1); }); }
        if (currentPage < totalPages) { nextBtn.addEventListener('click',function(){ onPageChange(currentPage+1); }); }
        pageInput.addEventListener('keydown',function(e){
            if (e.key==='Enter') {
                var val = parseInt(pageInput.value,10);
                if (val>=1 && val<=totalPages && val!==currentPage) onPageChange(val);
                else pageInput.value = String(currentPage);
            }
        });
        return el('div',{style:PAG_BAR},prevBtn,label,pageInput,ofLabel,nextBtn);
    }

    var SORT_ARROW = {asc:' ▲',desc:' ▼',none:' ▴▾'};
    var TH_BASE = 'text-align:left;padding:10px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap;cursor:pointer;user-select:none;';

    function naturalCompare(a, b) {
        if (a == null && b == null) return 0;
        if (a == null) return -1; if (b == null) return 1;
        var na = parseFloat(String(a).replace(/,/g,'')), nb = parseFloat(String(b).replace(/,/g,''));
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return String(a).localeCompare(String(b), undefined, {numeric:true, sensitivity:'base'});
    }

    function buildTable(p) {
        var cols = p.columns||[], allRows = p.rows||[];
        if (!allRows.length) return buildAlert({variant:'info',text:p.emptyMessage||'No records found.'});

        var sortField = cols[0] ? cols[0].field : null;
        var sortDir = 'asc';
        var sortedRows = allRows.slice();
        var wrapper = el('div',{});

        function doSort() {
            if (!sortField) { sortedRows = allRows.slice(); return; }
            var dir = sortDir === 'asc' ? 1 : -1;
            sortedRows = allRows.slice().sort(function(a,b){ return dir * naturalCompare(a[sortField], b[sortField]); });
        }

        function renderPage(page) {
            wrapper.innerHTML = '';
            var totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
            if (page > totalPages) page = totalPages;
            var currentPage = page;
            var start = (page - 1) * PAGE_SIZE;
            var pageRows = sortedRows.slice(start, start + PAGE_SIZE);

            var ths = cols.map(function(c){
                var arrow = c.field === sortField ? (sortDir === 'asc' ? SORT_ARROW.asc : SORT_ARROW.desc) : SORT_ARROW.none;
                var th = el('th',{style:TH_BASE+(c.width?'width:'+c.width:'')},
                    el('span',{},c.label||c.field||''),
                    el('span',{style:'font-size:10px;margin-left:3px;color:#9ca3af;'},arrow));
                th.addEventListener('click',function(){
                    if (sortField === c.field) { sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }
                    else { sortField = c.field; sortDir = 'asc'; }
                    doSort(); renderPage(1);
                });
                return th;
            });
            var trs = pageRows.map(function(row,idx){
                var globalIdx = start + idx;
                var tds = cols.map(function(c){
                    if (c.render) return el('td',{style:'padding:10px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top;'},c.render(row));
                    return el('td',{style:'padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#111827;vertical-align:top;'},String(row[c.field]==null?'':row[c.field]));
                });
                var tr = el('tr',{style:p.striped&&globalIdx%2?'background:#f9fafb;':'cursor:default;'},tds);
                if (p.onRowClick){tr.addEventListener('click',function(){p.onRowClick(row);});tr.style.cursor='pointer';}
                return tr;
            });
            wrapper.appendChild(el('div',{style:'overflow-x:auto;border:1px solid #e5e7eb;border-radius:6px;'},
                el('table',{style:'width:100%;border-collapse:collapse;font-size:13px;background:#fff;'},
                    el('thead',{},el('tr',{},ths)),
                    el('tbody',{},trs))));
            if (totalPages > 1) wrapper.appendChild(buildPaginationBar(currentPage, totalPages, function(pg){ renderPage(pg); }));
        }
        doSort();
        renderPage(1);
        return wrapper;
    }

    function buildPageShell(p) {
        var mod = p.navbar&&p.navbar.moduleName?p.navbar.moduleName:'';
        var body = p.body;
        if (!body && p.loading) {
            body = el('div',{style:'display:flex;align-items:center;gap:10px;padding:18px 0;color:#6b7280;'},
                el('span',{style:'display:inline-block;width:18px;height:18px;border:2px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:azspin .8s linear infinite;'}),
                el('span',{},p.loadingText||'Loading…'));
        }
        return el('div',{className:'az-cstd-shell',style:'display:flex;flex-direction:column;gap:18px;padding:4px 0 24px 0;'},
            el('div',{style:'background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;box-shadow:0 1px 2px rgba(0,0,0,0.04);'},
                el('div',{style:'font-size:18px;font-weight:700;color:#111827;'},p.appName||'Cash Custody'),
                mod?el('div',{style:'font-size:13px;color:#6b7280;margin-top:4px;'},mod):''),
            el('div',{style:'display:flex;flex-direction:column;gap:16px;'},body||''));
    }

    var seed       = window.__azSeed || {};
    var postUrl    = seed.postUrl || '';
    var recordId   = seed.recordId || '';
    var mode       = seed.view || '';
    var custodyId  = seed.custodyId || '';
    var container  = document.getElementById('az-app-root');

    function fmtCurrency(v) { return Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }

    function isRetryable(err) {
        var msg = String(err && err.message || err || '').toLowerCase();
        return msg.indexOf('abort') !== -1 || msg.indexOf('network') !== -1
            || msg.indexOf('failed to fetch') !== -1 || msg.indexOf('timeout') !== -1;
    }

    function delay(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }

    function fetchAction(action, params, _attempt) {
        var attempt = _attempt || 1;
        var MAX_RETRIES = 2;
        var RETRY_DELAY = 2000; // 2 seconds between retries
        return post(postUrl,{action:action,params:params||{}}).then(function(r){
            var res = r && r.data ? r.data : r;
            if (res&&res.success) return res.data||res;
            var err = (res&&res.error) || (action+' failed');
            if (typeof err !== 'string') err = err.message || JSON.stringify(err);
            throw new Error(err);
        }).catch(function(err){
            if (attempt <= MAX_RETRIES && isRetryable(err)) {
                return delay(RETRY_DELAY * attempt).then(function(){
                    return fetchAction(action, params, attempt + 1);
                });
            }
            throw err;
        });
    }

    var CARD = 'background:#fff;border-radius:8px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border:1px solid #e5e7eb';
    function card(title, children, extra) {
        var inner = [];
        if (title) inner.push(el('h3',{style:'margin:0 0 12px 0;font-size:15px;font-weight:600;color:#1f2937;'},title));
        return el('div',{className:'az-card',style:CARD+(extra?';'+extra:'')},inner.concat(children));
    }

    function injectStyles() {
        if (document.getElementById('az-cstd-styles')) return;
        var s = document.createElement('style'); s.id = 'az-cstd-styles';
        s.textContent = '@keyframes azspin{to{transform:rotate(360deg)}}';
        document.head.appendChild(s);
    }

    function buildBaseUrl() {
        var base = window.location.pathname;
        var search = window.location.search || '';
        var kept = [];
        if (search.length > 1) {
            var pairs = search.substring(1).split('&');
            for (var i = 0; i < pairs.length; i++) {
                var key = pairs[i].split('=')[0];
                if (key !== 'rid' && key !== 'view' && key !== 'mode') kept.push(pairs[i]);
            }
        }
        return base + (kept.length ? '?' + kept.join('&') : '');
    }

    function navigateTo(params) {
        var u = buildBaseUrl();
        var sep = u.indexOf('?') > -1 ? '&' : '?';
        for (var k in params) { u += sep + k + '=' + encodeURIComponent(params[k]); sep = '&'; }
        window.location.href = u;
    }

    function infoCell(label, value) {
        return el('div',{},
            el('div',{style:'font-size:12px;color:#6b7280;margin-bottom:2px;'},label),
            el('div',{style:'font-size:14px;font-weight:500;color:#1f2937;'},String(value||'—')));
    }

    /* ── Form helpers ──────────────────────────────────── */
    var INPUT_STYLE = 'height:36px;border:1px solid #d1d5db;border-radius:6px;padding:0 10px;font-size:13px;width:100%;box-sizing:border-box;';
    var TA_STYLE    = 'border:1px solid #d1d5db;border-radius:6px;padding:8px 10px;font-size:13px;width:100%;min-height:80px;box-sizing:border-box;resize:vertical;';
    var BTN_PRI     = 'border:0;border-radius:6px;padding:10px 20px;font-size:13px;font-weight:700;color:#fff;background:#2563eb;cursor:pointer;';
    var BTN_SEC     = 'border:1px solid #d1d5db;border-radius:6px;padding:10px 20px;font-size:13px;font-weight:600;color:#374151;background:#fff;cursor:pointer;';
    var BTN_DAN     = 'border:0;border-radius:6px;padding:8px 14px;font-size:12px;font-weight:700;color:#fff;background:#dc2626;cursor:pointer;';
    var BTN_ACT     = 'border:0;border-radius:4px;padding:6px 12px;font-size:12px;font-weight:600;color:#fff;cursor:pointer;';

    function formGroup(label, inputEl) {
        return el('div',{style:'display:flex;flex-direction:column;gap:4px;'},
            el('label',{style:'font-size:12px;font-weight:600;color:#374151;'},label), inputEl);
    }

    function buildSelect(options, placeholder) {
        var sel = el('select',{style:INPUT_STYLE},
            el('option',{value:''},placeholder||'— Select —'));
        (options||[]).forEach(function(o){
            sel.appendChild(el('option',{value:o.id||o.value},o.text||o.label||''));
        });
        return sel;
    }

    function btn(label, style, onClick) {
        var b = el('button',{type:'button',style:style},label);
        b.addEventListener('click', onClick);
        return b;
    }

    /* ================================================================
       LIST VIEW
       ================================================================ */

    function mountListView() {
        showShell('Loading expenses…');
        fetchAction('getExpenseList').then(function(data){
            var rows = (data.expenses||[]).map(function(e){
                return {id:e.id,custody:e.custody,employee:e.employee,
                    amtFmt:fmtCurrency(e.totalAmount),status:e.status,
                    date:e.date,currency:e.currency,notes:e.notes||''};
            });
            var toolbar = el('div',{style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;'},
                el('h2',{style:'margin:0;font-size:20px;font-weight:700;color:#1f2937;'},'Custody Expenses'),
                btn('+ New Expense',BTN_PRI,function(){ navigateTo({view:'create'}); }));
            var table = render('datatable',{
                columns:[
                    {label:'ID',field:'id',width:'60px'},{label:'Custody',field:'custody',width:'140px'},
                    {label:'Employee',field:'employee',width:'140px'},{label:'Total Amount',field:'amtFmt',width:'120px'},
                    {label:'Status',field:'status',width:'110px'},{label:'Date',field:'date',width:'100px'},
                    {label:'Currency',field:'currency',width:'80px'},{label:'Notes',field:'notes',width:'180px'}],
                rows:rows, striped:true, emptyMessage:'No custody expenses found.',
                onRowClick:function(row){ navigateTo({rid:row.id}); }});
            renderPage(el('div',{style:'display:flex;flex-direction:column;gap:16px;'},toolbar,table));
        }).catch(function(e){ renderPage(buildAlert({variant:'danger',text:'Failed to load expenses. '+(e.message||e)})); });
    }

    /* ================================================================
       DETAIL VIEW
       ================================================================ */

    function mountDetailView() {
        showShell('Loading expense #' + recordId + '…');
        fetchAction('getExpenseDetail',{expenseId:recordId}).then(function(data){
            var exp = data.expense||{};
            var lines = data.lines||[];
            var cust = data.custody||{};
            var resultBox = el('div',{});

            // Header
            var header = el('div',{style:'display:flex;align-items:center;justify-content:space-between;'},
                el('h2',{style:'margin:0;font-size:20px;font-weight:700;color:#1f2937;'},'Expense #'+recordId),
                el('span',{style:'font-size:14px;font-weight:600;color:#2563eb;'},exp.statusText||''));

            // Back + View Record + sync buttons
            var viewUrl = data.viewUrl || '';
            var actions = el('div',{style:'display:flex;gap:8px;flex-wrap:wrap;'},
                btn('← Back',BTN_SEC,function(){ history.back(); }),
                viewUrl ? btn('View Record ↗',BTN_SEC,function(){ window.open(viewUrl,'_blank'); }) : '',
                btn('Sync Totals',BTN_PRI,function(){
                    resultBox.innerHTML='';
                    resultBox.appendChild(buildAlert({variant:'info',text:'Syncing totals…'}));
                    fetchAction('syncTotals',{expenseId:recordId}).then(function(){ window.location.reload(); })
                    .catch(function(e){ resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'danger',text:'Sync failed: '+(e.message||e)})); });
                }));

            // Expense info
            var info = card('Expense Information',[el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;'},
                infoCell('Expense ID',exp.id||recordId), infoCell('Status',exp.statusText),
                infoCell('Custody',exp.custodyText), infoCell('Employee',exp.employeeText),
                infoCell('Currency',exp.currencyText), infoCell('Date',exp.date),
                infoCell('Posting Date',exp.postingDate), infoCell('Total Amount',fmtCurrency(exp.totalAmount)),
                infoCell('Replenishment Account',exp.replAccountText||'—'),
                infoCell('Notes',exp.notes||'—'))]);

            // Custody snapshot
            var custCard = cust.id ? card('Linked Custody',[el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;'},
                infoCell('Custody ID',cust.id), infoCell('Type',cust.type),
                infoCell('Balance',fmtCurrency(cust.balance)))]) : '';

            // KPI
            var totalProcessed = 0, totalUnprocessed = 0;
            lines.forEach(function(ln){ var a = ln.baseAmount || ln.amount || 0; if(ln.isProcessed) totalProcessed += a; else totalUnprocessed += a; });
            var kpi = el('div',{style:'display:flex;gap:14px;flex-wrap:wrap;'},
                render('statscard',{label:'Total Amount',value:fmtCurrency(exp.totalAmount)}),
                render('statscard',{label:'Processed',value:fmtCurrency(totalProcessed)}),
                render('statscard',{label:'Unprocessed',value:fmtCurrency(totalUnprocessed)}),
                render('statscard',{label:'Lines',value:lines.length}));

            // Lines table with action buttons
            var lineRows = lines.map(function(ln){
                return {id:ln.id, type:ln.type, vendor:ln.vendor||'—', employee:ln.employee||'—',
                    amtFmt:fmtCurrency(ln.amount), currency:ln.currency||'—',
                    exchRate:ln.exchRate ? String(ln.exchRate) : '—',
                    baseAmtFmt:fmtCurrency(ln.baseAmount),
                    expAccount:ln.expAccount||'—', tx:ln.genTxText||'—',
                    memo:ln.memo||'', error:ln.error||'',
                    project:ln.type==='Direct Expense' ? (ln.projectText||'—') : '',
                    projectTask:ln.type==='Direct Expense' ? (ln.projectTaskText||'—') : '',
                    _raw:ln};
            });
            var lineTable = render('datatable',{
                columns:[
                    {label:'ID',field:'id',width:'50px'},{label:'Type',field:'type',width:'110px'},
                    {label:'Vendor',field:'vendor',width:'120px'},{label:'Employee',field:'employee',width:'120px'},
                    {label:'Amount',field:'amtFmt',width:'100px'},{label:'Currency',field:'currency',width:'80px'},
                    {label:'Exch Rate',field:'exchRate',width:'80px'},{label:'Base Amt',field:'baseAmtFmt',width:'100px'},
                    {label:'Exp Account',field:'expAccount',width:'120px'},{label:'Project',field:'project',width:'120px'},
                    {label:'Project Task',field:'projectTask',width:'130px'},{label:'Transaction',field:'tx',width:'110px'},
                    {label:'Memo',field:'memo',width:'140px'},{label:'Error',field:'error',width:'140px'},
                    {label:'Actions',field:'id',width:'160px',render:function(row){
                        if (!row._raw.isProcessed) {
                            return el('div',{style:'display:flex;gap:6px;'},
                                btn('Process',BTN_ACT+'background:#2563eb;',function(e){
                                    e.stopPropagation();
                                    resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'info',text:'Processing line #'+row.id+'…'}));
                                    fetchAction('processLine',{lineId:row.id,expenseId:recordId,custodyData:cust})
                                    .then(function(res){
                                        if (res && res.reclassError) {
                                            resultBox.innerHTML='';
                                            resultBox.appendChild(buildAlert({variant:'warning',text:'Line processed but OCA reclassification failed: '+res.reclassError}));
                                            setTimeout(function(){ window.location.reload(); }, 3000);
                                        } else { window.location.reload(); }
                                    })
                                    .catch(function(err){ resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'danger',text:'Process failed: '+(err.message||err)})); });
                                }),
                                btn('Void',BTN_ACT+'background:#dc2626;',function(e){
                                    e.stopPropagation();
                                    resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'info',text:'Voiding line #'+row.id+'…'}));
                                    fetchAction('voidLine',{lineId:row.id,expenseId:recordId,custodyData:cust})
                                    .then(function(){ window.location.reload(); })
                                    .catch(function(err){ resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'danger',text:'Void failed: '+(err.message||err)})); });
                                }));
                        }
                        return el('span',{style:'color:#9ca3af;font-size:12px;'},row._raw.isProcessed?'Processed':'—');
                    }}],
                rows:lineRows,striped:true,emptyMessage:'No expense lines found.'});

            // Shared detail styles
            var DZ_STYLE = 'border:2px dashed #d1d5db;border-radius:8px;padding:16px;text-align:center;'
                + 'cursor:pointer;transition:all 0.15s ease;background:#fafafa;margin-top:8px;';
            var DZ_HOVER = 'border-color:#2563eb;background:#eff6ff;';
            var CHIP_STYLE = 'display:inline-flex;align-items:center;gap:6px;padding:4px 10px;'
                + 'background:#f3f4f6;border:1px solid #e5e7eb;border-radius:16px;font-size:12px;color:#374151;margin:3px;';

            // Collapsible attachments per line
            var attachSection = el('div',{});
            lines.forEach(function(ln){
                var isOpen = false;
                var body = el('div',{style:'padding:8px 12px 12px;display:none;'});
                var countBadge = el('span',{style:'display:inline-flex;align-items:center;justify-content:center;'
                    + 'min-width:18px;height:18px;border-radius:9px;font-size:11px;font-weight:600;padding:0 5px;'
                    + 'background:#9ca3af;color:#fff;'},'…');
                var arrow = el('span',{style:'transition:transform 0.15s;font-size:10px;'},'▶');

                var toggle = el('div',{style:'display:flex;align-items:center;gap:8px;cursor:pointer;padding:10px 12px;'
                    + 'font-size:13px;font-weight:600;color:#374151;user-select:none;'
                    + 'background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:4px;'});
                toggle.appendChild(arrow);
                toggle.appendChild(el('span',{},'Line #' + ln.id + ' — ' + (ln.type || 'Unknown')));
                toggle.appendChild(countBadge);
                toggle.addEventListener('click', function(){
                    isOpen = !isOpen;
                    body.style.display = isOpen ? 'block' : 'none';
                    arrow.textContent = isOpen ? '▼' : '▶';
                    if (isOpen) loadLineFiles(ln.id, chipArea, msgEl, countBadge);
                });

                var msgEl = el('div',{});
                var chipArea = el('div',{style:'display:flex;flex-wrap:wrap;margin-top:6px;'});

                // Drag-drop zone
                var hiddenInput = el('input',{type:'file',multiple:true,
                    accept:'.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx',style:'display:none;'});
                var dropZone = el('div',{style:DZ_STYLE},
                    el('div',{style:'font-size:13px;color:#6b7280;pointer-events:none;'},
                        '📂 Drag files here or ',el('span',{style:'color:#2563eb;text-decoration:underline;'},'browse')));
                dropZone.addEventListener('click', function(){ hiddenInput.click(); });
                dropZone.addEventListener('dragover', function(e){ e.preventDefault(); dropZone.style.cssText = DZ_STYLE + DZ_HOVER; });
                dropZone.addEventListener('dragleave', function(){ dropZone.style.cssText = DZ_STYLE; });
                dropZone.addEventListener('drop', function(e){
                    e.preventDefault(); dropZone.style.cssText = DZ_STYLE;
                    doUpload(ln.id, Array.prototype.slice.call(e.dataTransfer.files), chipArea, msgEl, countBadge);
                });
                hiddenInput.addEventListener('change', function(){
                    doUpload(ln.id, Array.prototype.slice.call(hiddenInput.files), chipArea, msgEl, countBadge);
                    hiddenInput.value = '';
                });

                body.appendChild(dropZone);
                body.appendChild(hiddenInput);
                body.appendChild(msgEl);
                body.appendChild(chipArea);

                var panel = el('div',{});
                panel.appendChild(toggle);
                panel.appendChild(body);
                attachSection.appendChild(panel);

                // Load file count eagerly for badge
                fetchAction('getFiles',{recordId:String(ln.id)}).then(function(res){
                    var cnt = (res.files||[]).length;
                    countBadge.textContent = String(cnt);
                    countBadge.style.background = cnt ? '#2563eb' : '#9ca3af';
                }).catch(function(){ countBadge.textContent = '?'; });
            });

            function doUpload(lineId, files, chipArea, msgEl, badge) {
                if (!files.length) return;
                msgEl.innerHTML=''; msgEl.appendChild(buildAlert({variant:'info',text:'Uploading ' + files.length + ' file(s)…'}));
                Promise.all(files.map(function(f){
                    return new Promise(function(resolve, reject){
                        var reader = new FileReader();
                        reader.onload = function(){ resolve({name:f.name,data:reader.result,type:f.type}); };
                        reader.onerror = function(){ reject(new Error('Read failed')); };
                        reader.readAsDataURL(f);
                    });
                })).then(function(fileData){
                    return fetchAction('uploadFiles',{recordId:String(lineId),files:fileData});
                }).then(function(){
                    msgEl.innerHTML='';
                    loadLineFiles(lineId, chipArea, msgEl, badge);
                }).catch(function(e){
                    msgEl.innerHTML=''; msgEl.appendChild(buildAlert({variant:'danger',text:'Upload failed: '+(e.message||e)}));
                });
            }

            function loadLineFiles(lineId, chipArea, msgEl, badge) {
                chipArea.innerHTML = '';
                fetchAction('getFiles',{recordId:String(lineId)}).then(function(res){
                    var files = res.files||[];
                    badge.textContent = String(files.length);
                    badge.style.background = files.length ? '#2563eb' : '#9ca3af';
                    if (!files.length) {
                        chipArea.appendChild(el('div',{style:'font-size:12px;color:#9ca3af;padding:4px 0;'},'No attachments'));
                        return;
                    }
                    files.forEach(function(f){
                        var size = f.size ? ' (' + (f.size/1024).toFixed(1) + ' KB)' : '';
                        var chip = el('div',{style:CHIP_STYLE});
                        if (f.url) {
                            chip.appendChild(el('a',{href:f.url,target:'_blank',style:'color:#2563eb;text-decoration:none;'},'📎 ' + (f.originalName||f.fileName) + size));
                        } else {
                            chip.appendChild(el('span',{},'📎 ' + (f.originalName||f.fileName) + size));
                        }
                        var rm = el('span',{style:'cursor:pointer;color:#dc2626;font-weight:700;font-size:14px;line-height:1;'},'×');
                        (function(indexId){
                            rm.addEventListener('click', function(){
                                if (!confirm('Remove this file?')) return;
                                fetchAction('removeFile',{indexId:indexId}).then(function(){
                                    loadLineFiles(lineId, chipArea, msgEl, badge);
                                }).catch(function(e){ msgEl.innerHTML=''; msgEl.appendChild(buildAlert({variant:'danger',text:'Remove failed: '+(e.message||e)})); });
                            });
                        })(f.indexId);
                        chip.appendChild(rm);
                        chipArea.appendChild(chip);
                    });
                }).catch(function(e){
                    chipArea.appendChild(el('div',{style:'font-size:12px;color:#dc2626;'},'Failed to load: '+(e.message||e)));
                });
            }

            renderPage(el('div',{style:'display:flex;flex-direction:column;gap:16px;'},
                actions, header, info, custCard, kpi, card('Expense Lines',[lineTable]),
                card('Attachments',[attachSection]), resultBox));
        }).catch(function(e){ renderPage(buildAlert({variant:'danger',text:'Failed to load expense. '+(e.message||e)})); });
    }

    /* ================================================================
       CREATE VIEW
       ================================================================ */

    function mountCreateView() {
        showShell('Preparing expense form…');

        /* ── State ── */
        var selectedSubsidiaryId = '';
        var selectedCurrencyId   = '';
        var selectedCurrencyText = '';
        var ddCache = {};                       // dropdown data cache keyed by action+params

        function cacheKey(action, p) { return action + ':' + JSON.stringify(p || {}); }

        function fetchCached(action, params) {
            var k = cacheKey(action, params);
            if (ddCache[k]) return Promise.resolve(ddCache[k]);
            return fetchAction(action, params).then(function (d) { ddCache[k] = d; return d; });
        }

        /* ── Fetch custodies ── */
        var fetchPromise;
        if (custodyId) {
            fetchPromise = fetchAction('searchCustodies',{keyword:''}).then(function(data){
                var all = data.custodies || [];
                if (!Array.isArray(all)) all = [];
                var match = [];
                for (var i = 0; i < all.length; i++) {
                    if (String(all[i].id) === String(custodyId)) { match.push(all[i]); break; }
                }
                if (!match.length) match = [{id:custodyId, text:'Custody #'+custodyId, subsidiaryId:'', currencyId:''}];
                return match;
            });
        } else {
            fetchPromise = fetchAction('searchCustodies',{keyword:''}).then(function(data){
                var all = data.custodies || [];
                if (!Array.isArray(all)) all = [];
                return all;
            });
        }

        fetchPromise.then(function(custOptions){
            var lines = [];
            var linesContainer = el('div',{});
            var msgBox = el('div',{});

            /** Sum amounts entered on OTHER lines that share the same bill/report */
            function othersTotal(currentLn) {
                var srcId = currentLn.bill || currentLn.expReport || '';
                if (!srcId) return 0;
                var total = 0;
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i] === currentLn) continue;
                    var otherId = lines[i].bill || lines[i].expReport || '';
                    if (otherId === srcId && lines[i].amountEl) {
                        total += parseFloat(lines[i].amountEl.value || 0);
                    }
                }
                return total;
            }

            /* ── Custody selector ── */
            var custSel;
            if (custodyId) {
                custSel = buildSelect(custOptions, custOptions.length ? custOptions[0].text : '');
                custSel.value = custodyId;
                custSel.disabled = true;
                custSel.style.cssText = INPUT_STYLE + 'background:#f3f4f6;color:#6b7280;';
                if (custOptions.length) {
                    selectedSubsidiaryId = custOptions[0].subsidiaryId || '';
                    selectedCurrencyId   = custOptions[0].currencyId || '';
                    selectedCurrencyText = custOptions[0].currencyText || '';
                }
            } else {
                custSel = buildSelect(custOptions,'— Select Custody —');
                custSel.addEventListener('change', function(){
                    for (var i = 0; i < custOptions.length; i++) {
                        if (String(custOptions[i].id) === custSel.value) {
                            selectedSubsidiaryId = custOptions[i].subsidiaryId || '';
                            selectedCurrencyId   = custOptions[i].currencyId || '';
                            selectedCurrencyText = custOptions[i].currencyText || '';
                            break;
                        }
                    }
                    ddCache = {};          // subsidiary changed → clear caches
                    lines = [];            // reset lines
                    rebuildLines();
                });
            }

            var dateInput  = el('input',{type:'date',style:INPUT_STYLE});
            dateInput.value = new Date().toISOString().slice(0,10);
            var notesInput = el('textarea',{style:TA_STYLE,placeholder:'Notes…'});

            /* ── Replenishment Account (searchable select) ── */
            var replAccountEl = el('select',{style:INPUT_STYLE});
            replAccountEl.appendChild(el('option',{value:''},'Loading accounts…'));
            var replAccountValue = '';

            function loadReplAccounts() {
                // Fetch all active accounts with no type restriction for replenishment
                fetchAction('searchAccounts', {})
                    .then(function(data){
                        var accts = data && data.accounts ? data.accounts : [];
                        populateSelect(replAccountEl, accts, '— Select Replenishment Account —');
                        if (replAccountValue) replAccountEl.value = replAccountValue;
                    })
                    .catch(function(){
                        replAccountEl.innerHTML = '';
                        replAccountEl.appendChild(el('option',{value:''},'— Select Replenishment Account —'));
                    });
            }
            loadReplAccounts();
            replAccountEl.addEventListener('change', function(){ replAccountValue = replAccountEl.value; });

            var EXP_TYPES = [
                {value:'1',text:'Vendor Bill'},
                {value:'2',text:'Expense Report'},
                {value:'3',text:'Direct Expense'}
            ];

            /* ================================================
               Line builder helpers
               ================================================ */

            function populateSelect(sel, items, placeholder) {
                sel.innerHTML = '';
                sel.appendChild(el('option',{value:''},placeholder));
                (items||[]).forEach(function(o){ sel.appendChild(el('option',{value:o.id||o.value},o.text||o.label||'')); });
            }

            function rebuildLines() {
                linesContainer.innerHTML = '';
                lines.forEach(function(ln, idx) { buildLineCard(ln, idx); });
            }

            function buildLineCard(ln, idx) {
                /* -- always-present elements (cached on ln) -- */
                if (!ln.typeEl) {
                    ln.typeEl = buildSelect(EXP_TYPES,'— Expense Type —');
                    ln.typeEl.addEventListener('change', function(){
                        var oldType = ln.type;
                        ln.type = ln.typeEl.value;
                        if (oldType !== ln.type) {
                            ln.bill=''; ln.expReport=''; ln.vendor=''; ln.employee='';
                            ln.apAccount=''; ln.expAccount=''; ln.taxCode='';
                            ln.amount=''; ln.baseAmount=''; ln.txCurrency=''; ln.txCurrencyId='';
                            ln.exchRate=1;
                            ln.project=''; ln.projectTask='';
                            ln._billEl=null; ln._reportEl=null; ln._vendorEl=null;
                            ln._expAccEl=null; ln._taxEl=null; ln._infoDiv=null; ln._txDetails=null;
                            ln._projectEl=null; ln._projectTaskEl=null; ln._currencyEl=null;
                            if (ln.amountEl) ln.amountEl.value='';
                            rebuildLines();
                        }
                    });
                }
                if (ln.type) ln.typeEl.value = ln.type;

                if (!ln.amountEl) {
                    ln.amountEl = el('input',{type:'number',style:INPUT_STYLE,placeholder:'0.00',step:'0.01'});
                    ln.amountEl.addEventListener('input', function(){
                        // User enters in custody currency — recalc tx amount only
                        var entered = parseFloat(ln.amountEl.value || 0);
                        ln.amount = String(entered / (ln.exchRate || 1));
                        // Validate: this line + other lines for same bill/report cannot exceed base amount
                        if (ln._origBaseAmount) {
                            var base = parseFloat(ln._origBaseAmount);
                            var total = entered + othersTotal(ln);
                            if (total > base) {
                                ln.amountEl.style.borderColor = '#dc2626';
                                if (!ln._amtWarnEl) {
                                    ln._amtWarnEl = el('div',{style:'font-size:12px;color:#dc2626;margin-top:2px;'});
                                }
                                var msg = entered > base
                                    ? 'Cannot exceed ' + fmtCurrency(base)
                                    : 'Total across lines (' + fmtCurrency(total) + ') exceeds ' + fmtCurrency(base);
                                ln._amtWarnEl.textContent = msg;
                                if (!ln._amtWarnEl.parentNode) ln.amountEl.parentNode.appendChild(ln._amtWarnEl);
                            } else {
                                ln.amountEl.style.borderColor = '#d1d5db';
                                if (ln._amtWarnEl && ln._amtWarnEl.parentNode) ln._amtWarnEl.parentNode.removeChild(ln._amtWarnEl);
                            }
                        }
                    });
                }
                if (ln.baseAmount) ln.amountEl.value = ln.baseAmount;
                else if (ln.amount) ln.amountEl.value = ln.amount;

                if (!ln.memoEl) {
                    ln.memoEl = el('input',{type:'text',style:INPUT_STYLE,placeholder:'Memo'});
                    ln.memoEl.addEventListener('input', function(){ ln.memo = ln.memoEl.value; });
                }
                if (ln.memo) ln.memoEl.value = ln.memo;

                /* -- card container -- */
                var lineCard = el('div',{style:'background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:10px;'});

                /* -- header row: # + type + remove -- */
                lineCard.appendChild(el('div',{style:'display:flex;gap:8px;align-items:flex-end;margin-bottom:10px;'},
                    el('div',{style:'min-width:30px;padding-top:20px;font-size:13px;font-weight:700;color:#6b7280;'},'#'+(idx+1)),
                    el('div',{style:'flex:1;max-width:220px;'},formGroup('Expense Type',ln.typeEl)),
                    el('div',{style:'margin-left:auto;padding-bottom:4px;'},btn('✕',BTN_DAN,function(){ lines.splice(idx,1); rebuildLines(); }))));

                /* -- dynamic fields -- */
                if (ln.type) {
                    var dynRow = el('div',{style:'margin-bottom:10px;'});
                    if (ln.type === '1')      buildBillFields(ln, dynRow);
                    else if (ln.type === '2') buildReportFields(ln, dynRow);
                    else if (ln.type === '3') buildDirectFields(ln, dynRow);
                    lineCard.appendChild(dynRow);

                    /* -- amount + memo (always when type is chosen) -- */
                    var amtLabel = selectedCurrencyText ? 'Amount (' + selectedCurrencyText + ')' : 'Amount';
                    lineCard.appendChild(el('div',{style:'display:flex;gap:8px;align-items:flex-end;'},
                        el('div',{style:'flex:1;min-width:140px;'},formGroup(amtLabel,ln.amountEl)),
                        el('div',{style:'flex:2;min-width:200px;'},formGroup('Memo',ln.memoEl))));

                    /* -- file attachments (mandatory, collapsible) -- */
                    lineCard.appendChild(buildAttachmentPanel(ln, true));
                }

                linesContainer.appendChild(lineCard);
            }

            /* ── Info display helpers ── */
            function showBillInfo(ln, d) {
                if (!ln._infoDiv) return;
                ln._infoDiv.innerHTML = '';
                var cells = [
                    infoCell('Vendor', d.vendor || '—'),
                    infoCell('AP Account', d.apAccountText || '—'),
                    infoCell('Expense Account', d.expAccountText || '—'),
                    infoCell('Tax Code', d.taxCodeText || '—')
                ];
                if (ln.exchRate && ln.exchRate !== 1) {
                    cells.push(infoCell('Currency', ln.txCurrency || d.currency || '—'));
                    cells.push(infoCell('Exchange Rate', String(ln.exchRate)));
                    cells.push(infoCell('Base Amount', fmtCurrency(ln.baseAmount)));
                }
                ln._infoDiv.appendChild(el('div', {style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;'}, cells));
            }
            function showReportInfo(ln, d) {
                if (!ln._infoDiv) return;
                ln._infoDiv.innerHTML = '';
                var cells = [
                    infoCell('Employee', d.employee || '—'),
                    infoCell('Expense Account', d.expAccountText || '—'),
                    infoCell('Tax Code', d.taxCodeText || '—')
                ];
                if (ln.exchRate && ln.exchRate !== 1) {
                    cells.push(infoCell('Currency', ln.txCurrency || d.currency || '—'));
                    cells.push(infoCell('Exchange Rate', String(ln.exchRate)));
                    cells.push(infoCell('Base Amount', fmtCurrency(ln.baseAmount)));
                }
                ln._infoDiv.appendChild(el('div', {style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;'}, cells));
            }

            /* ── Vendor Bill fields ── */
            function buildBillFields(ln, container) {
                if (!ln._billEl) {
                    ln._billEl = el('select',{style:INPUT_STYLE});
                    ln._billEl.appendChild(el('option',{value:''},'Loading bills…'));

                    fetchCached('getVendorBills',{subsidiaryId:selectedSubsidiaryId}).then(function(data){
                        var bills = data.bills || [];
                        populateSelect(ln._billEl, bills.map(function(b){
                            var rem = b.txAmountRemaining != null ? b.txAmountRemaining : b.amountRemaining;
                            var cur = b.currency ? ' ' + b.currency : '';
                            return {id:b.id, text:b.tranId+' – '+b.vendor+' ('+fmtCurrency(rem)+cur+')'};
                        }),'— Select Vendor Bill —');
                        if (ln.bill) ln._billEl.value = ln.bill;
                    });

                    ln._billEl.addEventListener('change', function(){
                        ln.bill = ln._billEl.value;
                        if (!ln.bill) { if (ln._infoDiv) ln._infoDiv.innerHTML=''; return; }
                        if (ln._infoDiv) { ln._infoDiv.innerHTML=''; ln._infoDiv.appendChild(el('span',{style:'font-size:12px;color:#6b7280;'},'Loading details…')); }
                        fetchAction('getTransactionDetails',{transactionId:ln.bill,transactionType:'vendorbill'}).then(function(d){
                            ln._txDetails = d;
                            ln.txCurrency   = d.currency || '';
                            ln.txCurrencyId = d.currencyId || '';
                            ln.amount       = String(d.amountRemaining||0);
                            ln.vendor     = d.vendorId||'';
                            ln.apAccount  = d.apAccount||'';
                            ln.expAccount = d.expAccount||'';
                            ln.taxCode    = d.taxCode||'';
                            // Resolve exchange rate if bill currency differs from custody currency
                            var billCurrId = d.currencyId || '';
                            if (billCurrId && selectedCurrencyId && billCurrId !== selectedCurrencyId) {
                                fetchAction('getExchangeRate',{fromCurrency:billCurrId,toCurrency:selectedCurrencyId}).then(function(r){
                                    ln.exchRate   = r.rate || 1;
                                    ln.baseAmount = String(parseFloat(ln.amount) * ln.exchRate);
                                    ln._origBaseAmount = ln.baseAmount;
                                    ln.amountEl.value = ln.baseAmount;
                                    showBillInfo(ln, d);
                                }).catch(function(){ ln.exchRate = 1; ln.baseAmount = ln.amount; ln._origBaseAmount = ln.baseAmount; ln.amountEl.value = ln.baseAmount; showBillInfo(ln, d); });
                            } else {
                                ln.exchRate = 1; ln.baseAmount = ln.amount;
                                ln._origBaseAmount = ln.baseAmount;
                                ln.amountEl.value = ln.baseAmount;
                                showBillInfo(ln, d);
                            }
                        }).catch(function(e){
                            if (ln._infoDiv) { ln._infoDiv.innerHTML=''; ln._infoDiv.appendChild(el('span',{style:'color:#dc2626;font-size:12px;'},'Error: '+(e.message||e))); }
                        });
                    });
                }
                if (ln.bill) ln._billEl.value = ln.bill;
                if (!ln._infoDiv) ln._infoDiv = el('div',{style:'margin-top:8px;'});

                container.appendChild(el('div',{style:'display:flex;gap:8px;'},
                    el('div',{style:'flex:1;min-width:300px;'},formGroup('Vendor Bill',ln._billEl))));
                container.appendChild(ln._infoDiv);
            }

            /* ── Expense Report fields ── */
            function buildReportFields(ln, container) {
                if (!ln._reportEl) {
                    ln._reportEl = el('select',{style:INPUT_STYLE});
                    ln._reportEl.appendChild(el('option',{value:''},'Loading reports…'));

                    fetchCached('getExpenseReports',{subsidiaryId:selectedSubsidiaryId}).then(function(data){
                        var rpts = data.reports || [];
                        populateSelect(ln._reportEl, rpts.map(function(r){
                            var rem = r.txAmountRemaining != null ? r.txAmountRemaining : r.amountRemaining;
                            var cur = r.currency ? ' ' + r.currency : '';
                            return {id:r.id, text:r.tranId+' – '+r.employee+' ('+fmtCurrency(rem)+cur+')'};
                        }),'— Select Expense Report —');
                        if (ln.expReport) ln._reportEl.value = ln.expReport;
                    });

                    ln._reportEl.addEventListener('change', function(){
                        ln.expReport = ln._reportEl.value;
                        if (!ln.expReport) { if (ln._infoDiv) ln._infoDiv.innerHTML=''; return; }
                        if (ln._infoDiv) { ln._infoDiv.innerHTML=''; ln._infoDiv.appendChild(el('span',{style:'font-size:12px;color:#6b7280;'},'Loading details…')); }
                        fetchAction('getTransactionDetails',{transactionId:ln.expReport,transactionType:'expensereport'}).then(function(d){
                            ln._txDetails = d;
                            ln.txCurrency   = d.currency || '';
                            ln.txCurrencyId = d.currencyId || '';
                            ln.amount       = String(d.amountRemaining||0);
                            ln.employee   = d.employeeId||'';
                            ln.expAccount = d.expAccount||'';
                            ln.taxCode    = d.taxCode||'';
                            // Resolve exchange rate if report currency differs from custody currency
                            var rptCurrId = d.currencyId || '';
                            if (rptCurrId && selectedCurrencyId && rptCurrId !== selectedCurrencyId) {
                                fetchAction('getExchangeRate',{fromCurrency:rptCurrId,toCurrency:selectedCurrencyId}).then(function(r){
                                    ln.exchRate   = r.rate || 1;
                                    ln.baseAmount = String(parseFloat(ln.amount) * ln.exchRate);
                                    ln._origBaseAmount = ln.baseAmount;
                                    ln.amountEl.value = ln.baseAmount;
                                    showReportInfo(ln, d);
                                }).catch(function(){ ln.exchRate = 1; ln.baseAmount = ln.amount; ln._origBaseAmount = ln.baseAmount; ln.amountEl.value = ln.baseAmount; showReportInfo(ln, d); });
                            } else {
                                ln.exchRate = 1; ln.baseAmount = ln.amount;
                                ln._origBaseAmount = ln.baseAmount;
                                ln.amountEl.value = ln.baseAmount;
                                showReportInfo(ln, d);
                            }
                        }).catch(function(e){
                            if (ln._infoDiv) { ln._infoDiv.innerHTML=''; ln._infoDiv.appendChild(el('span',{style:'color:#dc2626;font-size:12px;'},'Error: '+(e.message||e))); }
                        });
                    });
                }
                if (ln.expReport) ln._reportEl.value = ln.expReport;
                if (!ln._infoDiv) ln._infoDiv = el('div',{style:'margin-top:8px;'});

                container.appendChild(el('div',{style:'display:flex;gap:8px;'},
                    el('div',{style:'flex:1;min-width:300px;'},formGroup('Expense Report',ln._reportEl))));
                container.appendChild(ln._infoDiv);
            }

            /* ── Direct Expense fields ── */
            function buildDirectFields(ln, container) {
                /* ── Currency (defaults to custody currency) ── */
                if (!ln._currencyEl) {
                    ln._currencyEl = el('select',{style:INPUT_STYLE});
                    ln._currencyEl.appendChild(el('option',{value:''},'Loading…'));
                    fetchCached('searchCurrencies',{}).then(function(data){
                        populateSelect(ln._currencyEl, data.currencies||[],'— Select Currency —');
                        // Default to custody currency on first build
                        if (!ln.txCurrencyId && selectedCurrencyId) {
                            ln.txCurrencyId = selectedCurrencyId;
                            ln.txCurrency   = selectedCurrencyText;
                            ln.exchRate     = 1;
                        }
                        if (ln.txCurrencyId) ln._currencyEl.value = ln.txCurrencyId;
                    });
                    ln._currencyEl.addEventListener('change', function(){
                        ln.txCurrencyId = ln._currencyEl.value;
                        ln.txCurrency   = ln._currencyEl.options[ln._currencyEl.selectedIndex]
                            ? ln._currencyEl.options[ln._currencyEl.selectedIndex].text : '';
                        // Resolve exchange rate vs custody currency
                        if (ln.txCurrencyId && selectedCurrencyId && ln.txCurrencyId !== selectedCurrencyId) {
                            fetchAction('getExchangeRate',{fromCurrency:ln.txCurrencyId,toCurrency:selectedCurrencyId}).then(function(r){
                                ln.exchRate = r.rate || 1;
                            }).catch(function(){ ln.exchRate = 1; });
                        } else {
                            ln.exchRate = 1;
                        }
                    });
                }
                if (ln.txCurrencyId) ln._currencyEl.value = ln.txCurrencyId;

                if (!ln._vendorEl) {
                    ln._vendorEl = el('select',{style:INPUT_STYLE});
                    ln._vendorEl.appendChild(el('option',{value:''},'Loading…'));
                    fetchCached('searchVendors',{subsidiaryId:selectedSubsidiaryId}).then(function(data){
                        populateSelect(ln._vendorEl, data.vendors||[],'— Select Vendor —');
                        if (ln.vendor) ln._vendorEl.value = ln.vendor;
                    });
                    ln._vendorEl.addEventListener('change', function(){ ln.vendor = ln._vendorEl.value; });
                }
                if (ln.vendor) ln._vendorEl.value = ln.vendor;

                if (!ln._expAccEl) {
                    ln._expAccEl = el('select',{style:INPUT_STYLE});
                    ln._expAccEl.appendChild(el('option',{value:''},'Loading…'));
                    fetchCached('searchAccounts',{accountType:'Expense',subsidiaryId:selectedSubsidiaryId}).then(function(data){
                        populateSelect(ln._expAccEl, data.accounts||[],'— Select Expense Account —');
                        if (ln.expAccount) ln._expAccEl.value = ln.expAccount;
                    }).catch(function(){
                        populateSelect(ln._expAccEl, [],'— Select Expense Account —');
                    });
                    ln._expAccEl.addEventListener('change', function(){ ln.expAccount = ln._expAccEl.value; });
                }
                if (ln.expAccount) ln._expAccEl.value = ln.expAccount;

                if (!ln._taxEl) {
                    ln._taxEl = el('select',{style:INPUT_STYLE});
                    ln._taxEl.appendChild(el('option',{value:''},'Loading…'));
                    fetchCached('searchTaxCodes',{subsidiaryId:selectedSubsidiaryId}).then(function(data){
                        populateSelect(ln._taxEl, data.taxCodes||[],'— Select Tax Code —');
                        if (ln.taxCode) ln._taxEl.value = ln.taxCode;
                    });
                    ln._taxEl.addEventListener('change', function(){ ln.taxCode = ln._taxEl.value; });
                }
                if (ln.taxCode) ln._taxEl.value = ln.taxCode;

                container.appendChild(el('div',{style:'display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;'},
                    el('div',{style:'flex:1;min-width:160px;'},formGroup('Currency',ln._currencyEl)),
                    el('div',{style:'flex:1;min-width:200px;'},formGroup('Vendor',ln._vendorEl)),
                    el('div',{style:'flex:1;min-width:200px;'},formGroup('Expense Account',ln._expAccEl)),
                    el('div',{style:'flex:1;min-width:160px;'},formGroup('Tax Code',ln._taxEl))));

                /* ── Project ── */
                if (!ln._projectEl) {
                    ln._projectEl = el('select',{style:INPUT_STYLE});
                    ln._projectEl.appendChild(el('option',{value:''},'Loading…'));
                    fetchCached('searchProjects',{subsidiaryId:selectedSubsidiaryId}).then(function(data){
                        populateSelect(ln._projectEl, data.projects||[],'— Select Project —');
                        if (ln.project) ln._projectEl.value = ln.project;
                    });
                    ln._projectEl.addEventListener('change', function(){
                        ln.project = ln._projectEl.value;
                        // Reset task and reload for new project
                        ln.projectTask = '';
                        if (ln._projectTaskEl) {
                            ln._projectTaskEl.innerHTML = '';
                            if (ln.project) {
                                ln._projectTaskEl.appendChild(el('option',{value:''},'Loading…'));
                                fetchAction('searchProjectTasks',{projectId:ln.project}).then(function(data){
                                    populateSelect(ln._projectTaskEl, data.tasks||[],'— Select Project Task —');
                                });
                            } else {
                                ln._projectTaskEl.appendChild(el('option',{value:''},'— Select Project Task —'));
                            }
                        }
                    });
                }
                if (ln.project) ln._projectEl.value = ln.project;

                /* ── Project Task (depends on Project) ── */
                if (!ln._projectTaskEl) {
                    ln._projectTaskEl = el('select',{style:INPUT_STYLE});
                    if (ln.project) {
                        ln._projectTaskEl.appendChild(el('option',{value:''},'Loading…'));
                        fetchAction('searchProjectTasks',{projectId:ln.project}).then(function(data){
                            populateSelect(ln._projectTaskEl, data.tasks||[],'— Select Project Task —');
                            if (ln.projectTask) ln._projectTaskEl.value = ln.projectTask;
                        });
                    } else {
                        ln._projectTaskEl.appendChild(el('option',{value:''},'— Select Project Task —'));
                    }
                    ln._projectTaskEl.addEventListener('change', function(){ ln.projectTask = ln._projectTaskEl.value; });
                }
                if (ln.projectTask) ln._projectTaskEl.value = ln.projectTask;

                container.appendChild(el('div',{style:'display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;margin-top:8px;'},
                    el('div',{style:'flex:1;min-width:200px;'},formGroup('Project',ln._projectEl)),
                    el('div',{style:'flex:1;min-width:200px;'},formGroup('Project Task',ln._projectTaskEl))));
            }

            /* ── Shared styles ── */
            var DROP_ZONE_STYLE = 'border:2px dashed #d1d5db;border-radius:8px;padding:20px;text-align:center;'
                + 'cursor:pointer;transition:all 0.15s ease;background:#fafafa;';
            var DROP_ZONE_HOVER = 'border-color:#2563eb;background:#eff6ff;';
            var FILE_CHIP_STYLE = 'display:inline-flex;align-items:center;gap:6px;padding:4px 10px;'
                + 'background:#f3f4f6;border:1px solid #e5e7eb;border-radius:16px;font-size:12px;color:#374151;margin:3px;';

            /* ── Collapsible attachment panel (create form) ── */
            function buildAttachmentPanel(ln, mandatory) {
                if (!ln.pendingFiles) ln.pendingFiles = [];
                var isOpen = ln.pendingFiles.length > 0;

                var body = el('div',{style:'padding:10px 0 0 0;display:' + (isOpen ? 'block' : 'none') + ';'});
                var countBadge = el('span',{style:'display:inline-flex;align-items:center;justify-content:center;'
                    + 'min-width:18px;height:18px;border-radius:9px;font-size:11px;font-weight:600;padding:0 5px;'
                    + 'background:' + (ln.pendingFiles.length ? '#2563eb' : '#9ca3af') + ';color:#fff;'},
                    String(ln.pendingFiles.length));

                var toggle = el('div',{style:'display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 0;'
                    + 'font-size:12px;font-weight:600;color:#374151;user-select:none;'});
                var arrow = el('span',{style:'transition:transform 0.15s;font-size:10px;'}, isOpen ? '▼' : '▶');
                toggle.appendChild(arrow);
                toggle.appendChild(el('span',{}, 'Attachments'));
                if (mandatory) toggle.appendChild(el('span',{style:'color:#dc2626;font-size:14px;'},'*'));
                toggle.appendChild(countBadge);
                toggle.addEventListener('click', function(){
                    isOpen = !isOpen;
                    body.style.display = isOpen ? 'block' : 'none';
                    arrow.textContent = isOpen ? '▼' : '▶';
                });

                // Drag-and-drop zone
                var fileInput = el('input',{type:'file',multiple:true,
                    accept:'.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx',
                    style:'display:none;'});
                var dropLabel = el('div',{style:'font-size:13px;color:#6b7280;pointer-events:none;'},
                    '📂 Drag files here or ', el('span',{style:'color:#2563eb;text-decoration:underline;'},'browse'));
                var dropZone = el('div',{style:DROP_ZONE_STYLE}, dropLabel);

                dropZone.addEventListener('click', function(){ fileInput.click(); });
                dropZone.addEventListener('dragover', function(e){ e.preventDefault(); dropZone.style.cssText = DROP_ZONE_STYLE + DROP_ZONE_HOVER; });
                dropZone.addEventListener('dragleave', function(){ dropZone.style.cssText = DROP_ZONE_STYLE; });
                dropZone.addEventListener('drop', function(e){
                    e.preventDefault(); dropZone.style.cssText = DROP_ZONE_STYLE;
                    addFiles(Array.prototype.slice.call(e.dataTransfer.files));
                });
                fileInput.addEventListener('change', function(){
                    addFiles(Array.prototype.slice.call(fileInput.files));
                    fileInput.value = '';
                });

                var chipContainer = el('div',{style:'margin-top:6px;display:flex;flex-wrap:wrap;'});

                function addFiles(newFiles) {
                    newFiles.forEach(function(f){ ln.pendingFiles.push(f); });
                    refreshChips();
                }

                function refreshChips() {
                    chipContainer.innerHTML = '';
                    countBadge.textContent = String(ln.pendingFiles.length);
                    countBadge.style.background = ln.pendingFiles.length ? '#2563eb' : '#9ca3af';
                    ln.pendingFiles.forEach(function(f, i){
                        var size = f.size ? ' (' + (f.size/1024).toFixed(1) + ' KB)' : '';
                        var chip = el('div',{style:FILE_CHIP_STYLE});
                        chip.appendChild(el('span',{},'📎 ' + f.name + size));
                        var rm = el('span',{style:'cursor:pointer;color:#dc2626;font-weight:700;font-size:14px;line-height:1;'},'×');
                        (function(idx){ rm.addEventListener('click', function(){ ln.pendingFiles.splice(idx,1); refreshChips(); }); })(i);
                        chip.appendChild(rm);
                        chipContainer.appendChild(chip);
                    });
                }
                refreshChips();

                body.appendChild(dropZone);
                body.appendChild(chipContainer);

                var wrap = el('div',{style:'margin-top:6px;border-top:1px solid #e5e7eb;'});
                wrap.appendChild(toggle);
                wrap.appendChild(body);
                return wrap;
            }

            /* ── Helpers ── */
            function readFileAsBase64(file) {
                return new Promise(function(resolve, reject){
                    var reader = new FileReader();
                    reader.onload = function(){ resolve(reader.result); };
                    reader.onerror = function(){ reject(new Error('Failed to read ' + file.name)); };
                    reader.readAsDataURL(file);
                });
            }

            function uploadLineFiles(lineId, pendingFiles) {
                if (!pendingFiles || !pendingFiles.length) return Promise.resolve();
                return Promise.all(pendingFiles.map(function(f){ return readFileAsBase64(f); }))
                    .then(function(dataUrls){
                        var filesToSend = pendingFiles.map(function(f, i){
                            return { name: f.name, data: dataUrls[i], type: f.type };
                        });
                        return fetchAction('uploadFiles',{ recordId: String(lineId), files: filesToSend });
                    });
            }

            /* ================================================
               Form assembly
               ================================================ */

            var addLineBtn = btn('+ Add Line',BTN_SEC,function(){
                var selCust = custodyId || custSel.value;
                if (!selCust) {
                    msgBox.innerHTML=''; msgBox.appendChild(buildAlert({variant:'warning',text:'Please select a Custody first.'})); return;
                }
                lines.push({type:'',bill:'',expReport:'',vendor:'',employee:'',
                    amount:'',exchRate:1,baseAmount:'',txCurrency:'',txCurrencyId:'',
                    apAccount:'',expAccount:'',taxCode:'',memo:'',
                    project:'',projectTask:'',
                    pendingFiles:[]});
                rebuildLines();
            });

            var form = card('New Custody Expense',[
                el('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:16px;'},
                    formGroup('Custody',custSel), formGroup('Date',dateInput)),
                el('div',{style:'margin-top:12px;'},
                    formGroup('Replenishment Account',replAccountEl)),
                formGroup('Notes',notesInput),
                el('div',{style:'margin-top:16px;'},
                    el('div',{style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;'},
                        el('h4',{style:'margin:0;font-size:14px;font-weight:600;color:#1f2937;'},'Expense Lines'),
                        addLineBtn),
                    linesContainer),
                el('div',{style:'display:flex;gap:10px;margin-top:16px;'},
                    btn('Save Expense',BTN_PRI,function(){
                        var payload = {
                            custodyId: custodyId || custSel.value,
                            date: dateInput.value,
                            notes: notesInput.value,
                            replAccount: replAccountValue || null,
                            lines: lines.map(function(ln){
                                return {
                                    type:        ln.type,
                                    vendor:      ln.vendor   || '',
                                    bill:        ln.bill     || '',
                                    employee:    ln.employee || '',
                                    expReport:   ln.expReport|| '',
                                    amount:      ln.amount,
                                    exchRate:    ln.exchRate  || 1,
                                    baseAmount:  (ln.amountEl ? ln.amountEl.value : ln.baseAmount) || ln.baseAmount || ln.amount,
                                    currencyId:  ln.txCurrencyId || '',
                                    apAccount:   ln.apAccount|| '',
                                    expAccount:  ln.expAccount||'',
                                    taxCode:     ln.taxCode  || '',
                                    memo:        ln.memo     || '',
                                    project:     ln.type === '3' ? (ln.project     || '') : '',
                                    projectTask: ln.type === '3' ? (ln.projectTask || '') : ''
                                };
                            })
                        };
                        if (!payload.custodyId) {
                            msgBox.innerHTML=''; msgBox.appendChild(buildAlert({variant:'warning',text:'Please select a Custody.'})); return;
                        }
                        if (!payload.lines.length) {
                            msgBox.innerHTML=''; msgBox.appendChild(buildAlert({variant:'warning',text:'Please add at least one expense line.'})); return;
                        }
                        // Validate amounts: per-line + cross-line totals for same bill/report
                        var srcTotals = {};
                        for (var ai = 0; ai < lines.length; ai++) {
                            var srcId = lines[ai].bill || lines[ai].expReport || '';
                            if (!srcId || !lines[ai]._origBaseAmount) continue;
                            var enteredAmt = parseFloat(lines[ai].amountEl ? lines[ai].amountEl.value : 0);
                            var base = parseFloat(lines[ai]._origBaseAmount);
                            // Per-line check
                            if (enteredAmt > base) {
                                msgBox.innerHTML=''; msgBox.appendChild(buildAlert({variant:'warning',
                                    text:'Line #' + (ai+1) + ': Amount (' + fmtCurrency(enteredAmt) + ') exceeds Base Amount (' + fmtCurrency(base) + ').'}));
                                return;
                            }
                            // Accumulate for cross-line check
                            if (!srcTotals[srcId]) srcTotals[srcId] = {total:0, base:base, lineNums:[]};
                            srcTotals[srcId].total += enteredAmt;
                            srcTotals[srcId].lineNums.push(ai+1);
                        }
                        for (var sid in srcTotals) {
                            if (srcTotals[sid].total > srcTotals[sid].base) {
                                msgBox.innerHTML=''; msgBox.appendChild(buildAlert({variant:'warning',
                                    text:'Lines #' + srcTotals[sid].lineNums.join(', #') + ' total (' + fmtCurrency(srcTotals[sid].total) + ') exceeds Base Amount (' + fmtCurrency(srcTotals[sid].base) + ') for the same transaction.'}));
                                return;
                            }
                        }
                        // Validate mandatory attachments per line
                        for (var vi = 0; vi < lines.length; vi++) {
                            if (!lines[vi].pendingFiles || !lines[vi].pendingFiles.length) {
                                msgBox.innerHTML=''; msgBox.appendChild(buildAlert({variant:'warning',
                                    text:'Line #' + (vi+1) + ' is missing attachments. Each expense line requires at least one file.'}));
                                return;
                            }
                        }
                        msgBox.innerHTML=''; msgBox.appendChild(buildAlert({variant:'info',text:'Saving expense…'}));
                        fetchAction('createExpense',payload).then(function(res){
                            // Upload files for each line
                            var lineIds = res.lineIds || [];
                            msgBox.innerHTML=''; msgBox.appendChild(buildAlert({variant:'info',text:'Uploading attachments…'}));
                            var uploads = lines.map(function(ln, i){
                                return lineIds[i] ? uploadLineFiles(lineIds[i], ln.pendingFiles) : Promise.resolve();
                            });
                            return Promise.all(uploads).then(function(){
                                navigateTo({rid:res.id});
                            });
                        }).catch(function(e){ msgBox.innerHTML=''; msgBox.appendChild(buildAlert({variant:'danger',text:'Save failed: '+(e.message||e)})); });
                    }),
                    btn('Cancel',BTN_SEC,function(){ navigateTo({}); })),
                msgBox]);

            renderPage(el('div',{style:'display:flex;flex-direction:column;gap:16px;'},
                btn('← Back',BTN_SEC,function(){ history.back(); }), form));
        }).catch(function(e){ renderPage(buildAlert({variant:'danger',text:'Failed to load form. '+(e.message||e)})); });
    }

    /* ================================================================
       SHELL HELPERS
       ================================================================ */

    function showShell(text) {
        container.innerHTML = '';
        container.appendChild(render('pageshell',{appName:'Cash Custody',navbar:{appName:'Cash Custody',moduleName:'Expenses'},body:null,loading:true,loadingText:text}));
    }

    function renderPage(body) {
        container.innerHTML = '';
        container.appendChild(render('pageshell',{appName:'Cash Custody',navbar:{appName:'Cash Custody',moduleName:'Expenses'},body:body}));
    }

    /* ================================================================
       MOUNT + BOOT
       ================================================================ */

    function mount() {
        injectStyles();
        if (mode === 'create') mountCreateView();
        else if (recordId) mountDetailView();
        else mountListView();
    }

    function waitForAzCore() {
        if (typeof AzCore !== 'undefined' && AzCore.render) {
            render=renderWithShell; _el=AzCore.el; post=AzCore.AzHttp.post;
            mount();
        } else { setTimeout(waitForAzCore, 50); }
    }
    waitForAzCore();
})();