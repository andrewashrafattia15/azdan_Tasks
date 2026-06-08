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

                const proposalData = getProposalData(recordId);
                if (!proposalData) {
                    context.response.write('Unable to load proposal. Please contact your administrator.');
                    return;
                }

                const { header, subsidiaryData, itemLines } = proposalData;

                let template = getTemplateHeader(subsidiaryData, header);
                
                switch (header.printoutVersion) {
                    case '2': template = getTemplateBodyV1(template, header, subsidiaryData, itemLines); break;
                    case '3': template = getTemplateBodyV2(template, header, subsidiaryData, itemLines); break;
                    case '4': template = getTemplateBodyV3(template, header, subsidiaryData, itemLines); break;
                    case '5': template = getTemplateBodyV4(template, header, subsidiaryData, itemLines); break;
                    case '6': template = getTemplateBodyV5(template, header, subsidiaryData, itemLines); break;
                    case '7': template = getTemplateBodyV6(template, header, subsidiaryData, itemLines); break;
                    default : template = getTemplateBodyV1(template, header, subsidiaryData, itemLines); break;
                }
                
                finalizeTemplate(template, context, { header, subsidiaryData, itemLines });
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
                type: record.Type.SALES_ORDER,
                id: recordId,
                isDynamic: false
            });

            const entityId   = propRec.getValue({ fieldId: 'entity' });
            const salesrepId = propRec.getValue({ fieldId: 'salesrep' });

            let customerNameEn = '';
            let customerNameAr = '';

            if (entityId) {
                    const customerSearch = search.lookupFields({
                        type    : search.Type.CUSTOMER,
                        id      : entityId,
                        columns : ['custentity_az_rs_customer_name', 'custentity_az_rs_customer_ar']
                    });
                    customerNameEn = customerSearch.custentity_az_rs_customer_name || '';
                    customerNameAr = customerSearch.custentity_az_rs_customer_ar   || '';
            }

            const header = {
                tranid          : propRec.getValue({ fieldId: 'tranid'}) || '',
                trandate        : propRec.getValue({ fieldId: 'trandate'}) || '',
                entity          : propRec.getText ({ fieldId: 'entity'}) || '',
                entityId        : entityId,
                brand           : propRec.getText ({ fieldId: 'custbody_az_rs_brand'}) || '',
                proposalVersion : propRec.getValue({ fieldId: 'custbody_az_rs_proposal_printouts'}) || '',
                currency        : propRec.getText ({ fieldId: 'custbody_az_rs_currency'}) || '',
                currencyAr      : propRec.getText ({ fieldId: 'custbody_az_rs_currency_ar'}) || '',
                customerNameEn  : customerNameEn,
                customerNameAr  : customerNameAr,
                taxtotal        : propRec.getValue({ fieldId: 'taxtotal'}) || 0,
                discounttotal   : propRec.getValue({ fieldId: 'discounttotal'}) || 0,
                subsidiaryId    : propRec.getValue({ fieldId: 'subsidiary'}) || '',
                printoutVersion : propRec.getValue ({ fieldId: 'custbody_az_rs_proposal_printouts'})|| '2',
            };

            const subsidiaryData = getSubsidiaryData(header.subsidiaryId);
            const itemLines      = getItemLines(propRec);

            return { header, subsidiaryData, itemLines };

        } catch (err) {
            log.debug('getProposalData Error', err);
            return { header: {}, subsidiaryData: {}, itemLines: [] };
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
                const raw = propRec.getSublistValue({ sublistId: 'item', fieldId: 'taxline', line: i });
                const isTaxLine = raw === true || raw === 'T' || raw === 'true' || raw === 1 || raw === '1' || raw === 'Y';
                if (isTaxLine) continue;

                lines.push({
                    itemName       : propRec.getSublistText ({ sublistId: 'item', fieldId: 'item',                         line: i }) || '',
                    city           : propRec.getSublistText ({ sublistId: 'item', fieldId: 'cseg_cities',                  line: i }) || '',
                    bookingPeriod  : propRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_az_rs_booking_period', line: i }) || '',
                    faces          : toNum(propRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_az_rs_faces',        line: i }) || 0),
                    rentalCost     : toNum(propRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_az_rs_rental_cost',  line: i }) || 0),
                    discountPct    : toNum(propRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_az_rs_discount',     line: i }) || 0),
                    rate           : toNum(propRec.getSublistValue({ sublistId: 'item', fieldId: 'rate',                      line: i }) || 0),
                    amount         : toNum(propRec.getSublistValue({ sublistId: 'item', fieldId: 'amount',                    line: i }) || 0),
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

    const fmtNum = (num) => {
        const n = Number(num);
        return (Number.isFinite(n) ? n : 0)
            .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const toNum = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
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
            template += '<table style="width: 100%; font-size: 10pt;">';
            template += '<tr>';

            if (subsidiaryData.logoURL) {
                template += '<td width="45%" align="left">';
                template += '<img src="' + subsidiaryData.logoURL + '" style="float: left; width:150px; height:90px" />';
                template += '</td>';
            } else {
                template += '<td width="45%" align="left"></td>';
            }

            template += '<td width="55%" align="left" style="vertical-align:middle;font-size:25px">Proposal</td>';
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
    // TEMPLATE BODY (Version 1 - default)
    // ─────────────────────────────────────────────────────────────────────────
     const getTemplateBodyV1 = (template, header, subsidiaryData, itemLines) => {
        try {
            const handlingFeeMap = buildHandlingFeeMap(itemLines);

            /** ── 1st Table: Info (Client / Brand / Date / Currency) ────────── */

            template += '<table width="100%">';

            template += '<tr>';
            template += '<td width="15%" align="left" style="font-size:8px;font-weight:bold;">CLIENT:</td>';
            template += '<td width="25%" align="left" style="font-size:8px;font-weight:bold;">' + (header.customerNameEn || '') + '</td>';
            template += '<td width="20%"> </td>';
            template += '<td width="25%" align="right" style="font-size:8px;font-weight:bold;">' + (header.customerNameAr || '') + '</td>';
            template += '<td width="15%" align="right" style="font-size:8px;font-weight:bold;">:العميل</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">BRAND:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
            template += '<td> </td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:الماركة</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">DATE OF SUBMISSION:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
            template += '<td> </td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:تاريخ التسليم</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">CURRENCY:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.currency || '') + '</td>';
            template += '<td> </td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.currencyAr || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:العملة</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 2nd Table: Item Lines ──────────────────────────────────────── */

            template += '<table width="100%" style="padding-top:20px">';

            template += '<tr>';
            template += '<td width="15%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">CITY</td>';
            template += '<td width="20%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">MEDIA</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">DURATION</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">EXPOSURES</td>';
            template += '<td width="45%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid;border-bottom:0.5px;vertical-align:middle">PACKAGE DEAL</td>';
            template += '</tr>';

            
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

               
                template += '<tr>';
                template += '<td align="left"  style="border-left:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">' + (line.city || '') + '</td>';
                template += '<td align="left"  style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.itemName|| '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.bookingPeriod || '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.faces ? Number(line.faces).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ fmtNum(lineTotal) + '</td>';
                template += '</tr>';
            }

            template += '<tr><td colspan="9" style="padding-top:20px;border-right:0.5px;border-bottom:0.5px;border-left:0.5px;"></td></tr>';

            template += '<tr>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">TOTAL | المجموع</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + totalFaces + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;border-right:0.5px;vertical-align:middle">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 3rd Table: Summary (Total Net / Discount / VAT / Grand Total) */

            const discountTotal = Math.abs(parseFloat(header.discounttotal) || 0);
            const vatAmount     = parseFloat(header.taxtotal) || 0;
            const netBeforeVat  = totalNetHand - discountTotal;
            const grandTotal    = netBeforeVat + vatAmount;

            template += '<table width="100%" style="padding-top:10px">';

            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">TOTAL NET:</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            // Conditional: Additional Discount + Net Before VAT
            if (discountTotal > 0) {
                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">Additional Discount :</td>';
                template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(discountTotal) + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">Net Before VAT :</td>';
                template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(netBeforeVat) + '</td>';
                template += '</tr>';
            }

            
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-right:0.5px;border-bottom:0.5px solid white;border-top:0.5px solid white;border-left:0.5px;vertical-align:middle">VAT (15%):</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(vatAmount) + '</td>';
            template += '</tr>';

            
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:black;font-size:8px;font-weight:bold;color:white;border-right:0.5px;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">Grand Total:</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(grandTotal) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 4th Table: Client Approval (bilingual) ─────────────────────── */

            template += '<table style="width: 100%; font-size: 8px;padding-top:100px">';

            template += '<tr style="border-top:1px solid #0E763D;padding-top:0.5px">';
            template += '<td align="left" style="font-weight:bold;border-top: 1px double green;font-size:8px">CLIENT APPROVAL</td>';
            template += '<td style="font-weight:bold;border-top: 1px double green;"></td>';
            template += '<td align="right" style="font-weight:bold;border-top: 1px double green;font-size:8px">موافقة العميل</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td width="5%" align="left" style="font-size:8px">By signing the below, I hereby acknowledge that I have completely read and fully understood the financial proposal as well as the terms and conditions set forth</td>';
            template += '<td width="40%"></td>';
            template += '<td width="50%" align="right" style="font-size:8px"><p align="right">بالتوقيع أدناه ، أقر بموجبه أنني قد اطلعت على العرض المالي بالكامل و كذلك الشروط و الأحكام و المنصوص عليها و فهمتها بالكامل</p></td>';
            template += '</tr>';

            template += '</table>';

            template += '<table width="100%" style="padding-top:15px">';

            template += '<tr style="padding-top:25px">';
            template += '<td width="35%" align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D">NAME | الإسم</td>';
            template += '<td width="10%"></td>';
            template += '<td width="35%" align="left" style="border-bottom:0.5px #0E763D ; font-size:8px;color:#0E763D">SIGNATURE | التوقيع</td>';
            template += '</tr>';

            template += '<tr style="padding-top:25px">';
            template += '<td align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D">POSITION | المنصب</td>';
            template += '<td></td>';
            template += '<td align="left"></td>';
            template += '</tr>';

            template += '<tr style="padding-top:25px">';
            template += '<td align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D ">DATE | التاريخ</td>';
            template += '<td></td>';
            template += '<td align="left" style="border-bottom:0.5px #0E763D ; font-size:8px;color:#0E763D">STAMP | الختم</td>';
            template += '</tr>';

            template += '</table>';

            return template;

        } catch (err) {
            log.debug('getTemplateBodyV1 Error', err);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // TEMPLATE BODY (Version 2) 
    // ─────────────────────────────────────────────────────────────────────────

    const getTemplateBodyV2 = (template, header, subsidiaryData, itemLines) => {
        try {
            const handlingFeeMap = buildHandlingFeeMap(itemLines);

            /** ── 1st Table: Info (Client / Brand / Date / Currency) ────────── */

            template += '<table width="100%">';

            template += '<tr>';
            template += '<td width="15%" align="left" style="font-size:8px;font-weight:bold;">CLIENT:</td>';
            template += '<td width="25%" align="left" style="font-size:8px;font-weight:bold;">' + (header.customerNameEn || '') + '</td>';
            template += '<td width="20%"> </td>';
            template += '<td width="25%" align="right" style="font-size:8px;font-weight:bold;">' + (header.customerNameAr || '') + '</td>';
            template += '<td width="15%" align="right" style="font-size:8px;font-weight:bold;">:العميل</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">BRAND:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
            template += '<td> </td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:الماركة</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">DATE OF SUBMISSION:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
            template += '<td> </td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:تاريخ التسليم</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">CURRENCY:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.currency || '') + '</td>';
            template += '<td> </td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.currencyAr || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:العملة</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 2nd Table: Item Lines ──────────────────────────────────────── */

            template += '<table width="100%" style="padding-top:20px">';

            template += '<tr>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">CITY</td>';
            template += '<td width="15%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">MEDIA</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">DURATION</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">FACADES/<br/>CIRCUITS</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">GROSS</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">DISCOUNT</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">NET</td>';
            template += '<td width="15%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">HANDLING FEES</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid;border-bottom:0.5px;vertical-align:middle">TOTAL NET</td>';
            template += '</tr>';

            
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

               
                template += '<tr>';
                template += '<td align="left"  style="border-left:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">' + (line.city || '') + '</td>';
                template += '<td align="left"  style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.itemName|| '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.bookingPeriod || '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.faces ? Number(line.faces).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.rate ? fmtNum(line.rate) : '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.discountPct || 0) + '% </td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ fmtNum(net) + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ fmtNum(handlingFeeAmt) + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ fmtNum(lineTotal) + '</td>';
                template += '</tr>';
            }

            template += '<tr><td colspan="9" style="padding-top:20px;border-right:0.5px;border-bottom:0.5px;border-left:0.5px;"></td></tr>';

            template += '<tr>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">TOTAL | المجموع</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + totalFaces + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalRate) + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalNet) + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalHandlingFees) + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;border-right:0.5px;vertical-align:middle">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 3rd Table: Summary (Total Net / Discount / VAT / Grand Total) */

            const discountTotal = Math.abs(parseFloat(header.discounttotal) || 0);
            const vatAmount     = parseFloat(header.taxtotal) || 0;
            const netBeforeVat  = totalNetHand - discountTotal;
            const grandTotal    = netBeforeVat + vatAmount;

            template += '<table width="100%" style="padding-top:10px">';

            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">TOTAL NET:</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            // Conditional: Additional Discount + Net Before VAT
            if (discountTotal > 0) {
                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">Additional Discount :</td>';
                template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(discountTotal) + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">Net Before VAT :</td>';
                template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(netBeforeVat) + '</td>';
                template += '</tr>';
            }

            
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-right:0.5px;border-bottom:0.5px solid white;border-top:0.5px solid white;border-left:0.5px;vertical-align:middle">VAT (15%):</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(vatAmount) + '</td>';
            template += '</tr>';

            
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:black;font-size:8px;font-weight:bold;color:white;border-right:0.5px;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">Grand Total:</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(grandTotal) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 4th Table: Client Approval (bilingual) ─────────────────────── */

            template += '<table style="width: 100%; font-size: 8px;padding-top:100px">';

            template += '<tr style="border-top:1px solid #0E763D;padding-top:0.5px">';
            template += '<td align="left" style="font-weight:bold;border-top: 1px double green;font-size:8px">CLIENT APPROVAL</td>';
            template += '<td style="font-weight:bold;border-top: 1px double green;"></td>';
            template += '<td align="right" style="font-weight:bold;border-top: 1px double green;font-size:8px">موافقة العميل</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td width="5%" align="left" style="font-size:8px">By signing the below, I hereby acknowledge that I have completely read and fully understood the financial proposal as well as the terms and conditions set forth</td>';
            template += '<td width="40%"></td>';
            template += '<td width="50%" align="right" style="font-size:8px"><p align="right">بالتوقيع أدناه ، أقر بموجبه أنني قد اطلعت على العرض المالي بالكامل و كذلك الشروط و الأحكام و المنصوص عليها و فهمتها بالكامل</p></td>';
            template += '</tr>';

            template += '</table>';

            template += '<table width="100%" style="padding-top:15px">';

            template += '<tr style="padding-top:25px">';
            template += '<td width="35%" align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D">NAME | الإسم</td>';
            template += '<td width="10%"></td>';
            template += '<td width="35%" align="left" style="border-bottom:0.5px #0E763D ; font-size:8px;color:#0E763D">SIGNATURE | التوقيع</td>';
            template += '</tr>';

            template += '<tr style="padding-top:25px">';
            template += '<td align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D">POSITION | المنصب</td>';
            template += '<td></td>';
            template += '<td align="left"></td>';
            template += '</tr>';

            template += '<tr style="padding-top:25px">';
            template += '<td align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D ">DATE | التاريخ</td>';
            template += '<td></td>';
            template += '<td align="left" style="border-bottom:0.5px #0E763D ; font-size:8px;color:#0E763D">STAMP | الختم</td>';
            template += '</tr>';

            template += '</table>';

            return template;

        } catch (err) {
            log.debug('getTemplateBodyV2 Error', err);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // TEMPLATE BODY (Version 3) 
    // ─────────────────────────────────────────────────────────────────────────

    const getTemplateBodyV3 = (template, header, subsidiaryData, itemLines) => {
        try {
            const handlingFeeMap = buildHandlingFeeMap(itemLines);

            /** ── 1st Table: Info (Client / Brand / Date / Currency) ────────── */

            template += '<table width="100%">';

            template += '<tr>';
            template += '<td width="30%" align="left" style="font-size:8px;font-weight:bold;">CLIENT:</td>';
            template += '<td width="25%" align="left" style="font-size:8px;font-weight:bold;">' + (header.customerNameEn || '') + '</td>';
            template += '<td width="25%" align="right" style="font-size:8px;font-weight:bold;">' + (header.customerNameAr || '') + '</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;">:العميل</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">BRAND:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:الماركة</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">COVERAGE:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">KSA</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">KSA</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:التغطية</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">DATE OF SUBMISSION:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:تاريخ التسليم</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">CURRENCY:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.currency || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.currencyAr || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:العملة</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">NOTE:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">The following proposal is valid for a period of two (2) weeks from date of submission stated above.Beyond this period and/or for any modification(s) required,kindly contact SSM sales team for reconfirmation before proceeding</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;"><p align="right">عرض السعر أدناه صالح لمدة أسبوعين (2) من تاريخ التقديم المذكور أعلاه.  بعد هذه الفترة / أو لأي تعديل(تعديلات)، يرجى الاتصال بفريق مبيعات سعودي ساينز ميديا لإعادة التأكيد قبل المتابعة</p></td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:ملحوظة</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 2nd Table: Item Lines ──────────────────────────────────────── */

            template += '<table width="100%" style="padding-top:20px">';

            template += '<tr>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">CITY</td>';
            template += '<td width="15%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">MEDIA</td>';
            template += '<td width="12.5%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">NO. OF WEEKS</td>';
            template += '<td width="7.5%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">FACES</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">GROSS</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">DISCOUNT</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">NET</td>';
            template += '<td width="15%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">HANDLING FEES</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid;border-bottom:0.5px;vertical-align:middle">TOTAL</td>';
            template += '</tr>';

            
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

               
                template += '<tr>';
                template += '<td align="left"  style="border-left:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">' + (line.city || '') + '</td>';
                template += '<td align="left"  style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.itemName|| '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.bookingPeriod || '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.faces ? Number(line.faces).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.rate ? fmtNum(line.rate) : '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.discountPct || 0) + '% </td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ fmtNum(net) + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ fmtNum(handlingFeeAmt) + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ fmtNum(lineTotal) + '</td>';
                template += '</tr>';
            }

            template += '<tr><td colspan="9" style="padding-top:20px;border-right:0.5px;border-bottom:0.5px;border-left:0.5px;"></td></tr>';

            template += '<tr>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">TOTAL | المجموع</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + totalFaces + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalRate) + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalNet) + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalHandlingFees) + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;border-right:0.5px;vertical-align:middle">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 3rd Table: Summary (Total Net / Discount / VAT / Grand Total) */

            const discountTotal = Math.abs(parseFloat(header.discounttotal) || 0);
            const vatAmount     = parseFloat(header.taxtotal) || 0;
            const netBeforeVat  = totalNetHand - discountTotal;
            const grandTotal    = netBeforeVat + vatAmount;

            template += '<table width="100%" style="padding-top:10px">';

            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">TOTAL NET:</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            // Conditional: Additional Discount + Net Before VAT
            if (discountTotal > 0) {
                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">Additional Discount :</td>';
                template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(discountTotal) + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">Net Before VAT :</td>';
                template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(netBeforeVat) + '</td>';
                template += '</tr>';
            }

            
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-right:0.5px;border-bottom:0.5px solid white;border-top:0.5px solid white;border-left:0.5px;vertical-align:middle">VAT (15%):</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(vatAmount) + '</td>';
            template += '</tr>';

            
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:black;font-size:8px;font-weight:bold;color:white;border-right:0.5px;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">Grand Total:</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(grandTotal) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 4th Table: Client Approval (bilingual) ─────────────────────── */

            template += '<table style="width: 100%; font-size: 8px;padding-top:100px">';

            template += '<tr style="border-top:1px solid #0E763D;padding-top:0.5px">';
            template += '<td align="left" style="font-weight:bold;border-top: 1px double green;font-size:8px">CLIENT APPROVAL</td>';
            template += '<td style="font-weight:bold;border-top: 1px double green;"></td>';
            template += '<td align="right" style="font-weight:bold;border-top: 1px double green;font-size:8px">موافقة العميل</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td width="5%" align="left" style="font-size:8px">By signing the below, I hereby acknowledge that I have completely read and fully understood the financial proposal as well as the terms and conditions set forth</td>';
            template += '<td width="40%"></td>';
            template += '<td width="50%" align="right" style="font-size:8px"><p align="right">بالتوقيع أدناه ، أقر بموجبه أنني قد اطلعت على العرض المالي بالكامل و كذلك الشروط و الأحكام و المنصوص عليها و فهمتها بالكامل</p></td>';
            template += '</tr>';

            template += '</table>';

            template += '<table width="100%" style="padding-top:15px">';

            template += '<tr style="padding-top:25px">';
            template += '<td width="35%" align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D">NAME | الإسم</td>';
            template += '<td width="10%"></td>';
            template += '<td width="35%" align="left" style="border-bottom:0.5px #0E763D ; font-size:8px;color:#0E763D">SIGNATURE | التوقيع</td>';
            template += '</tr>';

            template += '<tr style="padding-top:25px">';
            template += '<td align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D">POSITION | المنصب</td>';
            template += '<td></td>';
            template += '<td align="left"></td>';
            template += '</tr>';

            template += '<tr style="padding-top:25px">';
            template += '<td align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D ">DATE | التاريخ</td>';
            template += '<td></td>';
            template += '<td align="left" style="border-bottom:0.5px #0E763D ; font-size:8px;color:#0E763D">STAMP | الختم</td>';
            template += '</tr>';

            template += '</table>';

            return template;

        } catch (err) {
            log.debug('getTemplateBodyV3 Error', err);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // TEMPLATE BODY (Version 4) 
    // ─────────────────────────────────────────────────────────────────────────

    const getTemplateBodyV4 = (template, header, subsidiaryData, itemLines) => {
        try {
            const handlingFeeMap = buildHandlingFeeMap(itemLines);

            /** ── 1st Table: Info (Client / Brand / Date / Currency) ────────── */

            template += '<table width="100%">';

            template += '<tr>';
            template += '<td width="30%" align="left" style="font-size:8px;font-weight:bold;">CLIENT:</td>';
            template += '<td width="25%" align="left" style="font-size:8px;font-weight:bold;">' + (header.customerNameEn || '') + '</td>';
            template += '<td width="25%" align="right" style="font-size:8px;font-weight:bold;">' + (header.customerNameAr || '') + '</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;">:العميل</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">BRAND:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:الماركة</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">COVERAGE:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">KSA</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">KSA</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:التغطية</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">DATE OF SUBMISSION:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:تاريخ التسليم</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">CURRENCY:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.currency || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.currencyAr || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:العملة</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">NOTE:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">The following proposal is valid for a period of two (2) weeks from date of submission stated above.Beyond this period and/or for any modification(s) required,kindly contact SSM sales team for reconfirmation before proceeding</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;"><p align="right">عرض السعر أدناه صالح لمدة أسبوعين (2) من تاريخ التقديم المذكور أعلاه.  بعد هذه الفترة / أو لأي تعديل(تعديلات)، يرجى الاتصال بفريق مبيعات سعودي ساينز ميديا لإعادة التأكيد قبل المتابعة</p></td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:ملحوظة</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 2nd Table: Item Lines ──────────────────────────────────────── */

            template += '<table width="100%" style="padding-top:20px">';

            template += '<tr>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">CITY</td>';
            template += '<td width="15%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">MEDIA</td>';
            template += '<td width="12.5%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">NO. OF WEEKS</td>';
            template += '<td width="7.5%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">FACADES/<br/>CIRCUITS</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">GROSS</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">DISCOUNT</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">NET</td>';
            template += '<td width="15%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">HANDLING FEES</td>';
            template += '<td width="10%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid;border-bottom:0.5px;vertical-align:middle">TOTAL</td>';
            template += '</tr>';

            
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

               
                template += '<tr>';
                template += '<td align="left"  style="border-left:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">' + (line.city || '') + '</td>';
                template += '<td align="left"  style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.itemName|| '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.bookingPeriod || '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.faces ? Number(line.faces).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.rate ? fmtNum(line.rate) : '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.discountPct || 0) + '% </td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ fmtNum(net) + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ fmtNum(handlingFeeAmt) + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ fmtNum(lineTotal) + '</td>';
                template += '</tr>';
            }

            template += '<tr><td colspan="9" style="padding-top:20px;border-right:0.5px;border-bottom:0.5px;border-left:0.5px;"></td></tr>';

            template += '<tr>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">TOTAL | المجموع</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + totalFaces + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalRate) + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalNet) + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalHandlingFees) + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;border-right:0.5px;vertical-align:middle">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 3rd Table: Summary (Total Net / Discount / VAT / Grand Total) */

            const discountTotal = Math.abs(parseFloat(header.discounttotal) || 0);
            const vatAmount     = parseFloat(header.taxtotal) || 0;
            const netBeforeVat  = totalNetHand - discountTotal;
            const grandTotal    = netBeforeVat + vatAmount;

            template += '<table width="100%" style="padding-top:10px">';

            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">TOTAL NET:</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            // Conditional: Additional Discount + Net Before VAT
            if (discountTotal > 0) {
                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">Additional Discount :</td>';
                template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(discountTotal) + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">Net Before VAT :</td>';
                template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(netBeforeVat) + '</td>';
                template += '</tr>';
            }

            
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-right:0.5px;border-bottom:0.5px solid white;border-top:0.5px solid white;border-left:0.5px;vertical-align:middle">VAT (15%):</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(vatAmount) + '</td>';
            template += '</tr>';

            
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:black;font-size:8px;font-weight:bold;color:white;border-right:0.5px;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">Grand Total:</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(grandTotal) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 4th Table: Client Approval (bilingual) ─────────────────────── */

            template += '<table style="width: 100%; font-size: 8px;padding-top:100px">';

            template += '<tr style="border-top:1px solid #0E763D;padding-top:0.5px">';
            template += '<td align="left" style="font-weight:bold;border-top: 1px double green;font-size:8px">CLIENT APPROVAL</td>';
            template += '<td style="font-weight:bold;border-top: 1px double green;"></td>';
            template += '<td align="right" style="font-weight:bold;border-top: 1px double green;font-size:8px">موافقة العميل</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td width="5%" align="left" style="font-size:8px">By signing the below, I hereby acknowledge that I have completely read and fully understood the financial proposal as well as the terms and conditions set forth</td>';
            template += '<td width="40%"></td>';
            template += '<td width="50%" align="right" style="font-size:8px"><p align="right">بالتوقيع أدناه ، أقر بموجبه أنني قد اطلعت على العرض المالي بالكامل و كذلك الشروط و الأحكام و المنصوص عليها و فهمتها بالكامل</p></td>';
            template += '</tr>';

            template += '</table>';

            template += '<table width="100%" style="padding-top:15px">';

            template += '<tr style="padding-top:25px">';
            template += '<td width="35%" align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D">NAME | الإسم</td>';
            template += '<td width="10%"></td>';
            template += '<td width="35%" align="left" style="border-bottom:0.5px #0E763D ; font-size:8px;color:#0E763D">SIGNATURE | التوقيع</td>';
            template += '</tr>';

            template += '<tr style="padding-top:25px">';
            template += '<td align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D">POSITION | المنصب</td>';
            template += '<td></td>';
            template += '<td align="left"></td>';
            template += '</tr>';

            template += '<tr style="padding-top:25px">';
            template += '<td align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D ">DATE | التاريخ</td>';
            template += '<td></td>';
            template += '<td align="left" style="border-bottom:0.5px #0E763D ; font-size:8px;color:#0E763D">STAMP | الختم</td>';
            template += '</tr>';

            template += '</table>';

            return template;

        } catch (err) {
            log.debug('getTemplateBodyV4 Error', err);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // TEMPLATE BODY (Version 5) 
    // ─────────────────────────────────────────────────────────────────────────

    const getTemplateBodyV5 = (template, header, subsidiaryData, itemLines) => {
        try {
            const handlingFeeMap = buildHandlingFeeMap(itemLines);

            /** ── 1st Table: Info (Client / Brand / Date / Currency) ────────── */

            template += '<table width="100%">';

            template += '<tr>';
            template += '<td width="30%" align="left" style="font-size:8px;font-weight:bold;">CLIENT:</td>';
            template += '<td width="25%" align="left" style="font-size:8px;font-weight:bold;">' + (header.customerNameEn || '') + '</td>';
            template += '<td width="25%" align="right" style="font-size:8px;font-weight:bold;">' + (header.customerNameAr || '') + '</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;">:العميل</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">BRAND:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:الماركة</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">COVERAGE:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">KSA</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">KSA</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:التغطية</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">DATE OF SUBMISSION:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:تاريخ التسليم</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">CURRENCY:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.currency || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.currencyAr || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:العملة</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">NOTE:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">The following proposal is valid for a period of two (2) weeks from date of submission stated above.Beyond this period and/or for any modification(s) required,kindly contact SSM sales team for reconfirmation before proceeding</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;"><p align="right">عرض السعر أدناه صالح لمدة أسبوعين (2) من تاريخ التقديم المذكور أعلاه.  بعد هذه الفترة / أو لأي تعديل(تعديلات)، يرجى الاتصال بفريق مبيعات سعودي ساينز ميديا لإعادة التأكيد قبل المتابعة</p></td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:ملحوظة</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 2nd Table: Item Lines ──────────────────────────────────────── */

            template += '<table width="100%" style="padding-top:20px">';

            template += '<tr>';
            template += '<td width="15%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">CITY</td>';
            template += '<td width="25%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">MEDIA</td>';
            template += '<td width="20%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">NO. OF WEEKS</td>';
            template += '<td width="20%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">FACADES/CIRCUITS</td>';
            template += '<td width="20%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid;border-bottom:0.5px;vertical-align:middle">TOTAL</td>';
            template += '</tr>';

            
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

               
                template += '<tr>';
                template += '<td align="left"  style="border-left:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">' + (line.city || '') + '</td>';
                template += '<td align="left"  style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.itemName|| '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.bookingPeriod || '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.faces ? Number(line.faces).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ fmtNum(lineTotal) + '</td>';
                template += '</tr>';
            }

            template += '<tr><td colspan="9" style="padding-top:20px;border-right:0.5px;border-bottom:0.5px;border-left:0.5px;"></td></tr>';

            template += '<tr>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">TOTAL | المجموع</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + totalFaces + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;border-right:0.5px;vertical-align:middle">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 3rd Table: Summary (Total Net / Discount / VAT / Grand Total) */

            const discountTotal = Math.abs(parseFloat(header.discounttotal) || 0);
            const vatAmount     = parseFloat(header.taxtotal) || 0;
            const netBeforeVat  = totalNetHand - discountTotal;
            const grandTotal    = netBeforeVat + vatAmount;

            template += '<table width="100%" style="padding-top:10px">';

            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">TOTAL NET:</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            // Conditional: Additional Discount + Net Before VAT
            if (discountTotal > 0) {
                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">Additional Discount :</td>';
                template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(discountTotal) + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">Net Before VAT :</td>';
                template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(netBeforeVat) + '</td>';
                template += '</tr>';
            }

            
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-right:0.5px;border-bottom:0.5px solid white;border-top:0.5px solid white;border-left:0.5px;vertical-align:middle">VAT (15%):</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(vatAmount) + '</td>';
            template += '</tr>';

            
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:black;font-size:8px;font-weight:bold;color:white;border-right:0.5px;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">Grand Total:</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(grandTotal) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 4th Table: Client Approval (bilingual) ─────────────────────── */

            template += '<table style="width: 100%; font-size: 8px;padding-top:100px">';

            template += '<tr style="border-top:1px solid #0E763D;padding-top:0.5px">';
            template += '<td align="left" style="font-weight:bold;border-top: 1px double green;font-size:8px">CLIENT APPROVAL</td>';
            template += '<td style="font-weight:bold;border-top: 1px double green;"></td>';
            template += '<td align="right" style="font-weight:bold;border-top: 1px double green;font-size:8px">موافقة العميل</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td width="5%" align="left" style="font-size:8px">By signing the below, I hereby acknowledge that I have completely read and fully understood the financial proposal as well as the terms and conditions set forth</td>';
            template += '<td width="40%"></td>';
            template += '<td width="50%" align="right" style="font-size:8px"><p align="right">بالتوقيع أدناه ، أقر بموجبه أنني قد اطلعت على العرض المالي بالكامل و كذلك الشروط و الأحكام و المنصوص عليها و فهمتها بالكامل</p></td>';
            template += '</tr>';

            template += '</table>';

            template += '<table width="100%" style="padding-top:15px">';

            template += '<tr style="padding-top:25px">';
            template += '<td width="35%" align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D">NAME | الإسم</td>';
            template += '<td width="10%"></td>';
            template += '<td width="35%" align="left" style="border-bottom:0.5px #0E763D ; font-size:8px;color:#0E763D">SIGNATURE | التوقيع</td>';
            template += '</tr>';

            template += '<tr style="padding-top:25px">';
            template += '<td align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D">POSITION | المنصب</td>';
            template += '<td></td>';
            template += '<td align="left"></td>';
            template += '</tr>';

            template += '<tr style="padding-top:25px">';
            template += '<td align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D ">DATE | التاريخ</td>';
            template += '<td></td>';
            template += '<td align="left" style="border-bottom:0.5px #0E763D ; font-size:8px;color:#0E763D">STAMP | الختم</td>';
            template += '</tr>';

            template += '</table>';

            return template;

        } catch (err) {
            log.debug('getTemplateBodyV5 Error', err);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // TEMPLATE BODY (Version 6) 
    // ─────────────────────────────────────────────────────────────────────────

    const getTemplateBodyV6 = (template, header, subsidiaryData, itemLines) => {
        try {
            const handlingFeeMap = buildHandlingFeeMap(itemLines);

            /** ── 1st Table: Info (Client / Brand / Date / Currency) ────────── */

            template += '<table width="100%">';

            template += '<tr>';
            template += '<td width="30%" align="left" style="font-size:8px;font-weight:bold;">CLIENT:</td>';
            template += '<td width="25%" align="left" style="font-size:8px;font-weight:bold;">' + (header.customerNameEn || '') + '</td>';
            template += '<td width="25%" align="right" style="font-size:8px;font-weight:bold;">' + (header.customerNameAr || '') + '</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;">:العميل</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">BRAND:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.brand || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:الماركة</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">COVERAGE:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">KSA</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">KSA</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:التغطية</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">DATE OF SUBMISSION:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + formatDate(header.trandate) + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:تاريخ التسليم</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">CURRENCY:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">' + (header.currency || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">' + (header.currencyAr || '') + '</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:العملة</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">NOTE:</td>';
            template += '<td align="left" style="font-size:8px;font-weight:bold;">The following proposal is valid for a period of two (2) weeks from date of submission stated above.Beyond this period and/or for any modification(s) required,kindly contact SSM sales team for reconfirmation before proceeding</td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;"><p align="right">عرض السعر أدناه صالح لمدة أسبوعين (2) من تاريخ التقديم المذكور أعلاه.  بعد هذه الفترة / أو لأي تعديل(تعديلات)، يرجى الاتصال بفريق مبيعات سعودي ساينز ميديا لإعادة التأكيد قبل المتابعة</p></td>';
            template += '<td align="right" style="font-size:8px;font-weight:bold;">:ملحوظة</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 2nd Table: Item Lines ──────────────────────────────────────── */

            template += '<table width="100%" style="padding-top:20px">';

            template += '<tr>';
            template += '<td width="15%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">CITY</td>';
            template += '<td width="25%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">MEDIA</td>';
            template += '<td width="20%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">NO. OF WEEKS</td>';
            template += '<td width="20%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid white;border-bottom:0.5px;vertical-align:middle">FACADES/CIRCUITS</td>';
            template += '<td width="20%" align="center" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px solid;border-bottom:0.5px;vertical-align:middle">TOTAL</td>';
            template += '</tr>';

            
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

               
                template += '<tr>';
                template += '<td align="left"  style="border-left:0.5px solid black;border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">' + (line.city || '') + '</td>';
                template += '<td align="left"  style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.itemName|| '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.bookingPeriod || '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ (line.faces ? Number(line.faces).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '') + '</td>';
                template += '<td align="center" style="border-bottom:0.5px solid black;border-right:0.5px solid black;font-size:8px">'+ fmtNum(lineTotal) + '</td>';
                template += '</tr>';
            }

            template += '<tr><td colspan="9" style="padding-top:20px;border-right:0.5px;border-bottom:0.5px;border-left:0.5px;"></td></tr>';

            template += '<tr>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">TOTAL | المجموع</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle"></td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;vertical-align:middle">' + totalFaces + '</td>';
            template += '<td align="center" style="background-color:#E0E0E0;font-size:8px;font-weight:bold;border-bottom:0.5px;border-right:0.5px;vertical-align:middle">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 3rd Table: Summary (Total Net / Discount / VAT / Grand Total) */

            const discountTotal = Math.abs(parseFloat(header.discounttotal) || 0);
            const vatAmount     = parseFloat(header.taxtotal) || 0;
            const netBeforeVat  = totalNetHand - discountTotal;
            const grandTotal    = netBeforeVat + vatAmount;

            template += '<table width="100%" style="padding-top:10px">';

            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">TOTAL NET:</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(totalNetHand) + '</td>';
            template += '</tr>';

            // Conditional: Additional Discount + Net Before VAT
            if (discountTotal > 0) {
                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">Additional Discount :</td>';
                template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(discountTotal) + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td width="60%"></td>';
                template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-top:0.5px;border-right:0.5px;border-left:0.5px;vertical-align:middle">Net Before VAT :</td>';
                template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-top:0.5px;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(netBeforeVat) + '</td>';
                template += '</tr>';
            }

            
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:#0E763D;font-size:8px;font-weight:bold;color:white;border-right:0.5px;border-bottom:0.5px solid white;border-top:0.5px solid white;border-left:0.5px;vertical-align:middle">VAT (15%):</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(vatAmount) + '</td>';
            template += '</tr>';

            
            template += '<tr>';
            template += '<td width="60%"></td>';
            template += '<td width="20%" align="left" style="background-color:black;font-size:8px;font-weight:bold;color:white;border-right:0.5px;border-bottom:0.5px;border-left:0.5px;vertical-align:middle">Grand Total:</td>';
            template += '<td width="20%" align="right" style="font-size:8px;font-weight:bold;border-right:0.5px;border-bottom:0.5px;vertical-align:middle">' + fmtNum(grandTotal) + '</td>';
            template += '</tr>';

            template += '</table>';

            // ─────────────────────────────────────────────────────────────────

            /** ── 4th Table: Client Approval (bilingual) ─────────────────────── */

            template += '<table style="width: 100%; font-size: 8px;padding-top:100px">';

            template += '<tr style="border-top:1px solid #0E763D;padding-top:0.5px">';
            template += '<td align="left" style="font-weight:bold;border-top: 1px double green;font-size:8px">CLIENT APPROVAL</td>';
            template += '<td style="font-weight:bold;border-top: 1px double green;"></td>';
            template += '<td align="right" style="font-weight:bold;border-top: 1px double green;font-size:8px">موافقة العميل</td>';
            template += '</tr>';

            template += '<tr>';
            template += '<td width="5%" align="left" style="font-size:8px">By signing the below, I hereby acknowledge that I have completely read and fully understood the financial proposal as well as the terms and conditions set forth</td>';
            template += '<td width="40%"></td>';
            template += '<td width="50%" align="right" style="font-size:8px"><p align="right">بالتوقيع أدناه ، أقر بموجبه أنني قد اطلعت على العرض المالي بالكامل و كذلك الشروط و الأحكام و المنصوص عليها و فهمتها بالكامل</p></td>';
            template += '</tr>';

            template += '</table>';

            template += '<table width="100%" style="padding-top:15px">';

            template += '<tr style="padding-top:25px">';
            template += '<td width="35%" align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D">NAME | الإسم</td>';
            template += '<td width="10%"></td>';
            template += '<td width="35%" align="left" style="border-bottom:0.5px #0E763D ; font-size:8px;color:#0E763D">SIGNATURE | التوقيع</td>';
            template += '</tr>';

            template += '<tr style="padding-top:25px">';
            template += '<td align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D">POSITION | المنصب</td>';
            template += '<td></td>';
            template += '<td align="left"></td>';
            template += '</tr>';

            template += '<tr style="padding-top:25px">';
            template += '<td align="left" style="border-bottom:0.5px #0E763D; font-size:8px;color:#0E763D ">DATE | التاريخ</td>';
            template += '<td></td>';
            template += '<td align="left" style="border-bottom:0.5px #0E763D ; font-size:8px;color:#0E763D">STAMP | الختم</td>';
            template += '</tr>';

            template += '</table>';

            return template;

        } catch (err) {
            log.debug('getTemplateBodyV6 Error', err);
        }
    };
    // ─────────────────────────────────────────────────────────────────────────
    // FINALIZE & RENDER
    // ─────────────────────────────────────────────────────────────────────────

    const finalizeTemplate = (template, context, data) => {
        try {

            if (typeof template !== 'string' || !template.includes('<body')) {
                log.error('finalizeTemplate', 'Template is missing or invalid — aborting render');
                context.response.write('Unable to generate proposal. Please contact your administrator.');
                return;
            }

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