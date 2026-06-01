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

                const approvalStatus = context.newRecord.getValue({
                fieldId: 'custbody_az_cbc_approval_status_trans'
            });

             if (Number(approvalStatus) === 2) {

                form.addButton({
                    id: 'custpage_print_pdf',
                    label: 'Print Preforma Invoice',
                    functionName: `onButtonClick("${recId}")`
                });

                form.clientScriptModulePath =
                    'SuiteScripts/az_cbc_cs_estimate_prt_btn.js';
            }

        } catch (errorBeforeLoad) {
            log.debug('errorBeforeLoad',errorBeforeLoad);
        }
    };

    return { beforeLoad };
});