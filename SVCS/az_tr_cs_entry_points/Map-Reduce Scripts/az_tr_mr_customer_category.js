/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/log', 'N/query', 'N/search'], (record, log, query, search) => {

    /**
     * Get current quarter (for info only)
     */
    function getQuarterDates() {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            const quarter = Math.floor(month / 3) + 1;
        return { year, quarter };
        } catch (error) {
            log.debug('error from getQuarterDates',error);
        }
    }

    /**
     * Decide category by total amount
     */
    function getCategoryByAmount(amount) {
        try {

            if (amount === 0) return 5;                   // Iron
            if (amount > 0 && amount <= 2000) return 6;   // Bronze
            if (amount > 2000 && amount <= 5000) return 7; // Silver
            return 8;                                     // Gold

        } catch (error) {
             log.debug('error from getCategoryByAmount',error);
        }
    }

    /**
     * Input stage – fetch all customers with their total sales, plus customers without sales
     */
    function getInputData() {
        try {
            // 1️⃣ SuiteQL to get customers with sales
            const sql = `
                SELECT 
                    TRANSACTION.entity AS customer_id,
                    SUM(TRANSACTION.foreigntotal) AS total_amount
                FROM 
                    TRANSACTION, transactionLine
                WHERE 
                    TRANSACTION.id = transactionLine.transaction
                    AND TRANSACTION.type = 'SalesOrd'
                    AND TRANSACTION.createddate BETWEEN
                        BUILTIN.RELATIVE_RANGES('TFQTD','START','DATETIME_AS_DATE')
                        AND BUILTIN.RELATIVE_RANGES('TFQTD','END','DATETIME_AS_DATE')
                    AND TRANSACTION.status IN ('SalesOrd:G','SalesOrd:D','SalesOrd:A','SalesOrd:F','SalesOrd:E','SalesOrd:B')
                    AND transactionLine.mainline = 'T'
                GROUP BY TRANSACTION.entity
            `;
            const resultSet = query.runSuiteQL({ query: sql });
            const salesResults = resultSet.asMappedResults(); // Converts each row of the results into a JavaScript object.

            // Convert to a map for quick lookup
            const salesMap = {};
            salesResults.forEach(row => {
                salesMap[row.customer_id] = parseFloat(row.total_amount) || 0;
            });

            // 2️⃣ Fetch all active customers
            const allCustomers = [];
            search.create({
                type: search.Type.CUSTOMER,
                filters: [['isinactive', 'is', 'F']],
                columns: ['internalid']
            }).run().each(result => {
                const custId = result.getValue('internalid');
                const totalAmount = salesMap[custId] || 0;          // default 0 if no sales
                allCustomers.push({ customer_id: custId, total_amount: totalAmount });
                return true;
            }); 

            log.debug('Total Customers to Process', allCustomers.length);
            return allCustomers;

        } catch (e) {
            log.debug('Error in getInputData', e);
        }
    }

    /**
     * Map stage – pass customer data
     */
    function map(context) {
        try {
            const row = JSON.parse(context.value);
            context.write({
                key: row.customer_id,
                value: row.total_amount
            });
        } catch (e) {
            log.error('Error in map stage', e);
        }
    }

    /**
     * Reduce stage – create custom record and update customer field
     */
    function reduce(context) {
        try {
            const { year, quarter } = getQuarterDates();

            const customerId = context.key;
            const totalAmount = parseFloat(context.values[0]) || 0;
            const categoryId = getCategoryByAmount(totalAmount);

            // Lookup customer name safely
            let customerName = 'Customer ' + customerId;
            try {
                const customerLookup = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: customerId,
                    columns: ['altname']
                });
                if (customerLookup.altname) customerName = customerLookup.altname;
            } catch (lookupErr) {
                log.error('Customer Lookup Failed', lookupErr);
            }

            // Create custom quarterly record
            const rec = record.create({
                type: 'customrecord_az_tr_cust_qrt_cat',
                isDynamic: true
            });

            rec.setValue({ fieldId: 'name', value: customerName });
            rec.setValue({ fieldId: 'custrecord_az_tr_customer', value: customerId });
            rec.setValue({ fieldId: 'custrecord_az_tr_year', value: year });
            rec.setValue({ fieldId: 'custrecord_az_tr_qrt_of_the_year', value: quarter });
            rec.setValue({ fieldId: 'custrecord_az_tr_customer_category', value: categoryId });

            const recId = rec.save();
            log.debug('Custom Record Created',
                `ID: ${recId}, Customer: ${customerName}, Category: ${categoryId}, Amount: ${totalAmount}`
            );

            // Update customer category field
            record.submitFields({
                type: record.Type.CUSTOMER,
                id: customerId,
                values: { custentity_az_tr_customer_class: categoryId }
            });

        } catch (e) {
            log.error('Error in reduce stage', e);
        }
    }

    /**
     * Summarize stage
     */
    function summarize(summary) {
        try {
            if (summary.output) {
                summary.output.iterator().each((key, value) => {
                    log.debug('Summary', `Customer ${key} processed with value ${value}`);
                    return true;
                });
            }

            if (summary.errors) {
                summary.errors.iterator().each((key, error) => {
                    log.error('Summarize Error', `Customer ${key}: ${error}`);
                    return true;
                });
            }
        } catch (e) {
            log.error('Error in summarize stage', e);
        }
    }

    return { getInputData, map, reduce, summarize };
});
