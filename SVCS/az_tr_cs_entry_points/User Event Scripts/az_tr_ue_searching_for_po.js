/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/ui/serverWidget', 'N/log'], (search, serverWidget, log) => {

    const beforeLoad = (context) => {
        try {
            if (context.type !== context.UserEventType.PRINT) return;
            const rec = context.newRecord ;
            const poId = rec.id;
            //log.debug('PRINT Triggered', 'PO ID: ' + poId);

            if (!poId) {
                log.debug('PO ID Missing', 'Cannot fetch data for PDF');
                return;
            }

            const headerData = getHeaderData(poId);
             log.debug('getHeaderData', 'Header data: ' + headerData);

            const itemsData  = getItemsData(poId);
             log.debug('getHeaderData', 'items data: ' + itemsData);


            addJsonField(context,headerData,itemsData);
            //addJsonField(context, 'custpage_po_items_json', itemsData);

           /* log.debug('JSON fields added for PDF', {
                headerLength: JSON.stringify(headerData).length,
                itemsLength: JSON.stringify(itemsData).length
            });*/
        } catch (err) {
            log.debug('beforeLoad Error', err);
        }
    };


    // Fetch header info
    const getHeaderData = (poId) => {
        try {
            // condition ??
            log.debug('getHeaderData', 'Purchase order id ' + poId);
            const result = search.lookupFields({
                type: 'purchaseorder',
                id: poId,
                columns: ['tranid','entity','trandate','statusref','subsidiary']
            });

            const returnData ={
                     tranid: result.tranid || '',
                    entity: result.entity?.[0]?.text || '',
                    trandate: result.trandate || '',
                    status: result.statusref?.[0]?.text || '',
                    subsidiary: result.subsidiary?.[0]?.text || '',
               };
            return returnData ;
            /*if(poId){ 
            }
            else{
                return {
                    tranid: '',
                    entity:  '',
                    trandate:  '',
                    status:  '',
                    subsidiary:  '',
                };
            }*/
        } catch (err) {
            log.debug('getHeaderData Error', err);
            return {};
        }
    };

    // Fetch all item lines
    const getItemsData = (poId) => {
        try {
            const items = [];
            const itemSearch = search.create({
                type: 'purchaseorder',
                filters: [
                    ['internalid','is',poId],
                    'AND',
                    ['mainline','is',false],
                    'AND',
                    ['item.isinactive','is','F'],
                ],
                columns: [
                    search.createColumn({ name: 'item' }),
                    search.createColumn({ name: 'quantity' }),
                    search.createColumn({ name: 'rate' }),
                    search.createColumn({ name: 'amount' }),
                    search.createColumn({ name: 'salesdescription', join: 'item' })
                ]
            });
            const searchResult = itemSearch.run().getRange(0,1000);
            if(searchResult!=null || searchResult!= '' ){
                for(let i = 0 ; i < searchResult.length ; i++ ){
                        const itemObj = {
                            item: searchResult[i].getText('item') || '',
                            description: searchResult[i].getValue({ name: 'salesdescription', join: 'item' }) || '',
                            quantity: searchResult[i].getValue('quantity') || '',
                            rate: searchResult[i].getValue('rate') || '',
                            amount:  searchResult[i].getValue('amount') || ''
                        };

                        // Skip lines that have no actual item (just in case)
                        if (itemObj.item) {
                            items.push(itemObj);
                            log.debug(`getItemsData - Line `, JSON.stringify(searchResult[i])); // 
                        }
                }
            }
            
            log.debug('getItemsData', 'Total items fetched: ' + items.length);
            return items;
        } catch (err) {
            log.debug('getItemsData Error', err);
        }
    };


    // Add temporary JSON field to form
    const addJsonField = (context,headerData,itemsData) => {
        try {

            const headerField = context.form.addField({
                id: 'custpage_po_header_json',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'custpage_po_header_json' 
            });
            headerField.defaultValue = JSON.stringify(headerData);

            const itemsField = context.form.addField({
                id: 'custpage_po_items_json',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'custpage_po_items_json'
            });
            itemsField.defaultValue = JSON.stringify(itemsData);


            //log.debug('addJsonField', 'Field added: ' + fieldId + ', Length: ' + JSON.stringify(data).length);
        } catch (err) {
            log.debug('addJsonField Error', err);
        }
    };

    return { beforeLoad };
});
