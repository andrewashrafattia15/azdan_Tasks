/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/search', 'N/ui/serverWidget', 'N/runtime', 'N/record', 'N/format', 'N/task'],
    function (search, serverWidget, runtime, record, format, task) {

        function onRequest(context) {
            try {
                let request = context.request;
                let response = context.response;
                let params = request.parameters;

                var userObj = runtime.getCurrentUser();
                var roleId = userObj.role;


                if (request.method == 'GET') {

                    //#region Start Create Form
                    var form = serverWidget.createForm({
                        title: 'Create WHT Report'
                    });

                    {
                        // Filters
                        form.addFieldGroup({
                            id: 'filters_group',
                            label: 'Filters'
                        });


                        let from = form.addField({
                            id: 'custpage_from',
                            label: 'From',
                            type: serverWidget.FieldType.DATE,
                            container: 'filters_group'
                        });
                        // from.isMandatory = true;
                        from.defaultValue = params.from ? params.from : null

                        let to = form.addField({
                            id: 'custpage_to',
                            label: 'To',
                            type: serverWidget.FieldType.DATE,
                            container: 'filters_group'
                        });
                        // from.isMandatory = true;
                        to.defaultValue = params.to ? params.to : null

                        if (roleId == 3) { // Adminstrator

                            let subsidiaryField = form.addField({
                                id: 'custpage_subsidiary',
                                label: 'Subsidiary',
                                type: serverWidget.FieldType.SELECT,
                                source: 'subsidiary',
                                container: 'filters_group'
                            });
                            subsidiaryField.isMandatory = true;
                            subsidiaryField.defaultValue = params.subId ? params.subId : null

                        }

                        else {

                            // search for role subsidiary
                            let data = getRoleSubsidiary(roleId);

                            let subsidiaryField = form.addField({
                                id: 'custpage_subsidiary',
                                label: 'Subsidiary',
                                type: serverWidget.FieldType.SELECT,
                                // source: 'subsidiary',
                                container: 'filters_group'
                            });

                            subsidiaryField.addSelectOption({
                                value: '',
                                text: '',
                                isSelected: false
                            });

                            for (var s = 0; s < data.length; s++) {

                                var subsidiary = data[s].getText('subsidiaries');
                                var subsidiaryVal = data[s].getValue('subsidiaries');

                                subsidiaryField.addSelectOption({
                                    value: subsidiaryVal,
                                    text: subsidiary,
                                    isSelected: false
                                });

                            }

                            subsidiaryField.isMandatory = true;
                            subsidiaryField.defaultValue = params.subId ? params.subId : null

                        }

                    }

                    form.addSubmitButton({
                        label: "Submit",
                    });

                    response.writePage({
                        pageObject: form
                    });

                    //  form.clientScriptModulePath = 'SuiteScripts/azs_cs_createwhtreport.js';

                }

                // post 
                else {
                    log.debug('tets', 'test')

                    let request = context.request;
                    let response = context.response;
                    let params = request.parameters;


                    var subsidiary = params.custpage_subsidiary;
                    var fromDate = params.custpage_from;
                    var toDate = params.custpage_to;

                    log.debug('subsidiary', subsidiary)
                    log.debug('fromDate', fromDate)
                    log.debug('toDate', toDate)

                    var scriptTask = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT
                    });
                    scriptTask.scriptId = 'customscript_azs_ss_createwhtreport';
                    scriptTask.deploymentId = 'customdeploy_azs_ss_createwhtreport';
                    scriptTask.params = {
                        'custscript_sub': subsidiary,
                        'custscript_from': fromDate,
                        'custscript_to': toDate
                    };
                    scriptTask.submit();

                    response.write("<script>document.write('Loading ...'); window.open('https://6248479-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1022&deploy=1&whence=&from=" + fromDate + "&to=" + toDate + "&subId=" + subsidiary + "','_top'); </script>");

                }

            }
            catch (err) {
                log.debug('err', err)
            }
        }

        // search for role subsidiary

        const getRoleSubsidiary = (roleId) => {

            try {

                var srch = search.create({
                    type: 'role',
                    filters: ['internalid', search.Operator.IS, roleId],

                    columns: ['subsidiaries'],
                });

                var result = getAllResults(srch);

                if (result != null && result != '') {

                    return result;
                }

                else {

                    return false;
                }


            } catch (error) {

                log.debug({
                    title: 'error in search for role subsidiary',
                    details: error
                });

            }

        }
        // get All Results
        const getAllResults = (s) => {
            var results = s.run();
            var searchResults = [];
            var searchid = 0;
            do {
                var resultslice = results.getRange({ start: searchid, end: searchid + 1000 });
                resultslice.forEach(function (slice) {
                    searchResults.push(slice);
                    searchid++;
                }
                );
            } while (resultslice.length >= 1000);
            return searchResults;
        }

        return {
            onRequest: onRequest
        }
    })