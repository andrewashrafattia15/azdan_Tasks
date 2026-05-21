/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record','N/ui/serverWidget','N/search'], function ( record,serverWidget,search) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const currentRecord = context.newRecord;

                let billIds = [];
                let creditIds = [];

                const lineCount = currentRecord.getLineCount({
                    sublistId: 'apply'
                });

                for (let i = 0; i < lineCount; i++) {

                    const isApplied = currentRecord.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'apply',
                        line: i
                    });

                    if (!isApplied) continue;

                    const billId = currentRecord.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'internalid',
                        line: i
                    });

                    const creditId = currentRecord.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'doc',
                        line: i
                    });

                    if (billId) {
                        billIds.push(billId);
                    }

                    if (creditId) {
                        creditIds.push(creditId);
                    }
                }
                const recID = currentRecord.id;

                const vendorID = currentRecord.getValue({
                    fieldId: 'entity'
                });

                const subsidiaryID = currentRecord.getValue({
                    fieldId: 'subsidiary'
                });

                const vendorData = getVendorData(vendorID);

                const billsData = getBillsData(billIds);
                // const creditsData = getCreditsData(creditIds);

            
                const subsidiaryData = getSubsidiaryData(subsidiaryID);


                setData(vendorData, billsData, subsidiaryData, context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

    const getVendorData = (vendorID) => {
        try {


            if (!vendorID || isNaN(Number(vendorID))) {
                return {};
            }

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


    const getBillsData = (billIds) => {

        try {

            if (!billIds || !billIds.length) {
                return {};
            }

            let billsData = {};

            const billSearch = search.create({
                type: search.Type.VENDOR_BILL,
                filters: [
                    ['internalid', 'anyof', billIds],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'transactionnumber' }),
                    search.createColumn({ name: 'trandate' })
                ]
            });

            billSearch.run().each((result) => {

                const id = result.getValue({ name: 'internalid' });

                billsData[id] = {
                    transactionnumber: result.getValue({ name: 'transactionnumber' }),
                    trandate: result.getValue({ name: 'trandate' })
                };

                return true;
            });


            return billsData;

        } catch (e) {
            log.debug('errorGetBillsData', e);
            return {};
        }
    };

    // const getCreditsData = (creditIds) => {

    //     try {

    //         if (!creditIds || !creditIds.length) return {};

    //         let creditsData = {};

    //         const creditSearch = search.create({
    //             type: search.Type.VENDOR_CREDIT,
    //             filters: [
    //                 ['createdfrom', 'anyof', creditIds],
    //                 'AND',
    //                 ['mainline', 'is', 'T']
    //             ],
    //             columns: [
    //                 search.createColumn({ name: 'internalid' }),
    //                 search.createColumn({ name: 'transactionnumber' }),
    //                 search.createColumn({ name: 'trandate' })
    //             ]
    //         });

    //         creditSearch.run().each(result => {

    //             const id = result.getValue({ name: 'internalid' });

    //             creditsData[id] = {
    //                 transactionnumber: result.getValue({ name: 'transactionnumber' }),
    //                 trandate: result.getValue({ name: 'trandate' })
    //             };

    //             return true;
    //         });

    //         return creditsData;

    //     } catch (e) {
    //         log.debug('errorGetCreditsData', e);
    //         return {};
    //     }
    // };

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

            const subsidiaryAddress = subsidiaryRec.getValue({
                fieldId: 'mainaddress_text'
            });

            const vatRegNum = subsidiaryRec.getValue({
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


    const setData = (vendorData, billsData, subsidiaryData, context) => {


            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });
            
            const data = {               
                vendorData:vendorData || {},
                billsData:billsData || {},
                subsidiaryData:subsidiaryData || {},        
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
        };


        return {
            beforeLoad: beforeLoad
        };
    });
