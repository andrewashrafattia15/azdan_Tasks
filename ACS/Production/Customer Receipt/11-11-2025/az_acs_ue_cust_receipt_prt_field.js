/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/ui/serverWidget'], function (search,serverWidget) {

    const beforeLoad = (context) => {
        try {

            if (context.type === context.UserEventType.PRINT) {

                const record = context.newRecord;
                const recID = record.id;
                const {recieptAllocations,totalAmtToPay} = getReceiptAllocation(recID)
                setData(recieptAllocations,totalAmtToPay,context);
            }

        } catch (errBeforeLoad) {
            log.debug("errBeforeLoad", errBeforeLoad);
        }
    };

        const getReceiptAllocation = (recID) => {
            let recieptAllocations = [] ;
            let totalAmtToPay = 0 ;
            try {
                const receipt_All_Search = search.create({
                    type: "customrecord_az_acs_receipt_allocation",
                    filters: [
                        ['custrecord_az_acs_ra_receipt_no', search.Operator.IS, recID]
                    ],
                    columns: [
                         search.createColumn({
                            name: 'altname', 
                            join: 'custrecord_az_acs_ra_student'
                        }),
                        'custrecord_az_acs_ra_installment',
                        'custrecord_az_acs_ra_amount_to_pay',
                        'custrecord_az_acs_ra_so_no'
                    ]
                }).run().getRange(0, 1000);

                if (!receipt_All_Search || receipt_All_Search.length === 0) return '';

                for(let i=0;i<receipt_All_Search.length;i++){

                    if (receipt_All_Search[i]){

                        let studentName = receipt_All_Search[i].getValue({
                            name: 'altname', 
                            join: 'custrecord_az_acs_ra_student'
                        }) || ' ';

                        if (studentName.includes(':')) {
                            studentName = studentName.split(':').pop().trim();
                        }

                        const description = receipt_All_Search[i].getText('custrecord_az_acs_ra_installment') || ' ';
                        const amtToPay = parseFloat(receipt_All_Search[i].getValue('custrecord_az_acs_ra_amount_to_pay')) || 0;
                        const transNum =  receipt_All_Search[i].getText('custrecord_az_acs_ra_so_no') || ' ';

                        totalAmtToPay = totalAmtToPay + amtToPay;
                        recieptAllocations.push({
                            studentName:studentName,
                            description:description,
                            amtToPay:amtToPay,
                            transNum:transNum
                        })
                    }
                }
               
                return {recieptAllocations ,totalAmtToPay };

            } catch (errorGetReceiptAllocation) {
                log.debug("errorGetReceiptAllocation", errorGetReceiptAllocation);
            }
        }



    const setData = (recieptAllocations ,totalAmtToPay,context) => {

            const custrecord = context.form.addField({
                id: 'custpage_custrecord_to_print',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Text'
            });

            const data = {
                recieptAllocations:recieptAllocations,
                totalAmtToPay:totalAmtToPay
            };

            custrecord.defaultValue = JSON.stringify(data);
        };


        return {
            beforeLoad: beforeLoad
        };
    });
