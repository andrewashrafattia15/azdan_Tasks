/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record','N/ui/serverWidget'], function ( record,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const recID = record.id;
                const subsidiaryID = record.getValue('subsidiary');
                const {subName,subAddress,subVAT} = getSubsidiaryData(subsidiaryID);
                const itemsList = getTransferOrderItems(recID);

                setData(itemsList,subName,subAddress,subVAT,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

    const getTransferOrderItems = (transferOrderId) => {
        try {
            const items = [];

            const transferOrder = record.load({
                type: record.Type.TRANSFER_ORDER,
                id: transferOrderId
            });

            const lineCount = transferOrder.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < lineCount; i++) {

                const lineObj = {
                    itemName: transferOrder.getSublistText({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    }),
                    description: transferOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'description',
                        line: i
                    }),
                    units: transferOrder.getSublistText({
                        sublistId: 'item',
                        fieldId: 'units',
                        line: i
                    }),
                    quantity: transferOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    }),
                    additionalNote: transferOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_az_cbc_additional_note',
                        line: i
                    }),
                    lineClass: transferOrder.getSublistText({
                        sublistId: 'item',
                        fieldId: 'class',
                        line: i
                    })
                };

                items.push(lineObj);
            }
            return items;

        } catch (errorGetTransferOrderItems) {
            log.debug('errorGetTransferOrderItems',errorGetTransferOrderItems);
        }
    };



    const getSubsidiaryData = (subsidiaryID) => {
        try {
            if (!subsidiaryID) return '';

            const subsidiaryRec = record.load({
                type: record.Type.SUBSIDIARY,
                id: subsidiaryID
            });

            const subsidiaryName = subsidiaryRec.getText({
                fieldId: 'name'
            });

            const subsidiaryAddress = subsidiaryRec.getText({
                fieldId: 'mainaddress_text'
            });

            const vatRegNum = subsidiaryRec.getText({
                fieldId: 'federalidnumber'
            });

            return {
                subName: subsidiaryName,
                subAddress: subsidiaryAddress,
                subVAT: vatRegNum
            };


        } catch (errorGetSubsidiaryData) {
            log.debug('errorGetSubsidiaryData', errorGetSubsidiaryData);
        }
    };

    const setData = (itemsList,subName,subAddress,subVAT,context) => {


            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            
            const data = {
                itemsList:itemsList,
                subName:subName,
                subAddress:subAddress,
                subVAT:subVAT
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
        };


        return {
            beforeLoad: beforeLoad
        };
    });
