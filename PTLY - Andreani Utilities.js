// FUNCTION: isEmpty
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
 define(['N/https'],


 function(https) {


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
    
	let generarToken = (urlLogin) => {

		const proceso = `generarToken`;

		let XAuthorizationToken = ``;

		let headers = {'Authorization': 'Basic Y2V2ZW5fd3M6U0NKS0w0MjEyMGR3'};
		let response = https.get({
			url: urlLogin,
			headers: headers
		});

		log.debug({
			title: 'generarToken',
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

	let cotizarEnvio = (url, token) => {

		const proceso = `cotizarEnvio`;

		if (!isEmpty(url))
		{
			if (!isEmpty(token))
			{
				log.debug({
					title: proceso,
					details: `url: ${url} - token: ${token}`
				});

				let responseObj = {};
				let headers = {'x-authorization-token': `Basic ${token}`};
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

     return {
         isEmpty: isEmpty,
		 generarToken: generarToken,
		 cotizarEnvio: cotizarEnvio
     };
 });