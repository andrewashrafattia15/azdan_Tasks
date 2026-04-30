/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record','N/search','N/ui/serverWidget'], function ( record,search,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const recID = record.id;
                const customerID = record.getValue('entity');
                const subsidiaryID = record.getValue('subsidiary');
                const projectName = record.getText('custbody_az_cbc_project_name');

                const customerAddress = getCustomerData(customerID);

                const subsidiaryAddress = getSubsidiaryData(subsidiaryID);

                setData(projectName,customerAddress,subsidiaryAddress,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

    const getCustomerData = (customerID) => {
        try {
            if (!customerID) return '';

            const customerRec = record.load({
                type: record.Type.CUSTOMER,
                id: customerID
            });

            const addressSubrecord = customerRec.getText({
                fieldId: 'defaultaddress'
            });

            return addressSubrecord

        } catch (errorGetCustomerData) {
            log.debug('errorGetCustomerData', errorGetCustomerData);
        }
    };

    const getSubsidiaryData = (subsidiaryID) => {
        try {
            if (!subsidiaryID) return '';

            const subsidiaryRec = record.load({
                type: record.Type.SUBSIDIARY,
                id: subsidiaryID
            });

            const addressSubrecord = subsidiaryRec.getText({
                fieldId: 'mainaddress_text'
            });

            return addressSubrecord

        } catch (errorGetSubsidiaryData) {
            log.debug('errorGetSubsidiaryData', errorGetSubsidiaryData);
        }
    };

    const setData = (projectName,customerAddress,subsidiaryAddress,context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            
            const data = {
                projectName:projectName,
                customerAddress:customerAddress,
                subsidiaryAddress:subsidiaryAddress
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
        };


        return {
            beforeLoad: beforeLoad
        };
    });
