/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/record', 'N/log'], (record, log) => {

    function beforeLoad (context) {
        try {
            // Only act when the user clicks the native Print button
            if (context.type !== context.UserEventType.PRINT) {
                log.debug('Skipped', `Event type: ${context.type}`);
                return;
            }

            const poId = context.newRecord.id;
            const poRec = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: poId
            });

            //  Get Vendor
            const vendorId = poRec.getValue('entity');
            if (!vendorId) {
                log.debug('No Vendor found on PO');
                return;
            }

            const vendorRec = record.load({
                type: record.Type.VENDOR,
                id: vendorId
            });

            //  Get Approver from Vendor
            const approverId = vendorRec.getValue('custentity_ra_approver'); // Adjust if different field ID
            if (!approverId) {
                log.debug('No Approver found on Vendor');
                return;
            }

            const approverRec = record.load({
                type: record.Type.EMPLOYEE,
                id: approverId
            });

            //  Extract approver details
            const approverName = approverRec.getValue('firstname') || '';
            const approverEmail = approverRec.getValue('email') || '';

            log.debug('Approver Info', { approverName, approverEmail });

            //  Save values into your hidden PO fields
            poRec.setValue({
                fieldId: 'custbody_az_tr_approver_name',
                value: approverName
            });
            poRec.setValue({
                fieldId: 'custbody_az_tr_approver_email',
                value: approverEmail
            });

            poRec.save({
                enableSourcing: true, // default true 
                ignoreMandatoryFields: true
            });

            log.debug('SUCCESS', `Approver data added to PO ${poId}`);

        } catch (e) {
            log.error('ERROR in beforeLoad', e);
        }
    };

    return { beforeLoad };
});
