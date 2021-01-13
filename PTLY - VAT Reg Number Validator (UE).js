/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/error', 'N/search'],

function(error, search) {
   
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

        log.debug(process,'scriptContext: '+JSON.stringify(scriptContext)+' - scriptContext: '+ JSON.stringify(scriptContext));

        const newRecord = scriptContext.newRecord;
        const recId = newRecord.id;

        let vatregnumber = newRecord.getValue({
            fieldId: 'vatregnumber'
        });

        let nombreLegal = newRecord.getValue({
            fieldId: 'custentity_l54_nombre_legal'
        });

        let companyname = newRecord.getValue({
            fieldId: 'companyname'
        });

        log.debug(process, 'vatregnumber.length: '+vatregnumber.length+ ' -nombreLegal: '+nombreLegal + ' - companyname: '+companyname);

        if (!isEmpty(vatregnumber))
        {
            let vatregnumberNew = limpiarTaxNumber(vatregnumber);

            let validTaxNumber = existeTaxNumber(vatregnumberNew, recId);

            log.debug(process, 'recId: '+ recId +' - vatregnumber: '+vatregnumber + ' - validTaxNumber: ' + validTaxNumber + ' - vatregnumberNew: ' + vatregnumberNew);

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
                    message: `VAT Reg Number ingresado ya existe en NetSuite: ${vatregnumberNew}, debe cambiarlo`,
                    notifyOff: false
                });

                throw(errorMessage);
            }
        }

        if (!isEmpty(nombreLegal))
        {
            let nombreLegalNew = limpiarString(nombreLegal);

            log.debug(process, 'recId: '+ recId +' - nombreLegalNew: '+nombreLegalNew + ' - nombreLegalNew.length: ' + nombreLegalNew.length);

            newRecord.setValue({
                fieldId: 'custentity_l54_nombre_legal',
                value: nombreLegalNew/*,
                ignoreFieldChange: true*/
            });
        }

        if (!isEmpty(companyname))
        {
            let companynameNew = limpiarString(companyname);

            log.debug(process, 'recId: '+ recId +' - companynameNew: '+companynameNew + ' - companynameNew.length: ' + companynameNew.length);

            newRecord.setValue({
                fieldId: 'companyname',
                value: companynameNew/*,
                ignoreFieldChange: true*/
            });
        }
        log.audit(process,'FIN');
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

    let limpiarString = (value) =>
    {
        return value.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi,'').trim();
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
