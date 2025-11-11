/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/redirect'], function (ui, search, record, redirect) {
    function onRequest(context) {
        const request = context.request;
        const response = context.response;

        if (request.method === 'GET') {
            const customerId = request.parameters.custid;

            const form = ui.createForm({ title: 'Make A Payment' });

            form.addField({
                id: 'custpage_customer_id',
                type: ui.FieldType.TEXT,
                label: 'Customer ID'
            }).defaultValue = customerId;

            // Add sublist for open invoices
            const sublist = form.addSublist({
                id: 'custpage_invoice_list',
                type: ui.SublistType.INLINEEDITOR,
                label: 'Open Invoices'
            });

            sublist.addField({ id: 'select', type: ui.FieldType.CHECKBOX, label: 'Select' });
            sublist.addField({ id: 'invoice_id', type: ui.FieldType.TEXT, label: 'Invoice ID' });
            sublist.addField({ id: 'tran_date', type: ui.FieldType.DATE, label: 'Date' });
            sublist.addField({ id: 'due_date', type: ui.FieldType.DATE, label: 'Due Date' });
            sublist.addField({ id: 'amount_remaining', type: ui.FieldType.CURRENCY, label: 'Amount Remaining' });
            sublist.addField({ id: 'total', type: ui.FieldType.CURRENCY, label: 'Total Amount' });
            sublist.addField({ id: 'taxes', type: ui.FieldType.CURRENCY, label: 'Taxes' });

            sublist.addField({
                id: 'amount_to_pay',
                type: ui.FieldType.CURRENCY,
                label: 'Amount to Pay'
            }).updateDisplayType({ displayType: ui.FieldDisplayType.ENTRY });

            // Search open invoices
            const invoiceSearch = search.create({
                type: 'invoice',
                filters: [
                    ['entity', 'is', customerId],
                    'AND',
                    ['status', 'anyof', 'CustInvc:A'], // Open invoices
                    'AND',
                    ['amountremaining', 'greaterthan', 0]
                ],
                columns: ['internalid', 'trandate', 'duedate', 'amountremaining', 'total', 'taxtotal']
            });

            let i = 0;
            invoiceSearch.run().each(function (result) {
                sublist.setSublistValue({
                    id: 'invoice_id',
                    line: i,
                    value: result.getValue('internalid') || ''
                });
                sublist.setSublistValue({
                    id: 'tran_date',
                    line: i,
                    value: result.getValue('trandate') || ''
                });
                sublist.setSublistValue({
                    id: 'due_date',
                    line: i,
                    value: result.getValue('duedate') || ''
                });
                sublist.setSublistValue({
                    id: 'amount_remaining',
                    line: i,
                    value: result.getValue('amountremaining') || '0.00'
                });
                sublist.setSublistValue({
                    id: 'total',
                    line: i,
                    value: result.getValue('total') || '0.00'
                });
                sublist.setSublistValue({
                    id: 'taxes',
                    line: i,
                    value: result.getValue('taxtotal') || '0.00'
                });
                i++;
                return true;
            });

            // Totals display fields
            form.addField({
                id: 'custpage_total_selected',
                label: 'Total of Selected Invoices',
                type: ui.FieldType.CURRENCY
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });

            form.addField({
                id: 'custpage_total_to_pay',
                label: 'Total Amount to Pay',
                type: ui.FieldType.CURRENCY
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });

            // Attach client script for calculations
            form.clientScriptModulePath = 'SuiteScripts/andrew_ashraf/az_tr_cs_calculate_totals.js';

            // Submit button
            form.addSubmitButton({ label: 'Pay' });

            response.writePage(form);

        } else if (request.method === 'POST') {
            const numLines = request.getLineCount({ group: 'custpage_invoice_list' });
            const customerId = request.parameters.custpage_customer_id;

            // Load customer record to get currency (to avoid currency mismatch errors)
            const customerRecord = record.load({
                type: record.Type.CUSTOMER,
                id: customerId
            });

            const customerCurrency = customerRecord.getValue('currency');

            const paymentRecord = record.create({
                type: 'customerpayment',
                isDynamic: true
            });

            paymentRecord.setValue({
                fieldId: 'customer',
                value: customerId
            });

            // Set currency to customer's currency (avoid foreign currency errors)
            if (customerCurrency) {
                paymentRecord.setValue({
                    fieldId: 'currency',
                    value: customerCurrency
                });
            }

           /* const accountId = 123; 
            paymentRecord.setValue({
                fieldId: 'account',
                value: accountId
            });*/

            // Loop through the submitted invoices and apply payments
            const applyLineCount = paymentRecord.getLineCount({ sublistId: 'apply' });

            for (let i = 0; i < numLines; i++) {
                const selected = request.getSublistValue({
                    group: 'custpage_invoice_list',
                    name: 'select',
                    line: i
                });
                const invoiceId = request.getSublistValue({
                    group: 'custpage_invoice_list',
                    name: 'invoice_id',
                    line: i
                });
                const amountToPay = parseFloat(request.getSublistValue({
                    group: 'custpage_invoice_list',
                    name: 'amount_to_pay',
                    line: i
                })) || 0;

                if ((selected === 'T' || selected === true) && invoiceId && amountToPay > 0) {
                    // Find matching invoice line in the 'apply' sublist and apply payment
                    for (let j = 0; j < applyLineCount; j++) {
                        const docId = paymentRecord.getSublistValue({
                            sublistId: 'apply',
                            fieldId: 'doc',
                            line: j
                        });

                        if (docId == invoiceId) {
                            paymentRecord.selectLine({ sublistId: 'apply', line: j });

                            paymentRecord.setCurrentSublistValue({
                                sublistId: 'apply',
                                fieldId: 'apply',
                                value: true
                            });

                            paymentRecord.setCurrentSublistValue({
                                sublistId: 'apply',
                                fieldId: 'amount',
                                value: amountToPay
                            });

                            paymentRecord.commitLine({ sublistId: 'apply' });
                            break;
                        }
                    }
                }
            }

            // Save with ignoring mandatory fields 
            const paymentId = paymentRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            redirect.toRecord({
                type: 'customerpayment',
                id: paymentId
            });
        }
    }

    return {
        onRequest
    };
});
