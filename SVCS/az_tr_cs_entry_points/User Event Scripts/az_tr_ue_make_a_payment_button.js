/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/url', 'N/record', 'N/runtime'], function(ui, url, record, runtime) {
    function beforeLoad(context) {
        if (context.type !== context.UserEventType.VIEW) return;

        var form = context.form;
        var customerId = context.newRecord.id;

        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_az_tr_sl_open_invoices_sel',
            deploymentId: 'customdeploy_az_tr_sl_open_invoices_sel',
            params: { custid: customerId }
        });

        form.addButton({
            id: 'custpage_make_payment_btn',
            label: 'Make A Payment!',
            functionName: "window.open('" + suiteletUrl + "', '_blank');"
        });
    }

    return { beforeLoad };
});
