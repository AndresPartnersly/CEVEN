/**
 *@NApiVersion 2.1
 *@NAmdConfig ./configuration.json
 *@NScriptType MapReduceScript
 *@NModuleScope Public
 */
define(['N/record', 'N/search', 'N/https', 'N/runtime'],

function (record, search, https, runtime) {

    function getParams() {
        
        let body = { error: false, mensaje:'', contextocrear:'', contextomodificar:'' };
        
        try {
            let currScript = runtime.getCurrentScript();
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
                    let urlGetNotifications = 'https://checkoutsbx.herokuapp.com/getNotifications';

                    let resp = getNotificationsMP(urlGetNotifications);

                    log.debug(proceso,'LINE 47 - resp: '+JSON.stringify(resp));

                    if (!isEmpty(resp.request) && !resp.error)
                    {
                        if (resp.request.code == 200)
                        {
                            let body = JSON.parse(resp.request.body);

                            log.debug(proceso,'LINE 55 - body: '+JSON.stringify(body));
        
                            for (let i=0; i < body.notifications.length; i++)
                            {
                                try
                                {
                                    let resp = createNSNotificationMP(body.notifications[i], dataParams);
                                    log.debug(proceso, 'LINE 62 - resp: '+JSON.stringify(resp));
        
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

                log.debug(proceso, 'LINE 82 - dataProcesar: '+JSON.stringify(dataProcesar));

                return dataProcesar;

            }else{
                log.error(proceso, JSON.stringify(dataParams.mensaje));
            }
        }catch(err) {
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
            let urlSearchPayment = `https://api.mercadopago.com/v1/payments/search?id=`;
            log.debug(proceso, 'Map - LINE 106 - result: '+JSON.stringify(result));

            if (!isEmpty(result))
            {
                let resp = procesarRegMap(result, urlSearchPayment);
                /*obj.idMongo = result.idMongo;
                obj.idNS = result.idNS;
                obj.type = result.type;
                obj.id = result.id;
                obj.urlMPSearchPayment = `https://api.mercadopago.com/v1/payments/search?id=${result.id}`;*/
                if (!isEmpty(resp) && !resp.error)
                {
                    log.debug(proceso, 'Map - LINE 118 - resp: '+JSON.stringify(resp));
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
            log.debug(proceso, 'Reduce - LINE 174 - context : ' + context);

            if (!isEmpty(context.values) && context.values.length > 0)
            {
                for (let k = 0; k < context.values.length; k++)
                {
                    let data = JSON.parse(context.values[k]);
                    let urlRequest = data.urlMPSearchPayment;
                    log.debug(proceso, 'Reduce - LINE 149 - urlRequest : ' + urlRequest);
                    
                    try
                    {
                        let resp = searchPaymentMP(urlRequest);

                        log.debug(proceso,'LINE 155 - resp: '+JSON.stringify(resp));

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
        
                                        log.debug(proceso, 'LINE 173 - resp: '+JSON.stringify(resp));

                                        if (!isEmpty(resp) && !resp.error)
                                        {
                                            if(!isEmpty(resp.idRecord))
                                            {
                                                let obj = {};
                                                obj.idMongo = data.idMongo;
                                                obj.idNS = data.idNS;
                                                respuesta.obj = obj;
                                                log.debug(proceso, 'LINE 191 - respuesta: '+JSON.stringify(respuesta));
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

        log.debug("LINE 216 - Respuesta: ", JSON.stringify(respuesta));

        context.write(context.key, respuesta);

        log.audit(proceso, 'Reduce - FIN');
    }

    function summarize(summary) {

        const proceso = "PTLY - MercadoPago Notifications Process - Summarize";

        try {

            log.debug(proceso, 'LINE 223 - Inicio - Summarize');

            summary.output.iterator().each(function (key, value)
            {
                let objResp = JSON.parse(value);

                log.debug(proceso, 'objResp: ' + JSON.stringify(objResp));

            });

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

    let createNSNotificationMP = (body, dataParams) => {

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
        log.debug('LINE 339 - body.toString(): '+body);
        try
        {
            let newRecord = record.load({
                type: 'customrecord_ptly_mp_notific',
                id: idNS
            });

            if (!isEmpty(newRecord))
            {
                /*newRecord.setValue({
                    fieldId: 'custrecord_ptly_mp_notific_so',
                    value: idPedido
                });*/

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

    let procesarRegMap = (objMap, urlSearchPayment) => {

        let resp = { error: false, message: ``, obj: {}}
        const proceso = "PTLY - MercadoPago Notifications Process - procesarRegMap";

        try
        {
            let obj = {};
            obj.idMongo = objMap.idMongo;
            obj.idNS = objMap.idNS;
            obj.type = objMap.type;
            obj.id = objMap.id;
            obj.urlMPSearchPayment = `${urlSearchPayment}${objMap.id}`;
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

    let getNotificationsMP = (urlGetNotifications) => {

        let resp = { error: false, message: ``, request: null}
        const proceso = "PTLY - MercadoPago Notifications Process - getNotificationsMP";

        try
        {
            let headers = {
                name: 'Content-Type',
                value: 'application/json'
            }

            let request = https.get({
                url: urlGetNotifications,
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

    let searchPaymentMP = (urlSearchPayment) => {

        let resp = { error: false, message: ``, request: null}
        const proceso = "PTLY - MercadoPago Notifications Process - searchPaymentMP";

        try
        {
            let headers = {
                'Authorization': 'Bearer TEST-232057640758695-012821-b8a871d3c1152919e6962c9db6dca556-281377671',
                'Content-Type':'application/json',
                'Accept':'*/*'
            }

            let request = https.get({
                url: urlSearchPayment,
                headers: headers
            }); 

            log.debug(proceso,'request: '+JSON.stringify(request));

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

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        //summarize: summarize
    }
});