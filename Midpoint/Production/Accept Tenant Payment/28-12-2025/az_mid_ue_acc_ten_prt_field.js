/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([ 'N/search','N/ui/serverWidget'], function (search ,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const recID = record.id;
                const tenantPayAlls = getTenantPayAllsList(recID);

                setData(tenantPayAlls,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };


    const getTenantPayAllsList = (recID) => {
        try {
            if (!recID) return [];

            let tenantPayAllsList = [];

            const tenantPayAllSearch = search.create({
                type: 'customrecord_az_mp_tp_allocation',
                filters: [
                    ['custrecord_az_mp_tpa_tenant_payment', 'anyof', recID],
                    'AND',
                    ['custrecord_az_mp_tpa_lease_charge', 'noneof', '@NONE@']
                ],
                columns: [
                    'custrecord_az_mp_tpa_gross_amount',
                    'custrecord_az_mp_tpa_remaining_amount',
                    'custrecord_az_mp_tpa_collected_amount',
                    'custrecord_az_mp_tpa_lease_charge'
                ]
            });

            let searchResult = [];

            searchResult = tenantPayAllSearch.run().getRange({ start: 0, end: 1000 }) || [];

            searchResult.forEach(result => {
                    const leaseChargeId = result.getValue({ name: 'custrecord_az_mp_tpa_lease_charge' });

                    let leaseChargeData = {
                        startDate: '',
                        endDate: '',
                        chargeAmount: '0',
                        vatAmount: '0'
                    };

                    if (leaseChargeId) {
                        leaseChargeData = search.lookupFields({
                            type: 'customrecord_ino_pms_tc_invs_schd',
                            id: leaseChargeId,
                            columns: [
                                'custrecord_ino_pms_lc_date',
                                'custrecord_ino_pms_lc_end_date',
                                'custrecord_ino_pms_lc_amount',
                                'custrecord_ino_pms_lc_vat_amount'
                            ]
                        });

                        leaseChargeData.startDate = leaseChargeData.custrecord_ino_pms_lc_date || '';
                        leaseChargeData.endDate = leaseChargeData.custrecord_ino_pms_lc_end_date || '';
                        leaseChargeData.chargeAmount = leaseChargeData.custrecord_ino_pms_lc_amount || '0';
                        leaseChargeData.vatAmount = leaseChargeData.custrecord_ino_pms_lc_vat_amount || '0';
                    }

                    tenantPayAllsList.push({
                        startDate: leaseChargeData.startDate,
                        endDate: leaseChargeData.endDate,
                        chargeAmount: leaseChargeData.chargeAmount,
                        vatAmount: leaseChargeData.vatAmount,
                        grossAmount: result.getValue('custrecord_az_mp_tpa_gross_amount') || '0',
                        remainingAmount: result.getValue('custrecord_az_mp_tpa_remaining_amount') || '0',
                        collectedAmount:result.getValue('custrecord_az_mp_tpa_collected_amount')||'0',
                    });
            });

            log.debug('tenantPayAllsList', tenantPayAllsList);
            return tenantPayAllsList;

        } catch (errorGetTenantPayAllsList) {
            log.debug('Error in getTenantPayAllsList', errorGetTenantPayAllsList);
        }
    };




    const setData = (tenantPayAlls,context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            const data = {
                tenantPayAlls:tenantPayAlls
            };

            custrecord.defaultValue = JSON.stringify(data);
        };


        return {
            beforeLoad: beforeLoad
        };
    });
