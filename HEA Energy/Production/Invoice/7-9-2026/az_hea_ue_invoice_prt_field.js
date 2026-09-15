/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record','N/ui/serverWidget'], function ( record,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const currentRecord = context.newRecord;
                const customerID = currentRecord.getValue('entity');

                const customerData = getcustomerData(customerID);

                setData(customerData, context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

    const getcustomerData = (customerID) => {
        try {

            if (!customerID || isNaN(Number(customerID))) {
                return {};
            }

            const customerRec = record.load({
                type: record.Type.CUSTOMER,
                id: customerID
            });

            const customerAddress = customerRec.getValue({
                fieldId: 'defaultaddress'
            });

            return {customerAddress:customerAddress}

        } catch (errorGetcustomerData) {
            log.debug('errorGetcustomerData', errorGetcustomerData);
        }
    };

    const setData = (customerData, context) => {


            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });
            
            const data = {               
                customerData:customerData || {},      
            };

            log.debug("data",data);
            
            custrecord.defaultValue = JSON.stringify(data);
            
        };


        return {
            beforeLoad: beforeLoad
        };
    });
