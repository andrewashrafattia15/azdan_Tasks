/**
 * @description Cash Custody Reconciliation — browser-side client script.
 *              Handles the reconciliation and closure review UI:
 *              - Overview of all custodies with balances
 *              - Per-custody detail with ledger and snapshot
 *              - Evaluate due custodies
 *              - Recalculate, settle, close actions
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

    // Parse a cell value to a number for numeric sorting; strips thousands
    // separators so formatted currency strings (e.g. "1,234.00") sort numerically.
    // Returns null when the value is not numeric.
    function toSortNumber(v) {
        if (typeof v === 'number') return isNaN(v) ? null : v;
        if (v == null) return null;
        var s = String(v).replace(/,/g, '').trim();
        if (s === '') return null;
        var n = Number(s);
        return isNaN(n) ? null : n;
    }

    function buildTable(p) {
        var cols = p.columns||[], rows = p.rows||[];
        if (!rows.length) return buildAlert({variant:'info',text:p.emptyMessage||'No records found.'});

        var data = rows.slice();
        var sortable = !!p.sortable;
        var sortState = p.defaultSort ? { field:p.defaultSort.field, dir:p.defaultSort.dir||'asc' } : null;

        function columnByField(field) {
            for (var i = 0; i < cols.length; i++) { if (cols[i].field === field) return cols[i]; }
            return null;
        }

        function applySort() {
            if (!sortState) return;
            var col = columnByField(sortState.field);
            var getVal = function(row){ return (col && col.sortValue) ? col.sortValue(row) : row[sortState.field]; };
            data.sort(function(ra, rb){
                var va = getVal(ra), vb = getVal(rb);
                var na = toSortNumber(va), nb = toSortNumber(vb);
                var c;
                if (na !== null && nb !== null) { c = na - nb; }
                else { c = String(va==null?'':va).toLowerCase().localeCompare(String(vb==null?'':vb).toLowerCase()); }
                return sortState.dir === 'desc' ? -c : c;
            });
        }
        applySort();

        var totalPages = Math.ceil(data.length / PAGE_SIZE);
        var currentPage = 1;
        var wrapper = el('div',{});

        function renderPage(page) {
            currentPage = page;
            wrapper.innerHTML = '';
            var start = (page - 1) * PAGE_SIZE;
            var pageRows = data.slice(start, start + PAGE_SIZE);

            var ths = cols.map(function(c){
                var thStyle = 'text-align:left;padding:10px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap;'+(c.width?'width:'+c.width:'');
                var isSortable = sortable && c.sortable !== false && c.field;
                if (isSortable) thStyle += 'cursor:pointer;user-select:none;';
                var indicator = (sortState && sortState.field === c.field) ? (sortState.dir === 'asc' ? ' ▲' : ' ▼') : '';
                var th = el('th',{style:thStyle}, (c.label||c.field||'') + indicator);
                if (isSortable) {
                    th.addEventListener('click', function(){
                        if (sortState && sortState.field === c.field) {
                            sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
                        } else {
                            sortState = { field:c.field, dir:'asc' };
                        }
                        applySort();
                        renderPage(1);
                    });
                }
                return th;
            });
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

    var seed      = window.__azSeed || {};
    var postUrl   = seed.postUrl || '';
    var custodyId = seed.custodyId || '';
    var container = document.getElementById('az-app-root');

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
            // Some handlers nest their payload under .data; others (those that return
            // a {success:...} object) ARE the payload. Fall back to the envelope so we
            // never hand back undefined.
            if (res&&res.success) return (res.data !== undefined ? res.data : res);
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

    function infoCell(label, value) {
        return el('div',{},
            el('div',{style:'font-size:12px;color:#6b7280;margin-bottom:2px;'},label),
            el('div',{style:'font-size:14px;font-weight:500;color:#1f2937;'},String(value||'—')));
    }

    var BTN_PRI = 'border:0;border-radius:6px;padding:10px 20px;font-size:13px;font-weight:700;color:#fff;background:#2563eb;cursor:pointer;';
    var BTN_SEC = 'border:1px solid #d1d5db;border-radius:6px;padding:10px 20px;font-size:13px;font-weight:600;color:#374151;background:#fff;cursor:pointer;';
    var BTN_DAN = 'border:0;border-radius:6px;padding:10px 20px;font-size:13px;font-weight:700;color:#fff;background:#dc2626;cursor:pointer;';
    var BTN_WRN = 'border:0;border-radius:6px;padding:10px 20px;font-size:13px;font-weight:700;color:#fff;background:#d97706;cursor:pointer;';
    var INPUT_STYLE = 'height:36px;border:1px solid #d1d5db;border-radius:6px;padding:0 10px;font-size:13px;box-sizing:border-box;';
    var TA_STYLE = 'border:1px solid #d1d5db;border-radius:6px;padding:8px 10px;font-size:13px;min-height:60px;box-sizing:border-box;resize:vertical;width:100%;';

    function btn(label, style, onClick) {
        var b = el('button',{type:'button',style:style},label);
        b.addEventListener('click', onClick);
        return b;
    }

    /* ================================================================
       OVERVIEW VIEW  (all custodies)
       ================================================================ */

    function mountOverview() {
        showShell('Loading reconciliation overview…');
        fetchAction('getReconciliationOverview').then(function(data){
            var custodies = data.custodies||[];
            var resultBox = el('div',{});

            // KPI summary
            var active = 0, totalBal = 0;
            custodies.forEach(function(c){ if (c.status==='Active') active++; totalBal += c.balance; });
            var kpi = el('div',{style:'display:flex;gap:14px;flex-wrap:wrap;'},
                render('statscard',{label:'Total Custodies',value:custodies.length}),
                render('statscard',{label:'Active',value:active}),
                render('statscard',{label:'Total Balance',value:fmtCurrency(totalBal)}));

            // Evaluate button
            var evalSection = el('div',{style:'display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;'},
                btn('Evaluate Due Custodies',BTN_WRN,function(){
                    resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'info',text:'Evaluating due custodies…'}));
                    fetchAction('evaluateDueCustodies',{}).then(function(res){
                        resultBox.innerHTML='';
                        var errs = res.errors||[];
                        var msg = 'Evaluated: '+res.evaluated+', Due: '+res.dueCount;
                        if (errs.length) msg += ', Errors: '+errs.length;
                        resultBox.appendChild(buildAlert({variant:errs.length?'danger':(res.dueCount>0?'warning':'success'),text:msg}));
                        // Surface the actual error message(s) so failures aren't opaque
                        errs.forEach(function(er){
                            var detail = (typeof er==='string') ? er : (er && (er.error||er.message)) || JSON.stringify(er);
                            var who = (er && er.custodyId) ? ('Custody '+er.custodyId+': ') : '';
                            resultBox.appendChild(el('div',{style:'margin-top:8px;'},buildAlert({variant:'danger',text:who+detail})));
                        });
                        if (res.pending&&res.pending.length) {
                            var pendRows = res.pending.map(function(p){ return {custodyId:p.custodyId||p.id,action:p.action||'—',amount:fmtCurrency(p.amount||0),amtRaw:p.amount||0}; });
                            resultBox.appendChild(el('div',{style:'margin-top:10px;'},render('datatable',{
                                columns:[{label:'Custody',field:'custodyId',width:'100px'},{label:'Action',field:'action',width:'160px'},{label:'Amount',field:'amount',width:'120px',sortValue:function(r){return r.amtRaw;}}],
                                rows:pendRows,striped:true,sortable:true,defaultSort:{field:'custodyId',dir:'asc'}})));
                        }
                    }).catch(function(e){ resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'danger',text:'Evaluation failed: '+(e.message||e)})); });
                }));

            // Custodies table. Raw numeric values (amtRaw/balRaw/threshRaw) are kept
            // alongside the formatted strings so numeric columns sort by value.
            var rows = custodies.map(function(c){
                return {id:c.id,employee:c.employee,subsidiary:c.subsidiary,currency:c.currency,
                    type:c.type,status:c.status,amtFmt:fmtCurrency(c.amount),
                    balFmt:fmtCurrency(c.balance),threshFmt:fmtCurrency(c.threshold),
                    amtRaw:c.amount,balRaw:c.balance,threshRaw:c.threshold};
            });
            var table = render('datatable',{
                columns:[
                    {label:'ID',field:'id',width:'60px'},{label:'Employee',field:'employee',width:'150px'},
                    {label:'Subsidiary',field:'subsidiary',width:'140px'},{label:'Currency',field:'currency',width:'80px'},
                    {label:'Type',field:'type',width:'100px'},{label:'Status',field:'status',width:'110px'},
                    {label:'Amount',field:'amtFmt',width:'110px',sortValue:function(r){return r.amtRaw;}},
                    {label:'Balance',field:'balFmt',width:'110px',sortValue:function(r){return r.balRaw;}},
                    {label:'Threshold',field:'threshFmt',width:'110px',sortValue:function(r){return r.threshRaw;}}],
                rows:rows,striped:true,emptyMessage:'No custodies found.',
                sortable:true,defaultSort:{field:'id',dir:'asc'},
                onRowClick:function(row){ navigateTo({rid:row.id}); }});

            renderPage(el('div',{style:'display:flex;flex-direction:column;gap:16px;'},
                el('h2',{style:'margin:0;font-size:20px;font-weight:700;color:#1f2937;'},'Reconciliation Workbench'),
                kpi, evalSection, resultBox, card('All Custodies',[table])));
        }).catch(function(e){ renderPage(buildAlert({variant:'danger',text:'Failed to load overview. '+(e.message||e)})); });
    }

    /* ================================================================
       DETAIL VIEW  (single custody deep-dive)
       ================================================================ */

    function mountDetailView() {
        showShell('Loading custody #' + custodyId + '…');

        Promise.all([
            fetchAction('getCustodySnapshot',{custodyId:custodyId}),
            fetchAction('getCustodyLedger',{custodyId:custodyId})
        ]).then(function(results){
            var snap = results[0];
            var ledgerData = results[1];
            var cust = snap.custody||{};
            var entries = ledgerData.entries||[];
            var resultBox = el('div',{});

            // Navigation
            var actions = el('div',{style:'display:flex;gap:8px;flex-wrap:wrap;'},
                btn('← Back',BTN_SEC,function(){ history.back(); }));

            // Header
            var header = el('div',{style:'display:flex;align-items:center;justify-content:space-between;'},
                el('h2',{style:'margin:0;font-size:20px;font-weight:700;color:#1f2937;'},'Custody #'+custodyId),
                el('span',{style:'font-size:14px;font-weight:600;color:#2563eb;'},cust.status?cust.status.text||'':''));

            // Custody info grid
            var custInfo = card('Custody Snapshot',[el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;'},
                infoCell('ID',cust.id), infoCell('Employee',cust.employee?cust.employee.text:''),
                infoCell('Subsidiary',cust.subsidiary?cust.subsidiary.text:''),
                infoCell('Department',cust.department?cust.department.text:''),
                infoCell('Currency',cust.currency?cust.currency.text:''),
                infoCell('Type',cust.type?cust.type.text:''),
                infoCell('Status',cust.status?cust.status.text:''),
                infoCell('Active',cust.active?'Yes':'No'),
                infoCell('Amount',fmtCurrency(cust.amount)),
                infoCell('Balance',fmtCurrency(cust.balance)),
                infoCell('Threshold',fmtCurrency(cust.threshold)),
                infoCell('Account',cust.account?cust.account.text:''),
                infoCell('Frequency',cust.frequency?cust.frequency.text:''),
                infoCell('Project',cust.project?cust.project.text:''),
                infoCell('Notes',cust.notes||'—'))]);

            // KPI row
            var kpi = el('div',{style:'display:flex;gap:14px;flex-wrap:wrap;'},
                render('statscard',{label:'Balance',value:fmtCurrency(cust.balance)}),
                render('statscard',{label:'Requests',value:snap.requestCount||0}),
                render('statscard',{label:'Expenses',value:snap.expenseCount||0}),
                render('statscard',{label:'Ledger Entries',value:snap.ledgerCount||0}));

            // Action buttons
            var actionPanel = card('Reconciliation Actions',[
                el('div',{style:'display:flex;gap:10px;flex-wrap:wrap;'},
                    btn('Recalculate Balance',BTN_PRI,function(){
                        resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'info',text:'Recalculating balance…'}));
                        fetchAction('recalculateBalance',{custodyId:custodyId}).then(function(res){
                            resultBox.innerHTML='';
                            resultBox.appendChild(buildAlert({variant:'success',text:'Balance recalculated. New balance: '+fmtCurrency(res.newBalance||res.balance||0)}));
                        }).catch(function(e){ resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'danger',text:'Recalculate failed: '+(e.message||e)})); });
                    }),
                    btn('Settle Custody',BTN_WRN,function(){
                        resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'info',text:'Settling custody…'}));
                        fetchAction('settleCustody',{custodyId:custodyId}).then(function(res){
                            resultBox.innerHTML='';
                            resultBox.appendChild(buildAlert({variant:'success',text:'Settlement complete. Action: '+(res.action||'—')+', Amount: '+fmtCurrency(res.amount||0)}));
                        }).catch(function(e){ resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'danger',text:'Settlement failed: '+(e.message||e)})); });
                    }),
                    btn('Close Custody',BTN_DAN,function(){
                        if (!confirm('Are you sure you want to close this custody? This action cannot be undone.')) return;
                        resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'info',text:'Closing custody…'}));
                        fetchAction('closeCustody',{custodyId:custodyId}).then(function(res){
                            resultBox.innerHTML='';
                            resultBox.appendChild(buildAlert({variant:'success',text:'Custody closed successfully.'}));
                        }).catch(function(e){ resultBox.innerHTML=''; resultBox.appendChild(buildAlert({variant:'danger',text:'Close failed: '+(e.message||e)})); });
                    }))]);

            // Ledger table. Raw numeric/date values are kept alongside the formatted
            // strings so numeric and date columns sort by true value.
            var ledgerRows = entries.map(function(e){
                var ms = Date.parse(e.date); if (isNaN(ms)) ms = 0;
                return {id:e.id,date:e.date,dateMs:ms,type:e.type,amtFmt:fmtCurrency(e.amount),
                    balFmt:fmtCurrency(e.runBalance),amtRaw:e.amount,balRaw:e.runBalance,sourceType:e.sourceType,
                    memo:e.memo||'',request:e.request||'—',expense:e.expense||'—'};
            });
            var ledgerTable = render('datatable',{
                columns:[
                    {label:'ID',field:'id',width:'50px'},
                    {label:'Date',field:'date',width:'100px',sortValue:function(r){return r.dateMs;}},
                    {label:'Type',field:'type',width:'120px'},
                    {label:'Amount',field:'amtFmt',width:'110px',sortValue:function(r){return r.amtRaw;}},
                    {label:'Run Balance',field:'balFmt',width:'110px',sortValue:function(r){return r.balRaw;}},
                    {label:'Source',field:'sourceType',width:'100px'},
                    {label:'Request',field:'request',width:'100px'},{label:'Expense',field:'expense',width:'100px'},
                    {label:'Memo',field:'memo',width:'180px'}],
                rows:ledgerRows,striped:true,emptyMessage:'No ledger entries found.',
                sortable:true,defaultSort:{field:'id',dir:'asc'}});

            renderPage(el('div',{style:'display:flex;flex-direction:column;gap:16px;'},
                actions, header, custInfo, kpi, actionPanel, resultBox, card('Custody Ledger',[ledgerTable])));
        }).catch(function(e){ renderPage(buildAlert({variant:'danger',text:'Failed to load custody. '+(e.message||e)})); });
    }

    /* ================================================================
       SHELL HELPERS
       ================================================================ */

    function showShell(text) {
        container.innerHTML = '';
        container.appendChild(render('pageshell',{appName:'Cash Custody',navbar:{appName:'Cash Custody',moduleName:'Reconciliation'},body:null,loading:true,loadingText:text}));
    }

    function renderPage(body) {
        container.innerHTML = '';
        container.appendChild(render('pageshell',{appName:'Cash Custody',navbar:{appName:'Cash Custody',moduleName:'Reconciliation'},body:body}));
    }

    /* ================================================================
       MOUNT + BOOT
       ================================================================ */

    function mount() {
        injectStyles();
        if (custodyId) mountDetailView();
        else mountOverview();
    }

    function waitForAzCore() {
        if (typeof AzCore !== 'undefined' && AzCore.render) {
            render=renderWithShell; _el=AzCore.el; post=AzCore.AzHttp.post;
            mount();
        } else { setTimeout(waitForAzCore, 50); }
    }
    waitForAzCore();
})();
