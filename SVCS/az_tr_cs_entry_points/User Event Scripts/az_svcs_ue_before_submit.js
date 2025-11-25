/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define (['N/record'],(record) => {
        const beforeSubmit = (context) => {
          try {
              log.debug("before submit","Hello World"); 
              const recId = context.newRecord.id ;
              const assDev = loadAssDev(recId);
          } catch (errorbeforeSubmit) {
             log.debug("errorbeforeSubmit ",errorbeforeSubmit); 
          }  
        }
        
        const loadAssDev = (id) =>{
            try {
                const loadAssDev = record.load({
                    type: 'customrecord_az_tr_associate_dev',
                    id: id
                })

                log.debug("Birthdate",loadAssDev.getValue('custrecord_az_tr_bd'));
            } catch (errorLoadAssDev) {
                log.debug("errorLoadAssDev",errorLoadAssDev);
            }
        }
        return {
            beforeSubmit
        }
    }
)