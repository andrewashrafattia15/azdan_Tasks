/**
*@NApiVersion 2.1
*@NScriptType Suitelet
*/
define(['N/search', 'N/render', 'N/record', 'N/file'], function (s, render, record, file) {

    const onRequest = (context) => {
        try {

            if (context.request.method == 'GET') {
                try {
                    const myRecId = context.request.parameters.myRecId

                    if (myRecId) {



                        let reservationData = getReservationData(myRecId)
                        let unit = reservationData['unitMaster'];
                        const unitRecord = record.load({
                            type: 'customrecord_ino_re_unitmaster',
                            id: unit
                        });
                        const accName = unitRecord.getValue('custrecord_ino_re_um_sub_account_name');
                        const IBAN = unitRecord.getValue('custrecord_ino_re_um_iban');
                        const accNumber = unitRecord.getValue('custrecord_ino_re_um_account_numbrt');
                        let subsidiaryId = reservationData.subsidiary;
                        let customerData = getCustomerData(reservationData.customer);
                        let secondCustomerData = getCustomerData(reservationData.secondCustomer);
                        let thirdCustomerData = getCustomerData(reservationData.thirdCustomer);
                        let fourthCustomerData = getCustomerData(reservationData.fourthCustomer);
                        let fifthCustomerData = getCustomerData(reservationData.fifthCustomer);
                        let propertyData = getPropertyData(reservationData.property);
                        let vendorData = getVendorDate(subsidiaryId);
                        let subLogo = getSubsidiaryLogo(subsidiaryId);
                        let unitData = getUnitData(reservationData.unitMaster);
                        let paymentPlanData = getPaymentPlanData(myRecId);
                        let partnerData = getPartnerData(reservationData.broker);
                        let template = getHeader();
                        template = getBody(template, reservationData, customerData, vendorData, paymentPlanData, subLogo, propertyData, unitData, partnerData, secondCustomerData, thirdCustomerData, fourthCustomerData,fifthCustomerData, subsidiaryId, accNumber, IBAN, accName)

                        finalyPrint(template, context)


                    }


                } catch (errGet) {
                    log.debug('errGet', errGet)
                }
            }

        } catch (errOnRequest) {
            log.debug('errOnRequest', errOnRequest)
        }
    }


    // get template
    const getHeader = () => {
        try {
            var template = "";

            template += '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            template += '<pdf>';
            template += '<head>';
            template += '<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-';
            template += 'bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />'
            template += '<#if .locale == "zh_CN">'
            template += '<link name="NotoSansCJKsc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKsc_Regular}" src-bold="${nsfont.NotoSansCJKsc_Bold}" bytes="2" />';
            template += '<#elseif .locale == "zh_TW">'
            template += '<link name="NotoSansCJKtc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKtc_Regular}" src-bold="${nsfont.NotoSansCJKtc_Bold}" bytes="2" />';
            template += '<link name="NotoSansCJKjp" type="font" subtype="opentype" src="${nsfont.NotoSansCJKjp_Regular}" src-bold="${nsfont.NotoSansCJKjp_Bold}" bytes="2" />';
            template += '<#elseif .locale == "ja_JP">';
            template += '<#elseif .locale == "ko_KR">';
            template += '<link name="NotoSansCJKkr" type="font" subtype="opentype" src="${nsfont.NotoSansCJKkr_Regular}" src-bold="${nsfont.NotoSansCJKkr_Bold}" bytes="2" />';
            template += '<#elseif .locale == "th_TH">';
            template += '<link name="NotoSansThai" type="font" subtype="opentype" src="${nsfont.NotoSansThai_Regular}" src-bold="${nsfont.NotoSansThai_Bold}" bytes="2" />';
            template += '</#if>';

            template += '<macrolist>';

            // template += '<macro id="nlheader">';
            // template += '<table style="width: 100%; font-size: 10pt;"><tr>';
            // template += '<td style="padding: 0px; height: 50%; width: 30%;"><#if companyInformation.logoUrl?length != 0><img src="${companyInformation.pagelogo}" style="float: left; margin: 7px; width: 100px; height: 90px;"/> </#if></td>';
            // template += '</tr>';
            //  template += '<tr>';
            // template += '<td align="center" style="height: 62px; width: 454px;"><span style="font-size: 10pt; border-bottom: 1px solid black;"><b>RESERVATION CONTRACT</b></span></td>';
            // template += '</tr></table>';
            // template += '</macro>';

            template += '<macro id="nlfooter">';
            template += '<table class="footer" style="width: 100%;">';

            // var today = new Date();
            // var date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();

            template += '<tr style="font-size: 11px; font-weight: bold;">';
            template += '<td align="left"></td>';
            template += '<td align="right"><pagenumber/> of <totalpages/></td>';
            template += '</tr>';
            template += '</table>';
            template += '</macro>';

            template += '</macrolist>';
            template += '<style type="text/css">* {';
            template += '<#if .locale == "zh_CN">';
            template += 'font-family: NotoSans, NotoSansCJKsc, sans-serif;';
            template += '<#elseif .locale == "zh_TW">';
            template += 'font-family: NotoSans, NotoSansCJKtc, sans-serif;'
            template += '<#elseif .locale == "ja_JP">';
            template += 'font-family: NotoSans, NotoSansCJKjp, sans-serif;';
            template += '<#elseif .locale == "ko_KR">';
            template += 'font-family: NotoSans, NotoSansCJKkr, sans-serif;';
            template += '<#elseif .locale == "th_TH">';
            template += 'font-family: NotoSans, NotoSansThai, sans-serif;';
            template += '<#else>';
            template += 'font-family: NotoSans, sans-serif;';
            template += '</#if>';
            template += '}';
            template += 'td p {text-align: left;}';
            template += 'table {';
            template += 'font-size: 12pt;';
            template += 'table-layout: fixed;';
            template += '}';
            template += '.t1 {';
            template += 'border: 1px solid black;';
            template += 'border-collapse: collapse;';
            template += '}';
            template += '.border {';
            template += ' position: fixed;';
            template += ' top: 0;';
            template += 'left: 0;';
            template += ' border: 5px double;';
            template += ' width: 100%;';
            template += ' height: 100%;';
            template += ' margin: 0;';
            template += ' padding: 0;';
            template += ' page-break-after: always;';
            template += ' page-break-inside: avoid;';
            template += ' box-sizing: border-box;';
            template += ' }';
            template += 'th { ';
            template += 'font-weight: bold;';
            template += 'font-size: 9pt;';
            template += 'vertical-align: middle;';
            template += 'padding: 5px 6px 3px;';
            template += 'color: #333333;';
            template += '}';
            template += 'td {';
            // template+='padding: 4px 16px;';
            template += 'font-size: 10pt;';
            template += '}';
            template += 'p {';
            template += 'font-size:10pt;';
            template += '}';
            template += '.alileft {';
            template += 'align:left}'
            template += '.aliright {';
            template += 'align:right}'
            template += '.arial-font {font-family: Arial, sans-serif;}';
            template += '</style>';
            template += "</head>";
            template += "<body  footer='nlfooter' footer-height='11pt' padding='0.5in 0.5in 0.5in 0.5in' size='Letter' style='margin:10px;padding:10px;'>";

            return template;
        } catch (errGetHeader) {
            log.debug('errGetHeader', errGetHeader)
        }

    }


    // get body 
    const getBody = (template, reservationData, customerData, vendorData, paymentPlanData, subLogo, propertyData, unitData, partnerData, secondCustomerData, thirdCustomerData, fourthCustomerData,fifthCustomerData, subsidiaryId, accNumber, IBAN, accName) => {
        try {

            const remarkNote  = 'Or upon completion, whichever occurs first.';

            // var today = new Date();
            // var date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
            // // table 1 (logo and title)
            {
                template += '<table style="width: 100%; font-size: 10pt; height: 150px;"><tr>';
                // template +='<td><@filecabinet nstype="image" src="https://2794193.app.netsuite.com/core/media/media.nl?id=646&c=2794193&h=W55ilC4NHyYo2O0qDnyHqkZ55ZhgJMzXDuI-NjwSYnIPT4xA&fcts=20231112044456&whence="/></td>'
                template += '<td style="padding: 0px; height: 50%; width: 37%;"><@filecabinet nstype="image" src="' + subLogo.logoUrl + '" style="float: left; margin: 7px; width: 150px; height: 90px;"/> </td>';
                template += '<td></td>'
                template += '<td><@filecabinet nstype="image" src="https://2794193.app.netsuite.com/core/media/media.nl?id=645&c=2794193&h=u47_ycweNjpJA5pMJoViXRzT3Djo-WHivf6mQEzRp06V27U6&fcts=20231112044448&whence="/></td>';
                // template += '<td align="left" style="margin-top:30px;"><span style="font-size: 10pt; border-bottom: 1px solid black;"><b>RESERVATION CONTRACT</b></span></td>';
                template += '</tr>';
                template += '<tr>';
                template += '<td  align="center" style="margin-top:30px;" colspan="3"><span style="font-size: 10pt; border-bottom: 1px solid black;"><b>Real Estate Unit Reservation Deed</b></span></td>';
                template += '</tr>'
                template += '</table>';
            }

            // // table 2 (project and unit name)
            {
                template += '<table style="width:100%; margin-bottom:20px;">';

                template += '<tr>';
                template += '<td style="width:53px;"><b>Project:</b></td>';
                template += '<td>' + reservationData.propertyText + '</td>';
                template += '</tr>';

                let unitName = '';
                if (reservationData.subsidiary == 3) {
                    unitName = unitData.name + ' - ' + unitData.wing
                }
                else {
                    unitName = unitData.name
                }

                template += '<tr>';
                template += '<td><b>Unit:</b></td>';
                template += '<td>' + unitName + '</td>';
                template += '</tr>';

                template += '</table>';
            }

            // // table 3 (Developer and Project Details title)
            {
                template += '<table style="width:100%;">';

                template += '<tr>';
                template += '<td style=" margin-bottom:15px;"><span  style="border-bottom:1px solid black;"><b>DEVELOPER AND PROJECT DETAILS:</b></span></td>';
                template += '</tr>';

                template += '</table>';
            }

            // // table 4 (Developer and Project Details )
            {
                template += '<table style="width:100%; margin-bottom:20px;">';

                if (subsidiaryId == 8) {
                    template += '<tr>';
                    template += '<td style="width:170px;"><b>Name of the Developer:</b></td>';
                    template += '<td>' + vendorData.legalname + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>Correspondence Address:</b></td>';
                    template += '<td>' + vendorData.address + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>Name of the Project:</b></td>';
                    template += '<td>' + reservationData.propertyText + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>Project Location:</b></td>';
                    template += '<td>' + propertyData.masterCom + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>RERA Developer No:</b></td>';
                    template += '<td>' + vendorData.regNum + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>RERA Project No:</b></td>';
                    template += '<td>' + propertyData.developerNumber + '</td>';
                    template += '</tr>';

                } else {

                    template += '<tr>';
                    template += '<td style="width:170px;"><b>Name of the Developer:</b></td>';
                    template += '<td>' + vendorData.legalname + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>Correspondence Address:</b></td>';
                    template += '<td>' + vendorData.address + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>Name of the Project:</b></td>';
                    template += '<td>' + reservationData.propertyText + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>Project Location:</b></td>';
                    template += '<td>' + propertyData.masterCom + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>RERA Developer No:</b></td>';
                    template += '<td>' + propertyData.developerNumber + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>RERA Registration No:</b></td>';
                    template += '<td>' + vendorData.regNum + '</td>';
                    template += '</tr>';


                }
                template += '</table>';

            }

            // // table 5 (PROJECT ESCROW ACCOUNT DETAILS title)
            {
                template += '<table style="width:100%;">';

                template += '<tr>';
                template += '<td  style=" margin-bottom:15px;"><span style="border-bottom:1px solid black;"><b>PROJECT ESCROW ACCOUNT DETAILS:</b></span></td>';
                template += '</tr>';

                template += '</table>';
            }

            // // table 6 (PROJECT ESCROW ACCOUNT DETAILS)
            {
                if (subsidiaryId == 8 || subsidiaryId == 9) {
                    template += '<table style="width:100%; margin-bottom:20px;">';

                    template += '<tr>';
                    template += '<td width="35%"><b>Account Name</b></td>';
                    template += '<td width="65%">: ' + accName + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>IBAN</b></td>';
                    template += '<td>: ' + IBAN + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>Account Number</b></td>';
                    template += '<td>: ' + accNumber + '</td>';
                    template += '</tr>';

                } else {
                    template += '<table style="width:100%; margin-bottom:20px;">';

                    template += '<tr>';
                    template += '<td width="35%"><b>Account Name</b></td>';
                    template += '<td width="65%">: ' + 'ESCROW ' + subLogo.subsidiarylegalName.toUpperCase() + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>IBAN</b></td>';
                    template += '<td>: ' + propertyData.ibanNo + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td><b>Account Number</b></td>';
                    template += '<td>: ' + propertyData.accountNum + '</td>';
                    template += '</tr>';


                }

                template += '<tr>';
                template += '<td><b>Bank Name, Branch and Address</b></td>';
                template += '<td>: ' + propertyData.branch + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td><b>SWIFT code</b></td>';
                template += '<td>: ' + propertyData.swiftCode + '</td>';
                template += '</tr>';

                template += '</table>';
            }

            // // table 7  (Customer title)
            {
                template += '<table style="width:100%;">';

                template += '<tr>';
                template += '<td  style=" margin-bottom:15px;"><span style="border-bottom:1px solid black;"><b>PURCHASER’S DETAILS:</b></span></td>';
                template += '</tr>';

                template += '</table>';
            }

            // // table 8 (Customer Information)
            {
                if (customerData.isperson == true) {

                    template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                    template += '<tr>';
                    template += '<td  style="width:25%; border: 1px solid black;">Title:</td>';
                    template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.salutation + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Surname:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.lastName + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">First Name:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.firstName + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Passport Number:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.passportId + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.email + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.address + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.city + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.country + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.phone + '</td>';
                    template += '</tr>';
                    template += '</table>';
                    if (reservationData.secondCustomer && secondCustomerData.isperson == true) {

                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.salutation + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Surname:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.lastName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">First Name:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.firstName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    } else if (reservationData.secondCustomer && secondCustomerData.isperson == false) {
                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Company Name:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.companyName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Registration Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.vatregnumber + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country of Registration:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.title + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Shareholders:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.shareholder + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Authorized Signatory:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.authorizedSignatory + '</td>';
                        template += '</tr>';

                        // template += '<tr>';
                        // template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Nationality:</td>';
                        // template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">'+secondCustomerData.nationlaity[0].text+'</td>';
                        // template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    }
                    if (reservationData.thirdCustomer && thirdCustomerData.isperson == true) {

                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.salutation + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Surname:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.lastName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">First Name:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.firstName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    } else if (reservationData.thirdCustomer && thirdCustomerData.isperson == false) {
                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Company Name:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.companyName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Registration Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.vatregnumber + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country of Registration:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.title + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Shareholders:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.shareholder + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Authorized Signatory:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.authorizedSignatory + '</td>';
                        template += '</tr>';

                        // template += '<tr>';
                        // template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Nationality:</td>';
                        // template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">'+thirdCustomerData.nationlaity[0].text+'</td>';
                        // template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    }
                    if (reservationData.fourthCustomer && fourthCustomerData.isperson == true) {

                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.salutation + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Surname:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.lastName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">First Name:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.firstName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    } else if (reservationData.fourthCustomer && fourthCustomerData.isperson == false) {
                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Company Name:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.companyName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Registration Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.vatregnumber + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country of Registration:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.title + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Shareholders:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.shareholder + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Authorized Signatory:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.authorizedSignatory + '</td>';
                        template += '</tr>';

                        // template += '<tr>';
                        // template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Nationality:</td>';
                        // template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">'+fourthCustomerData.nationlaity[0].text+'</td>';
                        // template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    }

                    if (reservationData.fifthCustomer && fifthCustomerData.isperson == true) {

                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.salutation + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Surname:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.lastName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">First Name:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.firstName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    } else if (reservationData.fifthCustomer && fifthCustomerData.isperson == false) {
                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Company Name:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.companyName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Registration Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.vatregnumber + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country of Registration:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.title + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Shareholders:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.shareholder + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Authorized Signatory:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.authorizedSignatory + '</td>';
                        template += '</tr>';

                        // template += '<tr>';
                        // template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Nationality:</td>';
                        // template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">'+fifthCustomerData.nationlaity[0].text+'</td>';
                        // template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fifthCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    }

                }
                else {
                    template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                    template += '<tr>';
                    template += '<td  style="width:25%; border: 1px solid black;">Company Name:</td>';
                    template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.companyName + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Registration Number:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.vatregnumber + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country of Registration:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.country + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Title:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.title + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Shareholders:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.shareholder + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Authorized Signatory:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.authorizedSignatory + '</td>';
                    template += '</tr>';

                    // template += '<tr>';
                    // template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Nationality:</td>';
                    // template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">'+customerData.nationlaity[0].text+'</td>';
                    // template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Passport Number:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.passportId + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.email + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.address + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.city + '</td>';
                    template += '</tr>';

                    template += '<tr>';
                    template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                    template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + customerData.phone + '</td>';
                    template += '</tr>';
                    template += '</table>';
                    if (reservationData.secondCustomer && secondCustomerData.isperson == true) {

                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.salutation + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Surname:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.lastName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">First Name:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.firstName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    } else if (reservationData.secondCustomer && secondCustomerData.isperson == false) {
                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Company Name:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.companyName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Registration Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.vatregnumber + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country of Registration:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.title + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Shareholders:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.shareholder + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Authorized Signatory:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.authorizedSignatory + '</td>';
                        template += '</tr>';

                        // template += '<tr>';
                        // template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Nationality:</td>';
                        // template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">'+secondCustomerData.nationlaity[0].text+'</td>';
                        // template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + secondCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    }
                    if (reservationData.thirdCustomer && thirdCustomerData.isperson == true) {

                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.salutation + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Surname:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.lastName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">First Name:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.firstName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    } else if (reservationData.thirdCustomer && thirdCustomerData.isperson == false) {
                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Company Name:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.companyName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Registration Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.vatregnumber + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country of Registration:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.title + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Shareholders:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.shareholder + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Authorized Signatory:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.authorizedSignatory + '</td>';
                        template += '</tr>';

                        // template += '<tr>';
                        // template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Nationality:</td>';
                        // template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">'+thirdCustomerData.nationlaity[0].text+'</td>';
                        // template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + thirdCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    } if (reservationData.fourthCustomer && fourthCustomerData.isperson == true) {

                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.salutation + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Surname:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.lastName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">First Name:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.firstName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    } else if (reservationData.fourthCustomer && fourthCustomerData.isperson == false) {
                        template += '<table style="width:100%; border: 1px solid black; border-spacing: 100px;margin-bottom:20px;">';

                        template += '<tr>';
                        template += '<td  style="width:25%; border: 1px solid black;">Company Name:</td>';
                        template += '<td style="width:75%; border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.companyName + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Registration Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.vatregnumber + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Country of Registration:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.country + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Title:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.title + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Shareholders:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.shareholder + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Authorized Signatory:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.authorizedSignatory + '</td>';
                        template += '</tr>';

                        // template += '<tr>';
                        // template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Nationality:</td>';
                        // template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">'+fourthCustomerData.nationlaity[0].text+'</td>';
                        // template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Signatory Passport Number:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.passportId + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Email:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Address/PO Box:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.address + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">City:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.city + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Telephone:</td>';
                        template += '<td style="width:75%; border-bottom: 1px solid black;border-right: 1px solid black;">' + fourthCustomerData.phone + '</td>';
                        template += '</tr>';
                        template += '</table>';
                    }

                }

            }

            // // table 9  (Unit title)
            {
                template += '<table style="width:100%;page-break-before: always">';

                template += '<tr>';
                template += '<td  style=" margin-bottom:15px;"><span style="border-bottom:1px solid black;"><b>UNIT DETAILS:</b></span></td>';
                template += '</tr>';

                template += '</table>';
            }
            

            // // table 10 (Unit Information) when town house is selected
            if (unitData.townhouse == true) {

                {
                template += '<table style="width:100%; margin-bottom:20px;">';

                template += '<tr>';
                template += '<td><b>Unit Number</b></td>';
                template += '<td>: ' + unitData.unitNum + '</td>';
                template += '</tr>';
                template += '<tr>';
                template += '<td><b>Type</b></td>';
                if (unitData.unittype[0].text == 'Villa') {
                    template += '<td>: ' + unitData.bedrooms + ' Bedrooms</td>';
                } else if (unitData.unitmodel[0].text == 'Studio') {
                    template += '<td>: ' + unitData.unitmodel[0].text + '</td>';
                } else {
                    template += '<td>: ' + unitData.bedrooms + ' Bedrooms</td>';
                }
                template += '</tr>';
                template += '<tr>';
                template += '<td><b>Permitted Use</b></td>';
                if (unitData.unituse) {
                    template += '<td>: ' + unitData.unituse[0].text + ' use</td>';
                } else {
                    template += '<td>: </td>';
                }
                template += '</tr>';

                template += '<tr>';
                template += '<td><b>Approximate Total Area</b></td>';
                if (unitData.unitArea) {
                    template += '<td>: ' + unitData.unitArea + ' Sqft</td>';
                } else {
                    template += '<td>: </td>';
                }

                template += '</tr>';

                template += '<tr>';
                template += '<td><b>Approximate Internal Living Area</b></td>';
                if (unitData.netArea) {
                    template += '<td>: ' + unitData.netArea + ' Sqft</td>';
                } else {
                    template += '<td>: </td>';
                }
                template += '</tr>';

                template += '<tr>';
                template += '<td><b>Approximate Balcony Area</b></td>';
                if (unitData.terraceArea) {
                    template += '<td>: ' + unitData.terraceArea + ' Sqft</td>';
                } else {
                    template += '<td>: </td>';
                }
                template += '</tr>';

                template += '<tr>';
                template += '<td><b>Approximate Outdoor Living Area</b></td>';
                if (unitData.gardenArea) {
                    template += '<td>: ' + unitData.gardenArea + ' Sqft</td>';
                } else {
                    template += '<td>: </td>';
                }
                template += '</tr>';

                template += '<tr>';
                template += '<td><b>Total Car Parks</b></td>';
                template += '<td>: ' + unitData.carParks + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td><b>Total Purchase Price</b></td>';
                template += '<td>: ' + reservationData.unitPrice + ' AED</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td><b>Amenity</b></td>';
                if (unitData.amenity) {
                    template += '<td>: ' + unitData.amenity + '</td>';
                } else {
                    template += '<td>: </td>';
                }
                template += '</tr>';

                template += '</table>';

            }

            } else { // when townhouse is not selected

                {
                template += '<table style="width:100%; margin-bottom:20px;">';

                template += '<tr>';
                template += '<td><b>Unit Number</b></td>';
                template += '<td>: ' + unitData.unitNum + '</td>';
                template += '</tr>';
                template += '<tr>';
                template += '<td><b>Type</b></td>';
                if (unitData.unittype[0].text == 'Villa') {
                    template += '<td>: ' + unitData.bedrooms + ' Bedrooms</td>';
                } else if (unitData.unitmodel[0].text == 'Studio') {
                    template += '<td>: ' + unitData.unitmodel[0].text + '</td>';
                } else {
                    template += '<td>: ' + unitData.bedrooms + ' Bedrooms</td>';
                }
                template += '</tr>';
                template += '<tr>';
                template += '<td><b>Permitted Use</b></td>';
                if (unitData.unituse) {
                    template += '<td>: ' + unitData.unituse[0].text + ' use</td>';
                } else {
                    template += '<td>: </td>';
                }
                template += '</tr>';

                template += '<tr>';
                template += '<td><b>Approximate Area</b></td>';
                if (unitData.unitArea) {
                    template += '<td>: ' + unitData.unitArea + ' Sqft</td>';
                } else {
                    template += '<td>: </td>';
                }

                template += '</tr>';

                template += '<tr>';
                template += '<td><b>Total Car Parks</b></td>';
                template += '<td>: ' + unitData.carParks + '</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td><b>Total Purchase Price</b></td>';
                template += '<td>: ' + reservationData.unitPrice + ' AED</td>';
                template += '</tr>';

                template += '</table>';

            }

            }

            // // table 11  (Payment Schedule title)
            {
                template += '<table style="width:100%;">';

                template += '<tr>';
                template += '<td  style=" margin-bottom:15px;"><span style="border-bottom:1px solid black;"><b>PAYMENT SCHEDULE:</b></span></td>';
                template += '</tr>';

                template += '</table>';
            }

            // // table 12 (Payment Schedule)
            {
                template += '<table  style="width:100%; margin-bottom:20px;page-break-after: always">';

                template += '<tr>';
                if (reservationData.subsidiary != 8) {
                    template += '<th style=" width:115px; border:1px solid black; font-size:6px;"><b>Instalment</b></th>';
                } else {
                    template += '<th style=" width:115px; border:1px solid black; font-size:6px;"><b>Instalments </b></th>';
                }
                template += '<th style="align:center; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;font-size:6px;"><b>Percentage</b></th>';
                template += '<th   style="align:center; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;font-size:6px;"><b>Amount (AED)</b></th>';
                if (reservationData.subsidiary != 8 && reservationData.subsidiary != 9) {
                    template += '<th style="width:150px; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;font-size:6px;"><b>Instalment Milestone</b></th>';
                }
                template += '<th   style="align:center; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;font-size:6px;"><b>Payment Date</b></th>';
                if (reservationData.subsidiary == 2||reservationData.subsidiary == 3) {
                    template += '<th   align="center" style=" width:150px; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;font-size:6px;"><b>Remarks</b></th>';
                } 
                
                template += '</tr>';
                for (i = 0; i < paymentPlanData.res.length; i++) {
                    if (paymentPlanData.res[i].isInActive == false) {
                        const cutoffDate = new Date('2026-06-30'); 
                        const oldDate = new Date(paymentPlanData.res[i].oldDate);
                        const newDate = new Date(paymentPlanData.res[i].date);
                        let remark = (oldDate > cutoffDate || newDate > cutoffDate) ? remarkNote : '-';

                        template += '<tr>';
                        template += '<td style="border-bottom: 1px solid black; border-left: 1px solid black; border-right: 1px solid black;font-size:8pt; padding:8px;">' + paymentPlanData.res[i].name + '</td>'
                        template += '<td style="align:center;border-bottom: 1px solid black; border-right: 1px solid black;font-size:8pt;padding:8px;">' + paymentPlanData.res[i].percent + '</td>'
                        template += '<td   style="align:center;border-bottom: 1px solid black; border-right: 1px solid black;font-size:8pt;padding:8px;">' + paymentPlanData.res[i].amt + '</td>'
                        if (reservationData.subsidiary != 8 && reservationData.subsidiary != 9) {
                            template += '<td   style="border-bottom: 1px solid black; border-right: 1px solid black;font-size:8pt;padding:8px;">' + paymentPlanData.res[i].milestone + '</td>'
                        }
                        if (paymentPlanData.res[i].type == 2) {
                            template += '<td   style=" align:center;border-bottom: 1px solid black; border-right: 1px solid black;font-size:8pt;padding:8px;">Completion</td>'
                        //     if (reservationData.subsidiary == 2) {
                        //     template += `<td  style="align:center; border-bottom: 1px solid black; border-right: 1px solid black;font-size:8pt;padding:8px;">
                        //     -
                        //  </td>`; }
                            
                        } else {
                            if (reservationData.oldDatePrintChk == true) {

                                template += '<td style="align:center; border-bottom: 1px solid black; border-right: 1px solid black;font-size:8pt;padding:8px;">' + paymentPlanData.res[i].oldDate + '</td>'

                            } else {

                                template += '<td   style="align:center; border-bottom: 1px solid black; border-right: 1px solid black;font-size:8pt;padding:8px;">' + paymentPlanData.res[i].date + '</td>'

                            }
                          
                        //  if(reservationData.subsidiary == 3){
                        //     //  if (paymentPlanData.res[i].type != 2) { // type 2 is completion installment
                            
                        //         const cutoffDate = new Date('2026-06-30');
                        //         const oldDate = new Date(paymentPlanData.res[i].oldDate);
                        //         const newDate = new Date(paymentPlanData.res[i].date);
                        //         let remark = (oldDate > cutoffDate || newDate > cutoffDate) ? remarkNote : '-';
                        //         template += `<td style="align:center; border-bottom: 1px solid black; border-right: 1px solid black;font-size:8pt;padding:8px;">
                        //         ${remark}
                        //     </td>`;
                        //     log.debug("paymentPlanData.res[i].type ",paymentPlanData.res[i].type )
                        //     log.debug("remark",remark)
                        //     // } else {
                        //     //     template += `<td style="align:center; border-bottom: 1px solid black; border-right: 1px solid black;font-size:8pt;padding:8px;">
                        //     //     -
                        //     // </td>`;
                        //     // }
                        //  }
                            
                        }
                        if (reservationData.subsidiary == 2) {
                            if(paymentPlanData.res[i].type == 2){
                                log.debug("paymentPlanData.res[i].type ",paymentPlanData.res[i].type )
                                template += `<td  style="align:center; border-bottom: 1px solid black; border-right: 1px solid black;font-size:8pt;padding:8px;">`
                                template+=`- </td>`;
                             }
                             else{
                                template += `<td  style="align:center; border-bottom: 1px solid black; border-right: 1px solid black;font-size:8pt;padding:8px;">
                                ${remark}
                             </td>`;
                             
                             }
                       
                     }
                    

                     if ( reservationData.subsidiary == 3) {
                        const cutoffDate = new Date('2027-06-30'); 
                        const oldDate = new Date(paymentPlanData.res[i].oldDate);
                        const newDate = new Date(paymentPlanData.res[i].date);
                        let remark = (oldDate > cutoffDate || newDate > cutoffDate) ? remarkNote : '-';
                        if(paymentPlanData.res[i].type == 2){
                            log.debug("paymentPlanData.res[i].type ",paymentPlanData.res[i].type )
                            template += `<td  style="align:center; border-bottom: 1px solid black; border-right: 1px solid black;font-size:8pt;padding:8px;">`
                            template+=`- </td>`;
                         }
                         else{
                            template += `<td  style="align:center; border-bottom: 1px solid black; border-right: 1px solid black;font-size:8pt;padding:8px;">
                            ${remark}
                         </td>`;
                         
                         }
                   
                 }
                        template += '</tr>';
                    }
                }
                template += '</table>';


            }

            // // table 13 (TERMS AND CONDITIONS TITLE)
            {
                template += '<table style="width:100%;">';

                template += '<tr>';
                template += '<td  style=" margin-bottom:15px;"><span style="border-bottom:1px solid black;"><b>TERMS AND CONDITIONS:</b></span></td>';
                template += '</tr>';

                template += '</table>';
            }

            // //  table 14 (TERMS AND CONDITIONS)
            {
                template += '<table style="page-break-after: always">';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;1.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">Upon signing of this Reservation Contract, the Purchaser confirms the intention to purchase the Unit and <br></br>hereby acknowledges that the Purchaser may not withdraw from this Reservation Contract, which shall be<br></br> legally binding on the Parties.</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;2.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">The Purchaser agrees to pay the Developer the reservation amount in full and cleared funds on the date of<br></br> the signing this Reservation Contract.</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;3.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">The Parties agree to enter into a sale and purchase agreement (the <b>SPA</b>) for the Unit on or before thirty<br></br> (30) days from the date the SPA is provided by the Developer to the Purchaser and in any event no later <br></br>than the date set out in item 2 of the Payment Schedule.</td>';
                template += '</tr>';


                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;4.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">Subject to the Purchaser’s compliance with the payment obligations under this Reservation Contract, the <br></br>reservation amount shall be applied towards the payment of the Purchase Price.</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;5.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">The Purchaser shall pay in cleared funds, and on or before the applicable payment dates, the instalments <br></br>that form the Payment Schedule (the <b>Instalments</b>), together with all other fees, taxes, bank and credit <br></br>charges, and all other fees and/or charges that may be levied on the purchase and/or transfer of the Unit <br></br>from the Developer to the Purchaser or otherwise with respect to the Unit.</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;6.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">The Reservation Contract is legally binding on the Purchaser and is in no way subject to or dependent upon <br></br>the Purchaser’s ability to secure a mortgage loan or finance from a bank and/or any third party.  In case the <br></br>Purchaser fails to obtain such mortgage, loan or finance and fails to honour the obligations under this <br></br>Reservation Contract, any Instalments paid by the Purchaser shall not be refunded.</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;7.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">The Purchaser confirms and warrants that the monies used by the Purchaser for any payment made under <br></br>this Agreement originate from clean funds and are not or could not reasonably be considered to be the <br></br>subject matter of money laundering in any way whatsoever. The Purchaser confirms and warrants that it, <br></br>its nominees, representatives and subsidiaries (including past, present and future successors), officers, <br></br>directors, agents, employees, owners and beneficial owners have not engaged in any activity whatsoever <br></br>that could constitute an offence under Federal Decree-law No. (20) of 2018 on Anti-Money Laundering and <br></br>Combating the Financing of Terrorism and Financing of Illegal Organisations (the <b>AML</b>). Before entering <br></br>into the Reservation Contract or the SPA, the Developer may require the Purchaser to complete a Due <br></br>Diligence questionnaire to establish compliance of the transaction with the AML and its other policies.</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;8.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">The Purchaser must not assign and/or transfer this Reservation Contract. The Developer may assign this <br></br>Reservation Contract to any affiliate by giving written notice of assignment to the Purchaser, and the <br></br>Purchaser hereby consents to any such assignment.</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;9.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">This Reservation Contract supersedes all previous verbal agreements, written agreements, negotiations <br></br>and/or understandings between the Developer and the Purchaser, including but not limited to, <br></br>representations made in the marketing materials, sales brochures, models, view sets, displays, <br></br>photographs, videos, illustrations, revenue projections and financial statements made available to the <br></br>Purchaser.</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;10.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">The Developer has the right (but not the obligation) to terminate this Reservation Contract by written notice <br></br>to the Purchaser with immediate effect and without reference to any court or other order, if:</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(a)&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">the Purchaser breaches any of its obligations under this Reservation Contract including the failure to <br></br>pay the Instalments or other monies payable under this Reservation Contract on their due date for <br></br>payment; </td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(b)&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">the Purchaser fails to sign the SPA in accordance with clause 3;</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(c)&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">the Purchaser is, and/or entering into the SPA with the Purchaser would be a breach of the AML <br></br>and/or the Developer’s policies, as determined by the Developer in its sole discretion;</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(d)&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">proceedings for bankruptcy, insolvency, liquidation, voluntary restructuring or a general assignment <br></br>for the benefits of the Purchaser’s creditors (or similar proceedings) have been initiated by or against <br></br>the Purchaser; or</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(e)&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">the Purchaser refuses to sign or provide any paperwork, documents and agreements as may be <br></br>required by the Developer in accordance with this Reservation Contract or any relevant authorities <br></br>from time to time.</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;11.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">On termination by the Developer, subject to and without waiving or prejudicing the Developer’s rights under <br></br>the applicable laws, the Developer may:</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(a)&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">retain the reservation amount as compensation for reserving the Unit; </td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(b)&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">if applicable, request the prompt de-registration of the Unit from all registers held at the relevant <br></br>authorities;</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(c)&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">resell the Unit to any other potential purchaser; and</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(d)&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">(d)	claim compensation from the Purchaser for any loss and expense suffered by the Developer as a <br></br>result of the default by the Purchaser (including any costs, expenses and shortfall in the Purchase <br></br>Price upon re-sale of the Unit, all legal and other expenses incurred by the Developer in connection <br></br>with such termination).</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;12.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">The Purchaser releases and discharges the Developer against any and all claims, losses, costs, taxes, <br></br>levies, expenses, damages and/or liabilities incurred, suffered or that may be incurred or suffered by the <br></br>Purchaser as a result of such termination and forfeiture. </td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;13.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">Any correspondence must be sent by personal delivery, courier or registered post. The Developer may <br></br>choose to correspond by email, including where it is required to give written notice under this Reservation <br></br>Contract. </td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;14.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">This Reservation Contract shall be governed by the laws of UAE as applied in Ras al Khaimah. In the event <br></br>of a dispute, controversy or claim arising out of, relating to or in connection with this Reservation Contract <br></br>(a <b>Dispute</b>), the party alleging the Dispute shall provide written notice to the other party giving particulars <br></br>of the Dispute (the <b>Notice of Dispute</b>). Within 10 days of receipt of the Notice of Dispute, the parties shall <br></br>attempt to hold a meeting within thirty (30) days in an effort to resolve the Dispute. If the Dispute is not <br></br>settled amicably, irrespective of whether a meeting was held, the Dispute shall, within 60 days of the Notice <br></br>of Dispute, be referred to arbitration in accordance with the Dubai International Arbitration Centre (DIAC) <br></br>Arbitration Rules 2007. The seat of the arbitration shall be Dubai, UAE. The language of the arbitration shall <br></br>be English. The number of arbitrators shall be three (3). </td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;15.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">Execution of the Reservation Contract does not grant the Purchaser any proprietary interest or other rights <br></br>in the Unit and this Reservation Contract may be cancelled by the Developer at any time prior to the signing <br></br>of the SPA by the Developer. Unless the Developer would be entitled to terminate this Reservation Contract <br></br>under clause 10, any amounts paid by the Purchaser prior to the date of such cancellation shall be refunded <br></br>to the Purchaser without interest. The return of such amounts shall constitute the sole remedy and <br></br>compensation of the Purchaser and the Purchaser shall have no other recourse, claim or remedy against <br></br>the Developer in relation to such cancellation of the Reservation Contract.</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;16.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">The invalidity, illegality or unenforceability of any term or condition of this Reservation Contract shall be <br></br>deemed not to form part of this Reservation Contract to that extent and shall not affect the validity, legality <br></br>or enforceability of the remaining terms and conditions of this Reservation Contract or the validity, legality <br></br>or enforceability of this Reservation Contract itself.  </td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;17.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">Any information, whether verbal or written, received by the Purchaser under or in relation to this Reservation <br></br>Contract, including its terms and existence, is confidential.</td>'
                template += '</tr>';

                template += '<tr style="margin-bottom:10px">';
                template += '<td>&nbsp;&nbsp;18.&nbsp;&nbsp;&nbsp;&nbsp;</td>'
                template += '<td style="line-height: 125%;">This Reservation Contract shall automatically cease and determine on execution of the SPA by the Parties.</td>'
                template += '</tr>';

                template += '</table>';

            }

            // // table 15
            {
                template += '<table>';

                template += '<tr>';
                template += '<td style ="margin-top:20px;margin-bottom:20px;"><b>The Purchaser hereby agrees that by signing this Reservation Contract, it enters into a binding agreement <br></br>with the developer to purchase the above Unit in accordance with this Reservation Contract.</b></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td style ="margin-top:20px;margin-bottom:20px; border:1px solid black;"><span style="padding-top:10px;padding-bottom:20px;padding-left:5px;padding-right:60px;"><b>The Purchaser hereby confirms that this Project has been introduced to the Purchaser by ';
                if (reservationData.broker && partnerData.companyName != 'Direct Client') {
                    if (partnerData.type) {
                        template += partnerData.indName;
                    } else {
                        template += partnerData.companyName;
                    }
                } else {
                    template += reservationData.salesRep;
                }
                template += '</b></span></td></tr>';
                template += '</table>';
            }
            // // table 16 signature
            {

                template += '<table style="width:100%;">';

                template += '<tr style ="margin-top:20px;margin-bottom:20px;">';
                template += '<td style="width:50%;"><b>Signed on behalf of the Purchaser</b></td>';
                template += '<td></td>'
                template += '</tr>';

                template += '<tr style ="margin-top:20px;margin-bottom:20px;">';
                template += '<td style="width:50%;">Name:_________________________________</td>';
                template += '<td>Signature:_________________________________</td>'
                template += '</tr>';

                template += '<tr style ="margin-top:20px;margin-bottom:20px;">';
                // template += `<td>Effective Date: ${reservationData.createdDatee}</td>`;
                template += '<td></td>'
                template += '</tr>';












                template += '<tr style ="margin-top:20px;margin-bottom:1px;">';
                template += '<td><b>Authorized Signatory</b></td>';
                template += '<td></td>'
                template += '</tr>';

                template += '<tr style ="margin-top:1px;margin-bottom:5px;">';
                template += '<td><b>' + vendorData.legalname + '</b></td>';
                template += '<td></td>'
                template += '</tr>';

                template += '<tr style ="margin-top:20px;margin-bottom:20px;">';
                // template += `<td>Effective Date: ${reservationData.createdDatee}</td>`;
                template += '<td>Signature:_________________________________</td>'
                template += '</tr>';

                template += '</table>';


            }

            // // 17 table required documents
            {
                template += `<p align="center">Effective Date: ${reservationData.createdDatee}</p>`;

                template += '<table style="border:1px solid black;">';

                template += '<tr>';
                template += '<td style="margin-bottom:3px;"><b>Documents required with this Reservation Contract</b></td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td>A.&nbsp;&nbsp;In case the Purchaser is an individual, clear passport copy of the Purchaser.</td>';
                template += '</tr>';
                template += '<tr>';
                template += '<td>B.&nbsp;&nbsp;In case the Purchaser is a UAE or GCC resident, their Emirates ID and GCC ID respectively.</td>';
                template += '</tr>';
                template += '<tr>';
                template += '<td>C.&nbsp;&nbsp;Proof of residential address.</td>';
                template += '</tr>';
                template += '<tr>';
                template += '<td>D.&nbsp;&nbsp;In case the Purchaser is a company, attested copies of the following:</td>'
                template += '</tr>';

                template += '<tr>';
                template += '<td>&nbsp;&nbsp;&nbsp;&nbsp;i.&nbsp;&nbsp;Trade License/Incorporation certificate;</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td>&nbsp;&nbsp;&nbsp;&nbsp;ii.&nbsp;&nbsp;Letter of authority of the person signing this Reservation Contract along with the signatory passport copy</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td>&nbsp;&nbsp;&nbsp;&nbsp;iii.&nbsp;&nbsp;Information (including passport copies) regarding all owners and beneficial owners.</td>';
                template += '</tr>';

                template += '<tr>';
                template += '<td>E.&nbsp;&nbsp;In case this Reservation Contract is signed by any person other than the Purchaser, a power of attorney in <br></br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;favour of the signatory, duly notarised at its place of issue and attested by the UAE Embassy/Consulate <br></br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(if power of attorney is issued outside UAE).</td>';
                template += '</tr>';
                template += '<tr>';
                template += '<td>F.&nbsp;&nbsp;Proof of funds and source of funds.</td>';
                template += '</tr>';

                template += '</table>';

            }


            return template;

        } catch (errGetBody) {
            log.debug('errGetBody', errGetBody)
        }
    }


    // finaly print
    const finalyPrint = (template, context) => {
        try {
            template = template + '</body>'
            template = template + '</pdf>'

            var renderer = render.create();

            renderer.templateContent = template;
            var xml = renderer.renderAsString();

            var pdfFile = render.xmlToPdf({
                xmlString: xml
            });

            context.response.writeFile({
                file: pdfFile,
                isInline: true
            });
        } catch (errFinalyPrint) {
            log.debug('errFinalyPrint', errFinalyPrint)
        }
    }



    // // functions
    const getReservationData = (myRecId) => {
        try {
            if (myRecId) {
                let opportunityRec = record.load({
                    type: 'opportunity',
                    id: myRecId
                });
    
                let customer = opportunityRec.getValue('entity');
                let subsidiary = opportunityRec.getValue('subsidiary');
                let tranid = opportunityRec.getValue('tranid');
                let location = opportunityRec.getText('location');
                let property = opportunityRec.getValue('cseg_ino_re_prpty');
                let propertyText = opportunityRec.getText('cseg_ino_re_prpty');
                let unitMaster = opportunityRec.getValue('custbody_ino_re_um_unitmaster');
                let paymentPlan = opportunityRec.getText('custbody_ino_re_paymentplan');
                let reservationPerc = opportunityRec.getValue('custbody_ino_re_reservation_percent');
                let reservationAmt = opportunityRec.getValue('custbody_ino_re_reservation_amt');
                let downPmtPerc = opportunityRec.getValue('custbody_ino_re_down_pmt_percent');
                let downPmtAmt = opportunityRec.getValue('custbody_ino_re_down_pmt_amt');
                let handOverPerc = opportunityRec.getValue('custbody_ino_re_handover_percent');
                let handOverAmt = opportunityRec.getValue('custbody_ino_re_handover_amt');
                let installmentPerc = opportunityRec.getValue('custbody_ino_re_installment_percent');
                let installmentAmt = opportunityRec.getValue('custbody_ino_re_installment_amt');
                let startDate = opportunityRec.getValue('custbody_ino_re_pp_startdate');
                let unitPrice = opportunityRec.getValue('projectedtotal');
                let broker = opportunityRec.getValue('partner');
                let salesRep = opportunityRec.getText('salesrep');
                let secondCustomer = opportunityRec.getValue('custbody_ino_re_scnd_customer');
                let thirdCustomer = opportunityRec.getValue('custbody_ino_re_third_customer');
                let fourthCustomer = opportunityRec.getValue('custbody_ino_re_fourth_customer');
                let fifthCustomer=opportunityRec.getValue('custbody_ino_re_fifth_customer');
                let oldDatePrintChk = opportunityRec.getValue('custbody_az_rng_old_dates_print');
                let createDate = opportunityRec.getValue('trandate');
                createDate = new Date(createDate);
                let createdDatee = formatDateToYMD(createDate)
                // Clean up and formatting
                location = removeandsign(location);
                propertyText = removeandsign(propertyText);
                salesRep = removeandsign(salesRep);
                unitPrice = numberWithCommas(unitPrice);
    
                return {
                    'customer': customer,
                    'subsidiary': subsidiary,
                    'tranid': tranid,
                    'location': location,
                    'property': property,
                    'propertyText': propertyText,
                    'unitMaster': unitMaster,
                    'paymentPlan': paymentPlan,
                    'reservationPerc': reservationPerc,
                    'reservationAmt': reservationAmt,
                    'downPmtPerc': downPmtPerc,
                    'downPmtAmt': downPmtAmt,
                    'handOverPerc': handOverPerc,
                    'handOverAmt': handOverAmt,
                    'installmentPerc': installmentPerc,
                    'installmentAmt': installmentAmt,
                    'startDate': startDate,
                    'unitPrice': unitPrice,
                    'broker': broker,
                    'salesRep': salesRep,
                    'secondCustomer': secondCustomer,
                    'thirdCustomer': thirdCustomer,
                    'fourthCustomer': fourthCustomer,
                    'fifthCustomer':fifthCustomer,
                    'oldDatePrintChk': oldDatePrintChk,
                    'createdDatee': createdDatee,
                }
    
            } else {
                // Return empty object if no ID
                return {
                    'customer': "",
                    'subsidiary': "",
                    'tranid': "",
                    'location': "",
                    'property': "",
                    'propertyText': "",
                    'unitMaster': "",
                    'paymentPlan': "",
                    'reservationPerc': "",
                    'reservationAmt': "",
                    'downPmtPerc': "",
                    'downPmtAmt': "",
                    'handOverPerc': "",
                    'handOverAmt': "",
                    'installmentPerc': "",
                    'installmentAmt': "",
                    'startDate': "",
                    'unitPrice': "",
                    'broker': "",
                    'salesRep': "",
                    'secondCustomer': "",
                    'thirdCustomer': "",
                    'fourthCustomer': "",
                    'fifthCustomer': "",
                    'oldDatePrintChk': "",
                    'createdDatee': ""
                }
            }
    
        } catch (errGetReservationData) {
            log.debug('errGetReservationData', errGetReservationData);
        }
    }
    


    const getCustomerData = (customerId) => {
        try {

            if (customerId) {
                var customerSearch = s.create({
                    type: 'customer',
                    filters: ["internalid", "is", customerId],
                    columns: [
                        'companyname',
                        'phone',
                        'address',
                        'email',
                        'isperson',
                        'salutation',
                        'lastname',
                        'firstname',
                        'custentity_ino_re_nationality',
                        'custentity_ino_re_passport_id',
                        'city',
                        'country',
                        'custentity_az_rng_company_reg_num',
                        'custentity_ino_re_cus_shareholder',
                        'custentity_ino_re_cus_authorizedsgnato',
                        'custentity_ino_re_cus_title',
                        'altemail',
                        'custentity_ino_re_customer_pobox',
                        'altphone',
                    ]
                });

                let customerRec = customerSearch.run().getRange({
                    start: 0,
                    end: 1
                })

                let isperson = customerRec[0].getValue("isperson");
                let companyName;
                let firstName;
                let lastName;

                if (isperson == true) {
                    companyName = customerRec[0].getValue("companyname");
                    firstName = customerRec[0].getValue("firstname");
                    lastName = customerRec[0].getValue("lastname");

                }
                else {
                    companyName = customerRec[0].getValue("companyname");
                    firstName = "";
                    lastName = "";
                }
                let address = customerRec[0].getValue("address");

                companyName = removeandsign(companyName);
                firstName = removeandsign(firstName);
                lastName = removeandsign(lastName);
                address = removeandsign(address);

                let phone = customerRec[0].getValue("phone");
                let email = customerRec[0].getValue("email");
                let salutation = customerRec[0].getValue("salutation");
                salutation = removeandsign(salutation);
                let nationlaity = customerRec[0].getValue("custentity_ino_re_nationality");
                let passportId = customerRec[0].getValue("custentity_ino_re_passport_id");
                passportId = removeandsign(passportId)
                let city = customerRec[0].getValue("city");
                let country = customerRec[0].getText("country");
                if(country === 'Palestine, State of')
                    {
                      country = 'Palestine';
                    }
                let vatregnumber = customerRec[0].getValue("custentity_az_rng_company_reg_num");
                let shareholder = customerRec[0].getValue("custentity_ino_re_cus_shareholder");
                let authorizedSignatory = customerRec[0].getValue("custentity_ino_re_cus_authorizedsgnato");
                let title = customerRec[0].getValue("custentity_ino_re_cus_title");


                return {
                    'companyName': companyName,
                    'phone': phone,
                    'address': address,
                    'email': email,
                    'isperson': isperson,
                    'salutation': salutation,
                    'lastName': lastName,
                    'firstName': firstName,
                    'nationlaity': nationlaity,
                    'passportId': passportId,
                    'city': city,
                    'country': country,
                    'vatregnumber': vatregnumber,
                    'shareholder': shareholder,
                    'authorizedSignatory': authorizedSignatory,
                    'title': title,
                }
            } else {
                return {
                    'companyName': "",
                    'phone': "",
                    'address': "",
                    'email': "",
                    'isperson': "",
                    'salutation': "",
                    'lastName': "",
                    'firstName': "",
                    'nationlaity': "",
                    'passportId': "",
                    'city': "",
                    'country': "",
                    'vatregnumber': "",
                    'shareholder': "",
                    'authorizedSignatory': "",
                    'title': "",
                }
            }

        } catch (errGetCustomerData) {
            log.debug('errGetCustomerData', errGetCustomerData)
        }
    }

    const getVendorDate = (subsidary) => {
        try {
            if (subsidary) {
                let subsidiaryRecord = record.load({
                    type: 'subsidiary',
                    id: subsidary,

                });

                let address = subsidiaryRecord.getValue('mainaddress_text');
                let regNum = subsidiaryRecord.getValue('custrecord_az_rng_rera_reg_no');
                let subsidiaryRec = s.lookupFields({
                    type: 'subsidiary',
                    id: subsidary,
                    columns: ['legalname', 'name', 'email']
                });

                return {
                    'name': subsidiaryRec.name,
                    'legalname': subsidiaryRec.legalname,
                    'email': subsidiaryRec.email,
                    'address': address,
                    'regNum': regNum
                }
            } else {
                return {
                    'name': "",
                    'legalname': "",
                    'email': "",
                    'address': "",
                    'regNum': ""
                }
            }


        } catch (errorgetVendorDate) {
            log.debug('errorgetVendorDate', errorgetVendorDate);
        }
    }

    const getUnitData = (unitMaster) => {
        try {
            if (unitMaster) {
                let unitRec = s.lookupFields({
                    type: 'customrecord_ino_re_unitmaster',
                    id: unitMaster,
                    columns: ['name',
                        'custrecord_ino_re_um_unituse',
                        'custrecord_ino_re_um_unittype',
                        'custrecord_ino_re_um_property',
                        'custrecord_ino_re_um_building',
                        'custrecord_ino_re_um_floor',
                        'custrecord_ino_re_um_number',
                        'custrecord_ino_re_um_gross_area',
                        'custrecord_ino_re_um_parking',
                        'custrecord_ino_re_um_wing',
                        'custrecord_ino_re_um_bedroom',
                        'custrecord_ino_re_um_model',
                        'custrecord_az_rng_town_house',
                        'custrecord_ino_re_um_net_area',
                        'custrecord_ino_re_um_terrace_area',
                        'custrecord_ino_re_um_garden_area',
                        'custrecord_ino_re_um_amenity'

                    ]
                });
                let unitArea = unitRec.custrecord_ino_re_um_gross_area;
                unitArea = numberWithCommas(unitArea);



                return {
                    'name': unitRec.name,
                    'unittype': unitRec.custrecord_ino_re_um_unittype,
                    'unituse': unitRec.custrecord_ino_re_um_unituse,
                    'property': unitRec.custrecord_ino_re_um_property,
                    'building': unitRec.custrecord_ino_re_um_building,
                    'floor': unitRec.custrecord_ino_re_um_floor,
                    'unitNum': unitRec.custrecord_ino_re_um_number,
                    'unitArea': unitArea,
                    'carParks': unitRec.custrecord_ino_re_um_parking,
                    'wing': unitRec.custrecord_ino_re_um_wing,
                    'bedrooms': unitRec.custrecord_ino_re_um_bedroom,
                    'unitmodel': unitRec.custrecord_ino_re_um_model,
                    'townhouse': unitRec.custrecord_az_rng_town_house,
                    'netArea': numberWithCommas(unitRec.custrecord_ino_re_um_net_area),
                    'terraceArea': numberWithCommas(unitRec.custrecord_ino_re_um_terrace_area),
                    'gardenArea': numberWithCommas(unitRec.custrecord_ino_re_um_garden_area),
                    'amenity': unitRec.custrecord_ino_re_um_amenity,


                }
            } else {
                return {
                    'name': "",
                    'unittype': "",
                    'unituse': "",
                    'property': "",
                    'building': "",
                    'floor': "",
                    'unitNum': "",
                    'unitArea': "",
                    'carParks': "",
                    'bedrooms': "",
                    'unitmodel': "",
                    'townhouse': "",
                    'netArea': "",
                    'terraceArea': "",
                    'gardenArea': "",
                    'amenity': "",

                }

            }

        } catch (errorgetUnitData) {
            log.debug('errorgetUnitData', errorgetUnitData);
        }
    }

    const getPropertyData = (property) => {
        try {
            if (property) {

                let search = s.create({
                    type: 'customrecord_cseg_ino_re_prpty',
                    columns: [
                        'custrecord_ino_re_prop_bank_name',
                        'custrecord_ino_re_prop_branch',
                        'custrecord_ino_re_prop_escrowaccount',
                        'custrecord_ino_re_prop_acc_number',
                        'custrecord_ino_re_prop_swift_code',
                        'custrecord_ino_re_prop_iban_no',
                        'custrecord_ino_re_prop_plot_no',
                        'custrecord_ino_re_prop_mastercommunity',
                        'custrecord_az_rng_re_developerno',

                    ],
                    filters: ['internalid', s.Operator.IS, property]
                }).run();

                let searchResult = search.getRange(0, 1);
                if (searchResult != null && searchResult != '') {

                    let bankName = searchResult[0].getValue('custrecord_ino_re_prop_bank_name');
                    let branch = searchResult[0].getValue('custrecord_ino_re_prop_branch');
                    let accountName = searchResult[0].getText('custrecord_ino_re_prop_escrowaccount');
                    let accountNum = searchResult[0].getValue('custrecord_ino_re_prop_acc_number');
                    let swiftCode = searchResult[0].getValue('custrecord_ino_re_prop_swift_code');
                    let ibanNo = searchResult[0].getValue('custrecord_ino_re_prop_iban_no');
                    let plotNo = searchResult[0].getValue('custrecord_ino_re_prop_plot_no');
                    let masterCom = searchResult[0].getValue('custrecord_ino_re_prop_mastercommunity');
                    let developerNumber = searchResult[0].getValue('custrecord_az_rng_re_developerno');
                    bankName = removeandsign(bankName.split("-")[0]);
                    branch = removeandsign(branch);
                    accountName = removeandsign(accountName);
                    swiftCode = removeandsign(swiftCode);

                    return {
                        'bankName': bankName,
                        'branch': branch,
                        'accountName': accountName,
                        'accountNum': accountNum,
                        'swiftCode': swiftCode,
                        'ibanNo': ibanNo,
                        'plotNo': plotNo,
                        'masterCom': masterCom,
                        'developerNumber': developerNumber

                    }
                }

            } else {
                return {
                    'bankName': "",
                    'branch': "",
                    'accountName': "",
                    'accountNum': "",
                    'swiftCode': "",
                    'ibanNo': "",
                    'plotNo': "",
                    'masterCom': ""

                }
            }
        } catch (errorGetPropertyData) {
            log.debug("errorGetPropertyData", errorGetPropertyData)
        }
    }

    const getPaymentPlanData = (myRecId) => {

        try {
            let res = [];
            if (myRecId) {
                let search = s.create({
                    type: 'customrecord_ino_re_paymentplan',
                    columns: [
                        'internalid',
                        'name',
                        'custrecord_ino_re_pp_percent',
                        'custrecord_ino_re_pp_amount',
                        'custrecord_ino_re_pp_installment_milesto',
                        'custrecord_ino_re_pp_date',
                        'isinactive',
                        'custrecord_ino_re_pp_type',
                        'custrecord_az_rng_pp_old_date'


                    ],
                    filters: ['custrecord_ino_re_pp_reservation', s.Operator.IS, myRecId]
                }).run();
                let searchResult = search.getRange(0, 1000);
                if (searchResult != null && searchResult != '') {
                    for (i = 0; i < searchResult.length; i++) {
                        let id = searchResult[i].getValue('internalid');
                        let insname = searchResult[i].getValue('name');
                        let date = searchResult[i].getValue('custrecord_ino_re_pp_date');
                        let percent = searchResult[i].getValue('custrecord_ino_re_pp_percent');
                        let amt = searchResult[i].getValue('custrecord_ino_re_pp_amount');
                        let milestone = searchResult[i].getValue('custrecord_ino_re_pp_installment_milesto');
                        let isInActive = searchResult[i].getValue('isinactive');
                        let type = searchResult[i].getValue('custrecord_ino_re_pp_type');
                        let oldDate = searchResult[i].getValue('custrecord_az_rng_pp_old_date');
                        log.debug('type', type);
                        amt = numberWithCommas(amt);
                        insname = removeandsign(insname)
                        milestone = removeandsign(milestone);


                        res.push({
                            'id': id,
                            'name': insname,
                            'date': date,
                            'percent': percent,
                            'amt': amt,
                            'milestone': milestone,
                            'isInActive': isInActive,
                            'type': type,
                            'oldDate': oldDate
                        })
                    }
                    res.sort(function (a, b) {
                        return new Date(a.date) - new Date(b.date);
                    });
                }
                return {
                    'res': res
                }
            } else {
                res.push({
                    'id': "",
                    'name': "",
                    'date': "",
                    'percent': "",
                    'amt': "",
                    'milestone': "",
                    'isInActive': "",
                    'type': "",
                    'oldDate': ''

                })
                return {
                    'res': ""
                }
            }

        } catch (errorgetPaymentPlanData) {
            log.debug('errorgetPaymentPlanData', errorgetPaymentPlanData);
        }
    }

    const getPartnerData = (partnerId) => {
        try {
            if (partnerId) {
                let search = s.create({
                    type: 'partner',
                    filters: ['internalid', s.Operator.IS, partnerId],
                    columns: [
                        'isperson',
                        'companyname',
                        'firstname',
                        'lastname',
                    ],

                }).run();
                let searchResult = search.getRange(0, 1);
                if (searchResult != null && searchResult != '') {
                    let type = searchResult[0].getValue('isperson')
                    let companyName = searchResult[0].getValue('companyname')
                    let firstName = searchResult[0].getValue('firstname')
                    let lastName = searchResult[0].getValue('lastname')
                    companyName = removeandsign(companyName);
                    firstName = removeandsign(firstName);
                    lastName = removeandsign(lastName);
                    let indName = firstName + " " + lastName;
                    return {
                        'type': type,
                        'companyName': companyName,
                        'indName': indName
                    }
                }
            } else {
                return {
                    'type': '',
                    'companyName': '',
                    'indName': ''
                }
            }
        } catch (errorgetPartnerData) {
            log.debug('errorgetPartnerData', errorgetPartnerData)
        }
    }

    const getSubsidiaryLogo = (subsidiaryId) => {
        try {
            if (subsidiaryId) {
                let logoUrl = '';

                let subsidiaryRec = record.load({
                    type: 'subsidiary',
                    id: subsidiaryId
                });

                let logoId = subsidiaryRec.getValue('logo');
                let subsidiaryName = subsidiaryRec.getValue('name');
                let subsidiarylegalName = subsidiaryRec.getValue('custrecord_az_rng_bene_escrow_acc_name');

                if (logoId) {

                    let logoFile = file.load({
                        id: logoId,
                    });

                    logoUrl = (logoFile.url).replace(/&/g, '&amp;');

                }


                return {
                    'logoUrl': 'https://9294876.app.netsuite.com/' + logoUrl,
                    'subsidiaryName': subsidiaryName,
                    'subsidiarylegalName' : subsidiarylegalName
                }
            } else {
                return {
                    'logoUrl': "",
                    'subsidiaryName': "",
                    'subsidiarylegalName': ""
                }
            }

        } catch (errGetSubsidiaryData) {
            log.debug('errGetSubsidiaryData', errGetSubsidiaryData);
        }
    }

    const removeandsign = (word) => {
        word = word.replace("&", "&amp;");
        return word
    }

    const numberWithCommas = (x) => {
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
    const  formatDateToYMD= (dateObj)=> {
        try {

            if (!dateObj) return "";
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            let day = dateObj.getDate().toString().padStart(2, '0');
            return `${day}/${month}/${year}`;
            
        } catch (errorformatDateToYMD) {
            log.debug('errorformatDateToYMD',errorformatDateToYMD)
        }
       
    }

    return {
        onRequest: onRequest
    }
});
