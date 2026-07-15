/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(["N/record", 'N/format', 'N/search'],
    function (record, format, search) {

        const afterSubmit = (context) => {
            try {

                if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {

                    let currentRec = context.newRecord;

                    let tranId = currentRec.id;
                    // Get Related Bill
                    let RelatedBill = currentRec.getValue({
                        fieldId: "custbody_az_hm_ic_relatedbill"
                    });

                    //    Get Status
                    let intercompStatus = currentRec.getValue({
                        fieldId: "transtatus"
                    });
                    // check if RelatedBill is empty  And Status is Approved
                    // 
                    if (RelatedBill == "" && intercompStatus == "B") {

                        //    Get Reference number
                        let Referencenumber = currentRec.getValue({
                            fieldId: "tranid"
                        });

                        //    Get Customer
                        let intercompCustomer = currentRec.getValue({
                            fieldId: "entity"
                        });

                        //    Get Subsidiary
                        let intercompSubsidiary = currentRec.getValue({
                            fieldId: "subsidiary"
                        });

                      let   intercompmemo = currentRec.getValue({
                        fieldId: "memo"
                    });

                        // get Representing Vendor from Subsidiary
                        let RepresentingVendor = searchsubsidiarydata(intercompSubsidiary);
                        // get Representing Subsidiary from customer
                        let RepresentingSubsidiary = searchcustomerdata(intercompCustomer);

                        //    Get Date
                        let intercompDate = currentRec.getValue({
                            fieldId: "trandate"
                        });

                        try {
                            ///---------------------- create vendor bill Body Fields ------// 
                            let rec = record.create({
                                type: 'vendorbill',
                                isDynamic: true
                            });

                            ///------------Set Reference number
                            rec.setValue('tranid', RepresentingVendor);

                            ///------------Set Representing Vendor
                            rec.setValue('entity', RepresentingVendor);

                            ///------------Set Representing subsidiary
                            rec.setValue('subsidiary', RepresentingSubsidiary);

                            ///------------Set Supplier invoice date
                            rec.setValue('custbody_splr_inv_dt', intercompDate);
                              ///------------Set Supplier invoice date
                              rec.setValue('memo',intercompmemo );

                            

                            // loop on line item to get number of lines 
                            let count = currentRec.getLineCount({
                                sublistId: 'item'
                            });

                            for (let x = 0; x < count; x++) {

                                let itemId = currentRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'item',
                                    line: x,
                                });


                                let IncomeAccount = searchitemdata(itemId);

                                let Amount = currentRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    line: x,
                                });

                                rec.selectNewLine({
                                    sublistId: 'expense'
                                });

                                ///------------Set Expense Account (line item) 
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'account',
                                    // line: count,
                                    value: IncomeAccount
                                });

                                ///------------Set Expense Amount (line item) 
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'amount',
                                    // line: count,
                                    value: Amount
                                });

                                rec.commitLine('expense');

                            }

                            let vendorid = rec.save({
                                ignoreMandatoryFields: true,
                                enableSourcing: true
                            });

                            if (vendorid) {
                                updateIntercompanyInvoice(tranId, vendorid);

                            }

                        } catch (error) {

                            log.debug({
                                title: 'error in create vendor bill record',
                                details: error
                            });

                        }
                    }
                }
            } catch (error) {
                log.debug({ title: "error in after submit fun", details: error });
            }
        }
        // Search Subsidiary Data
        const searchsubsidiarydata = (id) => {

            try {
                var srch = search.create({
                    type: 'subsidiary',
                    filters: ['internalid', search.Operator.IS, id],
                    columns: ['representingcustomer'],

                });

                var results = getAllResults(srch);

                if (results != null && results != '') {
                    var subsRepreVendor = results[0].getValue('representingcustomer');
                    return subsRepreVendor;
                }

                else {

                    return false;
                }

            } catch (error) {

                log.debug({
                    title: 'error insearchsubsidiarydata',
                    details: error
                });

            }
        }

        // Search Customer Data
        const searchcustomerdata = (id) => {

            try {
                var srch = search.create({
                    type: 'customer',
                    filters: ['internalid', search.Operator.IS, id],
                    columns: ['representingsubsidiary'],

                });

                var results = getAllResults(srch);

                if (results != null && results != '') {
                    var subsRepresubsidiary = results[0].getValue('representingsubsidiary');
                    return subsRepresubsidiary;
                }
                else {

                    return false;
                }

            } catch (error) {

                log.debug({
                    title: 'error insearchsubsidiarydata',
                    details: error
                });

            }
        }


        // Search Item Data
        const searchitemdata = (id) => {

            try {
                var srch = search.create({
                    type: 'serviceitem',
                    filters: ['internalid', search.Operator.IS, id],
                    columns: ['incomeaccount'],

                });

                var results = getAllResults(srch);

                if (results != null && results != '') {
                    var incomeaccount = results[0].getValue('incomeaccount');
                    return incomeaccount;
                }
                else {

                    return false;
                }

            } catch (error) {

                log.debug({
                    title: 'error insearchsubsidiarydata',
                    details: error
                });

            }
        }

        // update current transaction 
        const updateIntercompanyInvoice = (tranId, vendorid) => {

            try {

                var rec = record.load({
                    type: "customsale_az_hm_ic_invoice",
                    id: tranId,

                });

                rec.setValue('custbody_az_hm_ic_relatedbill', vendorid);

                rec.save({

                    ignoreMandatoryFields: true,
                    enableSourcing: true
                });


            } catch (error) {

                log.debug({
                    title: 'error in update curr tran',
                    details: error
                });

            }
        }
        // get All Results
        const getAllResults = (s) => {
            var results = s.run();
            var searchResults = [];
            var searchid = 0;
            do {
                var resultslice = results.getRange({ start: searchid, end: searchid + 1000 });
                resultslice.forEach(function (slice) {
                    searchResults.push(slice);
                    searchid++;
                }
                );
            } while (resultslice.length >= 1000);
            return searchResults;
        }


        return {
            afterSubmit: afterSubmit
        };
    })
