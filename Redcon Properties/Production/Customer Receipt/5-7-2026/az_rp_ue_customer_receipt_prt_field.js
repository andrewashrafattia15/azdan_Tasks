/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/search'], function (serverWidget, search) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const currentRecord = context.newRecord;

                const receiptID = currentRecord.id;
                const paymentPlanAllocations = getPaymentPlanAllData(receiptID);

                setData(paymentPlanAllocations, context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

    const getPaymentPlanAllData = (receiptID) => {
        try {

            if (!receiptID || isNaN(Number(receiptID))) {
                return [];
            }

            const allocations = [];

            const allocationSearch = search.create({
                type: 'customrecord_ino_re_pmt_plan_allocation',
                filters: [
                    ['custrecord_ino_re_ppa_customerreceipt', 'anyof', receiptID]
                ],
                columns: [

                    search.createColumn({ name: 'custrecord_ino_re_ppa_unit' }),

                    search.createColumn({
                        name: 'custrecord_ino_re_um_unittype',
                        join: 'custrecord_ino_re_ppa_unit'
                    }),

                    search.createColumn({ name: 'custrecord_ino_re_ppa_sales_pdc' }),

                    search.createColumn({
                        name: 'name',
                        join: 'custrecord_ino_re_ppa_pmt_plan'
                    }),
                    search.createColumn({
                        name: 'custrecord_ino_re_pp_type',
                        join: 'custrecord_ino_re_ppa_pmt_plan'
                    }),
                    search.createColumn({
                        name: 'custrecord_ino_re_pp_date',
                        join: 'custrecord_ino_re_ppa_pmt_plan'
                    }),
                    search.createColumn({
                        name: 'custrecord_ino_re_pp_amountpaid',
                        join: 'custrecord_ino_re_ppa_pmt_plan'
                    })
                ]
            });

            allocationSearch.run().each((result) => {

                const pdcId = result.getValue({ name: 'custrecord_ino_re_ppa_sales_pdc' });

                const allocationRow = {
                    unit: result.getText({ name: 'custrecord_ino_re_ppa_unit' }) || '',
                    unitType: result.getText({
                        name: 'custrecord_ino_re_um_unittype',
                        join: 'custrecord_ino_re_ppa_unit'
                    }) || '',
                    installmentName: result.getValue({
                        name: 'name',
                        join: 'custrecord_ino_re_ppa_pmt_plan'
                    }) || '',
                    paymentType: result.getText({
                        name: 'custrecord_ino_re_pp_type',
                        join: 'custrecord_ino_re_ppa_pmt_plan'
                    }) || '',
                    installmentDate: result.getValue({
                        name: 'custrecord_ino_re_pp_date',
                        join: 'custrecord_ino_re_ppa_pmt_plan'
                    }) || '',
                    paidAmount: result.getValue({
                        name: 'custrecord_ino_re_pp_amountpaid',
                        join: 'custrecord_ino_re_ppa_pmt_plan'
                    }) || '',
                    pdcData: {}
                };


                if (pdcId) {
                    allocationRow.pdcData = getPdcData(pdcId);
                }

                allocations.push(allocationRow);

                return true;
            });

            return allocations;

        } catch (errorGetPaymentPlanAllData) {
            log.debug('errorGetPaymentPlanAllData', errorGetPaymentPlanAllData);
            return [];
        }
    };

    const getPdcData = (pdcId) => {
        try {

            if (!pdcId || isNaN(Number(pdcId))) {
                return {};
            }

            const pdcFields = search.lookupFields({
                type: 'customrecord_ino_re_pdc',
                id: pdcId,
                columns: [
                    'custrecord_ino_re_pdc_cheque_no',
                    'custrecord_ino_re_pdc_drawn_on_bank',
                    'custrecord_ino_re_pdc_branch_name',
                    'custrecord_ino_re_pdc_maturity_date',
                    'custrecord_ino_re_pdc_fx_amount'
                ]
            });

            return {
                chequeNumber: pdcFields.custrecord_ino_re_pdc_cheque_no || '',
                bankName: pdcFields.custrecord_ino_re_pdc_drawn_on_bank
                    ? pdcFields.custrecord_ino_re_pdc_drawn_on_bank[0].text
                    : '',
                branchName: pdcFields.custrecord_ino_re_pdc_branch_name || '',
                chequeDate: pdcFields.custrecord_ino_re_pdc_maturity_date || '',
                chequeAmount: pdcFields.custrecord_ino_re_pdc_fx_amount || '',
            };

        } catch (errorGetPdcData) {
            log.debug('errorGetPdcData', errorGetPdcData);
            return {};
        }
    };

    const setData = (paymentPlanAllocations, context) => {

        const custrecord = context.form.addField({
            id: 'custpage_custrecord_to_print',
            type: serverWidget.FieldType.LONGTEXT,
            label: 'Text'
        });

        const data = {
            paymentPlanAllocations: paymentPlanAllocations || []
        };

        custrecord.defaultValue = JSON.stringify(data);
    };

    return {
        beforeLoad: beforeLoad
    };
});