/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', 'N/ui/dialog', 'N/query'],

function(currentRecord, url, dialog, query) {
    
    function pageInit(context) {
        
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

        if (!isEmpty(empresaTransporteSO))
        {
            if (empresaTransporteSO == empresaTransporteParams)
            {

                var subsidiaria = record.getValue({
                    fieldId: 'subsidiary'
                });

                if (!isEmpty(subsidiaria))
                {
                    var codigoPostal = record.getValue({
                        fieldId: 'shipzip'
                    });

                    var shipaddress =  record.getValue({
                        fieldId: 'shipaddress'
                    });

                    var strSQL = "SELECT custrecord_ptly_cot_andreani_cod_cli AS codigoCliente, custrecord_ptly_cot_andreani_con_env_dom AS contratoEnviDom, " +
                    "custrecord_ptly_cot_andreani_con_env_urg AS contratoEnvioUrgDom, custrecord_ptly_cot_andreani_env_suc AS contratoEnvioSuc, " +
                    "custrecord_ptly_cot_andreani_emp_transp AS empresaTransporte, custrecord_ptly_cot_andreani_me_env_dom AS meEnvDom, custrecord_ptly_cot_andreani_me_env_urg AS meEnvUrgDom, " +
                    "custrecord_ptly_cot_andreani_me_env_suc AS meEnvSuc FROM customrecord_ptly_cot_andreani " +
                    "WHERE custrecord_ptly_cot_andreani_sub = "+ subsidiaria +"\n";

                    var objPagedData = query.runSuiteQLPaged({
                        query: strSQL,
                        pageSize: 1
                    });

                    // Paging 
                    var arrResults = [];
                    
                    objPagedData.pageRanges.forEach(function(pageRange) {
                        //fetch
                        var objPage = objPagedData.fetch({ index: pageRange.index }).data;
                        // Map results to columns 
                        arrResults.push.apply(arrResults, objPage.asMappedResults());
                    });

                    //alert('arrResults: '+JSON.stringify(arrResults)+' - arrResults.length: '+arrResults.length);

                    if (!isEmpty(arrResults) && arrResults.length > 0)
                    {
                        var custpage_cont_domicilio = arrResults[0].contratoenvidom;
                        var custpage_cont_domicilio_urgente = arrResults[0].contratoenviourgdom;
                        var custpage_cont_env_suc = arrResults[0].contratoenviosuc;
                        var custpage_codcliente = arrResults[0].codigocliente;
                        var custpage_codcliente = arrResults[0].empresatransporte;
                        var custpage_meenvdom = arrResults[0].meenvdom;
                        var custpage_meenvurgdom = arrResults[0].meenvurgdom;
                        var custpage_meenvsuc = arrResults[0].meenvsuc;
                        var pesoTotal = 0.00;

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

                                                        var cantidad = record.getCurrentSublistValue({
                                                            sublistId: sublist,
                                                            fieldId: 'quantity'
                                                        });

                                                        if (!isEmpty(peso) && !isEmpty(cantidad))
                                                        {
                                                            pesoTotal = parseFloat(pesoTotal,10) + (parseFloat(parseFloat(peso,10) * parseFloat(cantidad,10),10));
                                                        }
                                                    }

                                                    if (!isEmpty(pesoTotal) && pesoTotal > 0.00)
                                                    {
                                                        var leftPosition, topPosition;
                                                        leftPosition = (window.screen.width / 2) - ((600 / 2) + 10);
                                                        topPosition = (window.screen.height / 2) - ((600 / 2) + 50);

                                                        //Define the window
                                                        var params = 'height=' + 350 + ' , width=' + 800;
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
                                                            var suiteletURL = url.resolveScript({
                                                                scriptId: 'customscript_ptly_cotizador_andreani_sl',
                                                                deploymentId: 'customdeploy_ptly_cotizador_andreani_sl',
                                                                returnExternalUrl: false
                                                            });

                                                            //alert('suiteletURL: '+suiteletURL);

                                                            if (!isEmpty(suiteletURL))
                                                            {
                                                                var contEnvioDomB2C = custpage_cont_domicilio;
                                                                var contEnvioUrgDomB2C = custpage_cont_domicilio_urgente;
                                                                var contEnvioSucB2C = custpage_cont_env_suc;
                                                                var codClienteAndreaniB2C = custpage_codcliente;
                                                                var codPostalDestino = codigoPostal;
                                                                var dirDestino = shipaddress;
                                                                var pesoDeclarado = pesoTotal;
                                                                var meEnvioDomicilio = custpage_meenvdom;
                                                                var meEnvioUrgDomicilio = custpage_meenvurgdom;
                                                                var meEnvioSuc = custpage_meenvsuc;
                                                                
                                                                var finalURL = suiteletURL + '&contEnvioDomB2C=' + contEnvioDomB2C + '&contEnvioUrgDomB2C='+contEnvioUrgDomB2C + '&contEnvioSucB2C='+contEnvioSucB2C + '&codClienteAndreaniB2C='+codClienteAndreaniB2C + '&codPostalDestino='+codPostalDestino + '&dirDestino='+dirDestino + '&pesoDeclarado='+pesoDeclarado+ '&meEnvioDomicilio='+meEnvioDomicilio+ '&meEnvioUrgDomicilio='+meEnvioUrgDomicilio+ '&meEnvioSuc='+meEnvioSuc;
                                                                //alert('finalURL: '+finalURL);
                                                                window.open(finalURL, "Andreani Cotizar Envio", params);
                                                            }
                                                            else
                                                            {
                                                                var message = {
                                                                    title: title,
                                                                    message: "Error obteniendo URL del Suitelet"
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
                    message: "No se puede iniciar cotizador ya que la Empresa Transporte seleccionada en la transacción no coincide con la Empresa Transporte configurada ID: " + empresaTransporteParams
                };
                dialog.alert(message);
            }
        }
        else
        {
            var message = {
                title: title,
                message: "No se puede iniciar cotizador ya que no existe seleccionada una Empresa Transporte en la transacción"
            };
            dialog.alert(message);  
        }
    }

    function finalizarPopUp()
    {
        var title = "Mensaje";
        var envioId = nlapiGetFieldValue('custpage_radio');
        var custpage_resumen_json = nlapiGetFieldValue('custpage_resumen_json');
        var subtotal = parseFloat(window.opener.nlapiGetFieldValue('subtotal'),10);

        //alert('subtotal: '+subtotal);

        if (!isEmpty(envioId))
        {
            var arrayResumen = JSON.parse(custpage_resumen_json);

			if (!isEmpty(arrayResumen) && arrayResumen.length > 0)
			{
                for (var i = 0; i < arrayResumen.length; i++) {

                    if (arrayResumen[i].tipoEnvio == envioId)
                    {
                        //alert('Coincidencia encontrada');
                        var idShippingMethod =  arrayResumen[i].meEnvio;
                        var shippingCost =  arrayResumen[i].body.tarifaSinIva.total;

                        window.opener.nlapiSetFieldValue('shipmethod', idShippingMethod);
                        window.opener.nlapiSetFieldValue('shippingcost', shippingCost);
                        window.opener.nlapiSetFieldValue('custbody_ptly_valor_declarado_andreani',subtotal);
                        window.close();
                    }
                }
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

      
    return {
        pageInit: pageInit,
        callPopUp: callPopUp,
        finalizarPopUp: finalizarPopUp
    };
    
});