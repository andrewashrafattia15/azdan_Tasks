/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record','N/ui/serverWidget'], function (record,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const currentRecord = context.newRecord;
                const vendorID = currentRecord.getValue('entity');          
                const vendorData = getVendorData(vendorID);
            

                setData(vendorData,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

    const getVendorData = (vendorID) => {
        try {
            if (!vendorID) return '';

            const vendorRec = record.load({
                type: record.Type.VENDOR,
                id: vendorID
            });

            const vendorAddress = vendorRec.getValue({
                fieldId: 'defaultaddress'
            });

            return {vendorAddress:vendorAddress}

        } catch (errorGetVendorData) {
            log.debug('errorGetVendorData', errorGetVendorData);
        }
    };

 

    const setData = (vendorData,context) => {


            const custrecord = context.form.addField({
                id: 'custpage_custrecord_vendor_data',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });
            
            const data = {
                vendorAddress: vendorData.vendorAddress || ''
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
        };


        return {
            beforeLoad: beforeLoad
        };
    });
