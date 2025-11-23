/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search','N/ui/serverWidget'], function (search,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const vendorId = record.getValue("entity");
                const primaryContact = getPrimaryContact(vendorId);
                setData(primaryContact,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

   const getPrimaryContact = (vendorId) => {
        try {
            if (!vendorId) return "";

            const contact_search = search.create({
                type: "contact",
                filters: [
                    ["company", search.Operator.IS, vendorId],
                    "AND",
                    ["custentity_az_bas_cont_prim_contact", "is", "T"]
                ],
                columns: ["entityid"]
            }).run().getRange({ start: 0, end: 1 });

            if (contact_search && contact_search.length > 0) {
                return contact_search[0].getValue("entityid");
            }

            return " ";

        } catch (errorGetPrimaryContact) {
            log.debug("errorGetPrimaryContact", errorGetPrimaryContact);
        }
    };


    const setData = (primaryContact,context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            
            const data = {
                primaryContact:primaryContact
            };
            
            custrecord.defaultValue = JSON.stringify(data);
            
        };


        return {
            beforeLoad: beforeLoad
        };
    });
