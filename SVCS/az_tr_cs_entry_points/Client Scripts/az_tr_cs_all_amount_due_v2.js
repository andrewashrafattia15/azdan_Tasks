/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(['N/search', 'N/record', 'N/currentRecord'], (search, record, currentRecord) => {

    const sumAmountDueForCustomer = () => {
        try {
           // alert("Button clicked");

            const currentRec = currentRecord.get();
            const customerId = currentRec.id;

            if (!customerId) {
                alert(' No customer ID found');
                return;
            }

            let totalDue = 0;

            const invoiceSearch = search.create({
                type: search.Type.INVOICE,
                filters: [
                    ['entity', 'is', customerId],
                    'AND',
                    ['status', 'anyof', 'CustInvc:A'] // status: Open
                ],
                columns: ['amountremaining']
            });

            invoiceSearch.run().each(result => {
                const due = parseFloat(result.getValue('amountremaining')) || 0;
                totalDue += due;
                //return true;
            });

            const customerRecord = record.load({
                type: record.Type.CUSTOMER,
                id: customerId,
                isDynamic: true
             //   formId: currentRec.getValue({ fieldId: 'customform' })
            });

            customerRecord.setValue({
                fieldId: 'custentity_az_tr_sum_amt_due',
                value: totalDue
            });

            customerRecord.save();

            location.reload();
         //   alert(`Updated: $${totalDue.toFixed(2)}`);
        } catch (e) {
            console.error('Error:', e);
            alert('Error: ' + e.message);
        }
    };

    const pageInit = () => {
        
    };

    return {
        pageInit,
        sumAmountDueForCustomer
    };
});
