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
                    
                } else {
                    
                    vendorId = Record.getValue('entity');
                    
                }

                const taxCode = Record.getValue('custrecord_ino_pm_contract_tax_code');
                const taxRateString = getTaxRate(taxCode);

                const {contractBOQ , subTotal} = getContractBOQ(MyRecId);
                setContractBOQValue(contractBOQ, taxRateString, context)
                
                let taxRate = 0;
                if (taxRateString) {
                    taxRate = parseFloat(taxRateString.replace('%', '')) / 100;
                }
                const total = (subTotal*taxRate)+subTotal;
                const numberInEnglish = numberToEnglishWords(total);
                
                
                setTotalInEnglishValue(numberInEnglish,context);

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

            arr = arr.map(item => {item.description = item.description? item.description.replace(/<[^>]*>/g, '').trim(): '';
                return item;
            });
            return arr;
            
        } catch (errGetTermsConditions) {
            log.debug('errGetTermsConditions', errGetTermsConditions)
        }
    }
    
    const numberToEnglishWords = (amount) => {
        try {
                const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
                const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
                const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
                const thousands = ["", "Thousand", "Million", "Billion"];
                
                const convert_hundreds = (num) => {
                    let result = "";
    
                    if (num > 99) {
                        let hundred = Math.floor(num / 100);
                        result += ones[hundred] + " Hundred";
                        num %= 100;
                        if (num > 0) result += " and ";
                    }
                    
                    if (num >= 10 && num < 20) {
                        result += teens[num - 10];
                    } else if (num >= 20) {
                        let t = Math.floor(num / 10);
                        let o = num % 10;
                        if (o > 0) result += tens[t] + "-" + ones[o];
                        else result += tens[t];
                    } else if (num > 0) {
                        result += ones[num];
                    }
                    
                    return result.trim();
                }
    
                const convert_number = (num) => {
                    if (num === 0) return "zero";
                    let parts = [];
                    let i = 0;
                    
                    while (num > 0) {
                    let n = num % 1000;
                    if (n > 0) {
                        let section = convert_hundreds(n);
                        if (i > 0) section += " " + thousands[i];
                        parts.unshift(section);
                    }
                    num = Math.floor(num / 1000);
                    i++;
                }
                
                return parts.join(", ");
            }
            

      
                let integerPart = Math.floor(amount);
                let decimalPart = Math.round((amount - integerPart) * 100);
                
                
                let words = convert_number(integerPart) + " ";
                words += "&amp; " + decimalPart + "/100";
                
                return words;
         
        } catch (errorNumberToEnglishWords) {
            log.debug("errorNumberToEnglishWords",errorNumberToEnglishWords);
        }
    }

    const getContractBOQ = (MyRecId) => {
        try {
            let subTotal = 0;
            const search = s.create({
                type: 'customrecord_ino_pm_contract_boq',
                columns: [
                    'custrecord_ino_pm_cboq_item',
                    'custrecord_ino_pm_cboq_uom',
                    'custrecord_ino_pm_cboq_qty',
                    'custrecord_ino_pm_cboq_rate',
                    'custrecord_ino_pm_cboq_description'

                ],
                filters: [
                    ['isinactive', s.Operator.IS, false], 'and',
                    ['custrecord_ino_pm_cboq_contract', s.Operator.IS, MyRecId]
                ]
            });

            const searchResult = getAllData(search);

            let contractBOQ = [];

            if (searchResult != null && searchResult != '') {

                for (row = 0; row < searchResult.length; row++) {

                    let item = searchResult[row].getValue('custrecord_ino_pm_cboq_item');
                    let uom = searchResult[row].getText('custrecord_ino_pm_cboq_uom');
                    let qty = searchResult[row].getValue('custrecord_ino_pm_cboq_qty');
                    let rate = searchResult[row].getValue('custrecord_ino_pm_cboq_rate');
                    let description = searchResult[row].getValue('custrecord_ino_pm_cboq_description');

                    subTotal += qty * rate ;

                    contractBOQ.push({
                        'item': item,
                        'uom': uom,
                        'qty': qty,
                        'rate': rate,
                        'description':description
                    });

                }

            }
            return {contractBOQ,subTotal};

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

    const setTotalInEnglishValue = (numberInEnglish, context) => {

        const custrecord = context.form.addField({
            id: 'custpage_total_in_english',
            type: serverWidget.FieldType.LONGTEXT,
            label: 'Text'
        });

        custrecord.defaultValue = numberInEnglish ;
        
    }

    const setTermsConditionsValue = (termsConditions, context) => {

        const custrecord = context.form.addField({
            id: 'custpage_terms_conditions',
            type: serverWidget.FieldType.LONGTEXT,
            label: 'Text'
        });

        custrecord.defaultValue = JSON.stringify(termsConditions);
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