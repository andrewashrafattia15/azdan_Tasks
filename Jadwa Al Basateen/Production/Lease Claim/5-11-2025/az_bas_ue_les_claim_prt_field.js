/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/ui/serverWidget'], function (search, serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const unitsIDs = record.getValue('custrecord_ino_pms_lclaim_units');
                const tenancyContract = record.getValue('custrecord_ino_pms_lclaim_ten_contract');
                const leaseClaim = record.id;
                const bankID = record.getValue('custrecord_ino_pms_lclaim_bank_account');

                const { unitsNum, totalArea } = getTotalUnitArea(unitsIDs);

                const serviceCharge = getRate(tenancyContract);

                const {allocationData,amountSRTotal,vatTotal} = getAllocationData(leaseClaim);

                const iBanNum = getIBAN(bankID);

                setData(unitsNum, totalArea, serviceCharge, allocationData, amountSRTotal,vatTotal,iBanNum ,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };


    const getTotalUnitArea = (unitsIds) => {
        try {
            let unitsNum = [];
            let totalArea = 0;

            if (unitsIds && unitsIds.length > 0) {
                const searchUnits = search.create({
                    type: 'customrecord_ino_re_unitmaster',
                    columns: [
                        'custrecord_ino_re_um_number',
                        'custrecord_ino_re_um_gross_area'
                    ],
                    filters: [
                        ['internalid', 'anyof', unitsIds]
                    ]
                }).run();

                const searchResult = searchUnits.getRange({ start: 0, end: 1000 });

                if (searchResult && searchResult.length > 0) {
                    for (let row = 0; row < searchResult.length; row++) {
                        const area = Number(searchResult[row].getValue('custrecord_ino_re_um_gross_area')) || 0;
                        totalArea += area;

                        const unitNumber = searchResult[row].getValue('custrecord_ino_re_um_number');
                        unitsNum.push(unitNumber);
                    }
                }
            }


            return { unitsNum, totalArea };

        } catch (errgetTotalUnitArea) {
            log.debug('errgetTotalUnitArea', errgetTotalUnitArea);
        }
    };

    const getRate = (tenancyContract) => {
        try {
            let rate = '';

            const searchUnits = search.create({
                type: 'customrecord_ino_pms_additional_charge',
                columns: [
                    'custrecord_ino_pms_ac_rate',
                ],
                filters: [
                    ['custrecord_ino_pms_ac_charge_type', 'is', 'Service Charge'],
                    'AND',
                    ['custrecord_ino_pms_ac_tenancy_contract', 'anyof', tenancyContract]
                ]
            }).run();

            const result = searchUnits.getRange({ start: 0, end: 1 });
            
            if (result && result.length > 0) {
                rate = result[0].getValue('custrecord_ino_pms_ac_rate');
            }

            return rate;

        } catch (errorGetRate) {
            log.debug('errorGetRate', errorGetRate);
        }
    };

    const getAllocationData = (leaseClaim) => {
    try {
        let allocationData = [];
        let amountSRTotal = 0 ;
        let vatTotal = 0 ;
        const searchUnits = search.create({
            type: 'customrecord_ino_pms_claim_allocation',
            columns: [
                search.createColumn({
                    name: 'custrecord_ino_pms_lc_type',         
                    join: 'custrecord_ino_pms_ca_lease_charge'  
                }),
                'custrecord_az_bas_ca_description',
                'custrecord_ino_pms_ca_charge_amount',
                'custrecord_ino_pms_ca_vat_amount'
            ],
            filters: [
                ['custrecord_ino_pms_ca_lease_claim', 'anyof', leaseClaim]
            ]
        }).run();

        const results = searchUnits.getRange({ start: 0, end: 1000 });

        if (results && results.length > 0) {
            for (let i = 0; i < results.length; i++) {

                const chargeType = results[i].getText({
                    name: 'custrecord_ino_pms_lc_type',
                    join: 'custrecord_ino_pms_ca_lease_charge'
                });

                const description = results[i].getValue('custrecord_az_bas_ca_description');
                const amount = results[i].getValue('custrecord_ino_pms_ca_charge_amount');
                const vat = results[i].getValue('custrecord_ino_pms_ca_vat_amount');

                amountSRTotal += Number(amount) || 0;
                vatTotal += Number(vat) || 0;

                allocationData.push({
                    chargeType,
                    description,
                    amount,
                    vat
                });
            }
        }
        return {allocationData,amountSRTotal,vatTotal};

    } catch (errorGetAllocationData) {
        log.debug('errorGetAllocationData', errorGetAllocationData);
    }
    };

    const getIBAN = (bankID) =>{
        try {
            log.debug('Bank ID',bankID);
            const acctFields = search.lookupFields({
               type: search.Type.ACCOUNT,
               id: bankID,
               columns: ['custrecord_ino_re_bank_ibannumber'] 
               });
   
               log.debug('Account fields', acctFields.custrecord_ino_re_bank_ibannumber);
               return acctFields.custrecord_ino_re_bank_ibannumber;
        } catch (errorGetIBAN) {
            log.debug('Account errorGetIBAN', errorGetIBAN);
        }
    }


    const setData = ( unitNum, TotalArea, serviceCharge ,allocationData, amountSRTotal,vatTotal ,iBanNum ,context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            const custsecrecord = context.form.addField({
                id: 'custpage_custsecrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });
            const data = {
                units: unitNum,
                totalGrossArea: TotalArea,
                serviceCharge: serviceCharge,
                amountSRTotal:amountSRTotal,
                vatTotal:vatTotal,
                iBanNum:iBanNum
            };
            const allocationList = {
                allocationData:allocationData,  
            }
            custrecord.defaultValue = JSON.stringify(data);
            custsecrecord.defaultValue = JSON.stringify(allocationList);
        };


        return {
            beforeLoad: beforeLoad
        };
    });
