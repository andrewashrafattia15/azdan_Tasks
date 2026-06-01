/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/query','N/search','N/render','N/xml','N/file'], (query, search, render, xml, file) => {

    const onRequest = (context) => {
        try {
            const { date, location, subsidiary = null } = context.request.parameters;

            if (!date || !location) {
                context.response.write('Missing required parameters: date, location');
                return;
            }

            const startDate = `${date} 00:00:00`;
            const endDate   = `${date} 23:59:59`;

            // --- Data Layer ---
            const invoiceResults = getInvoices(startDate, endDate, location, subsidiary);
            const creditResults  = getCreditMemos(startDate, endDate, location, subsidiary);
            const advanceResults = getAdvanceInvoices(startDate, endDate, location, subsidiary);

            const invoiceIds = invoiceResults.map(r => r.id);
            const advanceIds = advanceResults.map(r => r.id);

            const { rows: paymentRows,    byMethod: paymentsByMethod   } = getPaymentsAgainstInvoices(invoiceIds);
            const { rows: advPaymentRows, byMethod: advPaymentByMethod } = getPaymentsAgainstAdvances(advanceIds);

            // --- Logic Layer ---
            const summary                                                = buildSummaryData(invoiceResults, creditResults, paymentsByMethod, advPaymentByMethod, location);
            const { html: paymentDetailHtml, grandTotal }               = buildPaymentDetailRows(paymentRows, advPaymentRows);
            const { html: salesDocHtml, docTotal: salesDocTotal }       = buildSalesDocRows(invoiceResults, creditResults);
            const advanceRowsHtml                                        = buildAdvanceRows(advanceResults);

            // --- Render Layer ---
            const pdfXml = buildPdfTemplate(summary, paymentDetailHtml, grandTotal, salesDocHtml, salesDocTotal, advanceRowsHtml, date);
            finalizeTemplate(pdfXml, context, date);

        } catch (e) {
            log.debug('onRequest', e);
            context.response.write('Error generating report: ' + e.message);
        }
    };

    /* ================================================================
     * HELPERS
     * ================================================================ */

    const fmt = (n) =>
        parseFloat(n || 0)
            .toFixed(2)
            .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const esc = (s) => xml.escape({ xmlText: String(s || '') });

    // Builds the WHERE date/location fragment shared by all queries.
    // Returns { clause, params } — clause uses ? placeholders.
    const buildDateLocationClause = (startDate, endDate, location, subsidiary, tableAlias) => {
        let clause = `
            ${tableAlias}.trandate BETWEEN
                TO_DATE(?, 'YYYY-MM-DD HH24:MI:SS')
                AND
                TO_DATE(?, 'YYYY-MM-DD HH24:MI:SS')
            AND ${tableAlias}.location = ?`;

        const params = [startDate, endDate, location];

        // if (subsidiary) {
        //     clause += `\n            AND ${tableAlias}.subsidiary = ?`;
        //     params.push(subsidiary);
        // }

        return { clause, params };
    };

    /* ================================================================
     * DATA LAYER
     * ================================================================ */

    const getInvoices = (startDate, endDate, location, subsidiary) => {
        const { clause, params } = buildDateLocationClause(
            startDate, endDate, location, subsidiary, 'Invoice'
        );

        const sql = `
            SELECT
                Invoice.id                          AS id,
                Invoice.tranid                      AS tranid,
                Invoice.total                       AS total,
                Customer.altname                    AS customerName,
                Customer.entityid                   AS customerCode,
                BUILTIN.DF(Invoice.location)        AS location,
                Contact.entityid                    AS contactName
            FROM Invoice
            LEFT JOIN Customer           ON Customer.id           = Invoice.entity
            LEFT JOIN TransactionContact ON TransactionContact.transaction = Invoice.id
            LEFT JOIN Contact            ON Contact.id            = TransactionContact.contact
            WHERE ${clause}
            AND NVL(Invoice.custbody_az_cbc_is_deposit, 'F') = 'F'
            AND Invoice.custbody_az_cbc_order_type = '1'
        `;

        const results = query.runSuiteQL({ query: sql, params }).asMappedResults();
        log.debug('getInvoices | count', results.length);
        return results;
    };

    const getCreditMemos = (startDate, endDate, location, subsidiary) => {
        const { clause, params } = buildDateLocationClause(
            startDate, endDate, location, subsidiary, 'CreditMemo'
        );

        const sql = `
            SELECT
                CreditMemo.id                       AS id,
                CreditMemo.tranid                   AS tranid,
                ABS(CreditMemo.total)               AS total,
                Customer.altname                    AS customerName,
                Customer.entityid                   AS customerCode,
                BUILTIN.DF(CreditMemo.location)     AS location,
                Contact.entityid                    AS contactName
            FROM CreditMemo
            LEFT JOIN Customer           ON Customer.id           = CreditMemo.entity
            LEFT JOIN TransactionContact ON TransactionContact.transaction = CreditMemo.id
            LEFT JOIN Contact            ON Contact.id            = TransactionContact.contact
            WHERE ${clause}
            AND NVL(CreditMemo.custbody_az_cbc_is_deposit, 'F') = 'F'
            AND CreditMemo.custbody_az_cbc_order_type = '1'
        `;

        const results = query.runSuiteQL({ query: sql, params }).asMappedResults();
        log.debug('getCreditMemos | count', results.length);
        return results;
    };

    const getAdvanceInvoices = (startDate, endDate, location, subsidiary) => {
        const { clause, params } = buildDateLocationClause(
            startDate, endDate, location, subsidiary, 'Invoice'
        );

        const sql = `
            SELECT
                Invoice.id                              AS id,
                Invoice.tranid                          AS tranid,
                Customer.altname                        AS customerName,
                Customer.entityid                       AS customerCode,
                (Invoice.total - Invoice.taxtotal)      AS invoiceAmt,
                Invoice.taxtotal                        AS invoiceTax,
                Invoice.total                           AS advAmount,
                Invoice.taxtotal                        AS dpmTax,
                Invoice.total                           AS netTotal
            FROM Invoice
            LEFT JOIN Customer ON Customer.id = Invoice.entity
            WHERE ${clause}
            AND Invoice.custbody_az_cbc_is_deposit = 'T'
            AND Invoice.custbody_az_cbc_order_type = '1'
        `;

        const results = query.runSuiteQL({ query: sql, params }).asMappedResults();
        log.debug('getAdvanceInvoices | count', results.length);
        return results;
    };

