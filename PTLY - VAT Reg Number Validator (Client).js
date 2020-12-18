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

        if (isEmpty(record.id))
        {
            if (scriptContext.fieldId == 'vatregnumber')
            {
                var vatregnumber = record.getValue({
                    fieldId: 'vatregnumber'
                }).replace(/\D/g,"");

                log.debug(process, 'vatregnumber: '+vatregnumber);

                var ss = search.load({
                    id: 'customsearch_ptly_vat_regnumber_val_cust',
                    type: search.Type.CUSTOMER
                });

                var ssTaxNumberFilter = search.createFilter({
                    name: 'vatregnumber',
                    operator: 'IS',
                    values: vatregnumber
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
                    var myMsg = message.create({
                        title: "Registro Duplicado",
                        message: "VAT Reg Number ingresado ya existe",
                        type: message.Type.WARNING,
                    });
                    myMsg.show({
                        duration: 2000
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

        log.debug(process,'scriptContext: '+JSON.stringify(scriptContext)+' - scriptContext: '+ JSON.stringify(scriptContext));

        var record = scriptContext.currentRecord;

        if (isEmpty(record.id))
        {
            var vatregnumber = record.getValue({
                fieldId: 'vatregnumber'
            }).replace(/\D/g,"");

            record.setValue({
                fieldId: 'vatregnumber',
                value: vatregnumber
            });

            if (!isEmpty(vatregnumber))
            {
                log.debug(process, 'vatregnumber: '+vatregnumber);

                var ss = search.load({
                    id: 'customsearch_ptly_vat_regnumber_val_cust',
                    type: search.Type.CUSTOMER
                });

                var ssTaxNumberFilter = search.createFilter({
                    name: 'vatregnumber',
                    operator: 'IS',
                    values: vatregnumber
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
                    var myMsg = {
                        title: "Registro Duplicado",
                        message: "VAT Reg Number ingresado ya existe"
                     };

                    dialog.alert(myMsg);

                    return false;
                }
                else
                {

                    var myMsg = {
                        title: "Registro Duplicado",
                        message: "Los caracteres no numéricos seran removidos del campo VAT Reg Number al guardar"
                     };

                    dialog.alert(myMsg);

                    record.setValue({
                        fieldId: 'vatregnumber',
                        value: vatregnumber
                    });

                    return true;
                }
            }
        }
        log.audit(process,'FIN');
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
