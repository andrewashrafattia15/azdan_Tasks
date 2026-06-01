function printQuoteAction(request, response) {
  try {
    var renderer = nlapiCreateTemplateRenderer();
    var recId = request.getParameter("recId");
    var quoteId = nlapiLoadRecord("estimate", recId);
    var template = "";
    var i = 0;
    template +=
      '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
    template += "<pdf>";
    template += "<head>";
    template +=
      '<#if .locale == "ru_RU"><link name="verdana" type="font" subtype="opentype" src="${nsfont.verdana}" src-bold="${nsfont.verdana_bold}" bytes="2" /></#if>';
    template += "<macrolist>";
    template += '<macro id="nlheader">';
    template +=
      '<table style="width:100%;"><tr><td align = "left"><img style="height:60px;width:280px;margin-left: -30px;margin-top: -15px;" src="https://system.eu2.netsuite.com/core/media/media.nl?id=19&amp;c=4659918&amp;h=4133beaffec0800133cd"/></td><td align="right" style="margin-right: -30px;"> <#if companyInformation.logoUrl?length !=0><img src="${companyInformation.logoUrl}" style="height:30px;width:240px;"/></#if></td></tr></table>';
    template += "</macro>";
    template += '<macro id="nlfooter">';
    template +=
      '<table style="width:100%"><tr><td align = "right">&nbsp;</td><td colspan="3" align = "center">Jafza North - N100, Jebel Ali Free Zone, Dubai, UAE</td> <td></td></tr><tr><td align = "right">&nbsp;</td> <td colspan="3" align = "center">Tel.: +971 4 8876058 | Fax.: +971 4 8876059 | www.thgeyer.com</td> <td align = "right"><pagenumber/> of <totalpages/></td></tr></table>';
    template += "</macro>";
    template += "</macrolist>";
    template += '   <style type="text/css">table ';
    template += "{      font-family: sans-serif; ";
    template += "      font-size: 10pt; ";
    template += "      table-layout: fixed; ";
    template += "      } ";
    template += "      th ";
    template += "{      font-weight: bold; ";
    template += "      font-size: 9pt; ";
    template += "      vertical-align: middle; ";
    template += "      padding: 5px 6px 3px; ";
    template += "      background-color: #e3e3e3; ";
    template += "      color: #000000; ";
    template += "      } ";
    template += "      td p { align:left; } ";
    template += "      b ";
    template += "{      font-weight: bold; ";
    template += "      color: #000000; ";
    template += "      } ";
    template += "      table.header td ";
    template += "{      padding: 0; ";
    template += "      font-size: 10pt; ";
    template += "      } ";
    template += "      table.footer td ";
    template += "{      padding: 0; ";
    template += "      font-size: 9pt; ";
    template += "      } ";
    template += "      table.itemtable th ";
    template += "{      padding-bottom: 10px; ";
    template += "      padding-top: 10px; ";
    template += "      } ";
    template += "      table.total ";
    template += "{      page-break-inside: avoid; ";
    template += "      } ";
    template += "      tr.totalrow ";
    template += "{      background-color: #e3e3e3; ";
    template += "      line-height: 200%; ";
    template += "      } ";
    template += "      td.totalboxtop ";
    template += "{      font-size: 13pt; ";
    template += "      background-color: #e3e3e3; ";
    template += "      } ";
    template += "      span.title ";
    template += "{      font-size: 29pt; ";
    template += "      } ";
    template += "      span.number ";
    template += "{      font-size: 17pt; ";
    template += "      } ";
    template += "      span.itemname ";
    template += "{      font-weight: bold; ";
    template += "      line-height: 150%; ";
    template += "      } ";
    template += "      hr ";
    template += "{      width: 100%; ";
    template += "      color: #d3d3d3; ";
    template += "      background-color: #d3d3d3; ";
    template += "      height: 1px; ";
    template += "      } ";
    template += "   </style> ";
    template += "</head>";
    template +=
      '<body header="nlheader" header-height="10%" footer="nlfooter" footer-height="3%" padding="0.4in 0.4in 0.4in 0.4in" size="A4" style="font-family:verdana,geneva,sans-serif;">';
    template +=
      '<h2 align="center" style="font-weight:bold;font-size:18px;font-family:verdana,geneva,sans-serif;">QUOTATION</h2>';
    template += '<table style="width:100%;">';
    template += "<tr>";
    template += '<td style="width:60%;">';
    template +=
      '<table style="font-size:12px;font-family:verdana,geneva,sans-serif;margin-top:10px;">';
    template +=
      '<tr><td style="font-size:14px;font-weight:bold;">${record.entity.altname}</td></tr>';
    template +=
      '<tr><td style="font-size:12px;font-weight:bold;">${record.custbody_attention}</td></tr>';
    template +=
      "<#if record.shipaddress?has_content><tr><td>${record.shipaddress}</td></tr><#else><tr><td>${record.entity.address}</td></tr></#if>";
    template += "<tr><td>Ph: ${record.entity.phone}</td></tr>";
    template += "<tr><td>Email: ${record.entity.email}</td></tr>";
    template += "</table>";
    template += "</td>";
    template += "<td>";
    template +=
      '<table style="font-weight:bold;font-size:12px;font-family:verdana,geneva,sans-serif;margin-top:10px;"><tr>';
    template += '<td style="width:10%;">Reference #</td>';
    template +=
      '<td >:</td>' + 
      '<td style ="width:90%;">&nbsp;&nbsp;&nbsp;${record.tranid}</td>';
    template += "</tr>";
    template += "<tr>";
    template += '<td style="width:10%;">Date</td>';
    template +=
      '<td >:</td>' + 
      '<td style ="width:90%;">&nbsp;&nbsp;&nbsp;${record.trandate?string["dd-MMM-yy"]}</td>';
    template += "</tr>";
    template += "<tr>";
    template += '<td style="width:10%;">Validity</td>';
    template +=
      '<td >:</td>' + 
      '<td style ="width:90%;">&nbsp;&nbsp;&nbsp;${record.duedate?string["dd-MMM-yy"]}</td>';
    template += "</tr>";
    template += "<tr>";
    template += '<td style="width:10%;">Incoterm</td>';
    template +=
      '<td >:</td>' + 
      '<td style ="width:90%;">&nbsp;&nbsp;&nbsp;${record.custbody_az_thg_incoterm}</td>';
    template += "</tr>";
    //
    template += "<#if record.custbody_payment_terms?has_content>";

    template += "<tr>";
    template += '<td style ="width:10%;"><b>Payment Terms</b></td>';
    template +=
      '<td style="padding-right:10px">:</td>' + 
      '<td style ="width:90%;padding-right">&nbsp;&nbsp;&nbsp;${record.custbody_payment_terms}</td>';
    template += "</tr>";
    template += "</#if>";
    //

    template += "</table>";
    template += "</td>";
    template += "</tr>";
    template += "</table>";

    // template += '<table style="width: 100%;font-family:verdana,geneva,sans-serif;border-right:solid 1px #000;border-top:solid 1px #000;border-left:solid 1px #000;border-bottom:solid 1px #000 ;margin-top:2px;margin-left:3px;">';
    // template += '<tr style="background-color:#d3d3d3;">';
    // template += '<td align="center" style="border-right: solid 1px #000;border-right: solid 1px #000;"><b>INCOTERM</b></td>';
    // template += '<td align="center" style="border-right: solid 1px #000;"><b>SHIPPING METHOD</b></td>';
    // template += '<td align="center"><b>REFERENCE</b></td>';
    // template += "</tr>";
    // template += "<tr>";
    // template += '<td align="center" style="border-right: solid 1px #000;">${record.custbody_az_thg_incoterm}</td>';
    // template += '<td align="center" style="border-right: solid 1px #000;">${record.custbody_shipping_method}</td>';
    // template += '<td align="center">${record.otherrefnum}</td>';
    // template += "</tr>";
    // template += "</table>";

    /*template += "<table style=\"width:100%;font-family:verdana,geneva,sans-serif;margin-top:5px;\">";
    template += "<#if record.custbody_payment_terms?has_content>";
    template += "<tr>";
    template += "<td style =\"width:20%;\"><b>Payment Terms :</b></td>";
    template += "<td style =\"width:80%;\">${record.custbody_payment_terms}</td>";
    template += "</tr>";
    template += "</#if>";
    template += "<tr><td>&nbsp;</td></tr>";
    template += "<#if record.custbody_bank_details?has_content>";
    template += "<tr>";
    template += "<td style =\"width:20%;\">&nbsp;</td>";
    template += "<td style =\"width:80%;\">${record.custbody_bank_details}</td>";
    template += "</tr>";
    template += "</#if>";
    template += "</table>";*/

    template +=
      "<span style='font-size: 12px;font-weight:bold;'>With reference to your inquiry, we are pleased to offer you our price/s for the following product/s</span>";
    template += "<#if record.item?has_content>";
    template +=
      '<table class="itemtable" style="width: 100%;font-family:verdana,geneva,sans-serif;border-right:solid 1px #000;border-top:solid 1px #000;border-left:solid 1px #000;margin-top:1px;"><!-- start items --><#list record.item as item><#if item_index==0>';
    template += "<thead>";
    template += '<tr style = "background-color:#d3d3d3;">';
    template +=
      '<td colspan="1" align="center" style="border-right:solid 1px #000;border-bottom:solid 1px #000;"><b> No.</b></td>';
    template +=
      '<td colspan="2" align="center" style="border-right:solid 1px #000;border-bottom:solid 1px #000;"><b>Code No.</b></td>';
    template +=
      '<td colspan="3" align="center" style="border-right:solid 1px #000;border-bottom:solid 1px #000;"><b>Item Name</b></td>';
    // template += "<td colspan=\"4\" align=\"center\" style=\"border-right:solid 1px #000;border-bottom:solid 1px #000;\"><b>Description</b></td>";
    template +=
      '<td colspan="2" align="center" style="border-right:solid 1px #000;border-bottom:solid 1px #000;"><b>Qty/Kg</b></td>';
    template +=
      '<td colspan="2" align="center" style="border-bottom:solid 1px #000;"><b>Price/Kg</b></td>';
    // template += "<td colspan=\"2\" align=\"center\" style=\"border-bottom:solid 1px #000;\"><b>Amount (${record.currencysymbol})</b></td>";
    template += "</tr>";
    template += "</thead>";
    template += "</#if>";
    template += '<#if item.itemtype?contains("Subtotal")>';

    template += '<#elseif item.itemtype?contains("Discount")>';
    template += "<tr>";
    template +=
      '<td colspan="10" align="right" style="line-height:20px;border-bottom:solid 1px #000;">${item.custcol_item_code}</td>';
    // template += "<td colspan=\"2\" style=\"line-height:20px;border-bottom:solid 1px #000;\" align=\"right\">${item.amount?string[\"#,##0.00\"]}</td>";
    template += "</tr>";

    template += '<#elseif item.itemtype?contains("Service")>';
    template += "<tr>";
    // template +=
    //   '<td colspan="6" style="line-height:20px;border-bottom:solid 1px #000;"></td>';
    template +=
      '<td colspan="8" align="right" style="line-height:20px;border-bottom:solid 1px #000;border-right: 1px #000">${item.custcol_item_code}</td>';
    template +=
      '<td colspan="2" align="right" style="line-height:20px;border-bottom:solid 1px #000;">${item.rate?string["#,##0.00"]}</td>';
    // template += "<td colspan=\"2\" style=\"line-height:20px;border-bottom:solid 1px #000;\" align=\"right\">${item.amount?string[\"#,##0.00\"]}</td>";
    template += "</tr>";

    template += "<#else>";
    template += "<tr>";
    template += "<#assign itemname = item.item/>";
    template +=
      '<td colspan="1" align="center" style="border-right:solid 1px #000;line-height:20px;border-bottom:solid 1px #000;">${item?counter}</td>';
    template +=
      '<td colspan="2" align="center" style="border-right:solid 1px #000;line-height:20px;border-bottom:solid 1px #000;">${item.custcol_item_code}</td>';
    template +=
      '<td align="center" colspan="3" style="border-right:solid 1px #000;line-height:20px;border-bottom:solid 1px #000;">${item.custcol_item_name_print}</td>';
    // template += "<td colspan=\"4\" align=\"center\" style=\"border-right:solid 1px #000;line-height:20px;border-bottom:solid 1px #000;\">${item.description}</td>";
    template +=
      '<td colspan="2" align="center" style="border-right:solid 1px #000;line-height:20px;border-bottom:solid 1px #000;">${item.quantity}</td>';
    template +=
      '<td colspan="2" align="right" style="line-height:20px;border-bottom:solid 1px #000;">${item.rate?string["#,##0.00"]} ${record.currency}</td>';
    // template += "<td colspan=\"2\" style=\"line-height:20px;border-bottom:solid 1px #000;\" align=\"right\">${item.amount?string[\"#,##0.00\"]}</td>";
    template += "</tr>";
    template += "</#if>";
    template += "</#list><!-- end items -->";

    template += "<#if record.discountitem?has_content>";
    template += "<tr>";

    template +=
      '<td colspan="2" align="center" style="border-right:solid 1px #000;line-height:20px;border-bottom:solid 1px #000;">&nbsp;</td>';
    // template += "<td colspan=\"5\" style=\"border-right:solid 1px #000;line-height:20px;border-bottom:solid 1px #000;\">${record.custbody_discount_description}</td>";
    template +=
      '<td colspan="4" align="center" style="border-right:solid 1px #000;line-height:20px;border-bottom:solid 1px #000;">&nbsp;</td>';
    template +=
      '<td colspan="2" align="center" style="border-right:solid 1px #000;line-height:20px;border-bottom:solid 1px #000;">&nbsp;</td>';
    template +=
      '<td colspan="2" align="right" style="line-height:20px;border-bottom:solid 1px #000;">&nbsp;</td>';
    // template += "<td colspan=\"2\" align=\"right\" style=\"line-height:20px;border-bottom:solid 1px #000;\">${record.discounttotal?string[\"#,##0.00\"]}</td>";
    template += "</tr>";
    template += "</#if> ";
    //template += "<tr style = \"font-weight:bold;\"><td style=\"border-right:solid 1px #000;border-bottom:solid 1px #000;line-height:20px;\" colspan=\"11\">&nbsp;</td><td style=\"border-right:solid 1px #000;border-bottom:solid 1px #000;line-height:20px;\" align=\"right\" colspan=\"2\"><b>${record.taxtotal@label} ${record.currencysymbol}</b></td><td style=\"border-bottom:solid 1px #000;line-height:20px;\" align=\"right\" colspan=\"2\"><b>${record.taxtotal?string[\"#,##0.00\"]}</b></td></tr>";
    // template += "<tr style = \"background-color:#d3d3d3;font-weight:bold;\"><td style=\"border-right:solid 1px #000;border-bottom:solid 1px #000;line-height:20px;\" colspan=\"12\">${record.currencysymbol} : ${record.custbody_amount_inwords?lower_case?cap_first}</td><td style=\"border-right:solid 1px #000;border-bottom:solid 1px #000;line-height:20px;\" align=\"right\" colspan=\"2\"><b>${record.total@label} ${record.currencysymbol}</b></td><td style=\"border-bottom:solid 1px #000;line-height:20px;\" align=\"right\" colspan=\"2\"><b>${record.subtotal?string[\"#,##0.00\"]}</b></td></tr>";
    template += "</table>";
    template += "</#if>";
    // template += '<div style="position:absolute;bottom:0px;">';

    template += '<table style="width:100%; font-size: 13px; margin-top:30px;">'

    template += "<#if record.custbody_special_notes?has_content>";
    template += "<tr>";
    template += '<td style ="width:20%;"><b>Special Notes &nbsp;&nbsp;:</b></td>';
    template += '<td style ="width:80%;">${record.custbody_special_notes}</td>';
    template += "</tr>";
    template += "</#if>";

    template += "<#if record.custbody_bank_details?has_content>";
    template += "<tr>";
    template += '<td colspan="2" style="font-weight:bold">${record.custbody_bank_details}</td>';
    template += "</tr>";
    template += "</#if>";

    template += "</table>";

    template +=
      '<table style="width:100%; font-size: 11px; margin-top: 120px;">';
    // template += "<tr><td></td></tr>";
    // template += "<tr><td></td></tr>";
    // template += "<tr><td></td></tr>";
    // template += "<tr><td></td></tr>";

    template +=
      '<tr><td style="align: center; font-weight: bold;">PREPARED BY<br/><#if record.custbody_az_apply_signature?string=="Yes">';
    template +=
      '<#if record.custbody_az_prepared_by.id =="1487"><img src="http://4659918.shop.netsuite.com/core/media/media.nl?id=5480&amp;c=4659918&amp;h=1AIWI1Mu1npyAU3TTBvOEvVGOXPeKh-cWVHG7yJpKPWGgHse" width="110" height="75"/></#if><!-- Zarina signature -->';
    template +=
      '<#if record.custbody_az_prepared_by.id =="6"><img src="http://4659918.shop.netsuite.com/core/media/media.nl?id=5482&amp;c=4659918&amp;h=NolLwUyhfh-SEIXKirtLICqh3ZXftPNP-9fqno98IXgSxe3E" width="110" height="75"/></#if><!-- Jhen signature -->';
    template +=
      '<#if record.custbody_az_prepared_by.id =="1406"><img src="http://4659918.shop.netsuite.com/core/media/media.nl?id=5481&amp;c=4659918&amp;h=nGiTfMsa6JNuaBuMmxm_tMA4cTBjzZ0LYslVXekEr6MQAUdP" width="110" height="75"/></#if><!-- Blenda signature -->';
    template +=
      '<#if record.custbody_az_prepared_by.id =="1467"><img src="http://4659918.shop.netsuite.com/core/media/media.nl?id=5483&amp;c=4659918&amp;h=59tlbeVJoHbz5fwLRAYzQYtOYPRyY2yPo_y5Z9iFZKw52bx-" width="110" height="75"/></#if><!-- Tamimi signature -->';
    template +=
      '<#if record.custbody_az_prepared_by.id =="8"><img src=" http://4659918.shop.netsuite.com/core/media/media.nl?id=5484&amp;c=4659918&amp;h=labjZzZ-0CMkI0xcjb-TFMTpgThj2bJ82jYxz7Zr9ml6_J1Y" width="110" height="75"/></#if><!-- Omar signature --></#if></td>';
    template +=
      '<td style="align: center; font-weight: bold;">AUTHORIZED SIGNATORY<br/><#if record.custbody_signature?string=="Yes"><img src="https://4659918.app.netsuite.com/core/media/media.nl?id=11019&amp;c=4659918&amp;h=yuIWib6yP-4yZ7yi4MEiE6kE9WKvDWfqr6PH3MS0UBzOc-lT" width="110" height="75"/></#if></td></tr>';
    template +=
      '<tr><td style="align: center; font-weight: bold; padding: 0;">${record.custbody_az_prepared_by}</td>';
    template += '<td style="align: center; font-weight: bold;"></td></tr>';
    template +=
      '<tr><td style="align: center; font-weight: bold; padding: 0;">_____________________________</td>';
    template +=
      '<td style="align: center; font-weight: bold; padding: 0;">_____________________________</td></tr>';
    template +=
      '<tr><td style="align: center; font-weight: bold;">SALES DEPARTMENT</td>';
    template +=
      '<td style="align: center; font-weight: bold;"></td></tr></table>';
    // template += "</div>";

    //   template += '<table style="width:100%; font-size: 11px; margin-top: 10px; padding=0;">';
    //  template += '<tr><td style="align: center; font-weight: bold;">PREPARED BY<br/><br/><br/><br/><br/>${record.custbody_az_prepared_by}</td><td align="center" style="font-weight:bold; padding=0;">AUTHORIZED SIGNATORY<br/><#if record.custbody_signature?string == "Yes"><img src ="http://4659918.shop.netsuite.com/core/media/media.nl?id=2351&amp;c=4659918&amp;h=5c9578149a2c1e084669" width="120" height="85"/></#if></td></tr>';
    //  template += '<tr><td style="align: center; font-weight: bold;">_____________________________<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SALES DEPARTMENT</td><td style="align: center; font-weight: bold;">_____________________________<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;TAMER ABWINI</td></tr>';
    // template += '</table>';

    template += "</body>";
    template += "</pdf>";
    renderer.setTemplate(template);
    renderer.addRecord("record", quoteId);
    var xml = renderer.renderToString();
    var file = nlapiXMLToPDF(xml);
    response.setContentType(
      "PDF",
      +quoteId.getFieldValue("id") + ".pdf",
      "inline"
    );
    response.write(file.getValue());
  } catch (errPrintQuoteAction) {
    nlapiLogExecution("DEBUG", "errPrintQuoteAction", errPrintQuoteAction);
  }
}