const getPaymentsAgainstInvoices = (invoiceIds) => {
    const rows     = [];
    const byMethod = {};

    if (!invoiceIds || invoiceIds.length === 0) return { rows, byMethod };

    // --- Customer Payments ---
    search.create({
        type   : search.Type.CUSTOMER_PAYMENT,
        filters: [['appliedtotransaction', 'anyof', invoiceIds]],
        columns: [
            search.createColumn({ name: 'internalid' }),
            search.createColumn({ name: 'tranid' }),
            search.createColumn({ name: 'paymentmethod' }),
            search.createColumn({ name: 'total' }),
            search.createColumn({ name: 'appliedtotransaction' })
            // TODO: add RefNo column here once the correct field ID is confirmed
        ]
    }).run().each(result => {
        let payMethod = result.getText({ name: 'paymentmethod' }) || 'UNKNOWN';
        // Replace UNKNOWN with Undeposited Funds
        if (payMethod === 'UNKNOWN') payMethod = 'Undeposited Funds';
        
        const amount    = Math.abs(parseFloat(result.getValue({ name: 'total' }) || 0));
        const receiptNo = result.getValue({ name: 'tranid' })              || '';
        const invoiceNo = result.getText({ name: 'appliedtotransaction' }) || '';

        rows.push({
            paymentType: payMethod,
            type       : 'Invoice',
            invoiceNo,
            receiptNo,
            refNo      : '',    // TODO: populate once RefNo field is confirmed
            amount
        });

        if (!byMethod[payMethod]) byMethod[payMethod] = { total: 0 };
        byMethod[payMethod].total += amount;

        return true;
    });

    // --- Customer Deposits (applied to the same invoices) ---
    search.create({
        type   : search.Type.DEPOSIT_APPLICATION,
        filters: [['appliedtotransaction', 'anyof', invoiceIds]],
        columns: [
            search.createColumn({ name: 'internalid' }),
            search.createColumn({ name: 'tranid' }),
            search.createColumn({ name: 'paymentmethod' }),
            search.createColumn({ name: 'total' }),
            search.createColumn({ name: 'appliedtotransaction' })
            // TODO: add RefNo column here once the correct field ID is confirmed
        ]
    }).run().each(result => {
        let payMethod = result.getText({ name: 'paymentmethod' }) || 'UNKNOWN';
        // Replace UNKNOWN with Undeposited Funds
        if (payMethod === 'UNKNOWN') payMethod = 'Undeposited Funds';
        
        const amount    = Math.abs(parseFloat(result.getValue({ name: 'total' }) || 0));
        const receiptNo = result.getValue({ name: 'tranid' })              || '';
        const invoiceNo = result.getText({ name: 'appliedtotransaction' }) || '';

        rows.push({
            paymentType: payMethod,
            type       : 'Deposit',
            invoiceNo,
            receiptNo,
            refNo      : '',    // TODO: populate once RefNo field is confirmed
            amount
        });

        if (!byMethod[payMethod]) byMethod[payMethod] = { total: 0 };
        byMethod[payMethod].total += amount;

        return true;
    });

    log.debug('getPaymentsAgainstInvoices | methods found', Object.keys(byMethod).join(', '));
    return { rows, byMethod };
};

