/**
 * @NApiVersion 2.1
 * @NAmdConfig /SuiteScripts/configuration.json
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/error'],

function(error) {
   
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

        /*const proceso = 'Andreani Cotizar Envio - beforeLoad';

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
            let strSQL = "SELECT \n Customer.\"CATEGORY\" AS categoryRAW \nFROM \n Customer\nWHERE \n Customer.\"ID\" = "+ entity +"\n";

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
        log.audit(proceso, 'FIN');*/
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

        const process = 'VAT Reg Number Validator - beforeSubmit';

        log.audit(process,'INICIO');

        const newRecord = scriptContext.newRecord;
        const recId = newRecord.id;

        let vatregnumber = newRrecord.getValue({
            fieldId: 'vatregnumber'
        });

        log.debug(process, 'vatregnumber.length: '+vatregnumber.length);

        if (!isEmpty(vatregnumber))
        {
            let vatregnumberNew = limpiarTaxNumber(vatregnumber);

            let validTaxNumber = existeTaxNumber(vatregnumberNew, recId);

            log.debug(process, 'vatregnumber: '+vatregnumber + ' - validTaxNumber: ' + validTaxNumber + ' - vatregnumberNew: ' + vatregnumberNew);

            newRecord.setValue({
                fieldId: 'vatregnumber',
                value: vatregnumberNew/*,
                ignoreFieldChange: true*/
            });

            newRecord.setValue({
                fieldId: 'custentity_l54_cuit_entity',
                value: vatregnumberNew/*,
                ignoreFieldChange: true*/
            });

            if (!validTaxNumber)
            {
                let errorMessage = error.create({
                    name: "Alerta",
                    message: 'VAT Reg Number ingresado ya existe en NetSuite, debe cambiarlo',
                    notifyOff: false
                });

                throw(errorMessage);
            }
        }
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

    let limpiarTaxNumber = (taxNumber) =>
    {
        return taxNumber.replace(/\D/g,"");
    }

    let existeTaxNumber = (taxNumber, idEntidad) =>
    {

        let process = 'existeTaxNumber';

        let ss = search.load({
            id: 'customsearch_ptly_vat_regnumber_val_cust',
            type: search.Type.CUSTOMER
        });

        let ssTaxNumberFilter = search.createFilter({
            name: 'vatregnumber',
            operator: 'IS',
            values: taxNumber
        });

        ss.filters.push(ssTaxNumberFilter);

        let ssRun = ss.run();

        let ssRunRange = ssRun.getRange({
            start: 0,
            end: 1
        });

        log.debug(process, 'ssRunRange.length: '+JSON.stringify(ssRunRange.length));

        if (ssRunRange.length > 0)
        {
            if (!isEmpty(idEntidad)) // SI EL CLIENTE EXISTE
            {
                let idInternoEntidadSS = ssRunRange[0].getValue(ssRun.columns[0]);

                log.debug(process, 'idInternoEntidadSS: '+idInternoEntidadSS + " - idEntidad: "+ idEntidad);

                if (idInternoEntidadSS == idEntidad) // SI ES EL MISMO CLIENTE Y EL TAX NUMBER EXISTE ESTA OK
                {
                    return true;
                }
                else // SI ES EL MISMO CLIENTE PERO SE LE HA CAMBIADO EL TAX NUMBER POR UNO EXISTENTE
                {
                    return false;
                }
            }
            else
            {
                return false;
            }
        }
        return true;
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
        //beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
        //afterSubmit: afterSubmit
    };
    
});
