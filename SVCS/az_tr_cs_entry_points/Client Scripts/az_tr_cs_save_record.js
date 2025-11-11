/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */

//this client script makes sure that the sum of net salary and bonus must be at least 10000 
define([], function() {

    function saveRecord(context) {
        
        try {
            
            const record = context.currentRecord;
            const netSalary = parseFloat(record.getValue('custentity_az_tr_cust_net_sal'))||0;
            const bonus = parseFloat(record.getValue('custentity_az_tr_cust_bonus'))||0;
            
            const total = netSalary + bonus ;
            if(total < 10000){
                alert('the sum of net salary ('+ netSalary +' ) and bonus ('+bonus+') must be at least 10000');
                return false;
            }

            return true;
            
        } catch (error) {
            log.error({
                title: error.name,
                details: error.message
            });
        }
    }


    return {
        saveRecord: saveRecord,
    }
});
