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

        log.audit(proceso, 'INICIO');

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

			//CODIGO CLIENTE ANDREANI
			let custpage_empresaTransporte = form.addField({
				id:'custpage_empresatransporte',
				label:'Andreani Empresa Transportista',
				type: serverWidget.FieldType.TEXT
			});

			custpage_empresaTransporte.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.HIDDEN
			});	

            custpage_empresaTransporte.defaultValue = dataParams.empresaTransporte;
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
            response.empresaTransporte = currScript.getParameter('custscript_ptly_cotizador_ue_empresa_b2c');
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
