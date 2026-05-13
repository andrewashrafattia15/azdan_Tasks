/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/ui/serverWidget','N/record'], function (search, serverWidget, record) {

    const beforeLoad = (context) => {
        try {
            if (context.type === context.UserEventType.PRINT){

                const rec = context.newRecord;               
                let customerId;
                let resellerTRN;
                let resellerAddress;

            if (rec.type === 'vendorbill') {

                const lineCount = rec.getLineCount({ sublistId: 'purchaseorders' });
                let poId = null;
                for (let i = 0; i < lineCount; i++) {
                    const tempPoId = rec.getSublistValue({
                        sublistId: 'purchaseorders',
                        fieldId: 'id',
                        line: i
                    });

                    if (tempPoId) {
                        poId = tempPoId;
                        break;
                    }
                }
               const result = handlePurchaseOrder(poId);

                if (result) {
                    customerId = result.customerId;
                    resellerTRN = result.resellerTRN;
                    resellerAddress = result.resellerAddress;
                }
            }    
            else if (rec.type === 'vendorcredit') {

                const bill = rec.getValue('createdfrom');

                if (!bill) return;

                const billRec = record.load({
                    type: 'vendorbill',
                    id: bill
                });
                const lineCount = billRec.getLineCount({ sublistId: 'purchaseorders' });
                let poId = null;
                for (let i = 0; i < lineCount; i++) {
                    const tempPoId = billRec.getSublistValue({
                        sublistId: 'purchaseorders',
                        fieldId: 'id',
                        line: i
                    });

                    if (tempPoId) {
                        poId = tempPoId;
                        break;
                    }
                }
               const result = handlePurchaseOrder(poId);

                if (result) {
                    customerId = result.customerId;
                    resellerTRN = result.resellerTRN;
                    resellerAddress = result.resellerAddress;
                }
            }
            else if (rec.type === 'purchaseorder') {
                const poId = rec.id;
                const result = handlePurchaseOrder(poId);

                log.debug("Purchase Order Result", result);

                if (result) {
                    customerId = result.customerId;
                    resellerTRN = result.resellerTRN;
                    resellerAddress = result.resellerAddress;
                }
            } 
            else 
                {
                    customerId = rec.getValue('custbody_az_spg_enduser');
                }

            if (!customerId) return;
            
            const customerData = getCustomerData(customerId);
            const contacts = getContacts(customerData.id);  
            setData(customerData, contacts,resellerAddress,resellerTRN, context);
            }

        } catch (e) {
            log.debug("beforeLoad error", e);
        }
    };


    // ================= CUSTOMER DATA =================
    const getCustomerData = (customerId) => {
        try {
            const customerRec = record.load({
                type: record.Type.CUSTOMER,
                id: customerId
            });

            return {
                id: customerId,
                name: customerRec.getValue({ fieldId: 'companyname' }) || '',
                address: customerRec.getValue({ fieldId: 'defaultaddress' }) || '',
                trn: customerRec.getValue({ fieldId: 'vatregnumber' }) || '',
                website: customerRec.getValue({ fieldId: 'url' }) || ''
            };

        } catch (error) {
            log.debug("getCustomerData error", error);
        }
    };


    // ================= CONTACTS =================
    const getContacts = (customerId) => {

        try {
            const contacts = [];
    
            search.create({
                type: search.Type.CONTACT,
                filters: [
                    ['company', 'anyof', customerId],
                    'AND',
                    ['contactrole', 'anyof', "-10"]
                ],
                columns: [
                    'entityid',
                    'phone',
                    'email',
                ]
            }).run().each(result => {
    
                const first = result.getValue('entityid') || '';
                const phone = result.getValue('phone') || '';
                const email = result.getValue('email') || '';
                contacts.push({
                        name: first ,
                        email: email ,
                        phone: phone ,
                    });
                
    
                return true;
            });
    
            return contacts;
            
        } catch (error) {
            log.debug("getContacts error", error);
        }
    };

    const handlePurchaseOrder = (poId) => {
        try {

            let customerId = null;

            if (!poId) return customerId;

            const poRec = record.load({
                type: 'purchaseorder',
                id: poId
            });

            const salesOrderId = poRec.getValue('custbody_az_spg_salesorder_no');

            if (!salesOrderId) return { customerId};

            const soData = search.lookupFields({
                type: 'salesorder',
                id: salesOrderId,
                columns: ['custbody_az_spg_enduser','custbody_az_spg_reseller.vatregnumber','billaddress']
            });

            customerId = soData.custbody_az_spg_enduser?.[0]?.value;
            resellerTRN = soData['custbody_az_spg_reseller.vatregnumber'] || '';
            resellerAddress = soData.billaddress || '';

            return  {customerId, resellerAddress, resellerTRN};

        } catch (error) {
            log.debug("handlePurchaseOrder error", error);
        }
    };


    // ================= PASS DATA =================
    const setData = (customerData, contacts,resellerAddress,resellerTRN, context) => {

        const field = context.form.addField({
            id: 'custpage_customer_contacts',
            type: serverWidget.FieldType.LONGTEXT,
            label: 'Customer & Contacts'
        });

        field.defaultValue = JSON.stringify({
            customer: customerData,
            contacts: contacts,
            resellerAddress: resellerAddress,
            resellerTRN: resellerTRN
        });
    };


    return { beforeLoad };
});