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

			let idFullfilment = 3025629;

			//if (!utilities.isEmpty(context.request.parameters.idRec)) {
			if (!utilities.isEmpty(idFullfilment)) {

			//	let idFullfilment = 3025629; //context.request.parameters.idRec;
				
				log.audit(proceso, `LINE 24 - idFullfilment: ${idFullfilment}`);

				let recordItemfullfilment = record.load({
					type: record.Type.ITEM_FULFILLMENT,
					id: idFullfilment,
					isDynamic: true
				});

				log.audit(proceso, `LINE 32 - recordItemfullfilment: ${JSON.stringify(recordItemfullfilment)}`);

				if (!utilities.isEmpty(recordItemfullfilment))
				{
					let arrayPackage = getPackagesData(recordItemfullfilment);

					log.debug(proceso, `LINE 38 - arrayPackage ${JSON.stringify(arrayPackage)}`);

					let token = utilities.generarToken('https://api.andreani.com/login');

					log.debug({
						title: proceso,
						details: `LINE 41 token: ${token}`
					});

					if (!utilities.isEmpty(arrayPackage) && arrayPackage.length> 0)
					{
						if (!utilities.isEmpty(token))
						{
							var headers = {"x-authorization-token": ""+token+""};
							log.audit(proceso, `LINE 52 -headers: +${JSON.stringify(headers)}`);
							let contenidoPDF = '';

							for (i = 0; i < arrayPackage.length; i++)
							{
								let nroEnvio = arrayPackage[i];
								let url = `https://api.andreani.com/v2/ordenes-de-envio/${nroEnvio}/etiquetas`;

								let response = https.get({
									url: url,
									headers: headers
								});
								
								log.audit(proceso, 'LINE 64 - response: '+JSON.stringify(response));

								contenidoPDF = response.body;

								log.debug(proceso, 'LINE 68 - response: ' + JSON.stringify(response));
								log.debug(proceso, 'contenidoPDF: ' + contenidoPDF);
							}

							let archivo = file.create({
								name: `ItemFullfilment.pdf`,
								description: 'Etiqueta Bulto Andreani',
								fileType: file.Type.PDF,
								contents: contenidoPDF
							});

							context.response.writeFile({
								file: archivo
							});

							//var responseSuitelet = context.response;
							//responseSuitelet.write({ output: JSON.stringify(response) });
						}
					}
				}

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