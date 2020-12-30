/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', 'N/ui/dialog', 'N/query', 'N/search', 'N/https'],

function(currentRecord, url, dialog, query, search, https) {
    
    function fieldChanged(scriptContext) {

        var title = 'Mensaje';

        if(scriptContext.fieldId == 'state') {

            var objRecord = scriptContext.currentRecord;
            var state = objRecord.getValue({
                fieldId: 'state'
            });

            alert('getProvincia - LINE 20 - state: '+state);

            if (!isEmpty(state))
            {
                var idState = getIdState(state);

                alert('getProvincia - LINE 26 - idState: '+idState);

                if (!isEmpty(idState))
                {
                    var idProvincia = getProvincia(idState);

                    alert('getProvincia - LINE 32 - idProvincia: '+idProvincia);

                    if (!isEmpty(idProvincia))
                    {   
                        objRecord.setValue({
                            fieldId: 'custrecord_l54_provincia',
                            value: idProvincia
                        });
                    }
                    else
                    {
                        alert('fieldChanged - LINE 42 - No se pudo completar la provincia porque se obtuvo un valor nulo para la misma');
                    }
                }
                else
                {
                    alert('fieldChanged - LINE 47 - No se pudo completar la provincia porque se obtuvo un valor nulo para el estado');
                }
            }
            alert('getProvincia - LINE 43');
        }
    }

    // OBTIENE EL ID DE LA PROVINCIA A PARTIR DEL ID DEL STATE
    function getProvincia (state)
    {
        var strSQL = "SELECT \n CUSTOMRECORD_L54_SIC_CODIGO_PROVINCIA.\"ID\" AS idprovincia, \n CUSTOMRECORD_L54_SIC_CODIGO_PROVINCIA.name AS nameprovincia \nFROM \n CUSTOMRECORD_L54_SIC_CODIGO_PROVINCIA\nWHERE \n CUSTOMRECORD_L54_SIC_CODIGO_PROVINCIA.custrecord_l54_sic_codigo_prov_provincia = "+ state +"\n";
        var idProvincia = null;

        alert('getProvincia - LINE 53 - strSQL: '+strSQL);

        try
        {
            var objPagedData = query.runSuiteQLPaged({
                query: strSQL,
                pageSize: 1
            });
    
            var arrResults = [];
            
            objPagedData.pageRanges.forEach(function(pageRange) {
                //fetch
                var objPage = objPagedData.fetch({ index: pageRange.index }).data;
                // Map results to columns 
                arrResults.push.apply(arrResults, objPage.asMappedResults());
            });

            if (!isEmpty(arrResults) && arrResults.length > 0)
            {
                idProvincia = arrResults[0].idprovincia;
            }

            return idProvincia;
        }
        catch(e)
        {
            alert('getProvincia - Error inesperado a determinar el id de la provincia - Detalles: '+JSON.stringify(e));
        }
    }

    //OBTIENE EL ID DEL STATE A PARTIR DEL SHORT NAME
    function getIdState (state)
    {
        try
        {
            var idState = null;

            var ssState = search.load({
                id: 'customsearch_ptly_addr_form'
            })

            var ssIdFilter = search.createFilter({
                name: 'shortname',
                operator: search.Operator.IS,
                values: state
            });

            ssState.filters.push(ssIdFilter);

            var ssStateRun = ssState.run();
            var ssStateRunRange = ssStateRun.getRange({
                start: 0,
                end: 1000
            }); 

            for (var j = 0; j < ssStateRunRange.length; j++)
            {
                idState = ssStateRunRange[j].getValue(ssStateRun.columns[0]);
            }
        }
        catch(e)
        {
            alert('getIdState - Error inesperado a determinar el id del estado - Detalles: '+JSON.stringify(e));
        }

        return idState;
    }

         
    function isEmpty(value) {

        if (value === '')
        {
            return true;
        }

        if (value === null)
        {
            return true;
        }

        if (value === undefined)
        {
            return true;
        }
        
        if (value === 'undefined')
        {
            return true;
        }

        if (value === 'null')
        {
            return true;
        }

        return false;
    }

    return {
        fieldChanged: fieldChanged
    };
    
});