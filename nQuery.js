/**
 * @NApiVersion 2.x
 */
require(['N/query'], function(query) {

        var myLoadedQuery = query.load({

            id: 'custdataset11'
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


"SELECT \n \"LOCATION\".\"ID\" AS idInterno, \n \"LOCATION\".name AS name, \n LocationMainAddress.addr1 AS addressaddr1, \n LocationMainAddress.zip AS zipCode, \n LocationMainAddress.city AS city, \n LocationMainAddress.dropdownstate AS state, \n LocationMainAddress.custrecord_l54_provincia AS idProvincia \nFROM \n \"LOCATION\", \n LocationMainAddress\nWHERE \n \"LOCATION\".mainaddress = LocationMainAddress.nkey(+)\n AND \"LOCATION\".\"ID\" IN ('806')\n";
"SELECT \n \"LOCATION\".\"ID\" AS idInterno, \n \"LOCATION\".name AS name, \n LocationMainAddress.addr1 AS addressaddr1, \n LocationMainAddress.zip AS zipCode, \n LocationMainAddress.city AS city, \n LocationMainAddress.dropdownstate AS state, \n LocationMainAddress.custrecord_l54_provincia AS idProvincia, \n locationSubsidiaryMap_SUB.legalname AS subsidiarylegalname, \n locationSubsidiaryMap_SUB.federalidnumber AS vatRegNumber, \n locationSubsidiaryMap_SUB.email AS emailSubsidiaria \nFROM \n \"LOCATION\", \n LocationMainAddress, \n (SELECT \n locationSubsidiaryMap.\"LOCATION\" AS \"LOCATION\", \n Subsidiary.legalname AS legalname, \n Subsidiary.federalidnumber AS federalidnumber, \n Subsidiary.email AS email\n FROM \n locationSubsidiaryMap, \n Subsidiary\n WHERE \n locationSubsidiaryMap.subsidiary = Subsidiary.\"ID\"\n ) locationSubsidiaryMap_SUB\nWHERE \n ((\"LOCATION\".mainaddress = LocationMainAddress.nkey(+) AND \"LOCATION\".\"ID\" = locationSubsidiaryMap_SUB.\"LOCATION\"(+)))\n AND \"LOCATION\".\"ID\" IN ('806')\n";
