/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], function () {
    function fieldChanged(context) {
        const { fieldId, sublistId, line, currentRecord } = context;

       // console.log('fieldChanged triggered:', fieldId, line, sublistId);

        if (sublistId !== 'custpage_invoice_list') return;
        if (fieldId !== 'select' && fieldId !== 'amount_to_pay') return;

        // For the current line being changed
        let amountToPayCurrentLine = 0;
        try {
            amountToPayCurrentLine = parseFloat(currentRecord.getCurrentSublistValue({
                sublistId,
                fieldId: 'amount_to_pay',
                line
            })) || 0;
        } catch (e) {
            console.log('Error getting current amount_to_pay on changed line:', e);
        }

        const amountRemainingCurrentLine = parseFloat(currentRecord.getCurrentSublistValue({
            sublistId,
            fieldId: 'amount_remaining',
            line
        })) || 0;

        // If user changed amount_to_pay and it's greater than remaining
        if (fieldId === 'amount_to_pay' && amountToPayCurrentLine > amountRemainingCurrentLine) {
            alert('Amount to Pay cannot be greater than Amount Remaining.');
            currentRecord.setCurrentSublistValue({
                sublistId,
                fieldId: 'amount_to_pay',
                line,
                value: 0
            });
            amountToPayCurrentLine = 0;
        }

        // Now recalc totals across all lines
        let totalSelected = 0;
        let totalToPay = 0;
        const lineCount = currentRecord.getLineCount({ sublistId });

        for (let i = 0; i < lineCount; i++) {
            // For each line, determine if selected
            let isChecked = false;
            if (i === line) {
                // use current sublist value for changed line
                const v = currentRecord.getCurrentSublistValue({
                    sublistId,
                    fieldId: 'select',
                    line
                });
                isChecked = (v === 'T' || v === true);
            } else {
                const v = currentRecord.getSublistValue({
                    sublistId,
                    fieldId: 'select',
                    line: i
                });
                isChecked = (v === 'T' || v === true);
            }

            const amtRemaining = parseFloat(currentRecord.getSublistValue({
                sublistId,
                fieldId: 'amount_remaining',
                line: i
            })) || 0;

            let amtToPay = 0;
            if (i === line) {
                // current line changed
                amtToPay = amountToPayCurrentLine;
            } else {
                amtToPay = parseFloat(currentRecord.getSublistValue({
                    sublistId,
                    fieldId: 'amount_to_pay',
                    line: i
                })) || 0;
            }

          //  console.log(`Line ${i}: isChecked=${isChecked}, amtRemaining=${amtRemaining}, amtToPay=${amtToPay}`);

            if (isChecked) {
                totalSelected += amtRemaining;
                totalToPay += amtToPay;
            }
        }

    //    console.log(`Updating totals: totalSelected=${totalSelected}, totalToPay=${totalToPay}`);

        currentRecord.setValue({
            fieldId: 'custpage_total_selected',
            value: parseFloat(totalSelected.toFixed(2))
        });

        currentRecord.setValue({
            fieldId: 'custpage_total_to_pay',
            value: parseFloat(totalToPay.toFixed(2))
        });
    }

    return {
        fieldChanged
    };
});
