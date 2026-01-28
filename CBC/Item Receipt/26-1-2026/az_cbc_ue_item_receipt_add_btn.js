/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log'], (log) => {

    const beforeLoad = (context) => {
        try {
            
            if (context.type !== context.UserEventType.VIEW) return;

               const form = context.form;
               const recId = context.newRecord.id ; 
                form.addButton({
                    id: 'custpage_print_pdf',
                    label: 'Print Item Receipt',
                    functionName: 'onButtonClick("'+recId+'")'
                });
        
                form.clientScriptModulePath = 'SuiteScripts/az_cbc_cs_item_receipt_prt_btn.js';
            

        } catch (errorBeforeLoad) {
            log.debug('errorBeforeLoad',errorBeforeLoad);
        }
    };

    return { beforeLoad };
});