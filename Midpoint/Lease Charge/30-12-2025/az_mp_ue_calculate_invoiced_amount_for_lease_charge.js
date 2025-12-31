/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record','N/search'], function (record,search) {

    const afterSubmit = (context) => {
        try {
            if (context.type !== context.UserEventType.CREATE &&
                context.type !== context.UserEventType.EDIT) {
                return;
            }

            const recID = context.newRecord.id;
            const lcBatchCollectedAmount = getLCBatchCollectedAmount(recID);
            const tenantPaymentCollectedAmount = getTenantPaymentCollectedAmount(recID);

            const invoicedAmount = lcBatchCollectedAmount + tenantPaymentCollectedAmount ;    

            record.submitFields({
                type: context.newRecord.type,
                id: recID,
                values: {
                    'custrecord_ino_pms_lc_invoiced_amount': invoicedAmount
                },
                options: {
                    ignoreMandatoryFields: true
                }
            });
                    
        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

    const getLCBatchCollectedAmount = (recID) => {  
        try {
            if(!recID){ return }

            let sumCollectedAmount = 0;

            const tenantAllSearch = search.create({
                type: 'customrecord_az_mp_tp_allocation',
                filters: [['custrecord_az_mp_tpa_lease_charge',search.Operator.IS,recID],'AND',
                ['isinactive', search.Operator.IS, 'F'],'AND',
                ['custrecord_az_mp_tpa_lease_close_batch', search.Operator.NONEOF, '@NONE@'], 'AND',
                ['custrecord_az_mp_tpa_tenant_payment', search.Operator.ANYOF, '@NONE@']
                ],
                columns: ['custrecord_az_mp_tpa_collected_amount']
            })

            const results = tenantAllSearch.run().getRange(0, 1000);

            
            for(let i = 0 ; i < results.length ; i++){ 
                sumCollectedAmount += parseFloat(results[i].getValue('custrecord_az_mp_tpa_collected_amount')) || 0;
            }
    
            return sumCollectedAmount;

        } catch (errorGetLCBatchCollectedAmount) {
            log.debug('errorGetLCBatchCollectedAmount',errorGetLCBatchCollectedAmount);
        }
    }

    const getTenantPaymentCollectedAmount = (recID) => {       
        try {
            if(!recID){ return }

            let sumCollectedAmount = 0;

            const tenantAllSearch = search.create({
                type: 'customrecord_az_mp_tp_allocation',
                filters: [['custrecord_az_mp_tpa_lease_charge',search.Operator.IS,recID],'AND',
                ['isinactive', search.Operator.IS, 'F'],'AND',
                ['custrecord_az_mp_tpa_lease_close_batch', search.Operator.ANYOF, '@NONE@'],'AND',
                ['custrecord_az_mp_tpa_tenant_payment', search.Operator.NONEOF, '@NONE@'],'AND',
                ['custrecord_az_mp_tpa_lease_invoice', search.Operator.NONEOF, '@NONE@']
                ],
                columns: ['custrecord_az_mp_tpa_collected_amount']
            })

            const results = tenantAllSearch.run().getRange(0, 1000);

            
            for(let i = 0 ; i < results.length ; i++){ 
                sumCollectedAmount += parseFloat(results[i].getValue('custrecord_az_mp_tpa_collected_amount')) || 0;
            }

            return sumCollectedAmount;

        } catch (errorGetTenantPaymentCollectedAmount) {
            log.debug('errorGetTenantPaymentCollectedAmount',errorGetTenantPaymentCollectedAmount);
        }
    }


    return {
        afterSubmit: afterSubmit
    };
});
