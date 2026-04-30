/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/render','N/record', 'N/file'], (search, render,record,file) => {

    const onRequest = (context) => {
        try {
            if (context.request.method === 'GET') {
                
            const recId = context.request.parameters.recId;

    
            if (!recId) {
                context.response.write(' Missing Record ID.');
                return;
            }
                
            const itemReceiptRecord = record.load({
                type: record.Type.ITEM_RECEIPT,
                id: recId
            });

            const subsidiaryId = itemReceiptRecord.getValue('subsidiary');
            const subsidiaryOBJ = getSubsidiary(subsidiaryId);

            const header = getHeader(itemReceiptRecord,subsidiaryOBJ);

            const items = buildItems(itemReceiptRecord);

            let template = getTemplateHeader();
            template = getTemplateBody(template, header,items);
            finalizeTemplate(template, context);
            }
        } catch (err) {
            log.debug('onRequest Error', err);
            context.response.write('An error occurred while generating the PDF.');
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

    const getHeader = (itemReceiptRecord,subsidiaryOBJ) => {
        try {
            
            const sub = subsidiaryOBJ || {};

           return {
                referencenum: escapeXml(itemReceiptRecord.getText('tranid')),
                vendor: escapeXml(itemReceiptRecord.getText('entity')),
                date: escapeXml(itemReceiptRecord.getText('trandate')),
                postingperiod: escapeXml(itemReceiptRecord.getText('postingperiod')),
                createdfrom: escapeXml(itemReceiptRecord.getText('createdfrom')),
                memo: escapeXml(itemReceiptRecord.getText('memo')),
                subsidiary: escapeXml(itemReceiptRecord.getText('subsidiary')),
                class: escapeXml(itemReceiptRecord.getText('class')),
                department: escapeXml(itemReceiptRecord.getText('department')),
                currency: escapeXml(itemReceiptRecord.getText('currency')),
                exchangerate: itemReceiptRecord.getValue('exchangerate'),
                company: escapeXml(sub.company),
                logo: sub.logoUrl || '',
                subsidiary_address: sub.address,
                trn: escapeXml(sub.vatRegNum)
            };
            
        } catch (error) {
            log.debug('error in get header',error)
            return {
                referencenum: '',
                vendor: '',
                date: '',
                postingperiod: '',
                createdfrom: '',
                memo: '',
                subsidiary: '',
                class: '',
                department: '',
                currency: '',
                exchangerate: '',
                company: '',
                logo: '',
                subsidiary_address: '',
                trn: ''
            };
        }
    };

    // =========================================================
    // 4. BUILD EXPENSES
    // =========================================================
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
                    units: escapeXml(itemReceiptRecord.getSublistText({
                        sublistId: 'item',
                        fieldId: 'unitsdisplay',
                        line: i
                    })),
                    serialnumbers: escapeXml(itemReceiptRecord.getSublistText({
                        sublistId: 'item',
                        fieldId: 'serialnumbers',
                        line: i
                    }))
                });
            }
    
            return items;
            
        } catch (error) {
            log.debug('error in build items',error)
            return [];
        }
    };

    // ===========================================================
    // 2. Template Header (Fonts + Styles)
    // ===========================================================
    const getTemplateHeader = () => {
    
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
    };

    // ===========================================================
    // 3. Template Body
    // ===========================================================

    const getTemplateBody = (template, header, items) => {

        try {

            template += '<table class="no-border" style="margin-bottom:10px;">';
            template += '<tr>';
            template += '<td style="width:70%;font-size:10px; vertical-align:top;">';
            template += '<strong>'+(header.company || 'Company Name') +'</strong><br/>';
            template += (header.subsidiary_address || '')+'<br/>';
            template += 'TRN :'+ (header.trn || '') + '<br/>';
            template += '</td>';
            template += '<td align="right" style="width:30%;vertical-align:top;">';
            if (header.logo) {

                template += '<img src="' + header.logo+ '" style="width:140px; height:50px;" />';

            }
            template += '</td>';

            template += '</tr>';
            template += '</table>';

            // ===================================================
            // TITLE
            // ===================================================
            template += '<table class="no-border" style="margin-bottom:10px;">';
            template += '<tr><td class="center"><h2>GOODS RECEIPT NOTE (GRN)</h2></td></tr>';
            template += '</table>';

            // ===================================================
            // CHECK INFO
            // ===================================================
            template += '<table style="margin-bottom:10px;">';

            template += '<tr>';
            template += '<td width="20%"><b>Reference #:</b> ' + (header.referencenum || '') + '</td>';
            template += '<td width="20%"><b>Date :</b> ' + (header.date || '') + '</td>';
            template += '<td width="20%" ><b>Posting Period :</b> ' + (header.postingperiod || '') + '</td>';
            template += '<td width="20%" colspan="2"><b>Memo :</b> ' + (header.memo || '') + '</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td colspan="2"><b>Created From :</b> ' + (header.createdfrom || '') + '</td>';
            template += '<td colspan="3"><b>Vendor :</b> ' + (header.vendor ? header.vendor.trim().split(/\s+/).slice(1).join(' ') : '') + '</td>';
            template += '</tr>';
            
            template += '<tr>';
            template += '<td><b>Subsidiary :</b> ' + (header.subsidiary || '') + '</td>';
            template += '<td><b>Class :</b> ' + (header.class || '') + '</td>';
            template += '<td><b>Department :</b> ' + (header.department || '') + '</td>';
            template += '<td><b>Currency :</b> ' + (header.currency || '') + '</td>';
            template += '<td><b>Exchange Rate :</b> ' + (header.exchangerate || '') + '</td>';
            template += '</tr>';
            
            template += '</table>';

            // ===================================================
            // EXPENSE SECTION
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

    // ===========================================================
    // 4. Finalize Template & Render PDF
    // ===========================================================
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
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };
    return { onRequest };
});
