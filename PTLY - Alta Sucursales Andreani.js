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
        
        const proceso = "PTLY - Alta Sucursales Andreani - GetInputData";

        let dataProcesar = [];

        log.audit(proceso, 'GetInputData - INICIO');

        try
        {
            let resp = getSucursales();

            log.debug(proceso,'LINE 40 - resp: '+JSON.stringify(resp));

            if (!isEmpty(resp.request) && !resp.error)
            {
                if (resp.request.code == 200)
                {
                    let body = JSON.parse(resp.request.body);

                    log.debug(proceso,'LINE 48 - body: '+JSON.stringify(body));

                    for (let i=0; i < body.length; i++)
                    {
                        try
                        {
                            if (body[i].datosAdicionales.seHaceAtencionAlCliente == true && body[i].datosAdicionales.tipo == 'SUCURSAL' && body[i].canal == "B2C")
                            {
                                dataProcesar.push(body[i]);
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
        log.debug(proceso, 'dataProcesar.length: '+dataProcesar.length);
        log.audit(proceso, 'GetInputData - FIN');
        return dataProcesar;
    }

    function map(context) {

        const proceso = "PTLY - Alta Sucursales Andreani - Map";

        log.audit(proceso, 'Map - INICIO');

        try
        {
            let result = JSON.parse(context.value);
            log.debug(proceso, 'Map - LINE 87 - result: '+JSON.stringify(result));

            if (!isEmpty(result))
            {
                let resp = result;
                if (!isEmpty(resp))
                {
                    log.debug(proceso, 'Map - LINE 94 - resp: '+JSON.stringify(resp));
                    let key = resp.id;
                    context.write(key, JSON.stringify(resp));
                }
            }

        } catch (e) {
            log.error(proceso, `Excepción: ${JSON.stringify(e.message)}`);
        }
        log.audit(proceso, 'Map - FIN');
    }

    function reduce(context) {

        const proceso = "PTLY - Alta Sucursales Andreani - Reduce";

        log.audit(proceso, 'Reduce - INICIO');

        let respuesta = { error: false, message:'', key: context.key, data: {} };
        let mensaje = "";

        try
        {
            log.debug(proceso, 'Reduce - LINE 117 - context.key : ' + context.key);

            if (!isEmpty(context.values) && context.values.length > 0)
            {
                for (let k = 0; k < context.values.length; k++)
                {
                    let data = JSON.parse(context.values[k]);
                    
                    try
                    {
                        log.debug(proceso, 'LINE 127 - data: '+JSON.stringify(data));
                        let resp = createSucursal(data);

                        log.debug(proceso, 'LINE 130 - resp: '+JSON.stringify(resp));

                        if (!isEmpty(resp) && !resp.error)
                        {
                            if(!isEmpty(resp.obj.idNS))
                            {
                                let obj = {};
                                obj.idNS = resp.obj.idNS;
                                respuesta.data = obj;
                                log.debug(proceso, 'LINE 138 - respuesta: '+JSON.stringify(respuesta));
                                context.write(context.key, respuesta);
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

    let createSucursal = (data) => {

        let resp = { error: false, message: ``, obj: {}}
        const proceso = "PTLY - MercadoPago Notifications Process - createSucursal";

        try
        {
            let obj = {};

            let newRecord = record.create({
                type: 'customrecord_ptly_suc_andreani'
            });

            newRecord.setValue({
                fieldId: 'externalid',
                value: `${data.codigo}-${data.direccion.codigoPostal}`
            });

            newRecord.setValue({
                fieldId: 'name',
                value: `${data.direccion.codigoPostal} - ${data.direccion.localidad} / ${data.descripcion}`
            });

            newRecord.setValue({
                fieldId: 'custrecord_ptly_suc_andreani_id',
                value: data.id
            });

            newRecord.setValue({
                fieldId: 'custrecord_ptly_suc_andreani_nomen',
                value: data.codigo
            });

            newRecord.setValue({
                fieldId: 'custrecord_ptly_suc_andreani_h_atencion',
                value: data.horarioDeAtencion
            });

            newRecord.setValue({
                fieldId: 'custrecord_ptly_suc_andreani_pais',
                value: 11
            });

            newRecord.setValue({
                fieldId: 'custrecord_ptly_suc_andreani_loc',
                value: data.direccion.localidad
            });

            let stateObj = getState(data.direccion.provincia);
            log.debug('LINE 289','stateObj: '+JSON.stringify(stateObj));
            if(!isEmpty(stateObj))
            {
                newRecord.setValue({
                    fieldId: 'custrecord_ptly_suc_andreani_region',
                    value: stateObj[0].id
                });

                newRecord.setValue({
                    fieldId: 'custrecord_suc_andreani_region_cod_ns',
                    value: stateObj[0].shortName 
                });
            }

            newRecord.setValue({
                fieldId: 'custrecord_ptly_suc_andreani_cp',
                value: data.direccion.codigoPostal
            });

            newRecord.setValue({
                fieldId: 'custrecord_ptly_suc_andreani_calle',
                value: data.direccion.calle
            });

            newRecord.setValue({
                fieldId: 'custrecord_ptly_suc_andreani_calle_nro',
                value: data.direccion.numero
            });

            newRecord.setValue({
                fieldId: 'custrecord_ptly_suc_andreani_resumen',
                value: `${data.direccion.localidad} / ${data.descripcion}\n ${data.direccion.calle} ${data.direccion.numero}, ${data.direccion.region}, ${data.direccion.localidad}, ${data.direccion.codigoPostal}`
            });

            let idRecord =  newRecord.save();

            log.debug(proceso, 'ID Registro: '+idRecord);

            if(!isEmpty(idRecord))
            {
                obj.idNS = idRecord;
                resp.obj = obj;
                return resp;
            }
        }
        catch(e)
        {
            log.error(proceso, `Excepción: ${JSON.stringify(e.message)} - External ID: ${data.direccion.codigoPostal}`);
            resp.error = true;
            resp.message = `Excepción: ${JSON.stringify(e.message)} - External ID: ${data.direccion.codigoPostal}`;
            return resp;
        }
    }


    let getSucursales = () => {

        let resp = { error: false, message: ``, request: null}
        const proceso = "PTLY - MercadoPago Notifications Process - getSucursales";

        try
        {
            let headers = {
                'Content-Type':'application/json',
            }

            let request = https.get({
                url: 'https://api.andreani.com/v2/sucursales',
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


    let getState = (name) => {

        let arraySS = [];

        let ssSucursal = search.load({
            id: 'customsearch_ptly_addr_form'
        })

        let ssIdFilter = search.createFilter({
            name: 'formulatext',
            formula: 'LOWER({fullname})',
            operator: search.Operator.IS,
            values: name.toLowerCase()
        });

        ssSucursal.filters.push(ssIdFilter);

        let ssSucursalRun = ssSucursal.run();
        let ssSucursalRunRange = ssSucursalRun.getRange({
            start: 0,
            end: 1000
        }); 

        for (let j = 0; j < ssSucursalRunRange.length; j++)
        {
            let objeto = {};
            objeto.id = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[0]);
            objeto.fullName = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[1]);
            objeto.shortName = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[2]);
            arraySS.push(objeto);
        }

        return arraySS;
    }


    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce/*,
        summarize: summarize*/
    }
});