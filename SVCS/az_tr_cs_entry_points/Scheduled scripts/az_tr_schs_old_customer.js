/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(["N/search", "N/record", "N/log", "N/format"], (search, record, log, format) => {
  const MAX_CUSTOMERS = 20; // Number of customers to process per run
  const DAYS_BACK = 15; // Days to check for recent Sales Orders
  const OLD_CUSTOMER_FIELD = "custentity_az_tr_old_customer"; // Custom checkbox field ID

  const execute = () => {
    try {
      log.audit("Script Start", `Starting to process up to ${MAX_CUSTOMERS} customers`);

      const customers = getCustomersToProcess(MAX_CUSTOMERS);

      if (!customers || customers.length === 0) {
        log.audit("No Customers Found", "No customers to process.");
        return;
      }

      customers.forEach((customer) => {
        const customerId = customer.id;
        log.audit("Processing Customer", `Customer ID: ${customerId}`);

        try {
          const hasRecentSO = hasRecentSalesOrder(customerId, DAYS_BACK);

          record.submitFields({
            type: record.Type.CUSTOMER,
            id: customerId,
            values: {
              [OLD_CUSTOMER_FIELD]: !hasRecentSO,
            },
          });

          log.audit(
            "Customer Updated",
            `Customer ID ${customerId} - Old Customer set to ${!hasRecentSO}`
          );
        } catch (innerErr) {
          log.error({
            title: "Customer Processing Error",
            details: `Customer ID ${customerId} - ${innerErr.name}: ${innerErr.message}`,
          });
        }
      });

      log.audit("Script Complete", `Processed ${customers.length} customers`);
    } catch (e) {
      log.error("Fatal Script Error", e.message || e);
    }
  };

  const getCustomersToProcess = (limit) => {
    try {
      const customerSearch = search.create({
        type: search.Type.CUSTOMER,
        filters: [
          ["stage", "anyof", "CUSTOMER"], // Only real customers
          "AND",
          ["isinactive", "is", "F"], // Only active
        ],
        columns: ["internalid"],
      });

      return customerSearch.run().getRange({ start: 0, end: limit }) || [];
    } catch (e) {
      log.error("Customer Search Failed", e.message || e);
      return [];
    }
  };

  const hasRecentSalesOrder = (customerId, daysBack) => {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysBack);

      const formattedDate = format.format({
        value: dateThreshold,
        type: format.Type.DATE,
      });

      log.debug("Formatted Date Threshold", formattedDate);

      const soSearch = search.create({
        type: search.Type.SALES_ORDER,
        filters: [
          ["entity", "anyof", customerId],
          "AND",
          ["trandate", "onorafter", formattedDate],
        ],
        columns: ["internalid"],
      });

      const results = soSearch.run().getRange({ start: 0, end: 1 });

      log.debug("Sales Order Results", results.length);

      return results.length > 0;
    } catch (e) {
      log.error("Error in hasRecentSalesOrder", e.message || e);
      return false;
    }
  };

  return {
    execute,
  };
});
