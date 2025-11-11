/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/search', 'N/file', 'N/render', 'N/record', 'N/log'], function (search, file, render, record, log) {

  function onRequest(context) {
    const request = context.request;
    const response = context.response;

    const fromDate = request.parameters.from;
    const toDate = request.parameters.to;
    const customerId = request.parameters.customerid;

    if (!fromDate || !toDate || !customerId) {
      response.write('Missing required parameters.');
      return;
    }

    const invoiceData = getInvoiceData(customerId, fromDate, toDate);
    log.debug('Invoice Count', invoiceData.length); // Optional debug log

    const customerDetails = getCustomerDetails(customerId);

    const htmlTemplate = loadHtmlTemplate('/SuiteScripts/andrew_ashraf/az_tr_html_table_template.html');
    const filledHtml = fillHtmlTemplate(htmlTemplate, customerDetails, invoiceData, customerId);

    const pdfFile = render.xmlToPdf({
      xmlString: filledHtml
    });

    response.writeFile({
      file: pdfFile,
      isInline: true
    });
  }

  function getCustomerDetails(customerId) {
    const customerRecord = record.load({
      type: record.Type.CUSTOMER,
      id: customerId
    });

    return {
      name: customerRecord.getValue('entityid') || '',
      email: customerRecord.getValue('email') || '',
      phone: customerRecord.getValue('phone') || '',
      address: customerRecord.getText('defaultaddress') || ''
    };
  }

  function getInvoiceData(customerId, fromDate, toDate) {
    const invoiceSearch = search.create({
      type: search.Type.INVOICE,
      filters: [
        ['type', 'anyof', 'CustInvc'],
        'AND',
        ['status', 'anyof', 'CustInvc:A'],
        'AND',
        ['entity', 'anyof', customerId],
        'AND',
        ['trandate', 'within', fromDate, toDate],
        'AND',
         ['mainline', 'is', 'T'] 
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
    let count = 0;

    invoiceSearch.run().each(function (result) {
      results.push({
        tranid: result.getValue('tranid'),
        trandate: result.getValue('trandate'),
        duedate: result.getValue('duedate'),
        remaining: result.getValue('amountremaining'),
        total: result.getValue('total'),
        tax: result.getValue('taxtotal')
      });

      count++;
      return count < 20; // Limit to 20 invoices
    });

    return results;
  }

  function loadHtmlTemplate(filePath) {
    const htmlFile = file.load({ id: filePath });
    return htmlFile.getContents();
  }

  function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function fillHtmlTemplate(template, customer, invoices, customerId) {
    const tableRows = invoices.map(function (row) {
      return `
        <tr>
          <td>${escapeXml(row.tranid)}</td>
          <td>${escapeXml(row.trandate)}</td>
          <td>${escapeXml(row.duedate)}</td>
          <td>${escapeXml(row.remaining)}</td>
          <td>${escapeXml(row.total)}</td>
          <td>${escapeXml(row.tax)}</td>
        </tr>
      `;
    }).join('');

    return template
      .replace('{{customerId}}', escapeXml(customerId))
      .replace('{{customerName}}', escapeXml(customer.name))
      .replace('{{customerEmail}}', escapeXml(customer.email))
      .replace('{{customerPhone}}', escapeXml(customer.phone))
      .replace('{{customerAddress}}', escapeXml(customer.address))
      .replace('{{tableRows}}', tableRows);
  }

  return {
    onRequest: onRequest
  };
});
