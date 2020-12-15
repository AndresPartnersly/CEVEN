/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/query'],

function(query) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {

        const proceso = 'Andreani Crear Orden de Envio - beforeLoad';

        log.audit(proceso, 'INICIO');

        /*const dataParams = getParams();

        log.debug(proceso, 'dataParams: '+JSON.stringify(dataParams));

        if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT || scriptContext.type == scriptContext.UserEventType.COPY)
        {
            let form = scriptContext.form;

            form.clientScriptModulePath = './PTLY - Andreani Cotizar Envio (CL).js';

            form.addButton({
                id: 'custpage_call_stl',
                label: 'Cotizador Andreani',
                functionName: 'callPopUp()'
            });

			//CODIGO CLIENTE ANDREANI
			let custpage_empresaTransporte = form.addField({
				id:'custpage_empresatransporte',
				label:'Andreani Empresa Transportista',
				type: serverWidget.FieldType.TEXT
			});

			custpage_empresaTransporte.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.HIDDEN
			});	

            custpage_empresaTransporte.defaultValue = dataParams.empresaTransporte;
        }*/
        log.audit(proceso, 'FIN');
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

        const proceso = 'Andreani Crear Orden de Envio - beforeSubmit';
        const sublist = 'item';

        log.audit(proceso, 'INICIO');

        //const dataParams = getParams();

        //log.debug(proceso, 'dataParams: '+JSON.stringify(dataParams));

        if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT)// || scriptContext.type == scriptContext.UserEventType.COPY)
        {
            let expReg = /[^0-9.]+/g;
            let newRecord = scriptContext.newRecord;
            let contrato = '400006709';
            let location;

            log.debug({
                title: proceso,
                details: `newRecord: ${JSON.stringify(newRecord)}`
            });

            let cantItems = newRecord.getLineCount({
                sublistId: sublist
            });

            log.debug({
                title: proceso,
                details: `cantItems: ${JSON.stringify(cantItems)}`
            });

            if (cantItems > 0)
            {
                location = newRecord.getSublistValue({
                    sublistId: sublist,
                    fieldId: 'location',
                    line: 0
                });
            }

            if (!isEmpty(location))
            {
                let strSQL = "SELECT \n \"LOCATION\".\"ID\" AS idInterno, \n \"LOCATION\".name AS name, \n LocationMainAddress.addr1 AS addressaddr1, \n LocationMainAddress.zip AS zipCode, \n LocationMainAddress.city AS city, \n LocationMainAddress.dropdownstate AS state, \n LocationMainAddress.custrecord_l54_provincia AS idProvincia \nFROM \n \"LOCATION\", \n LocationMainAddress\nWHERE \n \"LOCATION\".mainaddress = LocationMainAddress.nkey(+)\n AND \"LOCATION\".\"ID\" IN ('"+ location +"')\n";

                var objPagedData = query.runSuiteQLPaged({
                    query: strSQL,
                    pageSize: 1
                });

                // Paging 
                var arrResults = [];
                
                objPagedData.pageRanges.forEach(function(pageRange) {
                    //fetch
                    var objPage = objPagedData.fetch({ index: pageRange.index }).data;
                    // Map results to columns 
                    arrResults.push.apply(arrResults, objPage.asMappedResults());
                });

                log.debug({
                    title: proceso,
                    details: `location: ${location} -  arrResults: ${JSON.stringify(arrResults)} strSQL: ${strSQL}`
                });
            }
            else
            {
                log.error({
                    title: proceso,
                    details: `No se pudo obtener de la ubicación para poder completar los datos del origen de la Orden de Envio Andreani`
                });
            }

            if (!isEmpty(arrResults) && arrResults.length > 0)
            {
                // DATOS ORIGEN
                let localidadOrigen =  arrResults[0].state;

                let codigoPostalOrigen =  arrResults[0].zipcode;

                let calleOrigen =   arrResults[0].addressaddr1;

                let numeroOrigen =  arrResults[0].addressaddr1;

                // DATOS DESTINO
                let localidadDestino =  newRecord.getValue({
                    fieldId: 'shipstate'
                });

                let codigoPostalDestino =  newRecord.getValue({
                    fieldId: 'shipzip'
                });

                let calleDestino =  newRecord.getValue({
                    fieldId: 'shipaddress'
                });
                
                let numeroDestino =  newRecord.getValue({
                    fieldId: 'shipaddress'
                });

                let bodyRequest = {};
                bodyRequest.contrato = contrato;

                bodyRequest.origen = {};
                bodyRequest.origen.postal = {};
                bodyRequest.origen.postal.codigoPostal = codigoPostalOrigen;
                bodyRequest.origen.postal.localidad = localidadOrigen;
                bodyRequest.origen.postal.calle = calleOrigen;
                bodyRequest.origen.postal.numero = numeroOrigen.replace(expReg,'');
                
                bodyRequest.destino = {};
                bodyRequest.destino.postal = {};
                bodyRequest.destino.postal.codigoPostal = codigoPostalDestino;
                bodyRequest.destino.postal.localidad = localidadDestino;
                bodyRequest.destino.postal.calle = calleDestino;
                bodyRequest.destino.postal.numero = numeroDestino.replace(expReg,'');
                
                log.debug({
                    title: proceso,
                    details: `bodyRequest: ${JSON.stringify(bodyRequest)}`
                });
                
            }
        }
        log.audit(proceso, 'FIN');

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {

    }

    /*function getParams() {
        
        var response = { error: false, mensaje:'', contextocrear:'', contextomodificar:'' };
        
        try {
            var currScript = runtime.getCurrentScript();
            response.empresaTransporte = currScript.getParameter('custscript_ptly_cotizador_ue_empresa_b2c');
        } catch (e) {
            response.error = true;
            response.mensaje = "Netsuite Error - Excepción: " + e.message;
        }

        return response;
    }*/

    let isEmpty = (value) => {

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
        //beforeLoad: beforeLoad/*,
        beforeSubmit: beforeSubmit
        //afterSubmit: afterSubmit*/
    };
    
});
