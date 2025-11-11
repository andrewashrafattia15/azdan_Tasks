/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(['N/currentRecord'], (currentRecord) => {

    const fieldChanged = (context) => {
        const sales_order_record = context.currentRecord;

        // If user updates the header-level second discount field
        if (context.fieldId === 'custbody_az_tr_sec_dis') {
            const lineCount = sales_order_record.getLineCount({ sublistId: 'item' });

            const secondDiscount = parseFloat(sales_order_record.getValue({
                fieldId: 'custbody_az_tr_sec_dis'
            })) || 0;
            const discountDecimal = secondDiscount / 100;

            for (let i = 0; i < lineCount; i++) {
                const rate = parseFloat(sales_order_record.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    line: i
                })) || 0;

                const quantity = parseFloat(sales_order_record.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                })) || 0;

                const amount = rate * quantity;
                const discountAmount = amount * discountDecimal;
                const finalAmount = amount - discountAmount;

                sales_order_record.selectLine({
                    sublistId: 'item',
                    line: i
                });

                sales_order_record.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_az_tr_amount_after_2nd_disc',
                    value: finalAmount.toFixed(2)
                });

                sales_order_record.commitLine({
                    sublistId: 'item'
                });

            }
        }

        // Original logic: user is changing values inside the item sublist
        if (context.sublistId === 'item') {
            const rate = parseFloat(sales_order_record.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate'
            })) || 0;

            const quantity = parseFloat(sales_order_record.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity'
            })) || 0;

            const secondDiscount = parseFloat(sales_order_record.getValue({
                fieldId: 'custbody_az_tr_sec_dis'
            })) || 0;

            const discountDecimal = secondDiscount / 100;
            const amount = rate * quantity;
            const discountAmount = amount * discountDecimal;
            const finalAmount = amount - discountAmount;

            sales_order_record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_az_tr_amount_after_2nd_disc',
                value: finalAmount.toFixed(2)
            });
        }
    };

    return { fieldChanged };
});
