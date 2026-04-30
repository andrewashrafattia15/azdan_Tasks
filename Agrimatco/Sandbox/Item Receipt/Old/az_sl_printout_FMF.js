/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
 define(["N/file", "N/render", "N/record", "N/format", "N/search"], function (file, render, record, format, search) {
  function onRequest(context) {
    try {
      var request = context.request;
      var id = context.request.parameters.recId;

      var fileObj = file.load({
        id: "SuiteScripts/itemreciptTemp.html",
      });
      var content = fileObj.getContents();

      var xml = content;

      var newRecord = record.load({
        type: "itemreceipt",
        id: id,
        isDynamic: false,
      });
      var createdfromID=newRecord.getValue({
        fieldId: "createdfrom",
      });
      var num_accreditation = newRecord.getText({
        fieldId: "createdfrom",
      });

      var itemReciptRate=newRecord.getValue({
        fieldId: "exchangerate",
      });

      var vandor = newRecord.getText({
        fieldId: "entity",
      });
      var subsidiaryid = newRecord.getValue({
        fieldId: "subsidiary",
      });
    
        var location=newRecord.getText({
          fieldId: "location",
        });
      
      var memo = newRecord.getValue({
        fieldId: "memo",
      });
      var datee = newRecord.getText({
        fieldId: "trandate",
      });

      var tranid = newRecord.getText({
        fieldId: "tranid",
      });

      var xml = xml.replace("<!-- refnum -->", tranid);

      var xml = xml.replace("accreditation_num", num_accreditation);
      var xml = xml.replace("entity", vandor);
      if(subsidiaryid==12||subsidiaryid==17){
      var xml = xml.replace("<!--locationRow-->", '<tr><td align="right">'+location+'</td><td align="right">الموقع</td></tr>');
      }
      var xml = xml.replace("memo", memo);
      var xml = xml.replace("accreditation_date", datee);


      var numLines = newRecord.getLineCount({
        sublistId: "item",
      });
      var cur_local_total = 0;

      // Landed Cost Table
      // Get Data from Saved Search
      var allocatedLandedCost = search.load({
        id: "customsearch_az_agri_landedcostlines_2",
      });

      var itemreceipt = search.createFilter({
        name: "custcol_az_agri_itemreceipt",
        operator: search.Operator.IS,
        values: id,
      });

      allocatedLandedCost.filters.push(itemreceipt);

      var savedSearchResult = getAllResults(allocatedLandedCost);

      //log.debug("savedSearchResult",savedSearchResult)

      var totalAmountlandedCost = 0;
      if (savedSearchResult != null && savedSearchResult != "") {
        var table2 = "";
        log.debug('savedSearchResult',savedSearchResult.length)
        for (var r = 0; r < savedSearchResult.length; r++) {
          var type = savedSearchResult[r].getText("type");
          var date = savedSearchResult[r].getValue("trandate");
          var memo = removeandsign(savedSearchResult[r].getValue("memo"))
          // log.debug('r',r);
          log.debug('memo',memo);
          var amount = savedSearchResult[r].getValue("fxamount");
          var rate=savedSearchResult[r].getValue("exchangerate");
          var localamountrate=amount*rate
          var documentnumber = savedSearchResult[r].getValue("transactionnumber");
          var vandorname = savedSearchResult[r].getValue({
            name: "altname",
            join: "vendor",
          });


          totalAmountlandedCost += parseFloat(localamountrate);
          table2 += "<tr>";
          table2 += '<td align="center" ><span>' + memo.replace('-','&nbsp;-&nbsp;')+ "</span></td>";
          table2 += '<td align="center" ><span>' + documentnumber + "</span></td>";
          table2 += '<td align="right" ><span>' + numberWithCommas(localamountrate) + "</span></td>";
          table2 += '<td align="center" ><span>' + vandorname + "</span></td>";
          table2 += '<td align="center" ><span>' + date + "</span></td>";
          table2 += '<td align="center" ><span>' + type + "</span></td>";
          table2 += "</tr>";
        }
        var xml = xml.replace("<!-- <table2> -->", table2);
      }

      var xml = xml.replace("num2", numberWithCommas(totalAmountlandedCost.toFixed(2)));
      var xml = xml.replace("num3", numberWithCommas(totalAmountlandedCost.toFixed(2)));





      //Build the Table
      var finialTotalCost=0
      var finialTotalValue=0

      if (numLines != 0) {
        var table = "";
        for (var i = 0; i < numLines; i++) {
          var lineItemType = newRecord.getSublistValue({
            sublistId: "item",
            fieldId: "itemtype",
            line: i,
          });

          // Exclude  Landed cost Items
          if (lineItemType != "OthCharge") {
            var inventoryDetails = newRecord.getSublistSubrecord({
              sublistId: "item",
              fieldId: "inventorydetail",
              line: i,
            });

            var lineInv = inventoryDetails.getLineCount("inventoryassignment");

            //

            var lineItemid = newRecord.getSublistValue({
              sublistId: "item",
              fieldId: "item",
              line: i,
            });


            var itemDate=GetItemsData(id,lineItemid)

            table += "<tr>";
            if (lineInv != 0) {
              table += '<td align="center"><span>';
              table += '<table style="width: 100%;border: none;">';
              for (var x = 0; x < lineInv; x++) {
                var expirationdate = inventoryDetails.getSublistText({
                  sublistId: "inventoryassignment",
                  fieldId: "existingexpdate",
                  line: x,
                });

                table += "<tr>";
                table += '<td align="center"><span>' + expirationdate + "</span></td>";
                table += "</tr>";
              }
              table += "</table>";
              table += "</span></td>";
              /// Lot Number

              table += '<td align="center"><span>';
              table += '<table style="width: 100%;border: none;">';
              for (var x = 0; x < lineInv; x++) {
                var lotNumber = inventoryDetails.getSublistText({
                  sublistId: "inventoryassignment",
                  fieldId: "receiptinventorynumber",
                  line: x,
                });

                table += "<tr>";
                table += '<td align="center"><span>' + lotNumber + "</span></td>";
                table += "</tr>";
              }
              table += "</table>";
              table += "</span></td>";
            } else {
              table += '<td align="center"><span></span></td>';
              table += '<td align="center"><span></span></td>';
            }

            table +='<td align="right"><span>' + numberWithCommas(itemDate.totalCost) +"</span></td>";
            table += '<td align="right"><span>' + numberWithCommas(itemDate.totalCostWithoutLandedCost) + "</span></td>";
            table += '<td align="center"><span>' + itemDate.quantity + "</span></td>";
            table += '<td align="center"><span>' + itemDate.unit + "</span></td>";
            table += '<td align="center"><span>' + itemDate.itemName + "</span></td>";
            table += '<td align="center"><span>' + itemDate.displayName + "</span></td>";
            table += "</tr>";
          }
        }
        var xml = xml.replace("<!-- <table1> -->", table);
        var totalcosts=GetItemTotalCost(id)
        var xml = xml.replace("<!-- totalamt -->",numberWithCommas(totalcosts.totalCostWithoutLandedCost));
        var xml = xml.replace("<!-- landedcostamt -->",numberWithCommas(totalcosts.totalCost));

      }

      // Back ground Image

      

      if (subsidiaryid) {
        var subsidiaryrec = record.load({
          type: "subsidiary",
          id: subsidiaryid,
          isDynamic: true,
        });

        var link = subsidiaryrec.getValue("custrecord_az_agri_background_url");

        var xml = xml.replace("varbackground", link);
      }

      // Footer Date & Time

      var today = new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });
      // var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      // var time = today.getHours() + ":" + today.getMinutes();
      var xml = xml.replace("crr_date", today);
      var xml = xml.replace("crr_time", "");

      // File Creation
      var myFile = render.create();
      myFile.templateContent = xml;

      var invoicePdf = myFile.renderAsString();

      var pdfFile = render.xmlToPdf({
        xmlString: invoicePdf,
      });

      context.response.writeFile({
        file: pdfFile,
        isInline: true,
      });
    } catch (error) {
      log.debug({ title: "error", details: JSON.stringify(error) });
    }
  }
  // Add 1000 separators
  function numberWithCommas(x) {
    if (x != null && x != "" && x != 0) {
      x = parseFloat(x);
      x = x.toFixed(2);
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else if (x == 0) {
      return "0";
    }
  }
  // search for more than 1000 records
  function getAllResults(s) {
    var results = s.run();
    var searchResults = [];
    var searchid = 0;
    do {
      var resultslice = results.getRange({ start: searchid, end: searchid + 1000 });
      resultslice.forEach(function (slice) {
        searchResults.push(slice);
        searchid++;
      });
    } while (resultslice.length >= 1000);
    return searchResults;
  }

  function GetItemsData(itemReceiptID,itemID){
    var savedsearch = search.load({
      id: "customsearch_az_agri_purchases_2_3",
    });

    var itemreceipt = search.createFilter({
      name: "internalid",
      operator: search.Operator.IS,
      values: itemReceiptID,
    });

    var itemId=search.createFilter({
      name: "item",
      operator: search.Operator.IS,
      values: itemID,
    });

    savedsearch.filters.push(itemreceipt);
    savedsearch.filters.push(itemId);


    var savedSearchResult = getAllResults(savedsearch);

    if(savedSearchResult!=null && savedSearchResult!="" ){
      var totalCost=savedSearchResult[0].getValue(savedSearchResult[0].columns[6])
      var totalCostWithoutLandedCost=savedSearchResult[0].getValue(savedSearchResult[0].columns[9])
      var itemName=savedSearchResult[0].getValue(savedSearchResult[0].columns[3])
      var displayName=savedSearchResult[0].getValue(savedSearchResult[0].columns[2])
      var unit=savedSearchResult[0].getValue(savedSearchResult[0].columns[5])
      var quantity=savedSearchResult[0].getValue(savedSearchResult[0].columns[4])

      var obj={
        totalCost:totalCost,
        totalCostWithoutLandedCost:totalCostWithoutLandedCost,
        itemName:itemName,
        displayName:displayName,
        unit:unit,
        quantity:quantity,
      }

      return obj
    }
    else{
      return false
    }
  }

  function GetItemTotalCost(itemReceiptID,itemID){
    var savedsearch = search.load({
      id: "customsearch_az_agri_purchases_2_3_2",
    });

    var itemreceipt = search.createFilter({
      name: "internalid",
      operator: search.Operator.IS,
      values: itemReceiptID,
    });

    savedsearch.filters.push(itemreceipt);


    var savedSearchResult = getAllResults(savedsearch);

    if(savedSearchResult!=null && savedSearchResult!="" ){
      var totalCost=savedSearchResult[0].getValue(savedSearchResult[0].columns[1])
      var totalCostWithoutLandedCost=savedSearchResult[0].getValue(savedSearchResult[0].columns[2])


      var obj={
        totalCost:totalCost,
        totalCostWithoutLandedCost:totalCostWithoutLandedCost,
      }

      return obj
    }
    else{
      return false
    }
  }
  function removeandsign(word) {
    word = word.replace("&", "&amp;");
    return word
}




  return {
    onRequest: onRequest,
  };
});
