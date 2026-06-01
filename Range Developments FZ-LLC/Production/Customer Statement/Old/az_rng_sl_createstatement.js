/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
 define(['N/render', 'N/search','N/record'],
    function (render, s,record) {

        const onRequest = (context) => {
            try {

                if (context.request.method == 'GET') {
                    try {

                        const recId = context.request.parameters.recId;

                        const statementData = getCustomerStatmentData(recId)

                        if (statementData.customer) {

                            // var reservations = getReservations(customerId);
                            const subsidiaryLogo = getSubsidiaryLogo(statementData.subsidiaryId);
                            const cusomerData = getDataFromCustomer(statementData.customer);
                            const secondCustomerData = getDataFromCustomer(statementData.secondaryCustomer);
                            const thirdCustomerData = getDataFromCustomer(statementData.thirdCustomer);
                            const fourthCustomerData = getDataFromCustomer(statementData.fourthCustomer);
                            const fifthCustomerData = getDataFromCustomer(statementData.fifthCustomer);

                            const paymentPlanAllocation = getPaymentPlanAllocation(cusomerData, secondCustomerData, thirdCustomerData,fourthCustomerData,fifthCustomerData, statementData.subsidiaryId, statementData.propertyId);
                            const unitMasterData = getDataFromUnitMaster(cusomerData, secondCustomerData, thirdCustomerData,fourthCustomerData,fifthCustomerData, statementData.subsidiaryId);
                            const unit_resale = statementData.unitResale;

                            const unit_resale_data = getDataFromUnitResale(statementData);
                            let registeration_invoice = null;
                            let noc_invoice = null;
                            let oldregisteration_invoice = null
                            if(unit_resale_data){
                                registeration_invoice = unit_resale_data.registeration_invoice ? getDataFromRegisterationInv(unit_resale_data.registeration_invoice) : null;
                                noc_invoice = unit_resale_data.noc_invoice ? getDataFromNOCInv(unit_resale_data.noc_invoice) : null;
                                oldregisteration_invoice = unit_resale_data.oldregisteration_invoice ? getDataFromRegisterationInv(unit_resale_data.oldregisteration_invoice) : null;
                            }
                            
                            let template = getHeader(subsidiaryLogo);
                            template = getBody(template, cusomerData, unitMasterData, paymentPlanAllocation, secondCustomerData, thirdCustomerData,fourthCustomerData,fifthCustomerData, statementData, unit_resale_data, registeration_invoice, noc_invoice,oldregisteration_invoice,unit_resale);

                            finalyPrint(template, context);

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
        const getHeader = (subsidiaryLogo) => {
            try {
                var template = "";

                template += '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
                template += '<pdf>';
                template += '<head>';
                template += '<link name="NotoSansAra" type="font" subtype="opentype" src="${nsfont.NotoSansArabic_Regular}" srcbold="${nsfont.NotoSansArabic_Bold}" bytes = "2" />';
                template += '<macrolist>';

                template += '<macro id="nlheader">';
                template += '<table style="width:100%;">';
                template += '<tr>';
                template += '<td align="left" style="">'; //&amp;
                if (subsidiaryLogo) {
                    template += '<img width="100" height="40" alt="FPO lady" src="' + subsidiaryLogo + '"/>';
                }
                template += '</td>';
                template += '<td align="right" style="">'; //&amp;
                template += '<img width="140" height="60" alt="FPO lady" src="https://9294876.app.netsuite.com/core/media/media.nl?id=1235&amp;c=9294876&amp;h=aN44f4i9A3_46JR5gqYpyP29DWRUTwP1yBaEhl6Xp37ZWWyi"/>';
                template += '</td>';
                template += '</tr></table>';
                template += '</macro>';

                template += '<macro id="nlfooter">';

                template += '<table class="footer" style="width: 100%;">';

                var today = new Date();
                var date = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();

                template += '<tr style="font-size: 11px; font-weight: bold;">';
                template += '<td align="left">Print Date : ' + date + '</td>';
                template += '<td align="right"><pagenumber/> of <totalpages/></td>';
                template += '</tr>';
                template += '</table>';
                template += '</macro>';

                template += '</macrolist>';
                template += '<style type="text/css">'
                template += '* {'
                template += 'font-family: NotoSansAra, sans-serif;'
                template += '}'
                template += 'b {'
                template += 'font-size: 13px;'
                template += '}'
                template += '</style>'
                template += "</head>";
                template += "<body header='nlheader' header-height='11%' footer='nlfooter' footer-height='7pt' padding='0.5in 0.5in 0.5in 0.5in' size='Letter-LANDSCAPE' style='margin:10px;padding:10px;'>";

                return template;
            } catch (errGetHeader) {
                log.debug('errGetHeader', errGetHeader)
            }

        }


        // get body 
        const getBody = (template, cusomerData, unitMasterData, paymentPlanAllocation, secondCustomerData, thirdCustomerData,fourthCustomerData,fifthCustomerData, statementData, unit_resale_data, registeration_invoice, noc_invoice,oldregisteration_invoice,unit_resale ) => {
            try {

                {
                    // // table 1 (head) // customer data 
                    {
                        template += '<table width="100%" style="border:1px solid;margin-top:20px;">';

                        template += '<tr>';
                        template += '<td width="50%"></td>';
                        template += '<td width="50%"></td>';
                        template += '</tr>';

                        template += '<tr style="border-bottom:1px solid;">';
                        template += '<td colspan="2" align="center" style="font-weight: bold; font-size: 16px;">Customer Statement</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td align="left" style="font-size: 13px;border-right:1px solid;"><b>Customer Name</b> :  ' + cusomerData.customerName + '</td>';
                        template += '<td align="left" style="font-size: 13px;"><b>Phone Number</b> :  ' + cusomerData.phone + '</td>';
                        template += '</tr>';
                        template += '<tr>';
                        template += '<td align="left" style="font-size: 13px;border-right:1px solid;"><b>Nationality</b> :  ' + cusomerData.nationality + '</td>';
                        template += '<td align="left" style="font-size: 13px;"><b>Email</b> :  ' + cusomerData.email + '</td>';
                        template += '</tr>';
                        template += '<tr>';
                        template += '<td align="left" style="font-size: 13px;border-right:1px solid;"><b>Address</b> : ' + cusomerData.address + '</td>';
                        template += '<td align="left" style="font-size: 13px;"><b>Passport / License Number</b> :  ' + cusomerData.passport + '</td>';
                        template += '</tr>';
                        template += '</table>';

                    }
                    // // table 2 second customer data 
                    if (secondCustomerData.id) {
                        template += '<table width="100%" style="border:1px solid;margin-top:20px;">';

                        template += '<tr>';
                        template += '<td width="50%"></td>';
                        template += '<td width="50%"></td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td  align="left" style="font-size: 13px;border-right:1px solid;"><b>Customer Name</b> :  ' + secondCustomerData.customerName + '</td>';
                        template += '<td  align="left" style="font-size: 13px;"><b>Phone Number</b> :  ' + secondCustomerData.phone + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td  align="left" style="font-size: 13px;border-right:1px solid;"><b>Nationality</b> :  ' + secondCustomerData.nationality + '</td>';
                        template += '<td  align="left" style="font-size: 13px;"><b>Email</b> :  ' + secondCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td  align="left" style="font-size: 13px;border-right:1px solid;"><b>Address</b> : ' + secondCustomerData.address + '</td>';
                        template += '<td  align="left" style="font-size: 13px;"><b>Passport / License Number</b> :  ' + secondCustomerData.passport + '</td>';
                        template += '</tr>';

                        template += '</table>';

                    }
                    // // table 3 second customer data 
                    if (thirdCustomerData.id) {
                        template += '<table width="100%" style="border:1px solid;margin-top:20px;">';

                        template += '<tr>';
                        template += '<td width="50%"></td>';
                        template += '<td width="50%"></td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td align="left" style="font-size: 13px;border-right:1px solid;"><b>Customer Name</b> :  ' + thirdCustomerData.customerName + '</td>';
                        template += '<td align="left" style="font-size: 13px;"><b>Phone Number</b> :  ' + thirdCustomerData.phone + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td align="left" style="font-size: 13px;border-right:1px solid;"><b>Nationality</b> :  ' + thirdCustomerData.nationality + '</td>';
                        template += '<td align="left" style="font-size: 13px;"><b>Email</b> :  ' + thirdCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td align="left" style="font-size: 13px;border-right:1px solid;"><b>Address</b> : ' + thirdCustomerData.address + '</td>';
                        template += '<td align="left" style="font-size: 13px;"><b>Passport / License Number</b> :  ' + thirdCustomerData.passport + '</td>';
                        template += '</tr>';

                        template += '</table>';

                    }

                    // // table 4 second customer data 
                    if (fourthCustomerData.id) {
                        template += '<table width="100%" style="border:1px solid;margin-top:20px;">';

                        template += '<tr>';
                        template += '<td width="50%"></td>';
                        template += '<td width="50%"></td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td align="left" style="font-size: 13px;border-right:1px solid;"><b>Customer Name</b> :  ' + fourthCustomerData.customerName + '</td>';
                        template += '<td align="left" style="font-size: 13px;"><b>Phone Number</b> :  ' + fourthCustomerData.phone + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td align="left" style="font-size: 13px;border-right:1px solid;"><b>Nationality</b> :  ' + fourthCustomerData.nationality + '</td>';
                        template += '<td align="left" style="font-size: 13px;"><b>Email</b> :  ' + fourthCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td align="left" style="font-size: 13px;border-right:1px solid;"><b>Address</b> : ' + fourthCustomerData.address + '</td>';
                        template += '<td align="left" style="font-size: 13px;"><b>Passport / License Number</b> :  ' + fourthCustomerData.passport + '</td>';
                        template += '</tr>';

                        template += '</table>';

                    }

                     // // table 5 second customer data 
                     if (fifthCustomerData.id) {
                        template += '<table width="100%" style="border:1px solid;margin-top:20px;">';

                        template += '<tr>';
                        template += '<td width="50%"></td>';
                        template += '<td width="50%"></td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td align="left" style="font-size: 13px;border-right:1px solid;"><b>Customer Name</b> :  ' + fifthCustomerData.customerName + '</td>';
                        template += '<td align="left" style="font-size: 13px;"><b>Phone Number</b> :  ' + fifthCustomerData.phone + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td align="left" style="font-size: 13px;border-right:1px solid;"><b>Nationality</b> :  ' + fifthCustomerData.nationality + '</td>';
                        template += '<td align="left" style="font-size: 13px;"><b>Email</b> :  ' + fifthCustomerData.email + '</td>';
                        template += '</tr>';

                        template += '<tr>';
                        template += '<td align="left" style="font-size: 13px;border-right:1px solid;"><b>Address</b> : ' + fifthCustomerData.address + '</td>';
                        template += '<td align="left" style="font-size: 13px;"><b>Passport / License Number</b> :  ' + fifthCustomerData.passport + '</td>';
                        template += '</tr>';

                        template += '</table>';

                    }

                    // table 6  units Table 
                    {
                        template += '<table width="100%"  style="border:1px solid;margin-top:20px;" >';

                        template += '<tr style="border-bottom:1px solid;">';
                        template += '<td colspan="7" align="center" style="font-weight: bold; font-size: 14px;">Units Summary</td>';
                        template += '</tr>';

                        template += '<tr style="border-bottom:1px solid;font-size: 13px;font-weight:bold;">';
                        template += '<td align="center" style="border-right:1px solid;">Unit No.</td>';
                        template += '<td align="center" style="border-right:1px solid;">Model</td>';
                        template += '<td align="center" style="border-right:1px solid;">View / Wing</td>';
                        template += '<td align="center" style="border-right:1px solid;">Agreed Price</td>';
                        template += '<td align="center" style="border-right:1px solid;">Paid Amount</td>';
                        template += '<td align="center" style="border-right:1px solid;">Remaining Amount</td>';
                        template += '<td align="center">Over Due Amount</td>';
                        template += '</tr>';
                        for (var i = 0; i < unitMasterData.length; i++) {
                            var reservationId = unitMasterData[i].reservationId;
                            var paymentPlanData = getPaymentPlanData(reservationId);
                            if (paymentPlanData) {

                                template += '<tr style="border-bottom:1px solid;font-size: 12px;">';
                                template += '<td align="center" style="border-right:1px solid;">' + unitMasterData[i].unitNo + '</td>';
                                template += '<td align="center" style="border-right:1px solid;">' + unitMasterData[i].model + '</td>';
                                if (unitMasterData[i].view && unitMasterData[i].wing) {
                                    template += '<td align="center" style="border-right:1px solid;">' + unitMasterData[i].view + ' / ' + unitMasterData[i].wing + '</td>';
                                } else {
                                    template += '<td align="center" style="border-right:1px solid;">' + unitMasterData[i].view + `` + unitMasterData[i].wing + '</td>';

                                }
                                template += '<td align="center" style="border-right:1px solid;">' + numberWithCommas(unitMasterData[i].agreedPrice) + '</td>';
                                template += '<td align="center" style="border-right:1px solid;">' + numberWithCommas(unitMasterData[i].totalPaid) + '</td>';
                                template += '<td align="center" style="border-right:1px solid;">' + numberWithCommas(unitMasterData[i].totalRemaining) + '</td>';
                                template += '<td align="center">' + numberWithCommas(unitMasterData[i].totalDue) + '</td>';
                                template += '</tr>';
                            }

                        }

                        template += '</table>';

                    }


                    // // table 7 (payment plan)
                    {

                        for (var s = 0; s < unitMasterData.length; s++) {
                            var reservationId = unitMasterData[s].reservationId;
                            var paymentPlanData = getPaymentPlanData(reservationId);
                            if (paymentPlanData) {

                                template += '<table width="100%" style="margin-top: 20px;border:1px solid;">';

                                template += '<tr style="border-bottom: solid;">';
                                template += '<td colspan="6" align="center" style="font-weight: bold; font-size: 13px;">' + unitMasterData[s].unitNo + '</td>';
                                template += '</tr>'

                                // get payment plan totals 
                                // var paymentPlanTotal = getPaymentPlanTotal(reservationId);

                                // var totalPrice = paymentPlanTotal.totalPrice;
                                // var totalPaid = paymentPlanTotal.totalPaid;
                                // var totalRemaining = paymentPlanTotal.totalRemaining;

                                template += '<tr style="font-size: 13px;background-color:#d5dfe5;">';
                                template += '<td align="center" style="border-right:1px solid;border-bottom:1px solid;"><b>Total Price</b>: ' + numberWithCommas(paymentPlanData.totalPrice) + '</td>';
                                template += '<td colspan="2" align="center" style="border-right:1px solid;border-bottom:1px solid;"><b>Paid</b>: ' + numberWithCommas(paymentPlanData.totalPaid) + '</td>';
                                template += '<td align="center" style="border-right:1px solid;border-bottom:1px solid;"><b>Remaining</b>: ' + numberWithCommas(paymentPlanData.totalRemaining) + '</td>';
                                template += '<td colspan="2" align="center" style="border-bottom:1px solid;"><b>Due Amount</b>: ' + numberWithCommas(paymentPlanData.totalDue) + '</td>';
                                template += '</tr>'


                                template += '<tr style="border-bottom: solid;font-size: 13px;">';
                                template += '<td align="center" style="font-weight: bold;border-right:1px solid;">Payment Plan</td>';
                                template += '<td align="center" style="font-weight: bold;border-right:1px solid;">Percent</td>';
                                template += '<td align="center" style="font-weight: bold;border-right:1px solid;">Due Date</td>';
                                template += '<td align="center" style="font-weight: bold;border-right:1px solid;">Amount</td>';
                                template += '<td align="center" style="font-weight: bold;border-right:1px solid;">Paid</td>';
                                template += '<td align="center" style="font-weight: bold;">Remaining</td>';
                                template += '</tr>'



                                for (var y = 0; y < paymentPlanData.data.length; y++) {

                                    template += '<tr style="border-bottom: solid;font-size: 13px;">';
                                    template += '<td align="center" style="border-right:1px solid;">' + paymentPlanData.data[y].name + '</td>';
                                    template += '<td align="center" style="border-right:1px solid;">' + paymentPlanData.data[y].perc + '</td>';
                                    template += '<td align="center" style="border-right:1px solid;">' + paymentPlanData.data[y].date + '</td>';
                                    template += '<td align="center" style="border-right:1px solid;">' + numberWithCommas(paymentPlanData.data[y].amount) + '</td>';
                                    template += '<td align="center" style="border-right:1px solid;">' + numberWithCommas(paymentPlanData.data[y].amountPaid) + '</td>';
                                    template += '<td align="center">' + numberWithCommas(paymentPlanData.data[y].amountRemaining) + '</td>';
                                    template += '</tr>'

                                }



                                template += '</table>'
                            }

                        }
                    }



                    //  // table 8 Receipts Data
                    {

                        if (paymentPlanAllocation.recipts.length > 0) {
                           template += '<div style="page-break-before: always;"></div>';
                            template += '<table width="100%" style="border:1px solid;margin-top:20px;">';

                            template += '<tr style="border-bottom:1px solid;font-size: 13px;font-weight:bold;">';
                            template += '<td width="12%" align="center" style="border-right:1px solid;">Receipt No.</td>';
                            template += '<td width="12%" align="center" style="border-right:1px solid;">Receipt Date</td>';
                            template += '<td width="12%" align="center" style="border-right:1px solid;">Receipt Amt.</td>';
                            template += '<td width="12%" align="center" style="border-right:1px solid;">Unit</td>';
                            template += '<td width="25%" align="center" style="border-right:1px solid;">Installment</td>';
                            template += '<td width="15%" align="center" style="border-right:1px solid;">Amount</td>';
                            template += '<td width="12%" align="center">Paid Via</td>';
                            template += '</tr>';

                            let check = 0;
                            for (var i = 0; i < paymentPlanAllocation.recipts.length; i++) {
                                if (paymentPlanAllocation.recipts[i].value != "") {
                                    template += ` <tr>
          <td align="center" rowspan="`+ paymentPlanAllocation.recipts[i].count + `" style="border-right:1px solid;border-bottom:1px solid;vertical-align: middle;">` + paymentPlanAllocation.recipts[i].value + `</td>`;
                                    for (var j = 0; j < paymentPlanAllocation.data.length; j++) {
                                        if (paymentPlanAllocation.data[j].customerReceiptId == paymentPlanAllocation.recipts[i].value) {
                                            if (check == 0) {
                                                template += `<td align="center"  rowspan="` + paymentPlanAllocation.recipts[i].count + `" style="border-right:1px solid;border-bottom:1px solid;vertical-align: middle;">` + paymentPlanAllocation.data[j].customerReceiptDate + `</td>
                      <td align="center"  rowspan="`+ paymentPlanAllocation.recipts[i].count + `" style="border-right:1px solid;border-bottom:1px solid;vertical-align: middle;">` + numberWithCommas(paymentPlanAllocation.data[j].customerReceiptAmt) + `</td>
                      <td align="center" style="border-right:1px solid;border-bottom:1px solid;">`+ paymentPlanAllocation.data[j].unit + `</td>
                      <td align="center" style="border-right:1px solid;border-bottom:1px solid;">`+ paymentPlanAllocation.data[j].installment + `</td>
                      <td align="center" style="border-right:1px solid;border-bottom:1px solid;">`+ paymentPlanAllocation.data[j].amount + `</td>
                      <td align="center" border-bottom="1" style="vertical-align: middle;" rowspan="`+ paymentPlanAllocation.recipts[i].count + `">` + paymentPlanAllocation.data[j].customerReceiptPaymentMethod + `</td>
                      </tr>`;

                                            }
                                            else {
                                                template += `<tr>
                      <td align="center" style="border-right:1px solid;border-bottom:1px solid;">`+ paymentPlanAllocation.data[j].unit + `</td>
                      <td align="center" style="border-right:1px solid;border-bottom:1px solid;">`+ paymentPlanAllocation.data[j].installment + `</td>
                      <td align="center" style="border-right:1px solid;border-bottom:1px solid;">`+ paymentPlanAllocation.data[j].amount + `</td>
                      </tr>`;
                                            }
                                            check++;

                                        }
                                    }
                                    // template += `</tr>`

                                    check = 0;
                                }
                            }


                            template += '</table>';
                        }

                    }


                    // Unit Registration Invoice Table
                    {

                        var unitsWithRegInvoice = [];

                        for (var i = 0; i < unitMasterData.length; i++) {

                            if (unitMasterData[i].registerationInv) {
                                unitsWithRegInvoice.push(unitMasterData[i]);
                            }   
                        }


                        if ((!unit_resale) && unitsWithRegInvoice.length > 0 ) {

                            template += `<table width="100%" style="margin-top: 20px;border:1px solid; border-top:2px solid">
                                            <tr style="font-size: 13px;background-color:#d5dfe5;">
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Unit
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Description
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Invoice Number
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Amount
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    VAT
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Total Amount
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Remaining
                                                </td>
                                            </tr>
                                            `;
                                            for (var i = 0; i < unitsWithRegInvoice.length; i++) {

                                                var invData = getDataFromRegisterationInv(unitsWithRegInvoice[i].registerationInv);

                                                template += `
                                                <tr style="border-bottom: solid;font-size: 13px;">
                                                    <td align="center" style="border-right:1px solid;">${unitsWithRegInvoice[i].unitNo}</td>
                                                    <td align="center" style="border-right:1px solid;">Registration Fees</td>
                                                    <td align="center" style="border-right:1px solid;">${invData.invoice_number}</td>
                                                    <td align="center" style="border-right:1px solid;">${numberWithCommas(invData.subtotal)}</td>
                                                    <td align="center" style="border-right:1px solid;">${invData.vat}</td>
                                                    <td align="center" style="border-right:1px solid;">${numberWithCommas(invData.total)}</td>
                                                    <td align="center" style="border-right:1px solid;">${numberWithCommas(invData.amountremaining)}</td>
                                                </tr>
                                            `;
                                        }
                                        template += '</table>';
                        }
                        
                    }


                    //  // table 9 Customer PDC Data
                    {
                        if (paymentPlanAllocation.pdc.length > 0) {

                            template += '<table width="100%" style="border:1px solid;margin-top:20px;">';

                            template += '<tr style="border-bottom:1px solid;font-size: 13px;font-weight:bold;">';
                            template += '<td width="12%" align="center" style="border-right:1px solid;">PDC No.</td>';
                            template += '<td width="12%" align="center" style="border-right:1px solid;">PDC Date</td>';
                            template += '<td width="12%" align="center" style="border-right:1px solid;">PDC Amt.</td>';
                            template += '<td width="12%" align="center" style="border-right:1px solid;">Unit</td>';
                            template += '<td width="25%" align="center" style="border-right:1px solid;">Installment</td>';
                            template += '<td width="15%" align="center" style="border-right:1px solid;">Amount</td>';
                            template += '<td width="12%" align="center">Paid Via</td>';
                            template += '</tr>';


                            let check = 0;
                            for (var i = 0; i < paymentPlanAllocation.pdc.length; i++) {
                                if (paymentPlanAllocation.pdc[i].value != "") {
                                    template += ` <tr>
              <td align="center" rowspan="`+ paymentPlanAllocation.pdc[i].count + `" style="border-right:1px solid;border-bottom:1px solid;vertical-align: middle;">` + paymentPlanAllocation.pdc[i].value + `</td>`;
                                    for (var j = 0; j < paymentPlanAllocation.data.length; j++) {
                                        if (paymentPlanAllocation.data[j].customerPDCId == paymentPlanAllocation.pdc[i].value) {
                                            if (check == 0) {
                                                template += `
                          <td align="center"  rowspan="`+ paymentPlanAllocation.pdc[i].count + `" style="border-right:1px solid;border-bottom:1px solid;vertical-align: middle;">` + paymentPlanAllocation.data[j].customerPDCDate + `</td>
                          <td align="center"  rowspan="`+ paymentPlanAllocation.pdc[i].count + `" style="border-right:1px solid;border-bottom:1px solid;vertical-align: middle;">` + numberWithCommas(paymentPlanAllocation.data[j].customerPDCAmt) + `</td>
                          <td align="center" style="border-right:1px solid;border-bottom:1px solid;">`+ paymentPlanAllocation.data[j].unit + `</td>
                          <td align="center" style="border-right:1px solid;border-bottom:1px solid;">`+ paymentPlanAllocation.data[j].installment + `</td>
                          <td align="center" style="border-right:1px solid;border-bottom:1px solid;">`+ paymentPlanAllocation.data[j].amount + `</td>
                          <td align="center" border-bottom="1" style="vertical-align: middle;" rowspan="`+ paymentPlanAllocation.pdc[i].count + `">Cheque</td>
                          </tr>`;

                                            }
                                            else {
                                                template += `<tr>
                          <td align="center" style="border-right:1px solid;border-bottom:1px solid;">`+ paymentPlanAllocation.data[j].unit + `</td>
                          <td align="center" style="border-right:1px solid;border-bottom:1px solid;">`+ paymentPlanAllocation.data[j].installment + `</td>
                          <td align="center" style="border-right:1px solid;border-bottom:1px solid;">`+ paymentPlanAllocation.data[j].amount + `</td>
                          </tr>`;
                                            }
                                            check++;

                                        }
                                    }

                                    check = 0;
                                }
                            }


                            template += '</table>';
                        }

                    }

                    // // table 10
                    if (statementData.disclaim && statementData.includeDisclaimer == true) {
                        template += '<table width="100%" style="margin-top:20px;">';

                        template += '<tr>';
                        template += '<td width="100%">' + statementData.disclaim + '</td>';
                        template += '</tr>';

                        template += '</table>';

                    }


                    // // table 11 unit resale owner
                    if(noc_invoice){
                        if(unit_resale_data){
                            let ownerNames = unit_resale_data.current_owner.name;
                            if(unit_resale_data.sec_owner != ''){
                                ownerNames += ', ' + unit_resale_data.sec_owner;
                                if(unit_resale_data.third_owner !=''){
                                    ownerNames += ', ' + unit_resale_data.third_owner;
                                    if(unit_resale_data.fourth_owner != ''){
                                        ownerNames += ', ' + unit_resale_data.fourth_owner;
                                    }
                                }
                            }
                            
                            template += `<table width="100%" style="margin-top: 20px;border:1px solid;">
                                            <tr style="border-bottom: solid;">
                                                <td colspan="6" align="left" style="font-size: 13px;">
                                                    <span style="font-weight: bold;">Old Clients Name:</span> ${ownerNames}<br/><span style="font-weight: bold;">Address:</span> ${unit_resale_data.current_owner.address}
                                                </td>
                                            </tr>
                                            <tr style="font-size: 13px;background-color:#d5dfe5;">
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Description
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Invoice Number
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Amount
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    VAT
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Total Amount
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Remaining
                                                </td>
                                            </tr>
                                            <tr style="border-bottom: solid;font-size: 13px;">
                                                <td align="center" style="border-right:1px solid;">Transfer &amp; Noc Fee</td>
                                                <td align="center" style="border-right:1px solid;">${noc_invoice.invoice_number}</td>
                                                <td align="center" style="border-right:1px solid;">${numberWithCommas(noc_invoice.subtotal)}</td>
                                                <td align="center" style="border-right:1px solid;">${noc_invoice.vat}</td>
                                                <td align="center" style="border-right:1px solid;">${numberWithCommas(noc_invoice.total)}</td>
                                                <td align="center" style="border-right:1px solid;">${numberWithCommas(noc_invoice.amountremaining)}</td>
                                            </tr>
                                        </table>
                            `
                        }
                    }

                    // // table 12 unit resale purchaser
                    if(registeration_invoice){
                        if(unit_resale_data){
                            let purchaserNames = unit_resale_data.new_purchaser.name;
                            if(unit_resale_data.sec_purchaser != ''){
                                purchaserNames += ', ' + unit_resale_data.sec_purchaser;
                                if(unit_resale_data.third_purchaser !=''){
                                    purchaserNames += ', ' + unit_resale_data.third_purchaser;
                                    if(unit_resale_data.fourth_purchaser != ''){
                                        purchaserNames += ', ' + unit_resale_data.fourth_purchaser;
                                    }
                                }
                            }
                            
                            template += `<table width="100%" style="margin-top: 20px;border:1px solid;">
                                            <tr style="border-bottom: solid;">
                                                <td colspan="6" align="left" style="font-size: 13px;">
                                                    <span style="font-weight: bold;">New Clients Name:</span> ${purchaserNames}<br/><span style="font-weight: bold;">Address:</span> ${unit_resale_data.new_purchaser.address}
                                                </td>
                                            </tr>
                                            <tr style="font-size: 13px;background-color:#d5dfe5;">
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Description
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Invoice Number
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Amount
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    VAT
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Total Amount
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Remaining
                                                </td>
                                            </tr>
                                            <tr style="border-bottom: solid;font-size: 13px;">
                                                <td align="center" style="border-right:1px solid;">Registration  Fees</td>
                                                <td align="center" style="border-right:1px solid;">${registeration_invoice.invoice_number}</td>
                                                <td align="center" style="border-right:1px solid;">${numberWithCommas(registeration_invoice.subtotal)}</td>
                                                <td align="center" style="border-right:1px solid;">${registeration_invoice.vat}</td>
                                                <td align="center" style="border-right:1px solid;">${numberWithCommas(registeration_invoice.total)}</td>
                                                <td align="center" style="border-right:1px solid;">${numberWithCommas(registeration_invoice.amountremaining)}</td>
                                            </tr>
                                        </table>
                            `
                        }
                    }



                    if(unit_resale && oldregisteration_invoice){
                       
                            
                            template += `<table width="100%" style="margin-top: 20px;border:1px solid;">
                                            <tr style="border-bottom: solid;">
                                                <td colspan="6" align="left" style="font-size: 13px;">
                                                    <span style="font-weight: bold;">Old Clients Name:</span> ${oldregisteration_invoice.entityName}<br/><span style="font-weight: bold;">Address:</span> ${oldregisteration_invoice.entityAddr}
                                                </td>
                                            </tr>
                                            <tr style="font-size: 13px;background-color:#d5dfe5;">
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Description
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Invoice Number
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Amount
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    VAT
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Total Amount
                                                </td>
                                                <td align="center" style="border-right:1px solid;border-bottom:1px solid;">
                                                    Remaining
                                                </td>
                                            </tr>
                                            <tr style="border-bottom: solid;font-size: 13px;">
                                                <td align="center" style="border-right:1px solid;">Registration  Fees</td>
                                                <td align="center" style="border-right:1px solid;">${oldregisteration_invoice.invoice_number}</td>
                                                <td align="center" style="border-right:1px solid;">${numberWithCommas(oldregisteration_invoice.subtotal)}</td>
                                                <td align="center" style="border-right:1px solid;">${oldregisteration_invoice.vat}</td>
                                                <td align="center" style="border-right:1px solid;">${numberWithCommas(oldregisteration_invoice.total)}</td>
                                                <td align="center" style="border-right:1px solid;">${numberWithCommas(oldregisteration_invoice.amountremaining)}</td>
                                            </tr>
                                        </table>
                            `
                        
                    }



                    template = template;
                    return template;

                }

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



        const getReservations = (customerId) => {
            try {

                var reservationIds = []

                var srch = s.create({
                    type: 'opportunity',
                    columns: ['internalid'],
                    filters: ['entity', s.Operator.IS, customerId]
                }).run();

                var searchResult = srch.getRange(0, 1000);
                if (searchResult != null && searchResult != '') {
                    for (row = 0; row < searchResult.length; row++) {
                        var reservationId = searchResult[row].getValue('internalid');
                        reservationIds.push(reservationId)
                    }
                }

                return reservationIds;

            } catch (errGetReservations) {
                log.debug('errGetReservations', errGetReservations)
            }
        }


        // get customer data 
        const getDataFromCustomer = (customerId) => {
            try {

                if (customerId) {

                    var srch = s.create({
                        type: 'customer',
                        columns: [
                            'internalid',
                            'title',
                            'email',
                            'phone',
                            'altname',
                            'address',
                            'custentity_ino_re_nationality',
                            'custentity_az_rng_customer_name',
                            'custentity_ino_re_passport_id'
                        ],
                        filters: ['internalid', s.Operator.IS, customerId]
                    });

                    var searchResult = getAllResults(srch);
                    if (searchResult != null && searchResult != '') {
                        var id = searchResult[0].getValue('internalid');
                        var title = searchResult[0].getValue('title');
                        var customerName = searchResult[0].getValue('altname');
                        var email = searchResult[0].getValue('email');
                        var phone = searchResult[0].getValue('phone');
                        var address = searchResult[0].getValue('address');
                        var nationality = searchResult[0].getText('custentity_ino_re_nationality');
                        var cust = searchResult[0].getValue('custentity_az_rng_customer_name'); // from customer subtab
                        var passport = searchResult[0].getValue('custentity_ino_re_passport_id');
                    }

                    return {
                        'id': id,
                        'title': title,
                        'customerName': escapeXML(customerName),
                        'email': email,
                        'phone': phone,
                        'address': escapeXML(address),
                        'nationality': nationality,
                        'cust':cust,
                        'passport': passport
                    }

                } else {

                    return {
                        'id': '',
                        'title': '',
                        'customerName': '',
                        'email': '',
                        'phone': '',
                        'address': '',
                        'nationality': '',
                        'customer_name': '',
                        'passport': ''
                    }

                }

            } catch (errGetDataFromCsutomer) {
                log.debug('errGetDataFromCsutomer', errGetDataFromCsutomer)
            }
        }


        // get Unit Master data 
        const getDataFromUnitMaster = (customer, secondCustomer, thirdCustomer,fourthCustomer,fifthCustomer, subsidiaryId) => {
            try {

                // if (customer.id) {
                var unitData = [];
                var srch = s.create({
                    type: 'customrecord_ino_re_unitmaster',
                    columns: [
                        'name',
                        'custrecord_ino_re_um_model',
                        'custrecord_ino_re_um_wing', 'custrecord_ino_re_um_view',
                        'custrecord_ino_re_um_reservation_amt',
                        'custrecord_ino_re_um_reservation_number',
                        'custrecord_az_rng_um_reg_inv',
                        'internalid'
                    ],
                    filters: [
                        ['custrecord_ino_re_um_customer', s.Operator.IS, customer.id], 'and',
                        ['custrecord_ino_re_um_subsidiary', s.Operator.IS, subsidiaryId]
                    ]
                });
                if (secondCustomer.id) {
                    srch.filters.push(
                        s.createFilter({
                            name: "custrecord_ino_re_um_scnd_customer",
                            operator: s.Operator.IS,
                            values: secondCustomer.id,
                        })
                    );
                }

                if (thirdCustomer.id) {
                    srch.filters.push(
                        s.createFilter({
                            name: "custrecord_ino_re_um_third_customer",
                            operator: s.Operator.IS,
                            values: thirdCustomer.id,
                        })
                    );
                }

                if (fourthCustomer.id) {
                    srch.filters.push(
                        s.createFilter({
                            name: "custrecord_ino_re_um_fourth_customer",
                            operator: s.Operator.IS,
                            values: fourthCustomer.id,
                        })
                    );
                }
                if (fifthCustomer.id) {
                    srch.filters.push(
                        s.createFilter({
                            name: "custrecord_ino_re_um_fifth_customer",
                            operator: s.Operator.IS,
                            values: fifthCustomer.id,
                        })
                    );
                }
                var searchResult = getAllResults(srch);
                if (searchResult != null && searchResult != '') {



                    for (var x = 0; x < searchResult.length; x++) {

                        var unitNo = searchResult[x].getValue('name');
                        var model = searchResult[x].getText('custrecord_ino_re_um_model');
                        var wing = searchResult[x].getValue('custrecord_ino_re_um_wing');
                        var view = searchResult[x].getValue('custrecord_ino_re_um_view');
                        var agreedPrice = searchResult[x].getValue('custrecord_ino_re_um_reservation_amt');
                        var reservationId = searchResult[x].getValue('custrecord_ino_re_um_reservation_number');
                        var unitId = searchResult[x].getValue('internalid');
                        var registerationInv = searchResult[x].getValue('custrecord_az_rng_um_reg_inv');


                        // search for payment plan to calc paid and remaining 

                        var paymentPlantotalData = getPaymentPlanData(reservationId);

                        var totalPaid = paymentPlantotalData.totalPaid;
                        var totalRemaining = paymentPlantotalData.totalRemaining;
                        var totalDue = paymentPlantotalData.totalDue;

                        unitData.push({
                            unitNo: unitNo,
                            model: model,
                            wing: wing,
                            view: view,
                            agreedPrice: agreedPrice,
                            totalPaid: totalPaid,
                            totalRemaining: totalRemaining,
                            reservationId: reservationId,
                            unitId: unitId,
                            totalDue: totalDue,
                            registerationInv: registerationInv
                        });

                    }



                }
                log.debug('unitData len', unitData.length);
                return unitData

                // } else {

                //     return {
                //         unitNo: "",
                //         model: "",
                //         wing: "",
                //         view: "",
                //         agreedPrice: "",
                //         totalPaid: "",
                //         totalRemaining: "",
                //         reservationId: "",
                //         unitId: "",
                //         totalDue: ""
                //     };
                // }

            } catch (errGetDataFromCsutomer) {
                log.debug('errGetDataFromCsutomer', errGetDataFromCsutomer)
            }
        }


        // get payment plan data 
        const getPaymentPlanData = (reservationId) => {
            try {
                let data = [];

                if (reservationId) {

                    let totalPrice = 0;
                    let totalPaid = 0;
                    let totalRemaining = 0;
                    let totalDue = 0;
                    var today = new Date();

                    var srch2 = s.create({
                        type: 'customrecord_ino_re_paymentplan',
                        columns: ['name',

                            {
                                name: 'custrecord_ino_re_pp_number',
                                sort: s.Sort.ASC
                            },

                            'custrecord_ino_re_pp_date',
                            'custrecord_ino_re_pp_amount',
                            'custrecord_ino_re_pp_amountpaid',
                            'custrecord_ino_re_pp_amt_remaining',
                            'custrecord_ino_re_pp_percent',
                            'isinactive'
                        ],
                        filters: [
                            ['custrecord_ino_re_pp_reservation', s.Operator.IS, reservationId], 'and',
                            ['isinactive', s.Operator.IS, false]
                        ]
                    });

                    var searchResult = getAllResults(srch2);

                    if (searchResult != null && searchResult != '') {
                        for (var i = 0; i < searchResult.length; i++) {

                            let name = searchResult[i].getValue('name');
                            let number = searchResult[i].getValue('custrecord_ino_re_pp_number');
                            let date = searchResult[i].getValue('custrecord_ino_re_pp_date');
                            let amount = parseFloat(searchResult[i].getValue('custrecord_ino_re_pp_amount'));
                            let amountPaid = parseFloat(searchResult[i].getValue('custrecord_ino_re_pp_amountpaid'));
                            let amountRemaining = parseFloat(searchResult[i].getValue('custrecord_ino_re_pp_amt_remaining'));
                            let perc = searchResult[i].getValue('custrecord_ino_re_pp_percent')
                            let tranDate = new Date(date);
                            totalPrice += parseFloat(amount);
                            totalPaid += amountPaid;
                            totalRemaining += amountRemaining;
                            if (today.getTime() > tranDate.getTime()) {
                                totalDue += amountRemaining;
                            }

                            data.push({
                                'name': name,
                                'number': number,
                                'date': date,
                                'amount': amount,
                                'amountPaid': amountPaid,
                                'amountRemaining': amountRemaining,
                                'perc': perc
                            })
                        }
                    } else {
                        data.push({
                            'name': '',
                            'number': '',
                            'date': '',
                            'amount': '',
                            'amountPaid': '',
                            'amountRemaining': '',
                            'perc': ''
                        })

                    }
                    return {
                        'data': data,
                        'totalPrice': totalPrice,
                        'totalPaid': totalPaid,
                        'totalRemaining': totalRemaining,
                        'totalDue': totalDue,
                    }
                } else {
                    log.debug('data length is', data.length)
                    return {
                        'data': data,
                        'totalPrice': '',
                        'totalPaid': '',
                        'totalRemaining': '',
                        'totalDue': '',
                    }
                }

            } catch (error) {

                log.debug({
                    title: 'error in get total pay plan',
                    details: error
                })
            }
        }


        // get payment plan allocation data 
        const getPaymentPlanAllocation = (customer, secondCustomer, thirdCustomer, fourthCustomer,fifthCustomer,subsidiaryId, propertyId) => {
            try {
                var data = [];
                var recipts = [];
                var pdc = [];
                var srch2 = s.create({
                    type: 'customrecord_ino_re_pmt_plan_allocation',
                    columns: [
                        'custrecord_ino_re_ppa_subs',
                        'custrecord_ino_re_ppa_customer',
                        'custrecord_ino_re_ppa_pmt_plan',
                        'custrecord_ino_re_ppa_customerreceipt',
                        'custrecord_ino_re_ppa_amt',
                        'custrecord_ino_re_ppa_unit',
                        'custrecord_ino_re_ppa_customerpdc',
                        'custrecord_ino_re_ppa_property',
                    ],
                    filters: [
                        ['custrecord_ino_re_ppa_customer', s.Operator.IS, customer.id], 'and',
                        ['custrecord_ino_re_ppa_subs', s.Operator.IS, subsidiaryId], 'and',
                        ['custrecord_ino_re_ppa_property', s.Operator.IS, propertyId]
                    ]
                });

                if (secondCustomer.id) {
                    srch2.filters.push(
                        s.createFilter({
                            name: "custrecord_ino_re_ppa_secondary_customer",
                            operator: s.Operator.IS,
                            values: secondCustomer.id,
                        })
                    );
                }

                if (thirdCustomer.id) {
                    srch2.filters.push(
                        s.createFilter({
                            name: "custrecord_ino_re_ppa_third_customer",
                            operator: s.Operator.IS,
                            values: thirdCustomer.id,
                        })
                    );
                }

                if (fourthCustomer.id) {
                    srch2.filters.push(
                        s.createFilter({
                            name: "custrecord_ino_re_ppa_fourth_customer",
                            operator: s.Operator.IS,
                            values: fourthCustomer.id,
                        })
                    );
                }

                if (fifthCustomer.id) {
                    srch2.filters.push(
                        s.createFilter({
                            name: "custrecord_ino_re_ppa_fifth_customer",
                            operator: s.Operator.IS,
                            values: fifthCustomer.id,
                        })
                    );
                }

                var searchResult = getAllResults(srch2);

                if (searchResult != null && searchResult != '') {


                    for (var i = 0; i < searchResult.length; i++) {

                        var installment = searchResult[i].getText('custrecord_ino_re_ppa_pmt_plan');
                        var installmentId = searchResult[i].getValue('custrecord_ino_re_ppa_pmt_plan');
                        var customerReceiptId = searchResult[i].getValue('custrecord_ino_re_ppa_customerreceipt');
                        var customerPDCId = searchResult[i].getValue('custrecord_ino_re_ppa_customerpdc');
                        var unit = searchResult[i].getText('custrecord_ino_re_ppa_unit');
                        var amount = searchResult[i].getValue('custrecord_ino_re_ppa_amt');
                        amount = numberWithCommas(amount);

                        // customer recipt data
                        let reciptdata = getReciptData(customerReceiptId);
                        var customerReceiptDate = reciptdata.date;
                        var customerReceiptAmt = reciptdata.recivedAmt;
                        customerReceiptAmt = customerReceiptAmt;
                        var customerReceiptPaymentMethod = reciptdata.paymentMethod;


                        // customer PDC data
                        let customerPDCData = getCustomerPDCData(customerPDCId);
                        var customerPDCDate = customerPDCData.date;
                        var customerPDCAmt = customerPDCData.amount;
                        customerReceiptAmt = customerReceiptAmt;


                        var paymentPlan = s.lookupFields({
                            type: 'customrecord_ino_re_paymentplan',
                            id: installmentId,
                            columns: ['isinactive']
                        });
                        var installmentActivation = paymentPlan.isinactive;

                        if (installmentActivation == false) {

                            data.push({
                                'installment': installment,
                                'customerReceiptId': customerReceiptId,
                                'customerReceiptDate': customerReceiptDate,
                                'customerReceiptAmt': customerReceiptAmt,
                                'unit': unit,
                                'amount': amount,
                                'customerReceiptPaymentMethod': customerReceiptPaymentMethod,
                                'customerPDCId': customerPDCId,
                                'customerPDCDate': customerPDCDate,
                                'customerPDCAmt': customerPDCAmt

                            });
                            if (customerReceiptId) {
                                recipts.push(customerReceiptId);
                            }
                            if (customerPDCId) {
                                pdc.push(customerPDCId);
                            }

                        }
                    }

                    let receiptcountMap = recipts.reduce((acc, curr) => {
                        if (acc[curr]) {
                            acc[curr].count++;
                        } else {
                            acc[curr] = { value: curr, count: 1 };
                        }
                        return acc;
                    }, {});

                    recipts = Object.values(receiptcountMap);

                    let pdccountMap = pdc.reduce((acc, curr) => {
                        if (acc[curr]) {
                            acc[curr].count++;
                        } else {
                            acc[curr] = { value: curr, count: 1 };
                        }
                        return acc;
                    }, {});

                    pdc = Object.values(pdccountMap);
                    log.debug('recipts', recipts);
                    log.debug('pdc', pdc);

                    return {
                        'data': data,
                        'recipts': recipts,
                        'pdc': pdc
                    };

                } else {

                    return {
                        'data': data,
                        'recipts': recipts,
                        'pdc': pdc
                    };

                }


            } catch (error) {
                log.debug({
                    title: 'error in get pay plan allo',
                    details: error
                })
            }
        }


        const getReciptData = (reciptId) => {
            try {
                if (reciptId) {
                    let reciptRec = s.create({
                        type: 'customrecord_ino_re_customer_receipts',
                        columns: [
                            'custrecord_ino_re_cr_date',
                            'custrecord_ino_re_cr_amount_to_apply',
                            'custrecord_ino_re_cr_paymentmethod'
                        ],
                        filters: ['internalid', s.Operator.IS, reciptId],


                    }).run();

                    let searchResult = reciptRec.getRange(0, 1);


                    if (searchResult != null && searchResult != '') {
                        for (var i = 0; i < searchResult.length; i++) {
                            let date = searchResult[i].getValue('custrecord_ino_re_cr_date');
                            let recivedAmt = searchResult[i].getValue('custrecord_ino_re_cr_amount_to_apply');
                            let paymentMethod = searchResult[i].getText('custrecord_ino_re_cr_paymentmethod');


                            return {
                                'date': date,
                                'recivedAmt': recivedAmt,
                                'paymentMethod': paymentMethod
                            }
                        }

                    }
                } else {
                    return {
                        'date': '',
                        'recivedAmt': '',
                        'paymentMethod': ''
                    }
                }



            } catch (errorgetReciptData) {
                log.debug('errorgetReciptData', errorgetReciptData)
            }
        }


        const getCustomerPDCData = (customerPDCId) => {
            try {
                if (customerPDCId) {
                    let reciptRec = s.create({
                        type: 'customrecord_ino_re_customer_pdc',
                        columns: [
                            'custrecord_ino_re_cpdc_date',
                            'custrecord_ino_re_cpdc_amount',
                        ],
                        filters: ['internalid', s.Operator.IS, customerPDCId]

                    }).run();

                    let searchResult = reciptRec.getRange(0, 1);


                    if (searchResult != null && searchResult != '') {

                        for (var i = 0; i < searchResult.length; i++) {
                            let date = searchResult[i].getValue('custrecord_ino_re_cpdc_date');
                            let amount = searchResult[i].getValue('custrecord_ino_re_cpdc_amount');



                            return {
                                'date': date,
                                'amount': amount,
                            }
                        }

                    }


                } else {
                    return {
                        'date': '',
                        'amount': '',
                    }
                }
            } catch (errorgetCustomerPDCData) {
                log.debug('errorgetCustomerPDCData', errorgetCustomerPDCData)
            }
        }


        const getSubsidiaryLogo = (subsidiaryId) => {
            try {

                var srch = s.create({
                    type: 'subsidiary',
                    columns: ['custrecord_ino_re_sub_logo_url'],
                    filters: ['internalid', s.Operator.IS, subsidiaryId]
                }).run();

                var searchResult = srch.getRange(0, 1000);
                if (searchResult != null && searchResult != '') {

                    var logoUrl = searchResult[0].getValue('custrecord_ino_re_sub_logo_url');

                    if (logoUrl) {

                        logoUrl = logoUrl.toString().replace(/&/g, '&amp;');
                        return logoUrl;

                    } else {

                        return '';
                    }

                } else {

                    return '';

                }

            } catch (error) {
                log.debug('error in get subsidiary logo ', error);
            }
        }


        const getAllResults = (s) => {
            var results = s.run();
            var searchResults = [];
            var searchid = 0;
            do {
                var resultslice = results.getRange({
                    start: searchid,
                    end: searchid + 1000
                });
                resultslice.forEach(function (slice) {
                    searchResults.push(slice);
                    searchid++;
                });
            } while (resultslice.length >= 1000);
            return searchResults;
        }


        const numberWithCommas = (x) => {
            try {

                if (x != null && x != "" && x != .00) {
                    if (x) {
                        return (parseFloat(x).toFixed(2)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    } else {
                        return 0;
                    }
                } else {
                    return '0.00';
                }

            } catch (errNumberWithCommas) {
                log.debug('errNumberWithCommas', errNumberWithCommas)
            }
        }


        const getDataFromOtherRecipt = (customerId) => {
            try {

                var transactionSearchObj = s.create({
                    type: "transaction",
                    filters: [
                        ["mainline", "is", "T"],
                        "AND",
                        ["type", "anyof", "CustInvc", "CashSale"],
                        "AND",
                        ["customform", "anyof", "210", "211"],
                        "AND",
                        ["name", "is", customerId]
                    ],
                    columns: [
                        s.createColumn({
                            name: "trandate",
                            label: "Date"
                        }),
                        s.createColumn({
                            name: "type",
                            label: "Type"
                        }),
                        s.createColumn({
                            name: "tranid",
                            label: "Document Number"
                        }),
                        s.createColumn({
                            name: "entity",
                            label: "Name"
                        }),
                        s.createColumn({
                            name: "memo",
                            label: "Memo"
                        }),
                        s.createColumn({
                            name: "amount",
                            label: "Amount"
                        }),
                        s.createColumn({
                            name: "amountremaining",
                            label: "Amount Remaining"
                        }),
                        s.createColumn({
                            name: "custbody11",
                            label: "Cheque #"
                        }),
                        s.createColumn({
                            name: "custbody12",
                            label: "Cheque Date"
                        })
                    ]
                });
                var searchResultCount = transactionSearchObj.runPaged().count;
                log.debug("transactionSearchObj result count", searchResultCount);
                transactionSearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    return true;
                });

            } catch (errGetDataFromOtherRecipt) {
                log.debug('errGetDataFromOtherRecipt', errGetDataFromOtherRecipt)
            }
        }

        const getCustomerStatmentData = (statmentID) => {
            try {
                const statmentRecord = s.create({
                    type: 'customrecord_ino_re_customer_statement',
                    filters: ['internalid', s.Operator.IS, statmentID],
                    columns: ['custrecord_ino_re_cs_customer',
                        'custrecord_ino_re_cs_secondary_customer',
                        'custrecord_ino_re_cs_third_customer',
                        'custrecord_ino_re_cs_fourth_customer',
                        'custrecord_ino_re_cs_fifth_customer',
                        'custrecord_ino_re_cs_subsidiary',
                        'custrecord_ino_re_cs_property',
                        'custrecord_ino_re_cs_include_disclaimer',
                        'custrecord_az_rng_unit_resale',
                        s.createColumn({
                            name: "custrecord_ino_re_prop_cus_stat_disclaim",
                            join: "custrecord_ino_re_cs_property"
                        }),
                    ]
                }).run();
                const searshResult = statmentRecord.getRange(0, 1);
                if (searshResult != null && searshResult != '') {
                    const customer = searshResult[0].getValue('custrecord_ino_re_cs_customer');
                    const secondaryCustomer = searshResult[0].getValue('custrecord_ino_re_cs_secondary_customer');
                    const thirdCustomer = searshResult[0].getValue('custrecord_ino_re_cs_third_customer');
                    const fourthCustomer = searshResult[0].getValue('custrecord_ino_re_cs_fourth_customer');
                    const fifthCustomer = searshResult[0].getValue('custrecord_ino_re_cs_fifth_customer');

                    const subsidiaryId = searshResult[0].getValue('custrecord_ino_re_cs_subsidiary');
                    const propertyId = searshResult[0].getValue('custrecord_ino_re_cs_property');
                    const includeDisclaimer = searshResult[0].getValue('custrecord_ino_re_cs_include_disclaimer');
                    const unitResale = searshResult[0].getValue('custrecord_az_rng_unit_resale');
                    const disclaim = searshResult[0].getValue({
                        name: 'custrecord_ino_re_prop_cus_stat_disclaim',
                        join: 'custrecord_ino_re_cs_property'
                    });

                    return {
                        'customer': customer,
                        'secondaryCustomer': secondaryCustomer,
                        'thirdCustomer': thirdCustomer,
                        'fourthCustomer':fourthCustomer,
                        'fifthCustomer':fifthCustomer,
                        'subsidiaryId': subsidiaryId,
                        'propertyId': propertyId,
                        'includeDisclaimer': includeDisclaimer,
                        'unitResale': unitResale,
                        'disclaim': disclaim
                    }
                } else {
                    return {
                        'customer': '',
                        'secondaryCustomer': '',
                        'thirdCustomer': '',
                        'fourthCustomer':'',
                        'fifthCustomer':'',
                        'subsidiaryId': '',
                        'propertyId': '',
                        'includeDisclaimer': '',
                        'unitResale': '',
                        'disclaim': ''
                    }
                }


            } catch (errorgetCustomerStatmentData) {
                log.debug('errorgetCustomerStatmentData', errorgetCustomerStatmentData)
            }
        }

        const getDataFromUnitResale = (statmentData) => {
            try {
                const unit_resale = statmentData.unitResale;
                if(unit_resale){
                    const unit_resale_obj = s.create({
                        type: 'customrecord_ino_re_unit_resale',
                        filters: [
                            ['internalid', s.Operator.IS, unit_resale], 'AND',
                            ['isinactive', s.Operator.IS, false]
                            ],
                            columns: [
                                s.createColumn({name: 'custrecord_ino_re_ur_current_owner'}),
                                s.createColumn({name: 'custrecord_ino_re_ur_sec_owner'}),
                                s.createColumn({name: 'custrecord_ino_re_ur_third_owner'}),
                                s.createColumn({name: 'custrecord_ino_re_ur_fourth_owner'}),
                                s.createColumn({name: 'custrecord_ino_re_ur_new_purchaser'}),
                                s.createColumn({name: 'custrecord_ino_re_ur_sec_purchaser'}),
                                s.createColumn({name: 'custrecord_ino_re_ur_third_purchaser'}),
                                s.createColumn({name: 'custrecord_ino_re_ur_fourth_purchaser'}),
                                s.createColumn({name: 'custrecord_az_rng_registration_invoice'}),
                                 s.createColumn({name: 'custrecord_ino_re_ur_invoice_no'}),
                                s.createColumn({name: 'custrecord_az_rng_ur_old_reg_invoice'})
                                ]
                    });
                    const unit_resale_data = getAllResults(unit_resale_obj);
                    if(unit_resale_data != null && unit_resale_data!=[]){

                        const current_owner = unit_resale_data[0].getValue('custrecord_ino_re_ur_current_owner');
                        const new_purchaser = unit_resale_data[0].getValue('custrecord_ino_re_ur_new_purchaser');
                        const current_owner_data = getDataFromCustomer(current_owner);
                        const new_purchaser_data = getDataFromCustomer(new_purchaser);
                        
                        const sec_owner = unit_resale_data[0].getValue('custrecord_ino_re_ur_sec_owner');
                        const sec_purchaser = unit_resale_data[0].getValue('custrecord_ino_re_ur_sec_purchaser');
                        const sec_owner_data = ifExist(sec_owner);
                        const sec_purchaser_data = ifExist(sec_purchaser);

                        const third_owner = unit_resale_data[0].getValue('custrecord_ino_re_ur_third_owner');
                        const third_purchaser = unit_resale_data[0].getValue('custrecord_ino_re_ur_third_purchaser');
                        const third_owner_data = ifExist(third_owner);
                        const third_purchaser_data = ifExist(third_purchaser);

                        const fourth_owner = unit_resale_data[0].getValue('custrecord_ino_re_ur_fourth_owner');
                        const fourth_purchaser = unit_resale_data[0].getValue('custrecord_ino_re_ur_fourth_purchaser');
                        const fourth_owner_data = ifExist(fourth_owner);
                        const fourth_purchaser_data = ifExist(fourth_purchaser);

                        const registeration_invoice = unit_resale_data[0].getValue('custrecord_az_rng_registration_invoice');
                        const noc_invoice = unit_resale_data[0].getValue('custrecord_ino_re_ur_invoice_no');
                        const oldregisteration_invoice = unit_resale_data[0].getValue('custrecord_az_rng_ur_old_reg_invoice');


                        return {
                            'current_owner': {
                                name: current_owner_data?.cust || '',
                                address: current_owner_data?.address || ''
                            },
                            'new_purchaser': {
                                name: new_purchaser_data?.cust || '',
                                address: new_purchaser_data?.address || ''
                            },
                            'sec_owner': sec_owner_data?.cust || '',
                            'sec_purchaser': sec_purchaser_data?.cust || '',
                            'third_owner': third_owner_data?.cust || '',
                            'third_purchaser': third_purchaser_data?.cust || '',
                            'fourth_owner': fourth_owner_data?.cust || '',
                            'fourth_purchaser': fourth_purchaser_data?.cust || '',
                            'registeration_invoice': registeration_invoice ? registeration_invoice : '',
                            'noc_invoice': noc_invoice ? noc_invoice : '',
                            'oldregisteration_invoice': oldregisteration_invoice ? oldregisteration_invoice :''
                        };

                    } else {
                        return null;
                    }
                }
            } catch (errgetDataFromUnitResale) {
                log.debug('Error at getDataFromUnitResale: ', errgetDataFromUnitResale);
            }
        };
        
        const ifExist = (customer) => {
            try {
                if(customer){
                    return getDataFromCustomer(customer);
                } else {
                    return null;
                }
            } catch (errifExist) {
                log.debug('errifExist',errifExist);
            }
        };

        const getDataFromRegisterationInv = (invoiceId) => {
            try {
                  let entityName = '';
                  let entityAddr = '';
                const reg_inv_obj = s.create({
                    type: 'invoice',
                    filters: [
                        ['internalid', s.Operator.ANYOF, invoiceId]
                    ],
                    columns: [
                        'tranid',
                        'total',
                        'amountremaining',
                        'entity',
                        s.createColumn({
                            name: 'formulacurrency',
                            formula: '{taxtotal}',
                            label: 'Tax Total'
                        })
                    ]
                });

                const reg_inv = getAllResults(reg_inv_obj);
                if(reg_inv != null && reg_inv!=[]){
                    const invoice_number = reg_inv[0].getValue('tranid');
                    const taxtotal = reg_inv[0].getValue({ name: 'formulacurrency', label: 'Tax Total' });
                    const total = reg_inv[0].getValue('total');
                    const subtotal = total - taxtotal;
                    const vat = ((taxtotal / subtotal) * 100).toFixed(0) + '%';
                    const amountremaining = reg_inv[0].getValue('amountremaining');
                    const entity = reg_inv[0].getValue('entity');
                    if (entity) {
                        const entityData = record.load({
                            type: record.Type.CUSTOMER,
                            id: entity,
                            isDynamic: false
                        });
                     entityName = entityData.getValue('custentity_az_rng_customer_name') || '';
                     entityAddr = entityData.getValue('defaultaddress') || '';
                    }

                    return {
                        'invoice_number': invoice_number,
                        'subtotal': subtotal,
                        'vat': vat,
                        'total': total,
                        'amountremaining': amountremaining,
                        'entityName':entityName,
                        'entityAddr':entityAddr
                    };
                } else {
                    return null;
                }

            } catch (errgetDataFromRegisterationInv) {
                log.debug('Error at getDataFromRegisterationInv',errgetDataFromRegisterationInv);
            }
        };

        const getDataFromNOCInv = (invoiceId) => {
            try {
                const noc_inv_obj = s.create({
                    type: 'invoice',
                    filters: [
                        ['internalid', s.Operator.ANYOF, invoiceId]
                    ],
                    columns: [
                        'tranid',
                        'total',
                        'amountremaining',
                        s.createColumn({
                            name: 'formulacurrency',
                            formula: '{taxtotal}',
                            label: 'Tax Total'
                        })
                    ]
                });

                const noc_inv = getAllResults(noc_inv_obj);
                if(noc_inv != null && noc_inv!=[]){
                    const invoice_number = noc_inv[0].getValue('tranid');
                    const taxtotal = noc_inv[0].getValue({ name: 'formulacurrency', label: 'Tax Total' });
                    const total = noc_inv[0].getValue('total');
                    const subtotal = total - taxtotal;
                    const vat = ((taxtotal / subtotal) * 100).toFixed(0) + '%';
                    const amountremaining = noc_inv[0].getValue('amountremaining');

                    return {
                        'invoice_number': invoice_number,
                        'subtotal': subtotal,
                        'vat': vat,
                        'total': total,
                        'amountremaining': amountremaining
                    };
                } else {
                    return null;
                }

            } catch (errgetDataFromNOCisterationInv) {
                log.debug('Error at getDataFromNOCisterationInv',errgetDataFromNOCisterationInv);
            }
        };

        const escapeXML = (str) => {
            try {
              return str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;");
            } catch (errorescapeXML) {
              log.debug("errorescapeXML", errorescapeXML);
            }
          };
        

        return {
            onRequest: onRequest
        }
    });