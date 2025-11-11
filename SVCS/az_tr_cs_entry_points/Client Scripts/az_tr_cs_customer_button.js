/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], function () {

  function pageInit(context) {
    // You can leave this empty or add logic here
  }

  function redirectToInvoiceSuitelet() {
    const suiteletUrl = document.getElementById('custpage_suitelet_url').value;
    window.location.href = suiteletUrl;
  }

  return {
    pageInit: pageInit,                      
    redirectToInvoiceSuitelet: redirectToInvoiceSuitelet
  };
});
