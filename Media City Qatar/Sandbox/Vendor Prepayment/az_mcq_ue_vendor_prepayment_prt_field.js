/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/ui/serverWidget'], function (search, serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type !== context.UserEventType.DELETE) {

                const record = context.newRecord;
                const purchaseOrderID = record.getValue("purchaseorder");
                const poData = getPurchaseOrderData(purchaseOrderID);

                setData(poData ,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };


    const getPurchaseOrderData = (purchaseOrderID) => {
        try {
            
            const result = search.lookupFields({
                type: search.Type.PURCHASE_ORDER,
                id: purchaseOrderID,
                columns: ['fxamount']
            });

            const total = parseFloat(result.fxamount) || 0;

            return {
                total:total
            };

        } catch (errorGetPurchaseOrderData) {
            log.debug('errorGetPurchaseOrderData', errorGetPurchaseOrderData);
        }
    };



    const setData = (poData ,context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            const data = {
                poData:poData,
            };

            custrecord.defaultValue = JSON.stringify(data);

        };


        return {
            beforeLoad: beforeLoad
        };
    });
