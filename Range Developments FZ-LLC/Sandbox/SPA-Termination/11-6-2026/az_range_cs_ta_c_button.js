/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define([], function () {
    const onButtonClick = (params) => {
        try {
            window.open("/app/site/hosting/scriptlet.nl?script=542&deploy=1&myRecId=" + params + "")
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
    