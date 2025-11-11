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
            let unitMaster = getUnitMasterData(bodyFields.unitMaster);

            log.debug("unit Master body Field", JSON.stringify(unitMaster));

            let customerData = getCustomerData(bodyFields.customer);
            let secondCustomerData = getCustomerData(
              bodyFields.secCustomer
            );
            let thirdCustomerData = getCustomerData(bodyFields.thirdCustomer);
            let fourthCustomerData = getCustomerData(bodyFields.fourthCustomer);
            let fifthCustomerData = getCustomerData(bodyFields.fifthCustomer);
            log.debug('Customers Data', [customerData, secondCustomerData, thirdCustomerData, fourthCustomerData, fifthCustomerData]);

            template = getBody(template, bodyFields,unitMaster, customerData, secondCustomerData, thirdCustomerData, fourthCustomerData, fifthCustomerData);

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
        '<link name="thai-font" type="font" subtype="opentype" src="https://9294876.app.netsuite.com/core/media/media.nl?id=52445&amp;c=9294876&amp;h=2x1ruaIRLXqysh7xNeytZNgJ10ToOg7y2jN1cuKSCQltThO6&amp;_xt=.ttf" src-bold="https://9294876.app.netsuite.com/core/media/media.nl?id=52448&amp;c=9294876&amp;h=tHLVk85wc6sEfelaVozIG3etR2A26-M9Y8Mf8Mbt6Hfza4Q_&amp;_xt=.ttf" bytes="2"  />';

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
      template += `<table class="header-table">
                        <tr>
                          <td style="text-align: left;">
                            <img src="https://9294876.app.netsuite.com/core/media/media.nl?id=42090&amp;c=9294876&amp;h=Y8izu6oiJ7ukXOA6HUHhSXyLEOZb-qUt0BCG8823YbAXpFRw" />
                          </td>
                        </tr>
                      </table>`;

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
      template += "font-family: thai-font, sans-serif;";
      template += "</#if>";
      template += "}";
      template += `
                   .header-table {
                            width: 100%;
                            border: none;
                          }
                          .header-logo {
                            width: 100px;
                          }
                    body {
                              position: relative;
                          }
                          
                    table {
                          margin-top: 10px;
                          }
                    .table0_td{
                          align: center;
                          font-size: 17px;
                          height:30px;
                          }
                    .table_td_en{
                            font-size: 10px;
                            align: left;
                            font-weight: bold;
                            padding-left: 10px;
                              border-bottom: 0.2pt dotted #d6d4d4ff;
      border-right: 0.1pt dashed black;
                                }
                    .table_td_ar{
                            font-size: 10px;
                            align: right;
                            font-weight: bold;
                            padding-right: 10px;
                            border-bottom: 0.1pt dotted #d6d4d4ff;
                                }
                    .table_td_cn{
                            font-size: 10px;
                            align: center;
                            border-bottom: 0.1pt dashed black ;
                            border-right: 0.1pt dashed black;
                            
                            

                                }
                    .table2_td_en{
                            font-size: 12px;
                            align: left;
                            font-weight: bold;
                            padding-left: 10px;
                                }
                    .table2_td_ar{
                            font-size: 12px;
                            align: right;
                            font-weight: bold;
                            padding-right: 10px;
                                }
                    .table3_td_en{
                            font-size: 13px;
                            align: left;
                            font-weight: bold;
                            padding-left: 10px;
                            padding-bottom: 3px;
                                }
                    .table3_td_ar{
                            font-size: 13px;
                            align: right;
                            font-weight: bold;
                            padding-bottom: 5px;
                              padding-right: 10px;
                                }
                    .table3 {
                              width: 100%;
                              font-size: 9pt;
                              border-collapse: collapse;
                              border: 1px solid black;
                              margin-top: 80px;
                          }
                    .table3_td{
                              border: 0.5px solid black;
                              height: 50px;
                              direction: rtl;
                              unicode-bidi: embed;
                              font-family: 'NotoSansArabic';
                              align:center;
                              padding: 10px;
                                }
                    .table4_td_en{
                            font-size: 12px;
                            align: left;
                            font-weight: bold;
                            padding-left: 10px;
                                }
                    .table4_td_ar{
                            font-size: 12px;
                            align: right;
                            padding-rigt: 15px;
                    }`;
      template += "</style>";
      template += "</head>";
      template +=
        "<body header='nlheader' header-height='1.1in' footer='nlfooter' footer-height='0.1in' padding='0.2in 0.4in 0.3in 0.4in' size='Letter'>";
      return template;
    } catch (errGetHeader) {
      log.debug("errGetHeader", errGetHeader);
    }
  };

  // get body
  const getBody = (template, bodyFields, unitMasterData ,customerData, secondCustomerData, thirdCustomerData, fourthCustomerData, fifthCustomerData) => {
    try {

      const customers = [customerData?.custname, secondCustomerData?.custname, thirdCustomerData?.custname, fourthCustomerData?.custname, fifthCustomerData?.custname];
      const customerList = customers.filter(c => c).join(", ");

      const passports = [customerData?.passportno, secondCustomerData?.passportno, thirdCustomerData?.passportno, fourthCustomerData?.passportno, fifthCustomerData?.passportno];
      const passportList = passports.filter(c => c).join(", ");


      // // date
      {
        let today = new Date();
        let yyyy = today.getFullYear();
        let mm = String(today.getMonth() + 1).padStart(2, '0');
        let dd = String(today.getDate()).padStart(2, '0');
        let todayDate = `${yyyy}/${mm}/${dd}`;

        template += `<p style="align: right; font-size: 10.5px;padding-right:22px;"><span>م</span> ${todayDate} </p>`;
      }

      // // table 0 
      {
        template += `<table style="width: 100%; border: 0.5pt solid ; border-bottom: 0pt;">
                        <tr>
                          <td class="table0_td" style="padding-top: 10px; ">طﻠﺐ إﻟﻐﺎء ﻋﻘﺪ ﺑﺎﻟﺘﺮاﺿﻲ </td>
                        </tr>
                         <tr >
                          <td class="table0_td" style="padding-bottom: 10px; ">Mutual Cancellation Request</td>
                         </tr>
                            </table>`;

      }
      // // table 1
      {
        template += `<table style="width: 100%; border: 0.5pt solid ;margin-top:0 pt; border-bottom: 0pt;">
                                  <!-- Row 1 -->
                                  <tr>
                                      <td class="table_td_en" style="width:30.1%;">The Name:-</td>
                                      <td class="table_td_cn" style="width:39.8%; "><p style="text-align:center;">${alignList(customerList,4)}</p></td>
                                      <td class="table_td_ar" style="width:30.1%;">-: اﻹﺳﻢ</td>
                                  </tr>
                                  <!-- Row 2 -->
                                  <tr>
                                      
                                        `;

               if (customerData.custType == true){
                   template += `<td class="table_td_en" style="width:30%;">Identity Card./ Passport Number:-</td>
                                  <td class="table_td_cn" style="width:40%;">
                                    <p style="text-align:center;"> 
                                        ${alignList(passportList,4)}
                                    </p> `
               }
               else{
                  template += `<td class="table_td_en" style="width:30%;">Company Registration Number:-</td>
                                  <td class="table_td_cn" style="width:40%;">
                                    <p style="text-align:center;"> 
                                        ${customerData.compRegNum}
                                    </p>`
               }
          template += `</td>
                            <td class="table_td_ar" style="width:30%;">-:ﺑﻄﺎﻗﺔ اﻟﮭﻮﯾﺔ/ رﻗﻢ ﺟﻮاز اﻟﺴﻔﺮ </td>
                                  </tr>
                                  <!-- Row 3 -->
                                  <tr>
                                      <td class="table_td_en" style="width:30%;">Developer name:-</td>
                                      <td class="table_td_cn" style="width:40%;">${bodyFields.subLegalName}</td>
                                      <td class="table_td_ar" style="width:30%;">-:إﺳﻢ اﻟﻤﻄﻮر</td>
                                  </tr>
                                  <!-- Row 4 -->
                                  <tr>
                                      <td class="table_td_en" style="width:30%;">Project name:-</td>
                                      <td class="table_td_cn" style="width:40%;">${bodyFields.propertyName}</td>
                                      <td class="table_td_ar" style="width:30%;">-:اﺳﻢ اﻟﻤﺸﺮوع</td>
                                  </tr>
                                  <!-- Row 5 -->
                                  <tr>
                                      <td class="table_td_en" style="width:30%;">Unit number:-</td>
                                      <td class="table_td_cn" style="width:40%;">${unitMasterData.unitMastername}</td>
                                      <td class="table_td_ar" style="width:30%;">-:رﻗﻢ اﻟﻮﺣﺪة</td>
                                  </tr>
                                  <!-- Row 6 -->
                                  <tr>
                                      <td class="table_td_en" style="width:30%;border-bottom: 0px;">Registration Number:-</td>
                                      <td class="table_td_cn" style="width:40%;border-bottom: 0px;">${unitMasterData.registNumber}</td>
                                      <td class="table_td_ar" style="width:30%;border-bottom: 0px;">-:رﻗﻢ اﻟﺘﺴﺠﯿﻞ </td>
                                  </tr>
                                                                    
                            </table>`;

      }
      // // WAterMArk
      {
        template += `
                        <table style="width: 100%; margin-top:0 pt; border-bottom: 0pt; position: relative;z-index: 1;">
                          <tr>
                              <td style="position: relative; padding: 0;">
                                <!-- Background Image -->
                                <img src="https://9294876.app.netsuite.com/core/media/media.nl?id=42089&amp;c=9294876&amp;h=ZgQBp1Oii7KAkaJVhdZyX0g9jUW7NwyoegHrZztxDwczXj1R" width="70%" height="60%"
                                    style="position: absolute; top: 50; left: 200; opacity: 0.9; margin-center: 0px;" />
                              </td>
                            </tr>
                           </table> 
                                    `;
      }
      // // table 2 
      {
        template += `<table style="width: 100%; border: 0.5pt solid ; margin-top:0 pt; border-bottom: 0pt; border-top: 0pt; position: relative;z-index: 1;">
                        <tr style=" border-top: 0.5pt solid black ;">
                          <td class = "table2_td_en" style="width:30%;height:100px;vertical-align: middle;">Signature</td>
                          <td style="width:40%;height:80px; border-right : 0.5pt solid black ;border-left : 0.5pt solid black ;vertical-align: middle;"></td>
                          <td class = "table2_td_ar" style="width:30%;height:100px;vertical-align: middle;">اﻟﺘﻮﻗﯿﻊ</td>
                        </tr>
                            </table>`;

      }
      // // table 3 
      {
        template += `<table  style="width: 100%; border: 0.5pt solid ;margin-top:0 pt; position: relative;z-index: 1;">
                      <tr>
                        <td  class = "table3_td_en" style="width:50%;height:160px; border-right: 0.5pt solid black;">
                          RERA-RAK experienced that the above has attended<br/>with full consent to make that request.<br/>
                          RERA-RAK will not be responsible of this decision.<br/>Whereby, the SPA between the developer and the<br/>buyer will be canceled.<br/>
                          The Amiri Decree ( No.22 of 2008, No.10 of 2014 and<br/>No.11 of 2021) are hereby applied.
                        </td>
                        <td style="width:50%;height:160px; ">
                            <table width="100%">
                              <tr><td class = "table3_td_ar">تشهد إدارة التنظيم العقاري برأس الخيمة بأن المذكور أعلاه قد حضر وبكامل</td></tr>
                              <tr><td class = "table3_td_ar">.إرادته دون إجبار لتقديم هذا الطلب</td></tr>
                              <tr><td class = "table3_td_ar">.دون أن ﺗﺘﺤﻤﻞ إدارة اﻟﺘﻨﻈﻴﻢ اﻟﻌﻘﺎري أي ﻣﺴﺆوﻟﻴﻪ ﻋﻦ ﻫﺬا اﻟﻘﺮار</td></tr>
                              <tr><td class = "table3_td_ar">وﲟﻮﺟﺒﻪ ، ﻳﺘﻢ إﻟﻐﺎء ﻋﻘﺪ اﳌﺸﱰي اﳌﺬﻛﻮر أﻋﻼﻩ ﻟﻠﻮﺣﺪة اﳌﺬﻛﻮرة أﻋﻼﻩ </td></tr>
                              <tr><td class = "table3_td_ar">.بالمشروع </td></tr>
                              <tr><td class = "table3_td_ar">تسري أحكام المراسيم الأميرية رقم ( 22 لسنة 2008 م ، و 10 لسنة </td></tr>
                              <tr><td class = "table3_td_ar" style="padding-bottom : 40px;">.( و 11 لسنة 2021 م <span>،م</span>2014</td></tr>
                            </table>
                        </td>
                      </tr>
                    </table>`;

      }
      // // paragraph 1
      {
        template += `<p style="align : left; font-size: 8px; font-weight: bold;padding-left:20px;">توقيع و ختم  المطور </p>`;
      }

      // // footer 
      {
        template += `<table style="width: 100%; height: 100px; position: relative; ">

        <tr>
          <td style="position: relative; padding: 0;">
            <!-- Background Image -->
            <img src="https://9294876.app.netsuite.com/core/media/media.nl?id=42088&amp;c=9294876&amp;h=D469q2a06BI6tLjp_1SdAuf6ke9Kl_kmDRawzTl_Pbh_0ORb" width="98%"
                style="position: absolute; top: 0; left: 0; opacity: 0.1; margin-left: -24px;" />
          </td>
        </tr>
                <tr>
            <td style="align : right; margin-bottom: 20px; margin-top: -5px;">
              <p style="align : right; font-size: 10px; color: red; font-weight: bold;">ملاحظة </p>
              <p style="align : right; font-size: 9px ; font-weight: bold;"> -:يرجى ارفاق*</p>
              <p style="align : right; font-size: 9px ; font-weight: bold;">اوراق تسجيل الوحدة لدى ادارة التنظيم العقاري<span>-1</span></p>
              <p style="align : right; font-size: 9px ; font-weight: bold;">اﻻوراق اﻟﺮﺳﻤﯿﺔ ﻟﻤﻘﺪم طﻠﺐ اﻻﻟﻐﺎء<span>-2</span></p>
              <p style="align : right; font-size: 9px ; font-weight: bold;">بحال وجود وكيل يرجى ارفاق اوراق التوكيل مع بيانات الموكل الرسمية والتوقيعه ادناه *</p>
            </td>
        </tr>
      </table>`;
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
        propertyName: "",
        unitMaster: "",
        customer: "",
        secCustomer: "",
        thirdCustomer: "",
        fourthCustomer: "",
        fifthCustomer: "",
        subLegalName: "",
        custName: "",
        custPassport: ""
      };

      if (myRecId) {

        const fieldsSearch = search.create({
          type: 'customrecord_ino_re_spa_termination',
          columns: [
            'custrecord_ino_re_st_subsidiary',
            'custrecord_ino_re_st_property',
            'custrecord_ino_re_st_unit_master',
            'custrecord_ino_re_st_customer',
            'custrecord_ino_re_st_secondery_customer',
            'custrecord_ino_re_st_third_customer',
            'custrecord_ino_re_st_fourth_customer',
            'custrecord_ino_re_st_fifth_customer',
          ],
          filters: [
            [['internalid', 'is', myRecId]]
          ]
        }).run().getRange(0, 1);

        const searchResult = fieldsSearch[0];

        if (searchResult != null && searchResult != '') {
          bodyFields.subsidiaryName = searchResult.getValue('custrecord_ino_re_st_subsidiary');
          bodyFields.propertyName = searchResult.getText('custrecord_ino_re_st_property');
          bodyFields.unitMaster = searchResult.getValue('custrecord_ino_re_st_unit_master');
          bodyFields.customer = searchResult.getValue('custrecord_ino_re_st_customer');
          bodyFields.secCustomer = searchResult.getValue('custrecord_ino_re_st_secondery_customer');
          bodyFields.thirdCustomer = searchResult.getValue('custrecord_ino_re_st_third_customer');
          bodyFields.fourthCustomer = searchResult.getValue('custrecord_ino_re_st_fourth_customer');
          bodyFields.fifthCustomer = searchResult.getValue('custrecord_ino_re_st_fifth_customer');
          
        }
      } log.debug("subsidiary", bodyFields.subsidiaryName);
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


      return bodyFields;

    } catch (getBodyFields) {
      log.debug("getBodyFields", getBodyFields);
    }
  }

  const getCustomerData = (custID) => {
    try {
      if (!custID) { return; }

      let recData ={}

      const columns = [
        "custentity_az_rng_customer_name",
        "custentity_ino_re_passport_id",
        "isperson",
        "custentity_az_rng_company_reg_num"
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

        const passportno = custSearch[0].getValue(
          "custentity_ino_re_passport_id"
        );

        const custType = custSearch[0].getValue(
          "isperson"
        );

        const compRegNum = custSearch[0].getValue(
          "custentity_az_rng_company_reg_num"
        );



        recData = {
          passportno: passportno || " ",
          custname: custname || " ",
          custType: custType || " ",
          compRegNum: compRegNum || " "
        };
      }
      return recData;

    } catch (errorgetCustomerData) {
      log.debug("errorgetCustomerData", errorgetCustomerData);

    }

  }

