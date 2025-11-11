/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log'], (search, record, log) => {

    const PERCENTAGE_INCREASE = 0.10; // 10% increase

    /**
     * GET INPUT DATA
     * Limit to first 1000 active non-inventory items for purchase (i.e., with a 'cost' value)
     */
    const getInputData = () => {
        return runLimitedItemSearch(1000);
    };

    /**
     * MAP STAGE
     * Reads current cost and calculates new cost with percentage increase
     */
    const map = (context) => {
        try {
            const result = JSON.parse(context.value);
            const itemId = result.id;
            const currentCost = parseFloat(result.values.cost) || 0;

            const newCost = calculateNewCost(currentCost);

            log.debug({
                title: `Map: Item ID ${itemId}`,
                details: `Old Cost: ${currentCost}, New Cost: ${newCost}`
            });

            context.write({
                key: itemId,
                value: newCost
            });

        } catch (e) {
            logError('Map Stage Error', e);
        }
    };

    /**
     * REDUCE STAGE
     * Loads the item and updates the cost (purchase price)
     */
    const reduce = (context) => {
        const itemId = context.key;
        const newCost = parseFloat(context.values[0]);

        try {
            const itemRec = record.load({
                type: record.Type.NON_INVENTORY_ITEM,
                id: itemId,
                isDynamic: false
            });

            itemRec.setValue({
                fieldId: 'cost', // Purchase Price field
                value: newCost
            });

            itemRec.save();

            log.audit({
                title: `Updated Item ${itemId}`,
                details: `Purchase Price updated to ${newCost}`
            });

        } catch (e) {
            logError(`Reduce Stage Error on Item ${itemId}`, e);
        }
    };

    /**
     * SUMMARIZE STAGE
     * Logs summary info and any errors
     */
    const summarize = (summary) => {
    try {
        // Log basic summary info
        log.audit('Summary', {
            totalKeysProcessed: summary.inputSummary.totalKeys
        });

        // Log map errors
        summary.mapSummary.errors.iterator().each(function (key, error) {
            log.error({
                title: `Map Error: ${key}`,
                details: error
            });
            return true;
        });

        // Log reduce errors
        summary.reduceSummary.errors.iterator().each(function (key, error) {
            log.error({
                title: `Reduce Error: ${key}`,
                details: error
            });
            return true;
        });
          log.audit("Script Complete", {});
    } catch (e) {
        log.error({
            title: 'Summary Error',
            details: e.message || JSON.stringify(e)
        });
    }
};



    const runLimitedItemSearch = (limit) => {
        const itemSearch = search.create({
            type: search.Type.NON_INVENTORY_ITEM,
            filters: [
                ['type', 'anyof', 'NonInvtPart'],
                'AND',
                ['isinactive', 'is', 'F'],
                'AND',
                ['cost', 'isnotempty', null] // ✅ Only items with purchase price
            ],
            columns: [
                'internalid',
                'cost',
                'itemid'
            ]
        });

        const results = itemSearch.run().getRange({ start: 0, end: limit });

        return results.map(result => ({
            id: result.id,
            values: {
                cost: result.getValue('cost'),
                itemid: result.getValue('itemid')
            }
        }));
    };

    /**
     * Calculates new cost with percentage increase
     */
    const calculateNewCost = (currentCost) => {
        return parseFloat((currentCost * (1 + PERCENTAGE_INCREASE)).toFixed(2));
    };

    /**
     * Logs errors uniformly
     
    const logError = (title, error) => {
        log.error({
            title: title,
            details: error.message || JSON.stringify(error)
        });
    };*/

    // Expose entry points
    return {
        getInputData,
        map,
        reduce,
        summarize
    };

});
