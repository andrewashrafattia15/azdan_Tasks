/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([], () => {

    const beforeLoad = (context) => {

        try {
            const { type, form} = context;
    
            if (type === context.UserEventType.VIEW){
        
                form.addButton({
                    id: 'custpage_az_spg_item_receipt_prt_btn',
                    label: 'Print Item Receipt',
                    functionName: 'onButtonClick'
                });
        
            form.clientScriptModulePath = 'SuiteScripts/az_spg_cs_item_receipt_prt_btn.js';
            } 
            
        } catch (errorBeforeLoad) {
            log.debug("errorBeforeLoad",errorBeforeLoad);
        }
    };

    return { beforeLoad };
});
