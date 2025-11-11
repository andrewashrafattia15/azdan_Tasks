/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/search', 'N/record', 'N/ui/message', 'N/currentRecord'], 
(search, record, message, currentRecord) => {

    const pageInit = () => {
          console.log('Client script loaded.');
    };

    const sumAmountDueForCustomer = () => {
        try {
            const customerRec = currentRecord.get();
            const customerId = customerRec.id;

            if (!customerId) {
                showMessage('Error', 'Customer ID not found.', message.Type.ERROR);
                return;
            }

            const invoiceSearch = search.create({
                type: search.Type.INVOICE,
                filters: [
                    ['customer', 'anyof', customerId],
                    'AND',
                    ['amountremainingtotalbox', 'greaterthan', 0]
                ],
                columns: [
                    search.createColumn({
                        name: 'amountremainingtotalbox',
                        summary: 'SUM'
                    })
                ]
            });

            const results = invoiceSearch.run().getRange({ start: 0, end: 1 });
            const totalDue = results.length > 0
                ? parseFloat(results[0].getValue({ name: 'amountremainingtotalbox', summary: 'SUM' })) || 0
                : 0;

            // Update the customer record
            record.submitFields({
                type: record.Type.CUSTOMER,
                id: customerId,
                values: {
                    custentity_az_tr_sum_amt_due: totalDue
                }
            });

            showMessage('Success', `Updated Total Amount Due: ${totalDue.toFixed(2)}`, message.Type.CONFIRMATION);

        } catch (error) {
            console.error('Error updating amount due:', error);
            showMessage('Error', error.message, message.Type.ERROR);
        }
    };

    const showMessage = (title, msg, type) => {
        message.create({
            title,
            message: msg,
            type
        }).show({ duration: 4000 });
    };

    return {
        pageInit,
        sumAmountDueForCustomer
    };
});
