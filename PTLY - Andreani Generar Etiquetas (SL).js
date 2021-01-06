/** @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/configuration.json
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/file', 'N/record', 'PTLY/AndreaniUtilities'],

function(https, file, record, utilities) {

	const proceso = 'Andreani Generar Etiquetas - Suitelet';
	const sublistPkg = 'package';

	function onRequest(context) {

		if (context.request.method == 'GET') {

			if (!utilities.isEmpty(context.request.parameters.idPackage)) {

				let idPackage = context.request.parameters.idPackage;
				
				log.audit(proceso, `LINE 21 - idPackage: ${idPackage}`);

				/*let recordItemfullfilment = record.load({
					type: record.Type.ITEM_FULFILLMENT,
					id: idFullfilment,
					isDynamic: true
				});

				log.audit(proceso, `LINE 32 - recordItemfullfilment: ${JSON.stringify(recordItemfullfilment)}`);*/

				/*if (!utilities.isEmpty(recordItemfullfilment))
				{*/
					//let arrayPackage = getPackagesData(recordItemfullfilment);

					//log.debug(proceso, `LINE 38 - arrayPackage ${JSON.stringify(arrayPackage)}`);

					let token = utilities.generarToken('https://api.andreani.com/login');

					log.debug({
						title: proceso,
						details: `LINE 41 token: ${token}`
					});

					/*if (!utilities.isEmpty(arrayPackage) && arrayPackage.length> 0)
					{*/
						if (!utilities.isEmpty(token))
						{
							var headers = {"x-authorization-token": ""+token+""};
							log.audit(proceso, `LINE 52 -headers: +${JSON.stringify(headers)}`);
							let contenidoPDF = '';

							/*for (i = 0; i < arrayPackage.length; i++)
							{*/
								let nroEnvio = idPackage;//arrayPackage[i];
								let url = `https://api.andreani.com/v2/ordenes-de-envio/${nroEnvio}/etiquetas`;

								let response = https.get({
									url: url,
									headers: headers
								});
								
								log.audit(proceso, 'LINE 62 - response: '+JSON.stringify(response));

								contenidoPDF = response.body;

								let archivo = file.create({
									name: `${nroEnvio}.pdf`,
									description: 'Etiqueta Bulto Andreani',
									fileType: file.Type.PDF,
									contents: contenidoPDF
								});
	
								context.response.writeFile({
									file: archivo
								});

								//log.debug(proceso, 'LINE 77 - indice: '+i+' - response: ' + JSON.stringify(response));
								log.debug(proceso, 'LINE 78 - response: ' + JSON.stringify(response));
								log.debug(proceso, 'LINE 79 - nroEnvio: '+nroEnvio+' - archivo: '+ JSON.stringify(archivo));
								log.debug(proceso, 'LINE 80 - contenidoPDF: ' + contenidoPDF);
							//}

							//var responseSuitelet = context.response;
							//responseSuitelet.write({ output: JSON.stringify(response) });
						}
					//}
				//}

			}else {
				var objRespuesta = {};
				objRespuesta.error = true;
				objRespuesta.mensaje = 'No se recibió ID de Ejecución de Pedido';

				var resp = JSON.stringify(objRespuesta);
				context.response.writeLine(resp);
			}
		}
	}


	let getPackagesData = (record) => {

		let arrayPackage = [];
		
		let cantPackage = record.getLineCount({
			sublistId: sublistPkg
		});

        for (i = 0; i < cantPackage; i++)
        {
            let packagetrackingnumber = record.getSublistValue({
                sublistId: sublistPkg,
                fieldId: 'packagetrackingnumber',
                line: i
            });

            arrayPackage.push(packagetrackingnumber);
        }

        return arrayPackage;
    }

    return {
        onRequest: onRequest
	};
	
});