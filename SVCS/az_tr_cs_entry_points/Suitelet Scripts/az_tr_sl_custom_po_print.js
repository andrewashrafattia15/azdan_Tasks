/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/render', 'N/log'],
function (record, render, log) {

    function onRequest(context) {
        try {
            var request = context.request;
            var response = context.response;

            // Get Purchase Order internal ID from URL
            var poId = request.parameters.poId;
            if (!poId) {
                response.write('Missing Purchase Order ID');
                return;
            }

            // Load the PO record
            var poRecord = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: poId
            });

            // Get Vendor ID
            var vendorId = poRecord.getValue('entity');
            if (!vendorId) {
                response.write('No Vendor found on PO');
                return;
            }

            // Load Vendor
            var vendorRec = record.load({
                type: record.Type.VENDOR,
                id: vendorId
            });

            // Get Approver
            var approverId = vendorRec.getValue('custentity_ra_approver');
            if (!approverId) {
                response.write('No Resource Allocation Approver found');
                return;
            }

            // Load Approver (Employee)
            var approverRec = record.load({
                type: record.Type.EMPLOYEE,
                id: approverId
            });

            var approverName = approverRec.getValue('firstname') || '';
            var approverEmail = approverRec.getValue('email') || '';

            log.debug('Approver Info', { approverName, approverEmail });

            // Create renderer using your template
            var renderer = render.create();
            renderer.setTemplateByScriptId('CUSTTMPL_AZ_SVCS_AA_PURCHASE_ORDER');
            renderer.addRecord('record', poRecord);

            // Add your custom data
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'extraData',
                data: {
                    resApproverName: approverName,
                    resApproverEmail: approverEmail
                }
            });

            // Render and output PDF directly
            var pdfFile = renderer.renderAsPdf();
            response.writeFile(pdfFile, true);

        } catch (e) {
            log.error('Error rendering custom PO PDF', e);
            context.response.write('Error: ' + e.message);
        }
    }

    return { onRequest };
});
