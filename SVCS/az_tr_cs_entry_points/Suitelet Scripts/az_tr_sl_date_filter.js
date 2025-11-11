/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/url', 'N/redirect'], function (ui, url, redirect) {

  function onRequest(context) {
    if (context.request.method === 'GET') {
      displayForm(context);
    } else {
      handlePostRequest(context);
    }
  }


  function displayForm(context) {
    var form = ui.createForm({ title: 'Open Invoices Filter' });

    form.addField({
      id: 'custpage_from_date',
      type: ui.FieldType.DATE,
      label: 'From Date'
    });

    form.addField({
      id: 'custpage_to_date',
      type: ui.FieldType.DATE,
      label: 'To Date'
    });

    form.addSubmitButton({ label: 'View Open Invoices' });

    context.response.writePage(form);
  }


  function handlePostRequest(context) {
    var request = context.request;

    var fromDate = request.parameters.custpage_from_date;
    var toDate = request.parameters.custpage_to_date;
    var customerId = request.parameters.customerid;

    var suiteletUrl = url.resolveScript({
      scriptId: 'customscript_az_tr_sl_dis_open_invoices',
      deploymentId: 'customdeploy_az_tr_sl_dis_open_invoices',
      params: {
        from: fromDate,
        to: toDate,
        customerid: customerId
      }
    });

    redirect.redirect({ url: suiteletUrl });
  }

  return { onRequest: onRequest };
});
