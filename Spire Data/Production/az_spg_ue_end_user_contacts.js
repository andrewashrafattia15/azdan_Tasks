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
                let trn ;

           
                if (rec.type === 'purchaseorder') {

                    const salesOrderId = rec.getValue('custbody_az_spg_salesorder_no');

                    if (salesOrderId) {
                        const soData = search.lookupFields({
                            type: 'salesorder',
                            id: salesOrderId,
                            columns: ['custbody_az_spg_enduser','entity']
                        });

                        customerId = soData.custbody_az_spg_enduser?.[0]?.value;
                        const customer = soData.entity[0]?.value;

                        if(customer) {
                            const custData = search.lookupFields({
                            type: 'customer',
                            id: customer,
                            columns: ['vatregnumber']
                        });
                        trn = custData.vatregnumber || '';      
                    }else{
                        trn = '';
                    }
                }

                } else {
                    customerId = rec.getValue('custbody_az_spg_enduser');
                }

            if (!customerId) return;

                if (!customerId) return;
                const customerData = getCustomerData(customerId);
                const contacts = getContacts(customerData.id);  
                setData(customerData,trn, contacts, context);
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
                    ['company', 'anyof', customerId]
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


    // ================= PASS DATA =================
    const setData = (customerData, trn, contacts, context) => {

        const field = context.form.addField({
            id: 'custpage_customer_contacts',
            type: serverWidget.FieldType.LONGTEXT,
            label: 'Customer & Contacts'
        });

        field.defaultValue = JSON.stringify({
            customer: customerData,
            trn: trn,
            contacts: contacts
        });
    };


    return { beforeLoad };
});