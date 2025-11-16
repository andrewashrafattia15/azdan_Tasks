/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/ui/serverWidget'], function(search, serverWidget) {

    const beforeLoad = (context) => {
        try {
            if (context.type === context.UserEventType.PRINT) {

                const Record = context.newRecord;
                const recId = Record.id;

                let data = [];

                const tuitionIntallmentDetails = getTuitionIntallmentDetails(recId);

                for (let i = 0; i < tuitionIntallmentDetails.length; i++) {

                    const name = tuitionIntallmentDetails[i].name;
                    const description = tuitionIntallmentDetails[i].description;
                    const totalAmount = tuitionIntallmentDetails[i].totalAmount;
                    const status = tuitionIntallmentDetails[i].status;
                    const outStandingAmount = tuitionIntallmentDetails[i].outStandingAmount;

                    data.push({
                        'name':name,
                        'description':description,
                        'totalAmount':totalAmount,
                        'status':status,
                        'outStandingAmount':outStandingAmount
                    });
                }

                setSearchValueInspection(data, context);

            }
        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    }

    const getTuitionIntallmentDetails = (recId)=>{
        try {

            let data = [];

            const recSearch = search.create({
                type: 'customrecord_az_acs_tuition_installment',
                filters: [
                    ['custrecord_az_acs_sales_order', search.Operator.IS, recId]
                ],
                columns: [
                    'name',
                    'custrecord_az_acs_installment_descriptio',
                    'custrecord_az_acs_total_amount',
                    'custrecord_az_acs_status',
                    'custrecord_az_acs_amount_remaining'
                ],
            });

            const searchResult = getAllData(recSearch);

            if (searchResult != null && searchResult != '') {

                for (let i = 0; i < searchResult.length; i++) {
                    
                    const name = searchResult[i].getValue('name');
                    const description = searchResult[i].getValue('custrecord_az_acs_installment_descriptio');
                    const totalAmount = searchResult[i].getValue('custrecord_az_acs_total_amount');
                    const status = searchResult[i].getText('custrecord_az_acs_status');
                    const outStandingAmount = searchResult[i].getValue('custrecord_az_acs_amount_remaining');

                    data.push({
                        'name':name,
                        'description':description,
                        'totalAmount':totalAmount,
                        'status':status,
                        'outStandingAmount':outStandingAmount
                    });
                }
            }

             return data;
        } catch (errorgetItemDetails) {
            log.debug('errorgetItemDetails',errorgetItemDetails)
        }
    }

    const getAllData = (rs) => {
        try {

            var results = rs.run();
            var searchResults = [];
            var searchid = 0;
            do {
                var resultslice = results.getRange({ start: searchid, end: searchid + 1000 });
                resultslice.forEach(function (slice) {
                    searchResults.push(slice);
                    searchid++;
                });
            } while (resultslice.length >= 1000);
            return searchResults;

        } catch (error) {
            log.debug({
                title: 'error in get all data',
                details: error
            });
        }
    }

    const setSearchValueInspection = (items, context) => {

        try {
            
            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });
    
            custrecord.defaultValue = JSON.stringify(items);

        } catch (errSetSearchValueInspection) {
            log.debug('errSetSearchValueInspection', errSetSearchValueInspection);
        }


    }

    return {
        beforeLoad: beforeLoad,
    }
});
