/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/runtime'],

    function (record, runtime) {

        let nameProcess = 'PTLY - Web Store Functionalities Entity'; //Process name for LOGS

        function afterSubmit(scriptContext) {

            log.audit(nameProcess, 'afterSubmit - INICIO del proceso - scriptContext.type: '+scriptContext.type);

            try
            {
                if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT)
                {
                    let recType = scriptContext.newRecord.type;
                    let recId = scriptContext.newRecord.id;
                    let params = getParams();

                    log.audit(nameProcess, 'recType: ' + recType + ' - recId: ' + recId+' - params: '+JSON.stringify(params));

                    let entity = record.load({
                        type: recType,
                        id: recId,
                        isDynamic: true
                    });


                    if (!isEmpty(entity) && !isEmpty(params))
                    {
                        let dni = entity.getValue({fieldId: 'custentity_ptly_ws_dni'});

                        log.debug(nameProcess, 'entity-record: '+JSON.stringify(entity));
                        log.debug(nameProcess, 'entity-subsidiary: '+entity.getValue({fieldId: 'subsidiary'}));
                        log.debug(nameProcess, 'entity-dni: '+dni);
                        log.debug(nameProcess, 'params-subsidiary: '+params.subsidiaria);

                        if (entity.getValue({fieldId: 'subsidiary'}) == params.subsidiaria)
                        {
                            entity.setValue({fieldId: 'terms', value: params.term});
    
                            if (!isEmpty(dni))
                                entity.setValue({fieldId: 'vatregnumber', value: dni});
                            
                            let idRecord = entity.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true                                
                            });
                            
                            log.audit(nameProcess, 'entiry-record-id: '+idRecord);
                        }
                    }
                    else
                    {
                        log.error(nameProcess, 'No se pudo cargar el registro de la entidad');
                    }
                }

            } catch (e) {
                log.error(nameProcess, 'Netsuite Exception afterSubmit: ' + e.message);
            }

            log.audit(nameProcess, 'afterSubmit - FIN del proceso');
        }

        function beforeSubmit(scriptContext) {

            log.audit(nameProcess, 'beforeSubmit - INICIO del proceso - scriptContext.type: '+scriptContext.type);

            try
            {
                if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT)
                {
                    let recType = scriptContext.newRecord.type;
                    let recId = scriptContext.newRecord.id;
                    let params = getParams();
                    let entity = scriptContext.newRecord;

                    log.audit(nameProcess, 'recType: ' + recType + ' - recId: ' + recId+' - params: '+JSON.stringify(params) + ' - entity: '+JSON.stringify(entity));

                    if (!isEmpty(entity))
                    {
                        if (!isEmpty(params))
                        {
                            let dni = entity.getValue({fieldId: 'custentity_ptly_ws_dni'});

                            log.debug(nameProcess, 'entity-record: '+JSON.stringify(entity));
                            log.debug(nameProcess, 'entity-subsidiary: '+entity.getValue({fieldId: 'subsidiary'}));
                            log.debug(nameProcess, 'entity-dni: '+dni);
                            log.debug(nameProcess, 'params-subsidiary: '+params.subsidiaria);
    
                            if (entity.getValue({fieldId: 'subsidiary'}) == params.subsidiaria)
                            {
                                entity.setValue({fieldId: 'terms', value: params.term});
        
                                if (!isEmpty(dni))
                                {
                                    entity.setValue({fieldId: 'vatregnumber', value: dni});
                                    entity.setValue({fieldId: 'custentity_l54_cuit_entity', value: dni});
                                }
                                
                                log.audit(nameProcess, 'entiry-record-id: '+recId);
                            }
                        }
                        else
                        {
                            log.error(nameProcess, 'No se pudo cargar los parametros del script');    
                        }
                    }
                    else
                    {
                        log.error(nameProcess, 'No se pudo cargar el registro de la entidad');
                    }
                }

            } catch (e) {
                log.error(nameProcess, 'Netsuite Exception afterSubmit: ' + e.message);
            }

            log.audit(nameProcess, 'afterSubmit - FIN del proceso');
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

        let getParams = () => {
        
            let response = { error: false, mensaje:'', contextocrear:'', contextomodificar:'' };
            
            try {
                var currScript = runtime.getCurrentScript();
                response.term = currScript.getParameter('custscript_ptly_ws_funtionalities_entter');
                response.subsidiaria = currScript.getParameter('custscript_ptly_ws_funtionalities_entsub');
            } catch (e) {
                response.error = true;
                response.mensaje = "Netsuite Error - Excepción: " + e.message;
            }
    
            return response;
        }

        return {
            //afterSubmit: afterSubmit,
            beforeSubmit: beforeSubmit 
        };

    });