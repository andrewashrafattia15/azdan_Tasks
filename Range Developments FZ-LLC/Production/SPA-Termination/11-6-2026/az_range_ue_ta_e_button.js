/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define([], function () {

    const beforeLoad = (context) => {
        try {
  
            let Record = context.newRecord;
            let Type = context.type;
            let myRecId = Record.id

            const approvalStatus = Record.getValue('custrecord_ino_re_st_approval_status')
  
            if (Type == 'view' && approvalStatus!=3) {
  
                context.form.addButton({
                    id: "custpage_ta_print_btn",
                    label: "Termination Agreement - E",
                    functionName: 'onButtonClick("' + myRecId + '")',
                });

                context.form.clientScriptModulePath = "SuiteScripts/az_range_cs_ta_e_button.js";
  
            }
  
        } catch (errBeforeLoad) {
            log.debug('errBeforeLoad', errBeforeLoad)
        }
    }
  
    return {
        beforeLoad: beforeLoad
    }
  });
  