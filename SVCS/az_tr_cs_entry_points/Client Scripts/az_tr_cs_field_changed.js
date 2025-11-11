/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */

 // this client script calculates the age and set the Age field with the value 
 // with respect to the changes happen in the birthdate field
define(['N/log'], function(log) {

    function fieldChanged(context) {
        try {
            const record = context.currentRecord;

            if(context.fieldId === 'custrecord_az_tr_bd'){

                const birthdate = record.getValue({
                    fieldId: 'custrecord_az_tr_bd'
                });

                calculateAge(birthdate, record);
                
            }
        } catch (e) {
            log.error ({ 
                title: e.name,
                details: e.message
            });           
        } 
    }
    
    function calculateAge(birthdate,record){
        if(birthdate){
            const today = new Date();
            const bDate = new Date(birthdate);
    
            let age = today.getFullYear() - bDate.getFullYear();
            
            if(today.getMonth() <bDate.getMonth() ||
            (today.getMonth()=== bDate.getMonth && today.getDate()<bDate.getDate())){
                age -- ;
            }
            record.setValue({
                fieldId: 'custrecord_az_tr_age',
                value: age ,
            })
        } 

    }

    return {
        fieldChanged: fieldChanged,
    }
});
