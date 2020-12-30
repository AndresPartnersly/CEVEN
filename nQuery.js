/**
 * @NApiVersion 2.x
 */
require(['N/query'], function(query) {

        var myLoadedQuery = query.load({

            id: 'custdataset18'
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
