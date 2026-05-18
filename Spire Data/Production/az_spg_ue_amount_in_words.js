/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/ui/serverWidget'], (search, serverWidget) => {

    
    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const recID = record.id;

                const currencyId = record.getValue('currency');

                const currencyLookup = search.lookupFields({
                    type: search.Type.CURRENCY,
                    id: currencyId,
                    columns: ['symbol']
                });

                const currency = currencyLookup.symbol;
                const amount = record.getValue('total');
            
                const paymentAmountInArabic = numberToArabicWords(currency,amount);
                

                setData(paymentAmountInArabic,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

    const beforeSubmit = (context) => {
        try {
            const rec = context.newRecord;

            const total = rec.getValue({ fieldId: 'total' }) || 0;
            const currencyId = rec.getValue({ fieldId: 'currency' });

            const currencyInfo = getCurrencyInfo(currencyId);

            const words = convertAmount(total, currencyInfo);

            rec.setValue({
                fieldId: 'custbody_az_spg_amount_in_words',
                value: words
            });

        } catch (e) {
            log.debug("error in before submit", e);
        }
    };

    const getCurrencyInfo = (currencyId) => {

        try {
            
            const currencyMap = {
                "USD": { major: "DOLLARS", minor: "CENTS" },
                "AED": { major: "DIRHAMS", minor: "FILS" },
                "SAR": { major: "RIYALS", minor: "HALALAS" },
                "QAR": { major: "RIYALS", minor: "DIRHAMS" },
                "OMR": { major: "RIALS", minor: "BAISA" },
                "KWD": { major: "DINARS", minor: "FILS" },
                "BHD": { major: "DINARS", minor: "FILS" },
                "EUR": { major: "EUROS", minor: "CENTS" },
                "GBP": { major: "POUNDS", minor: "PENCE" }
            };
    
            const lookup = search.lookupFields({
                type: search.Type.CURRENCY,
                id: currencyId,
               columns: ['symbol', 'name']
            });
    
            const symbol = lookup.symbol;
    
            return currencyMap[symbol] || {
                major: "UNSPECIFIED CURRENCY",
                minor: ""
            };

        } catch (error) {
            log.debug("Error in fetching currency info", error);
        }
    };

    const convertAmount = (amount, currency) => {

        try {
            amount = parseFloat(amount).toFixed(2);
    
            const parts = amount.split('.');
            const majorPart = parseInt(parts[0], 10);
            const minorPart = parseInt(parts[1], 10);
    
            let words = numberToWords(majorPart) + " " + currency.major;
    
            if (minorPart > 0 && currency.minor) {
                words += " AND " + numberToWords(minorPart) + " " + currency.minor;
            }
    
            words += " ONLY";
    
            return words;
            
        } catch (error) {
            log.debug("Error in converting amount", error);
        }
    };

    const numberToWords = (num) => {
        try {
            if (num === 0) return "ZERO";
    
            const a = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX",
                "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE",
                "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
                "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
    
            const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY",
                "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
    
            const convertLessThan100 = (n) => {
                if (n < 20) return a[n];
                const t = Math.floor(n / 10);
                const o = n % 10;
                return tens[t] + (o ? "-" + a[o] : "");
            };
    
            const convertLessThan1000 = (n) => {
                let str = "";
                const h = Math.floor(n / 100);
                const r = n % 100;
    
                if (h > 0) {
                    str += a[h] + " HUNDRED";
                    if (r > 0) str += " ";
                }
                if (r > 0) str += convertLessThan100(r);
    
                return str;
            };
    
            const units = ["", " THOUSAND ", " MILLION ", " BILLION "];
    
            let word = "";
            let i = 0;
    
            while (num > 0) {
                const chunk = num % 1000;
    
                if (chunk > 0) {
                    word = convertLessThan1000(chunk) + units[i] + word;
                }
    
                num = Math.floor(num / 1000);
                i++;
            }
    
            return word.trim();
        
        } catch (error) {
            log.debug("Error in number to words conversion", error);
        }
    }

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
            words += " دولاراً";
            if (decimalPart > 0) {
                words += " و" + convert_number(decimalPart) + " سنتاً فقط لا غير";
            }  
        }
        else if(currency == "AED"){
            words += " درهماً";
            if (decimalPart > 0) {
                words += " و" + convert_number(decimalPart) + " فلساً فقط لا غير";
            }  
        }
        return words;
        } catch (errorNumberToArabicWords) {
            log.debug("errorNumberToArabicWords",errorNumberToArabicWords);
        }
    }

    const setData = (paymentAmountInArabic,context) => {
        try {
            
            const custrecord = context.form.addField({
                id: 'custpage_custrecord_amount_in_words_arabic',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });
            
            
            const data = {
                paymentAmountInArabic:paymentAmountInArabic,
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
            } catch (errorSetData) {
                log.debug("errorSetData",errorSetData)
            }
        };


    return {
        beforeLoad,
        beforeSubmit
    };
});