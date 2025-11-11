/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([], () => {

    const beforeLoad = (context) => {
        const { type, form} = context;

        if (type === context.UserEventType.VIEW){

        form.addButton({
            id: 'custpage_sum_amount_due_btn',
            label: 'Sum Amount Due',
            functionName: 'sumAmountDueForCustomer'
        });

        // Set client script by file ID or script path
       form.clientScriptModulePath = 'andrew_ashraf/az_tr_cs_all_amount_due.js';
     } 
    };

    return { beforeLoad };
});
