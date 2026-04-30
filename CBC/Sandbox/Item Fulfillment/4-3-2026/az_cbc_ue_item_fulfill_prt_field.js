/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record','N/search','N/ui/serverWidget'], function ( record,search,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                
                const record = context.newRecord;
                const recID = record.id;
                const customerID = record.getValue('entity');
                const vendorID = record.getValue('entity');
                const subsidiaryID = record.getValue('subsidiary');
                const billToAddress = record.getText('billaddress');
                const salesOrderID = record.getValue('createdfrom');
                const createdFromText = record.getText({ fieldId: 'createdfrom' });
                const createdFrom = createdFromText ? createdFromText.split(' ')[0] : '';

                let customerData = {};
                let vendorData = {};
                let vraData = {};
                
                if(createdFrom == "Sales"){
                    customerData = getCustomerData(customerID);
                }
                else{
                    vendorData = getVendorData(vendorID);
                    vraData = getVRAData(salesOrderID);
                }

                const itemsData = getItemsData(record);

                const salesOrderData = getSOData(salesOrderID);
                const subsidiaryData = getSubsidiaryData(subsidiaryID);

                setData(salesOrderData,customerData,vendorData,vraData,subsidiaryData,itemsData,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

        const getItemsData = (record) => {
        try {
            const itemsData = [];
            const lineCount = record.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < lineCount; i++) {

                const itemId = record.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                if (!itemId) continue;

                const item = search.lookupFields({
                    type: search.Type.ITEM,
                    id: itemId,
                    columns: ['custitem_az_cbc_additional_item_note']
                });

                itemsData.push({
                    lineIndex: i,
                    extraValue: item.custitem_az_cbc_additional_item_note || ''
                });
            }

            return itemsData;
        } catch (errorGetItemsData) {
            log.debug("errorGetItemsData",errorGetItemsData)
        }
    }

    const getSOData = (salesOrderID) => {
        try {
            if (!salesOrderID) return '';


             const lookup = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: salesOrderID,
                columns: ['shipaddress']
            });

            const shipToAddress = lookup.shipaddress || '';
        

            return {
                shipToAddress:shipToAddress
            }

        } catch (errorGetSOData) {
            log.debug('errorGetSOData', errorGetSOData);
        }
    };

    const getCustomerData = (customerID) => {
        try {
            if (!customerID) return '';


            const customerRec = record.load({
                type: record.Type.CUSTOMER,
                id: customerID
            });
            
            const customer = customerRec.getValue({
                fieldId: 'entityid'
            });
            const customerName = customerRec.getValue({
                fieldId: 'companyname'
            });
            const customerPhone = customerRec.getValue({
                fieldId: 'phone'
            });
            const customerTRN = customerRec.getValue({
                fieldId: 'vatregnumber'
            });
            const customerAddress = customerRec.getText({
                fieldId: 'defaultaddress'
            });

            return {
                customer:customer,
                customerName:customerName,
                customerPhone:customerPhone,
                customerTRN:customerTRN,
                customerAddress:customerAddress
            }

        } catch (errorGetCustomerData) {
            log.debug('errorGetCustomerData', errorGetCustomerData);
        }
    };

    const getVendorData = (vendorID) => {
        try {
            if (!vendorID) return '';

            const vendorRec = record.load({
                type: record.Type.VENDOR,
                id: vendorID
            });

            const vendor = vendorRec.getValue({
                fieldId: 'entityid'
            });
            const vendorName = vendorRec.getValue({
                fieldId: 'altname'
            });
            const vendorPhone = vendorRec.getValue({
                fieldId: 'phone'
            });
            const vendorEmail = vendorRec.getValue({
                fieldId: 'email'
            });
            const vendorTRN = vendorRec.getValue({
                fieldId: 'vatregnumber'
            });
            const vendorAddress = vendorRec.getText({
                fieldId: 'defaultaddress'
            });

            return {
                vendor:vendor,
                vendorName:vendorName,
                vendorPhone:vendorPhone,
                vendorEmail:vendorEmail,
                vendorTRN:vendorTRN,
                vendorAddress:vendorAddress}

        } catch (errorGetVendorData) {
            log.debug('errorGetVendorData', errorGetVendorData);
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

            return {
                subName: subsidiaryName,
                subAddress: subsidiaryAddress,
                subVAT: vatRegNum
            };


        } catch (errorGetSubsidiaryData) {
            log.debug('errorGetSubsidiaryData', errorGetSubsidiaryData);
        }
    };

    const getVRAData = (vraID) => {
        try {
            if (!vraID) return '';

            const vraRec = record.load({
                type: record.Type.VENDOR_RETURN_AUTHORIZATION,
                id: vraID,
                isDynamic: false
            });

            const lines = [];

            const grossAmtTotal = vraRec.getValue('usertotal');
            const currency = vraRec.getText('currency');
            const taxTotal = vraRec.getValue('taxtotal');

            const lineCount = vraRec.getLineCount({ sublistId: 'item' });
            const totalInWords = numberToEnglishWords(grossAmtTotal,currency);

            for (let i = 0; i < lineCount; i++) {
                const amount = vraRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    line: i
                });

                const taxAmount = vraRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'tax1amt',
                    line: i
                });

                const grossAmount = vraRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'grossamt',
                    line: i
                });

                const additionalNote = vraRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_az_cbc_additional_note',
                    line: i
                });
                lines.push({
                    amount:amount, 
                    taxAmount:taxAmount, 
                    grossAmount:grossAmount, 
                    additionalNote:additionalNote 
                });
            }
            return {
                lines:lines,
                totalInWords:totalInWords,
                subTotal:grossAmtTotal-taxTotal,
                VAT:taxTotal,
                grossAmtTotal:grossAmtTotal,
            };


        } catch (errorGetVRAData) {
            log.debug('errorGetVRAData', errorGetVRAData);
        }
    };

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
                    result += ones[hundred] + " Hundred ";
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

    const setData = (salesOrderData,customerData,vendorData,vraData,subsidiaryData,itemsData,context) => {


            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            
            const data = {
                salesOrderData:salesOrderData,
                customerData:customerData,
                subsidiaryData:subsidiaryData,
                vendorData:vendorData,
                vraData:vraData,
                itemsData:itemsData,
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
        };


        return {
            beforeLoad: beforeLoad
        };
    });
