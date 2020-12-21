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

        const proceso = 'Andreani Cotizar Envio - beforeLoad';

        log.audit(proceso, 'INICIO');

        const newRecord = scriptContext.newRecord;

        const entity = newRecord.getValue({
            fieldId: 'entity'
        });

        let validEntity = false;

        const dataParams = getParams();

        log.debug(proceso, 'dataParams: '+JSON.stringify(dataParams)+' - entity: '+entity);

        if (!utilities.isEmpty(entity))
        {
            let strSQL = "SELECT \n Customer.\"CATEGORY\" AS categoryRAW /*{category#RAW}*/\nFROM \n Customer\nWHERE \n Customer.\"ID\" = "+ entity +"\n";

            let objPagedData = query.runSuiteQLPaged({
                query: strSQL,
                pageSize: 1
            });

            // Paging 
            let arrResults = [];
            
            objPagedData.pageRanges.forEach(function(pageRange) {
                //fetch
                let objPage = objPagedData.fetch({ index: pageRange.index }).data;
                // Map results to columns 
                arrResults.push.apply(arrResults, objPage.asMappedResults());
            });

            log.debug({
                title: proceso,
                details: `arrResults: ${JSON.stringify(arrResults)}`
            })

            if (!utilities.isEmpty(arrResults) && arrResults.length > 0)
            {
                const customerCategory = arrResults[0].categoryraw;

                if (!utilities.isEmpty(dataParams.categoriaCliente) && dataParams.categoriaCliente == customerCategory)
                {
                    validEntity = true;
                }
            }

            log.debug({
                title: proceso,
                details: `validEntity: ${validEntity}`
            })
        }
        else
        {
            validEntity = true;
        }

        if ((scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT || scriptContext.type == scriptContext.UserEventType.COPY) && validEntity)
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

            //CATEGORIA CLIENTE PERMITIDAD POPUP
            let custpage_catclientepermitida = form.addField({
                id:'custpage_catclientepermitida',
                label:'Categoria Cliente Permitida',
                type: serverWidget.FieldType.TEXT
            });

            custpage_catclientepermitida.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });	

            custpage_catclientepermitida.defaultValue = dataParams.categoriaCliente;
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
            response.categoriaCliente = currScript.getParameter('custscript_ptly_cotizador_ue_cust_cat');
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
