/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define(['N/search','N/record'], function(search, record) {
    const afterSubmit = (context) => {
        try {
            if(context.type !== context.UserEventType.DELETE){
                    
                const propExRec = context.newRecord;
                const propExRecID=propExRec.id;
                const genExpEntryCheck = propExRec.getValue('custrecord_az_mp_prope_gene_exp_entry');
                const expAppliedOn = propExRec.getValue('custrecord_az_mp_prope_apply_exp_on');
                const landlordExpense = propExRec.getValue('custrecord_az_mp_prope_ll_expense');
                const landlordID = propExRec.getValue('custrecord_az_mp_prope_landlord');
                const propertyEntry = propExRec.getValue('custrecord_az_mp_prope_entry');
                const subsidiaryId = propExRec.getValue('custrecord_az_mp_prope_subsidiary');
                const expEntryCreditAcc = propExRec.getValue('custrecord_az_mp_prope_bank_account');
                const memo = propExRec.getValue('custrecord_az_mp_prope_description');
                const date = propExRec.getValue('custrecord_az_mp_prope_date');
                const VATApplied= propExRec.getValue('custrecord_az_mp_prope_vat_applicable');
                const taxRate = propExRec.getValue('custrecord_az_mp_prope_tax_rate');
                
                if(genExpEntryCheck && (expAppliedOn=='1'||expAppliedOn=='2') && (landlordExpense=="" || propertyEntry=="")){
                    let journalEntryid,propExpEntryid
                    const allExpensesAlloc = getAllExpensesAlloc(propExRecID)
                    const debitAndCreditLines=[]    // landlord 
                    allExpensesAlloc.forEach(expenseAlloc => {
                        const allPropLLEx = getallPropLandlords(expenseAlloc,expAppliedOn,taxRate,landlordID);
                        if(allPropLLEx && allPropLLEx.length){
                            debitAndCreditLines.push(...allPropLLEx)
                            debitAndCreditLines.push({credit:expenseAlloc})
                        }
                    })
                    const leasePrefData= getleasePrefData(subsidiaryId)

                    if(propertyEntry=="" ){
                        propExpEntryid=createPropExEntry(debitAndCreditLines, leasePrefData.debitAcc, expEntryCreditAcc, memo, date,subsidiaryId,propExRecID);
                    }
                    if(landlordExpense==""){
                        journalEntryid=createJournalEntry(debitAndCreditLines, leasePrefData, memo, date,propExRecID,VATApplied);
                    }

                    updatepropExRec( propExRecID,propExpEntryid,journalEntryid);
            }
        }
        } catch (errorAfterSubmit) {
            log.debug("errorAfterSubmit", errorAfterSubmit)
        }
    }

    const getAllExpensesAlloc = (propExpenseRecID) => {
        try {
            const allExpensesAlloc = [];
            const exAllocationsearch = search.create({
            type: 'customrecord_az_mp_expenses_allocation', 
            filters: [
                ['custrecord_az_mp_expa_property_expense', search.Operator.IS, propExpenseRecID],
                'AND',
                ['isinactive', search.Operator.IS, 'F']
            ],
            columns: [
                search.createColumn({
                    name: 'custrecord_az_mp_expa_property',
                    summary: search.Summary.GROUP
                }),
                search.createColumn({
                    name: 'custrecord_az_mp_expa_amount',
                    summary: search.Summary.SUM
                }),
                search.createColumn({
                    name: 'custrecord_az_mp_expa_amt_after_tax',
                    summary: search.Summary.SUM
                })
            ]})

              const searchResult = exAllocationsearch.run().getRange(0,1000)

              if(searchResult.length>0){

                searchResult.forEach(result => {
                const property = result.getValue({
                name: 'custrecord_az_mp_expa_property',
                summary: search.Summary.GROUP
                });

                const totalAmount = parseFloat(
                result.getValue({
                    name: 'custrecord_az_mp_expa_amount',
                    summary: search.Summary.SUM
                })) || 0;

                const totalAmtAfterTax = parseFloat(
                result.getValue({
                    name: 'custrecord_az_mp_expa_amt_after_tax',
                    summary: search.Summary.SUM
                })) || 0;

                allExpensesAlloc.push({
                    property: property,
                    totalAmount: totalAmount,
                    totalAmtAfterTax: totalAmtAfterTax
                })
                })
            }
            return allExpensesAlloc;
        } catch (errorGetAllExpensesAlloc) {
            log.debug("errorGetAllExpensesAlloc", errorGetAllExpensesAlloc)
        }
    }

    const getallPropLandlords = (expenseAlloc,expAppliedOn,taxRate,landlordID) => {
        try {
            const proplandlords = [];
            const filters = []
            let debitAmt,journalDebitAmt
            let sumoflandlord=0
            let sumoflandlordJournal=0

            if(expAppliedOn == '1'){
                filters.push( 
                    ['custrecord_ino_pms_pl_property', search.Operator.IS, expenseAlloc.property],
                    'AND',
                    ['isinactive', search.Operator.IS, 'F']
                )
            }else if (expAppliedOn == '2') {
                filters.push( 
                    ['custrecord_ino_pms_pl_property', search.Operator.IS, expenseAlloc.property],
                    'AND',
                    ['custrecord_ino_pms_pl_landlord', search.Operator.IS, landlordID],
                    'AND',
                    ['isinactive', search.Operator.IS, 'F']
                )
            }
            
            const propLLAllocationsearch = search.create({
            type: 'customrecord_ino_pms_property_landlord', 
            filters: filters,
            columns: [
                'internalid',
                'custrecord_ino_pms_pl_ownership_perc',
                search.createColumn({
                name: 'custrecord_ino_pms_landlord_customer',
                join: 'custrecord_ino_pms_pl_landlord'
                }),
                'custrecord_ino_pms_pl_landlord',
                'custrecord_ino_pms_pl_provision_expense'
                
            ]})

            const searchResult= propLLAllocationsearch.run().getRange(0,1000)


            if(searchResult.length>0){

                searchResult.forEach((result,index) => {
                const ownershipPerc = parseFloat(result.getValue('custrecord_ino_pms_pl_ownership_perc')) || 0;
                
                const landlordCust = result.getValue({
                    name: 'custrecord_ino_pms_landlord_customer',
                    join: 'custrecord_ino_pms_pl_landlord'
                });

                const landlordName = result.getValue('custrecord_ino_pms_pl_landlord');
                
                const propllID = result.getValue('internalid');
                const provExpense= parseFloat(result.getValue('custrecord_ino_pms_pl_provision_expense')) || 0;


                if(index== searchResult.length-1){
                    debitAmt = (expenseAlloc.totalAmtAfterTax - sumoflandlord).toFixed(2);  
                    journalDebitAmt= (expenseAlloc.totalAmount - sumoflandlordJournal).toFixed(2);  
                }
                else{
                    debitAmt = (expenseAlloc.totalAmtAfterTax * (ownershipPerc / 100)).toFixed(2);
                    journalDebitAmt= ((expenseAlloc.totalAmount * (ownershipPerc / 100))/(1+(taxRate/100))).toFixed(2);
                    sumoflandlord+=parseFloat(debitAmt)
                    sumoflandlordJournal+=parseFloat(journalDebitAmt)
                }

                updateProvisionExpense(propllID , provExpense, debitAmt);

                proplandlords.push({
                    landlordCust: landlordCust,
                    landlordName: landlordName,
                    debitAmt: debitAmt,
                    journalDebitAmt:journalDebitAmt,
                    property: expenseAlloc.property
                 })
                })
            }
            return proplandlords;
        } catch (errorGetallPropLandlords) {
            log.debug("errorGetallPropLandlords", errorGetallPropLandlords)
        }
    }

    const getleasePrefData = (subsidiaryId) => {
        try {
            const recSearch = search.create({
                type: 'customrecord_ino_pms_prpt_mgmt_prefrence',
                filters: [['isinactive', search.Operator.IS, 'F'], 
                            'AND',
                          ['custrecord_ino_pms_pmp_subsidiary', search.Operator.IS, subsidiaryId]],
                columns: [
                    'custrecord_az_mp_ls_provision_account',
                    'custrecord_ino_pms_pmp_landlord_subs',
                    'custrecord_az_mp_pmp_ll_exp_acc',
                    'custrecord_az_mp_pmp_ll_due_from',
                    'custrecord_ino_pms_thp_tax_code',
                    search.createColumn({
                        name: 'rate',
                        join: 'custrecord_ino_pms_thp_tax_code'
                    })
                ]
            });

            const searchResult = recSearch.run().getRange(0,1)

            if(searchResult.length > 0){
                const debitAcc = searchResult[0].getValue('custrecord_az_mp_ls_provision_account');
                const llJourSubsidiary = searchResult[0].getValue('custrecord_ino_pms_pmp_landlord_subs');
                const llJournalDebitAcc = searchResult[0].getValue('custrecord_az_mp_pmp_ll_exp_acc');
                const llJournalCreditAcc = searchResult[0].getValue('custrecord_az_mp_pmp_ll_due_from');
                const vatCode = searchResult[0].getValue('custrecord_ino_pms_thp_tax_code');
                const vatRate = searchResult[0].getValue({
                    name: 'rate',
                    join: 'custrecord_ino_pms_thp_tax_code'
                });
                return {
                    debitAcc:debitAcc,
                    llJournalSubsidiary:llJourSubsidiary,
                    llJournalDebitAcc:llJournalDebitAcc,
                    llJournalCreditAcc:llJournalCreditAcc,
                    vatCode:vatCode,
                    vatRate:vatRate
                };
            }
        } catch (errorGetleasePrefData) {
            log.debug("errorGetleasePrefData", errorGetleasePrefData)
        }
    }

    const createPropExEntry = (debitAndCreditLines, debitAcc, creditAcc, memo, date,subsidiaryId,propExRecID) => {
        try {
            const propExpenseEntryRec = record.create({
                type: 'customtransaction_az_mp_pro_exp_entry',
                isDynamic: true});

            propExpenseEntryRec.setValue({
                fieldId: 'custbody_az_mp_property_expenses',
                value: propExRecID
            });

            propExpenseEntryRec.setValue({
                fieldId: 'subsidiary',
                value: subsidiaryId
            });
            propExpenseEntryRec.setValue({
                fieldId: 'memo',
                value: memo
            });
            propExpenseEntryRec.setValue({
                fieldId: 'trandate',
                value: date
            });

            debitAndCreditLines.forEach(item => {
                if(item.debitAmt){
                propExpenseEntryRec.selectNewLine({
                    sublistId: 'line'
                }); 
                propExpenseEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: debitAcc
                });
                propExpenseEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: item.debitAmt

                });
                propExpenseEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'memo',
                    value: memo

                });
                propExpenseEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: item.landlordCust
                });
                 propExpenseEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custcolaz_mp_landlord_line',
                    value: item.landlordName

                });
                propExpenseEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'cseg_ino_re_prpty',
                    value: item.property

                });
               
                propExpenseEntryRec.commitLine({
                    sublistId: 'line'
                });
                }
            

            if(item.credit){
                propExpenseEntryRec.selectNewLine({
                    sublistId: 'line'
                });
                propExpenseEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: creditAcc
                });
                propExpenseEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    value: item.credit.totalAmtAfterTax
                });
                propExpenseEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'memo',
                    value: memo

                });
                propExpenseEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'cseg_ino_re_prpty',
                    value: item.credit.property

                });
                propExpenseEntryRec.commitLine({
                    sublistId: 'line'
                });
            }
            });

            const propExpenseEntryId = propExpenseEntryRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            return propExpenseEntryId;
        
        } catch (errorCreatePropExEntry) {
            log.debug("errorCreatePropExEntry", errorCreatePropExEntry)
        }
    }

    const createJournalEntry = (debitAndCreditLines, leasePrefData, memo, date,propExRecID,VATApplied) => {
        try {
            const journalEntryRec = record.create({
                type: 'journalentry',
                isDynamic: true});

            journalEntryRec.setValue({
                fieldId: 'custbody_az_mp_jv_type',
                value: 2
            });
            journalEntryRec.setValue({
                fieldId: 'custbody_az_mp_property_expenses',
                value: propExRecID
            });

            journalEntryRec.setValue({
                fieldId: 'subsidiary',
                value: leasePrefData.llJournalSubsidiary
            });
            journalEntryRec.setValue({
                fieldId: 'memo',
                value: memo
            });
            journalEntryRec.setValue({
                fieldId: 'trandate',
                value: date
            });

            debitAndCreditLines.forEach(item => {
                if(item.debitAmt){
                journalEntryRec.selectNewLine({
                    sublistId: 'line'
                }); 
                journalEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: leasePrefData.llJournalDebitAcc
                });
                journalEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: item.journalDebitAmt

                });
                
                if(VATApplied){
                journalEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'taxcode',
                    value: leasePrefData.vatCode

                });
                }

                const debit = parseFloat(item.journalDebitAmt);
                const vatRate = parseFloat(leasePrefData.vatRate) / 100; 

                const grossAmount = (debit + (debit * vatRate)).toFixed(2);

                journalEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'grossamt',
                    value: grossAmount

                });
                journalEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'memo',
                    value: memo

                });
                journalEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: item.landlordCust
                });
                journalEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custcolaz_mp_landlord_line',
                    value: item.landlordName

                });
                journalEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'cseg_ino_re_prpty',
                    value: item.property

                });
               
                journalEntryRec.commitLine({
                    sublistId: 'line'
                });
                }
            

                
            if(item.credit){
                journalEntryRec.selectNewLine({
                    sublistId: 'line'
                });
                journalEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: leasePrefData.llJournalCreditAcc
                });
                journalEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    value: item.credit.totalAmtAfterTax
                });

                journalEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'memo',
                    value: memo

                });
                journalEntryRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'cseg_ino_re_prpty',
                    value: item.credit.property

                });
                journalEntryRec.commitLine({
                    sublistId: 'line'
                });
            }
            });

            const journalEntryId = journalEntryRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            return journalEntryId;

        } catch (errorCreateJournalEntry) {
            log.debug("errorCreateJournalEntry", errorCreateJournalEntry)
        }
    }

    const updatepropExRec = (propExId,propEntryId, journalEntryId) => {
        try {
            const valuesToUpdate={};
            if(journalEntryId){
                valuesToUpdate.custrecord_az_mp_prope_ll_expense= journalEntryId;
            }
            if(propEntryId){
                valuesToUpdate.custrecord_az_mp_prope_entry= propEntryId;
            }

            record.submitFields({
                type: 'customrecord_az_mp_property_expenses',
                id: propExId,
                values: valuesToUpdate,
                options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                }
            });
        } catch (errorUpdatepropExRec) {
            log.debug(' errorUpdatepropExRec', errorUpdatepropExRec);
        }
    };

    const updateProvisionExpense = (propllID, currentPEValue, debitAmt) => {
       try {

        const newPEValue = currentPEValue + parseFloat(debitAmt || 0);

        record.submitFields({
                type: 'customrecord_ino_pms_property_landlord',
                id: propllID,
                values: {
                    custrecord_ino_pms_pl_provision_expense : newPEValue
                },
                options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                }
            });
        } catch (errorUpdateProvisionExpense) {
            log.debug(' errorUpdateProvisionExpense', errorUpdateProvisionExpense);
        }
    }

    
   return {
        afterSubmit: afterSubmit
    }
});
