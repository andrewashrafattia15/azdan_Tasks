/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define(['N/search', 'N/ui/serverWidget', 'N/record', 'N/file', 'N/url'], function (search, serverWidget, record, file, url ) {

    const EARNING_TYPES = ["Earning Basic","Cash Benefit","Other Earning"];
    const DEDUCTION_TYPES = ["Deduction","Other Deduction","Employee Share","Tax"];

    const beforeLoad = (context) => {
        try {

            if (context.type !== context.UserEventType.PRINT) return;

            const payrollSheetId = context.newRecord.getValue('id') || context.newRecord.id;
            const subsidiaryID = context.newRecord.getValue('custrecord_ino_hrms_psh_subsidiary');
            const payrollData = getPayrollLines(payrollSheetId);
            const subsidiaryData = getSubsidiaryData(subsidiaryID);


            setData(payrollData, subsidiaryData, context);

        } catch (e) {
            log.debug('beforeLoad error', e);
        }
    };


    const getPayrollLines = (payrollSheetId) => {

        try {
            
            const earnings = [];
            const deductions = [];
            
            
            const payrollSearch = search.create({
                type: 'customrecord_ino_hrms_payrollsheetline',
                filters: [
                ['custrecord_ino_hrms_ps_payrollsheet', 'anyof', payrollSheetId]
            ],
            columns: [
                'custrecord_ino_hrms_ps_payrollitem',
                'custrecord_ino_hrms_ps_payrollitemtype',
                'custrecord_ino_hrms_ps_amount'
            ]
        });
        
        payrollSearch.run().each(result => {
            
            const itemName = result.getText({
                name: 'custrecord_ino_hrms_ps_payrollitem'
            });
            
            const typeText = result.getText({
                name: 'custrecord_ino_hrms_ps_payrollitemtype'
            });
            
            const amountRaw = result.getValue({
                name: 'custrecord_ino_hrms_ps_amount'
            });

            const parsed = parseFloat(amountRaw);
            const amount = Number.isFinite(parsed) ? parsed : 0;
            
            const row = {
                name: itemName,
                amount: amount
            };
            
            if (EARNING_TYPES.includes(typeText)) {
                earnings.push(row);
            }
            else if (DEDUCTION_TYPES.includes(typeText)) {
                deductions.push(row);
            }
            
            return true;
        });

        return {
            earnings,
            deductions
        };
    } catch (errorGetPayrollLines) {
        log.debug('getPayrollLines error', errorGetPayrollLines);
    }
    };

    const getSubsidiaryData = (subsidiaryID) => {
        try {

            if (!subsidiaryID) return {};

            const subsidiaryRec = record.load({
                type: record.Type.SUBSIDIARY,
                id: subsidiaryID
            });

            const logoFileId = subsidiaryRec.getValue('logo');

            let logoUrl = '';

            if (logoFileId) {
                const logoFile = file.load({
                    id: logoFileId
                });

                const baseUrl = 'https://' + url.resolveDomain({
                    hostType: url.HostType.APPLICATION
                });

                logoUrl = baseUrl + logoFile.url;
            }

            return {
                logoUrl: logoUrl
            };


        } catch (e) {
            log.debug('getSubsidiaryData error', e);
            return {};
        }
    };


    const setData = (payrollData, subsidiaryData, context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            
            const data = {
                payrollData: payrollData || { earnings: [], deductions: [] },
                subsidiaryData: subsidiaryData || []
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
    };


    return {
        beforeLoad
    };

});