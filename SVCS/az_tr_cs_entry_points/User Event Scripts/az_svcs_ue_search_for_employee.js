/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define(['N/search'], (search) => {
  const beforeSubmit = (context) => {
    try {
      const rec = context.newRecord;
      const currentUser = rec.getValue("custrecord_az_svcs_current_user");

      const user = getCurrentUser(currentUser);

    
      rec.setValue('custrecord_az_svcs_hire_date', user.hireDate);
      rec.setValue('custrecord_az_svcs_user_email', user.email);
      rec.setValue('custrecord_az_svcs_subsidiary', user.subsidiary[0].text);

      return;
    } catch (errorBeforeSubmit) {
      log.debug("errorBeforeSubmit", errorBeforeSubmit);
    }
  }

  const getCurrentUser = (currentUser) => {
    try {
      const empData = search.lookupFields({
        type: search.Type.EMPLOYEE,
        id: currentUser,
        columns: ["hiredate", "email", "subsidiary"],
      });


      if (empData.email) {
        return {
          hireDate: empData.hiredate,
          email: empData.email,
          subsidiary: empData.subsidiary,
        };
      } else {
        log.debug("GetCurrentUser", "No Data Found");
      }
    } catch (errorGetCurrentUser) {
      log.debug("errorGetCurrentUser", errorGetCurrentUser);
    }
  };


  return {
    beforeSubmit
  };
});
