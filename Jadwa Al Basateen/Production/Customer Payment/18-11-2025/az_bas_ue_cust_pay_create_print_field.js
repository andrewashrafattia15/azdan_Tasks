/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record','N/search','N/ui/serverWidget'], function ( record,search,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const recID = record.id;
                const language = record.getText("custbody_az_bas_printout_language");
                const currency = record.getText("currency");
                const subsidiaryID = record.getValue('subsidiary');
                const paymentAmount = record.getValue('payment');
                const subname = getSubsidiaryData(subsidiaryID);
                let paymentAmountInArabic = "" ;
                let paymentAmountInEnglish = "" ;
                if(language == "Arabic"){
                     paymentAmountInArabic = numberToArabicWords(currency,paymentAmount);
                }
                else{
                    paymentAmountInEnglish = numberToEnglishWords(currency,paymentAmount);
                }    
                const referenceNum = getReferenceNumber(recID);

                setData(subname,referenceNum,paymentAmountInEnglish,paymentAmountInArabic,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

    const getSubsidiaryData = (subsidiaryID) =>{
        try {
            let nameArabic = " "; 

           if (subsidiaryID) {
            const subsidiary_search = search.lookupFields({
                type: 'subsidiary',
                id: subsidiaryID,
                columns: ['custrecord_az_bas_name_in_arabic']
            });

            nameArabic = subsidiary_search.custrecord_az_bas_name_in_arabic || '';

            return nameArabic;
        }

        } catch (errorGetSubsidiaryData) {
            log.debug("errorGetSubsidiaryData",errorGetSubsidiaryData);
        }
    }
    
    const getReferenceNumber = (paymentRecordId) => {
        try {
            const paymentRecord = record.load({
                type: 'customerpayment',
                id: paymentRecordId
            });

            const lineCount = paymentRecord.getLineCount({ sublistId: 'apply' });
            let refNumber = null;

            if (lineCount > 0) {
                refNumber = paymentRecord.getSublistValue({
                    sublistId: 'apply',
                    fieldId: 'refnum', 
                    line: 0 
                });
            }

            return refNumber;

        } catch (errorGetReferenceNumber) {
            log.debug('errorGetReferenceNumber', errorGetReferenceNumber);
        }
    };

    const numberToArabicWords = (currency,amount) => {
        try {
            
            const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
            const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
            const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
            const thousands = ["", "ألف", "مليون", "مليار"];
            
            const convert_hundreds = (num) => {
                let result = "";
                if (num > 99) {
                    let hundreds = Math.floor(num / 100);
                    if (hundreds === 1) result += "مائة";
                else if (hundreds === 2) result += "مائتان";
                else if (hundreds < 10) result += ones[hundreds] + " مائة";
                num %= 100;
                if (num > 0) result += " و";
            }
            if (num >= 10 && num < 20) {
                result += teens[num - 10];
            } else if (num >= 20) {
                let t = Math.floor(num / 10);
                let o = num % 10;
                if (o > 0) result += ones[o] + " و" + tens[t];
                else result += tens[t];
            } else if (num > 0) {
                result += ones[num];
            }
            return result.trim();
        }
        
        const convert_number = (num) => {
            if (num === 0) return "صفر";
            let parts = [];
            let i = 0;
            while (num > 0) {
                let n = num % 1000;
                if (n > 0) {
                    let section = convert_hundreds(n);
                    if (i > 0) {
                        section += " " + thousands[i];
                    }
                    parts.unshift(section);
                }
                num = Math.floor(num / 1000);
                i++;
            }
            return parts.join(" و");
        }
        
        let integerPart = Math.floor(amount);
        let decimalPart = Math.round((amount - integerPart) * 100);
        
        let words = convert_number(integerPart) + " " ;
        
        if(currency == "SAR"){
            words += " ريالاً";
            if (decimalPart > 0) {
                words += " و" + convert_number(decimalPart) + " هللة فقط لا غير";
            }   
        }
        else if(currency == "USD"){
            let words = convert_number(integerPart) + " دولاراً";
            if (decimalPart > 0) {
                words += " و" + convert_number(decimalPart) + " سنتاً فقط لا غير";
            }  
        }
        else if(currency == "AED"){
            let words = convert_number(integerPart) + " درهماً";
            if (decimalPart > 0) {
                words += " و" + convert_number(decimalPart) + " فلساً فقط لا غير";
            }  
        }
        return words;
        } catch (errorNumberToArabicWords) {
            log.debug("errorNumberToArabicWords",errorNumberToArabicWords);
        }
    }

    const numberToEnglishWords = (currency,amount) => {
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



    const setData = (subname,referenceNum, paymentAmountInEnglish , paymentAmountInArabic,context) => {
        try {
            
            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });
            
            
            const data = {
                subname:subname,
                paymentAmountInEnglish:paymentAmountInEnglish,
                paymentAmountInArabic:paymentAmountInArabic,
                referenceNum:referenceNum
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
