/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(["N/search", "N/render",
  "N/record",
  "N/file",
  "N/ui/serverWidget","N/query"
], function (s, render, record, file, serverWidget,query) {

  const onRequest = (context) => {
    try {
      if (context.request.method == "GET") {
        try {
          var myRecId = context.request.parameters.myRecId;

          if (myRecId) {
            let checkboxfield = s.lookupFields({
              type: "salesorder",
              id: myRecId,
              columns: ["custbody_az_rng_old_dates_print"],
            });


            let oldDatesPrint = checkboxfield.custbody_az_rng_old_dates_print;

            let contractData = getContractData(myRecId);
            let unit = contractData.unitMaster;
            const unitRecord = record.load({
              type: 'customrecord_ino_re_unitmaster',
              id: unit
            });
            const accName = unitRecord.getValue('custrecord_ino_re_um_sub_account_name');
            const IBAN = unitRecord.getValue('custrecord_ino_re_um_iban');
            const accNumber = unitRecord.getValue('custrecord_ino_re_um_account_numbrt');
            let subsidiaryData = getSubsidiaryData(contractData.subsidiary);
            let subsidaryId = contractData.subsidiary;

            let customerData = getCustomerData(contractData.customer);
            let secondCustomerData = getCustomerData(
              contractData.secondCustomer
            );
            let thirdCustomerData = getCustomerData(contractData.thirdCustomer);
            let fourthCustomerData = getCustomerData(contractData.fourthCustomer);
            let fifthCustomerData = getCustomerData(contractData.fifthCustomer);
            let unitData = getUnitData(contractData.unitMaster);
            let propertyData = getPropertyData(contractData.property);
            let paymentPlanData = getPaymentPlanData(myRecId, oldDatesPrint);
            // log.debug("paymentPlanData",paymentPlanData);
            let subLogo = getSubsidiaryLogo(contractData.subsidiary);
            let {amendments,lastUpdatedDate} = getAdmendmentData(myRecId);
            log.debug("amendments data", [amendments,lastUpdatedDate]);
            var template = getHeader(subLogo, subsidaryId);

            template = getBody(
              template,
              subsidiaryData,
              customerData,
              contractData,
              unitData,
              propertyData,
              paymentPlanData,
              secondCustomerData,
              thirdCustomerData,
              fourthCustomerData,
              fifthCustomerData,
              accName, IBAN, accNumber,unit,amendments,lastUpdatedDate
            );

            finalyPrint(template, context);
          }
        } catch (errGet) {
          log.debug("errGet", errGet);
        }
      }
    } catch (errOnRequest) {
      log.debug("errOnRequest", errOnRequest);
    }
  }


  // get template
  const getHeader = (subLogo, subsidaryId) => {
    try {
      log.debug('subsidaryId',subsidaryId)
      let logoWidth = "150px";
      let logoHeight = "100px";
      var template = "";

      template +=
        '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
      template += "<pdf>";
      template += "<head>";
      template +=
        '<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-';
      template += 'bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />';
      template +=
        '<link name="NotoSansArabic" type="font" subtype="opentype" src="${nsfont.NotoSansArabic_Regular}" src-bold="${nsfont.NotoSansArabic_Bold}" bytes="2" subset="false" />';
      template += '<#if .locale == "zh_CN">';
      template +=
        '<link name="NotoSansCJKsc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKsc_Regular}" src-bold="${nsfont.NotoSansCJKsc_Bold}" bytes="2" />';
      template += '<#elseif .locale == "zh_TW">';
      template +=
        '<link name="NotoSansCJKtc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKtc_Regular}" src-bold="${nsfont.NotoSansCJKtc_Bold}" bytes="2" />';
      template +=
        '<link name="NotoSansCJKjp" type="font" subtype="opentype" src="${nsfont.NotoSansCJKjp_Regular}" src-bold="${nsfont.NotoSansCJKjp_Bold}" bytes="2" />';
      template += '<#elseif .locale == "ja_JP">';
      template += '<#elseif .locale == "ko_KR">';
      template +=
        '<link name="NotoSansCJKkr" type="font" subtype="opentype" src="${nsfont.NotoSansCJKkr_Regular}" src-bold="${nsfont.NotoSansCJKkr_Bold}" bytes="2" />';
      template += '<#elseif .locale == "th_TH">';
      template +=
        '<link name="NotoSansThai" type="font" subtype="opentype" src="${nsfont.NotoSansThai_Regular}" src-bold="${nsfont.NotoSansThai_Bold}" bytes="2" />';
      template += "</#if>";

      template += "<macrolist>";

      template += '<macro id="nlheader">';
      template +=
        '<table style="width: 100%; font-size: 11pt; height: 150px;"><tr>';
      template +=
        '<td  style="width:50%;"><@filecabinet nstype="image" src="' +
        subLogo.logoUrl +
        '" style="float: left; width:' +
        logoWidth +
        "; height:" +
        logoHeight +
        ';" /></td>';
      template +=
        '<td align="right" style="width:50%; margin-top: 15px;"><@filecabinet nstype="image" src="https://2794193.app.netsuite.com/core/media/media.nl?id=645&c=2794193&h=u47_ycweNjpJA5pMJoViXRzT3Djo-WHivf6mQEzRp06V27U6&fcts=20231112044448&whence="/></td>';
      template += "</tr></table>";

      template += "</macro>";

      template += '<macro id="nlfooter">';
      template += '<table class="footer" style="width: 100%;">';

      template += '<tr style=" font-weight: bold;">';
      template +=
        '<td colspan="3" align="center" style="font-size: 7.5pt;"><pagenumber/></td>';
      template += "</tr>";
      template += "</table>";
      template += "</macro>";

      template += "</macrolist>";
      template += '<style type="text/css">* {';
      template += '<#if .locale == "zh_CN">';
      template += "font-family: NotoSans, NotoSansCJKsc, sans-serif;";
      template += '<#elseif .locale == "zh_TW">';
      template += "font-family: NotoSans, NotoSansCJKtc, sans-serif;";
      template += '<#elseif .locale == "ja_JP">';
      template += "font-family: NotoSans, NotoSansCJKjp, sans-serif;";
      template += '<#elseif .locale == "ko_KR">';
      template += "font-family: NotoSans, NotoSansCJKkr, sans-serif;";
      template += '<#elseif .locale == "th_TH">';
      template += "font-family: NotoSans, NotoSansThai, sans-serif;";
      template += "<#else>";
      template += "font-family: NotoSans, sans-serif;";
      template += "font-family: NotoSansArabic, sans-serif;";
      template += "</#if>";
      template += "}";
      template += "td p {text-align: left;}";
      template += "</style>";
      template += "</head>";
        const headerHeight = (Number(subsidaryId) === 8 || Number(subsidaryId) === 9) ? "12%" : "10%";

    template +=
  "<body header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='10pt' padding='0.5in 0.5in 0.5in 0.5in' size='Letter' style='margin:20px;'>";

      return template;
    } catch (errGetHeader) {
      log.debug("errGetHeader", errGetHeader);
    }
  };

  // get body
  const getBody = (
    template,
    subsidiaryData,
    customerData,
    contractData,
    unitData,
    propertyData,
    paymentPlanData,
    secondCustomerData,
    thirdCustomerData,
    fourthCustomerData,
    fifthCustomerData,
    accName, IBAN, accNumber,unit,amendments,lastUpdatedDate
  ) => {
    try {
              const customers = [customerData.fullname,secondCustomerData.fullname,thirdCustomerData.fullname,fourthCustomerData.fullname,fifthCustomerData.fullname];
      const customerList = customers.filter(c => c).join(", ");

      // // cover page
      let purchasePrice_e = 'The Purchaser irrevocably authorises the Seller to date the Instalment cheques referred to in <b>clause 2.1(d) </b> on the respective Instalment Payment Dates. For the avoidance of doubt, where an Instalment Payment Date is linked to a construction milestone, and the Seller has served on the Purchaser the corresponding notice, the Purchaser irrevocably authorises the Seller to date the respective Instalment cheque on the Instalment Payment Date as notified to the Purchaser in the notice.';
      let purchaseNote = 'The Purchaser must pay to the Seller the relevant Instalments on the Payment Dates specified in the relevant instalment notices in accordance with <b>clause 2</b>.';
      if (contractData.subsidiary == '8') {
        purchasePrice_e = 'The Purchaser irrevocably authorises the Seller to date the Instalment cheques referred to in <b>clause 2.1(d) </b> on the respective Instalment Payment Dates.';
        purchaseNote = 'The Purchaser must pay to the Seller the relevant Instalments on the Instalments Payment Dates specified in the relevant instalment notices in accordance with <b>clause 2</b>.'
      }
      {
        template += `
                    <table width="100%" height="20%">
                    <tr><td></td></tr>
                    </table>
                    <table width="100%" style="  margin-top: 150px;color:#086464;">
                    <tr>
                    <td align="center" style="font-size:22pt;"><b>Residential Sale and Purchase Agreement</b></td>
                    </tr>`;
        if (
          subsidiaryData.name == "The Beach Residences" ||
          "The Beach Vista at Al Marjan Island"
        ) {
          template += `
                      <tr>
                      <td height="80px">&nbsp;</td>
                      </tr>
                      <tr>`;
        } else {
          template += `
                      <tr>
                      <td><@filecabinet nstype="image" src="https://2794193.app.netsuite.com/core/media/media.nl?id=674&c=2794193&h=94HFHZgORBBq47luAdWzEJeBw4aXxmD2wcQ9Q_Zpo2OfI-LQ&fcts=20231126052501&whence=" /></td>
                      </tr>
                      <tr>`;
        }
        template +=
          `
                    <td align="center" style="font-size:20pt;">` +
          subsidiaryData.BenficiaryName +
          `</td>
                    </tr>
                    <tr>
                    <td align="center" style="font-size:20pt;">Al Marjan Island, Ras Al Khaimah</td>
                    </tr>
                    <tr>
                    <td align="center" style="font-size:20pt;">United Arab 	Emirates</td>
                    </tr>
                    </table>
  
                    <table width="100%" style="font-size:9pt;  margin-top: 130px;color:#086464;page-break-after: always;">
                    <tr>
                    <td align="center">` +
          subsidiaryData.legalName +
          `</td>
                    </tr>`;

        template +=
          `
                    <tr> <td align="center">Registered Address: ` +
          subsidiaryData.registerdAddress +
          `</td></tr>
                    <tr>
                    <td align="center">Correspondence Address: Tower 2, Boulevard Plaza, Office No 1104, 11th Floor, Burj Khalifa               </td>
                    </tr>
                    <tr>
                    <td align="center">Community, Downtown, Dubai, UAE</td>
                    </tr>
                    <tr>
                    <td align="center">P.O. Box 50390, Dubai, UAE | T: +971 4 325 3447 | F: +971 4 325 3448</td>
                    </tr>
                    </table>
                    `;
      }
      // // table of content
      {
        template += "<p><b>Contents</b></p>";
        template += `<table style="width: 100%;">
                      
                      <tr>
                        <td width="15%">1</td>
                        <td width="70%">Sale and Purchase</td>
                        <td width="15%">7</td>
                      </tr>
                      <tr>
                        <td>2</td>
                        <td>Purchase Price</td>
                        <td>7</td>
                      </tr>
                      <tr>
                        <td>3</td>
                        <td>Unit Works</td>
                        <td>8</td>
                      </tr>
                      <tr>
                        <td>4</td>
                        <td>Unit Inspection and Defect Rectification</td>
                        <td>10</td>
                      </tr>
                      <tr>
                        <td>5</td>
                        <td>Completion and Risk</td>
                        <td>11</td>
                      </tr>
                      <tr>
                        <td>6</td>
                        <td>Registration and Transfer of Title</td>
                        <td>12</td>
                      </tr>
                      <tr>
                        <td>7</td>
                        <td>Management</td>
                        <td>14</td>
                      </tr>
                      <tr>
                        <td>8</td>
                        <td>Residential Facilities</td>
                        <td>16</td>
                      </tr>
                      <tr>
                        <td>9</td>
                        <td>Governance Documents</td>
                        <td>17</td>
                      </tr>
                      <tr>
                        <td>10</td>
                        <td>Permitted Use</td>
                        <td>17</td>
                      </tr>
                      <tr>
                        <td>11</td>
                        <td>Service Charges</td>
                        <td>18</td>
                      </tr>
                      <tr>
                        <td>12</td>
                        <td>Taxes and Utility Charges</td>
                        <td>19</td>
                      </tr>
                      <tr>
                        <td>13</td>
                        <td>Restrictions on Disposals before Completion</td>
                        <td>20</td>
                      </tr>
                      <tr>
                        <td>14</td>
                        <td>Restrictions on Disposals after Completion</td>
                        <td>21</td>
                      </tr>
                      <tr>
                        <td>15</td>
                        <td>Default and Termination</td>
                        <td>22</td>
                      </tr>
                       <tr>
                        <td>16</td>
                        <td>Right of First Refusal</td>
                        <td>24</td>
                      </tr>
                      <tr>
                        <td>17</td>
                        <td>Force Majeure Events and Foreign Reasons</td>
                        <td>24</td>
                      </tr>
                      <tr>
                        <td>18</td>
                        <td>Purchaser’s Covenants and Indemnities</td>
                        <td>25</td>
                      </tr>
                      <tr>
                        <td>19</td>
                        <td>General Provisions</td>
                        <td>26</td>
                      </tr>
                      <tr>
                        <td>20</td>
                        <td>Notices</td>
                        <td>29</td>
                      </tr>
                      <tr>
                        <td>21</td>
                        <td>Confidentiality and Non-Disclosure</td>
                        <td>29</td>
                      </tr>
                      <tr>
                        <td>22</td>
                        <td>Definitions and Interpretation</td>
                        <td>30</td>
                      </tr>
                      <tr>
                        <td>23</td>
                        <td>Governing Law and Jurisdiction</td>
                        <td>30</td>
                      </tr>
                      <tr>
                        <td colspan="2">Execution Page</td>
                        <td>31</td>
                      </tr>
                      <tr>
                        <td colspan="2">Schedule 1 Disclosure Statement</td>
                        <td>33</td>
                      </tr>
                      <tr>
                        <td colspan="2">Schedule 2 Acknowledgement of Disclosure Statement</td>
                        <td>37</td>
                      </tr>
                      <tr>
                        <td colspan="2">Schedule 3 Draft Unit Plan</td>
                        <td>38</td>
                      </tr>
                      <tr>
                        <td colspan="2">Schedule 4 Draft Unit Specification</td>
                        <td>39</td>
                      </tr>
                      <tr>
                        <td colspan="2">Schedule 5 Definitions and Interpretation</td>
                        <td>43</td>
                      </tr>
                      <tr>
                        <td colspan="2">Schedule 6 Declaration of Adherence and Acknowledgement</td>
                        <td>53</td>
                      </tr>`;


                        if (amendments && amendments.length > 0) {

                        template += `<tr>
                                      <td colspan="2">APPENDIX - SPA AMENDMENTS</td>
                                      <td>58</td>
                                    </tr>`;

                      }

                                              template += `</table>`;
      }

      // // page ii
      {
        template += '<p style="font-size:14pt;">Particulars of Sale</p>';

        // // 1. particulars of sale table
        {
          template += "<b>1. Particulars of Seller</b>";
          template +=
            '<table style="width:90%;font-size:10pt;border:1px solid black;margin-bottom:5px;">';

          template += "<tr>";
          template +=
            '<td style=" width:30%;border-bottom:1px solid black;color:#ffffff; background-color:#086464;">Name: </td>';
          template +=
            '<td style="border-bottom:1px solid black;border-left:1px solid black;"><b>' +
            subsidiaryData.legalName +
            "</b></td>";
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td style="border-bottom:1px solid black;color:#ffffff; background-color:#086464;">Licence number: </td>';
          template +=
            '<td style="border-bottom:1px solid black;border-left:1px solid black;">' +
            subsidiaryData.licenceNumber +
            "</td>";
          template += "</tr>";

          if (contractData.subsidiary !== '9') {
            template += "<tr>";
            template +=
              '<td style="border-bottom:1px solid black;color:#ffffff; background-color:#086464;">RERA registration number: </td>';
            template +=
              '<td style="border-bottom:1px solid black;border-left:1px solid black;">' +
              subsidiaryData.regNum +
              "</td>";
            template += "</tr>";
          } else {
            template += "<tr>";
            template +=
              '<td style="border-bottom:1px solid black;color:#ffffff; background-color:#086464;">RERA registration number: </td>';
            template +=
              '<td style="border-bottom:1px solid black;border-left:1px solid black;"> DRC/202562</td>';
            template += "</tr>";
          }

          template += "<tr>";
          template +=
            '<td style="border-bottom:1px solid black;color:#ffffff; background-color:#086464;">PO Box: </td>';
          template +=
            '<td style="border-bottom:1px solid black;border-left:1px solid black;">' +
            subsidiaryData.poBox +
            "</td>";
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td style="color:#ffffff; background-color:#086464;">City: </td>';
          template +=
            '<td style="border-left:1px solid black;">' +
            subsidiaryData.city +
            "</td>";
          template += "</tr>";

          template += "</table>";
        }
        // //2. Particulars of Purchaser table
        {
          template += "<b>2. Particulars of Purchaser</b>";

          if (customerData.isperson == true) {
            template +=
              '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
            template += "<tr>";
            template +=
              '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
            template +=
              '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.salutation +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Surname:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.lastName +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Middle Name:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.midName +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">First Name:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.firstName +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Nationality:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.nationlaity +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Passport Number:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.passportId +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.email +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.address +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.city +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.country +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.phone +
              "</td>";
            template += "</tr>";
            template += "</table>";

            if (
              contractData.secondCustomer &&
              secondCustomerData.isperson == true
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.salutation +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Surname:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.lastName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Middle Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.midName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">First Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.firstName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.city +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            } else if (
              contractData.secondCustomer &&
              secondCustomerData.isperson == false
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Company Name:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.companyName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Registration Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.vatregnumber +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country of Registration:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Shareholders:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.shareholder +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Authorized Signatory:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.authorizedSignatory +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.title +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.city +
                "</td>";
              template += "</tr>";
              if (customerData.country) {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                  secondCustomerData.country +
                  "</td>";
                template += "</tr>";
              } else {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
                template += "</tr>";
              }
              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            }
            log.debug("contractData.thirdCustomer", contractData.thirdCustomer)
            if (
              contractData.thirdCustomer &&
              thirdCustomerData.isperson == true
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.salutation +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Surname:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.lastName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Middle Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.midName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">First Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.firstName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.city +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            } else if (
              contractData.thirdCustomer &&
              thirdCustomerData.isperson == false
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Company Name:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.companyName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Registration Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.vatregnumber +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country of Registration:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Shareholders:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.shareholder +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Authorized Signatory:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.authorizedSignatory +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.title +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.city +
                "</td>";
              template += "</tr>";
              if (customerData.country) {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                  thirdCustomerData.country +
                  "</td>";
                template += "</tr>";
              } else {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
                template += "</tr>";
              }
              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            }
            log.debug("contractData.fourthCustomer", contractData.fourthCustomer)
            if (
              contractData.fourthCustomer &&
              fourthCustomerData.isperson == true
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.salutation +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Surname:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.lastName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Middle Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.midName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">First Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.firstName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.city +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            } else if (
              contractData.fourthCustomer &&
              fourthCustomerData.isperson == false
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Company Name:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.companyName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Registration Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.vatregnumber +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country of Registration:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Shareholders:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.shareholder +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Authorized Signatory:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.authorizedSignatory +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.title +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.city +
                "</td>";
              template += "</tr>";
              if (customerData.country) {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                  fourthCustomerData.country +
                  "</td>";
                template += "</tr>";
              } else {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
                template += "</tr>";
              }
              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            }



            log.debug("contractData.fifthCustomer", contractData.fifthCustomer)
            ////////////////////////
            if (
              contractData.fifthCustomer &&
              fifthCustomerData.isperson == true
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.salutation +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Surname:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.lastName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Middle Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.midName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">First Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.firstName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.city +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            } else if (
              contractData.fifthCustomer &&
              fifthCustomerData.isperson == false
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Company Name:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.companyName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Registration Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.vatregnumber +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country of Registration:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Shareholders:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.shareholder +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Authorized Signatory:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.authorizedSignatory +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.title +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.city +
                "</td>";
              template += "</tr>";
              if (customerData.country) {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                  fifthCustomerData.country +
                  "</td>";
                template += "</tr>";
              } else {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
                template += "</tr>";
              }
              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            }
            ////////////////


          } else {
            template +=
              '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
            template += "<tr>";
            template +=
              '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Company Name:</td>';
            template +=
              '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.companyName +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Registration Number:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.vatregnumber +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country of Registration:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.country +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Shareholders:</td>';
            /*empty*/ template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.shareholder +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Authorized Signatory:</td>';
            /*empty*/ template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.authorizedSignatory +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
            /*empty*/ template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.title +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Nationality:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.nationlaity +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Passport Number:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.passportId +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.email +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.address +
              "</td>";
            template += "</tr>";

            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.city +
              "</td>";
            template += "</tr>";
            if (customerData.country) {
              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                customerData.country +
                "</td>";
              template += "</tr>";
            } else {
              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
              template += "</tr>";
            }
            template += "<tr>";
            template +=
              '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              customerData.phone +
              "</td>";
            template += "</tr>";
            template += "</table>";
            if (
              contractData.secondCustomer &&
              secondCustomerData.isperson == true
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.salutation +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Surname:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.lastName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Middle Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.midName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">First Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.firstName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.city +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            } else if (
              contractData.secondCustomer &&
              secondCustomerData.isperson == false
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Company Name:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.companyName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Registration Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.vatregnumber +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country of Registration:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Shareholders:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.shareholder +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Authorized Signatory:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.authorizedSignatory +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.title +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.city +
                "</td>";
              template += "</tr>";
              if (customerData.country) {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                  secondCustomerData.country +
                  "</td>";
                template += "</tr>";
              } else {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
                template += "</tr>";
              }
              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                secondCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            }
            if (
              contractData.thirdCustomer &&
              thirdCustomerData.isperson == true
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.salutation +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Surname:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.lastName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Middle Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.midName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">First Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.firstName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.city +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            } else if (
              contractData.thirdCustomer &&
              thirdCustomerData.isperson == false
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Company Name:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.companyName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Registration Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.vatregnumber +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country of Registration:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Shareholders:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.shareholder +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Authorized Signatory:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.authorizedSignatory +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.title +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.city +
                "</td>";
              template += "</tr>";
              if (customerData.country) {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                  thirdCustomerData.country +
                  "</td>";
                template += "</tr>";
              } else {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
                template += "</tr>";
              }
              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                thirdCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            }
            /// fourth cust
            if (
              contractData.fourthCustomer &&
              fourthCustomerData.isperson == true
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.salutation +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Surname:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.lastName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Middle Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.midName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">First Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.firstName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.city +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            } else if (
              contractData.fourthCustomer &&
              fourthCustomerData.isperson == false
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Company Name:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.companyName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Registration Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.vatregnumber +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country of Registration:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Shareholders:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.shareholder +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Authorized Signatory:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.authorizedSignatory +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.title +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.city +
                "</td>";
              template += "</tr>";
              if (customerData.country) {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                  fourthCustomerData.country +
                  "</td>";
                template += "</tr>";
              } else {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
                template += "</tr>";
              }
              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fourthCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            }

            //// Fifth cust
            if (
              contractData.fifthCustomer &&
              fifthCustomerData.isperson == true
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.salutation +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Surname:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.lastName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Middle Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.midName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">First Name:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.firstName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.city +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            } else if (
              contractData.fifthCustomer &&
              fifthCustomerData.isperson == false
            ) {
              template +=
                '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';
              template += "<tr>";
              template +=
                '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Company Name:</td>';
              template +=
                '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.companyName +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Registration Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.vatregnumber +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country of Registration:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.country +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Shareholders:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.shareholder +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Authorized Signatory:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.authorizedSignatory +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Title:</td>';
              /*empty*/ template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.title +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Nationality:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.nationlaity +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Signatory Passport Number:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.passportId +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Email:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.email +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Address/PO Box:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.address +
                "</td>";
              template += "</tr>";

              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">City:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.city +
                "</td>";
              template += "</tr>";
              if (customerData.country) {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                  fifthCustomerData.country +
                  "</td>";
                template += "</tr>";
              } else {
                template += "<tr>";
                template +=
                  '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Country:</td>';
                template +=
                  '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
                template += "</tr>";
              }
              template += "<tr>";
              template +=
                '<td style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Telephone:</td>';
              template +=
                '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
                fifthCustomerData.phone +
                "</td>";
              template += "</tr>";
              template += "</table>";
            }
            ////////
          }
        }
        // //3. Particulars of Unit table when town house is selected
        if (unitData.townHouse == true) {

          {
          template += "<b>3. Particulars of Unit</b>";
          template +=
            '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';

          template += "<tr>";
          template +=
            '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Master Community:</td>';
          template +=
            '<td  style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
            propertyData.masterCom +
            "</td>";
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Plot:</td>';
          template +=
            '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
            propertyData.plotNo +
            "</td>";
          template += "</tr>";
          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Project:</td>';
          template +=
            '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
            unitData.property +
            "</td>";
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Unit Number:</td>';
          template +=
            '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
            unitData.name +
            "</td>";
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Unit Type:</td>';
          template +=
            '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
            unitData.unittype +
            "</td>";
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Bedroom Count:</td>';
          if (unitData.unitModel == "Studio") {
            template +=
              '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.unitModel +
              "</td>";
          } else {
            template +=
              '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.bedRooms +
              "</td>";
          }
          template += "</tr>";

          if (contractData.subsidiary !== '9') {
            template += "<tr>";
            template +=
              '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Unit View:</td>';
            template +=
              '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.unitView +
              "</td>";
            template += "</tr>";
          }
          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Approximate Internal Living Area (Sqft) </td>';
          if (unitData.unitArea) {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.unitArea +
              " Sqft</td>";
          } else {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
          }
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Approximate Balcony Area (Sqft)</td>';
          if (unitData.terraceArea) {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.terraceArea +
              " Sqft</td>";
          } else {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
          }
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Approximate Outdoor Living Area (Sqft)</td>';
          if (unitData.gardenArea) {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.gardenArea +
              " Sqft</td>";
          } else {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
          }
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Approximate Total Area (Sqft)</td>';
          if (unitData.totalArea) {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.totalArea +
              " Sqft</td>";
          } else {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
          }
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Car Parking Spaces:</td>';
          template +=
            '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
            unitData.carParkingSpace +
            "</td>";
          template += "</tr>";
          

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Amenity:</td>';
          if (unitData.amenity) {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.amenity +
              "</td>";
          } else {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
          }
          template += "</tr>";

          template += "</table>";
        }

        } else {
          
          {
          template += "<b>3. Particulars of Unit</b>";
          template +=
            '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';

          template += "<tr>";
          template +=
            '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Master Community:</td>';
          template +=
            '<td  style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
            propertyData.masterCom +
            "</td>";
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Plot:</td>';
          template +=
            '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
            propertyData.plotNo +
            "</td>";
          template += "</tr>";
          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Project:</td>';
          template +=
            '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
            unitData.property +
            "</td>";
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Unit Number:</td>';
          template +=
            '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
            unitData.name +
            "</td>";
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Unit Type:</td>';
          template +=
            '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
            unitData.unittype +
            "</td>";
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Bedroom Count:</td>';
          if (unitData.unitModel == "Studio") {
            template +=
              '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.unitModel +
              "</td>";
          } else {
            template +=
              '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.bedRooms +
              "</td>";
          }
          template += "</tr>";

          if (contractData.subsidiary !== '9') {
            template += "<tr>";
            template +=
              '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Unit View:</td>';
            template +=
              '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.unitView +
              "</td>";
            template += "</tr>";
          }
          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Approximate Unit Area (Sqft) </td>';
          if (unitData.unitArea) {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.unitArea +
              " Sqft</td>";
          } else {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
          }
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Approximate Balcony Area (Sqft)</td>';
          if (unitData.terraceArea) {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.terraceArea +
              " Sqft</td>";
          } else {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
          }
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Approximate Total Area (Sqft)</td>';
          if (unitData.totalArea) {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              unitData.totalArea +
              " Sqft</td>";
          } else {
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>';
          }
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Car Parking Spaces:</td>';
          template +=
            '<td  style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
            unitData.carParkingSpace +
            "</td>";
          template += "</tr>";

          template += "</table>";
        }

        }
        // //4. Prescribed Dates table
        {
          template += "<b>4. Prescribed Dates</b>";
          template +=
            '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';

          template += "<tr>";
          template +=
            '<td  style="width:50%; border: 1px solid black;color:#ffffff; background-color:#086464;">Anticipated Completion Date:</td>';
          template +=
            '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
            propertyData.completionDate +
            "</td>";
          template += "</tr>";
          if (contractData.subsidiary !== '8' && contractData.subsidiary !== '9') {
            template += "<tr>";
            template +=
              '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Anticipated Construction Commencement Date</td>';
            template +=
              '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
              propertyData.commencementDate +
              "</td>";
            template += "</tr>";

          }

          template += "</table>";
        }
        // // 5. Purchase Price table
        {
          template += "<b>5. Purchase Price</b>";
          template +=
            '<table style="width:90%; font-size:10pt;margin-bottom:5px;page-break-after: always;">';

          template += "<tr>";
          template +=
            '<td  style="width:25%; border: 1px solid black;color:#ffffff; background-color:#086464;">Unit:</td>';
          template +=
            '<td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">' +
            unitData.name +
            "</td>";
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style="width:25%; border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Price:</td>';
          template +=
            '<td style=" border-bottom: 1px solid black;border-right: 1px solid black;">' +
            unitData.unitPrice +
            " AED (UAE Dirhams)  </td>";
          template += "</tr>";

          template += "</table>";
          template += "<pbr/>";
        }

        // // 6.	Payment Schedule
        {
          const remarkNote = 'Or upon completion, whichever occurs first.';
          template += "<b>6. Payment Schedule</b>";
          template += '<table style="width:100%; margin-bottom:5px; table-layout: fixed;">';
          let widthInstalment = "15%";
          const widthPercentage = "10%";
          const widthAmount = "15%";
          const widthMilestone = contractData.subsidiary !== 8 ? "20%" : "0%";
          const widthPaymentDate = contractData.subsidiary == 8 ? "20%" : "20%";
          const widthRemarks = contractData.subsidiary == 2||3 ? "20%" : "0%";

          template += "<tr>";
          template += `<th style="width:${widthInstalment}; padding-left: 5px; align:left; border:1px solid black; font-size:9pt;background-color:#086464;color:#ffffff;"><b>Instalment </b></th>`;

          template += `<th align="center" style="width:${widthPercentage}; padding-left: 5px; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;font-size:9pt;background-color:#086464;color:#ffffff;"><b>Percentage</b></th>`;
          template += `<th align="center" style=" width:${widthAmount}; padding-left: 5px; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;font-size:9pt;background-color:#086464;color:#ffffff;"><b>Amount (AED)</b></th>`;
          if (contractData.subsidiary != 8 && contractData.subsidiary != 9) {
            template += `<th  align="left" style=" width:${widthMilestone}; padding-left: 5px; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;font-size:9pt;background-color:#086464;color:#ffffff;"><b>Instalment Milestone</b></th>`;
            template += `<th align="center" style=" width:${widthPaymentDate}; padding-left: 5px; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;font-size:9pt;background-color:#086464;color:#ffffff;"><b>Payment Date</b></th>`;

          } else if (contractData.subsidiary == 9) {
            template += `<th align="center" style="width:40%; padding-left: 5px; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;font-size:9pt;background-color:#086464;color:#ffffff;"><b>Instalment Payment Date</b></th>`;

          } else {
            template += `<th align="center" style="width:${widthPaymentDate}; padding-left: 5px; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;font-size:9pt;background-color:#086464;color:#ffffff;"><b>Instalment Payment Date</b></th>`;

          }
log.debug("contractData.subsidiary",contractData.subsidiary)
          if (contractData.subsidiary == 2||contractData.subsidiary == 3) {
            template += `<th align="center" style=" width:${widthRemarks}; border-bottom: 1px solid black; border-top: 1px solid black; border-right: 1px solid black;font-size:9pt;background-color:#086464;color:#ffffff;"><b>Remarks</b></th>`;

          }
          template += "</tr>";
          for (i = 0; i < paymentPlanData.res.length; i++) {
            if (paymentPlanData.res[i].isInActive == false) {

              let cutoffDate
              if(contractData.subsidiary == 2) {cutoffDate= new Date('2026-06-30');}
              else if(contractData.subsidiary == 3){cutoffDate= new Date('2027-06-30');}
              const oldDate = new Date(paymentPlanData.res[i].oldDate);
              const newDate = new Date(paymentPlanData.res[i].date);
              let remark = (oldDate > cutoffDate || newDate > cutoffDate) ? remarkNote : '-';

              template += "<tr>";
              template += `<td style="width:${widthInstalment}; border-bottom: 1px solid black; border-left: 1px solid black; border-right: 1px solid black; font-size:9pt; padding:5px;">${paymentPlanData.res[i].insname}</td>`;
              template += `<td align="center" style="width:${widthPercentage}; text-align:center; border-bottom: 1px solid black; border-right: 1px solid black; font-size:9pt; padding:5px;">${paymentPlanData.res[i].percent}</td>`;
              template += `<td align="center"  style="width:${widthAmount}; text-align:center; border-bottom: 1px solid black; border-right: 1px solid black; font-size:9pt; padding:5px;">${paymentPlanData.res[i].amt}</td>`;

              if (contractData.subsidiary != 8 && contractData.subsidiary != 9) {
                template += `<td style="width:${widthMilestone}; border-bottom: 1px solid black; border-right: 1px solid black; font-size:9pt; padding:5px;">${paymentPlanData.res[i].milestone}</td>`;
              }
              if (paymentPlanData.res[i].type == 2) {
                template += `<td align="center" style="width:${widthPaymentDate}; text-align:center; border-bottom: 1px solid black; border-right: 1px solid black; font-size:9pt; padding:5px;">Completion Date</td>`;

                if (contractData.subsidiary == 2||contractData.subsidiary == 3) {
                  template += `<td align="center" style="width:${widthRemarks};  border-bottom: 1px solid black; border-right: 1px solid black; font-size:9pt; padding:5px;">-</td>`;
                }
              } else {
                let paymentDate = paymentPlanData.res[i].oldDate
                  ? paymentPlanData.res[i].oldDate
                  : paymentPlanData.res[i].date;
                template += `<td align="center" style="width:${widthPaymentDate}; text-align:center; border-bottom: 1px solid black; border-right: 1px solid black; font-size:9pt; padding:5px;">${paymentDate}</td>`;
                log.debug("contractData.subsidiary",contractData.subsidiary)
                if (contractData.subsidiary == 2||contractData.subsidiary == 3) {

                  template += `<td align="center" style="width:${widthRemarks}; text-align:center; border-bottom: 1px solid black; border-right: 1px solid black; font-size:9pt; padding:5px;">${remark}</td>`;

                }

              }
              template += "</tr>";
            }
          }
          template += "</table>";
          template +=
            `<p>${purchaseNote}</p>`;
        }
        // // 7.	The Service Charges
        {
          template += "<b>7. The Service Charges</b>";
          template +=
            '<table style="width:90%; font-size:10pt;margin-bottom:5px;">';

          template += "<tr>";
          template +=
            '<td  style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Estimated Service Charges Amount:</td>';
          template +=
            '<td colspan="2" style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">AED20 per square foot (twenty Dirhams per square foot)</td>';
          template += "</tr>";

          template += "<tr>";
          template +=
            '<td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Service Charge Deposit:</td>';
          template +=
            '<td colspan="2" style=" border-bottom: 1px solid black;border-right: 1px solid black;">A sum equal to twelve (12) months’ estimated Service Charges  </td>';
          template += "</tr>";
          template += "</table>";
        }
        // // 8.	Permitted Use
        {
          template += "<b>8. Permitted Use</b>";
          template +=
            '<table style="width:90%; font-size:10pt;margin-bottom:10px;">';

          template += "<tr>";
          template +=
            '<td style="width:100%; border: 1px solid black;">Strictly for Residential Use in accordance with this Agreement, Applicable Laws and the Governance Documents.</td>';
          template += "</tr>";
          template += "</table>";
        }
        // // 9.	Escrow Account
        {
          template += "<b>9. Escrow Account</b>";
          template += '<table style="width:90%; font-size:10pt;margin-bottom:10px;">';

          // Bank Name and Branch
          template += '<tr>';
          template += '<td style="width:30%; border: 1px solid black;color:#ffffff; background-color:#086464;">Bank Name and Branch:</td>';
          template += '<td colspan="2" style="border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">' + propertyData.branch + '</td>';
          template += '</tr>';

          // Account Name and Account Number (Subsidary logic)
          template += '<tr>';
          template += '<td style="border-left: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;color:#ffffff; background-color:#086464;">Account Name:</td>';
          if (contractData.subsidiary == '8' || contractData.subsidiary == '9') {


            template += '<td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black;">' + accName.toUpperCase() + '</td>';
            template += '</tr><tr>';
            template += '<td style="border-left: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;color:#ffffff; background-color:#086464;">Account Number:</td>';
            template += '<td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black;">' + accNumber + '</td>';

          } else {
            template += '<td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black;">ESCROW ' + subsidiaryData.BenficiaryName.toUpperCase() + '</td>';
            template += '</tr><tr>';
            template += '<td style="border-left: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;color:#ffffff; background-color:#086464;">Account Number:</td>';
            template += '<td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black;">' + propertyData.accountNum + '</td>';

          }
          template += '</tr>';

          // Swift Code
          template += '<tr>';
          template += '<td style="border-left: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;color:#ffffff; background-color:#086464;">Swift Code:</td>';
          template += '<td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black;">' + propertyData.swiftCode + '</td>';
          template += '</tr>';

          // IBAN No (Subsidary logic)
          template += '<tr>';
          template += '<td style="border-left: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;color:#ffffff; background-color:#086464;">IBAN No:</td>';
          if (contractData.subsidiary === '8' || contractData.subsidiary == '9') {
            template += '<td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black;">' + IBAN + '</td>';
          } else {
            template += '<td colspan="2" style="border-bottom: 1px solid black; border-right: 1px solid black;">' + propertyData.ibanNo + '</td>';
          }




          template += '</tr>';
          template += '</table>';


        }
        // // 10.	Effective Date
        {
          template += "<b>10. Effective Date</b>";
          template +=
            '<table style="width:90%; font-size:10pt;margin-bottom:10px;">';

          template += "<tr>";
          template +=
            '<td style="width:100%; border: 1px solid black;">' +
            contractData.salesEffectiveDate +
            "</td>";
          template += "</tr>";
          template += "</table>";
          template += "<pbr/>";
        }
      }

      // // 1 Sale and Purchase
      {
        template += `<table style="font-size:10pt;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                        <td colspan="2">This RESIDENTIAL SALE AND PURCHASE AGREEMENT is made on the Effective Date specified in <b>Item 10</b> of the Particulars between the Seller and the Purchaser.</td>
                      </tr>
                      <tr>
                      <td colspan="2" style="padding-bottom:5px;padding-top:8;">It is agreed as follows:</td>
                      </tr>
                      <tr>
                        <td style="font-size:14pt;padding-bottom:5px;padding-top:8;">1.</td>
                        <td style="font-size:14pt;padding-bottom:5px;padding-top:8;">Sale and Purchase</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:8px;">1.1</td>
                        <td>Subject to the terms and conditions of this Agreement, the Seller sells, and the Purchaser purchases, the Unit for the Purchase Price.</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:8px;">1.2</td>
                        <td>The Seller discloses and the Purchaser acknowledges the disclosure of all matters detailed in the Disclosure Statement. The Disclosure Statement is incorporated in and deemed to be an integral part of this Agreement. The Purchaser acknowledges receipt of the Disclosure Statement and that the Purchaser has satisfied itself with respect to the matters disclosed in the Disclosure Statement.</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:8px;">1.3</td>
                        <td>The Seller further discloses and the Purchaser acknowledges and agrees that the Unit shall be sold subject to the provisions contained in the Disclosure Statement and the Governance Documents, as may be varied from time to time by the Seller in accordance with the provisions of this Agreement or otherwise to accord with any regulations and restrictions imposed by a Relevant Authority.</td>
                      </tr>
                     
                    </table>
                    `;
      }
      //     // // 2 Purchase Price
      {
        template += `<table style="font-size:10pt;width:100%;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                        <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">2	Purchase Price</td>
                        
                      </tr>
                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>2.1 Payment of Purchase Price</b></td>
                      </tr>
                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">The Seller acknowledges receipt of the Deposit paid by the Purchaser on or before the Effective Date. The Seller agrees to credit the Deposit (subject to clearance in full) towards the Purchase Price.</td>
                      </tr>
                      <tr>
                      <td></td>
                      <td>(b) </td>`;
        if (contractData.subsidiary == 9) {
          template += `<td colspan="2">The Parties agree that each Instalment of the Purchase Price will be paid by the Purchaser into the Escrow Account established in accordance with the Escrow Account Law by bank transfer made in favour of the Escrow Account (as directed by the Seller).</td>`;
        } else {
          template += `<td colspan="2">The Parties agree that each Instalment of the Purchase Price will be paid by the Purchaser into the Escrow 
Account established in accordance with the Escrow Account Law by bank transfer or by cheque drawn in 
favour of the Escrow Account (as directed by the Seller).</td>`;

        }
        // 
        template += `</tr>
                      <tr>
                      <td></td>
                      <td>(c) </td>
                        <td colspan="2">The Purchaser will pay the balance of the Purchase Price to the Seller as follows:</td>
                      </tr>
                      <tr>
                      <td></td>
                      <td></td>
                      <td>(i) </td>
                        <td>subject to clause 2.1(c)(ii) and clause 2.1(c)(iii) the Purchaser will pay the Purchase Price in accordance with the Payment Schedule;</td>
                        </tr>
                        <tr>
                        <td></td>
                        <td></td>
                      <td>(ii) </td>
                        <td> if the Effective Date falls after one or more of the Instalment Payment Dates identified in the Payment Schedule, then the total of all Instalments corresponding to all Instalment Payment Dates prior to the Effective Date will become due and payable on the Effective Date;</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td></td>
                        <td>(iii) </td>
                        <td>if the Completion Date falls on or before one or more of the Instalment Payment Dates identified in the Payment Schedule, then the total of all Instalments due to be paid on all Instalment Payment Dates which fall on or after the Completion Date will become due and payable on the Completion Date; and</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td></td>
                      <td>(iv) </td>
                        <td>the Purchaser will pay each Instalment free of exchange, variation, currency fluctuation and bank charges and without any deduction, set-off or any other withholding whatsoever in each case so as to reach the Escrow Account as full and cleared funds on or before the relevant Instalment Payment Date.</td>
                      </tr>
                      <tr>
                      <td></td>
                      <td>(d) </td>
                        <td colspan="2">On the Effective Date, the Purchaser shall provide the Seller via bank transfer equivalent to each of the amounts of the outstanding Instalments as specified in the Payment Schedule, which the Seller may fully rely on and enforce in the event of any default or breach by the Purchaser of its obligations hereunder.</td>
                      </tr>`;
        if (contractData.subsidiary != 9) {
          template += `<tr>
                      <td></td>
                      <td>(e) </td>
                        <td colspan="2">${purchasePrice_e}</td>
                      </tr>
                      <tr>
                      <td></td>
                      <td>(f) </td>
                        <td colspan="2">The Seller will be entitled to draw upon any amounts paid into the Escrow Account subject to the requirements of the Escrow Account Law.</td>
                      </tr>
                      <tr>
                      <td></td>
                      <td>(g) </td>
                        <td colspan="2">The Purchaser acknowledges and agrees that the Purchase Price does not include any value added tax (VAT) and, in the event that VAT is imposed on the sale of the Unit, the Purchaser shall be solely liable to pay such VAT in addition to the Purchase Price and any other charges payable under this Agreement which amount shall be payable by the Purchaser to the Seller as required by the Relevant Authorities.</td>
                      </tr>`;
        } else {
          template += `<tr>
                      <td></td>
                      <td>(e) </td>
                        <td colspan="2">The Seller will be entitled to draw upon any amounts paid into the Escrow Account subject to the requirements of the Escrow Account Law.</td>
                      </tr>
                      <tr>
                      <td></td>
                      <td>(f) </td>
                        <td colspan="2">The Purchaser acknowledges and agrees that the Purchase Price does not include any value added tax (VAT) and, in the event that VAT is imposed on the sale of the Unit, the Purchaser shall be solely liable to pay such VAT in addition to the Purchase Price and any other charges payable under this Agreement which amount shall be payable by the Purchaser to the Seller as required by the Relevant Authorities.</td>
                      </tr>`;
        }
        template += `
                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>2.2 Escrow</b></td>
                      </tr>
                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser acknowledges and agrees that:</td>
                      </tr>
                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">the Seller will be entitled to draw upon any amounts paid into the Escrow Account subject to the requirements of the Escrow Account Law;</td>
                      </tr> <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">if requested by the Escrow Agent or the Seller, the Purchaser will promptly sign and return to the Seller any and all paperwork, documents and agreements that are required from time to time by the Escrow Agent or the Seller to process any payments into or from the Escrow Account or that are necessary for the opening, maintenance and/or closing of the Escrow Account; and</td>
                      </tr> <tr>
                      <td></td>
                      <td>(c) </td>
                        <td colspan="2">if applicable, the Purchaser shall pay to the Seller the Final Instalment into the Seller’s nominated account.</td>
                      </tr>
                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>2.3	Late Payment</b></td>
                      </tr>
                      <tr>
                      <td></td>
                      <td colspan="3">Without prejudice to the Seller's other rights and remedies under this Agreement or any Applicable Laws: </td>
                      </tr>
                      <tr>
                      <td></td>
                      `;
        if (contractData.subsidiary != 9) {
          template += `<td>(a) </td>
                        <td colspan="2">the Purchaser agrees to pay Compensation to the Seller on all overdue Instalments (and on all other overdue monies payable by the Purchaser under this Agreement) from the respective Instalment Payment Date (or the day such payment became due for payment) until the actual date full payment is received by the Seller as cleared funds. The Purchaser agrees that any funds received by the Seller from the Purchaser thereafter will be allocated first in the discharge of any Compensation, and then towards any and all other monies due under this Agreement, and then towards payment of the Purchase Price; and</td>`;
        } else {
          template += `<td>(a) </td>
                          <td colspan="2">The Purchaser agrees to pay a penalty at the rate of one percent (1%) per month on all payments in default and other monies payable under this Agreement that remain unpaid after they have become due, from the date they became due until the actual date payment is made. Such penalty shall be considered Compensation, and the Purchaser agrees to pay this Compensation to the Seller on all overdue instalments (and on all other overdue monies payable) from the respective Instalment Payment Date (or the day such payment became due) until full payment is received by the Seller as cleared funds. The Purchaser further agrees that any funds received by the Seller thereafter will be allocated first to discharge any penalties (Compensation), and then to any other outstanding monies due under this Agreement, and then towards payment of the Purchase Price.</td>`
        }
        template += `
                      </tr>
                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">the Purchaser indemnifies, keeps indemnified and holds the Seller harmless from and against any and all costs whatsoever, including lawyers' fees, agents' fees, collection fees and commissions, expenses, administration costs and other charges, that may be incurred by the Seller in the recovery of any monies owed by the Purchaser pursuant to this Agreement.</td>
                      </tr>
                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>2.4	Loan Finance</b></td>
                      </tr>
                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser agrees that this Agreement is not subject to the Purchaser obtaining a loan or financing in any form whatsoever from a bank or any other financial institution for the Purchase Price or any part thereof and that any failure to obtain such loan or financing shall not relieve the Purchaser of any of its obligations under this Agreement, which continue in full force and effect from the Effective Date. If requested by the Purchaser, the Seller may, in its absolute discretion, accept monies from a recognised bank or financial institution as a payment made on behalf of the Purchaser.</td>
                      </tr>
                    </table>`;
      }

      //     // // 3 Unit Works
      {
        template += `<table style="font-size:10pt;width:100%;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;  ">3	Unit Works </td>
                      </tr>

                      <tr>
                      <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>3.1	Seller's Obligations</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">The Seller shall use all reasonable commercial endeavours to procure that the Unit Works are undertaken:</td>
                      </tr>

                      <tr>
                        <td></td>
                        <td></td>
                      <td>(i) </td>
                        <td>in a proper and workmanlike manner using all reasonable care and skill and in accordance with good building practice;</td>
                      </tr>

                      <tr>
                        <td></td>
                        <td></td>
                      <td>(ii) </td>
                        <td>with good quality and suitable materials;</td>
                      </tr>

                      <tr>
                        <td></td>
                        <td></td>
                      <td>(iii) </td>
                        <td>in accordance with the requirements of the Relevant Authorities and Applicable Laws; and</td>
                      </tr>

                      <tr>
                        <td></td>
                        <td></td>
                      <td>(iv) </td>
                        <td>substantially in accordance with the Draft Unit Plan, the Draft Unit Specification and the provisions of this Agreement and the Disclosure Statement (including any agreed deviations). </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">The Seller shall use all reasonable commercial endeavours to procure the assignment to the Purchaser of the benefit of any manufacturer’s warranties in respect of any items installed by or on behalf of the Seller in the Unit insofar as they are capable of being assigned (which shall be determined by the Seller in its absolute discretion).</td>
                      </tr>

                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>3.2	Seller's Variations</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">To the extent that the Draft Unit Specification or the Disclosure Statement specifies the materials, finishes and utility connections of the Unit, the Purchaser acknowledges and agrees that the Seller may vary or replace such materials, finishes and utility connections as specified in the Draft Unit Specification or the Disclosure Statement with materials, finishes and utility connections of comparable or higher quality (as determined by the Seller in its absolute discretion) and the Purchaser will make no objection, requisition or claim for compensation in respect of such variation.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">The Purchaser acknowledges and agrees that the details of the design, features, amenities, layout and area of the Unit and the Project in general, as described in this Agreement and the Disclosure Statement are indicative only and the Seller may vary the design, features, amenities, layout and area of the Unit and the Project as considered necessary or desirable by the Seller, or to comply with any Applicable Laws or the requirements of any Relevant Authority.</td>
                      </tr>

                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>3.3	Unit Area Variations</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">The Purchaser agrees that the Approximate Unit Area is an approximation by the Seller of the Final Unit Area calculated in accordance with the Jointly Owned Property Law.  </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">If the Final Unit Area following the completion of the Unit Works is less than the Approximate Unit Area by more than five percent (5%), the Purchase Price will be reduced proportionally to account for the reduction in the area. The Purchase Price will be amended to reflect such a reduction following Completion once the Final Unit Area has been determined by a Licensed Surveyor and title issued by the Relevant Authorities for the Unit. </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                        <td colspan="2">If the Final Unit Area following the completion of the Unit Works is greater than the Approximate Unit Area by more than five percent (5%), the Purchase Price will be increased proportionally to account for the additional area. The Purchase Price will be amended to reflect such increase following Completion once the Final Unit Area has been determined by a Licensed Surveyor and title issued by the Relevant Authorities for the Unit. Any increase in the Purchase Price will be due and payable with the Final Instalment of the Purchase Price on Completion, as notified to the Purchaser.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                        <td colspan="2">This variation to the Purchase Price shall be the sole remedy of the Purchaser as a result of any increase or decrease in the Final Unit Area and the Purchaser agrees it shall not have any further rights or entitlements as a result of such variation.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(e) </td>
                        <td colspan="2">If the Final Unit Area varies from the Approximate Unit Area by five percent (5%) or less, the Purchase Price shall remain the same.  </td>
                      </tr>

                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>3.4	Car Parking</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">The Unit is sold with the Car Parking Spaces specified in Item 3 of the Particulars which form part of the title to the Unit.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">The Purchaser acknowledges and agrees that if any visitor car parking is provided, such visitor car parking within the Project will be provided on a commercial basis and subject to availability.</td>
                      </tr>

                      </table>`;
      }

      //     // // 4 Unit Inspection and Defect Rectification
      {
        template += `<table style="font-size:10pt;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                       <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">4	Unit Inspection and Defect Rectification</td>
                       </tr>

                       <tr>
                       <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>4.1	Identification of Deficiencies</b></td>
                     </tr>

                     <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">The Purchaser will be entitled one (1) inspection of the Unit (or such other amount as agreed to by the Seller in its sole discretion) after receiving the Completion Notice and before Completion, at a time nominated by the Engineer, for the purpose of inspecting the Unit for any Deficiencies. The Engineer (or its nominee) shall accompany the Purchaser at such inspections.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">During the inspections referred to in clause 4.1(a) the Purchaser shall complete and sign the  listing any Deficiencies that are identified in the Unit. The list of Deficiencies specified in the Declaration of Adherence and Acknowledgement shall then be conclusively determined and finalised by the Engineer and submitted to the Contractor for the purposes of rectification of such Deficiencies within a reasonable period of time (such period to be notified to the Purchaser by the Engineer).</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                        <td colspan="2">The Purchaser agrees that the Seller will not be obliged to rectify any Deficiencies prior to the Completion Date and that the rectification of such Deficiencies will not affect or delay the Completion Date or the obligations of the Purchaser under this Agreement including the obligation to pay the Final Instalment (and any other monies due and payable under this Agreement) on the Completion Date.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                        <td colspan="2">The Purchaser agrees that any Deficiencies submitted to the Seller for rectification pursuant to clause 4.1(b) will be rectified by the Contractor (or the Seller) to the exclusive satisfaction of the Engineer.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(e) </td>
                        <td colspan="2">In the event of any dispute concerning any Deficiencies and/or their rectification, a decision by the Engineer in this respect will be final and binding on the Seller and the Purchaser.</td>
                      </tr>

                     <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>4.2	Free from Deficiencies</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">If the Purchaser does not identify any Deficiencies pursuant to clause 4.1 the Purchaser must sign the Declaration of Adherence and Acknowledgement confirming that the Purchaser has inspected the Unit and has not identified any Deficiencies at such inspections and has accepted the physical state and condition of the Unit.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">Where the Purchaser fails to inspect the Unit on the agreed inspection date or the Purchaser does not otherwise sign the Declaration of Adherence and Acknowledgement, the Unit shall be deemed to be free of any Deficiencies and the Purchaser's right to require the rectification of any Deficiencies under clause 4.1 shall lapse.</td>
                      </tr>

                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>4.3	Purchaser's Access</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">The Purchaser agrees that, except for the inspection of the Unit pursuant to clause 4.1(a), the Purchaser shall not be allowed access to the Unit prior to the Completion Date without the prior written consent of the Seller which consent may be withheld in the Seller's absolute discretion. </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">Any access by the Purchaser to the Unit shall be at the sole and exclusive risk and cost of the Purchaser and the Purchaser hereby indemnifies, keeps indemnified and holds harmless the Seller, the Engineer, the Contractor (and their respective Affiliates, directors and employees) against any and all actions, claims, costs, damages, demands, expenses, liabilities, losses and proceedings whatsoever that may be incurred by the Seller in connection with such access by the Purchaser.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                        <td colspan="2">For the avoidance of doubt, the Seller shall not be obliged to consent to any access to the Unit by the Purchaser’s contractors or supplier prior to the Completion Date.</td>
                      </tr>

                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>4.4	Defect Liability Period</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">In accordance with, and to the extent provided by, Applicable Laws, upon the direction of the Engineer, the Seller shall procure the Contractor to rectify or replace (as determined by the Engineer) any defective civil works in the Unit (including mechanical, plumbing and electrical works but excluding any minor cracks and snags, appliance malfunction or any defects caused by the misuse by the Purchaser or its Occupier) installed by or on behalf of the Seller and as notified to the Seller within one (1) year from the Construction Handover Date (except where any relevant warranties have been assigned to the Purchaser pursuant to clause 3.1(b)) in which case the Purchaser shall be solely responsible for procuring rectification or replacement.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">In accordance with, and to the extent provided by, the Applicable Law, the Seller shall procure the Contractor to rectify any structural defects that may appear in the Project and are notified to the Seller within ten (10) years from the Construction Handover Date. </td>
                      </tr>

                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>4.5	Seller's Post Completion Works</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">The Purchaser acknowledges and agrees that other Units in the Project, the Common Areas and/or the Residential Facilities may not be fully constructed by the Completion Date.  </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">The Purchaser acknowledges and agrees that it shall not be entitled to make any objection, requisition or claim for compensation, nor delay Completion, on the basis that there are ongoing construction activities within the Project (including the Common Areas and the Residential Facilities) and that the Purchaser may be caused inconvenience as a result of ongoing construction activities, provided always that reasonable access is available to the Unit.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                        <td colspan="2">The Purchaser acknowledges and agrees that the unit numbering is provisional and that the Seller, the Relevant Authorities may designate a different number to the Units (including the Unit) upon Registration of the Common Areas Site Plan.</td>
                      </tr>

                      </table>`;
      }
      //     // // 5 Completion and Risk
      {
        template += `<table style="font-size:10pt;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">5	Completion and Risk</td>
                      </tr>

                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>5.1	Completion</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">It is anticipated by the Seller that the Unit will be completed (as determined by the Engineer and excluding any Deficiencies which shall be rectified in accordance with clause 4) on or before the Anticipated Completion Date.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">The Seller and the Purchaser agree that the Anticipated Completion Date represents the Seller’s current estimate of the date by which the Seller expects that the construction of the Unit will be complete, provided always that a Force Majeure Event or a Foreign Reason does not occur which delays such construction. </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                        <td colspan="2">The Purchaser acknowledges and agrees that the actual Completion Date may occur before the Anticipated Completion Date provided that the Seller serves on the Purchaser the Completion Notice in accordance with clause 5.1(d).  The Purchaser must complete this Agreement on the Completion Date notified in the Completion Notice and will be required to make payment of the balance of the entire Purchase Price and all other amounts due and payable under this Agreement on the Completion Date and do all other things necessary as advised by the Seller. </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                        <td colspan="2">The Seller shall serve the Completion Notice upon the Purchaser not less than twenty (20) Working Days in advance of the Completion Date. The Completion Notice will be conclusive and binding on the Parties as to the Completion Date. The Completion Date will not be deemed to have been determined unless and until the Completion Notice has been served on the Purchaser by the Seller. The Seller must serve the Completion Notice on the Purchaser in accordance with clause 20.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(e) </td>
                        <td colspan="2">Without prejudice to the Seller’s rights under clause 16.1 or in respect of Force Majeure Events or Foreign Reasons generally, the Anticipated Completion Date may be extended by the Seller, in its absolute discretion and without cause, by written notice to the Purchaser for one or more periods of up to a total of thirty-six (36) months.  </td>
                      </tr>

                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>5.2	Passing of Risk</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">Provided that the Purchaser has fulfilled the Purchaser’s obligations under this Agreement, and subject to the provisions contained in this Agreement, the Purchaser shall have the right to, and bear the risk of, possession of the Unit from the Completion Date.  </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">The Seller will be entitled to decline Completion and refuse to hand over possession and occupation of the Unit to the Purchaser if the Purchaser has failed to pay any monies owed under this Agreement or has failed to rectify any breach of any provision of this Agreement. </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                        <td colspan="2">All rights and risks in respect of the Unit will pass to the Purchaser on Completion, irrespective of whether or not the Purchaser has taken physical possession of the Unit.  </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                        <td colspan="2">The possession and risk with respect to the Common Areas shall pass as set out in the Jointly Owned Property Law.  </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(e) </td>
                        <td colspan="2">The Purchaser shall be liable to repair and keep in good and substantial repair and condition the whole of the Unit, to ensure the Unit and shall be responsible for all obligations including the payment of all Service Charges, and other charges in respect of the Unit. </td>
                      </tr>

                      </table>`;
      }

      //     // // 6 Registration and Transfer of Title

      {
        template += `<table style="font-size:10pt;width:100%;">
                      

                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">6	Registration and Transfer of Title</td>
                      </tr>

                      <tr>
                      <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>6.1	Registration of this Agreement</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">Within five (5) Working Days of the Effective Date (or such other period stipulated by the Applicable Laws), and subject to the Purchaser having paid the Registration Fees, the Seller shall submit an application for Registration of the Purchaser’s interest in the Unit in the Pre-registration System at the sole cost of the Purchaser.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">The Parties shall take all reasonable steps and sign any necessary documentation as required by the Relevant Authorities to enable Registration of the Purchaser’s interest in the Unit in the Pre-registration System.</td>
                      </tr>


                      <tr>
                      <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>6.2	Registration of Title</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">Following Completion, the Seller shall use all reasonable commercial endeavours to transfer title to the Unit into the name of the Purchaser and, within thirty (30) Working Days of the Completion Date, assist the Purchaser with procuring the Registration of such transfer, provided that the Purchaser:</td>
                      </tr>

                      <tr>
                        
                      <td></td>
                      <td></td>
                      <td>(i) </td>
                      <td>has paid all Instalments in accordance with this Agreement;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(ii) </td>
                      <td>has paid all Registration Fees and costs in accordance with clause 6.3; </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(iii) </td>
                      <td>has executed the Declaration of Adherence and Acknowledgement;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(iv) </td>
                      <td>has fully complied with, and is not otherwise in breach of, any of its obligations under this Agreement (including any payment obligation); </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(v) </td>
                      <td>where applicable, uses all reasonable endeavours to assist the Seller in respect of the transfer of title and ownership; and </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(vi) </td>
                      <td>is solely liable for satisfying the Relevant Authorities as to their requirements to enable Registration of the transfer of title to the Unit into the name of the Purchaser.</td>
                      </tr>

                      
                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">The Purchaser must supply to the Relevant Authorities all information and sign all documents as may be required by the Relevant Authorities to affect the Registration of the transfer of title to the Unit.</td>
                      </tr>
                      
                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">The Purchaser acknowledges and agrees that Completion is not contingent upon the Registration of the title to the Unit to the Purchaser.  </td>
                      </tr>
                      
                      <tr>
                      <td></td>
                      <td>(d) </td>
                      <td colspan="2">The Purchaser acknowledges that the Seller shall not be liable in any way for any delay in the Purchaser procuring (or the Relevant Authorities executing) the Registration of the title to the Unit into the name of the Purchaser.</td>
                      </tr>
                      
                      <tr>
                      <td></td>
                      <td>(e) </td>
                      <td colspan="2">The Purchaser agrees that the transfer of title pursuant to this clause 6.2 shall be in accordance with and to the extent permitted by the Applicable Laws. In the event of any conflict or inconsistency between the provisions of this Agreement and the Applicable Laws, the Applicable Laws shall prevail to the extent of any conflict or inconsistency.</td>
                      </tr>

                      <tr>
                      <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>6.3	Registration Fees</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">The Purchaser shall pay to the Relevant Authorities or to the Seller for payment to the Relevant Authorities (as advised by the Seller) all Registration Fees with respect to the Registration of the transfer of title to the Unit into the name of the Purchaser. The Registration Fees are payable on the Effective Date.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">As at the Effective Date, the Parties anticipate that the Registration Fees payable by the Purchaser in accordance with clause 6.3(a) is equivalent to four per cent (4%) of the Purchase Price (plus further administrative and application fees) which are payable at the time of Registration of the Purchaser’s interest in the Unit in the Pre-Registration System.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">The Purchaser acknowledges and agrees that the Purchaser shall be solely liable for all increases in the Registration Fees that may occur from time to time and for all other fees, taxes (including any value added tax or similar tax, whether imposed on the Purchaser or on the Seller), title transfer charges, levies, rate assessments, bank and credit charges, and all other fees and/or charges that may be levied by the Relevant Authorities, including the Master Developer, on the transfer of the Unit from the Seller to the Purchaser or otherwise with respect to the Unit either prior to or following the Completion Date.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                      <td colspan="2">If the Agreement is terminated or if the Purchaser enters into a Disposal prior to Registration of the Purchaser’s interest in the Unit, the Seller shall be entitled to retain the Registration Fees. For the avoidance of doubt, the Transferee must pay the Registration Fees for the Registration of its interest in the Unit on the effective date of the Disposal. </td>
                      </tr>

                      <tr>
                      <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>6.4	Notations on Title</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">The Purchaser acknowledges and agrees that the transfer of title to the Unit pursuant to clause 6.2 and that the title to the Unit is subject to:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(i) </td>
                      <td>the Purchaser’s rights and obligations contained in this Agreement;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(ii) </td>
                      <td>the Purchaser’s rights and obligations contained in the Governance Documents; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(iii) </td>
                      <td>any and all easements, positive and/or negative covenants, restrictions on use and rights of way benefiting or burdening the Unit and/or the Project with or in favour of the Seller, the Owners, the Strata Manager, the Master Developer and/or any Relevant Authority.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">The Purchaser must make no objection, requisition or claim for compensation with respect to any affectations burdening the Unit, the Common Areas or the Project or any notations of the same on the title to the Unit including a restriction on the title that states that title to the Unit is subject to the "terms, conditions, covenants, rights and restrictions set out in the Governance Documents and the rules, regulations and by-laws issued in accordance therewith as may be amended from time to time" (or similar wording determined by the Seller in its absolute discretion).</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">The Purchaser acknowledges and agrees that it may be necessary for the Draft Unit Plan and the draft plans annexed to the Disclosure Statement or the Governance Documents identifying the Unit and the Common Areas to be substituted with plans in a form approved by the Relevant Authorities to enable Registration of the Unit and the Project. Subject to clause 3.3, the Purchaser may not raise any objection, requisition, claim for compensation or delay in Completion, with respect to any changes to the Draft Unit Plan and the draft plans annexed to the Disclosure Statement or the Governance Documents.</td>
                      </tr>

                      </table>`;
      }
      //     // // 7 Management
      {
        template += `<table style="font-size:10pt;width:100%;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">7	Management </td>
                      </tr>

                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>7.1	Master Community Management</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser acknowledges and understands that:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">the Project is located within the Master Community;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">the Master Developer may recover its costs in respect of the Operation of the Master Community in the form of Master Community Charges which are payable by the Purchaser in addition to the Service Charges, either directly to the Master Developer or to the Seller;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                        <td colspan="2">the Purchaser acknowledges and agrees that the Purchaser together with the Purchaser's heirs, successors-in-title, permitted successors or assigns, shall be bound by the Master Community Declaration; </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                        <td colspan="2">building works may continue in the Master Community after Completion and the Purchaser shall have no claim of any nature whatsoever against the Master Developer, the Seller or any of their respective affiliates or nominees for compensation or damages in respect of all such ongoing building works and construction activities in the Master Community;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(e) </td>
                        <td colspan="2">the Master Developer reserves the right to amend, exclude, revise or provide additional facilities and amenities within the Master Community at its discretion and reserves the right to sell, transfer, exchange, or assign such amenities and facilities without notice to the Seller, Purchaser or Strata Manager;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(f) </td>
                        <td colspan="2">the Master Developer may make changes to the Master Community as a result of changes to the Applicable Law or the directions of any Relevant Authority or if the Master Developer considers that changes are in the best interests of the Master Community;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(g) </td>
                        <td colspan="2">this Agreement is a personal contract between the Seller and the Purchaser and the Master Developer assumes no liability and gives no warranty to the Purchaser for the proper performance of the Seller's obligations under this Agreement; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(h) </td>
                        <td colspan="2">the Seller makes no warranty or representation whatsoever that the master community facilities within the Master Community shall be constructed and/or operational by the Master Developer by the Completion Date or at any time thereafter.</td>
                      </tr>

                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>7.2	Project Management</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser acknowledges and agrees that:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">the proposed title structure for the Project, as further described in the Disclosure Statement, is based on the Seller's current understanding as to the manner in which the Project shall be subdivided, operated and managed under the Jointly Owned Property Law;</td>
                      </tr>

                      <tr>
                        <td></td>
                        <td></td>
                      <td>(i) </td>
                        <td>the Seller may make changes to the proposed title structure for the Project as a result of changes to the Applicable Laws, contractual arrangements the Seller has with other parties, if requested by the Relevant Authorities, or if the Seller considers it to be in the best interests of the Project;</td>
                      </tr>

                      <tr>
                        <td></td>
                        <td></td>
                      <td>(ii) </td>
                        <td>the Purchaser, as Owner, together with all Owners, shall be bound by the terms of the Governance Documents (as may be amended, from time to time, in accordance with the Jointly Owned Property Law);</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">pursuant to the Applicable Laws, up to and until Completion, the Purchaser is not the Owner of the Unit and shall have no rights in and receive no benefit from the Unit; </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                        <td colspan="2">it is solely liable for and must pay all Service Charges and other outgoings that may be levied by the Seller, the Strata Manager and/or any Relevant Authority (or the Seller on their behalf) on or with respect to the Unit from the Completion Date; </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                        <td colspan="2">the Strata Manager shall have the authority and shall recover the costs in respect of the Management of the Common Areas and the Residential Facilities in the form of Service Charges; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(e) </td>
                        <td colspan="2">the Purchaser indemnifies, and must keep indemnified and hold harmless, the Strata Manager and the Seller, against all action claims, costs, damages demands, expenses, liabilities, losses, proceedings or other liability in any way arising directly or indirectly from or otherwise in connection with the Strata Manager undertaking its function under the Governance Documents and/or undertaking any other functions as requested by the Owners from time to time, including any costs incurred by the Strata Manager (or the Seller) in seeking to enforce the obligations of the Owners (and the Occupiers and Invitees) under the Governance Documents.</td>
                      </tr>

                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>7.3	Seller to Manage until Appointment of Strata Manager</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">Until such time as a Strata Manager has been appointed, the Seller (or its nominee) may undertake the functions (and have such rights and obligations) in respect of the Management of the Project and the Common Areas in accordance with the provisions in the Governance Documents.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">The Purchaser indemnifies and must keep indemnified the Seller (and any nominated manager) against all actions, claims, costs, damages, demands, expenses, liabilities, losses, proceedings or other liability in any way arising directly or indirectly from or otherwise in connection with the Seller undertaking the functions of the Strata Manager under the Governance Documents and/or undertaking any other function as requested by the Owners (or otherwise required for the benefit of the Project) from time to time including any costs incurred by the Seller in seeking to enforce the obligations of the Owners (and their Occupiers and Invitees) under the Governance Documents.</td>
                      </tr>

                      <tr>
                        <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>7.4	Reserved Rights</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                        <td colspan="2">The Seller expressly reserves and the Purchaser grants to the Seller (and the Seller’s nominees) the following rights: </td>
                      </tr>

                      <tr>
                        <td></td>
                        <td></td>
                      <td>(i) </td>
                        <td>the right to install, erect, place and display, both before and after the Completion Date, any advertising, marketing and promotional material of any kind whatsoever, whether temporary or permanent, on the façade of, or within, the Project, including the Common Areas, as determined by the Seller in its absolute discretion from time to time, including, without limitation, and any Project Marks; </td>
                      </tr>

                      <tr>
                        <td></td>
                        <td></td>
                      <td>(ii) </td>
                        <td>the right to install, erect and place, both before and after the Completion Date, any fixtures, fittings and equipment for the purpose of receiving and transmitting telecommunication and media signals (and the like), of any kind whatsoever, whether temporary or permanent, on the façade of, or within, the Project including the Common Areas, as determined by the Seller in its absolute discretion, including, without limitation, any aerials, satellite dishes, masts, pylons, towers, substations and the like; and</td>
                      </tr>

                      <tr>
                        <td></td>
                        <td></td>
                      <td>(iii) </td>
                        <td>to enter and access all parts of the Common Areas and the Units (through, over or under the Project and the Units) at all reasonable times upon reasonable notice (except in the case of emergency where no notice is required) to do all things required under this Agreement and/or the Governance Documents, including access to inspect, clean, maintain, repair, connect, remove, replace, secure and/or execute any works whatsoever to conduits, cabling, equipment, Utility Services regarding any part of the Project or a Unit as may be necessary.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                        <td colspan="2">The Purchaser must, together with all other Owners, grant such rights, easements or the like necessary to give effect to the Seller’s rights contained in clause 7.4(a), including, but not limited to, such access rights and Exclusive Use Rights with respect to designated areas of the Common Areas as determined necessary or desirable by the Seller. If required by the Seller, the Owners must agree to the Strata Manager granting to the Seller (or its nominee) a licence or lease to the Seller with respect to the designated areas of the Common Areas required to give effect to the Seller’s rights contained in clause 7.4(a) in the form required by the Seller.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                        <td colspan="2">No fee shall be payable by the Seller (or its nominee) in respect of the rights contained in clause 7.4(a) and no licence fee or rent shall be payable by the Seller in respect of any licence or lease granted to the Seller by the Strata Manager pursuant to clause 7.4(a). The Seller shall be solely entitled to all revenue or profit received by the Seller from or associated with the Seller exercising its rights contained in clause 7.4(a) and the Seller has no obligation whatsoever to account to the Owners for any revenue or profit received by the Seller.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                        <td colspan="2">In exercising the rights contained in clause 7.4(a), the Seller shall not interfere unreasonably with an Owner's lawful use or quiet enjoyment, cause as little damage as possible, and, if physical damage is caused as a result of such access, restore it, at its own cost, as nearly as practicable to the condition it was in before the damage occurred.</td>
                      </tr>

                      </table>`;
      }
      //     // // 8 Residential Facilities
      {
        template += `<table style="font-size:10pt;width:100%;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">8	Residential Facilities </td>
                      </tr>

                      <tr>
                      <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>8.1	Provision of Residential Facilities</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">Subject to the provisions contained in the Governance Documents, the Residential Facilities shall be available for use by the Owners (and the Occupiers). </td>
                      </tr>

                      <tr>
                      <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>8.2	Management of the Residential Facilities</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser acknowledges and agrees:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">the Residential Facilities form part of the Common Areas and are under the control and responsibility of the Strata Manager and the Seller; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">the Strata Manager shall prepare the budget for the Residential Facilities and the Common Areas for every operating year and the Owners shall be responsible for their share of the cost of the provision of the Residential Services and the Management of the Common Areas which shall be included in the Service Charges.</td>
                      </tr>

                      <tr>
                      <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>8.3	Use of the Residential Facilities</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser acknowledges and agrees, as an Owner, that:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">it must strictly comply, and use all reasonable endeavours to ensure that the Occupiers fully comply, with all Project Rules and the directions of the Seller and the Strata Manager (and their respective employees and nominees) with respect to the use of the Common Areas (including the Residential Facilities);</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">it uses the Common Areas (including the Residential Facilities) at its own risk and indemnifies and holds the Seller and the Strata Manager (and their respective employees and nominees) harmless against any loss, damage or injury arising from the use of the Common Areas (including the Residential Facilities); and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">the Seller and/or the Strata Manager may restrict the hours of use of the Residential Facilities in its absolute discretion, and temporarily close the Common Areas (including the Residential Facilities) for the purpose of undertaking any cleaning, repair or maintenance of the Common Areas (including the Residential Facilities).</td>
                      </tr>

                      </table>`;
      }
      //     // // 9	Governance Documents
      {
        template += `<table style="font-size:10pt;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">9	Governance Documents</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">9.1 </td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser acknowledges and agrees that the Purchaser, together with the Purchaser's heirs, personal representatives, successors and assigns, shall be bound by the Governance Documents, which include the Project Rules, and shall comply with the Governance Documents at all times. </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">9.2	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser further acknowledges that the Governance Documents are in draft form. The Seller may make such changes to the Governance Documents as required by the Relevant Authorities or otherwise as considered by the Seller to be necessary or desirable for the benefit of the Project.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">9.3	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">If possible, steps will be taken so that the Registration of the transfer of title to the Unit will be made subject to the terms of the Governance Documents in the form of a restriction. If this is not possible, the Purchaser personally and on behalf of its successors-in-title, permitted successors and assigns acknowledges, agrees and undertakes for the benefit of the Seller, the Strata Manager and the Owners, from time to time, of any property in the Project that the Governance Documents are a restriction in perpetuity on the title to the Unit and are equally binding on all Owners.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">9.4	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Governance Documents apply to the Unit and the Purchaser, together with the Purchaser's heirs, personal representatives, successors and assigns, shall be bound by and comply with the Governance Documents irrespective of whether or not the Purchaser signed the Declaration of Adherence and Acknowledgement.</td>
                      </tr>

                      </table>`;
      }
      //     // // 10 Permitted Use
      {
        template += `<table style="font-size:10pt;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">10	Permitted Use </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">10.1 </td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser must not use the Unit for any other purpose than the Permitted Use</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">10.2 </td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser must not seek to change the Permitted Use of the Units at any time.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">10.3 </td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser must not, and shall procure that its Occupiers will not, use any Car Parking Space for anything other than the parking of one vehicle per space and must comply with all Project Rules and the directions of the Strata Manager and the Seller at all times.</td>
                      </tr>

                      </table>`;
      }
      //     // // 11 Service Charges
      {
        template += `<table style="font-size:10pt;width:100%;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>

                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">11	Service Charges</td>
                      </tr>

                      <tr>
                      <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>11.1	Service Charges Calculation</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">The Purchaser shall be liable for and must pay the Service Charges without any deduction, set-off or other withholding whatsoever from the Completion Date (whether or not the Purchaser has completed this Agreement or is the Owner) and agrees that the Purchaser has a continuing obligation (together with all Owners) to:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(i) </td>
                      <td>contribute towards the expenses for the Management of the Common Areas generally calculated and payable in accordance with the provisions of the Governance Documents, including an obligation to contribute to the General Fund and the Reserve Fund established with respect to the Common Areas, based on the Entitlements;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(ii) </td>
                      <td>Contribute towards the Master Community Charges calculated and payable in accordance with the provisions of the Master Community Declaration.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">The Purchaser shall be liable to pay the Service Charges whether or not it uses the Common Areas, Residential Services, Residential Facilities and/or the Unit.</td>
                      </tr>

                      <tr>
                      <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>11.2	Service Charge Deposit</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">Subject to the Applicable Laws, the Purchaser must pay to the Seller the Service Charge Deposit on the Completion Date (or on a date after the Completion Date as advised by the Seller) as a continuing security for the Purchaser's obligation to pay Service Charges and such Service Charge Deposit must be reinstated by the Purchaser if the Service Charge Deposit is less than six (6) months’ payment of the current Service Charges at any given time. </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">In addition to any rights which the Strata Manager may have under Applicable Law in respect of unpaid Service Charges, the Strata Manager may apply the Service Charge Deposit in whole or in part either towards any overdue Service Charges or towards payment obligations pursuant to the Governance Documents. If the whole or any portion of the Service Charge Deposit is so applied, the Strata Manager shall notify the Purchaser in writing and the Purchaser must immediately reinstate the Service Charge Deposit to the original amount. The Purchaser is not entitled to set-off any Service Charges or other amounts payable by the Purchaser against the Service Charge Deposit. </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">Upon the future sale of the Unit by the Purchaser, the Strata Manager shall credit to the Purchaser’s Transferee the Service Charge Deposit held by the Strata Manager and the Purchaser as transferor shall make an adjustment directly with the Transferee to effectively reimburse the Purchaser the Service Charge Deposit previously paid by it.   For the avoidance of doubt, the Strata Manager will only credit the Transferee the Service Charge Deposit held by the Strata Manager once all Service Charges are paid in full and will not refund the Purchaser the Service Charge Deposit upon any transfer.</td>
                      </tr>

                      <tr>
                      <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>11.3	Estimated Service Charge and First Provisional Service Charge</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">The Seller has provided an Estimated Service Charge Rate in the Disclosure Statement which reflects the Seller’s current estimation as to the rate by which Service Charges will be calculated in the first year following the Completion Date. </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">The Seller discloses and the Purchaser acknowledges and agrees that the Seller may vary the Estimated Service Charge prior to the Completion Date to reflect the actual rate upon which the First Provisional Service Charge will be raised, which, for the avoidance of doubt, may be higher than the Estimated Service Charge Rate. </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">The Seller shall endeavour to advise the Purchaser of the First Provisional Service Charge as soon as practicable following the service of the Completion Notice. The Purchaser must pay the First Provisional Service Charge to the Seller in full and in advance on the Completion Date.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                      <td colspan="2">If the Seller has paid any Service Charges that are attributable to the Unit for a period beyond the Completion Date, the Purchaser must reimburse the Seller for its proportional share of such charges (as determined by the Seller) and these amounts are payable to the Seller on the Completion Date and such amount may be included in the First Provisional Service Charge. </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(e) </td>
                      <td colspan="2">If, upon determination of the actual expenses of the Seller (or the Strata Manager, if appointed) for the period from the Completion Date to the end of the first service charge period, the Purchaser's Service Charges:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(i) </td>
                      <td>exceed the amount already paid as the First Provisional Service Charge, the Purchaser must pay the excess to the Seller, on demand; or</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(ii) </td>
                      <td>are less than the amount already paid as the First Provisional Service Charge, the Seller shall credit the excess to the Purchaser against the next payment of Service Charges.</td>
                      </tr>

                      <tr>
                      <td colspan="4" style="padding-bottom:5px;padding-top:8;"><b>11.4	Service Charges Default</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser acknowledges and agrees that if the Purchaser fails to pay the Service Charges, the Seller may withdraw the access to the Residential Facilities, without prejudice to any other rights that it may have, exercise its rights provided under the Jointly Owned Property Law.</td>
                      </tr>

                      </table>`;
      }
      //     // // 12 Taxes and Utility Charges
      {
        template += `<table style="font-size:10pt;width:100%;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">12	Taxes and Utility Charges </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">12.1</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser agrees that it shall be liable to pay all Taxes and Utility Charges attributable to the Unit from the Completion Date.  </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">12.2</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">On the Completion Date, the Purchaser shall pay the Utility Connection Charge to the Seller.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">12.3</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">If any Taxes or Utility Charges have been paid by the Seller in respect of the Project (or proportionally in respect of the Unit) for a period beyond the Completion Date, the Purchaser shall reimburse the Seller the proportion of such amount on the Completion Date and such amount may be included within the First Provisional Service Charge. </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">12.4</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">If required, the Purchaser agrees to enter into end user agreements with the Utility Provider to collect Utility Charges in respect of the Unit. </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">12.5</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser shall indemnify and keep indemnified and hold the Seller and the Strata Manager harmless, against all actions, costs, claims, damages, demands, expenses, liabilities, losses and proceedings whatsoever arising from the Purchaser's failure to pay all Taxes and Utility Charges to the Relevant Authorities or Utility Provider as may be due and payable by the Purchaser in respect of the Unit (or proportionally payable by the Purchaser in respect of any Common Areas).</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">12.6</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">If applicable, following the Completion Date and in accordance with FEWA’s requirements, the Seller shall inform the Purchaser of the FEWA meter serial number applicable to the Unit and the Purchaser undertakes to transfer the FEWA account into the Purchaser’s name. The Purchaser must submit a copy of the FEWA receipt of payment of the deposit as proof that the Purchaser complied with this clause 12.6 to the Strata Manager, and failure to comply with the condition hereunder will lead to automatic disconnection. The Seller shall not be held responsible for any outage and/or problems and/or failure caused by the Purchaser or the Utility Service Provider in relation to Utility Services.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">12.7</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">All amounts payable under this Agreement, the Governance Documents or any agreement referred to in any of them are exclusive of Taxes. If Taxes are chargeable on any amount, the Purchaser shall pay to the Seller (or the relevant payee of such amount) the Taxes in addition to the amount required to be paid. Where the amount paid by the Purchaser is insufficient to account for the Taxes as well as the amount due and payable to the Seller (or relevant payee), then the Seller shall, at its sole discretion, apply the amount paid towards the Taxes and/or towards the due amount in such proportions as the Seller deems fit.  For the avoidance of doubt, the Purchaser shall remain liable for any shortfall in the Taxes or the due amount.  </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">12.8</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">Chilled Water</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser acknowledges and agrees that:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">the Seller may enter into an agreement with an exclusive supplier with respect to the supply of chilled water to the Project, including the Unit that, amongst other matters, may provide for:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(i) </td>
                      <td>the Owners to purchase a minimum quantity of chilled water from the exclusive supplier;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(ii) </td>
                      <td>the Owners to enter into end user agreements with the exclusive supplier with respect to chilled water supplied to their Units if separate meters are installed in the Units;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">the Purchaser, as an Owner shall enter into an end user agreement with respect to the exclusive supply of chilled water to the Unit in the form required by such supplier (if separate meters are installed in the Units); </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">the supplier may disconnect and suspend the supply of chilled water to the Unit in the event that the Purchaser, as Owner, fails to pay any amount outstanding to it or fails to pay its Service Charges to the Strata Manager, without prejudice to any other rights that it may have with respect to the Purchaser’s default, including withdrawing certain services to the Unit and the Common Areas and the Residential Facilities until such time as the amounts outstanding (and any charges and compensation imposed for late payment) are paid in full; </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                      <td colspan="2">the Seller shall not be liable for any lack of or failure in the supply of chilled water in any way whatsoever, whether caused by technical issues, default of the Purchaser or default of the chilled water supplier; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(e) </td>
                      <td colspan="2">the Seller, its absolute discretion, may provide centralised air-conditioning to the Project and the Unit and charge the Purchaser for connection and consumption.</td>
                      </tr>

                      </table>`;
      }

      //    // // 13 Restrictions on Disposals before Completion
      {
        template += `<table style="font-size:10pt;width:100%;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">13	Restrictions on Disposals before Completion </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">13.1</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">Prior to Completion, the Purchaser, as well as each Transferee, must not enter into any Disposal, or market the Unit for Disposal, unless all of the relevant conditions have been fulfilled, including the following:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">the Purchaser has paid to the Seller not less than forty percent (40%) of the Purchase Price;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">the Disposal is in respect of the entire Unit;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">the Purchaser is not in breach of any of its obligations under the Governance Documents and this Agreement;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                      <td colspan="2">the Purchaser pays all fees, charges and other costs and expenses payable in respect of the Disposal, including all Registration Fees, the Seller’s Administration Fee and the Master Developer’s administration fees (if any), and any fees or charges which are levied upon the Seller; </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(e) </td>
                      <td colspan="2">the Transferee has completed, to the Seller’s satisfaction, a Due Diligence questionnaire to establish compliance of the transaction with the AML and the Seller’s other policies;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(f) </td>
                      <td colspan="2">the Purchaser has obtained the prior written consent of the Seller; </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(g) </td>
                      <td colspan="2">the Disposal is in accordance with the Applicable Laws (including any regulations of the Relevant Authorities and the AML) and the Seller’s policies;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(h) </td>
                      <td colspan="2">the Purchaser and the Transferee have entered into the Seller’s form of transfer documentation and provided copies of all required documentation and information in respect of the Disposal, including the execution of a new sale and purchase agreement between the Transferee and the Seller, in the form as determined by the Seller.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(i) </td>
                      <td colspan="2">the Purchaser releases the Seller in writing from and against all liability in respect of this Agreement;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(j) </td>
                      <td colspan="2">the Purchaser has obtained a Clearance Certificate; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(k) </td>
                      <td colspan="2">where the Purchaser is a company or other entity: </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(i) </td>
                      <td>prior to any Change of Control, the Purchaser has supplied a notice duly signed by all the directors (or other officers or beneficiaries) of the Purchaser to the Seller informing it of the intended Change of Control;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(ii) </td>
                      <td>following any Change of Control, the Purchaser provides copies of its corporate or other records to the Seller as the Seller may require in its absolute discretion to confirm the Purchaser’s share or unit holding or control; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(iii) </td>
                      <td>the Purchaser has supplied the Seller with a copy of (where applicable) its current commercial licences, the latest list of share or unit holders, a certificate from the company registrar confirming that the Purchaser is currently registered and any other documents that the Seller may require in its absolute discretion.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">13.2</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">Until the Completion, the Purchaser must not enter into any Dealings unless they have obtained the Seller’s prior written consent. </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">13.3</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser acknowledges and agrees that any Dealing or Disposal that is not made strictly in accordance with this clause 13 shall be null and void.</td>
                      </tr>

                      </table>`;
      }

      //    // // 14 Restrictions on Disposals after Completion
      {
        template += `<table style="font-size:10pt;width:100%;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">14	Restrictions on Disposals after Completion </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">14.1</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">On and from Completion, the Purchaser must not enter into any Disposal, or market the Unit for Disposal, unless all of the relevant conditions have been fulfilled, including the following:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">the Disposal is in accordance with the Applicable Laws (including any regulations of the Relevant Authorities and the AML) and the Governance Documents;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">the Purchaser is not in breach of any of its obligations under this Agreement and/or the Governance Documents;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">the Purchaser has obtained a Clearance Certificate;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                      <td colspan="2">the Purchaser pays all fees, charges and other costs and expenses payable in respect of the Disposal, including the Seller’s Administration Fee and the Master Developer’s administration fees (if any);</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(e) </td>
                      <td colspan="2">the Purchaser releases the Seller in writing from and against all liability in respect of this Agreement;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(f) </td>
                      <td colspan="2">the Disposal is in respect of the entirety of the Unit; </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(g) </td>
                      <td colspan="2">the Transferee has completed, to the Seller’s satisfaction, a Due Diligence questionnaire to establish compliance of the transaction with the AML and the Seller’s other policies; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(h) </td>
                      <td colspan="2">the Transferee has executed an assignment agreement and a declaration of adherence and acknowledgement in the form provided by the Seller.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">14.2</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser acknowledges and agrees that any Disposal that is not made strictly in accordance with this clause 14 shall be null and void.</td>
                      </tr>

                      </table>`;
      }

      //     // // 15 Service Charges
      {
        template += `<table style="font-size:10pt;width:100%;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">15	Default and Termination</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">15.1</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Seller’s Delay</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">If the Seller has not served the Completion Notice within a period that is eighteen (18) months from the Anticipated Completion Date (unless the delay is caused by any Force Majeure Event or by any Foreign Reason whereby the provisions of clause 16 apply), as may be extended in accordance with clause 5.1 above, and the Purchaser has fulfilled all of the Purchaser’s obligations under this Agreement (including the Purchaser’s payment obligations), the Seller shall pay the Purchaser Interest on the Instalments Paid for the period commencing eighteen (18) months from the Anticipated Completion Date and ending when the Completion Date occurs.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">If the Seller has not served the Completion Notice within a period that is twenty-four (24) months from the Anticipated Completion Date (unless the delay is caused by any Force Majeure Event or by any Foreign Reason whereby the provisions of clause 16 apply, as may be extended in accordance with clause 5.1 above, and the Purchaser has fulfilled all of the Purchaser’s obligations under this Agreement (including the Purchaser’s payment obligations), the Purchaser shall be entitled to send a written notice to the Seller at any time thereafter (but prior to the serving of the Completion Notice) requiring the Seller to complete the Unit Works within one hundred and eighty (180) Working Days of receipt of the Purchaser’s written notice (the “Seller’s Remedy Period”).  </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">If the Seller fails to complete the Unit Works within the Seller’s Remedy Period, the Purchaser may terminate this Agreement (prior to the issuing of the Completion Notice by the Seller) by giving further notice in writing to the Seller no earlier than thirty (30) days from the expiry of the Seller’s Remedy Period, and prior to the serving of the Completion Notice. After the Seller has served the Completion Notice, the Purchaser’s sole remedy shall be the payment of Interest on the Instalments Paid pursuant to clause 15.1 and the Purchaser shall not be entitled to terminate this Agreement in accordance with this clause  15.1(c) or otherwise.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                      <td colspan="2">In the event of termination of this Agreement by the Purchaser under clause 15.1(c) the Seller will return to the Purchaser the Instalments Paid with the applicable Interest payable pursuant to clause 15.1 within sixty (60) days from the effective date of such termination whereby this Agreement will be at an end.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(e) </td>
                      <td colspan="2">The Parties hereby agree that the Purchaser’s rights pursuant to this clause 15.1 shall not apply in the event that the Seller is prevented from fulfilling its obligations under this Agreement due to any Force Majeure Event or Foreign Reason.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(f) </td>
                      <td colspan="2">The Purchaser agrees that the return of the Instalments Paid with the applicable Interest pursuant to this clause 15.1 constitutes the Purchaser’s sole remedy in the event of termination of this Agreement by the Purchaser and, to the extent permitted by Applicable Laws, the Purchaser waives any and all of the Purchaser’s rights to claim against the Seller for (and releases and discharges the Seller with respect to) any specific performance and any compensation, costs, damages, expenses, fees, levies, losses, taxes or other liabilities whatsoever.</td>
                      </tr>


                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">15.2</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Purchaser’s Default</b></td>
                      </tr>

                      
                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">Subject to the Applicable Laws and the requirements of the Relevant Authorities, the Seller has the right (but not the obligation) to terminate this Agreement with immediate effect, by giving written notice to the Purchaser if any of the following occurs:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(i) </td>
                      <td>the Purchaser breaches any of its obligations under this Agreement (including payment of the Instalments or other monies payable under this Agreement on their due date for payment), and fails to cure the breach within 30 days of the Seller’s notice;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(ii) </td>
                      <td>if receiving payments from the Purchaser becomes a breach of the AML Laws or the Purchaser appears (or the Purchaser has close connections to a person that appears) on a Sanctions List;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(iii) </td>
                      <td>proceedings for bankruptcy, insolvency, liquidation, voluntary restructuring or a general assignment for the benefits of the Purchaser’s creditors have been initiated by or against the Purchaser;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(iv) </td>
                      <td>any proceedings similar to the proceedings specified in clause 15.2(a)(iii) have been initiated by or against the Purchaser; or</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(v) </td>
                      <td>the Purchaser refuses to provide or sign any paperwork, documents and agreements as may be required by the Seller in accordance with this Agreement or the Relevant Authorities from time to time.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">In the case of such termination by the Seller pursuant to clause 15.2(a), and subject to the Applicable Laws:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(i) </td>
                      <td>the Termination Amount shall be absolutely forfeited to the Seller in accordance with the Applicable Laws and deducted from the Instalments Paid to the extent that sufficient funds are available to do so;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(ii) </td>
                      <td>the Purchaser unconditionally and irrevocably undertakes that, if the Instalments Paid are insufficient to pay the Termination Amount, the Purchaser must immediately pay to the Seller an amount equivalent to such shortfall which shall be considered to be a debt payable to the Seller on demand;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(iii) </td>
                      <td>the Seller is entitled to instruct the Relevant Authorities to transfer title to the Unit back to the Seller and/or sell the Unit; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(iv) </td>
                      <td>the Purchaser agrees that it releases and discharges the Seller against any and all claims, losses, costs, taxes, levies, expenses, damages and/or liabilities incurred, suffered or that may be incurred or suffered by the Purchaser as a result of such termination and forfeiture.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">With effect from the date of termination of this Agreement, the Seller shall be free to reserve, sell or otherwise dispose of (or deal with) the Unit to any third party without restriction.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">15.3</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Consent to Termination </b></td>
                      </tr>
                      
                      <tr>
                      <td></td>
                      <td></td>
                      <td colspan="2">The Parties acknowledge and agree that with signing this Agreement, they consent to the other Party’s right to terminate this Agreement pursuant to this clause 15 in accordance with the meaning of consent and mutual consent as contemplated under Articles 267 and 268 of the Civil Code without the need to obtain a court order in accordance with Article 271 of the Civil Code.</td>
                      </tr>

                      </table>`;
      }
      // // 16	Right of First Refusal
      {
        template += `<table style="font-size:10pt;width:100%;">
                    <tr>
                    <td style="width:1%"></td>
                    <td style="width:3%"></td>
                    <td style="width:1%"></td>
                    <td style="width:95%"></td>
                    </tr>
                    <tr>
                    <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">16	Right of First Refusal</td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">16.1</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser covenants that the Purchaser shall not (directly or indirectly) enter into a Disposal for the Unit unless this clause 16 is complied with.</td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">16.2</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser shall give to the Seller written notice of its intention to enter into a Disposal, specifying details of the intended Disposal, including the identity of the proposed Transferee, the proposed purchase price and all other material terms of the intended Disposal (the “Sale Notice”).</td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">16.3</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Seller may (in its sole discretion) but is not obliged to, within thirty (30) days of receiving the Sale Notice (the “Sale Election Period”), elect to purchase the Unit at the price (and other conditions) stated in the Sale Notice (the “Purchase Notice”). In this case, the Purchaser shall be bound to sell the Unit to the Seller at such price (and conditions). In such event, the Purchaser shall sign all such documents and take all such actions as required by the Seller to promptly effect the Disposal. </td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">16.4</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">During the Sale Election Period and after receipt of the Purchase Notice, the Purchaser must not enter into the proposed Disposal that is subject to the Sale Notice. </td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">16.5</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">If the Seller does not issue a Purchase Notice within the Sale Election Period, the Purchaser may enter into the Disposal on for a purchase price not less than stated in the Sale Notice and conditions no more favorable than stated in the Sale Notice.</td>
                    </tr>

                    </table>`;
      }

      // // 17	Force Majeure Events and Foreign Reasons
      {
        template += `<table style="font-size:10pt;width:100%;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">17	Force Majeure Events and Foreign Reasons </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">17.1</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">If the Anticipated Completion Date or the Completion Date is delayed due to any causes beyond the Seller’s reasonable control (including any Force Majeure Event or Foreign Reasons), the Seller shall notify the Purchaser of such delay as soon as it is practicable for the Seller to do so.  </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">17.2</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Anticipated Completion Date and/or the Completion Date shall be extended by the duration(s) of any Force Majeure Events or Foreign Reasons. </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">17.3</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">If a Force Majeure Event or Foreign Reason occurs, the Purchaser releases and discharges the Seller from, and the Purchaser waives, any and all claims, actions, demands and/or the like whatsoever (and the Purchaser shall not have and/or make any claims, actions, demands and/or the like whatsoever) for losses, costs, charges, penalties, taxes, levies, expenses, damages, liabilities, and/or the like incurred, suffered or that may be incurred or suffered by the Purchaser directly or indirectly related to such Force Majeure Event, Foreign Reason and/or this Agreement.  </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">17.4</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The obligations of both Parties under this Agreement shall be suspended and postponed until the date the Force Majeure Event or Foreign Reason no longer exists as determined by the Seller, at which time such obligations shall resume.  </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">17.5</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">Upon the occurrence of a Force Majeure Event or a Foreign Reason, the Parties shall take all reasonable measures to minimise the effect of such event and use all reasonable endeavours to continue to perform their obligations under this Agreement so far as reasonably practicable.  </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">17.6</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">If a Force Majeure Event or Foreign Reason continues for a period of at least twelve (12) months (as determined by the Seller), the Seller (in its absolute discretion) may terminate this Agreement by written notice to the Purchaser. Clause ‎15.3 applies. In the event of such termination, the Seller shall return the Instalments Paid to the Purchaser on the effective date of termination (without interest) as full and final compensation in respect of the termination of this Agreement, and the Purchaser hereby releases and discharges the Seller from, and the Purchaser hereby waives, any and all claims, actions, demands and/or the like whatsoever (and the Purchaser shall not have and/or make any claims, actions, demands and/or the like whatsoever) for losses, costs, charges, penalties, taxes, levies, expenses, damages, liabilities and/or the like incurred, suffered or that may be incurred or suffered by the Purchaser directly or indirectly related to such termination, the Force Majeure Event, the Foreign Reason and/or otherwise in respect of this Agreement.</td>
                      </tr>

                      </table>`;
      }

      // // 18	Purchaser’s Covenants and Indemnities
      {
        template += `<table style="font-size:10pt;width:100%;">
                    <tr>
                    <td style="width:1%"></td>
                    <td style="width:3%"></td>
                    <td style="width:1%"></td>
                    <td style="width:95%"></td>
                    </tr>
                    <tr>
                    <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">18	Purchaser’s Covenants and Indemnities</td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">18.1</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser confirms that the Unit is being purchased on the Purchaser’s own behalf and the Unit will be beneficially owned solely by the Purchaser.</td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">18.2</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser shall (and procures that all Occupiers shall):</td>
                    </tr>

                    <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">comply in all respects with the provisions of the Governance Documents and all Applicable Laws in relation to the Unit and the Project;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">maintain the Unit in a fit and proper condition and in accordance with the Governance Documents and not impair the integrity of any Common Areas; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">use the Unit strictly for the Permitted Use only and ensure that the Unit and the Common Areas are only used in accordance with the Applicable Laws and all rules and regulations contained in the Governance Documents.</td>
                      </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">18.3</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser must:</td>
                    </tr>

                    <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">comply with all insurance requirements set out in the Governance Documents and as may be required by the Strata Manager, from time to time; </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">effect and maintain adequate and appropriate household and contents insurance covering damages to the Unit and consequential damages to other Units in a form approved by the Seller and/or the Strata Manager;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">ensure that all insurance policies are taken out with a reputable insurer in the name of the Purchaser and be for the full replacement value of the Unit and its contents; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                      <td colspan="2">upon request, provide to the Strata Manager duplicate or certified copies of the insurance policies and all renewal certificates and endorsement slips.</td>
                      </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">18.4</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Purchaser indemnifies and holds the Seller harmless against all actions, costs, claims, damages, demands, expenses, liabilities, losses and proceedings (including its legal and other professional costs and expenses in relation thereto) of whatsoever nature incurred or suffered by the Seller in connection with:</td>
                    </tr>

                    <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">the enforcement of, or the preservation of, any rights and/or remedies of the Seller under this Agreement;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">any breach and/or default by the Purchaser in the performance of any and all of its obligations under this Agreement including the Purchaser’s covenants contained in this Agreement and the Governance Documents; and/or</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">any injury to or death of persons; or damage to any properties howsoever arising out of or related to the possession, use and/or occupation of the Unit or the Project and directly or indirectly as a result of the negligence, act and/or omission of the Purchaser or its Occupiers and/or any person or entity under its control.</td>
                      </tr>

                    </table>`;
      }
      // // 19	General Provisions
      {
        template += `<table style="font-size:10pt;width:100%;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">19	General Provisions </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.1	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Effective Date of Agreement</b></td>
                      </tr>
                      
                      <tr>
                      <td></td>
                      <td colspan="3">The Parties agree that this Agreement is valid, binding and enforceable upon the Parties from and including the Effective Date.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.2	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Entire Agreement</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">This Agreement (including the Particulars and the Schedules) together with the Disclosure Statement which is deemed to form part of this Agreement, and any other documents referred to in this Agreement, constitute the entire agreement between the Parties and supersedes any previous arrangements, understandings or agreements between the Parties relating to the Unit and/or the subject matter of this Agreement, including but not limited to, marketing materials, sales brochures, models, view sets, displays, photographs, videos, illustrations, revenue projections and financial statements regarding the Unit and/or the Project.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">Each Party agrees that, upon entering into this Agreement and the documents referred to within it, it has not acted or relied upon any assurance, representation, statement or warranty of any person or entity (whether a party to this Agreement or not) except as expressly set out in this Agreement or those documents.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.3	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Variation of Agreement</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">Subject to clause 19.3(b), no variation of this Agreement shall be effective unless it is in writing and signed by the Parties.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">The Seller may, by giving written notice to the Purchaser, vary this Agreement if and to the extent that performance of this Agreement by the Seller is affected by any Force Majeure Event, Foreign Reason or any change in Applicable Laws. Once notice is served on the Purchaser by the Seller in accordance with this clause, any amendment set out in the Seller’s notice shall be deemed to be a valid, binding and an integral part of this Agreement.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.4	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Severance</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The invalidity, illegality or unenforceability of any term or condition of this Agreement shall be deemed not to form part of this Agreement to that extent and shall not affect the validity, legality or enforceability of the remaining terms and conditions of this Agreement or the validity, legality or enforceability of this Agreement itself.  In the event of any severance of a provision of this Agreement, the Parties shall take steps to amend this Agreement to best give effect to the intention of the Parties as expressed in this Agreement.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.5	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>No Waiver</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">No failure to exercise or delay in exercising or enforcing any right or remedy under this Agreement shall constitute a waiver thereof and no single or partial exercise or enforcement of any right or remedy under this Agreement shall preclude or restrict the further exercise or enforcement of any such right or remedy, except as otherwise provided herein, the rights and remedies provided in this Agreement are cumulative and not exclusive of any rights and remedies provided by Applicable Laws.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.6	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Survival</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser agrees that this Agreement shall survive Completion and the transfer of title of the Unit to the Purchaser and that the provisions of this Agreement shall remain binding upon the Parties. This Agreement shall endure to the benefit of and be binding upon each of the Parties and each of their respective personal representatives, heirs, successors, and permitted assigns.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.7	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Counterparts</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">This Agreement may be executed in any number of counterparts each of which when executed and delivered shall constitute an original of this Agreement, but all the counterparts shall together constitute one and the same Agreement.  No counterpart shall be effective until each Party has executed at least one counterpart.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.8	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Acknowledgement of Understanding</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser agrees that it has read and fully understood each and all of the terms and conditions of this Agreement including the Particulars and the Schedules and has had the opportunity to obtain independent, professional, legal and financial advice on the Purchaser’s rights and obligations under this Agreement and the transaction contemplated by this Agreement.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.9	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Authority to Execute Documents</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser warrants and represents that:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">in the case of the Purchaser being (or including) an individual, the Purchaser has full authority, power and capacity to execute, deliver and perform this Agreement; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">in the case of the Purchaser being (or including) an entity other than an individual, the execution, delivery and performance of this Agreement by the Purchaser has been duly authorised in accordance with the relevant corporate or other procedures of the Purchaser, no further action on the part of the Purchaser is necessary to authorise such execution, delivery and performance and the person signing this Agreement on behalf of the Purchaser is fully authorised to enter into this Agreement on behalf of the Purchaser and, in addition, the Purchaser must produce a power of attorney and/or any other document(s) that confirm to the Seller’s absolute satisfaction that the person signing this Agreement (and any other document required to be signed under this Agreement) on behalf of the Purchaser is authorised to do so.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.10	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Implied Warranties</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">To the fullest extent allowable under Applicable Laws, the Seller disclaims all implied warranties in their entirety. As to any implied warranty which cannot be disclaimed entirely, all secondary, incidental and consequential damages are specifically excluded and disclaimed (claims for such secondary, incidental and consequential damages being clearly unavailable in the case of implied warranties which are disclaimed entirely above).</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.11	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Further Assurances</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser agrees to immediately sign any and/or all such documents and take any and/or all such actions or steps as may be necessary to give effect to this Agreement.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.12	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Joint and Several Liability</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">If there is more than one person or entity named as or comprising the Purchaser, then all such persons or entities named as or comprising the Purchaser shall be jointly and severally liable for the obligations of the Purchaser under this Agreement.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.13	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Third Party Rights</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">A person or entity who is not a party to this Agreement shall not have any rights under or in connection with it.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.14	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Seller’s Representative</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Seller:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">may have a Seller’s Representative; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">may communicate with the Purchaser by and through the Seller’s Representative.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">All correspondence and notifications to the Seller shall be sent to the Seller’s Representative and all correspondence and notifications from the Seller may be sent from the Seller’s Representative. For the avoidance of doubt, the Seller’s Representative is not a party to this Agreement.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.15	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Anti-Money Laundering</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser confirms and warrants that the monies used by the Purchaser for any payment made under this Agreement originate from clean funds and are not or could not reasonably be considered to be the subject matter of money laundering in any way whatsoever. The Purchaser confirms and warrants that it, its nominees, representatives and subsidiaries (including past, present and future successors), officers, directors, agents, employees, owners and beneficial owners have not engaged in any activity whatsoever that could constitute an offence under the AML. The Purchaser must provide any information and complete any documentation requested by the Seller and/or the Relevant Authorities to confirm compliance with the AML. The Purchaser must at no time appear (or have close connections to a person that appears) on a Sanctions List.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.16	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Purchaser’s Information</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser agrees and authorizes the Seller (and its Affiliates) to collect, transfer (including cross-border transfer) and store the Purchaser’s information for any legitimate purpose, including for internal record keeping or to comply with any legal requirements. </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">19.17	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;"><b>Assignment and Novation</b></td>
                      </tr>
                      <tr>
                      <td></td>
                      <td colspan="3">Subject to the Applicable Laws, the Seller has the right to:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">assign, novate, securitize, transfer, or otherwise deal with, this Agreement or any or all of its rights, benefits, or interests in this Agreement, including receivables) to a third party (including a bank), as well as novating and/or assigning this Agreement to an Affiliate, and/or</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">mortgage, charge, pledge, lien, hypothecate, or otherwise encumber, or provide any other third party right or interest, including assignment by way of security, reservation of title or other security interest of any kind on the Plot and/or the Project (or any part thereof), 
                      and the Purchaser hereby provides its consent to such assignment, novation, transfer, securitization, dealing, mortgage, charge, pledge, lien, hypothecation or other encumbrance or other third party right or interest. In the event of a novation and/or assignment of this Agreement to an Affiliate, the Purchaser agrees to enter into such legal documentation (including a sale and purchase agreement with the Affiliate) as may be required by the Affiliate within seven (7) days of the date of request by the Seller.  Upon any such assignment or transfer, the Purchaser shall be deemed to have released the Seller from those of its obligations under this Agreement which the Seller has assigned or transferred to the assignee/transferee. 
                      </td>
                      </tr>


                      </table>`;
      }

      // //  20	Notices
      {
        template += `<table style="font-size:10pt;width:100%;">
                    <tr>
                    <td style="width:1%"></td>
                    <td style="width:3%"></td>
                    <td style="width:1%"></td>
                    <td style="width:95%"></td>
                    </tr>
                    <tr>
                    <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">20	Notices</td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">20.1</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">Any notice to any Party in connection with this Agreement must be in writing, signed by the notifying Party and in the English language.</td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">20.2</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">Any notices must be sent by personal delivery, courier or registered post and shall be deemed to have been properly given as follows:</td>
                    </tr>

                        <tr>
                        <td></td>
                        <td>(a) </td>
                        <td colspan="2">when personally delivered, on the actual date of delivery; </td>
                        </tr>

                        <tr>
                        <td></td>
                        <td>(b) </td>
                        <td colspan="2">when sent by courier, or registered post, on the actual date of delivery as evidenced by the records of the courier or postal carrier; or</td>
                        </tr>

                        <tr>
                        <td></td>
                        <td>(c) </td>
                        <td colspan="2">when sent by the Seller by email, on the date that the email was sent as evidenced by the sent items’ confirmation in the Seller’s email account.</td>
                        </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">20.3</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">A notice given under this Agreement by the Seller shall be validly served if sent by email.</td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">20.4</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">A notice given under this Agreement by the Purchaser shall not be validly served if sent by email. </td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">20.5</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">The contact details for the Seller and the Purchaser to which notices should be sent shall be those as first set out in Item ‎1 and Item ‎2 of the Particulars respectively. The Purchaser shall immediately notify the Seller of any change to its contact details.</td>
                    </tr>

                    </table>`;
      }

      // // 21	Confidentiality and Non-Disclosure
      {
        template += `<table style="font-size:10pt;width:100%;">
                    <tr>
                    <td style="width:1%"></td>
                    <td style="width:3%"></td>
                    <td style="width:1%"></td>
                    <td style="width:95%"></td>
                    </tr>
                    <tr>
                    <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">21	Confidentiality and Non-Disclosure</td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">21.1	</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">Subject to clause 21.2, each Party shall keep the terms of this Agreement, including the Particulars, confidential.</td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">21.2	</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">A Party may make any disclosure in relation to this Agreement to:</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td>(a) </td>
                    <td colspan="2">its professional advisors, bankers, financial advisors and financiers, if those persons undertake to keep the information disclosed to them confidential in accordance with the terms of this Agreement;</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td>(b) </td>
                    <td colspan="2">comply with any Applicable Laws or requirement of any Relevant Authority; or</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td>(c) </td>
                    <td colspan="2">any of its employees, associates, related parties, authorised representatives or independent contractors to whom it is necessary to disclose the information if that employee undertakes to keep the information disclosed to them confidential in accordance with the terms of this Agreement.</td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">21.3	</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">This clause shall not apply to information to the extent that it is or becomes available in the public domain other than by reason of any unauthorized disclosure.</td>
                    </tr>

                    <tr>
                    <td style="padding-bottom:5px;padding-top:8;">21.4	</td>
                    <td colspan="3" style="padding-bottom:5px;padding-top:8;">Except as required by Applicable Laws, all press releases and other public announcements relating to the sale and purchase dealt with by this Agreement must be in terms as determined by the Seller.</td>
                    </tr>

                    </table>`;
      }

      // // 22	Definitions and Interpretation
      {
        template += `<table style="font-size:10pt;width:100%;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">22	Definitions and Interpretation</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">In this Agreement, except where the context otherwise requires:</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">words defined in the Particulars have the meanings defined therein;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">the capitalised words will have the meanings given to them in Part A of Schedule 5; </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">words capitalised in this Agreement but not defined in this Agreement have the corresponding meanings defined in the Governance Documents; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                      <td colspan="2">the rules of interpretation contained in Part B of Schedule 5 will apply.</td>
                      </tr>

                      </table>`;
      }

      // // 23	Governing Law and Jurisdiction
      {
        template += `<table style="font-size:10pt;width:100%;page-break-after: always;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;padding-bottom:5px;padding-top:8;">23	Governing Law and Jurisdiction </td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">23.1	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">This Agreement shall in all respects be governed by and be construed and interpreted and take effect in accordance with the laws in force in the Emirate of Ras Al Khaimah and the federal laws of the UAE applicable in the Emirate of Ras Al Khaimah.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">23.2	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">Any Disputes shall be resolved exclusively in the manner set forth in this clause 23.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">23.3	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">If any Dispute arises out of or in connection with this Agreement including any question regarding the existence, breach, termination, validity or invalidity thereof, then any Party may serve formal written notice on another Party that a Dispute has arisen (the “Notice of Dispute”). The Notice of Dispute shall make reference to this clause 23.3 and describe the material points of the Dispute in sufficient detail to enable the Parties to reach an amicable settlement (as set out in clause 23.4).</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">23.4	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Parties to any Dispute shall use reasonable endeavours to resolve the Dispute amicably within a period of thirty (30) days after the Notice of Dispute. The Parties may by written agreement extend this 30-day period and take all such other steps as they mutually agree will assist them in reaching an amicable settlement of the Dispute. The amicable settlement process set out in this clause 23.4 is a condition precedent prior to referring any Dispute to arbitration pursuant to clause 23.5 below.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">23.5	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The Parties irrevocably agree that any Dispute that is not resolved pursuant to clause 23.4 shall be settled by arbitration conducted under the rules of arbitration of the Dubai International Arbitration Centre (DIAC), the rules of which are deemed to be incorporated by reference to this clause. A Party shall commence arbitration within thirty (30) days of the expiry of the period referred to in clause 23.4.</td>
                      </tr>

                      <tr>
                      <td style="padding-bottom:5px;padding-top:8;">23.6	</td>
                      <td colspan="3" style="padding-bottom:5px;padding-top:8;">The seat of the arbitration shall be Dubai, UAE. The arbitral panel shall consist of three (3) arbitrators. The language of the arbitration shall be English. </td>
                      </tr>

                      </table>`;
      }

      // // Execution Page
      {
        // PURCHASER:
        {
          template += `
                    <table width="100%" style="page-break-after: always;">
                    <tbody>
                    <tr>
                    <td width="45%"></td>
                    <td width="5%"></td>
                    <td width="50%"></td>
                    </tr>
                    <tr style="font-size: 15pt;">
                    <td colspan="3"><strong>Execution Page</strong></td>
                    </tr>
                    <tr style="font-size: 12pt;">
                    <td colspan="3"><strong>IN WITNESS WHEREOF</strong>, this Agreement was signed by or on behalf of the Parties on the Effective Date.</td>
                    </tr>
                    <tr>
                    <td colspan="3"><strong>PURCHASER:</strong></td>
                    </tr>
                    <tr>
                    <td><strong>Signed</strong> by the Purchaser in the presence of:</td>
                    <td style="align: center;">)</td>
                    <td>&nbsp;</td>
                    </tr>
                    <tr>
                    <td>&nbsp;</td>
                    <td style="align: center;">)</td>
                    <td>&nbsp;</td>
                    </tr>
                    <tr style="height: 60px;">
                    <td>&nbsp;</td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td>Witness signature:</td>
                    <td style="align: center;">)</td>
                    <td>
                    <p style="color: #aaaaaa;">sign here:</p>
                    ________________________________________</td>
                    </tr>

                    <tr>
                    <td>Witness name (block letters):</td>
                    <td style="align: center;">)</td>
                    <td>
                    <p style="color: #aaaaaa;">print name:</p>
                    ________________________________________</td>
                    </tr>

                    <tr>
                    <td>Witness address:</td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>

                    </tbody>
                    </table>`;
        }
        // // SELLER:
        {
          template += `
                    <table width="100%" style="page-break-after: always;">
                    <tbody>
                    <tr>
                    <td width="46%"></td>
                    <td width="4%"></td>
                    <td width="50%"></td>
                    </tr>
                    <tr>
                    <td colspan="3"><strong>SELLER:</strong></td>
                    </tr>
                    
                    <tr>
                    <td><strong>Signed</strong> for and on behalf of the Seller:</td>
                    <td >)</td>
                    <td>&nbsp;</td>
                    </tr>
                    
                    <tr>
                    <td>&nbsp;</td>
                    <td>)</td>
                    <td>&nbsp;</td>
                    </tr>
                    <tr>
                    <td>&nbsp;</td>
                    <td>)</td>
                    <td>&nbsp;</td>
                    </tr>

                    <tr style="height: 60px;">
                    <td></td>
                    <td>)</td>
                    <td>________________________________________</td>
                    </tr>

                    <tr>
                    <td width="63%">&nbsp;</td>
                    <td width="4%">&nbsp;</td>
                    <td width="33%"><p>By executing this Agreement, the signatory warrants that the signatory is duly authorised to execute thisAgreement on behalf of the Seller.</p>
                     ________________________________________</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td>)</td>
                    <td>
                    <p style="color: #aaaaaa;">sign here:</p>
                    ________________________________________</td>
                    </tr>

                    <tr>
                    <td>Witness name (block letters):</td>
                    <td>)</td>
                    <td>
                    <p style="color: #aaaaaa;">print name:</p>
                    ________________________________________</td>
                    </tr>

                    <tr>
                    <td>Witness address:</td>
                    <td>)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td>)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td>)</td>
                    <td>________________________________________</td>
                    </tr>
                    
                    </tbody>
                    </table>
                    
                    `;
        }
      }

      // // Schedule 1
      {
        if (subsidiaryData.name == "The Beach House") {
          template += `<table style="font-size:10pt;width:100%;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;"><p><b>Schedule 1</b></p><p><b>Disclosure Statement</b></p></td>
                      </tr>

                      <tr>
                      <td colspan="4" style="font-size:14pt;">1.	Description of the Project</td>
                      </tr>

                      <tr>
                      <td>1.1</td>
                      <td colspan="3">Overview of the Project</td>
                      </tr>
                      

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">The Project is a residential development being constructed on plot BFR-01A on Al Marjan Island, Ras Al Khaimah, UAE.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">The Project is intended to comprise:</td>
                      </tr>
                      
                  
                      <tr>
                      <td></td>
                      <td></td>
                      <td>(i) </td>
                      <td>approximately 88 residential Units; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(ii) </td>
                      <td>the Common Areas.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">The details of the Project, including the final number, size and location of the Units, may be varied by the Seller prior to or after completion of construction of the Project or handover of the Unit to the Purchaser.</td>
                      </tr>

                      <tr>
                      <td>1.2</td>
                      <td colspan="3">Proposed Common Areas</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(a) </td>
                      <td colspan="2">The Common Areas may include: </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(i) </td>
                      <td>the façade;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(ii) </td>
                      <td>external lighting including any lighting that illuminates the façade;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(iii) </td>
                      <td>landscaped areas external to the Project;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(iv) </td>
                      <td>access ways (including the fire access areas and the fire assembly areas); </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(v) </td>
                      <td>fire safety equipment including sprinklers, fire alarms and associated equipment;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(vi) </td>
                      <td>shared garbage room and associated equipment; </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(vii) </td>
                      <td>lifts providing access to all floors;</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(viii) </td>
                      <td>lobbies and hallways; </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(ix) </td>
                      <td>Residential Facilities; and</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td></td>
                      <td>(x) </td>
                      <td>shared MEP located throughout the Project and all associated pipes, conduits, cables, rises and the like. </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(b) </td>
                      <td colspan="2">The Seller discloses and the Purchaser acknowledges and agrees that the final demarcation and delineation of the Common Areas is still to be determined by the Seller and may be varied by the Seller if it considers that such variations are in the best interests of the Project.  </td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">In addition, the Purchaser acknowledges and agrees that its right to use the Common Areas shall be subject to the Purchaser strictly complying with the provisions of the Governance Documents.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(d) </td>
                      <td colspan="2">A copy of the draft Common Area Site Plans is attached as Annexure A.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(e) </td>
                      <td colspan="2">The draft Common Area Site Plans show the proposed Common Areas.</td>
                      </tr>

                      <tr>
                      <td></td>
                      <td>(f) </td>
                      <td colspan="2">The Seller may vary the Common Areas from that shown on the draft Common Area Site Plan in accordance with the Jointly Owned Property Law or if the Seller considers that changes are in the best interests of the Project (or as otherwise may be required by Applicable Laws or a Relevant Authority).</td>
                      </tr>
                      </table>
                    `;
        } else {
          template +=
            `<table style="font-size:10pt;width:100%;">
                    <tr>
                    <td style="width:1%"></td>
                    <td style="width:3%"></td>
                    <td style="width:1%"></td>
                    <td style="width:95%"></td>
                    </tr>
                    <tr>
                    <td colspan="4" style="font-size:14pt;"><p><b>Schedule 1</b></p><p><b>Disclosure Statement</b></p></td>
                    </tr>

                    <tr>
                    <td colspan="4" style="font-size:14pt;">1.	Description of the Project</td>
                    </tr>

                    <tr>
                    <td>1.1</td>
                    <td colspan="3">Overview of the Project</td>
                    </tr>
                    

                    <tr>
                    <td></td>
                    <td>(a) </td>
                    <td colspan="2">The Project is a residential development being constructed on plot ` +
            propertyData.plotNo +
            ` on Al Marjan Island, Ras Al Khaimah, UAE.</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td>(b) </td>
                    <td colspan="2">The Project is intended to comprise:</td>
                    </tr>
                    
                
                    <tr>
                    <td></td>
                    <td></td>
                    <td>(i) </td>`
          if (contractData.subsidiary != 9) {
            template += `<td>approximately ` +
              propertyData.unitNo +
              ` residential Units; and</td>`
          } else {
            template += `<td>approximately 165 residential Units; and</td>`
          }
          template += `
                    </tr>

                    <tr>
                    <td></td>
                    <td></td>
                    <td>(ii) </td>
                    <td>the Common Areas.</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td>(c) </td>
                    <td colspan="2">The details of the Project, including the final number, size and location of the Units, may be varied by the Seller prior to or after completion of construction of the Project or handover of the Unit to the Purchaser.</td>
                    </tr>

                    <tr>
                    <td>1.2</td>
                    <td colspan="3">Proposed Common Areas</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td>(a) </td>
                    <td colspan="2">The Common Areas may include: </td>
                    </tr>

                    <tr>
                    <td></td>
                    <td></td>
                    <td>(i) </td>
                    <td>the façade;</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td></td>
                    <td>(ii) </td>
                    <td>external lighting including any lighting that illuminates the façade;</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td></td>
                    <td>(iii) </td>
                    <td>landscaped areas external to the Project;</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td></td>
                    <td>(iv) </td>
                    <td>access ways (including the fire access areas and the fire assembly areas); </td>
                    </tr>

                    <tr>
                    <td></td>
                    <td></td>
                    <td>(v) </td>
                    <td>fire safety equipment including sprinklers, fire alarms and associated equipment;</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td></td>
                    <td>(vi) </td>
                    <td>shared garbage room and associated equipment; </td>
                    </tr>

                    <tr>
                    <td></td>
                    <td></td>
                    <td>(vii) </td>
                    <td>lifts providing access to all floors;</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td></td>
                    <td>(viii) </td>
                    <td>lobbies and hallways; </td>
                    </tr>

                    <tr>
                    <td></td>
                    <td></td>
                    <td>(ix) </td>
                    <td>Residential Facilities; and</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td></td>
                    <td>(x) </td>
                    <td>shared MEP located throughout the Project and all associated pipes, conduits, cables, rises and the like. </td>
                    </tr>

                    <tr>
                    <td></td>
                    <td>(b) </td>
                    <td colspan="2">The Seller discloses and the Purchaser acknowledges and agrees that the final demarcation and delineation of the Common Areas is still to be determined by the Seller and may be varied by the Seller if it considers that such variations are in the best interests of the Project.  </td>
                    </tr>

                    <tr>
                    <td></td>
                    <td>(c) </td>
                    <td colspan="2">In addition, the Purchaser acknowledges and agrees that its right to use the Common Areas shall be subject to the Purchaser strictly complying with the provisions of the Governance Documents.</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td>(d) </td>
                    <td colspan="2">A copy of the draft Common Area Site Plans is attached as Annexure A.</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td>(e) </td>
                    <td colspan="2">The draft Common Area Site Plans show the proposed Common Areas.</td>
                    </tr>

                    <tr>
                    <td></td>
                    <td>(f) </td>
                    <td colspan="2">The Seller may vary the Common Areas from that shown on the draft Common Area Site Plan in accordance with the Jointly Owned Property Law or if the Seller considers that changes are in the best interests of the Project (or as otherwise may be required by Applicable Laws or a Relevant Authority).</td>
                    </tr>
                    </table>
                  `;
        }
      }

      // // 2.	Phasing of Delivery
      {
        template += `<table style="font-size:10pt;width:100%;">
                    <tr>
                    <td style="width:1%"></td>
                    <td style="width:3%"></td>
                    <td style="width:1%"></td>
                    <td style="width:95%"></td>
                    </tr>
                    <tr>
                    <td colspan="4" style="font-size:14pt;">2.	Phasing of Delivery</td>
                    </tr>
                    <tr>
                    <td>2.1</td>
                    <td colspan="3">It is the Seller's present intention that construction of the Project will be completed in one construction phase with handover of the various Units being staged. </td>
                    </tr>
                    <tr>
                    <td>2.2</td>
                    <td colspan="3">Notwithstanding the Seller’s present intention that the Units and Common Areas will be completed during the same period, the Seller discloses, and the Purchaser acknowledges and agrees, that this intention may vary both prior to and after Completion and that not all Units and Common Areas may be completed as at handover of the Unit to the Purchaser</td>
                    </tr>
                    <tr>
                    <td>2.3</td>
                    <td colspan="3">The acknowledges and agrees that, as at the date of handover of the Unit, other Units and Common Areas may not be complete and that there may be on-going construction works continuing in the Project following handover of the Unit.</td>
                    </tr>
                    <tr>
                    <td>2.4</td>
                    <td colspan="3">The Purchaser will not raise any objection, requisition, claim for compensation or seek to delay handover of the Unit or Completion of the Agreement on the basis there is on-going construction works continuing in the Project or Project facilities are not available for use on the date of handover provided that the Purchaser is able to reasonably access the Unit.</td>
                    </tr>
                    </table>`;
      }

      // // 3.	Service Charges
      {
        template += `<table style="font-size:10pt;width:100%;">
                    <tr>
                    <td style="width:1%"></td>
                    <td style="width:3%"></td>
                    <td style="width:1%"></td>
                    <td style="width:95%"></td>
                    </tr>
                    <tr>
                    <td colspan="4" style="font-size:14pt;">3.	Service Charges </td>
                    </tr>
                    <tr>
                    <td>3.1</td>
                    <td colspan="3">The Seller discloses and the Purchaser acknowledges and agrees that the Strata Manager will levy the Service Charges on the Owners to cover the costs of Managing the Common Areas and the Purchaser has a continuing obligation (together with all other Owners) to contribute towards the Common Area Expenses calculated and payable in accordance with the Governance Documents. 
                    </td>
                    </tr>
                    <tr>
                    <td>3.2</td>
                    <td colspan="3">In addition to the Service Charges, the Purchaser must also pay the Master Community Charges.
                    </td>
                    </tr>
                    <tr>
                    <td>3.3</td>
                    <td colspan="3">The Seller and/or the Strata Manager may from time to time determine the fair allocation of the Service Charges among the Units in accordance with the Jointly Owned Property Law.
                    </td>
                    </tr>
                    <tr>
                    <td>3.4</td>
                    <td colspan="3">For the purpose of calculating the Service Charges on Completion, there may be a ‘weighting’ of Service Charges to reflect the different use of areas within Units and to provide for a fair and equitable distribution of costs and expenses.
                    </td>
                    </tr>
                    </table>`;
      }

      // // 4.	Governance Documents
      {
        template += `<table style="font-size:10pt;width:100%;page-break-after: always;">
                    <tr>
                    <td style="width:1%"></td>
                    <td style="width:3%"></td>
                    <td style="width:1%"></td>
                    <td style="width:95%"></td>
                    </tr>
                    <tr>
                    <td colspan="4" style="font-size:14pt;">4.	Governance Documents</td>
                    </tr>
                    <tr>
                    <td>4.1</td>
                    <td colspan="3">The Purchaser as an Owner will be bound by the provisions contained in the Governance Documents, which include:
                    </td>
                    </tr>
                    <tr>
                    <td></td>
                    <td>(a) </td>
                    <td colspan="2">the Master Community Declaration (if declared by the Master Developer);
                    </td>
                    </tr>
                    <tr>
                    <td></td>
                    <td>(b) </td>
                    <td colspan="2">the JOPD; and
                    </td>
                    </tr>
                    <tr>
                    <td></td>
                    <td>(c) </td>
                    <td colspan="2">any constitutional documents to be issued for an owner’s association (if any).    
                    </td>
                    </tr>
                    <tr>
                    <td>4.2</td>
                    <td colspan="3">The JOPD is a declaration that sets out the terms of Operating the Project and confers rights and imposes obligations on the Owners Association, Owners and Occupiers.
                    </td>
                    </tr>
                    <tr>
                    <td>4.3</td>
                    <td colspan="3">It is intended that the JOPD will be registered with the Land Department in accordance with the Jointly Owned Property Law and that all Owners and Occupiers will be bound by and must strictly comply with the provisions contained in the JOPD.
                    </td>
                    </tr>
                    <tr>
                    <td>4.4</td>
                    <td colspan="3">In accordance with the terms of the Agreement, the Purchaser shall sign the Declaration of Adherence and Acknowledgement and deliver the signed Declaration of Adherence and Acknowledgement to the Seller upon Completion of the Agreement and before Registration of the transfer of the Unit to the Purchaser.
                    </td>
                    </tr>
                    <tr>
                    <td>4.5</td>
                    <td colspan="3">The Seller discloses and the Purchaser acknowledges and agrees that the form and substance of the Governance Documents may be amended (or such documents be replaced in their entirety should the proposed title structure be amended) by the Seller if the Seller considers that such amendment or replacement is in the best interests of the Project.
                    </td>
                    </tr>
                    <tr>
                    <td>4.6</td>
                    <td colspan="3">The Seller discloses and the Purchaser acknowledges and agrees that the Purchaser will be bound by the provisions in the Governance Documents from the handover of the Unit notwithstanding the Governance Documents may not be Registered at the date of such handover.
                    </td>
                    </tr>
                    <tr>
                    <td>4.7</td>
                    <td colspan="3">A copy of the Governance Documents will be provided prior to Completion.
                    </td>
                    </tr>
                    </table>`;
      }

      // // Draft
      {
        template += `
                    <table width="100%" style="page-break-after: always;">
                    <tr>
                    <td><p align="center"><b>ANNEXURE A</b></p><p align="center"><b>DRAFT COMMON AREAS SITE PLAN</b></p></td>
                    </tr>
                    <tr>
                    <td ><span align="center">The draft Common Area Site Plan shall be prepared by a registered surveyor licensed in accordance with the Jointly Owned Property Law upon completion of construction of the Project.</span></td>
                    </tr>
                    </table>
                    `;
      }

      // // Schedule 2
      {
        template += `
                    
                    <table width="100%">
                    <tr><td width="10%"></td><td width="90%"></td></tr>
                    <tr>
                    <td colspan="2" style="font-size:16pt;"><b>Schedule 2</b></td>
                    </tr>
                    <tr>
                    <td colspan="2" style="font-size:16pt;"><b>Acknowledgement of Disclosure Statement</b></td>
                    </tr>
                    <tr>
                    <td colspan="2">This <b> ACKNOWLEDGEMENT OF RECEIPT </b>is made on the Effective Date by the Purchaser.</td>
                    </tr>
                    <tr>
                    <td >1</td>
                    <td >Capitalised terms used in this Acknowledgement of Receipt will (unless the context otherwise requires) have the same meaning as defined in this Agreement.</td>
                    </tr>
                    <tr>
                    <td width="5%">2</td>
                    <td width="95%">I acknowledge having received the Disclosure Statement from the Seller prior to the Effective Date in accordance with the Applicable Laws.</td>
                    </tr>
                    </table>
                    `;
      }
      // // PURCHASER:
      {
        template += `
                    <table width="100%" style="page-break-after: always;">
                    <tbody>
                    <tr>
                    <td width="45%"></td>
                    <td width="5%"></td>
                    <td width="50%"></td>
                    </tr>
                    <tr>
                    <td colspan="3"><strong>PURCHASER:</strong></td>
                    </tr>
                    <tr>
                    <td><strong>Signed</strong> by the Purchaser in the presence of:</td>
                    <td style="align: center;">)</td>
                    <td>&nbsp;</td>
                    </tr>
                    <tr>
                    <td>&nbsp;</td>
                    <td style="align: center;">)</td>
                    <td>&nbsp;</td>
                    </tr>
                    <tr style="height: 60px;">
                    <td>&nbsp;</td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td>Witness signature:</td>
                    <td style="align: center;">)</td>
                    <td>
                    <p style="color: #aaaaaa;">sign here:</p>
                    ________________________________________</td>
                    </tr>

                    <tr>
                    <td>Witness name (block letters):</td>
                    <td style="align: center;">)</td>
                    <td>
                    <p style="color: #aaaaaa;">print name:</p>
                    ________________________________________</td>
                    </tr>

                    <tr>
                    <td>Witness address:</td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>

                    </tbody>
                    </table>`;
      }

      // // Schedule 3
      {
        template += `
                    <p style="font-size:16pt;"><b>Schedule 3</b></p>
                    <p style="font-size:16pt;"><b>Draft Unit Plan</b></p>
                    <p>The Draft Unit Plan shall be prepared by a registered surveyor licensed by the Relevant Authorities in accordance with the Jointly Owned Property Law upon completion of construction of the Unit.</p>
                    <p>The attached Draft Unit Plan may be amended by the Seller in accordance with the Jointly Owned Property Law or if the Seller considers that changes are in the best interests of the Unit.</p>`;
        if (unitData.layoutId) {
          template +=
            `<table width="100%">
                    <tr>
                    <td><img  src="` +
            unitData.layoutUrl.imageUrl +
            `" width="450px" height="450px" style="align:center; " id="image"/></td>
                    </tr>
                    </table>`;
        }
        template += `<pbr/>`;
      }

      // // Schedule 4
      if (contractData.subsidiary == 3 || contractData.subsidiary == 8) {
        let i = 0;
        let elevenRow = 'High-quality engineered wood flooring or equivalent porcelain tiles';
        let twelveRow = 'Recessed lighting to create a relaxing ambiance.';
        let fourRow =
          '<td style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;"><p>High-efficiency, centralized HVAC system designed to provide precise temperature control and maximize energy efficiency.</p><p>Zoning capabilities to allow residents to control temperature in individual rooms, enhancing comfort and energy savings. </p><p>Variable refrigerant flow (VRF) or multi-duct systems for cooling.</p><p>Programmable, user-friendly thermostats with smart technology integration.</p></td>';
        if (contractData.subsidiary == 8) {
          fourRow =
            '<td style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;"><p>High-efficiency, centralized HVAC system designed to provide precise temperature control and maximize energy efficiency.</p><p>Zoning capabilities to allow residents to control temperature in individual rooms, enhancing comfort and energy savings. </p><p>Variable refrigerant flow (VRF) or multi-duct systems for cooling/Chillers as per design parameters.</p><p> </p><p>  </p><p></p></td>';
          elevenRow = 'Porcelain wood like flooring or equivalent porcelain tiles';
          twelveRow = 'Lighting provision to create a relaxing ambiance.';
        }
        template += `
                    <p style="font-size:16pt;"><b>Schedule 4</b></p>
                    <p style="font-size:16pt;"><b>Draft Unit Specification</b></p>
                    <p>The Unit is sold with the following draft specifications which remain subject to change without notice. </p>
                    <table style="width:100%; font-size:11pt;margin-bottom:20px;">
                    <tr>
                    <td style="width:30%; border: 1px solid black;color:#ffffff; background-color:#404040;">No</td>
                    <td style="width:30%; border-top: 1px solid black;border-bottom: 1px solid black;color:#ffffff; background-color:#404040;">Area</td>
                    <td style="width:40%; border: 1px solid black;color:#ffffff; background-color:#404040;">Specifications</td>
                    </tr>
                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">General</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;"> ${++i}.</td>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">Entry Door</td>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Custom-made Single leaf Entry door with solid timber core. External surface finished in premium veneer with, premium door handles and high-quality hardware. Sound-insulated for privacy and noise reduction.</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">Doors </td>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Internal doors in custom made single leaf flushed hinged doors consisting of semi-solid core with timber lipping in flushed solid timber frame. Door finished in veneer on both sides with high end quality ironmongeries. </td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">Lighting</td>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;"><p>Recessed LED downlights in living areas, kitchen and bedrooms.</p><p>Architectural cove or indirect lighting for creating a warm and inviting atmosphere in common areas.</p><p>Emergency lighting in common areas and corridors, complying with local safety regulations.</p></td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">Airconditioning </td>
                    ${fourRow}
                    </tr>
                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Living Room and Dining</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Premium-grade porcelain tiles with a polished or matte finish or equivalent. </td>
                    </tr>
                    <tr >
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Stone Thresholds or Equivalent</td>
                    </tr> 

                    <tr>
                    <td style=" border: 1px solid black;color:#ffffff; background-color:#404040;">No</td>
                    <td style=" border-top: 1px solid black;border-bottom: 1px solid black;color:#ffffff; background-color:#404040;">Area</td>
                    <td style=" border: 1px solid black;color:#ffffff; background-color:#404040;">Specifications</td>
                    </tr>     

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Smooth painted ceilings with concealed cove lighting details for ambient illumination.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High quality painted wall finish in an elegant and harmonious colour palette.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High quality finish face plates for sockets, switches and DP switches</td>
                    </tr>`;
        if (contractData.subsidiary != 8) {
          template += `
                      <tr>
                      <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                      <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High quality LED lighting</td>
                      </tr>`;
        }
        template += `&nbsp;
                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Bedrooms</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">${elevenRow}</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">${twelveRow}</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Closets with custom-built shelving, drawers, and hanging space. All with soft close doors and drawers for elegant experience.</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High quality painted wall finish in an elegant and harmonious colour palette.</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High quality finish face plates for sockets, switches, and DP switches</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Individual climate control with smart thermostats in each bedroom.</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Conveniently located electrical outlets </td>
                    </tr>
                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Terrace  </td>
                    </tr>
                    <tr>
                      <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                      <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Private balconies or terraces with premium outdoor flooring material.</td>
                      </tr>
                      <tr>
                      <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                      <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Safety railings or glass barriers for unobstructed views and security.</td>
                      </tr>
                      <tr>
                      <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                      <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Railings finished in a way that complements the overall terrace design and the building's exterior aesthetics.</td>
                      </tr>
                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Bathrooms </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality slip-resistant tiles for safety and comfort underfoot</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Walls cladded with premium quality, floor-to-ceiling tiles in a variety of elegant finishes.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Matching or contrasting grout for an upscale and polished appearance.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Glass-enclosed walk-in shower with a rain showerhead and handheld sprayer or a deep soaking bathtub depending on unit</td>
                    </tr>`;
        if (contractData.subsidiary != 8) {
          template += `
                                         <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-end, water-saving toilet with a sleek, modern design with Handheld bidet </td>
                    </tr>`;
        }
        template += `


                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Designer under-mount or vessel sinks. High-quality faucets and fixtures, including single-handle or widespread faucets. Rain showerheads with adjustable spray settings and premium handheld showerheads. </td>
                    </tr>

                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Kitchen </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality cooktop designed to provide precise and efficient cooking capabilities.</td>
                    </tr>
                    
                   

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality integrated washer-dryer, quiet and energy saving.</td>
                    </tr>

                    <tr>
                    <td style=" border: 1px solid black;color:#ffffff; background-color:#404040;">No</td>
                    <td style=" border-top: 1px solid black;border-bottom: 1px solid black;color:#ffffff; background-color:#404040;">Area</td>
                    <td style=" border: 1px solid black;color:#ffffff; background-color:#404040;">Specifications </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality combination refrigerator freezer, showcasing modern refrigeration technology.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality under-mount, stainless steel kitchen sink, combining durability and aesthetic appeal.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Contemporary custom-designed, high-end cabinetry with soft-close doors and drawers.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">In select units, open shelving or floating shelves for displaying cookware or décor.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Premium-grade porcelain tiles with a polished or matte finish or similar</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Countertops and backsplash from natural stone, such as granite or quartz, or premium solid surface material for both aesthetics and durability.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Integrated LED lighting for a well-illuminated workspace.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">A powerful, quiet range hood with variable speed settings for efficient odor and smoke removal.</td>
                    </tr>

                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Standards</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">All glazing to BS EN ISO 9001, thermally broken with double glazed reflected glass</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Roof U-value (W/m2.K) UAE Green Building Regulations</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Wall U-value (W/m2.K) UAE Green Building Regulations</td>
                    </tr>

                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">EXCLUDED</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Furnishings </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Equipment (bathroom and other operating equipment) </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">${++i}.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Home entertainment</td>
                    </tr>
                    
                    </table>
                    <p style="font-size:11pt;"><b>DISCLAIMER:</b></p>
                    <p style="font-size:10pt;">All specifications stated herein are anticipated specifications only and will be subjected to re-verification prior to construction or installation in the Property. All specifications stated above may be subject to change without notice to the Purchaser. Any photographs or computer-generated images are indicative of the quality and style of the specification and may not represent the actual fittings and furnishings finally installed within the Property. Seller takes no responsibility for any loss or inconvenience suffered by any person for their reliance on the above-stated specifications.</p>
                    <p style="font-size:10pt;page-break-after: always;">If any of the materials or fixtures referred to in this schedule, and as required by the Seller to finish out the Property are not available within a reasonable time or at a reasonable cost, the Seller may substitute such materials or fixtures with such other materials of similar or better quality (as determined in the sole discretion of the Seller) that are obtainable at that time.</p>
                    `;
      } else {
        template += `
                    <p style="font-size:16pt;"><b>Schedule 4</b></p>
                    <p style="font-size:16pt;"><b>Draft Unit Specification</b></p>
                    <p>The Unit is sold with the following draft specifications which remain subject to change without notice. </p>
                    <table style="width:100%; font-size:11pt;margin-bottom:20px;">
                    <tr>
                    <td style="width:30%; border: 1px solid black;color:#ffffff; background-color:#404040;">No</td>
                    <td style="width:30%; border-top: 1px solid black;border-bottom: 1px solid black;color:#ffffff; background-color:#404040;">Area</td>
                    <td style="width:40%; border: 1px solid black;color:#ffffff; background-color:#404040;">Specifications</td>
                    </tr>
                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">General</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">1.</td>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">Entry Door</td>`;
        if (contractData.subsidiary == 9) {
          template += ` <td style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Custom-made Single leaf Entry door with semi solid core. External 
surface finished in premium veneer/HPL with premium door 
handles and high-quality hardware. Sound-insulated for privacy and 
noise reduction.</td>`;
        } else {
          template += ` <td style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Custom-made Single leaf Entry door with solid timber core. External 
surface finished in premium veneer with, premium door handles and 
high-quality hardware. Sound-insulated for privacy and noise 
reduction.</td>`
        }

        template += `</tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">2.</td>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">Doors </td>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Internal doors in custom made single leaf flushed hinged doors consisting of semi-solid core with timber lipping in flushed solid timber frame. Door finished in veneer on both sides with high end quality ironmongeries. </td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">3.</td>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">Lighting</td>`
        if (contractData.subsidiary != 9) {
          template += `<td style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;"><p>Recessed LED downlights in living areas, kitchen and bedrooms.</p><p>Architectural cove or indirect lighting for creating a warm and inviting atmosphere in common areas.</p><p>Emergency lighting in common areas and corridors, complying with local safety regulations.</p></td>`;
        } else {
          template += `<td style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;"><p>Recessed/Surface Mounted LED downlights in living areas, kitchen and bedrooms.</p><p>Architectural cove or indirect lighting for creating a warm and inviting atmosphere in common areas.</p><p>Emergency lighting in common areas and corridors, complying with local safety regulations.</p></td>`;
        }
        template += `
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">4.</td>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">Airconditioning </td>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;"><p>High-efficiency, centralized HVAC system designed to provide precise temperature control and maximize energy efficiency.</p><p>Zoning capabilities to allow residents to control temperature in individual rooms, enhancing comfort and energy savings. </p><p>Variable refrigerant flow (VRF) or multi-duct systems for cooling`;
        if (contractData.subsidiary != 9) {
          template += `.</p><p>Programmable, user-friendly thermostats with smart technology integration.</p>`
        } else {
          template += ` as per design parameters.</p>`;
        }
        template +=
          `</td>
                    </tr>
                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Living Room and Dining</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">5.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Premium-grade porcelain tiles with a polished or matte finish or equivalent. </td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">6.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Stone Thresholds or Equivalent</td>
                    </tr>
                     
                    <tr>
                    <td style=" border: 1px solid black;color:#ffffff; background-color:#404040;">No</td>
                    <td style=" border-top: 1px solid black;border-bottom: 1px solid black;color:#ffffff; background-color:#404040;">Area</td>
                    <td style=" border: 1px solid black;color:#ffffff; background-color:#404040;">Specifications</td>
                    </tr>


                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">7.</td>`
        if (contractData.subsidiary != 9) {
          template += `<td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Smooth painted ceilings with concealed cove lighting details for ambient illumination.</td>`
        } else {
          template += `<td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Spray plaster painted ceilings for ambient illumination.</td>`
        }
        template += `</tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">8.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High quality painted wall finish in an elegant and harmonious colour palette.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">9.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High quality finish face plates for sockets, switches and DP switches</td>
                    </tr>`;
        if (contractData.subsidiary != 9) {
          template += `<tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">10.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High quality LED lighting </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">11.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Double height glazing with sound insulation properties in loft units </td>
                    </tr>

                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Bedrooms</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">12.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality engineered wood flooring or equivalent porcelain tiles</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">13.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Recessed lighting to create a relaxing ambiance.</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">14.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Closets with custom-built shelving, drawers, and hanging space. All with soft close doors and drawers for elegant experience.</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">15.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High quality painted wall finish in an elegant and harmonious colour palette.</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">16.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High quality finish face plates for sockets, switches, and DP switches</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">17.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Individual climate control with smart thermostats in each bedroom.</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">18.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Conveniently located electrical outlets </td>
                    </tr>
                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Terrace  </td>
                    </tr>
                    <tr>
                      <td style="border-left: 1px solid black;border-bottom: 1px solid black;">19.</td>
                      <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Private balconies or terraces with premium outdoor flooring material.</td>
                      </tr>
                      <tr>
                      <td style="border-left: 1px solid black;border-bottom: 1px solid black;">20.</td>
                      <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Safety railings or glass barriers for unobstructed views and security.</td>
                      </tr>
                      <tr>
                      <td style="border-left: 1px solid black;border-bottom: 1px solid black;">21.</td>
                      <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Railings finished in a way that complements the overall terrace design and the building's exterior aesthetics.</td>
                      </tr>
                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Bathrooms </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">22.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality slip-resistant tiles for safety and comfort underfoot</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">23.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Walls cladded with premium quality, floor-to-ceiling tiles in a variety of elegant finishes.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">24.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Matching or contrasting grout for an upscale and polished appearance.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">25.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Glass-enclosed walk-in shower with a rain showerhead and handheld sprayer or a deep soaking bathtub depending on unit</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">26.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-end, water-saving toilet with a sleek, modern design with Handheld bidet </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">27.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Designer under-mount or vessel sinks. High-quality faucets and fixtures, including single-handle or widespread faucets. Rain showerheads with adjustable spray settings and premium handheld showerheads. </td>
                    </tr>

                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Kitchen </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">28.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality cooktop designed to provide precise and efficient cooking capabilities.</td>
                    </tr>
                    
                    <tr>
                    <td style=" border: 1px solid black;color:#ffffff; background-color:#404040;">No</td>
                    <td style=" border-top: 1px solid black;border-bottom: 1px solid black;color:#ffffff; background-color:#404040;">Area</td>
                    <td style=" border: 1px solid black;color:#ffffff; background-color:#404040;">Specifications</td>
                    </tr>


                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">29.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality integrated washer-dryer, quiet and energy saving.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">30.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality combination refrigerator freezer, showcasing modern refrigeration technology.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">31.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality under-mount, stainless steel kitchen sink, combining durability and aesthetic appeal.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">32.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Contemporary custom-designed, high-end cabinetry with soft-close doors and drawers.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">33.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">In select units, open shelving or floating shelves for displaying cookware or décor.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">34.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Premium-grade porcelain tiles with a polished or matte finish or similar</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">35.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Countertops and backsplash from natural stone, such as granite or quartz, or premium solid surface material for both aesthetics and durability.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">36.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Integrated LED lighting for a well-illuminated workspace.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">37.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">A powerful, quiet range hood with variable speed settings for efficient odor and smoke removal.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">38.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Universal Outlets for All Appliances.</td>
                    </tr>

                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Standards</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">39.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">All glazing to BS EN ISO 9001, thermally broken with double glazed reflected glass</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">40.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Roof U-value (W/m2.K) UAE Green Building Regulations</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">41.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Wall U-value (W/m2.K) UAE Green Building Regulations</td>
                    </tr>

                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">EXCLUDED</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">42.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Furnishings </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">43.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Equipment (bathroom and other operating equipment) </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">44.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Home entertainment</td>
                    </tr>
                    
                    </table>`;
        } else {
          template += `<tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Bedrooms</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">10.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Porcelain wood like flooring or equivalent porcelain tiles</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">11.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Lighting provision to create a relaxing ambiance.</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">12.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Closets with custom-built shelving, drawers, and hanging space. All with soft close doors and drawers for elegant experience.</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">13.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High quality painted wall finish in an elegant and harmonious colour palette.</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">14.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High quality finish face plates for sockets, switches, and DP switches</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">15.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Individual climate control with smart thermostats in each bedroom.</td>
                    </tr>
                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">16.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Conveniently located electrical outlets </td>
                    </tr>
                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Terrace  </td>
                    </tr>
                    <tr>
                      <td style="border-left: 1px solid black;border-bottom: 1px solid black;">17.</td>
                      <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Private balconies or terraces with premium outdoor flooring material.</td>
                      </tr>
                      <tr>
                      <td style="border-left: 1px solid black;border-bottom: 1px solid black;">18.</td>
                      <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Safety railings or glass barriers for unobstructed views and security.</td>
                      </tr>
                      <tr>
                      <td style="border-left: 1px solid black;border-bottom: 1px solid black;">19.</td>
                      <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Railings finished in a way that complements the overall terrace design and the building's exterior aesthetics.</td>
                      </tr>
                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Bathrooms </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">20.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality slip-resistant tiles for safety and comfort underfoot</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">21.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Walls cladded with premium quality, floor-to-false ceiling tiles in a variety of elegant finishes.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">22.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Matching or contrasting grout for an upscale and polished appearance.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">23.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Glass-enclosed walk-in shower</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">24.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Designer under-mount or vessel sinks. High-quality faucets and fixtures, including single-handle or widespread faucets. Rain showerheads with adjustable spray settings and premium handheld showerheads. </td>
                    </tr>

                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Kitchen </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">25.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality cooktop designed to provide precise and efficient cooking capabilities.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">26.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality integrated washer-dryer, quiet and energy saving.</td>
                    </tr>
                    
                    <tr>
                    <td style=" border: 1px solid black;color:#ffffff; background-color:#404040;">No</td>
                    <td style=" border-top: 1px solid black;border-bottom: 1px solid black;color:#ffffff; background-color:#404040;">Area</td>
                    <td style=" border: 1px solid black;color:#ffffff; background-color:#404040;">Specifications</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">27.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality combination refrigerator freezer, showcasing modern refrigeration technology.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">28.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">High-quality under-mount, stainless steel kitchen sink, combining durability and aesthetic appeal.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">29.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Contemporary custom-designed, high-end cabinetry with soft-close doors and drawers.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">30.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">In select units, open shelving or floating shelves for displaying cookware or décor.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">31.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Premium-grade porcelain tiles with a polished or matte finish or similar</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">32.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Countertops and backsplash from natural stone, such as granite or quartz, or premium solid surface material for both aesthetics and durability.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">33.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Integrated LED lighting for a well-illuminated workspace.</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">34.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">A powerful, quiet range hood with variable speed settings for efficient odor and smoke removal.</td>
                    </tr>

                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Standards</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">35.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">All glazing to BS EN ISO 9001, thermally broken with double glazed reflected glass</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">36.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Roof U-value (W/m2.K) UAE Green Building Regulations</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">37.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Wall U-value (W/m2.K) UAE Green Building Regulations</td>
                    </tr>

                    <tr>
                    <td colspan="3" style="color:#ffffff; background-color:#086464;border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">EXCLUDED</td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">38.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Furnishings </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">39.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Equipment (bathroom and other operating equipment) </td>
                    </tr>

                    <tr>
                    <td style="border-left: 1px solid black;border-bottom: 1px solid black;">40.</td>
                    <td colspan="2" style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">Home entertainment</td>
                    </tr>
                    
                    </table>`
        }

        template += `<p style="font-size:11pt;"><b>DISCLAIMER:</b></p>
                    <p style="font-size:10pt;">All specifications stated herein are anticipated specifications only and will be subjected to re-verification prior to construction or installation in the Property. All specifications stated above may be subject to change without notice to the Purchaser. Any photographs or computer-generated images are indicative of the quality and style of the specification and may not represent the actual fittings and furnishings finally installed within the Property. Seller takes no responsibility for any loss or inconvenience suffered by any person for their reliance on the above-stated specifications.</p>
                    <p style="font-size:10pt;page-break-after: always;">If any of the materials or fixtures referred to in this schedule, and as required by the Seller to finish out the Property are not available within a reasonable time or at a reasonable cost, the Seller may substitute such materials or fixtures with such other materials of similar or better quality (as determined in the sole discretion of the Seller) that are obtainable at that time.</p>
                    `;
      }

      // // PURCHASER:
      {
        template += `
                    <table width="100%" style="page-break-after: always;">
                    <tbody>
                    <tr>
                    <td width="45%"></td>
                    <td width="5%"></td>
                    <td width="50%"></td>
                    </tr>
                    <tr>
                    <td colspan="3"><strong>PURCHASER:</strong></td>
                    </tr>
                    <tr>
                    <td><strong>Signed</strong> by the Purchaser in the presence of:</td>
                    <td style="align: center;">)</td>
                    <td>&nbsp;</td>
                    </tr>
                    <tr>
                    <td>&nbsp;</td>
                    <td style="align: center;">)</td>
                    <td>&nbsp;</td>
                    </tr>
                    <tr style="height: 60px;">
                    <td>&nbsp;</td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td>Witness signature:</td>
                    <td style="align: center;">)</td>
                    <td>
                    <p style="color: #aaaaaa;">sign here:</p>
                    ________________________________________</td>
                    </tr>

                    <tr>
                    <td>Witness name (block letters):</td>
                    <td style="align: center;">)</td>
                    <td>
                    <p style="color: #aaaaaa;">print name:</p>
                    ________________________________________</td>
                    </tr>

                    <tr>
                    <td>Witness address:</td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    <tr>
                    <td></td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>

                    </tbody>
                    </table>`;
      }

      // // Schedule 5 Part A
      {
        template += `
                    <p style="font-size:16pt;"><b>Schedule 5</b></p>
                    <p style="font-size:16pt;"><b>Definitions and Interpretation</b></p>
                    <p style="font-size:14pt;"><b>Part A – Definitions</b></p>
                          <table style="width:90%; font-size:10pt;margin-bottom:20px;page-break-after: always;">  
                          <tr>  
                          <td  style="width:40%; border: 1px solid black;color:#ffffff; background-color:#086464;">AED</td>  
                          <td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;">means the Dirham, the lawful currency of the UAE;</td>                         
                          </tr>  

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Affiliate</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any person and/or legal entity within the same group of companies of, or related to and/or associated with a Party;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Agreement</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means this sale and purchase agreement entered into between the Seller and the Purchaser on the Effective Date;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">AML</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means Federal Decree-law No. (20) of 2018 on Anti-Money Laundering and Combating the Financing of Terrorism and Financing of Illegal Organisations;</td>                         
                          </tr>
                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Anticipated <br/>Completion Date</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the date upon which the Seller estimates that Completion is to occur being the date as specified in <b>Item 4</b> of the Particulars, as such date is extended by the Seller in accordance with this Agreement (including in respect of any Force Majeure Event or Foreign Reasons);</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Applicable Laws</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means all laws, decrees, orders, decisions, instruments, notices, regulations, requirements, codes of practice, directions, guidance, permissions, consents or licences issued by the Government of Ras Al Khaimah or the Relevant Authorities that may, at any time, and from time to time, be applicable to this Agreement, the Governance Documents, or the Unit as such laws may be varied, amended, replaced or re-enacted from time to time, including the Jointly Owned Property Law;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Approximate Unit <br/>Area</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the approximate area of the Unit BUA as specified in <b>Item 3</b> of the Particulars and calculated in accordance with the Jointly Owned Property Law; </td>                         
                          </tr>
                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Car Parking Spaces</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the number of car parking spaces specified in <b>Item 3</b> of the Particulars;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Change of Control</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means in respect of a company or other entity, any assignment or transfer of the legal and/or beneficial ownership of any shares or units in that company or other entity or any change in the voting control or effective control (whether direct or indirect) of that company or other entity;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Civil Code</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means Federal Civil Transaction Law No. 5 of 1985 (as amended);</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Clearance <br/>Certificate</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any clearance certificate required to be obtained by the Purchaser from the Seller and/or the Strata Manager (as applicable) in respect of the payment of the Service Charges (and any other charges or payments);</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Common Areas Site Plan</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the plan of the Common Areas in accordance with the Jointly Owned Property Law;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Common Areas</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means those parts of the Project and the facilities contained therein intended for the use in common by the Owners and their Occupiers (subject to any Exclusive Use Rights) as shown on the Common Areas Site Plan;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Compensation</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means one percent (1%) per month, compounded monthly, on all outstanding amounts under this Agreement (including Service Charges payable on the Completion Date);</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Completion</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the date on which the Seller hands over possession of the Unit to the Purchaser provided the Purchaser fulfils its obligations under this Agreement;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Completion Date</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the date upon which Completion is to occur as notified to the Purchaser in the Completion Notice in accordance with this Agreement.  For the avoidance of doubt, the Completion Date may be before or after the Anticipated Completion Date and will override the same;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Completion Notice</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the notice served on the Purchaser specifying the Completion Date;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Construction <br/>Handover Date</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the date that the Contractor handed over the Unit and the Common Areas (as applicable) to the Seller in accordance with the construction contract entered into between the Seller and the Contractor;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Contractor</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the contractor(s) engaged by the Seller to carry out the Unit Works;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Dealing</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any mortgage, charge, pledge, lien, option in respect of the whole or any part of the Unit or any interest in this Agreement by the Purchaser whether directly or indirectly (but excludes any Disposal);</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Declaration of <br/>Adherence and <br/>Acknowledgement</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the declaration of adherence to the Governance Documents and/or the other documents referred to therein and acknowledgement that the Unit has been delivered to the Purchaser in accordance with this Agreement in the form attached as <b>Schedule 6</b> as may be varied by the Seller from time to time;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Deficiencies</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any defects and deficiencies in the Unit Works but excluding any minor settlement cracks;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Deposit</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the deposit paid by the Purchaser to the Seller on or before the Effective Date as specified in the Payment Schedule;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Disclosure <br/>Statement</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the disclosure statement attached as <b>Schedule 1</b>;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Disposal</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any sale, transfer, assignment, novation, lease, licence, tenancy or other disposal of possession and/or occupation of the whole or any part of the Unit or any interest in the Unit or this Agreement whether directly or indirectly (but excludes any Dealing) or any agreement to do the same and, where the Purchaser is an entity, includes any Change of Control;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Dispute</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any and all disputes, claims, demands, causes of action, issues and disagreements arising out of or relating to this Agreement or the breach of this Agreement, or its interpretation, performance, termination, existence or invalidity;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Draft Unit Plan</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the draft layout plan of the Unit attached to this Agreement as <b>Schedule 3</b>, as such plan may be amended by the Seller, from time to time, in accordance with this Agreement and the requirements of the Relevant Authorities;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Draft Unit <br/>Specification</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the draft Unit specification attached to this Agreement as <b>Schedule 4</b>, as such specification may, from time to time, be amended by the Seller in accordance with this Agreement;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Effective Date</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the date this Agreement was entered to by the Parties being the date specified in <b>Item 10</b> of the Particulars;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Engineer</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the consultant appointed, from time to time, by the Seller to act as the engineer under the construction contract for the Unit and Project Works;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Entitlement</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the proportionate entitlement allocated to a Unit that represents the share of ownership in the Common Areas relating to such Unit as determined in accordance with the Jointly Owned Property Law;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Escrow Account</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the Seller’s bank account specified in <b>Item 9</b> of the Particulars;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Escrow Account Law</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means Amiri Decree No. 22 of 2008 and No. 10 of 2014 Concerning Guarantee Accounts of Real Estate Development in the Emirate of Ras Al Khaimah, including any bylaws, regulations and resolutions issued, from time to time, thereunder and any other legislation, regulations and directions intended to complement or replace such law;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Escrow Agent</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the escrow agent appointed by the Seller to manage and administer the Escrow Account in accordance with the Escrow Account Law, which agent may be substituted by the Seller in its absolute discretion from time to time;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Estimated Service <br/>Charge</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the Seller’s estimated service charge specified in the Disclosure Statement which may be varied by the Seller prior to the Completion Date;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Exclusive Use <br/>Rights</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the rights of exclusive use (if any) granted to any Owner with respect to designated Common Areas in accordance with and subject to the Jointly Owned Property Law, the terms and conditions of this Agreement and the Governance Documents;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">FEWA</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the Federal Electricity and Water Authority;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Final Unit Area</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the final area of the Unit BUA following construction measured and calculated in accordance with the Jointly Owned Property Law; </td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">First Provisional <br/>Service Charge</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the amount calculated by the Seller as being a reasonable estimate of the Service Charges for the Unit for the first Service Charge Period (as determined by the Seller);</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Force Majeure Event</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any act of God including fire, flood, earthquake, windstorm or other natural disaster; any act of any sovereign including terrorist attacks, war (whether war declared or not), invasion, act of foreign enemies, hostilities, civil war, rebellion, revolution, insurrection, military action, confiscation, nationalisation, pandemic, or threat of any of the foregoing; and any other act, matter or cause whatsoever which is beyond the reasonable control of the Seller;</td>                         
                          </tr>

                          <tr>  
                          <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Foreign Reasons</td>  
                          <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">
                          <table style="font-size:10pt;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td></td>
                      <td colspan="3">means any act, omission, negligence or delay of the Master Developer, any other Relevant Authority, Utility Provider, the Contractor and/or any other contractors, sub-contractors, agents or third-party persons or entities that is beyond the Seller’s reasonable control, including:</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td>(a) </td>
                        <td colspan="2">refusal, delay and/or revocation of any license, consent or otherwise;</td>
                        </tr>
                        <tr>
                        <td></td>
                        <td>(b) </td>
                        <td colspan="2">any negligence, failure and/or delay by the Master Developer or any other Relevant Authority, any Utility Provider and/or any of their contractors and/or agents in acting, approving, supplying, connecting to and/or completing any of:</td>
                        </tr>
                        <tr>
                        <td></td>
                        <td></td>
                        <td>(i) </td>
                        <td>the Project;</td>
                        </tr>
                        <tr>
                      <td></td>
                      <td></td>
                      <td>(ii) </td>
                      <td>the Project’s related infrastructure and facilities (including the Utility Plant, the utility conduits, roads, highways, access ways and/or lighting); and</td>
                      </tr>
                      <tr>
                      <td></td>
                      <td></td>
                      <td>(iii) </td>
                      <td>the Utility Services;</td>
                      </tr>
                      <tr>
                      <td></td>
                      <td>(c) </td>
                      <td colspan="2">labour dispute including strike, lockout or boycott;</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td>(d) </td>
                        <td colspan="2">breach of contract by the Contractor or any contractor or subcontractor with respect to the Project Works;</td>
                        </tr>
                        <tr>
                        <td></td>
                        <td>(e) </td>
                        <td colspan="2">any delay, hindrance in or failure of the supply or transportation of any personnel, equipment, machinery, supply or material required by the Seller or the Contractor for the Project Works;</td>
                        </tr>
                        <tr>
                        <td></td>
                        <td>(f) </td>
                        <td colspan="2">any delay, hindrance or failure by the Master Developer to transfer the title and ownership in the plots comprising the Project to the Seller;</td>
                        </tr>
                        <tr>
                        <td></td>
                        <td>(g) </td>
                        <td colspan="2">any delay in the provision of any Utility Service or access to the Unit or the Project; and</td>
                        </tr>
                        <tr>
                        <td></td>
                        <td>(h) </td>
                        <td colspan="2">any other act, matter or cause whatsoever which is beyond the reasonable control of the Seller;</td>
                        </tr>
                        </table>
                        </td>                         
                        </tr>

                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">General Fund</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the fund established by the Strata Manager in accordance with the Governance Documents to pay for the day-to-day expenses (which are not Reserve Fund costs) of Managing the Common Areas;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Governance <br/>Documents</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the Master Community Declaration, the JOPD, and/or any other document, instrument or agreement Registered or required to be Registered in respect of the Master Community, the Project and/or the Unit in accordance with the Jointly Owned Property Law or any other Applicable Laws;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Instalment</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means an instalment of the Purchase Price as specified in the Payment Schedule (including the Deposit) and a reference to "Instalments" will be a reference to all or any of the Instalments as the context so determines;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Instalment Payment <br/>Date</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the date that an Instalment is due and payable by the Purchaser to the Seller as specified in the Payment Schedule; </td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Instalments Paid</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means all Instalments paid by the Purchaser and received by the Seller as cleared funds at any given time with respect to the Unit in accordance with this Agreement (excluding any payments of Compensation by the Purchaser);</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Interest</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means annual interest at one per cent (1%) per annum;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Interim Property <br/>Register</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the interim property register maintained by the Relevant Authorities for the registration of off-plan sales;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Invitees</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any person or entity visiting a Unit including the Owner’s or Occupier’s visitors, suppliers, contractors, servants, guests, family members and employees;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Jointly Owned <br/>Property Law</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means Law No. (11) of 2021 on Land Registers in the Emirate of Ras Al Khaimah, including any bylaws, regulations and resolutions issued, from time to time, thereunder and any other legislation, regulations and directions intended to complement or replace such law;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">JOPD</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the jointly owned property declaration as prepared by the Seller in the form prescribed by and in accordance with the Jointly Owned Property Law;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Lease</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any lease, license, rental or other occupational rights with respect to the Unit that are not on a Short-Term Basis; </td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Licensed Surveyor</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means a surveyor licensed by the Relevant Authorities and registered with the Relevant Authorities to survey the Project and/or the Unit in accordance with the Jointly Owned Property Law;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Long Term Basis</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means a Lease period of twelve months or more;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Management</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the use, administration, control, operation, management, maintenance, repair, refurbishment, replacement and (where necessary or desirable) renovation and renewal and “Manage”, “Managed”, and “Managing” means the act of undertaking such functions;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Master Community</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means Al Marjan Island, Ras Al Khaimah, UAE;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Master Community Charges</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the amount payable to the Master Developer in respect of the Management of the Master Community;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Master Community Declaration</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the master community declaration (or any other such governing document) declared or registered in respect of the Master Community by the Master Developer;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Master Developer</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means Al Marjan Island LLC or any other entity or authority as may assume responsibility for the development, management and control of the Master Community from time to time;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Occupier</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any person occupying the Unit, including the Purchaser, or any tenant, and its family members (and any mortgagee in possession) and “Occupiers” shall be construed accordingly;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Owner</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the owner of a Unit (and any owner whose Registration of title is still pending), and "Owners" shall be construed accordingly;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Particulars</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the particulars of sale relating to the Unit included in this Agreement under the heading “Particulars of Sale”, and which shall be considered an integral and binding part of this Agreement;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Parties</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means, collectively, the Seller and the Purchaser and “Party” means either one of them as the context so permits;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Payment Schedule</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the payment schedule attached as Item 6 of the Particulars;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Permitted Use</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the permitted use of the Unit as specified in Item 8 of the Particulars and clause 10;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Plot</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the plot specified in Item 3 of the Particulars;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Pre-Registration <br/>System</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the interim pre-registration system of the Relevant Authorities in respect of the registration of sale and purchase agreements for ‘off-plan’ properties on the Interim Property Register;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Project</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the project specified in Item 3 of the Particulars;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Project Rules</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the rules from time to time, applicable to the Project in accordance with the Governance Documents;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Project Marks</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any trademarks, brand, interior design and other intellectual property associated with the Project belonging to the Seller;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Project Works</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the construction of the Project, including the Unit and the Common Areas, by the Contractor;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Purchase Price</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the purchase price of the Unit as set out in Item 5 of the Particulars;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Purchaser</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the Purchaser named in Item 2 of the Particulars including where relevant its heirs, personal representatives, successors and permitted assigns;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Registration</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means registration with the Relevant Authorities, “Register” means the registration process and “Registered” means the completion of this registration process;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Registration Fees</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any and all fees, charges or other costs or expenses payable to the Relevant Authorities or any other applicable registry in respect of the transfer and registration of ownership and title to the Unit (or any Disposal of or Dealing with the Unit) in accordance with this Agreement, including any fees, charges or other costs and expenses payable by or levied upon the Seller.  Registration Fees include all fees payable in respect of the Registration of this Agreement in the Pre-Registration System and Registration of title to the Unit into the name of the Purchaser, as such fees may be varied, from time to time, by the Relevant Authorities.</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Relevant Authority</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the Government of the Emirate of Ras Al Khaimah or the UAE, as the case may be, or any person or entity relating to or acting in connection with the Government of the Emirate of Ras Al Khaimah or the UAE having any jurisdiction or authority over the Project or the Unit, including any federal authority, ministry, department, municipality, local authority, service providers, and the Master Developer, including RAK Municipality, RERA and the Utility Providers;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">RERA</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the Real Estate Regulatory Administration, being a division of the RAK Municipality;</td>                         
                        </tr>
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Reserve Fund</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the reserve fund established by the Strata Manager in accordance with the Jointly Owned Property Law for the purpose of accumulating sufficient funds (as determined by the Strata Manager) to fund any repairs and replacement of the Common Areas of a capital nature as may be necessary from time to time;</td>                         
                        </tr>

                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Residential Facilities</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">
                        <table style="font-size:10pt;">
                        <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">means those facilities that may be made available for the non-exclusive use of the Owners (and their Occupiers) from time to time, if any. As at the Effective Date, the Residential Facilities comprise the following facilities:</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td>(a) </td>
                        <td colspan="2">gym;</td>
                        </tr>
                        <tr>
                        <td></td>
                        <td>(b) </td>
                        <td colspan="2">swimming pool; and</td>
                        </tr>
                        <tr>
                        <td></td>
                        <td>(c) </td>
                        <td colspan="2">lobby.</td>
                        </tr>
                        </table>
                        </td>                         
                        </tr> 
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Residential Use</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the occupancy of the unit for residential purposes by one or more individuals;</td>                         
                        </tr> 
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Sanctions List</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any list of persons and entities subject to restrictive economic measures and/or sanctions issued by a government or international organisation or otherwise being relevant to the Project or the Seller and its Affiliates;</td>                         
                        </tr> 
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Schedules</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the schedules attached to this Agreement which shall be considered an integral and binding part of this Agreement;</td>                         
                        </tr> 
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Seller</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the seller named in Item 1 of the Particulars;</td>                         
                        </tr> 
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Seller’s <br/>Administration Fee</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the fee payable to the Seller on any Disposal in accordance with this Agreement (if any). Subject to the Applicable Laws, the Seller’s Administration Fee shall be determined by the Seller in its absolute discretion and may increase from time to time in accordance with market practices;</td>                         
                        </tr> 
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Seller’s Remedy <br/>Period</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">has the meaning as defined in clause 15.1;</td>                         
                        </tr> 
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Seller’s <br/>Representative</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means such person appointed and notified by the Seller in writing to the Purchaser from time to time to act as the Seller’s representative for the purposes of this Agreement;</td>                         
                        </tr> 
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Service Charge <br/>Deposit</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the service charge deposit payable by the Purchaser being an amount equivalent to twelve (12) months’ Service Charges for the Unit from time to time. As at the Effective Date the Service Charge Deposit is for the amount specified in Item 7 of the Particulars; </td>                         
                        </tr> 
                        <tr>  
                        <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Service Charges</td>  
                        <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the expenses associated with the Management of the Common Areas determined in accordance with the Entitlement of the Unit;</td>                         
                        </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Shared Occupancy Plan</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">
                      <table style="font-size:10pt;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td></td>
                      <td colspan="3">means any occupancy plan that provides for: </td>
                      </tr>
                        <tr>
                        <td></td>
                        <td>(a) </td>
                        <td colspan="2">any division of the Unit on a time increment basis of chronological periods, or any agreement, plan, program or arrangement under which the right to use, occupy, or possess the Unit is accorded to various persons, either corporate, individual or otherwise on any basis, for value exchanged at any time, whether monetary or like-kind use privileges, according to a fixed or floating interval or period of time or any other period of time, including those products commonly known as timeshare, fractional, or private residence clubs; </td>
                        </tr>
                        <tr>
                        <td></td>
                        <td>(b) </td>
                        <td colspan="2">any joint ownership, whether or not ownership is deeded, of the Unit where unrelated (i.e., non-family) owners share and enjoy use or occupation of the Unit according to a periodic (fixed or floating) schedule based on time intervals, points or other rotational system; </td>
                        </tr>
                        <tr>
                        <td></td>
                        <td>(c) </td>
                        <td colspan="2">any club or program, the membership of which allows access and use of one or more properties by its members based on availability and reservation priorities, commonly known as destination clubs (equity or non-equity) or vacation clubs; or</td>
                        </tr>
                        <tr>
                      <td></td>
                      <td colspan="3">any plan or program analogous to the above;</td>
                      </tr>
                      </table>
                      </td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Short Term Basis</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means a lease or license period of less than six (6) months;</td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Strata Manager</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the specialised management company (if any) appointed to manage the Common Areas in accordance with the Jointly Owned Property Law. If no Strata Manager is appointed, any reference to the Strata Manager shall be a reference to the Seller; </td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Supplier</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any consultant, contractor, tradesperson or the like who provides services to the Project, the Common Areas or the Units, including operational, maintenance, repair and replacement services for the Residential Facilities;</td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Taxes</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any taxes (including any value added tax or similar tax), rate assessments, or charges raised by any Relevant Authority in respect of the Unit or the Project or otherwise in connection with this Agreement; </td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Termination Amount</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the percentage of the Purchase Price which the Seller is entitled to retain upon termination of this Agreement in accordance with Applicable Laws;</td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Transferee</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any person or entity (except for the Purchaser) that receives or is to receive any whole or partial interest in the Unit pursuant to any Disposal or Dealing, including any purchaser, transferee, assignee, mortgagee, pledgee, lessee, licensee or the like; </td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">UAE</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the United Arab Emirates;</td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Unit</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the unit specified in Item 3 of the Particulars and more particularly depicted and described in the Draft Unit Plan and Draft Unit Specifications (as may be varied in accordance with the terms of this Agreement);</td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Unit BUA</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means built-up area of the Unit as specified on the Draft Unit Plan attached to this Agreement as Schedule 3 and calculated in accordance with the Jointly Owned Property Law, excluding pool and pergola;</td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Units</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means all or any of the units designated for private ownership in the Project (as the case may be) (including the Unit); </td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Unit Works</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the construction of the Unit (and the associated Common Areas required to provide access to the Unit) by the Contractor substantially in accordance with the Draft Unit Plan, the Draft Unit Specification and the approvals of the Relevant Authorities; and</td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Utility Charges</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the charges payable by the Purchaser (and/or the Strata Manager) to the Utility Provider (or to the Seller for distribution to the Utility Provider), for the connection, disconnection, consumption or usage of the Utility Services provided by the Utility Provider to the Unit (and the Strata Manager with respect to the Common Areas), which charges shall be determined by the Utility Provider from time to time;</td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Utility Connection Charge</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means a fee payable to the Seller for connecting the Unit to the Utility Services as determined by the Seller from time to time;</td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Utility Plant</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the utility plant that is installed by the Seller (or a Utility Provider) to provide for the generation, supply, control or metering of the Utility Services;</td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Utility Provider</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the utility providers nominated by the Seller or the Relevant Authority, from time to time, in respect of the Utility Services;</td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Utility Services</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means the utility services provided to the Unit and the Project by the Utility Provider or the Relevant Authority, including potable water, irrigation water, chilled water, electricity, gas, sewerage and telecommunication services; </td>                         
                      </tr> 

                      <tr>  
                      <td  style="border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Working Day</td>  
                      <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">means any day on which banks in the UAE are open to the public for the transaction of business.</td>                         
                      </tr> 


                          
                          </table>  `;
      }

      // // Schedule 5 Part B
      {
        template += `<table style="font-size:10pt;width:100%;page-break-after: always;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:14pt;">Part B – Interpretation</td>
                      </tr>
                      <tr>
                      <td></td>
                      <td colspan="3">In this Agreement, except where the context otherwise requires, the following rules of interpretation shall apply:</td>
                      </tr>
                      <tr>
                      <td>1.</td>
                      <td colspan="3">singular words shall be deemed to include the plural and vice versa;</td>
                      </tr>
                      <tr>
                      <td>2.</td>
                      <td colspan="3">words importing the male gender shall be deemed to include the female gender and vice versa;</td>
                      </tr>
                      <tr>
                      <td>3.</td>
                      <td colspan="3">all dates and periods of time shall be determined by reference to the "Gregorian" calendar;</td>
                      </tr>
                      <tr>
                      <td>4.</td>
                      <td colspan="3">where any notice period referred to in this Agreement expires on a day which is not a Working Day and/or any action is required to be taken on a day which is not a Working Day, such period shall be deemed to expire on the next Working Day and/or such action shall be deemed to be required to be taken on the next Working Day, as the case may be;</td>
                      </tr>
                      <tr>
                      <td>5.</td>
                      <td colspan="3">where the words "include", "includes" or "including" are used in this Agreement they shall be deemed to have the words "without limitation" following them;</td>
                      </tr>
                      <tr>
                      <td>6.</td>
                      <td colspan="3">any reference to a "person" or an "entity" shall include any and all natural or legal persons including individuals, associations, bodies, companies, corporations, firms, partnerships or trusts where the context so requires;</td>
                      </tr>
                      <tr>
                      <td>7.</td>
                      <td colspan="3">any reference to the Jointly Owned Property Law or to any other law is a reference to it as it is in force for the time being, taking account of any amendment, extension, modification or re-enactment and includes any subordinate law for the time being in force made under it;</td>
                      </tr>
                      <tr>
                      <td>8.</td>
                      <td colspan="3">if a provision of this Agreement includes a term, condition, amount or timeframe which does not comply with the Applicable Laws, such term, condition, amount or timeframe must be read down to the extent required to give the provision legal effect;</td>
                      </tr>
                      <tr>
                      <td>9.</td>
                      <td colspan="3">clause, paragraph and schedule headings are for convenience only and may not be used in construing this Agreement or any part of it; and</td>
                      </tr>
                      <tr>
                      <td>10.</td>
                      <td colspan="3">1if any provision in a definition in Part A of this Schedule 5 is a substantive provision conferring rights or imposing obligations then, notwithstanding that it is only in the table of definitions in Part A of this Schedule 5, effect shall be given to it as if it were a substantive provision in the body of this Agreement.</td>
                      </tr>
                      </table>`;
      }

      // // Schedule 6
      {
        template += `
                    <p style="font-size:16pt;"><b>Schedule 6  </b></p>
                    <p style="font-size:16pt;"><b>Declaration of Adherence and Acknowledgement</b></p>
                    <p style="page-break-after: always;">To be completed following the inspections set out in clause 4.1 of the Agreement.</p>
                    
                    `;
      }

      // // Declaration of Adherence and Acknowledgement
      {
        template += `
                    <p style="font-size:16pt;"><b>Declaration of Adherence and Acknowledgement</b></p>
                    <p style="font-size:14pt;">Particulars of Sale </p>
                    <table style="width:90%; font-size:10pt;margin-bottom:20px;">  
                    <tr>  
                    <td  style="width:40%; border: 1px solid black;color:#ffffff; background-color:#086464;">SELLER:</td>  
                    <td style=" border-top: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;"><b>${subsidiaryData.legalName} </b></td>                         
                    </tr> `;
        if (customerData.isperson == true) {
          template +=
            `<tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">PURCHASER NAME:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;"><b>` +
            customerData.firstName +
            `&nbsp;` +
            customerData.midName +
            `&nbsp;` +
            customerData.lastName +
            `</b></td>                         
                    </tr>
                    <tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">PURCHASER ADDRESS:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">` +
            customerData.address +
            `</td>                         
                    </tr>
                    `;
        } else {
          template +=
            `
                    <tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">PURCHASER NAME:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;"><b>` +
            customerData.companyName +
            `</b></td>                         
                    </tr>
                    <tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">PURCHASER ADDRESS:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">` +
            customerData.address +
            `</td>                         
                    </tr>
                    `;
        }
        if (
          contractData.secondCustomer &&
          secondCustomerData.isperson == true
        ) {
          template +=
            `<tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">SECOND PURCHASER NAME:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;"><b>` +
            secondCustomerData.firstName +
            `&nbsp;` +
            secondCustomerData.midName +
            `&nbsp;` +
            secondCustomerData.lastName +
            `</b></td>                         
                    </tr>
                    <tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">SECOND PURCHASER ADDRESS:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">` +
            secondCustomerData.address +
            `</td>                         
                    </tr>
                    `;
        } else if (
          contractData.secondCustomer &&
          secondCustomerData.isperson == false
        ) {
          template +=
            `
                    <tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">SECOND PURCHASER NAME:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;"><b>` +
            secondCustomerData.companyName +
            `</b></td>                         
                    </tr>
                    <tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">SECOND PURCHASER ADDRESS:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">` +
            secondCustomerData.address +
            `</td>                         
                    </tr>
                    `;
        }

        if (contractData.thirdCustomer && thirdCustomerData.isperson == true) {
          template +=
            `<tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">THIRD PURCHASER NAME:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;"><b>` +
            thirdCustomerData.firstName +
            `&nbsp;` +
            thirdCustomerData.midName +
            `&nbsp;` +
            thirdCustomerData.lastName +
            `</b></td>                         
                    </tr>
                    <tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">THIRD PURCHASER ADDRESS:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">` +
            thirdCustomerData.address +
            `</td>                         
                    </tr>
                    `;
        } else if (
          contractData.thirdCustomer &&
          thirdCustomerData.isperson == false
        ) {
          template +=
            `
                    <tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">THIRD PURCHASER NAME:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;"><b>` +
            thirdCustomerData.companyName +
            `</b></td>                         
                    </tr>
                    <tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">THIRD PURCHASER ADDRESS:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">` +
            thirdCustomerData.address +
            `</td>                         
                    </tr>
                    `;
        }
        if (contractData.fourthCustomer) {
          template +=
            `
                  <tr>  
                  <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">FOURTH PURCHASER NAME:</td>  
                  <td style=" border-bottom: 1px solid black;border-right: 1px solid black;"><b>` +
            fourthCustomerData.fullname +
            `</b></td>                         
                  </tr>
                  <tr>  
                  <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">FOURTH PURCHASER ADDRESS:</td>  
                  <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">` +
            fourthCustomerData.address +
            `</td>                         
                  </tr>
                  `;

        }
        if (contractData.fifthCustomer) {
          template +=
            `
                  <tr>  
                  <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">FIFTH PURCHASER NAME:</td>  
                  <td style=" border-bottom: 1px solid black;border-right: 1px solid black;"><b>` +
            fifthCustomerData.fullname +
            `</b></td>                         
                  </tr>
                  <tr>  
                  <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">FIFTH PURCHASER ADDRESS:</td>  
                  <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">` +
            fifthCustomerData.address +
            `</td>                         
                  </tr>
                  `;

        }


        template +=
          `

                    <tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Master Community:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">` +
          propertyData.masterCom +
          `</td>                         
                    </tr>

                    <tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Project:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">` +
          propertyData.name +
          `</td>                         
                    </tr>

                    <tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">Unit Number:</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;">` +
          unitData.name +
          `</td>                         
                    </tr>

                    <tr>  
                    <td  style=" border-left: 1px solid black;border-bottom: 1px solid black;border-right: 1px solid black;color:#ffffff; background-color:#086464;">DATE OF DECLARATION</td>  
                    <td style=" border-bottom: 1px solid black;border-right: 1px solid black;"></td>                         
                    </tr>
                    </table>
                    <p style="font-size:10pt;"><b>THIS DECLARATION OF ADHERENCE AND ACKNOWLEDGEMENT </b>is made <b>BETWEEN </b>the Seller and the Purchaser as described in and on the date set out in the Particulars (the “<b>Declaration</b>”)</p>
                    <table style="font-size:10pt;width:100%;page-break-after: always;">
                      <tr>
                      <td style="width:1%"></td>
                      <td style="width:3%"></td>
                      <td style="width:1%"></td>
                      <td style="width:95%"></td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:11pt;">
                      <b>WHEREAS:</b>
                      </td>
                      </tr>
                      <tr>
                      <td>(A)</td>
                      <td colspan="3">The Parties have entered into a sale and purchase agreement (the “Agreement”) whereby the Seller agreed to sell and the Purchaser agreed to purchase the Unit subject to the terms of the Agreement and the terms of the Governance Documents to be Registered with the Relevant Authorities in respect of the Project and the Unit.</td>
                      </tr>
                      <tr>
                      <td>(B)</td>
                      <td colspan="3">In consideration of the Purchaser satisfying its obligations under the Agreement, the Seller has handed over the Unit to the Purchaser.</td>
                      </tr>
                      <tr>
                      <td>(C)</td>
                      <td colspan="3">The Purchaser acknowledges handover of the Unit upon the conditions set out in the Agreement and this Declaration.</td>
                      </tr>
                      <tr>
                      <td>(D)</td>
                      <td colspan="3">The Purchaser agrees to be bound by the terms of the Governance Documents as further set out in this Declaration.</td>
                      </tr>
                      <tr>
                      <td colspan="4" style="font-size:11pt;">
                      <b>NOW THE PURCHASER AGREES AND DECLARES:</b>
                      </td>
                      </tr>
                      <tr>
                      <td><b>1.</b></td>
                      <td colspan="3"><b>Definitions and Interpretation</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">In this Declaration, except where the context otherwise requires, the capitalised words shall have the meanings defined in the Agreement.</td>
                      </tr>
                      
                      <tr>
                      <td><b>2.</b></td>
                      <td colspan="3"><b>Acknowledgement of Unit</b></td>
                      </tr>
                      <tr>
                      <td>2.1.</td>
                      <td colspan="3">The Purchaser has inspected the Unit (or waived its right to inspect the Unit) and hereby unconditionally and irrevocably accepts the possession of the Unit from the Seller in good condition and constructed in accordance with the agreed plans, specifications and free from any and all defects and deficiencies (except as listed in the Annexure attached to this Declaration, if any).</td>
                      </tr>
                      <tr>
                      <td>2.2.</td>
                      <td colspan="3">The Purchaser hereby fully releases and discharges the Seller and its nominees, representatives and subsidiaries (including past, present and future successors, officers, directors, agents and employees), from all claims, damages (including general, special, punitive, liquidated and compensatory damages) and causes of action of every kind, nature and character, known or unknown, fixed or contingent, which the Purchaser may now have or the Purchaser may have ever had, arising from or in any way connected in respect of the Unit.</td>
                      </tr>
                      <tr>
                      <td>2.3.</td>
                      <td colspan="3">The foregoing acceptance, release and discharge is without prejudice to the provisions contained in the Agreement regarding rectification of any defects in the Unit by the Seller following Completion.</td>
                      </tr>
                      <tr>
                      <td>2.4.</td>
                      <td colspan="3">The Purchaser acknowledges and agrees that it is the sole responsibility of the Purchaser to subscribe (register) to and pay all relevant charges in relation to the Utility Providers.</td>
                      </tr>
                      <tr>
                      <td>2.5.</td>
                      <td colspan="3">The Purchaser acknowledges and agrees that all utility provisions within the Unit have been provided and that it is the sole responsibility of the Purchaser that utilities, including air conditioning within the Unit are available to ensure minimal effects of damage due to the prevailing weather conditions in the UAE.  The Purchaser acknowledges and agrees that the lack of utilities within the Unit could result in damage due to heat and resulting condensation and that leaving the Unit not air-conditioned for long periods, especially during summer months, may result in damage to the Unit. The Purchaser hereby fully releases and discharges the Seller and any of its nominees or representatives or subsidiaries from all claims, damages and causes of action arising from this effect.</td>
                      </tr>
                      <tr>
                      <td><b>3.</b></td>
                      <td colspan="3"><b>Purchaser's Covenants and Warranties</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser covenants and warrants to the Seller, the Strata Manager, the Owners and the Relevant Authorities that the Purchaser shall observe, perform and comply with all the terms, conditions and obligations contained in the Governance Documents and the Agreement at all times.
                      </td>
                      </tr>
                      
                      <tr>
                      <td><b>4.</b></td>
                      <td colspan="3"><b>Authority to Register</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser expressly, unequivocally and irrevocably agrees that the Governance Documents may be Registered by the Relevant Authorities against the title to the Unit and the Common Areas as a restriction and/or positive covenant.</td>
                      </tr>
                      
                      <tr>
                      <td><b>5.</b></td>
                      <td colspan="3"><b>Purchaser’s Indemnity</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser indemnifies the Seller against all actions, costs, claims, damages, demands, expenses, liabilities and losses suffered by the Seller in connection with the Purchaser's breach of its obligations under this Declaration, the Agreement and/or the Governance Documents.</td>
                      </tr>
                      
                      <tr>
                      <td><b>6.</b></td>
                      <td colspan="3"><b>Acknowledgement of Understanding</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser agrees that it understands the Purchaser's rights and obligations under this Declaration and the Governance Documents.  </td>
                      </tr>
                      
                      <tr>
                      <td><b>7.</b></td>
                      <td colspan="3"><b>Authority to Execute Documents</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser warrants and represents that:</td>
                      </tr>

                      <tr>
                      <td>7.1.</td>
                      <td colspan="3">in the case of the Purchaser being (or including) an individual, the Purchaser has full authority, power and capacity to execute, deliver and perform this Declaration; and</td>
                      </tr>

                      <tr>
                      <td>7.2.</td>
                      <td colspan="3">in the case of the Purchaser being (or including) an entity other than an individual, the execution, delivery and performance of this Declaration by the Purchaser has been duly authorised in accordance with the relevant corporate or other procedures of the Purchaser, no further action on the part of the Purchaser is necessary to authorise such execution, delivery and performance and the person signing this Declaration on behalf of the Purchaser is fully authorised to enter into this Declaration on behalf of the Purchaser.</td>
                      </tr>
                      
                      <tr>
                      <td><b>8.</b></td>
                      <td colspan="3"><b>Further Assurances</b></td>
                      </tr>

                      <tr>
                      <td></td>
                      <td colspan="3">The Purchaser agrees to immediately sign any documents required by the Relevant Authorities as may be necessary to enable Registration of the Governance Documents.</td>
                      </tr>
                      
                      </table>
                   
                    `;
      }

      // // Last Page
      {
        template += `
                    <p style="font-size:10pt;"><b>Annexure 1 – List of Agreed Defects for Remediation</b></p>
                    <table style="width:90%; font-size:10pt;margin-bottom:20px;">  
                    <tr>
                    <td style="width:30%;border-left:1px solid black;border-top:1px solid black;border-bottom:1px solid black;color:#ffffff; background-color:#086464;"><b>Defect</b></td>
                    <td style="width:30%;border-left:1px solid black;border-top:1px solid black;border-bottom:1px solid black;color:#ffffff; background-color:#086464;"><b>Location</b></td>
                    <td style="width:40%;border:1px solid black;color:#ffffff; background-color:#086464;"><b>Agreed Remediation Action</b></td>
                    </tr>
                    <tr>
                    <td style="height:30px;border-left:1px solid black;border-bottom:1px solid black;"></td>
                    <td style="border-left:1px solid black;border-bottom:1px solid black;"></td>
                    <td style="border-left:1px solid black;border-bottom:1px solid black;border-right:1px solid black;"></td>
                    </tr>
                    <tr>
                    <td style="height:30px;border-left:1px solid black;border-bottom:1px solid black;"></td>
                    <td style="border-left:1px solid black;border-bottom:1px solid black;"></td>
                    <td style="border-left:1px solid black;border-bottom:1px solid black;border-right:1px solid black;"></td>
                    </tr>
                    <tr>
                    <td style="height:30px;border-left:1px solid black;border-bottom:1px solid black;"></td>
                    <td style="border-left:1px solid black;border-bottom:1px solid black;"></td>
                    <td style="border-left:1px solid black;border-bottom:1px solid black;border-right:1px solid black;"></td>
                    </tr>
                    <tr>
                    <td style="height:30px;border-left:1px solid black;border-bottom:1px solid black;"></td>
                    <td style="border-left:1px solid black;border-bottom:1px solid black;"></td>
                    <td style="border-left:1px solid black;border-bottom:1px solid black;border-right:1px solid black;"></td>
                    </tr>
                    <tr>
                    <td style="height:30px;border-left:1px solid black;border-bottom:1px solid black;"></td>
                    <td style="border-left:1px solid black;border-bottom:1px solid black;"></td>
                    <td style="border-left:1px solid black;border-bottom:1px solid black;border-right:1px solid black;"></td>
                    </tr>
                    
                    </table>
                    <p style="font-size:10pt;"><b>IN WITNESS WHEREOF</b>, this Declaration was signed by or on behalf of the Purchaser on the day and year written above.</p>
                  
                  <table width="100%" style="page-break-after: always;">
                    <tr>
                    <td width="45%"></td>
                    <td width="5%"></td>
                    <td width="50%"></td>
                    </tr>
                    <tr>
                    <td colspan="3"><strong>PURCHASER:</strong></td>
                    </tr>
                    <tr>
                    <td><strong>Signed</strong> by the Purchaser in the presence of:</td>
                    <td style="align: center;">)</td>
                    <td>&nbsp;</td>
                    </tr>
                    <tr>
                    <td>&nbsp;</td>
                    <td style="align: center;">)</td>
                    <td>&nbsp;</td>
                    </tr>
                    <tr style="height: 60px;">
                    <td>&nbsp;</td>
                    <td style="align: center;">)</td>
                    <td>________________________________________</td>
                    </tr>
                    </table>

                    `;
      }
        if (amendments && amendments.length > 0) { 
      {template += `
    <table style="width:100%; font-size:10pt; border-collapse:collapse;">
        <tr>
            <td style="padding:5px;">
                <p style="font-size:12pt;"><b>APPENDIX - SPA AMENDMENTS</b></p>
            </td>
            <td></td>
            <td style="padding:5px;">
                <p style="font-size:10pt;">Last Update Date: ${lastUpdatedDate}</p>
            </td>
        </tr>
    </table>
    
     <table style="width:100%; font-size:10pt; margin-bottom:15px; border-collapse:collapse;">
        
        <tr>
            <td style="padding:5px;">
                <br/><p>This Appendix forms an integral part of the Sale and Purchase Agreement (the "Agreement") entered into between:</p>
            </td>
        </tr>
    </table>

    <table style="width:100%; font-size:10pt; margin-bottom:15px; border-collapse:collapse;">
        <tr>
            <td style="width:33%; padding:5px; vertical-align:top;">
                <p><b>PURCHASER:</b>  ${customerList}</p>
            </td>
           
           
        </tr>
        <tr>
         <td style="width:33%; padding:5px; vertical-align:top;">
                <p><b>SELLER:</b> ${subsidiaryData.legalName}</p>
            </td>
        
        </tr>
         <tr>
         <td style="width:33%; padding:5px; vertical-align:top;">
                <p><b>UNIT:</b> ${unitData.name}</p>
            </td>
        
        </tr>
    </table>

      <table style="width:100%; font-size:10pt; margin-bottom:15px; border-collapse:collapse;">
        <tr>
            <td style="padding:5px;">
                <p>The following amendments have been mutually agreed by the parties and shall form part of the Agreement. This Appendix may be updated from time to time by adding further amendments below.</p>
            </td>
        </tr>
    </table>`;


     amendments.forEach((amendment, index) => {
        template += `
        <hr style="width:100%; border: 1px solid #747272ff;" />
        <table style="width:100%; font-size:10pt; margin-bottom:15px; border-collapse:collapse;">
            <tr>
                <td style="padding:5px;">
                    <p><b>Amendment ${index + 1}</b></p>
                </td>
            </tr>
            <tr>
                <td style="padding:5px;">
                    <p>Clause: ${amendment.custrecord_rng_spaa_clause || ''}</p>
                </td>
            </tr>
            <tr>
                <td style="padding:5px; ">
                    <p>Page No.: ${amendment.custrecord_rng_spaa_page_number || ''}</p>
                </td>
            </tr>
            <tr>
                <td style="padding:5px; ">
                    <p>Amendment: ${amendment.custrecord_rng_spaa_amendments || ''}</p>
                </td>
            </tr>
            <tr>
                <td style="padding:5px; text-align:center;">
                <br/>
                    <p><b>Initials – SELLER:</b> __________ <b>PURCHASER:</b> __________</p>
                </td>
            </tr>
        </table>
        `;
    });

template += `
    <table style="width:100%; font-size:10pt; margin-bottom:20px; border-collapse:collapse; ">
        <tr>
            <td style="padding:5px;">
                <p><b>Acknowledgment</b></p>
            </td>
        </tr>
        <tr>
            <td style="padding:5px;">
                <p>By signing below, the parties confirm their agreement to the amendments listed in this Appendix, which shall be read together with and form part of the SPA. All other provisions of the Agreement remain unchanged and in full force and effect.</p>
            </td>
        </tr>
    </table>
    <table style="width:100%; font-size:10pt; border-collapse:collapse;">
          <tr>
            <td style="padding:5px; ">
                <br/>
                <p><b>PURCHASER:</b></p>
                <p>Signed by the Purchaser:</p>
                <br/><br/>
                <p>Signature: _________________________</p>
            </td>
         </tr>
         <tr>
            <td style="padding:5px;">
               <br/>
                <p><b>SELLER:</b></p>
                <p>Signed for and on behalf of the Seller:</p>
                <br/><br/>
                <p>Signature: _________________________</p>
            </td>
        </tr>
    </table>
`;
}
        }


      return template;
    } catch (errGetBody) {
      log.debug("errGetBody", errGetBody);
    }
  };

  // finaly print
  const finalyPrint = (template, context) => {
    try {
      template = template + "</body>";
      template = template + "</pdf>";

      var renderer = render.create();

      renderer.templateContent = template;
      var xml = renderer.renderAsString();

      var pdfFile = render.xmlToPdf({
        xmlString: xml,
      });

      context.response.writeFile({
        file: pdfFile,
        isInline: true,
      });
    } catch (errFinalyPrint) {
      log.debug("errFinalyPrint", errFinalyPrint);
    }
  };

  // // functions
  const getContractData = (myRecId) => {
    try {
      if (myRecId) {
        let search = s
          .create({
            type: "salesorder",
            columns: [
              "entity",
              "subsidiary",
              "custbody_ino_re_um_unitmaster",
              "currency",
              "opportunity",
              "saleseffectivedate",
              "cseg_ino_re_prpty",
              "custbody_ino_re_scnd_customer",
              "custbody_ino_re_third_customer",
              "custbody_ino_re_fourth_customer",
              "custbody_ino_re_fifth_customer"
              // 'total',
            ],
            filters: ["internalid", s.Operator.IS, myRecId],
          })
          .run();

        let searchResult = search.getRange(0, 1);
        if (searchResult != null && searchResult != "") {
          let customer = searchResult[0].getValue("entity");
          let subsidiary = searchResult[0].getValue("subsidiary");
          let unitMaster = searchResult[0].getValue(
            "custbody_ino_re_um_unitmaster"
          );
          let currency = searchResult[0].getText("currency");
          let reservation = searchResult[0].getValue("opportunity");
          let salesEffectiveDate =
            searchResult[0].getValue("saleseffectivedate");
          let property = searchResult[0].getValue("cseg_ino_re_prpty");
          let secondCustomer = searchResult[0].getValue(
            "custbody_ino_re_scnd_customer"
          );
          let thirdCustomer = searchResult[0].getValue(
            "custbody_ino_re_third_customer"
          );
          let fourthCustomer = searchResult[0].getValue(
            "custbody_ino_re_fourth_customer"
          );
          let fifthCustomer = searchResult[0].getValue(
            "custbody_ino_re_fifth_customer"
          );


          // let total = searchResult[0].getText('total');
          return {
            customer: customer,
            subsidiary: subsidiary,
            unitMaster: unitMaster,
            currency: currency,
            reservation: reservation,
            salesEffectiveDate: salesEffectiveDate,
            property: property,
            secondCustomer: secondCustomer,
            thirdCustomer: thirdCustomer,
            fourthCustomer: fourthCustomer,
            fifthCustomer: fifthCustomer

            // 'total':total,
          };
        }
      } else {
        return {
          customer: "",
          subsidiary: "",
          unitMaster: "",
          currency: "",
          reservation: "",
          salesEffectiveDate: "",
          property: "",
          secondCustomer: "",
          thirdCustomer: "",
          fourthCustomer: "",
          fifthCustomer: ""

          // 'total':"",
        };
      }
    } catch (errGetContractData) {
      log.debug("errGetContractData", errGetContractData);
    }
  };
  const getCustomerData = (customerId) => {
    try {
      if (customerId) {
        let search = s
          .create({
            type: "customer",
            columns: [
              "companyname",
              "phone",
              "address",
              "email",
              "isperson",
              "salutation",
              "lastname",
              "middlename",
              "firstname",
              "custentity_ino_re_nationality",
              "custentity_ino_re_passport_id",
              "city",
              "country",
              "custentity_az_rng_company_reg_num",
              "custentity_ino_re_cus_shareholder",
              "custentity_ino_re_cus_authorizedsgnato",
              "custentity_ino_re_cus_title",
              "custentity_az_rng_customer_name"
            ],
            filters: ["internalid", s.Operator.IS, customerId],
          })
          .run();

        let searchResult = search.getRange(0, 1);
        if (searchResult != null && searchResult != "") {
          let companyName = searchResult[0].getValue("companyname");
          let phone = searchResult[0].getValue("phone");
          let address = searchResult[0].getValue("address");
          let email = searchResult[0].getValue("email");
          let isperson = searchResult[0].getValue("isperson");
          let salutation = searchResult[0].getValue("salutation");
          let lastName = searchResult[0].getValue("lastname");
          let midName = searchResult[0].getValue("middlename");
          let firstName = searchResult[0].getValue("firstname");
          let nationlaity = searchResult[0].getText(
            "custentity_ino_re_nationality"
          );
          let fullname = searchResult[0].getValue("custentity_az_rng_customer_name");
          let passportId = searchResult[0].getValue(
            "custentity_ino_re_passport_id"
          );
          let city = searchResult[0].getValue("city");
          let country = searchResult[0].getText("country");
          if (country === 'Palestine, State of') {
            country = 'Palestine';
          }
          let vatregnumber = searchResult[0].getValue(
            "custentity_az_rng_company_reg_num"
          );
          let shareholder = searchResult[0].getValue(
            "custentity_ino_re_cus_shareholder"
          );
          let authorizedSignatory = searchResult[0].getValue(
            "custentity_ino_re_cus_authorizedsgnato"
          );
          let title = searchResult[0].getValue("custentity_ino_re_cus_title");
          companyName = removeandsign(companyName);
          firstName = removeandsign(firstName);
          midName = removeandsign(midName);
          lastName = removeandsign(lastName);
          address = removeandsign(address);
          
          return {
            companyName: companyName,
            phone: phone,
            address: address,
            email: email,
            isperson: isperson,
            salutation: salutation,
            lastName: lastName,
            midName: midName,
            firstName: firstName,
            nationlaity: nationlaity,
            passportId: passportId,
            city: city,
            country: country,
            vatregnumber: vatregnumber,
            shareholder: shareholder,
            authorizedSignatory: authorizedSignatory,
            title: title,
            fullname: fullname
          };
        }
      } else {
        return {
          companyName: "",
          phone: "",
          address: "",
          email: "",
          isperson: "",
          salutation: "",
          lastName: "",
          midName: "",
          firstName: "",
          nationlaity: "",
          passportId: "",
          city: "",
          country: "",
          vatregnumber: "",
          shareholder: "",
          authorizedSignatory: "",
          title: "",
          fullname: ""
        };
      }
    } catch (errGetCustomerData) {
      log.debug("errGetCustomerData", errGetCustomerData);
    }
  };
  const getSubsidiaryData = (subsidary) => {
    try {
      if (subsidary) {
        let subsidiaryRecord = record.load({
          type: "subsidiary",
          id: subsidary,
        });
        // let addresssubrec = subsidiaryRecord.getSubrecord({
        //   fieldId: 'mainaddress'
        // });
        let name = subsidiaryRecord.getValue("name");
        let legalName = subsidiaryRecord.getValue("legalname");
        let BenficiaryName = subsidiaryRecord.getValue("custrecord_az_rng_bene_escrow_acc_name");
        let address = subsidiaryRecord.getValue("mainaddress_text");
        let regNum = subsidiaryRecord.getValue("custrecord_az_rng_rera_reg_no");
        let city = subsidiaryRecord.getValue("state");
        let licenceNumber = subsidiaryRecord.getValue(
          "custrecord_ino_re_sub_licencenumber"
        );
        let poBox = subsidiaryRecord.getValue("custrecord_ino_re_sub_pobox");
        let registerdAddress = subsidiaryRecord.getValue(
          "custrecord_az_rng_registered_address"
        );
        return {
          name: name,
          address: address,
          regNum: regNum,
          city: city,
          licenceNumber: licenceNumber,
          poBox: poBox,
          legalName: legalName,
          BenficiaryName: BenficiaryName,
          registerdAddress: registerdAddress,
        };
      } else {
        return {
          name: "",
          address: "",
          regNum: "",
          city: "",
          licenceNumber: "",
          poBox: "",
          legalName: "",
          BenficiaryName: "",
          registerdAddress: "",
        };
      }
    } catch (errorGetSubsidiaryData) {
      log.debug("errorGetSubsidiaryData", errorGetSubsidiaryData);
    }
  };
  const getUnitData = (unitMaster) => {
    try {
      if (unitMaster) {
        let search = s
          .create({
            type: "customrecord_ino_re_unitmaster",
            columns: [
              "custrecord_ino_re_um_layout",
              "name",
              "custrecord_ino_re_um_unituse",
              "custrecord_ino_re_um_property",
              "custrecord_ino_re_um_building",
              "custrecord_ino_re_um_floor",
              "custrecord_ino_re_um_number",
              "custrecord_ino_re_um_net_area",
              "custrecord_ino_re_um_parking",
              "custrecord_ino_re_um_bedroom",
              "custrecord_ino_re_um_view",
              "custrecord_ino_re_um_terrace_area",
              "custrecord_ino_re_um_reservation_amt",
              "custrecord_ino_re_um_model",
              "custrecord_ino_re_um_gross_area",
              "custrecord_az_rng_town_house",
              "custrecord_ino_re_um_garden_area",
              "custrecord_ino_re_um_amenity"
            ],
            filters: ["internalid", s.Operator.IS, unitMaster],
          })
          .run();

        let searchResult = search.getRange(0, 1);
        if (searchResult != null && searchResult != "") {
          let layoutId = searchResult[0].getValue(
            "custrecord_ino_re_um_layout"
          );
          let layoutUrl = getImageUrl(layoutId);
          let name = searchResult[0].getValue("name");
          let unittype = searchResult[0].getText(
            "custrecord_ino_re_um_unituse"
          );
          let property = searchResult[0].getText(
            "custrecord_ino_re_um_property"
          );
          let building = searchResult[0].getValue(
            "custrecord_ino_re_um_building"
          );
          let floor = searchResult[0].getValue("custrecord_ino_re_um_floor");
          let unitNum = searchResult[0].getValue("custrecord_ino_re_um_number");
          let unitArea = searchResult[0].getValue(
            "custrecord_ino_re_um_net_area"
          );
          let carParkingSpace = searchResult[0].getValue(
            "custrecord_ino_re_um_parking"
          );
          let bedRooms = searchResult[0].getValue(
            "custrecord_ino_re_um_bedroom"
          );
          let unitView = searchResult[0].getValue("custrecord_ino_re_um_view");
          let terraceArea = searchResult[0].getValue(
            "custrecord_ino_re_um_terrace_area"
          );
          let totalArea = searchResult[0].getValue(
            "custrecord_ino_re_um_gross_area"
          );
          let unitPrice = searchResult[0].getValue(
            "custrecord_ino_re_um_reservation_amt"
          );
          let unitModel = searchResult[0].getText("custrecord_ino_re_um_model");
          let townHouse = searchResult[0].getValue("custrecord_az_rng_town_house");
          let gardenArea = searchResult[0].getValue("custrecord_ino_re_um_garden_area");
          let amenity = searchResult[0].getValue("custrecord_ino_re_um_amenity");
          unitPrice = numberWithCommas(unitPrice);
          carParkingSpace = numberWithCommas(carParkingSpace);
          unitArea = numberWithCommas(unitArea);
          bedRooms = numberWithCommas(bedRooms);
          terraceArea = numberWithCommas(terraceArea);
          totalArea = numberWithCommas(totalArea);
          gardenArea = numberWithCommas(gardenArea);
          log.debug("totalArea", totalArea);

          return {
            name: name,
            unittype: unittype,
            property: property,
            building: building,
            floor: floor,
            unitNum: unitNum,
            unitArea: unitArea,
            carParkingSpace: carParkingSpace,
            bedRooms: bedRooms,
            unitView: unitView,
            terraceArea: terraceArea,
            layoutUrl: layoutUrl,
            layoutId: layoutId,
            unitPrice: unitPrice,
            unitModel: unitModel,
            totalArea: totalArea,
            townHouse: townHouse,
            gardenArea: gardenArea,
            amenity: amenity,
          };
        }
      } else {
        return {
          name: "",
          unittype: "",
          property: "",
          building: "",
          floor: "",
          unitNum: "",
          unitArea: "",
          carParkingSpace: "",
          bedRooms: "",
          unitView: "",
          terraceArea: "",
          layoutUrl: "",
          layoutId: "",
          unitPrice: "",
          unitModel: "",
          totalArea: "",
          townHouse: "",
          gardenArea: "",
          amenity: "",
        };
      }
    } catch (errorgetUnitData) {
      log.debug("errorgetUnitData", errorgetUnitData);
    }
  };
  const getPaymentPlanData = (contractID, oldDatesPrint) => {
    try {
      let res = [];
      if (contractID) {
        let columns = [
          "internalid",
          "name",
          "custrecord_ino_re_pp_percent",
          "custrecord_ino_re_pp_amount",
          "custrecord_ino_re_pp_installment_milesto",
          "custrecord_ino_re_pp_date",
          "isinactive",
          "custrecord_ino_re_pp_type",
        ];

        if (oldDatesPrint) {
          columns.push("custrecord_az_rng_pp_old_date");
        }
        let search = s
          .create({
            type: "customrecord_ino_re_paymentplan",
            columns: columns,
            filters: ["custrecord_ino_re_pp_trx", s.Operator.IS, contractID],
          })
          .run();
        let searchResult = search.getRange(0, 1000);
        if (searchResult != null && searchResult != "") {
          for (i = 0; i < searchResult.length; i++) {
            let id = searchResult[i].getValue("internalid");
            let insname = searchResult[i].getValue("name");
            let date = searchResult[i].getValue("custrecord_ino_re_pp_date");
            let percent = searchResult[i].getValue(
              "custrecord_ino_re_pp_percent"
            );
            let amt = searchResult[i].getValue("custrecord_ino_re_pp_amount");
            amt = numberWithCommas(amt);
            let milestone = searchResult[i].getValue(
              "custrecord_ino_re_pp_installment_milesto"
            );
            milestone = removeandsign(milestone);
            let isInActive = searchResult[i].getValue("isinactive");
            let type = searchResult[i].getValue("custrecord_ino_re_pp_type");
            let oldDate = null;
            if (oldDatesPrint) {
              oldDate = searchResult[i].getValue(
                "custrecord_az_rng_pp_old_date"
              );
            }

            let resultObj = {
              id: id,
              insname: insname,
              date: date,
              percent: percent,
              amt: amt,
              milestone: milestone,
              isInActive: isInActive,
              type: type,
            };
            if (oldDatesPrint) {
              resultObj["oldDate"] = oldDate;
            }

            res.push(resultObj);
          }
          res.sort(function (a, b) {
            return new Date(a.date) - new Date(b.date);
          });
        }
        return {
          res: res,
        };
      } else {
        res.push({
          id: "",
          insname: "",
          date: "",
          percent: "",
          amt: "",
          milestone: "",
          isInActive: "",
          type: "",
        });
        return {
          res: "",
        };
      }
    } catch (errorgetPaymentPlanData) {
      log.debug({
        title: "errorgetPaymentPlanData",
        details: errorgetPaymentPlanData,
      });
    }
  };

  const getPropertyData = (property) => {
    try {
      if (property) {
        let search = s
          .create({
            type: "customrecord_cseg_ino_re_prpty",
            columns: [
              "name",
              "custrecord_ino_re_prop_bank_name",
              "custrecord_ino_re_prop_branch",
              "custrecord_ino_re_prop_escrowaccount",
              "custrecord_ino_re_prop_acc_number",
              "custrecord_ino_re_prop_swift_code",
              "custrecord_ino_re_prop_iban_no",
              "custrecord_ino_re_prop_plot_no",
              "custrecord_ino_re_prop_mastercommunity",
              "custrecord_az_rng_endingquarter",
              "custrecord_az_rng_startingquarter",
              "custrecord_ino_re_prop_plot_no",
              "custrecord_ino_re_prop_total_unit_number",
            ],
            filters: ["internalid", s.Operator.IS, property],
          })
          .run();

        let searchResult = search.getRange(0, 1);
        if (searchResult != null && searchResult != "") {
          let name = searchResult[0].getValue("name");
          let bankName = searchResult[0].getValue(
            "custrecord_ino_re_prop_bank_name"
          );
          bankName = bankName.split("-")[0];
          let branch = searchResult[0].getValue(
            "custrecord_ino_re_prop_branch"
          );
          let accountName = searchResult[0].getText(
            "custrecord_ino_re_prop_escrowaccount"
          );
          let accountNum = searchResult[0].getValue(
            "custrecord_ino_re_prop_acc_number"
          );
          let swiftCode = searchResult[0].getValue(
            "custrecord_ino_re_prop_swift_code"
          );
          let ibanNo = searchResult[0].getValue(
            "custrecord_ino_re_prop_iban_no"
          );
          let plotNo = searchResult[0].getValue(
            "custrecord_ino_re_prop_plot_no"
          );
          let masterCom = searchResult[0].getValue(
            "custrecord_ino_re_prop_mastercommunity"
          );
          let completionDate = searchResult[0].getValue(
            "custrecord_az_rng_endingquarter"
          );
          let commencementDate = searchResult[0].getValue(
            "custrecord_az_rng_startingquarter"
          );
          let unitNo = searchResult[0].getValue(
            "custrecord_ino_re_prop_total_unit_number"
          );
          return {
            name: name,
            bankName: bankName,
            branch: branch,
            accountName: accountName,
            accountNum: accountNum,
            swiftCode: swiftCode,
            ibanNo: ibanNo,
            plotNo: plotNo,
            masterCom: masterCom,
            completionDate: completionDate,
            commencementDate: commencementDate,
            unitNo: unitNo,
          };
        }
      } else {
        return {
          name: "",
          bankName: "",
          branch: "",
          accountName: "",
          accountNum: "",
          swiftCode: "",
          ibanNo: "",
          plotNo: "",
          masterCom: "",
          completionDate: "",
          commencementDate: "",
          unitNo: "",
        };
      }
    } catch (errorGetPropertyData) {
      log.debug("errorGetPropertyData", errorGetPropertyData);
    }
  };
  // Replace & with &amp;
  function removeandsign(word) {
    word = word.replace("&", "&amp;");
    return word;
  }
  const getImageUrl = (imageID) => {
    try {
      if (imageID) {
        let imageFile = file.load({
          id: imageID,
        });
        imageUrl = imageFile.url.replace(/&/g, "&amp;");
        return {
          imageUrl: "https://9294876.app.netsuite.com/" + imageUrl,
        };
      } else {
        return {
          imageUrl: "",
        };
      }
    } catch (errorgetImage) {
      log.debug({
        title: "errorgetImage",
        details: errorgetImage,
      });
    }
  };

  const numberWithCommas = (x) => {
    if (x != null && x != "") {
      if (x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  };


  const getSubsidiaryLogo = (subsidiaryId) => {
    try {
      if (subsidiaryId) {
        let logoUrl = "";

        let subsidiaryRec = record.load({
          type: "subsidiary",
          id: subsidiaryId,
        });

        let logoId = subsidiaryRec.getValue("logo");
        let subsidiaryName = subsidiaryRec.getValue("name");

        if (logoId) {
          let logoFile = file.load({
            id: logoId,
          });

          logoUrl = logoFile.url.replace(/&/g, "&amp;");
        }

        return {
          logoUrl: "https://9294876-sb1.app.netsuite.com/" + logoUrl,
          subsidiaryName: subsidiaryName,
        };
      } else {
        return {
          logoUrl: "",
          subsidiaryName: "",
        };
      }
    } catch (errGetSubsidiaryData) {
      log.debug("errGetSubsidiaryData", errGetSubsidiaryData);
    }
  };

  const getAdmendmentData = (myRecId) => {
    try {

      const queryStr = ` SELECT
          custrecord_rng_spaa_date,
          custrecord_rng_spaa_clause,
          custrecord_rng_spaa_page_number,
          custrecord_rng_spaa_amendments
        FROM
          customrecord_rng_spa_amendments
        WHERE
          custrecord_rng_spaa_spa = ? `;

      const resultSet = query.runSuiteQL({ query: queryStr, params: [myRecId] });
      const result = resultSet.asMappedResults();
      let lastUpdatedDate = "null";

      if (result.length > 0) {
        const datesArr = result.map(r => r.custrecord_rng_spaa_date);
        lastUpdatedDate = datesArr.sort().pop();
      }
       return {
        amendments: result || [],             
        lastUpdatedDate: lastUpdatedDate 
      };

    } catch (errorgetAdmendmentData) {

      log.debug("errorgetAdmendmentData", errorgetAdmendmentData);
      
    }
  }

  return {
    onRequest: onRequest
  };
});
