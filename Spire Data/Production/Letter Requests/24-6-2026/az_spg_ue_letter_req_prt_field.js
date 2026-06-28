/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define(['N/search', 'N/ui/serverWidget', 'N/record'], function (search, serverWidget, record) {

    const beforeLoad = (context) => {
        try {

            if (context.type !== context.UserEventType.PRINT) return;

            const employeeID = context.newRecord.getValue('custrecord_ino_hrms_dr_employee');

            const payrollAssignmentID = getEmployeeData(employeeID);

            const payrollAssignmentData = getPayrollAssignmentData(payrollAssignmentID);


            setData(payrollAssignmentData,context);

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

            return payrollAssignmentID;
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

    const setData = (payrollAssignmentData, context) => {

        const custrecord = context.form.addField({
            id: 'custpage_custrecord_to_print',
            type: serverWidget.FieldType.LONGTEXT,
            label: 'Text'
        });


        const data = {
            payrollAssignmentData: payrollAssignmentData
        };

        custrecord.defaultValue = JSON.stringify(data);

    };


    return {
        beforeLoad
    };

});