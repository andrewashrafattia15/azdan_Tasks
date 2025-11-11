/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log', 'N/format'], (search, record, log, format) => {
  const DAYS_BACK = 15;
  const OLD_CUSTOMER_FIELD = 'custentity_az_tr_old_customer';

  /**
   * getInputData - retrieves all active customers in CUSTOMER stage
   */
  const getInputData = () => {
    log.audit('getInputData', 'Starting customer search');

    return search.create({
      type: search.Type.CUSTOMER,
      filters: [
        ['stage', 'anyof', 'CUSTOMER'], // Only actual customers
        'AND',
        ['isinactive', 'is', 'F'], // Only active ones
      ],
      columns: ['internalid'],
    });
  };

  /**
   * map - for each customer, check for recent Sales Orders and update the old customer flag
   */
  const map = (context) => {
    const result = JSON.parse(context.value);
    const customerId = result.id;

    log.audit('Processing Customer', `Customer ID: ${customerId}`);

    try {
      const hasRecentSO = hasRecentSalesOrder(customerId, DAYS_BACK);

      record.submitFields({
        type: record.Type.CUSTOMER,
        id: customerId,
        values: {
          [OLD_CUSTOMER_FIELD]: !hasRecentSO,
        },
      });

      log.audit('Customer Updated', `Customer ID ${customerId} - Old Customer set to ${!hasRecentSO}`);
    } catch (err) {
      log.error({
        title: 'Error Processing Customer',
        details: `Customer ID ${customerId}: ${err.name} - ${err.message}`,
      });
    }
  };

  /**
   * Check if customer has recent sales orders (within X days)
   */
  const hasRecentSalesOrder = (customerId, daysBack) => {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysBack);

      const formattedDate = format.format({
        value: dateThreshold,
        type: format.Type.DATE,
      });

      const soSearch = search.create({
        type: search.Type.SALES_ORDER,
        filters: [
          ['entity', 'anyof', customerId],
          'AND',
          ['trandate', 'onorafter', formattedDate],
        ],
        columns: ['internalid'],
      });

      const results = soSearch.run().getRange({ start: 0, end: 1 });

      log.debug('Sales Order Check', `Customer ${customerId} - SO found: ${results.length > 0}`);

      return results.length > 0;
    } catch (err) {
      log.error('Error in hasRecentSalesOrder', err.message || err);
      return false;
    }
  };

  /**
   * summarize - log totals and errors after script runs
   */
  const summarize = (summary) => {
    log.audit('Script Completed', 'Map/Reduce completed');

    if (summary.inputSummary.error) {
      log.error('Input Error', summary.inputSummary.error);
    }

    summary.mapSummary.errors.iterator().each((key, error) => {
      log.error('Map Error', `Customer ID ${key}: ${error}`);
      return true;
    });
      log.audit("Script Complete", {});

  };

  return {
    getInputData,
    map,
    summarize
  };
});
