/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/redirect'], (serverWidget, redirect) => {

    /* =====================================================
     * PDF SUITELET IDS
     * ===================================================== */

    const PDF_SCRIPT_ID = 'customscript_az_cbc_sl_z_report_pdf';
    const PDF_DEPLOY_ID = 'customdeploy_az_cbc_sl_z_report_pdf';

    const onRequest = (context) => {

        try {

            /* =====================================================
             * GET
             * ===================================================== */

            if (context.request.method === 'GET') {

                const form = serverWidget.createForm({ title: 'Z Report - Cash Sale' });

                form.addField({
                    id   : 'custpage_date_from',
                    type : serverWidget.FieldType.DATE,
                    label: 'Date From'
                }).isMandatory = true;

                form.addField({
                    id   : 'custpage_date_to',
                    type : serverWidget.FieldType.DATE,
                    label: 'Date To'
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

            /* =====================================================
             * POST - REDIRECT TO PDF SUITELET
             * The PDF suitelet collects the data and renders the
             * PDF using its own template.
             * ===================================================== */

            const {
                custpage_date_from: dateFrom,
                custpage_date_to  : dateTo,
                custpage_location : location
            } = context.request.parameters;

            redirect.toSuitelet({
                scriptId    : PDF_SCRIPT_ID,
                deploymentId: PDF_DEPLOY_ID,
                parameters  : { date_from: dateFrom, date_to: dateTo, location }
            });

        } catch (e) {

            log.debug('onRequest', e);

        }
    };

    return { onRequest };
});