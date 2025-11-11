/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define([
  "N/search",
  "N/render",
  "N/record",
], function (search, render, record) {
  const onRequest = (context) => {
    try {
      if (context.request.method == "GET") {
        try {
          const myRecId = context.request.parameters.myRecId;

          if (myRecId) {
            let template = getHeader();

            let bodyFields = getBodyFields(myRecId);
            let customerData = getCustomerData(bodyFields.customer);
            let secondCustomerData = getCustomerData(
              bodyFields.secCustomer
            );
            let thirdCustomerData = getCustomerData(bodyFields.thirdCustomer);
            let fourthCustomerData = getCustomerData(bodyFields.fourthCustomer);
            let fifthCustomerData = getCustomerData(bodyFields.fifthCustomer);


            template = getBody(template, bodyFields,customerData,secondCustomerData,thirdCustomerData,fourthCustomerData,fifthCustomerData);

            finalyPrint(template, context);
          }
        } catch (errGet) {
          log.debug("errGet", errGet);
        }
      }
    } catch (errOnRequest) {
      log.debug("errOnRequest", errOnRequest);
    }
  };

  // get template
  const getHeader = () => {
    try {
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

      template += "</macro>";

      template += '<macro id="nlfooter">';

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
      template += `
                   
                    body {
                              position: relative;
                          }
                         
                    table {
                          margin-top: 10px;
                          }
                    `;
      template += "</style>";
      template += "</head>";
      template +=
        "<body header='nlheader' header-height='0.5in' footer='nlfooter' footer-height='0.5in' padding='0.7in 1.3in 0.7in 1.3in' size='Letter'>";
      return template;
    } catch (errGetHeader) {
      log.debug("errGetHeader", errGetHeader);
    }
  };

  // get body
  const getBody = (template, bodyFields,customerData,secondCustomerData,thirdCustomerData,fourthCustomerData,fifthCustomerData) => {
    try {
      const customers = [customerData?.custname,secondCustomerData?.custname,thirdCustomerData?.custname,fourthCustomerData?.custname,fifthCustomerData?.custname];
      const customerList = customers.filter(c => c).join(", ");

      // // WaterMark
      {

      }
      // // date
      {

      }

      // // Title 
      {
        template += `<p style=" align: center; font-size: 14px; padding-bottom:0.5in;">TERMINATION AGREEMENT</p>`;

      }
      // // THIS AGREEMENT
      {
        template += `<p style=" align: left; font-size: 14px;"><strong>THIS AGREEMENT</strong> is made on ${escapeXml(bodyFields.terDate)} between:</p>
                      <ol type="1" style=" align: left; font-size: 14px; padding-left: 15px;">`;
        if (customerData != null && customerData != '') {
          template += `<li style="padding-bottom: 5px;">${escapeXml(customerData.custname)}, ${vowelWord(customerData.nationality)} national, with passport number ${escapeXml(customerData.passportno)} whose address is at ${escapeXml(customerData.custaddress)} <strong>(“the Purchasers”)</strong> AND</li>`;
        }
        if (secondCustomerData != null && customerData != '') {
          template += `<li style="padding-bottom: 5px;">${escapeXml(secondCustomerData?.custname)}, ${vowelWord(secondCustomerData?.nationality)} national, with passport number ${escapeXml(secondCustomerData?.passportno)} whose address is at ${escapeXml(secondCustomerData?.custaddress)} <strong>(“the Purchasers”)</strong> AND</li>`;
        } if (thirdCustomerData != null && customerData != '') {
          template += `<li style="padding-bottom: 5px;">${escapeXml(thirdCustomerData?.custname)}, ${vowelWord(thirdCustomerData?.nationality)} national, with passport number ${escapeXml(thirdCustomerData?.passportno)} whose address is at ${escapeXml(thirdCustomerData?.custaddress)} <strong>(“the Purchasers”)</strong> AND</li>`;
        } if (fourthCustomerData != null && customerData != '') {
          template += `<li style="padding-bottom: 5px;">${escapeXml(fourthCustomerData?.custname)}, ${vowelWord(fourthCustomerData?.nationality)} national, with passport number ${escapeXml(fourthCustomerData?.passportno)} whose address is at ${escapeXml(fourthCustomerData?.custaddress)} <strong>(“the Purchasers”)</strong> AND</li>`;
        } if (fifthCustomerData != null && customerData != '') {
          template += `<li style="padding-bottom: 5px;">${escapeXml(fifthCustomerData?.custname)}, ${vowelWord(fifthCustomerData?.nationality)} national, with passport number ${escapeXml(fifthCustomerData?.passportno)} whose address is at ${escapeXml(fifthCustomerData?.custaddress)} <strong>(“the Purchasers”)</strong> AND</li>`;
        }
        
        template += `<li>${escapeXml(bodyFields.subLegalName)} , a company incorporated in UAE, having correspondence address Tower 2, Boulevard Plaza, Office No 1104, 11th Floor, Burj Khalifa, Community, Downtown of PO Box 50390, Dubai, United Arab Emirates <strong>(“the Developer”)</strong></li>`;
        template += `</ol>
                     <p style=" align: left; font-size: 14px; padding-left: 50px;">Each a "Party" and together the <strong>"Parties".</strong></p>`;

      }
      // // RECITALS 
      {
        template += `<p style=" align: left; font-size: 14px;"><strong>RECITALS:</strong></p>
                        <table style = "padding-left:18px;">
                          <tr>
                            <td style="vertical-align: top; font-size: 14px;">A.</td>
                            <td style="padding-bottom: 5px; font-size: 14px; padding-left: 10px; text-align: left;">
                              The Purchasers and the Developer entered into a sale and purchase agreement dated ${escapeXml(bodyFields.spaDate)} (the "SPA") pursuant to which the Developer agreed to sell and the Purchasers agreed to buy the property known as: ${(bodyFields.uniteFloor).split(".")[1]}, Unit ${escapeXml(bodyFields.unitMaster)}, ${escapeXml(bodyFields.propertyName)}. The agreed purchase price for Unit ${escapeXml(bodyFields.unitMaster)}, ${escapeXml(bodyFields.propertyName)} was ${numberWithCommas(bodyFields.resUnitPrice)} United Arab Emirates Dirhams ("AED").
                            </td>
                          </tr>
                          <tr>
                            <td style="vertical-align: top; font-size: 14px;">B.</td>
                            <td style="padding-bottom: 5px; font-size: 14px; padding-left: 10px; text-align: left;">
                              The Purchaser paid instalment payments for the total amount of AED ${numberWithCommas(bodyFields.paidAmount)} ("the Payment") for Unit ${escapeXml(bodyFields.unitMaster)}, ${bodyFields.propertyName}.
                            </td>
                          </tr>
                          <tr>
                            <td style="vertical-align: top; font-size: 14px;">C.</td>
                            <td style="font-size: 14px; padding-left: 10px; text-align: left;">
                              The Purchaser no longer wishes to purchase Unit ${escapeXml(bodyFields.unitMaster)}, ${bodyFields.propertyName} and the Developer has agreed to terminate the SPA entered into with the Purchasers for the purchase of Unit ${escapeXml(bodyFields.unitMaster)}, ${bodyFields.propertyName}, subject to the terms of this Agreement.
                            </td>
                          </tr>
                        </table>
                      `;
      }
      // // AGREED TERMS: 
      {
        template += `<p style=" align: left; font-size: 14px;"><strong>AGREED TERMS:</strong></p>
                     <p style=" align: left; font-size: 14px;">The above recitals will form an integral part of this Agreement.</p>
                      <ol type="1" style=" align: left; font-size: 14px; padding-left: 15px;">
                        <li >DEFINITIONS In this Agreement, expressions defined in the SPA and used in this Agreement shall have the meaning set out in the SPA, unless otherwise defined.</li>
                        <li>TERMINATION In consideration of the mutual covenants contained in this Agreement, each Party hereby irrevocably and unconditionally agrees that:</li>
                      </ol>
                      <p style=" align: left; font-size: 14px;">2.1 The SPA will terminate immediately upon the date on which the Parties execute this Agreement ${bodyFields.terDate} .</p>
                      <p style=" align: left; font-size: 14px;">2.2 It is agreed that the amount of AED ${numberWithCommas(bodyFields.paidAmount-bodyFields.terminationFees)} shall be refunded to the Purchasers within 60 days of confirmation by RAK Municipality of the cancellation and/or disposal of the unit, subject to deductions for administrative fees, marketing expenses, or any other charges incurred by the Developer as compensation in connection with the SPA. In the event the cancellation is delayed or rejected, the Developer shall not be liable for such delay.</p>
                      <p style=" align: left; font-size: 14px;">2.3 The Purchaser acknowledges and agrees that any amount withheld from the refund is forfeited and not subject to dispute.</p>
                        <p style=" align: left; font-size: 14px; padding-left: 15px;">3.  RELEASE, INDEMNITY AND NON-DISPARAGEMENT</p>
                      <p style=" align: left; font-size: 14px;">3.1 Subject to clause 2.2, each of the Parties' obligations and liabilities under the SPA, save for any obligations concerning confidentiality, will cease with effect from the Termination Date.</p>
                      <p style=" align: left; font-size: 14px;">3.2 Upon termination of the SPA, the Purchasers will have no further rights of any nature whatsoever under the SPA, including without limitation, any entitlements to any payment or compensation from the Developer, or any of its affiliates, shareholders, employees, agents or representatives.</p>
                      <p style=" align: left; font-size: 14px;">3.3 The Purchasers hereby irrevocably and unconditionally release and forever discharge the Developer, its affiliates, shareholders, employees, agents and representatives from all or any actions, costs, claims, losses, liabilities, entitlements, rights and demands, whether in the United Arab Emirates or any other jurisdiction and whether or not presently known, that the Purchasers or their assignees or transferees, ever had, may have or hereafter can or may have against the Developer, its affiliates, shareholders, employees, agents and representatives in relation to or arising from the performance or termination of the SPA</p>
                      <p style=" align: left; font-size: 14px;">3.4 The Purchasers will indemnify and promptly reimburse the Developer, its affiliates, shareholders, employees, agents and representatives against all claims, damages, losses, liabilities, compensation, expenditures, costs, government and other fees and charges suffered or incurred as a result of the termination of the SPA or any breach of this Agreement.</p>
                      <p style=" align: left; font-size: 14px;">3.5 The Purchasers agree not to make any public or private disparaging statements regarding the Developer or its affiliates, employees, or representatives, whether online or otherwise.</p>
                        <p style=" align: left; font-size: 14px; padding-left: 15px;">4.	GOVERNING LAW AND JURISDICTION</p>
                        <p style=" align: left; font-size: 14px; padding-left: 15px;">This Agreement shall be governed and construed in accordance with the laws of Ras Al Khaimah and the Federal Laws of the UAE, applicable there to. The Parties agree that any legal action or proceeding with respect to this Agreement shall be subject to the exclusive jurisdiction of the Courts of Ras Al Khaimah.</p>
                        <p style=" align: left; font-size: 14px; padding-left: 15px;">5.	CONFIDENTIALITY</p>
                            <p style=" align: left; font-size: 14px; padding-left: 30px;">This Agreement and all information exchanged in the course of performing this Agreement (which is not already in the public domain other than as a result of an unauthorized disclosure by any party) shall be confidential and no party shall disclose such information to any third party without the prior written consent of the other.</p>
                        <p style=" align: left; font-size: 14px; padding-left: 15px;">6.	ENTIRE AGREEMENT</p>
                            <p style=" align: left; font-size: 14px; padding-left: 30px;padding-bottom: 0.5in;">This Agreement sets out the entire agreement between the Parties and supersedes any previous agreement between them in relation to the subject matter of this Agreement.</p>
                      `;


      }
      // // Signed by: 
      {
        template += `<p style=" align: left; font-size: 14px;">Signed by:</p>
                    <p style=" align: left; font-size: 14px;">Name of the Purchasers: ${customerList}</p>
                    <p style=" align: left; font-size: 14px;padding-top:30px;">Signed by:`
        template += escapeXml(" (Acting for & on behalf of the Developer)")
        template += `</p>
                    <p style=" align: left; font-size: 14px;">Name of the Developer : ${bodyFields.subLegalName}</p>
                    
                      `;


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

      const renderer = render.create();

      renderer.templateContent = template;
      const xml = renderer.renderAsString();

      const pdfFile = render.xmlToPdf({
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

  const getBodyFields = (myRecId) => {
    try {
      let bodyFields = {
        subsidiaryName: "",
        terDate: "",
        spaId: "",
        spaRes: "",
        paidAmount: "",
        propertyName: "",
        unitMaster: "",
        customer: "",
        subLegalName: "",
        custName: "",
        secCustomer:"",
        thirdCustomer:"",
        fourthCustomer:"",
        fifthCustomer:"",
        custPassport: "",
        custAddr: "",
        custNat: "",
        spaDate: "",
        uniteFloor: "",
        resUnitPrice: "",
        todayDate: "",
        spaName: "",
        terminationFees: 0
      };

      if (myRecId) {

        const fieldsSearch = search.create({
          type: 'customrecord_ino_re_spa_termination',
          columns: [
            'custrecord_ino_re_st_subsidiary',
            'custrecord_ino_re_st_date',
            'custrecord_ino_re_st_spa_number',
            'custrecord_ino_re_st_reservation',
            'custrecord_ino_re_st_paid_amount',
            'custrecord_ino_re_st_property',
            'custrecord_ino_re_st_unit_master',
            'custrecord_ino_re_st_customer',
            'custrecord_ino_re_st_secondery_customer',
            'custrecord_ino_re_st_third_customer',
            'custrecord_ino_re_st_fourth_customer',
            'custrecord_ino_re_st_fifth_customer',
            'name'
          ],
          filters: [
            [['internalid', 'is', myRecId]]
          ]
        }).run().getRange(0, 1);

        const searchResult = fieldsSearch[0];

        if (searchResult != null && searchResult != '') {
          bodyFields.subsidiaryName = searchResult.getValue('custrecord_ino_re_st_subsidiary');
          bodyFields.terDate = searchResult.getValue('custrecord_ino_re_st_date');
          bodyFields.spaId = searchResult.getValue('custrecord_ino_re_st_spa_number');
          bodyFields.spaRes = searchResult.getValue('custrecord_ino_re_st_reservation');
          bodyFields.paidAmount = searchResult.getValue('custrecord_ino_re_st_paid_amount');
          bodyFields.propertyName = searchResult.getText('custrecord_ino_re_st_property');
          bodyFields.unitMaster = searchResult.getText('custrecord_ino_re_st_unit_master');
          bodyFields.customer = searchResult.getValue('custrecord_ino_re_st_customer');
          bodyFields.secCustomer = searchResult.getValue('custrecord_ino_re_st_secondery_customer');
          bodyFields.thirdCustomer = searchResult.getValue('custrecord_ino_re_st_third_customer');
          bodyFields.fourthCustomer = searchResult.getValue('custrecord_ino_re_st_fourth_customer');
          bodyFields.fifthCustomer = searchResult.getValue('custrecord_ino_re_st_fifth_customer');

          bodyFields.spaName = searchResult.getValue('name');

        }
      }
      if (bodyFields.subsidiaryName) {

        const fieldsSearch = search.create({
          type: 'subsidiary',
          columns: [
            'legalname'
          ],
          filters: [
            [['internalid', 'is', bodyFields.subsidiaryName]]
          ]
        }).run().getRange(0, 1);

        const searchResult = fieldsSearch[0];

        if (searchResult != null && searchResult != '') {
          bodyFields.subLegalName = searchResult.getValue('legalname');
        }
      }
     

        if (bodyFields.spaId) {

          const fieldsSearch = search.create({
            type: 'salesorder',
            columns: [
              'trandate'
            ],
            filters: [
              [['internalid', 'is', bodyFields.spaId]]
            ]
          }).run().getRange(0, 1);

          const searchResult = fieldsSearch[0];

          if (searchResult != null && searchResult != '') {
            bodyFields.spaDate = searchResult.getValue('trandate');
          }
        }

        if (bodyFields.unitMaster) {

          const fieldsSearch = search.create({
            type: 'customrecord_ino_re_unitmaster',
            columns: [
              'custrecord_ino_re_um_floor'
            ],
            filters: [
              [['name', 'is', bodyFields.unitMaster]]
            ]
          }).run().getRange(0, 1);

          const searchResult = fieldsSearch[0];

          if (searchResult != null && searchResult != '') {
            bodyFields.uniteFloor = searchResult.getText('custrecord_ino_re_um_floor');
          }
        }

        if (bodyFields.spaRes) {

          const fieldsSearch = search.create({
            type: 'opportunity',
            columns: [
              'projectedtotal'
            ],
            filters: [
              [['internalid', 'is', bodyFields.spaRes]]
            ]
          }).run().getRange(0, 1);

          const searchResult = fieldsSearch[0];

          if (searchResult != null && searchResult != '') {
            bodyFields.resUnitPrice = searchResult.getValue('projectedtotal');
          }
        }
      
      if (myRecId) {

        const fieldsSearch = search.create({
          type: 'customrecord_ino_re_termination_fees',
          columns: [
            'custrecord_ino_re_tf_amount'
          ],
          filters: [
            [['custrecord_ino_re_tf_unit_terminated', 'is', myRecId]]
          ]
        }).run().getRange(0, 1000);

        if (fieldsSearch != null && fieldsSearch != '') {
          const feesSum =[];

          for (let i = 0; i < fieldsSearch.length; i++) {

            feesSum.push( fieldsSearch[i].getValue('custrecord_ino_re_tf_amount'));

          }
          const totalFees = feesSum.map(Number);
          bodyFields.terminationFees = totalFees.reduce((acc, val) => acc + val, 0);
        }
      }

      let today = new Date();
      let yyyy = today.getFullYear();
      let mm = String(today.getMonth() + 1).padStart(2, '0');
      let dd = String(today.getDate()).padStart(2, '0');
      bodyFields.todayDate = `${yyyy}/${mm}/${dd}`;


      return bodyFields;

    } catch (getBodyFields) {
      log.debug("getBodyFields", getBodyFields);
    }
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

  function escapeXml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/[\x00-\x1F]/g, '');
  }
  function vowelWord(word) {
    if (!word || typeof word !== 'string') return word;

    const firstLetter = word.trim().charAt(0).toLowerCase();
    const vowels = ['a', 'e', 'i', 'o', 'u'];

    return vowels.includes(firstLetter) ? (`an ${word}`) : (`a ${word}`);
  }
 const getCustomerData = (custID)=>{
    try {
      if(!custID){ return;}

       const columns = [
        "custentity_az_rng_customer_name",
        "custentity_ino_re_passport_id",
        "address",
        "custentity_ino_re_nationality"
      
      ];


      const custSearch = search.create({
          type: "customer",
          filters: [
            ["isinactive", search.Operator.IS, false],
            "and",
            ["internalid", search.Operator.IS, custID],
          ],
          columns: columns,
        }).run().getRange(0, 1);

      if (custSearch != null && custSearch != "") {
        const custname = custSearch[0].getValue(
          "custentity_az_rng_customer_name"
        );
        const nationality = custSearch[0].getText(
          "custentity_ino_re_nationality"
        );
        const passportno = custSearch[0].getValue(
          "custentity_ino_re_passport_id"
        );
        const custaddress = custSearch[0].getValue("address");
       


        var recData = {
          nationality: nationality || " ",
          passportno: passportno || " ",
          custaddress: custaddress || " ",
          custname: custname || " ",

        };
      }
      return recData;
      
    } catch (errorgetCustomerData) {
      log.debug("errorgetCustomerData", errorgetCustomerData);
      
    }

  }

  
  return {
    onRequest: onRequest,
  };
});
