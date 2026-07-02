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
                    // check Status is Approved; branch on whether a related bill already exists
                    //
                    if (intercompStatus == "B") {

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

                        // DEBUG: confirm what memo value was read off the source invoice
                        log.debug({
                            title: 'DEBUG - memo read from intercompany invoice',
                            details: intercompmemo
                        });

                        //    Get Date
                        let intercompDate = currentRec.getValue({
                            fieldId: "trandate"
                        });

                        if (RelatedBill == "") {

                        // get Representing Vendor from Subsidiary
                        let RepresentingVendor = searchsubsidiarydata(intercompSubsidiary);
                        // get Representing Subsidiary from customer
                        let RepresentingSubsidiary = searchcustomerdata(intercompCustomer);

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

                            ///------------Set Memo
                            rec.setValue('memo', intercompmemo);

                            // DEBUG: confirm memo actually took on the in-memory record before save
                            log.debug({
                                title: 'DEBUG - memo on vendor bill before save',
                                details: rec.getValue('memo')
                            });

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

                                let description = currentRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'description',
                                    line: x,
                                });

                                rec.selectNewLine({
                                    sublistId: 'expense'
                                });

                                ///------------Set Expense Account (line item)
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'account',
                                    value: IncomeAccount
                                });

                                ///------------Set Expense Amount (line item)
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'amount',
                                    value: Amount
                                });

                                ///------------Set Expense Description (line item)
                                rec.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'memo',
                                    value: description
                                });

                                rec.commitLine('expense');

                            }

                            let vendorid = rec.save({
                                ignoreMandatoryFields: true,
                                enableSourcing: true
                            });

                            // DEBUG: reload the saved bill and confirm memo persisted correctly
                            if (vendorid) {
                                let savedBill = record.load({
                                    type: 'vendorbill',
                                    id: vendorid
                                });

                                log.debug({
                                    title: 'DEBUG - memo on vendor bill after save (id ' + vendorid + ')',
                                    details: savedBill.getValue('memo')
                                });

                                updateIntercompanyInvoice(tranId, vendorid);

                            }

                        } catch (error) {

                            log.debug({
                                title: 'error in create vendor bill record',
                                details: error
                            });

                        }

                        } else {

                            /// ---------------- RelatedBill already exists: edit that vendor bill instead of creating a new one ------///
                            try {

                                let existingBill = record.load({
                                    type: 'vendorbill',
                                    id: RelatedBill,
                                    isDynamic: true
                                });

                                ///------------Refresh Supplier invoice date
                                existingBill.setValue('custbody_splr_inv_dt', intercompDate);

                                ///------------Refresh Memo
                                existingBill.setValue('memo', intercompmemo);

                                // DEBUG: confirm memo actually took on the existing bill before save
                                log.debug({
                                    title: 'DEBUG - memo on existing vendor bill before save',
                                    details: existingBill.getValue('memo')
                                });

                                // remove all existing expense lines so they can be rebuilt from the invoice's current lines
                                let existingLineCount = existingBill.getLineCount({
                                    sublistId: 'expense'
                                });

                                for (let i = existingLineCount - 1; i >= 0; i--) {
                                    existingBill.removeLine({
                                        sublistId: 'expense',
                                        line: i
                                    });
                                }

                                // loop on line item to rebuild expense lines from the invoice's current lines
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

                                    let description = currentRec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'description',
                                        line: x,
                                    });

                                    existingBill.selectNewLine({
                                        sublistId: 'expense'
                                    });

                                    ///------------Set Expense Account (line item)
                                    existingBill.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'account',
                                        value: IncomeAccount
                                    });

                                    ///------------Set Expense Amount (line item)
                                    existingBill.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'amount',
                                        value: Amount
                                    });

                                    ///------------Set Expense Description (line item)
                                    existingBill.setCurrentSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'memo',
                                        value: description
                                    });

                                    existingBill.commitLine('expense');

                                }

                                let savedId = existingBill.save({
                                    ignoreMandatoryFields: true,
                                    enableSourcing: true
                                });

                                // DEBUG: reload and confirm memo persisted correctly on the edited bill
                                if (savedId) {
                                    let reloadedBill = record.load({
                                        type: 'vendorbill',
                                        id: savedId
                                    });

                                    log.debug({
                                        title: 'DEBUG - memo on existing vendor bill after save (id ' + savedId + ')',
                                        details: reloadedBill.getValue('memo')
                                    });
                                }

                            } catch (error) {

                                log.debug({
                                    title: 'error editing existing vendor bill record',
                                    details: error
                                });

                            }

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
                const srch = search.create({
                    type: 'subsidiary',
                    filters: ['internalid', search.Operator.IS, id],
                    columns: ['representingcustomer'],

                });

                const results = getAllResults(srch);

                if (results != null && results != '') {
                    const subsRepreVendor = results[0].getValue('representingcustomer');
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
                const srch = search.create({
                    type: 'customer',
                    filters: ['internalid', search.Operator.IS, id],
                    columns: ['representingsubsidiary'],

                });

                const results = getAllResults(srch);

                if (results != null && results != '') {
                    const subsRepresubsidiary = results[0].getValue('representingsubsidiary');
                    return subsRepresubsidiary;
                }
                else {

                    return false;
                }

            } catch (error) {

                log.debug({
                    title: 'error insearchcustomerdata',
                    details: error
                });

            }
        }


        // Search Item Data
        const searchitemdata = (id) => {

            try {
                const srch = search.create({
                    type: 'serviceitem',
                    filters: ['internalid', search.Operator.IS, id],
                    columns: ['incomeaccount'],

                });

                const results = getAllResults(srch);

                if (results != null && results != '') {
                    const incomeaccount = results[0].getValue('incomeaccount');
                    return incomeaccount;
                }
                else {

                    return false;
                }

            } catch (error) {

                log.debug({
                    title: 'error insearchitemdata',
                    details: error
                });

            }
        }

        // update current transaction
        const updateIntercompanyInvoice = (tranId, vendorid) => {

            try {

                const rec = record.load({
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
            const results = s.run();
            const searchResults = [];
            let searchid = 0;
            let resultslice;
            do {
                resultslice = results.getRange({ start: searchid, end: searchid + 1000 });
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