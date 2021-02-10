/**
 *@NApiVersion 2.1
 *@NAmdConfig ./configuration.json
 *@NScriptType MapReduceScript
 *@NModuleScope Public
 */
define(['N/record', 'N/search', 'N/https', 'N/runtime'],

function (record, search, https, runtime) {

    function getParams() {
        
        var body = { error: false, mensaje:'', contextocrear:'', contextomodificar:'' };
        
        try {
            var currScript = runtime.getCurrentScript();
            body.subsidiary = currScript.getParameter('custscript_ptly_notif_process_sub');
        } catch (e) {
            body.error = true;
            body.mensaje = "Netsuite Error - Excepción: " + e.message;
        }

        return body;
    }

    function getInputData() {
        
        const proceso = "PTLY - MercadoPago Notifications Process - GetInputData";
        let dataProcesar = [];

        log.audit(proceso, 'GetInputData - INICIO');

        try{
            //Se obtienen los parametros del script
            let dataParams = getParams();

            log.debug(proceso, "getParams RESPONSE: " + JSON.stringify(dataParams));

            if(!dataParams.error){

                try
                {
                    let hearders = {
                        name: 'Content-Type',
                        value: 'application/json'
                    }

                    let request = https.get({
                        url: 'https://checkoutsbx.herokuapp.com/getNotifications',
                        hearders: hearders
                    }); 

                    log.debug(proceso,'request: '+JSON.stringify(request));

                    if (!isEmpty(request))
                    {
                        if (request.code == 200)
                        {
                            let body = JSON.parse(request.body);

                            log.debug(proceso,'body: '+JSON.stringify(body));
        
                            for (let i=0; i < body.notifications.length; i++)
                            {
                                let obj = {};

                                let newRecord = record.create({
                                    type: 'customrecord_ptly_mp_notific'
                                });
    
                                newRecord.setValue({
                                    fieldId: 'externalid',
                                    value: body.notifications[i]._id
                                });
    
                                newRecord.setValue({
                                    fieldId: 'custrecord_ptly_mp_notific_type',
                                    value: body.notifications[i].type
                                });
    
                                newRecord.setValue({
                                    fieldId: 'custrecord_ptly_mp_notific_id',
                                    value: body.notifications[i].id
                                });
    
                                newRecord.setValue({
                                    fieldId: 'custrecord_ptly_mp_notific_sub',
                                    value: dataParams.subsidiary
                                });
    
                                let idRecord =  newRecord.save();
    
                                log.debug(proceso, 'ID Registro: '+idRecord);
    
                                if(!isEmpty(idRecord))
                                {
                                    obj.idMongo = body.notifications[i]._id;
                                    obj.idNS = body.notifications[i].idRecord;
                                    obj.type = body.notifications[i].type;
                                    obj.id = body.notifications[i].id;
                                    dataProcesar.push(idRecord);
                                }
                            } 
                        }
                    }
                }
                catch(e)
                {
                    log.error(proceso, JSON.stringify(e.message));
                }

                log.debug(proceso, 'dataProcesar: '+JSON.stringify(dataProcesar));

                return dataProcesar;

            }else{
                log.error(proceso, JSON.stringify(dataParams.mensaje));
            }
        }catch(err) {
            log.error(proceso, JSON.stringify(err));
            return null;
        }
        log.audit(proceso, 'GetInputData - FIN');
    }

    function map(context) {

        
        const proceso = "PTLY - MercadoPago Notifications Process - Map";
        log.audit(proceso, 'Map - INICIO');

        try
        {
            var resultado = context.value;
            log.debug(proceso, 'Map - LINE 135 - resultado: '+JSON.stringify(resultado));

            if (!isEmpty(resultado)) {

                for (let i=0; i < resultado.length; i++)
                {
                    let obj = {};
                    obj.idMongo = resultado[i].idMongo;
                    obj.idNS = resultado[i].idNS;
                    obj.type = resultado[i].type;
                    obj.id = resultado[i].id;
                    obj.urlMPSearchPayment = `https://api.mercadopago.com/v1/payments/search?id=${resultado[i].id}`;
                }

                var searchResult = JSON.parse(resultado);
                var obj = searchResult;

                log.debug(proceso, 'Map - LINE 232');
                var clave = obj.idPayment;
                context.write(clave, JSON.stringify(obj));
            }

        } catch (e) {
            log.error('Map Error', JSON.stringify(e.message));
        }

        log.audit(proceso, 'Map - FIN');
    }

    function reduce(context) {

        log.audit(proceso, 'Reduce - INICIO');

        var respuesta = { error: false, idClave: context.key, messages: [], detalle_error: '', idTransaccion: '' };
        var mensaje = "";

        try {

            log.debug(proceso, 'Reduce - LINE 253 - context : ' + JSON.stringify(context));

            if (!isEmpty(context.values) && context.values.length > 0) {

                for (var k = 0; k < context.values.length; k++)
                {
                    var registro = JSON.parse(context.values[k]);
                    respuesta.idTransaccion = `${registro.idPayment} - Numero Localizado: ${registro.nroLocalizado}`;
                    log.debug(proceso,'Reduce - LINE 261 - registro: '+JSON.stringify(registro));
            
                    var newRecord = record.create({
                        type: record.Type.CUSTOMER_PAYMENT,
                        isDynamic: true
                    });
            
                    newRecord.setValue({
                        fieldId: 'customer',
                        value: registro.idCustomer
                    });
            
                    newRecord.setValue({
                        fieldId: 'subsidiary',
                        value: registro.subsidiary
                    });
            
                    newRecord.setValue({
                        fieldId: 'aracct',
                        value: registro.araccount
                    });
            
                    newRecord.setValue({
                        fieldId: 'currency',
                        value: registro.currency
                    });
            
                    newRecord.setValue({
                        fieldId: 'memo',
                        value: `Ajuste de saldo Pago ${registro.nroLocalizado}`
                    });
            
                    newRecord.setValue({
                        fieldId: 'paymentmethod',
                        value: registro.payMethod
                    });
            
                    //Se valida si el pago a saldar figura en la sublista de creditos
                    const sublistcredit = 'credit'; 
                    const sublistapply = 'apply'; 
                    var existeCredito = false;
                    var existeAsiento = false;
                    var creditAmount = 0.00;
                    var journalAmount = 0.00;
                    var sublist = ''

                    if (!registro.adjustPositiveBalance)
                        sublist = sublistcredit;
                    else
                        sublist = sublistapply;

                    var countLinesCredit = newRecord.getLineCount({ sublistId: sublist });

                    log.debug(proceso,'Reduce - LINE 314 - countLines'+sublist+': '+countLinesCredit);
            
                    for (k = 0; k < countLinesCredit; k++)
                    {
                        newRecord.selectLine({
                            sublistId: sublist,
                            line: k
                        });
            
                        var docNumber = newRecord.getCurrentSublistValue({
                            sublistId: sublist,
                            fieldId: 'doc'
                        });
            
                        log.debug(proceso,'Reduce - LINE 328 - docNumber: '+docNumber+' - registro.idPayment: '+registro.idPayment);
                        if (docNumber == registro.idPayment)
                        {
                            existeCredito = true;
        
                            newRecord.setCurrentSublistValue({
                                sublistId: sublist,
                                fieldId: 'apply',
                                value: true,
                                ignoreFieldChange: false
                            });
        
                            newRecord.commitLine({
                                sublistId:sublist
                            });
        
                            creditAmount = newRecord.getCurrentSublistValue({
                                sublistId: sublist,
                                fieldId: 'amount'
                            });
        
                            log.debug(proceso,`Credito ID ${registro.idPayment} marcado - amountApplyCredito: ${creditAmount}`);
                        }
                    }
                   
                    //Si se encontró credito a favor del cliente, se busca el asiento correspondiente
                    if (existeCredito && creditAmount > 0)
                    {
                        if (!registro.adjustPositiveBalance)
                            sublist = sublistapply;
                        else
                            sublist = sublistcredit;

                        var countLinesApply = newRecord.getLineCount({ sublistId: sublist });
                        log.debug(proceso,'Reduce - LINE 362 - countLines'+sublist+': '+countLinesApply);

                        if (countLinesApply > 0)
                        {
                            for (j = 0; j < countLinesApply; j++)
                            {
                                newRecord.selectLine({
                                    sublistId: sublist,
                                    line: j
                                });
            
                                var docNumber = newRecord.getCurrentSublistValue({
                                    sublistId: sublist,
                                    fieldId: 'doc'
                                });

                                var lineAmount = newRecord.getCurrentSublistValue({
                                    sublistId: sublist,
                                    fieldId: 'due'
                                });
            
                                //Se valida si el asiento que figura en la transaccion (sublista apply) coincide con uno de los asientos de ajustes generados
                                if (!isEmpty(docNumber))
                                {
                                    log.debug(proceso,'Reduce - LINE 386 - indice: '+j +' - docNumber: '+docNumber+' - lineAmount: '+lineAmount + ' - creditAmount: '+creditAmount);

                                    var arrayTemporal =  registro.journals.filter(function (elemento) {
                                        
                                        if (elemento == docNumber && creditAmount == lineAmount)
                                        {
                                            existeAsiento = true;
    
                                            newRecord.setCurrentSublistValue({
                                                sublistId: sublist,
                                                fieldId: 'apply',
                                                value: true,
                                                ignoreFieldChange: false
                                            });
        
                                            newRecord.setCurrentSublistValue({
                                                sublistId: sublist,
                                                fieldId: 'amount',
                                                value: creditAmount,
                                                ignoreFieldChange: false
                                            });
                
                                            newRecord.commitLine({
                                                sublistId: sublist
                                            });
        
                                            journalAmount = newRecord.getCurrentSublistValue({
                                                sublistId: sublist,
                                                fieldId: 'amount'
                                            });

                                            creditAmount = 0.00;
                                        
                                            log.debug(proceso,`Apply Transaction ID:  ${docNumber} marcado - amountApplyJournal: ${journalAmount}`);
                                        }
                                    });
                                }
                            }
                            log.debug(proceso,`Reduce - LINE 424 - registro: ${JSON.stringify(newRecord)}`);
            
                            if (existeAsiento)
                            {
                                var idnewrecord =  newRecord.save();
                                log.audit(proceso,`PagoID Generado:  ${idnewrecord}`);
                            }
                            else
                            {
                                var mensaje = `No existen asientos disponibles con el monto correcto para aplicar a la transaccion con ID: ${registro.idPayment} y numero de localizado: ${registro.nroLocalizado}`;
                                respuesta.error = true;
                                respuesta.detalle_error = mensaje;
                                log.error(proceso,mensaje);    
                            }
                        }
                        else
                        {
                            var mensaje = `No existen transacciones disponibles disponibles en la sublista secundaria ${sublist}`;
                            respuesta.error = true;
                            respuesta.detalle_error = mensaje;
                            log.error(proceso,mensaje);
                        }
                    }
                    else
                    {
                        var mensaje = `No se generó la transacción dado que no se encontró la transacción en la sublista primaria ${sublist} de la transacción`;
                        respuesta.error = true;
                        respuesta.detalle_error = mensaje;
                        log.error(proceso, mensaje);
                    }
                }
            
            }

            
        } catch (e) {
            respuesta.error = true;
            mensaje = 'Excepcion Inesperada - Mensaje: ' + JSON.stringify(e.message);
            respuesta.detalle_error = mensaje;
            log.error('Reduce error - ', mensaje);
        }

        log.debug("Respuesta: ", JSON.stringify(respuesta));

        context.write(context.key, respuesta);

        log.audit(proceso, 'Reduce - FIN');
    }

    function summarize(summary) {
        try {

            var totalReduceErrors = 0;
            var arrayReduceResults = [];
            var messages = '';

            log.debug(proceso, 'Inicio - Summarize');

            summary.output.iterator().each(function (key, value) {

                var objResp = JSON.parse(value);

                log.debug(proceso, 'objResp: ' + JSON.stringify(objResp));

                if (objResp.error == true) {
                    totalReduceErrors++;
                    log.error(proceso, `SUMMARIZE - Transaccion NO procesada ${objResp.idTransaccion}`);
                }else{
                    log.debug(proceso, `SUMMARIZE - Transaccion procesada exitosamente ${objResp.idTransaccion}`);
                }
                arrayReduceResults.push(objResp);
                return true;
            });

            log.audit(proceso,'SUMMARIZE - Total errores en procesamiento: ' + totalReduceErrors);

            log.debug(proceso, 'Fin - Summarize');

        } catch (e) {
            log.error('Summarize catch error', JSON.stringify(e.message));
        }
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
        getInputData: getInputData,
        map: map/*,
        reduce: reduce,
        summarize: summarize*/
    }
});