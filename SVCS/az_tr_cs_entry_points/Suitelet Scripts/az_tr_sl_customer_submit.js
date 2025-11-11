/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/encode', 'N/record', 'N/redirect', 'N/log'], 
  (serverWidget, encode, record, redirect, log) => {

  function onRequest(context) {
    const request = context.request;
    const response = context.response;

    if (request.method === 'GET') {
      const encodedInvoices = request.parameters.invoices;

      if (!encodedInvoices) {
        response.write('No invoices data found.');
        return;
      }

      // Decode Base64 to UTF-8 string
      const jsonString = encode.convert({
        string: encodedInvoices,
        inputEncoding: encode.Encoding.BASE_64,
        outputEncoding: encode.Encoding.UTF_8
      });

      const invoices = JSON.parse(jsonString);

      const form = buildConfirmationForm(invoices);

      response.writePage(form);

    } else {  // POST
      try {
        const customerId = request.parameters.custpage_customer_id;
        const lineCount = parseInt(request.parameters.custpage_linecount, 10);

        const custPayment = record.create({
          type: record.Type.CUSTOMER_PAYMENT,
          isDynamic: true
        });

        custPayment.setValue('customer', customerId);

        let totalPayment = 0;

        for (let i = 0; i < lineCount; i++) {
          const internalId = request.parameters[`custpage_internalid_${i}`];
          const amountToPay = parseFloat(request.parameters[`custpage_amounttopay_${i}`]) || 0;

          if (amountToPay <= 0) continue;

          custPayment.selectNewLine({ sublistId: 'apply' });

          custPayment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'doc', value: internalId });
          custPayment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
          custPayment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: amountToPay });

          custPayment.commitLine({ sublistId: 'apply' });

          totalPayment += amountToPay;
        }

        custPayment.setValue('payment', totalPayment);

        const paymentId = custPayment.save();

        log.debug('Payment Created', { paymentId, customerId });

        // Redirect to the created payment record
        redirect.toRecord({
          type: record.Type.CUSTOMER_PAYMENT,
          id: paymentId
        });

      } catch (e) {
        log.error('Payment creation error', e);
        response.write('Error creating payment: ' + e.message);
      }
    }
  }

  function buildConfirmationForm(invoices) {
    const form = serverWidget.createForm({
      title: 'Confirm Payment for Selected Invoices'
    });

    // Add hidden customer ID field
    const custIdField = form.addField({
      id: 'custpage_customer_id',
      type: serverWidget.FieldType.TEXT,
      label: 'Customer ID'
    });
    custIdField.defaultValue = invoices[0].customer || '';
    custIdField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

    // Add hidden line count
    const lineCountField = form.addField({
      id: 'custpage_linecount',
      type: serverWidget.FieldType.INTEGER,
      label: 'Line Count'
    });
    lineCountField.defaultValue = invoices.length.toString();
    lineCountField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

    // Sublist
    const sublist = form.addSublist({
      id: 'custpage_confirm_sublist',
      label: 'Invoices to Pay',
      type: serverWidget.SublistType.LIST
    });

    sublist.addField({
      id: 'custpage_tranid',
      label: 'Invoice #',
      type: serverWidget.FieldType.TEXT
    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

    sublist.addField({
      id: 'custpage_duedate',
      label: 'Due Date',
      type: serverWidget.FieldType.DATE
    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

    sublist.addField({
      id: 'custpage_amountremaining',
      label: 'Amount Remaining',
      type: serverWidget.FieldType.CURRENCY
    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

    sublist.addField({
      id: 'custpage_amounttopay',
      label: 'Amount to Pay',
      type: serverWidget.FieldType.CURRENCY
    }); // Editable

    sublist.addField({
      id: 'custpage_internalid',
      label: 'Internal ID',
      type: serverWidget.FieldType.TEXT
    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

    // Populate lines
    invoices.forEach((inv, i) => {
      sublist.setSublistValue({ id: 'custpage_tranid', line: i, value: inv.tranid });
      sublist.setSublistValue({ id: 'custpage_duedate', line: i, value: inv.duedate });
      sublist.setSublistValue({ id: 'custpage_amountremaining', line: i, value: inv.amountremaining.toString() });
      sublist.setSublistValue({ id: 'custpage_amounttopay', line: i, value: '0.00' }); // start with 0
      sublist.setSublistValue({ id: 'custpage_internalid', line: i, value: inv.id.toString() }); // note: 'id' from 1st Suitelet
    });

    form.addSubmitButton({ label: 'Submit Payment' });

    return form;
  }

  return {
    onRequest
  };

});
