/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {

    function beforeSubmit(context) {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                var new_sales_order = context.newRecord;
                var my_customer = new_sales_order.getValue('entity');

                if (my_customer) {
                    var customer_last_order = getLastSalesOrder(my_customer);

                    if (customer_last_order) {
                        updateCustomer(my_customer, customer_last_order.id, customer_last_order.date);
                        log.debug('Success', 'Updated Customer ' + my_customer + ' with the last sales order ' +
                            customer_last_order.id + ' of date ' + customer_last_order.date);
                    } else {
                        log.debug('Info', 'There is no sales order that is pending approval for the customer ' + my_customer);
                    }
                }
            }
        } catch (error) {
            log.error('Error in beforeSubmit', error);
        }
    }

    function getLastSalesOrder(customer_id) {
        var sales_order_search = search.create({
            type: search.Type.SALES_ORDER,
            filters: [
                ['entity', 'anyof', customer_id],
                'AND',
                ['status', 'anyof', ['pendingApproval']] 
            ],
            columns: [
                search.createColumn({ name: 'internalid', sort: search.Sort.DESC }),
                search.createColumn({ name: 'trandate' })
            ]
        });

        var result_search = sales_order_search.run().getRange({ start: 0, end: 1 });

        if (result_search && result_search.length > 0) {
            return {
                id: result_search[0].getValue('internalid'),
                date: result_search[0].getValue('trandate')
            };
        }
        return null;
    }

    function updateCustomer(my_customer, last_order_id, last_order_date) {
        record.submitFields({
            type: record.Type.CUSTOMER,
            id: my_customer,
            values: {
                custentity_az_tr_last_so_id: last_order_id,
                custentity_az_tr_last_so_date: last_order_date
            }
        });
    }

    return {
        beforeSubmit: beforeSubmit
    };

});
