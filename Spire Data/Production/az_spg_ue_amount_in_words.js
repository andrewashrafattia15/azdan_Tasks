/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */

define(['N/search'], function (search) {

    function beforeSubmit(context) {
        try {
            var rec = context.newRecord;

            var total = rec.getValue('total') || 0;
            var currencyId = rec.getValue('currency');

            var currencyInfo = getCurrencyInfo(currencyId);

            var words = convertAmount(total, currencyInfo);

            rec.setValue({
                fieldId: 'custbody_amount_in_words',
                value: words
            });

        } catch (e) {
            log.error("Amount in Words Error", e);
        }
    }

    function getCurrencyInfo(currencyId) {
        // Map currency symbol/code to major/minor names
        var currencyMap = {
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

        var currencySymbol = search.lookupFields({
            type: search.Type.CURRENCY,
            id: currencyId,
            columns: ['symbol', 'name']
        }).symbol;

        return currencyMap[currencySymbol] || { major: "UNSPECIFIED CURRENCY", minor: "" };
    }

    function convertAmount(amount, currency) {
        amount = parseFloat(amount).toFixed(2);
        var parts = amount.split('.');
        var majorPart = parseInt(parts[0]);
        var minorPart = parseInt(parts[1]);

        var words = numberToWords(majorPart) + " " + currency.major;

        if (minorPart > 0 && currency.minor) {
            words += " AND " + numberToWords(minorPart) + " " + currency.minor;
        }

        words += " ONLY";

        return words;
    }

    function numberToWords(num) {
        if (num === 0) return "ZERO";

        var a = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX",
                 "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE",
                 "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
                 "SEVENTEEN", "EIGHTEEN", "NINETEEN"];

        var tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY",
                    "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

        function convertLessThan100(n) {
            if (n < 20) return a[n];
            var t = Math.floor(n / 10);
            var o = n % 10;
            return tens[t] + (o ? "-" + a[o] : "");
        }

        function convertLessThan1000(n) {
            var str = "";
            var h = Math.floor(n / 100);
            var r = n % 100;
            if (h > 0) {
                str += a[h] + " HUNDRED";
                if (r > 0) str += " ";
            }
            if (r > 0) str += convertLessThan100(r);
            return str;
        }

        var units = ["", " THOUSAND ", " MILLION ", " BILLION "];
        var word = "";
        var i = 0;

        while (num > 0) {
            var chunk = num % 1000;
            if (chunk > 0) {
                word = convertLessThan1000(chunk) + units[i] + word;
            }
            num = Math.floor(num / 1000);
            i++;
        }

        return word.trim();
    }

    return {
        beforeSubmit: beforeSubmit
    };

});