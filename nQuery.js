/**
 * @NApiVersion 2.x
 */
require(['N/query'], function(query) {

        var myLoadedQuery = query.load({

            id: 'custdataset19'
        });

        var squery = myLoadedQuery.toSuiteQL();

        log.debug({
            title: 'LINE 14',
            details: 'myLoadedQuery: '+JSON.stringify(myLoadedQuery)
        });

        log.debug({
            title: 'LINE 19',
            details: 'squery: '+JSON.stringify(squery)
        });

        var results = myLoadedQuery.run();

        log.debug({
            title: 'LINE 26',
            details: 'results: '+JSON.stringify(results)
        });
    
});

`SELECT \n BUILTIN_RESULT.TYPE_STRING(paymentMethod.name) AS nameRAW /*{name#RAW}*/\nFROM \n paymentMethod, \n \"ACCOUNT\"\nWHERE \n paymentMethod.\"ACCOUNT\" = \"ACCOUNT\".\"ID\"(+)\n AND ((\"ACCOUNT\".custrecord_ptly_receipt_bank_transfer = 'T' AND paymentMethod.\"ID\" = 54`
