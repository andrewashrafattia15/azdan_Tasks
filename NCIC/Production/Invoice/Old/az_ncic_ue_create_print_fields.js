/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(["./az_ats_amount_in_words", 'N/ui/serverWidget', 'N/record', 'N/file', "N/query"], function (Amount_converter, serverWidget, record, file, query) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {
                const Record = context.newRecord;
                const myRec = Record.id;
                log.debug('Record.id', myRec);
                const tranDate = Record.getValue('trandate');
                const tenancyContractId = Record.getValue("custbody_ino_pms_tenancy_contract");
                if (tranDate) {
                    const hijriDate = convertToHijri(tranDate);
                    setSearchValueInspection(context, 'custpage_hijri_date', 'Hijri Date', hijriDate)

                }

                if (tenancyContractId) {
                    const lcNumber = getNumberByTC(tenancyContractId,myRec);
                    if (lcNumber) {
                        setSearchValueInspection(context, 'custpage_lc_number', 'LC Number', lcNumber)

                    }
                }

            }
        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    }

    const beforeSubmit = (context) => {
        try {
            const rec = context.newRecord;
            const invoiceTotal = rec.getValue('total');

            if (invoiceTotal) {
                let amount_in_words_arabic = Amount_converter.amount_to_arabic_words(invoiceTotal);
                rec.setValue({
                    fieldId: 'custbody_ino_re_amount_in_words_ar',
                    value: amount_in_words_arabic
                });
            }
        } catch (errBeforeSubmit) {
            log.debug("errBeforeSubmit", errBeforeSubmit);
        }
    };

    const convertToHijri = (date) => {
        try {
            const gDate = new Date(date);
            const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(gDate);

            return hijri;

        } catch (errorconvertToHijri) {
            log.debug('errorconvertToHijri', errorconvertToHijri);

        }

    }

    const getNumberByTC = (tenancyContractId,invId) => {
        try {
            const suiteQL = `
                SELECT custrecord_ino_pms_lc_number
                FROM customrecord_ino_pms_tc_invs_schd
                WHERE custrecord_ino_pms_lc_type IN (17, 13, 5)
                AND custrecord_ino_pms_lc_tc = ?
                AND custrecord_ino_pms_lc_invoice_number = ?
            `;

            const resultSet = query.runSuiteQL({
                query: suiteQL,
                params: [tenancyContractId, invId]
            }).asMappedResults();
            log.debug('resultSet', resultSet);

            if (resultSet && resultSet.length > 0) {
                return resultSet[0].custrecord_ino_pms_lc_number || "";
            }
            return "";
        } catch (errorgetNumberByTC) {
            log.debug("errorgetNumberByTC", errorgetNumberByTC);
            return "";
        }
    };

    const setSearchValueInspection = (context, fieldId, label, value) => {

        const hijriDateFld = context.form.addField({
            id: fieldId,
            type: serverWidget.FieldType.TEXT,
            label: label
        });

        hijriDateFld.defaultValue = value;

    }





    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    }

})