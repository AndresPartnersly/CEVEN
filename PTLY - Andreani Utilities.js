// FUNCTION: isEmpty
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
 define(['N/https', 'N/encode', 'N/search'],


 function(https, encode, search) {


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
    
	let generarToken = (urlLogin, subsidiaria, accountId, environment) => {

		const proceso = `generarToken`;

		let XAuthorizationToken = ``;

		let apiConfig = getAPIConfiguration(subsidiaria, accountId, environment);

		if (!isEmpty(apiConfig) && apiConfig.existeConfig)
		{
			let usuario = apiConfig.usuario;
			let contrasena = apiConfig.contrasena;

			let encodeCredenciales = encode.convert({
				string: `${usuario}:${contrasena}`,
				inputEncoding: encode.Encoding.UTF_8,
				outputEncoding: encode.Encoding.BASE_64
			});

			log.debug({
				title: 'generarToken',
				details: `LINE 63 - usuario ${usuario} - contrasena: ${contrasena} - encodeCredenciales: ${encodeCredenciales}`
			})			

			//let headers = {'Authorization': 'Basic Y2V2ZW5fd3M6U0NKS0w0MjEyMGR3'};
			let headers = {
				'Authorization': `Basic ${encodeCredenciales}`
			};
			let response = https.get({
				url: urlLogin,
				headers: headers
			});
	
			log.debug({
				title: 'generarToken',
				details: `LINE 77 - RESPONSE: ${JSON.stringify(response)}`
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
		}

		return XAuthorizationToken;
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

	let cotizarEnvio = (url, token) => {

		const proceso = `cotizarEnvio`;

		if (!isEmpty(url))
		{
			if (!isEmpty(token))
			{
				log.debug({
					title: proceso,
					details: `LINE 173 - url: ${url} - token: ${token}`
				});

				let responseObj = {};
				let headers = {'x-authorization-token': `${token}`};
				let response = https.get({
					url: url,
					headers: headers
				});

				if (!isEmpty(response))
				{
					if (response.code == 200)
					{
						responseObj = response;
					}
					else
					{
						log.error({
							title: proceso,
							details: `cotizarEnvio - Error al invocar servicio, codigo de error: ${response.code}`
						});
					}
				}
				else
				{
					log.error({
						title: proceso,
						details: `cotizarEnvio - Response vacio`
					});

					return responseObj;
				}

				return responseObj;
			}
			else
			{
				log.error({
					title: proceso,
					details: `cotizarEnvio - No se recibio el parametro: Token`
				});
			}
		}
		else
		{
			log.error({
				title: proceso,
				details: `cotizarEnvio - No se recibio el parametro: URL`
			});
		}
	}


	let generarEtiqueta = (url, token) => {

		const proceso = `generarEtiqueta`;

		if (!isEmpty(url))
		{
			if (!isEmpty(token))
			{
				log.debug({
					title: proceso,
					details: `LINE 237 - url: ${url} - token: ${token}`
				});

				let responseObj = {};
				let headers = {'x-authorization-token': `${token}`};
				let response = https.get({
					url: url,
					headers: headers
				});
                                                                                                                                           
				log.audit(proceso, `LINE 293 - headers: +${JSON.stringify(headers)}`);

				if (!isEmpty(response))
				{
					if (response.code == 200)
					{
						responseObj = response;
					}
					else
					{
						log.error({
							title: proceso,
							details: `generarEtiqueta - Error al invocar servicio, codigo de error: ${response.code}`
						});

						responseObj = response;
					}
				}
				else
				{
					log.error({
						title: proceso,
						details: `generarEtiqueta - Response vacio`
					});

					return responseObj;
				}

				return responseObj;
			}
			else
			{
				log.error({
					title: proceso,
					details: `generarEtiqueta - No se recibio el parametro: Token`
				});
			}
		}
		else
		{
			log.error({
				title: proceso,
				details: `generarEtiqueta - No se recibio el parametro: URL`
			});
		}
	}

     return {
         isEmpty: isEmpty,
		 generarToken: generarToken,
		 cotizarEnvio: cotizarEnvio,
		 generarEtiqueta: generarEtiqueta
     };
 });