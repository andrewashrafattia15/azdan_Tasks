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
                    label: 'Print Proposal Version',
                    functionName: `onButtonClick("${recId}")`
                });

                form.clientScriptModulePath =
                    'SuiteScripts/az_rs_cs_proposal_prt_btn.js';

        } catch (errorBeforeLoad) {
            log.debug('errorBeforeLoad',errorBeforeLoad);
        }
    };

    return { beforeLoad };
});