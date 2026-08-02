/**
 * @description Cash Custody Request — browser-side client script.
 *              Handles the full request lifecycle UI:
 *              - List view of all requests
 *              - Detail view with lines, processing actions
 *              - Inline create form for new requests with lines
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

    function buildTable(p) {
        var cols = p.columns||[], rows = p.rows||[];
        if (!rows.length) return buildAlert({variant:'info',text:p.emptyMessage||'No records found.'});

        var totalPages = Math.ceil(rows.length / PAGE_SIZE);
        var currentPage = 1;
        var wrapper = el('div',{});

        function renderPage(page) {
            currentPage = page;
            wrapper.innerHTML = '';
            var start = (page - 1) * PAGE_SIZE;
            var pageRows = rows.slice(start, start + PAGE_SIZE);

            var ths = cols.map(function(c){ return el('th',{style:'text-align:left;padding:10px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap;'+(c.width?'width:'+c.width:'')},c.label||c.field||''); });
            var trs = pageRows.map(function(row,idx){
                var globalIdx = start + idx;
                var tds = cols.map(function(c){
                    if (c.render) return el('td',{style:'padding:10px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top;'},c.render(row));
                    return el('td',{style:'padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#111827;vertical-align:top;'},String(row[c.field]==null?'':row[c.field]));
                });
                var tr = el('tr',{style:p.striped&&globalIdx%2?'background:#f9fafb;':''},tds);
                if (p.onRowClick){tr.addEventListener('click',function(){p.onRowClick(row);});tr.style.cursor='pointer';}
                return tr;
            });
            wrapper.appendChild(el('div',{style:'overflow-x:auto;border:1px solid #e5e7eb;border-radius:6px;'},
                el('table',{style:'width:100%;border-collapse:collapse;font-size:13px;background:#fff;'},
                    el('thead',{},el('tr',{},ths)),el('tbody',{},trs))));
            if (totalPages > 1) wrapper.appendChild(buildPaginationBar(currentPage, totalPages, renderPage));
        }
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
        var RETRY_DELAY = 2000;
        return post(postUrl,{action:action,params:params||{}}).then(function(r){
            var res = r && r.data ? r.data : r;
            if (res&&res.success) return res.data;
            // res.error may be a string OR a structured object ({code,message,...}).
            // new Error(object) would render as "[object Object]", so unwrap it.
            var e = res && res.error;
            var msg = (!e) ? (action+' failed')
                : (typeof e === 'string') ? e
                : (e.message || e.error || e.details || JSON.stringify(e));
            throw new Error(msg);
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
        showShell('Loading requests…');
        fetchAction('getRequestList').then(function(data){
            var requests = (data.requests||[]).map(function(r){
                return {id:r.id,custody:r.custody,employee:r.employee,subsidiary:r.subsidiary||'',type:r.type,
                    amount:r.amount,processedAmount:r.processedAmount,remainingAmount:r.remainingAmount,
                    amtFmt:fmtCurrency(r.amount),procFmt:fmtCurrency(r.processedAmount),remFmt:fmtCurrency(r.remainingAmount),
                    status:r.status,date:r.date,dueDate:r.dueDate};
            });

            /* ---------- extract unique filter values ---------- */
            var empMap={}, subMap={}, statMap={};
            var uniEmp=[], uniSub=[], uniStat=[];
            requests.forEach(function(r){
                if(r.employee   && !empMap[r.employee])    { empMap[r.employee]=1;       uniEmp.push(r.employee); }
                if(r.subsidiary && !subMap[r.subsidiary])  { subMap[r.subsidiary]=1;     uniSub.push(r.subsidiary); }
                if(r.status     && !statMap[r.status])     { statMap[r.status]=1;        uniStat.push(r.status); }
            });
            uniEmp.sort(); uniSub.sort(); uniStat.sort();

            /* ---------- filter selects ---------- */
            var FILTER_STYLE='height:34px;border:1px solid #d1d5db;border-radius:6px;padding:0 8px;font-size:13px;min-width:160px;';
            var filterEmp  = buildSelect(uniEmp.map(function(e){return{id:e,text:e};}),  'All Employees');
            var filterSub  = buildSelect(uniSub.map(function(s){return{id:s,text:s};}),  'All Subsidiaries');
            var filterStat = buildSelect(uniStat.map(function(s){return{id:s,text:s};}), 'All Statuses');
            filterEmp.style.cssText=FILTER_STYLE;
            filterSub.style.cssText=FILTER_STYLE;
            filterStat.style.cssText=FILTER_STYLE;

            /* ---------- sort state ---------- */
            var sortCol='id', sortDir='asc';

            /* ---------- column defs ---------- */
            var columns=[
                {label:'ID',        field:'id',        width:'60px',  numeric:true},
                {label:'Custody',   field:'custody',   width:'130px'},
                {label:'Employee',  field:'employee',  width:'140px'},
                {label:'Subsidiary',field:'subsidiary',width:'130px'},
                {label:'Type',      field:'type',      width:'120px'},
                {label:'Amount',    field:'amtFmt',    width:'110px', numeric:true, sortField:'amount'},
                {label:'Processed', field:'procFmt',   width:'100px', numeric:true, sortField:'processedAmount'},
                {label:'Remaining', field:'remFmt',    width:'100px', numeric:true, sortField:'remainingAmount'},
                {label:'Status',    field:'status',    width:'110px'},
                {label:'Date',      field:'date',      width:'100px'},
                {label:'Due Date',  field:'dueDate',   width:'100px'}
            ];

            var tableBox = el('div',{});
            var listCurrentPage = 1;

            /* ---------- refresh (filter + sort + re-render) ---------- */
            function refreshTable(resetPage){
                if(resetPage) listCurrentPage = 1;
                var filtered = requests.filter(function(r){
                    if(filterEmp.value  && r.employee   !== filterEmp.value)  return false;
                    if(filterSub.value  && r.subsidiary !== filterSub.value)  return false;
                    if(filterStat.value && r.status     !== filterStat.value) return false;
                    return true;
                });

                var sc = sortCol, sd = sortDir;
                var colDef = null;
                for(var ci=0;ci<columns.length;ci++){if(columns[ci].field===sc || columns[ci].sortField===sc){colDef=columns[ci];break;}}
                var actualSortField = (colDef && colDef.sortField) ? colDef.sortField : sc;
                filtered.sort(function(a,b){
                    var va=a[actualSortField], vb=b[actualSortField];
                    if(colDef&&colDef.numeric){va=parseFloat(va)||0;vb=parseFloat(vb)||0;}
                    else{va=String(va||'').toLowerCase();vb=String(vb||'').toLowerCase();}
                    var cmp=va<vb?-1:va>vb?1:0;
                    return sd==='desc'?-cmp:cmp;
                });

                tableBox.innerHTML='';
                if(!filtered.length){
                    tableBox.appendChild(buildAlert({variant:'info',text:'No requests match the selected filters.'}));
                    return;
                }

                var totalPages = Math.ceil(filtered.length / PAGE_SIZE);
                if (listCurrentPage > totalPages) listCurrentPage = totalPages;
                var startIdx = (listCurrentPage - 1) * PAGE_SIZE;
                var pageRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);

                var ths=columns.map(function(col){
                    var sortKey = col.sortField || col.field;
                    var arrow = sortKey===sc ? (sd==='asc'?' ▲':' ▼') : '';
                    var th=el('th',{style:'text-align:left;padding:10px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap;cursor:pointer;user-select:none;'+(col.width?'width:'+col.width:'')},col.label+arrow);
                    th.addEventListener('click',function(){
                        if(sortCol===sortKey){sortDir=sortDir==='asc'?'desc':'asc';}
                        else{sortCol=sortKey;sortDir='asc';}
                        listCurrentPage = 1;
                        refreshTable();
                    });
                    return th;
                });

                var trs=pageRows.map(function(row,idx){
                    var globalIdx = startIdx + idx;
                    var tds=columns.map(function(col){
                        var display=String(row[col.field]==null?'':row[col.field]);
                        return el('td',{style:'padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#111827;vertical-align:top;'},display);
                    });
                    var tr=el('tr',{style:(globalIdx%2?'background:#f9fafb;':'')+'cursor:pointer;'},tds);
                    tr.addEventListener('click',function(){navigateTo({rid:row.id});});
                    return tr;
                });

                tableBox.appendChild(
                    el('div',{style:'overflow-x:auto;border:1px solid #e5e7eb;border-radius:6px;'},
                        el('table',{style:'width:100%;border-collapse:collapse;font-size:13px;background:#fff;'},
                            el('thead',{},el('tr',{},ths)),
                            el('tbody',{},trs))));
                if (totalPages > 1) {
                    tableBox.appendChild(buildPaginationBar(listCurrentPage, totalPages, function(pg){
                        listCurrentPage = pg;
                        refreshTable();
                    }));
                }
            }

            filterEmp.addEventListener('change',function(){ refreshTable(true); });
            filterSub.addEventListener('change',function(){ refreshTable(true); });
            filterStat.addEventListener('change',function(){ refreshTable(true); });
            refreshTable();

            /* ---------- toolbar + filter bar ---------- */
            var toolbar = el('div',{style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;'},
                el('h2',{style:'margin:0;font-size:17px;font-weight:700;color:#111827;'},'Custody Requests'),
                btn('+ New Request',BTN_PRI,function(){ navigateTo({view:'create'}); }));

            var filterBar = el('div',{style:'display:flex;gap:10px;flex-wrap:wrap;align-items:center;'},
                el('span',{style:'font-size:13px;font-weight:600;color:#374151;'},'Filters:'),
                filterEmp, filterSub, filterStat);

            renderPage(el('div',{style:'display:flex;flex-direction:column;gap:16px;'},toolbar,filterBar,card('',[tableBox])));
        }).catch(function(e){ renderPage(buildAlert({variant:'danger',text:'Failed to load requests. '+(e.message||e)})); });
    }

    /* ================================================================
       DETAIL VIEW
       ================================================================ */

    function mountDetailView() {
        showShell('Loading request #' + recordId + '…');
        fetchAction('getRequestDetail',{requestId:recordId}).then(function(data){
            var rq = data.request||{};
            var lines = data.lines||[];
            var cust = data.custody||{};
            var resultBox = el('div',{});

            // Header
            var header = el('div',{style:'display:flex;align-items:center;justify-content:space-between;'},
                el('h2',{style:'margin:0;font-size:20px;font-weight:700;color:#1f2937;'},'Request #'+recordId),
                el('span',{style:'font-size:14px;font-weight:600;color:#2563eb;'},rq.status||''));

            // Back + View Record + sync buttons
            var viewUrl = data.viewUrl || '';
            var actions = el('div',{style:'display:flex;gap:8px;flex-wrap:wrap;'},
                btn('← Back',BTN_SEC,function(){ history.back(); }),
                viewUrl ? btn('View Record ↗',BTN_SEC,function(){ window.open(viewUrl,'_blank'); }) : '',
                btn('Sync Totals',BTN_PRI,function(){
                    resultBox.innerHTML='';
                    resultBox.appendChild(buildAlert({variant:'info',text:'Syncing totals…'}));
                    fetchAction('syncTotals',{requestId:recordId}).then(function(){ window.location.reload(); })
                    .catch(function(e){ resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'danger',text:'Sync failed: '+(e.message||e)})); });
                }));

            // Request info
            var info = card('Request Information',[el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;'},
                infoCell('Request ID',rq.id||recordId), infoCell('Status',rq.status), infoCell('Custody',rq.custody),
                infoCell('Employee',rq.employee), infoCell('Type',rq.type), infoCell('Date',rq.date),
                infoCell('Due Date',rq.dueDate), infoCell('Notes',rq.notes||'—'))]);

            // Custody snapshot
            var custCard = card('Linked Custody',[el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;'},
                infoCell('Employee',cust.employee), infoCell('Subsidiary',cust.subsidiary),
                infoCell('Currency',cust.currency), infoCell('Type',cust.type),
                infoCell('Balance',fmtCurrency(cust.balance)), infoCell('Account',cust.account))]);

            // KPI
            var kpi = el('div',{style:'display:flex;gap:14px;flex-wrap:wrap;'},
                render('statscard',{label:'Total Amount',value:fmtCurrency(rq.amount)}),
                render('statscard',{label:'Processed',value:fmtCurrency(rq.processedAmount)}),
                render('statscard',{label:'Remaining',value:fmtCurrency(rq.remainingAmount)}));

            // Lines table with action buttons (sortable)
            var lineRows = lines.map(function(ln){
                return {id:ln.id, date:ln.date, amtFmt:fmtCurrency(ln.amount), _rawAmt:ln.amount, bank:ln.bank,
                    status:ln.status, tx:ln.genTx||'—', memo:ln.memo||'', error:ln.error||'',
                    _raw:ln};
            });
            var lineSortCol = 'id', lineSortDir = 'asc';
            var lineCurrentPage = 1;
            var lineTableBox = el('div',{});

            var lineColumns = [
                {label:'ID',field:'id',width:'60px',numeric:true},
                {label:'Date',field:'date',width:'100px'},
                {label:'Amount',field:'amtFmt',width:'110px',numeric:true,sortField:'_rawAmt'},
                {label:'Bank',field:'bank',width:'140px'},
                {label:'Status',field:'status',width:'100px'},
                {label:'Transaction',field:'tx',width:'120px'},
                {label:'Memo',field:'memo',width:'160px'},
                {label:'Error',field:'error',width:'160px'},
                {label:'Actions',field:'_actions',width:'160px',noSort:true}
            ];

            function refreshLineTable(){
                var sorted = lineRows.slice();
                var sc = lineSortCol, sd = lineSortDir;
                var colDef = null;
                for(var ci=0;ci<lineColumns.length;ci++){if(lineColumns[ci].field===sc || lineColumns[ci].sortField===sc){colDef=lineColumns[ci];break;}}
                var actualSortField = (colDef && colDef.sortField) ? colDef.sortField : sc;
                sorted.sort(function(a,b){
                    var va=a[actualSortField], vb=b[actualSortField];
                    if(colDef&&colDef.numeric){va=parseFloat(va)||0;vb=parseFloat(vb)||0;}
                    else{va=String(va||'').toLowerCase();vb=String(vb||'').toLowerCase();}
                    var cmp=va<vb?-1:va>vb?1:0;
                    return sd==='desc'?-cmp:cmp;
                });

                lineTableBox.innerHTML='';
                if(!sorted.length){
                    lineTableBox.appendChild(buildAlert({variant:'info',text:'No request lines found.'}));
                    return;
                }

                var totalPages = Math.ceil(sorted.length / PAGE_SIZE);
                if (lineCurrentPage > totalPages) lineCurrentPage = totalPages;
                var startIdx = (lineCurrentPage - 1) * PAGE_SIZE;
                var pageRows = sorted.slice(startIdx, startIdx + PAGE_SIZE);

                var ths=lineColumns.map(function(col){
                    var sortKey = col.sortField || col.field;
                    var arrow = '';
                    if(!col.noSort){ arrow = sortKey===sc ? (sd==='asc'?' ▲':' ▼') : ''; }
                    var th=el('th',{style:'text-align:left;padding:10px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap;'+(col.noSort?'':'cursor:pointer;user-select:none;')+(col.width?'width:'+col.width:'')},col.label+arrow);
                    if(!col.noSort){
                        th.addEventListener('click',function(){
                            if(lineSortCol===sortKey){lineSortDir=lineSortDir==='asc'?'desc':'asc';}
                            else{lineSortCol=sortKey;lineSortDir='asc';}
                            lineCurrentPage = 1;
                            refreshLineTable();
                        });
                    }
                    return th;
                });

                var trs=pageRows.map(function(row,idx){
                    var globalIdx = startIdx + idx;
                    var tds=lineColumns.map(function(col){
                        if(col.field==='_actions'){
                            var lineStatus = row.status || (row._raw && row._raw.status) || '';
                            if(lineStatus==='Pending'){
                                return el('td',{style:'padding:10px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top;'},
                                    el('div',{style:'display:flex;gap:6px;'},
                                        btn('Process',BTN_ACT+'background:#2563eb;',function(e){
                                            e.stopPropagation();
                                            resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'info',text:'Processing line #'+row.id+'…'}));
                                            fetchAction('processLine',{lineId:row.id,requestData:{custodyId:rq.custodyId||cust.id||'',requestType:rq.typeId||rq.type,requestId:recordId},custodyData:{employee:cust.employeeId||'',subsidiary:cust.subsidiaryId||'',currency:cust.currencyId||'',account:cust.accountId||'',department:cust.department||'',project:cust.project||''}})
                                            .then(function(){ window.location.reload(); })
                                            .catch(function(err){
                                                var msg = (err && typeof err.message === 'string') ? err.message : (err && typeof err.error === 'string') ? err.error : (typeof err === 'string' ? err : JSON.stringify(err));
                                                resultBox.innerHTML='';
                                                resultBox.appendChild(buildAlert({variant:'danger',text:'Process failed: '+msg}));
                                            });
                                        })));
                            }
                            if(lineStatus==='Processed'){
                                return el('td',{style:'padding:10px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top;'},
                                    el('div',{style:'display:flex;gap:6px;'},
                                        btn('Void',BTN_ACT+'background:#dc2626;',function(e){
                                            e.stopPropagation();
                                            resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'info',text:'Voiding line #'+row.id+'…'}));
                                            fetchAction('voidLine',{lineId:row.id,requestData:{custodyId:rq.custodyId||cust.id||'',requestType:rq.typeId||rq.type,requestId:recordId},custodyData:{employee:cust.employeeId||'',subsidiary:cust.subsidiaryId||'',currency:cust.currencyId||'',account:cust.accountId||'',department:cust.department||'',project:cust.project||''}})
                                            .then(function(){ window.location.reload(); })
                                            .catch(function(err){
                                                var msg = (err && typeof err.message === 'string') ? err.message : (err && typeof err.error === 'string') ? err.error : (typeof err === 'string' ? err : JSON.stringify(err));
                                                resultBox.innerHTML='';
                                                resultBox.appendChild(buildAlert({variant:'danger',text:'Void failed: '+msg}));
                                            });
                                        })));
                            }
                            return el('td',{style:'padding:10px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top;'},
                                el('span',{style:'color:#9ca3af;font-size:12px;'},lineStatus||'—'));
                        }
                        var display=String(row[col.field]==null?'':row[col.field]);
                        return el('td',{style:'padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#111827;vertical-align:top;'},display);
                    });
                    return el('tr',{style:globalIdx%2?'background:#f9fafb;':''},tds);
                });

                lineTableBox.appendChild(
                    el('div',{style:'overflow-x:auto;border:1px solid #e5e7eb;border-radius:6px;'},
                        el('table',{style:'width:100%;border-collapse:collapse;font-size:13px;background:#fff;'},
                            el('thead',{},el('tr',{},ths)),
                            el('tbody',{},trs))));
                if (totalPages > 1) {
                    lineTableBox.appendChild(buildPaginationBar(lineCurrentPage, totalPages, function(pg){
                        lineCurrentPage = pg;
                        refreshLineTable();
                    }));
                }
            }

            refreshLineTable();

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
                toggle.appendChild(el('span',{},'Line #' + ln.id + ' — ' + fmtCurrency(ln.amount)));
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
                actions, header, info, custCard, kpi, card('Request Lines',[lineTableBox]),
                card('Attachments',[attachSection]), resultBox));
        }).catch(function(e){ renderPage(buildAlert({variant:'danger',text:'Failed to load request. '+(e.message||e)})); });
    }

    function infoCell(label, value) {
        return el('div',{},
            el('div',{style:'font-size:12px;color:#6b7280;margin-bottom:2px;'},label),
            el('div',{style:'font-size:14px;font-weight:500;color:#1f2937;'},String(value||'—')));
    }

    /* ================================================================
       CREATE VIEW
       ================================================================ */

    function mountCreateView() {
        showShell('Preparing request form…');

        /* Decide what to fetch based on context */
        var fetchPromise;
        if (custodyId) {
            /* From custody master — fetch only that custody's info */
            fetchPromise = fetchAction('searchCustodies',{keyword:''}).then(function(data){
                var all = data.custodies || data.results || [];
                if (!Array.isArray(all)) all = [];
                var match = [];
                for (var i = 0; i < all.length; i++) {
                    if (String(all[i].id) === String(custodyId)) { match.push(all[i]); break; }
                }
                /* If the specific custody wasn't found in active list, still show it */
                if (!match.length) match = [{id:custodyId, text:'Custody #'+custodyId}];
                return match;
            });
        } else {
            /* From request suitelet — fetch all custodies */
            fetchPromise = fetchAction('searchCustodies',{keyword:''}).then(function(data){
                var all = data.custodies || data.results || [];
                if (!Array.isArray(all)) all = [];
                return all;
            });
        }

        fetchPromise.then(function(custOptions){
            /* Build maps of custody id -> subsidiaryId / currencyId for bank account filtering */
            var custSubsidiaryMap = {};
            var custCurrencyMap = {};
            custOptions.forEach(function(c){
                if (c.subsidiaryId) custSubsidiaryMap[c.id] = c.subsidiaryId;
                if (c.currencyId)   custCurrencyMap[c.id] = c.currencyId;
            });

            var bankAccounts = [];
            var lines = [];
            var linesContainer = el('div',{});
            var msgBox = el('div',{});

            /* Fetch bank accounts filtered by the selected custody's subsidiary and currency */
            function fetchBankAccounts(subsidiaryId, currencyId, callback) {
                console.log('[CashCustody] fetchBankAccounts — subsidiaryId:', subsidiaryId, 'currencyId:', currencyId);
                fetchAction('searchBankAccounts', { subsidiaryId: subsidiaryId || '', currencyId: currencyId || '' }).then(function(bankData){
                    bankAccounts = bankData.accounts || [];
                    console.log('[CashCustody] Bank accounts loaded:', bankAccounts.length);
                    /* Reset bank selects on existing lines */
                    lines.forEach(function(ln){ ln.bankEl = null; });
                    rebuildLines();
                    if (callback) callback();
                }).catch(function(err){
                    console.error('[CashCustody] Bank account fetch failed:', err);
                    bankAccounts = [];
                });
            }

            /* Custody dropdown: locked when coming from custody master */
            var custSel;
            if (custodyId) {
                custSel = buildSelect(custOptions, custOptions.length ? custOptions[0].text : '');
                custSel.value = custodyId;
                custSel.disabled = true;
                custSel.style.cssText = INPUT_STYLE + 'background:#f3f4f6;color:#6b7280;';
            } else {
                custSel = buildSelect(custOptions,'— Select Custody —');
            }

            /* Re-fetch bank accounts when custody changes */
            custSel.addEventListener('change', function(){
                var selId = custSel.value;
                fetchBankAccounts(custSubsidiaryMap[selId] || '', custCurrencyMap[selId] || '');
            });

            var typeSel = buildSelect([
                {value:'1',text:'Initial Release'},{value:'2',text:'Replenishment'},
                {value:'3',text:'Surplus Return'},{value:'4',text:'Overspend Reimbursement'},
                {value:'5',text:'Closure'}],'— Select Type —');
            var amtInput = el('input',{type:'number',style:INPUT_STYLE,placeholder:'0.00'});
            var dateInput = el('input',{type:'date',style:INPUT_STYLE});
            dateInput.value = new Date().toISOString().slice(0,10);
            var notesInput = el('textarea',{style:TA_STYLE,placeholder:'Notes…'});

            /* ── Shared attachment styles ── */
            var DROP_ZONE_STYLE = 'border:2px dashed #d1d5db;border-radius:8px;padding:20px;text-align:center;'
                + 'cursor:pointer;transition:all 0.15s ease;background:#fafafa;';
            var DROP_ZONE_HOVER = 'border-color:#2563eb;background:#eff6ff;';
            var FILE_CHIP_STYLE = 'display:inline-flex;align-items:center;gap:6px;padding:4px 10px;'
                + 'background:#f3f4f6;border:1px solid #e5e7eb;border-radius:16px;font-size:12px;color:#374151;margin:3px;';

            function rebuildLines() {
                linesContainer.innerHTML = '';
                lines.forEach(function(ln, idx) {
                    if (!ln.pendingFiles) ln.pendingFiles = [];
                    var lineCard = el('div',{style:'background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:10px;'});

                    lineCard.appendChild(el('div',{style:'display:flex;gap:8px;align-items:flex-end;'},
                        el('div',{style:'min-width:30px;padding-top:20px;font-size:13px;font-weight:700;color:#6b7280;'},'#'+(idx+1)),
                        el('div',{style:'flex:1;'},formGroup('Amount', ln.amountEl = ln.amountEl || (function(){ var inp = el('input',{type:'number',style:INPUT_STYLE,placeholder:'0.00'}); inp.value = ln.amount||''; inp.addEventListener('input',function(){ln.amount=inp.value;}); return inp; })())),
                        el('div',{style:'flex:1;'},formGroup('Bank Account', ln.bankEl = ln.bankEl || (function(){
                            var sel = buildSelect(bankAccounts.map(function(a){ return {id:a.id, text:a.number+' '+a.name}; }), '— Select Bank —');
                            sel.style.cssText = INPUT_STYLE;
                            if (ln.bank) sel.value = ln.bank;
                            sel.addEventListener('change', function(){ ln.bank = sel.value; });
                            return sel;
                        })())),
                        el('div',{style:'flex:1;'},formGroup('Memo', ln.memoEl = ln.memoEl || (function(){ var inp = el('input',{type:'text',style:INPUT_STYLE,placeholder:'Memo'}); inp.value = ln.memo||''; inp.addEventListener('input',function(){ln.memo=inp.value;}); return inp; })())),
                        el('div',{style:'padding-bottom:4px;'},btn('✕',BTN_DAN,function(){ lines.splice(idx,1); rebuildLines(); }))));

                    lineCard.appendChild(buildAttachmentPanel(ln, false));
                    linesContainer.appendChild(lineCard);
                });
            }

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
                        var filesToSend = pendingFiles.map(function(f,i){
                            return { name: f.name, data: dataUrls[i], type: f.type };
                        });
                        return fetchAction('uploadFiles',{ recordId: String(lineId), files: filesToSend });
                    });
            }

            /* Initial bank account fetch for pre-selected custody */
            var initialCustVal = custodyId || custSel.value;
            if (initialCustVal && custSubsidiaryMap[initialCustVal]) {
                fetchBankAccounts(custSubsidiaryMap[initialCustVal], custCurrencyMap[initialCustVal] || '');
            }

            var form = card('New Custody Request',[
                el('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:16px;'},
                    formGroup('Custody *',custSel), formGroup('Request Type *',typeSel),
                    formGroup('Amount *',amtInput), formGroup('Date *',dateInput)),
                formGroup('Notes',notesInput),
                el('div',{style:'margin-top:16px;'},
                    el('div',{style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;'},
                        el('h4',{style:'margin:0;font-size:14px;font-weight:600;color:#1f2937;'},'Request Lines'),
                        btn('+ Add Line',BTN_SEC,function(){ lines.push({amount:'',bank:'',memo:''}); rebuildLines(); })),
                    linesContainer),
                el('div',{style:'display:flex;gap:10px;margin-top:16px;'},
                    btn('Save Request',BTN_PRI,function(){
                        var missing = [];
                        var custVal = custodyId || custSel.value;
                        if (!custVal)          missing.push('Custody');
                        if (!typeSel.value)    missing.push('Request Type');
                        if (!amtInput.value)   missing.push('Amount');
                        if (!dateInput.value)  missing.push('Date');
                        if (missing.length) {
                            msgBox.innerHTML=''; msgBox.appendChild(buildAlert({variant:'warning',text:'Please fill in: '+missing.join(', ')+'.'})); return;
                        }
                        var payload = {
                            custodyId: custVal, type: typeSel.value,
                            amount: amtInput.value, date: dateInput.value,
                            notes: notesInput.value,
                            lines: lines.map(function(ln){ return {amount:ln.amount,bankAccount:ln.bank,memo:ln.memo}; })
                        };
                        msgBox.innerHTML=''; msgBox.appendChild(buildAlert({variant:'info',text:'Saving request…'}));
                        fetchAction('createRequest',payload).then(function(res){
                            // Upload pending files for each line
                            var lineIds = res.lineIds || [];
                            var hasFiles = lines.some(function(ln){ return ln.pendingFiles && ln.pendingFiles.length; });
                            if (!hasFiles) { navigateTo({rid:res.id}); return; }
                            msgBox.innerHTML=''; msgBox.appendChild(buildAlert({variant:'info',text:'Uploading attachments…'}));
                            var uploads = lines.map(function(ln,i){
                                return lineIds[i] ? uploadLineFiles(lineIds[i], ln.pendingFiles) : Promise.resolve();
                            });
                            return Promise.all(uploads).then(function(){ navigateTo({rid:res.id}); });
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
        container.appendChild(render('pageshell',{appName:'Cash Custody',navbar:{appName:'Cash Custody',moduleName:'Requests'},body:null,loading:true,loadingText:text}));
    }

    function renderPage(body) {
        container.innerHTML = '';
        container.appendChild(render('pageshell',{appName:'Cash Custody',navbar:{appName:'Cash Custody',moduleName:'Requests'},body:body}));
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
