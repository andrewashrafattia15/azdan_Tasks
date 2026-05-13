/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search'], (search) => {

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

    return {
        beforeSubmit
    };
});