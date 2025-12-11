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
                const {fullName,regNum,mainAddress,state} = getSubsidiary(record.getValue('subsidiary'))
                const items = getItemsList(record.id);


                setData(items,fullName,regNum,mainAddress,state,hijriDate,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };


    const getSubsidiary = (subsidiaryId) => {
        try {

            if (!subsidiaryId) {
                log.debug("getSubsidiary Error", "Missing subsidiaryId argument");
            }


           const subsRec = record.load({
                type: record.Type.SUBSIDIARY,
                id: subsidiaryId,
                isDynamic: false
            });
            const fullName = subsRec.getValue({ fieldId: 'custrecord_az_ncic_full_name' }) || '';
            const regNum = subsRec.getValue({ fieldId: 'federalidnumber' }) || '';
            const mainAddress = subsRec.getText({ fieldId: 'mainaddress_text' }) || '';
            const state = subsRec.getText({ fieldId: 'state' }) || '';

            return {fullName,regNum,mainAddress,state};
               

        } catch (getSubsidiaryError) {
            log.debug('getSubsidiaryError', getSubsidiaryError);
        }
    };

    const getItemsList = (memoId) =>{
        try {
             const memo = record.load({
                type: record.Type.CREDIT_MEMO,
                id: memoId,
                isDynamic: false
            });

            let items = []

            const lineCount = memo.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < lineCount; i++) {
                const itemName = memo.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item_display',
                    line: i
                });

                const grossAmt = memo.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'grossamt',
                    line: i
                });

                items.push({itemName:itemName ,grossAmt:grossAmt })
            }
            log.debug('items',items)

            return items
        } catch (errorGetItemsList) {
            log.debug('errorGetItemsList',errorGetItemsList)
        }
    }

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

    const setData = (items,fullName,regNum,mainAddress,state,hijriDate,context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            const data = {
                items:items,
                fullName:fullName,
                regNum:regNum,
                mainAddress:mainAddress,
                state:state,
                hijriDate: hijriDate
            };

            custrecord.defaultValue = JSON.stringify(data);
        };


        return {
            beforeLoad: beforeLoad
        };
    });
