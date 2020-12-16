/**
 * @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/query', 'PTLY/AndreaniUtilities', 'N/https', 'N/search'],

function(query, utilities, https, search) {
   
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

        let token = utilities.generarToken('https://api.qa.andreani.com/login');

        log.debug({
            title: proceso,
            details: `token: ${JSON.stringify(token)}`
        });

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
                let localidadDestino;
                let codigoPostalDestino;
                let calleDestino;
                let numeroDestino;

                // DATOS DESTINATARIO
                let nombreCompletoDestinatario;
                let eMailDestinatario;
                let documentoTipoDestinatario;
                let documentoNumeroDestinatario;;

                let createdFromId =  newRecord.getValue({
                    fieldId: 'createdfrom'
                });

                log.debug({
                    title: proceso,
                    details: `LINE 166 - createdFromId: ${createdFromId}`
                });

                let ssDirOrigen = search.load({
                    id: 'customsearch_ptly_so_andreani',
                    type: search.Type.TRANSACTION
                })

                // Filtro subsidiaria
                var ssIdFilter = search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.IS,
                    values: createdFromId
                });
                ssDirOrigen.filters.push(ssIdFilter);

                var ssDirOrigenRun = ssDirOrigen.run();
                var ssDirOrigenRunRange = ssDirOrigenRun.getRange({
                    start: 0,
                    end: 1000
                }); 

                log.debug(proceso, "LINE 188 - ssDirOrigenRunRange.length: "+ ssDirOrigenRunRange.length);

                for (var j = 0; j < ssDirOrigenRunRange.length; j++)
                {
                    localidadDestino = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[4]);
                    codigoPostalDestino = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[5]);
                    calleDestino = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[2]);
                    numeroDestino = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[2]);
                    nombreCompletoDestinatario = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[7]);
                    eMailDestinatario = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[8]);
                    documentoTipoDestinatario = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[9]);
                    documentoNumeroDestinatario = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[10]);
                }

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

                bodyRequest.remitente = {};
                bodyRequest.remitente.nombreCompleto = 'CEVEN SA';
                bodyRequest.remitente.eMail = 'andres.brito@partnersly.com';
                bodyRequest.remitente.documentoTipo = 'CUIT';
                bodyRequest.remitente.documentoNumero = '30696692951';

                bodyRequest.destinatario = [];
                let destinatarioObjet = {};
                destinatarioObjet.nombreCompleto = nombreCompletoDestinatario;
                destinatarioObjet.eMail = eMailDestinatario;
                destinatarioObjet.documentoTipo = documentoTipoDestinatario;
                destinatarioObjet.documentoNumero = documentoNumeroDestinatario;
                bodyRequest.destinatario.push(destinatarioObjet);

                bodyRequest.bultos = [];
                let bultosObjet = {};
                bultosObjet.kilos = 10;
                bultosObjet.volumenCm = 1000;

                bodyRequest.bultos.push(bultosObjet);
                
                log.debug({
                    title: proceso,
                    details: `bodyRequest: ${JSON.stringify(bodyRequest)}`
                });

                let url = `https://api.qa.andreani.com/v2/ordenes-de-envio`;
                let token = generarToken2();

                log.debug({
                    title: proceso,
                    details: `LINE 223 - token: ${token}`
                });

				let respCrearOE = crearOrdenEnvio(url, token, bodyRequest);

				if (!isEmpty(respCrearOE))
				{
					log.debug({
						title: proceso,
						details: JSON.stringify(respCrearOE.body)
					});

					if (respCrearOE.code == 200)
					{
						/*let body = JSON.parse(respEnvioDomicilio.body);
						let objeto = {};
						objeto.tipoEnvio = 1;
						objeto.meEnvio = context.request.parameters.custpage_me_env_dom;
						objeto.tipoEnvioNombre = 'Envio a domicilio';
						objeto.body = body;
						arrayResumen.push(objeto);*/
					}
				}

                
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

	let generarToken2 = () => {

		let XAuthorizationToken = ``;

		let headers = {'Authorization': 'Basic Y2V2ZW5fd3M6U0NKS0w0MjEyMGR3'};
		let response = https.get({
			url: 'https://api.qa.andreani.com/login',
			headers: headers
		});

		log.debug({
			title: 'LINE 169',
			details: JSON.stringify(response)
		})

		if (!isEmpty(response))
		{
			if (response.code == 200)
			{
				XAuthorizationToken = response.headers["X-Authorization-token"];
				
			}
			else
			{
				log.error({
					title: proceso,
					details: `generarToken - Error al generar token, codigo de error: ${response.code}`
				});
			}
		}
		else
		{
			log.error({
				title: proceso,
				details: `generarToken - Response vacio`
			});

			return XAuthorizationToken;
		}

		return XAuthorizationToken;
	}
    
	let crearOrdenEnvio = (urlReq, tokenReq, bodyReq) => {

		if (!isEmpty(urlReq))
		{
			if (!isEmpty(tokenReq))
			{
				log.debug({
					title: 'crearOrdenEnvio',
					details: `url: ${urlReq} - token: ${tokenReq} - body: ${JSON.stringify(bodyReq)}`
				});

				let responseObj = {};
                let headers = {
                    'content-type': 'application/json',
                    'x-authorization-token': `${tokenReq}`
                };

				let response = https.post({
					url: urlReq,
                    headers: headers,
                    body: JSON.stringify(bodyReq)
                });

				log.debug({
					title: 'crearOrdenEnvio',
					details: `LINE 336 - response: ${JSON.stringify(response)}`
				});

				if (!isEmpty(response))
				{
					if (response.code == 200)
					{                      
                        let body = JSON.parse(response.body);
                        log.debug({
                            title: 'crearOrdenEnvio',
                            details: `LINE 336 - response.body: ${response.body}`
                        });
					}
					else
					{
						log.error({
							title: 'crearOrdenEnvio',
							details: `crearOrdenEnvio - Error al invocar servicio, codigo de error: ${response.code}`
						});
					}
				}
				else
				{
					log.error({
						title: 'crearOrdenEnvio',
						details: `crearOrdenEnvio - Response vacio`
					});

					return responseObj;
				}

				return responseObj;
			}
			else
			{
				log.error({
					title: 'crearOrdenEnvio',
					details: `crearOrdenEnvio - No se recibio el parametro: Token`
				});
			}
		}
		else
		{
			log.error({
				title: 'crearOrdenEnvio',
				details: `crearOrdenEnvio - No se recibio el parametro: URL`
			});
		}
	}

    return {
        //beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
        //afterSubmit: afterSubmit*/
    };
    
});
