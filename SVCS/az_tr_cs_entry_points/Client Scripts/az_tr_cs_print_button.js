/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define([], function () {
    const onButtonClick = (id) => {
        try {
            window.open("/app/site/hosting/scriptlet.nl?script=5193&deploy=1&recId=" + id + "")
        } catch (error) {
            log.debug({ title: "error", details: JSON.stringify(error) });
        }
    }
    return {
        pageInit: () => {
            return true;
        },
        onButtonClick: onButtonClick,
    };
});