const getPaymentsAgainstAdvances = (advanceIds) => {
    const rows     = [];
    const byMethod = {};

    if (!advanceIds || advanceIds.length === 0) return { rows, byMethod };

    // --- Customer Payments ---
    search.create({
        type   : search.Type.CUSTOMER_PAYMENT,
        filters: [['appliedtotransaction', 'anyof', advanceIds]],
        columns: [
            search.createColumn({ name: 'internalid' }),
            search.createColumn({ name: 'tranid' }),
            search.createColumn({ name: 'paymentmethod' }),
            search.createColumn({ name: 'total' }),
            search.createColumn({ name: 'appliedtotransaction' })
            // TODO: add RefNo column here once the correct field ID is confirmed
        ]
    }).run().each(result => {
        let payMethod = result.getText({ name: 'paymentmethod' }) || 'UNKNOWN';
        // Replace UNKNOWN with Undeposited Funds
        if (payMethod === 'UNKNOWN') payMethod = 'Undeposited Funds';
        
        const amount    = Math.abs(parseFloat(result.getValue({ name: 'total' }) || 0));
        const receiptNo = result.getValue({ name: 'tranid' })              || '';
        const invoiceNo = result.getText({ name: 'appliedtotransaction' }) || '';

        rows.push({
            paymentType: payMethod,
            type       : 'Invoice',
            invoiceNo,
            receiptNo,
            refNo      : '',    // TODO: populate once RefNo field is confirmed
            amount
        });

        if (!byMethod[payMethod]) byMethod[payMethod] = { total: 0 };
        byMethod[payMethod].total += amount;

        return true;
    });

    // --- Customer Deposits (applied to the same advance invoices) ---
    search.create({
        type   : search.Type.CUSTOMER_DEPOSIT,
        filters: [['appliedtotransaction', 'anyof', advanceIds]],
        columns: [
            search.createColumn({ name: 'internalid' }),
            search.createColumn({ name: 'tranid' }),
            search.createColumn({ name: 'paymentmethod' }),
            search.createColumn({ name: 'total' }),
            search.createColumn({ name: 'appliedtotransaction' })
            // TODO: add RefNo column here once the correct field ID is confirmed
        ]
    }).run().each(result => {
        let payMethod = result.getText({ name: 'paymentmethod' }) || 'UNKNOWN';
        // Replace UNKNOWN with Undeposited Funds
        if (payMethod === 'UNKNOWN') payMethod = 'Undeposited Funds';
        
        const amount    = Math.abs(parseFloat(result.getValue({ name: 'total' }) || 0));
        const receiptNo = result.getValue({ name: 'tranid' })              || '';
        const invoiceNo = result.getText({ name: 'appliedtotransaction' }) || '';

        rows.push({
            paymentType: payMethod,
            type       : 'Deposit',
            invoiceNo,
            receiptNo,
            refNo      : '',    // TODO: populate once RefNo field is confirmed
            amount
        });

        if (!byMethod[payMethod]) byMethod[payMethod] = { total: 0 };
        byMethod[payMethod].total += amount;

        return true;
    });

    log.debug('getPaymentsAgainstAdvances | methods found', Object.keys(byMethod).join(', '));
    return { rows, byMethod };
};

    /* ================================================================
     * LOGIC LAYER
     * Each function transforms raw data into display-ready values.
     * ================================================================ */

    const buildSummaryData = (invoiceResults, creditResults, paymentsByMethod, advPaymentByMethod, locationParam) => {
        let totalInvoiceAmt = 0;
        invoiceResults.forEach(r => { totalInvoiceAmt += parseFloat(r.total || 0); });

        let totalCreditAmt = 0;
        creditResults.forEach(r => { totalCreditAmt += parseFloat(r.total || 0); });

        const cashAgainstInvoice = (paymentsByMethod['Cash']   || { total: 0 }).total;
        const cashAgainstAdvance = (advPaymentByMethod['Cash'] || { total: 0 }).total;
        const totalCashCollected = cashAgainstInvoice + cashAgainstAdvance;

        const locationName = invoiceResults.length > 0
            ? (invoiceResults[0].location || locationParam)
            : locationParam;

        return {
            invoiceCount : invoiceResults.length,
            creditCount  : creditResults.length,
            totalInvoiceAmt,
            totalCreditAmt,
            cashAgainstInvoice,
            cashAgainstAdvance,
            totalCashCollected,
            locationName,
            paymentsByMethod,
            advPaymentByMethod
        };
    };

    const buildPaymentDetailRows = (paymentRows, advPaymentRows) => {
        const allRows = [...(paymentRows || []), ...(advPaymentRows || [])];

        const grouped = allRows.reduce((acc, p) => {
            if (!p) return acc;
            if (!acc[p.paymentType]) acc[p.paymentType] = [];
            acc[p.paymentType].push(p);
            return acc;
        }, {});

        let html       = '';
        let grandTotal = 0;

        Object.keys(grouped).forEach(method => {
            const rows     = grouped[method];
            let   subTotal = 0;

            // METHOD HEADER
            html += `
                <tr>
                    <td colspan="6" style="font-weight:bold; padding-top:6px;">${esc(method)}</td>
                </tr>`;

            rows.forEach(p => {
                const amount = parseFloat(p.amount || 0);
                subTotal   += amount;
                grandTotal += amount;

                html += `
                    <tr>
                        <td align="left">${esc(p.paymentType)}</td>
                        <td>${esc(p.type)}</td>
                        <td>${esc(p.invoiceNo)}</td>
                        <td>${esc(p.receiptNo)}</td>
                        <td>${esc(p.refNo)}</td>
                        <td align="right">${fmt(amount)}</td>
                    </tr>`;
            });

            // SUB TOTAL
            html += `
                <tr>
                    <td colspan="5" align="right" style="font-weight:bold;">Sub Total:</td>
                    <td align="right" style="font-weight:bold;">${fmt(subTotal)}</td>
                </tr>`;
        });

        if (!html) html = `<tr><td colspan="6" align="center">No payments found</td></tr>`;

        return { html, grandTotal };
    };

    const buildSalesDocRows = (invoiceResults, creditResults) => {
        let html     = '';
        let docTotal = 0;

        invoiceResults.forEach(r => {
            const total = parseFloat(r.total || 0);
            docTotal += total;
            html += `
                <tr>
                    <td>${esc(r.tranid)}</td>
                    <td>${esc(r.customercode)}</td>
                    <td>${esc(r.customername)}</td>
                    <td>${esc(r.contactname)}</td>
                    <td align="right">${fmt(total)}</td>
                </tr>`;
        });

        creditResults.forEach(r => {
            const total = Math.abs(parseFloat(r.total || 0));
            docTotal -= total;
            html += `
                <tr>
                    <td>${esc(r.tranid)}</td>
                    <td>${esc(r.customercode)}</td>
                    <td>${esc(r.customername)}</td>
                    <td>${esc(r.contactname)}</td>
                    <td align="right">-${fmt(total)}</td>
                </tr>`;
        });

        if (!html) html = `<tr><td colspan="5" align="center">No documents found</td></tr>`;

        return { html, docTotal };
    };

    const buildAdvanceRows = advanceResults => {
        let html = '';

        advanceResults.forEach(r => {
            html += `
                <tr>
                    <td>${esc(r.tranid)}</td>
                    <td>${esc(r.customercode)}</td>
                    <td>${esc(r.customername)}</td>
                    <td align="right">${fmt(r.invoiceamt)}</td>
                    <td align="right">${fmt(r.invoicetax)}</td>
                    <td align="right">${fmt(r.advamount)}</td>
                    <td align="right">${fmt(r.dpmtax)}</td>
                    <td align="right">${fmt(r.nettotal)}</td>
                </tr>`;
        });

        if (!html) html = `<tr><td colspan="8" align="center">No advance/down payment records found</td></tr>`;

        return html;
    };

    /* ================================================================
     * RENDER LAYER
     * Split into three focused functions:
     *   getTemplateHeader  – XML declaration, DOCTYPE, <head>, CSS, opens <body>
     *   getTemplateBody    – all visible content sections, closes </body></pdf>
     *   finalizeTemplate   – renders the assembled template string to PDF
     * ================================================================ */

    // Orchestrates the three render-layer functions
    const buildPdfTemplate = (summary, paymentDetailHtml, grandTotal, salesDocHtml, salesDocTotal, advanceRowsHtml, date) => {
        let template = getTemplateHeader();
            template = getTemplateBody(template, summary, paymentDetailHtml, grandTotal, salesDocHtml, salesDocTotal, advanceRowsHtml, date);
        return template;
    };


    const getTemplateHeader = () => {
        try {
            let template = '';

            template += '<?xml version="1.0"?>';
            template += '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            template += '<pdf>';
            template += '<head>';
            template += '<style type="text/css">';
            template += '* { font-family: Arial, sans-serif; font-size: 9pt; color: #000000; }';
            template += '.highlight { font-weight: bold; }';
            template += '.layout td { border: none; padding: 2px 4px; }';
            template += '.detail-table { width: 100%; border-collapse: collapse; margin-top: 6px; }';
            template += '.detail-table th { border: none; border-bottom: 0.5pt solid #000000; padding: 3px 4px; text-align: left; font-weight: bold; text-decoration: underline; }';
            template += '.detail-table td { border: none; padding: 2px 4px; }';
            template += '.sales-table { width: 100%; border-collapse: collapse; margin-top: 6px; }';
            template += '.sales-table th { border: none; padding: 3px 4px; text-align: left; font-weight: bold; }';
            template += '.sales-table td { border: none; padding: 2px 4px; }';
            template += '.sales-table .total-row td { border-top: 0.5pt solid #000000; font-weight: bold; }';
            template += '.advance-table { width: 100%; border-collapse: collapse; margin-top: 4px; }';
            template += '.advance-table th { border: none; border-bottom: 0.5pt solid #000000; padding: 3px 4px; text-align: left; font-weight: bold; }';
            template += '.advance-table td { border: none; padding: 2px 4px; }';
            template += '</style>';
            template += '</head>';
            template += '<body padding="0.5in 0.6in 0.5in 0.6in" size="A4">';

            return template;

        } catch (error) {
            log.error('getTemplateHeader', error);
            return '';
        }
    };

    const getTemplateBody = (template, summary, paymentDetailHtml, grandTotal, salesDocHtml, salesDocTotal, advanceRowsHtml, date) => {
        try {
            const safeDate     = esc(date);
            const safeLocation = esc(summary.locationName);

            // Build dynamic side-by-side payment method summary rows
            const invoiceMethodKeys = Object.keys(summary.paymentsByMethod);
            const advanceMethodKeys = Object.keys(summary.advPaymentByMethod);
            const maxRows           = Math.max(invoiceMethodKeys.length, advanceMethodKeys.length, 0);

            const paymentSummaryRows = Array.from({ length: maxRows }, (_, i) => {
                const lKey = invoiceMethodKeys[i] || '';
                const rKey = advanceMethodKeys[i] || '';
                return '<tr>'
                    + '<td class="highlight" style="width:22%;">' + (lKey ? esc(lKey) + ' :' : '') + '</td>'
                    + '<td style="width:18%;">'                   + (lKey ? fmt(summary.paymentsByMethod[lKey].total) : '') + '</td>'
                    + '<td style="width:5%;"></td>'
                    + '<td class="highlight" style="width:22%;">' + (rKey ? esc(rKey) + ' :' : '') + '</td>'
                    + '<td style="width:18%;">'                   + (rKey ? fmt(summary.advPaymentByMethod[rKey].total) : '') + '</td>'
                    + '</tr>';
            }).join('');

            // ===================================================
            // REPORT TITLE
            // ===================================================
            template += '<table class="layout" style="width:100%; margin-bottom:4px;">';
            template += '<tr>';
            template += '<td style="width:50%;"></td>';
            template += '<td style="width:4%; background-color:#FF8C00; font-size:18pt;">&#160;</td>';
            template += '<td style="width:46%; font-size:16pt; font-weight:bold; padding-left:8px;">X Report - Cash Sale Day End</td>';
            template += '</tr>';
            template += '</table>';

            // ===================================================
            // DATE & LOCATION
            // ===================================================
            template += '<table class="layout" style="width:100%; margin-bottom:2px;">';
            template += '<tr>';
            template += '<td style="width:50%;"></td>';
            template += '<td style="width:10%; font-weight:bold;">Date :</td>';
            template += '<td style="width:40%;">' + safeDate + '</td>';
            template += '</tr>';
            template += '<tr>';
            template += '<td style="width:50%;"></td>';
            template += '<td style="font-weight:bold;">Location :</td>';
            template += '<td>' + safeLocation + '</td>';
            template += '</tr>';
            template += '</table>';

            // ===================================================
            // SALES DETAILS — COUNTS & AMOUNTS
            // ===================================================
            template += '<p style="font-weight:bold; margin-top:10px; margin-bottom:4px;">Sales Details :</p>';

            template += '<table class="layout" style="width:100%; margin-bottom:6px;">';
            template += '<tr>';
            template += '<td class="highlight" style="width:32.5%;">Cash Invoice Count :</td>';
            template += '<td style="width:15%;">' + summary.invoiceCount + '</td>';
            template += '<td style="width:5%;"></td>';
            template += '<td class="highlight" style="width:32.5%;">Cash Credit Memo Count :</td>';
            template += '<td style="width:15%;">' + summary.creditCount + '</td>';
            template += '</tr>';
            template += '<tr>';
            template += '<td class="highlight">Cash Invoice Amount :</td>';
            template += '<td>' + fmt(summary.totalInvoiceAmt) + '</td>';
            template += '<td></td>';
            template += '<td class="highlight">Cash Credit Memo Amount :</td>';
            template += '<td>' + fmt(summary.totalCreditAmt) + '</td>';
            template += '</tr>';
            template += '</table>';

            // ===================================================
            // PAYMENT METHOD TOTALS (INVOICE vs ADVANCE side-by-side)
            // ===================================================
            template += '<table class="layout" style="width:100%; margin-bottom:2px;">';
            template += '<tr>';
            template += '<td class="highlight" colspan="2" style="width:47.5%;">Payment Details Against Invoice :</td>';
            template += '<td style="width:5%;"></td>';
            template += '<td class="highlight" colspan="2" style="width:47.5%;">Payment Details Against Advance :</td>';
            template += '</tr>';
            template += paymentSummaryRows;
            template += '</table>';

            // ===================================================
            // TOTAL CASH COLLECTED
            // ===================================================
            template += '<table class="layout" style="width:100%; border-top:0.5pt solid #000000; border-bottom:0.5pt solid #000000; margin-top:4px; margin-bottom:10px;">';
            template += '<tr>';
            template += '<td style="width:28%; font-weight:bold;">Total Cash Collected :</td>';
            template += '<td style="width:16%;">' + fmt(summary.cashAgainstInvoice) + '</td>';
            template += '<td style="width:4%; text-align:center; font-weight:bold;">+</td>';
            template += '<td style="width:10%;">' + fmt(summary.cashAgainstAdvance) + '</td>';
            template += '<td style="width:4%; text-align:center; font-weight:bold;">=</td>';
            template += '<td style="width:18%; font-weight:bold; border:0.5pt solid #000000; padding:2px 6px;">' + fmt(summary.totalCashCollected) + '</td>';
            template += '<td style="width:20%;"></td>';
            template += '</tr>';
            template += '</table>';

            // ===================================================
            // PAYMENT DETAILS TABLE
            // ===================================================
            template += '<table class="detail-table">';
            template += '<thead><tr>';
            template += '<th style="width:20%;">PaymentType</th>';
            template += '<th style="width:15%;">Type</th>';
            template += '<th style="width:25%;">Invoice Number</th>';
            template += '<th style="width:20%;">Receipt Number</th>';
            template += '<th style="width:10%;">RefNo</th>';
            template += '<th style="width:10%;" align="right">Amount</th>';
            template += '</tr></thead>';
            template += '<tbody>';
            template += paymentDetailHtml;
            template += '<tr>';
            template += '<td colspan="5" align="right" style="border-top:0.5pt solid #000000; font-weight:bold;">Grand Total:</td>';
            template += '<td align="right" style="border-top:0.5pt solid #000000; font-weight:bold;">' + fmt(grandTotal) + '</td>';
            template += '</tr>';
            template += '</tbody>';
            template += '</table>';

            // ===================================================
            // SALES DOCUMENT LISTING
            // ===================================================
            template += '<table class="sales-table" style="margin-top:14px;">';
            template += '<thead><tr>';
            template += '<th style="width:12%;">Doc No.</th>';
            template += '<th style="width:14%;">Customer Code</th>';
            template += '<th style="width:36%;">Customer Name</th>';
            template += '<th style="width:20%;">ContactName</th>';
            template += '<th style="width:12%;" align="right">DocTotal</th>';
            template += '</tr></thead>';
            template += '<tbody>';
            template += salesDocHtml;
            template += '<tr class="total-row">';
            template += '<td colspan="4" align="right">Total :</td>';
            template += '<td align="right">' + fmt(salesDocTotal) + '</td>';
            template += '</tr>';
            template += '</tbody>';
            template += '</table>';

            // ===================================================
            // ADVANCE / DOWN PAYMENT TABLE
            // ===================================================
            template += '<p style="font-weight:bold; margin-top:14px; margin-bottom:2px;">Cash Invoice with Down Payment(Advance)</p>';
            template += '<table class="advance-table">';
            template += '<thead><tr>';
            template += '<th style="width:10%;">Doc No.</th>';
            template += '<th style="width:14%;">Customer Code</th>';
            template += '<th style="width:28%;">Customer Name</th>';
            template += '<th style="width:10%;" align="right">Invoice Amt</th>';
            template += '<th style="width:9%;"  align="right">Invoice Tax</th>';
            template += '<th style="width:10%;" align="right">Adv. Amount</th>';
            template += '<th style="width:9%;"  align="right">DPM Tax</th>';
            template += '<th style="width:10%;" align="right">Net Total</th>';
            template += '</tr></thead>';
            template += '<tbody>';
            template += advanceRowsHtml;
            template += '</tbody>';
            template += '</table>';

            template += '</body></pdf>';

            return template;

        } catch (e) {
            log.error('getTemplateBody', e);
            return template;
        }
    };

    const finalizeTemplate = (template, context, date) => {
        try {
            const pdfFile = render.xmlToPdf({ xmlString: template });

            context.response.writeFile({
                file: file.create({
                    name    : `X_Report_Cash_Day_End_${date}.pdf`,
                    fileType: file.Type.PDF,
                    contents: pdfFile.getContents()
                }),
                isInline: true
            });
        } catch (e) {
            log.error('finalizeTemplate', e);
            context.response.write('Error generating PDF: ' + (e.message || e));
        }
    };


    return { onRequest };
});