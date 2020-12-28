/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/ui/message', 'N/ui/dialog'],

function(search, message, dialog) {
    
    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {

        var process = 'VAT Reg Number Validator - fieldChanged';

        log.audit(process,'INICIO');

        log.debug(process,'scriptContext: '+JSON.stringify(scriptContext)+' - scriptContext: '+ JSON.stringify(scriptContext));

        var record = scriptContext.currentRecord;
        var recId = record.id;

        // SI EL CAMBIO ES SOBRE EL CAMPO VAT REG NUMBER / TAX NUMBER
        if (scriptContext.fieldId == 'vatregnumber')
        {
            // SE TOMA EL VAT REG NUMBER / TAX NUMBER Y SE LE RETIRA CUALQUIER CARACTER NO NUMERICO
            var vatregnumber = record.getValue({
                fieldId: 'vatregnumber'
            });

            log.debug(process, 'vatregnumber.length: '+vatregnumber.length);

            if (!isEmpty(vatregnumber))
            {
                var vatregnumberNew = limpiarTaxNumber(vatregnumber);

                // SE VALIDA SI ES UN VAT REG NUMBER OK PARA USAR
                var validTaxNumber = existeTaxNumber(vatregnumberNew, recId);

                log.debug(process, 'vatregnumber: '+vatregnumber + ' - validTaxNumber: ' + validTaxNumber + ' - vatregnumberNew: ' + vatregnumberNew);

                // SE ACTUALIZA EL VAT REG NUMBER EN EL CAMPO DE NETSUITE Y CAMPO DE LOCALIZACIONES
                record.setValue({
                    fieldId: 'vatregnumber',
                    value: vatregnumberNew,
                    ignoreFieldChange: true
                });

                record.setValue({
                    fieldId: 'custentity_l54_cuit_entity',
                    value: vatregnumberNew,
                    ignoreFieldChange: true
                });

                if (!validTaxNumber)
                {
                    var myMsg = message.create({
                        title: "Alerta",
                        message: "VAT Reg Number ingresado ya existe y no se podrá almacenar en NetSuite",
                        type: message.Type.WARNING,
                    });
                    myMsg.show({
                        duration: 4000
                    });
                }
            }
        }
        log.audit(process,'FIN');
    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

        var process = 'VAT Reg Number Validator - saveRecord';

        log.audit(process,'INICIO');

        log.debug(process,'scriptContext: '+JSON.stringify(scriptContext));

        var record = scriptContext.currentRecord;
        var recId = record.id;

        var vatregnumber = record.getValue({
            fieldId: 'vatregnumber'
        });

        
        if (!isEmpty(vatregnumber))
        {
            var vatregnumberNew = limpiarTaxNumber(vatregnumber);

            // SE VALIDA SI ES UN VAT REG NUMBER OK PARA USAR
            var validTaxNumber = existeTaxNumber(vatregnumberNew, recId);

            log.debug(process, 'vatregnumber: '+ vatregnumber +' - validTaxNumber: '+validTaxNumber+ ' - vatregnumberNew: '+ vatregnumberNew);

            // SE ACTUALIZA EL VAT REG NUMBER EN EL CAMPO DE NETSUITE Y CAMPO DE LOCALIZACIONES
            record.setValue({
                fieldId: 'vatregnumber',
                value: vatregnumberNew,
                ignoreFieldChange: true
            });

            record.setValue({
                fieldId: 'custentity_l54_cuit_entity',
                value: vatregnumberNew,
                ignoreFieldChange: true
            });

            if (!validTaxNumber)
            {
                var myMsg = {
                    title: "Alerta",
                    message: "VAT Reg Number ingresado ya existe en NetSuite "+ vatregnumberNew +", debe cambiarlo",
                    };

                dialog.alert(myMsg);

                return false;
            }

            return true;

        }
        log.audit(process,'FIN');
    }


    function limpiarTaxNumber(taxNumber)
    {
        return taxNumber.replace(/\D/g,"");
    }

    function existeTaxNumber(taxNumber, idEntidad) {

        var process = 'existeTaxNumber';

        var ss = search.load({
            id: 'customsearch_ptly_vat_regnumber_val_cust',
            type: search.Type.CUSTOMER
        });

        var ssTaxNumberFilter = search.createFilter({
            name: 'vatregnumber',
            operator: 'IS',
            values: taxNumber
        });

        ss.filters.push(ssTaxNumberFilter);

        var ssRun = ss.run();

        var ssRunRange = ssRun.getRange({
            start: 0,
            end: 1
        });

        log.debug(process, 'ssRunRange.length: '+JSON.stringify(ssRunRange.length));

        if (ssRunRange.length > 0)
        {
            if (!isEmpty(idEntidad)) // SI EL CLIENTE EXISTE
            {
                var idInternoEntidadSS = ssRunRange[0].getValue(ssRun.columns[0]);

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
        //pageInit: pageInit,
        fieldChanged: fieldChanged,
        /*postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        lineInit: lineInit,
        validateField: validateField,
        validateLine: validateLine,
        validateInsert: validateInsert,
        validateDelete: validateDelete,*/
        saveRecord: saveRecord
    };
    
});
