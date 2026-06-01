/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/encode', 'N/record'], function (encode, record) {

    const afterSubmit = (context) => {
        try {

            const Record = context.newRecord;
            const Type = context.type;
            const recId = Record.id;
            const recType = Record.type;

            if (Type == 'create' || Type == 'edit' || Type == 'xedit') {

                const invoiceData = getInvoiceData(recType, recId)

                const subsidiary = Record.getValue('subsidiary');
                if (subsidiary) {
                    if(subsidiary == 7)
                    {
                        const landlord_id = Record.getValue("custbodyaz_mp_landlord")
                        var subsidiaryData = getLandlordData(landlord_id)
                    }
                    else{
                        subsidiaryData = getSubsidiaryData(subsidiary);

                    }
                } else {
                    var subsidiaryData = {
                        'vatRegstrationNo': ''
                    }
                }

                let sellerName = invoiceData.subsidiary;
                if (sellerName) {
                    const sellerLengthHex = sellerName.length.toString(16)
                    const finalSellerLengthHex = ValidCharacter(sellerLengthHex)
                    const sellerHex = convertToHex(sellerName)
                    sellerName = '01' + finalSellerLengthHex + sellerHex
                }

                let sellerVatNo = subsidiaryData.vatRegstrationNo;
                if (sellerVatNo) {
                    const sellerVatNoLengthHex = sellerVatNo.length.toString(16)
                    const finalSellerVatNoLengthHex = ValidCharacter(sellerVatNoLengthHex)
                    const vatRegSellerHex = convertToHex(sellerVatNo)
                    sellerVatNo = '02' + finalSellerVatNoLengthHex + vatRegSellerHex
                }
                log.debug("sellerVatNo",sellerVatNo)


                let timeStamp = invoiceData.createdDate;
                timeStamp = convertDateFormat(timeStamp)
                if (timeStamp) {
                    const timeStampLengthHex = timeStamp.length.toString(16)
                    const finalTimeStampLengthHex = ValidCharacter(timeStampLengthHex)
                    const timeStampHex = convertToHex(timeStamp)
                    timeStamp = '03' + finalTimeStampLengthHex + timeStampHex
                }

                let total = invoiceData.total.replace(/,/g, '');
                if (total) {
                    const totalLengthHex = total.length.toString(16)
                    const finalTotalLengthHex = ValidCharacter(totalLengthHex)
                    const totalHex = convertToHex(total)
                    total = '04' + finalTotalLengthHex + totalHex
                }

                let vatTotal = invoiceData.taxTotal.replace(/,/g, '');
                if (vatTotal) {
                    const vatTotalLengthHex = vatTotal.length.toString(16)
                    const finalVatTotalLengthHex = ValidCharacter(vatTotalLengthHex)
                    const vatTotalHex = convertToHex(vatTotal)
                    vatTotal = '05' + finalVatTotalLengthHex + vatTotalHex
                }

                const finalHex = sellerName + sellerVatNo + timeStamp + total + vatTotal
                const barcodeTagBase64 = convertToBase64(finalHex)

                const subsidiaryTxtQR = invoiceData.subsidiary;
                const createdDateQR = Record.getValue('createddate');
                const totalQR = Record.getValue('total')
                const vatTotalQR = Record.getValue('taxtotal');

                const QRCord = subsidiaryTxtQR + '|' + subsidiaryData.vatRegstrationNo + '|'
                    + createdDateQR + '|' + totalQR + '|' + vatTotalQR

                setDataInMyRecord(recType, recId, finalHex, barcodeTagBase64, QRCord)

            }

        } catch (errAfterSubmit) {
            log.debug("errAfterSubmit", errAfterSubmit);
        }
    }



    const getInvoiceData = (recType, recId) => {
        try {

            const myRec = record.load({
                type: recType,
                id: recId
            })

            const subsidiaryID = myRec.getValue('subsidiary');
            const createdDate = myRec.getText('createddate');
            const total = myRec.getText('total');
            const taxTotal = myRec.getText('taxtotal');

            const subsidiary = (subsidiaryID == 7) ? myRec.getText('custbodyaz_mp_landlord') : myRec.getText('subsidiary');

            return {
                'subsidiary': subsidiary,
                'createdDate': createdDate,
                'total': total,
                'taxTotal': taxTotal,
                
            }

        } catch (errGetInvoiceData) {
            log.debug('errGetInvoiceData', errGetInvoiceData)
        }
    }


    const setDataInMyRecord = (recType, recId, finalHex, barcodeTagBase64, QRCord) => {
        try {

            const trxRec = record.load({
                type: recType,
                id: recId,
                isDynamic: true,
            })

            const guiduuid = trxRec.getValue('custbody_az_trx_guiduuid')

            if (!guiduuid) {
                trxRec.setValue('custbody_az_trx_guiduuid', uuidv4())
            }

            trxRec.setValue('custbody_az_trx_hexadecimal', finalHex)
            trxRec.setValue('custbody_az_trx_base64', barcodeTagBase64)
            trxRec.setValue('custbody_az_trx_qrcode', QRCord)

            trxRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            })

        } catch (errSetDataInRecord) {
            log.debug('errSetDataInRecord', errSetDataInRecord)
        }
    }


    const getSubsidiaryData = (subsidiaryId) => {
        try {

            var subsidiaryRecord = record.load({
                type: 'subsidiary',
                id: subsidiaryId
            })

            var vatRegstrationNo = subsidiaryRecord.getValue('federalidnumber');

            return { 'vatRegstrationNo': vatRegstrationNo };

        } catch (errGetSUbsidiaryData) {
            log.debug('errGetSUbsidiaryData', errGetSUbsidiaryData)
        }
    }

    
    const getLandlordData = (landlord_id) => {
        try {

            if(!landlord_id){
                log.debug('landlord error :', 'no landlord_id found')
                return ;
            }
            const landLordRecord = record.load({
                type: 'customrecord_ino_pms_landlord',
                id: landlord_id
            })

            const vatRegstrationNo = landLordRecord.getValue('custrecord_ino_pms_landlord_vat_number');

            return { 'vatRegstrationNo': vatRegstrationNo };

        } catch (errgetLandlordData) {
            log.debug('errgetLandlordData', errgetLandlordData)
        }
    }


    const convertToHex = (Decimal) => {
        try {

            const Hexadecimal = encode.convert({
                string: Decimal,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.HEX
            });

            return Hexadecimal;

        } catch (errConvertToHex) {
            log.debug('errConvertToHex', errConvertToHex)
        }
    }


    const convertToBase64 = (hex) => {
        try {

            const base64 = encode.convert({
                string: hex,
                inputEncoding: encode.Encoding.HEX,
                outputEncoding: encode.Encoding.BASE_64
            });

            return base64;

        } catch (errConvertToBase64) {
            log.debug('errConvertToBase64', errConvertToBase64)
        }
    }


    const ValidCharacter = (character) => {
        try {

            const charaLength = character.length;
            if (charaLength < 2) {
                const newChara = '0' + character
                return newChara;
            } else {
                return character
            }

        } catch (errValidChar) {
            log.debug('errValidChar', errValidChar)
        }
    }


    const convertDateFormat = (date) => {
        if (date != '' && date != null && date != ' ') {

            const dateFormat = date.split('/') //2020-09-02

            const day = dateFormat[0]
            const month = dateFormat[1]
            const year = dateFormat[2]
            const dateFormated = month + '/' + day + '/' + year

            return dateFormated

        }
        return ''
    }


    const uuidv4 = () => {
        var d = new Date().getTime();//Timestamp
        var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16;//random number between 0 and 16
            if (d > 0) {//Use timestamp until depleted
                r = (d + r) % 16 | 0;
                d = Math.floor(d / 16);
            } else {//Use microseconds since page-load if supported
                r = (d2 + r) % 16 | 0;
                d2 = Math.floor(d2 / 16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    };


    return {
        afterSubmit: afterSubmit
    }
});