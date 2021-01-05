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
            let andreaniOEGenerada = newRecord.getValue({
                fieldId: 'custbody_ptly_oe_generada_andreani'
            });

            log.debug('LINE 60','andreaniOEGenerada: '+andreaniOEGenerada);

            if (andreaniOEGenerada)
            {
                let form = scriptContext.form;

                form.clientScriptModulePath = './PTLY - Andreani Gestionar Paquete (CL).js';

                form.addButton({
                    id: 'custpage_call_stl',
                    label: 'Completar Paquetes Andreani',
                    functionName: 'imprimirEtiqueta()'
                });
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

    return {
        beforeLoad: beforeLoad/*,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit*/
    };
    
});
