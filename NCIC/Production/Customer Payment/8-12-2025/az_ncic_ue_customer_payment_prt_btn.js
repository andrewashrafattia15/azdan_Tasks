/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search','N/ui/serverWidget'], function (record,search ,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const hijriDate = convertToHijri(record.getValue('trandate'));
                const regNum = getSubsidiary(record.getValue('subsidiary'))
                const customer = record.getValue('customer');

                const {totalInArabic,totalInEnglish} = getInvoiceData(customer);


                setData(totalInArabic,totalInEnglish, regNum,hijriDate,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };


    const getSubsidiary = (subsidiaryId) => {
        try {

            if (!subsidiaryId) {
                log.error("getSubsidiary Error", "Missing subsidiaryId argument");
            }


           const subsRec = record.load({
                type: record.Type.SUBSIDIARY,
                id: subsidiaryId,
                isDynamic: false
            });
            const regNum = subsRec.getValue({ fieldId: 'federalidnumber' }) || '';

            return regNum 
               

        } catch (error) {
            log.error('getSubsidiary Error', error);
        }
    };

    const getInvoiceData = (customer) => {
        try {
            if (!customer) return null;

            const results = search.create({
                type: search.Type.INVOICE,
                filters: [
                    ['entity', 'anyof', customer], 'AND',
                    ['type', 'anyof', 'CustInvc']
                ],
                columns: [
                    'custbody_ino_er_amount_in_words_en',
                    'custbody_ino_re_amount_in_words_ar'
                ]
            }).run().getRange({ start: 0, end: 1 });

            if (!results || !results.length) return null;

            const result = results[0];

            const totalInArabic  = result.getValue('custbody_ino_re_amount_in_words_ar') || '';
            const totalInEnglish = result.getValue('custbody_ino_er_amount_in_words_en') || '';


            return {
                totalInArabic,
                totalInEnglish
            };

        } catch (errorGetInvoiceData) {
            log.debug('errorGetInvoiceData', errorGetInvoiceData);
        }
    };


    const convertToHijri = (date) => {
            try {
                if (!date) return '';
                const gDate = new Date(date);
                const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                }).format(gDate);


            return hijri;

        } catch (errorconvertToHijri) {
            log.debug('errorconvertToHijri', errorconvertToHijri);

        }

    }

    const setData = (totalInArabic,totalInEnglish,regNum,hijriDate,context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            const data = {
                totalInArabic:totalInArabic,
                totalInEnglish:totalInEnglish,
                regNum:regNum,
                hijriDate: hijriDate
            };

            custrecord.defaultValue = JSON.stringify(data);
        };


        return {
            beforeLoad: beforeLoad
        };
    });