const  alignList = (customers, itemsPerLine) =>{
  try {
      if (!customers) return '';

    // Ensure customers is an array
    if (typeof customers === 'string') {
        customers = customers.split(',');
    }

    let formatted = [];
    for (let i = 0; i < customers.length; i++) {
        formatted.push(customers[i].trim());

        // Add <br/> after every itemsPerLine
        if ((i + 1) % itemsPerLine === 0 && i !== customers.length - 1) {
            formatted.push('<br/>');
        } else if (i !== customers.length - 1) {
            // Add separator (comma or space) between items in the same line
            formatted.push(', ');
        }
    }

    return formatted.join('');
    
  } catch (erroralignList) {
    log.debug("erroralignList", erroralignList);
    
  }
  
}

 const getUnitMasterData = (unitMasterId) => {
  try {
    let unitMasterData = {} ;

     const columns = [
        "name",
        "custrecord_registration_no"
      ];
    const custSearch = search.create({
        type: "customrecord_ino_re_unitmaster",
        filters: [
          ["isinactive", search.Operator.IS, false],
          "and",
          ["internalid", search.Operator.IS, unitMasterId],
        ],
        columns: columns,
      }).run().getRange(0, 1);

       if (custSearch != null && custSearch != "") {
        const unitName = custSearch[0].getValue("name");

        const registNo = custSearch[0].getValue("custrecord_registration_no");



        unitMasterData = {
          unitMastername : unitName || " ",
          registNumber : registNo || " ",
        };
      }
      return unitMasterData;
    
  } catch (errorgetUnitMasterData) {
    log.debug("errorgetUnitMasterData", errorgetUnitMasterData);

  }
 }


  return {
    onRequest: onRequest,
  };
});
