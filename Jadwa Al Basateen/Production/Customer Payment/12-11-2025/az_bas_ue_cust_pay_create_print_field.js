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
                const subsidiaryID = record.getValue('subsidiary');
                const paymentAmount = record.getValue('payment');
                const subname = getSubsidiaryData(subsidiaryID);
                const paymentAmountInArabic = numberToArabicWords(paymentAmount);
                const referenceNum = getReferenceNumber(recID);

                setData(subname,referenceNum,paymentAmountInArabic,context);
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

    const numberToArabicWords = (amount) => {
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

        let words = convert_number(integerPart) + " جنيهاً";
        if (decimalPart > 0) {
            words += " و" + convert_number(decimalPart) + " قرشاً فقط لا غير";
        }

        return words;
    }


    const setData = (subname,referenceNum, paymentAmountInArabic,context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            
            const data = {
                subname:subname,
                paymentAmountInArabic:paymentAmountInArabic,
                referenceNum:referenceNum
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
        };


        return {
            beforeLoad: beforeLoad
        };
    });
