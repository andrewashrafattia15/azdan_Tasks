/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/render','N/record','N/file'], (search, render,record,file) => {

    const onRequest = (context) => {
        try {
            if (context.request.method === 'GET') {
                
            const recId = context.request.parameters.recId;
            
    
            if (!recId) {
                context.response.write(' Missing Record ID.');
                return;
            }
                
            const chequeRecord = record.load({
                type: record.Type.CHECK,
                id: recId
            });

            const subsidiaryId = chequeRecord.getValue('subsidiary');
            const subsidiaryOBJ = getSubsidiary(subsidiaryId);

            const header = getHeader(chequeRecord,subsidiaryOBJ);

            const expenses = buildExpenses(chequeRecord);
            const items = buildItems(chequeRecord);

            let template = getTemplateHeader();
            template = getTemplateBody(template, header,expenses,items);
            finalizeTemplate(template, context);
            }
        } catch (err) {
            log.debug('onRequest Error', err);
            context.response.write('Error generating PDF. Please contact admin.');
        }
    };

    const getSubsidiary = (subsidiaryId) => {
    try {
        const subsidiaryRec = record.load({
            type: record.Type.SUBSIDIARY,
            id: subsidiaryId
        });

        const logoId = subsidiaryRec.getValue('pagelogo');
        const company = subsidiaryRec.getText('name');

        let logoUrl = '';

        if (logoId) {
            const logoFile = file.load({
                id: logoId
            });
            logoUrl = logoFile.url.replace(/&/g, '&amp;');
        }

        const vatRegNum = subsidiaryRec.getValue('federalidnumber') || '';

        const address = (subsidiaryRec.getValue('mainaddress_text') || '')
            .replace(/&/g, '&amp;')      
            .replace(/,\s*/g, ',<br/>');    

        return {
            company : company,
            logoUrl: logoUrl,
            vatRegNum: vatRegNum,
            address: address
        };

    } catch (errorGetSubsidiary) {
        log.debug("errorGetSubsidiary", errorGetSubsidiary);
        return {
            company: '',
            logoUrl: '',
            vatRegNum: '',
            address: ''
        };
    }
    };

    const getHeader = (chequeRecord,subsidiaryOBJ) => {
        try {
            
            const sub = subsidiaryOBJ || {};

            return {
                tranid: escapeXml(chequeRecord.getValue('transactionnumber')),
                checknumber: escapeXml(chequeRecord.getValue('tranid')),
                account: escapeXml(chequeRecord.getText('account')),
                balance: chequeRecord.getValue('balance') || 0,
                payee: escapeXml(chequeRecord.getText('entity')),
                amount: chequeRecord.getValue('usertotal') || 0,
                currency: escapeXml(chequeRecord.getText('currency')),
                exchangerate: chequeRecord.getValue('exchangerate'),
                tax: chequeRecord.getValue('taxtotal') || 0,
                date: chequeRecord.getText('trandate'),
                memo: escapeXml(chequeRecord.getValue('memo')),
                subsidiary: escapeXml(chequeRecord.getText('subsidiary')),
                class: escapeXml(chequeRecord.getText('class')),
                location: escapeXml(chequeRecord.getText('location')),
                department: escapeXml(chequeRecord.getText('department')),
                amount_in_words: escapeXml(chequeRecord.getText('custbody_az_spg_amount_in_words')),
                company: escapeXml(sub.company),
                trn: sub.vatRegNum,
                logo: sub.logoUrl || '',
                subsidiary_address: sub.address,
            };
            
        } catch (error) {
            log.debug('error in get header',error)
            return {};
        }
    };

    const buildItems = (itemReceiptRecord) => {
        try {
            const items = [];
    
            const count = itemReceiptRecord.getLineCount({ sublistId: 'item' });
    
            for (let i = 0; i < count; i++) {
    
                items.push({
                    item: escapeXml(itemReceiptRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemname',
                        line: i
                    })),
                    description: escapeXml(itemReceiptRecord.getSublistText({
                        sublistId: 'item',
                        fieldId: 'itemdescription',
                        line: i
                    })),
                    quantity: itemReceiptRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    }),
                    units: itemReceiptRecord.getSublistText({
                        sublistId: 'item',
                        fieldId: 'unitsdisplay',
                        line: i
                    }),
                    serialnumbers: itemReceiptRecord.getSublistText({
                        sublistId: 'item',
                        fieldId: 'serialnumbers',
                        line: i
                    }),
                });
            }
    
            return items;
            
        } catch (error) {
            log.debug('error in build items',error)
            return [];
        }
    };

    const buildExpenses = (chequeRecord) => {
        try {
            const expenses = [];
    
            const count = chequeRecord.getLineCount({ sublistId: 'expense' });
    
            for (let i = 0; i < count; i++) {
    
                expenses.push({
                    account: escapeXml(chequeRecord.getSublistText({
                        sublistId: 'expense',
                        fieldId: 'account',
                        line: i
                    })),
                    amount: chequeRecord.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'amount',
                        line: i
                    }),
                    taxrate1: chequeRecord.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'taxrate1',
                        line: i
                    }),
                    tax1amt: chequeRecord.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'tax1amt',
                        line: i
                    }),
                    grossamt: chequeRecord.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'grossamt',
                        line: i
                    }),
                    memo: escapeXml(chequeRecord.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'memo',
                        line: i
                    }))
                });
            }
    
            return expenses;
            
        } catch (error) {
            log.debug('error in build expenses',error)
            return [];
        }
    };


    const getTemplateHeader = () => {
        try {
            let template = '';
    
            template += '<?xml version="1.0"?>';
            template += '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            template += '<pdf>';
            template += '<head>';
            template += '<style type="text/css">';
            template += 'body { font-family: sans-serif; font-size: 10pt; margin: 0; }';
            template += 'table { width: 100%; border-collapse: collapse; }';
            template += 'th, td {border: 0.2px solid #e0e0e0;padding: 3px 4px;font-size: 8pt;}';
            template += 'th { background-color: #eee; font-size: 9pt; }';
            template += '.no-border td, .no-border th { border: none; }';
            template += '.center { text-align: center; }';
            template += '.right { text-align: right; }';
            template += '.bold { font-weight: bold; }';
            template += '</style>';
    
            template += '</head>';
    
            template += "<body padding='10mm'>";
    
            return template;
            
        } catch (error) {
            log.debug('error in template header',error)
        }
    };



    const getTemplateBody = (template, header, expenses,items) => {

        try {

            template += '<table class="no-border" style="margin-bottom:10px;">';
            template += '<tr>';
            template += '<td style="width:70%;font-size:10px; vertical-align:top;">';
            template += (header.company || '') + '<br/>';
            template += (header.subsidiary_address || '') + '<br/>';
            template += 'TRN :'+(header.trn || '') + '<br/>';
            template += '</td>';
            template += '<td align="right" style="width:30%; text-align:right;">';
            if (header.logo) {

                template += '<img src="' + header.logo+ '" style="width:140px; height:50px;vertical-align:top;" />';

            }
            template += '</td>';

            template += '</tr>';
            template += '</table>';

            // ===================================================
            // TITLE
            // ===================================================
            template += '<table class="no-border" style="margin-bottom:10px;">';
            template += '<tr><td class="center"><h2>CHEQUE PAYMENT VOUCHER</h2></td></tr>';
            template += '</table>';

            // ===================================================
            // CHECK INFO
            // ===================================================
            template += '<table style="margin-bottom:10px;">';

            template += '<tr>';
            template += '<td width="20%"><b>Transaction #:</b> ' + (header.tranid || '') + '</td>';
            template += '<td width="15%"><b>Check #:</b> ' + (header.checknumber || '') + '</td>';
            template += '<td><b>Payee :</b> ' +(header.payee ? header.payee.trim().split(/\s+/).slice(1).join(' ') : '') +'</td>';
            template += '<td><b>Currency :</b> ' + (header.currency || '') + '</td>';
            
            template += '</tr>';
            
            template += '<tr>';
            template += '<td width="40%" colspan="2"><b>Account :</b> ' + (header.account || '') + '</td>';
            template += '<td><b>Amount :</b> ' + formatCurrency(header.amount) + '</td>';
            template += '<td width="20%"><b>Balance :</b> ' + formatCurrency(header.balance || '0') + '</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td><b>Memo :</b> ' + (header.memo || '') + '</td>';
            template += '<td><b>Tax :</b> ' + (header.tax || '0.00') + '</td>';
            template += '<td><b>Date :</b> ' + (header.date || '') + '</td>';
            template += '<td><b>Exchange Rate :</b> ' + (header.exchangerate || '') + '</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td><b>Subsidiary :</b> ' + (header.subsidiary || '') + '</td>';
            template += '<td><b>Class :</b> ' + (header.class || '') + '</td>';
            template += '<td><b>Location :</b> ' + (header.location || '') + '</td>';
            template += '<td><b>Department :</b> ' + (header.department || '') + '</td>';
            template += '</tr>';
            template += '</table>';

            // ===================================================
            // EXPENSE SECTION
            // ===================================================


            if (expenses && expenses.length > 0) {

                template += '<table style="margin-bottom:10px;">';

                template += '<tr>';
                template += '<th width="30%" style="white-space: nowrap;"><b>Account</b></th>';
                template += '<th width="10%" style="white-space: nowrap;"><b>Amount</b></th>';
                template += '<th width="10%" style="white-space: nowrap;"><b>Tax Rate</b></th>';
                template += '<th width="15%" style="white-space: nowrap;"><b>Tax Amount</b></th>';
                template += '<th width="15%" style="white-space: nowrap;"><b>Gross Amount</b></th>';
                template += '<th width="20%" style="white-space: nowrap;"><b>Memo</b></th>';
                template += '</tr>';

                expenses.forEach(exp => {

                    template += '<tr>';
                    template += '<td>' + (exp.account || '') + '</td>';
                    template += '<td>' + formatCurrency(exp.amount)+ '</td>';
                    template += '<td>' + (exp.taxrate1 || '0.00%') + '</td>';
                    template += '<td>' + formatCurrency(exp.tax1amt || '0') + '</td>';
                    template += '<td>' + formatCurrency(exp.grossamt) + '</td>';
                    template += '<td>' + (exp.memo || '') + '</td>';
                    template += '</tr>';
                });

                template += '</table>';
            }

            // ===================================================
            // ITEMS SECTION
            // ===================================================

            
            if (items && items.length > 0) {

                template += '<table >';

                template += '<tr>';
                template += '<th width="20%" style="font-size:9px"><b>Item</b></th>';
                template += '<th width="50%" style="font-size:9px"><b>Description</b></th>';
                template += '<th width="10%" style="font-size:9px"><b>Quantity</b></th>';
                template += '<th width="10%" style="font-size:9px"><b>Units</b></th>';
                template += '<th width="10%" style="font-size:9px;white-space: nowrap;"><b>Serial / Lot Numbers</b></th>';
                template += '</tr>';

                items.forEach(item => {

                    template += '<tr>';
                    template += '<td style="font-size:9px;word-wrap: break-word;">' + (item.item || '') + '</td>';
                    template += '<td style="font-size:9px;word-wrap: break-word;">' + (item.description || '') + '</td>';
                    template += '<td style="font-size:9px;word-wrap: break-word;">' + (item.quantity || '') + '</td>';
                    template += '<td style="font-size:9px;word-wrap: break-word;">' + (item.units || '') + '</td>';
                    template += '<td style="font-size:9px;word-wrap: break-word;">' + (item.serialnumbers || '') + '</td>';
                    template += '</tr>';
                });

                template += '</table>';
            }


            // ===================================================
            // TOTALS
            // ===================================================
            template += '<table>';

            template += '<tr>';
            template += '<th><b>Amount in Words</b></th></tr>';
            template += '<tr><td>';
            template += (header.amount_in_words|| '');
            template += '</td>';
            template += '</tr>';
            template += '</table>';

            // ===================================================
            // PAGE NUMBER (UNDER LAST TABLE)
            // ===================================================
            template += '<table class="no-border" style="width:100%;">';
            template += '<tr>';
            template += '<td style="text-align:center; font-size:8pt;">';
            template += 'Page <pagenumber/> of <totalpages/>';
            template += '</td> <td class="right">Printed: ${.now?string("dd-MMM-yyyy HH:mm:ss")}</td>';
            template += '</tr>';
            template += '</table>';
            return template;

        } catch (e) {
            log.error('Template Body Error', e);
            return template;
        }
    };

    const finalizeTemplate = (template, context) => {
        try {

            template += '</body></pdf>';
            const renderer = render.create();
            renderer.templateContent = template;
           
            const pdfFile = renderer.renderAsPdf();
            context.response.writeFile(pdfFile, true);
        } catch (e) {
            log.debug('Error in finalizeTemplate', e);
        }
    };

    const escapeXml = (value) => {
        if (value === null || value === undefined || value === '') return '';

        if (typeof value === 'object') return '';

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    const formatCurrency = (val) => {
        const num = Number(val);
        const safe = isNaN(num) ? 0 : num;

        return safe.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    
    return { onRequest };
});
