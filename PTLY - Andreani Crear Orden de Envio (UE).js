/**
 * @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/query', 'PTLY/AndreaniUtilities', 'N/https', 'N/search', 'N/runtime', 'N/query'],

function(query, utilities, https, search, runtime, query) {

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
    function beforeSubmit(scriptContext) {

        const proceso = 'Andreani Crear Orden de Envio - beforeSubmit';
        const script = runtime.getCurrentScript();

        log.audit(proceso, 'INICIO');

        log.debug(proceso, `43 - Remaining usage: ${script.getRemainingUsage()} - time ${new Date()}`);

        if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT)// || scriptContext.type == scriptContext.UserEventType.PACK)// || scriptContext.type == scriptContext.UserEventType.COPY)
        {
            let newRecord = scriptContext.newRecord;
            let oldRecord = scriptContext.oldRecord;

            let contrato = newRecord.getValue({
                fieldId: 'custbody_ptly_contrato_andreani'
            });

            let sucId = newRecord.getValue({
                fieldId: 'custbody_ptly_suc_id_andreani'
            });

            let subsidiaria = newRecord.getValue({
                fieldId: 'subsidiary'
            });

            let shipmethod = newRecord.getValue({
                fieldId: 'shipmethod'
            });

            let idContratoAndreani = newRecord.getValue({
                fieldId: 'custbody_ptly_contrato_list_andreani'
            });

            let esEnvioSuc = false;

            let arrayConfig = getConfigContrato(idContratoAndreani);

            log.debug(proceso, `74 arrayConfig: ${JSON.stringify(arrayConfig)}`);

            if (!utilities.isEmpty(arrayConfig))
            {
                if (arrayConfig.length > 0)
                {
                    let meEnvDom = arrayConfig[0].idmetodoenvio;

                    log.debug(proceso, `77 - meEnvDom: ${meEnvDom} - idContratoAndreani ${idContratoAndreani} - subsidiaria: ${subsidiaria} - sucId: ${sucId} - contrato: ${contrato} - shipmethod: ${shipmethod} - arrayConfig: ${JSON.stringify(arrayConfig)}`);

                    if (meEnvDom == shipmethod)
                    {
                        // SI EL METODO DE ENVIO ES ENVIO A SUCURSAL ANDREANI Y LA TRANSACCION TIENE ID SUCURSAL ANDREANI CONFIGURADO
                        /*if (meEnvSuc == shipmethod)
                            esEnvioSuc = true;*/

                        if ((!utilities.isEmpty(sucId) && esEnvioSuc) || !esEnvioSuc)
                        {
                            if (!utilities.isEmpty(contrato))
                            {
                                let shipstatusOR;
                                let shipstatusNR = newRecord.getValue({
                                    fieldId: 'shipstatus'
                                });

                                if (!isEmpty(oldRecord))
                                {
                                    shipstatusOR = oldRecord.getValue({
                                        fieldId: 'shipstatus'
                                    });
                                }

                                log.debug({
                                    title: proceso,
                                    details: `shipstatusNR: ${shipstatusOR} - shipstatusOR: ${shipstatusNR}`
                                });

                                if (((!utilities.isEmpty(shipstatusOR) && !utilities.isEmpty(shipstatusNR)) && (shipstatusOR == 'A' && shipstatusNR == 'B')) || ((utilities.isEmpty(shipstatusOR) && !utilities.isEmpty(shipstatusNR) && shipstatusNR == 'B')))
                                {
                                    let expReg = /[^0-9.]+/g;
                                    let cantItems;
                                    let cantPackage;
                                    let location = getLocationItem(newRecord);

                                    log.debug({
                                        title: proceso,
                                        details: `newRecord: ${JSON.stringify(newRecord)}`
                                    });

                                    if (!utilities.isEmpty(location))
                                    {
                                        //DATOS DEL ORIGEN
                                        log.debug(proceso, `126 - INICIO - time ${new Date()}`);
                                        let arrLocation = getOrigenLocationData(location);
                                        log.debug(proceso, `128 - FIN - time ${new Date()}  -  location: ${location} - arrLocation: ${JSON.stringify(arrLocation)}`);

                                        log.debug({
                                            title: proceso,
                                            details: `LINE 132 location: ${location} -  arrLocation: ${JSON.stringify(arrLocation)}`
                                        });

                                        if ((!utilities.isEmpty(arrLocation.length) && arrLocation.length > 0))
                                        {
                                            //CANTIDAD DE PAQUETES
                                            cantPackage = newRecord.getLineCount({
                                                sublistId: sublistPkg
                                            });

                                            // SI EXISTEN DATOS EN LA SUBLISTA DE PAQUETES SE LEVANTA LA INFORMACION PARA REPORTARLOS COMO BULTOS AL CREAR LA OE EN ANDREANI
                                            if (cantPackage > 0)
                                            {
                                                //DATOS DE LOS BULTOS
                                                log.debug(proceso, `146 - INICIO - time ${new Date()}`);
                                                let arrayPackage = getPackagesData(cantPackage, newRecord);
                                                log.debug(proceso, `148 - FIN - time ${new Date()}`);

                                                log.debug({
                                                    title: proceso,
                                                    details: `LINE 152 arrayPackage: ${JSON.stringify(arrayPackage)}`
                                                });

                                                if (!utilities.isEmpty(arrayPackage) && arrayPackage.length> 0)
                                                {
                                                    let idRecord = newRecord.id;

                                                    if (!utilities.isEmpty(idRecord))
                                                    {
                                                        //DATOS DEL DESTINO Y DESTINATARIO
                                                        log.debug(proceso, `137 - INICIO - time ${new Date()}`);
                                                        let arrayDestino = getDestinoData(idRecord);
                                                        log.debug(proceso, `139 - FIN - time ${new Date()}`);

                                                        log.debug({
                                                            title: proceso,
                                                            details: `arrayDestino: ${JSON.stringify(arrayDestino)}`
                                                        });

                                                        let bodyRequest = {};
                                                        bodyRequest.contrato = contrato;
                            
                                                        // DATOS ORIGEN POSTAL
                                                        bodyRequest.origen = {};
                                                        bodyRequest.origen.postal = {};
                                                        bodyRequest.origen.postal.codigoPostal = arrLocation[0].zipcode;
                                                        bodyRequest.origen.postal.localidad = arrLocation[0].state;
                                                        bodyRequest.origen.postal.calle = arrLocation[0].addressaddr1;
                                                        bodyRequest.origen.postal.numero = arrLocation[0].addressaddr1.replace(expReg,'');

                                                        // DATOS DEL REMITENTE
                                                        bodyRequest.remitente = {};
                                                        bodyRequest.remitente.nombreCompleto = arrLocation[0].subsidiarylegalname;
                                                        bodyRequest.remitente.eMail = arrLocation[0].emailsubsidiaria;
                                                        bodyRequest.remitente.documentoTipo = 'CUIT';
                                                        bodyRequest.remitente.documentoNumero = arrLocation[0].vatregnumber;
                            
                                                        if (esEnvioSuc)
                                                        {
                                                            // DATOS DESTINO SUCURSAL
                                                            bodyRequest.destino = {};
                                                            bodyRequest.destino.sucursal = {};
                                                            bodyRequest.destino.sucursal.id = sucId;                                                  
                                                        }
                                                        else
                                                        {
                                                            // DATOS DESTINO POSTAL
                                                            bodyRequest.destino = {};
                                                            bodyRequest.destino.postal = {};
                                                            bodyRequest.destino.postal.codigoPostal = arrayDestino[0].codigoPostalDestino;
                                                            bodyRequest.destino.postal.localidad = arrayDestino[0].localidadDestino;
                                                            bodyRequest.destino.postal.calle = arrayDestino[0].calleDestino;
                                                            bodyRequest.destino.postal.numero = arrayDestino[0].numeroDestino.replace(expReg,'');
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
                            
                                                        log.debug({
                                                            title: proceso,
                                                            details: `245 - bodyRequest: ${JSON.stringify(bodyRequest)}`
                                                        });

                                                        newRecord.setValue({
                                                            fieldId: 'custbody_ptly_request_andreani',
                                                            value: JSON.stringify(bodyRequest)
                                                        });
                            
                                                        let url = `https://api.andreani.com/v2/ordenes-de-envio`;
                                                        log.debug(proceso, `249 - INICIO - time ${new Date()}`);
                                                        let token = utilities.generarToken('https://api.andreani.com/login');
                                                        log.debug(proceso, `251 - FIN - time ${new Date()} - token: ${token}`);

                                                        if (!utilities.isEmpty(token))
                                                        {
                                                            log.debug(proceso, `253 - INICIO - time ${new Date()}`);
                                                            let respCrearOE = crearOrdenEnvio(url, token, bodyRequest);
                                                            log.debug(proceso, `255 - FIN - time ${new Date()}`);
    
                                                            log.debug(proceso, `257 - respCrearOE ${JSON.stringify(respCrearOE)}`);
                                
                                                            if (!utilities.isEmpty(respCrearOE))
                                                            {   
    
                                                                newRecord.setValue({
                                                                    fieldId: 'custbody_ptly_response_andreani',
                                                                    value: JSON.stringify(respCrearOE)
                                                                });
    
                                                                if (respCrearOE.code == 202)
                                                                {
                                                                    let body = JSON.parse(respCrearOE.body);
                                                                    let arrayBultos = [];
    
                                                                    if (!utilities.isEmpty(body.bultos))
                                                                    {
                                                                        for (let i =0; i < body.bultos.length; i++)
                                                                        {
                                                                            let objeto = {};
                                                                            objeto.numeroDeBulto = body.bultos[i].numeroDeBulto;
                                                                            objeto.numeroDeEnvio = body.bultos[i].numeroDeEnvio;
                                                                            arrayBultos.push(objeto);
                                                                        }
                                                                    }
    
                                                                    log.debug(proceso, `277 - arrayBultos ${JSON.stringify(arrayBultos)}`);
                                                                    
                                                                    if (!utilities.isEmpty(arrayBultos) && body.bultos.length > 0 && cantPackage == body.bultos.length)
                                                                    {
                                                                        log.debug(proceso, `281 - INICIO - time ${new Date()}`);
                                                                        let response = setAndreaniResponse(cantPackage, newRecord, arrayBultos);
                                                                        log.debug(proceso, `283 - FIN - time ${new Date()}`);
    
                                                                        if (response)
                                                                        {
                                                                            log.debug({
                                                                                title: proceso,
                                                                                details: `Orden de Envio Andreani generada correctamente`
                                                                            });

                                                                            let url = 'https://api.andreani.com/v2/ordenes-de-envio/360000036144540/etiquetas';

                                                                            let etiquetaResp = utilities.generarEtiqueta(url, token);
                                                                                                                                           
                                                                            log.audit(proceso, `LINE 296 - etiquetaResp: +${JSON.stringify(etiquetaResp)}`);
                                                                        }
                                                                    }
                                                                }
                                                                else
                                                                {
                                                                    log.error({
                                                                        title: proceso,
                                                                        details: `No se obtuvo una respuesta valida del servicio de creación de Orden de Envio Andreani - Codigo de error: ${respCrearOE.code}`
                                                                    });
                                                                }
    
                                                            }
                                                        }
                                                        else
                                                        {
                                                            log.error({
                                                                title: proceso,
                                                                details: `Error al generar el token para la autenticación con los servicios de Andreani`
                                                            });
                                                        }
                                                    }
                                                    else
                                                    {
                                                        log.error({
                                                            title: proceso,
                                                            details: `No se pudo obtener los datos del destino y destinatario, dato necesario para indicar en la Orden de Envio Andreani`
                                                        });
                                                    }
                                                }
                                                else
                                                {
                                                    log.error({
                                                        title: proceso,
                                                        details: `Error al crear arreglo de Paquetes, dato necesario para indicar los bultos en la Orden de Envio Andreani`
                                                    });
                                                }
                                            }
                                            else
                                            {
                                                log.error({
                                                    title: proceso,
                                                    details: `La transacción no tiene información en la sublista de "Paquetes / Packages", dato necesario para indicar los bultos en la Orden de Envio Andreani`
                                                });
                                            }
                                        }
                                        else
                                        {
                                            log.error({
                                                title: proceso,
                                                details: `No se pudo determinar el detalle de la Ubicación, dato necesario para indicar el origen de la Orden de Envio Andreani`
                                            });
                                        }

                                    }
                                    else
                                    {
                                        log.error({
                                            title: proceso,
                                            details: `No se pudo determinar el ID de la Ubicación, dato necesario para indicar el origen de la Orden de Envio Andreani`
                                        });
                                    }
                                }
                            }
                            else
                            {
                                log.error({
                                    title: proceso,
                                    details: `No se puede crear Orden de Envio Andreani porque no existe numero de contrato asociado a la transacción`
                                });
                            }
                        }
                        else
                        {
                            log.error({
                                title: proceso,
                                details: `No se puede crear Orden de Envio Andreani porque no esta configurado el ID de la sucursal`
                            });
                        }
                    }
                }
                else
                {
                    log.error({
                        title: proceso,
                        details: `No se puede crear Orden de Envio Andreani porque no se pudo cargar configuración asociada a la subsidiaria`
                    });
                }
            }
        }

        log.debug(proceso, `294 - Remaining usage: ${script.getRemainingUsage()} - time ${new Date()}`);
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

    function getLocationItem(record)
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

        //let strSQL = "SELECT \n \"LOCATION\".\"ID\" AS idInterno, \n \"LOCATION\".name AS name, \n LocationMainAddress.addr1 AS addressaddr1, \n LocationMainAddress.zip AS zipCode, \n LocationMainAddress.city AS city, \n LocationMainAddress.dropdownstate AS state, \n LocationMainAddress.custrecord_l54_provincia AS idProvincia \nFROM \n \"LOCATION\", \n LocationMainAddress\nWHERE \n \"LOCATION\".mainaddress = LocationMainAddress.nkey(+)\n AND \"LOCATION\".\"ID\" IN ('"+ location +"')\n";
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


    let setAndreaniResponse = (canPck, record, arrayBultos) => {

        try
        {
            for (i = 0; i < canPck; i++)
            {
                let objPackage = {};

                objPackage.numeroDeBulto = i;

                objPackage.kilos = record.setSublistValue({
                    sublistId: sublistPkg,
                    fieldId: 'packagetrackingnumber',
                    line: i,
                    value: arrayBultos[i].numeroDeEnvio
                });
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
                fieldId: 'custbody_ptly_oe_generada_andreani',
                value: true
            });

            return true;
        }
        catch(e)
        {
            return false;
        }
    }
	    
	let crearOrdenEnvio = (urlReq, tokenReq, bodyReq) => {

		if (!utilities.isEmpty(urlReq))
		{
			if (!utilities.isEmpty(tokenReq))
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

				if (!utilities.isEmpty(response))
				{
					if (response.code == 200 || response.code == 202)
					{                      
                        responseObj = response;
                        log.debug({
                            title: 'crearOrdenEnvio',
                            details: `LINE 520 - response.body: ${JSON.stringify(response)}`
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
        "custrecord_ptly_cot_andreani_me_env_dom AS meEnvDom, custrecord_ptly_cot_andreani_me_env_urg AS meEnvUrgDom, " +
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

        let strSQL = "SELECT \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.\"ID\" AS idinterno, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.name AS nombre, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.custrecord_ptly_contr_andreani_me AS idmetodoenvio, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.custrecord_ptly_contr_andreani_nro AS nrocontrato \nFROM \n CUSTOMRECORD_PTLY_CONTR_ANDREANI\nWHERE \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.\"ID\" = '" + idContrato +"'\n";

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

    return {
        //beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
        //afterSubmit: afterSubmit*/
    };
    
});
