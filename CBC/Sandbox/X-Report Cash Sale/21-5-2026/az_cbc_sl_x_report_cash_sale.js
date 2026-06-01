/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/redirect'], (serverWidget, redirect) => {

    /* =====================================================
     * PDF SUITELET IDS
     * ===================================================== */

    const PDF_SCRIPT_ID = 'customscript_az_cbc_sl_x_rprt_csh_sl_pdf';
    const PDF_DEPLOY_ID = 'customdeploy_az_cbc_sl_x_rprt_csh_sl_pdf';

    const onRequest = (context) => {

        try {

            if (context.request.method === 'GET') {

                const form = serverWidget.createForm({ title: 'X Report - Cash Day End' });

                form.addField({
                    id   : 'custpage_date',
                    type : serverWidget.FieldType.DATE,
                    label: 'Date'
                }).isMandatory = true;

                form.addField({
                    id    : 'custpage_location',
                    type  : serverWidget.FieldType.SELECT,
                    source: 'location',
                    label : 'Location'
                }).isMandatory = true;

                form.addSubmitButton({ label: 'Generate Report' });

                context.response.writePage(form);

                return;
            }

            const { custpage_date: date, custpage_location: location } = context.request.parameters;

            redirect.toSuitelet({
                scriptId    : PDF_SCRIPT_ID,
                deploymentId: PDF_DEPLOY_ID,
                parameters  : { date, location }
            });

        } catch (e) {

            log.debug('onRequest', e);

        }
    };

    return { onRequest };
});