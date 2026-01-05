/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record','N/search'], function (record,search) {

    const afterSubmit = (context) => {
        try {
            if (context.type !== context.UserEventType.DELETE) {
  
                    const recordID = context.newRecord.id;
                    const recordType = context.newRecord.type;
                    const totalAmount = getPETotalAmount(recordID);     // PE "Property Expense"
                    
                    updatePropertyExpenses(totalAmount,recordID,recordType);      
            }
            
        } catch (errorAfterSubmit) {
            log.debug("errorAfterSubmit", errorAfterSubmit);
        }
    };

    const getPETotalAmount = (recordID) => {
        try {

            const tenantAllSearch = search.create({
                type: 'customrecord_az_mp_expenses_allocation',
                filters: [['custrecord_az_mp_expa_property_expense',search.Operator.IS,recordID],'AND',
                ['isinactive', search.Operator.IS, 'F']],
                columns: [search.createColumn({
                        name: 'custrecord_az_mp_expa_amount',
                        summary: search.Summary.SUM
                    })
                ]
            });

            const result = tenantAllSearch.run().getRange({ start: 0, end: 1 });

            
            if(result){
            const totalAmount = parseFloat(
                    result[0].getValue({
                        name: 'custrecord_az_mp_expa_amount',
                        summary: search.Summary.SUM
                    })
                ) || 0;

                return totalAmount ;
            }else {
                return 0;
            }

        
        } catch (errorGetLCBatchCollectedAmount) {
            log.debug('errorGetLCBatchCollectedAmount',errorGetLCBatchCollectedAmount);
        }
    }

    const updatePropertyExpenses = (totalAmount,recordID,recordType)=>{
        try {

             record.submitFields({
                        type: recordType,
                        id: recordID,
                        values: {
                            'custrecord_az_mp_prope_amount': totalAmount
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });

        } catch (errorUpdatePropertyExpenses) {
            log.debug('errorUpdatePropertyExpenses',errorUpdatePropertyExpenses);
        }
    }


    return {
        afterSubmit: afterSubmit
    };
});
