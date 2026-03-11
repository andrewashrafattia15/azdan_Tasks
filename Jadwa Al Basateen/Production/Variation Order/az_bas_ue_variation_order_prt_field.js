/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record','N/ui/serverWidget','N/search'], function ( record,serverWidget,search) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const recID = record.id;

                
                
                const projectContract = record.getValue('custrecord_ino_pm_vo_contract');
                const projectContractData = getProjectContractData(projectContract);
                
                
                const taxRate = getTaxRate(projectContractData.taxcode);
                const subtotal = parseFloat(record.getValue('custrecord_ino_pm_vp_pcamount'))|| 0;

                const total = subtotal * (1 + taxRate);
                
                const totalInEnglishWords = numberToEnglishWords(total);


                setTotalInEnglishValue(totalInEnglishWords,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

    const getProjectContractData = (projectContract) =>{
        try {
            const projContData = search.lookupFields({
                type: "customrecord_ino_pm_project_contract",
                id: projectContract,
                columns: ['custrecord_ino_pm_contract_tax_code']
            });

            const taxcode = projContData.custrecord_ino_pm_contract_tax_code[0].value;
            return{
                taxcode : taxcode
            }
        } catch (errorGetProjectContractData) {
            log.debug("errorGetProjectContractData",errorGetProjectContractData);
        }
    }

    const getTaxRate = (taxCode) => {
        try {

            const taxData = search.lookupFields({
                type: search.Type.SALES_TAX_ITEM,
                id: taxCode,
                columns: ['rate']
            });

            const stringRate = taxData.rate ;
 
            if (stringRate) {
                taxRate = parseFloat(stringRate.replace('%','')) / 100;
            }

            return taxRate;

        } catch (errGetTaxRate) {
            log.debug('errGetTaxRate', errGetTaxRate)
        }
    }

    const setTotalInEnglishValue = (totalInEnglishWords, context) => {
        
        const custrecord = context.form.addField({
            id: 'custpage_total_in_english',
            type: serverWidget.FieldType.LONGTEXT,
            label: 'Text'
        });

        custrecord.defaultValue = totalInEnglishWords ;
        
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



        return {
            beforeLoad: beforeLoad
        };
    });
