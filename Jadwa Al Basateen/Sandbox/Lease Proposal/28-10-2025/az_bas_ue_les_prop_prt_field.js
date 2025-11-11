/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/ui/serverWidget'], function (search, serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const leaseProposal = record.id;
                const annualRent = record.getValue('custrecord_ino_pms_lp_annual_rent');
                const unitsIDs = record.getValue('custrecord_ino_pms_lp_unit');
                const {grandRent,ratedRent} = getRate(leaseProposal,annualRent);
                const {numOfElevators,parkingSpaces,buildingNum} = getUnitsElevators(unitsIDs);
                setData(numOfElevators,parkingSpaces,buildingNum,grandRent,ratedRent,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };


    const getUnitsElevators = (unitsIds) =>{
        try {
            let numOfElevators = 0 ;
            let parkingSpaces = 0 ;
            let buildingNum = '' ;
            // no. of elevators : custrecord_az_bas_building_elevators_no
            if (unitsIds && unitsIds.length > 0) {
                const searchUnits = search.create({
                    type: 'customrecord_ino_re_unitmaster',
                    columns: [
                        'custrecord_ino_re_um_number',
                        'custrecord_ino_re_um_building',
                        search.createColumn({
                            name: 'custrecord_az_bas_building_elevators_no',         
                            join: 'custrecord_ino_re_um_building'  
                        }),
                        'custrecord_ino_re_um_parking'
                    ],
                    filters: [
                        ['internalid', 'anyof', unitsIds]
                    ]
                }).run();

                const searchResult = searchUnits.getRange({ start: 0, end: 1000 });
                buildingNum = searchResult[0].getText('custrecord_ino_re_um_building');
                numOfElevators = Number(searchResult[0].getValue({
                    name: 'custrecord_az_bas_building_elevators_no',         
                    join: 'custrecord_ino_re_um_building'  
                }));

                if (searchResult && searchResult.length > 0) {
                    for (let i = 0; i < searchResult.length; i++) {
                        parkingSpaces += Number(searchResult[i].getValue('custrecord_ino_re_um_parking'));
                    }
                }
            }

            return {numOfElevators,parkingSpaces,buildingNum} ;
        } catch (errorGetUnitsElevators) {
            log.debug('errorGetUnitsElevators',errorGetUnitsElevators)
        }
    }

    // lease additional result custrecord_ino_pms_lp_annual_rent
    // 
    const getRate = (leaseProposal, annualRent) => {
        try {
            let rate = 0;
            let ratedRent = 0 ;
            let grandRent = annualRent;

            const searchUnits = search.create({
                type: 'customrecord_ino_pms_additional_charge',
                columns: [
                    'custrecord_ino_pms_ac_rate',
                    'custrecord_ino_pms_ac_charge_type'
                ],
                filters: [
                    ['custrecord_ino_pms_ac_tenancy_contract', 'anyof', leaseProposal]
                ]
            }).run();

            const result = searchUnits.getRange({ start: 0, end: 1 });
            log.debug('Grand Rent',result);

            if (result && result.length > 0) {
                const chargeType = result[0].getText('custrecord_ino_pms_ac_charge_type');
                let rateValue = result[0].getValue('custrecord_ino_pms_ac_rate');

                if (chargeType === 'Service Charge' && rateValue) {

                    rate = parseFloat(rateValue.toString().replace('%', '')) / 100;
                    ratedRent = rate*annualRent;
                    grandRent = annualRent * (1 + rate);
                }
            }

            log.debug('Grand Rent',ratedRent);
            log.debug('Grand Rent',grandRent);
            return {grandRent,ratedRent};

        } catch (errorGetRate) {
            log.debug('errorGetRate', errorGetRate);
        }
    };


    const setData = ( numOfElevators,parkingSpaces,buildingNum ,grandRent,ratedRent,context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            const data = {
                numOfElevators:numOfElevators,
                parkingSpaces:parkingSpaces,
                buildingNum:buildingNum,
                grandAnnualRent:grandRent,
                ratedRent:ratedRent
            };

            log.debug('Data',JSON.stringify(data));
            custrecord.defaultValue = JSON.stringify(data);
        };

        return {
            beforeLoad: beforeLoad
        };
    });
