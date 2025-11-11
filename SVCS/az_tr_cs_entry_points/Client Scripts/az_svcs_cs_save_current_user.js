/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/runtime'], (runtime) => {

    const saveRecord = (context) => {
        try {

            const rec = context.currentRecord;
            const currentUserId = runtime.getCurrentUser().id;

            rec.setValue({
                fieldId: 'custrecord_az_svcs_current_user',
                value: currentUserId
            });

            return true;

        } catch (errorSaveRecord) {
            log.debug('saveRecord error', errorSaveRecord);
        }
    };

    return {
        saveRecord
    };
});
