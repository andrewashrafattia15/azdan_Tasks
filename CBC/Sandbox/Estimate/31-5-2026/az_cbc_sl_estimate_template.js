/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/record', 'N/render', 'N/log', 'N/file'], (search, record, render, log, file) => {

    const onRequest = (context) => {
        try {
            if (context.request.method == 'GET') {
                const recordId = context.request.parameters.recId;

                if (!recordId) {
                    context.response.write('Missing Record ID.');
                    return;
                }

                const { header, subsidiaryData, customerData, itemLines } = getSalesQuotationData(recordId);

                let template = getTemplateHeader(subsidiaryData, header);
                template = getTemplateBody(template, header, subsidiaryData, customerData, itemLines);
                finalizeTemplate(template, context, { header, subsidiaryData, customerData, itemLines });
            }
        } catch (err) {
            log.debug('onRequest Error', err);
        }
    };

    const getSalesQuotationData = (recordId) => {
        try {
            const sqRec = record.load({
                type: record.Type.ESTIMATE,
                id: recordId,
                isDynamic: false
            });

            const entityId      = sqRec.getValue({ fieldId: 'entity' });
            const salesrepId    = sqRec.getValue({ fieldId: 'salesrep' });

            const header = {
                tranid          : sqRec.getValue({ fieldId: 'tranid'}) || '',
                trandate        : sqRec.getValue({ fieldId: 'trandate'}) || '',
                duedate         : sqRec.getValue({ fieldId: 'duedate'}) || '',
                location        : sqRec.getText ({ fieldId: 'location'}) || '',
                currency        : sqRec.getText ({ fieldId: 'currency'}) || '',
                terms           : sqRec.getText ({ fieldId: 'terms'}) || '',
                shipmethod      : sqRec.getText ({ fieldId: 'shipmethod'}) || '',
                taxtotal        : sqRec.getValue({ fieldId: 'taxtotal'}) || 0,
                salesrepName    : sqRec.getText ({ fieldId: 'salesrep'}) || '',
                salesrepEmail   : '',
                salesrepPhone   : '',
                opportunityTranid: sqRec.getText ({ fieldId: 'opportunity'}) || '',
                preparedBy      : sqRec.getText ({ fieldId: 'custbody_az_g_trx_created_by'}) || '',
                orderType       : sqRec.getText ({ fieldId: 'custbody_az_cbc_order_type'}) || '',
                shippingTerms   : sqRec.getText ({ fieldId: 'custbody_az_cbc_shipping_terms'}) || '',
                termsConditions : sqRec.getValue({ fieldId: 'custbody_az_cbc_terms_conditions'}) || '',
                consultantName  : sqRec.getValue({ fieldId: 'custbody_az_cbc_consultant_name_sub'}) || '',
                projectLocation : sqRec.getValue({ fieldId: 'custbody_az_cbc_project_location'}) || '',
                approvalStatus  : sqRec.getText ({ fieldId: 'custbody_az_cbc_approval_status_trans'}) || '',
                billaddress     : sqRec.getValue({ fieldId: 'billaddress'}) || '',
                subsidiaryId    : sqRec.getValue({ fieldId: 'subsidiary'}) || '',
                entityId        : entityId,
                entityAltName   : sqRec.getText ({ fieldId: 'entity' }) || '',
                entityIdText    : '',
                entityEmail     : '',
                entityPhone     : '',
                projectName     : sqRec.getText ({ fieldId: 'custbody_az_cbc_project_name'}) || '',
                subsidiaryAddr  : '',
                remainingDays   : '',
            };

            // ── Customer ──────────────────────────────────────────────────
            const customerLookup = getCustomerData(entityId);
            header.entityIdText  = customerLookup.entityIdText;
            header.entityEmail   = customerLookup.entityEmail;
            header.entityPhone   = customerLookup.entityPhone;

            // ── Sales Rep ─────────────────────────────────────────────────
            const salesRepData   = getSalesRepData(salesrepId);
            header.salesrepEmail = salesRepData.salesrepEmail;
            header.salesrepPhone = salesRepData.salesrepPhone;

            try {
                const custpageRaw = sqRec.getValue({ fieldId: 'custpage_custrecord_to_print' });
                if (custpageRaw) {
                    const parsed = JSON.parse(custpageRaw);
                    header.projectName    = parsed.projectName       || '';
                    header.subsidiaryAddr = parsed.subsidiaryAddress || '';
                }
            } catch (e) { log.debug('custpage parse error', e); }

            if (header.duedate) {
                const expireDate = new Date(header.duedate);
                const today = new Date();

                header.remainingDays = Math.floor(
                    (expireDate.getTime() - today.getTime()) / 86400000
                );
            }

            const subsidiaryData = getSubsidiaryData(header.subsidiaryId);
            const customerData   = { customerAddress: header.billaddress || '' };
            const itemLines      = getItemLines(sqRec);

            return { header, subsidiaryData, customerData, itemLines };

        } catch (err) {
            log.debug('getSalesQuotationData Error', err);
        }
    };

    const getCustomerData = (customerId) => {
        try {
            if (!customerId) return { entityIdText: '', entityEmail: '', entityPhone: '' };

            const cust = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: customerId,
                columns: ['entityid', 'email', 'phone']
            });

            return {
                entityIdText : cust.entityid || '',
                entityEmail  : cust.email    || '',
                entityPhone  : (cust.phone   || '').replace(/^\+?971\s*/, '')
            };

        } catch (err) {
            log.debug('getCustomerData Error', err);
            return { entityIdText: '', entityEmail: '', entityPhone: '' };
        }
    };

    const getSalesRepData = (salesrepId) => {
        try {
            if (!salesrepId) return { salesrepEmail: '', salesrepPhone: '' };

            const rep = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: salesrepId,
                columns: ['email', 'phone']
            });

            return {
                salesrepEmail : rep.email || '',
                salesrepPhone : (rep.phone || '').replace(/^\+?971\s*/, '')
            };

        } catch (err) {
            log.debug('getSalesRepData Error', err);
            return { salesrepEmail: '', salesrepPhone: '' };
        }
    };

    const getSubsidiaryData = (subsidiaryId) => {
        try {
            if (!subsidiaryId) return {};

            const subRec = record.load({
                type: record.Type.SUBSIDIARY,
                id: subsidiaryId
            });

            const logoId = subRec.getValue({ fieldId: 'pagelogo' });
            let logoUrl = '';
            if (logoId) {
                try {
                    const logoFile = file.load({ id: logoId });
                    logoUrl = logoFile.url.replace(/&/g, '&amp;');
                } catch (e) { log.debug('logo load error', e); }
            }

            return {
                logoURL    : logoUrl,
                subName    : subRec.getText({ fieldId: 'name'             }) || '',
                subAddress : subRec.getText({ fieldId: 'mainaddress_text' }) || '',
                subVAT     : subRec.getText({ fieldId: 'federalidnumber'  }) || '',
            };

        } catch (err) {
            log.debug('getSubsidiaryData Error', err);
            return {};
        }
    };

    const getItemLines = (sqRec) => {
        try {
            const lines     = [];
            const lineCount = sqRec.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < lineCount; i++) {
                const isTaxLine = sqRec.getSublistValue({ sublistId: 'item', fieldId: 'taxline', line: i });
                if (isTaxLine === true || isTaxLine === 'T') continue;

                lines.push({
                    itemName       : sqRec.getSublistText ({ sublistId: 'item', fieldId: 'item',                              line: i }) || '',
                    description    : sqRec.getSublistValue({ sublistId: 'item', fieldId: 'description',                      line: i }) || '',
                    units          : sqRec.getSublistText ({ sublistId: 'item', fieldId: 'units',                             line: i }) || '',
                    quantity       : parseFloat(sqRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity',               line: i }) || 0),
                    rate           : parseFloat(sqRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_az_cbc_base_rate_line', line: i }) || 0),
                    amount         : parseFloat(sqRec.getSublistValue({ sublistId: 'item', fieldId: 'amount',                 line: i }) || 0),
                    tax1amt        : parseFloat(sqRec.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt',                line: i }) || 0),
                    grossamt       : parseFloat(sqRec.getSublistValue({ sublistId: 'item', fieldId: 'grossamt',               line: i }) || 0),
                    discountAmount : parseFloat(sqRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_az_cbc_discount_amount_line', line: i }) || 0),
                    additionalNote : sqRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_az_cbc_additional_note',    line: i }) || '',
                });
            }

            return lines;

        } catch (err) {
            log.debug('getItemLines Error', err);
            return [];
        }
    };

    const stripIdPrefix = (name) => {
        if (!name) return '';
        return /^[A-Za-z0-9]*[0-9][A-Za-z0-9]*\s.+/.test(name) ? name.replace(/^\S+\s/, '') : name;
    };

    const formatDate = (dateVal) => {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        if (isNaN(d)) return String(dateVal);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return String(d.getDate()).padStart(2,'0') + '-' + months[d.getMonth()] + '-' + d.getFullYear();
    };

    const getTemplateHeader = (subsidiaryData, header) => {
        try {

            let template = '';

            template += '<?xml version="1.0"?>';
            template += '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            template += '<pdf>';
            template += '<head>';

            template += '<link name="NotoSans" type="font" subtype="truetype" ';
            template += 'src="${nsfont.NotoSans_Regular}" ';
            template += 'src-bold="${nsfont.NotoSans_Bold}" ';
            template += 'src-italic="${nsfont.NotoSans_Italic}" ';
            template += 'src-bolditalic="${nsfont.NotoSans_BoldItalic}" ';
            template += 'bytes="2" />';

            template += '<macrolist>';

            template += '<macro id="nlheader">';
            template += '<table class="header" style="width:100%;">';
            template += '<tr>';

            if (subsidiaryData.logoURL) {
                template += '<td align="left" style="padding-bottom:5px;vertical-align:middle;border-bottom:1px solid #007115;">';
                template += '<img src="' + subsidiaryData.logoURL + '" style="width:150px;height:75px;" />';
                template += '</td>';
            } else {
                template += '<td align="left" style="border-bottom:1px solid #007115;"></td>';
            }

            template += '<td align="right" style="vertical-align:middle;border-bottom:1px solid #007115;font-size:14px;font-weight:bold;">';
            template += 'PREFORMA INVOICE';
            template += '</td>';
            template += '</tr>';
            template += '</table>';
            template += '</macro>';

            template += '<macro id="nlfooter">';
            template += '<table class="footer" style="width:100%;">';
            template += '<tr>';
            template += '<td align="center" style="font-size:9px;font-weight:bold;">----------ELECTRONICALLY VERIFIED REPORT, NO SIGNATURE REQUIRED | THANK YOU FOR YOUR BUSINESS----------</td>';
            template += '</tr>';
            template += '<tr>';
            template += '<td align="center" style="font-size:9px;font-weight:bold;">PRODUCT DELIVERY IS SUBJECT TO STOCK AVAILABILITY</td>';
            template += '</tr>';
            template += '</table>';
            template += '</macro>';

            template += '</macrolist>';
            template += '</head>';

            template += '<body header="nlheader" header-height="10%" ';
            template += 'footer="nlfooter" footer-height="20pt" ';
            template += 'padding="0.5in 0.5in 0.5in 0.5in" size="Letter">';

            return template;

        } catch (err) {
            log.debug('getTemplateHeader Error', err);
        }
    };

    const getTemplateBody = (template, header, subsidiaryData, customerData, itemLines) => {
        try {

            /** 1st Table (Customer / Quotation Info) */

                const addrLines = (customerData.customerAddress || '').split('\n').map(l => l.trim()).filter(Boolean).join('<br/>');

                template += '<table width="100%" style="padding-bottom:15px;">';

                template += '<tr>';
                template += '<td width="70%" style="font-size:12px;font-weight:bold;">' + stripIdPrefix(header.entityAltName || '') + '</td>';
                template += '<td style="font-size:12px;font-weight:bold;">' + (header.entityIdText || '') + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td style="font-size:9px;">' + addrLines + '</td>';
                template += '<td style="font-size:9px;vertical-align:bottom;">OPPORTUNITY#: ' + (header.opportunityTranid || '') + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td style="font-size:9px;">' + (header.entityEmail || '') + '</td>';
                template += '<td style="font-size:9px;">DATE: ' + formatDate(header.trandate) + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td style="font-size:9px;">' + (header.entityPhone || '') + '</td>';
                template += '<td style="font-size:9px;">QUOTATION#: ' + (header.tranid || '') + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td style="font-size:9px;"></td>';
                template += '<td style="font-size:9px;">BRANCH: ' + (header.location || '') + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td style="font-size:10px;color:#007115;">Project Name: ' + (header.projectName || '') + '</td>';
                template += '<td style="font-size:9px;">SALESPERSON: ' + stripIdPrefix(header.salesrepName) + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td style="font-size:9px;">Consultant Name: ' + (header.consultantName || '') + '</td>';
                template += '<td style="font-size:9px;">PREPARED BY: ' + stripIdPrefix(header.preparedBy) + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td style="font-size:9px;">Location: ' + (header.projectLocation || '') + '</td>';
                template += '<td style="font-size:9px;">ORDER TYPE: ' + (header.orderType || '') + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td style="font-size:9px;"></td>';
                template += '<td style="font-size:9px;">CURRENCY: ' + (header.currency || '') + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td style="font-size:9px;"></td>';
                template += '<td style="font-size:9px;border-bottom:1px solid #007115;border-top:1px solid #007115;">QUOTATION VALIDITY: ' + (header.remainingDays !== '' ? header.remainingDays + ' Days' : '') + '</td>';
                template += '</tr>';

                template += '</table>';

            // ---------------------------------------------------------------

            /** 2nd Table (Item Lines) */

                template += '<table width="100%">';

                template += '<tr>';
                template += '<td width="6%"  align="center" style="vertical-align:middle;font-size:9px;color:white;background-color:#007934;border-top:1px solid #E1E1E1;border-left:1px solid #B7B7B7;border-bottom:1px solid #E1E1E1;border-right:1px solid #B7B7B7;">SL<br/>NO.</td>';
                template += '<td width="11%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;color:#FEEE66;background-color:#007934;border-top:1px solid #E1E1E1;border-left:1px solid #B7B7B7;border-bottom:1px solid #E1E1E1;">Item Code</td>';
                template += '<td width="18%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;color:#FEEE66;background-color:#007934;border-top:1px solid #E1E1E1;border-left:1px solid #B7B7B7;border-bottom:1px solid #E1E1E1;">Description</td>';
                template += '<td width="5%"  align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;color:#FEEE66;background-color:#007934;border-top:1px solid #E1E1E1;border-left:1px solid #B7B7B7;border-bottom:1px solid #E1E1E1;">UOM</td>';
                template += '<td width="5%"  align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;color:#FEEE66;background-color:#007934;border-top:1px solid #E1E1E1;border-left:1px solid #B7B7B7;border-bottom:1px solid #E1E1E1;">QTY</td>';
                template += '<td width="10%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;color:#FEEE66;background-color:#007934;border-top:1px solid #E1E1E1;border-left:1px solid #B7B7B7;border-bottom:1px solid #E1E1E1;">Unit Rate</td>';
                template += '<td width="15%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;color:#FEEE66;background-color:#007934;border-top:1px solid #E1E1E1;border-left:1px solid #B7B7B7;border-bottom:1px solid #E1E1E1;">Total<br/>(Exc. VAT)</td>';
                template += '<td width="6%"  align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;color:#FEEE66;background-color:#007934;border-top:1px solid #E1E1E1;border-left:1px solid #B7B7B7;border-bottom:1px solid #E1E1E1;">VAT</td>';
                template += '<td width="11%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;color:#FEEE66;background-color:#007934;border-top:1px solid #E1E1E1;border-left:1px solid #B7B7B7;border-bottom:1px solid #E1E1E1;">Total<br/>(Inc. VAT)</td>';
                template += '<td width="13%" align="center" style="font-weight:bold;vertical-align:middle;font-size:9px;color:#FEEE66;background-color:#007934;border-top:1px solid #E1E1E1;border-left:1px solid #B7B7B7;border-bottom:1px solid #E1E1E1;border-right:1px solid #B7B7B7;">Additional<br/>Note</td>';
                template += '</tr>';

                let sn = 0;
                let calcSubtotal  = 0;
                let totalDiscount = 0;

                for (let i = 0; i < itemLines.length; i++) {
                    const line = itemLines[i];
                    sn++;

                    calcSubtotal  += line.rate * line.quantity;
                    totalDiscount += line.discountAmount;

                    template += '<tr>';
                    template += '<td align="center" style="border-left:1px solid #B7B7B7;border-bottom:1px solid #E1E1E1;border-right:1px solid #B7B7B7;font-size:8px;">' + sn + '</td>';
                    template += '<td align="center" style="border-bottom:1px solid #E1E1E1;border-right:1px solid #B7B7B7;font-size:8px;">' + (line.itemName|| '') + '</td>';
                    template += '<td align="center" style="border-bottom:1px solid #E1E1E1;border-right:1px solid #B7B7B7;font-size:8px;">' + (line.description|| '') + '</td>';
                    template += '<td align="center" style="border-bottom:1px solid #E1E1E1;border-right:1px solid #B7B7B7;font-size:8px;">' + (line.units|| '') + '</td>';
                    template += '<td align="center" style="border-bottom:1px solid #E1E1E1;border-right:1px solid #B7B7B7;font-size:8px;">' + (line.quantity ? Number(line.quantity).toLocaleString('en-US') : '') + '</td>';
                    template += '<td align="center" style="border-bottom:1px solid #E1E1E1;border-right:1px solid #B7B7B7;font-size:8px;">' + (header.currency) + (line.rate ? Number(line.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '') + '</td>';
                    template += '<td align="center" style="border-bottom:1px solid #E1E1E1;border-right:1px solid #B7B7B7;font-size:8px;">' + (header.currency) + (line.amount ? Number(line.amount  ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '') + '</td>';
                    template += '<td align="center" style="border-bottom:1px solid #E1E1E1;border-right:1px solid #B7B7B7;font-size:8px;">' + (header.currency) + (line.tax1amt ? Number(line.tax1amt ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '') + '</td>';
                    template += '<td align="center" style="border-bottom:1px solid #E1E1E1;border-right:1px solid #B7B7B7;font-size:8px;">' + (header.currency) + (line.grossamt ? Number(line.grossamt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '') + '</td>';
                    template += '<td align="center" style="border-bottom:1px solid #E1E1E1;border-right:1px solid #B7B7B7;font-size:8px;">' + (line.additionalNote || '') + '</td>';
                    template += '</tr>';
                }


            // ---------------------------------------------------------------

            /** 3rd Table (Summary: Subtotal, Discount, VAT, Total) */

                const vatNum     = parseFloat(header.taxtotal) || 0;
                const grandTotal = calcSubtotal + vatNum - totalDiscount;


                template += '<tr>';
                template += '<td></td><td></td><td></td><td></td><td></td><td></td>';
                template += '<td align="right" colspan="2" style="font-weight:bold;vertical-align:middle;font-size:9px;color:#737373;border-right:1px solid #B7B7B7;">SUBTOTAL (Exc. VAT)</td>';
                template += '<td align="left" style="vertical-align:middle;font-size:9px;color:#737373;">' + (header.currency) +(calcSubtotal ? Number(calcSubtotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00') + '</td>';
                template += '<td></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td></td><td></td><td></td><td></td><td></td><td></td>';
                template += '<td align="right" colspan="2" style="font-weight:bold;vertical-align:middle;font-size:9px;color:#737373;border-right:1px solid #B7B7B7;">Discount</td>';
                template += '<td align="left" style="vertical-align:middle;font-size:9px;color:#737373;">' + (header.currency) +(totalDiscount ? Number(totalDiscount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00') + '</td>';
                template += '<td></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td></td><td></td><td></td><td></td><td></td><td></td>';
                template += '<td align="right" colspan="2" style="font-weight:bold;vertical-align:middle;font-size:9px;color:#737373;border-right:1px solid #B7B7B7;">VAT Amount</td>';
                template += '<td align="left" style="vertical-align:middle;font-size:9px;color:#737373;">' + (header.currency) +(vatNum ? Number(vatNum).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00') + '</td>';
                template += '<td></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td></td><td></td><td></td><td></td><td></td><td></td>';
                template += '<td align="right" colspan="2" style="font-weight:bold;vertical-align:middle;font-size:9px;color:#737373;background-color:#F2F2F2;border-right:1px solid #C7C7C7;">Total</td>';
                template += '<td align="left" style="vertical-align:middle;font-weight:bold;font-size:9px;background-color:#F2F2F2;">' + (header.currency) +(grandTotal ? Number(grandTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00') + '</td>';
                template += '<td></td>';
                template += '</tr>';

                template += '</table>';

            // ---------------------------------------------------------------

            if (sn > 10) {
                template += '<pbr/>';
            }

            // ---------------------------------------------------------------

            /** 4th Table (Payment Terms, Bank Info, T&C) */

                template += '<table width="100%">';

                template += '<tr>';
                template += '<td width="6%"></td>';
                template += '<td width="11%"></td>';
                template += '<td width="18%"></td>';
                template += '<td width="5%"></td>';
                template += '<td width="5%"></td>';
                template += '<td width="10%"></td>';
                template += '<td width="15%"></td>';
                template += '<td width="6%"></td>';
                template += '<td width="11%"></td>';
                template += '<td width="13%"></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="3" style="font-weight:bold;font-size:11px;">PAYMENT TERMS AND DELIVERY</td>';
                template += '<td colspan="7"></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="3" style="font-size:9px;">Payment Terms: ' + (header.terms || '') + '</td>';
                template += '<td colspan="7"></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="3" style="font-size:9px;">Shipping Terms: ' + (header.shippingTerms || '') + '</td>';
                template += '<td colspan="7"></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="3" style="font-size:9px;">Shipping Method: ' + (header.shipmethod || '') + '</td>';
                template += '<td colspan="7"></td>';
                template += '</tr>';

                template += '<tr><td colspan="10"></td></tr>';

                template += '<tr>';
                template += '<td colspan="4" align="left" style="text-align:left;vertical-align:middle;padding-top:0;padding-bottom:0;font-size:8px;">SALES PERSON EMAIL: <span style="font-size:9px;">' + (header.salesrepEmail || '') + '</span></td>';
                template += '<td colspan="6" style="font-size:11px;font-weight:bold;border-top:1px solid #007115;border-bottom:1px solid #007115;">TERMS &amp; CONDITIONS</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="4" align="left" style="text-align:left;padding-top:0;font-size:8px;">SALES PERSON MOBILE: <span style="font-size:9px;">' + (header.salesrepPhone || '') + '</span></td>';
                template += '<td colspan="6" rowspan="10" style="padding-top:0;padding-bottom:0;font-size:9px;border-bottom:1px solid #007115;">' + (header.termsConditions ? header.termsConditions.replace(/\n/g, "<br/>") : '') + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="3" style="padding-top:0;padding-bottom:0;font-size:10px;font-weight:bold;color:#007115;border-top:1px solid #007115;border-bottom:1px solid #007115;">CORYS BUILD CENTRE LLC</td>';
                template += '<td></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="2" style="padding-top:0;padding-bottom:0;font-size:9px;">Bank Name:</td>';
                template += '<td style="padding-top:0;padding-bottom:0;font-size:9px;">Emirates NBD</td>';
                template += '<td></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="2" style="padding-top:0;padding-bottom:0;font-size:9px;">Bank Account:</td>';
                template += '<td style="padding-top:0;padding-bottom:0;font-size:9px;">1015059759801</td>';
                template += '<td></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="2" style="padding-top:0;padding-bottom:0;font-size:9px;">IBAN:</td>';
                template += '<td style="padding-top:0;padding-bottom:0;font-size:9px;">AE640260001015059759801</td>';
                template += '<td></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="2" style="padding-top:0;padding-bottom:0;font-size:9px;border-bottom:1px solid #007115;">TRN:</td>';
                template += '<td style="padding-top:0;padding-bottom:0;font-size:9px;border-bottom:1px solid #007115;">100000468700003</td>';
                template += '<td></td>';
                template += '</tr>';

                template += '<tr><td></td><td></td><td></td><td></td></tr>';

                template += '<tr>';
                template += '<td colspan="3" style="padding-top:0;padding-bottom:0;font-size:10px;">' + (header.subsidiaryAddr || subsidiaryData.subAddress || '') + '</td>';
                template += '<td></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="3" style="padding-top:0;padding-bottom:0;font-size:10px;">P.O. Box 2345</td>';
                template += '<td></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="3" style="padding-top:0;padding-bottom:0;font-size:9px;">Hotline: 800CBCUAE</td>';
                template += '<td></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="3" style="padding-top:0;padding-bottom:0;font-size:9px;">Email: help@corysbuildcentre.com</td>';
                template += '<td></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td colspan="3" style="padding-top:0;padding-bottom:0;font-size:9px;">Website: www.corysbuildcentre.com</td>';
                template += '<td></td>';
                template += '<td colspan="6" style="padding-top:0;padding-bottom:0;font-size:9px;font-weight:bold;">These terms and conditions apply to all sales and may not be changed, altered or overridden without the prior written consent of CBC.</td>';
                template += '</tr>';

                template += '</table>';

            return template;

        } catch (err) {
            log.debug('getTemplateBody Error', err);
        }
    };

    const finalizeTemplate = (template, context, data) => {
        try {
            template += '</body></pdf>';

            const renderer = render.create();
            renderer.templateContent = template;
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias : 'data',
                data  : data
            });

            const pdfFile = renderer.renderAsPdf();
            context.response.writeFile(pdfFile, true);

        } catch (err) {
            log.debug('finalizeTemplate Error', err);
        }
    };

    return { onRequest };
});