/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/log','N/record'], (serverWidget, log, record) => {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            const form = serverWidget.createForm({ title: 'Customer Feedback Form' });

            const imageField = form.addField({
                id: 'custpage_banner',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });
            imageField.updateLayoutType({
                layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
            });
            imageField.defaultValue = `
                <div style="text-align:center; padding-bottom: 30px;">
                    <img src="https://<your-account>.app.netsuite.com/core/media/media.nl?id=1234&c=1234567&h=abcd1234" 
                         alt="Feedback Banner" 
                         style="max-width: 100%; height: auto; border-radius: 8px;" />
                </div>
            `;


            const customerField = form.addField({
                id: 'custpage_customer',
                type: serverWidget.FieldType.SELECT,
                label: 'Select Customer',
                source: 'customer'
            });
            customerField.isMandatory = true;


            const feedbackField = form.addField({
                id: 'custpage_feedback',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Your Feedback'
            });
            feedbackField.isMandatory = true;

            
            const ratingField = form.addField({
                id: 'custpage_rating',
                type: serverWidget.FieldType.SELECT,
                label: 'Rating (1 = Bad, 5 = Excellent)'
            });

            ratingField.addSelectOption({ value: '', text: '--Select--' });

            for (let i = 1; i <= 5; i++) {
                ratingField.addSelectOption({ value: String(i), text: String(i) });
            }
            ratingField.isMandatory = true;


            const dateField = form.addField({
                id: 'custpage_date',
                type: serverWidget.FieldType.DATE,
                label: 'Date of Experience'
            });


            const recommendField = form.addField({
                id: 'custpage_recommend',
                type: serverWidget.FieldType.SELECT,
                label: 'Would you recommend us?'
            });
            recommendField.addSelectOption({ value: '', text: '--Select--' });
            recommendField.addSelectOption({ value: 'yes', text: 'Yes' });
            recommendField.addSelectOption({ value: 'no', text: 'No' });
            recommendField.isMandatory = true;


            form.addSubmitButton({ label: 'Submit Feedback' });

            context.response.writePage(form);

       } else {
                const req = context.request;

                const customerId = req.parameters.custpage_customer;
                const feedback = req.parameters.custpage_feedback;
                const rating = req.parameters.custpage_rating;
                const experienceDate = req.parameters.custpage_date;
                const recommend = req.parameters.custpage_recommend;

                try {
                    const feedbackRecord = record.create({
                        type: 'customrecord_az_tr_cf_', // Replace with your custom record ID
                        isDynamic: true
                    });
                    
                    let customerName = '';

                    if (!isNaN(customerId)) {
                        const customerRec = record.load({
                            type: record.Type.CUSTOMER,
                            id: customerId
                        });

                        customerName = customerRec.getValue({ fieldId: 'firstname' }); // Or 'altname'
                    }

                    feedbackRecord.setValue({
                        fieldId: 'name', // Replace with your field IDs
                        value: customerName
                    });

                    feedbackRecord.setValue({
                        fieldId: 'custrecordaz_tr_cf_comm',
                        value: feedback
                    });

                    feedbackRecord.setValue({
                        fieldId: 'custrecordaz_tr_cf_rating',
                        value: parseInt(rating)
                    });

                    if (experienceDate) {
                        feedbackRecord.setValue({
                            fieldId: 'created',
                            value: new Date(experienceDate)
                        });
                    }

                    /*feedbackRecord.setValue({
                        fieldId: 'custrecord_cf_recommend',
                        value: recommend
                    });*/

                    const feedbackId = feedbackRecord.save({
                                         ignoreMandatoryFields: true
                    });

                    log.audit('Customer Feedback Saved', `Record ID: ${feedbackId}`);

                } catch (e) {
                    log.error('Error saving feedback', e);
                }

                const form = serverWidget.createForm({ title: 'Thank You!' });
                form.addField({
                    id: 'custpage_thankyou',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: ' '
                }).defaultValue = `
                    <h2 style="color: green;">Thank you for your feedback!</h2>
                    <p><strong>Rating:</strong> ${rating}/5</p>
                    <p><strong>Recommendation:</strong> ${recommend === 'yes' ? 'Yes' : recommend === 'no' ? 'No' : 'Not selected'}</p>
                    <p><strong>Date of Experience:</strong> ${experienceDate || 'Not provided'}</p>
                `;

                context.response.writePage(form);
            }
    }

    return { onRequest };
});
