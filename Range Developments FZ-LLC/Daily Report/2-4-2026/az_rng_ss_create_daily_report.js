/**
 *@NApiVersion 2.1
*@NScriptType ScheduledScript
*/
define(['N/file', 'N/render', 'N/search', 'N/format', 'N/record','N/runtime'], function (file, render, search, format, record,runtime) {

    const execute = (context) => {
        try {


            const recordId = runtime.getCurrentScript().getParameter({ name: 'custscript_az_rng_ss_record_id' });
            const reportDate = runtime.getCurrentScript().getParameter({ name: 'custscript_az_rng_ss_report_date' });

            let template = '';
            let movmentFile;

            let consolidatedTemplate = '';
            let consolidatedFile;


            let today;
            if (recordId) {
                today = new Date(reportDate);
            } else {
                const todayPrefrence = search.lookupFields({
                    type: 'customrecord_ino_re_property_sales_pref',
                    id: '2',
                    columns: ['custrecord_ino_re_psp_date_format']
                });
                today = new Date(todayPrefrence.custrecord_ino_re_psp_date_format);
            }

           

            // index for days at week (monday =0 ,sunday = 6)
            let dayNumber = new Date(today)
            dayNumber = dayNumber.getDay();

            let yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday = yesterday.toISOString().slice(0, 10);


            const tBHMovment = getSubsidiaryMovmentData(2, dayNumber, yesterday)
            const tBHMovmentData = tBHMovment.objects
            const tBHMovmentTotal = tBHMovment.total
            const tBRMovment = getSubsidiaryMovmentData(3, dayNumber, yesterday)
            const tBRMovmentData = tBRMovment.objects
            const tBRMovmentTotal = tBRMovment.total
            const tBVMovment = getSubsidiaryMovmentData(8, dayNumber, yesterday)
            const tBVMovmentData = tBVMovment.objects
            const tBVMovmentTotal = tBVMovment.total
            const tBlMovment = getSubsidiaryMovmentData(9, dayNumber, yesterday)
            const tBlMovmentData = tBlMovment.objects
            const tBlMovmentTotal = tBlMovment.total

            const tBHCashBalanceData = getCashBalance(2,yesterday)
            const tBRCashBalanceData = getCashBalance(3,yesterday)
            const tBVCashBalanceData = getCashBalance(8,yesterday)
            const tBlCashBalanceData = getCashBalance(9,yesterday)



            // Movment and cash balance file
            template = getMovmentHeader(yesterday, dayNumber)
            template = getMovmentBody(template, tBHMovmentData, tBHMovmentTotal, tBRMovmentData, tBRMovmentTotal, tBVMovmentData, tBVMovmentTotal, tBHCashBalanceData, tBRCashBalanceData, tBVCashBalanceData, tBlCashBalanceData, yesterday, tBlMovmentData, tBlMovmentTotal)
            movmentFile = savePdfFile(template, 'Movment_and_Cash Balances_', 21072, yesterday)



            const dailySalesDate = getDailySalesData();

            //Projects sales file
            template = getSalesHeader(yesterday)
            template = getSalesBody(template, dailySalesDate)
            const salesFile = savePdfFile(template, 'Project_Sales_', 21073, yesterday)


            if (dayNumber == 0) {

                let todayDate = new Date(today);

                // Last Sunday
                let lastSunday = new Date(todayDate);
                lastSunday.setDate(todayDate.getDate() - 1);

                // Last Monday
                let lastMonday = new Date(todayDate);
                lastMonday.setDate(todayDate.getDate() - 7);

                // Format to YYYY-MM-DD
                let startDate = lastMonday.toISOString().slice(0, 10);
                let endDate = lastSunday.toISOString().slice(0, 10);

            
                const tBHConsolidated = getSubsidiaryConsolidatedData(2,endDate)
                const tBHConsolidatedData = tBHConsolidated.objects
                const tBHConsolidatedTotal = tBHConsolidated.total
                const tBRConsolidated = getSubsidiaryConsolidatedData(3,endDate)
                const tBRConsolidatedData = tBRConsolidated.objects
                const tBRConsolidatedTotal = tBRConsolidated.total
                const tBVConsolidated = getSubsidiaryConsolidatedData(8,endDate)
                const tBVConsolidatedData = tBVConsolidated.objects
                const tBVConsolidatedTotal = tBVConsolidated.total
                const tBlConsolidated = getSubsidiaryConsolidatedData(9,endDate)
                const tBlConsolidatedData = tBlConsolidated.objects
                const tBlConsolidatedTotal = tBlConsolidated.total

                // consolidated report file
                consolidatedTemplate = getConsolidatedHeader(endDate,startDate)
                consolidatedTemplate = getConsolidatedBody(consolidatedTemplate, tBHConsolidatedData, tBHConsolidatedTotal, tBRConsolidatedData, tBRConsolidatedTotal, tBVConsolidatedData, tBVConsolidatedTotal, tBlConsolidatedData, tBlConsolidatedTotal)
                consolidatedFile = savePdfFile(consolidatedTemplate, 'Weekly_Receipts_Movement_', 88363, endDate)
            }
            
            if (recordId) {

                record.submitFields({
                    type: 'customrecord_az_rng_daily_reports',
                    id: recordId,
                    values: {
                        "custrecord_az_rng_drep_move_cash_balance": movmentFile,
                        "custrecord_az_rng_drep_projects_sales": salesFile,
                        "custrecord_az_rng_dr_consolidated_report":consolidatedFile
                    }
                });

            } else {
                CreateDailyReportRecord(movmentFile, salesFile,consolidatedFile);
            }

        } catch (error) {
            log.debug('Error executing', error)
        }
    }

    const getMovmentHeader = (date, dayNumber) => {
        try {
            let template = '';
            template += '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">'
            template += '<pdf>'
            template += '<head>'
            template += '<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />'
            template += '<macrolist>'
            template += '<macro id="nlheader">'
            if (dayNumber == 0) {
                template += `<p align="center">Daily Movment from ${subtractDaysFromString(date, 2)} to ${date}</p>`
            } else {
                template += `<p align="center">Daily Movment Of ${date}</p>`
            }
            template += '</macro>'
            template += '<macro id="nllastheader">'
            template += `<p align="center">Cash Balance as of ${date}</p>`
            template += '</macro>'
            template += '<macro id="nlfooter">'
            template += '</macro>'
            template += '</macrolist>'
            template += '<style>'
            template += '* {'
            template += 'font-family: NotoSans, sans-serif;'
            template += '}'
            template += 'table {'
            template += 'font-size: 9pt;'
            template += 'table-layout: fixed;'
            template += '}'
            template += 'th {'
            template += 'font-weight: bold;'
            template += 'font-size: 8pt;'
            template += 'vertical-align: middle;'
            template += 'padding: 5px 6px 3px;'
            template += 'background-color: #e3e3e3;'
            template += 'color: #333333;'
            template += 'border-top:1px;'
            template += 'border-left:1px;'
            template += 'border-bottom:1px;'
            template += 'border-bottom:1px;'
            template += '}'
            template += 'td {'
            template += 'border-left:1px;'
            template += 'border-bottom:1px;'
            template += '}'
            template += 'td p { align:center }'
            template += 'th p { align:center }'
            template += '#page1 { header:nlheader; header-height:8%; }'
            template += '#last { header: nllastheader; header-height:8%; }'
            template += '</style>'
            template += '</head>'
            template += '<body padding="0.5in 0.5in 0.5in 0.5in" size="Letter">'

            return template;
        } catch (errGetHeader) {
            log.debug('errGetMovmentHeader', errGetHeader)
        }

    }

    const getMovmentBody = (template, tBHData, tBHTotal, tBRData, tBRTotal, tBVData, tBVTotal, tBHBalance, tBRBalance, tBVBalance, tBlBalance, date, tBlData, tBlTotal) => {
        try {
            //table 1 (Beach House)
            {

                template += `
                            <table style="width: 100%;padding-bottom:25px;">
                            <tr>
                            <td colspan="7" style="background-color: #e3e3e3;color: #333333;border-right:1px;border-top:1px;border-bottom:0px;align:center;">The Beach House</td>
                            </tr>
                            <tr>
                            <th style="width: 5%">Unit</th>
                            <th style="width: 20%">Customer</th>
                            <th style="width: 20%">Sales Person</th>
                            <th style="width: 22%">Broker</th>
                            <th style="width: 13%">Sum of Payments Amount</th>
                            <th style="width: 14%">Payment Method</th>
                            <th style="width: 6%;border-right:1px;">Account Name</th>
                            </tr>`
                if (tBHData.length == 0) {
                    template += '<tr><td style="border-right:1px;" colspan="7">No Movment For The Day</td></tr>';
                } else {
                    tBHData.forEach(object => {
                        template += `<tr>
                                    <td>${object.unit}</td>
                                    <td>${escapeXML(object.customer)}</td>
                                    <td>${escapeXML(object.salesRep)}</td>
                                    <td>${escapeXML(object.broker)}</td>
                                    <td>${numberWithCommas(object.paymentAmount)}</td>
                                    <td>${escapeXML(object.paymentMethod)}</td>
                                    <td style="border-right:1px;">${escapeXML(object.accountName)}</td>
                                    </tr>`;
                    });
                }
                template += `
                                <tr>
                                    <td style="align:left;font-weight: bold;">Total</td>
                                    <td style="border-left:0px;align:right;font-weight: bold;" colspan="4">${numberWithCommas(tBHTotal)}</td>
                                    <td style="border-left:0px;border-right:0px;"></td>
                                    <td style="border-left:0px;border-right:1px;"></td>
                                </tr>
                            </table>`

            }

            //table 2 (Beach Residences)
            {

                template += `
                            <table style="width: 100%;padding-bottom:25px;">
                            <tr>
                            <td colspan="7" style="background-color: #e3e3e3;color: #333333;border-right:1px;border-top:1px;border-bottom:0px;align:center;">The Beach Residences</td>
                            </tr>
                            <tr>
                            <th style="width: 5%">Unit</th>
                            <th style="width: 20%">Customer</th>
                            <th style="width: 20%">Sales Person</th>
                            <th style="width: 22%">Broker</th>
                            <th style="width: 13%">Sum of Payments Amount</th>
                            <th style="width: 14%;">Payment Method</th>
                            <th style="width: 6%;border-right:1px;">Account Name</th>
                            </tr>`
                if (tBRData.length == 0) {
                    template += '<tr><td style="border-right:1px;" colspan="7">No Movment For The Day</td></tr>';
                } else {
                    tBRData.forEach(object => {
                        template += `<tr>
                                    <td>${object.unit}</td>
                                    <td>${escapeXML(object.customer)}</td>
                                    <td>${escapeXML(object.salesRep)}</td>
                                    <td>${escapeXML(object.broker)}</td>
                                    <td>${numberWithCommas(object.paymentAmount)}</td>
                                    <td>${escapeXML(object.paymentMethod)}</td>
                                    <td style="border-right:1px;">${escapeXML(object.accountName)}</td>
                                    </tr>`;
                    });
                }
                template += `
                                <tr>
                                    <td style="align:left;font-weight: bold;">Total</td>
                                    <td style="border-left:0px;align:right;font-weight: bold;" colspan="4">${numberWithCommas(tBRTotal)}</td>
                                    <td style="border-left:0px;border-right:0px;"></td>
                                    <td style="border-left:0px;border-right:1px;"></td>
                                </tr>
                            </table>`

            }

            //table 3 (Beach Vista)
            {
                template += `
                            <table style="width: 100%;padding-bottom:25px;">
                            <tr>
                            <td colspan="7" style="background-color: #e3e3e3;color: #333333;border-right:1px;border-top:1px;border-bottom:0px;align:center;">The Beach Vista</td>
                            </tr>
                            <tr>
                            <th style="width: 5%">Unit</th>
                            <th style="width: 20%">Customer</th>
                            <th style="width: 20%">Sales Person</th>
                            <th style="width: 22%">Broker</th>
                            <th style="width: 13%">Sum of Payments Amount</th>
                            <th style="width: 14%">Payment Method</th>
                            <th style="width: 6%;border-right:1px;">Account Name</th>
                            </tr>`
                if (tBVData.length == 0) {
                    template += '<tr><td style="border-right:1px;" colspan="7">No Movment For The Day</td></tr>';
                } else {
                    tBVData.forEach(object => {
                        template += `<tr>
                                    <td>${object.unit}</td>
                                    <td>${escapeXML(object.customer)}</td>
                                    <td>${escapeXML(object.salesRep)}</td>
                                    <td>${escapeXML(object.broker)}</td>
                                    <td>${numberWithCommas(object.paymentAmount)}</td>
                                    <td>${escapeXML(object.paymentMethod)}</td>
                                    <td style="border-right:1px;">${escapeXML(object.accountName)}</td>
                                    </tr>`;
                    });
                }
                template += `
                                <tr>
                                    <td style="align:left;font-weight: bold;">Total</td>
                                    <td style="border-left:0px;align:right;font-weight: bold;" colspan="4">${numberWithCommas(tBVTotal)}</td>
                                    <td style="border-left:0px;border-right:0px;"></td>
                                    <td style="border-left:0px;border-right:1px;"></td>
                                </tr>
                            </table>`

            }
            //table 4 (Island Heights)
            {
                template += `
                            <table style="width: 100%;padding-bottom:25px;">
                            <tr>
                            <td colspan="7" style="background-color: #e3e3e3;color: #333333;border-right:1px;border-top:1px;border-bottom:0px;align:center;">Island Heights</td>
                            </tr>
                            <tr>
                            <th style="width: 5%">Unit</th>
                            <th style="width: 20%">Customer</th>
                            <th style="width: 20%">Sales Person</th>
                            <th style="width: 22%">Broker</th>
                            <th style="width: 13%">Sum of Payments Amount</th>
                            <th style="width: 14%">Payment Method</th>
                            <th style="width: 6%;border-right:1px;">Account Name</th>
                            </tr>`
                if (tBlData.length == 0) {
                    template += '<tr><td style="border-right:1px;" colspan="7">No Movment For The Day</td></tr>';
                } else {
                    tBlData.forEach(object => {
                        template += `<tr>
                                    <td>${object.unit}</td>
                                    <td>${escapeXML(object.customer)}</td>
                                    <td>${escapeXML(object.salesRep)}</td>
                                    <td>${escapeXML(object.broker)}</td>
                                    <td>${numberWithCommas(object.paymentAmount)}</td>
                                    <td>${escapeXML(object.paymentMethod)}</td>
                                    <td style="border-right:1px;">${escapeXML(object.accountName)}</td>
                                    </tr>`;
                    });
                }
                template += `
                                <tr>
                                    <td style="align:left;font-weight: bold;">Total</td>
                                    <td style="border-left:0px;align:right;font-weight: bold;" colspan="4">${numberWithCommas(tBlTotal)}</td>
                                    <td style="border-left:0px;border-right:0px;"></td>
                                    <td style="border-left:0px;border-right:1px;"></td>
                                </tr>
                            </table>`

            }

            template += `<pbr header="nllastheader" header-height="8%"/>`
            template += `<div>`
            template += `<p style = "font-size: 10pt;">Please find the cash balances as of ${date}:</p>`
            //Beach House Cash Balance Tables
            {
                tBHBalance.forEach((result) => {
                    template += `<table style="width: 100%;padding-bottom:25px;">
                                <tr>
                                <td colspan="3" style="border-top:1px;border-right:1px;font-weight: bold;">Beach House-Balances as of ${date}</td>
                                </tr>
                                <tr>
                                <td style="font-weight: bold;">Cash In (${result.currency})</td>
                                <td style="font-weight: bold;">Cash Out (${result.currency})</td>
                                <td style="border-right:1px;font-weight: bold;">Balance (${result.currency})</td>
                                </tr>
                                <tr>
                                <td>${numberWithCommas(result.cashIn)}</td>
                                <td>${numberWithCommas(result.cashOut)}</td>
                                <td style="border-right:1px;">${numberWithCommas(result.balance)}</td>
                                </tr>
                                </table>`
                });
            }
            //Beach Residences Cash Balance Tables
            {
                tBRBalance.forEach((result) => {
                    template += `<table style="width: 100%;padding-bottom:25px;">
                                <tr>
                                <td colspan="3" style="border-top:1px;border-right:1px;font-weight: bold;">Beach Residences-Balances as of  ${date}</td>
                                </tr>
                                <tr>
                                <td style="font-weight: bold;">Cash In (${result.currency})</td>
                                <td style="font-weight: bold;">Cash Out (${result.currency})</td>
                                <td style="border-right:1px;font-weight: bold;">Balance (${result.currency})</td>
                                </tr>
                                <tr>
                                <td>${numberWithCommas(result.cashIn)}</td>
                                <td>${numberWithCommas(result.cashOut)}</td>
                                <td style="border-right:1px;">${numberWithCommas(result.balance)}</td>
                                </tr>
                                </table>`
                });
            }

            //Beach Vista Cash Balance Tables
            {
                tBVBalance.forEach((result) => {
                    template += `<table style="width: 100%;padding-bottom:25px;">
                                <tr>
                                <td colspan="3" style="border-top:1px;border-right:1px;font-weight: bold;">Beach Vista-Balances as of ${date}</td>
                                </tr>
                                <tr>
                                <td style="font-weight: bold;">Cash In (${result.currency})</td>
                                <td style="font-weight: bold;">Cash Out (${result.currency})</td>
                                <td style="border-right:1px;font-weight: bold;">Balance (${result.currency})</td>
                                </tr>
                                <tr>
                                <td>${numberWithCommas(result.cashIn)}</td>
                                <td>${numberWithCommas(result.cashOut)}</td>
                                <td style="border-right:1px;">${numberWithCommas(result.balance)}</td>
                                </tr>
                                </table>`
                });
            }
            //Island Heights Cash Balance Tables
            {
                tBlBalance.forEach((result) => {
                    template += `<table style="width: 100%;padding-bottom:25px;">
                                <tr>
                                <td colspan="3" style="border-top:1px;border-right:1px;font-weight: bold;">Island Heights-Balances as of ${date}</td>
                                </tr>
                                <tr>
                                <td style="font-weight: bold;">Cash In (${result.currency})</td>
                                <td style="font-weight: bold;">Cash Out (${result.currency})</td>
                                <td style="border-right:1px;font-weight: bold;">Balance (${result.currency})</td>
                                </tr>
                                <tr>
                                <td>${numberWithCommas(result.cashIn)}</td>
                                <td>${numberWithCommas(result.cashOut)}</td>
                                <td style="border-right:1px;">${numberWithCommas(result.balance)}</td>
                                </tr>
                                </table>`
                });
            }
            template += `</div>`;
            return template;
        } catch (error) {
            log.debug('errorGetMovmentBody', error)
        }
    }

    const getConsolidatedHeader = (endDate,startDate) => {
        try {
            let template = '';
            template += '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">'
            template += '<pdf>'
            template += '<head>'
            template += '<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />'
            template += '<macrolist>'
            template += '<macro id="nlheader">'
            template += `<p align="center">Weekly Receipts Movement from ${startDate} to ${endDate}</p>`
            template += '</macro>'
            template += '<macro id="nlfooter">'
            template += '</macro>'
            template += '</macrolist>'
            template += '<style>'
            template += '* {'
            template += 'font-family: NotoSans, sans-serif;'
            template += '}'
            template += 'table {'
            template += 'font-size: 9pt;'
            template += 'table-layout: fixed;'
            template += '}'
            template += 'th {'
            template += 'font-weight: bold;'
            template += 'font-size: 8pt;'
            template += 'vertical-align: middle;'
            template += 'padding: 5px 6px 3px;'
            template += 'background-color: #e3e3e3;'
            template += 'color: #333333;'
            template += 'border-top:1px;'
            template += 'border-left:1px;'
            template += 'border-bottom:1px;'
            template += 'border-bottom:1px;'
            template += '}'
            template += 'td {'
            template += 'border-left:1px;'
            template += 'border-bottom:1px;'
            template += '}'
            template += 'td p { align:center }'
            template += 'th p { align:center }'
            template += '#page1 { header:nlheader; header-height:8%; }'           
            template += '</style>'
            template += '</head>'
            template += '<body padding="0.5in 0.5in 0.5in 0.5in" size="Letter">'

            return template;
        } catch (errGetHeader) {
            log.debug('errGetConsolidatedHeader', errGetHeader)
        }

    }

    const getConsolidatedBody = (template, tBHData, tBHTotal, tBRData, tBRTotal, tBVData, tBVTotal,tBlData, tBlTotal) => {
        try {
            //table 1 (Beach House)
            {

                template += `
                            <table style="width: 100%;padding-bottom:25px;">
                            <tr>
                            <td colspan="7" style="background-color: #e3e3e3;color: #333333;border-right:1px;border-top:1px;border-bottom:0px;align:center;">The Beach House</td>
                            </tr>
                            <tr>
                            <th style="width: 5%">Unit</th>
                            <th style="width: 20%">Customer</th>
                            <th style="width: 20%">Sales Person</th>
                            <th style="width: 22%">Broker</th>
                            <th style="width: 13%">Sum of Payments Amount</th>
                            <th style="width: 14%">Payment Method</th>
                            <th style="width: 6%;border-right:1px;">Account Name</th>
                            </tr>`
                if (tBHData.length == 0) {
                    template += '<tr><td style="border-right:1px;" colspan="7">No Movment For The Day</td></tr>';
                } else {
                    tBHData.forEach(object => {
                        template += `<tr>
                                    <td>${object.unit}</td>
                                    <td>${escapeXML(object.customer)}</td>
                                    <td>${escapeXML(object.salesRep)}</td>
                                    <td>${escapeXML(object.broker)}</td>
                                    <td>${numberWithCommas(object.paymentAmount)}</td>
                                    <td>${escapeXML(object.paymentMethod)}</td>
                                    <td style="border-right:1px;">${escapeXML(object.accountName)}</td>
                                    </tr>`;
                    });
                }
                template += `
                                <tr>
                                    <td style="align:left;font-weight: bold;">Total</td>
                                    <td style="border-left:0px;align:right;font-weight: bold;" colspan="4">${numberWithCommas(tBHTotal)}</td>
                                    <td style="border-left:0px;border-right:0px;"></td>
                                    <td style="border-left:0px;border-right:1px;"></td>
                                </tr>
                            </table>`

            }

            //table 2 (Beach Residences)
            {

                template += `
                            <table style="width: 100%;padding-bottom:25px;">
                            <tr>
                            <td colspan="7" style="background-color: #e3e3e3;color: #333333;border-right:1px;border-top:1px;border-bottom:0px;align:center;">The Beach Residences</td>
                            </tr>
                            <tr>
                            <th style="width: 5%">Unit</th>
                            <th style="width: 20%">Customer</th>
                            <th style="width: 20%">Sales Person</th>
                            <th style="width: 22%">Broker</th>
                            <th style="width: 13%">Sum of Payments Amount</th>
                            <th style="width: 14%;">Payment Method</th>
                            <th style="width: 6%;border-right:1px;">Account Name</th>
                            </tr>`
                if (tBRData.length == 0) {
                    template += '<tr><td style="border-right:1px;" colspan="7">No Movment For The Day</td></tr>';
                } else {
                    tBRData.forEach(object => {
                        template += `<tr>
                                    <td>${object.unit}</td>
                                    <td>${escapeXML(object.customer)}</td>
                                    <td>${escapeXML(object.salesRep)}</td>
                                    <td>${escapeXML(object.broker)}</td>
                                    <td>${numberWithCommas(object.paymentAmount)}</td>
                                    <td>${escapeXML(object.paymentMethod)}</td>
                                    <td style="border-right:1px;">${escapeXML(object.accountName)}</td>
                                    </tr>`;
                    });
                }
                template += `
                                <tr>
                                    <td style="align:left;font-weight: bold;">Total</td>
                                    <td style="border-left:0px;align:right;font-weight: bold;" colspan="4">${numberWithCommas(tBRTotal)}</td>
                                    <td style="border-left:0px;border-right:0px;"></td>
                                    <td style="border-left:0px;border-right:1px;"></td>
                                </tr>
                            </table>`

            }

            //table 3 (Beach Vista)
            {
                template += `
                            <table style="width: 100%;padding-bottom:25px;">
                            <tr>
                            <td colspan="7" style="background-color: #e3e3e3;color: #333333;border-right:1px;border-top:1px;border-bottom:0px;align:center;">The Beach Vista</td>
                            </tr>
                            <tr>
                            <th style="width: 5%">Unit</th>
                            <th style="width: 20%">Customer</th>
                            <th style="width: 20%">Sales Person</th>
                            <th style="width: 22%">Broker</th>
                            <th style="width: 13%">Sum of Payments Amount</th>
                            <th style="width: 14%">Payment Method</th>
                            <th style="width: 6%;border-right:1px;">Account Name</th>
                            </tr>`
                if (tBVData.length == 0) {
                    template += '<tr><td style="border-right:1px;" colspan="7">No Movment For The Day</td></tr>';
                } else {
                    tBVData.forEach(object => {
                        template += `<tr>
                                    <td>${object.unit}</td>
                                    <td>${escapeXML(object.customer)}</td>
                                    <td>${escapeXML(object.salesRep)}</td>
                                    <td>${escapeXML(object.broker)}</td>
                                    <td>${numberWithCommas(object.paymentAmount)}</td>
                                    <td>${escapeXML(object.paymentMethod)}</td>
                                    <td style="border-right:1px;">${escapeXML(object.accountName)}</td>
                                    </tr>`;
                    });
                }
                template += `
                                <tr>
                                    <td style="align:left;font-weight: bold;">Total</td>
                                    <td style="border-left:0px;align:right;font-weight: bold;" colspan="4">${numberWithCommas(tBVTotal)}</td>
                                    <td style="border-left:0px;border-right:0px;"></td>
                                    <td style="border-left:0px;border-right:1px;"></td>
                                </tr>
                            </table>`

            }
            //table 4 (Island Heights)
            {
                template += `
                            <table style="width: 100%;padding-bottom:25px;">
                            <tr>
                            <td colspan="7" style="background-color: #e3e3e3;color: #333333;border-right:1px;border-top:1px;border-bottom:0px;align:center;">Island Heights</td>
                            </tr>
                            <tr>
                            <th style="width: 5%">Unit</th>
                            <th style="width: 20%">Customer</th>
                            <th style="width: 20%">Sales Person</th>
                            <th style="width: 22%">Broker</th>
                            <th style="width: 13%">Sum of Payments Amount</th>
                            <th style="width: 14%">Payment Method</th>
                            <th style="width: 6%;border-right:1px;">Account Name</th>
                            </tr>`
                if (tBlData.length == 0) {
                    template += '<tr><td style="border-right:1px;" colspan="7">No Movment For The Day</td></tr>';
                } else {
                    tBlData.forEach(object => {
                        template += `<tr>
                                    <td>${object.unit}</td>
                                    <td>${escapeXML(object.customer)}</td>
                                    <td>${escapeXML(object.salesRep)}</td>
                                    <td>${escapeXML(object.broker)}</td>
                                    <td>${numberWithCommas(object.paymentAmount)}</td>
                                    <td>${escapeXML(object.paymentMethod)}</td>
                                    <td style="border-right:1px;">${escapeXML(object.accountName)}</td>
                                    </tr>`;
                    });
                }
                template += `
                                <tr>
                                    <td style="align:left;font-weight: bold;">Total</td>
                                    <td style="border-left:0px;align:right;font-weight: bold;" colspan="4">${numberWithCommas(tBlTotal)}</td>
                                    <td style="border-left:0px;border-right:0px;"></td>
                                    <td style="border-left:0px;border-right:1px;"></td>
                                </tr>
                            </table>`

            }
            return template;
        } catch (error) {
            log.debug('errorGetConsolidatedBody', error)
        }
    }
    const getSalesHeader = (date) => {
        try {
            let template = '';
            template += '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">'
            template += '<pdf>'
            template += '<head>'
            template += '<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />'
            template += '<macrolist>'
            template += '<macro id="nlheader">'
            template += `<p align="center">Daily Sales Of ${date}</p>`
            template += '</macro>'
            template += '<macro id="nlfooter">'
            template += '</macro>'
            template += '</macrolist>'
            template += '<style>'
            template += '* {'
            template += 'font-family: NotoSans, sans-serif;'
            template += '}'
            template += 'table {'
            template += 'font-size: 9pt;'
            template += 'table-layout: fixed;'
            template += '}'
            template += 'th {'
            template += 'font-weight: bold;'
            template += 'font-size: 8pt;'
            template += 'vertical-align: middle;'
            template += 'padding: 5px 6px 3px;'
            template += 'background-color: #e3e3e3;'
            template += 'color: #333333;'
            template += 'border-top:1px;'
            template += 'border-left:1px;'
            template += 'border-bottom:1px;'
            template += 'align:center;'
            template += '}'
            template += 'td {'
            template += 'border-left:1px;'
            template += 'border-bottom:1px;'
            template += 'align:center;'
            template += '}'
            template += 'td p {align:left;}'
            template += 'th p {}'
            template += '</style>'
            template += '</head>'
            template += '<body header="nlheader" header-height="10%" footer="nlfooter" footer-height="5%" padding="0.5in 0.5in 0.5in 0.5in" size="Letter">'

            return template;
        } catch (error) {
            log.debug('errGetSalesHeader', error)
        }

    }

    const getSalesBody = (template, salesData) => {
        try {
            //table 1 (Beach House)
            {

                template += `
                            <table style="width: 100%;padding-bottom:25px;">
                            <tr>
                            <td colspan="6" style="background-color: #e3e3e3;color: #333333;border-right:1px;border-top:1px;border-bottom:0px;align:center;">The Beach House-New Units</td>
                            </tr>
                            <tr>
                            <th style="width:10%">Unit</th>
                            <th style="width:16%">View</th>
                            <th style="width:16%">Customer</th>
                            <th style="width:16%">Sales Rep</th>
                            <th style="width:22%">Broker</th> style="width:"
                            <th style="border-right:1px;width:20%">Agreed Price</th>
                            </tr>
                            `
                if (salesData.beachHouse.data.length == 0) {
                    template += '<tr><td style="border-right:1px;align:center;" colspan="6">No New Sold Units For Today</td></tr>';
                } else {
                    salesData.beachHouse.data.forEach(object => {
                        template += `<tr>
                                    <td>${escapeXML(object.unit)}</td>
                                    <td>${escapeXML(object.view)}</td>
                                    <td>${escapeXML(object.customer)}</td>
                                    <td>${escapeXML(object.salesRep)}</td>
                                    <td>${escapeXML(object.broker)}</td>
                                    <td style="border-right:1px;">${numberWithCommas(object.price)}</td>
                                    </tr>`;
                    });

                }
                template += `
                                <tr>
                                    <td style="border-right:1px;align:center;" colspan="6">
                                        <span style="padding-right:15px;"><b>New Sold Units:</b> ${salesData.beachHouse.data.length}</span>
                                        <span style="padding-right:15px;"><b>New Sales Amt:</b> ${numberWithCommas(salesData.beachHouse.newTotal)}</span>
                                        <span style="padding-right:15px;"><b>Total Sold Units:</b> ${salesData.beachHouse.count}</span>
                                        <span style="padding-right:15px;align:right;"><b>Total Sales Amt:</b> ${numberWithCommas(salesData.beachHouse.total)}</span>
                                    </td>
                                </tr>
                            </table>`;

            }
            //table 2 (Beach Residences)
            {

                template += `
                            <table style="width: 100%;padding-bottom:25px;">
                            <tr>
                            <td colspan="6" style="background-color: #e3e3e3;color: #333333;border-right:1px;border-top:1px;border-bottom:0px;align:center;">The Beach Residences-New Units</td>
                            </tr>
                            <tr>
                            <th style="width:10%">Unit</th>
                            <th style="width:16%">View</th>
                            <th style="width:16%">Customer</th>
                            <th style="width:16%">Sales Rep</th>
                            <th style="width:22%">Broker</th>
                            <th style="border-right:1px;width:20%">Agreed Price</th>
                            </tr>
                            `
                if (salesData.beachResidences.data.length == 0) {
                    template += '<tr><td style="border-right:1px;align:center;" colspan="6">No New Sold Units For Today</td></tr>';
                } else {
                    salesData.beachResidences.data.forEach(object => {
                        template += `<tr>
                                    <td>${escapeXML(object.unit)}</td>
                                    <td>${escapeXML(object.view)}</td>
                                    <td>${escapeXML(object.customer)}</td>
                                    <td>${escapeXML(object.salesRep)}</td>
                                    <td>${escapeXML(object.broker)}</td>
                                    <td style="border-right:1px;align:right;">${numberWithCommas(object.price)}</td>
                                    </tr>`;
                    });

                }
                template += `
                                <tr>
                                    <td style="border-right:1px;align:center;" colspan="6">
                                        <span style="padding-right:15px;"><b>New Sold Units:</b> ${salesData.beachResidences.data.length}</span>
                                        <span style="padding-right:15px;"><b>New Sales Amt:</b> ${numberWithCommas(salesData.beachResidences.newTotal)}</span>
                                        <span style="padding-right:15px;"><b>Total Sold Units:</b> ${salesData.beachResidences.count}</span>
                                        <span style="padding-right:15px;"><b>Total Sales Amt:</b> ${numberWithCommas(salesData.beachResidences.total)}</span>
                                    </td>
                                </tr>
                            </table>`;

            }
            //table 3 (Beach Vista)
            {

                template += `
                            <table style="width: 100%;padding-bottom:25px;">
                            <tr>
                            <td colspan="6" style="background-color: #e3e3e3;color: #333333;border-right:1px;border-top:1px;border-bottom:0px;align:center;">The Beach Vista-New Units</td>
                            </tr>
                            <tr>
                            <th style="width:10%">Unit</th>
                            <th style="width:16%">View</th>
                            <th style="width:16%">Customer</th>
                            <th style="width:16%">Sales Rep</th>
                            <th style="width:22%">Broker</th> style="width:"
                            <th style="border-right:1px;width:20%">Agreed Price</th>
                            </tr>
                            `
                if (salesData.beachVista.data.length == 0) {
                    template += '<tr><td style="border-right:1px;align:center;" colspan="6">No New Sold Units For Today</td></tr>';
                } else {
                    salesData.beachVista.data.forEach(object => {
                        template += `<tr>
                                    <td>${escapeXML(object.unit)}</td>
                                    <td>${escapeXML(object.view)}</td>
                                    <td>${escapeXML(object.customer)}</td>
                                    <td>${escapeXML(object.salesRep)}</td>
                                    <td>${escapeXML(object.broker)}</td>
                                    <td style="border-right:1px;align:right;">${numberWithCommas(object.price)}</td>
                                    </tr>`;
                    });

                }
                template += `
                                <tr>
                                    <td style="border-right:1px;align:center;" colspan="6">
                                        <span style="padding-right:15px;"><b>New Sold Units:</b> ${salesData.beachVista.data.length}</span>
                                        <span style="padding-right:15px;"><b>New Sales Amt:</b> ${numberWithCommas(salesData.beachVista.newTotal)}</span>
                                        <span style="padding-right:15px;"><b>Total Sold Units:</b> ${salesData.beachVista.count}</span>
                                        <span style="padding-right:15px;"><b>Total Sales Amt:</b> ${numberWithCommas(salesData.beachVista.total)}</span>
                                    </td>
                                </tr>
                            </table>`;

            }

            //table 4 (Island Heights)
            {

                template += `
                            <table style="width: 100%;padding-bottom:25px;">
                            <tr>
                            <td colspan="6" style="background-color: #e3e3e3;color: #333333;border-right:1px;border-top:1px;border-bottom:0px;align:center;">Island Heights-New Units</td>
                            </tr>
                            <tr>
                            <th style="width:10%">Unit</th>
                            <th style="width:16%">View</th>
                            <th style="width:16%">Customer</th>
                            <th style="width:16%">Sales Rep</th>
                            <th style="width:22%">Broker</th> style="width:"
                            <th style="border-right:1px;width:20%">Agreed Price</th>
                            </tr>
                            `
                if (salesData.islandHeights.data.length == 0) {
                    template += '<tr><td style="border-right:1px;align:center;" colspan="6">No New Sold Units For Today</td></tr>';
                } else {
                    salesData.islandHeights.data.forEach(object => {
                        template += `<tr>
                                    <td>${escapeXML(object.unit)}</td>
                                    <td>${escapeXML(object.view)}</td>
                                    <td>${escapeXML(object.customer)}</td>
                                    <td>${escapeXML(object.salesRep)}</td>
                                    <td>${escapeXML(object.broker)}</td>
                                    <td style="border-right:1px;align:right;">${numberWithCommas(object.price)}</td>
                                    </tr>`;
                    });

                }
                template += `
                                <tr>
                                    <td style="border-right:1px;align:center;" colspan="6">
                                        <span style="padding-right:15px;"><b>New Sold Units:</b> ${salesData.islandHeights.data.length}</span>
                                        <span style="padding-right:15px;"><b>New Sales Amt:</b> ${numberWithCommas(salesData.islandHeights.newTotal)}</span>
                                        <span style="padding-right:15px;"><b>Total Sold Units:</b> ${salesData.islandHeights.count}</span>
                                        <span style="padding-right:15px;"><b>Total Sales Amt:</b> ${numberWithCommas(salesData.islandHeights.total)}</span>
                                    </td>
                                </tr>
                            </table>`;

            }
            return template;
        } catch (error) {
            log.debug('errorGetSalesBody', error)
        }
    }

    const savePdfFile = (template, fileName, FolderId, date) => {
        try {
            template += '</body>';
            template += '</pdf>';

            const renderer = render.create();
            renderer.templateContent = template;

            // Generate the PDF
            const pdfFile = renderer.renderAsPdf();
            const pdfContent = pdfFile.getContents();

            // Save the PDF to the File Cabinet
            const myFile = file.create({
                name: fileName + date + '.pdf',
                fileType: file.Type.PDF,
                contents: pdfContent,
                folder: FolderId,
            });

            const fileId = myFile.save();
            return fileId;
        } catch (error) {
            log.debug('errorSavePdfFile', error)
        }
    }

    const getSubsidiaryMovmentData = (subsidiaryId, dayNumber, yesterday) => {
        try {
            const objects = [];
            let total = 0;

            let filter = ''

            if (dayNumber == 0) {
                filter =
                    [
                        // from three days ago to yesterday
                        // this case happens on monday and it gets data for Friday, Saturday and +
                        ["custrecord_ino_re_ppa_customerreceipt.custrecord_ino_re_cr_date", "within", subtractDaysFromString(yesterday, 2), yesterday],
                        "AND",
                        ["custrecord_ino_re_ppa_subs", "anyof", subsidiaryId]
                    ]
            } else {
                filter =
                    [
                        ["custrecord_ino_re_ppa_customerreceipt.custrecord_ino_re_cr_date", "on", "yesterday"],
                        "AND",
                        ["custrecord_ino_re_ppa_subs", "anyof", subsidiaryId]
                    ]
            }


            const allocationSearchObj = search.create({
                type: "customrecord_ino_re_pmt_plan_allocation",
                filters: filter,
                columns:
                    [
                        search.createColumn({
                            name: "custrecord_ino_re_ppa_unit",
                            summary: "GROUP",
                            label: "Unit"
                        }),
                        search.createColumn({
                            name: "altname",
                            join: "CUSTRECORD_INO_RE_PPA_CUSTOMER",
                            summary: "GROUP",
                            label: "Customer"
                        }),
                        search.createColumn({
                            name: "salesrep",
                            join: "CUSTRECORD_INO_RE_PPA_CUSTOMER",
                            summary: "GROUP",
                            label: "Sales Person"
                        }),
                        search.createColumn({
                            name: "custrecord_az_rng_pp_broker",
                            join: "CUSTRECORD_INO_RE_PPA_PMT_PLAN",
                            summary: "GROUP",
                            label: "Broker"
                        }),
                        search.createColumn({
                            name: "custrecord_ino_re_ppa_amt",
                            summary: "SUM",
                            label: "Payment Amount"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "CASE WHEN {custrecord_ino_re_ppa_customerreceipt.custrecord_ino_re_cr_paymentmethod} IS NULL Then 'Cheque' Else {custrecord_ino_re_ppa_customerreceipt.custrecord_ino_re_cr_paymentmethod} END",
                            label: "Payment Method"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "CASE WHEN {custrecord_ino_re_ppa_customerreceipt.custrecord_ino_re_cr_account}  LIKE '%Escrow%'  THEN 'Escrow' ELSE 'Corporate' END",
                            label: "Account Name"
                        })
                    ]
            });
            const searchResult = allocationSearchObj.run().getRange(0, 1000);
            if (searchResult != null || searchResult != '') {
                searchResult.forEach((result) => {
                    let broker = ''
                    const brokerId = result.getValue(result.columns[3]);
                    if (brokerId) {
                        const brokerRec = search.lookupFields({
                            type: 'partner',
                            id: brokerId,
                            columns: [
                                'custentity_az_rng_customer_name',
                            ]
                        });
                        broker = brokerRec.custentity_az_rng_customer_name
                    }
                    total += Number(result.getValue(result.columns[4]));
                    objects.push({
                        unit: result.getText(result.columns[0]),
                        customer: result.getValue(result.columns[1]),
                        salesRep: result.getText(result.columns[2]),
                        broker: broker,
                        paymentAmount: result.getValue(result.columns[4]),
                        paymentMethod: result.getValue(result.columns[5]),
                        accountName: result.getValue(result.columns[6]),
                    });

                })
            }
            return { objects, total };

        } catch (error) {
            log.debug('errorGetSubsidiaryMovmentData', error)
        }
    }

    const getSubsidiaryConsolidatedData = (subsidiaryId,endDate) => {
        try {
            const objects = [];
            let total = 0;

            let filter =
                    [
                        ["custrecord_ino_re_ppa_customerreceipt.custrecord_ino_re_cr_date", "within", subtractDaysFromString(endDate, 6), endDate],
                        "AND",
                        ["custrecord_ino_re_ppa_subs", "anyof", subsidiaryId]
                    ]



            const allocationSearchObj = search.create({
                type: "customrecord_ino_re_pmt_plan_allocation",
                filters: filter,
                columns:
                    [
                        search.createColumn({
                            name: "custrecord_ino_re_ppa_unit",
                            summary: "GROUP",
                            label: "Unit"
                        }),
                        search.createColumn({
                            name: "altname",
                            join: "CUSTRECORD_INO_RE_PPA_CUSTOMER",
                            summary: "GROUP",
                            label: "Customer"
                        }),
                        search.createColumn({
                            name: "salesrep",
                            join: "CUSTRECORD_INO_RE_PPA_CUSTOMER",
                            summary: "GROUP",
                            label: "Sales Person"
                        }),
                        search.createColumn({
                            name: "custrecord_az_rng_pp_broker",
                            join: "CUSTRECORD_INO_RE_PPA_PMT_PLAN",
                            summary: "GROUP",
                            label: "Broker"
                        }),
                        search.createColumn({
                            name: "custrecord_ino_re_ppa_amt",
                            summary: "SUM",
                            label: "Payment Amount"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "CASE WHEN {custrecord_ino_re_ppa_customerreceipt.custrecord_ino_re_cr_paymentmethod} IS NULL Then 'Cheque' Else {custrecord_ino_re_ppa_customerreceipt.custrecord_ino_re_cr_paymentmethod} END",
                            label: "Payment Method"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "CASE WHEN {custrecord_ino_re_ppa_customerreceipt.custrecord_ino_re_cr_account}  LIKE '%Escrow%'  THEN 'Escrow' ELSE 'Corporate' END",
                            label: "Account Name"
                        })
                    ]
            });
            const searchResult = allocationSearchObj.run().getRange(0, 1000);
            if (searchResult && searchResult.length > 0) {
                searchResult.forEach((result) => {
                    let broker = ''
                    const brokerId = result.getValue(result.columns[3]);
                    if (brokerId) {
                        const brokerRec = search.lookupFields({
                            type: 'partner',
                            id: brokerId,
                            columns: [
                                'custentity_az_rng_customer_name',
                            ]
                        });
                        broker = brokerRec.custentity_az_rng_customer_name
                    }
                    total += Number(result.getValue(result.columns[4]));
                    objects.push({
                        unit: result.getText(result.columns[0]),
                        customer: result.getValue(result.columns[1]),
                        salesRep: result.getText(result.columns[2]),
                        broker: broker,
                        paymentAmount: result.getValue(result.columns[4]),
                        paymentMethod: result.getValue(result.columns[5]),
                        accountName: result.getValue(result.columns[6]),
                    });

                })
            }
            return { objects, total };

        } catch (error) {
            log.debug('errorGetSubsidiaryConsolidatedData', error)
        }
    }

    const getCashBalance = (subsidiaryId,yesterday) => {
        try {
            const data = [];

            const transactionSearchObj = search.create({
                type: "transaction",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                filters: [
                    ["subsidiary", "is", subsidiaryId],
                    "AND",
                    ["account.isinactive", "is", "F"],
                    "AND",
                    ["approvalstatus", "noneof", "3"],
                    "AND",
                    ["trandate", "onorbefore", yesterday],
                    "AND",
                    ["accounttype", "noneof", "NonPosting"],
                    "AND",
                    ["posting", "is", "T"],
                    "AND",
                    ["account.custrecord_az_rng_include_reportp", "is", "T"]
                ],
                columns:
                    [
                        search.createColumn({
                            name: "subsidiarynohierarchy",
                            summary: "GROUP",
                            label: "Subsidiary (no hierarchy)"
                        }),
                        search.createColumn({
                            name: "account",
                            summary: "GROUP",
                            label: "Account"
                        }),
                        search.createColumn({
                            name: "custrecord_az_rng_report_currency",
                            join: "account",
                            summary: "GROUP",
                            label: "Currency"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "CASE WHEN {accounttype} IN ('Expense','Other Expense') and {amount} > 0 THEN {amount} WHEN {account.custrecord_az_rng_account_nature} !='Credit Account' and {amount} > 0 THEN {amount}  WHEN {account.custrecord_az_rng_account_nature} ='Credit Account' and {amount} < 0  THEN {amount}*-1 ELSE 0 END",
                            label: "Formula (Currency)"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "CASE WHEN {accounttype} IN ('Expense','Other Expense') and {fxamount} > 0 THEN {fxamount} WHEN {account.custrecord_az_rng_account_nature} !='Credit Account' and {fxamount} > 0 THEN {fxamount}  WHEN {account.custrecord_az_rng_account_nature} ='Credit Account' and {fxamount} < 0  THEN {fxamount}*-1 ELSE 0 END",
                            label: "Formula (Currency)"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "CASE WHEN  {accounttype} IN ('Income','Other Income') and {amount} > 0 THEN {amount}  WHEN {account.custrecord_az_rng_account_nature} !='Credit Account' and {amount} < 0 THEN {amount}*-1  WHEN  {account.custrecord_az_rng_account_nature} ='Credit Account' and {amount} > 0  THEN {amount} ELSE 0 END",
                            label: "Formula (Currency)"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "CASE WHEN  {accounttype} IN ('Income','Other Income') and {fxamount} > 0 THEN {fxamount}  WHEN {account.custrecord_az_rng_account_nature} !='Credit Account' and {fxamount} < 0 THEN {fxamount}*-1  WHEN  {account.custrecord_az_rng_account_nature} ='Credit Account' and {fxamount} > 0  THEN {fxamount} ELSE 0 END",
                            label: "Formula (Currency)"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "CASE When {accounttype} IN ('Expense','Other Expense') Then {amount}*-1 Else {amount} END",
                            label: "Formula (Currency)"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "CASE When {accounttype} IN ('Expense','Other Expense') Then {fxamount}*-1 Else {fxamount} END",
                            label: "Formula (Currency)"
                        })
                    ]
            });
            const searchResult = transactionSearchObj.run().getRange(0, 1000);
            if (searchResult != null || searchResult != '') {
                searchResult.forEach((result) => {
                    let cashIn = 0
                    let cashOut = 0
                    let balance = 0

                    const currencyId = result.getValue(result.columns[2])
                    const currency = result.getText(result.columns[2])
                    if (currencyId == '1') {
                        cashIn = result.getValue(result.columns[3]);
                        cashOut = result.getValue(result.columns[5]);
                        balance = result.getValue(result.columns[7]);
                    } else {
                        cashIn = result.getValue(result.columns[4]);
                        cashOut = result.getValue(result.columns[6]);
                        balance = result.getValue(result.columns[8]);
                    }
                    data.push({
                        'cashIn': cashIn,
                        'cashOut': cashOut,
                        'balance': balance,
                        'currency': currency
                    })

                });
            }
            return data;

        } catch (error) {
            log.debug('errorGetCashBalance', error);
        }
    }

    const getDailySalesData = () => {
        try {
            const salesData = {
                beachHouse: { data: [], newTotal: 0, total: 0, count: 0 },
                beachResidences: { data: [], newTotal: 0, total: 0, count: 0 },
                beachVista: { data: [], newTotal: 0, total: 0, count: 0 },
                islandHeights: { data: [], newTotal: 0, total: 0, count: 0 }

            };

            const dailySalesSearch = search.load({
                id: 'customsearch_az_rng_unit_pmts_overv_2',
            });

            dailySalesSearch.filters.push(
                search.createFilter({
                    name: 'custrecord_ino_re_cr_date',
                    join: 'custrecord_ino_re_ppa_customerreceipt',
                    operator: search.Operator.BEFORE,
                    values: 'today'

                })
            );
            const searchResult = dailySalesSearch.run().getRange(0, 1000);

            if (searchResult != null && searchResult != '') {
                searchResult.forEach((result) => {

                    let broker = ''
                    const brokerId = result.getValue(result.columns[5]);
                    if (brokerId) {
                        const brokerRec = search.lookupFields({
                            type: 'partner',
                            id: brokerId,
                            columns: [
                                'custentity_az_rng_customer_name',
                            ]
                        });
                        broker = brokerRec.custentity_az_rng_customer_name
                    }

                    let customer = ''
                    const customerId = result.getValue(result.columns[3]);
                    if (customerId) {
                        const custRec = search.lookupFields({
                            type: 'customer',
                            id: customerId,
                            columns: [
                                'custentity_az_rng_customer_name',
                            ]
                        });
                        customer = custRec.custentity_az_rng_customer_name
                    }
                    const newUnit = result.getValue(result.columns[1]);
                    const subsidiary = result.getValue(result.columns[7]);
                    const unit = result.getText(result.columns[0])
                    const view = result.getValue(result.columns[2])
                    const salesRep = result.getText(result.columns[4])
                    const price = result.getValue(result.columns[6])

                    let subsidiaryData;
                    switch (subsidiary) {
                        case '2': // Beach House
                            // salesData.beachHouse.count++
                            subsidiaryData = salesData.beachHouse;
                            break;
                        case '3': // Beach Residences
                            // salesData.beachResidences.count++
                            subsidiaryData = salesData.beachResidences;
                            break;
                        case '8': // Beach Vista
                            // salesData.beachVista.count++
                            subsidiaryData = salesData.beachVista;
                            break;
                        case '9': // Island Heights
                            //  salesData.islandHeights.count++
                            subsidiaryData = salesData.islandHeights;
                            break;
                        default:
                            return; // Skip unknown subsidiaries
                    }

                    if (newUnit == 'New') {
                        subsidiaryData.data.push({
                            unit,
                            view,
                            customer,
                            salesRep,
                            broker,
                            price,
                            newUnit
                        });
                        subsidiaryData.newTotal += Number(price);
                        // subsidiaryData.count++;
                    }

                    // Update totals and counts
                    subsidiaryData.total += Number(price);
                    subsidiaryData.count++;

                });


            }
            return salesData;

        } catch (error) {
            log.debug('errorGetDailySalesData', error);
        }
    }

    const CreateDailyReportRecord = (MovmentFile, salesFile,consolidatedFile) => {
        try {
            const reportRec = record.create({
                type: 'customrecord_az_rng_daily_reports',

            })
            if (MovmentFile) {

                reportRec.setValue({
                    fieldId: 'custrecord_az_rng_drep_move_cash_balance',
                    value: MovmentFile
                });
            }
            reportRec.setValue({
                fieldId: 'custrecord_az_rng_drep_projects_sales',
                value: salesFile
            });
            if(consolidatedFile){
                reportRec.setValue({
                fieldId: 'custrecord_az_rng_dr_consolidated_report',
                value: consolidatedFile
            });
            }
            reportRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            })
        } catch (error) {
            log.debug('Error At Create Daily Report', error);
        }
    }

    const numberWithCommas = (numValue) => {
        try {
            if (numValue) {
                if (isNaN(numValue)) {
                    numValue = Number(numValue);
                }

                numValue = format.format({
                    value: numValue,
                    type: format.Type.CURRENCY
                })
            } else {
                numValue = 0;
            }
            return numValue;
        } catch (error) {
            log.debug('errorNumberWithCommas', error);
        }
    }

    const subtractDaysFromString = (dateString, daysToSubtract) => {
        // Parse the string to Date object
        const date = new Date(dateString);

        // Subtract days
        date.setDate(date.getDate() - daysToSubtract);


        return date.toISOString().slice(0, 10);
    }

    const escapeXML = (str) => {
        try {
            return str.replace(/&/g, '&amp;')
                .replace(/</g, '<')
                .replace(/>/g, '>')
                .replace(/"/g, '"')
                .replace(/'/g, '&apos;');
        } catch (error) {
            log.debug('Error At EscapeXML', error);
        }
    }
    return {
        execute: execute
    }
});
