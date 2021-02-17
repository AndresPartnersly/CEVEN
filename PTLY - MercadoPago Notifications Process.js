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
                    log.debug(proceso, "LINE 46: " + accountId);
                    let config = getConfiguration(dataParams.subsidiary, accountId);
                    log.debug(proceso, "LINE 48 - config: " + JSON.stringify(config));
                    if (config.existeConfig)
                    {
                        try
                        {
                            let resp = getNotificationsMP(config);

                            log.debug(proceso,'LINE 55 - resp: '+JSON.stringify(resp));

                            if (!isEmpty(resp.request) && !resp.error)
                            {
                                if (resp.request.code == 200)
                                {
                                    let body = JSON.parse(resp.request.body);

                                    log.debug(proceso,'LINE 63 - body: '+JSON.stringify(body));
                
                                    for (let i=0; i < body.notifications.length; i++)
                                    {
                                        try
                                        {
                                            let resp = createNSNotificationMP(body.notifications[i], dataParams, config);
                                            log.debug(proceso, 'LINE 70 - resp: '+JSON.stringify(resp));
                
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
            log.debug(proceso, 'Map - LINE 124 - result: '+JSON.stringify(result));

            if (!isEmpty(result))
            {
                let resp = procesarRegMap(result);
                if (!isEmpty(resp) && !resp.error)
                {
                    log.debug(proceso, 'Map - LINE 131 - resp: '+JSON.stringify(resp));
                    let key = resp.obj.idMongo;
                    context.write(key, JSON.stringify(resp.obj));
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
            log.debug(proceso, 'Reduce - LINE 154 - context.key : ' + context.key);

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

                                    log.debug(proceso,'LINE 165 - body: '+JSON.stringify(body));

                                    let idInternoPedido = parseInt(body.results[0].external_reference);

                                    if (!isEmpty(idInternoPedido))
                                    {
                                        let resp = updNSNotificationMP(data.idNS, body, idInternoPedido);
                                        let respSO = updSO(data, body, idInternoPedido);
        
                                        log.debug(proceso, 'LINE 183 - resp: '+JSON.stringify(resp));
                                        log.debug(proceso, 'LINE 184 - respSO: '+JSON.stringify(respSO));

                                        if (!isEmpty(resp) && !resp.error && !isEmpty(respSO) && respSO.soUpd)
                                        {
                                            if(!isEmpty(resp.idRecord) && !isEmpty(respSO.idRecord))
                                            {
                                                let obj = {};
                                                obj.idMongo = data.idMongo;
                                                obj.idNS = data.idNS;
                                                obj.config = data.config;
                                                respuesta.data = obj;
                                                log.debug(proceso, 'LINE 195 - respuesta: '+JSON.stringify(respuesta));
                                                context.write(context.key, respuesta);
                                            }
                                        }
                                    }
                                }
                                catch(e)
                                {
                                    respuesta.error = true;
                                    respuesta.message = `Excepción: ${JSON.stringify(e.message)}`; 
                                    log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
                                }
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

            log.debug(proceso, 'LINE 222 - Inicio - Summarize - summary: '+JSON.stringify(summary));

            summary.output.iterator().each(function (key, value)
            {
                let objResp = JSON.parse(value);
                if (!isEmpty(objResp))
                {
                    dataProcesar.push(objResp);
                }  
                return true;
            });

            log.debug('LINE 234','dataProcesar: '+JSON.stringify(dataProcesar));

            if (dataProcesar.length > 0)
            {
                for (let i=0; i < dataProcesar.length; i++)
                {
                    log.debug('LINE 240',`dataProcesar[${i}].data.idMongo: ${dataProcesar[i].data.idMongo}`);
                    let body = {
                        idPayment: dataProcesar[i].data.idMongo
                    }

                    let resp = updNotificationsMPColletion(dataProcesar[i].data.config, body);

                    if (!isEmpty(resp) && !resp.error)
                    {
                        if (resp.request.code == 201)
                        {
                            log.debug('LINE 251','Documento actualizado en MongoDB');
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

            let newRecord = record.create({
                type: 'customrecord_ptly_mp_notific'
            });

            newRecord.setValue({
                fieldId: 'externalid',
                value: body._id
            });

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
            log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
            resp.error = true;
            resp.message = `Excepción: ${JSON.stringify(e.message)}`;
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
                log.debug('LINE 422','total_paid_amount: '+total_paid_amount);
                soRecord.setValue({
                    fieldId: 'custbody_ptly_mp_monto_total_pago',
                    value: total_paid_amount
                });

                //MONTO COMISION
                let fee_amount = 0.00;
                if (body.results[0].fee_details.length > 0)
                {
                    fee_amount = parseFloat(body.results[0].fee_details[0].amount,10);
                }
                log.debug('LINE 434','fee_amount: '+fee_amount);
                soRecord.setValue({
                    fieldId: 'custbody_ptly_mp_monto_comision',
                    value: fee_amount
                });

                //MEDIO DE PAGO
                let payment_method_id = getPaymentMethod(body.results[0].payment_method_id, subsidiary);
                let paymentmethod = payment_method_id[0].idpaymentmethod;
                log.debug('LINE 442','- payment_method_id: '+JSON.stringify(payment_method_id));
                soRecord.setValue({
                    fieldId: 'custbody_ptly_mp_medio_pago',
                    value: payment_method_id[0].idraw
                });

                //ESTADO DEL PAGO
                let status = getPaymentStatus(body.results[0].status);
                log.debug('LINE 450','status: '+JSON.stringify(status));
                soRecord.setValue({
                    fieldId: 'custbody_ptly_mp_estado_pago',
                    value: status[0].idraw
                });

                log.debug('LINE 463','data: '+JSON.stringify(data));
                if (data.params.idStatusApprovPayment == status[0].idraw)
                {
                    log.debug('LINE 466','ENTRO - paymentmethod: '+paymentmethod);
                    soRecord.setValue({
                        fieldId: 'paymentmethod',
                        value: paymentmethod
                    });
                }

                //ID DEL PAGO
                let idPayment = body.results[0].id;
                log.debug('LINE 454','idPayment: '+JSON.stringify(idPayment));
                soRecord.setValue({
                    fieldId: 'custbody_ptly_mp_id_pago',
                    value: idPayment
                });

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
            log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
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
                    
                    log.debug(proceso,'LINE 592 - headers: '+JSON.stringify(headers)+' - body: '+JSON.stringify(body)+' - url: '+config.servActNotif);
                    let request = https.post({
                        url: config.servActNotif,
                        headers: headers,
                        body: JSON.stringify(body)
                    }); 
                    log.debug(proceso,'LINE 598 - request: '+JSON.stringify(request));
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
            log.debug(proceso,'LINE 521 - data: '+JSON.stringify(data));

            let token = `Bearer ${data.config.tokenMP}`

            let headers = {
                'Authorization': token,
                'Content-Type':'application/json',
                'Accept':'*/*'
            }

            log.debug(proceso,'LINE 527 - headers: '+JSON.stringify(headers));

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