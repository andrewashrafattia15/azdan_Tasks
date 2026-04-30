/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search','N/record' ,'N/render', 'N/log'], (search, record, render, log) => {

    const onRequest = (context) => {
        try {
            if (context.request.method == 'GET') {
                const recordId = context.request.parameters.recId;

                if (!recordId) {
                    context.response.write(' Missing Record ID.');
                    return;
                }

                const{header,subsidiaryData,vendorData,purchaseOrderData,customerData,itemLines}= getItemReceiptData(recordId);

                let template = getTemplateHeader(subsidiaryData,header);
                template = getTemplateBody(template,header,vendorData,purchaseOrderData,customerData,itemLines);
                finalizeTemplate(template, context, { header,vendorData,purchaseOrderData,customerData,itemLines});
            }
        } catch (err) {
            log.debug('onRequest Error', err);
        }
    };

    const getSubsidiaryData = (subsidiaryID) => {
        try {
            if (!subsidiaryID) return '';

            const subsidiaryRec = record.load({
                type: record.Type.SUBSIDIARY,
                id: subsidiaryID
            });

            const subsidiaryName = subsidiaryRec.getText({
                fieldId: 'name'
            });

            const subsidiaryAddress = subsidiaryRec.getText({
                fieldId: 'mainaddress_text'
            });

            const vatRegNum = subsidiaryRec.getText({
                fieldId: 'federalidnumber'
            });

            const subsidiaryPhone = subsidiaryRec.getText({
                fieldId: 'custrecord_az_cbc_subsidiary_phone'
            });
            
            const subsidiaryEmail = subsidiaryRec.getText({
                fieldId: 'custrecord_az_cbc_subsidiary_email'
            });

            return {
                subName: subsidiaryName,
                subAddress: subsidiaryAddress,
                subVAT: vatRegNum,
                subsidiaryPhone:subsidiaryPhone,
                subsidiaryEmail:subsidiaryEmail,
                logoURL : 'https://11514133.app.netsuite.com/core/media/media.nl?id=6464&amp;c=11514133&amp;h=lx_xN7gnXfTKWIC2adfDfhEAcuZuGgTNBzyj8EQ0HVCp7Zz2'
            };


        } catch (errorGetSubsidiaryData) {
            log.debug('errorGetSubsidiaryData', errorGetSubsidiaryData);
        }
    };

    const getItemReceiptData = (itemReceiptID) => {
        
        try {

            let header = {};

            const headerSearch = search.create({
                type: 'itemreceipt',
                filters: [
                    ['internalid', 'anyof', itemReceiptID],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: [
                    'tranid', 
                    'entity', 
                    'trandate', 
                    'createdfrom', 
                    'subsidiary',
                    'currency',
                    'location',
                    'custbody_az_cbc_vendor_ref_number',
                    'custbody_az_g_trx_created_by',
                    'custbody_az_cbc_return_reason',
                    'custbody_az_cbc_details_for_return',
                    'memo'
                ]
            });

            const headerResult = headerSearch.run().getRange({ start: 0, end: 1 });
             if (headerResult!= null || headerResult!= '' ) {
                    header = {
                        tranid: headerResult[0].getValue('tranid') || '',
                        entity: headerResult[0].getText('entity') || '',
                        trandate: headerResult[0].getValue('trandate') || '',
                        createdFrom: headerResult[0].getText('createdfrom') || '',
                        currency: headerResult[0].getText('currency') || '',                  
                        subsidiaryid: headerResult[0].getValue('subsidiary') || '',
                        subsidiary: headerResult[0].getText('subsidiary') || '',
                        createdFromFirstWord: headerResult[0].getText('createdfrom') 
                         ?  headerResult[0].getText('createdfrom') .trim().split(/\s+/)[0]: '',
                        location: headerResult[0].getText('location')|| '',
                        vendorRefNumber: headerResult[0].getValue('custbody_az_cbc_vendor_ref_number')|| '',
                        createdBy: headerResult[0].getText('custbody_az_g_trx_created_by')|| '',
                        returnReason: headerResult[0].getValue('custbody_az_cbc_return_reason')|| '',
                        details: headerResult[0].getValue('custbody_az_cbc_details_for_return')|| '',
                        memo: headerResult[0].getValue('memo')|| '',
                    };
            }
            const subsidiaryData = getSubsidiaryData(header.subsidiaryid);
            const createdFromType = headerResult[0].getText('createdfrom') 
                         ?  headerResult[0].getText('createdfrom') .trim().split(/\s+/)[0]: '';
            const createdFromID = headerResult[0].getValue('createdfrom');

            let vendorData = {};
            let customerData = {};

            if(createdFromType == 'Purchase'){
                vendorData = getVendorData(headerResult[0].getValue('entity'));
            }
            else{
                customerData = getCustomerData(headerResult[0].getValue('entity'))
            }

            const purchaseOrderData = getPurchaseOrderData(createdFromID);
            
            const itemLines = getItemLines(itemReceiptID,createdFromID,createdFromType);

            return {header,subsidiaryData,vendorData,purchaseOrderData,customerData,itemLines};

            } catch (erorGetItemReceiptData) {
                log.debug('erorGetItemReceiptData', erorGetItemReceiptData);
            }

    };

    const getItemLines = (itemReceiptID, createdFromID, createdFromType) => {
        try {
            const irRec = record.load({
                type: record.Type.ITEM_RECEIPT,
                id: itemReceiptID,
                isDynamic: false
            });

            
            let sourceQtyMap = {};

            if (createdFromType === 'Purchase') {
                sourceQtyMap = getSourceQtyMap(
                    record.Type.PURCHASE_ORDER,
                    createdFromID
                );
            } else if (createdFromType === 'Return') {
                sourceQtyMap = getSourceQtyMap(
                    'returnauthorization',
                    createdFromID
                );
            }

            
            const itemLines = [];
            const lineCount = irRec.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < lineCount; i++) {
                const itemId = irRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                itemLines.push({
                    itemId,
                    itemName: irRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'displayname',
                        line: i
                    }),
                    description: irRec.getSublistText({
                        sublistId: 'item',
                        fieldId: 'description',
                        line: i
                    }),
                    units: irRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'units',
                        line: i
                    }),
                    receiptQuantity: irRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    }),
                    sourceQuantity: sourceQtyMap[itemId] || 0,
                    rate: irRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i
                    }),
                    additionalNote: irRec.getSublistText({
                        sublistId: 'item',
                        fieldId: 'custcol_az_cbc_additional_note',
                        line: i
                    }),
                    exchangeRate : irRec.getValue('exchangerate')
                });
            }

            return itemLines;

        } catch (err) {
            log.debug('getItemLines Error', err);
        }
    };

    const getSourceQtyMap = (recordType, recordId) => {
        const rec = record.load({
            type: recordType,
            id: recordId,
            isDynamic: false
        });

        const qtyMap = {};
        const lineCount = rec.getLineCount({ sublistId: 'item' });

        for (let i = 0; i < lineCount; i++) {
            const itemId = rec.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });

            const quantity  = rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });

            if (itemId) {
                qtyMap[itemId] = quantity;
            }
        }

        return qtyMap;
    };

    const getVendorData = (vendorID) => {
        try {
             if (!vendorID) return {};

        const vendor = search.lookupFields({
            type: search.Type.VENDOR,
            id: vendorID,
            columns: [
                'entityid',
                'altname',
                'email',
                'phone',
                'vatregnumber',
            ]
        });

        return {
            vendorID: vendor.entityid || '',
            vendorName: vendor.altname || '',
            vendorEmail: vendor.email || '',
            vendorPhone: vendor.phone || '',
            vendorTRN: vendor.vatregnumber || '',
            vendorAddress: getAddress(record.Type.VENDOR,vendorID) || ''
        };

        } catch (errorGetVendorData) {
            log.debug('errorGetVendorData',errorGetVendorData)
        }
    }

    const getAddress = (type,ID) => {
        try {
            if (!type ||!ID||isNaN(ID)) return '';

            const rec = record.load({
                type: type,
                id: Number(ID),
                isDynamic: false
            });

            const address = rec.getValue({ fieldId: 'defaultaddress' }) || '';

           return address||'';

        } catch (errorGetAddress) {
            log.debug('errorGetAddress', errorGetAddress);
        }
    };

    const getPurchaseOrderData = (purchaseOrderID) => {
        try {

        if (!purchaseOrderID) return {};

            const poRec = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: purchaseOrderID
            });

            return {
                employee: poRec.getText({ fieldId: 'employee' }) || '',
                shipmethod: poRec.getText({ fieldId: 'shipmethod' }) || '',
                incoterm: poRec.getText({ fieldId: 'incoterm' }) || '',
                terms: poRec.getText({ fieldId: 'terms' }) || '',
                duedate: poRec.getValue({ fieldId: 'duedate' }) || ''
            };

        } catch (errorGetPurchaseOrderData) {
            log.debug('errorGetPurchaseOrderData',errorGetPurchaseOrderData)
            return {};
        }
    }

    const getCustomerData = (customerID) => {
        try {
             if (!customerID) return {};

        const customer = search.lookupFields({
            type: search.Type.CUSTOMER,
            id: customerID,
            columns: [
                'companyname',
                'entityid'
            ]
        });
        
        return {
            customerName: customer.companyname || '',
            customerID: customer.entityid || '',
            customerAddress: getAddress(record.Type.CUSTOMER,customerID) || ''
        };

        } catch (errorGetVendorData) {
            log.debug('errorGetVendorData',errorGetVendorData)
        }
    }

    const numberToEnglishWords = (amount,currency) => {
        try {
            
            const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
            const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
            const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
            const thousands = ["", "Thousand", "Million", "Billion"];
            
            const convert_hundreds = (num) => {
                let result = "";
                
                if (num > 99) {
                    let hundred = Math.floor(num / 100);
                    result += ones[hundred] + " Hundred";
                    num %= 100;
                }
                
                if (num >= 10 && num < 20) {
                    result += teens[num - 10];
                } else if (num >= 20) {
                    let t = Math.floor(num / 10);
                    let o = num % 10;
                    if (o > 0) result += tens[t] + "-" + ones[o];
                    else result += tens[t];
                } else if (num > 0) {
                    result += ones[num];
                }
                
                return result.trim();
            }
        
            const convert_number = (num) => {
                if (num === 0) return "zero";
                let parts = [];
                let i = 0;
                
                while (num > 0) {
                    let n = num % 1000;
                    if (n > 0) {
                        let section = convert_hundreds(n);
                        if (i > 0) section += " " + thousands[i];
                        parts.unshift(section);
                    }
                    num = Math.floor(num / 1000);
                    i++;
                }
                
                return parts.join(" ");
            }
            
            let integerPart = Math.floor(amount);
            let decimalPart = Math.round((amount - integerPart) * 100);
            
            
            let words = convert_number(integerPart) + " ";
            if(currency == "AED"){
                words = "Dirham " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                }   
            }
            else if(currency == "USD"){
                words = "Dollar " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            else if(currency == "CAD"){
                words = "Canadian Dollar " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            else if(currency == "EUR"){
                words = "Euro " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            else if(currency == "GBP"){
                words = "British Pound Sterling " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            else if(currency == "OMR"){
                words = "Omani Rial " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            else if(currency == "QAR"){
                words = "Qatari Riyal " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            else if(currency == "CNY"){
                words = "Chinese Yuan Renminbi " + words ;
                if (decimalPart > 0) {
                    words += " and " + convert_number(decimalPart) ;
                } 
            }
            return words;
            } catch (errorNumberToEnglishWords) {
                log.debug("errorNumberToEnglishWords",errorNumberToEnglishWords);
            }
    }


    const getTemplateHeader = (subsidiaryData,header) => {
        try {        
            let template = '';
    
            template += '<?xml version="1.0"?>';
            template += '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            template += '<pdf>';
            template += '<head>';
    
            template += '<link name="NotoSans" type="font" subtype="truetype" ';
            template += 'src="${nsfont.NotoSans_Regular}" ';
            template += 'src-bold="${nsfont.NotoSans_Bold}" ';
            template += 'src-italic="${nsfont.NotoSans_Italic}" ';
            template += 'src-bolditalic="${nsfont.NotoSans_BoldItalic}" ';
            template += 'bytes="2" />';
    
            template += '<macrolist>';
    
            template += '<macro id="nlheader">';
            template += '<table class="header" style="width:100%;">';
    
            template += '<tr>';
            template += '<td rowspan="5" align="left" width="25%" style="padding-bottom:5px; vertical-align:middle;">';
            template += '<img src="'+ (subsidiaryData.logoURL||'') + ' " style="width:150px; height:75px;" />';
            template += '</td>';
    
            if(header.createdFromFirstWord=='Purchase'){
                template += '<td width="20%" style="font-size:9px;">';
                template += ' ' + (header.subsidiary ? header.subsidiary.split(':').pop().trim() : '') + ' ';
                template += '</td>';
        
                template += '<td width="55%" rowspan="4" align="right" ';
                template += 'style="vertical-align:middle; color:#007115; font-size:38px; font-weight:bold;">';
                template += 'Goods Receipt Note';
                template += '</td>';
                template += '</tr>';
        
                template += '<tr>';
                template += '<td style="font-size:8px;">' + (subsidiaryData.subAddress||'') + ' </td>';
                template += '</tr>';
        
                template += '<tr>';
                template += '<td style="font-size:8px;">TRN:' + (subsidiaryData.subVAT||'') + '</td>';
                template += '</tr>';
        
                template += '<tr>';
                template += '<td style="font-size:8px;">Telephone: ' + (subsidiaryData.subsidiaryPhone||'') + '</td>';
                template += '</tr>';
                template += '<tr>';
                template += '<td style="font-size:8px;">Email: ' + (subsidiaryData.subsidiaryEmail||'') + '</td>';
                template += '<td align="right" style="vertical-align:middle; font-size:12px; font-weight:bold;">';
                template += 'THIS IS NOT A TAX INVOICE';
                template += '</td>';
                template += '</tr>';
            }else {
    
                template += '<td width="50%" rowspan="4" align="right" ';
                template += 'style="vertical-align:middle; color:#007115; font-size:38px; font-weight:bold;">';
                template += 'Goods Return Check list';
                template += '</td>';
                template += '</tr>';
            }
            template += '</table>';
            template += '</macro>';
    
            if(header.createdFromFirstWord=='Purchase'){
            template += '<macro id="nlfooter">';
            template += '<table class="footer" style="width:100%;">';
            template += '<tr>';
            template += '<td align="center" style="font-size:9px; font-weight:bold;">';
            template += '----------------------- ELECTRONICALLY GENERATED REPORT, NO SIGNATURE REQUIRED------------------------ ';
            template += '</td>';
            template += '</tr>';
            template += '</table>';
            template += '</macro>';
            }
    
            template += '</macrolist>';
            template += '</head>';
    
            template += '<body header="nlheader" header-height="10%" ';
            template += 'footer="nlfooter" footer-height="20pt" ';
            template += 'padding="0.3in 0.5in 0.5in 0.5in" size="Letter">';
            
            return template;

        } catch (errorGetTemplateHeader) {
            log.debug('errorGetTemplateHeader',errorGetTemplateHeader)
        }
    };



    const getTemplateBody = (template, header,vendorData,purchaseOrderData,customerData,itemLines) => {
        try {

            
            if(header.createdFromFirstWord=='Purchase'){

                /** 1st Table (Item Receipt Header) */

                    template += '<table width="100%">';
                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border:0.5px;font-size:9px;font-weight:bold">GRN No.</td>';
                    template += '<td width="29%" style="border-top:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (header.tranid||'') + '</td>';
                    template += '<td></td>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border:0.5px;font-size:9px;font-weight:bold">Vendor Address</td>';
                    template += '<td width="29%" style="border-top:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (vendorData.vendorAddress||'') + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">GRN Date</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (header.trandate||'') + '</td>';
                    template += '<td></td>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Vendor Ref</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (header.vendorRefNumber||'') + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">PO Ref</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (header.createdFrom||'') + '</td>';
                    template += '<td></td>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Vendor Contact</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">';
                    template += '<table width="100%">'
                    template += '<tr><td style="padding-left:0;padding-right:0;border-bottom:1px">Tel.: ' + (vendorData.vendorPhone||'') + '</td></tr>'
                    template += '<tr><td style="padding-left:0;padding-right:0">Email: ' + (vendorData.vendorEmail||'') + '</td></tr>'
                    template += '</table>'
                    template += '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Vendor ID</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (vendorData.vendorID||'') + '</td>';
                    template += '<td></td>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Shipping Method</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (purchaseOrderData.shipmethod||'') + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Vendor Name</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (vendorData.vendorName||'') + '</td>';
                    template += '<td></td>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Shipping terms</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (purchaseOrderData.incoterm||'') + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Vendor TRN</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (vendorData.vendorTRN||'') + '</td>';
                    template += '<td></td>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Payment Terms</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (purchaseOrderData.terms||'') + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" rowspan="2" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Buyer Name</td>';
                    template += '<td width="29%" rowspan="2" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (purchaseOrderData.employee || '').split(' ').slice(1).join(' ') + '</td>';
                    template += '<td></td>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Need By Date</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (purchaseOrderData.duedate||'') + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td></td>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Place of Delivery</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (header.location||'') + '</td>';
                    template += '</tr>';

                    template += '</table>';

                // -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                /** 2nd Table (Item Receipt Lines) */

                    template += '<table width="100%" style="padding-top:10px">';

                    template += '<tr>';

                    template += '<td width="6%" align="center" style="vertical-align:middle;font-size:9px;background-color:#D9F1D0;border:0.5px solid black">SL NO.</td>';
                    template += '<td width="11%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">Item Code</td>';
                    template += '<td width="18%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">Item Description</td>';
                    template += '<td width="5%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">UOM</td>';
                    template += '<td width="5%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">PO<br/>  QTY</td>';
                    template += '<td width="5%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">Received<br/>  QTY</td>';
                    template += '<td width="10%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">Unit Rate</td>';
                    template += '<td width="6%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">Total<br/> FC</td>';
                    template += '<td width="6%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">Disc</td>';
                    template += '<td width="6%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">Total<br/>  (AED)</td>';
                    template += '<td width="7%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;">Additional<br/>  Note</td>';

                    template += '</tr>';
                    
                    let sn = 0;
                    let subTotal = 0;
                    let grandTotalFC = 0;
                    let grandTotalAED = 0;
                    for (let i = 0; i < itemLines.length; i++) {
                        const line = itemLines[i];
                        sn++;

                        const totalFC = line.receiptQuantity * line.rate;
                        subTotal += totalFC ;
                        grandTotalFC += totalFC ;
                        grandTotalAED+= Number(totalFC * line.exchangeRate) ;

                        template += '<tr>';

                        template += '<td align="center" style="border-left:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + sn + '</td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + (line.itemName || '') + '</td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + (line.description || '') + '</td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + (line.units || '') + '</td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + (line.sourceQuantity || '') + '</td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + (line.receiptQuantity || '') + '</td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' 
                                    + (line.rate ? Number(line.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '') 
                                    + '</td>';

                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' 
                                    + (totalFC ? Number(totalFC).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '') 
                                    + '</td>';

                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;"></td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' 
                                    + (totalFC && line.exchangeRate ? Number(totalFC * line.exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '') 
                                    + '</td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + (line.additionalNote || '') + '</td>';

                        template += '</tr>';
                    }
                    template += '</table>'

                // --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
                
                /** 3rd Table (Total in words and the Summary "subtotal , discount , grand total FC , grand total AED") */

                    template += '<table width="100%" style="padding-top:10px">'

                    template += '<tr>';
                    template += '<td rowspan="4" colspan="4" width="50%">Total in words :'
                    template += '<br/> '+(numberToEnglishWords(grandTotalAED,header.currency)||'')+''
                    template += '</td>';
                    template += '<td width="20%" align="left" colspan="3" style="border-top:0.5px solid black;border-left:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;">SUBTOTAL (FC)</td>';
                    template += '<td width="30%" align="left"  colspan="4" style="border-top:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;font-weight:bold;vertical-align:middle;font-size:9px;">' + (subTotal ? Number(subTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '') + '</td>';
                    template += '<td></td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td align="left" colspan="3" style="border-left:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;">Discount</td>';
                    template += '<td align="left" colspan="4" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-weight:bold;vertical-align:middle;font-size:9px;"> </td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td align="left" colspan="3" style="border-left:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;">Grand Total (FC)</td>';
                    template += '<td align="left" colspan="4" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-weight:bold;vertical-align:middle;font-size:9px;">' + (grandTotalFC ? Number(grandTotalFC).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '') + ' </td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td align="left" colspan="3" style="border-left:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;">Grand Total (AED)</td>';
                    template += '<td align="left" colspan="4" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-weight:bold;vertical-align:middle;font-size:9px;">' + (grandTotalAED ? Number(grandTotalAED).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '') + ' </td>';
                    template += '</tr>';

                    template += '</table>'

                // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
                
                /** 4th Table (Remarks )  */

                    template += '<table width="100%" style="padding-top:10px;">'
                    template += '<tr><td style="border:1px"><span style="font-weight:bold">Remarks: </span>'+header.memo +'</td></tr>';
                    template += '</table>'

                // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                /** 5th Table (Goods Received By ,WH stamp, Document received by, Finance stamp) */

                    template += '<table width="100%" style="padding-top:10px;">';


                    template += '<tr>';
                    template += '<td align="center" style="background-color:#D9F1D0; border-top:0.5px solid black; border-bottom:0.5px solid black; border-left:0.5px solid black; border-right:0.5px solid black; font-weight:bold; font-size:9px;">Goods Received By</td>';
                    template += '<td align="center" style="background-color:#D9F1D0; border-top:0.5px solid black; border-bottom:0.5px solid black; border-right:0.5px solid black; font-weight:bold; font-size:9px;">WH Stamp</td>';
                    template += '<td align="center" style="background-color:#D9F1D0; border-top:0.5px solid black; border-bottom:0.5px solid black; border-right:0.5px solid black; font-weight:bold; font-size:9px;">Document Received By</td>';
                    template += '<td align="center" style="background-color:#D9F1D0; border-top:0.5px solid black; border-bottom:0.5px solid black; border-right:0.5px solid black; font-weight:bold; font-size:9px;">Finance Stamp</td>';
                    template += '</tr>';


                    template += '<tr>';
                    template += '<td style=" border-bottom:0.5px solid black; border-left:0.5px solid black; border-right:0.5px solid black; height:40px;"></td>';
                    template += '<td style=" border-bottom:0.5px solid black; border-right:0.5px solid black;"></td>';
                    template += '<td style=" border-bottom:0.5px solid black; border-right:0.5px solid black;"></td>';
                    template += '<td style=" border-bottom:0.5px solid black; border-right:0.5px solid black;"></td>';
                    template += '</tr>';

                    template += '</table>';

                // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
            
            }else{

                /** 1st Table (Item Receipt Header) */

                    template += '<table width="100%">';
                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border:0.5px;font-size:9px;font-weight:bold">Check list No.</td>';
                    template += '<td width="29%" style="border-top:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;"> </td>';
                    template += '<td></td>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border:0.5px;font-size:9px;font-weight:bold">Customer Name</td>';
                    template += '<td width="29%" style="border-top:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (customerData.customerName||'') + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Date</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (header.trandate||'') + '</td>';
                    template += '<td></td>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Customer ID</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;"> ' + (customerData.customerID||'') + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Return request ref </td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (header.tranid||'') + '</td>';
                    template += '<td></td>';
                    template += '<td width="20%" rowspan="2" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Customer Address</td>';
                    template += '<td width="29%" rowspan="2" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">'+(customerData.customerAddress)+'</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Invoice ref</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (header.createdFrom||'') + '</td>';
                    template += '<td></td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Delivery Note ref </td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;"></td>';
                    template += '<td></td>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Prepared by </td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (header.createdBy||'') + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Salesperson</td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;"></td>';
                    template += '<td></td>';
                    template += '<td width="20%" rowspan="2" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Return Type</td>';
                    template += '<td width="29%" rowspan="2" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;"></td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Requestor </td>';
                    template += '<td width="29%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;"></td>';
                    template += '<td></td>';
                    template += '</tr>';

                    template += '</table>';

                // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                /** 2nd Table (Return Reason , Details) */
                
                    template += '<table width="100%" style="padding-top:30px">';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;border-top:0.5px;font-size:9px;font-weight:bold">Return Reason </td>';
                    template += '<td style="border-right:0.5px;border-bottom:0.5px;border-top:0.5px;font-size:9px;">' + (header.returnReason||'') + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;font-weight:bold">Details</td>';
                    template += '<td style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + (header.details||'') + '</td>';
                    template += '</tr>';

                    template += '</table>';

                // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
                
                /** 3rd Table (Item Receipt Lines) */
                    
                    template += '<table width="100%" style="padding-top:10px">';

                    template += '<tr>';

                    template += '<td width="10%" align="center" style="vertical-align:middle;font-size:9px;background-color:#D9F1D0;border:0.5px solid black">SL NO.</td>';
                    template += '<td width="10%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">Item Code</td>';
                    template += '<td width="20%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">Item Description</td>';
                    template += '<td width="10%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">UOM</td>';
                    template += '<td width="10%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">Return QTY</td>';
                    template += '<td width="15%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">Accepted QTY</td>';
                    template += '<td width="10%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-right:0.5px solid black;border-bottom:0.5px solid black;">Rejected QTY</td>';
                    template += '<td width="15%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;background-color:#D9F1D0;border-top:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;">Additional Note</td>';

                    template += '</tr>';
                    
                    let sn = 0;

                    let totalReturnQTY = 0, totalRejectedQTY = 0, totalAcceptedQTY = 0;

                    for (let i = 0; i < itemLines.length; i++) {
                        const line = itemLines[i];
                        sn++;
                        
                        const rejectedQTY = line.sourceQuantity - line.receiptQuantity;

                        totalReturnQTY += line.sourceQuantity ;
                        totalRejectedQTY += line.receiptQuantity ;
                        totalAcceptedQTY += rejectedQTY ;


                        template += '<tr>';

                        template += '<td align="center" style="border-left:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + sn + '</td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + (line.itemName || '') + '</td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + (line.description || '') + '</td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + (line.units || '') + '</td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + (line.sourceQuantity || '') + '</td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + (line.receiptQuantity || '') + '</td>';
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + ( rejectedQTY || '0') + '</td>'; 
                        template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px;">' + (line.additionalNote || '') + '</td>';

                        template += '</tr>';
                    }

                    template += '</table>';

                // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                /** 4th table (Totals , Recieved and checked by) */

                    template += '<table width="100%" style="padding-top:10px">';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border:0.5px;font-size:9px;font-weight:bold">Total Requested QTY</td>';
                    template += '<td width="20%" style="border-top:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + totalReturnQTY + '</td>';
                    template += '<td width="10%"></td>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border:0.5px;font-size:9px;font-weight:bold">Recieved By</td>';
                    template += '<td width="20%" style="border-top:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;"> </td>';
                    template += '<td width="10%" rowspan="3" style="border-top:0.5px;border-right:0.5px;border-bottom:0.5px;font-size:9px;">WH STAMP </td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-bottom:0.5px;border-right:0.5px;font-size:9px;font-size:9px;font-weight:bold">Total Rejected QTY </td>';
                    template += '<td width="20%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + totalAcceptedQTY + '</td>';
                    template += '<td width="10%"></td>';
                    template += '<td width="20%" rowspan="2" style="background-color:#D9F1D0;border-left:0.5px;border-bottom:0.5px;border-right:0.5px;font-size:9px;font-weight:bold">Checked By</td>';
                    template += '<td width="20%" rowspan="2"  style="border-right:0.5px;border-bottom:0.5px;font-size:9px;"> </td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td width="20%" style="background-color:#D9F1D0;border-left:0.5px;border-bottom:0.5px;border-right:0.5px;font-size:9px;font-size:9px;font-weight:bold">Total Accepted QTY  </td>';
                    template += '<td width="20%" style="border-right:0.5px;border-bottom:0.5px;font-size:9px;">' + totalRejectedQTY + '</td>';
                    template += '<td width="10%"></td>';
                    template += '</tr>';

                    template += '</table>';

                // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
            }

            return template;

        } catch (errorGetTemplateBody) {
            log.debug('Error in getTemplateBody', errorGetTemplateBody);
        }
    };

    const finalizeTemplate = (template, context, data) => {
        try {
            template += '</body></pdf>'; 
            const renderer = render.create();
            renderer.templateContent = template;
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'data',
                data: data
            });
            const pdfFile = renderer.renderAsPdf();
            context.response.writeFile(pdfFile, true);
        } catch (e) {
            log.debug('Error in finalizeTemplate', e);
        }
    };


    return { onRequest };
});
