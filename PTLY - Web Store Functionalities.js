/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/query', 'N/search', 'N/runtime'],

    function (record, query, search, runtime) {

        let nameProcess = 'PTLY - Web Store Functionalities'; //Process name for LOGS

        function afterSubmit(scriptContext) {

            log.audit(nameProcess, 'afterSubmit - INICIO del proceso');

            try
            {
                if (scriptContext.type == scriptContext.UserEventType.CREATE)
                {
                    let recType = scriptContext.newRecord.type;
                    let recId = scriptContext.newRecord.id;
                    let contratoData = [];
                    let sucursalData = [];
                    let idState = null;
                    let idProvincia = null;
                    let attention = 'Retiro en sucursal Andreani';
                    let shipaddress = '';
                    let esEnvSuc = false;
        

                    log.audit(nameProcess, 'recType: ' + recType + ' - recId: ' + recId);

                    let salesorder = record.load({
                        type: recType,
                        id: recId,
                        isDynamic: true
                    });

                    log.audit(nameProcess, 'salesorder: ' + JSON.stringify(salesorder));

                    if (!isEmpty(salesorder))
                    {
                        // Get Data from Sales Order
                        let customShippingCost = salesorder.getValue({ fieldId: 'custbody_ptly_ws_shipping_cost'});
                        let externalIdSucAndreani = salesorder.getValue({ fieldId: 'custbody_ptly_ws_zp_suc_andreani'});
                        let idShippingMethod = salesorder.getValue({ fieldId: 'shipmethod'});
                        let trandate = salesorder.getValue({ fieldId: 'trandate'});
                        let params = getParams();

                        log.debug(nameProcess, 'Params: ' + JSON.stringify(params));

                        if (!isEmpty(params))
                        {
                            salesorder.setValue({fieldId: 'custbody_ctayorden', value: params.esCtaOrden});
                            salesorder.setValue({fieldId: 'custbody_flujo_aprobacion', value: params.estadoFlujoAprob});
                        }

                        log.debug(nameProcess, 'Selected shipping cost on webstore: ' + customShippingCost);

                        if(!isEmpty(customShippingCost))
                            salesorder.setValue({fieldId: 'shippingcost', value: customShippingCost});

                        if (!isEmpty(idShippingMethod) && !isEmpty(customShippingCost))
                        {
                            contratoData = getConfigContrato(idShippingMethod);
                            log.debug(nameProcess, 'contratoData: ' + JSON.stringify(contratoData));
                            saveRecord = true;
                        }

                        if (contratoData.length > 0)
                        {
                            salesorder.setValue({fieldId: 'custbody_ptly_contrato_list_andreani', value: contratoData[0].idinterno});

                            if (contratoData[0].esenvsuc == 'T')
                            {
                                esEnvSuc = true;

                                if (!isEmpty(externalIdSucAndreani) && esEnvSuc)
                                {
                                    sucursalData = getSucursal(externalIdSucAndreani);
                                    log.debug(nameProcess, 'sucursalData: ' + JSON.stringify(sucursalData));

                                    if (sucursalData.length > 0)
                                    {
                                        shipaddress = `${attention} \n${sucursalData[0].calle} ${sucursalData[0].calleNro}  \n${sucursalData[0].city}  ${sucursalData[0].state}(${sucursalData[0].zip}) \n Argentina`;
                                        salesorder.setValue({fieldId: 'custbody_ptly_suc_list_andreani', value: sucursalData[0].recId});
                                        
                                        idState = getIdState(sucursalData[0].state);
                                        log.debug(nameProcess, 'idState: ' + idState);

                                        if (!isEmpty(idState))
                                        {
                                            idProvincia = getProvincia(idState);
                                            log.debug(nameProcess, 'idProvincia: ' + idProvincia);

                                            if (!isEmpty(idProvincia))
                                            {
                                                salesorder.setValue({
                                                    fieldId: 'shipaddresslist',
                                                    value: null 
                                                });
                        
                                                let shipaddrSubrecord = salesorder.getSubrecord({
                                                    fieldId: 'shippingaddress'
                                                });
                        
                                                shipaddrSubrecord.setValue({
                                                    fieldId: 'attention',
                                                    value: attention
                                                });
                        
                                                shipaddrSubrecord.setValue({
                                                    fieldId: 'addr1',
                                                    value: `${sucursalData[0].calle} ${sucursalData[0].calleNro}`
                                                });
                        
                                                shipaddrSubrecord.setValue({
                                                    fieldId: 'city',
                                                    value: sucursalData[0].city
                                                });

                                                shipaddrSubrecord.setValue({
                                                    fieldId: 'state',
                                                    value: sucursalData[0].state
                                                });

                                                shipaddrSubrecord.setValue({
                                                    fieldId: 'zip',
                                                    value: sucursalData[0].zip
                                                });

                                                shipaddrSubrecord.setValue({
                                                    fieldId: 'custrecord_l54_provincia',
                                                    value: idProvincia
                                                });

                                                shipaddrSubrecord.setValue({
                                                    fieldId: 'addrtext',
                                                    value: shipaddress
                                                });
                        
                                                shipaddrSubrecord.setValue({
                                                    fieldId: 'override',
                                                    value: true,
                                                    ignoreFieldChange: false
                                                });
                        
                                                shipaddrSubrecord.setValue({
                                                    fieldId: 'override',
                                                    value: false,
                                                    ignoreFieldChange: false
                                                });

                                                salesorder.setValue({
                                                    fieldId: 'shipaddress',
                                                    value: shipaddress
                                                });
                                            }
                                        }
                                    }
                                }
                            }

                            //SE ACTUALIZA EL VALOR DEL CAMPO OBLIGATORIO SUPPLY REQUIRED BY DATE
                            let cantItems = salesorder.getLineCount({
                                sublistId: 'item'
                            });

                            if (cantItems > 0)
                            {
                                for (let i = 0; i < cantItems; i++)
                                {
                                    salesorder.selectLine({
                                        sublistId: 'item',
                                        line: i
                                    });

                                    salesorder.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'requesteddate',
                                        value: trandate,
                                        ignoreFieldChange: false
                                    });

                                    salesorder.commitLine({
                                        sublistId: 'item'
                                    });
                                }
                            }

                            let idSO = salesorder.save();
                            log.debug(nameProcess, 'idSO: ' + idSO);
                        }
                        else
                        {
                            log.error(nameProcess, 'No existe configuración de contrato asociada al shipping method de la transacción');
                        }
                            

                        //SI LA SO APLICA ENVIO A SUCURSAL ANDREANI, SIGNIFICA QUE EL SHIPPING ADDRESS CAMBIO POR LO CUAL HAY QUE VALIDAR SI LOS ITEMS DE DESCUENTOS VARIARON EN EL TAX CODE AL CAMBIAR EL SHIPPING ADDRESS
                        if (esEnvSuc)
                        {
                            let salesorder2 = record.load({
                                type: recType,
                                id: recId,
                                isDynamic: true
                            });
        
                            log.debug(nameProcess, 'salesorder2: ' + JSON.stringify(salesorder2));
                            log.debug(nameProcess, 'shipaddress: ' + shipaddress);

                            if (!isEmpty(salesorder2))
                            {
                                let arrItems = [];
                                let cantItems = salesorder2.getLineCount({
                                    sublistId: 'item'
                                });

                                if (cantItems > 0)
                                {
                                    for (let i = 0; i < cantItems; i++)
                                    {
                                        let obj = {};

                                        salesorder2.selectLine({
                                            sublistId: 'item',
                                            line: i
                                        });

                                        obj.taxcodeCurrent = salesorder2.getCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'taxcode'
                                        });

                                        obj.itemtypeCurrent = salesorder2.getCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'itemtype'
                                        }); 
                                        
                                        arrItems.push(obj);

                                        log.debug(nameProcess,`indice: ${i} - objCurrent: ${JSON.stringify(obj)} - arrItems: ${JSON.stringify(arrItems)}`);

                                        if (i != 0)
                                        {
                                            let itemAnterior = validatePrevItem(arrItems, i-1);
                                            log.debug(nameProcess,`indice: ${i} - itemAnterior: ${JSON.stringify(itemAnterior)}`);

                                            if (obj.itemtypeCurrent == 'Discount' && obj.taxcodeCurrent != itemAnterior.taxcode)
                                            {
                                                salesorder2.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'taxcode',
                                                    value: itemAnterior.taxcode,
                                                    ignoreFieldChange: false
                                                });

                                                salesorder2.commitLine({
                                                    sublistId: 'item'
                                                });
                                            } 
                                        }
                                    }

                                    salesorder.setValue({
                                        fieldId: 'shipaddress',
                                        value: shipaddress
                                    });

                                    let idSO2 = salesorder2.save();
                                    log.debug(nameProcess, 'idSO2: ' + idSO2);
                                }

                            }
                        }
                    }
                    else
                    {
                        log.error(nameProcess, 'No se pudo cargar el registro de la transacción');
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

        let validatePrevItem = (array, indice) =>
        {
            let obj = {};
            obj.taxcode = array[indice].taxcodeCurrent;
            obj.itemtype = array[indice].itemtypeCurrent;
            return obj;
        }


        let getConfigContrato = (idShippingMethod) =>
        {
            let arrResults = [];
            let arrResultsAux = [];
    
            let strSQL = "SELECT \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.\"ID\" AS idinterno, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.name AS nombre, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.custrecord_ptly_contr_andreani_me AS idmetodoenvio, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.custrecord_ptly_contr_andreani_env_suc AS esenvsuc, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.custrecord_ptly_contr_andreani_b2c AS esb2c, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.custrecord_ptly_contr_andreani_b2b AS esb2b, \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.custrecord_ptly_contr_andreani_nro AS nrocontrato \nFROM \n CUSTOMRECORD_PTLY_CONTR_ANDREANI\nWHERE \n CUSTOMRECORD_PTLY_CONTR_ANDREANI.\"isinactive\" = 'F'\n";
            
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
                for (let i = 0; i < arrResults.length; i++)
                {
                    let arreglo = [];
                    let arrayProcesar = arrResults[i].idmetodoenvio.split(", ");

            
                    arreglo = arrayProcesar.filter(function(element)
                    {
                        if (element == idShippingMethod)
                        {
                            let objeto = {};
                            objeto.idinterno = arrResults[i].idinterno;
                            objeto.nombre = arrResults[i].nombre;
                            objeto.idmetodoenvio = element;
                            objeto.esenvsuc = arrResults[i].esenvsuc;
                            objeto.esb2c = arrResults[i].esb2c;
                            objeto.esb2b = arrResults[i].esb2b;
                            objeto.nrocontrato = arrResults[i].nrocontrato;
                            arrResultsAux.push(objeto);
                            i = arrResults.length;
                        }
                    });
                }
            }
    
            return arrResultsAux;
        }

        
        let getSucursal = (extIdSucursal) => {

            let arraySS = [];
    
            let ssSucursal = search.load({
                id: 'customsearch_ptly_suc_andreani'
            })
    
            let ssIdFilter = search.createFilter({
                name: 'externalid',
                operator: search.Operator.IS,
                values: extIdSucursal
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
                objeto.resumen = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[0]);
                objeto.zip = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[1]);
                objeto.calle = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[2]);
                objeto.calleNro = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[3]);
                objeto.city = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[4]);
                objeto.state = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[5]);
                objeto.sucId = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[6]);
                objeto.recId = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[7]);
                arraySS.push(objeto);
            }
    
            return arraySS;
        }


        let getIdState = (state) =>
        {
            try
            {
                var idState = null;
    
                var ssState = search.load({
                    id: 'customsearch_ptly_addr_form'
                })
    
                var ssIdFilter = search.createFilter({
                    name: 'shortname',
                    operator: search.Operator.IS,
                    values: state
                });
    
                ssState.filters.push(ssIdFilter);
    
                var ssStateRun = ssState.run();
                var ssStateRunRange = ssStateRun.getRange({
                    start: 0,
                    end: 1000
                }); 
    
                for (var j = 0; j < ssStateRunRange.length; j++)
                {
                    idState = ssStateRunRange[j].getValue(ssStateRun.columns[0]);
                }
            }
            catch(e)
            {
                console.log('getIdState - Error inesperado a determinar el id del estado - Detalles: '+JSON.stringify(e));
            }
    
            return idState;
        }


        let getProvincia = (state) =>
        {
            var strSQL = "SELECT \n CUSTOMRECORD_L54_SIC_CODIGO_PROVINCIA.\"ID\" AS idprovincia, \n CUSTOMRECORD_L54_SIC_CODIGO_PROVINCIA.name AS nameprovincia \nFROM \n CUSTOMRECORD_L54_SIC_CODIGO_PROVINCIA\nWHERE \n CUSTOMRECORD_L54_SIC_CODIGO_PROVINCIA.custrecord_l54_sic_codigo_prov_provincia = "+ state +"\n";
            var idProvincia = null;
       
            try
            {
                var objPagedData = query.runSuiteQLPaged({
                    query: strSQL,
                    pageSize: 1
                });
        
                var arrResults = [];
                
                objPagedData.pageRanges.forEach(function(pageRange) {
                    //fetch
                    var objPage = objPagedData.fetch({ index: pageRange.index }).data;
                    // Map results to columns 
                    arrResults.push.apply(arrResults, objPage.asMappedResults());
                });
    
                if (!isEmpty(arrResults) && arrResults.length > 0)
                {
                    idProvincia = arrResults[0].idprovincia;
                }
    
                return idProvincia;
            }
            catch(e)
            {
                log.error('getProvincia', 'Error inesperado al determinar el id de la provincia - Detalles: '+JSON.stringify(e));
            }
        }


        let getParams = () => {
        
            let response = { error: false, mensaje:'', contextocrear:'', contextomodificar:'' };
            
            try {
                var currScript = runtime.getCurrentScript();
                response.esCtaOrden = currScript.getParameter('custscript_ptly_ws_funtionalities_cta_or');
                response.estadoFlujoAprob = currScript.getParameter('custscript_ptly_ws_funtionalities_fl_apr');
            } catch (e) {
                response.error = true;
                response.mensaje = "Netsuite Error - Excepción: " + e.message;
            }
    
            return response;
        }

        return {
            afterSubmit: afterSubmit
        };

    });