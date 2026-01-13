/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record','N/search'], (recordMod,search) => { 


    const afterSubmit = (context) => {
        try {
            if (context.type !== context.UserEventType.DELETE){

                const record = context.newRecord;
                const recordID = record.id;
                const lineCount = record.getLineCount({ sublistId: 'custpage_lease_chargs' });

                if(record.getValue('custrecord_az_mp_atp_generate_lcp')){
                        for (let i = 0; i < lineCount; i++) {
                            const isSelected = record.getSublistValue({
                                sublistId: 'custpage_lease_chargs',
                                fieldId: 'custpage_sl_apply',
                                line: i
                            });

                        if (isSelected === 'T')  {

                            const chargeId = record.getSublistValue({
                                sublistId: 'custpage_lease_chargs',
                                fieldId: 'custpage_sl_id',
                                line: i
                            });
                            const grossAmount = record.getSublistValue({
                                sublistId: 'custpage_lease_chargs',
                                fieldId: 'custpage_sl_gross_amount',
                                line: i
                            });
                            const invoicedAmount = record.getSublistValue({
                                sublistId: 'custpage_lease_chargs',
                                fieldId: 'custpage_sl_invoiced_amount',
                                line: i
                            });
                            const remainingAmount  = record.getSublistValue({
                                sublistId: 'custpage_lease_chargs',
                                fieldId: 'custpage_sl_remainig_amount',
                                line: i
                            });
                            const paiedAmount = record.getSublistValue({
                                sublistId: 'custpage_lease_chargs',
                                fieldId: 'custpage_sl_paied_amount',
                                line: i
                            });

                            deleteExistingLCP(recordID,chargeId);
                            createNewLCP(recordID,chargeId,grossAmount,invoicedAmount,remainingAmount,paiedAmount);
                        }
                    }
                    recordMod.submitFields({
                        type: record.type,
                        id: recordID,
                        values: {
                            custrecord_az_mp_atp_generate_lcp: false
                        },
                        options: {
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        }
                    });
                }
            }
        } catch (errorAfterSubmit) {
            log.debug('afterSubmit error', errorAfterSubmit);
        }
    };

    const deleteExistingLCP = (acceptTPId, leaseChargeId) => {
        try {
            const lcpSearch = search.create({
                type: 'customrecord_az_mp_lease_charge_payment',
                filters: [
                    ['custrecord_az_mp_lcp_accept_tp', search.Operator.IS, acceptTPId],
                    'AND',
                    ['custrecord_az_mp_lcp_lease_charge', search.Operator.IS, leaseChargeId]
                ],
                columns: ['internalid']
            });
    
            lcpSearch.run().each(result => {
                const lcpId = result.getValue('internalid');
                recordMod.delete({
                    type: 'customrecord_az_mp_lease_charge_payment',
                    id: lcpId
                });
                return true;
            });
        } catch (errorDeleteExistingLCP) {
            log.debug('errorDeleteExistingLCP',errorDeleteExistingLCP);
        }
    };

    const createNewLCP = (acceptTPID,chargeId,grossAmount,invoicedAmount,remainingAmount,paiedAmount) =>{
        try {            
            const paymentRec = recordMod.create({
                type: 'customrecord_az_mp_lease_charge_payment', 
                isDynamic: true
            });

            paymentRec.setValue({
                fieldId: 'custrecord_az_mp_lcp_accept_tp',
                value: acceptTPID
            });

            paymentRec.setValue({
                fieldId: 'custrecord_az_mp_lcp_lease_charge',
                value: chargeId
            });

            paymentRec.setValue({
                fieldId: 'custrecord_az_mp_lcp_gross_amount',
                value: grossAmount
            });

            paymentRec.setValue({
                fieldId: 'custrecord_az_mp_lcp_invoiced_amount',
                value: invoicedAmount
            });

            paymentRec.setValue({
                fieldId: 'custrecord_az_mp_lcp_remaining_amount',
                value: remainingAmount
            });

            paymentRec.setValue({
                fieldId: 'custrecord_az_mp_lcp_paid_amount',
                value: paiedAmount
            });

            paymentRec.save();

            } catch (errorCreateNewLCP) {
              log.debug('errorCreateNewLCP',errorCreateNewLCP);
        }
    }

    return { afterSubmit };
});
