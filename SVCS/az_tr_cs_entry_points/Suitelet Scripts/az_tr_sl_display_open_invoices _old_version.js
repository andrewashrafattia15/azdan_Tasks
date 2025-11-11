/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/file'], function (search, file) {
  function onRequest(context) {
    const request = context.request;
    const response = context.response;

    const fromDate = request.parameters.from;
    const toDate = request.parameters.to;
    const customerId = request.parameters.customerid;

    if (!fromDate ) {
      response.write('Missing required parameters: from');
      return;
    }
    if (!toDate) {
      response.write('Missing required parameters:  to');
      return;
    }
    if ( !customerId) {
      response.write('Missing required parameters: customerid.');
      return;
    }

    // Load HTML template file from File Cabinet
    const htmlFile = file.load({ id: '/SuiteScripts/andrew_ashraf/az_tr_html_table_template_old_version.html' });
    const htmlContent = htmlFile.getContents();

    // Perform the invoice search
    const invoiceSearch = search.create({
      type: search.Type.INVOICE,
      filters: [
        ['type', 'anyof', 'CustInvc'],
        'AND',
        ['status', 'anyof', 'CustInvc:A'], // Open invoices
        'AND',
        ['entity', 'anyof', customerId],
        'AND',
        ['trandate', 'within', fromDate, toDate]
      ],
      columns: [
        'tranid',
        'trandate',
        'duedate',
        'amountremaining',
        'total',
        'taxtotal'
      ]
    });

    const results = [];
    invoiceSearch.run().each(function (result) {
      results.push({
        tranid: result.getValue('tranid'),
        trandate: result.getValue('trandate'),
        duedate: result.getValue('duedate'),
        remaining: result.getValue('amountremaining'),
        total: result.getValue('total'),
        tax: result.getValue('taxtotal')
      });
      return true;
    });

    // Build table rows HTML
    const tableRows = results.map(function (row) {
      return `
        <tr>
          <td>${row.tranid}</td>
          <td>${row.trandate}</td>
          <td>${row.duedate}</td>
          <td>${row.remaining}</td>
          <td>${row.total}</td>
          <td>${row.tax}</td>
        </tr>
      `;
    }).join('');

    // Replace placeholders in HTML
    htmlContent = htmlContent.replace('{{customerId}}', customerId);
    htmlContent = htmlContent.replace('{{tableRows}}', tableRows);

    // Send HTML back to client
    response.write(htmlContent);
  }

  return {
    onRequest: onRequest
  };
});
