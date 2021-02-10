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
                                try
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
                                        obj.idNS = idRecord;
                                        obj.type = body.notifications[i].type;
                                        obj.id = body.notifications[i].id;
                                        dataProcesar.push(obj);
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

                log.debug(proceso, 'dataProcesar: '+JSON.stringify(dataProcesar));

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
            let resultado = JSON.parse(context.value);
            log.debug(proceso, 'Map - LINE 135 - resultado: '+JSON.stringify(resultado));

            if (!isEmpty(resultado))
            {
                let obj = {};
                obj.idMongo = resultado.idMongo;
                obj.idNS = resultado.idNS;
                obj.type = resultado.type;
                obj.id = resultado.id;
                obj.urlMPSearchPayment = `https://api.mercadopago.com/v1/payments/search?id=${resultado.id}`;
                log.debug(proceso, 'Map - LINE 148 - obj: '+JSON.stringify(obj));
                let key = obj.idMongo;
                context.write(key, JSON.stringify(obj));
            }

        } catch (e) {
            log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
        }
        log.audit(proceso, 'Map - FIN');
    }

    function reduce(context) {

        const proceso = "PTLY - MercadoPago Notifications Process - Reduce";

        log.audit(proceso, 'Reduce - INICIO');

        let respuesta = { error: false, key: context.key, messages: [], detalle_error: '', data: {} };
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
                    log.debug(proceso, 'Reduce - LINE 182 - urlRequest : ' + urlRequest);
                    
                    try
                    {
                        let hearders = {
                            name: 'Authorization',
                            value: 'Bearer TEST-232057640758695-012821-b8a871d3c1152919e6962c9db6dca556-281377671'
                        }
    
                        let request = https.get({
                            url: urlRequest,
                            hearders: hearders
                        }); 

                        log.debug(proceso,'request: '+JSON.stringify(request));

                        if (!isEmpty(request))
                        {
                            if (request.code == 200)
                            {
                                try
                                {
                                    let body = JSON.parse(request.body);

                                    log.debug(proceso,'body: '+JSON.stringify(body));

                                    let idInternoPedido = parseInt(body.results[0].external_reference);

                                    if (!isEmpty(idInternoPedido))
                                    {
                                        let newRecord = record.load({
                                            type: 'customrecord_ptly_mp_notific',
                                            id: data.idNS
                                        });

                                        if (!isEmpty(newRecord))
                                        {
                                            /*newRecord.setValue({
                                                fieldId: 'custrecord_ptly_mp_notific_so',
                                                value: idInternoPedido
                                            });*/

                                            newRecord.setValue({
                                                fieldId: 'custrecord_ptly_mp_notific_det_mp',
                                                value: body
                                            });

                                            let idRecord =  newRecord.save();
        
                                            log.debug(proceso, 'ID Registro: '+idRecord);
                
                                            if(!isEmpty(idRecord))
                                            {
                                                let obj = {};
                                                obj.idMongo = data.idMongo;
                                                obj.idNS = data.idNS;

                                                respuesta = {
                                                    error: false,
                                                    key: context.key,
                                                    messages: [],
                                                    detalle_error: '',
                                                    data: obj
                                                };
                                                
                                                log.debug(proceso, 'respuesta: '+JSON.stringify(respuesta));
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

        log.debug("Respuesta: ", JSON.stringify(respuesta));

        context.write(context.key, respuesta);

        log.audit(proceso, 'Reduce - FIN');
    }

    function summarize(summary) {

        const proceso = "PTLY - MercadoPago Notifications Process - Summarize";

        try {

            let totalReduceErrors = 0;
            let arrayReduceResults = [];
            let messages = '';

            log.debug(proceso, 'Inicio - Summarize');

            summary.output.iterator().each(function (key, value) {

                let objResp = JSON.parse(value);

                log.debug(proceso, 'objResp: ' + JSON.stringify(objResp));

            });

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
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});