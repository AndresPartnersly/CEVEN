/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/currentRecord', 'N/runtime'],

function(serverWidget, currentRecord, runtime) {
   
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

        const proceso = 'Andreani Cotizar Envio - beforeLoad';

        log.debug(proceso, 'INICIO');

        const dataParams = getParams();

        log.debug(proceso, 'dataParams: '+JSON.stringify(dataParams));

        if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT || scriptContext.type == scriptContext.UserEventType.COPY)
        {
            let form = scriptContext.form;

            form.clientScriptModulePath = './PTLY - Andreani Cotizar Envio (CL).js';

            form.addButton({
                id: 'custpage_call_stl',
                label: 'Cotizador Andreani',
                functionName: 'callPopUp()'
            });

			// CONTRATO ANDREANI ENVIO DOMICILIO B2C
			let custpage_cont_domicilio = form.addField({
				id:'custpage_cont_domicilio',
				label:'Andreani Contrato Envio Domicilio',
				type: serverWidget.FieldType.TEXT
			});

			custpage_cont_domicilio.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.HIDDEN
			});

			// CONTRATO ANDREANI ENVIO URGENTE DOMICILIO B2C
			let custpage_cont_domicilio_urgente = form.addField({
				id:'custpage_cont_domicilio_urgente',
				label:'Andreani Contrato Envio Domicilio Urgente',
				type: serverWidget.FieldType.TEXT
			});

			custpage_cont_domicilio_urgente.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.HIDDEN
			});			

			// CONTRATO ANDREANI ENVIO SUCURSAL B2C
			let custpage_cont_env_suc = form.addField({
				id:'custpage_cont_env_suc',
				label:'Andreani Contrato Retiro Sucursal',
				type: serverWidget.FieldType.TEXT
			});

			custpage_cont_env_suc.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.HIDDEN
			});	

			//CODIGO CLIENTE ANDREANI
			let custpage_codcliente = form.addField({
				id:'custpage_codcliente',
				label:'Andreani Codigo Cliente',
				type: serverWidget.FieldType.TEXT
			});

			custpage_codcliente.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.HIDDEN
			});	

            custpage_cont_domicilio.defaultValue = dataParams.contratoEnvDomB2C;
            custpage_cont_domicilio_urgente.defaultValue = dataParams.contratoEnvUrgDomB2C;
            custpage_cont_env_suc.defaultValue = dataParams.contratoEnvSucB2C;
            custpage_codcliente.defaultValue = dataParams.codClienteB2C;

        }
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
    function beforeSubmit(scriptContext) {

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

    function getParams() {
        
        var response = { error: false, mensaje:'', contextocrear:'', contextomodificar:'' };
        
        try {
            var currScript = runtime.getCurrentScript();
            response.codClienteB2C = currScript.getParameter('custscript_ptly_cotizador_ue_cod_cli_b2c');
            response.contratoEnvDomB2C = currScript.getParameter('custscript_ptly_cotizador_ue_cont_dom');
            response.contratoEnvUrgDomB2C = currScript.getParameter('custscript_ptly_cotizador_ue_cont_ur_dom');
            response.contratoEnvSucB2C = currScript.getParameter('custscript_ptly_cotizador_ue_cont_envsuc');
        } catch (e) {
            response.error = true;
            response.mensaje = "Netsuite Error - Excepción: " + e.message;
        }

        return response;
    }

    return {
        beforeLoad: beforeLoad/*,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit*/
    };
    
});
