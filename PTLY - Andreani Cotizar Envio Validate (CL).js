/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteScripts/configuration.json
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', 'N/ui/dialog', 'N/query', 'N/search'],

function(currentRecord, url, dialog, query, search) {
    
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

        var process = 'Validar Cotización Envio Andreani - saveRecord';

        //log.audit(process,'INICIO');

        nlapiLogExecution('AUDIT', process, 'INICIO');

        var record = scriptContext.currentRecord;

        var valorDeclaradoAndreani = record.getValue({
            fieldId: 'custbody_ptly_valor_declarado_andreani'
        });

        var subtotal = record.getValue({
            fieldId: 'subtotal'
        });

        nlapiLogExecution('DEBUG', process,'scriptContext: '+JSON.stringify(scriptContext)+' - scriptContext: '+ JSON.stringify(scriptContext)+ ' - valorDeclaradoAndreani: '+valorDeclaradoAndreani+ ' - subtotal: '+subtotal);

        if ((!isEmpty(subtotal) && !isEmpty(valorDeclaradoAndreani)) && (subtotal != valorDeclaradoAndreani))
        {
            var myMsg = {
                title: "Información",
                message: "Debe cotizar nuevamente el costo de envio con Andreani dado que los valores declarados tuvieron una variación posterior"
             };

            dialog.alert(myMsg);

            return false;
        }
        else
        {
            return true;
        }
        nlapiLogExecution('AUDIT', process,'FIN');
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
        saveRecord: saveRecord
    };
    
});