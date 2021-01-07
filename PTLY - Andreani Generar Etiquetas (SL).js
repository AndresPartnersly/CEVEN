/** @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/configuration.json
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/file', 'N/search', 'PTLY/AndreaniUtilities'],

function(https, file, search, utilities) {

	const proceso = 'Andreani Generar Etiquetas - Suitelet';
	const sublistPkg = 'package';

	function onRequest(context) {

		if (context.request.method == 'GET') {

			if (!utilities.isEmpty(context.request.parameters.idPackage))
			{
				if (!utilities.isEmpty(context.request.parameters.tranid))
				{
					if (!utilities.isEmpty(context.request.parameters.subsidiaria))
					{
						if (!utilities.isEmpty(context.request.parameters.accountId))
						{
							if (!utilities.isEmpty(context.request.parameters.environment))
							{
								let idPackage = context.request.parameters.idPackage;
								let tranid = context.request.parameters.tranid;
								let subsidiaria = context.request.parameters.subsidiaria;
								let accountId = context.request.parameters.accountId;
								let environment = context.request.parameters.environment;
							
								log.audit(proceso, `LINE 33 - idPackage: ${idPackage} - tranid: ${tranid} - subsidiaria: ${subsidiaria} - accountId: ${accountId} - environment: ${environment}`);

								let apiConfig = getAPIConfiguration(subsidiaria, accountId, environment);

								log.audit(proceso, `LINE 37 - apiConfig: ${JSON.stringify(apiConfig)}`);

								if (!utilities.isEmpty(apiConfig))
								{
									let tokenUrl = apiConfig.tokenURL;
									let token = utilities.generarToken(tokenUrl);

									log.debug(proceso, `LINE 44 token: ${token}`);

									if (!utilities.isEmpty(token))
									{
										var headers = {"x-authorization-token": ""+token+""};
										let nroEnvio = idPackage;
										let url = apiConfig.imprimierEtiqURL.replace('{param}',nroEnvio);

										log.audit(proceso, `LINE 52 - url: ${url}`);

										let response = https.get({
											url: url,
											headers: headers
										});
										
										log.audit(proceso, 'LINE 59 - response: '+JSON.stringify(response));

										let contenidoPDF = response.body;

										let archivo = file.create({
											name: `${tranid}-${nroEnvio}.pdf`,
											description: `Etiqueta Bulto Andreani NetSuite Fullfilment ${tranid} Numero de Envio Andreani: ${nroEnvio}`,
											fileType: file.Type.PDF,
											contents: contenidoPDF
										});

										context.response.writeFile({
											file: archivo
										});
									}
									else
									{
										var objRespuesta = {};
										objRespuesta.error = true;
										objRespuesta.mensaje = 'Error al generar el token para invocar al servicio de generación de etiqueta Andreani';
						
										var resp = JSON.stringify(objRespuesta);
										context.response.writeLine(resp);
									}
								}
								else
								{
									var objRespuesta = {};
									objRespuesta.error = true;
									objRespuesta.mensaje = 'No se encontró configuración de la API Andreani asociada a los parametros recibidos';
					
									var resp = JSON.stringify(objRespuesta);
									context.response.writeLine(resp);
								}
							}
							else
							{
								var objRespuesta = {};
								objRespuesta.error = true;
								objRespuesta.mensaje = 'No se recibió el parametro de environment para cargar la configuración de la API Andreani';
				
								var resp = JSON.stringify(objRespuesta);
								context.response.writeLine(resp);
							}
						}
						else
						{
							var objRespuesta = {};
							objRespuesta.error = true;
							objRespuesta.mensaje = 'No se recibió el parametro de accountId para cargar la configuración de la API Andreani';
			
							var resp = JSON.stringify(objRespuesta);
							context.response.writeLine(resp);
						}
					}
					else
					{
						var objRespuesta = {};
						objRespuesta.error = true;
						objRespuesta.mensaje = 'No se recibió el parametro de subsidiaria para cargar la configuración de la API Andreani';
		
						var resp = JSON.stringify(objRespuesta);
						context.response.writeLine(resp);
					}
				}
				else
				{
					var objRespuesta = {};
					objRespuesta.error = true;
					objRespuesta.mensaje = 'No se recibió el parametro del tranid para asociar al nombre del archivo PDF de la etiqueta a generar';
	
					var resp = JSON.stringify(objRespuesta);
					context.response.writeLine(resp);
				}
			}
			else
			{
				var objRespuesta = {};
				objRespuesta.error = true;
				objRespuesta.mensaje = 'No se recibió el parametro del idPackage para asociar al nombre del archivo PDF de la etiqueta a generar';

				var resp = JSON.stringify(objRespuesta);
				context.response.writeLine(resp);
			}
		}
	}


    let getAPIConfiguration = (subsidiaria, accountId, environment) => {

        let objeto = {};

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
        }

        return objeto;
    }

    return {
        onRequest: onRequest
	};
	
});