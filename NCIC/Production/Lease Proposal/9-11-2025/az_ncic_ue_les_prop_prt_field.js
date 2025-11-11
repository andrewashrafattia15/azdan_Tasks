/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record', 'N/ui/serverWidget'], function (search, record ,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const hijriDate = convertToHijri(record.getValue('custrecord_ino_pms_lp_date'));
                const {legalName,regNum,mainAddress,state} = getSubsidiary(record.getValue('custrecord_ino_pms_lp_subsidiary'))
                const unitMasterString = getUnitMaster(record.getValue('custrecord_ino_pms_lp_unit'));

                setData( unitMasterString,legalName,regNum,mainAddress,state,hijriDate,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

        const getUnitMaster = (id) => {
            try {
                const unit_Master_Search = search.create({
                    type: "customrecord_ino_re_unitmaster",
                    filters: [
                        ['isinactive', search.Operator.IS, false], 'AND',
                        ['internalid', search.Operator.ANYOF, id]
                    ],
                    columns: ['name']
                }).run().getRange(0, 1000);

                if (!unit_Master_Search || unit_Master_Search.length === 0) return '';

                
                const unitNames = unit_Master_Search.map(result => {
                    let name = result.getValue('name') || '';
                    return name.replace(/&/g, '&amp;');
                });

                const unitMasterString = unitNames.join(', ');

                log.debug("unitMaster", unitMasterString);
                return unitMasterString;

            } catch (errorGetUnitMaster) {
                log.debug("errorGetUnitMaster", errorGetUnitMaster);
                return '';
            }
        }


        const getSubsidiary = (subsidiaryId) => {
        try {

            if (!subsidiaryId) {
                log.error("getSubsidiary Error", "Missing subsidiaryId argument");
            }

            const subsidiarySearch = search.create({
                type: search.Type.SUBSIDIARY,
                filters: [
                    ['internalid', 'anyof', subsidiaryId]
                ],
                columns: [
                    'legalname',
                    'taxidnum',         
                    'state'
                ]
            });

            const searchResult = subsidiarySearch.run().getRange({ start: 0, end: 1 });

            const result = searchResult[0];
            const legalName = result.getValue('legalname') || '';
            const regNum = result.getValue('taxidnum') || '';
            const state = result.getValue('state') || '';

            let mainAddress = '';
            try {
                const subsidiaryRec = record.load({
                    type: record.Type.SUBSIDIARY,
                    id: subsidiaryId
                });
                mainAddress = subsidiaryRec.getValue('mainaddress_text') || '';
            } catch (addressErr) {
                log.debug('Address Load Error', addressErr);
            }

            return {
                legalName,
                regNum,
                mainAddress,
                state
            };

        } catch (error) {
            log.error('getSubsidiary Error', error);
        }
    };



        const convertToHijri = (date) => {
            try {
                const gDate = new Date(date);
                const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
                    day: 'numeric',
                    month: 'numeric',
                year: 'numeric'
            }).format(gDate);

            return hijri;

        } catch (errorconvertToHijri) {
            log.debug('errorconvertToHijri', errorconvertToHijri);

        }

    }

    const setData = (unitMasterString,legalName,regNum,mainAddress,state,hijriDate,context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            const data = {
                unitMasterString:unitMasterString,
                legalName:legalName,
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
