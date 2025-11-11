/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */

// this client script displays an alert dialog with Nicely Done Message 
define(['N/ui/dialog'], function(dialog) {

    function pageInit() {
        const my_Alert = {
            title:'Andrew`s Alert',
            message:'Nicely Done !'
        };

        try {
            dialog.alert(my_Alert);
            log.debug({
                title: 'Alert',
                details: 'Alert displayed successfully !'
            }); 
        } catch (error) {
            log.error({
                title: error.name,
                details: error.message
            });
        }
    }

    return {
        pageInit: pageInit,
    }
});
