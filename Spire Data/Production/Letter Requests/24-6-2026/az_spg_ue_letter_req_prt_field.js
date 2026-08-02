/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define(['N/search', 'N/ui/serverWidget', 'N/record'], function (search, serverWidget, record) {

    const beforeLoad = (context) => {
        try {

            if (context.type !== context.UserEventType.PRINT) return;

            const employeeID = context.newRecord.getValue('custrecord_ino_hrms_dr_employee');

            const employeeData = getEmployeeData(employeeID);

            const payrollAssignmentData = getPayrollAssignmentData(employeeData.payrollAssignmentID);


            setData(employeeData,payrollAssignmentData,context);

        } catch (e) {
            log.debug('beforeLoad error', e);
        }
    };

    const getEmployeeData = (employeeID) => {

        try {

             const employeeRecord = record.load({
                type: record.Type.EMPLOYEE,
                id: employeeID
            });

            const payrollAssignmentID = employeeRecord.getValue('custentity_ino_hrms_emp_payrollassignmen');
            const subsidiaryID = employeeRecord.getValue('subsidiary');

            return {
                payrollAssignmentID: payrollAssignmentID,
                subsidiaryID: subsidiaryID
            };
        } catch (e) {
            log.debug('getEmployeeData error', e);
            return null;
        }

    };

    const getPayrollAssignmentData = (payrollAssignmentID) => {

        try {
           
            if (!payrollAssignmentID) {
                log.debug('beforeLoad', 'No payroll assignment found for employee: ' + payrollAssignmentID);
                return;
            }

            const payrollAssignmentRecord = record.load({
                type: 'customrecord_ino_hrms_empassignment',
                id: payrollAssignmentID
            });

            const totalSalary = payrollAssignmentRecord.getValue('custrecord_ino_hrms_pa_totalsalary');

            return {totalSalary:totalSalary};

        } catch (e) {
            log.debug('getPayrollAssignmentData error', e);
            return null;
        }

    };

    const setData = (employeeData,payrollAssignmentData, context) => {

        const custrecord = context.form.addField({
            id: 'custpage_custrecord_to_print',
            type: serverWidget.FieldType.LONGTEXT,
            label: 'Text'
        });


        const data = {
            employeeData: employeeData,
            payrollAssignmentData: payrollAssignmentData
        };



        custrecord.defaultValue = JSON.stringify(data);

    };


    return {
        beforeLoad
    };

});