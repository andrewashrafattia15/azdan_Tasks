/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/query','N/search','N/render','N/xml','N/file'], (query, search, render, xml, file) => {

    /* ================================================================
     * ENTRY POINT
     * Orchestrates the data, logic, and render layers.
     * To change the report flow, edit only this function.
     * ================================================================ */

    const onRequest = (context) => {
        try {
            const { date_from: dateFrom, date_to: dateTo, location, subsidiary = null } = context.request.parameters;

            if (!dateFrom || !dateTo || !location) {
                context.response.write('Missing required parameters: date_from, date_to, location');
                return;
            }

            const startDate = `${dateFrom} 00:00:00`;
            const endDate   = `${dateTo} 23:59:59`;

            // --- Data Layer ---
            const cashInvoiceResults   = getCashInvoices(startDate, endDate, location, subsidiary);
            const creditInvoiceResults = getCreditInvoices(startDate, endDate, location, subsidiary);
            const cashCreditResults    = getCashCreditMemos(startDate, endDate, location, subsidiary);
            const creditCreditResults  = getCreditCreditMemos(startDate, endDate, location, subsidiary);
            const advanceResults       = getAdvanceInvoices(startDate, endDate, location, subsidiary);

            // Payments driven by cash invoices (undeposited) and advances only
            const cashInvoiceIds = cashInvoiceResults.map(r => r.id);
            const advanceIds     = advanceResults.map(r => r.id);

            const { rows: paymentRows,    byMethod: paymentsByMethod   } = getPaymentsAgainstInvoices(cashInvoiceIds);
            const { rows: advPaymentRows, byMethod: advPaymentByMethod } = getPaymentsAgainstAdvances(advanceIds);

            // --- Logic Layer ---
            const summary = buildSummaryData(
                cashInvoiceResults, creditInvoiceResults,
                cashCreditResults,  creditCreditResults,
                paymentsByMethod, advPaymentByMethod, location
            );

            const { html: paymentDetailHtml, grandTotal }         = buildPaymentDetailRows(paymentRows, advPaymentRows);
            const { html: salesDocHtml, docTotal: salesDocTotal } = buildSalesDocRows(cashInvoiceResults, creditInvoiceResults, cashCreditResults, creditCreditResults);
            const advanceRowsHtml                                  = buildAdvanceRows(advanceResults);

            // --- Render Layer ---
            const pdfXml  = buildPdfTemplate(summary, paymentDetailHtml, grandTotal, salesDocHtml, salesDocTotal, advanceRowsHtml, dateFrom, dateTo);
            const pdfFile = render.xmlToPdf({ xmlString: pdfXml });

            context.response.writeFile({
                file: file.create({
                    name    : `Z_Report_Cash_Sale_${dateFrom}_to_${dateTo}.pdf`,
                    fileType: file.Type.PDF,
                    contents: pdfFile.getContents()
                }),
                isInline: true
            });

        } catch (e) {
            log.debug('onRequest', e);
            context.response.write(`Error generating report: ${e.message}`);
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

    // Builds the WHERE date-range / location fragment shared by all queries.
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

    // Fetches cash invoices (order type = Cash '1', is_deposit = F).
    const getCashInvoices = (startDate, endDate, location, subsidiary) => {
        const { clause, params } = buildDateLocationClause(
            startDate, endDate, location, subsidiary, 'Invoice'
        );

        const sql = `
            SELECT
                Invoice.id                          AS id,
                Invoice.tranid                      AS tranid,
                Invoice.trandate                    AS trandate,
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
            ORDER BY Invoice.trandate ASC, Invoice.tranid ASC
        `;

        const results = query.runSuiteQL({ query: sql, params }).asMappedResults();
        log.debug('getCashInvoices | count', results.length);
        return results;
    };

    // Fetches credit invoices (order type = Credit '2', is_deposit = F).
    const getCreditInvoices = (startDate, endDate, location, subsidiary) => {
        const { clause, params } = buildDateLocationClause(
            startDate, endDate, location, subsidiary, 'Invoice'
        );

        const sql = `
            SELECT
                Invoice.id                          AS id,
                Invoice.tranid                      AS tranid,
                Invoice.trandate                    AS trandate,
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
            AND Invoice.custbody_az_cbc_order_type = '2'
            ORDER BY Invoice.trandate ASC, Invoice.tranid ASC
        `;

        const results = query.runSuiteQL({ query: sql, params }).asMappedResults();
        log.debug('getCreditInvoices | count', results.length);
        return results;
    };

    // Fetches cash credit memos (order type = Cash '1', is_deposit = F).
    const getCashCreditMemos = (startDate, endDate, location, subsidiary) => {
        const { clause, params } = buildDateLocationClause(
            startDate, endDate, location, subsidiary, 'CreditMemo'
        );

        const sql = `
            SELECT
                CreditMemo.id                       AS id,
                CreditMemo.tranid                   AS tranid,
                CreditMemo.trandate                 AS trandate,
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
            ORDER BY CreditMemo.trandate ASC, CreditMemo.tranid ASC
        `;

        const results = query.runSuiteQL({ query: sql, params }).asMappedResults();
        log.debug('getCashCreditMemos | count', results.length);
        return results;
    };

    // Fetches credit credit memos (order type = Credit '2', is_deposit = F).
    const getCreditCreditMemos = (startDate, endDate, location, subsidiary) => {
        const { clause, params } = buildDateLocationClause(
            startDate, endDate, location, subsidiary, 'CreditMemo'
        );

        const sql = `
            SELECT
                CreditMemo.id                       AS id,
                CreditMemo.tranid                   AS tranid,
                CreditMemo.trandate                 AS trandate,
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
            AND CreditMemo.custbody_az_cbc_order_type = '2'
            ORDER BY CreditMemo.trandate ASC, CreditMemo.tranid ASC
        `;

        const results = query.runSuiteQL({ query: sql, params }).asMappedResults();
        log.debug('getCreditCreditMemos | count', results.length);
        return results;
    };

    // Fetches advance / down payment invoices (order type = Cash '1', is_deposit = T).
    const getAdvanceInvoices = (startDate, endDate, location, subsidiary) => {
        const { clause, params } = buildDateLocationClause(
            startDate, endDate, location, subsidiary, 'Invoice'
        );

        const sql = `
            SELECT
                Invoice.id                              AS id,
                Invoice.tranid                          AS tranid,
                Invoice.trandate                        AS trandate,
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
            ORDER BY Invoice.trandate ASC, Invoice.tranid ASC
        `;

        const results = query.runSuiteQL({ query: sql, params }).asMappedResults();
        log.debug('getAdvanceInvoices | count', results.length);
        return results;
    };

    const getPaymentsAgainstInvoices = (invoiceIds) => {
        const rows     = [];
        const byMethod = {};

        if (!invoiceIds || invoiceIds.length === 0) return { rows, byMethod };

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

            if (payMethod === 'UNKNOWN') payMethod = 'Undeposited Funds';

            const amount    = Math.abs(parseFloat(result.getValue({ name: 'total' }) || 0));
            const receiptNo = result.getValue({ name: 'tranid' })              || '';
            const invoiceNo = result.getText({ name: 'appliedtotransaction' }) || '';

            rows.push({ paymentType: payMethod, type: 'Invoice', invoiceNo, receiptNo, refNo: '', amount });

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
            if (payMethod === 'UNKNOWN') payMethod = 'Undeposited Funds';
            const amount    = Math.abs(parseFloat(result.getValue({ name: 'total' }) || 0));
            const receiptNo = result.getValue({ name: 'tranid' })              || '';
            const invoiceNo = result.getText({ name: 'appliedtotransaction' }) || '';

            rows.push({ paymentType: payMethod, type: 'Advance', invoiceNo, receiptNo, refNo: '', amount });

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
     * ================================================================ */

    const buildSummaryData = (
        cashInvoiceResults, creditInvoiceResults,
        cashCreditResults,  creditCreditResults,
        paymentsByMethod, advPaymentByMethod, locationParam
    ) => {
        const sumTotal = rows => rows.reduce((acc, r) => acc + parseFloat(r.total || 0), 0);

        const totalCashInvoiceAmt   = sumTotal(cashInvoiceResults);
        const totalCreditInvoiceAmt = sumTotal(creditInvoiceResults);
        const totalCashCreditAmt    = sumTotal(cashCreditResults);
        const totalCreditCreditAmt  = sumTotal(creditCreditResults);

        const totalInvoiceCount = cashInvoiceResults.length + creditInvoiceResults.length;
        const totalInvoiceAmt   = totalCashInvoiceAmt + totalCreditInvoiceAmt;
        const totalCreditCount  = cashCreditResults.length + creditCreditResults.length;
        const totalCreditAmt    = totalCashCreditAmt + totalCreditCreditAmt;

        const cashAgainstInvoice = (paymentsByMethod['Cash']   || { total: 0 }).total;
        const cashAgainstAdvance = (advPaymentByMethod['Cash'] || { total: 0 }).total;
        const totalCashCollected = cashAgainstInvoice + cashAgainstAdvance;

        const allInvoices  = [...cashInvoiceResults, ...creditInvoiceResults];
        const locationName = allInvoices.length > 0
            ? (allInvoices[0].location || locationParam)
            : locationParam;

        return {
            cashInvoiceCount    : cashInvoiceResults.length,
            totalCashInvoiceAmt,
            cashCreditCount     : cashCreditResults.length,
            totalCashCreditAmt,
            creditInvoiceCount  : creditInvoiceResults.length,
            totalCreditInvoiceAmt,
            creditCreditCount   : creditCreditResults.length,
            totalCreditCreditAmt,
            totalInvoiceCount,
            totalInvoiceAmt,
            totalCreditCount,
            totalCreditAmt,
            cashAgainstInvoice,
            cashAgainstAdvance,
            totalCashCollected,
            paymentsByMethod,
            advPaymentByMethod,
            locationName
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
                        <td>${esc(p.paymentType)}</td>
                        <td>${esc(p.type)}</td>
                        <td>${esc(p.invoiceNo)}</td>
                        <td>${esc(p.receiptNo)}</td>
                        <td>${esc(p.refNo)}</td>
                        <td align="right">${fmt(amount)}</td>
                    </tr>`;
            });

            html += `
                <tr>
                    <td colspan="5" align="right" style="font-weight:bold;">Sub Total:</td>
                    <td align="right" style="font-weight:bold;">${fmt(subTotal)}</td>
                </tr>`;
        });

        if (!html) html = `<tr><td colspan="6" align="center">No payments found</td></tr>`;

        return { html, grandTotal };
    };

    // Groups: Invoice - Cash, Invoice - Credit, CreditMemo - Cash, CreditMemo - Credit.
    const buildSalesDocRows = (cashInvoiceResults, creditInvoiceResults, cashCreditResults, creditCreditResults) => {
        let html     = '';
        let docTotal = 0;

        const groupHeader = label => `
                <tr>
                    <td colspan="6" style="font-weight:bold; padding-top:8px; border-bottom:0.5pt solid #000000;">${esc(label)}</td>
                </tr>`;

        const invoiceRow = r => {
            const total = parseFloat(r.total || 0);
            docTotal += total;
            return `
                <tr>
                    <td>${esc(r.tranid)}</td>
                    <td>${esc(r.trandate)}</td>
                    <td>${esc(r.customercode)}</td>
                    <td>${esc(r.customername)}</td>
                    <td>${esc(r.contactname)}</td>
                    <td align="right">${fmt(total)}</td>
                </tr>`;
        };

        const creditMemoRow = r => {
            const total = Math.abs(parseFloat(r.total || 0));
            docTotal -= total;
            return `
                <tr>
                    <td>${esc(r.tranid)}</td>
                    <td>${esc(r.trandate)}</td>
                    <td>${esc(r.customercode)}</td>
                    <td>${esc(r.customername)}</td>
                    <td>${esc(r.contactname)}</td>
                    <td align="right">-${fmt(total)}</td>
                </tr>`;
        };

        if (cashInvoiceResults.length > 0) {
            html += groupHeader('Invoice - Cash');
            cashInvoiceResults.forEach(r => { html += invoiceRow(r); });
        }

        if (creditInvoiceResults.length > 0) {
            html += groupHeader('Invoice - Credit');
            creditInvoiceResults.forEach(r => { html += invoiceRow(r); });
        }

        if (cashCreditResults.length > 0) {
            html += groupHeader('CreditMemo - Cash');
            cashCreditResults.forEach(r => { html += creditMemoRow(r); });
        }

        if (creditCreditResults.length > 0) {
            html += groupHeader('CreditMemo - Credit');
            creditCreditResults.forEach(r => { html += creditMemoRow(r); });
        }

        if (!html) html = `<tr><td colspan="6" align="center">No documents found</td></tr>`;

        return { html, docTotal };
    };

    const buildAdvanceRows = advanceResults => {
        const html = advanceResults.map(r => `
                <tr>
                    <td>${esc(r.tranid)}</td>
                    <td>${esc(r.trandate)}</td>
                    <td>${esc(r.customercode)}</td>
                    <td>${esc(r.customername)}</td>
                    <td align="right">${fmt(r.invoiceamt)}</td>
                    <td align="right">${fmt(r.invoicetax)}</td>
                    <td align="right">${fmt(r.advamount)}</td>
                    <td align="right">${fmt(r.dpmtax)}</td>
                    <td align="right">${fmt(r.nettotal)}</td>
                </tr>`).join('');

        return html || `<tr><td colspan="9" align="center">No advance/down payment records found</td></tr>`;
    };

    /* ================================================================
     * RENDER LAYER
     * Assembles the final BFO PDF XML template.
     * To change layout or styling, edit only this function.
     * ================================================================ */

    const buildPdfTemplate = (summary, paymentDetailHtml, grandTotal, salesDocHtml, salesDocTotal, advanceRowsHtml, dateFrom, dateTo) => {

        const safeDateFrom = esc(dateFrom);
        const safeDateTo   = esc(dateTo);
        const safeLocation = esc(summary.locationName);

        // Build dynamic side-by-side payment method summary rows
        const invoiceMethodKeys = Object.keys(summary.paymentsByMethod);
        const advanceMethodKeys = Object.keys(summary.advPaymentByMethod);
        const maxRows           = Math.max(invoiceMethodKeys.length, advanceMethodKeys.length, 0);

        const paymentSummaryRows = Array.from({ length: maxRows }, (_, i) => {
            const lKey = invoiceMethodKeys[i] || '';
            const rKey = advanceMethodKeys[i] || '';
            return `
                <tr>
                    <td class="highlight" style="width:22%;">${lKey ? esc(lKey) + ' :' : ''}</td>
                    <td style="width:18%;">${lKey ? fmt(summary.paymentsByMethod[lKey].total) : ''}</td>
                    <td style="width:5%;"></td>
                    <td class="highlight" style="width:22%;">${rKey ? esc(rKey) + ' :' : ''}</td>
                    <td style="width:18%;">${rKey ? fmt(summary.advPaymentByMethod[rKey].total) : ''}</td>
                </tr>`;
        }).join('');

        return `<?xml version="1.0"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
    <head>
        <style type="text/css">
            * {
                font-family: Arial, sans-serif;
                font-size: 9pt;
                color: #000000;
            }
            .highlight {
                font-weight: bold;
            }
            .layout td {
                border: none;
                padding: 2px 4px;
            }
            .detail-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 6px;
            }
            .detail-table th {
                border: none;
                border-bottom: 0.5pt solid #000000;
                padding: 3px 4px;
                text-align: left;
                font-weight: bold;
                text-decoration: underline;
            }
            .detail-table td {
                border: none;
                padding: 2px 4px;
            }
            .sales-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 6px;
            }
            .sales-table th {
                border: none;
                padding: 3px 4px;
                text-align: left;
                font-weight: bold;
            }
            .sales-table td {
                border: none;
                padding: 2px 4px;
            }
            .sales-table .total-row td {
                border-top: 0.5pt solid #000000;
                font-weight: bold;
            }
            .advance-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 4px;
            }
            .advance-table th {
                border: none;
                border-bottom: 0.5pt solid #000000;
                padding: 3px 4px;
                text-align: left;
                font-weight: bold;
            }
            .advance-table td {
                border: none;
                padding: 2px 4px;
            }
        </style>
    </head>
    <body padding="0.5in 0.6in 0.5in 0.6in" size="A4">

        <!-- HEADER -->
        <table class="layout" style="width:100%; margin-bottom:4px;">
            <tr>
                <td style="width:50%;"></td>
                <td style="width:4%; background-color:#FF8C00; font-size:18pt;">&#160;</td>
                <td style="width:46%; font-size:16pt; font-weight:bold; padding-left:8px;">Z Report - Cash Sale</td>
            </tr>
        </table>

        <!-- DATE RANGE + LOCATION -->
        <table class="layout" style="width:100%; margin-bottom:2px;">
            <tr>
                <td style="width:50%;"></td>
                <td style="width:12%; font-weight:bold;">Date From :</td>
                <td style="width:38%;">${safeDateFrom}</td>
            </tr>
            <tr>
                <td style="width:50%;"></td>
                <td style="font-weight:bold;">Date To :</td>
                <td>${safeDateTo}</td>
            </tr>
            <tr>
                <td style="width:50%;"></td>
                <td style="font-weight:bold;">Location :</td>
                <td>${safeLocation}</td>
            </tr>
        </table>

        <!-- SALES DETAILS LABEL -->
        <p style="font-weight:bold; margin-top:10px; margin-bottom:4px;">Sales Details :</p>

        <!--
            COUNTS & AMOUNTS SUMMARY
            Left column  : Cash Invoice / Cash Credit Memo
            Right column : Credit Invoice / Credit Credit Memo
            Bottom rows  : Totals (Cash + Credit combined)
        -->
        <table class="layout" style="width:100%; margin-bottom:6px;">
            <tr>
                <td class="highlight" style="width:30%;">Cash Invoice Count :</td>
                <td style="width:14%;">${summary.cashInvoiceCount}</td>
                <td style="width:4%;"></td>
                <td class="highlight" style="width:30%;">Credit Invoice Count :</td>
                <td style="width:14%;">${summary.creditInvoiceCount}</td>
            </tr>
            <tr>
                <td class="highlight">Cash Invoice Amount :</td>
                <td>${fmt(summary.totalCashInvoiceAmt)}</td>
                <td></td>
                <td class="highlight">Credit Invoice Amount :</td>
                <td>${fmt(summary.totalCreditInvoiceAmt)}</td>
            </tr>
            <tr>
                <td class="highlight">Cash Credit Memo Count :</td>
                <td>${summary.cashCreditCount}</td>
                <td></td>
                <td class="highlight">Credit Credit Memo Count :</td>
                <td>${summary.creditCreditCount}</td>
            </tr>
            <tr>
                <td class="highlight">Cash Credit Memo Amount :</td>
                <td>${fmt(summary.totalCashCreditAmt)}</td>
                <td></td>
                <td class="highlight">Credit Credit Memo Amount :</td>
                <td>${fmt(summary.totalCreditCreditAmt)}</td>
            </tr>
            <tr>
                <td colspan="5" style="border-top:0.5pt solid #cccccc; padding-top:4px;"></td>
            </tr>
            <tr>
                <td class="highlight">Total Invoice Count :</td>
                <td style="font-weight:bold;">${summary.totalInvoiceCount}</td>
                <td></td>
                <td class="highlight">Total Credit Memo Count :</td>
                <td style="font-weight:bold;">${summary.totalCreditCount}</td>
            </tr>
            <tr>
                <td class="highlight">Total Invoice Amount :</td>
                <td style="font-weight:bold;">${fmt(summary.totalInvoiceAmt)}</td>
                <td></td>
                <td class="highlight">Total Credit Memo Amount :</td>
                <td style="font-weight:bold;">${fmt(summary.totalCreditAmt)}</td>
            </tr>
        </table>

        <!-- PAYMENT METHOD TOTALS: AGAINST INVOICE (left) | AGAINST ADVANCE (right) -->
        <table class="layout" style="width:100%; margin-bottom:2px;">
            <tr>
                <td class="highlight" colspan="2" style="width:47.5%;">Payment Details Against Invoice :</td>
                <td style="width:5%;"></td>
                <td class="highlight" colspan="2" style="width:47.5%;">Payment Details Against Advance :</td>
            </tr>
            ${paymentSummaryRows}
        </table>

        <!-- TOTAL CASH COLLECTED -->
        <table class="layout" style="width:100%; border-top:0.5pt solid #000000; border-bottom:0.5pt solid #000000; margin-top:4px; margin-bottom:10px;">
            <tr>
                <td style="width:28%; font-weight:bold;">Total Cash Collected :</td>
                <td style="width:16%;">${fmt(summary.cashAgainstInvoice)}</td>
                <td style="width:4%; text-align:center; font-weight:bold;">+</td>
                <td style="width:10%;">${fmt(summary.cashAgainstAdvance)}</td>
                <td style="width:4%; text-align:center; font-weight:bold;">=</td>
                <td style="width:18%; font-weight:bold; border:0.5pt solid #000000; padding:2px 6px;">${fmt(summary.totalCashCollected)}</td>
                <td style="width:20%;"></td>
            </tr>
        </table>

        <!-- PAYMENT DETAILS TABLE -->
        <table class="detail-table">
            <thead>
                <tr>
                    <th style="width:20%;">PaymentType</th>
                    <th style="width:10%;">Type</th>
                    <th style="width:25%;">Invoice Number</th>
                    <th style="width:20%;">Receipt Number</th>
                    <th style="width:10%;">RefNo</th>
                    <th style="width:15%;" align="right">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${paymentDetailHtml}
                <tr>
                    <td colspan="5" align="right" style="border-top:0.5pt solid #000000; font-weight:bold;">Grand Total:</td>
                    <td align="right" style="border-top:0.5pt solid #000000; font-weight:bold;">${fmt(grandTotal)}</td>
                </tr>
            </tbody>
        </table>

        <!-- SALES DETAILS / DOCUMENT LISTING -->
        <table class="sales-table" style="margin-top:14px;">
            <thead>
                <tr>
                    <th style="width:10%;">Doc No.</th>
                    <th style="width:10%;">Date</th>
                    <th style="width:13%;">Customer Code</th>
                    <th style="width:31%;">Customer Name</th>
                    <th style="width:18%;">ContactName</th>
                    <th style="width:8%;" align="right">DocTotal</th>
                </tr>
            </thead>
            <tbody>
                ${salesDocHtml}
                <tr class="total-row">
                    <td colspan="5" align="right">Total :</td>
                    <td align="right">${fmt(salesDocTotal)}</td>
                </tr>
            </tbody>
        </table>

        <!-- CASH INVOICE WITH DOWN PAYMENT (ADVANCE) -->
        <p style="font-weight:bold; margin-top:14px; margin-bottom:2px;">Cash Invoice with Down Payment (Advance)</p>
        <table class="advance-table">
            <thead>
                <tr>
                    <th style="width:9%;">Doc No.</th>
                    <th style="width:9%;">Date</th>
                    <th style="width:12%;">Customer Code</th>
                    <th style="width:24%;">Customer Name</th>
                    <th style="width:9%;"  align="right">Invoice Amt</th>
                    <th style="width:8%;"  align="right">Invoice Tax</th>
                    <th style="width:9%;"  align="right">Adv. Amount</th>
                    <th style="width:8%;"  align="right">DPM Tax</th>
                    <th style="width:9%;"  align="right">Net Total</th>
                </tr>
            </thead>
            <tbody>
                ${advanceRowsHtml}
            </tbody>
        </table>

    </body>
</pdf>`;
    };

    return { onRequest };
});