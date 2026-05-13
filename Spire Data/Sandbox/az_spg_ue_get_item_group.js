/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define(["N/record", "N/ui/serverWidget"], function (record, serverWidget) {

    const beforeLoad = (context) => {

        try {

            if (context.type === context.UserEventType.PRINT) {

                const rec = record.load({
                    type: context.newRecord.type,
                    id: context.newRecord.id
                });

                const groupedData = [];

                const lineCount = rec.getLineCount({
                    sublistId: "item"
                });

                for (let i = 0; i < lineCount; i++) {

                    const itemType = rec.getSublistValue({
                        sublistId: "item",
                        fieldId: "itemtype",
                        line: i
                    });

                     if (itemType === "Group") {

                        const groupId = rec.getSublistValue({
                            sublistId: "item",
                            fieldId: "item",
                            line: i
                        });

                        const groupName = rec.getSublistText({
                            sublistId: "item",
                            fieldId: "item",
                            line: i
                        });

                        const totals = calculateGroupTotals(rec, i, lineCount);

                        const members = [];

                        // =============================
                        // LOAD ITEM GROUP STRUCTURE
                        // =============================
                        const groupRec = record.load({
                            type: record.Type.ITEM_GROUP,
                            id: groupId
                        });

                        const memberCount = groupRec.getLineCount({
                            sublistId: "member"
                        });

                        for (let j = 0; j < memberCount; j++) {

                            members.push({

                                itemId: groupRec.getSublistValue({
                                    sublistId: "member",
                                    fieldId: "item",
                                    line: j
                                }),

                                itemName: groupRec.getSublistText({
                                    sublistId: "member",
                                    fieldId: "item",
                                    line: j
                                }),

                                itemDescription: groupRec.getSublistText({
                                    sublistId: "member",
                                    fieldId: "memberdescr",
                                    line: j
                                }),

                                itemUnit: groupRec.getSublistText({
                                    sublistId: "member",
                                    fieldId: "memberunit",
                                    line: j
                                })

                            });
                        }

                        groupedData.push({
                        groupId: groupId,
                        groupName: groupName,

                        totalRate: totals.totalRate,
                        taxrate: totals.taxrate,
                        totalQty: totals.totalQty,
                        totalAmount: totals.totalAmount,
                        totalTax: totals.totalTax,

                        members: members
                    });
                    }
                }

                setItems(groupedData, context);
            }

        } catch (err) {
            log.debug("beforeLoad Error", err);
        }
    };

    const calculateGroupTotals = (rec, startLine, lineCount) => {

        const totalQty = 1;
        let totalAmount = 0;
        let totalTax = 0;
        // let totalRate = 0;
        
        let childLine = startLine + 1;
        
        const taxrate =  rec.getSublistText({
                       sublistId: "item",
                       fieldId: "taxrate1",
                       line: childLine
                   })
                || "0.00";

        while (childLine < lineCount) {
            
            const childType = rec.getSublistValue({
                sublistId: "item",
                fieldId: "itemtype",
                line: childLine
            });
            

            // stop when reaching EndGroup
            if (childType === "EndGroup") {
                break;
            }

            // skip any nested group lines if found
            if (childType !== "Group") {

                // totalQty += parseFloat(
                //     rec.getSublistValue({
                //         sublistId: "item",
                //         fieldId: "quantity",
                //         line: childLine
                //     })
                // ) || 0;

                // totalRate += Number(rec.getSublistValue({
                //     sublistId: "item",
                //     fieldId: "rate",
                //     line: childLine
                // })) || 0;

                totalAmount += Number(rec.getSublistValue({
                    sublistId: "item",
                    fieldId: "amount",
                    line: childLine
                })) || 0;

                totalTax += parseFloat(
                    rec.getSublistValue({
                        sublistId: "item",
                        fieldId: "tax1amt",
                        line: childLine
                    })
                ) || 0;
            }

            childLine++;
        }

        return {
            totalRate: totalAmount,
            taxrate: taxrate,
            totalQty: totalQty,
            totalAmount: totalAmount,
            totalTax: totalTax
        };
    };

    // =========================
    // SET DATA TO FORM
    // =========================
    const setItems = (data, context) => {

        try {
            const field = context.form.addField({
                id: "custpage_custrecord_items_to_print",
                type: serverWidget.FieldType.LONGTEXT,
                label: "Grouped Items"
            });

            field.defaultValue = JSON.stringify(data);

        } catch (error) {
            log.debug("setItems Error", error);
        }
    };

    return {
        beforeLoad: beforeLoad
    };

});