/** @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/https', 'N/runtime', 'N/query'],

function(serverWidget, https, runtime, query) {

	const proceso = 'Andreani Cotizar Envio - Suitelet';
	const title = 'Andreani - Cotizar Envío';

	function onRequest(context) {

		log.audit(proceso, 'INICIO - context: '+JSON.stringify(context));

		let script = runtime.getCurrentScript();
	
		log.debug(proceso, `Remaining usage: ${script.getRemainingUsage()} - time ${new Date()}`);

		if (context.request.method === 'GET')
		{
			let form = serverWidget.createForm({
				title: title,
				hideNavBar: true
			});

			form.addFieldGroup({
				id : 'fg_inicio',
				label : 'Mercaderia'
			});

			form.addFieldGroup({
				id : 'fg_destino',
				label : 'Destino a domicilio'
			});

			form.addFieldGroup({
				id : 'fg_destino_andreani',
				label : 'Destino a sucursal Andreani'
			});

			form.clientScriptModulePath = './PTLY - Andreani Cotizar Envio (CL).js';

			//CODIGO CLIENTE ANDREANI
			let custpage_codcliente = form.addField({
				id:'custpage_codcliente',
				label:'Andreani Codigo Cliente B2C',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_inicio'
			});

			custpage_codcliente.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.HIDDEN
			});	
			
			if (!isEmpty(context.request.parameters.codClienteAndreaniB2C))
				custpage_codcliente.defaultValue = context.request.parameters.codClienteAndreaniB2C;

			// CONTRATO ANDREANI ENVIO DOMICILIO B2C
			let custpage_cont_domicilio = form.addField({
				id:'custpage_cont_domicilio',
				label:'Andreani Contrato Envio Domicilio',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_inicio'
			});

			custpage_cont_domicilio.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.HIDDEN
			});

			if (!isEmpty(context.request.parameters.contEnvioDomB2C))
				custpage_cont_domicilio.defaultValue = context.request.parameters.contEnvioDomB2C;

			// CONTRATO ANDREANI ENVIO URGENTE DOMICILIO B2C
			let custpage_cont_domicilio_urgente = form.addField({
				id:'custpage_cont_domicilio_urgente',
				label:'Andreani Contrato Envio Domicilio Urgente',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_inicio'
			});

			custpage_cont_domicilio_urgente.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.HIDDEN
			});			

			if (!isEmpty(context.request.parameters.contEnvioUrgDomB2C))
				custpage_cont_domicilio_urgente.defaultValue = context.request.parameters.contEnvioUrgDomB2C;

			// CONTRATO ANDREANI ENVIO SUCURSAL B2C
			let custpage_cont_env_suc = form.addField({
				id:'custpage_cont_env_suc',
				label:'Andreani Contrato Retiro Sucursal',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_inicio'
			});

			custpage_cont_env_suc.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.HIDDEN
			});	

			if (!isEmpty(context.request.parameters.contEnvioSucB2C))
				custpage_cont_env_suc.defaultValue = context.request.parameters.contEnvioSucB2C;

			// ME ANDREANI ENVIO DOMICILIO
			let custpage_me_env_dom = form.addField({
				id:'custpage_me_env_dom',
				label:'Shipping Item ID Envio Domicilio',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_inicio'
			});

			custpage_me_env_dom.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.HIDDEN
			});	

			if (!isEmpty(context.request.parameters.meEnvioDomicilio))
				custpage_me_env_dom.defaultValue = context.request.parameters.meEnvioDomicilio;

			// ME ANDREANI ENVIO URGENTE DOMICILIO
			let custpage_me_env_urg_dom = form.addField({
				id:'custpage_me_env_urg_dom',
				label:'Shipping Item ID Envio Urgente Domicilio',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_inicio'
			});

			custpage_me_env_urg_dom.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.HIDDEN
			});	

			if (!isEmpty(context.request.parameters.meEnvioUrgDomicilio))
				custpage_me_env_urg_dom.defaultValue = context.request.parameters.meEnvioUrgDomicilio;

			// ME ANDREANI ENVIO SUCURSAL
			let custpage_me_env_suc = form.addField({
				id:'custpage_me_env_suc',
				label:'Shipping Item ID Envio Sucursal',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_inicio'
			});

			custpage_me_env_suc.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.HIDDEN
			});	

			if (!isEmpty(context.request.parameters.meEnvioSuc))
			custpage_me_env_suc.defaultValue = context.request.parameters.meEnvioSuc;

			//PESO DECLARADO
			let custpage_peso = form.addField({
				id:'custpage_peso',
				label:'Peso Declarado (Kilogramos)',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_inicio'
			});

			custpage_peso.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});

			if (!isEmpty(context.request.parameters.dirDestino))
				custpage_peso.defaultValue = context.request.parameters.pesoDeclarado;

			//VOLUMEN DECLARADO
			let custpage_volumen = form.addField({
				id:'custpage_volumen',
				label:'Volumen Declarado',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_inicio'
			});

			custpage_volumen.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});

			//DIRECCION DESTINO
			let custpage_direccion = form.addField({
				id:'custpage_direccion',
				label:'Dirección',
				type: serverWidget.FieldType.TEXTAREA,
				container: 'fg_destino'
			});

			custpage_direccion.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});

			if (!isEmpty(context.request.parameters.dirDestino))
				custpage_direccion.defaultValue = context.request.parameters.dirDestino;

			//CODIGO POSTAL DESTINO
			let custpage_codpostal = form.addField({
				id:'custpage_codpostal',
				label:'Codigo Postal',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_destino'
			});

			custpage_codpostal.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});	

			if (!isEmpty(context.request.parameters.codPostalDestino))
				custpage_codpostal.defaultValue = context.request.parameters.codPostalDestino;

			//SUCURSAL ANDREANI
			let custpage_sucandreani = form.addField({
				id:'custpage_sucandreani',
				label:'Sucursal',
				type: serverWidget.FieldType.SELECT,
				source: 'customrecord_ptly_suc_andreani',
				container: 'fg_destino_andreani'
			});

			custpage_sucandreani.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.NORMAL
			});	

			custpage_sucandreani.isMandatory = true;

			//SUCURSAL ANDREANI DESCRIPCION
			let custpage_sucandreani_des = form.addField({
				id:'custpage_sucandreani_des',
				label:'Dirección',
				type: serverWidget.FieldType.TEXTAREA,
				container: 'fg_destino_andreani'
			});

			custpage_sucandreani_des.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});

			//CODIGO SUCURSAL ANDREANI
			let custpage_sucandreani_cod = form.addField({
				id:'custpage_sucandreani_cod',
				label:'Codigo Postal',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_destino_andreani'
			});

			custpage_sucandreani_cod.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});	

			//CALLE SUCURSAL ANDREANI
			let custpage_sucandreani_calle = form.addField({
				id:'custpage_sucandreani_calle',
				label:'Calle',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_destino_andreani'
			});

			custpage_sucandreani_calle.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});	

			//CALLE NRO SUCURSAL ANDREANI
			let custpage_sucandreani_calle_nro = form.addField({
				id:'custpage_sucandreani_calle_nro',
				label:'Calle Numero',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_destino_andreani'
			});

			custpage_sucandreani_calle_nro.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});	

			//LOCALIDAD SUCURSAL ANDREANI
			let custpage_sucandreani_loc = form.addField({
				id:'custpage_sucandreani_loc',
				label:'Localidad',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_destino_andreani'
			});

			custpage_sucandreani_loc.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});	

			//REGION SUCURSAL ANDREANI
			let custpage_sucandreani_reg = form.addField({
				id:'custpage_sucandreani_reg',
				label:'Region',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_destino_andreani'
			});

			custpage_sucandreani_reg.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});	

			form.addSubmitButton({
				label: 'Cotizar'
			});

			//SE CREA FORMA
			context.response.writePage({
				pageObject: form
			});
		}
		else
		{
			log.debug({
				title: proceso,
				details: `211 - context.request.parameters: ${JSON.stringify(context.request.parameters)}`
			});

			let arrayResumen = [];

			let form = serverWidget.createForm({
					title: title,
					hideNavBar: true
				});

			form.clientScriptModulePath = './PTLY - Andreani Cotizar Envio (CL).js';

			form.addFieldGroup({
				id : 'fg_inicio',
				label : 'Resultado cotización'
			});

			form.addFieldGroup({
				id : 'fg_fin',
				label : 'Seleccione servicio'
			});

			form.addFieldGroup({
				id : 'fg_parametros',
				label : 'Parametros'
			});

            let custpage_resumen = form.addField({
                id: 'custpage_resumen',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Cotización por tipo de servicio',
				container: 'fg_inicio'
            });

			custpage_resumen.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
			});

            let custpage_resumen_json = form.addField({
                id: 'custpage_resumen_json',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Cotización por tipo de servicio JSON',
				container: 'fg_parametros'
            });

			custpage_resumen_json.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
			});

			//CALLE SUCURSAL ANDREANI
			let custpage_sucandreani_calle = form.addField({
				id:'custpage_sucandreani_calle',
				label:'Calle',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_destino_andreani'
			});

			custpage_sucandreani_calle.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});	

			custpage_sucandreani_calle.defaultValue = context.request.parameters.custpage_sucandreani_calle;

			//CALLE NRO SUCURSAL ANDREANI
			let custpage_sucandreani_calle_nro = form.addField({
				id:'custpage_sucandreani_calle_nro',
				label:'Calle Numero',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_destino_andreani'
			});

			custpage_sucandreani_calle_nro.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});	

			custpage_sucandreani_calle_nro.defaultValue = context.request.parameters.custpage_sucandreani_calle_nro;

			//LOCALIDAD SUCURSAL ANDREANI
			let custpage_sucandreani_loc = form.addField({
				id:'custpage_sucandreani_loc',
				label:'Localidad',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_destino_andreani'
			});

			custpage_sucandreani_loc.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});	

			custpage_sucandreani_loc.defaultValue = context.request.parameters.custpage_sucandreani_loc;

			//REGION SUCURSAL ANDREANI
			let custpage_sucandreani_reg = form.addField({
				id:'custpage_sucandreani_reg',
				label:'Region',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_destino_andreani'
			});

			custpage_sucandreani_reg.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});	

			custpage_sucandreani_reg.defaultValue = context.request.parameters.custpage_sucandreani_reg;

			//CODIGO POSTAL DESTINO
			let custpage_codpostal = form.addField({
				id:'custpage_codpostal',
				label:'Codigo Postal',
				type: serverWidget.FieldType.TEXT,
				container: 'fg_destino_andreani'
			});

			custpage_codpostal.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});

			custpage_codpostal.defaultValue = context.request.parameters.custpage_codpostal;
			
			form.addButton({
				id: 'custpage_procesar',
				label: 'Finalizar',
				functionName: `finalizarPopUp()`
			});

			form.addField({
				id: 'custpage_radio',
				label: 'Envio a Domicilio',
				type: serverWidget.FieldType.RADIO,
				source: '1',
				container: 'fg_fin'
			});

			form.addField({
				id: 'custpage_radio',
				label: 'Envio Urgente a Domicilio',
				type: serverWidget.FieldType.RADIO,
				source: '2',
				container: 'fg_fin'
			});

			form.addField({
				id: 'custpage_radio',
				label: 'Envio a Sucursal',
				type: serverWidget.FieldType.RADIO,
				source: '3',
				container: 'fg_fin'
			});

			log.debug({
				title: proceso,
				details: `context.request.parameters.custpage_radio: ${context.request.parameters.custpage_radio}`
			});

			//SE GENERA TOKEN
			let token = generarToken();

			if (!isEmpty(token))
			{

				log.debug({
					title: proceso,
					details: `Token generado exitosamente`
				});

				let cpDestino = context.request.parameters.custpage_codpostal;
				let cpDestinoAndreani = context.request.parameters.custpage_sucandreani_cod;
				let contratoEnvioDomicilioB2C = context.request.parameters.custpage_cont_domicilio;
				let contratoEnvioUrgDomicilioB2C = context.request.parameters.custpage_cont_domicilio_urgente;
				let contratoEnvioSucB2C = context.request.parameters.custpage_cont_env_suc;
				let kilos = context.request.parameters.custpage_peso;
				let volumen = 100;
				let url = `https://api.andreani.com/v1/tarifas`;

				//PARAMETROS COTIZACION ENVIO A DOMICILIO B2C
				let urlEnvioDomicilio = `${url}?cpDestino=${cpDestino}&contrato=${contratoEnvioDomicilioB2C}&bultos[0][volumen]=${volumen}&bultos[0][kilos]=${kilos}`;
				let respEnvioDomicilio = cotizarEnvio(urlEnvioDomicilio, token);

				if (!isEmpty(respEnvioDomicilio))
				{
					log.debug({
						title: proceso,
						details: `Respuesta cotizacion ID 1: ${respEnvioDomicilio.body}`
					});

					if (respEnvioDomicilio.code == 200)
					{
						let body = JSON.parse(respEnvioDomicilio.body);
						let objeto = {};
						objeto.tipoEnvio = 1;
						objeto.meEnvio = context.request.parameters.custpage_me_env_dom;
						objeto.tipoEnvioNombre = 'Envio a domicilio';
						objeto.body = body;
						arrayResumen.push(objeto);
					}
				}
				
				//PARAMETROS COTIZACION ENVIO URGENTE A DOMICILIO B2C
				let urlEnvioUrgDomicilio = `${url}?cpDestino=${cpDestino}&contrato=${contratoEnvioUrgDomicilioB2C}&bultos[0][volumen]=${volumen}&bultos[0][kilos]=${kilos}`;
				let respEnvioUrgDomicilio = cotizarEnvio(urlEnvioUrgDomicilio, token);

				if (!isEmpty(respEnvioDomicilio))
				{
					log.debug({
						title: proceso,
						details: `Respuesta cotizacion ID 2: ${respEnvioUrgDomicilio.body}`
					});

					if (respEnvioDomicilio.code == 200)
					{
						let body = JSON.parse(respEnvioUrgDomicilio.body);
						let objeto = {};
						objeto.tipoEnvio = 2;
						objeto.meEnvio = context.request.parameters.custpage_me_env_urg_dom;
						objeto.tipoEnvioNombre = 'Envio urgente a domicilio';
						objeto.body = body;
						arrayResumen.push(objeto);
					}
				}
				
				//PARAMETROS COTIZACION ENVIO A SUCURSAL B2C
				let urlEnvioSuc = `${url}?cpDestino=${cpDestinoAndreani}&contrato=${contratoEnvioSucB2C}&bultos[0][volumen]=${volumen}&bultos[0][kilos]=${kilos}`;
				let respEnvioSucgDomicilio = cotizarEnvio(urlEnvioSuc, token);

				if (!isEmpty(respEnvioSucgDomicilio))
				{
					log.debug({
						title: proceso,
						details: `Respuesta cotizacion ID 3: ${respEnvioSucgDomicilio.body}`
					});

					if (respEnvioDomicilio.code == 200)
					{
						let body = JSON.parse(respEnvioSucgDomicilio.body);
						let objeto = {};
						objeto.tipoEnvio = 3;
						objeto.meEnvio = context.request.parameters.custpage_me_env_suc;
						objeto.tipoEnvioNombre = 'Envio a sucursal';
						objeto.body = body;
						arrayResumen.push(objeto);	
					}
				}
			}

			log.debug({
				title: proceso,
				details: JSON.stringify(arrayResumen)
			});

			if (!isEmpty(arrayResumen))
			{
				let tablehtml = '<table style="width: 50vw; padding: 0px 0px 25px 20px"><thead>';
				tablehtml += '<tr style="background-color: #e9e8e8;color: #666; font-size: 11px;">';
				tablehtml += '<th style="padding: 6px 15px !important;">TIPO SERVICIO</th>';
				tablehtml += '<th style="padding: 6px 15px !important;">IMPORTE</th>';
				tablehtml += '</tr></thead><tbody>';

				if(arrayResumen.length > 0){
					// Populate Table
					for (let i = 0; i < arrayResumen.length; i++) {
						tablehtml += '<tr style="font-size:13px; color: #333">';
						tablehtml += '<td>' + arrayResumen[i].tipoEnvioNombre + '</td>';
						tablehtml += '<td>' + arrayResumen[i].body.tarifaSinIva.total + '</td>';
						tablehtml += '</tr>';
					}
				}
				tablehtml += '</tbody></table>';
				custpage_resumen.defaultValue = tablehtml;
				custpage_resumen_json.defaultValue = JSON.stringify(arrayResumen);
			}

			context.response.writePage(form);


		}
		
		log.audit({
			title: proceso,
			details: "FIN"
		});
		
	}


	let generarToken = () => {

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

	let cotizarEnvio = (url, token) => {

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
        onRequest: onRequest
    };
});