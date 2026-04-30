/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/log'], function (log) {


    const onButtonClick = (id) => {
        try {
            window.open("/app/site/hosting/scriptlet.nl?script=2100&deploy=1&recId=" + id)
        } catch (errorOnButtonClick) {
            log.debug("errorOnButtonClick", errorOnButtonClick);
        }
    }
    return {  
        pageInit: () => {return true;},
        onButtonClick };
});