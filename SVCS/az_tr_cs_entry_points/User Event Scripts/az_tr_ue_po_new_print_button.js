/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define([], function () {

    const beforeLoad = (context) => {
        try {
  
            const record = context.newRecord;
            const type = context.type;
            const recId = record.id
  
            if (type === context.UserEventType.VIEW){
  
                context.form.addButton({
                    id: "custpage_print_btn",
                    label: "Print",
                    functionName: 'onButtonClick("' + recId + '")',
                });
  
                context.form.clientScriptModulePath = "/SuiteScripts/andrew_ashraf/az_tr_cs_print_button.js";
            }
  
        } catch (errBeforeLoad) {
            log.debug('errBeforeLoad', errBeforeLoad)
        }
    }
  
    return {
        beforeLoad: beforeLoad
    }
  });
  