/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define(['N/search', 'N/ui/serverWidget', 'N/record', 'N/file', 'N/url'], function (search, serverWidget, record, file, url ) {


    const beforeLoad = (context) => {
        try {

            if (context.type !== context.UserEventType.PRINT) return;

            const jobOfferId = context.newRecord.getValue('id') || context.newRecord.id;
            const subsidiaryID = context.newRecord.getValue('custrecord_ino_hrms_jo_subsidiary');
            const benefits = getBenefits(jobOfferId);
            const salaryList = getSalaryList(jobOfferId);
            const subsidiaryData = getSubsidiaryData(subsidiaryID);

            setData(benefits, salaryList, subsidiaryData, context);

        } catch (e) {
            log.debug('beforeLoad error', e);
        }
    };
    
    
    const getSalaryList = (jobOfferId) => {
    
        try {             
                const salaryList = [];      
                const salarySearch = search.create({
                    type: 'customrecord_ino_hrms_offer_salary',
                    filters: [
                        ['custrecord_ino_hrms_jos_offer', 'anyof', jobOfferId]
                    ],
                    columns: [
                        'custrecord_ino_hrms_jos_payroll_item',
                        'custrecord_ino_hrms_jos_gross',
                    ]
                });

                salarySearch.run().each(result => {
                    
                    const itemName = result.getText({
                        name: 'custrecord_ino_hrms_jos_payroll_item'
                    });
                    
                    const amountRaw = result.getValue({
                        name: 'custrecord_ino_hrms_jos_gross'
                    });
                    
                    const parsed = parseFloat(amountRaw);
                    const amount = Number.isFinite(parsed) ? parsed : 0;
                    
                salaryList.push({
                    name: itemName,
                    amount: amount
                });
                
                return true;
            });
            
            return salaryList;

        } catch (errorGetSalaryList) {
            log.debug('getSalaryList error', errorGetSalaryList);
        }
    };
    
    const getBenefits = (jobOfferId) => {
        try {
            const benefits = [];

            const benefitsSearch = search.create({
            type: 'customrecord_ino_hrms_offer_benefits',
            filters: [
                ['custrecord_ino_hrms_job_offer', 'anyof', jobOfferId]
            ],
            columns: [
                'custrecord_ino_hrms_job_component',
                'custrecord_ino_hrms_job_description',
            ]
        });

        benefitsSearch.run().each(result => {

            const itemName = result.getText({
                name: 'custrecord_ino_hrms_job_component'
            });

            const description  = result.getValue({
                name: 'custrecord_ino_hrms_job_description'
            });
            
            benefits.push({
                name: itemName,
                description: description
            });

            return true;
        });
        
        return benefits;

        } catch (errorGetBenefits) {
            log.debug('getBenefits error', errorGetBenefits);
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
            const address = subsidiaryRec.getValue('mainaddress_text');

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
                logoUrl: logoUrl,
                address: address    
            };


        } catch (e) {
            log.debug('getSubsidiaryData error', e);
            return {};
        }
    };


    const setData = (benefits, salaryList, subsidiaryData, context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            
            const data = {
                benefits: benefits || [],
                salaryList: salaryList || [],
                subsidiaryData: subsidiaryData || []
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
    };


    return {
        beforeLoad
    };

});