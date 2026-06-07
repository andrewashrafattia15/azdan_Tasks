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

                const { header, subsidiaryData, customerData, itemLines } = getProposalData(recordId);

                let template = getTemplateHeader(subsidiaryData, header);
                template = getTemplateBody(template, header, subsidiaryData, customerData, itemLines);
                finalizeTemplate(template, context, { header, subsidiaryData, customerData, itemLines });
            }
        } catch (err) {
            log.debug('onRequest Error', err);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // DATA FETCHING
    // ─────────────────────────────────────────────────────────────────────────

    const getProposalData = (recordId) => {
        try {
            const propRec = record.load({
                type: record.Type.ESTIMATE,
                id: recordId,
                isDynamic: false
            });

            const entityId   = propRec.getValue({ fieldId: 'entity' });
            const salesrepId = propRec.getValue({ fieldId: 'salesrep' });

            const header = {
                tranid          : propRec.getValue({ fieldId: 'tranid'}) || '',
                trandate        : propRec.getValue({ fieldId: 'trandate'}) || '',
                entity          : propRec.getText ({ fieldId: 'entity'}) || '',
                entityId        : entityId,
                brand           : propRec.getText ({ fieldId: 'custbody_az_rs_brand'}) || '',
                proposalVersion : propRec.getValue({ fieldId: 'custbody_az_rs_proposal_printouts'}) || '',
                currency        : propRec.getText ({ fieldId: 'custbody_az_rs_currency'}) || '',
                currencyAr      : propRec.getText ({ fieldId: 'custbody_az_rs_currency_ar'}) || '',
                customerNameEn  : propRec.getText ({ fieldId: 'custentity_az_rs_customer_name'}) || '',
                customerNameAr  : propRec.getText ({ fieldId: 'custentity_az_rs_customer_ar'}) || '',
                taxtotal        : propRec.getValue({ fieldId: 'taxtotal'}) || 0,
                discounttotal   : propRec.getValue({ fieldId: 'discounttotal'}) || 0,
                subsidiaryId    : propRec.getValue({ fieldId: 'subsidiary'}) || '',
                printoutVersion : propRec.getText ({ fieldId: 'custbody_az_rs_proposal_printouts'}) || 'Version 1',
            };

            const subsidiaryData = getSubsidiaryData(header.subsidiaryId);
            const customerData   = {};
            const itemLines      = getItemLines(propRec);

            return { header, subsidiaryData, customerData, itemLines };

        } catch (err) {
            log.debug('getProposalData Error', err);
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

    const getItemLines = (propRec) => {
        try {
            const lines     = [];
            const lineCount = propRec.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < lineCount; i++) {
                const isTaxLine = propRec.getSublistValue({ sublistId: 'item', fieldId: 'taxline', line: i });
                if (isTaxLine === true || isTaxLine === 'T') continue;

                lines.push({
                    itemName       : propRec.getSublistText ({ sublistId: 'item', fieldId: 'item',                         line: i }) || '',
                    city           : propRec.getSublistText ({ sublistId: 'item', fieldId: 'cseg_cities',                  line: i }) || '',
                    bookingPeriod  : propRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_az_rs_booking_period', line: i }) || '',
                    faces          : parseFloat(propRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_az_rs_faces',        line: i }) || 0),
                    rentalCost     : parseFloat(propRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_az_rs_rental_cost',  line: i }) || 0),
                    discountPct    : parseFloat(propRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_az_rs_discount',     line: i }) || 0),
                    rate           : parseFloat(propRec.getSublistValue({ sublistId: 'item', fieldId: 'rate',                      line: i }) || 0),
                    amount         : parseFloat(propRec.getSublistValue({ sublistId: 'item', fieldId: 'amount',                    line: i }) || 0),
                });
            }

            return lines;

        } catch (err) {
            log.debug('getItemLines Error', err);
            return [];
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    const formatDate = (dateVal) => {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        if (isNaN(d)) return String(dateVal);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return String(d.getDate()).padStart(2,'0') + '-' + months[d.getMonth()] + '-' + d.getFullYear();
    };

    const fmtNum = (num) =>
        Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    /**
     * Builds a map of { lowerCaseItemName -> handlingFeeAmount }
     * by scanning all lines for items whose name ends with "- handling fees".
     */
    const buildHandlingFeeMap = (itemLines) => {
        const map = {};
        for (const line of itemLines) {
            if (line.itemName.toLowerCase().endsWith('- handling fees')) {
                const parentName = line.itemName.toLowerCase().replace(/- handling fees$/, '').trim();
                if (parentName) {
                    map[parentName] = (map[parentName] || 0) + line.amount;
                }
            }
        }
        return map;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // TEMPLATE HEADER (PDF head + macros)
    // ─────────────────────────────────────────────────────────────────────────

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

            template += '<link name="NotoSansArabic" type="font" subtype="truetype" ';
            template += 'src="${nsfont.NotoSansArabic_Regular}" ';
            template += 'src-bold="${nsfont.NotoSansArabic_Bold}" ';
            template += 'bytes="2" />';

            template += '<macrolist>';

            template += '<macro id="nlheader">';
            template += '<table style="width:100%;font-size:10pt;">';
            template += '<tr>';

            if (subsidiaryData.logoURL) {
                template += '<td width="45%" align="left">';
                template += '<img src="' + subsidiaryData.logoURL + '" style="float:left;width:150px;height:90px;" />';
                template += '</td>';
            } else {
                template += '<td width="45%" align="left"></td>';
            }

            template += '<td width="55%" align="left" style="vertical-align:middle;font-size:25px;">Proposal</td>';
            template += '</tr>';
            template += '</table>';
            template += '</macro>';

            template += '</macrolist>';

            template += '<style>* { font-family: "NotoSansArabic", sans-serif; }</style>';

            template += '</head>';

            template += '<body header="nlheader" header-height="10%" ';
            template += 'padding="0.5in 0.5in 0.5in 0.5in" size="Letter">';

            return template;

        } catch (err) {
            log.debug('getTemplateHeader Error', err);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // TEMPLATE BODY
    // ─────────────────────────────────────────────────────────────────────────

    const getTemplateBody = (template, header, subsidiaryData, customerData, itemLines) => {
        try {
            const handlingFeeMap = buildHandlingFeeMap(itemLines);

            /** ── 1st Table: Info (Client / Brand / Date / Currency) ────────── */

            template += '<table width="100%">';

            // Row: CLIENT
            template += '<tr>';
            template += '<td width="17%" align="left" style="font-size:8px;font-weight:bold;">CLIENT:</td>';
            template += '<td width="25%" align="left" style="font-size:8px;font-weight:bold;">' + (header.customerNameEn || header.entity || '') + '</td>';
            template += '<td width="20%"> </td>';
            if (theme.showArabic) {
                template += '<td width="25%" align="right" style="font-size:8px;font-weight:bold;">' + (header.customerNameAr || '') + '</td>';
                template += '<td width="13%" align="right" style="font-size:8px;font-weight:bold;">:&#x627;&#x644;&#x639;&#x645;&#x64A;&#x644;</td>';
            } else {
                template += '<td width="25%"></td><td width="13%"></td>';
            }
            template += '</tr>';

            // Row: BRAND
            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">BRAND:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
            template += '<td> </td>';
            if (theme.showArabic) {
                template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
                template += '<td align="right" style="font-size:8px;font-weight:bold;">:&#x627;&#x644;&#x645;&#x627;&#x631;&#x643;&#x629;</td>';
            } else {
                template += '<td></td><td></td>';
            }
            template += '</tr>';

            // Row: DATE OF SUBMISSION
            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">DATE OF SUBMISSION:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
            template += '<td> </td>';
            if (theme.showArabic) {
                template += '<td align="right" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
                template += '<td align="right" style="font-size:8px;font-weight:bold;">:&#x062A;&#x0627;&#x0631;&#x064A;&#x062E; &#x0627;&#x0644;&#x062A;&#x0633;&#x0644;&#x064A;&#x0645;</td>';
            } else {
                template += '<td></td><td></td>';
            }
            template += '</tr>';

            // Row: CURRENCY
            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">CURRENCY:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.currency || '') + '</td>';
            template += '<td> </td>';
            if (theme.showArabic) {
                template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.currencyAr || '') + '</td>';
                template += '<td align="right" style="font-size:8px;font-weight:bold;">:&#x627;&#x644;&#x639;&#x645;&#x644;&#x629;</td>';
            } else {
                template += '<td></td><td></td>';
            }
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 2nd Table: Item Lines ──────────────────────────────────────── */

            template += '<table width="100%" style="padding-top:20px;">';

            // Header row
            const th = (w, label) =>
                '<td width="' + w + '" align="center" style="background-color:' + theme.headerBg + ';font-size:8px;font-weight:bold;color:' + theme.headerColor + ';border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle;">' + label + '</td>';

            template += '<tr>';
            template += th('12%', 'CITY');
            template += th('20%', 'MEDIA');
            template += th('9%',  'DURATION');
            template += th('5%',  'FACES');
            template += th('12%', 'GROSS');
            template += th('8%',  'DISCOUNT');
            template += th('12%', 'NET');
            // Last column: no right border via white — use actual border
            template += '<td width="6%" align="center" style="background-color:' + theme.headerBg + ';font-size:8px;font-weight:bold;color:' + theme.headerColor + ';border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle;">HANDLING FEES</td>';
            template += '<td width="6%" align="center" style="background-color:' + theme.headerBg + ';font-size:8px;font-weight:bold;color:' + theme.headerColor + ';border-top:0.5px;border-right:0.5px solid;border-bottom:0.5px;vertical-align:middle;">TOTAL</td>';
            template += '</tr>';

            // Data rows
            let totalFaces        = 0;
            let totalRate         = 0;
            let totalDiscountAmt  = 0;
            let totalNet          = 0;
            let totalNetHand      = 0;
            let totalHandlingFees = 0;

            for (let i = 0; i < itemLines.length; i++) {
                const line = itemLines[i];

                // Skip handling fee lines — only accumulate their total
                if (line.itemName.toLowerCase().endsWith('- handling fees')) {
                    totalHandlingFees += line.amount;
                    continue;
                }

                // Look up matching handling fee by item name
                const lookupName       = line.itemName.toLowerCase().trim();
                const handlingFeeAmt   = handlingFeeMap[lookupName] || 0;

                const discountAmount   = line.rate * (line.discountPct / 100);
                const net              = line.rate - discountAmount;
                const lineTotal        = net + handlingFeeAmt;

                totalFaces       += line.faces;
                totalRate        += line.rate;
                totalDiscountAmt += discountAmount;
                totalNet         += net;
                totalNetHand     += lineTotal;

                const cellStyle = 'border-bottom:0.5px solid ' + theme.borderColor + ';border-right:0.5px solid ' + theme.borderColor + ';font-size:8px;';
                const firstCellStyle = 'border-left:0.5px solid ' + theme.borderColor + ';' + cellStyle;

                template += '<tr>';
                template += '<td align="left"  style="' + firstCellStyle + '">' + (line.city          || '') + '</td>';
                template += '<td align="left"  style="' + cellStyle + '">'      + (line.itemName       || '') + '</td>';
                template += '<td align="center" style="' + cellStyle + '">'     + (line.bookingPeriod  || '') + '</td>';
                template += '<td align="center" style="' + cellStyle + '">'     + (line.faces ? Number(line.faces).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '') + '</td>';
                template += '<td align="center" style="' + cellStyle + '">'     + (line.rate   ? fmtNum(line.rate)          : '') + '</td>';
                template += '<td align="center" style="' + cellStyle + '">'     + (line.discountPct || 0) + '</td>';
                template += '<td align="center" style="' + cellStyle + '">'     + fmtNum(net)             + '</td>';
                template += '<td align="center" style="' + cellStyle + '">'     + fmtNum(handlingFeeAmt)  + '</td>';
                template += '<td align="center" style="' + cellStyle + '">'     + fmtNum(lineTotal)       + '</td>';
                template += '</tr>';
            }

            // Spacer row
            template += '<tr><td colspan="9" style="padding-top:20px;border-right:0.5px;border-bottom:0.5px;border-left:0.5px;"></td></tr>';

            // TOTAL row
            const totalRowStyle = 'background-color:' + theme.totalRowBg + ';font-size:8px;font-weight:bold;color:' + theme.totalRowColor + ';border-bottom:0.5px;vertical-align:middle;';
            template += '<tr>';
            template += '<td align="center" style="' + totalRowStyle + 'border-left:0.5px;">TOTAL | &#x627;&#x644;&#x645;&#x62C;&#x645;&#x648;&#x639;</td>';
            template += '<td align="center" style="' + totalRowStyle + '"></td>';
            template += '<td align="center" style="' + totalRowStyle + '"></td>';
            template += '<td align="center" style="' + totalRowStyle + '">' + totalFaces + '</td>';
            template += '<td align="center" style="' + totalRowStyle + '">' + fmtNum(totalRate)        + '</td>';
            template += '<td align="center" style="' + totalRowStyle + '"></td>';
            template += '<td align="center" style="' + totalRowStyle + '">' + fmtNum(totalNet)         + '</td>';
            template += '<td align="center" style="' + totalRowStyle + '">' + fmtNum(totalHandlingFees) + '</td>';
            template += '<td align="center" style="' + totalRowStyle + 'border-right:0.5px;">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 3rd Table: Summary (Total Net / Discount / VAT / Grand Total) */

            const discountTotal = Math.abs(parseFloat(header.discounttotal) || 0);
            const vatAmount     = parseFloat(header.taxtotal) || 0;
            const netBeforeVat  = totalNetHand - discountTotal;
            const grandTotal    = netBeforeVat + vatAmount;

            const summaryLabelStyle = 'background-color:' + theme.summaryLabelBg + ';font-size:8px;font-weight:bold;color:' + theme.summaryLabelColor + ';border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle;';
            const summaryValueStyle = 'font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle;text-align:right;';

            template += '<table width="100%" style="padding-top:10px;">';

            // Total Net
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="' + summaryLabelStyle + '">TOTAL NET:</td>';
            template += '<td width="20%" style="' + summaryValueStyle + '">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            // Conditional: Additional Discount + Net Before VAT
            if (discountTotal > 0) {
                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="' + summaryLabelStyle + '">Additional Discount:</td>';
                template += '<td width="20%" style="' + summaryValueStyle + '">' + fmtNum(discountTotal) + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="' + summaryLabelStyle + '">Net Before VAT:</td>';
                template += '<td width="20%" style="' + summaryValueStyle + '">' + fmtNum(netBeforeVat) + '</td>';
                template += '</tr>';
            }

            // VAT
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:' + theme.summaryLabelBg + ';font-size:8px;font-weight:bold;color:' + theme.summaryLabelColor + ';border-right:0.5px;border-bottom:0.5px solid white;border-top:0.5px solid white;border-left:0.5px;vertical-align:middle;">VAT (15%):</td>';
            template += '<td width="20%" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle;text-align:right;">' + fmtNum(vatAmount) + '</td>';
            template += '</tr>';

            // Grand Total
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:' + theme.grandTotalBg + ';font-size:8px;font-weight:bold;color:' + theme.grandTotalColor + ';border-right:0.5px;border-bottom:0.5px;border-left:0.5px;vertical-align:middle;">Grand Total:</td>';
            template += '<td width="20%" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle;text-align:right;">' + fmtNum(grandTotal) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 4th Table: Client Approval (bilingual) ─────────────────────── */

            template += '<table style="width:100%;font-size:8px;padding-top:100px;">';

            template += '<tr style="border-top:1px solid ' + theme.approvalColor + ';">';
            template += '<td align="left" style="font-weight:bold;border-top:1px double ' + theme.approvalColor + ';font-size:8px;">CLIENT APPROVAL</td>';
            template += '<td style="font-weight:bold;border-top:1px double ' + theme.approvalColor + ';"></td>';
            template += '<td align="right" style="font-weight:bold;border-top:1px double ' + theme.approvalColor + ';font-size:8px;">&#x645;&#x648;&#x627;&#x641;&#x642;&#x629; &#x627;&#x644;&#x639;&#x645;&#x64A;&#x644;</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td width="5%" align="left" style="font-size:8px;">By signing the below, I hereby acknowledge that I have completely read and fully understood the financial proposal as well as the terms and conditions set forth</td>';
            template += '<td width="40%"></td>';
            template += '<td width="50%" align="right" style="font-size:8px;">&#x628;&#x627;&#x644;&#x62A;&#x648;&#x642;&#x64A;&#x639; &#x623;&#x62F;&#x646;&#x627;&#x647; &#x060C; &#x623;&#x642;&#x631; &#x628;&#x645;&#x648;&#x62C;&#x628;&#x647; &#x623;&#x646;&#x646;&#x64A; &#x642;&#x62F; &#x627;&#x637;&#x644;&#x639;&#x62A; &#x639;&#x644;&#x649; &#x627;&#x644;&#x639;&#x631;&#x636; &#x627;&#x644;&#x645;&#x627;&#x644;&#x64A; &#x628;&#x627;&#x644;&#x643;&#x627;&#x645;&#x644; &#x648; &#x643;&#x630;&#x644;&#x643; &#x627;&#x644;&#x634;&#x631;&#x648;&#x637; &#x648; &#x627;&#x644;&#x623;&#x62D;&#x643;&#x627;&#x645; &#x648; &#x627;&#x644;&#x645;&#x646;&#x635;&#x648;&#x635; &#x639;&#x644;&#x64A;&#x647;&#x627; &#x648; &#x641;&#x647;&#x645;&#x62A;&#x647;&#x627; &#x628;&#x627;&#x644;&#x643;&#x627;&#x645;&#x644;</td>';
            template += '</tr>';

            template += '</table>';

            template += '<table width="100%" style="padding-top:15px;">';

            template += '<tr>';
            template += '<td width="35%" align="left" style="border-bottom:0.5px ' + theme.approvalColor + ';font-size:8px;color:' + theme.approvalColor + ';">NAME | &#x627;&#x644;&#x625;&#x633;&#x645;</td>';
            template += '<td width="10%"></td>';
            template += '<td width="35%" align="left" style="border-bottom:0.5px ' + theme.approvalColor + ';font-size:8px;color:' + theme.approvalColor + ';">SIGNATURE | &#x627;&#x644;&#x62A;&#x648;&#x642;&#x64A;&#x639;</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="border-bottom:0.5px ' + theme.approvalColor + ';font-size:8px;color:' + theme.approvalColor + ';">POSITION | &#x627;&#x644;&#x645;&#x646;&#x635;&#x628;</td>';
            template += '<td></td>';
            template += '<td align="left"></td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="border-bottom:0.5px ' + theme.approvalColor + ';font-size:8px;color:' + theme.approvalColor + ';">DATE | &#x627;&#x644;&#x62A;&#x627;&#x631;&#x64A;&#x62E;</td>';
            template += '<td></td>';
            template += '<td align="left" style="border-bottom:0.5px ' + theme.approvalColor + ';font-size:8px;color:' + theme.approvalColor + ';">STAMP | &#x627;&#x644;&#x62E;&#x62A;&#x645;</td>';
            template += '</tr>';

            template += '</table>';

            return template;

        } catch (err) {
            log.debug('getTemplateBody Error', err);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // FINALIZE & RENDER
    // ─────────────────────────────────────────────────────────────────────────

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