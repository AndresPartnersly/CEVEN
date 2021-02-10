/**
 *@NApiVersion 2.1
 *@NAmdConfig ./configuration.json
 *@NScriptType MapReduceScript
 *@NModuleScope Public
 */
define(['N/record', 'N/search', 'N/https'],

function (record, search, https) {

    var proceso = "PTLY - MercadoPago Notifications Process.js";

    function getParams() {
        
        var response = { error: false, mensaje:'', contextocrear:'', contextomodificar:'' };
        
        try {
            var currScript = runtime.getCurrentScript();
            response.subsidiary = currScript.getParameter('custscript_ptly_notif_process_sub');
        } catch (e) {
            response.error = true;
            response.mensaje = "Netsuite Error - Excepción: " + e.message;
        }

        return response;
    }

    function getInputData() {

        log.audit(proceso, 'GetInputData - INICIO');

        var dataProcesar = [];
        var dataProcesarMap = [];
        var idJournals = [];

        try{

            //Se obtienen los parametros del script
            var dataParams = getParams();

            log.debug(proceso, "getParams RESPONSE: " + JSON.stringify(dataParams));

            if(!dataParams.error){

                try
                {
                    let response = https.get({
                        url: 'https://checkoutsbx.herokuapp.com/getNotifications',
                    }); 

                    console.log('response: '+JSON.stringify(response));
                }
                catch(e)
                {

                }

                //INICIO - Se cargan las transacciones de entrada de diario creadas para el ajuste de las transacciones
                var ssJournals = search.load({
                    id: 'customsearch_ptly_jounals_adjust',
                    type: search.Type.TRANSACTION
                })

                // Filtro subsidiaria
                var ssJournalsFilterSub = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: dataParams.subsidiary
                });
                ssJournals.filters.push(ssJournalsFilterSub);

                // Filtro moneda
                var ssJournalsFilterCurr = search.createFilter({
                    name: 'currency',
                    operator: search.Operator.IS,
                    values: dataParams.currency
                });
                ssJournals.filters.push(ssJournalsFilterCurr);

                var ssJournalsRun = ssJournals.run();
                var ssJournalsRunRange = ssJournalsRun.getRange({
                    start: 0,
                    end: 1000
                }); 
                log.debug(proceso, "GetInputData - LINE 76 - ssJournalsRunRange.length: "+ ssJournalsRunRange.length);
                for (var h = 0; h < ssJournalsRunRange.length; h++)
                {
                    idJournals.push(ssJournalsRunRange[h].getValue(ssJournalsRun.columns[0]));
                }
                //FIN - Se cargan las transacciones de entrada de diario creadas para el ajuste de las transacciones

                log.debug(proceso, "GetInputData - LINE 83 - idJournals: "+JSON.stringify(idJournals));


                //Si existen entradas de diarios para ajustar se avanza con el proceso
                if (!isEmpty(idJournals) && idJournals.length > 0)
                {
                    //Se cargan los pagos de cliente, notas de credito y aplicaciones de deposito a ajustar
                    var ssTransactions = search.load({
                        id:'customsearch_ptly_custpayment_pend',
                        type: search.Type.TRANSACTION
                    });

                    // Filtro subsidiaria
                    var ssTransactionsFilterSub = search.createFilter({
                        name: 'subsidiary',
                        operator: search.Operator.IS,
                        values: dataParams.subsidiary
                    })
                    ssTransactions.filters.push(ssTransactionsFilterSub);

                    // Filtro subsidiaria
                    var ssTransactionsFilterCurr = search.createFilter({
                        name: 'currency',
                        operator: search.Operator.IS,
                        values: dataParams.currency
                    })
                    ssTransactions.filters.push(ssTransactionsFilterCurr);
   
                    var ssTransactionsRun = ssTransactions.run()
                    var ssTransactionsRunRange = ssTransactionsRun.getRange({
                        start: 0,
                        end: 1000
                    });

                    log.debug(proceso, "GetInputData - LINE 117 - ssTransactionsRunRange: "+ssTransactionsRunRange.length);
                    if (ssTransactionsRunRange.length > 0)
                    {
                        for (var i = 0; i < ssTransactionsRunRange.length; i++)
                        {
                            var object = {};
                            object.idCustomer = ssTransactionsRunRange[i].getValue(ssTransactionsRun.columns[6]);
                            object.subsidiary = ssTransactionsRunRange[i].getValue(ssTransactionsRun.columns[12]);
                            object.currency   = ssTransactionsRunRange[i].getValue(ssTransactionsRun.columns[11]);
                            object.idPayment  = ssTransactionsRunRange[i].getValue(ssTransactionsRun.columns[0]);
                            object.nroLocalizado = ssTransactionsRunRange[i].getValue(ssTransactionsRun.columns[5]);
                            object.araccount = dataParams.araccount;
                            object.payMethod = dataParams.payMethod;
                            object.adjustPositiveBalance = dataParams.adjustPositiveBalance;
                            object.journals = idJournals;
                            dataProcesar.push(object);
                        }
        
                        log.debug(proceso, 'dataProcesar: '+JSON.stringify(dataProcesar));
                    }
                    else
                    {
                        var mensaje = 'No existen transacciones de tipo pagos de cliente, nota de credito o aplicacion de deposito a saldar y/o ajustar';
                        log.error(proceso, mensaje);
                    }
                    //FIN - Se cargan los asientos a aplicar para cargar en arreglo


                    //INICIO - Se cargan las entradas de diario a ajustar
                    var ssJournalsAdjust = search.load({
                        id: 'customsearch_ptly_custpayment_pend_3',
                        type: search.Type.TRANSACTION
                    });

                    // Filtro subsidiaria
                    var ssJournalsAdjustFilterSub = search.createFilter({
                        name: 'subsidiary',
                        operator: search.Operator.IS,
                        values: dataParams.subsidiary
                    })
                    ssJournalsAdjust.filters.push(ssJournalsAdjustFilterSub);

                    // Filtro subsidiaria
                    var ssJournalsAdjustFilterCurr = search.createFilter({
                        name: 'currency',
                        operator: search.Operator.IS,
                        values: dataParams.currency
                    })
                    ssJournalsAdjust.filters.push(ssJournalsAdjustFilterCurr);
   
                    var ssJournalsAdjustRun = ssJournalsAdjust.run()
                    var ssJournalsAdjustRunRange = ssJournalsAdjustRun.getRange({
                        start: 0,
                        end: 1000
                    });

                    log.debug(proceso, "GetInputData - LINE 173 - ssJournalsAdjustRunRange: "+ssJournalsAdjustRunRange.length);
                    if (ssJournalsAdjustRunRange.length > 0)
                    {
                        for (var i = 0; i < ssJournalsAdjustRunRange.length; i++)
                        {
                            var object = {};
                            object.idCustomer = ssJournalsAdjustRunRange[i].getValue(ssJournalsAdjustRun.columns[6]);
                            object.subsidiary = ssJournalsAdjustRunRange[i].getValue(ssJournalsAdjustRun.columns[12]);
                            object.currency   = ssJournalsAdjustRunRange[i].getValue(ssJournalsAdjustRun.columns[11]);
                            object.idPayment  = ssJournalsAdjustRunRange[i].getValue(ssJournalsAdjustRun.columns[0]);
                            object.nroLocalizado = ssJournalsAdjustRunRange[i].getValue(ssJournalsAdjustRun.columns[5]);
                            object.araccount = dataParams.araccount;
                            object.payMethod = dataParams.payMethod;
                            object.adjustPositiveBalance = dataParams.adjustPositiveBalance;
                            object.journals = idJournals;
                            dataProcesar.push(object);
                        }
        
                        log.debug(proceso, 'dataProcesar: '+JSON.stringify(dataProcesar));
                    }
                    else
                    {
                        var mensaje = 'No existen entradas de diario a saldar y/o ajustar';
                        log.error(proceso, mensaje);
                    }
                    //FIN - Se cargan las entradas de diario a ajustar
                }
                else
                {
                    var mensaje = 'No existen asientos para aplicar, fin del proceso';
                    log.error(proceso, mensaje);
                }

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

        log.audit(proceso, 'Map - INICIO');

        try {

            var resultado = context.value;
            log.debug(proceso, 'Map - LINE 225 - resultado: '+JSON.stringify(resultado));

            if (!isEmpty(resultado)) {

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
        /*map: map,
        reduce: reduce,
        summarize: summarize*/
    }
});