/**
 *@NApiVersion 2.1
 *@NAmdConfig ./configuration.json
 *@NScriptType MapReduceScript
 *@NModuleScope Public
 */
define(['N/record', 'N/search', 'N/https', 'N/runtime', 'N/query'],

function (record, search, https, runtime, query) {

    function getParams() {
        
        let body = { error: false, mensaje:'', contextocrear:'', contextomodificar:'' };
        
        try
        {
            let currScript = runtime.getCurrentScript();
            body.subsidiary = currScript.getParameter('custscript_ptly_notif_process_sub');
            body.idStatusApprovPayment = currScript.getParameter('custscript_ptly_notif_process_appr_stat');
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

        try
        {
            //Se obtienen los parametros del script
            let dataParams = getParams();

            log.debug(proceso, "getParams RESPONSE: " + JSON.stringify(dataParams));

            if(!isEmpty(dataParams))
            {
                if(!dataParams.error)
                {
                    let accountId = runtime.accountId;
                    let config = getConfiguration(dataParams.subsidiary, accountId);
                    if (config.existeConfig)
                    {
                        try
                        {
                            let resp = getNotificationsMP(config);

                            if (!isEmpty(resp.request) && !resp.error)
                            {
                                if (resp.request.code == 200)
                                {
                                    let body = JSON.parse(resp.request.body);

                                    log.debug(proceso,'Total notificaciones sin procesar: '+body.notifications.length);
                
                                    for (let i=0; i < body.notifications.length; i++)
                                    {
                                        try
                                        {
                                            let resp = createNSNotificationMP(body.notifications[i], dataParams, config);
                
                                            if(!isEmpty(resp) && !resp.error)
                                            {
                                                dataProcesar.push(resp.obj);
                                            }
                                        }
                                        catch(e)
                                        {
                                            log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
                                        }
                                    } 
                                }
                                else
                                {
                                    log.error(proceso, `Error al consultar notificaciones en servicio externo - Codigo de error HTTPS: ${resp.request.code}`);
                                }
                            }
                        }
                        catch(e)
                        {
                            log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
                        }
                    }
                    else
                    {
                        log.error(proceso, `No existe configuración para la subsidiaria y ambiente actual`);        
                    }
                }
                else
                {
                    log.error(proceso, JSON.stringify(dataParams.mensaje));
                }
            }
            else
            {
                log.error(proceso, `No se pudo obtener información de los parametros del script`);
            }

            log.debug(proceso,`Cantidad de registros a procesar: ${dataProcesar.length} - Data a procesar: ${JSON.stringify(dataProcesar)}`)

            return dataProcesar;
        }
        catch(err)
        {
            log.error(proceso, `Excepción: ${JSON.stringify(err)}`);
            return null;
        }
        log.audit(proceso, 'GetInputData - FIN');
    }

    function map(context) {

        const proceso = "PTLY - MercadoPago Notifications Process - Map";

        log.audit(proceso, 'Map - INICIO');

        try
        {
            let result = JSON.parse(context.value);
            log.debug(proceso, 'Map - Datos a procesar: '+JSON.stringify(result));

            if (!isEmpty(result))
            {
                let resp = procesarRegMap(result);

                if (!isEmpty(resp) && !resp.error)
                {
                    let key = resp.obj.idMongo;
                    context.write(key, JSON.stringify(resp.obj));
                }
                else
                {
                    log.error(proceso, `Error al procesar notificación con ID: ${result.idMongo}`);        
                }
            }

        } catch (e) {
            log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
        }
        log.audit(proceso, 'Map - FIN');
    }

    function reduce(context) {

        const proceso = "PTLY - MercadoPago Notifications Process - Reduce";

        log.audit(proceso, 'Reduce - INICIO');

        let respuesta = { error: false, message:'', key: context.key, data: {} };
        let mensaje = "";

        try
        {
            log.debug(proceso, 'Reduce - Key : ' + context.key);

            if (!isEmpty(context.values) && context.values.length > 0)
            {
                for (let k = 0; k < context.values.length; k++)
                {
                    let data = JSON.parse(context.values[k]);
                   
                    try
                    {
                        let resp = searchPaymentMP(data);

                        if (!isEmpty(resp.request))
                        {
                            if (resp.request.code == 200)
                            {
                                try
                                {
                                    let body = JSON.parse(resp.request.body);

                                    log.debug(proceso,'Data Payment MP: '+JSON.stringify(body));

                                    if (body.results.length > 0)
                                    {
                                        let idInternoPedido = parseInt(body.results[0].external_reference);

                                        if (!isEmpty(idInternoPedido))
                                        {
                                            let resp = updNSNotificationMP(data.idNS, body, idInternoPedido);
                                            let respSO = updSO(data, body, idInternoPedido);

                                            if (!isEmpty(resp) && !resp.error)
                                                log.debug(proceso,`Notificación actualizada con información del Pago - ID: ${data.idNS}`);

                                            if (!isEmpty(respSO) && respSO.soUpd)
                                                log.debug(proceso,`Orden de venta actualizada con información del Pago - ID: ${idInternoPedido}`);

                                            if (!isEmpty(resp) && !resp.error && !isEmpty(respSO) && respSO.soUpd)
                                            {
                                                if(!isEmpty(resp.idRecord) && !isEmpty(respSO.idRecord))
                                                {
                                                    let obj = {};
                                                    obj.idMongo = data.idMongo;
                                                    obj.idNS = data.idNS;
                                                    obj.config = data.config;
                                                    respuesta.data = obj;
                                                    context.write(context.key, respuesta);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        log.error(proceso, `La consulta a MercadoPago no devolvio data valida - URL: ${data.urlMPSearchPayment}`);    
                                    }
                                }
                                catch(e)
                                {
                                    respuesta.error = true;
                                    respuesta.message = `Excepción: ${JSON.stringify(e.message)}`; 
                                    log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
                                }
                            }
                            else
                            {
                                log.error(proceso, `Error al consultar los datos del pago en Mercadopago - Codigo de error HTTP: ${resp.request.code} - Detalles: ${JSON.stringify(resp.request)}`);
                            }
                        }
                    }
                    catch(e)
                    {
                        log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
                    }
                }
            }
        } catch (e) {
            respuesta.error = true;
            mensaje = 'Excepcion Inesperada - Mensaje: ' + JSON.stringify(e.message);
            respuesta.detalle_error = mensaje;
            log.error('Reduce error - ', mensaje);
        }
        log.audit(proceso, 'Reduce - FIN');
    }

    function summarize(summary) {

        const proceso = "PTLY - MercadoPago Notifications Process - Summarize";
        dataProcesar = [];

        try {

            log.debug(proceso, 'Inicio - Summarize - summary: '+JSON.stringify(summary));

            summary.output.iterator().each(function (key, value)
            {
                let objResp = JSON.parse(value);
                if (!isEmpty(objResp))
                {
                    dataProcesar.push(objResp);
                }  
                return true;
            });

            log.debug(proceso,'dataProcesar: '+JSON.stringify(dataProcesar));

            if (dataProcesar.length > 0)
            {
                for (let i=0; i < dataProcesar.length; i++)
                {
                    let body = {
                        idPayment: dataProcesar[i].data.idMongo
                    }

                    let resp = updNotificationsMPColletion(dataProcesar[i].data.config, body);

                    if (!isEmpty(resp) && !resp.error)
                    {
                        if (resp.request.code == 201)
                        {
                            log.debug(proceso,`Notificación actualizada en servicio externo de notificaciones - ID ${dataProcesar[i].data.idMongo}`);
                        }
                        else
                        {
                            log.error(proceso,`Error al actualizar notificación en externo de notificaciones - ID ${dataProcesar[i].data.idMongo} - Detalle: ${resp}`);
                        }
                    }
                }
            }

            log.debug(proceso, 'Fin - Summarize');

        } catch (e) {
            log.error('Summarize catch error', JSON.stringify(e.message));
        }
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

    let createNSNotificationMP = (body, dataParams, config) => {

        let resp = { error: false, message: ``, obj: {}}
        const proceso = "PTLY - MercadoPago Notifications Process - createNSNotificationMP";

        try
        {
            let obj = {};
            let newRecord;
            let notifExist = notifexist(body._id);

            log.debug(proceso, 'notifExist: '+JSON.stringify(notifExist));

            if (!notifExist.existe)
            {
                newRecord = record.create({
                    type: 'customrecord_ptly_mp_notific'
                });

                newRecord.setValue({
                    fieldId: 'externalid',
                    value: body._id
                });
            }
            else
            {
                newRecord = record.load({
                    type: 'customrecord_ptly_mp_notific',
                    id: notifExist.obj.idInterno
                });
            }

            newRecord.setValue({
                fieldId: 'custrecord_ptly_mp_notific_type',
                value: body.type
            });

            newRecord.setValue({
                fieldId: 'custrecord_ptly_mp_notific_id',
                value: body.id
            });

            newRecord.setValue({
                fieldId: 'custrecord_ptly_mp_notific_sub',
                value: dataParams.subsidiary
            });

            let idRecord =  newRecord.save();

            log.debug(proceso, 'ID Registro: '+idRecord);

            if(!isEmpty(idRecord))
            {
                obj.idMongo = body._id;
                obj.idNS = idRecord;
                obj.type = body.type;
                obj.id = body.id;
                obj.config = config;
                obj.params = dataParams;
                resp.obj = obj;
                return resp;
            }
        }
        catch(e)
        {
            log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
            resp.error = true;
            resp.message = `Excepción: ${JSON.stringify(e.message)}`;
            return resp;
        }
    }

    let notifexist = (extId) =>
    {
        let resp = { error: false, existe: false, message: ``, obj: {}}
        const proceso = "PTLY - MercadoPago Notifications Process - notifexist";

        let arrResults = [];

        var strSQL = "SELECT \n CUSTOMRECORD_PTLY_MP_NOTIFIC.name AS nameRAW, CUSTOMRECORD_PTLY_MP_NOTIFIC.id AS idinterno \nFROM \n CUSTOMRECORD_PTLY_MP_NOTIFIC\nWHERE \n CUSTOMRECORD_PTLY_MP_NOTIFIC.externalid = '"+extId+"'\n";
  
        let objPagedData = query.runSuiteQLPaged({
            query: strSQL,
            pageSize: 1
        });
        
        objPagedData.pageRanges.forEach(function(pageRange) {
            //fetch
            let objPage = objPagedData.fetch({ index: pageRange.index }).data;
            // Map results to columns 
            arrResults.push.apply(arrResults, objPage.asMappedResults());
        });

        if (arrResults.length > 0)
        {
            resp.obj.externalId = extId;
            resp.obj.idInterno = arrResults[0].idinterno;
            resp.existe = true;
        }

        return resp;
    }

    let updNSNotificationMP = (idNS, body, idPedido) => {

        let resp = { error: false, message: ``, idRecord: null}
        const proceso = "PTLY - MercadoPago Notifications Process - updNSNotificationMP";

        try
        {
            let newRecord = record.load({
                type: 'customrecord_ptly_mp_notific',
                id: idNS
            });

            if (!isEmpty(newRecord))
            {
                if (!isEmpty(idPedido))
                {
                    newRecord.setValue({
                        fieldId: 'custrecord_ptly_mp_notific_so',
                        value: idPedido
                    });
                }

                newRecord.setValue({
                    fieldId: 'custrecord_ptly_mp_notific_det_mp',
                    value: JSON.stringify(body)
                });

                let idRecord =  newRecord.save();

                log.debug(proceso, 'Registro actualizado ID: '+idRecord);

                if(!isEmpty(idRecord))
                    resp.idRecord = idRecord;
                
                return resp;
            }
        }
        catch(e)
        {
            log.error(proceso, `Excepción: ${JSON.stringify(e.message)} - ID Registro: ${idNS}`);
            resp.error = true;
            resp.message = `Excepción: ${JSON.stringify(e.message)} - ID Registro: ${idNS}`;
            return resp;
        }
    }


    let updSO = (data, body, idPedido) => {

        let resp = { error: false, message: ``, idRecord: null, soUpd: false}
        const proceso = "PTLY - MercadoPago Notifications Process - updSO";

        try
        {
            let soRecord = record.load({
                type: record.Type.SALES_ORDER,
                id: idPedido,
                isDynamic: true
            });

            if (!isEmpty(soRecord))
            {
                let subsidiary = soRecord.getValue({ fieldId: 'subsidiary'});

                //MONTO DEL PAGO
                let total_paid_amount = parseFloat(body.results[0].transaction_details.total_paid_amount,10);

                log.debug(proceso,`total_paid_amount: ${total_paid_amount}`);

                soRecord.setValue({
                    fieldId: 'custbody_ptly_mp_monto_total_pago',
                    value: total_paid_amount
                });

                //MONTO COMISION
                let fee_amount = 0.00;
                let fee_perc = 0.00;
                if (body.results[0].fee_details.length > 0)
                {
                    fee_amount = parseFloat(body.results[0].fee_details[0].amount,10);
                    fee_perc  = (parseFloat(fee_amount,10) * parseFloat(100,10)) / total_paid_amount;
                }

                log.debug(proceso,`idSO: ${idPedido} - fee_amount:  ${fee_amount} - fee_perc: ${fee_perc}`);

                soRecord.setValue({
                    fieldId: 'custbody_ptly_mp_monto_comision',
                    value: fee_amount
                });

                //PORCENTAJE COMISION
                soRecord.setValue({
                    fieldId: 'custbody_ptly_mp_porc_comision',
                    value: fee_perc
                });

                //MEDIO DE PAGO
                let payment_method_id = getPaymentMethod(body.results[0].payment_method_id, subsidiary);
                let paymentmethod = payment_method_id[0].idpaymentmethod;

                log.debug(proceso,'PaymentMethod: '+JSON.stringify(payment_method_id));

                soRecord.setValue({
                    fieldId: 'custbody_ptly_mp_medio_pago',
                    value: payment_method_id[0].idraw
                });

                //ESTADO DEL PAGO
                let status = getPaymentStatus(body.results[0].status);

                log.debug(proceso,'PaymentStatus: '+JSON.stringify(status));

                soRecord.setValue({
                    fieldId: 'custbody_ptly_mp_estado_pago',
                    value: status[0].idraw
                });

                if (data.params.idStatusApprovPayment == status[0].idraw)
                {
                    //METODO DE PAGO NETSUITE
                    soRecord.setValue({
                        fieldId: 'paymentmethod',
                        value: paymentmethod
                    });

                    //ID DEL PAGO
                    let idPayment = body.results[0].id;

                    soRecord.setValue({
                        fieldId: 'custbody_ptly_mp_id_pago',
                        value: idPayment
                    });

                    log.debug(procesarRegMap,`Pago Aprobado, se actualiza metodo de pago NetSuite e ID de Pago - paymentmethod: ${paymentmethod} - IdPayment: ${idPayment}`);
                }

                let idRecord =  soRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                log.debug(proceso, 'SO actualizada ID: '+idRecord);

                if(!isEmpty(idRecord))
                {
                    resp.idRecord = idRecord;
                    resp.soUpd = true;
                }
                
                return resp;
            }
        }
        catch(e)
        {
            log.error(proceso, `Excepción: ${JSON.stringify(e.message)} ID SO: ${idPedido}`);
            resp.error = true;
            resp.message = `Excepción: ${JSON.stringify(e.message)}`;
            return resp;
        }
    }

    let procesarRegMap = (objMap) => {

        let resp = { error: false, message: ``, obj: {}}
        const proceso = "PTLY - MercadoPago Notifications Process - procesarRegMap";

        try
        {
            let obj = {};
            obj.idMongo = objMap.idMongo;
            obj.idNS = objMap.idNS;
            obj.type = objMap.type;
            obj.id = objMap.id;
            obj.urlMPSearchPayment = `${objMap.config.servBuscarPago}?id=${objMap.id}`;
            obj.config = objMap.config;
            obj.params = objMap.params;
            resp.obj = obj;

            return resp;
        }
        catch(e)
        {
            log.error(proceso, `procesarRegMap - Excepción: ${JSON.stringify(e.message)}`);
            resp.error = true;
            resp.message = `procesarRegMap - Excepción: ${JSON.stringify(e.message)}`;
            return resp;
        }
    }

    let getNotificationsMP = (config) => {

        let resp = { error: false, message: ``, request: null}
        const proceso = "PTLY - MercadoPago Notifications Process - getNotificationsMP";

        try
        {
            let token = getToken(config);

            if (!isEmpty(token))
            {
                let headers = {
                    'Content-Type':'application/json',
                    'x-access-token':token
                }

                let request = https.get({
                    url: config.servDescNotif,
                    headers: headers
                }); 

                resp.request = request;

                log.debug(proceso,'request: '+JSON.stringify(request));

                return resp;
            }
            else
            {
                return resp;
            }

        }
        catch(e)
        {
            log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
            resp.error = true;
            resp.message = `Excepción: ${JSON.stringify(e.message)}`;
            return resp;
        }
    }

    let updNotificationsMPColletion = (config, body) => {

        let resp = { error: false, message: ``, request: null}
        const proceso = "PTLY - MercadoPago Notifications Process - updNotificationsMPColletion";

            try
            {
                let token = getToken(config);
                log.debug(proceso,'LINE 585 - token: '+JSON.stringify(token));
                if (!isEmpty(token))
                {
                    let headers = {
                        'Content-Type':'application/json',
                        'x-access-token':token
                    }
                    
                    let request = https.post({
                        url: config.servActNotif,
                        headers: headers,
                        body: JSON.stringify(body)
                    }); 

                    resp.request = request;

                    log.debug(proceso,'request: '+JSON.stringify(request));

                    return resp;
                }
                else
                {
                    return resp;
                }
            }
            catch(e)
            {
                log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
                resp.error = true;
                resp.message = `Excepción: ${JSON.stringify(e.message)}`;
                return resp;
            }
    }

    let searchPaymentMP = (data) => {

        let resp = { error: false, message: ``, request: null}
        const proceso = "PTLY - MercadoPago Notifications Process - searchPaymentMP";

        try
        {
            let token = `Bearer ${data.config.tokenMP}`

            let headers = {
                'Authorization': token,
                'Content-Type':'application/json',
                'Accept':'*/*'
            }

            let request = https.get({
                url: data.urlMPSearchPayment,
                headers: headers
            }); 

            resp.request = request;

            log.debug(proceso,'request: '+JSON.stringify(request));

            return resp;

        }
        catch(e)
        {
            log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
            resp.error = true;
            resp.message = `Excepción: ${JSON.stringify(e.message)}`;
            return resp;
        }
    }

    let getPaymentStatus = (status) => {

        let arrResults = [];

        let strSQL = "SELECT \n CUSTOMRECORD_PTLY_MP_ESTADO_PAGO.\"ID\" AS idRAW /*{id#RAW}*/, \n CUSTOMRECORD_PTLY_MP_ESTADO_PAGO.custrecord_ptly_mp_estado_pago_id AS custrecordptlympestadopag /*{custrecord_ptly_mp_estado_pago_id#RAW}*/, \n CUSTOMRECORD_PTLY_MP_ESTADO_PAGO.name AS nameRAW /*{name#RAW}*/\nFROM \n CUSTOMRECORD_PTLY_MP_ESTADO_PAGO\nWHERE \n CUSTOMRECORD_PTLY_MP_ESTADO_PAGO.custrecord_ptly_mp_estado_pago_id IN ('"+status+"')\n";
    
        let objPagedData = query.runSuiteQLPaged({
            query: strSQL,
            pageSize: 1
        });
       
        objPagedData.pageRanges.forEach(function(pageRange) {
            //fetch
            let objPage = objPagedData.fetch({ index: pageRange.index }).data;
            // Map results to columns 
            arrResults.push.apply(arrResults, objPage.asMappedResults());
        });
    
        return arrResults;
    }


    let getPaymentMethod = (payment_method_id, subsidiary) => {

        let arrResults = [];

        let strSQL = "SELECT \n CUSTOMRECORD_PTLY_MP_MEDIO_PAGO.\"ID\" AS idRAW /*{id#RAW}*/, \n CUSTOMRECORD_PTLY_MP_MEDIO_PAGO.custrecord_ptly_mp_medio_pago_id AS custrecordptlympmediopago /*{custrecord_ptly_mp_medio_pago_id#RAW}*/, \n CUSTOMRECORD_PTLY_MP_MEDIO_PAGO.name AS nameRAW /*{name#RAW}*/\n, \n CUSTOMRECORD_PTLY_MP_MEDIO_PAGO.custrecord_ptly_mp_medio_pago_paymeth_ns AS idPaymentMethod\nFROM \n CUSTOMRECORD_PTLY_MP_MEDIO_PAGO\nWHERE \n CUSTOMRECORD_PTLY_MP_MEDIO_PAGO.custrecord_ptly_mp_medio_pago_id IN ('"+ payment_method_id +"') \n AND CUSTOMRECORD_PTLY_MP_MEDIO_PAGO.custrecord_ptly_mp_medio_pago_sub="+ subsidiary +"\n";
    
        let objPagedData = query.runSuiteQLPaged({
            query: strSQL,
            pageSize: 1
        });
       
        objPagedData.pageRanges.forEach(function(pageRange) {
            //fetch
            let objPage = objPagedData.fetch({ index: pageRange.index }).data;
            // Map results to columns 
            arrResults.push.apply(arrResults, objPage.asMappedResults());
        });
    
        return arrResults;
    }


    let getConfiguration = (subsidiaria, accountId) => {

        let objeto = {};
        objeto.existeConfig = false;

        let ssConfig = search.load({
            id: 'customsearch_ptly_mp_config'
        })

        let ssSubsidiariaFilter = search.createFilter({
            name: 'custrecord_ptly_mp_config_sub',
            operator: search.Operator.IS,
            values: subsidiaria
        });

        let ssAccountFilter = search.createFilter({
            name: 'custrecord_ptly_mp_config_ns_amb',
            operator: search.Operator.IS,
            values: accountId
        });

        ssConfig.filters.push(ssSubsidiariaFilter);
        ssConfig.filters.push(ssAccountFilter);

        let ssConfigRun = ssConfig.run();
        let ssConfigRunRange = ssConfigRun.getRange({
            start: 0,
            end: 1000
        }); 

        for (let j = 0; j < ssConfigRunRange.length; j++)
        {
            objeto.subsidiaria = ssConfigRunRange[j].getValue(ssConfigRun.columns[0]);
            objeto.ambienteNS = ssConfigRunRange[j].getValue(ssConfigRun.columns[1]);
            objeto.tokenMP = ssConfigRunRange[j].getValue(ssConfigRun.columns[2]);
            objeto.userMDW = ssConfigRunRange[j].getValue(ssConfigRun.columns[3]);
            objeto.passMDW = ssConfigRunRange[j].getValue(ssConfigRun.columns[4]);
            objeto.servActNotif = ssConfigRunRange[j].getValue(ssConfigRun.columns[5]);
            objeto.servBuscarPago = ssConfigRunRange[j].getValue(ssConfigRun.columns[6]);
            objeto.servCrearPrefer = ssConfigRunRange[j].getValue(ssConfigRun.columns[7]);
            objeto.servDescNotif = ssConfigRunRange[j].getValue(ssConfigRun.columns[8]);
            objeto.servGenToken = ssConfigRunRange[j].getValue(ssConfigRun.columns[9]);
            objeto.servRecNotif = ssConfigRunRange[j].getValue(ssConfigRun.columns[10]);
            objeto.existeConfig = true;
        }

        return objeto;
    }


    let getToken = (config) => {
        
        let token = ``;
        const proceso = "PTLY - MercadoPago Notifications Process - getToken";

        try
        {
            let headers = {
                name: 'Content-Type',
                value: 'application/json'
            }

            let body = {
                id: config.userMDW,
                pass: config.passMDW
            }

            let request = https.post({
                url: config.servGenToken,
                headers: headers,
                body: body
            }); 

            log.debug(proceso,'request: '+JSON.stringify(request));

            if (request.code == 200)
            {
                let body = JSON.parse(request.body);
                token = body.token;
                return token;
            }
            else
            {
                return token
            }
        }
        catch(e)
        {
            log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
            return ``;
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});