/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url'], function (currentRecord,url) {
    const onButtonClick = () => {
        try {
            const rec = currentRecord.get();
            const recId = rec.id;


            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_az_spg_sl_cheque_prt_temp',
                deploymentId: 'customdeploy_az_spg_sl_cheque_prt_temp',
                params: {
                    recId: recId
                }
            });

            window.open(suiteletUrl);
            
        } catch (errorOnButtonClick) {
            log.debug("errorOnButtonClick",errorOnButtonClick);
        }
    }
    return {
        pageInit: () => {return true;},
        onButtonClick: onButtonClick,
    };
});