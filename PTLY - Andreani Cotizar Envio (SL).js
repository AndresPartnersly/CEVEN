/** @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/https', 'N/runtime'],

function(serverWidget, https, runtime) {

	const proceso = 'Andreani Cotizar Envio - Suitelet';

	function onRequest(context) {

		log.audit(proceso, 'INICIO - context: '+JSON.stringify(context));

		let script = runtime.getCurrentScript();
	
		log.debug(proceso, `Remaining usage: ${script.getRemainingUsage()} - time ${new Date()}`);

		if (context.request.method === 'GET')
		{
			let form = serverWidget.createForm({
				title: 'Andreani - Cotizar Envío'/*,
				hideNavBar: true*/
			});

			form.clientScriptModulePath = './PTLY - Andreani Cotizar Envio (CL).js';

			//CODIGO CLIENTE ANDREANI
			let custpage_codcliente = form.addField({
				id:'custpage_codcliente',
				label:'Andreani Codigo Cliente B2C',
				type: serverWidget.FieldType.TEXT
			});

			custpage_codcliente.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});	
			
			if (!isEmpty(context.request.parameters.codClienteAndreaniB2C))
				custpage_codcliente.defaultValue = context.request.parameters.codClienteAndreaniB2C;

			// CONTRATO ANDREANI ENVIO DOMICILIO B2C
			let custpage_cont_domicilio = form.addField({
				id:'custpage_cont_domicilio',
				label:'Andreani Contrato Envio Domicilio',
				type: serverWidget.FieldType.TEXT
			});

			custpage_cont_domicilio.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});

			if (!isEmpty(context.request.parameters.contEnvioDomB2C))
				custpage_cont_domicilio.defaultValue = context.request.parameters.contEnvioDomB2C;

			// CONTRATO ANDREANI ENVIO URGENTE DOMICILIO B2C
			let custpage_cont_domicilio_urgente = form.addField({
				id:'custpage_cont_domicilio_urgente',
				label:'Andreani Contrato Envio Domicilio Urgente',
				type: serverWidget.FieldType.TEXT
			});

			custpage_cont_domicilio_urgente.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});			

			if (!isEmpty(context.request.parameters.contEnvioUrgDomB2C))
				custpage_cont_domicilio_urgente.defaultValue = context.request.parameters.contEnvioUrgDomB2C;

			// CONTRATO ANDREANI RETIRO SUCURSAL B2C
			let custpage_cont_ret_suc = form.addField({
				id:'custpage_cont_ret_suc',
				label:'Andreani Contrato Retiro Sucursal',
				type: serverWidget.FieldType.TEXT
			});

			custpage_cont_ret_suc.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});	

			if (!isEmpty(context.request.parameters.contEnvioSucB2C))
				custpage_cont_ret_suc.defaultValue = context.request.parameters.contEnvioSucB2C;

			//CODIGO POSTAL DESTINO
			let custpage_codpostal = form.addField({
				id:'custpage_codpostal',
				label:'Codigo Postal',
				type: serverWidget.FieldType.TEXT
			});

			custpage_codpostal.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});	

			if (!isEmpty(context.request.parameters.codPostalDestino))
				custpage_codpostal.defaultValue = context.request.parameters.codPostalDestino;

			//DIRECCION DESTINO
			let custpage_direccion = form.addField({
				id:'custpage_direccion',
				label:'Dirección',
				type: serverWidget.FieldType.TEXTAREA
			});

			custpage_direccion.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});

			if (!isEmpty(context.request.parameters.dirDestino))
				custpage_direccion.defaultValue = context.request.parameters.dirDestino;

			form.addButton({
				id: 'custpage_procesar',
				label: 'Finalizar',
				functionName: ''
			});

			form.addSubmitButton({
				label: 'Cotizar'
			})

			//SE CREA FORMA
			context.response.writePage({
				pageObject: form
			});
		}
		else
		{
			log.debug({
				title: proceso,
				details: `context.request.parameters: ${JSON.stringify(context.request.parameters)}`
			});

			var headerObj = {
				name: 'Authorization',
				value: 'Basic Y2V2ZW5fd3M6U0NKS0w0MjEyMGR3'
			};

			var headers = {'Authorization': 'Basic Y2V2ZW5fd3M6U0NKS0w0MjEyMGR3'};
			var response = https.get({
				url: 'https://api.qa.andreani.com/login',
				headers: headers
			});

			log.debug({
				title: proceso,
				details: `response: ${JSON.stringify(response)}`
			});

		}
		
		log.audit({
			title: proceso,
			details: "FIN"
		});
		
	}
	
    function isEmpty(value) {
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