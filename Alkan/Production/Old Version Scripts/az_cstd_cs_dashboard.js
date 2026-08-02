/**
 * @description Cash Custody Dashboard — browser-side client script.
 *              Centralized dashboard with full visibility:
 *              - KPI summary (active custodies, total balance, pending requests/expenses)
 *              - All Custodies table with status
 *              - Pending Requests / Pending Expenses tables
 *              - Settlement Alerts + Replenishment Alerts
 *              - Recent Ledger Activity
 *
 * @copyright 2026 Azdan
 * @author    Azdan
 */
(function () {
    'use strict';

    /* ================================================================
       COMMON HELPERS
       ================================================================ */

    var render = renderWithShell;
    var _el    = AzCore.el;
    var post   = AzCore.AzHttp.post;

    function el(tag, attrs) {
        var args = [tag, attrs || {}];
        for (var i = 2; i < arguments.length; i++) {
            var arg = arguments[i];
            if (Array.isArray(arg)) {
                for (var j = 0; j < arg.length; j++) args.push(arg[j]);
            } else { args.push(arg); }
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
        if (a == null) return -1;
        if (b == null) return 1;
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
                var tds = cols.map(function(c){ return el('td',{style:'padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#111827;vertical-align:top;'},String(row[c.field]==null?'':row[c.field])); });
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

    var seed      = window.__azSeed || {};
    var postUrl   = seed.postUrl || '';
    var container = document.getElementById('az-app-root');

    function fmtCurrency(v) {
        return Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    }

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
            throw new Error((res&&res.error)||(action+' failed'));
        }).catch(function(err){
            if (attempt <= MAX_RETRIES && isRetryable(err)) {
                return delay(RETRY_DELAY * attempt).then(function(){
                    return fetchAction(action, params, attempt + 1);
                });
            }
            throw err;
        });
    }

    function fetchSafe(action, fallback) {
        return fetchAction(action).catch(function(e){ var o=Object.assign({},fallback); o._error=e.message||String(e); return o; });
    }

    var CARD = 'background:#fff;border-radius:8px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border:1px solid #e5e7eb';

    function card(title, children, extra) {
        var inner = [];
        if (title) inner.push(el('h3',{style:'margin:0 0 12px 0;font-size:15px;font-weight:600;color:#1f2937;'},title));
        return el('div',{className:'az-card',style:CARD+(extra?';'+extra:'')},inner.concat(children));
    }

    function injectStyles() {
        if (document.getElementById('az-cstd-styles')) return;
        var s = document.createElement('style');
        s.id = 'az-cstd-styles';
        s.textContent = '@keyframes azspin{to{transform:rotate(360deg)}}';
        document.head.appendChild(s);
    }

    /* ================================================================
       SECTION BUILDERS
       ================================================================ */

    function buildKpiRow(s) {
        return el('div',{style:'display:flex;gap:14px;flex-wrap:wrap;'},
            render('statscard',{label:'Active Custodies',value:s.activeCustodies||0}),
            render('statscard',{label:'Total Balance',value:fmtCurrency(s.totalBalance)}),
            render('statscard',{label:'Pending Requests',value:s.pendingRequests||0}),
            render('statscard',{label:'Pending Expenses',value:s.pendingExpenses||0}));
    }

    function buildCustodiesTable(custodies) {
        var rows = (custodies||[]).map(function(c){
            return {id:c.id,employee:c.employee,subsidiary:c.subsidiary,currency:c.currency,type:c.type,
                status:c.status,amountFmt:fmtCurrency(c.amount),balanceFmt:fmtCurrency(c.balance),threshFmt:fmtCurrency(c.threshold)};
        });
        return card('All Custodies',[render('datatable',{
            columns:[
                {label:'ID',field:'id',width:'60px'},{label:'Employee',field:'employee',width:'160px'},
                {label:'Subsidiary',field:'subsidiary',width:'140px'},{label:'Currency',field:'currency',width:'80px'},
                {label:'Type',field:'type',width:'100px'},{label:'Status',field:'status',width:'120px'},
                {label:'Amount',field:'amountFmt',width:'110px'},{label:'Balance',field:'balanceFmt',width:'110px'},
                {label:'Threshold',field:'threshFmt',width:'110px'}],
            rows:rows,striped:true,emptyMessage:'No custodies found.'})]);
    }

    function buildRequestsTable(requests) {
        var rows = (requests||[]).map(function(r){
            return {id:r.id,custody:r.custody,employee:r.employee,type:r.type,amountFmt:fmtCurrency(r.amount),
                status:r.status,date:r.date,dueDate:r.dueDate};
        });
        return card('Pending Requests',[render('datatable',{
            columns:[
                {label:'ID',field:'id',width:'60px'},{label:'Custody',field:'custody',width:'140px'},
                {label:'Employee',field:'employee',width:'140px'},{label:'Type',field:'type',width:'120px'},
                {label:'Amount',field:'amountFmt',width:'110px'},{label:'Status',field:'status',width:'100px'},
                {label:'Date',field:'date',width:'100px'},{label:'Due Date',field:'dueDate',width:'100px'}],
            rows:rows,striped:true,emptyMessage:'No pending requests.'})]);
    }

    function buildExpensesTable(expenses) {
        var rows = (expenses||[]).map(function(e){
            return {id:e.id,custody:e.custody,employee:e.employee,amountFmt:fmtCurrency(e.amount),
                status:e.status,date:e.date,currency:e.currency};
        });
        return card('Pending Expenses',[render('datatable',{
            columns:[
                {label:'ID',field:'id',width:'60px'},{label:'Custody',field:'custody',width:'140px'},
                {label:'Employee',field:'employee',width:'140px'},{label:'Amount',field:'amountFmt',width:'120px'},
                {label:'Status',field:'status',width:'100px'},{label:'Date',field:'date',width:'100px'},
                {label:'Currency',field:'currency',width:'80px'}],
            rows:rows,striped:true,emptyMessage:'No pending expenses.'})]);
    }

    function buildSettlementAlerts(alerts) {
        if (!alerts||!alerts.length) return card('Settlement Alerts',[render('alertbanner',{variant:'success',text:'No settlement alerts at this time.'})]);
        var rows = alerts.map(function(a){ return {custodyId:a.custodyId,balFmt:fmtCurrency(a.balance),action:a.action,amtFmt:fmtCurrency(a.amount)}; });
        return card('Settlement Alerts',[render('datatable',{
            columns:[{label:'Custody',field:'custodyId',width:'100px'},{label:'Balance',field:'balFmt',width:'120px'},
                {label:'Action',field:'action',width:'150px'},{label:'Amount',field:'amtFmt',width:'120px'}],
            rows:rows,striped:true})]);
    }

    function buildReplenishmentAlerts(alerts) {
        if (!alerts||!alerts.length) return card('Replenishment Alerts',[render('alertbanner',{variant:'success',text:'No replenishment alerts at this time.'})]);
        var rows = alerts.map(function(a){ return {custodyId:a.custodyId,employee:a.employee,balFmt:fmtCurrency(a.balance),threshFmt:fmtCurrency(a.threshold),suggestFmt:fmtCurrency(a.suggestedAmount)}; });
        return card('Replenishment Alerts',[render('datatable',{
            columns:[{label:'Custody',field:'custodyId',width:'100px'},{label:'Employee',field:'employee',width:'150px'},
                {label:'Balance',field:'balFmt',width:'120px'},{label:'Threshold',field:'threshFmt',width:'120px'},
                {label:'Suggested',field:'suggestFmt',width:'120px'}],
            rows:rows,striped:true})]);
    }

    function buildRecentActivity(entries) {
        var rows = (entries||[]).map(function(e){
            return {id:e.id,custody:e.custody,date:e.date,type:e.type,amountFmt:fmtCurrency(e.amount),
                balanceFmt:fmtCurrency(e.balance),sourceType:e.sourceType,memo:e.memo};
        });
        return card('Recent Ledger Activity',[render('datatable',{
            columns:[
                {label:'ID',field:'id',width:'50px'},{label:'Custody',field:'custody',width:'120px'},
                {label:'Date',field:'date',width:'100px'},{label:'Type',field:'type',width:'110px'},
                {label:'Amount',field:'amountFmt',width:'110px'},{label:'Balance',field:'balanceFmt',width:'110px'},
                {label:'Source',field:'sourceType',width:'100px'},{label:'Memo',field:'memo',width:'180px'}],
            rows:rows,striped:true,emptyMessage:'No recent activity.'})]);
    }

    /* ================================================================
       PAGE ASSEMBLY + MOUNT
       ================================================================ */

    function buildDashboard(data) {
        return el('div',{style:'display:flex;flex-direction:column;gap:20px;'},
            buildKpiRow(data.summary),
            buildCustodiesTable(data.custodies),
            el('div',{style:'display:flex;gap:16px;flex-wrap:wrap;'},
                el('div',{style:'flex:1;min-width:400px;'},buildRequestsTable(data.requests)),
                el('div',{style:'flex:1;min-width:400px;'},buildExpensesTable(data.expenses))),
            el('div',{style:'display:flex;gap:16px;flex-wrap:wrap;'},
                el('div',{style:'flex:1;min-width:380px;'},buildSettlementAlerts(data.settlement)),
                el('div',{style:'flex:1;min-width:380px;'},buildReplenishmentAlerts(data.replenishment))),
            buildRecentActivity(data.recent));
    }

    function mount() {
        injectStyles();
        container.innerHTML = '';
        container.appendChild(render('pageshell',{appName:'Cash Custody',navbar:{appName:'Cash Custody',moduleName:'Dashboard'},body:null,loading:true,loadingText:'Loading dashboard…'}));

        Promise.all([
            fetchSafe('getDashboardSummary',{activeCustodies:0,totalBalance:0,pendingRequests:0,pendingExpenses:0}),
            fetchSafe('getAllCustodies',{custodies:[]}),
            fetchSafe('getPendingRequests',{requests:[]}),
            fetchSafe('getPendingExpenses',{expenses:[]}),
            fetchSafe('getSettlementAlerts',{alerts:[]}),
            fetchSafe('getReplenishmentAlerts',{alerts:[]}),
            fetchSafe('getRecentActivity',{entries:[]})
        ]).then(function(res){
            var data = {
                summary:res[0], custodies:(res[1]&&res[1].custodies)||[],
                requests:(res[2]&&res[2].requests)||[], expenses:(res[3]&&res[3].expenses)||[],
                settlement:(res[4]&&res[4].alerts)||[], replenishment:(res[5]&&res[5].alerts)||[],
                recent:(res[6]&&res[6].entries)||[]
            };
            var body = buildDashboard(data);
            var errors = res.filter(function(r){return r&&r._error;});
            if (errors.length) {
                body.insertBefore(render('alertbanner',{variant:'warning',
                    text:'Some widgets could not load: '+errors.map(function(r){return r._error;}).join(' | ')}),body.firstChild);
            }
            container.innerHTML = '';
            container.appendChild(render('pageshell',{appName:'Cash Custody',navbar:{appName:'Cash Custody',moduleName:'Dashboard'},body:body}));
        });
    }

    /* ================================================================
       BOOT
       ================================================================ */

    function waitForAzCore() {
        if (typeof AzCore !== 'undefined' && AzCore.render) {
            render=renderWithShell; _el=AzCore.el; post=AzCore.AzHttp.post;
            mount();
        } else { setTimeout(waitForAzCore, 50); }
    }
    waitForAzCore();
})();
