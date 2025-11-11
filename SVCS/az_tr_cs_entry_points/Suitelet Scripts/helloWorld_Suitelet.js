/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([], function() {
    function onRequest(context) {
        var html = '<html><body><h1>Hello World</h1></body></html>';
        
        context.response.setHeader({
            name: 'Custom-Header-Demo',
            value: 'Demo'
        });

        context.response.write(html);
    }

    return {
        onRequest: onRequest
    };
});
