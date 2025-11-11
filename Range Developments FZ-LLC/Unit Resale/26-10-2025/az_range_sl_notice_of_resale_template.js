/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/render'], (search, render) => {

    const onRequest = (context) => {
        try {
            const recordId = context.request.parameters.recordId;

            if (!recordId) {
                context.response.write('Missing recordId parameter.');
                return;
            }

            const data = getResaleData(recordId);
            
            let template = getTemplateHeader();
            template = getTemplateBody(template, data);
            finalizeTemplate(template, context, data);

        } catch (errorOnRequest) {
            log.debug('errorOnRequest', errorOnRequest);
        }
    };

    const getTemplateHeader = () => {
        try {

            let template = '';
    
            template += '<?xml version="1.0"?>';
            template += '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            template += '<pdf>';
            template += '<head>';
            template += '<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" ';
            template += 'src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" ';
            template += 'src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2"/>';
            template += '<link name="NotoSansArabic" type="font" subtype="opentype" src="${nsfont.NotoSansArabic_Regular}" ';
            template += 'src-bold="${nsfont.NotoSansArabic_Bold}" bytes="2" subset="false"/>';
            template += '</head>';
            template += "<body header='nlheader' header-height='20px' padding='0.5in 0.5in 0.5in 0.5in'>";
            return template;
            
        } catch (errorGetTemplateHeader) {
            log.debug('errorGetTemplateHeader',errorGetTemplateHeader)
        }
    };


    const getTemplateBody = (template, data) => {
        try {

            // part 1 : headers
            {
            template += `
                        <table style="width:100%; margin-bottom:10px;">
                        <tr>
                            <td style="vertical-align:middle;" align="center">
                                <b>Notice of Resale</b>
                            </td>
                        </tr>
                        <tr>          
                            <td style=" vertical-align:middle;" align="center">
                                ${data.property}
                            </td>
                        </tr>
                        </table>`;
            
                
                template += `
                <table style="width:100%; margin-bottom:10px;">
                    <tr>
                        <td style="align:left; padding:5px;">To: ${data.subsidiaryLegalName || ''}</td>
                        <td style="align:right; padding:5px;">${data.date ? formatLongDate(data.date) : ''}</td>
                    </tr>
                </table>
                `;

            
                template += `
                <table style="width:100%;  border-collapse: collapse; margin-bottom:10px;">
                    <tr><td style="padding:5px;"><b>Subject: Notice of Resale – Transfer of Units Request Letter</b></td></tr>
                </table>
                <p>Dear Sirs,</p>
                `;
            }
            
            // part 2 : paragraph "With reference"
            {
            template += `
            <p>
                With reference to the above Subject, SPA and Transfer and Assignment Agreement, 
                I, <b>${data.ownersNames.join(', ')}</b> (the “Original Purchaser”), would like to request you please 
                to transfer the ownership of the below Unit in the name of my nominee pursuant to my rights 
                in the booking as follows:
            </p>
            `;
            }
            
            // part 3 : Resale Details table
            {
            template += `
            <table width="100%">
                <tr >
                <td  colspan = "4" style="align : center;" ><b>Resale Details</b>
                </td>
                </tr>
                <tr>
                    <td style="align : center; border-top:1px ;border-right:1px ;border-left:1px ;border-bottom:1px ; "><b>Project</b></td>
                    <td style="align : center; border-top:1px ;border-right:1px ;border-bottom:1px ; "><b>Unit</b></td>
                    <td style="align : center; border-top:1px ;border-right:1px ;border-bottom:1px ; "><b>Resale Price AED </b></td>
                    <td style="align : center; border-top:1px ;border-right:1px ;border-bottom:1px ; "><b>Paid Amount AED </b></td>
                </tr>
                <tr>
                    <td style="align : center; border-left:1px ;border-right:1px ;border-bottom:1px ; ">${data.property || ''}</td>
                    <td style="align : center; border-right:1px ;border-bottom:1px ; ">${data.unit || ''}</td>
                    <td style="align : center; border-right:1px ;border-bottom:1px ; ">${numberWithCommas(data.resalePrice) || ''}</td>
                    <td style="align : center; border-right:1px ;border-bottom:1px ; ">${numberWithCommas(data.paidAmount) || ''}</td>
                </tr>
            </table>
            `;
            }

            // part 4 : Nominee Details Tables 
            {
            data.purchasersData.forEach((purchaserData) => {

                    const isCompany = purchaserData.type ? false : true;
                    const passportOrReg = isCompany ? purchaserData.regNum : purchaserData.passport || '';
                    const passportOrRegTitle = isCompany ? 'Company Reg. No.' : 'Passport No.';
                    const company_font_size = isCompany ? '12' : '14';

                    template += `
                    <table width="100%" style="margin-top: 10px;">
                        <tr><td colspan = "5" style="align : center;"><b>Nominee Details</b> </td></tr>
                        <tr style="font-size:${company_font_size}px">
                            <td style="align : center; border-top:1px ;border-right:1px ;border-left:1px ;border-bottom:1px ; padding:5px;"><b>Name</b></td>
                            <td style="align : center; border-top:1px ;border-right:1px ;border-bottom:1px ; padding:5px;"><b>Nationality</b></td>
                            <td style="align : center; border-top:1px ;border-right:1px ;border-bottom:1px ; padding:5px;"><b>${passportOrRegTitle}</b></td>
                            <td style="align : center; border-top:1px ;border-right:1px ;border-bottom:1px ; padding:5px;"><b>Mobile No.</b></td>
                            <td style="align : center; border-top:1px ;border-right:1px ;border-bottom:1px ; padding:5px;"><b>Email</b></td>
                        </tr>
                        <tr style="font-size:${company_font_size}px">
                            <td style="align : center; border-left:1px ;border-right:1px ;border-bottom:1px ; padding:5px;">${purchaserData.name || ''}</td>
                            <td style="align : center; border-right:1px ;border-bottom:1px ; padding:5px;">${purchaserData.nationality || ''}</td>
                            <td style="align : center; border-right:1px ;border-bottom:1px ; padding:5px;">${passportOrReg}</td>
                            <td style="align : center; border-right:1px ;border-bottom:1px ; padding:5px;">${purchaserData.phone || ''}</td>
                            <td style="align : center; border-right:1px ;border-bottom:1px ; padding:5px;">${purchaserData.email || ''}</td>
                        </tr>
                    </table>
                    `;
                }
            );
            }
            
            // part 5 : paragraphs "Accordingly , Furthermore , Both the original purchaser , Yours Sincerely"
            {
            template += `
            <p>Accordingly, the Original Purchaser and Nominee hereby request your acknowledgment 
            of the transfer of the Unit to the Nominee and to execute the necessary agreements.</p>

            <p>Furthermore, the Original Purchaser shall not have any claim, right, or interest 
            over the Unit in any manner notwithstanding the possession of any documents related to the Unit.</p>

            <p>Both the Original Purchaser and the Nominee shall bear all legal and financial 
            consequences of this transfer of ownership of the Unit and undertake to keep ${data.subsidiaryLegalName || ''} 
            indemnified against any damages/losses of whatsoever nature.</p>

            <p>Yours Sincerely,</p>
            `;
            }

            // part 6 : Signatures 
            {
                if (data.ownersNames.length > 0) {
                    template += `<table width="100%" >`;

                    data.ownersNames.forEach((ownerName,index) => {
                      
                        if (index === 0) {
                            template += `<tr>
                                        <td style="width:100%; margin-top:0px; vertical-align:top;">Signed by <b>Original Purchaser</b>
                                        </td>`;
                            template += `<td style="width:100%; margin-top:0px; align:center;">Approved by <b>${data.subsidiaryLegalName || ''}</b></td>`;
                        }else{
                              template += `<tr>
                                        <td style="width:100%; margin-top:18px; vertical-align:top; padding:5px;">Signed by <b>Original Purchaser</b>
                                        </td>`;
                        }
                        template += `</tr>
                                    <tr>
                                        <td style=" padding:5px; margin-bottom: 23px"><b>${ownerName}</b></td>
                                    </tr>
                                    <tr>
                                        <td style=" padding:5px; margin-bottom: 23px">___________________________</td>`;
                        if (index === 0) {
                            template += `<td style=" align:center; padding:5px; margin-bottom: 23px">___________________________</td>`;
                        }
                        template += `</tr>`;
                    });

                    template += `</table>`;
                }

                if (data.purchasersData.length > 0) {
                    template += `<table width="100%">`;

                    data.purchasersData.forEach(purchaserData => {

                        template += `<tr>
                                        <td style="width:100%; margin-top:18px; vertical-align:top; padding:5px; ">Signed by <b> Nominee </b> </td>
                                    </tr>
                                    <tr>
                                        <td style=" padding:5px; margin-bottom: 23px"><b>${purchaserData.name}</b></td>
                                    </tr>
                                    <tr>
                                        <td style=" padding:5px; margin-bottom: 23px">___________________________</td>
                                    </tr>`;
                    });

                    template += `</table>`;
                }
            }
            return template;

        } catch (errorGetTemplateBody) {
            log.debug('errorGetTemplateBody', errorGetTemplateBody);
        }
    };



    const finalizeTemplate = (template, context, data) => {
        try {
            template += '</body></pdf>';
            const renderer = render.create();
            renderer.templateContent = template;
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'data',
                data: data
            });
            const pdfFile = renderer.renderAsPdf();
            context.response.writeFile(pdfFile, true);

        } catch (errorFinalizeTemplate) {
            log.debug('errorFinalizeTemplate', errorFinalizeTemplate);
        }
    };

    const getResaleData = (recordId) => {
        try {
            let ownersIds = [] ;
            let ownersNames = [] ;
            let validatePurchasersIds = [];
            let purchasersIds = [];
            let purchasersData = [];
            let subsidiaryLegalName = '';
            const results = search.lookupFields({
                type: 'customrecord_ino_re_unit_resale',
                id: recordId,
                columns: [
                    'custrecord_ino_re_ur_property',
                    'custrecord_ino_re_ur_date',
                    'custrecord_ino_re_ur_unit_master',
                    'custrecord_az_rng_ur_resale_price',
                    'custrecord_ino_re_ur_paid_amount',
                    'custrecord_ino_re_ur_current_owner', 
                    'custrecord_ino_re_ur_sec_owner',
                    'custrecord_ino_re_ur_third_owner',
                    'custrecord_ino_re_ur_fourth_owner',
                    'custrecord_ino_re_ur_fifth_owner',
                    'custrecord_ino_re_ur_new_purchaser', 
                    'custrecord_ino_re_ur_sec_purchaser',
                    'custrecord_ino_re_ur_third_purchaser',
                    'custrecord_ino_re_ur_fourth_purchaser',
                    'custrecord_ino_re_ur_fifth_purchaser',
                    'custrecord_ino_re_ur_subsidiary'
                ]
            });

            const subsidiary = results.custrecord_ino_re_ur_subsidiary?.[0]?.value;
            subsidiaryLegalName = getSubsidiaryData(subsidiary);
            log.debug('getResaleDAta',subsidiaryLegalName);
           
            ownersIds.push(results.custrecord_ino_re_ur_current_owner?.[0]?.value);
            ownersIds.push(results.custrecord_ino_re_ur_sec_owner?.[0]?.value);
            ownersIds.push(results.custrecord_ino_re_ur_third_owner?.[0]?.value);
            ownersIds.push(results.custrecord_ino_re_ur_fourth_owner?.[0]?.value);
            ownersIds.push(results.custrecord_ino_re_ur_fifth_owner?.[0]?.value);
        
            ownersNames = getOwnerData(ownersIds); 
            log.debug('getResaleDAta',ownersNames);

            validatePurchasersIds.push(results.custrecord_ino_re_ur_new_purchaser?.[0]?.value);
            validatePurchasersIds.push(results.custrecord_ino_re_ur_sec_purchaser?.[0]?.value);
            validatePurchasersIds.push(results.custrecord_ino_re_ur_third_purchaser?.[0]?.value);
            validatePurchasersIds.push(results.custrecord_ino_re_ur_fourth_purchaser?.[0]?.value);
            validatePurchasersIds.push(results.custrecord_ino_re_ur_fifth_purchaser?.[0]?.value);

            purchasersIds = validatePurchasersIds.filter(Boolean);
    
            purchasersData = purchasersIds.map(id => getPurchaserData(id));

            // log.debug('getResaleDAta',subsidiary);
            log.debug('getResaleDAta',JSON.stringify(purchasersData));

            return {
                property: results.custrecord_ino_re_ur_property?.[0]?.text || '',
                date: results.custrecord_ino_re_ur_date,
                unit: results.custrecord_ino_re_ur_unit_master?.[0]?.text || '',
                resalePrice: results.custrecord_az_rng_ur_resale_price || '',
                paidAmount: results.custrecord_ino_re_ur_paid_amount || '',
                ownersNames ,
                purchasersData ,
                subsidiaryLegalName: subsidiaryLegalName
            };

        } catch (errorGetResaleData) {
            log.debug('errorGetResaleData', errorGetResaleData);
        }
    };



    const getOwnerData = (ownerIds) => {
        try {
            let ownerNames = [];
            const filteredIds = ownerIds.filter(Boolean);
            if (filteredIds.length > 0) {
                const customerSearch = search.create({
                    type: 'customer',
                    filters: [['internalid', 'anyof', filteredIds]],
                    columns: ['custentity_az_rng_customer_name']
                });

                customerSearch.run().each(result => {
                    ownerNames.push(result.getValue('custentity_az_rng_customer_name') || ' ');
                    return true;
                });
            }

            return ownerNames; 
        } catch (errorGetOwnerData) {
            log.debug('errorGetOwnerData', errorGetOwnerData);

        }
    };



    const getPurchaserData = (purchaserId) => {
        try {
            let purchaserData = {};
            if (purchaserId) {
                purchaserData = search.lookupFields({
                    type: 'customer',
                    id: purchaserId,
                    columns: [
                        'custentity_az_rng_customer_name',
                        'custentity_ino_re_nationality',
                        'custentity_ino_re_passport_id',
                        'custentity_az_rng_company_reg_num',
                        'phone',
                        'email',
                        'isperson'
                    ]
                });
            }
            
            return {
                name: purchaserData.custentity_az_rng_customer_name || '',
                nationality: purchaserData.custentity_ino_re_nationality?.[0]?.text || '',
                passport: purchaserData.custentity_ino_re_passport_id || '',
                regNum: purchaserData.custentity_az_rng_company_reg_num || '',
                phone: purchaserData.phone || '',
                email: purchaserData.email || '',
                type: purchaserData.isperson || ''
            };

        } catch (errorGetPurchaserData) {
            log.debug('errorGetPurchaserData', errorGetPurchaserData);
        }
    };


    const getSubsidiaryData = (subsidiaryId) => {
        try {
            let subsidiaryLeagalName = '' ;
            if (subsidiaryId) {
                const res = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiaryId,
                    columns: ['legalname']
                });
                subsidiaryLeagalName = res.legalname ;
            }
            return subsidiaryLeagalName;
        } catch (errorGetSubsidiaryData) {
            log.debug('errorGetSubsidiaryData', errorGetSubsidiaryData);
        }
    };


   const formatLongDate = (dateStr) => {
        try {
            if (!dateStr) return '';

            const str = String(dateStr);

            const [year, month, day] = str.split('-').map(Number);

            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];

            return `${day} ${months[month - 1]} ${year}`;

        } catch (formatLongDateerror) {
            log.debug('formatLongDateerror', formatLongDateerror);
        }
    };

    const numberWithCommas=(x) =>{
        if (x != null && x != "") {
            if (x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            else {
                return 0;
            }
        } else {
            return 0;
        }
    }


    return { onRequest };
});
