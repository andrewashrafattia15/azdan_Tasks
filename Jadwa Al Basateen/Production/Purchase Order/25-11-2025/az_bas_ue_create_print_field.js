/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/ui/serverWidget'], function (s, serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const Record = context.newRecord;
                const MyRecId = Record.id;
                const recType = Record.type;
                
                let vendorId
                if (recType == 'customrecord_ino_pm_project_contract') {

                    vendorId = Record.getValue('custrecord_ino_pm_contract_vendor');
                    const taxCode = Record.getValue('custrecord_ino_pm_contract_tax_code');
                    const taxRate = getTaxRate(taxCode);
                    const contractBOQ = getContractBOQ(MyRecId);
                    log.debug('contractBOQ', contractBOQ)
                    setContractBOQValue(contractBOQ, taxRate, context)

                } else {

                    vendorId = Record.getValue('entity');

                }
                const data = getContactData(vendorId);
                const termsConditions = getTermsConditions(MyRecId, recType);

                setSearchValueInspection(data, context)
                setTermsConditionsValue(termsConditions, context)

            }
        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    }


    const getContactData = (vendorId) => {
        try {

            if (vendorId) {

                let search = s.create({
                    type: 'contact',
                    columns: [
                        'entityid',
                    ],
                    filters: [
                        ['isinactive', s.Operator.IS, false], 'and',
                        ['company', s.Operator.IS, vendorId]
                    ]
                }).run().getRange(0, 1);

                const contactName = search[0].getValue('entityid');

                return contactName;
            }

        } catch (errGetContactData) {
            log.debug('errGetContactData', errGetContactData)
        }
    }

    const getTermsConditions = (MyRecId, recType) => {
        try {
            let linkFieldId;

            if (recType == 'customrecord_ino_pm_project_contract') {
                linkFieldId = 'custrecord_az_bas_tcon_contract';
            } else {
                linkFieldId = 'custrecord_az_bas_tcon_po_num'
            }

            const search = s.create({
                type: 'customrecord_az_bas_terms_and_cond',
                columns: [
                    'custrecord_az_bas_tcon_term_type',
                    'custrecord_az_bas_tcon_description'
                ],
                filters: [
                    ['isinactive', s.Operator.IS, false], 'and',
                    [linkFieldId, s.Operator.IS, MyRecId]
                ]
            });

            const searchResult = getAllData(search);

            let arr = [];

            if (searchResult != null && searchResult != '') {

                for (row = 0; row < searchResult.length; row++) {

                    let termType = searchResult[row].getText('custrecord_az_bas_tcon_term_type');
                    let description = searchResult[row].getValue('custrecord_az_bas_tcon_description');

                    arr.push({
                        'termType': termType,
                        'description': description
                    })

                }

            }

            return arr;

        } catch (errGetTermsConditions) {
            log.debug('errGetTermsConditions', errGetTermsConditions)
        }
    }

    const getContractBOQ = (MyRecId) => {
        try {

            const search = s.create({
                type: 'customrecord_ino_pm_contract_boq',
                columns: [
                    'custrecord_ino_pm_cboq_item',
                    'custrecord_ino_pm_cboq_uom',
                    'custrecord_ino_pm_cboq_qty',
                    'custrecord_ino_pm_cboq_rate',

                ],
                filters: [
                    ['isinactive', s.Operator.IS, false], 'and',
                    ['custrecord_ino_pm_cboq_contract', s.Operator.IS, MyRecId]
                ]
            });

            const searchResult = getAllData(search);

            let arr = [];

            if (searchResult != null && searchResult != '') {

                for (row = 0; row < searchResult.length; row++) {

                    let item = searchResult[row].getValue('custrecord_ino_pm_cboq_item');
                    let uom = searchResult[row].getValue('custrecord_ino_pm_cboq_uom');
                    let qty = searchResult[row].getValue('custrecord_ino_pm_cboq_qty');
                    let rate = searchResult[row].getValue('custrecord_ino_pm_cboq_rate');

                    arr.push({
                        'item': item,
                        'uom': uom,
                        'qty': qty,
                        'rate': rate,
                    });

                }

            }

            return arr;

        } catch (errGetContractBOQ) {
            log.debug('errGetContractBOQ', errGetContractBOQ)
        }
    }

    const getTaxRate = (taxCode) => {
        try {

            const search = s.create({
                type: 'salestaxitem',
                columns: [
                    'itemid',
                    'rate',
                ],
                filters: [
                    ['isinactive', s.Operator.IS, false], 'and',
                    ['internalid', s.Operator.IS, taxCode]
                ]
            }).run().getRange(0, 1);

            const taxRate = search[0].getValue('rate');

            return taxRate;

        } catch (errGetTaxRate) {
            log.debug('errGetTaxRate', errGetTaxRate)
        }
    }

    const setSearchValueInspection = (columns, context) => {

        const custrecord = context.form.addField({
            id: 'custpage_custrecord_to_print',
            type: serverWidget.FieldType.LONGTEXT,
            label: 'Text'
        });

        custrecord.defaultValue = JSON.stringify(columns);

    }

    const setTermsConditionsValue = (columns, context) => {

        const custrecord = context.form.addField({
            id: 'custpage_terms_conditions',
            type: serverWidget.FieldType.LONGTEXT,
            label: 'Text'
        });

        custrecord.defaultValue = JSON.stringify(columns);

    }

    const setContractBOQValue = (columns, taxRate, context) => {

        const custrecord = context.form.addField({
            id: 'custpage_contract_boq',
            type: serverWidget.FieldType.LONGTEXT,
            label: 'Text'
        });

        custrecord.defaultValue = JSON.stringify(columns);


        const custrecord2 = context.form.addField({
            id: 'custpage_contract_boq_tax_rate',
            type: serverWidget.FieldType.LONGTEXT,
            label: 'Tax Rate'
        });

        custrecord2.defaultValue = taxRate;

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
        
        } catch (errGetAllData) {
            log.debug('errGetAllData', errGetAllData)
        }
    }

    return {
        beforeLoad: beforeLoad
    }

})