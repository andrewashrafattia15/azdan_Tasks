/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * Task          Date                Author                                         Remarks
 * DT-0000      01 Enero 2022       name lastname <examle@gmail.com>       
*/
define(['N/record', 'N/log'], function(record, log) {

    function afterSubmit(context) {
        // Only run on create or edit
        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT) {
            return;
        }

        try {
            var associate_Dev_Record = context.newRecord;
            var checkboxValue = associate_Dev_Record.getValue('custrecord_az_tr_in_cust_fb');
            var customerId = 6; // e.g., fetched from associate_Dev_Record
            var productId = 1;  // e.g., fetched from related record
            var feedbackName = 'Feedback for Associate Andy';

            // Proceed only if checkbox is checked
            if (checkboxValue) {
                var associate_Dev_Id = associate_Dev_Record.id;

                log.debug('Checkbox checked. Creating Customer Feedback record.', {
                    associateId: associate_Dev_Id
                });

                // Create the Customer Feedback record
                var cust_feedback_Record = record.create({
                    type: 'customrecord_az_tr_cf_',
                    isDynamic: true
                });

                cust_feedback_Record.setValue({
                    fieldId: 'custrecord_az_tr_cf_cust', 
                    value: customerId 
                });

                cust_feedback_Record.setValue({
                    fieldId: 'custrecord_az_tr_cf_product', 
                    value: productId 
                });

                cust_feedback_Record.setValue({
                    fieldId: 'name', 
                    value: feedbackName 
                });

                // Save the feedback record
                var cust_feedback_Id = cust_feedback_Record.save();

                log.audit('Customer Feedback created', 'ID: ' + cust_feedback_Id);
            }

        } catch (e) {
            log.debug('Error in afterSubmit', e);
        }
    }

    return {
        afterSubmit: afterSubmit
    };

});