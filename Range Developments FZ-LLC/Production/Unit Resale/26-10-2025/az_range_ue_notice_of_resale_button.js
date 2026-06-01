/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/log'], (log) => {

    const beforeLoad = (context) => {
        try {

            if (context.type !== context.UserEventType.VIEW) return;

            const rec = context.newRecord;
            const unitTypeText = rec.getText('custrecord_ino_re_ur_type');

            if (unitTypeText === 'Resale') {
                context.form.addButton({
                    id: 'custpage_az_range_notice_of_resale_btn',
                    label: 'Notice of Resale',
                    functionName: 'onClick'
                });

                context.form.clientScriptModulePath = '/SuiteScripts/az_range_cs_open_resale_template.js';
            }

        } catch (errorBeforeLoad) {
            log.debug('errorBeforeLoad', errorBeforeLoad);
        }
    };

    return { beforeLoad };
});
