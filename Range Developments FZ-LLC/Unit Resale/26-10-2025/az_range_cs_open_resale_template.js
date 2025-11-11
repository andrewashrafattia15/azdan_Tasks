/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url'], (url) => {

    const pageInit = () => {
        // Required so the script has a valid entry point
        return true;
    };

    const onClick = () => {
        try {
            const rec = context.currentRecord;

            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_resale_pdf_suitelet',
                deploymentId: 'customdeploy_resale_pdf_suitelet',
                params: { recordId: rec.id }
            });

            window.open(suiteletUrl, '_blank');

        } catch (errorOnClick) {
            console.log('errorOnClick', errorOnClick);
        }
    };

    return {
        pageInit,
        onClick
    };
});
