/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record','N/ui/serverWidget', 'N/file', 'N/url'], function ( record,serverWidget, file, url) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const recID = record.id;
                const subsidiaryID = record.getValue('custrecord_az_pdc_chq_subsidiary');
                const total = record.getValue('custrecord_az_pdc_chq_amount');
                const currency = record.getText('custrecord_az_pdc_chq_currency');

                const totalInEnglishWords = numberToEnglishWords(total,currency);

                const subsidiaryData = getSubsidiaryData(subsidiaryID);

                setData(totalInEnglishWords,subsidiaryData,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

    const getSubsidiaryData = (subsidiaryID) => {

        const emptySubsidiaryData = {
            subAddress: '',
        };

        try {
            if (!subsidiaryID) return emptySubsidiaryData;

            
            const subsidiaryRec = record.load({
                type: record.Type.SUBSIDIARY,
                id: subsidiaryID
            });

            const logoFileId = subsidiaryRec.getValue('logo');

             let logoUrl = '';

            if (logoFileId) {
                const logoFile = file.load({
                    id: logoFileId
                });

                const baseUrl = 'https://' + url.resolveDomain({
                    hostType: url.HostType.APPLICATION
                });

                logoUrl = baseUrl + logoFile.url;
            }

            const subsidiaryAddress = subsidiaryRec.getText({
                fieldId: 'mainaddress_text'
            });


            return {
                logoUrl: logoUrl,
                subAddress: subsidiaryAddress,
            };


        } catch (errorGetSubsidiaryData) {
            log.debug('errorGetSubsidiaryData', errorGetSubsidiaryData);
            return emptySubsidiaryData;
        }
    };

     const numberToEnglishWords = (amount,currency) => {
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
        if(currency == "SAR"){
            words += "Riyal";
            if (decimalPart > 0) {
                words += " and " + convert_number(decimalPart) + " Halala only";
            }   
        }
        else if(currency == "USD"){
            words += "Dollar";
            if (decimalPart > 0) {
                words += " and " + convert_number(decimalPart) + " Cent only";
            }  
        }
        else if(currency == "AED"){
            words += " Dirham";
            if (decimalPart > 0) {
                words += " and " + convert_number(decimalPart) + " Fils only";
            }  
        }
        return words;
        } catch (errorNumberToEnglishWords) {
            log.debug("errorNumberToEnglishWords",errorNumberToEnglishWords);
        }
    }

    const setData = (totalInEnglishWords,subsidiaryData,context) => {


            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            
            const data = {
                totalInEnglishWords:totalInEnglishWords,
                subsidiaryData:subsidiaryData
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
        };


        return {
            beforeLoad: beforeLoad
        };
    });