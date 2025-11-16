/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['./az_acs_public_create_and_update.js', './az_acs_public_searching.js', './az_acs_public_crud_handler.js', 'N/search', 'N/runtime', 'N/record'], function(public_createAndUpdate, public_searching, public_crud_handler, s, runtime, record) {

    const getInputData = () => {
        try {
            
            const scriptObj = runtime.getCurrentScript();

            const recId = scriptObj.getParameter({
                name: 'custscript_mr_record_id'
            });

            const recName = scriptObj.getParameter({
                name: 'custscript_mr_record_name'
            });

            const filters =
            recName === 'customrecord_az_acs_student_enrollment'
            ? [['internalid', s.Operator.IS, recId]]
            : [['custrecord_az_acs_se_academic_year', s.Operator.IS, recId]];
            

            const enrollmentRecords = public_searching.getRecordsData(
                'customrecord_az_acs_student_enrollment',
                {
                    student: s.createColumn({ name: 'custrecord_az_acs_se_student' }),
                    grade: s.createColumn({ name: 'custrecord_az_acs_se_academic_grade' }),
                    orderNum: s.createColumn({ name: 'custrecord_az_acs_se_order_no' }),
                    id: s.createColumn({ name: 'internalid' }),
                    enrollmentType: s.createColumn({ name: 'custrecord_az_acs_se_enrollment_type' }),
                    reservationInvoiceStatus: s.createColumn({ name: 'custrecord_az_acs_se_invoice_status' }),
                    academicYear: s.createColumn({ name: 'custrecord_az_acs_se_academic_year' }),
                    reservationAmount: s.createColumn({ name: 'custrecord_az_acs_se_reservation_amount' }),
                },
                [
                    ['isinactive', s.Operator.IS, false],
                    'and',
                    ['custrecord_az_acs_se_order_no', s.Operator.ISEMPTY, ''],
                    'and',
                    ...filters
                ]
            );

            return enrollmentRecords;
        } catch (errGetInputData) {
            log.debug('errGetInputData', errGetInputData)
        }
    }

    const map = (context) => {
        try {
            const enrollmentData = JSON.parse(context.value);
            const scriptObj = runtime.getCurrentScript();
    
            const academicYear = scriptObj.getParameter({
                name: 'custscript_mr_academic_year'
            });

            const recName = scriptObj.getParameter({
                name: 'custscript_mr_record_name'
            });
            
            let recId;
            
            if (recName === 'customrecord_az_acs_student_enrollment') {

                recId = scriptObj.getParameter({
                    name: 'custscript_mr_record_id'
                });
                
            } else {
                
                recId = enrollmentData.academicYear;

            }

            
            if (enrollmentData.orderNum == '' && enrollmentData.reservationInvoiceStatus != 'Invoice:Voided') {
    
                const academicGradeRec = public_searching.getSingleRecordData(
                    'customrecord_az_acs_grades',
                    {
                        division: s.createColumn({ name: 'custrecord_az_acs_ag_division' }),
                        tutionItem: s.createColumn({ name: 'custrecord_az_acs_ag_tuition_item' }),
                        tutionFee: s.createColumn({ name: 'custrecord_az_acs_tuition_rate' }),
                    },
                    [
                        ['internalid', s.Operator.IS, enrollmentData.grade]
                    ]
                );
    
                const lineItemData = public_searching.getSingleRecordData(
                    'customrecord_az_acs_vc_integration_pref',
                    {
                        staticDate: s.createColumn({ name: 'custrecord_az_acs_vc_default_so_date' }),
                        reservationItem: s.createColumn({ name: 'custrecord_az_acs_vc_reservation_item' }),
                        reservationDeductionItem: s.createColumn({ name: 'custrecord_az_acs_vc_res_deduct_item' }),
                        capitalItem: s.createColumn({ name: 'custrecord_az_acs_vc_capital_item' }),
                        firstInvoiceBillingSchedule: s.createColumn({ name: 'custrecord_az_acs_vc_first_inv_schedule' }),
                        scheduleOfFirstInvoice: s.createColumn({ name: 'custrecord_az_acs_vc_first_inv_schedule' }),
                        waiverCapitalDiscount: s.createColumn({ name: 'custrecord_az_acs_waivers_capital' }),
                        waiverDiscount: s.createColumn({ name: 'custrecord_az_acs_waivers_discount' }),
                    }
                );

                const academicYearRec = public_searching.getSingleRecordData(
                    'customrecord_az_acs_academic_years',
                    {
                        capitalFees: s.createColumn({ name: 'custrecord_az_acs_ay_capital_fees' }),
                        defaultBillingSchedule: s.createColumn({ name: 'custrecord_az_acs_billing_schedule' }),
                        reservationAmount: s.createColumn({ name: 'custrecord_az_acs_ay_reservation_amt' })
                    },
                    [
                        ['internalid', s.Operator.IS, enrollmentData.academicYear]
                    ]
                );

                const studentVeraCrossId = public_searching.getSingleRecordData(
                    'customer',
                    {
                        vcId : s.createColumn({ name: 'custentity_az_acs_vc_id' }),
                        householdId : s.createColumn({ name: 'parent' }),
                        waiver: s.createColumn({ name: 'custentity_az_acs_wavier' }),
                    },
                    [
                        ['internalid', s.Operator.IS, enrollmentData.student]
                    ]
                );

                const applicantData = public_crud_handler.getAPIData(
                    '/v3/admission/applicants?applicant_id='+studentVeraCrossId.vcId
                );

                log.debug('student id', studentVeraCrossId.vcId);

                let enrollmentStatus;

                if (enrollmentData.enrollmentType == 2) {

                    const studentData = public_crud_handler.getAPIData(
                        '/v3/students/'+studentVeraCrossId.vcId
                    );
    
                    enrollmentStatus = studentData.enrollment_status;

                }


                const applicantRole = applicantData.roles;
    
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const mayFirst = new Date(Number(academicYear), 4, 1); 

                let realDate;

                if (today < mayFirst) {

                    realDate = mayFirst;

                } else {

                    realDate = today;

                }

                //realDate = new Date(2025, 10, 1);

                const augustFirst = new Date(Number(academicYear), 7, 1);
                const useBillingSchedule = realDate <= augustFirst;

                const joiningRates = public_searching.getRecordsData(
                    'customrecord_az_acs_joining_rate',
                    {
                        joiningRate: s.createColumn({ name: 'custrecord_az_acs_jr_rate' }),
                        joiningDate: s.createColumn({ name: 'custrecord_az_acs_jr_start_date' }),
                    },
                    [
                        ['isinactive', s.Operator.IS, false], 'and',
                        ['custrecord_az_acs_jr_academic_year', s.Operator.IS, recId]
                    ]
                );

                let ratePercentage = 100;
                joiningRates.forEach((rateRec) => {

                    const startDate = new Date(rateRec.joiningDate);

                    if (realDate >= startDate) {
                        ratePercentage = parseFloat(rateRec.joiningRate);
                    }
                });

                const quantityFloat = parseFloat((ratePercentage / 100).toFixed(1));
    
                // Start building the line items

                let lineItems = [];

                if (studentVeraCrossId.waiver == true) {

                    const enrollmentData = public_searching.getSingleRecordData(
                            'customrecord_az_acs_student_enrollment',
                            {
                                waiverPercentage: s.createColumn({ name: 'custrecordaz_acs_waivers_discount' }),
                                reservationAmount: s.createColumn({ name: 'custrecord_az_acs_se_reservation_amount' }),

                            },
                            [
                                ['internalid', s.Operator.IS, recId]
                            ]
                        );

                        const waiverDiscount = enrollmentData.waiverPercentage;
                        const parsedWaiverDiscount = parseFloat(waiverDiscount);
                        const waiverAmount = academicGradeRec.tutionFee * parsedWaiverDiscount / 100;

                    lineItems = [
                        { 
                            'item': academicGradeRec.tutionItem,
                            'rate': academicGradeRec.tutionFee,
                            ...(useBillingSchedule 
                                ? { billingschedule: academicYearRec.defaultBillingSchedule } 
                                : { billingschedule: '' }),
                            'quantity': quantityFloat
                         },
                         {
                            'item': lineItemData.waiverDiscount,
                            'rate': -waiverAmount,
                            'quantity': 1,
                         },
                        {
                            'item': lineItemData.reservationDeductionItem,
                            'rate': -enrollmentData.reservationAmount,
                            ...(useBillingSchedule 
                                ? { billingschedule: academicYearRec.defaultBillingSchedule } 
                                : { billingschedule: '' }),
                            //'quantity': quantityFloat
                         }
                    ];

                } else {

                    lineItems = [
                        { 
                            'item': academicGradeRec.tutionItem,
                            'rate': academicGradeRec.tutionFee,
                            ...(useBillingSchedule 
                                ? { billingschedule: academicYearRec.defaultBillingSchedule } 
                                : { billingschedule: '' }),
                            'quantity': quantityFloat
                         },
                        { 
                            'item': lineItemData.reservationDeductionItem,
                            'rate': -enrollmentData.reservationAmount,
                            ...(useBillingSchedule 
                                ? { billingschedule: academicYearRec.defaultBillingSchedule } 
                                : { billingschedule: '' }),
                            //'quantity': quantityFloat
                         }
                    ];

                }


                const amount = academicGradeRec.tutionFee * quantityFloat;
    
                if (enrollmentData.enrollmentType == 1) { // If new applicant, add capital item (&& applicantRole == 7)
                    if (studentVeraCrossId.waiver == true) {
                        
                        const enrollmentData = public_searching.getSingleRecordData(
                            'customrecord_az_acs_student_enrollment',
                            {
                                waiverPercentage: s.createColumn({ name: 'custrecordaz_acs_waivers_discount' }),
                            },
                            [
                                ['internalid', s.Operator.IS, recId]
                            ]
                        );

                        const waiverDiscount = enrollmentData.waiverPercentage;
                        const parsedWaiverDiscount = parseFloat(waiverDiscount);
                        const waiverAmount = academicYearRec.capitalFees * parsedWaiverDiscount / 100;


                        lineItems.push({ 
                            'item': lineItemData.capitalItem,
                            'rate': academicYearRec.capitalFees,
                            ...(useBillingSchedule 
                                ? { billingschedule: academicYearRec.defaultBillingSchedule } 
                                : { billingschedule: '' }),
                            'quantity': 1
                         });

                         lineItems.push({ 
                            'item': lineItemData.waiverCapitalDiscount,
                            'rate': -waiverAmount,
                            'quantity': 1,
                         });

                    } else {

                        lineItems.push({ 
                           'item': lineItemData.capitalItem,
                           'rate': academicYearRec.capitalFees,
                           ...(useBillingSchedule 
                               ? { billingschedule: academicYearRec.defaultBillingSchedule } 
                               : { billingschedule: '' }),
                           'quantity': 1
                        });                

                    }

                }
    
                // Check if there are additional items
                const checkAdditionalItem = public_searching.checkRecordsExists(
                    'customrecord_az_acs_enrollment_addition',
                    [
                        ['isinactive', s.Operator.IS, false], 'and',
                        ['custrecord_az_acs_ea_enrollment_no', s.Operator.IS, recId]
                    ]
                );
    
                if (checkAdditionalItem != false) {
                    const additionalItem = public_searching.getRecordsData(
                        'customrecord_az_acs_enrollment_addition',
                        {
                            item: s.createColumn({ name: 'custrecord_az_acs_ea_item' }),
                            annualAmount: s.createColumn({ name: 'custrecord_az_acs_ea_annual_amount' }),
                            //billingSchedule: s.createColumn({ name: 'custrecord_az_acs_ea_billing_schedule' }),
                        },
                        [
                            ['isinactive', s.Operator.IS, false], 'and',
                            ['custrecord_az_acs_ea_enrollment_no', s.Operator.IS, recId]
                        ]
                    );
    
                    if (additionalItem) {
                        additionalItem.forEach(ai => {
                            if (ai.item) {
                                lineItems.push({
                                    'item': ai.item,
                                    'rate': ai.annualAmount,
                                    'quantity': 1,
                                    ...(useBillingSchedule 
                                        ? { billingschedule: academicYearRec.defaultBillingSchedule } 
                                        : { billingschedule: '' }),
                                    });
                                }
                            });
                        }

                    }

                let salesOrderRec;

                if (enrollmentData.enrollmentType == 1 &&  (applicantRole.startsWith('Ftr Student') || applicantRole.startsWith('Student'))) { // applicantRole.includes("Ftr Student")

                    log.debug('lineItems', lineItems);
                    salesOrderRec = public_createAndUpdate.createRecordWithLines(
                        'salesorder',
                        {
                            'entity': studentVeraCrossId.householdId,
                            'custbody_az_acs_student': enrollmentData.student,
                            'trandate': realDate,
                            'custbody_az_acs_academic_grade': enrollmentData.grade,
                            'department': academicGradeRec.division,
                            'class': 7,
                            'custbody_az_acs_student_enrollment': enrollmentData.id,
                            'custbody_az_acs_academic_year': enrollmentData.academicYear,
                            'custbody_az_acs_joining_rate': amount
                        },
                        'item',
                        lineItems
                    );
                    
                } else if (enrollmentData.enrollmentType == 2 && (enrollmentStatus == 4 || enrollmentStatus == 6)) {

                    salesOrderRec = public_createAndUpdate.createRecordWithLines(
                        'salesorder',
                        {
                            'entity': studentVeraCrossId.householdId,
                            'custbody_az_acs_student': enrollmentData.student,
                            'trandate': realDate,
                            'custbody_az_acs_academic_grade': enrollmentData.grade,
                            'department': academicGradeRec.division,
                            'class': 7,
                            'custbody_az_acs_student_enrollment': enrollmentData.id,
                            'custbody_az_acs_academic_year': enrollmentData.academicYear,
                            'custbody_az_acs_joining_rate': amount
                        },
                        'item',
                        lineItems
                    );

                }

                public_createAndUpdate.submitFields(
                        'customrecord_az_acs_student_enrollment',
                        enrollmentData.id,
                        {
                            'custrecord_az_acs_se_order_no': salesOrderRec,
                            'custrecord_az_acs_se_genrte_sales_order': false
                        }
                    );
                    
            }
    
        } catch (errMap) {
            log.debug('errMap', errMap)
        }
    }


    const reduce = (context) => {
        try {

        } catch (errReduce) {
            log.debug('errReduce', errReduce)
        }
    }

    const summarize = (summary) => {
        try {

            const scriptObj = runtime.getCurrentScript();

            const recId = scriptObj.getParameter({
                name: 'custscript_mr_record_id'
            });

            public_createAndUpdate.submitFields(
                'customrecord_az_acs_academic_years',
                recId,
                {
                    'custrecord_az_acs_ay_generate_orders': false
                }
            )
        } catch (errSummarize) {
            log.debug('errSummarize', errSummarize)
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
