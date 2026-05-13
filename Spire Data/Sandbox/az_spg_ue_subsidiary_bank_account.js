/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/ui/serverWidget'], function (search, serverWidget) {

    const beforeLoad = (context) => {
        try {
            if (context.type === context.UserEventType.PRINT){
                const record = context.newRecord;
                const subsidiaryId = record.getValue('subsidiary');
                if (!subsidiaryId) return;
                const bankDetails = getBankDetails(subsidiaryId);

                setData(bankDetails ,context);
            }
        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };


    const getBankDetails = (subsidiaryId) => {
        try {

            const results = [];

            const remittanceSearch = search.create({
                type: 'customrecord_az_spg_remittance_data',
                filters: [
                    ['custrecord_az_spg_subsidiary', 'anyof', subsidiaryId]
                ],
                columns: [
                    'custrecord_az_spg_subsidiary',
                    'custrecord_az_spg_acct_no',
                    'custrecord_az_spg_iban_no',
                    'custrecord_az_spg_ben_name',
                    'custrecord_az_spg_currency',
                    'custrecord_az_spg_bank_name',
                    'custrecord_az_spg_swift'
                ]
            });

            remittanceSearch.run().each((result) => {

                results.push({
                    subsidiary: result.getText('custrecord_az_spg_subsidiary'),
                    acctNo: result.getValue('custrecord_az_spg_acct_no'),
                    ibanNo: result.getValue('custrecord_az_spg_iban_no'),
                    benName: result.getValue('custrecord_az_spg_ben_name'),
                    currency: result.getText('custrecord_az_spg_currency'),
                    bankName: result.getValue('custrecord_az_spg_bank_name'),
                    swift: result.getValue('custrecord_az_spg_swift')
                });

                return true;
            });

            return results;

        } catch (error) {
            log.debug('errorGetBankDetails', error);
        }
    };


    const setData = (bankDetails ,context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_bank_details',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Bank Details'
            });

            const data = {
                bankDetails: bankDetails,
            };

            custrecord.defaultValue = JSON.stringify(data);

        };


        return {
            beforeLoad: beforeLoad
        };
    });
