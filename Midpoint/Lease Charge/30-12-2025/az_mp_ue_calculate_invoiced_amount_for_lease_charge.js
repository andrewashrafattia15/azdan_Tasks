/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record','N/search'], function (record,search) {

    const afterSubmit = (context) => {
        try {
            if (context.type !== context.UserEventType.DELETE) {
  
                    const recordID = context.newRecord.id;
                    const lcbCollectedAmount = getLCBatchCollectedAmount(recordID);
                    const tpCollectedAmount = getTPCollectedAmount(recordID);
                    
                    submitFields(recordID,lcbCollectedAmount,tpCollectedAmount,context);
                   
            }
                    
        } catch (errorAfterSubmit) {
            log.debug("errorAfterSubmit", errorAfterSubmit);
        }
    };

    const getLCBatchCollectedAmount = (recordID) => {
        try {

            const tenantAllSearch = search.create({
                type: 'customrecord_az_mp_tp_allocation',
                filters: [['custrecord_az_mp_tpa_lease_charge',search.Operator.IS,recordID],'AND',
                ['isinactive', search.Operator.IS, 'F'],'AND',
                ['custrecord_az_mp_tpa_lease_close_batch', search.Operator.NONEOF, '@NONE@'], 'AND',
                ['custrecord_az_mp_tpa_tenant_payment', search.Operator.ANYOF, '@NONE@']
                ],
                columns: [search.createColumn({
                        name: 'custrecord_az_mp_tpa_collected_amount',
                        summary: search.Summary.SUM
                    })
                ]
            });

            const result = tenantAllSearch.run().getRange({ start: 0, end: 1 });

            return parseFloat(
                result[0]?.getValue({
                    name: 'custrecord_az_mp_tpa_collected_amount',
                    summary: search.Summary.SUM
                })
            ) || 0;
            

        } catch (errorGetLCBatchCollectedAmount) {
            log.debug('errorGetLCBatchCollectedAmount',errorGetLCBatchCollectedAmount);
        }
    }

    const getTPCollectedAmount = (recordID) => {       
        try {
            const tenantAllSearch = search.create({
                type: 'customrecord_az_mp_tp_allocation',
                filters: [['custrecord_az_mp_tpa_lease_charge',search.Operator.IS,recordID],'AND',
                ['isinactive', search.Operator.IS, 'F'],'AND',
                ['custrecord_az_mp_tpa_lease_close_batch', search.Operator.ANYOF, '@NONE@'],'AND',
                ['custrecord_az_mp_tpa_tenant_payment', search.Operator.NONEOF, '@NONE@'],'AND',
                ['custrecord_az_mp_tpa_lease_invoice', search.Operator.NONEOF, '@NONE@']
                ],
                columns: [
                    search.createColumn({
                        name: 'custrecord_az_mp_tpa_collected_amount',
                        summary: search.Summary.SUM
                    })
                ]
            });

            const result = tenantAllSearch.run().getRange({ start: 0, end: 1 });

            return parseFloat(
                result[0]?.getValue({
                    name: 'custrecord_az_mp_tpa_collected_amount',
                    summary: search.Summary.SUM
                })
            ) || 0;

        } catch (errorGetTenantPaymentCollectedAmount) {
            log.debug('errorGetTenantPaymentCollectedAmount',errorGetTenantPaymentCollectedAmount);
        }
    }

    const submitFields = (recordID,lcbCollectedAmount,tpCollectedAmount,context)=>{
        try {

            const invoicedAmount = lcbCollectedAmount + tpCollectedAmount ;    

             record.submitFields({
                        type: context.newRecord.type,
                        id: recordID,
                        values: {
                            'custrecord_ino_pms_lc_invoiced_amount': invoicedAmount
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });

        } catch (errorSubmitFields) {
            log.debug('errorSubmitFields',errorSubmitFields);
        }
    }


    return {
        afterSubmit: afterSubmit
    };
});
