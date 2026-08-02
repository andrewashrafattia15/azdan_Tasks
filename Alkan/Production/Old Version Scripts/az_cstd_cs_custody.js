/**
 * @description Cash Custody Management — browser-side client script.
 *              Three views based on seed data:
 *              - List View:   browse all custody masters
 *              - Detail View: deep-dive into a single custody record
 *              - Create Form: create a new custody master
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
                var tds = cols.map(function(c){ return el('td',{style:'padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#111827;vertical-align:top;'},String(row[c.field]==null?'':row[c.field])); });
                var tr = el('tr',{style:p.striped&&globalIdx%2?'background:#f9fafb;':'cursor:default;'},tds);
                if (p.onRowClick){tr.addEventListener('click',function(){p.onRowClick(row);});tr.style.cursor='pointer';}
                return tr;
            });
            wrapper.appendChild(el('div',{style:'overflow-x:auto;border:1px solid #e5e7eb;border-radius:6px;'},
                el('table',{style:'width:100%;border-collapse:collapse;font-size:13px;background:#fff;'},
                    el('thead',{},el('tr',{},ths)),
                    el('tbody',{},trs))));
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

    var seed         = window.__azSeed || {};
    var postUrl      = seed.postUrl || '';
    var recordId     = seed.recordId || '';
    var mode         = seed.view || '';
    var requestSlUrl = seed.requestSlUrl || '';
    var expenseSlUrl = seed.expenseSlUrl || '';
    var container    = document.getElementById('az-app-root');

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

    var CARD = 'background:#fff;border-radius:8px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border:1px solid #e5e7eb;overflow:visible';

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
       NAVIGATION HELPER
       ================================================================ */

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

    /* ================================================================
       STATUS BADGE HELPER
       ================================================================ */

    function statusBadge(text) {
        var colors = {
            'Draft':            {bg:'#f3f4f6',fg:'#374151'},
            'Pending Approval': {bg:'#fef3c7',fg:'#92400e'},
            'Approved':         {bg:'#d1fae5',fg:'#065f46'},
            'Active':           {bg:'#dbeafe',fg:'#1e40af'},
            'Suspended':        {bg:'#fee2e2',fg:'#991b1b'},
            'Closed':           {bg:'#e5e7eb',fg:'#6b7280'}
        };
        var c = colors[text] || {bg:'#f3f4f6',fg:'#374151'};
        return el('span',{style:'display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;background:'+c.bg+';color:'+c.fg+';'},text||'Unknown');
    }

    /* ================================================================
       FORM HELPERS
       ================================================================ */

    var INPUT_STYLE = 'height:36px;border:1px solid #d1d5db;border-radius:6px;padding:0 10px;font-size:13px;width:100%;box-sizing:border-box;';
    var SELECT_STYLE = INPUT_STYLE;
    var TEXTAREA_STYLE = 'border:1px solid #d1d5db;border-radius:6px;padding:8px 10px;font-size:13px;width:100%;min-height:80px;box-sizing:border-box;resize:vertical;';
    var BTN_PRIMARY = 'border:0;border-radius:6px;padding:10px 20px;font-size:13px;font-weight:700;color:#fff;background:#2563eb;cursor:pointer;';
    var BTN_SECONDARY = 'border:1px solid #d1d5db;border-radius:6px;padding:10px 20px;font-size:13px;font-weight:600;color:#374151;background:#fff;cursor:pointer;';

    function formGroup(label, inputEl) {
        return el('div',{style:'display:flex;flex-direction:column;gap:4px;overflow:visible;'},
            el('label',{style:'font-size:12px;font-weight:600;color:#374151;'},label),
            inputEl);
    }

    function buildSelect(options, placeholder) {
        var sel = el('select',{style:SELECT_STYLE});
        var defOpt = document.createElement('option');
        defOpt.value = '';
        defOpt.textContent = placeholder || '-- Select --';
        sel.appendChild(defOpt);
        (options || []).forEach(function(o) {
            var opt = document.createElement('option');
            opt.value = o.id || o.value || '';
            opt.textContent = o.text || o.label || '';
            sel.appendChild(opt);
        });
        return sel;
    }

    /* ================================================================
       LIST VIEW
       ================================================================ */

    function mountListView() {
        container.innerHTML = '';
        container.appendChild(render('pageshell',{
            appName:'Cash Custody',
            navbar:{appName:'Cash Custody',moduleName:'Custody Management'},
            body:null,loading:true,loadingText:'Loading custody list…'
        }));

        fetchAction('getCustodyList').then(function(data) {
            var custodies = (data && data.custodies) || [];

            /* ---------- extract unique filter values ---------- */
            var empMap={}, subMap={}, typeMap={};
            var uniEmp=[], uniSub=[], uniType=[];
            custodies.forEach(function(c){
                if(c.employee   && !empMap[c.employee])    { empMap[c.employee]=1;       uniEmp.push(c.employee); }
                if(c.subsidiary && !subMap[c.subsidiary])  { subMap[c.subsidiary]=1;     uniSub.push(c.subsidiary); }
                if(c.type       && !typeMap[c.type])        { typeMap[c.type]=1;           uniType.push(c.type); }
            });
            uniEmp.sort(); uniSub.sort(); uniType.sort();

            /* ---------- filter selects ---------- */
            var FILTER_STYLE='height:34px;border:1px solid #d1d5db;border-radius:6px;padding:0 8px;font-size:13px;min-width:160px;';
            var filterEmp  = buildSelect(uniEmp.map(function(e){return{id:e,text:e};}),  'All Employees');
            var filterSub  = buildSelect(uniSub.map(function(s){return{id:s,text:s};}),  'All Subsidiaries');
            var filterType = buildSelect(uniType.map(function(t){return{id:t,text:t};}), 'All Types');
            filterEmp.style.cssText=FILTER_STYLE;
            filterSub.style.cssText=FILTER_STYLE;
            filterType.style.cssText=FILTER_STYLE;

            /* ---------- sort state (default: ID desc = newest first) ---------- */
            var sortCol='id', sortDir='asc';

            /* ---------- column defs ---------- */
            var columns=[
                {label:'ID',         field:'id',        width:'60px',  numeric:true},
                {label:'Employee',   field:'employee',  width:'160px'},
                {label:'Subsidiary', field:'subsidiary',width:'140px'},
                {label:'Currency',   field:'currency',  width:'80px'},
                {label:'Type',       field:'type',      width:'100px'},
                {label:'Status',     field:'status',    width:'120px'},
                {label:'Amount',     field:'amount',    width:'110px', numeric:true, fmt:true},
                {label:'Balance',    field:'balance',   width:'110px', numeric:true, fmt:true},
                {label:'Threshold',  field:'threshold', width:'110px', numeric:true, fmt:true}
            ];

            var tableBox = el('div',{});
            var listCurrentPage = 1;

            /* ---------- refresh (filter + sort + re-render) ---------- */
            function refreshTable(resetPage){
                if(resetPage) listCurrentPage = 1;
                var filtered = custodies.filter(function(c){
                    if(filterEmp.value  && c.employee   !== filterEmp.value)  return false;
                    if(filterSub.value  && c.subsidiary !== filterSub.value)  return false;
                    if(filterType.value && c.type       !== filterType.value) return false;
                    return true;
                });

                var sc = sortCol, sd = sortDir;
                var colDef = null;
                for(var ci=0;ci<columns.length;ci++){if(columns[ci].field===sc){colDef=columns[ci];break;}}
                filtered.sort(function(a,b){
                    var va=a[sc], vb=b[sc];
                    if(colDef&&colDef.numeric){va=parseFloat(va)||0;vb=parseFloat(vb)||0;}
                    else{va=String(va||'').toLowerCase();vb=String(vb||'').toLowerCase();}
                    var cmp=va<vb?-1:va>vb?1:0;
                    return sd==='desc'?-cmp:cmp;
                });

                tableBox.innerHTML='';
                if(!filtered.length){
                    tableBox.appendChild(buildAlert({variant:'info',text:'No custodies match the selected filters.'}));
                    return;
                }

                var totalPages = Math.ceil(filtered.length / PAGE_SIZE);
                if (listCurrentPage > totalPages) listCurrentPage = totalPages;
                var startIdx = (listCurrentPage - 1) * PAGE_SIZE;
                var pageRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);

                var ths=columns.map(function(col){
                    var arrow = col.field===sc ? (sd==='asc'?' ▲':' ▼') : '';
                    var th=el('th',{style:'text-align:left;padding:10px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap;cursor:pointer;user-select:none;'+(col.width?'width:'+col.width:'')},col.label+arrow);
                    th.addEventListener('click',function(){
                        if(sortCol===col.field){sortDir=sortDir==='asc'?'desc':'asc';}
                        else{sortCol=col.field;sortDir='asc';}
                        listCurrentPage = 1;
                        refreshTable();
                    });
                    return th;
                });

                var trs=pageRows.map(function(row,idx){
                    var globalIdx = startIdx + idx;
                    var tds=columns.map(function(col){
                        var display=col.fmt?fmtCurrency(row[col.field]):String(row[col.field]==null?'':row[col.field]);
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
            filterType.addEventListener('change',function(){ refreshTable(true); });
            refreshTable();

            /* ---------- toolbar + filter bar ---------- */
            var newBtn = el('button',{type:'button',style:BTN_PRIMARY},'New Custody');
            newBtn.addEventListener('click',function(){ navigateTo({view:'create'}); });

            var toolbar = el('div',{style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;'},
                el('h2',{style:'margin:0;font-size:17px;font-weight:700;color:#111827;'},'Custody Management'),
                newBtn);

            var filterBar = el('div',{style:'display:flex;gap:10px;flex-wrap:wrap;align-items:center;'},
                el('span',{style:'font-size:13px;font-weight:600;color:#374151;'},'Filters:'),
                filterSub, filterEmp, filterType);

            var body = el('div',{style:'display:flex;flex-direction:column;gap:16px;'},toolbar,filterBar,card('',[tableBox]));

            container.innerHTML = '';
            container.appendChild(render('pageshell',{
                appName:'Cash Custody',
                navbar:{appName:'Cash Custody',moduleName:'Custody Management'},
                body:body
            }));
        }).catch(function(err) {
            container.innerHTML = '';
            container.appendChild(render('pageshell',{
                appName:'Cash Custody',
                navbar:{appName:'Cash Custody',moduleName:'Custody Management'},
                body:render('alertbanner',{variant:'danger',text:'Failed to load custody list: '+(err.message||String(err))})
            }));
        });
    }

    /* ================================================================
       DETAIL VIEW
       ================================================================ */

    function fieldText(custodyFields, fieldName) {
        var val = custodyFields[fieldName];
        if (!val) return '';
        if (Array.isArray(val) && val.length > 0) return val[0].text || val[0].value || '';
        if (typeof val === 'object' && val.text) return val.text;
        return String(val);
    }

    function fieldValue(custodyFields, fieldName) {
        var val = custodyFields[fieldName];
        if (!val) return '';
        if (Array.isArray(val) && val.length > 0) return val[0].value || val[0].text || '';
        if (typeof val === 'object' && val.value !== undefined) return val.value;
        return String(val);
    }

    function buildInfoGrid(custodyFields) {
        var fields = [
            {label:'Employee',   value:fieldText(custodyFields,'custrecord_az_cstd_cm_emp')},
            {label:'Subsidiary', value:fieldText(custodyFields,'custrecord_az_cstd_cm_subs')},
            {label:'Currency',   value:fieldText(custodyFields,'custrecord_az_cstd_cm_curr')},
            {label:'Type',       value:fieldText(custodyFields,'custrecord_az_cstd_cm_type')},
            {label:'Department', value:fieldText(custodyFields,'custrecord_az_cstd_cm_dep')},
            {label:'Account',    value:fieldText(custodyFields,'custrecord_az_cstd_cm_acct')},
            {label:'Amount',     value:fmtCurrency(fieldValue(custodyFields,'custrecord_az_cstd_cm_amt'))},
            {label:'Balance',    value:fmtCurrency(fieldValue(custodyFields,'custrecord_az_cstd_cm_bal'))},
            {label:'Threshold',  value:fmtCurrency(fieldValue(custodyFields,'custrecord_az_cstd_cm_thld'))},
            {label:'Frequency',  value:fieldText(custodyFields,'custrecord_az_cstd_cm_freq')},
            {label:'Project',    value:fieldText(custodyFields,'custrecord_az_cstd_cm_proj')},
            {label:'Notes',      value:fieldValue(custodyFields,'custrecord_az_cstd_cm_notes')}
        ];

        var cells = fields.map(function(f) {
            return el('div',{style:'display:flex;flex-direction:column;gap:2px;'},
                el('div',{style:'font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;'},f.label),
                el('div',{style:'font-size:13px;color:#111827;'},f.value||'—'));
        });

        return el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;'},cells);
    }

    /**
     * Generic sortable table builder.
     * @param {Object} opts
     * @param {Array}  opts.columns  - [{label,field,width?,numeric?,sortField?,fmt?}]
     * @param {Array}  opts.rows
     * @param {string} opts.emptyMessage
     * @param {Function} [opts.onRowClick]
     * @returns {HTMLElement} container that refreshes in place
     */
    function buildSortableTable(opts) {
        var columns = opts.columns || [];
        var rows = opts.rows || [];
        var sortCol = columns.length ? columns[0].field : 'id';
        var sortDir = 'asc';
        var stCurrentPage = 1;
        var box = el('div',{});

        function refresh() {
            var sorted = rows.slice();
            var sc = sortCol, sd = sortDir;
            var colDef = null;
            for (var ci = 0; ci < columns.length; ci++) {
                if (columns[ci].field === sc || columns[ci].sortField === sc) { colDef = columns[ci]; break; }
            }
            var actualField = (colDef && colDef.sortField) ? colDef.sortField : sc;
            sorted.sort(function(a, b) {
                var va = a[actualField], vb = b[actualField];
                if (colDef && colDef.numeric) { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
                else { va = String(va || '').toLowerCase(); vb = String(vb || '').toLowerCase(); }
                var cmp = va < vb ? -1 : va > vb ? 1 : 0;
                return sd === 'desc' ? -cmp : cmp;
            });
            box.innerHTML = '';
            if (!sorted.length) { box.appendChild(buildAlert({ variant: 'info', text: opts.emptyMessage || 'No records found.' })); return; }

            var totalPages = Math.ceil(sorted.length / PAGE_SIZE);
            if (stCurrentPage > totalPages) stCurrentPage = totalPages;
            var startIdx = (stCurrentPage - 1) * PAGE_SIZE;
            var pageRows = sorted.slice(startIdx, startIdx + PAGE_SIZE);

            var ths = columns.map(function(col) {
                var sortKey = col.sortField || col.field;
                var arrow = sortKey === sc ? (sd === 'asc' ? ' ▲' : ' ▼') : '';
                var th = el('th', { style: 'text-align:left;padding:10px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap;cursor:pointer;user-select:none;' + (col.width ? 'width:' + col.width : '') }, col.label + arrow);
                th.addEventListener('click', function() {
                    if (sortCol === sortKey) { sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }
                    else { sortCol = sortKey; sortDir = 'asc'; }
                    stCurrentPage = 1;
                    refresh();
                });
                return th;
            });
            var trs = pageRows.map(function(row, idx) {
                var globalIdx = startIdx + idx;
                var tds = columns.map(function(col) {
                    var display = col.fmt ? fmtCurrency(row[col.sortField || col.field]) : String(row[col.field] == null ? '' : row[col.field]);
                    return el('td', { style: 'padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#111827;vertical-align:top;' }, display);
                });
                var tr = el('tr', { style: (globalIdx % 2 ? 'background:#f9fafb;' : '') + (opts.onRowClick ? 'cursor:pointer;' : '') }, tds);
                if (opts.onRowClick) { tr.addEventListener('click', function() { opts.onRowClick(row); }); }
                return tr;
            });
            box.appendChild(el('div', { style: 'overflow-x:auto;border:1px solid #e5e7eb;border-radius:6px;' },
                el('table', { style: 'width:100%;border-collapse:collapse;font-size:13px;background:#fff;' },
                    el('thead', {}, el('tr', {}, ths)),
                    el('tbody', {}, trs))));
            if (totalPages > 1) {
                box.appendChild(buildPaginationBar(stCurrentPage, totalPages, function(pg){
                    stCurrentPage = pg;
                    refresh();
                }));
            }
        }
        refresh();
        return box;
    }

    function buildDetailRequestsTable(requests) {
        var rows = (requests||[]).map(function(r) {
            return { id:r.id, type:r.type, _rawAmt:r.amount, amountFmt:fmtCurrency(r.amount), status:r.status, date:r.date, dueDate:r.dueDate };
        });
        return buildSortableTable({
            columns:[
                {label:'ID',field:'id',width:'60px',numeric:true},
                {label:'Type',field:'type',width:'120px'},
                {label:'Amount',field:'amountFmt',width:'110px',numeric:true,sortField:'_rawAmt',fmt:true},
                {label:'Status',field:'status',width:'110px'},
                {label:'Date',field:'date',width:'100px'},
                {label:'Due Date',field:'dueDate',width:'100px'}
            ],
            rows:rows,
            emptyMessage:'No requests found.',
            onRowClick: requestSlUrl ? function(row){ window.location.href = requestSlUrl + '&rid=' + encodeURIComponent(row.id); } : null
        });
    }

    function buildDetailExpensesTable(expenses) {
        var rows = (expenses||[]).map(function(e) {
            return { id:e.id, employee:e.employee, _rawAmt:e.totalAmount, amountFmt:fmtCurrency(e.totalAmount), status:e.status, date:e.date, currency:e.currency };
        });
        return buildSortableTable({
            columns:[
                {label:'ID',field:'id',width:'60px',numeric:true},
                {label:'Employee',field:'employee',width:'140px'},
                {label:'Amount',field:'amountFmt',width:'110px',numeric:true,sortField:'_rawAmt',fmt:true},
                {label:'Status',field:'status',width:'100px'},
                {label:'Date',field:'date',width:'100px'},
                {label:'Currency',field:'currency',width:'80px'}
            ],
            rows:rows,
            emptyMessage:'No expenses found.',
            onRowClick: expenseSlUrl ? function(row){ window.location.href = expenseSlUrl + '&rid=' + encodeURIComponent(row.id); } : null
        });
    }

    function buildDetailLedgerTable(ledger) {
        var rows = (ledger||[]).map(function(e) {
            return { id:e.id, date:e.date, type:e.type, _rawAmt:e.amount, amountFmt:fmtCurrency(e.amount), _rawBal:e.runBalance, balanceFmt:fmtCurrency(e.runBalance), sourceType:e.sourceType, memo:e.memo };
        });
        return buildSortableTable({
            columns:[
                {label:'ID',field:'id',width:'50px',numeric:true},
                {label:'Date',field:'date',width:'100px'},
                {label:'Type',field:'type',width:'110px'},
                {label:'Amount',field:'amountFmt',width:'110px',numeric:true,sortField:'_rawAmt',fmt:true},
                {label:'Running Balance',field:'balanceFmt',width:'130px',numeric:true,sortField:'_rawBal',fmt:true},
                {label:'Source Type',field:'sourceType',width:'110px'},
                {label:'Memo',field:'memo',width:'180px'}
            ],
            rows:rows,
            emptyMessage:'No ledger entries found.'
        });
    }

    function mountDetailView() {
        container.innerHTML = '';
        container.appendChild(render('pageshell',{
            appName:'Cash Custody',
            navbar:{appName:'Cash Custody',moduleName:'Custody Detail'},
            body:null,loading:true,loadingText:'Loading custody detail…'
        }));

        fetchAction('getCustodyDetail',{custodyId:recordId}).then(function(data) {
            var custodyFields = data.custody || {};
            var requests = data.requests || [];
            var expenses = data.expenses || [];
            var ledger   = data.ledger || [];

            var statusText = fieldText(custodyFields,'custrecord_az_cstd_cm_status');
            var viewUrl = data.viewUrl || '';

            /* Back button + View Record */
            var backBtn = el('button',{type:'button',style:BTN_SECONDARY},'← Back');
            backBtn.addEventListener('click',function(){ history.back(); });

            var actionBtns = [backBtn];
            if (viewUrl) {
                var viewBtn = el('button',{type:'button',style:BTN_SECONDARY},'View Record ↗');
                viewBtn.addEventListener('click',function(){ window.open(viewUrl,'_blank'); });
                actionBtns.push(viewBtn);
            }

            /* Header */
            var header = el('div',{style:'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;'},
                el('div',{style:'display:flex;align-items:center;gap:14px;'},
                    el('h2',{style:'margin:0;font-size:17px;font-weight:700;color:#111827;'},'Custody #'+recordId),
                    statusBadge(statusText)),
                el('div',{style:'display:flex;gap:8px;'},actionBtns));

            /* Info grid */
            var infoCard = card('Custody Information',[buildInfoGrid(custodyFields)]);

            /* KPI row */
            var kpiRow = el('div',{style:'display:flex;gap:14px;flex-wrap:wrap;'},
                render('statscard',{label:'Requests',value:requests.length}),
                render('statscard',{label:'Expenses',value:expenses.length}),
                render('statscard',{label:'Ledger Entries',value:ledger.length}));

            /* Tables with action buttons */
            var newReqBtn = el('button',{type:'button',style:'border:0;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:600;color:#fff;background:#2563eb;cursor:pointer;'},'+ New Request');
            newReqBtn.addEventListener('click',function(){
                window.location.href = requestSlUrl + (requestSlUrl.indexOf('?')>-1?'&':'?') + 'view=create&custodyId=' + encodeURIComponent(recordId);
            });
            var reqHeader = el('div',{style:'display:flex;align-items:center;justify-content:space-between;margin:0 0 12px 0;'},
                el('h3',{style:'margin:0;font-size:15px;font-weight:600;color:#1f2937;'},'Requests'), newReqBtn);
            var reqCard = el('div',{className:'az-card',style:CARD},reqHeader,buildDetailRequestsTable(requests));

            var newExpBtn = el('button',{type:'button',style:'border:0;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:600;color:#fff;background:#2563eb;cursor:pointer;'},'+ New Expense');
            newExpBtn.addEventListener('click',function(){
                window.location.href = expenseSlUrl + (expenseSlUrl.indexOf('?')>-1?'&':'?') + 'view=create&custodyId=' + encodeURIComponent(recordId);
            });
            var expHeader = el('div',{style:'display:flex;align-items:center;justify-content:space-between;margin:0 0 12px 0;'},
                el('h3',{style:'margin:0;font-size:15px;font-weight:600;color:#1f2937;'},'Expenses'), newExpBtn);
            var expCard = el('div',{className:'az-card',style:CARD},expHeader,buildDetailExpensesTable(expenses));

            var ledgerCard = card('Ledger',[buildDetailLedgerTable(ledger)]);

            // Attachments section for custody master — drag-drop zone + chip list
            var DZ_STYLE = 'border:2px dashed #d1d5db;border-radius:8px;padding:20px;text-align:center;'
                + 'cursor:pointer;transition:all 0.15s ease;background:#fafafa;';
            var DZ_HOVER = 'border-color:#2563eb;background:#eff6ff;';
            var CHIP_STYLE = 'display:inline-flex;align-items:center;gap:6px;padding:4px 10px;'
                + 'background:#f3f4f6;border:1px solid #e5e7eb;border-radius:16px;font-size:12px;color:#374151;margin:3px;';

            var attachMsg = el('div',{});
            var chipArea = el('div',{style:'display:flex;flex-wrap:wrap;margin-top:8px;'});

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
                doUploadCustody(Array.prototype.slice.call(e.dataTransfer.files));
            });
            hiddenInput.addEventListener('change', function(){
                doUploadCustody(Array.prototype.slice.call(hiddenInput.files));
                hiddenInput.value = '';
            });

            function doUploadCustody(files) {
                if (!files.length) return;
                attachMsg.innerHTML=''; attachMsg.appendChild(buildAlert({variant:'info',text:'Uploading ' + files.length + ' file(s)…'}));
                Promise.all(files.map(function(f){
                    return new Promise(function(resolve, reject){
                        var reader = new FileReader();
                        reader.onload = function(){ resolve({name:f.name,data:reader.result,type:f.type}); };
                        reader.onerror = function(){ reject(new Error('Read failed')); };
                        reader.readAsDataURL(f);
                    });
                })).then(function(fileData){
                    return fetchAction('uploadFiles',{recordId:String(recordId),files:fileData});
                }).then(function(){
                    attachMsg.innerHTML='';
                    loadCustodyFiles();
                }).catch(function(e){
                    attachMsg.innerHTML=''; attachMsg.appendChild(buildAlert({variant:'danger',text:'Upload failed: '+(e.message||e)}));
                });
            }

            function loadCustodyFiles(){
                chipArea.innerHTML='';
                fetchAction('getFiles',{recordId:String(recordId)}).then(function(res){
                    var files = res.files||[];
                    if(!files.length){
                        chipArea.appendChild(el('div',{style:'font-size:12px;color:#9ca3af;padding:4px 0;'},'No attachments'));
                        return;
                    }
                    files.forEach(function(f){
                        var size = f.size ? ' ('+(f.size/1024).toFixed(1)+' KB)' : '';
                        var chip = el('div',{style:CHIP_STYLE});
                        if(f.url){
                            chip.appendChild(el('a',{href:f.url,target:'_blank',style:'color:#2563eb;text-decoration:none;'},'📎 '+(f.originalName||f.fileName)+size));
                        } else {
                            chip.appendChild(el('span',{},'📎 '+(f.originalName||f.fileName)+size));
                        }
                        var rm = el('span',{style:'cursor:pointer;color:#dc2626;font-weight:700;font-size:14px;line-height:1;'},'×');
                        (function(indexId){
                            rm.addEventListener('click',function(){
                                if(!confirm('Remove this file?')) return;
                                fetchAction('removeFile',{indexId:indexId}).then(function(){ loadCustodyFiles(); })
                                .catch(function(e){ attachMsg.innerHTML=''; attachMsg.appendChild(buildAlert({variant:'danger',text:'Remove failed: '+(e.message||e)})); });
                            });
                        })(f.indexId);
                        chip.appendChild(rm);
                        chipArea.appendChild(chip);
                    });
                }).catch(function(e){
                    chipArea.appendChild(el('div',{style:'font-size:12px;color:#dc2626;'},'Failed to load files: '+(e.message||e)));
                });
            }
            loadCustodyFiles();

            var attachCard = card('Attachments',[dropZone, hiddenInput, attachMsg, chipArea]);

            var body = el('div',{style:'display:flex;flex-direction:column;gap:20px;'},
                header,infoCard,kpiRow,reqCard,expCard,ledgerCard,attachCard);

            container.innerHTML = '';
            container.appendChild(render('pageshell',{
                appName:'Cash Custody',
                navbar:{appName:'Cash Custody',moduleName:'Custody Detail'},
                body:body
            }));
        }).catch(function(err) {
            container.innerHTML = '';
            container.appendChild(render('pageshell',{
                appName:'Cash Custody',
                navbar:{appName:'Cash Custody',moduleName:'Custody Detail'},
                body:render('alertbanner',{variant:'danger',text:'Failed to load custody detail: '+(err.message||String(err))})
            }));
        });
    }

    /* ================================================================
       CREATE FORM
       ================================================================ */

    /**
     * Remote-search autocomplete.
     * cfg.fetchFn(keyword) → Promise<[{id,text}]>
     * cfg.placeholder — initial placeholder text
     */
    function buildAutocomplete(cfg) {
        var wrap = el('div',{style:'position:relative;overflow:visible;'});
        var caret = el('span',{style:'position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:10px;color:#9ca3af;'},'▼');
        var inp  = el('input',{type:'text',style:INPUT_STYLE+'padding-right:28px;',placeholder:cfg.placeholder||''});
        var list = el('div',{style:'position:absolute;top:38px;left:0;right:0;max-height:200px;overflow-y:auto;background:#fff;border:1px solid #d1d5db;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:9999;display:none;'});

        wrap.selectedId = '';
        var lastResults = [];
        var blurTimer = null;
        var debounceTimer = null;

        function renderList(items) {
            lastResults = items || [];
            list.innerHTML = '';
            if (!lastResults.length) { list.style.display = 'none'; return; }
            lastResults.forEach(function(o) {
                var row = el('div',{style:'padding:8px 10px;cursor:pointer;font-size:13px;'},o.text||'');
                row.addEventListener('mousedown',function(e) {
                    e.preventDefault();
                    wrap.selectedId = o.id || '';
                    inp.value = o.text || '';
                    list.style.display = 'none';
                });
                row.addEventListener('mouseenter',function() { this.style.background='#f3f4f6'; });
                row.addEventListener('mouseleave',function() { this.style.background=''; });
                list.appendChild(row);
            });
            list.style.display = 'block';
        }

        function showMessage(text, color) {
            list.innerHTML = '';
            var msg = el('div',{style:'padding:10px;font-size:12px;color:'+(color||'#6b7280')+';'},text);
            list.appendChild(msg);
            list.style.display = 'block';
        }

        function doFetch(keyword) {
            showMessage('Loading…');
            cfg.fetchFn(keyword || '').then(function(results) {
                if (results && results.length) {
                    renderList(results);
                } else {
                    showMessage('No results found.');
                }
            }).catch(function(err) {
                showMessage('Error: ' + (err.message || String(err)), '#991b1b');
            });
        }

        inp.addEventListener('input',function() {
            wrap.selectedId = '';
            if (debounceTimer) clearTimeout(debounceTimer);
            var kw = inp.value;
            debounceTimer = setTimeout(function() { doFetch(kw); }, 300);
        });

        inp.addEventListener('focus',function() {
            if (blurTimer) { clearTimeout(blurTimer); blurTimer = null; }
            doFetch(wrap.selectedId ? '' : (inp.value || ''));
        });

        inp.addEventListener('blur',function() {
            blurTimer = setTimeout(function() {
                blurTimer = null;
                list.style.display = 'none';
                if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
                /* Auto-match: exact first, then single partial */
                if (!wrap.selectedId && inp.value.trim()) {
                    var typed = inp.value.trim().toLowerCase();
                    var exact = null, partials = [];
                    for (var i = 0; i < lastResults.length; i++) {
                        var txt = (lastResults[i].text || '').toLowerCase();
                        if (txt === typed) { exact = lastResults[i]; break; }
                        if (txt.indexOf(typed) > -1) partials.push(lastResults[i]);
                    }
                    var match = exact || (partials.length === 1 ? partials[0] : null);
                    if (match) {
                        wrap.selectedId = match.id || '';
                        inp.value = match.text || '';
                    } else {
                        inp.value = '';
                    }
                }
            }, 200);
        });

        wrap.appendChild(inp);
        wrap.appendChild(caret);
        wrap.appendChild(list);

        wrap.clear = function() {
            wrap.selectedId = ''; inp.value = '';
            lastResults = []; list.style.display = 'none';
        };
        wrap.setPlaceholder = function(ph) { inp.placeholder = ph || ''; };
        return wrap;
    }

    function mountCreateView() {
        container.innerHTML = '';
        container.appendChild(render('pageshell',{
            appName:'Cash Custody',
            navbar:{appName:'Cash Custody',moduleName:'New Custody'},
            body:null,loading:true,loadingText:'Preparing form…'
        }));

        /* Fetch select-list options (currency, department, project) */
        Promise.all([
            fetchAction('searchEntities',{entityType:'currency',keyword:''}),
            fetchAction('searchEntities',{entityType:'department',keyword:''}),
            fetchAction('searchEntities',{entityType:'project',keyword:''})
        ]).then(function(res) {
            var currencies   = (res[0] && res[0].results) || [];
            var departments  = (res[1] && res[1].results) || [];
            var projects     = (res[2] && res[2].results) || [];

            /* Build form inputs */
            var inputName    = el('input',{type:'text',style:INPUT_STYLE,placeholder:'Enter custody name'});

            var acEmployee   = buildAutocomplete({
                fetchFn: function(kw) {
                    return fetchAction('searchEntities',{entityType:'employee',keyword:kw})
                        .then(function(r) { return (r&&r.results)||[]; });
                },
                placeholder: 'Type to search employee…'
            });

            var acSubsidiary = buildAutocomplete({
                fetchFn: function(kw) {
                    return fetchAction('searchEntities',{entityType:'subsidiary',keyword:kw})
                        .then(function(r) { return (r&&r.results)||[]; });
                },
                placeholder: 'Type to search subsidiary…'
            });

            var selCurrency    = buildSelect(currencies, '-- Select Currency --');
            var selType        = buildSelect([
                {id:'1',text:'Permanent'},
                {id:'2',text:'Temporary'}
            ], '-- Select Type --');
            var selDepartment  = buildSelect(departments, '-- Select Department --');
            var inputThreshold = el('input',{type:'number',style:INPUT_STYLE,placeholder:'0.00',step:'0.01'});
            var thresholdGroup = formGroup('Replenishment Threshold',inputThreshold);

            var acAccount = buildAutocomplete({
                fetchFn: function(kw) {
                    if (!selCurrency.value) return Promise.resolve([]);
                    return fetchAction('searchEntities',{
                        entityType:'account', keyword:kw,
                        currency:selCurrency.value,
                        subsidiary:acSubsidiary.selectedId||''
                    }).then(function(r) { return (r&&r.results)||[]; });
                },
                placeholder: 'Select currency first…'
            });

            var selFrequency   = buildSelect([
                {id:'1',text:'Daily'},
                {id:'2',text:'Weekly'},
                {id:'3',text:'Monthly'},
                {id:'4',text:'On Demand'}
            ], '-- Select Frequency --');
            var selProject     = buildSelect(projects, '-- Select Project --');
            var txtNotes       = el('textarea',{style:TEXTAREA_STYLE,placeholder:'Enter notes…',rows:'3'});

            /* Type change: hide threshold for Temporary */
            selType.addEventListener('change',function(){
                thresholdGroup.style.display = selType.value==='2' ? 'none' : '';
                if(selType.value==='2') inputThreshold.value='';
            });

            /* Currency change: clear account selection and update placeholder */
            selCurrency.addEventListener('change',function(){
                acAccount.clear();
                acAccount.setPlaceholder(selCurrency.value ? 'Type to search account…' : 'Select currency first…');
            });

            /* Form grid */
            var formGrid = el('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:16px;overflow:visible;'},
                formGroup('Name *',inputName),
                formGroup('Employee *',acEmployee),
                formGroup('Subsidiary *',acSubsidiary),
                formGroup('Currency *',selCurrency),
                formGroup('Type *',selType),
                formGroup('Department',selDepartment),
                thresholdGroup,
                formGroup('Custody Account *',acAccount),
                formGroup('Settlement Frequency',selFrequency),
                formGroup('Default Project',selProject));

            var notesRow = el('div',{style:'margin-top:4px;'},
                formGroup('Notes',txtNotes));

            /* Alert container */
            var alertContainer = el('div',{style:'display:none;'});

            /* Buttons */
            var saveBtn = el('button',{type:'button',style:BTN_PRIMARY},'Save');
            var cancelBtn = el('button',{type:'button',style:BTN_SECONDARY},'Cancel');

            cancelBtn.addEventListener('click',function(){ history.back(); });

            saveBtn.addEventListener('click',function() {
                alertContainer.style.display = 'none';
                alertContainer.innerHTML = '';

                /* Validation — show only the missing fields */
                var missing = [];
                if (!inputName.value.trim()) missing.push('Name');
                if (!acEmployee.selectedId)  missing.push('Employee');
                if (!acSubsidiary.selectedId) missing.push('Subsidiary');
                if (!selCurrency.value)      missing.push('Currency');
                if (!selType.value)          missing.push('Type');
                if (!acAccount.selectedId)   missing.push('Account');
                if (missing.length) {
                    alertContainer.style.display='block';
                    alertContainer.appendChild(render('alertbanner',{variant:'warning',text:'Please fill in: ' + missing.join(', ') + '.'}));
                    return;
                }

                var params = {
                    name:       inputName.value.trim(),
                    employee:   acEmployee.selectedId,
                    subsidiary: acSubsidiary.selectedId,
                    currency:   selCurrency.value,
                    type:       selType.value,
                    department: selDepartment.value,
                    threshold:  inputThreshold.value,
                    account:    acAccount.selectedId,
                    frequency:  selFrequency.value,
                    project:    selProject.value,
                    notes:      txtNotes.value
                };

                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving…';

                fetchAction('createCustody',params).then(function(result) {
                    navigateTo({rid:result.id});
                }).catch(function(err) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Save';
                    alertContainer.style.display = 'block';
                    alertContainer.appendChild(render('alertbanner',{variant:'danger',text:err.message||String(err)}));
                });
            });

            var btnRow = el('div',{style:'display:flex;gap:10px;margin-top:8px;'},saveBtn,cancelBtn);

            var formBody = el('div',{style:'display:flex;flex-direction:column;gap:16px;overflow:visible;'},
                alertContainer,formGrid,notesRow,btnRow);

            var formCard = card('New Custody Master',[formBody]);

            /* Back button */
            var backBtn = el('button',{type:'button',style:BTN_SECONDARY},'← Back');
            backBtn.addEventListener('click',function(){ history.back(); });

            var body = el('div',{style:'display:flex;flex-direction:column;gap:16px;'},backBtn,formCard);

            container.innerHTML = '';
            container.appendChild(render('pageshell',{
                appName:'Cash Custody',
                navbar:{appName:'Cash Custody',moduleName:'New Custody'},
                body:body
            }));
        }).catch(function(err) {
            container.innerHTML = '';
            container.appendChild(render('pageshell',{
                appName:'Cash Custody',
                navbar:{appName:'Cash Custody',moduleName:'New Custody'},
                body:render('alertbanner',{variant:'danger',text:'Failed to load form data: '+(err.message||String(err))})
            }));
        });
    }

    /* ================================================================
       PAGE ASSEMBLY + MOUNT
       ================================================================ */

    function mount() {
        injectStyles();

        if (mode === 'create') {
            mountCreateView();
        } else if (recordId) {
            mountDetailView();
        } else {
            mountListView();
        }
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
