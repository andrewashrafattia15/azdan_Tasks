/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search','N/ui/serverWidget'], function (search,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const MyRecId = record.id;
                const recType = record.type;

                const vendorId = record.getValue("entity");
                const total = record.getValue("total");

                const primaryContact = getPrimaryContact(vendorId);
                const termsAndConditions = getTermsConditions(MyRecId,recType);
                const totalInWords = numberToEnglishWords(total);

                setData(primaryContact,termsAndConditions,totalInWords,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

   const getPrimaryContact = (vendorId) => {
        try {
            if (!vendorId) return "";

            const contact_search = search.create({
                type: "contact",
                filters: [
                    ["company", search.Operator.IS, vendorId],
                    "AND",
                    ["custentity_az_bas_cont_prim_contact", "is", "T"]
                ],
                columns: ["entityid"]
            }).run().getRange({ start: 0, end: 1 });

            if (contact_search && contact_search.length > 0) {
                return contact_search[0].getValue("entityid");
            }

            return " ";

        } catch (errorGetPrimaryContact) {
            log.debug("errorGetPrimaryContact", errorGetPrimaryContact);
        }
    };


    const getTermsConditions = (MyRecId) => {
        try {
            
            const searchTerms = search.create({
                type: 'customrecord_az_bas_terms_and_cond',
                columns: [
                    'custrecord_az_bas_tcon_term_type',
                    'custrecord_az_bas_tcon_description'
                ],
                filters: [
                    ['isinactive', search.Operator.IS, false], 'AND',
                    ['custrecord_az_bas_tcon_po_num', search.Operator.IS, MyRecId]
                ]
            });

            const searchResult = searchTerms.run().getRange({start:0 , end:1000});

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
    
    
    const setData = (primaryContact,termsAndConditions,totalInWords,context) => {
        try {
            
            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });
            
            
            const data = {
                primaryContact:primaryContact,
                termsAndConditions:termsAndConditions,
                totalInWords:totalInWords
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
            } catch (errorSetData) {
                log.debug("errorSetData",errorSetData)
            }
        };


        return {
            beforeLoad: beforeLoad
        };
    });
