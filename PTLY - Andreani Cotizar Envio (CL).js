/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', 'N/ui/dialog'],

function(currentRecord, url, dialog) {
    
    function pageInit(context) {
        
    }
	
	function callPopUp() {

        var proceso = 'Andreani Cotizar Envio - Client';
        var title = 'Mensaje';

        var record = currentRecord.get();
        var codigoPostal = record.getValue({
            fieldId: 'custbody_ptly_codigo_postal_ship'
        });
        var shipaddress =  record.getValue({
            fieldId: 'shipaddress'
        });

        var custpage_cont_domicilio = record.getValue({
            fieldId: 'custpage_cont_domicilio'
        });

        var custpage_cont_domicilio_urgente = record.getValue({
            fieldId: 'custpage_cont_domicilio_urgente'
        });

        var custpage_cont_ret_suc = record.getValue({
            fieldId: 'custpage_cont_ret_suc'
        });

        var custpage_codcliente = record.getValue({
            fieldId: 'custpage_codcliente'
        });

        //alert('custpage_cont_domicilio: '+custpage_cont_domicilio + 'custpage_cont_domicilio_urgente: '+custpage_cont_domicilio_urgente + 'custpage_cont_ret_suc: '+custpage_cont_ret_suc + 'custpage_codcliente: '+custpage_codcliente);

        if (!isEmpty(custpage_cont_ret_suc))
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
                                    var leftPosition, topPosition;
                                    leftPosition = (window.screen.width / 2) - ((600 / 2) + 10);
                                    topPosition = (window.screen.height / 2) - ((600 / 2) + 50);

                                    //Define the window
                                    var params = 'height=' + 600 + ' , width=' + 600;
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

                                        alert('suiteletURL: '+suiteletURL);

                                        if (!isEmpty(suiteletURL))
                                        {
                                            var contEnvioDomB2C = custpage_cont_domicilio;
                                            var contEnvioUrgDomB2C = custpage_cont_domicilio_urgente;
                                            var contEnvioSucB2C = custpage_cont_ret_suc;
                                            var codClienteAndreaniB2C = custpage_codcliente;
                                            var codPostalDestino = codigoPostal;
                                            var dirDestino = shipaddress;
                                            var finalURL = suiteletURL + '&contEnvioDomB2C=' + contEnvioDomB2C + '&contEnvioUrgDomB2C='+contEnvioUrgDomB2C + '&contEnvioSucB2C='+contEnvioSucB2C + '&codClienteAndreaniB2C='+codClienteAndreaniB2C + '&codPostalDestino='+codPostalDestino + '&dirDestino='+dirDestino;
                                            alert('finalURL: '+finalURL);
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
        callPopUp: callPopUp
    };
    
});