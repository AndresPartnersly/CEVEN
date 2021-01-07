/**
 * @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/query', 'N/runtime', 'PTLY/AndreaniUtilities'],

function(serverWidget, query, runtime, utilities) {
   
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

        const proceso = 'Andreani Gestionar Paquete - beforeLoad';

        log.audit(proceso, 'INICIO');

        const newRecord = scriptContext.newRecord;

        /*if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT)
        {
            let form = scriptContext.form;

            form.clientScriptModulePath = './PTLY - Andreani Gestionar Paquete (CL).js';

            form.addButton({
                id: 'custpage_call_stl',
                label: 'Completar Paquetes Andreani',
                functionName: 'gestionarPackageSublist()'
            });
        }*/

        if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT)
        {
            let form = scriptContext.form;

            form.clientScriptModulePath = './PTLY - Andreani Gestionar Paquete (CL).js';

            form.addButton({
                id: 'custpage_call_stl',
                label: 'Limpiar Sublista Paquetes / Packages',
                functionName: 'limpiarPackageSublist()'
            });
        }

        if (scriptContext.type == scriptContext.UserEventType.VIEW)
        {
            let estadoProcOE = newRecord.getValue({
                fieldId: 'custbody_ptly_est_pr_oe_andreani'
            });

            log.debug('LINE 60','estadoProcOE: '+estadoProcOE);

            let scriptParams = getParams();

            log.debug('LINE 64','scriptParams: '+JSON.stringify(scriptParams));

            if (!utilities.isEmpty(scriptParams))
            {
                if (scriptParams.estadoProcOK == estadoProcOE)
                {
                    let form = scriptContext.form;

                    form.clientScriptModulePath = './PTLY - Andreani Gestionar Paquete (CL).js';

                    form.addButton({
                        id: 'custpage_call_stl',
                        label: 'Imprimir Etiquetas Andreani',
                        functionName: 'imprimirEtiqueta()'
                    });
                }
            }
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

    let getParams = () => {
        
        let response = { error: false, mensaje:'', contextocrear:'', contextomodificar:'' };
        
        try {
            var currScript = runtime.getCurrentScript();
            response.estadoProcOK = currScript.getParameter('custscript_ptly_gest_packg_andreani_ok');
            response.estadoProcError = currScript.getParameter('custscript_ptly_gest_packg_andreani_err');
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
