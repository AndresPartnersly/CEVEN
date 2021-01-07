/**
 * @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/query', 'PTLY/AndreaniUtilities', 'N/https', 'N/search', 'N/runtime', 'N/query', 'N/record'],

function(query, utilities, https, search, runtime, query, record) {

    const sublist = 'item';
    const sublistPkg = 'package';
   
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
    function beforeSubmit(scriptContext){
    
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

        const proceso = 'Andreani Crear Orden de Envio - afterSubmit';
        const script = runtime.getCurrentScript();

        log.audit(proceso, 'INICIO');

        log.debug(proceso, `56 - Remaining usage: ${script.getRemainingUsage()} - time ${new Date()}`);

        if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT)
        {
            let recId = scriptContext.newRecord.id;

            let newRecord = record.load({
                type: record.Type.ITEM_FULFILLMENT,
                id: recId,
                isDynamic: false,
            });

            if (!utilities.isEmpty(newRecord))
            {
                let oldRecord = scriptContext.oldRecord;

                let subsidiaria = newRecord.getValue({
                    fieldId: 'subsidiary'
                });

                let shipstatusNR = newRecord.getValue({
                    fieldId: 'shipstatus'
                });

                let reprocesarOE = newRecord.getValue({
                    fieldId: 'custbody_ptly_reprocesar_oe_andreani'
                });

                let estadoProcOE = newRecord.getValue({
                    fieldId: 'custbody_ptly_est_pr_oe_andreani'
                });

                log.debug(proceso, `88 - newRecord: ${JSON.stringify(newRecord)} - subsidiaria: ${subsidiaria} - shipstatusNR: ${shipstatusNR} - reprocesarOE: ${reprocesarOE} - estadoProcOE: ${estadoProcOE}`);

                log.debug(proceso, `90 - shipstatusNR: ${shipstatusNR} - reprocesarOE: ${reprocesarOE} - estadoProcOE: ${estadoProcOE}`);

                if (!utilities.isEmpty(shipstatusNR) && ((shipstatusNR == 'B' && reprocesarOE && (estadoProcOE == 1 || estadoProcOE == 2)) || (shipstatusNR == 'B' && !reprocesarOE && utilities.isEmpty(estadoProcOE))))
                {
                    let accountId = runtime.accountId;
                    let environment = runtime.envType;
                    let apiConfig = getAPIConfiguration(subsidiaria, accountId, environment);
                    let scriptParams = getParams();
                    log.debug(proceso, `98 - accountId: ${accountId} - environment: ${environment} - subsidiaria: ${subsidiaria} - shipstatusNR: ${shipstatusNR} - reprocesarOE: ${reprocesarOE} - estadoProcOE: ${estadoProcOE} - apiConfig: ${JSON.stringify(apiConfig)} - scriptParams: ${scriptParams}`);

                    if (!utilities.isEmpty(apiConfig) && apiConfig.existeConfig)
                    {
                        let idContratoAndreani = newRecord.getValue({
                            fieldId: 'custbody_ptly_contrato_list_andreani'
                        });

                        let contrato = newRecord.getValue({
                            fieldId: 'custbody_ptly_contrato_andreani'
                        });

                        if (!utilities.isEmpty(idContratoAndreani) && !utilities.isEmpty(contrato))
                        {
                            let arrayConfig = getConfigContrato(idContratoAndreani);

                            log.debug(proceso, `114 arrayConfig: ${JSON.stringify(arrayConfig)}`);

                            if (!utilities.isEmpty(arrayConfig))
                            {
                                if (arrayConfig.length > 0)
                                {
                                    let meEnv = arrayConfig[0].idmetodoenvio;
                                    let esEnvSuc = arrayConfig[0].esenvsuc;
                                    let esb2c = arrayConfig[0].esb2c;
                                    let esb2b = arrayConfig[0].esb2b;
                                    let sucId = newRecord.getValue({
                                        fieldId: 'custbody_ptly_suc_list_andreani'
                                    });
                                    let sucCod = newRecord.getValue({
                                        fieldId: 'custbody_ptly_suc_id_andreani'
                                    });

                                    if (esEnvSuc == 'T' || esEnvSuc == true)
                                        esEnvSuc = true;
                                    else
                                        esEnvSuc = false;

                                    if (esb2c == 'T' || esb2c == true)
                                        esb2c = true;
                                    else
                                        esb2c = false;

                                    if (esb2b == 'T' || esb2b == true)
                                        esb2b = true;
                                    else
                                        esb2b = false;

                                    if ((!utilities.isEmpty(sucId) && !utilities.isEmpty(sucCod) && esEnvSuc) || !esEnvSuc)
                                    {    
                                        let shipmethod = newRecord.getValue({
                                            fieldId: 'shipmethod'
                                        });
                    
                                        log.debug(proceso, `152 - meEnv: ${meEnv} - idContratoAndreani ${idContratoAndreani} - sucId: ${sucId} - contrato: ${contrato} - shipmethod: ${shipmethod}`);
                    
                                        if (meEnv == shipmethod)
                                        {
                                            let cantPackage;
                                            let location = getLocationItem(newRecord);

                                            if (!utilities.isEmpty(location))
                                            {
                                                //DATOS DEL ORIGEN
                                                let arrLocation = getOrigenLocationData(location);

                                                log.debug(proceso, `LINE 164 - FIN - time ${new Date()}  -  location: ${location} - arrLocation: ${JSON.stringify(arrLocation)}`);

                                                if ((!utilities.isEmpty(arrLocation) && arrLocation.length > 0))
                                                {
                                                    //CANTIDAD DE PAQUETES
                                                    cantPackage = newRecord.getLineCount({
                                                        sublistId: sublistPkg
                                                    });

                                                    // SI EXISTEN DATOS EN LA SUBLISTA DE PAQUETES SE LEVANTA LA INFORMACION PARA REPORTARLOS COMO BULTOS AL CREAR LA OE EN ANDREANI
                                                    if (cantPackage > 0)
                                                    {
                                                        //DATOS DE LOS BULTOS
                                                        let arrayPackage = getPackagesData(cantPackage, newRecord);

                                                        log.debug(proceso, `179 - arrayPackage: ${JSON.stringify(arrayPackage)} - FIN - time ${new Date()}`);

                                                        if (!utilities.isEmpty(arrayPackage) && arrayPackage.length> 0)
                                                        {
                                                            let idRecord = newRecord.id;

                                                            if (!utilities.isEmpty(idRecord))
                                                            {
                                                                //DATOS DEL DESTINO Y DESTINATARIO
                                                                let arrayDestino = getDestinoData(idRecord);

                                                                log.debug(proceso, `190 - arrayDestino: ${JSON.stringify(arrayDestino)} - FIN - time ${new Date()}`);

                                                                if (!utilities.isEmpty(arrayDestino) && arrayDestino.length > 0)
                                                                {
                                                                    let bodyRequest = generarBodyRequest(arrLocation, arrayDestino, arrayPackage, contrato, esEnvSuc, sucCod);
                                        
                                                                    log.debug({
                                                                        title: proceso,
                                                                        details: `198 - bodyRequest: ${JSON.stringify(bodyRequest)}`
                                                                    });

                                                                    //SE GRABA EL REQUEST A ENVIAR EN LA PETICION
                                                                    newRecord.setValue({
                                                                        fieldId: 'custbody_ptly_request_andreani',
                                                                        value: JSON.stringify(bodyRequest)
                                                                    });
                                        
                                                                    let urlCrearOE = apiConfig.crearOeURL;
                                                                    let tokenUrl = apiConfig.tokenURL;
                                                                    let token = utilities.generarToken(tokenUrl, subsidiaria, accountId, environment);

                                                                    log.debug(proceso, `211 - FIN - time ${new Date()} - token: ${token}`);

                                                                    if (!utilities.isEmpty(token))
                                                                    {
                                                                        let respCrearOE = crearOrdenEnvio(urlCrearOE, token, bodyRequest);
                
                                                                        log.debug(proceso, `217 - respCrearOE ${JSON.stringify(respCrearOE)}`);
                                            
                                                                        if (!utilities.isEmpty(respCrearOE))
                                                                        {   
                                                                            //SE GRABA EL RESPONSE DEVUELTO POR ANDREANI
                                                                            newRecord.setValue({
                                                                                fieldId: 'custbody_ptly_response_andreani',
                                                                                value: JSON.stringify(respCrearOE)
                                                                            });
                
                                                                            if (respCrearOE.code == 202)
                                                                            {
                                                                                
                                                                                let body = JSON.parse(respCrearOE.body);
                
                                                                                let arrayBultos = getBultos(body);

                                                                                log.debug(proceso, `234 - arrayBultos ${JSON.stringify(arrayBultos)}`);
                                                                                
                                                                                if (!utilities.isEmpty(arrayBultos) && body.bultos.length > 0 && cantPackage == body.bultos.length)
                                                                                {
                                                                                    let response = setAndreaniResponse(cantPackage, newRecord, arrayBultos, respCrearOE, scriptParams,  esb2c, esb2b);
                                                                                    log.debug(proceso, `response ${response}`);
                
                                                                                    if (response)
                                                                                    {   
                                                                                        let idTransaction = newRecord.save();
                                                                                        log.debug({
                                                                                            title: proceso,
                                                                                            details: `LINE 246 - Orden de Envio Andreani generada correctamente - idTransaction: ${idTransaction}`
                                                                                        });
                                                                                    }
                                                                                }
                                                                            }
                                                                            else
                                                                            {
                                                                                setAndreaniResponse(cantPackage, newRecord, '', respCrearOE, scriptParams, esb2c, esb2b);

                                                                                let idTransaction = newRecord.save();

                                                                                let mensaje = `No se obtuvo una respuesta valida del servicio de creación de Orden de Envio Andreani - Codigo de error: ${respCrearOE.code} - idTransaction: ${idTransaction}`
                                                                                log.error({
                                                                                    title: proceso,
                                                                                    details: mensaje
                                                                                });
                                                                                //logError(mensaje, newRecord, scriptParams);
                                                                            }
                
                                                                        }
                                                                    }
                                                                    else
                                                                    {
                                                                        let mensaje = `Error al generar el token para la autenticación con los servicios de Andreani - No se pudo generar Orden de Envio`
                                                                        log.error({
                                                                            title: proceso,
                                                                            details: mensaje
                                                                        });
                                                                        logError(mensaje, newRecord, scriptParams);
                                                                    }
                                                                }
                                                                else
                                                                {
                                                                    let mensaje = `No se generó la Orden de Envio Andreani ya que no se pudo recuperar el detalle del destino y destinatario`
                                                                    log.error({
                                                                        title: proceso,
                                                                        details: mensaje
                                                                    });
                                                                    logError(mensaje, newRecord, scriptParams);
                                                                }
                                                            }
                                                            else
                                                            {
                                                                let mensaje = `No se generó la Orden de Envio Andreani dado que no existe ID de transacción`
                                                                log.error({
                                                                    title: proceso,
                                                                    details: mensaje
                                                                });
                                                                logError(mensaje, newRecord, scriptParams);
                                                            }
                                                        }
                                                        else
                                                        {
                                                            let mensaje = `Error al crear arreglo de Paquetes, dato necesario para indicar los bultos en la Orden de Envio Andreani`
                                                            log.error({
                                                                title: proceso,
                                                                details: mensaje
                                                            });
                                                            logError(mensaje, newRecord, scriptParams);
                                                        }
                                                    }
                                                    else
                                                    {
                                                        let mensaje = `La transacción no tiene información en la sublista de "Paquetes / Packages", dato necesario para indicar los bultos en la Orden de Envio Andreani`
                                                        log.error({
                                                            title: proceso,
                                                            details: mensaje
                                                        });
                                                        logError(mensaje, newRecord, scriptParams);
                                                    }
                                                }
                                                else
                                                {
                                                    let mensaje = `No se pudo determinar el detalle de la Ubicación, dato necesario para indicar el origen de la Orden de Envio Andreani`
                                                    log.error({
                                                        title: proceso,
                                                        details: mensaje
                                                    });
                                                    logError(mensaje, newRecord, scriptParams);
                                                }
                                            }
                                            else
                                            {
                                                let mensaje = `No se pudo determinar el detalle de la Ubicación para indicar el remitente de la Orden de Envio, ya que el campo ubicación no tiene valor`
                                                log.error({
                                                    title: proceso,
                                                    details: mensaje
                                                });
                                                logError(mensaje, newRecord, scriptParams);
                                            }
                                        }
                                        else
                                        {
                                            let mensaje = `El metodo de envio configurado en la transacción no coincide con el metodo de envio configurado para el contrato Andreani especificado en la transacción`
                                            log.error({
                                                title: proceso,
                                                details: mensaje
                                            });
                                            logError(mensaje, newRecord, scriptParams);
                                        }
                                    }
                                    else
                                    {
                                        let mensaje = `No se puede crear Orden de Envio Andreani porque no esta configurado el ID de la sucursal`; 
                                        log.error({
                                            title: proceso,
                                            details: mensaje
                                        });
                                        logError(mensaje, newRecord, scriptParams);
                                    }
                                }
                                else
                                {
                                    let mensaje = `No se puede crear Orden de Envio Andreani porque no se pudo cargar la configuración asociada al tipo de contrato`
                                    log.error({
                                        title: proceso,
                                        details: mensaje
                                    });
                                    logError(mensaje, newRecord, scriptParams);
                                }
                            }
                            else
                            {
                                let mensaje = `No se puede crear Orden de Envio Andreani porque no se pudo cargar la configuración asociada al tipo de contrato`
                                log.error({
                                    title: proceso,
                                    details: mensaje
                                });
                                logError(mensaje, newRecord, scriptParams);
                            }
                        }
                        else
                        {
                            let mensaje = `No se puede crear Orden de Envio Andreani porque no esta configurado el contrato Andreani en la transacción`
                            log.error({
                                title: proceso,
                                details: mensaje
                            });
                            logError(mensaje, newRecord, scriptParams);
                        }
                    }
                    else
                    {
                        let mensaje = `No se puede crear Orden de Envio Andreani porque no existe configuración de la API para la combinación de Subsidiaria, Cuenta Nestsuite y Ambiente NetSuite`
                        log.error({
                            title: proceso,
                            details: mensaje
                        });
                        logError(mensaje, newRecord, scriptParams);
                    }
                }
            }
            else
            {
                let mensaje = `Error al cargar el registro para poder crear Orden de Envio Andreani`
                log.error({
                    title: proceso,
                    details: mensaje
                });
            }
        }

        log.debug(proceso, `408 - Remaining usage: ${script.getRemainingUsage()} - time ${new Date()}`);
        log.audit(proceso, 'FIN');
    }

    let getLocationItem = (record) =>
    {
        let location = null;

        //CANTIDAD DE ARTICULOS
        cantItems = record.getLineCount({
            sublistId: sublist
        });

        //SE DETERMINA EL LOCATION PARA INDICAR LOS DATOS DEL ORIGEN AL CREAR LA OE EN ANDREANI
        if (cantItems > 0)
        {
            location = record.getSublistValue({
                sublistId: sublist,
                fieldId: 'location',
                line: 0
            });
        }
        return location;
    }

    let getOrigenLocationData = (location) => 
    {
        let arrResults = [];

        let strSQL = "SELECT \n \"LOCATION\".\"ID\" AS idInterno, \n \"LOCATION\".name AS name, \n LocationMainAddress.addr1 AS addressaddr1, \n LocationMainAddress.zip AS zipCode, \n LocationMainAddress.city AS city, \n LocationMainAddress.dropdownstate AS state, \n LocationMainAddress.custrecord_l54_provincia AS idProvincia, \n locationSubsidiaryMap_SUB.legalname AS subsidiarylegalname, \n locationSubsidiaryMap_SUB.federalidnumber AS vatRegNumber, \n locationSubsidiaryMap_SUB.email AS emailSubsidiaria \nFROM \n \"LOCATION\", \n LocationMainAddress, \n (SELECT \n locationSubsidiaryMap.\"LOCATION\" AS \"LOCATION\", \n Subsidiary.legalname AS legalname, \n Subsidiary.federalidnumber AS federalidnumber, \n Subsidiary.email AS email\n FROM \n locationSubsidiaryMap, \n Subsidiary\n WHERE \n locationSubsidiaryMap.subsidiary = Subsidiary.\"ID\"\n ) locationSubsidiaryMap_SUB\nWHERE \n ((\"LOCATION\".mainaddress = LocationMainAddress.nkey(+) AND \"LOCATION\".\"ID\" = locationSubsidiaryMap_SUB.\"LOCATION\"(+)))\n AND \"LOCATION\".\"ID\" IN ('"+ location +"')\n";

        let objPagedData = query.runSuiteQLPaged({
            query: strSQL,
            pageSize: 1
        });
       
        objPagedData.pageRanges.forEach(function(pageRange) {
            //fetch
            let objPage = objPagedData.fetch({ index: pageRange.index }).data;
            // Map results to columns 
            arrResults.push.apply(arrResults, objPage.asMappedResults());
        });

        return arrResults;
    }

    let getPackagesData = (canPck, record) => {

        let arrayPackage = [];

        for (i = 0; i < canPck; i++)
        {
            let objPackage = {};

            objPackage.numeroDeBulto = i + 1;

            objPackage.kilos = record.getSublistValue({
                sublistId: sublistPkg,
                fieldId: 'packageweight',
                line: i
            });

            objPackage.dimensiones = record.getSublistValue({
                sublistId: sublistPkg,
                fieldId: 'packagedescr',
                line: i
            });

            let arrayDimensiones = objPackage.dimensiones.split('x');

            if (arrayDimensiones.length == 3)
            {
                objPackage.largo = parseFloat(arrayDimensiones[0],10);
                objPackage.ancho = parseFloat(arrayDimensiones[1],10);
                objPackage.alto = parseFloat(arrayDimensiones[2],10);
                objPackage.volumen = parseFloat((objPackage.largo * objPackage.ancho * objPackage.alto),10);
            }

            arrayPackage.push(objPackage);
        }

        return arrayPackage;
    }

    let getDestinoData = (idSO) => {

        let arrayDestino = [];

        let ssDirOrigen = search.load({
            id: 'customsearch_ptly_fullfilment_andreani',
            type: search.Type.TRANSACTION
        })

        let ssIdFilter = search.createFilter({
            name: 'internalid',
            operator: search.Operator.IS,
            values: idSO
        });

        ssDirOrigen.filters.push(ssIdFilter);

        let ssDirOrigenRun = ssDirOrigen.run();
        let ssDirOrigenRunRange = ssDirOrigenRun.getRange({
            start: 0,
            end: 1000
        }); 

        for (let j = 0; j < ssDirOrigenRunRange.length; j++)
        {
            let objeto = {};
            objeto.localidadDestino = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[4]);
            objeto.codigoPostalDestino = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[5]);
            objeto.calleDestino = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[2]);
            objeto.numeroDestino = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[2]);
            objeto.nombreCompletoDestinatario = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[7]);
            objeto.eMailDestinatario = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[8]);
            objeto.documentoTipoDestinatario = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[9]);
            objeto.documentoNumeroDestinatario = ssDirOrigenRunRange[j].getValue(ssDirOrigenRun.columns[10]);
            arrayDestino.push(objeto);
        }

        return arrayDestino;
    }


    let setAndreaniResponse = (canPck, record, arrayBultos, respObj, scriptParams, esb2c, esb2b) => {

        let procesado = false;
        log.debug('LINE 536 - setAndreaniResponse', `canPck: ${canPck} - record: ${JSON.stringify(record)} - arrayBultos: ${JSON.stringify(arrayBultos)} - respObj: ${JSON.stringify(respObj)}`);
        log.debug('LINE 537 - setAndreaniResponse', `respObj.code: ${respObj.code} - scriptParams: ${scriptParams} - esb2c: ${esb2c} - esb2b: ${esb2b} - arrayBultos[0].numeroDeEnvio: ${arrayBultos[0].numeroDeEnvio}`);
        if (respObj.code == 202)
        {
            for (i = 0; i < canPck; i++)
            {
                let objPackage = {};
                let value = '';

                objPackage.numeroDeBulto = i;

                if (esb2c && !esb2b)
                    value = arrayBultos[i].numeroDeEnvio;
                else
                    value = arrayBultos[i].numeroDeBulto;

                if(!utilities.isEmpty(value))
                {
                    objPackage.kilos = record.setSublistValue({
                        sublistId: sublistPkg,
                        fieldId: 'packagetrackingnumber',
                        line: i,
                        value: value
                    });
                }
            }

            record.setValue({
                fieldId: 'custbody_cant_bultos',
                value: canPck
            });

            record.setValue({
                fieldId: 'custbody_l54_valor_declarado',
                value: 100.00
            });

            record.setValue({
                fieldId: 'custbody_ptly_est_pr_oe_andreani',
                value: scriptParams.estadoProcOK
            });

            record.setValue({
                fieldId: 'custbody_ptly_reprocesar_oe_andreani',
                value: false
            });

            record.setValue({
                fieldId: 'custbody_ptly_resp_err_det_andreani',
                value: ''
            });

            if (esb2b)
            {
                record.setValue({
                    fieldId: 'custbody_ptly_nro_env_b2b',
                    value: arrayBultos[0].numeroDeEnvio
                }); 
            }

            procesado = true;
        }
        else
        {
            let body = JSON.parse(respObj.body);

            log.debug('LINE 602 - setAndreaniResponse', `respObj.body: ${respObj.body}`);

            record.setValue({
                fieldId: 'custbody_ptly_est_pr_oe_andreani',
                value: scriptParams.estadoProcError
            });

            record.setValue({
                fieldId: 'custbody_ptly_resp_err_det_andreani',
                value: body
            });

            record.setValue({
                fieldId: 'custbody_ptly_reprocesar_oe_andreani',
                value: false
            });

            procesado = true;
        }

        return procesado;
    }
	    
	let crearOrdenEnvio = (urlReq, tokenReq, bodyReq) => {

		if (!utilities.isEmpty(urlReq))
		{
			if (!utilities.isEmpty(tokenReq))
			{
				log.debug('crearOrdenEnvio',`LINE 631 - url: ${urlReq} - token: ${tokenReq} - body: ${JSON.stringify(bodyReq)}`);

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
					details: `LINE 647 - response: ${JSON.stringify(response)}`
				});

				if (!utilities.isEmpty(response))
				{
					if (response.code == 200 || response.code == 202)
					{                      
                        responseObj = response;
                        log.debug({
                            title: 'crearOrdenEnvio',
                            details: `LINE 657 - response.body: ${JSON.stringify(response)}`
                        });
					}
					else
					{
						log.error({
							title: 'crearOrdenEnvio',
							details: `crearOrdenEnvio - Error al invocar servicio, codigo de error: ${response.code}`
                        });

                        responseObj = response;
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
    
    let getConfig = (subsidiaria) =>
    {
        let arrResults = [];

        let strSQL = "SELECT custrecord_ptly_cot_andreani_cod_cli AS codigoCliente, custrecord_ptly_cot_andreani_con_env_dom AS contratoEnviDom, " +
        "custrecord_ptly_cot_andreani_con_env_urg AS contratoEnvioUrgDom, custrecord_ptly_cot_andreani_env_suc AS contratoEnvioSuc, " +
        "custrecord_ptly_cot_andreani_me_env_dom AS meEnv, custrecord_ptly_cot_andreani_me_env_urg AS meEnvUrgDom, " +
        "custrecord_ptly_cot_andreani_me_env_suc AS meEnvSuc FROM customrecord_ptly_cot_andreani " +
        "WHERE custrecord_ptly_cot_andreani_sub = "+ subsidiaria +"\n";

        let objPagedData = query.runSuiteQLPaged({
            query: strSQL,
            pageSize: 1
        });
        
        objPagedData.pageRanges.forEach(function(pageRange) {
            //fetch
            let objPage = objPagedData.fetch({ index: pageRange.index }).data;
            // Map results to columns 
            arrResults.push.apply(arrResults, objPage.asMappedResults());
        });

        return arrResults;
    }

    let getConfigContrato = (idContrato) =>
    {
        let arrResults = [];

        let strSQL = "SELECT \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.\"ID\" AS idinterno, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.name AS nombre, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.custrecord_ptly_contr_andreani_me AS idmetodoenvio, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.custrecord_ptly_contr_andreani_env_suc AS esenvsuc, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.custrecord_ptly_contr_andreani_b2c AS esb2c, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.custrecord_ptly_contr_andreani_b2b AS esb2b, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.custrecord_ptly_contr_andreani_nro AS nrocontrato \nFROM \n CUSTOMRECORD_PTLY_CONTR_ANDREANI\nWHERE \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.\"ID\" = '" + idContrato +"'\n";

        let objPagedData = query.runSuiteQLPaged({
            query: strSQL,
            pageSize: 1
        });
        
        objPagedData.pageRanges.forEach(function(pageRange) {
            //fetch
            let objPage = objPagedData.fetch({ index: pageRange.index }).data;
            // Map results to columns 
            arrResults.push.apply(arrResults, objPage.asMappedResults());
        });

        return arrResults;
    }

    let getAPIConfiguration = (subsidiaria, accountId, environment) => {

        let objeto = {};
        objeto.existeConfig = false;

        let ssAPIConfig = search.load({
            id: 'customsearch_ptly_api_config_andreani'
        })

        let ssSubsidiariaFilter = search.createFilter({
            name: 'custrecord_ptly_url_api_andreani_sub',
            operator: search.Operator.IS,
            values: subsidiaria
        });

        let ssAccountFilter = search.createFilter({
            name: 'custrecord_ptly_url_api_andreani_ns_acct',
            operator: search.Operator.IS,
            values: accountId
        });

        let ssEnvironmentFilter = search.createFilter({
            name: 'custrecord_ptly_url_api_andreani_ns_env',
            operator: search.Operator.IS,
            values: environment
        });

        ssAPIConfig.filters.push(ssSubsidiariaFilter);
        ssAPIConfig.filters.push(ssAccountFilter);
        ssAPIConfig.filters.push(ssEnvironmentFilter);

        let ssAPIConfigRun = ssAPIConfig.run();
        let ssAPIConfigRunRange = ssAPIConfigRun.getRange({
            start: 0,
            end: 1000
        }); 

        for (let j = 0; j < ssAPIConfigRunRange.length; j++)
        {
            objeto.usuario = ssAPIConfigRunRange[j].getValue(ssAPIConfigRun.columns[0]);
            objeto.subsidiaria = ssAPIConfigRunRange[j].getValue(ssAPIConfigRun.columns[1]);
            objeto.cuentaNS = ssAPIConfigRunRange[j].getValue(ssAPIConfigRun.columns[2]);
            objeto.ambienteNS = ssAPIConfigRunRange[j].getValue(ssAPIConfigRun.columns[3]);
            objeto.contrasena = ssAPIConfigRunRange[j].getValue(ssAPIConfigRun.columns[4]);
            objeto.tokenURL = ssAPIConfigRunRange[j].getValue(ssAPIConfigRun.columns[5]);
            objeto.cotizadorURL = ssAPIConfigRunRange[j].getValue(ssAPIConfigRun.columns[6]);
            objeto.crearOeURL = ssAPIConfigRunRange[j].getValue(ssAPIConfigRun.columns[7]);
            objeto.imprimierEtiqURL = ssAPIConfigRunRange[j].getValue(ssAPIConfigRun.columns[8]);
            objeto.existeConfig = true;
        }

        return objeto;
    }

    let getParams = () => {
        
        let response = { error: false, mensaje:'', contextocrear:'', contextomodificar:'' };
        
        try {
            var currScript = runtime.getCurrentScript();
            response.estadoProcOK = currScript.getParameter('custscript_ptly_crear_oe_andreani_ep_ok');
            response.estadoProcError = currScript.getParameter('custscript_ptly_crear_oe_andreani_ep_err');
        } catch (e) {
            response.error = true;
            response.mensaje = "Netsuite Error - Excepción: " + e.message;
        }

        return response;
    }


    let generarBodyRequest = (arrLocation, arrayDestino, arrayPackage, contrato, esEnvSuc, sucCod) => {

        //let expReg = /[^0-9.]+/g;

        let bodyRequest = {};
        
        //CONTRATO
        bodyRequest.contrato = contrato;

        // DATOS ORIGEN POSTAL
        bodyRequest.origen = {};
        bodyRequest.origen.postal = {};
        bodyRequest.origen.postal.codigoPostal = arrLocation[0].zipcode;
        bodyRequest.origen.postal.localidad = arrLocation[0].city;
        bodyRequest.origen.postal.calle = getCalle(arrLocation[0].addressaddr1);
        bodyRequest.origen.postal.numero = getNumeroCalle(arrLocation[0].addressaddr1);

        // DATOS DEL REMITENTE
        bodyRequest.remitente = {};
        bodyRequest.remitente.nombreCompleto = arrLocation[0].subsidiarylegalname;
        bodyRequest.remitente.eMail = arrLocation[0].emailsubsidiaria;
        bodyRequest.remitente.documentoTipo = 'CUIT';
        bodyRequest.remitente.documentoNumero = arrLocation[0].vatregnumber;

        if (esEnvSuc)
        {
            // DATOS DESTINO SUCURSAL
            bodyRequest.destino = {};
            bodyRequest.destino.sucursal = {};
            bodyRequest.destino.sucursal.id = sucCod;                                                  
        }
        else
        {
            // DATOS DESTINO POSTAL
            bodyRequest.destino = {};
            bodyRequest.destino.postal = {};
            bodyRequest.destino.postal.codigoPostal = arrayDestino[0].codigoPostalDestino;
            bodyRequest.destino.postal.localidad = arrayDestino[0].localidadDestino;
            bodyRequest.destino.postal.calle = getCalle(arrayDestino[0].calleDestino);
            bodyRequest.destino.postal.numero = getNumeroCalle(arrayDestino[0].numeroDestino)
        }

        // DATOS DESTINATARIO
        bodyRequest.destinatario = [];
        let destinatarioObjet = {};
        destinatarioObjet.nombreCompleto = arrayDestino[0].nombreCompletoDestinatario;
        destinatarioObjet.eMail = arrayDestino[0].eMailDestinatario;
        destinatarioObjet.documentoTipo = arrayDestino[0].documentoTipoDestinatario;
        destinatarioObjet.documentoNumero = arrayDestino[0].documentoNumeroDestinatario;
        bodyRequest.destinatario.push(destinatarioObjet);

        // DATOS DE LOS BULTOS
        bodyRequest.bultos = [];

        for (let i = 0; i < arrayPackage.length; i++)
        {
            let bultosObjet = {};
            bultosObjet.kilos = arrayPackage[i].kilos;
            bultosObjet.volumenCm = arrayPackage[i].volumen;
            bultosObjet.largoCm = arrayPackage[i].largo;
            bultosObjet.altoCm = arrayPackage[i].alto;
            bultosObjet.anchoCm = arrayPackage[i].ancho;
            bodyRequest.bultos.push(bultosObjet);
        }

        return bodyRequest;
    }

    let getNumeroCalle = (valueStr) =>
    {
        let nroCalle = '';

        let arrayTmp = valueStr.split(' ');
        let arrayTmpLength = arrayTmp.length;

        if (arrayTmpLength > 1)
        {
            nroCalle = arrayTmp[arrayTmpLength-1];
        }

        return nroCalle;

    }

    let getCalle = (valueStr) =>
    {
        let calle = '';

        let arrayTmp = valueStr.split(' ');
        let arrayTmpLength = arrayTmp.length;

        if (arrayTmpLength > 1)
        {
            for (i = 0; i < arrayTmpLength-1; i++)
            {
                calle += arrayTmp[i] + ' ';
            }
        }

        return calle;
    }

    let logError = (mensaje, record, scriptParams) => {

        try
        {
            //CANTIDAD DE PAQUETES
            let canPck = record.getLineCount({
                sublistId: sublistPkg
            });

            for (i = 0; i < canPck; i++)
            {
                record.setSublistValue({
                    sublistId: sublistPkg,
                    fieldId: 'packagetrackingnumber',
                    line: i,
                    value: ''
                });
            }

            record.setValue({
                fieldId: 'custbody_ptly_resp_err_det_andreani',
                value: mensaje
            });

            record.setValue({
                fieldId: 'custbody_ptly_reprocesar_oe_andreani',
                value: false
            });

            record.setValue({
                fieldId: 'custbody_ptly_est_pr_oe_andreani',
                value: scriptParams.estadoProcError
            });

            return true;
        }
        catch(e)
        {
            return false;
        }
    }

    let getBultos = (bulto) => {

        let arrayBultos = [];

        if (!utilities.isEmpty(bulto.bultos))
        {
            for (let i =0; i < bulto.bultos.length; i++)
            {
                let objeto = {};
                objeto.numeroDeBulto = bulto.bultos[i].numeroDeBulto;
                objeto.numeroDeEnvio = bulto.bultos[i].numeroDeEnvio;
                arrayBultos.push(objeto);
            }
        }
        return arrayBultos;
    }

    return {
        afterSubmit: afterSubmit
    };
    
});
