/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([], () => {

    const beforeLoad = (context) => {
        const {type, form} = context;

        if (type === context.UserEventType.VIEW){

        form.addButton({
            id: 'custpage_sum_amount_due_btn',
            label: 'Sum Amount Due',
            functionName: 'sumAmountDueForCustomer'
        });

       form.clientScriptModulePath = 'SuiteScripts/az_tr_cs_all_amount_due_v2.js';
     } 
    };

    return { beforeLoad };
});
