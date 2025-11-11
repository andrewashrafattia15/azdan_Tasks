/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/render', 'N/log'], (search, render, log) => {

    const onRequest = (context) => {
        try {
            if (context.request.method === 'GET') {
                const recId = context.request.parameters.recId;
                log.debug('onRequest', 'Received Record ID: ' + recId);

                if (!recId) {
                    context.response.write(' Missing Record ID.');
                    return;
                }

                // Get PO header and line data
                const { header, items } = getPurchaseOrderData(recId);
                log.debug('PO Data Retrieved', { header, itemsCount: items.length });

                // Build PDF
                let template = getTemplateHeader();
                template = getTemplateBody(template, header, items);
                finalizeTemplate(template, context, { header, items });
            }
        } catch (err) {
            log.error('onRequest Error', err);
            context.response.write(' Error: ' + err.message);
        }
    };

    // ===========================================================
    // 1. Get Purchase Order Header + Items
    // ===========================================================
    const getPurchaseOrderData = (poId) => {
        
        try {

            let header = {};
            let items = [];

            log.debug('getPurchaseOrderData', 'Fetching data for PO ID: ' + poId);

            // ---------- HEADER ----------
            const headerSearch = search.create({
                type: 'purchaseorder',
                filters: [
                    ['internalid', 'anyof', poId],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: [
                    'tranid', 'entity', 'trandate', 'status', 'subsidiary'
                ]
            });

            //const headerResult = getAllData(headerSearch);
            // const headerResult = headerResults;
            const headerResult = headerSearch.run().getRange({ start: 0, end: 1 });
             if (headerResult!= null || headerResult!= '' ) {
                    header = {
                        tranid: headerResult[0].getValue('tranid') || '',
                        entity: headerResult[0].getText('entity') || '',
                        trandate: headerResult[0].getValue('trandate') || '',
                        status: headerResult[0].getText('status') || '',
                        subsidiary: headerResult[0].getText('subsidiary') || ''
                    };
            }



            /*
            for( let i =0 ; i < headerResult.length ; i++){
                if (headerResult!= null || headerResult!= '' ) {
                    header = {
                        tranid: headerResult[i].getValue('tranid') || '',
                        entity: headerResult[i].getText('entity') || '',
                        trandate: headerResult[i].getValue('trandate') || '',
                        status: headerResult[i].getText('status') || '',
                        subsidiary: headerResult[i].getText('subsidiary') || ''
                    };
                }
            }*/

            // ---------- ITEMS ----------
            const itemSearch = search.create({
                type: 'purchaseorder',
                filters: [
                    ['internalid', 'anyof', poId],
                    'AND',
                    ['mainline', 'is', 'F'],
                    'AND',
                    ['taxline', 'is', 'F'],
                    'AND',
                    ['item', 'noneof', '@NONE@']
                ],
                columns: [
                    'item',
                    'quantity',
                    'rate',
                    'amount',
                    'item.displayname'
                ]
            });


            // change to getRange & for each
            itemSearch.run().each(result => {
                items.push({
                    item: result.getText('item') || '',
                    description: result.getValue('item.displayname') || '',
                    quantity: result.getValue('quantity') || '',
                    rate: result.getValue('rate') || '',
                    amount: result.getValue('amount') || ''
                });
                return true;
            });

            log.debug('Items Count', items.length);
        } catch (e) {
            log.error('Error in getPurchaseOrderData', e);
        }

        return { header, items };
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
        template += '<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" ';
        template += 'src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" ';
        template += 'src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2"/>';
        template += '<link name="NotoSansArabic" type="font" subtype="opentype" src="${nsfont.NotoSansArabic_Regular}" ';
        template += 'src-bold="${nsfont.NotoSansArabic_Bold}" bytes="2" subset="false"/>';
        template += '<style type="text/css">';
        template += '* { font-family: NotoSans, NotoSansArabic, sans-serif; font-size: 9pt; }';
        template += 'table { width: 100%; border-collapse: collapse; }';
        template += 'th, td { border: 1px solid black; padding: 4px; text-align: center; }';
        template += 'th { background-color: #f2f2f2; }';
        template += '</style>';
        template += '<macrolist>';
        template += '<macro id="nlheader"><table><tr><td align="center"><b>Purchase Order</b></td></tr></table></macro>';
        template += '<macro id="nlfooter"><table><tr><td align="center" font-size="6pt"><pagenumber/></td></tr></table></macro>';
        template += '</macrolist>';
        template += '</head>';
        template += "<body header='nlheader' header-height='20px' footer='nlfooter' padding='0.5in 0.5in 0.5in 0.5in'>";
        return template;
    };

    // ===========================================================
    // 3. Template Body (Header + Item Table)
    // ===========================================================
    const getTemplateBody = (template, header, items) => {
        try {
            // ---------- HEADER SECTION ----------
            template +=
                '<table>' +
                '<tr>' +
                '<td><b>PO Number:</b> ' + (header.tranid || '') + '</td>' +
                '<td><b>Vendor:</b> ' + (header.entity || '') + '</td>' +
                '</tr>' +
                '<tr>' +
                '<td><b>Date:</b> ' + (header.trandate || '') + '</td>' +
                '<td><b>Status:</b> ' + (header.status || '') + '</td>' +
                '</tr>' +
                '<tr>' +
                '<td><b>Subsidiary:</b> ' + (header.subsidiary || '') + '</td>' +
                '</tr>' +
                '</table><br/>';

            // ---------- ITEMS SECTION ----------
            template +=
                '<table>' +
                '<thead>' +
                '<tr>' +
                '<th>Item</th>' +
                '<th>Description</th>' +
                '<th>Quantity</th>' +
                '<th>Rate</th>' +
                '<th>Amount</th>' +
                '</tr>' +
                '</thead>' +
                '<tbody>';

            items.forEach(item => {
                template +=
                    '<tr>' +
                    '<td>' + (item.item || '') + '</td>' +
                    '<td>' + (item.description || '') + '</td>' +
                    '<td>' + (item.quantity || '') + '</td>' +
                    '<td>' + (item.rate || '') + '</td>' +
                    '<td>' + (item.amount || '') + '</td>' +
                    '</tr>';
            });

            template += '</tbody></table>';

            log.debug('Template Body Created Successfully');
            return template;

        } catch (e) {
            log.debug('Error in getTemplateBody', e);
            return template;
        }
    };

    // ===========================================================
    // 4. Finalize Template & Render PDF
    // ===========================================================
    const finalizeTemplate = (template, context, data) => {
        try {
            template += '</body></pdf>';
            const renderer = render.create();
            renderer.templateContent = template;
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'data',
                data: data
            });
            const pdfFile = renderer.renderAsPdf();
            context.response.writeFile(pdfFile, true);
        } catch (e) {
            log.error('Error in finalizeTemplate', e);
        }
    };

    const getAllData = (rs) => {
        try {
            const results = rs.run();
            const searchResults = [];
            let searchid = 0;
            do {
                var resultslice = results.getRange({ start: searchid, end: searchid + 1000 });
                resultslice.forEach(function (slice) {
                    searchResults.push(slice);
                    searchid++;
                }
                );
            } while (resultslice.length >= 1000);
            return searchResults;
        } catch (errGetAllData) {
            log.debug('errGetAllData', errGetAllData)
        }
    }


    return { onRequest };
});
