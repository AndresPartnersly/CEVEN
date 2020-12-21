/**
 * @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/query', 'PTLY/AndreaniUtilities', 'N/https', 'N/search', 'N/runtime'],

function(query, utilities, https, search, runtime) {

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

        if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT || scriptContext.type == scriptContext.UserEventType.PACK)// || scriptContext.type == scriptContext.UserEventType.COPY)
        {

            let newRecord = scriptContext.newRecord;
            let oldRecord = scriptContext.oldRecord;

            let contrato = newRecord.getValue({
                fieldId: 'custbody_ptly_contrato_andreani'
            });

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
                    //let contrato = '400006709';
                    let location;
                    let cantItems;
                    let cantPackage;

                    log.debug({
                        title: proceso,
                        details: `newRecord: ${JSON.stringify(newRecord)}`
                    });

                    //CANTIDAD DE ARTICULOS
                    cantItems = newRecord.getLineCount({
                        sublistId: sublist
                    });

                    //SE DETERMINA EL LOCATION PARA INDICAR LOS DATOS DEL ORIGEN AL CREAR LA OE EN ANDREANI
                    if (cantItems > 0)
                    {
                        location = newRecord.getSublistValue({
                            sublistId: sublist,
                            fieldId: 'location',
                            line: 0
                        });
                    }

                    if (!utilities.isEmpty(location))
                    {
                        //DATOS DEL ORIGEN
                        log.debug(proceso, `98 - INICIO - time ${new Date()}`);
                        let arrLocation = getOrigenLocationData(location);
                        log.debug(proceso, `100 - FIN - time ${new Date()}  -  arrLocation: ${JSON.stringify(arrLocation)}`);

                        log.debug({
                            title: proceso,
                            details: `LINE 104 location: ${location} -  arrLocation: ${JSON.stringify(arrLocation)}`
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
                                log.debug(proceso, `118 - INICIO - time ${new Date()}`);
                                let arrayPackage = getPackagesData(cantPackage, newRecord);
                                log.debug(proceso, `120 - FIN - time ${new Date()}`);

                                log.debug({
                                    title: proceso,
                                    details: `LINE 124 arrayPackage: ${JSON.stringify(arrayPackage)}`
                                });

                                if (!utilities.isEmpty(arrayPackage) && arrayPackage.length> 0)
                                {

                                    let createdFromId =  newRecord.getValue({
                                        fieldId: 'createdfrom'
                                    });

                                    if (!utilities.isEmpty(createdFromId))
                                    {
                                        //DATOS DEL DESTINO Y DESTINATARIO
                                        log.debug(proceso, `137 - INICIO - time ${new Date()}`);
                                        let arrayDestino = getDestinoData(createdFromId);
                                        log.debug(proceso, `139 - FIN - time ${new Date()}`);

                                        log.debug({
                                            title: proceso,
                                            details: `arrayDestino: ${JSON.stringify(arrayDestino)}`
                                        });

                                        let bodyRequest = {};
                                        bodyRequest.contrato = contrato;
            
                                        // DATOS ORIGEN
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
            
                                        // DATOS DESTINO
                                        bodyRequest.destino = {};
                                        bodyRequest.destino.postal = {};
                                        bodyRequest.destino.postal.codigoPostal = arrayDestino[0].codigoPostalDestino;
                                        bodyRequest.destino.postal.localidad = arrayDestino[0].localidadDestino;
                                        bodyRequest.destino.postal.calle = arrayDestino[0].calleDestino;
                                        bodyRequest.destino.postal.numero = arrayDestino[0].numeroDestino.replace(expReg,'');
            
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
                                            bultosObjet.volumenCm = arrayPackage[i].kilos;
                                            bodyRequest.bultos.push(bultosObjet);
                                        }
            
                                        log.debug({
                                            title: proceso,
                                            details: `bodyRequest: ${JSON.stringify(bodyRequest)}`
                                        });
            
                                        let url = `https://api.qa.andreani.com/v2/ordenes-de-envio`;
                                        log.debug(proceso, `198 - INICIO - time ${new Date()}`);
                                        let token = utilities.generarToken('https://api.qa.andreani.com/login');
                                        log.debug(proceso, `200 - FIN - time ${new Date()}`);
            
                                        log.debug(proceso, `202 - INICIO - time ${new Date()}`);
                                        let respCrearOE = crearOrdenEnvio(url, token, bodyRequest);
                                        log.debug(proceso, `204 - FIN - time ${new Date()}`);

                                        log.debug(proceso, `206 - respCrearOE ${respCrearOE}`);
            
                                        if (!utilities.isEmpty(respCrearOE))
                                        {   
                                            if (respCrearOE.code == 200 || respCrearOE.code == 202)
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

                                                log.debug(proceso, `226 - arrayBultos ${JSON.stringify(arrayBultos)}`);
                                                
                                                if (!utilities.isEmpty(arrayBultos) && body.bultos.length > 0 && cantPackage == body.bultos.length)
                                                {
                                                    log.debug(proceso, `230 - INICIO - time ${new Date()}`);
                                                    let response = setAndreaniResponse(cantPackage, newRecord, arrayBultos);
                                                    log.debug(proceso, `233 - FIN - time ${new Date()}`);

                                                    if (response)
                                                    {
                                                        log.debug({
                                                            title: proceso,
                                                            details: `Orden de Envio Andreani generada correctamente`
                                                        });
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

            objPackage.numeroDeBulto = i;

            objPackage.kilos = record.getSublistValue({
                sublistId: sublistPkg,
                fieldId: 'packageweight',
                line: i
            });

            objPackage.volumen = record.getSublistValue({
                sublistId: sublistPkg,
                fieldId: 'packagedescr',
                line: i
            });

            arrayPackage.push(objPackage);
        }

        return arrayPackage;
    }

    let getDestinoData = (idSO) => {

        let arrayDestino = [];

        let ssDirOrigen = search.load({
            id: 'customsearch_ptly_so_andreani',
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

    return {
        //beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
        //afterSubmit: afterSubmit*/
    };
    
});
