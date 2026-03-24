/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search','N/ui/serverWidget'], function (record,search ,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const items = getItemsList(record.id);
                const bankData = getBankDetails();
                const customerAddress = getCustomerData(record.getValue('entity'));
                const dmos = record.getValue("custbody_az_pp_inv_relateddmo");
                const dmosData = getDMOsData(dmos); 


                setData(customerAddress,items,bankData,dmosData,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

    const getDMOsData = (dmos) =>{
        try {
            
            let totalCharged = 0;

            if (!dmos || !dmos.length) return {totalCharged:totalCharged};

            dmos.forEach(dmo => {

                const fields = search.lookupFields({
                    type: 'customrecord_az_pp_deliveredmo', 
                    id: dmo,
                    columns: [
                        'custrecord_az_pp_dmo_scenario',
                        'custrecord_az_pp_dmo_paymentamount'
                    ]
                });

               const scenario = fields.custrecord_az_pp_dmo_scenario?.[0]?.value;

                const amount = parseFloat(fields.custrecord_az_pp_dmo_paymentamount) || 0;

                if (["1","2","3"].includes(scenario?.toString())) {
                    totalCharged += amount ? parseFloat(amount) : 0;
                }
            });

        return {totalCharged:totalCharged};

        } catch (errorGetDMOsData) {
            log.debug('errorGetDMOsData',errorGetDMOsData)
        }
    }

    const getCustomerData = (custID) =>{
        try {
            
            const customerSearch = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: custID,
                columns: ['billaddress','billcountry']
            })

            let address = customerSearch.billaddress.replace(/\n/g, ',');
            let country = customerSearch.billcountry[0].text;

            return {address:address,country:country} ;

        } catch (errorGetCustomerData) {
            log.debug('errorGetCustomerData',errorGetCustomerData)
        }
    }
   

    const getItemsList = (invID) =>{
        try {
            let invoiceItems = [];
            const itemSearch = search.create({
                type: search.Type.INVOICE,
                filters: [
                    ['internalid', 'anyof', invID], 
                    'AND',
                    ['mainline', 'is', 'F'],
                    'AND',
                    ['taxline', 'is', 'F']
                ],
                columns: [
                    'item',      
                    'quantity',  
                    'rate',     
                    'amount',
                    search.createColumn({
                    name: 'rate',
                    join: 'taxitem'
                }),
                    'taxtotal',
                    'total'
                ]
            });

            itemSearch.run().each(function(result) {
                invoiceItems.push({
                    name: result.getText('item'),
                    qty: result.getValue('quantity'),
                    rate: result.getValue('rate'),
                    amount: result.getValue('amount'),
                    vat: result.getValue({ name: 'rate', join: 'taxitem' }),
                    taxAmount: result.getValue('taxtotal'),
                    total: result.getValue('total')
                });
                return true;
            });


            return invoiceItems ;

        } catch (errorGetItemsList) {
            log.debug('errorGetItemsList',errorGetItemsList)
        }
    }


    const getBankDetails = () =>{
        try {
            let bankData = [];
            const bankSearch = search.create({
                type: 'customrecord_az_pp_setup_printout',
                filters: [
                    ['internalid', 'anyof', '1'], 
                ],
                columns: [
                    'custrecord_az_pp_setup_printout_account',      
                    'custrecord_az_pp_setup_printout_bank',  
                    'custrecord_az_pp_setup_printout_acc_num',     
                    'custrecord_az_pp_setup_printout_iban',
                ]
            });

            bankSearch.run().each(function(result) {
                bankData.push({
                    name: result.getValue('custrecord_az_pp_setup_printout_account'),
                    bank: result.getValue('custrecord_az_pp_setup_printout_bank'),
                    number: result.getValue('custrecord_az_pp_setup_printout_acc_num'),
                    iban: result.getValue('custrecord_az_pp_setup_printout_iban'),
                });
            });

            return bankData ;

        } catch (errorGetItemsList) {
            log.debug('errorGetItemsList',errorGetItemsList)
        }
    }

    const setData = (customerAddress,items,bankData,dmosData,context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            const data = {
                customerAddress:customerAddress,
                items:items,
                bankData:bankData,
                dmosData:dmosData,
            };
            
            custrecord.defaultValue = JSON.stringify(data);
        };


        return {
            beforeLoad: beforeLoad
        };
    });
