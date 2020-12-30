/**
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteScripts/configuration.json
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', 'N/ui/dialog', 'N/query', 'N/search', 'N/https'],

function(currentRecord, url, dialog, query, search, https) {
    
 
    function fieldChanged(scriptContext) {

        var title = 'Mensaje';

        if(scriptContext.fieldId == 'custpage_sucandreani') {

            var objRecord = scriptContext.currentRecord;

            var idSucursal = objRecord.getValue({
                fieldId: 'custpage_sucandreani'
              });

            if (!isEmpty(idSucursal))
            {
                var arraySucursal =  getSucData(idSucursal);

                if (!isEmpty(arraySucursal) && arraySucursal.length > 0)
                {
                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_des',
                        value: arraySucursal[0].resumen
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_cod',
                        value: arraySucursal[0].codigoPostal
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_calle',
                        value: arraySucursal[0].calle
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_calle_nro',
                        value: arraySucursal[0].calleNro
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_loc',
                        value: arraySucursal[0].localidad
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_reg',
                        value: arraySucursal[0].region
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_suc_id',
                        value: arraySucursal[0].sucId
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_cod_post_suc',
                        value: arraySucursal[0].codigoPostal
                    });
                }
            }
            else
            {
                objRecord.setValue({
                    fieldId: 'custpage_sucandreani_des',
                    value: ''
                });

                objRecord.setValue({
                    fieldId: 'custpage_sucandreani_cod',
                    value: ''
                });

                objRecord.setValue({
                    fieldId: 'custpage_sucandreani_calle',
                    value: ''
                });

                objRecord.setValue({
                    fieldId: 'custpage_sucandreani_calle_nro',
                    value: ''
                });

                objRecord.setValue({
                    fieldId: 'custpage_sucandreani_loc',
                    value: ''
                });

                objRecord.setValue({
                    fieldId: 'custpage_sucandreani_reg',
                    value: ''
                });
            }
        } 
        
        if(scriptContext.fieldId == 'custpage_cod_post_suc_buscador') {

            var objRecord = scriptContext.currentRecord;

            var codPostalSucursal = objRecord.getValue({
                fieldId: 'custpage_cod_post_suc_buscador'
              });

            if (!isEmpty(codPostalSucursal))
            {
                var arraySucursal =  getSucDataCodPostal(codPostalSucursal);

                if (!isEmpty(arraySucursal) && arraySucursal.length > 0)
                {
                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_des',
                        value: arraySucursal[0].resumen
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_cod',
                        value: arraySucursal[0].codigoPostal
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_calle',
                        value: arraySucursal[0].calle
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_calle_nro',
                        value: arraySucursal[0].calleNro
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_loc',
                        value: arraySucursal[0].localidad
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_reg',
                        value: arraySucursal[0].region
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_suc_id',
                        value: arraySucursal[0].sucId
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_cod_post_suc',
                        value: arraySucursal[0].codigoPostal
                    });

                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani',
                        value: arraySucursal[0].recId
                    });

                    var token = generarToken();

                    //alert('token: '+token);

                    if (!isEmpty(token))
                    {
                        var cpDestinoAndreani = objRecord.getValue({
                            fieldId: 'custpage_sucandreani_cod'
                          });

                        var contratoEnvioSucB2C = objRecord.getValue({
                            fieldId: 'custpage_cont_env_suc'
                          });

                        var kilos = objRecord.getValue({
                            fieldId: 'custpage_peso'
                        });

                        var meSuc = objRecord.getValue({
                            fieldId: 'custpage_me_env_suc'
                        });

                        var volumen = objRecord.getValue({
                            fieldId: 'custpage_volumen'
                        });

                        //alert('cpDestinoAndreani: '+cpDestinoAndreani+' - contratoEnvioSucB2C: '+contratoEnvioSucB2C+' - kilos: '+kilos+ ' - volumen: '+volumen);

                        var url = "https://api.andreani.com/v1/tarifas";


                        var urlEnvioSuc = ""+url+"?cpDestino="+cpDestinoAndreani+"&contrato="+contratoEnvioSucB2C+"&bultos[0][volumen]="+volumen+"&bultos[0][kilos]="+kilos+"";

                        //alert('urlEnvioSuc: '+urlEnvioSuc);

                        var respEnvioSucgDomicilio = cotizarEnvio(urlEnvioSuc, token);

                        //alert('respEnvioSucgDomicilio: '+JSON.stringify(respEnvioSucgDomicilio));
        
                        if (!isEmpty(respEnvioSucgDomicilio))
                        {
                            log.debug({
                                title: 'LINE 203',
                                details: "Respuesta cotizacion ID 3: "+respEnvioSucgDomicilio.body+""
                            });

                            var arrayResumen = [];

                            if (respEnvioSucgDomicilio.code == 200)
                            {
                                var body = JSON.parse(respEnvioSucgDomicilio.body);
                                /*var objeto = {};
                                objeto.tipoEnvio = 3;
                                objeto.meEnvio = meSuc;
                                objeto.tipoEnvioNombre = 'ENVIO A SUCURSAL';
                                objeto.body = body;
                                arrayResumen.push(objeto);	

                                objRecord.setValue({
                                    fieldId: 'custpage_resumen_json_suc',
                                    value: JSON.stringify(arrayResumen)
                                });*/

                                var value = "AR$ " + parseFloat(body.tarifaSinIva.total,10);
                                
                                objRecord.setValue({
                                    fieldId: 'custpage_tarifa_suc',
                                    value: value
                                });

                            }
                            else
                            {
                                var message = {
                                    title: title,
                                    message: "No se recibio una respuesta valida del servicio de cotización - Codigo de error: "+ respEnvioSucgDomicilio.code
                                };
                                dialog.alert(message);
                            }
                        }
                    }


                }
                else
                {
                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_des',
                        value: ''
                    });
    
                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_cod',
                        value: ''
                    });
    
                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_calle',
                        value: ''
                    });
    
                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_calle_nro',
                        value: ''
                    });
    
                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_loc',
                        value: ''
                    });
    
                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani_reg',
                        value: ''
                    });
    
                    objRecord.setValue({
                        fieldId: 'custpage_sucandreani',
                        value: ''
                    });

                    /*objRecord.setValue({
                        fieldId: 'custpage_resumen_json_suc',
                        value: ''
                    });*/

                    var message = {
                        title: title,
                        message: "No se encontró sucursal Andreani para el código postal ingresado"
                    };
                    dialog.alert(message);
                }
            }
            else
            {
                objRecord.setValue({
                    fieldId: 'custpage_sucandreani_des',
                    value: ''
                });

                objRecord.setValue({
                    fieldId: 'custpage_sucandreani_cod',
                    value: ''
                });

                objRecord.setValue({
                    fieldId: 'custpage_sucandreani_calle',
                    value: ''
                });

                objRecord.setValue({
                    fieldId: 'custpage_sucandreani_calle_nro',
                    value: ''
                });

                objRecord.setValue({
                    fieldId: 'custpage_sucandreani_loc',
                    value: ''
                });

                objRecord.setValue({
                    fieldId: 'custpage_sucandreani_reg',
                    value: ''
                });

                objRecord.setValue({
                    fieldId: 'custpage_sucandreani',
                    value: ''
                });

                /*objRecord.setValue({
                    fieldId: 'custpage_resumen_json_suc',
                    value: ''
                });*/
            }
        } 
    }


    function getSucData(id) {

        var arraySS = [];

        var ssSucursal = search.load({
            id: 'customsearch_ptly_suc_andreani'
        })

        var ssIdFilter = search.createFilter({
            name: 'internalid',
            operator: search.Operator.IS,
            values: id
        });

        ssSucursal.filters.push(ssIdFilter);

        var ssSucursalRun = ssSucursal.run();
        var ssSucursalRunRange = ssSucursalRun.getRange({
            start: 0,
            end: 1000
        }); 

        for (var j = 0; j < ssSucursalRunRange.length; j++)
        {
            var objeto = {};
            objeto.resumen = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[0]);
            objeto.codigoPostal = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[1]);
            objeto.calle = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[2]);
            objeto.calleNro = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[3]);
            objeto.localidad = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[4]);
            objeto.region = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[5]);
            objeto.sucId = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[6]);
            arraySS.push(objeto);
        }

        return arraySS;
    }


    function getSucDataCodPostal(codPostal) {

        var arraySS = [];

        var ssSucursal = search.load({
            id: 'customsearch_ptly_suc_andreani'
        })

        var ssIdFilter = search.createFilter({
            name: 'custrecord_ptly_suc_andreani_cp',
            operator: search.Operator.IS,
            values: codPostal
        });

        ssSucursal.filters.push(ssIdFilter);

        var ssSucursalRun = ssSucursal.run();
        var ssSucursalRunRange = ssSucursalRun.getRange({
            start: 0,
            end: 1000
        }); 

        for (var j = 0; j < ssSucursalRunRange.length; j++)
        {
            var objeto = {};
            objeto.resumen = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[0]);
            objeto.codigoPostal = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[1]);
            objeto.calle = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[2]);
            objeto.calleNro = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[3]);
            objeto.localidad = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[4]);
            objeto.region = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[5]);
            objeto.sucId = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[6]);
            objeto.recId = ssSucursalRunRange[j].getValue(ssSucursalRun.columns[7]);
            arraySS.push(objeto);
        }

        return arraySS;
    }

	
	function callPopUp() {

        var proceso = 'Andreani Cotizar Envio - Client';

        var title = 'Mensaje';

        var record = currentRecord.get();
        
        var empresaTransporteParams = record.getValue({
            fieldId: "custpage_empresatransporte"
        });

        var empresaTransporteSO = record.getValue({
            fieldId: "custbody_3k_empresa_transporte"
        });

        var catClienteParams = record.getValue({
            fieldId: "custpage_catclientepermitida"
        });

        var entity = record.getValue({
            fieldId: "entity"
        });

        var validEntity = validarCategoryCustomer(entity, catClienteParams)

        if (!isEmpty(validEntity) && validEntity)
        {
            var subsidiaria = record.getValue({
                fieldId: 'subsidiary'
            });

            if (!isEmpty(subsidiaria))
            {
                var arrResults = getConfig(subsidiaria);

                var codigoPostal = record.getValue({
                    fieldId: 'shipzip'
                });

                var shipaddress =  record.getValue({
                    fieldId: 'shipaddress'
                });

                if (!isEmpty(arrResults) && arrResults.length > 0)
                {
                    var custpage_cont_domicilio = arrResults[0].contratoenvidom;
                    var custpage_cont_domicilio_urgente = arrResults[0].contratoenviourgdom;
                    var custpage_cont_env_suc = arrResults[0].contratoenviosuc;
                    var custpage_codcliente = arrResults[0].codigocliente;
                    var custpage_meenvdom = arrResults[0].meenvdom;
                    var custpage_meenvurgdom = arrResults[0].meenvurgdom;
                    var custpage_meenvsuc = arrResults[0].meenvsuc;
                    var pesoTotal = 0.00;
                    var volumenTotal = 0.00;

                    if (!isEmpty(custpage_cont_env_suc))
                    {
                        if (!isEmpty(custpage_cont_domicilio_urgente))
                        {
                            if (!isEmpty(custpage_cont_domicilio))
                            {
                                if (!isEmpty(custpage_codcliente))
                                {
                                    if (!isEmpty(shipaddress))
                                    {
                                        if (!isEmpty(codigoPostal))
                                        {
                                            var sublist = 'item';
                                            var cantArticulos = record.getLineCount({
                                                sublistId: sublist
                                            });
                                        
                                            if (cantArticulos > 0)
                                            {
                                                for (var i=0; i < cantArticulos; i++)
                                                {
                                                    record.selectLine({
                                                        sublistId: sublist,
                                                        line: i
                                                    });

                                                    var peso = record.getCurrentSublistValue({
                                                        sublistId: sublist,
                                                        fieldId: 'custcol_ptly_peso_articulo'
                                                    });

                                                    var volumen = record.getCurrentSublistValue({
                                                        sublistId: sublist,
                                                        fieldId: 'custcol_ptly_volumen_articulo'
                                                    });

                                                    var cantidad = record.getCurrentSublistValue({
                                                        sublistId: sublist,
                                                        fieldId: 'quantity'
                                                    });

                                                    if (!isEmpty(peso) && !isEmpty(cantidad))
                                                    {
                                                        pesoTotal = parseFloat(pesoTotal,10) + (parseFloat(parseFloat(peso,10) * parseFloat(cantidad,10),10));
                                                    }

                                                    if (!isEmpty(volumen) && !isEmpty(cantidad))
                                                    {
                                                        volumenTotal = parseFloat(volumenTotal,10) + (parseFloat(parseFloat(volumen,10) * parseFloat(cantidad,10),10));
                                                    }
                                                }

                                                if (!isEmpty(pesoTotal) && pesoTotal > 0.00)
                                                {
                                                    if (!isEmpty(volumenTotal) && volumenTotal > 0.00)
                                                    {
                                                        var leftPosition, topPosition;
                                                        leftPosition = (window.screen.width / 2) - ((600 / 2) + 10);
                                                        topPosition = (window.screen.height / 2) - ((600 / 2) + 50);

                                                        //Define the window
                                                        var params = 'height=' + 550 + ' , width=' + 800;
                                                        params += ' , left=' + leftPosition + ", top=" + topPosition;
                                                        params += ' ,screenX=' + leftPosition + ' ,screenY=' + topPosition;
                                                        params += ', status=no'; 
                                                        params += ' ,toolbar=no';
                                                        params += ' ,menubar=no';
                                                        params += ', resizable=yes'; 
                                                        params += ' ,scrollbars=no';
                                                        params += ' ,location=no';
                                                        params += ' ,directories=no'

                                                        try
                                                        {
                                                            var suitevarURL = url.resolveScript({
                                                                scriptId: 'customscript_ptly_cotizador_andreani_sl',
                                                                deploymentId: 'customdeploy_ptly_cotizador_andreani_sl',
                                                                returnExternalUrl: false
                                                            });

                                                            //alert('suitevarURL: '+suitevarURL);

                                                            if (!isEmpty(suitevarURL))
                                                            {
                                                                var contEnvioDomB2C = custpage_cont_domicilio;
                                                                var contEnvioUrgDomB2C = custpage_cont_domicilio_urgente;
                                                                var contEnvioSucB2C = custpage_cont_env_suc;
                                                                var codClienteAndreaniB2C = custpage_codcliente;
                                                                var codPostalDestino = codigoPostal;
                                                                var dirDestino = shipaddress;
                                                                var pesoDeclarado = pesoTotal;
                                                                var volumenDeclarado = volumenTotal;
                                                                var meEnvioDomicilio = custpage_meenvdom;
                                                                var meEnvioUrgDomicilio = custpage_meenvurgdom;
                                                                var meEnvioSuc = custpage_meenvsuc;
                                                                
                                                                var finalURL = suitevarURL + '&contEnvioDomB2C=' + contEnvioDomB2C + '&contEnvioUrgDomB2C='+contEnvioUrgDomB2C + '&contEnvioSucB2C='+contEnvioSucB2C + '&codClienteAndreaniB2C='+codClienteAndreaniB2C + '&codPostalDestino='+codPostalDestino + '&dirDestino='+dirDestino + '&pesoDeclarado='+pesoDeclarado+ '&meEnvioDomicilio='+meEnvioDomicilio+ '&meEnvioUrgDomicilio='+meEnvioUrgDomicilio+ '&meEnvioSuc='+meEnvioSuc+ '&volumenDeclarado='+volumenDeclarado;

                                                                window.open(finalURL, "Andreani Cotizar Envio", params);
                                                            }
                                                            else
                                                            {
                                                                var message = {
                                                                    title: title,
                                                                    message: "Error obteniendo URL del Suitevar"
                                                                };
                                                                
                                                                dialog.alert(message);
                                                            }
                                                        }
                                                        catch(e)
                                                        {
                                                            var message = {
                                                                title: title,
                                                                message: "Excepción general en el proceso - Detalles: "+ JSON.stringify(e)
                                                            };
                                                            
                                                            dialog.alert(message);
                                                        }
                                                    }
                                                    else
                                                    {
                                                        var message = {
                                                            title: title,
                                                            message: "La suma del volumen de los articulos debe ser mayor a 0.00 centimetros cubicos"
                                                        };
                                                        
                                                        dialog.alert(message);
                                                    }
                                                }
                                                else
                                                {
                                                    var message = {
                                                        title: title,
                                                        message: "La suma del peso de los articulos debe ser mayor a 0.00 kilogramos"
                                                    };
                                                    
                                                    dialog.alert(message);
                                                }
                                            }
                                            else
                                            {
                                                var message = {
                                                    title: title,
                                                    message: "La transacción debe tener articulos cargados"
                                                };
                                                
                                                dialog.alert(message);
                                            }
                                        }
                                        else
                                        {
                                            var message = {
                                                title: title,
                                                message: "La dirección de envio debe tener contener un codigo postal"
                                            };
                                            dialog.alert(message);
                                        }
                                    }
                                    else
                                    {
                                        var message = {
                                            title: title,
                                            message: "La transacción debe tener una direccion de envio"
                                        };
                                        dialog.alert(message);
                                    }
                                }
                                else
                                {
                                    var message = {
                                        title: title,
                                        message: "No se puede iniciar cotizador ya que el Codigo de Cliente B2C Andreani no se encuentra configurado"
                                    };
                                    dialog.alert(message);
                                }
                            }
                            else
                            {
                                var message = {
                                    title: title,
                                    message: "No se puede iniciar cotizador ya que el Número de Contrato Envio Domicilio B2C Andreani no se encuentra configurado"
                                };
                                dialog.alert(message);
                            }
                        }
                        else
                        {
                            var message = {
                                title: title,
                                message: "No se puede iniciar cotizador ya que el Número de Contrato Envio Urgente a Domicilio B2C Andreani no se encuentra configurado"
                            };
                            dialog.alert(message);   
                        }
                    }
                    else
                    {
                        var message = {
                            title: title,
                            message: "No se puede iniciar cotizador ya que el Número de Contrato Envio Sucursal B2C Andreani no se encuentra configurado"
                        };
                        dialog.alert(message);   
                    }
                }
                else
                {
                    var message = {
                        title: title,
                        message: "No se puede iniciar cotizador ya que no existe configuración para la subsidiaria de la transaccion con ID: " + subsidiaria
                    };
                    dialog.alert(message);  
                }
            }
            else
            {
                var message = {
                    title: title,
                    message: "No se puede iniciar el cotizador porque debe estar seleccionado un cliente y subsidiaria correspondiente"
                };
                dialog.alert(message);
            }
        }
        else
        {
            var message = {
                title: title,
                message: "No se puede iniciar cotizador ya que el cliente seleccionado en la transacción no coincide con la categoría de cliente configurada ID: "+catClienteParams
            };
            dialog.alert(message);  
        }
    }

    function finalizarPopUp()
    {
        var title = "Mensaje";
        var envioId = nlapiGetFieldValue('custpage_radio');
        //var custpage_resumen_json = nlapiGetFieldValue('custpage_resumen_json');
        var subtotal = parseFloat(window.opener.nlapiGetFieldValue('subtotal'),10);
        var exchangeRate = parseFloat(window.opener.nlapiGetFieldValue('exchangerate'),10);
        var shippingCostAux =  0.00;
        var shippingCostStr = '';
        var idContrato = null;

        if (!isEmpty(envioId))
        {
            if (envioId == 1)
            {
                idContrato = nlapiGetFieldValue('custpage_cont_domicilio');
                idShippingMethod = nlapiGetFieldValue('custpage_me_env_dom');
                shippingCostStr = nlapiGetFieldValue('custpage_tarifa_dom');
            }
            else
            {
                if (envioId == 2)
                {
                    idContrato = nlapiGetFieldValue('custpage_cont_domicilio_urgente');
                    idShippingMethod = nlapiGetFieldValue('custpage_me_env_urg_dom');
                    shippingCostStr = nlapiGetFieldValue('custpage_tarifa_dom_urg');
                }
                else//envioId == 2
                {
                    idContrato = nlapiGetFieldValue('custpage_cont_env_suc');
                    idShippingMethod = nlapiGetFieldValue('custpage_me_env_suc');
                    shippingCostStr = nlapiGetFieldValue('custpage_tarifa_suc');
                }
            }

            if (!isEmpty(shippingCostStr))
                shippingCostAux = parseFloat(shippingCostStr.replace('AR$ ',''),10);

            if (shippingCostAux > 0.00)
            {
                var message = {
                    title: title,
                    message: "Costo de envio a indicar en la Orden de Venta: "+shippingCostStr
                };
    
                dialog.alert(message);

                if (envioId == 3)
                {
                    var calle = nlapiGetFieldValue('custpage_sucandreani_calle');
                    var calleNro = nlapiGetFieldValue('custpage_sucandreani_calle_nro');
                    var addr1 = calle + ' ' + calleNro;
                    var city = nlapiGetFieldValue('custpage_sucandreani_loc');
                    var state = nlapiGetFieldValue('custpage_sucandreani_reg');
                    var zip = nlapiGetFieldValue('custpage_cod_post_suc');
                    var sucId = nlapiGetFieldValue('custpage_suc_id');
                    //window.opener.nlapiSetFieldValue('shipaddresslist','-2');
                    window.opener.nlapiSetFieldValue('shipaddress', '');
                    window.opener.nlapiSetFieldValue('shipoverride', 'F');
                    window.opener.nlapiSetFieldValue('shipaddr1', addr1);
                    window.opener.nlapiSetFieldValue('shipcity', city);
                    window.opener.nlapiSetFieldValue('shipstate', state);
                    window.opener.nlapiSetFieldValue('shipzip', zip);
                    window.opener.nlapiSetFieldValue('custbody_ptly_suc_id_andreani', sucId);
                    window.opener.nlapiSetFieldValue('shipoverride', 'T');
                    window.opener.nlapiSetFieldValue('shipoverride', 'F');

                    alert('LINEA 776');
                }
                else
                {
                    window.opener.nlapiSetFieldValue('custbody_ptly_suc_id_andreani', '');
                }
                
                var shippingCost = parseFloat(shippingCostAux,10) / parseFloat(exchangeRate,10);
                window.opener.nlapiSetFieldValue('shipmethod', idShippingMethod);
                window.opener.nlapiSetFieldValue('shippingcost', shippingCost);
                window.opener.nlapiSetFieldValue('custbody_ptly_valor_declarado_andreani',subtotal);
                window.opener.nlapiSetFieldValue('custbody_ptly_contrato_andreani',idContrato);

                var custpage_empresaTransporte = window.opener.nlapiGetFieldValue('custpage_empresaTransporte');
                window.opener.nlapiSetFieldValue('custbody_3k_empresa_transporte',custpage_empresaTransporte);
                window.close();
            }
            else
            {
                var message = {
                    title: title,
                    message: "Para finalizar el costo del servicio de envio selecciondo debe ser mayor a cero"
                };
    
                dialog.alert(message);
            }
        }
        else
        {
            var message = {
                title: title,
                message: "Para finalizar debe seleccionar al menos una opción de envio cotizada"
            };

            dialog.alert(message);
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

    
    function validarCategoryCustomer(entity, categoryParam)
    {
        var strSQL = "SELECT \n Customer.\"CATEGORY\" AS categoryRAW /*{category#RAW}*/\nFROM \n Customer\nWHERE \n Customer.\"ID\" = "+ entity +"\n";

        var objPagedData = query.runSuiteQLPaged({
            query: strSQL,
            pageSize: 1
        });

        // Paging 
        var arrResults = [];
        var validEntity = false
        
        objPagedData.pageRanges.forEach(function(pageRange) {
            //fetch
            var objPage = objPagedData.fetch({ index: pageRange.index }).data;
            // Map results to columns 
            arrResults.push.apply(arrResults, objPage.asMappedResults());
        });

        if (!isEmpty(arrResults) && arrResults.length > 0)
        {
            var customerCategory = arrResults[0].categoriaCliente;

            if (!isEmpty(categoryParam) && categoryParam == customerCategory)
            {
                validEntity = true;
            }
            else
            {
                validEntity = !validEntity;
            }
        }
        return validEntity;
    }


    function generarToken()
    {
		var XAuthorizationToken = "";
        var proceso = "generarToken";
		var headers = {'Authorization': 'Basic Y2V2ZW5fd3M6U0NKS0w0MjEyMGR3'};
		var response = https.get({
			url: 'https://api.qa.andreani.com/login',
			headers: headers
		});

		log.debug({
			title: 'LINE 853',
			details: JSON.stringify(response)
		})

		if (!isEmpty(response))
		{
			if (response.code == 200)
			{
				XAuthorizationToken = response.headers["X-Authorization-token"];
				
			}
			else
			{
				log.error({
					title: proceso,
					details: "generarToken - Error al generar token, codigo de error: "+response.code+" - response: "+JSON.stringify(response)+""
				});
			}
		}
		else
		{
			log.error({
				title: proceso,
				details: "generarToken - Response vacio"
			});

			return XAuthorizationToken;
		}

		return XAuthorizationToken;
    }
    

    function cotizarEnvio (url, token)
    {
		if (!isEmpty(url))
		{
			if (!isEmpty(token))
			{
				log.debug({
					title: 'LINE 893',
					details: "url: "+url+" - token: "+token+""
				});

				var responseObj = {};
				var headers = {"x-authorization-token": "Basic "+token+""};
				var response = https.get({
					url: url,
					headers: headers
				});

				if (!isEmpty(response))
				{
					if (response.code == 200)
					{
						responseObj = response;
					}
					else
					{
						log.error({
							title: 'LINE 913',
							details: "cotizarEnvio - Error al invocar servicio, codigo de error: "+response.code+""
						});
					}
				}
				else
				{
					log.error({
						title: 'LINE 921',
						details: "cotizarEnvio - Response vacio"
					});

					return responseObj;
				}

				return responseObj;
			}
			else
			{
				log.error({
					title: 'LINE 933',
					details: "cotizarEnvio - No se recibio el parametro: Token"
				});
			}
		}
		else
		{
			log.error({
				title: 'LINE 941',
				details: "cotizarEnvio - No se recibio el parametro: URL"
			});
		}
    }
    

    function getConfig(subsidiaria)
    {
        var arrResults = [];

        var strSQL = "SELECT custrecord_ptly_cot_andreani_cod_cli AS codigoCliente, custrecord_ptly_cot_andreani_con_env_dom AS contratoEnviDom, " +
        "custrecord_ptly_cot_andreani_con_env_urg AS contratoEnvioUrgDom, custrecord_ptly_cot_andreani_env_suc AS contratoEnvioSuc, " +
        "custrecord_ptly_cot_andreani_me_env_dom AS meEnvDom, custrecord_ptly_cot_andreani_me_env_urg AS meEnvUrgDom, " +
        "custrecord_ptly_cot_andreani_me_env_suc AS meEnvSuc FROM customrecord_ptly_cot_andreani " +
        "WHERE custrecord_ptly_cot_andreani_sub = "+ subsidiaria +"\n";

        var objPagedData = query.runSuiteQLPaged({
            query: strSQL,
            pageSize: 1
        });
        
        objPagedData.pageRanges.forEach(function(pageRange) {
            //fetch
            var objPage = objPagedData.fetch({ index: pageRange.index }).data;
            // Map results to columns 
            arrResults.push.apply(arrResults, objPage.asMappedResults());
        });

        return arrResults;
    }

      
    return {
        fieldChanged: fieldChanged,
        callPopUp: callPopUp,
        finalizarPopUp: finalizarPopUp
    };
    
});