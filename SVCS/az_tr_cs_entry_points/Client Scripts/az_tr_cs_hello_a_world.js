/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/

// this script displays an alert dialog with hello world message for the 'Task' record type

define(['N/ui/dialog'],
    function(dialog) {
        function helloWorld() {
            const options = {
                title: 'Hello!',
                message: 'Hello, World!'
            };
        
            try {
           
                dialog.alert(options);
           
                log.debug ({
                    title: 'Success',
                    details: 'Alert displayed successfully'
                });
        
            } catch (e) {
           
                log.error ({ 
                    title: e.name,
                    details: e.message
                });           
            } 
        }
              
    return {
        pageInit: helloWorld
    };
 });