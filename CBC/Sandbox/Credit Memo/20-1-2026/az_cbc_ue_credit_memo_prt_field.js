/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record','N/ui/serverWidget'], function ( record,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const recID = record.id;
                const customerID = record.getValue('entity');
                const subsidiaryID = record.getValue('subsidiary');
                const customerData = getCustomerData(customerID);
                const total = record.getValue('total');
                const currency = record.getText('currency');

                const totalInEnglishWords = numberToEnglishWords(total,currency);

                const subsidiaryData = getSubsidiaryData(subsidiaryID);

                setData(totalInEnglishWords,customerData,subsidiaryData,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

    const getCustomerData = (customerID) => {
        try {
            if (!customerID) return '';

            const customerRec = record.load({
                type: record.Type.CUSTOMER,
                id: customerID
            });

            const customerAddress = customerRec.getText({
                fieldId: 'defaultaddress'
            });

            return {customerAddress:customerAddress}

        } catch (errorGetCustomerData) {
            log.debug('errorGetCustomerData', errorGetCustomerData);
        }
    };

    const getSubsidiaryData = (subsidiaryID) => {
        try {
            if (!subsidiaryID) return '';

            const subsidiaryRec = record.load({
                type: record.Type.SUBSIDIARY,
                id: subsidiaryID
            });

            const subsidiaryName = subsidiaryRec.getText({
                fieldId: 'name'
            });

            const subsidiaryAddress = subsidiaryRec.getText({
                fieldId: 'mainaddress_text'
            });

            const vatRegNum = subsidiaryRec.getText({
                fieldId: 'federalidnumber'
            });

            return {
                subName: subsidiaryName,
                subAddress: subsidiaryAddress,
                subVAT: vatRegNum
            };


        } catch (errorGetSubsidiaryData) {
            log.debug('errorGetSubsidiaryData', errorGetSubsidiaryData);
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
                    result += ones[hundred] + " Hundred ";
                    num %= 100;
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
                
                return parts.join(" ");
            }
            
            let integerPart = Math.floor(amount);
            let decimalPart = Math.round((amount - integerPart) * 100);
            
            
            let words = convert_number(integerPart) + " ";
            if(currency == "AED"){
                words = "Dirham " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                }   
            }
            else if(currency == "USD"){
                words = "Dollar " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            else if(currency == "CAD"){
                words = "Canadian Dollar " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            else if(currency == "EUR"){
                words = "Euro " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            else if(currency == "GBP"){
                words = "British Pound Sterling " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            else if(currency == "OMR"){
                words = "Omani Rial " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            else if(currency == "QAR"){
                words = "Qatari Riyal " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            else if(currency == "CNY"){
                words = "Chinese Yuan Renminbi " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            return words;
            } catch (errorNumberToEnglishWords) {
                log.debug("errorNumberToEnglishWords",errorNumberToEnglishWords);
            }
    }

    const setData = (totalInEnglishWords,customerData,subsidiaryData,context) => {


            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            
            const data = {
                totalInEnglishWords:totalInEnglishWords,
                subsidiaryData:subsidiaryData,
                customerData:customerData
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
        };


        return {
            beforeLoad: beforeLoad
        };
    });
