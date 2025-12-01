/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search','N/ui/serverWidget'], function (search,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const myRecId = record.id;
                
                const requisitionItems = getRequisitionItems(myRecId);

                setData(requisitionItems,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };


    const getRequisitionItems = (MyRecId) => {
        try {
            
            const searchTerms = search.create({
                type: 'customrecord_ino_pm_requisition_item',
                columns: [
                    'custrecord_ino_pm_pri_name',
                    'custrecord_ino_pm_pri_uom',
                    'custrecord_ino_pm_pri_quantity',
                    'custrecord_ino_pm_pri_rate',
                    'custrecord_ino_pm_pri_amount'
                ],
                filters: [
                    ['custrecord_ino_pm_pri_requisition', search.Operator.IS, MyRecId]
                ]
            });

            const searchResult = searchTerms.run().getRange({start:0 , end:1000});

            let arr = [];

            if (searchResult != null && searchResult != '') {

                for (row = 0; row < searchResult.length; row++) {

                    let name = searchResult[row].getValue('custrecord_ino_pm_pri_name');
                    let uom = searchResult[row].getValue('custrecord_ino_pm_pri_uom');
                    let quantity = searchResult[row].getValue('custrecord_ino_pm_pri_quantity');
                    let rate = searchResult[row].getValue('custrecord_ino_pm_pri_rate');
                    let amount = searchResult[row].getValue('custrecord_ino_pm_pri_amount');

                    arr.push({
                        'name': name,
                        'uom': uom ,
                        'quantity': quantity ,
                        'rate': rate ,
                        'amount':amount
                    })

                }

            }
            return arr;

        } catch (errGetTermsConditions) {
            log.debug('errGetTermsConditions', errGetTermsConditions)
        }
    }
    
    
    const setData = (requisitionItems,context) => {
        try {
            
            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });
            
            
            const data = {
                requisitionItems:requisitionItems
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
            } catch (errorSetData) {
                log.debug("errorSetData",errorSetData)
            }
        };


        return {
            beforeLoad: beforeLoad
        };
    });
