/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/render', 'N/log'],
 (record, render, log) => {

    const onRequest = (context) => {
        try {
            const request = context.request;
            const response = context.response;

            // Get Purchase Order internal ID from URL
            const poId = request.parameters.poId;
            if (!poId) {
                response.write('Missing Purchase Order ID');
                return;
            }

            // Load the PO record
            const poRecord = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: poId
            });

            // Get Vendor ID
            const vendorId = poRecord.getValue('entity');
            if (!vendorId) {
                response.write('No Vendor found on PO');
                return;
            }

            // Load Vendor
            const vendorRec = record.load({
                type: record.Type.VENDOR,
                id: vendorId
            });

            // Get Approver
            const approverId = vendorRec.getValue('custentity_ra_approver');
            if (!approverId) {
                response.write('No Resource Allocation Approver found');
                return;
            }

            // Load Approver (Employee)
            let approverRec = record.load({
                type: record.Type.EMPLOYEE,
                id: approverId
            });

            let approverName = approverRec.getValue('firstname') || '';
            let approverEmail = approverRec.getValue('email') || '';

            log.debug('Approver Info', { approverName, approverEmail });

            // Create renderer using your template
            let renderer = render.create();
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
            let pdfFile = renderer.renderAsPdf();
            response.writeFile(pdfFile, true);

        } catch (e) {
            log.error('Error rendering custom PO PDF', e);
            context.response.write('Error: ' + e.message);
        }
    }

    return { onRequest };
});
